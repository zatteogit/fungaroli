import {todayISO,PAST_DAYS,FORECAST_DAYS} from '../js/weather.js';
const API='https://api.open-meteo.com/v1/forecast', TTL=3600000;
const profiles={
  growth:{daily:'precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max',hourly:'soil_moisture_3_to_9cm,soil_temperature_6cm',past_days:String(PAST_DAYS),forecast_days:String(FORECAST_DAYS),timezone:'Europe/Rome'},
  outing:{hourly:'precipitation,precipitation_probability,weather_code,wind_gusts_10m,temperature_2m',forecast_days:'8',timezone:'Europe/Rome'},
};
const pending=new Map();
export function forecastParams(zones,kind) {
  const locs=kind==='growth'?zones.flatMap(z=>z.bands.map(b=>({lat:z.lat,lon:z.lon,elev:b})))
    :zones.map(z=>({lat:z.lat,lon:z.lon,elev:z.bands[Math.floor(z.bands.length/2)]}));
  return new URLSearchParams({latitude:locs.map(l=>l.lat).join(','),longitude:locs.map(l=>l.lon).join(','),elevation:locs.map(l=>l.elev).join(','),...profiles[kind]});
}
const fail=(message,status)=>Object.assign(new Error(message),{status});
function validate(raw,params,now) {
  const rows=Array.isArray(raw)?raw:[raw],count=params.get('latitude').split(',').length;
  if(rows.length!==count)throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  for(const row of rows)for(const group of ['daily','hourly']) {
    const fields=params.get(group)?.split(',');if(!fields)continue;
    const data=row?.[group];
    if(!Array.isArray(data?.time)||!data.time.length||data.time.some(t=>typeof t!=='string')||!data.time.some(t=>t.startsWith(todayISO(new Date(now))))
      ||fields.some(f=>!Array.isArray(data[f])||data[f].length!==data.time.length||data[f].some(v=>v!==null&&!Number.isFinite(v))))throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  }
  return rows;
}
// Query soltanto per le zone pubblicate e i due profili dell'app: nessun proxy
// arbitrario, né possibilità di moltiplicare le richieste variando i parametri.
export async function cachedForecast(query,{zones,cache,fetcher=fetch,now=Date.now()}) {
  const kind=Object.keys(profiles).find(k=>{
    const expected=forecastParams(zones,k);
    return [...query].length===[...expected].length&&[...expected].every(([name,value])=>query.getAll(name).length===1&&query.get(name)===value);
  });
  if(!kind)throw fail('Richiesta meteo non valida per le zone pubblicate.',422);
  const params=forecastParams(zones,kind),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(params.toString()));
  const key=`weather:v1:${todayISO(new Date(now))}:${Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}`;
  const maxAge=kind==='growth'?86400000:3*TTL;
  let saved=null;
  try {saved=cache?await cache.get(key,'json'):null;} catch { /* cache opzionale */ }
  if(saved&&(!Number.isFinite(saved.t)||now-saved.t<0||now-saved.t>maxAge))saved=null;
  if(saved)try {validate(saved.raw,params,now);} catch {saved=null;}
  const response=(data,mode)=>new Response(JSON.stringify(data.raw),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-weather-fetched-at':new Date(data.t).toISOString(),'x-weather-cache':mode,'x-content-type-options':'nosniff'}});
  if(saved&&now-saved.t<TTL)return response(saved,'hit');
  if(!pending.has(key))pending.set(key,(async()=>{
    const r=await fetcher(`${API}?${params}`,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw fail(r.status===429?'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.':'Il servizio meteo non è disponibile. Riprova tra poco.',r.status===429?429:503);
    const raw=validate(await r.json(),params,now),value={t:now,raw};
    try {if(cache)await cache.put(key,JSON.stringify(value),{expirationTtl:maxAge/1000});} catch { /* dati validi anche senza cache */ }
    return value;
  })().finally(()=>pending.delete(key)));
  try {return response(await pending.get(key),'miss');}
  catch(e){if(saved)return response(saved,'stale');throw e?.status?e:fail('Il servizio meteo impiega troppo tempo a rispondere. Riprova tra poco.',503);}
}
