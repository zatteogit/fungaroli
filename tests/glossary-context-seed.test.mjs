import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {readFileSync} from 'node:fs';
import {glossaryContextSeedUpdate} from '../worker/seed-update.js';
const db={prepare:sql=>({bind:(...params)=>({sql,params})})},payload=JSON.stringify({version:3,terms:[]});
const run=(version,actor,dataVersion,draftEdited=false)=>JSON.parse(execFileSync('python3',['-c',`
import json,sqlite3,sys
x=json.load(sys.stdin);db=sqlite3.connect(':memory:');db.executescript(x['schema'])
old=json.dumps({'version':x['dataVersion'],'terms':[]});draft=old+' ' if x['draftEdited'] else old
with db:
 db.execute('INSERT INTO cms_documents(id,version,published_version,draft,published,updated_at,updated_by) VALUES(?,?,?,?,?,?,?)',('glossary',x['version'],x['version'],draft,old,0,x['actor']))
 db.execute('INSERT INTO cms_revisions VALUES(?,?,?,?,?)',('glossary',x['version'],old,0,x['actor']))
 for s in x['statements']:db.execute(s['sql'],s['params'])
print(json.dumps({'row':db.execute('SELECT version,published_version,draft,published,updated_by FROM cms_documents').fetchone(),'revisions':db.execute('SELECT COUNT(*) FROM cms_revisions').fetchone()[0],'releases':db.execute('SELECT COUNT(*) FROM cms_releases').fetchone()[0],'audit':db.execute('SELECT COUNT(*) FROM cms_audit').fetchone()[0]}))
`],{input:JSON.stringify({schema:readFileSync(new URL('../migrations/0002_cms.sql',import.meta.url),'utf8'),version,actor,dataVersion,draftEdited,statements:[...glossaryContextSeedUpdate(db,payload,10,'first','release-first'),...glossaryContextSeedUpdate(db,payload,11,'second','release-second')]}),encoding:'utf8'}));
test('contextual vocabulary upgrades pristine v1/v2 seeds once, preserving the prior revision',()=>{
 for(const [v,actor,dataVersion] of [[0,'seed',1],[0,'seed',2],[1,'release:glossary-illustrations-v2',2]]){const r=run(v,actor,dataVersion);assert.deepEqual(r.row,[v+1,v+1,payload,payload,'release:glossary-contexts-v3']);assert.equal(r.revisions,2);assert.equal(r.releases,1);assert.equal(r.audit,1);}
});
test('contextual vocabulary cannot replace an authored, diverged or already upgraded glossary',()=>{
 for(const args of [[1,'author',2],[1,'release:glossary-illustrations-v2',2,true],[2,'release:glossary-contexts-v3',3]]){const r=run(...args);assert.equal(r.row[0],args[0]);assert.equal(r.row[4],args[1]);assert.equal(r.revisions,1);assert.equal(r.releases,0);assert.equal(r.audit,0);}
});
