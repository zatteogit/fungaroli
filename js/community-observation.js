// Osservazioni dichiarate: separate dai report fungini e dalla taratura automatica.
export const PRESENCE=[['unknown','Non indicato'],['observed','Osservato'],['searched_absent','Cercato, non osservato']];
export const HABITATS=[['unknown','Non indicato'],['broadleaf','Bosco di latifoglie'],['conifer','Conifere'],['mixed','Bosco misto'],['grassland','Prato o pascolo'],['other','Altro ambiente']];
export function normalizeFieldRecord(record){
 const fail=()=>{throw new Error('Osservazione non valida: controlla presenza, quantità e sforzo.');};
 if(!record||!PRESENCE.some(([k])=>k===record.presence)||!HABITATS.some(([k])=>k===record.habitat))fail();
 const number=(key,min,max)=>{const v=record[key];if(v==null||v==='')return null;if(!Number.isInteger(v)||v<min||v>max)fail();return v;};
 const amount=number('amount',0,3);if(record.presence==='searched_absent'&&amount!=null&&amount!==0||record.presence==='observed'&&amount===0||record.presence==='unknown'&&amount!=null)fail();
 return {protocolVersion:'fronda-field-note-v1',presence:record.presence,amount:record.presence==='searched_absent'?0:amount,minutes:number('minutes',1,1440),people:number('people',1,100),elevation:number('elevation',0,4500),habitat:record.habitat,identification:'unreviewed'};
}
export function sharedObservation(entry,{now=Date.now(),references,zoneIds}={}){
 const record=normalizeFieldRecord(entry.record),reference=entry.reference;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const prefix={fungo:/^#\/(fungo|specie|commestibile)\//,botanica:/^#\/pianta\//,albero:/^#\/albero\//}[entry.category];
 if(entry.kind!=='note'||!prefix||!reference||!prefix.test(reference.href)||references&&!references.has(reference.href)||!entry.zoneId||zoneIds&&!zoneIds.has(entry.zoneId)||entry.date>today||record.presence==='unknown')throw new Error('Per condividere indica specie, zona, giorno e osservazione.');
 return {category:entry.category,taxonId:reference.href.split('/').at(-1),reference:reference.href,zoneId:entry.zoneId,day:entry.date,...record,phases:entry.observation?.phases?.map(p=>({code:p.code,status:p.status}))||[],availability:entry.observation?.availability||'unknown',validation:'unreviewed'};
}
