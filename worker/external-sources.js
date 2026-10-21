import schema from '../migrations/0011_external_sources.sql';
import seeds from './external-sources-seed.json';
import review from './research-review-seed.json';
import {canonicalSource,validExternalDay} from '../js/external-observation.js';
const initialized=new WeakMap();
const fail=(m,status=422)=>{throw Object.assign(new Error(m),{status});};
const fields={name:200,url:800,kind:40,territory:200,access:500,query:1500,lastCheckedOn:10,resumeUrl:800,cursor:2000,coverage:2000,notes:2000,status:30};
const view=r=>({id:r.id,version:r.version,data:JSON.parse(r.payload),updatedAt:r.updated_at,updatedBy:r.updated_by});
async function init(db){
 if(!db)fail('Database delle fonti non disponibile.',503);
 if(!initialized.has(db))initialized.set(db,(async()=>{
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const writes=[];
  for(const r of seeds){const data=normalize(r.data),now=Date.now(),nonce=crypto.randomUUID();writes.push(db.prepare('INSERT INTO external_sources(id,source_key,payload,updated_at,updated_by,nonce) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(r.id,data.url,JSON.stringify(data),now,'release:external-sources',nonce));writes.push(db.prepare("INSERT INTO external_source_history(source_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,'Registro delle fonti consultate il 20 ottobre 2026' FROM external_sources WHERE id=? AND nonce=? ON CONFLICT DO NOTHING").bind(r.id,nonce));}
  await db.batch(writes);
  for(const patch of review.patches){
   const id='source-'+patch.id,row=await db.prepare('SELECT * FROM external_sources WHERE id=?').bind(id).first();
   if(!row||row.version!==0||!row.updated_by.startsWith('release:'))continue;
   const data=JSON.parse(row.payload);data.lastCheckedOn='2026-10-20';data.coverage=patch.reason;data.notes='Verifica indipendente della proposta Gemini. '+patch.data.limitations;data.cursor='Verificato il contenuto citato; ripartire dalla fonte e distinguere raccolta da pubblicazione.';
   if(['gemini-rec-07','gemini-rec-23','gemini-rec-24'].includes(patch.id))data.status='unavailable';
   const normalized=normalize(data),nonce=crypto.randomUUID(),now=Date.now();
   await db.batch([db.prepare('UPDATE external_sources SET payload=?,version=version+1,updated_at=?,updated_by=?,nonce=? WHERE id=? AND version=0').bind(JSON.stringify(normalized),now,'release:'+review.importId,nonce,id),db.prepare('INSERT INTO external_source_history(source_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,? FROM external_sources WHERE id=? AND nonce=?').bind('Verifica della fonte originale e correzione della proposta Gemini',id,nonce)]);
  }
  for(const [i,c] of review.coverage.entries()){
   const data=normalize({name:'iNaturalist – controllo recente '+(i?'Lazio':'Rieti'),url:c.url,kind:'inaturalist',territory:i?'Lazio':'Rieti',access:'API pubblica, nessuna autenticazione',query:'Funghi osservati dal 6 al 20 ottobre 2026'+(i?', research grade':''),lastCheckedOn:'2026-10-20',resumeUrl:c.url,cursor:'Pagina 1 completa; '+c.read+'/'+c.totalResults+' risultati letti',coverage:'Finestra 6–20 ottobre 2026. Totale complessivo: 40 nuove voci Lazio, nessuna nuova Rieti. Nessuna nuova associazione a zona/specie del motore.',notes:'Coordinate e osservatori non conservati. Assenza di osservazioni non equivale ad assenza di funghi.',status:'active'}),id='recent-inat-2026-10-20-'+i,nonce=crypto.randomUUID(),now=Date.now();
   await db.batch([db.prepare('INSERT INTO external_sources(id,source_key,payload,updated_at,updated_by,nonce) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(id,data.url,JSON.stringify(data),now,'release:'+review.importId,nonce),db.prepare('INSERT INTO external_source_history(source_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,? FROM external_sources WHERE id=? AND nonce=? ON CONFLICT DO NOTHING').bind('Ricerca recente completa e cursore riutilizzabile',id,nonce)]);
  }

 })().catch(e=>{initialized.delete(db);throw e;}));await initialized.get(db);
}
function normalize(data,now=Date.now()){
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!Object.hasOwn(fields,k)))fail('Campi della fonte non validi.');
 const r={};for(const [k,max]of Object.entries(fields)){const v=data[k];if(v!==null&&v!==undefined&&(typeof v!=='string'||v.length>max))fail('Campo fonte non valido: '+k);r[k]=v?.trim()||null;}
 if(!r.name||!r.url||!r.territory||!r.access||!['facebook','inaturalist','forum','editorial','other'].includes(r.kind)||!['active','paused','unavailable'].includes(r.status))fail('Indica nome, link, territorio, accesso, tipo e stato della fonte.');
 r.url=canonicalSource(r.url);if(r.resumeUrl)r.resumeUrl=canonicalSource(r.resumeUrl);
 if(r.lastCheckedOn&&!validExternalDay(r.lastCheckedOn,now))fail('Data di consultazione non valida o futura.');
 return r;
}
export async function listExternalSources(db){await init(db);return {schemaVersion:1,fields,items:(await db.prepare('SELECT * FROM external_sources ORDER BY id LIMIT 1000').all()).results.map(view),note:'Registro di consultazioni dichiarate; nessuna acquisizione automatica.'};}
export async function readExternalSource(db,id){await init(db);const row=await db.prepare('SELECT * FROM external_sources WHERE id=?').bind(id).first();if(!row)fail('Fonte non trovata.',404);return {...view(row),history:(await db.prepare('SELECT version,payload,updated_at AS updatedAt,updated_by AS updatedBy,reason FROM external_source_history WHERE source_id=? ORDER BY version DESC LIMIT 20').bind(id).all()).results.map(h=>({...h,data:JSON.parse(h.payload),payload:undefined}))};}
export async function saveExternalSource(db,id,input,actor,now){
 if(!input||Object.keys(input).some(k=>!['data','reason','version'].includes(k))||typeof input.reason!=='string'||input.reason.trim().length<5||input.reason.length>500||id&&(!Number.isInteger(input.version)||input.version<0))fail('Indica dati, motivo e versione della fonte.');
 const data=normalize(input.data,now);await init(db);const recordId=id||crypto.randomUUID(),nonce=crypto.randomUUID(),payload=JSON.stringify(data);
 let writes;try{writes=await db.batch([id?db.prepare('UPDATE external_sources SET source_key=?,payload=?,version=version+1,updated_at=?,updated_by=?,nonce=? WHERE id=? AND version=?').bind(data.url,payload,now,actor,nonce,id,input.version):db.prepare('INSERT INTO external_sources(id,source_key,payload,updated_at,updated_by,nonce) VALUES(?,?,?,?,?,?) ON CONFLICT(source_key) DO NOTHING').bind(recordId,data.url,payload,now,actor,nonce),db.prepare('INSERT INTO external_source_history(source_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,? FROM external_sources WHERE id=? AND nonce=?').bind(input.reason.trim(),recordId,nonce)]);}catch(e){if(/UNIQUE constraint/.test(e.message))fail('Fonte già presente.',409);throw e;}
 if(!writes[0].meta.changes)fail(id?'Fonte cambiata: rileggi prima di salvare.':'Fonte già presente.',id?412:409);return readExternalSource(db,recordId);
}
