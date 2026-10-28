import {setPilotChoices,getPilotChoices,clearPilotChoices} from '../js/pilot-choice-state.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {feedbackContext,validateFeedback} from '../js/feedback-schema.js';
register('data:text/javascript,'+encodeURIComponent(`import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';export async function load(url,context,next){if(url.startsWith('file:')&&(url.endsWith('.sql')||url.endsWith('.json')&&!context.importAttributes?.type)){const text=readFileSync(fileURLToPath(url),'utf8');return {format:'module',shortCircuit:true,source:'export default '+(url.endsWith('.sql')?JSON.stringify(text):text)+';'};}return next(url,context);}`));
const {handleFeedback,cleanupFeedback,listFeedback}=await import('../worker/feedback.js');
const {handleCms}=await import('../worker/cms.js');
const NOW=Date.parse('2026-10-27T10:00:00Z'),ORIGIN='https://fungaroli.test';
function d1(sql){
 const stmt=(q,p=[])=>{const exec=()=>{const s=sql.prepare(q);if(/^\s*SELECT\b|\bRETURNING\b/i.test(q))return {results:s.all(...p),meta:{changes:0}};return {results:[],meta:{changes:Number(s.run(...p).changes)}};};return {exec,bind:(...args)=>stmt(q,args),all:async()=>exec(),run:async()=>exec(),first:async key=>{const v=exec().results[0]??null;return key&&v?v[key]:v;}};};
 return {prepare:q=>stmt(q),batch:async statements=>{sql.exec('BEGIN');try{const out=statements.map(s=>s.exec());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
function setup(){
 const sql=new DatabaseSync(':memory:'),cms=new DatabaseSync(':memory:');
 for(const f of ['0001_community.sql','0003_account_preferences.sql','0007_shared_observations.sql'])sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 for(const id of ['admin','editor','member']){sql.prepare('INSERT INTO accounts VALUES(?,?,?)').run(id,id,NOW-2*864e5);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(id).digest('hex'),id,NOW+864e5);}
 return {sql,env:{COMMUNITY_DB:d1(sql),CMS_DB:d1(cms),APP_ORIGIN:ORIGIN,CMS_ADMIN_IDS:'admin',CMS_EDITOR_IDS:'editor',ASSETS:{fetch:async req=>{try{return new Response(readFileSync(new URL('..'+new URL(req.url).pathname,import.meta.url),'utf8'));}catch{return new Response('',{status:404});}}}}};
}
const body=()=>({id:crypto.randomUUID(),type:'problema',message:'Non riesco ad aprire il filtro della mappa.',context:{page:'Mappa',version:'fungaroli-shell-v356'}});
const request=(value,extra={})=>new Request(ORIGIN+'/api/feedback/v1/messages',{method:'POST',headers:{origin:ORIGIN,'content-type':'application/json','CF-Connecting-IP':'2001:db8:1234:5678::a',...extra},body:JSON.stringify(value)});
const admin=(env,path='',method='GET',actor='admin',origin=ORIGIN)=>handleCms(new Request(ORIGIN+'/api/cms/v1/feedback'+path,{method,headers:{origin,...(actor?{cookie:'__Host-fungaroli_session='+actor}:{})}}),env,NOW);
test('contesto: mai URL, identificativi privati, query, note o coordinate; corpo rigoroso',()=>{
 const context=feedbackContext('#/diario/pagina/private-entry?secret=123','fungaroli-shell-v356');assert.deepEqual(context,{page:'Taccuino',version:'fungaroli-shell-v356'});
 assert.equal(feedbackContext('#/zona/monte-tancia/1','other').version,'non disponibile');
 for(const value of [{...body(),gps:[42,12]},{...body(),message:'   '},{...body(),message:'a'.repeat(2001)},{...body(),id:[crypto.randomUUID()]},{...body(),context:{page:'Mappa',version:'fungaroli-shell-v356',url:'private'}},{...body(),context:{page:'Mappa',version:['fungaroli-shell-v356']}}])assert.throws(()=>validateFeedback(value));
 assert.equal(validateFeedback({...body(),context:null}).context,null);
});
test('invio ospite persistente, conferma dopo salvataggio e retry idempotente',async()=>{
 const {sql,env}=setup(),value=body();const result=await handleFeedback(request(value),env,NOW);assert.equal(result.status,201);assert.deepEqual(await result.json(),{ok:true,id:value.id});assert.equal(result.headers.get('cache-control'),'no-store');
 assert.equal((await handleFeedback(request(value),env,NOW)).status,201);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM app_feedback').get().n,1);
 assert.equal((await handleFeedback(request({...value,message:'Un altro messaggio.'}),env,NOW)).status,409);
 const columns=sql.prepare('PRAGMA table_info(app_feedback)').all().map(r=>r.name);assert.ok(!columns.some(c=>/account|ip|agent|email|gps/.test(c)));
});
test('origine, contenuto, metodi, limiti e indisponibilità; nessun falso successo',async()=>{
 const {env}=setup();assert.equal((await handleFeedback(request(body(),{origin:'https://foreign.test'}),env,NOW)).status,403);
 assert.equal((await handleFeedback(new Request(ORIGIN+'/api/feedback/v1/messages'),env,NOW)).status,405);
 assert.equal((await handleFeedback(request({...body(),message:'   '}),env,NOW)).status,422);
 assert.equal((await handleFeedback(request(body(),{'content-type':'text/plain'}),env,NOW)).status,415);
 assert.equal((await handleFeedback(request({...body(),message:'a'.repeat(14000)}),env,NOW)).status,413);
 assert.equal((await handleFeedback(request(body()),{APP_ORIGIN:ORIGIN},NOW)).status,503);
 for(let i=0;i<20;i++)assert.equal((await handleFeedback(request(body()),env,NOW)).status,201);
 assert.equal((await handleFeedback(request(body()),env,NOW)).status,429);
 assert.equal((await handleFeedback(request(body(),{'CF-Connecting-IP':'2001:db8:1234:5678::b'}),env,NOW)).status,429,'stessa rete IPv6');
 assert.equal((await env.COMMUNITY_DB.prepare("SELECT count FROM feedback_rate WHERE key LIKE 'total:%'").first()).count,20,'i tentativi oltre il limite della connessione non consumano il tetto comune');
 const rows=(await env.COMMUNITY_DB.prepare('SELECT key FROM feedback_rate').all()).results;assert.ok(rows.every(r=>!r.key.includes('2001:')));
});
test('lettura e cancellazione riservate agli amministratori, messaggi non pubblici',async()=>{
 const {env}=setup(),value=body();await handleFeedback(request(value),env,NOW);
 assert.equal((await admin(env,'','GET',null)).status,401);
 for(const actor of ['editor','member']){assert.equal((await admin(env,'','GET',actor)).status,403);assert.equal((await admin(env,'/'+value.id,'DELETE',actor)).status,403);}
 const result=await admin(env),items=(await result.json()).items;assert.equal(result.status,200);assert.equal(items[0].message,value.message);
 assert.equal((await admin(env,'/'+value.id,'PATCH','admin','https://foreign.test')).status,403);
 assert.equal((await admin(env,'/'+value.id,'PATCH')).status,200);assert.equal((await listFeedback(env.COMMUNITY_DB,{},NOW)).items[0].status,'read');
 assert.equal((await admin(env,'/'+value.id,'DELETE')).status,200);assert.equal((await listFeedback(env.COMMUNITY_DB,{},NOW)).items.length,0);
});
test('paginazione senza perdite su date uguali, conservazione e pulizia giornaliera',async()=>{
 const {env,sql}=setup();await handleFeedback(request(body()),env,NOW);
 const insert=sql.prepare('INSERT INTO app_feedback(id,type,message,submission_hash,created_at) VALUES(?,?,?,?,?)');
 for(let i=0;i<61;i++)insert.run(crypto.randomUUID(),'idea','Idea numero '+i,'hash',NOW);
 const first=await listFeedback(env.COMMUNITY_DB,{},NOW),second=await listFeedback(env.COMMUNITY_DB,{before:first.nextBefore},NOW);assert.equal(first.items.length,50);assert.equal(second.items.length,12);assert.equal(new Set([...first.items,...second.items].map(i=>i.id)).size,62);
 await cleanupFeedback(env,NOW+91*864e5);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM app_feedback').get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM feedback_rate').get().n,0);
});

test('scelte nel benvenuto: intenzioni separate dal consenso, copia isolata e rinvio',()=>{
 setPilotChoices();assert.equal(getPilotChoices(),null);setPilotChoices({research:true});const copy=getPilotChoices();copy.research=false;assert.equal(getPilotChoices().research,true);assert.equal(getPilotChoices().accountId,null);clearPilotChoices();assert.equal(getPilotChoices(),null);setPilotChoices({research:true},'profilo-a');assert.equal(getPilotChoices().accountId,'profilo-a');clearPilotChoices();
});

test('tetto comune: 200 invii reali, retry già salvato ammesso anche a limite raggiunto',async()=>{
 const {env,sql}=setup(),first=body();
 for(let i=0;i<=200;i++){const value=i===0?first:body();assert.equal((await handleFeedback(request(value,{'CF-Connecting-IP':'198.51.100.'+Math.floor(i/20)}),env,NOW)).status,i<200?201:429);}
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM app_feedback').get().n,200);
 assert.equal((await handleFeedback(request(first),env,NOW)).status,201);
});
