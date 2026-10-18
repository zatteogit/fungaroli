import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && (url.endsWith('.sql') || url.endsWith('.json') && !context.importAttributes?.type)) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return {format: 'module', shortCircuit: true, source: 'export default ' + (url.endsWith('.sql') ? JSON.stringify(text) : text) + ';'};
  }
  return next(url, context);
}`));
function d1(sql) {
  const stmt = (q, params = []) => {
    const exec = () => {
      const s = sql.prepare(q);
      if (/^\s*SELECT\b/i.test(q) || /\bRETURNING\b/i.test(q)) return { results: s.all(...params), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(s.run(...params).changes) } };
    };
    return { exec, bind: (...p) => stmt(q, p), all: async () => exec(), run: async () => exec(),
      first: async (col) => { const r = exec().results[0] ?? null; return col && r ? r[col] : r; } };
  };
  return { prepare: (q) => stmt(q), batch: async (list) => {
    sql.exec('BEGIN');
    try { const out = list.map((s) => s.exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; }
  } };
}


const {handleCommunity}=await import('../worker/community.js');
const ORIGIN='https://fronda.test',NOW=Date.parse('2026-10-18T10:00:00Z');
function setup(){const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const file of ['0001_community.sql','0003_account_preferences.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));sql.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').run('member','Nome',NOW);sql.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(createHash('sha256').update('session').digest('hex'),'member',NOW+864e5);return{sql,env:{COMMUNITY_DB:d1(sql),APP_ORIGIN:ORIGIN}};}
const valid=()=>({accountId:'member',version:'42026-10-16',noticeHash:'a'.repeat(64),acceptedAt:new Date(NOW-1000).toISOString(),source:'explicit',platform:'browser'});
const send=(env,data,{cookie=true,origin=ORIGIN,now=NOW}={})=>handleCommunity(new Request(ORIGIN+'/api/community/legal-acceptance',{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie:'__Host-fungaroli_session=session'}:{})},body:JSON.stringify(data)}),env,now);
test('ricevuta sul profilo: idempotente, data del client distinta dalla ricezione del server',async()=>{
 const {sql,env}=setup(),data=valid();let response=await send(env,data);assert.equal(response.status,200);const first=(await response.json()).receipt;assert.equal(first.acceptedAt,data.acceptedAt);assert.equal(first.recordedAt,NOW);
 response=await send(env,{...data,acceptedAt:new Date(NOW).toISOString()},{now:NOW+1000});assert.deepEqual((await response.json()).receipt,first);assert.equal(sql.prepare('SELECT count(*) AS n FROM legal_acceptances').get().n,1);
 sql.prepare('DELETE FROM accounts WHERE id=?').run('member');assert.equal(sql.prepare('SELECT count(*) AS n FROM legal_acceptances').get().n,0);sql.close();
});
test('conferme storiche senza data: non viene inventato un momento di accettazione',async()=>{
 const {sql,env}=setup();const response=await send(env,{...valid(),source:'legacy',acceptedAt:null,platform:'standalone'});assert.equal(response.status,200);const {receipt}=await response.json();assert.equal(receipt.acceptedAt,null);assert.equal(receipt.source,'legacy');assert.equal(receipt.platform,'standalone');sql.close();
});
test('ricevute protette da sessione, origine, profilo e formato',async()=>{
 const {sql,env}=setup();assert.equal((await send(env,valid(),{cookie:false})).status,401);assert.equal((await send(env,valid(),{origin:'https://other.test'})).status,403);assert.equal((await send(env,{...valid(),accountId:'other'})).status,409);
 for(const change of [{noticeHash:'bad'},{acceptedAt:'invalid'},{acceptedAt:'2026-10-18'},{acceptedAt:valid().acceptedAt+' '.repeat(100)},{source:'implicit'},{platform:'unknown'},{source:'legacy',acceptedAt:valid().acceptedAt}])assert.equal((await send(env,{...valid(),...change})).status,422);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM legal_acceptances').get().n,0);sql.close();
});
