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
const usable=(c,fungi)=>!!c.weather?.available&&(!fungi||Number.isFinite(c.s));
// Prossima occasione con lo stesso criterio della proposta principale.
// reason: 'found', 'none' (dati valutabili ma nessuna data favorevole) o 'data' (niente da valutare).
export function nextHomeOpportunity(candidates,{after=0,fungi=true,horizon=7}={}){
 const eligible=candidates.filter(c=>Number.isInteger(c.o)&&c.o>after&&c.o<=horizon&&c.timely!==false);
 const next=composeHome(eligible,{fungi}).ready.sort((a,b)=>a.o-b.o||((b.r??0)-(a.r??0)))[0]||null;
 if(next)return {next,reason:'found',partial:false};
 const known=eligible.filter(c=>usable(c,fungi)).length;
 return {next:null,reason:eligible.length&&!known?'data':'none',partial:known>0&&known<eligible.length};
}
// Ultima partenza utile fra le proposte di oggi: il limite più tardo, non quello della prima zona.
export function latestDeadline(deadlines){
 return deadlines.filter(d=>d instanceof Date&&Number.isFinite(d.getTime())).reduce((a,b)=>!a||b>a?b:a,null);
}
// Giorno della home senza una scelta esplicita: «Questa settimana» (null), con la copertina (decisione di Matteo
// del 24/10, supera il passaggio automatico a domani del 21/10). Una scelta manuale resta quella dell'utente.
export function automaticHomeDay({manual=false,current=null}={}){
 return manual?{day:current,auto:false}:{day:null,auto:false};
}
// A mezzanotte il giorno scelto resta la stessa data: l'offset scende dei giorni trascorsi.
export function shiftChosenDay(day,elapsed){
 if(day==null||!(elapsed>0))return {day,manual:true};
 return day-elapsed>=0?{day:day-elapsed,manual:true}:{day:null,manual:false};
}
