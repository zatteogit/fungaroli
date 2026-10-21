import {pointKey} from '../js/travel-model.js';
import {routeMatrix} from './travel-provider.js';
const FRESH=6*3600e3,RETAIN=30*86400e3;
const valid=r=>Number.isFinite(r?.minutes)&&r.minutes>=0&&Number.isFinite(r?.km)&&r.km>=0&&Number.isFinite(r?.calculatedAt);
// Each private origin/destination has its own cache entry: card ordering and batch size don't invalidate it.
export async function cachedRoutes({base,targets,owner,origin,cache,hash,fetcher=fetch,now=Date.now()}){
 const unique=[...new Map(targets.map(p=>[pointKey(p),p])).values()];
 const slots=await Promise.all(unique.map(async target=>{
  const digest=await hash(JSON.stringify([owner,pointKey(base),pointKey(target)]));
  const key=new Request(new URL('/api/internal/travel-v2/'+digest,origin));
  let saved;try{saved=cache&&await (await cache.match(key))?.json();}catch{}
  if(!valid(saved)||now-saved.calculatedAt>RETAIN||saved.calculatedAt>now)saved=null;
  return{target,key,saved};
 }));
 const missing=slots.filter(s=>!s.saved||now-s.saved.calculatedAt>=FRESH);
 if(missing.length){
  try{
   const calculated=await routeMatrix(base,missing.map(s=>s.target),fetcher);
   await Promise.all(missing.map(async slot=>{
    const r=calculated.find(r=>r.key===pointKey(slot.target));
    if(!Number.isFinite(r?.minutes)||!Number.isFinite(r?.km))return;
    slot.saved={...r,calculatedAt:now};
    try{if(cache)await cache.put(slot.key,new Response(JSON.stringify(slot.saved),{headers:{'content-type':'application/json','cache-control':`max-age=${RETAIN/1000}`}}));}catch{}
   }));
  }catch(e){if(!slots.some(s=>s.saved))throw e;}
 }
 return targets.map(p=>{const saved=slots.find(s=>pointKey(s.target)===pointKey(p)).saved;return saved?{...saved,stale:now-saved.calculatedAt>=FRESH}:{key:pointKey(p),minutes:null,km:null};});
}
