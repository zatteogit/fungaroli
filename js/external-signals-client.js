import {externalMultiplier,combineFieldMultipliers as combine} from './external-signal.js';
let snapshot=null;
export function externalForecastMultiplier(zoneId,taxonIds,day,now=Date.now()){
 if(!snapshot||now-Date.parse(snapshot.generatedAt)>10*60e3||now<Date.parse(snapshot.generatedAt))return 1;
 return externalMultiplier(snapshot.days.find(d=>d.day===day)?.groups,zoneId,taxonIds);
}
export function combineFieldMultipliers(community,external){const fresh=snapshot&&Date.now()-Date.parse(snapshot.generatedAt)<=10*60e3&&Date.now()>=Date.parse(snapshot.generatedAt);return combine(community,external,fresh?snapshot.policy?.maxPercent:10);}
export function initExternalSignals(onUpdate){
 let revision=0;
 const refresh=async()=>{
  const n=++revision;
  try{const response=await fetch('/api/forecast/v1/external-signals',{cache:'no-store',credentials:'omit'});if(!response.ok)throw new Error('unavailable');const next=await response.json();if(next.schemaVersion!==1||!Array.isArray(next.days)||!Number.isFinite(Date.parse(next.generatedAt)))throw new Error('invalid');if(n!==revision)return;snapshot=next;}
  catch{if(n!==revision)return;snapshot=null;}
  onUpdate?.();
 };
 if(globalThis.FUNGAROLI_DATA||globalThis.FUNGAROLI_REVIEW)return;
 refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh();},120000);
}
