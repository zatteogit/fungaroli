import schema from '../migrations/0012_survey_admin.sql';
import baseSchema from '../migrations/0004_survey.sql';
import {SURVEY_ID,SURVEY_VERSION,ANSWERS_SPEC,QUICK_ANSWERS,SPECIES,ZONES,MONTHS,SURVEY_RETENTION,validateSurvey,hasSurveyAnswers} from '../js/survey-schema.js';
import {newReceipt} from './survey.js';
import {validExternalDay} from '../js/external-observation.js';
const initialized=new WeakMap(),fail=(message,status=422,extra={})=>{throw Object.assign(new Error(message),{status,...extra});};
async function init(db){
 if(!db)fail('Database dei questionari non disponibile.',503);
 if(!initialized.has(db))initialized.set(db,(async()=>{
  await db.batch(baseSchema.split(';').map(s=>s.replace(/^\s*--.*$/gm,'').trim()).filter(s=>s&&!s.startsWith('PRAGMA')).map(s=>db.prepare(s)));
  // Il trigger contiene più istruzioni: non dividere il suo corpo ai punti e virgola.
  const [tables,trigger]=schema.split('CREATE TRIGGER');
  await db.batch(tables.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  await db.prepare('CREATE TRIGGER'+trigger).run();
 })().catch(e=>{initialized.delete(db);throw e;}));await initialized.get(db);
}
const project=r=>({id:r.id,receipt:r.receipt,survey:r.survey,version:r.version,createdAt:r.created_at,revision:r.revision??0,mode:r.mode||'public',collectedOn:r.collected_on||null,updatedAt:r.updated_at||r.created_at,updatedBy:r.updated_by||'respondent',respondent:{name:r.name,contact:r.contact},consent:{anonymousUse:true,recontact:!!r.consent_recontact,diary:!!r.consent_diary},answers:JSON.parse(r.answers)});
const sql='SELECT r.*,m.revision,m.mode,m.collected_on,m.updated_at,m.updated_by FROM survey_responses r LEFT JOIN survey_admin_meta m ON m.response_id=r.id';
export function surveyAdminSchema(){return {survey:SURVEY_ID,version:SURVEY_VERSION,answersSpec:ANSWERS_SPEC,quickAnswers:QUICK_ANSWERS,species:SPECIES,zones:ZONES,months:MONTHS,modes:['interview','transcription'],retention:SURVEY_RETENTION};}
export async function listSurveyAdmin(db,params,now=Date.now()){
 await init(db);const q=params.get('q')||'',page=Number(params.get('page')||0),mode=params.get('mode')||'';
 if(q.length>160||!Number.isInteger(page)||page<0||page>10000||mode&&!['public','interview','transcription'].includes(mode))fail('Filtri dei questionari non validi.');
 const conditions=['r.survey=?'],values=[SURVEY_ID];
 if(q){conditions.push("(r.receipt LIKE ? ESCAPE '\\' OR COALESCE(r.name,'') LIKE ? ESCAPE '\\' OR r.answers LIKE ? ESCAPE '\\')");const v='%'+q.replace(/[\\%_]/g,'\\$&')+'%';values.push(v,v,v);}
 if(mode){conditions.push("COALESCE(m.mode,'public')=?");values.push(mode);}
 const where=' WHERE '+conditions.join(' AND '),total=await db.prepare('SELECT COUNT(*) AS n FROM survey_responses r LEFT JOIN survey_admin_meta m ON m.response_id=r.id'+where).bind(...values).first('n');
 const rows=(await db.prepare(sql+where+' ORDER BY r.created_at DESC,r.id LIMIT 30 OFFSET ?').bind(...values,page*30).all()).results;
 const stats=(await db.prepare("SELECT COALESCE(m.mode,'public') AS mode,COUNT(*) AS n FROM survey_responses r LEFT JOIN survey_admin_meta m ON m.response_id=r.id WHERE r.survey=? GROUP BY COALESCE(m.mode,'public')").bind(SURVEY_ID).all()).results;
 return {generatedAt:now,total,page,pageSize:30,stats,items:rows.map(r=>{const v=project(r);if(params.get('includeAnswers')==='true')return v;return {id:v.id,receipt:v.receipt,createdAt:v.createdAt,revision:v.revision,mode:v.mode,name:v.respondent.name,zones:v.answers.profile?.zones||[],parts:Object.keys(v.answers).filter(k=>k!=='notApplicableParts'&&k!=='clarifications'),speciesCount:v.answers.species?.length||0};})};
}
export async function readSurveyAdmin(db,id){await init(db);const row=await db.prepare(sql+' WHERE r.id=? AND r.survey=?').bind(id,SURVEY_ID).first();if(!row)fail('Risposta non trovata.',404);const history=(await db.prepare('SELECT revision,answers,mode,collected_on AS collectedOn,updated_at AS updatedAt,updated_by AS updatedBy,reason FROM survey_response_history WHERE response_id=? ORDER BY revision DESC LIMIT 30').bind(id).all()).results.map(h=>({...h,answers:JSON.parse(h.answers)}));return {...project(row),history};}
export async function saveSurveyAdmin(db,id,input,actor,now=Date.now()){
 if(now>=Date.parse(SURVEY_RETENTION.answersUntil))fail('La raccolta è terminata.',410);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['data','reason','revision','mode','collectedOn'].includes(k))||typeof input.reason!=='string'||input.reason.trim().length<5||input.reason.length>500||!['interview','transcription','public'].includes(input.mode)||!id&&input.mode==='public'||id&&(!Number.isInteger(input.revision)||input.revision<0))fail('Indica risposte, provenienza, motivo e revisione.');
 if(input.collectedOn&&!validExternalDay(input.collectedOn,now))fail('La data dell’intervista deve essere reale e non futura.');
 const checked=validateSurvey(input.data);if(!checked.ok)fail(checked.errors.slice(0,5).map(e=>e.field+': '+e.message).join(' · '));if(!hasSurveyAnswers(checked.value.answers))fail('Inserisci almeno una risposta.');
 const v=checked.value;if(now>=Date.parse(SURVEY_RETENTION.contactUntil)){v.respondent.contact=null;v.consent.recontact=false;v.consent.diary=false;}
 await init(db);const payload=JSON.stringify(v.answers),reason=input.reason.trim(),collected=input.collectedOn||null,nonce=crypto.randomUUID();
 if(!id){
  const recordId=crypto.randomUUID(),receipt=newReceipt();
  await db.batch([
   db.prepare('INSERT INTO survey_responses(id,survey,version,receipt,created_at,duration_s,name,contact,consent_recontact,consent_diary,answers) VALUES(?,?,?,?,?,NULL,?,?,?,?,?)').bind(recordId,v.survey,v.version,receipt,now,v.respondent.name,v.respondent.contact,v.consent.recontact?1:0,v.consent.diary?1:0,payload),
   db.prepare('INSERT INTO survey_admin_meta(response_id,revision,mode,collected_on,updated_at,updated_by,reason,nonce) VALUES(?,0,?,?,?,?,?,?)').bind(recordId,input.mode,collected,now,actor,reason,nonce),
   db.prepare('INSERT INTO survey_response_history VALUES(?,0,?,?,?,?,?,?)').bind(recordId,payload,input.mode,collected,now,actor,reason),
  ]);return readSurveyAdmin(db,recordId);
 }
 await readSurveyAdmin(db,id);
 const writes=await db.batch([
  db.prepare("INSERT INTO survey_admin_meta(response_id,revision,mode,updated_at,updated_by,reason,nonce) SELECT id,0,'public',created_at,'respondent','Risposta originale','original' FROM survey_responses WHERE id=? ON CONFLICT DO NOTHING").bind(id),
  db.prepare('INSERT INTO survey_response_history(response_id,revision,answers,mode,collected_on,updated_at,updated_by,reason) SELECT r.id,m.revision,r.answers,m.mode,m.collected_on,m.updated_at,m.updated_by,m.reason FROM survey_responses r JOIN survey_admin_meta m ON m.response_id=r.id WHERE r.id=? ON CONFLICT DO NOTHING').bind(id),
  db.prepare('UPDATE survey_admin_meta SET revision=revision+1,mode=?,collected_on=?,updated_at=?,updated_by=?,reason=?,nonce=? WHERE response_id=? AND revision=?').bind(input.mode,collected,now,actor,reason,nonce,id,input.revision),
  db.prepare('UPDATE survey_responses SET name=?,contact=?,consent_recontact=?,consent_diary=?,answers=? WHERE id=? AND EXISTS(SELECT 1 FROM survey_admin_meta WHERE response_id=? AND nonce=?)').bind(v.respondent.name,v.respondent.contact,v.consent.recontact?1:0,v.consent.diary?1:0,payload,id,id,nonce),
  db.prepare('INSERT INTO survey_response_history(response_id,revision,answers,mode,collected_on,updated_at,updated_by,reason) SELECT response_id,revision,?,mode,collected_on,updated_at,updated_by,reason FROM survey_admin_meta WHERE response_id=? AND nonce=?').bind(payload,id,nonce),
 ]);
 if(!writes[2].meta.changes)fail('La risposta è cambiata. Rileggi prima di salvare.',412);return readSurveyAdmin(db,id);
}
export async function deleteSurveyAdmin(db,id){await init(db);await readSurveyAdmin(db,id);await db.prepare('DELETE FROM survey_responses WHERE id=?').bind(id).run();return {ok:true};}
