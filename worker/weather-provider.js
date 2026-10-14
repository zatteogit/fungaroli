import {compactGrowth} from '../js/weather-data.js';
export {compactGrowth} from '../js/weather-data.js';
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
function validate(raw,params,now,compact=false) {
  const rows=Array.isArray(raw)?raw:[raw],count=params.get('latitude').split(',').length,today=todayISO(new Date(now));
  if(rows.length!==count)throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  for(const row of rows)for(const group of ['daily','hourly']) {
    const fields=params.get(group)?.split(',');if(!fields||compact&&group==='hourly'&&params.has('daily'))continue;
    const data=row?.[group];
    if(!Array.isArray(data?.time)||!data.time.length||data.time.some(t=>typeof t!=='string')||!data.time.some(t=>t.startsWith(today))
      ||fields.some(f=>!Array.isArray(data[f])||data[f].length!==data.time.length||data[f].some(v=>v!==null&&!Number.isFinite(v))))throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  }
  if(compact&&params.has('daily'))for(const row of rows)for(const key of ['soil_moisture_3_to_9cm_mean','soil_temperature_6cm_mean'])if(!Array.isArray(row.daily[key])||row.daily[key].length!==row.daily.time.length||row.daily[key].some(v=>v!==null&&!Number.isFinite(v)))throw fail('Le medie giornaliere del suolo sono incomplete.',502);
  return rows;
}
// Il browser usa soltanto le medie giornaliere del suolo. Aggregare una volta
// evita di trasferire e serializzare oltre due MB di ore ad ogni apertura.
// Query soltanto per le zone pubblicate e i due profili dell'app: nessun proxy
// arbitrario, né possibilità di moltiplicare le richieste variando i parametri.
export async function cachedForecast(query,{zones,cache,fetcher=fetch,now=Date.now(),waitUntil,waitForFresh=false}) {
  const lat=query.get('latitude')?.split(',')[0],lon=query.get('longitude')?.split(',')[0];
  const local=zones.find(z=>String(z.lat)===lat&&String(z.lon)===lon);
  const kind=Object.keys(profiles).find(k=>{
    return [zones,...(local?[[local]]:[])].some(selection=>{
      const expected=forecastParams(selection,k);
      return [...query].length===[...expected].length&&[...expected].every(([name,value])=>query.getAll(name).length===1&&query.get(name)===value);
    });
  });
  if(!kind)throw fail('Richiesta meteo non valida per le zone pubblicate.',422);
  const params=new URLSearchParams(query);
  // Compatibilità con le pagine già aperte: inoltra la vecchia richiesta globale
  // come stream, senza elaborare il grande JSON nel Worker. Le nuove pagine
  // chiedono e mettono in cache una zona alla volta, entro il budget di CPU.
  if(params.get('latitude').split(',').length>Math.max(...zones.map(z=>z.bands.length))) {
    const r=await fetcher(`${API}?${params}`,{headers:{accept:'application/json','user-agent':'Fungaroli/1.0 (+https://fungaroli.zatteo.workers.dev)'},signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw fail('Il servizio meteo non è disponibile. Riprova tra poco.',r.status===429?429:503);
    return new Response(r.body,{headers:{'content-type':'application/json','cache-control':'no-store','x-weather-fetched-at':new Date(now).toISOString(),'x-weather-cache':'legacy-stream'}});
  }
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(params.toString()));
  const digest=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  // The query identifies the place and altitude. Midnight must not discard a
  // still-valid forecast that already covers the new day.
  const key=`weather:v3:${digest}`;
  const maxAge=kind==='growth'?86400000:3*TTL;
  let saved=null;
  try {
    saved=cache?await cache.get(key,'json'):null;
    if(!saved&&cache)saved=await cache.get(`weather:v2:${todayISO(new Date(now))}:${digest}`,'json');
  } catch { /* cache opzionale */ }
  if(saved&&(!Number.isFinite(saved.t)||now-saved.t<0||now-saved.t>maxAge))saved=null;
  if(saved)try {validate(saved.raw,params,now,kind==='growth');} catch {saved=null;}
  const response=(data,mode,refreshing=false)=>new Response(JSON.stringify(data.raw),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-weather-fetched-at':new Date(data.t).toISOString(),'x-weather-cache':mode,'x-weather-refreshing':refreshing?'1':'0','x-content-type-options':'nosniff'}});
  if(saved&&now-saved.t<TTL)return response(saved,'hit');
  if(!pending.has(key))pending.set(key,(async()=>{
    const coords=['latitude','longitude','elevation'].map(name=>params.get(name).split(','));
    const step=kind==='growth'?5:15,parts=Array.from({length:Math.ceil(coords[0].length/step)},(_,i)=>i*step),results=[];
    const controller=new AbortController(),signal=AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]);
    let next=0;
    const download=async()=>{
      while(next<parts.length){
        signal.throwIfAborted();const part=next++,start=parts[part],query=new URLSearchParams(params);
        ['latitude','longitude','elevation'].forEach((name,i)=>query.set(name,coords[i].slice(start,start+step).join(',')));
        const r=await fetcher(`${API}?${query}`,{headers:{accept:'application/json','user-agent':'Fungaroli/1.0 (+https://fungaroli.zatteo.workers.dev)'},signal});
        if(!r.ok)throw fail(r.status===429?'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.':'Il servizio meteo non è disponibile. Riprova tra poco.',r.status===429?429:503);
        const rows=validate(await r.json(),query,now);results[part]=kind==='growth'?compactGrowth(rows):rows;
      }
    };
    try {await Promise.all(Array.from({length:Math.min(3,parts.length)},download));}catch(e){controller.abort();throw e;}
    const value={t:now,raw:results.flat()};
    try {if(cache)await cache.put(key,JSON.stringify(value),{expirationTtl:maxAge/1000});} catch { /* dati validi anche senza cache */ }
    return value;
  })().finally(()=>pending.delete(key)));
  if(saved&&waitUntil&&!waitForFresh){
    waitUntil(pending.get(key).catch(()=>{}));
    return response(saved,'stale',true);
  }
  try {return response(await pending.get(key),'miss');}
  catch(e){
    if(saved)return response(saved,'stale');
    if(e?.status)throw e;
    const timeout=e?.name==='TimeoutError'||e?.name==='AbortError';
    throw Object.assign(fail(timeout?'Il servizio meteo impiega troppo tempo a rispondere. Riprova tra poco.':'Non riesco a contattare il servizio meteo. Riprova tra poco.',503),{code:timeout?'upstream-timeout':'upstream-network'});
  }
}
