import {normalizeFieldRecord} from './community-observation.js';
// Internal phase status absent means searched, not observed; it does not prove absence.
// Private notes have no forecast/finds payload and cannot become mushroom reports.
export const PHENO_PHASES=[['young_leaves','Foglie giovani'],['open_flowers','Fiori aperti'],['unripe_fruits','Frutti immaturi'],['ripe_fruits','Frutti maturi'],['dry_fruits','Frutti secchi']];
const refPattern=/^#\/(?:pianta|albero|specie|fungo|commestibile|guide|glossario)\/[a-zA-Z0-9%-]+$|^#\/zona\/[a-z0-9-]+(?:\/[0-7](?:\/sentiero\/[a-zA-Z0-9-]+)?)?$/;
const invalid=()=>{throw new Error('Appunto non valido: controlla titolo, giorno, testo e riferimento.');};
export function normalizeNotebookNote(e,{zoneIds,plantIds,now=Date.now()}={}){
  if(!e||e.kind!=='note'||typeof e.id!=='string'||!/^[a-zA-Z0-9-]{4,64}$/.test(e.id)||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))invalid();
  const d=new Date(e.date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==e.date)invalid();
  if(typeof e.title!=='string'||!e.title.trim()||e.title.length>120||typeof e.note!=='string'||e.note.length>2000||!['appunto','percorso','botanica','fungo','albero','lettura'].includes(e.category))invalid();
  const zoneId=e.zoneId||null;if(zoneId&&(typeof zoneId!=='string'||! /^[a-z0-9-]{1,40}$/.test(zoneId)||zoneIds&&!zoneIds.has(zoneId)))invalid();
  let reference=null,observation=null;
  if(e.reference!=null){if(typeof e.reference.href!=='string'||!refPattern.test(e.reference.href)||typeof e.reference.title!=='string'||!e.reference.title.trim()||e.reference.title.length>160)invalid();reference={href:e.reference.href,title:e.reference.title};}
  if(e.observation!=null){
    const o=e.observation,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
    if(e.date>today)invalid();
    if(e.category!=='botanica'||typeof o.taxonId!=='string'||! /^[a-z0-9-]{1,80}$/.test(o.taxonId)||plantIds&&!plantIds.has(o.taxonId)||reference?.href!==`#/pianta/${o.taxonId}`||!Array.isArray(o.phases)||o.phases.length>PHENO_PHASES.length)invalid();
    const codes=new Set();for(const p of o.phases){if(!PHENO_PHASES.some(([c])=>c===p.code)||codes.has(p.code)||!['present','absent','unsure'].includes(p.status))invalid();codes.add(p.code);}
    if(!['unknown','none','few','many'].includes(o.availability)||o.minutes!=null&&(!Number.isInteger(o.minutes)||o.minutes<1||o.minutes>1440)||typeof o.patchLabel!=='string'||o.patchLabel.length>120)invalid();
    observation={protocolVersion:'fungaroli-phenology-notes-v1',taxonId:o.taxonId,identification:'unreviewed',phases:o.phases.map(p=>({code:p.code,status:p.status})),availability:o.availability,minutes:o.minutes??null,patchLabel:o.patchLabel,locationPrecision:zoneId?'zone':'unspecified',researchConsent:false};
  }
  if(!reference&&!e.note.trim())invalid();
  return {...(e.record!=null?{record:normalizeFieldRecord(e.record)}:{}),id:e.id,kind:'note',title:e.title.trim(),category:e.category,date:e.date,zoneId,note:e.note,reference,observation,savedAt:typeof e.savedAt==='string'&&Number.isFinite(Date.parse(e.savedAt))?e.savedAt:new Date().toISOString()};
}
