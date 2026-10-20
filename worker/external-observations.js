import schema from '../migrations/0010_external_observations.sql';
import seed from './external-observations-seed.json';
import geminiSeed from './gemini-research-seed.json';
import zones from '../data/zones.json';
import traits from '../data/species-traits.json';
import {canonicalSource,normalizeExternalObservation,externalUsability,externalEngineDataset} from '../js/external-observation.js';

const initialized=new WeakMap();
const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
const catalog={zoneIds:new Set(zones.zones.map(z=>z.id)),taxonIds:new Set(Object.keys(traits.taxa))};
const view=row=>({id:row.id,version:row.version,updatedAt:row.updated_at,updatedBy:row.updated_by,data:JSON.parse(row.payload),usability:externalUsability(JSON.parse(row.payload))});
const keyOf=r=>canonicalSource(r.sourceUrl);

export async function initExternalObservations(db){
 if(!db)fail('Database delle segnalazioni non disponibile.',503);
 if(!initialized.has(db))initialized.set(db,(async()=>{
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  for(const batchSeed of [{...seed,importId:'external-2026-10-20-v1'},geminiSeed]){
  const imported=await db.prepare('SELECT id,imported_at AS importedAt,record_count AS records FROM external_observation_imports WHERE id=?').bind(batchSeed.importId).first();
  if(imported)continue;
  // Importazione idempotente: i dati già corretti dalla dashboard non vengono riscritti.
  // È un seed versionato autorizzato, non un import di dati inviati dalla richiesta.
  for(let i=0;i<batchSeed.records.length;i+=20){
   const writes=[];
   for(const {id,data} of batchSeed.records.slice(i,i+20)){
    const r=normalizeExternalObservation(data,catalog),payload=JSON.stringify(r),nonce=crypto.randomUUID(),now=Date.now();
    writes.push(db.prepare('INSERT INTO external_observations(id,source_key,payload,observed_on,zone_id,taxon_id,outcome,review_status,updated_at,updated_by,write_nonce) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(id,keyOf(r),payload,r.observedOn,r.zoneId,r.taxonId,r.outcome,r.reviewStatus,now,'release:'+batchSeed.importId,nonce));
    writes.push(db.prepare("INSERT INTO external_observation_history(observation_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,'Importazione con fonte, provenienza e limiti; controllare lo stato di revisione' FROM external_observations WHERE id=? AND write_nonce=? ON CONFLICT DO NOTHING").bind(id,nonce));
   }
   await db.batch(writes);
  }
  const count=await db.prepare(`SELECT COUNT(*) AS n FROM external_observations WHERE id IN (${batchSeed.records.map(()=>'?').join(',')})`).bind(...batchSeed.records.map(r=>r.id)).first('n');
  if(count!==batchSeed.records.length)fail('Importazione iniziale incompleta: una fonte è già presente con un altro identificativo.',503);
  await db.prepare('INSERT INTO external_observation_imports(id,imported_at,record_count) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(batchSeed.importId,Date.now(),count).run();
  }
  return db.prepare('SELECT id,imported_at AS importedAt,record_count AS records FROM external_observation_imports WHERE id=?').bind('external-2026-10-20-v1').first();
 })().catch(e=>{initialized.delete(db);throw e;}));
 return initialized.get(db);
}

export async function externalCatalog(cmsDb){
 let z=zones,t=traits;
 if(cmsDb){
  const rows=(await cmsDb.prepare("SELECT id,published FROM cms_documents WHERE id IN ('zones','species-traits')").all()).results;
  for(const r of rows){if(r.id==='zones')z=JSON.parse(r.published);else t=JSON.parse(r.published);}
 }
 return {zones:z.zones.map(x=>({id:x.id,name:x.name})),taxa:Object.entries(t.taxa).map(([id,x])=>({id,name:x.name,latin:x.latin}))};
}

export async function listExternalObservations(db,params){
 await initExternalObservations(db);
 const q=params.get('q')||'',status=params.get('status')||'',source=params.get('source')||'';
 if(q.length>160||status&&!['pending','accepted','excluded'].includes(status)||source&&!['facebook','inaturalist','forum','editorial','other'].includes(source))fail('Filtri non validi.');
 const page=Number(params.get('page')||0);if(!Number.isInteger(page)||page<0||page>10000)fail('Pagina non valida.');
 const conditions=[],bindings=[];
 if(q){conditions.push("(json_extract(payload,'$.summary') LIKE ? ESCAPE '\\' OR json_extract(payload,'$.placeName') LIKE ? ESCAPE '\\' OR json_extract(payload,'$.reportedTaxon') LIKE ? ESCAPE '\\')");const search='%'+q.replace(/[\\%_]/g,'\\$&')+'%';bindings.push(search,search,search);}
 if(status){conditions.push('review_status=?');bindings.push(status);}
 if(source){conditions.push("json_extract(payload,'$.sourceType')=?");bindings.push(source);}
 const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
 const total=await db.prepare('SELECT COUNT(*) AS n FROM external_observations'+where).bind(...bindings).first('n');
 const rows=(await db.prepare('SELECT * FROM external_observations'+where+' ORDER BY COALESCE(observed_on,\'\') DESC,id LIMIT 30 OFFSET ?').bind(...bindings,page*30).all()).results;
 return {items:rows.map(view),total,page,pageSize:30};
}

export async function readExternalObservation(db,id){
 await initExternalObservations(db);
 const row=await db.prepare('SELECT * FROM external_observations WHERE id=?').bind(id).first();if(!row)fail('Segnalazione non trovata.',404);
 const history=(await db.prepare('SELECT version,payload,updated_at AS updatedAt,updated_by AS updatedBy,reason FROM external_observation_history WHERE observation_id=? ORDER BY version DESC LIMIT 20').bind(id).all()).results.map(r=>({...r,data:JSON.parse(r.payload),payload:undefined}));
 return {...view(row),history};
}

export async function saveExternalObservation(db,id,input,actor,now,cmsDb){
 if(!input||Object.keys(input).some(k=>!['data','version','reason'].includes(k))||typeof input.reason!=='string'||input.reason.trim().length<5||input.reason.length>500)fail('Indica la segnalazione e un motivo da 5 a 500 caratteri.');
 if(id&&(!Number.isInteger(input.version)||input.version<0))fail('La revisione della segnalazione è obbligatoria.');
 const c=await externalCatalog(cmsDb),r=normalizeExternalObservation(input.data,{now,zoneIds:new Set(c.zones.map(z=>z.id)),taxonIds:new Set(c.taxa.map(t=>t.id))});
 if(r.taxonId&&c.taxa.find(t=>t.id===r.taxonId)?.latin!==r.scientificName)fail('Nome scientifico e specie del catalogo non corrispondono.');
 await initExternalObservations(db);
 const key=keyOf(r),duplicate=await db.prepare('SELECT id FROM external_observations WHERE source_key=?').bind(key).first();
 if(duplicate&&duplicate.id!==id)fail('Questa fonte è già nel registro. Apri e correggi la voce esistente.',409);
 const nonce=crypto.randomUUID(),payload=JSON.stringify(r),recordId=id||crypto.randomUUID();
 const write=id?db.prepare('UPDATE external_observations SET source_key=?,payload=?,observed_on=?,zone_id=?,taxon_id=?,outcome=?,review_status=?,version=version+1,updated_at=?,updated_by=?,write_nonce=? WHERE id=? AND version=?').bind(key,payload,r.observedOn,r.zoneId,r.taxonId,r.outcome,r.reviewStatus,now,actor,nonce,id,input.version):
  db.prepare('INSERT INTO external_observations(id,source_key,payload,observed_on,zone_id,taxon_id,outcome,review_status,updated_at,updated_by,write_nonce) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_key) DO NOTHING').bind(recordId,key,payload,r.observedOn,r.zoneId,r.taxonId,r.outcome,r.reviewStatus,now,actor,nonce);
 let writes;
 try{writes=await db.batch([write,db.prepare('INSERT INTO external_observation_history(observation_id,version,payload,updated_at,updated_by,reason) SELECT id,version,payload,updated_at,updated_by,? FROM external_observations WHERE id=? AND write_nonce=?').bind(input.reason.trim(),recordId,nonce)]);}
 catch(error){if(/UNIQUE constraint/.test(error.message))fail('Fonte già presente o revisione concorrente. Rileggi il registro.',409);throw error;}
 if(!writes[0].meta.changes)fail(id?'La segnalazione è cambiata. Rileggi prima di salvare.':'Questa fonte è già presente.',id?412:409);
 return readExternalObservation(db,recordId);
}

export async function externalDataset(db,now){
 await initExternalObservations(db);
 const count=await db.prepare('SELECT COUNT(*) AS n FROM external_observations').first('n');
 if(count>5000)fail('Esportazione oltre 5000 voci: occorre un’esportazione a pagine.',413);
 const rows=(await db.prepare('SELECT * FROM external_observations ORDER BY id').all()).results;
 return externalEngineDataset(rows.map(view),{now});
}
