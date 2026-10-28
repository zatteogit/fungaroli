import {compactGrowth,GROWTH_DAILY,GROWTH_HOURLY,LEGACY_GROWTH_DAILY,LEGACY_GROWTH_HOURLY} from '../js/weather-data.js';
import {WEATHER_LOCAL_RETENTION_MS,GROWTH_FRESH_MS} from '../js/weather-cache.js';
export {compactGrowth} from '../js/weather-data.js';
import {todayISO,PAST_DAYS,FORECAST_DAYS} from '../js/weather.js';
const API='https://api.open-meteo.com/v1/forecast', TTL=3600000;
const growthProfile=(daily,hourly)=>({daily,hourly,past_days:String(PAST_DAYS),forecast_days:String(FORECAST_DAYS),timezone:'Europe/Rome'});
const profiles={
  growth:growthProfile(GROWTH_DAILY,GROWTH_HOURLY),
  // Pagine aperte con la versione in produzione (senza strato 9–27 cm e senza ET₀): stessa elaborazione e
  // stessa cache per query, con i campi di allora. Senza questo profilo riceverebbero 422 fino al ricaricamento.
  growthLegacy:growthProfile(LEGACY_GROWTH_DAILY,LEGACY_GROWTH_HOURLY),
  outing:{hourly:'precipitation,precipitation_probability,weather_code,wind_gusts_10m,temperature_2m',forecast_days:'8',timezone:'Europe/Rome'},
};
const pending=new Map();
export function forecastParams(zones,kind) {
  const locs=kind!=='outing'?zones.flatMap(z=>z.bands.map(b=>({lat:z.lat,lon:z.lon,elev:b})))
    :zones.map(z=>({lat:z.lat,lon:z.lon,elev:z.bands[Math.floor(z.bands.length/2)]}));
  return new URLSearchParams({latitude:locs.map(l=>l.lat).join(','),longitude:locs.map(l=>l.lon).join(','),elevation:locs.map(l=>l.elev).join(','),...profiles[kind]});
}
const fail=(message,status)=>Object.assign(new Error(message),{status});
// Peso stimato di una richiesta secondo la regola pubblicata da Open-Meteo (oltre 10
// variabili o oltre 14 giorni per punto la chiamata vale di più). Che ogni punto di una
// richiesta multipla conti come una chiamata è un'ipotesi prudente: i documenti non lo dicono.
export function requestWeight(params){
  const variables=['daily','hourly'].reduce((n,g)=>n+(params.get(g)?.split(',').filter(Boolean).length||0),0);
  const days=(Number(params.get('past_days'))||0)+(Number(params.get('forecast_days'))||7);
  const locations=params.get('latitude')?.split(',').length||0;
  return {locations,weighted:locations*Math.max(1,variables/10)*Math.max(1,days/14)};
}
function validate(raw,params,now,compact=false,requireToday=true) {
  const rows=Array.isArray(raw)?raw:[raw],count=params.get('latitude').split(',').length,today=todayISO(new Date(now));
  if(rows.length!==count)throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  for(const row of rows)for(const group of ['daily','hourly']) {
    const fields=params.get(group)?.split(',');if(!fields||compact&&group==='hourly'&&params.has('daily'))continue;
    const data=row?.[group];
    if(!Array.isArray(data?.time)||!data.time.length||data.time.some(t=>typeof t!=='string')||requireToday&&!data.time.some(t=>t.startsWith(today))
      ||fields.some(f=>!Array.isArray(data[f])||data[f].length!==data.time.length||data[f].some(v=>v!==null&&!Number.isFinite(v))))throw fail('Il servizio meteo ha restituito dati incompleti.',502);
  }
  // Le medie richieste sono quelle degli strati orari della query: una copia salvata con la query
  // precedente si valida con quella query (vedi legacyParams in cachedForecast).
  if(compact&&params.has('daily'))for(const row of rows)for(const key of params.get('hourly').split(',').map(f=>`${f}_mean`))if(!Array.isArray(row.daily[key])||row.daily[key].length!==row.daily.time.length||row.daily[key].some(v=>v!==null&&!Number.isFinite(v)))throw fail('Le medie giornaliere del suolo sono incomplete.',502);
  return rows;
}
// Il browser usa soltanto le medie giornaliere del suolo. Aggregare una volta
// evita di trasferire e serializzare oltre due MB di ore ad ogni apertura.
// Query soltanto per le zone pubblicate e i due profili dell'app: nessun proxy
// arbitrario, né possibilità di moltiplicare le richieste variando i parametri.
export async function cachedForecast(query,{zones,cache,fetcher=fetch,now=Date.now(),waitUntil,waitForFresh=false,cacheOnly=false,refresh=false,strictCache=false,metrics}) {
  const lat=query.get('latitude')?.split(',')[0],lon=query.get('longitude')?.split(',')[0];
  const local=zones.find(z=>String(z.lat)===lat&&String(z.lon)===lon);
  const kind=Object.keys(profiles).find(k=>{
    return [zones,...(local?[[local]]:[])].some(selection=>{
      const expected=forecastParams(selection,k);
      return [...query].length===[...expected].length&&[...expected].every(([name,value])=>query.getAll(name).length===1&&query.get(name)===value);
    });
  });
  if(!kind)throw fail('Richiesta meteo non valida per le zone pubblicate.',422);
  const growth=kind!=='outing',freshMs=growth?GROWTH_FRESH_MS:TTL;
  const note=(event,extra={})=>{try{metrics?.({profile:kind,event,...extra});}catch{/* metriche facoltative */}};
  // Una chiamata a Open-Meteo, misurata fino ai dati letti: esito, durata e peso stimato.
  const upstream=async(url,sent,read)=>{
    const started=Date.now();let outcome='upstream:network';
    try{
      const r=await fetcher(url,{headers:{accept:'application/json','user-agent':'Fungaroli/1.0 (+https://fungaroli.zatteo.workers.dev)'},signal:read.signal});
      if(!r.ok){outcome=r.status===429?'upstream:429':'upstream:error';throw fail(r.status===429?'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.':'Il servizio meteo non è disponibile. Riprova tra poco.',r.status===429?429:503);}
      outcome='upstream:invalid';const value=await read(r);outcome='upstream:ok';return value;
    }catch(e){if(outcome==='upstream:network'&&e?.name==='TimeoutError')outcome='upstream:timeout';else if(outcome==='upstream:network'&&e?.name==='AbortError')outcome='upstream:aborted';throw e;}
    finally{note(outcome,{ms:Date.now()-started,...requestWeight(sent)});}
  };
  const params=new URLSearchParams(query);
  // Compatibilità con le pagine già aperte: inoltra la vecchia richiesta globale
  // come stream, senza elaborare il grande JSON nel Worker. Le nuove pagine
  // chiedono e mettono in cache una zona alla volta, entro il budget di CPU.
  if(params.get('latitude').split(',').length>Math.max(...zones.map(z=>z.bands.length))) {
    if(cacheOnly)throw fail('Ricarica l’app per ricevere il meteo salvato per zona.',409);
    const legacy=Object.assign(r=>r,{signal:AbortSignal.timeout(15000)});
    let r;try{r=await upstream(`${API}?${params}`,params,legacy);}catch(e){note('served:error');throw e.status===429?e:fail('Il servizio meteo non è disponibile. Riprova tra poco.',503);}
    note('served:legacy');
    return new Response(r.body,{headers:{'content-type':'application/json','cache-control':'no-store','x-weather-fetched-at':new Date(now).toISOString(),'x-weather-cache':'legacy-stream'}});
  }
  const sha=async p=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p.toString()))),b=>b.toString(16).padStart(2,'0')).join('');
  const digest=await sha(params);
  // The query identifies the place and altitude. Midnight must not discard a
  // still-valid forecast that already covers the new day.
  const key=`weather:v3:${digest}`;
  // Retention is not forecast validity: return dated data for consultation even
  // after its scientific age limit; clients independently suppress current scores.
  const maxAge=WEATHER_LOCAL_RETENTION_MS;
  // Una query nuova di crescita (con lo strato 9–27 cm e l'ET₀) ha un'altra chiave. La copia salvata con la
  // query precedente, stesso luogo e stesse quote, resta usabile come copia datata: viene restituita
  // subito ma mai come «hit», così l'aggiornamento parte e porta i campi nuovi (nel browser: serie di null).
  let legacyParams=null;
  if(kind==='growth'||kind==='growthLegacy'){
    legacyParams=new URLSearchParams(params);
    legacyParams.set('daily',kind==='growth'?LEGACY_GROWTH_DAILY:GROWTH_DAILY);
    legacyParams.set('hourly',kind==='growth'?LEGACY_GROWTH_HOURLY:GROWTH_HOURLY);
  }
  let saved=null,savedParams=params,legacy=false;
  try {
    saved=cache?await cache.get(key,'json'):null;
    if(!saved&&cache)saved=await cache.get(`weather:v2:${todayISO(new Date(now))}:${digest}`,'json');
    if(!saved&&cache&&legacyParams){saved=await cache.get(`weather:v3:${await sha(legacyParams)}`,'json');if(saved){legacy=kind==='growth';savedParams=legacyParams;}}
  } catch { /* cache opzionale */ }
  if(saved&&(!Number.isFinite(saved.t)||now-saved.t<0||now-saved.t>maxAge))saved=null;
  if(saved)try {validate(saved.raw,savedParams,now,growth,false);} catch {saved=null;}
  const response=(data,mode,refreshing=false)=>(note('served:'+(mode==='stale'&&!refreshing&&!cacheOnly?'stale-fallback':mode)),new Response(JSON.stringify(data.raw),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-weather-fetched-at':new Date(data.t).toISOString(),'x-weather-cache':mode,'x-weather-refreshing':refreshing?'1':'0','x-content-type-options':'nosniff'}}));
  // Public delivery never starts provider work, including requests from old tabs.
  if(cacheOnly){
    if(saved)return response(saved,!legacy&&now-saved.t<freshMs?'hit':'stale');
    note('served:error');
    throw Object.assign(fail('Non è disponibile una copia meteo per questa zona. Riprova tra poco.',503),{code:'cache-warming'});
  }
  if(!refresh&&saved&&!legacy&&now-saved.t<freshMs)return response(saved,'hit');
  if(!pending.has(key))pending.set(key,(async()=>{
    const coords=['latitude','longitude','elevation'].map(name=>params.get(name).split(','));
    const step=growth?5:15,parts=Array.from({length:Math.ceil(coords[0].length/step)},(_,i)=>i*step),results=[];
    const controller=new AbortController(),signal=AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]);
    let next=0;
    const download=async()=>{
      while(next<parts.length){
        signal.throwIfAborted();const part=next++,start=parts[part],query=new URLSearchParams(params);
        ['latitude','longitude','elevation'].forEach((name,i)=>query.set(name,coords[i].slice(start,start+step).join(',')));
        const rows=await upstream(`${API}?${query}`,query,Object.assign(async r=>validate(await r.json(),query,now),{signal}));
        results[part]=growth?compactGrowth(rows):rows;
      }
    };
    try {await Promise.all(Array.from({length:Math.min(3,parts.length)},download));}catch(e){controller.abort();throw e;}
    const value={t:now,raw:results.flat()};
    try {if(cache)await cache.put(key,JSON.stringify(value),{expirationTtl:maxAge/1000});} catch(e) { if(strictCache)throw e; /* dati validi anche senza cache */ }
    return value;
  })().finally(()=>pending.delete(key)));
  if(saved&&waitUntil&&!waitForFresh){
    waitUntil(pending.get(key).catch(()=>{}));
    return response(saved,'stale',true);
  }
  try {return response(await pending.get(key),'miss');}
  catch(e){
    if(saved)return response(saved,'stale');
    note('served:error');
    if(e?.status)throw e;
    const timeout=e?.name==='TimeoutError'||e?.name==='AbortError';
    throw Object.assign(fail(timeout?'Il servizio meteo impiega troppo tempo a rispondere. Riprova tra poco.':'Non riesco a contattare il servizio meteo. Riprova tra poco.',503),{code:timeout?'upstream-timeout':'upstream-network'});
  }
}
