import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {repositorySeedUpdate} from '../worker/seed-update.js';
const db={prepare:sql=>({bind:(...params)=>({sql,params})})},seed='{"plants":{"old":{}}}',next='{"plants":{"new":{}}}';
const statements=[...repositorySeedUpdate(db,'plants',{version:0,published:seed},next,10,'first','release-first'),...repositorySeedUpdate(db,'plants',{version:0,published:seed},next,11,'second','release-second')];
function run({actor='seed',version=0,publishedVersion=0,draft=seed,published=seed,sql=statements}={}){return JSON.parse(execFileSync('python3',['-c',`
import json,sqlite3,sys
x=json.load(sys.stdin);db=sqlite3.connect(':memory:');db.executescript(x['schema'])
db.execute('INSERT INTO cms_documents(id,version,published_version,draft,published,updated_at,updated_by) VALUES(?,?,?,?,?,?,?)',('plants',x['version'],x['publishedVersion'],x['draft'],x['published'],0,x['actor']))
db.execute('INSERT INTO cms_revisions VALUES(?,?,?,?,?)',('plants',x['version'],x['draft'],0,x['actor']));db.commit()
with db:
 for s in x['sql']:db.execute(s['sql'],s['params'])
print(json.dumps({'row':db.execute('SELECT version,published_version,draft,published,updated_by FROM cms_documents').fetchone(),'revisions':db.execute('SELECT version FROM cms_revisions ORDER BY version').fetchall(),'release':db.execute("SELECT value FROM cms_meta WHERE key='release'").fetchone()[0],'releases':db.execute('SELECT COUNT(*) FROM cms_releases').fetchone()[0]}))
`],{input:JSON.stringify({schema:readFileSync(new URL('../migrations/0002_cms.sql',import.meta.url),'utf8'),actor,version,publishedVersion,draft,published,sql}),encoding:'utf8'}));}
test('repository releases publish untouched source data once, preserving original revisions under competing initializers',()=>{const r=run();assert.deepEqual(r.row,[1,1,next,next,'release:repository-seed:discover-v1']);assert.deepEqual(r.revisions,[[0],[1]]);assert.equal(r.releases,1);assert.equal(r.release,'release-first');});
test('authors, unpublished drafts, and stale source readers cannot be overwritten by repository releases',()=>{
 for(const options of [{actor:'author'},{draft:'{"author":true}'},{version:1,publishedVersion:0},{version:1,publishedVersion:1,actor:'release:repository-seed:discover-v1',draft:next,published:next}]){const r=run(options);assert.equal(r.releases,0);assert.equal(r.row[2],options.draft||seed);}
});
test('a later repository release may advance a managed seed, while identical payloads do not create another revision',()=>{
 const previous={version:1,published:next},changed='{"plants":{"more":{}}}',sql=repositorySeedUpdate(db,'plants',previous,changed,20,'third','release-third');
 const options={actor:'release:repository-seed:discover-v1',version:1,publishedVersion:1,draft:next,published:next};
 assert.equal(run({...options,sql}).row[0],2);assert.equal(run({...options,sql:repositorySeedUpdate(db,'plants',previous,next,20,'third','release-third')}).releases,0);
});
test('a document last published by an earlier one-off release (e.g. the glossary contexts) is managed too; an author save is not',()=>{
 const previous={version:2,published:next},changed='{"plants":{"terms":{}}}',sql=repositorySeedUpdate(db,'plants',previous,changed,30,'fourth','release-fourth');
 const r=run({actor:'release:glossary-contexts-v3',version:2,publishedVersion:2,draft:next,published:next,sql});
 assert.deepEqual(r.row,[3,3,changed,changed,'release:repository-seed:discover-v1']);
 assert.equal(run({actor:'author',version:2,publishedVersion:2,draft:next,published:next,sql}).releases,0);
});
