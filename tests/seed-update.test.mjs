import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {glossarySeedUpdate} from '../worker/seed-update.js';
const db={prepare:sql=>({bind:(...params)=>({sql,params})})};
const seed=JSON.stringify({version:1,terms:[{id:'pliche',sources:['original']}]}),updated=JSON.stringify({version:2,terms:[{id:'pliche',sources:['reviewed']} ]});
const statements=[...glossarySeedUpdate(db,updated,10,'first','release-first'),...glossarySeedUpdate(db,updated,11,'second','release-second')];
const run=edited=>JSON.parse(execFileSync('python3',['-c',`
import json,sqlite3,sys
x=json.load(sys.stdin);db=sqlite3.connect(':memory:');db.executescript(x['schema'])
db.execute('INSERT INTO cms_documents(id,version,draft,published,updated_at,updated_by) VALUES(?,?,?,?,?,?)',('glossary',1 if x['edited'] else 0,x['seed'],x['seed'],0,'author' if x['edited'] else 'seed'))
db.execute('INSERT INTO cms_revisions VALUES(?,?,?,?,?)',('glossary',0,x['seed'],0,'seed'));db.commit()
with db:
 for s in x['statements']:db.execute(s['sql'],s['params'])
row=db.execute('SELECT version,published_version,draft,published,updated_by FROM cms_documents').fetchone()
print(json.dumps({'row':row,'revisions':db.execute('SELECT version,payload FROM cms_revisions ORDER BY version').fetchall(),'release':db.execute("SELECT value FROM cms_meta WHERE key='release'").fetchone()[0],'releases':db.execute('SELECT COUNT(*) FROM cms_releases').fetchone()[0],'audit':db.execute('SELECT COUNT(*) FROM cms_audit').fetchone()[0]}))
`],{input:JSON.stringify({schema:readFileSync(new URL('../migrations/0002_cms.sql',import.meta.url),'utf8'),seed,updated,edited,statements}),encoding:'utf8'}));
test('seed source review preserves the original revision and publishes exactly once under competing initializers',()=>{
  const result=run(false);assert.deepEqual(result.row,[1,1,updated,updated,'release:glossary-illustrations-v2']);
  assert.deepEqual(result.revisions,[[0,seed],[1,updated]]);assert.equal(result.release,'release-first');assert.equal(result.releases,1);assert.equal(result.audit,1);
});
test('an author’s saved glossary is never replaced by a seed update',()=>{
  const result=run(true);assert.deepEqual(result.row,[1,0,seed,seed,'author']);assert.deepEqual(result.revisions,[[0,seed]]);assert.equal(result.release,'0');assert.equal(result.releases,0);assert.equal(result.audit,0);
});
