// API del questionario (worker/survey.js) su un D1 finto (node:sqlite): invio anonimo, campo trappola,
// controlli del corpo, limite giornaliero senza IP, esportazione e cancellazione per gli amministratori.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// worker/survey.js importa la migrazione .sql e, tramite community.js, JSON senza attributi (come Wrangler).
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
const {handleCms} = await import('../worker/cms.js');
const {rankingPolicy,saveRankingPolicy,adminDashboard} = await import('../worker/admin-dashboard.js');
const {communityMultiplier} = await import('../js/community-signal.js');
const {handleCommunity} = await import('../worker/community.js');

// D1 essenziale, come in tests/cms-content.test.mjs: prepare/bind/all/first/run e batch in transazione.
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

const NOW=Date.parse('2026-10-18T10:00:00Z'),ORIGIN='https://fungaroli.test';
function setup(){
 const sql=new DatabaseSync(':memory:'),cms=new DatabaseSync(':memory:');
 for(const f of ['0001_community.sql','0003_account_preferences.sql','0007_shared_observations.sql'])sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 for(const id of ['admin','editor','member']){
  sql.prepare('INSERT INTO accounts VALUES(?,?,?)').run(id,id,NOW-2*864e5);
  sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(id).digest('hex'),id,NOW+864e5);
 }
 const env={COMMUNITY_DB:d1(sql),CMS_DB:d1(cms),APP_ORIGIN:ORIGIN,CMS_ADMIN_IDS:'admin',CMS_EDITOR_IDS:'editor',ASSETS:{fetch:async req=>{try{return new Response(readFileSync(new URL('..'+new URL(req.url).pathname,import.meta.url),'utf8'));}catch{return new Response('',{status:404});}}}};
 return {sql,cms,env};
}
function request(env,{actor='admin',method='GET',input,origin=ORIGIN}={}){
 return handleCms(new Request(ORIGIN+'/api/cms/v1/dashboard',{method,headers:{...(actor?{cookie:'__Host-fungaroli_session='+actor}:{}),origin,'content-type':'application/json'},...(input?{body:JSON.stringify(input)}:{})}),env,NOW);
}
test('dashboard solo admin: sessione, ruolo e origine verificati anche nelle scritture',async()=>{
 const {env}=setup();
 assert.equal((await request(env,{actor:null})).status,401);
 for(const actor of ['member','editor']){
  assert.equal((await request(env,{actor})).status,403);
  assert.equal((await request(env,{actor,method:'PATCH',input:{maxPercent:0,version:0,reason:'Disattivazione'}})).status,403);
 }
 assert.equal((await request(env,{method:'PATCH',origin:'https://foreign.test',input:{maxPercent:0,version:0,reason:'Disattivazione'}})).status,403);
 const r=await request(env);assert.equal(r.status,200);const d=await r.json();assert.equal(d.policy.maxPercent,10);assert.equal(d.survey.count,0);assert.equal(d.totals.observations,0);
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('limite persistente, audit atomico, conflitti senza sovrascrittura e ritorno al precedente',async()=>{
 const {env,sql}=setup();
 const saved=await request(env,{method:'PATCH',input:{maxPercent:4,version:0,reason:'Riduzione prudente'}});assert.equal(saved.status,200);
 assert.equal((await saved.json()).maxPercent,4);
 const stale=await request(env,{method:'PATCH',input:{maxPercent:8,version:0,reason:'Richiesta obsoleta'}});assert.equal(stale.status,412);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM ranking_policy_history').get().n,1);
 await saveRankingPolicy(env.COMMUNITY_DB,{maxPercent:0,version:1,reason:'Sospensione temporanea'},'admin',NOW+1);
 await saveRankingPolicy(env.COMMUNITY_DB,{maxPercent:4,version:2,reason:'Ripristino precedente'},'admin',NOW+2);
 const d=await adminDashboard(env.COMMUNITY_DB,NOW);
 assert.deepEqual(d.history.map(r=>[r.previousPercent,r.maxPercent]),[[0,4],[4,0],[10,4]]);
 assert.equal(d.history[0].updatedBy,'admin');
 const summary=await (await handleCommunity(new Request(ORIGIN+'/api/community/summary'),env,NOW)).json();assert.equal(summary.policy.maxPercent,4);assert.deepEqual(Object.keys(summary.policy).sort(),['maxPercent','version']);
});
test('i parametri non accettano nuovi pesi scientifici o limiti fuori dal tetto esistente',async()=>{
 const {env}=setup();
 for(const input of [{maxPercent:11},{maxPercent:-1},{maxPercent:1.5},{maxPercent:'4'},{reason:'a'},{surveyWeight:20}]){
  const r=await request(env,{method:'PATCH',input:{maxPercent:4,version:0,reason:'Motivo valido',...input}});assert.equal(r.status,422);
 }
 assert.equal((await rankingPolicy(env.COMMUNITY_DB)).version,0);
 const record={establishedContributors:10,days:2,sightings:10,zeros:0};
 assert.equal(communityMultiplier([record],4),1.04);assert.equal(communityMultiplier([record],0),1);
 assert.equal(communityMultiplier([{...record,sightings:0,zeros:10}],4),.96);
 assert.equal(communityMultiplier([{...record,establishedContributors:2}],4),1);
});
test('dashboard aggregata: mai testo privato, note, account dei contributori o contatti',async()=>{
 const {env,sql}=setup();
 sql.prepare('INSERT INTO diary_entries(account_id,id,payload,saved_at) VALUES(?,?,?,?)').run('member','note-1234',JSON.stringify({text:'SEGRETO PRIVATO'}),NOW);
 sql.prepare('INSERT INTO reports(id,account_id,entry_id,day,zone_id,species_id,amount,searched,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run('report-1234','member','note-1234','2026-10-18','vallonina','edulis',1,1,NOW);
 sql.prepare('INSERT INTO shared_observations VALUES(?,?,?,?,?,?,?,?,?)').run('member','note-1234','2026-10-18','vallonina','botanica','ortica',JSON.stringify({text:'SEGRETO PRIVATO'}),'v1',NOW);
 const r=await request(env),d=await r.json();
 assert.equal(d.reports.length,1);assert.equal(d.reports[0].sightings,1);assert.match(d.reports[0].taxonName,/Porcino/);assert.match(d.reports[0].zoneName,/Vallonina/);
 assert.equal(d.observations[0].taxonName,'Ortica');assert.equal(d.observations[0].count,1);
 assert.ok(!JSON.stringify(d).includes('SEGRETO'));assert.ok(!JSON.stringify(d).includes('member'));assert.ok(!JSON.stringify(d).includes('payload'));
});
