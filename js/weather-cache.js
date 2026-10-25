import {compactGrowth} from './weather-data.js';

export const WEATHER_FRESH_MS=3600000;
export const GROWTH_FRESH_MS=4*WEATHER_FRESH_MS;
export const WEATHER_SYNC_MS=5*60000;
export const WEATHER_LOCAL_RETENTION_MS=6*86400000;
const key=kind=>`fungaroli:${kind==='growth'?'weather':'outing'}:zones:v3`;
export const zoneWeatherSignature=(z,kind='growth')=>`${z.id}|${z.lat},${z.lon}|${(kind==='growth'?z.bands:[z.bands[Math.floor(z.bands.length/2)]]).join(',')}`;
const read=kind=>{try{return JSON.parse(localStorage.getItem(key(kind))||'{}');}catch{return {};}};
// I campi obbligatori sono quelli che servono all'indice. Le medie del suolo, compresa quella
// tra 9 e 27 cm aggiunta dopo la v78, sono facoltative: le copie salvate prima restano valide
// con la stessa chiave e si rinnovano alla scadenza normale, senza essere scartate.
export function validWeatherRows(raw,count,kind='growth'){
  if(!Array.isArray(raw)||raw.length!==count)return false;
  const group=kind==='growth'?'daily':'hourly';
  const required=kind==='growth'?['precipitation_sum','temperature_2m_mean','temperature_2m_min','temperature_2m_max']:['precipitation','precipitation_probability','weather_code','wind_gusts_10m','temperature_2m'];
  return raw.every(r=>required.every(f=>Array.isArray(r?.[group]?.[f]))&&Array.isArray(r?.[group]?.time)&&r[group].time.length>0&&r[group].time.every(t=>typeof t==='string')&&Object.entries(r[group]).every(([name,values])=>name==='time'||Array.isArray(values)&&values.length===r[group].time.length&&values.every(v=>v===null||Number.isFinite(v))));
}
export function cachedZoneWeather(z,kind='growth',now=Date.now()){
  const record=read(kind)?.[zoneWeatherSignature(z,kind)];
  if(!record||!Number.isFinite(record.t)||record.t>now||now-record.t>WEATHER_LOCAL_RETENTION_MS||!validWeatherRows(record.raw,kind==='growth'?z.bands.length:1,kind))return null;
  return {...record,local:true};
}
export function saveZoneWeather(z,kind,record,now=Date.now()){
  if(!Number.isFinite(record.t)||record.t>now||!validWeatherRows(record.raw,kind==='growth'?z.bands.length:1,kind))return;
  try{
    const data=read(kind);
    if(data[zoneWeatherSignature(z,kind)]?.t>record.t)return;
    for(const id of Object.keys(data))if(!Number.isFinite(data[id]?.t)||now-data[id].t>WEATHER_LOCAL_RETENTION_MS)delete data[id];
    data[zoneWeatherSignature(z,kind)]={t:record.t,raw:kind==='growth'?compactGrowth(record.raw):record.raw,stale:!!record.stale};
    localStorage.setItem(key(kind),JSON.stringify(data));
  }catch{/* Storage can be unavailable or full; never discard live data. */}
}

// Read existing whole-catalog copies once to bootstrap the per-zone cache. The legacy
// key is dropped once migrated or expired: it would otherwise be parsed on every start
// and keep a second copy of the catalogue in the storage quota.
const dropLegacy=k=>{try{localStorage.removeItem(k);}catch{/* storage unavailable */}};
export function migrateGrowthCache(zones,now=Date.now()){
  try{
    const c=JSON.parse(localStorage.getItem('fungaroli:weather:v2')||'null');
    const sig=zones.flatMap(z=>z.bands.map(b=>`${z.lat},${z.lon},${b}`)).join(';');
    if(c&&(!Number.isFinite(c.t)||now-c.t>WEATHER_LOCAL_RETENTION_MS))return dropLegacy('fungaroli:weather:v2');
    if(!c?.sig||c.sig.slice(c.sig.indexOf('|')+1)!==sig||c.t>now)return;
    let start=0;
    for(const z of zones){if(!cachedZoneWeather(z,'growth',now))saveZoneWeather(z,'growth',{t:c.t,raw:c.data?.slice(start,start+z.bands.length)},now);start+=z.bands.length;}
    dropLegacy('fungaroli:weather:v2');
  }catch{/* Invalid legacy data must not prevent startup. */}
}
export function migrateOutingCache(zones,now=Date.now()){
  try{
    const c=JSON.parse(localStorage.getItem('fungaroli:outing:v2')||'null');
    const sig=zones.map(z=>`${z.lat},${z.lon},${z.bands[Math.floor(z.bands.length/2)]}`).join(';');
    if(c&&(!Number.isFinite(c.t)||now-c.t>WEATHER_LOCAL_RETENTION_MS))return dropLegacy('fungaroli:outing:v2');
    if(!c?.sig||c.sig.slice(c.sig.indexOf('|')+1)!==sig||c.t>now)return;
    for(const z of zones){const s=c.data?.[z.id];if(!s||cachedZoneWeather(z,'outing',now))continue;
      saveZoneWeather(z,'outing',{t:Date.parse(s.fetchedAt),raw:[{hourly:{time:s.time,precipitation:s.p,precipitation_probability:s.pp,weather_code:s.wc,wind_gusts_10m:s.g,temperature_2m:s.t}}]},now);
    }
    dropLegacy('fungaroli:outing:v2');
  }catch{/* Invalid legacy data must not prevent startup. */}
}
