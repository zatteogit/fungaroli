// Righe d'osservazione per lo studio dell'indice (valutazione-modello-v3.md, 4.3; schema in
// docs/schema/uscita-osservazione.schema.json). Funzioni pure: per ora nessuna esportazione dal server.
// - Entra solo chi ha il consenso alla ricerca attivo (D4): l'ultima scelta del profilo, al momento dell'esportazione.
// - Uno zero diventa not_detected solo con ricerca conclusa e durata dichiarata; altrimenti resta unknown (D3).
// - Nessun testo, foto, titolo, nome o posizione: zona del catalogo, giorno e campi chiusi.
// - observer è uno pseudonimo scelto da chi esporta (per esempio un HMAC dell'ID del profilo), mai l'ID stesso.
// Il nome della decisione era survey-export.js: cambia per non confonderlo con il questionario (worker/survey.js).
import {EFFORT_CLASSES,effortClassFor} from './community-observation.js';
export const OBSERVATION_SCHEMA='fronda-observation-v1';
const CLASS_KEYS=new Set(EFFORT_CLASSES.map(([k])=>k));
const intOrNull=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max?v:null;

// Esito ordinale: detected con quantità 1–3; not_detected solo con ricerca dichiarata conclusa e durata; altrimenti unknown.
function outcome({presence,amount,completed,effortClass}){
  if(presence==='observed')return {outcome:'detected',amount:intOrNull(amount,1,3)};
  if(presence==='searched_absent')return {outcome:completed===true&&effortClass?'not_detected':'unknown',amount:0};
  return {outcome:'unknown',amount:null};
}
export function observationRow(record,{observer,consentVersion}){
  if(record.kind==='shared_observation'){
    const p=record.payload||{},minutes=intOrNull(p.minutes,1,1440),effortClass=CLASS_KEYS.has(p.effortClass)?p.effortClass:effortClassFor(minutes);
    const completed=typeof p.completed==='boolean'?p.completed:null,stopReason=typeof p.stopReason==='string'?p.stopReason:null;
    return {schema:OBSERVATION_SCHEMA,source:'shared_observation',observer,day:record.day,zone_id:record.zoneId,category:record.category,taxon_id:record.taxonId,
      ...outcome({presence:p.presence,amount:p.amount,completed,effortClass}),
      effort:{basis:completed!==null||stopReason?'actual_with_stop_reason':effortClass?'actual':'none',class:effortClass,minutes,people:intOrNull(p.people,1,100),completed,stop_reason:stopReason},
      identification:'unreviewed',habitat:typeof p.habitat==='string'?p.habitat:'unknown',elevation:intOrNull(p.elevation,0,4500),
      protocol_version:typeof p.protocolVersion==='string'?p.protocolVersion:null,consent_version:consentVersion};
  }
  if(record.kind==='report'){
    const ctx=record.validationContext||{},minutes=intOrNull(ctx.effort?.minutes,1,1440),amount=intOrNull(record.amount,0,3);
    // Le segnalazioni rapide non chiedono se la ricerca è conclusa: uno zero resta unknown.
    return {schema:OBSERVATION_SCHEMA,source:'report',observer,day:record.day,zone_id:record.zoneId,category:'fungo',taxon_id:record.speciesId,
      outcome:amount>0?'detected':'unknown',amount,
      effort:{basis:minutes?'actual':'none',class:effortClassFor(minutes),minutes,people:intOrNull(ctx.effort?.people,1,100),completed:null,stop_reason:null},
      identification:record.identificationChecked?'declared_checked':'unreviewed',habitat:'unknown',elevation:null,
      protocol_version:'fronda-report-v1',consent_version:consentVersion,
      forecast:ctx.mode==='prospective'&&Number.isFinite(ctx.predicted)?{mode:'prospective',predicted:ctx.predicted,model_version:ctx.modelVersion||null,captured_at:ctx.capturedAt||null}:null};
  }
  return null;
}
// records: [{accountId, kind:'shared_observation'|'report', ...}]; consents: Map accountId → {granted, version}
// (l'ultima scelta del profilo, js/research-consent.js); pseudonym: accountId → stringa.
export function researchRows(records,{consents,pseudonym}){
  return records.flatMap(r=>{
    const c=consents.get(r.accountId);
    if(!c?.granted)return [];
    const row=observationRow(r,{observer:pseudonym(r.accountId),consentVersion:c.version});
    return row?[row]:[];
  });
}
