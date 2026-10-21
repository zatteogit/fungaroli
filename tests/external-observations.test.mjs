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
const req=(env,path='',method='GET',body,actor='admin',origin=ORIGIN)=>handleCms(new Request(ORIGIN+'/api/cms/v1/external-observations'+path,{method,headers:{...(actor?{cookie:'__Host-fungaroli_session='+actor}:{}),origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
test('registro, export e scritture solo admin; origine verificata',async()=>{
 const {env}=setup();
 for(const path of ['', '/engine','/external-fb01']){
  assert.equal((await req(env,path,'GET',undefined,null)).status,401);
  for(const actor of ['editor','member'])assert.equal((await req(env,path,'GET',undefined,actor)).status,403);
 }
 assert.equal((await req(env,'','POST',{data:{}},'admin','https://foreign.test')).status,403);
 const response=await req(env);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const data=await response.json();assert.equal(data.total,TOTAL);assert.equal(data.items.length,30);assert.ok(data.catalog.zones.length);
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
 assert.equal(sql.prepare('SELECT count(*) AS n FROM external_observations').get().n,TOTAL);
});
test('inizializzazione D1 dallo stato: solo ricevuta pubblica, senza fonti o record',async()=>{
 const {env,sql}=setup();const response=await handleCommunity(new Request(ORIGIN+'/api/community/status'),env,NOW);
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.externalImport.records,seed.records.length);
 assert.deepEqual(Object.keys(data.externalImport).sort(),['id','importedAt','records']);
 assert.equal(JSON.stringify(data).includes('facebook.com'),false);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM external_observations').get().n,TOTAL);
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

const {externalImpact,combineFieldMultipliers,externalMultiplier}=await import('../js/external-signal.js');
const {publicExternalSignals}=await import('../worker/external-engine.js');
const {SPECIES}=await import('../js/species.js');
const options={now:NOW,day:'2026-10-20',maxPercent:10,modelTaxonIds:SPECIES.map(s=>s.id),zoneIds:['vallonina','nemi-fontan-tempesta']};
function occurrences(){return [0,1,2].map((i)=>({id:'fixture-'+i,version:0,observedOn:i?'2026-10-20':'2026-10-19',zoneId:'vallonina',taxonId:'edulis',zoneUsable:true,quality:'research',outcome:'presence',eventKey:'event-'+i,placeName:'Vallonina',scientificName:'Boletus edulis'}));}
test('motore esterno: soglie, assenze esplicite, futuro, scadenza e nessun dato da scala provinciale',()=>{
 const dataset={occurrences:occurrences(),excluded:[]};
 let r=externalImpact(dataset,options);assert.equal(r.totals.used,3);assert.ok(Math.abs(r.groups[0].multiplier-1.03)<1e-12);assert.equal(r.indexDelta,0);
 assert.equal(externalMultiplier(r.groups,'vallonina',['edulis']),1.03);
 assert.equal(externalImpact({...dataset,occurrences:dataset.occurrences.slice(1)},options).totals.used,0);
 assert.equal(externalImpact({...dataset,occurrences:dataset.occurrences.map(r=>({...r,observedOn:'2026-10-20'}))},options).totals.used,0);
 assert.equal(externalImpact(dataset,{...options,day:'2026-10-27'}).totals.used,0);
 assert.equal(externalImpact(dataset,{...options,day:'2026-10-19'}).totals.used,0);
 assert.equal(externalImpact(dataset,{...options,maxPercent:0}).groups[0].multiplier,1);
 assert.equal(externalImpact({...dataset,occurrences:dataset.occurrences.map(r=>({...r,zoneUsable:false}))},options).groups.length,0);
 assert.equal(externalImpact(dataset,{...options,modelTaxonIds:[]}).groups.length,0);
 r=externalImpact({...dataset,occurrences:dataset.occurrences.map(r=>({...r,outcome:'searched_absent',searched:true,effortMinutes:30}))},options);assert.ok(Math.abs(r.groups[0].multiplier-.97)<1e-12);
 assert.equal(externalImpact({...dataset,occurrences:[...dataset.occurrences,...dataset.occurrences]},options).groups[0].events,3);
 assert.throws(()=>externalImpact(dataset,{...options,day:'2026-10-28'}));
 assert.equal(combineFieldMultipliers(1.1,1.1),1.1);assert.equal(combineFieldMultipliers(.9,1.03),.9);assert.equal(combineFieldMultipliers(1.02,1.03),1.03);
});
test('API impatto e snapshot pubblico: 88 motivi, nessuna osservazione recente usata e niente fonti private',async()=>{
 const {env}=setup();let response=await req(env,'/impact');assert.equal(response.status,200);const data=await response.json();assert.equal(data.totals.records,TOTAL);assert.equal(data.totals.used,0);assert.equal(data.indexDelta,0);assert.ok(data.records.find(r=>r.id==='inat-407893374').reasons.includes('Fuori dalla finestra di 7 giorni'));
 assert.equal((await req(env,'/impact?day=2026-10-28')).status,422);
 const snapshot=await publicExternalSignals(env,NOW);assert.equal(snapshot.days.length,8);assert.equal(snapshot.days[0].groups.length,0);assert.equal(JSON.stringify(snapshot).includes('sourceUrl'),false);assert.equal(JSON.stringify(snapshot).includes('eventKey'),false);
 response=await req(env,'/evaluate','POST',{day:'2026-10-20',zoneId:'vallonina',taxonIds:['edulis'],baseIndex:7.2,basePriority:72,communityMultiplier:1.03});assert.equal(response.status,200);const calculated=await response.json();assert.deepEqual(calculated.index,{before:7.2,after:7.2,delta:0});assert.equal(calculated.priority.before,calculated.priority.after);assert.equal(calculated.inputOrigin,'caller_supplied_baseline');
});
test('agenti: credenziali limitate, schema, lettura e calcolo, scritture revisionate, audit e revoca',async()=>{
 const {env,sql}=setup();await req(env);
 const adminCall=(path,method,body)=>handleCms(new Request(ORIGIN+'/api/cms/v1/'+path,{method,headers:{cookie:'__Host-fungaroli_session=admin',origin:ORIGIN,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
 const token=async(scopes,resources=['external-observations'])=>{const r=await adminCall('tokens','POST',{name:'Fixture API',days:1,scopes,resources});assert.equal(r.status,201);return r.json();};
 const read=await token(['read']),write=await token(['read','write']),review=await token(['read','write','review']),other=await token(['read'],['zones']);
 const call=(t,path='',method='GET',body)=>handleCms(new Request(ORIGIN+'/api/cms/v1/external-observations'+path,{method,headers:{authorization:'Bearer '+t.token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,NOW);
 for(const path of ['', '/schema','/impact','/engine','/external-fb01'])assert.equal((await call(read,path)).status,200,path);
 assert.equal((await call(other)).status,403);
 assert.equal((await call(read,'','POST',{data:{}})).status,403);
 assert.equal((await call(read,'/evaluate','POST',{zoneId:'vallonina',taxonIds:['edulis'],baseIndex:5,basePriority:50})).status,200);
 const source=seed.records.find(r=>r.id==='inat-406967333').data;
 assert.equal((await call(write,'','POST',{data:{...source,sourceUrl:'https://example.org/review'},reason:'Tentativo senza revisione'})).status,403);
 let r=await call(write,'','POST',{data:{...source,reviewStatus:'pending',sourceUrl:'https://example.org/pending'},reason:'Fonte da controllare'});assert.equal(r.status,201);const created=await r.json();
 r=await call(review,'/'+created.id,'PATCH',{version:0,data:{...created.data,reviewStatus:'accepted'},reason:'Verificati dati e fonte'});assert.equal(r.status,200);assert.equal((await r.json()).updatedBy,'agent:'+review.id);
 assert.equal((await call(write,'/'+created.id,'PATCH',{version:1,data:{...created.data,reviewStatus:'pending'},reason:'Tentativo declassamento'})).status,403);
 assert.equal((await call(review,'/'+created.id,'PATCH',{version:0,data:{...created.data,reviewStatus:'accepted'},reason:'Versione superata'})).status,412);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM external_observation_history WHERE observation_id=?').get(created.id).n,2);
 await adminCall('tokens/'+read.id,'DELETE');assert.equal((await call(read)).status,401);
 const escalation=await handleCms(new Request(ORIGIN+'/api/cms/v1/tokens',{method:'POST',headers:{authorization:'Bearer '+review.token,'content-type':'application/json'},body:'{}'}),env,NOW);assert.equal(escalation.status,403);
});
test('registro fonti: copertura reale, cursore, storico, conflitti e seed senza sovrascritture',async()=>{
 const {env}=setup();const first=await req(env,'/sources');assert.equal(first.status,200);const list=await first.json();assert.equal(list.items.length,sourceSeed.length+2);assert.equal(list.items.filter(r=>r.id.startsWith('facebook-group-')).length,4);assert.ok(list.items.some(r=>r.data.query.includes('place_id=33138')));
 let row=await(await req(env,'/sources/'+list.items[0].id)).json();const data={...row.data,cursor:'Ultimo post consultato: da verificare al prossimo passaggio',notes:'Consultazione locale di verifica della persistenza'};
 let response=await req(env,'/sources/'+row.id,'PATCH',{version:row.version,data,reason:'Aggiornamento punto di ripresa'});assert.equal(response.status,200);row=await response.json();assert.equal(row.history.length,2);assert.equal(row.version,1);assert.equal(row.data.cursor,data.cursor);
 assert.equal((await req(env,'/sources/'+row.id,'PATCH',{version:0,data,reason:'Versione obsoleta'})).status,412);
 assert.equal((await req(env,'/sources','POST',{data,reason:'Fonte duplicata'})).status,409);
 assert.equal((await req(env,'/sources','POST',{data:{...data,url:'https://example.org/source',lastCheckedOn:'2026-10-22'},reason:'Data futura'})).status,422);
 assert.equal((await req(env,'/sources','GET',undefined,'member')).status,403);
});
test('tetto comune applicato anche al confronto con community e parità opposte',()=>{
 assert.equal(combineFieldMultipliers(.9,1.1),.9);
 assert.equal(combineFieldMultipliers(1.1,1.04,4),1.04);
 assert.equal(combineFieldMultipliers(1.1,1.1,0),1);
});
