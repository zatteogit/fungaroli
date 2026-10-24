// Contratto condiviso da importazione, redazione e lettura del motore.
// Le fonti esterne non sono contributori Fronda né probabilità di ritrovamento.
export const EXTERNAL_ENUMS = {
 sourceType:['facebook','inaturalist','forum','editorial','other'],
 outcome:['presence','searched_absent','absence_claim','mixed','context'],
 evidence:['direct','reported','identification','context','model'],
 datePrecision:['day','month','relative','unknown'],
 spatialScope:['zone','municipality','province','region','multi_area','unknown'],
 quality:['research','needs_id','unverified'],
 reviewStatus:['pending','accepted','excluded'],
};
export const EXTERNAL_LENGTHS={sourceUrl:800,sourceLabel:160,sourceRecordId:100,publicationLabel:160,publishedOn:10,observedOn:10,observationLabel:250,placeName:200,province:80,reportedTaxon:250,scientificName:160,zoneId:100,taxonId:100,summary:2000,limitations:2000,license:160,attribution:300,eventKey:150};
const fail=message=>{throw Object.assign(new Error(message),{status:422});};
export function canonicalSource(value){
 let u;try{u=new URL(value);}catch{fail('Indica un link HTTPS alla fonte.');}
 if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port||!u.hostname.includes('.')||u.hostname==='localhost')fail('Indica un link HTTPS pubblico senza credenziali o frammenti.');
 // Tracking non necessario; commenti e risposte sono fonti distinte.
 for(const key of [...u.searchParams.keys()])if(/^(__|utm_|fbclid)/.test(key))u.searchParams.delete(key);
 u.searchParams.sort();u.pathname=u.pathname.replace(/\/$/,'');return u.href;
}
export function validExternalDay(day,now=Date.now()){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const date=new Date(day+'T12:00:00Z');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day&&day<=today;
}
export function normalizeExternalObservation(input,{zoneIds,taxonIds,now=Date.now()}={}){
 if(!input||Array.isArray(input)||typeof input!=='object')fail('Segnalazione non valida.');
 const allowed=new Set([...Object.keys(EXTERNAL_LENGTHS),...Object.keys(EXTERNAL_ENUMS),'searched','effortMinutes']);
 if(Object.keys(input).some(k=>!allowed.has(k)))fail('La segnalazione contiene campi non previsti.');
 const r={};
 for(const [k,max] of Object.entries(EXTERNAL_LENGTHS)){
  const v=input[k];if(v!==null&&v!==undefined&&typeof v!=='string')fail(`Campo ${k} non valido.`);
  if(v?.length>max)fail(`Campo ${k} troppo lungo.`);r[k]=v?.trim()||null;
 }
 for(const [k,values] of Object.entries(EXTERNAL_ENUMS)){if(!values.includes(input[k]))fail(`Scegli un valore valido per ${k}.`);r[k]=input[k];}
 if(!r.sourceUrl||!r.sourceLabel||!r.placeName||!r.summary||!r.eventKey)fail('Indica fonte, luogo ampio, sintesi e gruppo dell’evento.');
 r.sourceUrl=canonicalSource(r.sourceUrl);
 for(const k of ['observedOn','publishedOn'])if(r[k]&&!validExternalDay(r[k],now))fail('La data deve essere reale e non futura.');
 if(r.datePrecision==='day'&&!r.observedOn||r.observedOn&&r.datePrecision!=='day')fail('Una data esatta dell’osservazione richiede precisione “day”. Le date relative restano senza giorno ISO.');
 if(r.zoneId&&zoneIds&&!zoneIds.has(r.zoneId)||r.taxonId&&taxonIds&&!taxonIds.has(r.taxonId))fail('Zona o specie non presenti nel catalogo.');
 if(r.spatialScope==='zone'&&!r.zoneId||r.zoneId&&r.spatialScope!=='zone')fail('Associa la zona del catalogo soltanto quando il luogo è risolto a quella zona.');
 if(typeof input.searched!=='boolean')fail('Indica se la ricerca è esplicita.');r.searched=input.searched;
 if(input.effortMinutes!==null&&input.effortMinutes!==undefined&&(!Number.isInteger(input.effortMinutes)||input.effortMinutes<1||input.effortMinutes>1440))fail('La durata deve essere da 1 a 1440 minuti oppure sconosciuta.');
 r.effortMinutes=input.effortMinutes??null;
 if(r.outcome==='searched_absent'&&!r.searched)fail('Una ricerca a vuoto richiede ricerca esplicita.');
 if(r.taxonId&&!r.scientificName)fail('La specie del catalogo richiede il nome scientifico risolto.');
 return r;
}
export function externalUsability(r){
 const reasons=[];
 if(r.reviewStatus!=='accepted')reasons.push(r.reviewStatus==='excluded'?'Esclusa dalla revisione':'Da revisionare');
 if(!r.observedOn||r.datePrecision!=='day')reasons.push('Data dell’osservazione non risolta');
 if(!r.scientificName)reasons.push('Taxon non risolto');
 if(!['zone','municipality','province','region'].includes(r.spatialScope))reasons.push('Luogo ambiguo o più aree');
 if(!['direct','identification'].includes(r.evidence))reasons.push('Non è un’osservazione diretta');
 if(r.outcome==='presence'&&r.quality!=='research')reasons.push('Identificazione non confermata dalla fonte');
 if(!['presence','searched_absent'].includes(r.outcome))reasons.push('Non è presenza o ricerca esplicita a vuoto');
 if(r.outcome==='searched_absent'&&(!r.searched||!r.effortMinutes))reasons.push('Ricerca o sforzo non documentati');
 const regional=reasons.length===0;
 return {regional,zone:regional&&r.spatialScope==='zone'&&!!r.zoneId&&!!r.taxonId,
  reasons:reasons.length?reasons:r.spatialScope==='zone'&&r.zoneId&&r.taxonId?[]:['Utilizzabile alla scala dichiarata; nessuna attribuzione automatica alle zone del catalogo']};
}
export function externalEngineDataset(records,{now=Date.now()}={}){
 const seen=new Set(),occurrences=[],excluded=[];
 for(const {id,data:r,...meta} of records){
  const use=externalUsability(r),key=r.eventKey+'|'+r.scientificName+'|'+r.observedOn;
  if(!use.regional||!validExternalDay(r.observedOn,now)){excluded.push({id,reasons:use.regional?['Data non valida o futura']:use.reasons});continue;}
  if(seen.has(key)){excluded.push({id,reasons:['Evento e taxon già presenti nel dataset']});continue;}seen.add(key);
  occurrences.push({id,version:meta.version??0,observedOn:r.observedOn,placeName:r.placeName,province:r.province,spatialScope:r.spatialScope,
   zoneId:r.zoneId,taxonId:r.taxonId,scientificName:r.scientificName,outcome:r.outcome,searched:r.searched,
   effortMinutes:r.effortMinutes,quality:r.quality,sourceType:r.sourceType,sourceUrl:r.sourceUrl,eventKey:r.eventKey,
   license:r.license,attribution:r.attribution,zoneUsable:use.zone});
 }
 return {schemaVersion:1,generatedAt:new Date(now).toISOString(),purpose:'occurrence_evidence',
  rankingEffect:'none',absenceFromMissingRecords:false,occurrences,excluded};
}
