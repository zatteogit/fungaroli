// Public forecast state survives partial responses and unavailable device storage.
// Timestamps belong to provider acquisitions, never to a cache read.
const stamp=(value,growth)=>Date.parse(growth?value?.[0]?.source?.fetchedAt:value?.fetchedAt);
function merge(previous,incoming,growth){
  const result={...previous};
  for(const [id,value] of Object.entries(incoming||{})){
    const old=stamp(result[id],growth),next=stamp(value,growth);
    if(Number.isFinite(next)&&(!Number.isFinite(old)||next>=old))result[id]=value;
  }
  return result;
}
export const mergeGrowth=(previous,incoming)=>merge(previous,incoming,true);
export const mergeOuting=(previous,incoming)=>merge(previous,incoming,false);

// A retained in-memory copy must age even when both disk and network fail.
export function rebaseGrowth(series,today,now=Date.now(),maxAge=24*3600000){
  return Object.fromEntries(Object.entries(series||{}).map(([id,rows])=>[id,rows.map(s=>{
    const t=Date.parse(s.source?.fetchedAt),expired=!Number.isFinite(t)||now<t||now-t>maxAge;
    const todayIndex=s.dates.indexOf(today);
    return s.todayIndex===todayIndex&&s.source?.expired===expired?s:{...s,todayIndex,source:{...s.source,expired}};
  })]));
}
