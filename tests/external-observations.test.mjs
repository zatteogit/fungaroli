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
const req=(env,path='',method='GET',body,actor='admin',origin=ORIGIN)=>handleCms(new Request(ORIGIN+'/api/cms/v1/external-observations'+path,{method,headers:{...(actor?{cookie:'__Host-fungaroli_session='+actor}:{}),origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
test('registro, export e scritture solo admin; origine verificata',async()=>{
 const {env}=setup();
 for(const path of ['', '/engine','/external-fb01']){
  assert.equal((await req(env,path,'GET',undefined,null)).status,401);
  for(const actor of ['editor','member'])assert.equal((await req(env,path,'GET',undefined,actor)).status,403);
 }
 assert.equal((await req(env,'','POST',{data:{}},'admin','https://foreign.test')).status,403);
 const response=await req(env);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const data=await response.json();assert.equal(data.total,seed.records.length);assert.equal(data.items.length,30);assert.ok(data.catalog.zones.length);
 assert.equal((await req(env,'?status=invalid')).status,422);
 assert.equal((await req(env,'?q=%25')).status,200);
});
test('importazione persistente e idempotente; correzione e storico atomico non sovrascritti',async()=>{
 const {env,sql}=setup();const receipt=await initExternalObservations(env.COMMUNITY_DB);assert.equal(receipt.records,seed.records.length);
 let row=await (await req(env,'/external-fb01')).json();
 const changed={...row.data,summary:'Sintesi corretta conservando la data sconosciuta'};
 let result=await req(env,'/external-fb01','PATCH',{version:0,data:changed,reason:'Verifica della fonte originale'});assert.equal(result.status,200);
 row=await result.json();assert.equal(row.version,1);assert.equal(row.history.length,2);assert.equal(row.data.summary,changed.summary);
 assert.equal((await req(env,'/external-fb01','PATCH',{version:0,data:changed,reason:'Scrittura obsoleta'})).status,412);
 assert.equal(sql.prepare("SELECT count(*) AS n FROM external_observation_history WHERE observation_id='external-fb01'").get().n,2);
 // Un nuovo binding simula un nuovo isolate; il seed non riscrive la modifica.
 await initExternalObservations(d1(sql));row=await(await req(env,'/external-fb01')).json();assert.equal(row.version,1);assert.equal(row.data.summary,changed.summary);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM external_observations').get().n,seed.records.length);
});
test('inizializzazione D1 dallo stato: solo ricevuta pubblica, senza fonti o record',async()=>{
 const {env,sql}=setup();const response=await handleCommunity(new Request(ORIGIN+'/api/community/status'),env,NOW);
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.externalImport.records,seed.records.length);
 assert.deepEqual(Object.keys(data.externalImport).sort(),['id','importedAt','records']);
 assert.equal(JSON.stringify(data).includes('facebook.com'),false);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM external_observations').get().n,seed.records.length);
});
test('fonti duplicate, giorni inventati e specie incoerenti respinti; creazione riletta',async()=>{
 const {env}=setup();await initExternalObservations(env.COMMUNITY_DB);
 const data=seed.records[0].data;
 assert.equal((await req(env,'','POST',{data:{...data,sourceUrl:data.sourceUrl+'?utm_source=test'},reason:'Reimportazione duplicata'})).status,409);
 for(const patch of [{sourceUrl:'javascript:alert(1)'},{observedOn:'2026-02-30',datePrecision:'day'},{observedOn:'2026-10-21',datePrecision:'day'},{observedOn:'2026-10-18',datePrecision:'relative'},{zoneId:'non-esiste',spatialScope:'zone'},{taxonId:'edulis',scientificName:'Fistulina hepatica'},{searched:false,outcome:'searched_absent'},{coordinate:'private'}]){
  const response=await req(env,'','POST',{data:{...data,sourceUrl:'https://example.org/new',...patch},reason:'Verifica dei campi obbligatori'});assert.equal(response.status,422,JSON.stringify(patch));
 }
 const response=await req(env,'','POST',{data:{...data,sourceUrl:'https://example.org/new'},reason:'Nuova testimonianza da revisionare'});assert.equal(response.status,201);
 const saved=await response.json();assert.equal((await req(env,'/'+saved.id)).status,200);assert.equal(saved.history.length,1);
 assert.equal(canonicalSource('https://example.org/x/?comment_id=1&utm_source=a'),'https://example.org/x?comment_id=1');
});
test('dataset del motore: data osservata, scala, qualità, sforzo e duplicati; nessuna assenza dal silenzio',async()=>{
 const {env}=setup(),dataset=await externalDataset(env.COMMUNITY_DB,NOW);
 assert.ok(dataset.occurrences.length>0);assert.ok(dataset.excluded.length>0);
 assert.equal(dataset.rankingEffect,'none');assert.equal(dataset.absenceFromMissingRecords,false);
 assert.ok(dataset.excluded.some(x=>x.id==='external-fb01'&&x.reasons.includes('Data dell’osservazione non risolta')));
 assert.ok(!JSON.stringify(dataset).includes('latitude'));assert.ok(!JSON.stringify(dataset).includes('account_id'));
 const positive={...seed.records.find(x=>x.id==='inat-406967333').data,observedOn:'2026-10-19',spatialScope:'zone',zoneId:'vallonina',taxonId:'fistulina-hepatica'};
 assert.equal(externalUsability(positive).zone,true);
 const negative={...positive,outcome:'searched_absent',searched:true,effortMinutes:null};assert.equal(externalUsability(negative).regional,false);
 negative.effortMinutes=30;assert.equal(externalUsability(negative).zone,true);
 const grouped=externalEngineDataset([{id:'a',data:positive},{id:'b',data:{...positive,sourceUrl:'https://example.org/repost'}}],{now:NOW});assert.equal(grouped.occurrences.length,1);assert.equal(grouped.excluded[0].id,'b');
 const evidence=externalFieldEvidence(grouped,'vallonina','fistulina-hepatica','2026-10-20',{now:NOW});assert.equal(evidence.presences,1);assert.equal(evidence.rankingEffect,'none');
 assert.equal(externalFieldEvidence(grouped,'cicolano','fistulina-hepatica','2026-10-20',{now:NOW}).coverage,'no_usable_observations');
 assert.equal(externalFieldEvidence(grouped,'vallonina','fistulina-hepatica','2026-10-18',{now:NOW}).presences,0);
 assert.throws(()=>normalizeExternalObservation({...positive,effortMinutes:0}));
});
