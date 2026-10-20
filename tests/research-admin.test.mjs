import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
register('data:text/javascript,'+encodeURIComponent(`import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';export async function load(url,c,next){if(url.startsWith('file:')&&(url.endsWith('.sql')||url.endsWith('.json')&&!c.importAttributes?.type)){const s=readFileSync(fileURLToPath(url),'utf8');return{format:'module',shortCircuit:true,source:'export default '+(url.endsWith('.sql')?JSON.stringify(s):s)+';'};}return next(url,c);}`));
const {handleCms}=await import('../worker/cms.js');
const {handleCommunity}=await import('../worker/community.js');
const {initExternalObservations,externalDataset}=await import('../worker/external-observations.js');
const {externalUsability,externalEngineDataset,normalizeExternalObservation,canonicalSource}=await import('../js/external-observation.js');
const {externalFieldEvidence}=await import('../js/model.js');
const seed=JSON.parse(readFileSync(new URL('../worker/external-observations-seed.json',import.meta.url)));
const geminiSeed=JSON.parse(readFileSync(new URL('../worker/gemini-research-seed.json',import.meta.url)));
const sourceSeed=JSON.parse(readFileSync(new URL('../worker/external-sources-seed.json',import.meta.url)));
const reviewSeed=JSON.parse(readFileSync(new URL('../worker/research-review-seed.json',import.meta.url)));
const TOTAL=seed.records.length+geminiSeed.records.length+reviewSeed.records.length;
const NOW=Date.parse('2026-10-20T12:00:00Z'),ORIGIN='https://fungaroli.test';
function d1(sql){
 const stmt=(q,p=[])=>{const exec=()=>{const s=sql.prepare(q);return /^\s*SELECT\b/i.test(q)||/\bRETURNING\b/i.test(q)?{results:s.all(...p),meta:{changes:0}}:{results:[],meta:{changes:Number(s.run(...p).changes)}};};return{exec,bind:(...v)=>stmt(q,v),all:async()=>exec(),run:async()=>exec(),first:async k=>{const r=exec().results[0]??null;return k&&r?r[k]:r;}};};
 return{prepare:q=>stmt(q),batch:async ss=>{sql.exec('BEGIN');try{const r=ss.map(s=>s.exec());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
function setup(){
 const sql=new DatabaseSync(':memory:'),cms=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_community.sql',import.meta.url),'utf8'));
 for(const id of ['admin','editor','member']){sql.prepare('INSERT INTO accounts VALUES(?,?,?)').run(id,id,NOW-2*864e5);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(id).digest('hex'),id,NOW+864e5);}
 return {sql,env:{COMMUNITY_DB:d1(sql),CMS_DB:d1(cms),APP_ORIGIN:ORIGIN,CMS_ADMIN_IDS:'admin',CMS_EDITOR_IDS:'editor',ASSETS:{fetch:async req=>{try{return new Response(readFileSync(new URL('..'+new URL(req.url).pathname,import.meta.url),'utf8'));}catch{return new Response('',{status:404});}}}}};
}
const req=(env,path='',method='GET',body,actor='admin',origin=ORIGIN)=>handleCms(new Request(ORIGIN+'/api/cms/v1/survey-responses'+path,{method,headers:{...(actor?{cookie:'__Host-fungaroli_session='+actor}:{}),origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
const {SURVEY_ID,SURVEY_VERSION}=await import('../js/survey-schema.js');
const input={mode:'interview',collectedOn:'2026-10-19',reason:'Intervista locale di verifica',data:{survey:SURVEY_ID,version:SURVEY_VERSION,respondent:{name:null,contact:null},consent:{anonymousUse:true,recontact:false,diary:false},answers:{profile:{years:12}}}};
test('questionari: permessi, consenso, inserimento, revisione, conflitto, export e cancellazione',async()=>{
 const {env,sql}=setup();
 for(const actor of [null,'editor','member'])assert.equal((await req(env,'','GET',undefined,actor)).status,actor?403:401);
 assert.equal((await req(env,'','POST',input,'admin','https://foreign.test')).status,403);
 assert.equal((await req(env,'','POST',{...input,data:{...input.data,consent:{anonymousUse:false}}})).status,422);
 let r=await req(env,'','POST',input);assert.equal(r.status,201,await r.clone().text());let row=await r.json();assert.equal(row.answers.profile.years,12);assert.equal(row.history.length,1);
 r=await req(env,'/'+row.id,'PATCH',{...input,revision:0,data:{...input.data,answers:{profile:{years:13}}}});assert.equal(r.status,200,await r.clone().text());row=await r.json();assert.equal(row.revision,1);assert.equal(row.history.length,2);
 assert.equal((await req(env,'/'+row.id,'PATCH',{...input,revision:0})).status,412);
 const list=await(await req(env,'?mode=interview&includeAnswers=true')).json();assert.equal(list.total,1);assert.equal(list.items[0].answers.profile.years,13);
 assert.ok((await(await req(env,'/schema')).json()).answersSpec);
 assert.equal((await req(env,'/'+row.id,'DELETE')).status,200);assert.equal((await req(env,'/'+row.id)).status,404);assert.equal(sql.prepare('SELECT count(*) AS n FROM survey_response_history').get().n,0);
});
test('API agenti questionari: risorsa dedicata e scrittura esplicita',async()=>{
 const {env}=setup();
 const adminCall=(path,body)=>handleCms(new Request(ORIGIN+'/api/cms/v1/'+path,{method:'POST',headers:{cookie:'__Host-fungaroli_session=admin',origin:ORIGIN,'content-type':'application/json'},body:JSON.stringify(body)}),env,NOW);
 const token=async(scopes,resources)=>{const r=await adminCall('tokens',{name:'Fixture questionari',days:1,scopes,resources});assert.equal(r.status,201);return r.json();};
 const read=await token(['read'],['survey-responses']),write=await token(['read','write'],['survey-responses']),other=await token(['read','write'],['external-observations']);
 const call=(t,path='',method='GET',body)=>handleCms(new Request(ORIGIN+'/api/cms/v1/survey-responses'+path,{method,headers:{authorization:'Bearer '+t.token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
 assert.equal((await call(read,'/schema')).status,200);assert.equal((await call(other)).status,403);assert.equal((await call(read,'','POST',input)).status,403);
 const created=await call(write,'','POST',input);assert.equal(created.status,201,await created.clone().text());assert.equal((await created.json()).updatedBy,'agent:'+write.id);
});
test('ricerca verificata: raccolte, correzioni e filtri territoriali',async()=>{
 const {env}=setup();const {readExternalObservation,listExternalObservations}=await import('../worker/external-observations.js');
 const paper=await readExternalObservation(env.COMMUNITY_DB,'gemini-rec-09');assert.equal(paper.data.observedOn,'2019-10-12');assert.equal(paper.data.scientificName,'Hortiboletus rubellus');assert.equal(paper.history.length,2);
 assert.equal((await readExternalObservation(env.COMMUNITY_DB,'gemini-rec-19')).data.reviewStatus,'excluded');
 const r=await listExternalObservations(env.COMMUNITY_DB,new URLSearchParams({province:'Rieti',from:'2026-10-06',to:'2026-10-20'}));assert.ok(r.total);assert.ok(r.items.every(x=>x.data.province==='Rieti'&&x.data.observedOn>='2026-10-06'));
});
test('scadenza delle risposte: cancella anche lo storico senza conservare contatti nelle revisioni',async()=>{
 const {env,sql}=setup();await req(env,'','POST',input);assert.equal(sql.prepare('SELECT count(*) AS n FROM survey_response_history').get().n,1);
 const {cleanupSurvey}=await import('../worker/survey.js');await cleanupSurvey(env,Date.parse('2029-01-02T12:00:00Z'));
 assert.equal(sql.prepare('SELECT count(*) AS n FROM survey_responses').get().n,0);assert.equal(sql.prepare('SELECT count(*) AS n FROM survey_response_history').get().n,0);assert.equal(sql.prepare('SELECT count(*) AS n FROM survey_admin_meta').get().n,0);
});
