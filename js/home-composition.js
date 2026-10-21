import {CLASSES} from './model.js';
const favourable=CLASSES.find(c=>c.shortLabel==='Buone').min;
const fair=CLASSES.find(c=>c.shortLabel==='Discrete').min;
// Scores already contain the weather factor. This layer only controls presentation.
export function composeHome(candidates,{fungi=true,modeled=true,loading=false,community=false}={}){
 const timely=candidates.filter(c=>c.timely!==false);
 const valid=c=>c.weather?.available&&['ok','attenzione'].includes(c.weather.level);
 const ready=timely.filter(c=>valid(c)&&c.weather.level==='ok'&&(!fungi||Number.isFinite(c.s)&&c.s>=favourable));
 const review=timely.filter(c=>valid(c)&&!ready.includes(c)&&(!fungi||Number.isFinite(c.s)&&c.s>=fair));
 let state='low';
 if(community)state='community';
 else if(!candidates.length)state=loading?'loading':!modeled&&fungi?'unsupported':'filters';
 else if(!timely.length)state='late';
 else if(ready.length)state='ready';
 else if(review.length)state='review';
 else if(timely.some(c=>!c.weather?.available))state=loading?'loading':'unknown';
 else if(fungi&&!modeled)state='unsupported';
 else if(timely.every(c=>c.weather.level==='sconsigliata'))state='weather';
 else if(fungi&&timely.some(c=>!Number.isFinite(c.s)))state=loading?'loading':'unknown';
 return {state,ready,review,partial:ready.length>0&&timely.some(c=>!c.weather?.available||fungi&&!Number.isFinite(c.s))};
}
export function nextHomeOpportunity(candidates,{after=0,fungi=true}={}){
 const eligible=candidates.filter(c=>Number.isInteger(c.o)&&c.o>after&&c.o<=7&&c.timely!==false);
 return composeHome(eligible,{fungi}).ready.sort((a,b)=>a.o-b.o||((b.r??0)-(a.r??0)))[0]||null;
}
