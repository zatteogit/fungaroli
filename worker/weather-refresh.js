// Server-owned acquisition. Browsers only read the saved forecasts.
import {weatherStorage} from './weather-storage.js';
import {cachedForecast,forecastParams} from './weather-provider.js';

export const WEATHER_REFRESH_CRON='* * * * *';
export const WEATHER_REFRESH_PERIODS={outing:30,growth:240}; // minutes, UTC slots
export const WEATHER_REFRESH_SCHEMA=`CREATE TABLE IF NOT EXISTS weather_refresh_jobs (
  cache_key TEXT PRIMARY KEY,
  last_slot INTEGER NOT NULL,
  lease_until INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  retry_at INTEGER NOT NULL DEFAULT 0
)`;
const initialized=new WeakMap();
async function init(db){
  if(!initialized.has(db))initialized.set(db,db.prepare(WEATHER_REFRESH_SCHEMA).run().catch(e=>{initialized.delete(db);throw e;}));
  await initialized.get(db);
}
// Distribute every published zone across a period, without an all-catalogue JSON
// download/compaction in a single Worker invocation. Stable ordering across isolates.
export function weatherRefreshPlan(zones,scheduledTime,periods=WEATHER_REFRESH_PERIODS){
  const minute=Math.floor(scheduledTime/60000),ordered=[...zones].sort((a,b)=>a.id.localeCompare(b.id));
  return Object.entries(periods).flatMap(([kind,period])=>ordered.flatMap((zone,i)=>
    Math.floor(i*period/ordered.length)===minute%period?[{zone,kind,slot:Math.floor(minute/period)}]:[]));
}
// D1 claims are atomic across isolates. A duplicate scheduled event cannot spend
// upstream quota again. Failures retry after 2 and 10 minutes (at most three
// attempts per slot); previous dated records remain available throughout.
export async function refreshSavedWeather(env,{zones,scheduledTime=Date.now(),now=Date.now(),fetcher=fetch,metrics,periods}={}){
  if(!env.CMS_DB)throw new Error('Mancano archivio o coordinamento della cache meteo.');
  const db=env.CMS_DB;await init(db);
  const plan=weatherRefreshPlan(zones,scheduledTime,periods),outcomes=[];
  const {results:due}=await db.prepare('SELECT cache_key,last_slot FROM weather_refresh_jobs WHERE retry_at>0 AND retry_at<=? AND attempts<3 ORDER BY retry_at LIMIT 1').bind(now).all();
  for(const job of due){
    // Retry only an exact profile/geometry that is still published.
    const retry=zones.flatMap(zone=>['outing','growth'].map(kind=>({zone,kind,slot:job.last_slot}))).find(({zone,kind})=>forecastParams([zone],kind).toString()===job.cache_key);
    if(!retry)await db.prepare('UPDATE weather_refresh_jobs SET retry_at=0 WHERE cache_key=?').bind(job.cache_key).run();
    if(retry&&!plan.some(p=>p.zone.id===retry.zone.id&&p.kind===retry.kind))plan.push(retry);
  }
  for(const {zone,kind,slot} of plan){
    const params=forecastParams([zone],kind);
    const key=params.toString(); // includes profile version, coordinates and elevations
    const claim=await db.prepare(`INSERT INTO weather_refresh_jobs(cache_key,last_slot,lease_until,attempts,retry_at) VALUES(?,?,?,1,?)
      ON CONFLICT(cache_key) DO UPDATE SET last_slot=excluded.last_slot,lease_until=excluded.lease_until,
        attempts=CASE WHEN weather_refresh_jobs.last_slot<excluded.last_slot THEN 1 ELSE weather_refresh_jobs.attempts+1 END,
        retry_at=excluded.retry_at
      WHERE weather_refresh_jobs.lease_until<=? AND (weather_refresh_jobs.last_slot<excluded.last_slot OR
        (weather_refresh_jobs.last_slot=excluded.last_slot AND weather_refresh_jobs.retry_at>0 AND weather_refresh_jobs.retry_at<=? AND weather_refresh_jobs.attempts<3))
      RETURNING attempts`).bind(key,slot,now+120000,now+120000,now,now).first();
    if(!claim)continue;
    let ok=false;
    try{
      const result=await cachedForecast(params,{zones:[zone],cache:weatherStorage(env),fetcher,now,refresh:true,strictCache:true,metrics});
      ok=result.headers.get('x-weather-cache')==='miss';
      await result.body?.cancel();
      outcomes.push({zoneId:zone.id,kind,ok});
    }catch{outcomes.push({zoneId:zone.id,kind,ok:false});}
    const retryAt=!ok&&claim.attempts<3?now+(claim.attempts===1?2:10)*60000:0;
    await db.prepare('UPDATE weather_refresh_jobs SET lease_until=0,retry_at=? WHERE cache_key=? AND last_slot=? AND attempts=?').bind(retryAt,key,slot,claim.attempts).run();
  }
  return outcomes;
}
