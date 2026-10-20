// Politica sperimentale di ordinamento: riusa limite e soglie della community.
// Eventi esterni deduplicati, non persone né contributori Fronda.
import {communityMultiplier} from './community-signal.js';
import {validExternalDay} from './external-observation.js';
export const EXTERNAL_RULE = {version:1,windowDays:7,minEvents:3,minDays:2,fullStrengthEvents:10,validation:'experimental-unvalidated',effect:'outing_priority_only'};
export const romeDay=(now=Date.now())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
const shift=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
export function externalImpact(dataset,{day=romeDay(),now=Date.now(),maxPercent=10,modelTaxonIds=[],zoneIds=[]}={}){
 const today=romeDay(now);
 if(!validExternalDay(day,now+7*864e5)||day<shift(today,-365)||day>shift(today,7))throw Object.assign(new Error('Scegli un giorno da un anno fa ai prossimi 7 giorni.'),{status:422});
 const cap=Number.isInteger(maxPercent)&&maxPercent>=0&&maxPercent<=10?maxPercent:0;
 const since=shift(day,-6),until=day<today?day:today,models=new Set(modelTaxonIds),zones=new Set(zoneIds),rows=[],groups=new Map(),seen=new Set();
 for(const r of dataset.occurrences){
  const reasons=[];
  if(!r.zoneUsable||!zones.has(r.zoneId))reasons.push('Luogo non risolto a una zona pubblicata');
  if(!models.has(r.taxonId))reasons.push('Specie senza modello previsionale');
  if(!validExternalDay(r.observedOn,now)||r.observedOn>until)reasons.push('Osservazione successiva al giorno valutato o non valida');
  if(r.observedOn<since)reasons.push('Fuori dalla finestra di 7 giorni');
  if(!r.eventKey)reasons.push('Evento non risolto');
  if(r.outcome==='presence'&&r.quality!=='research'||r.outcome==='searched_absent'&&(!r.searched||!Number.isInteger(r.effortMinutes)||r.effortMinutes<1)||!['presence','searched_absent'].includes(r.outcome))reasons.push('Esito o qualità non idonei');
  const event=r.eventKey+'|'+r.taxonId+'|'+r.observedOn;
  if(seen.has(event))reasons.push('Evento già contato');
  const row={id:r.id,version:r.version,day:r.observedOn,zoneId:r.zoneId,taxonId:r.taxonId,placeName:r.placeName,scientificName:r.scientificName,sourceUrl:r.sourceUrl,status:reasons.length?'excluded':'evidence',used:false,multiplier:1,indexDelta:0,reasons};rows.push(row);
  if(reasons.length)continue;seen.add(event);
  const key=r.zoneId+'|'+r.taxonId;
  if(!groups.has(key))groups.set(key,{zoneId:r.zoneId,taxonId:r.taxonId,presences:0,searchedAbsent:0,events:new Set(),days:new Set(),rows:[]});
  const g=groups.get(key);g.events.add(r.eventKey);g.days.add(r.observedOn);g.rows.push(row);if(r.outcome==='presence')g.presences++;else g.searchedAbsent++;
 }
 const pairs=[...groups.values()].map(g=>{
  const events=g.events.size,days=g.days.size;
  const eligible=events>=EXTERNAL_RULE.minEvents&&days>=EXTERNAL_RULE.minDays;
  const multiplier=communityMultiplier([{establishedContributors:events,days,sightings:g.presences,zeros:g.searchedAbsent}],cap);
  const reasons=eligible?(cap===0?['Influenza disattivata']:multiplier===1?['Presenze e ricerche a vuoto si compensano']:[]):['Servono almeno 3 eventi deduplicati su 2 giorni distinti'];
  for(const r of g.rows){r.used=eligible&&cap>0;r.status=r.used?'used':'evidence';r.multiplier=multiplier;r.reasons=reasons;}
  return {zoneId:g.zoneId,taxonId:g.taxonId,events,days,presences:g.presences,searchedAbsent:g.searchedAbsent,eligible,multiplier,priorityPercent:(multiplier-1)*100,indexDelta:0,reasons,recordIds:g.rows.map(r=>r.id)};
 });
 for(const r of dataset.excluded)rows.push({id:r.id,status:'excluded',used:false,multiplier:1,indexDelta:0,reasons:r.reasons});
 return {schemaVersion:1,generatedAt:new Date(now).toISOString(),day,since,until,policy:{...EXTERNAL_RULE,maxPercent:cap},indexDelta:0,absenceFromMissingRecords:false,groups:pairs,records:rows,totals:{records:rows.length,used:rows.filter(r=>r.used).length,evidence:rows.filter(r=>r.status==='evidence').length,excluded:rows.filter(r=>r.status==='excluded').length}};
}
// I segnali non si moltiplicano: prevale il più forte, entro il limite comune.
// In caso di parità opposta prevale la community; le due serie restano distinte.
export function combineFieldMultipliers(community=1,external=1,maxPercent=10){
 const safe=x=>Number.isFinite(x)&&x>=.9&&x<=1.1?x:1;
 const a=safe(community),b=safe(external),cap=Number.isInteger(maxPercent)&&maxPercent>=0&&maxPercent<=10?maxPercent/100:0;
 const chosen=Math.abs(b-1)>Math.abs(a-1)+1e-12?b:a;return Math.max(1-cap,Math.min(1+cap,chosen));
}
export function externalMultiplier(groups,zoneId,taxonIds){
 return (groups||[]).filter(g=>g.zoneId===zoneId&&taxonIds.includes(g.taxonId)).reduce((m,g)=>Math.abs(g.multiplier-1)>Math.abs(m-1)?g.multiplier:m,1);
}
