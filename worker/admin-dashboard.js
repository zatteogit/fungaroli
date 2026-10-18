import schema from '../migrations/0008_ranking_policy.sql';
import {buildEdibleCatalog} from '../js/edible-catalog.js';
import {SURVEY_ID} from '../js/survey-schema.js';
const initialized=new WeakMap();
const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
async function init(db){
 if(!db)fail('Il database della comunità non è disponibile.',503);
 if(!initialized.has(db))initialized.set(db,db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s))).catch(e=>{initialized.delete(db);throw e;}));
 await initialized.get(db);
}
export async function rankingPolicy(db){await init(db);return db.prepare('SELECT max_percent AS maxPercent,version,updated_at AS updatedAt,updated_by AS updatedBy,reason FROM ranking_policy WHERE id=1').first();}
export async function saveRankingPolicy(db,input,actor,now){
 if(!input||!Number.isInteger(input.maxPercent)||input.maxPercent<0||input.maxPercent>10||!Number.isInteger(input.version)||input.version<0||typeof input.reason!=='string'||input.reason.trim().length<5||input.reason.length>500||Object.keys(input).some(k=>!['maxPercent','version','reason'].includes(k)))fail('Indica un limite intero da 0 a 10%, la versione e un motivo da 5 a 500 caratteri.');
 await init(db);const nonce=crypto.randomUUID(),reason=input.reason.trim();
 const writes=await db.batch([
  db.prepare('UPDATE ranking_policy SET max_percent=?,version=version+1,updated_at=?,updated_by=?,reason=?,nonce=? WHERE id=1 AND version=?').bind(input.maxPercent,now,actor,reason,nonce,input.version),
  db.prepare('INSERT INTO ranking_policy_history(version,max_percent,previous_percent,updated_at,updated_by,reason) SELECT version,max_percent,COALESCE((SELECT max_percent FROM ranking_policy_history WHERE version=?),10),updated_at,updated_by,reason FROM ranking_policy WHERE id=1 AND nonce=?').bind(input.version,nonce),
 ]);
 if(!writes[0].meta.changes)fail('Le impostazioni sono cambiate. Aggiorna la dashboard prima di salvare.',412);
 return rankingPolicy(db);
}
export async function adminDashboard(db,now,cmsDb){
 const policy=await rankingPolicy(db);
 const since=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now-6*864e5));
 const has=async table=>!!await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
 const survey=await has('survey_responses')?await db.prepare('SELECT COUNT(*) AS count,MAX(created_at) AS lastAt FROM survey_responses WHERE survey=?').bind(SURVEY_ID).first():{count:0,lastAt:null};
 const reports=(await db.prepare('SELECT r.zone_id AS zoneId,r.species_id AS taxonId,COUNT(*) AS count,SUM(r.amount>0) AS sightings,SUM(r.amount=0) AS zeros,COUNT(DISTINCT CASE WHEN a.created_at<? THEN r.account_id END) AS establishedContributors,COUNT(DISTINCT r.day) AS days,MAX(r.day) AS latestDay FROM reports r JOIN accounts a ON a.id=r.account_id WHERE r.day>=? GROUP BY r.zone_id,r.species_id ORDER BY count DESC,r.zone_id,r.species_id').bind(now-864e5,since).all()).results;
 const observations=(await db.prepare('SELECT zone_id AS zoneId,category,taxon_id AS taxonId,COUNT(*) AS count,MAX(day) AS latestDay FROM shared_observations WHERE day>=? GROUP BY zone_id,category,taxon_id ORDER BY count DESC,zone_id,category,taxon_id').bind(since).all()).results;
 const totals=await db.prepare('SELECT (SELECT COUNT(*) FROM reports) AS reports,(SELECT COUNT(*) FROM shared_observations) AS observations').first();
 const history=(await db.prepare('SELECT version,max_percent AS maxPercent,previous_percent AS previousPercent,updated_at AS updatedAt,updated_by AS updatedBy,reason FROM ranking_policy_history ORDER BY version DESC LIMIT 20').all()).results;
 if(cmsDb){
  const resources=Object.fromEntries((await cmsDb.prepare("SELECT id,published FROM cms_documents WHERE id IN ('zones','species-traits','edible-catalog','plants','trees')").all()).results.map(r=>[r.id,JSON.parse(r.published)]));
  const zoneNames=new Map((resources.zones?.zones||[]).map(z=>[z.id,z.name]));
  const fungusNames=new Map(buildEdibleCatalog(resources['species-traits'],resources['edible-catalog']).map(s=>[s.id,s.name]));
  for(const r of reports){r.zoneName=zoneNames.get(r.zoneId)||r.zoneId;r.taxonName=fungusNames.get(r.taxonId)||r.taxonId;}
  for(const r of observations){r.zoneName=zoneNames.get(r.zoneId)||r.zoneId;r.taxonName=(r.category==='fungo'?(fungusNames.get(r.taxonId)||resources['species-traits']?.taxa?.[r.taxonId]?.name):resources[r.category==='albero'?'trees':'plants']?.[r.category==='albero'?'trees':'plants']?.[r.taxonId]?.name)||r.taxonId;}
 }
 return {generatedAt:now,since,windowDays:7,policy,survey,reports,observations,totals,history};
}
