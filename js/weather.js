// Dati meteo da Open-Meteo (gratuito, senza chiave, CORS abilitato).
// past_days: rianalisi/previsioni a breve per i giorni passati (non stazioni a terra).
// Il parametro `elevation` applica la correzione di quota (gradiente termico).

import {fetchForecast} from './weather-request.js';
import {cachedZoneWeather,saveZoneWeather,migrateGrowthCache,validWeatherRows,WEATHER_FRESH_MS} from './weather-cache.js';
import {compactGrowth,GROWTH_DAILY,GROWTH_HOURLY,soilFraction} from './weather-data.js';
export const PAST_DAYS = 62;
export const FORECAST_DAYS = 8;
const CACHE_TTL_MS = 60 * 60 * 1000;
export const MAX_FORECAST_AGE_MS = 24 * 60 * 60 * 1000;
const finite = (v) => Number.isFinite(v) ? v : null;

export function toDaily(loc, todayStr, source = {}) {
  const d = loc.daily;
  const h = loc.hourly || {};
  const byDay = {};
  (h.time || []).forEach((t, k) => {
    const day = t.slice(0, 10);
    const b = (byDay[day] ||= { m: 0, n: 0, st: 0, ns: 0, md: 0, nd: 0 });
    const sm = h.soil_moisture_3_to_9cm?.[k];
    const st = h.soil_temperature_6cm?.[k];
    const sd = h.soil_moisture_9_to_27cm?.[k];
    if (soilFraction(sm) !== null) { b.m += sm; b.n++; }
    if (Number.isFinite(st)) { b.st += st; b.ns++; }
    if (soilFraction(sd) !== null) { b.md += sd; b.nd++; }
  });
  const dates = d.time;
  return {
    dates,
    p: dates.map((_, k) => d.precipitation_sum?.[k] >= 0 ? finite(d.precipitation_sum[k]) : null),
    tmean: dates.map((_, k) => finite(d.temperature_2m_mean?.[k])),
    tmin: dates.map((_, k) => finite(d.temperature_2m_min?.[k])),
    tmax: dates.map((_, k) => finite(d.temperature_2m_max?.[k])),
    // la media compatta (Worker, copie locali) ha lo stesso controllo 0–1 della via oraria: fuori intervallo vale null
    soilm: dates.map((x,k) => (byDay[x]?.n >= 24 ? byDay[x].m / byDay[x].n : soilFraction(d.soil_moisture_3_to_9cm_mean?.[k]))),
    soilt: dates.map((x,k) => (byDay[x]?.ns >= 24 ? byDay[x].st / byDay[x].ns : finite(d.soil_temperature_6cm_mean?.[k]))),
    // Umidità del suolo tra 9 e 27 cm: solo registrata (grafici futuri, previsioni datate), non entra nell'indice.
    // Le copie salvate prima di questo campo non lo hanno: la serie resta di null, cioè dato mancante.
    soilm9to27: dates.map((x,k) => (byDay[x]?.nd >= 24 ? byDay[x].md / byDay[x].nd : soilFraction(d.soil_moisture_9_to_27cm_mean?.[k]))),
    // ET₀ di riferimento FAO-56 (Open-Meteo et0_fao_evapotranspiration, mm/giorno, CC BY 4.0): solo registrata
    // (previsioni datate del Taccuino), non entra nell'indice. Le copie senza il campo danno una serie di null.
    et0: dates.map((_, k) => d.et0_fao_evapotranspiration?.[k] >= 0 ? finite(d.et0_fao_evapotranspiration[k]) : null),
    todayIndex: dates.indexOf(todayStr),
    issuedIndex: dates.indexOf(source.fetchedAt ? todayISO(new Date(source.fetchedAt)) : todayStr),
    source: { ...source, latitude: loc.latitude, longitude: loc.longitude, elevation: loc.elevation,
      dailyUnits: loc.daily_units || {}, hourlyUnits: loc.hourly_units || {}, models: 'Open-Meteo auto' },
  };
}

export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Rome' }).format(d);
}

// Ritorna { [zoneId]: [serie per ciascuna fascia di quota] } e l'ora di aggiornamento.
export async function loadWeather(zones, { force = false,onProgress,onUpdate,signal } = {}) {
  // versione Artifact: serie gia' calcolate e incorporate (la pagina non puo' chiamare Open-Meteo)
  // (anche la copia di revisione su claude.ai: FUNGAROLI_REVIEW, solo meteo e mappa di base)
  const snap = globalThis.FUNGAROLI_DATA?.weather || globalThis.FUNGAROLI_REVIEW?.weather;
  if (snap) {
    const today = todayISO();
    const fetchedAt = new Date(snap.fetchedAt);
    const age = Date.now() - fetchedAt.getTime();
    let stale = !Number.isFinite(age) || age > CACHE_TTL_MS;
    for (const zid in snap.series) {
      for (const s of snap.series[zid]) {
        const i = s.dates.indexOf(today);
        s.todayIndex = i;
        // istantanee costruite prima di questi strati: serie di null (dato mancante), mai assenti
        for (const k of ['soilt', 'soilm9to27', 'et0']) if (!Array.isArray(s[k])) s[k] = s.dates.map(() => null);
        if (i < 0) stale = true;
        s.issuedIndex ??= Number.isFinite(age) ? s.dates.indexOf(todayISO(fetchedAt)) : -1;
        s.source = { ...s.source, fetchedAt: snap.fetchedAt,
          expired: !Number.isFinite(age) || age > MAX_FORECAST_AGE_MS, snapshot: true };
      }
    }
    return { series: snap.series, fetchedAt, snapshot: true, stale };
  }

  migrateGrowthCache(zones);
  const today=todayISO(),records=new Map();
  for(const z of zones){const saved=cachedZoneWeather(z);if(saved)records.set(z.id,saved);}
  const snapshot=()=>{
    const out={},times=[];
    for(const z of zones){const r=records.get(z.id);if(!r)continue;
      const age=Date.now()-r.t,expired=!Number.isFinite(age)||age<0||age>MAX_FORECAST_AGE_MS;
      out[z.id]=r.raw.map((raw,bi)=>toDaily(raw,today,{fetchedAt:new Date(r.t).toISOString(),expired,cached:!!r.local||!!r.stale,requested:{latitude:z.lat,longitude:z.lon,elevation:z.bands[bi]}}));times.push(r.t);
    }
    const missingZones=zones.filter(z=>!out[z.id]).map(z=>z.id);
    return {series:out,fetchedAt:new Date(Math.min(...times)),cached:[...records.values()].some(r=>r.local||r.stale),stale:[...records.values()].some(r=>r.stale||Date.now()-r.t>=WEATHER_FRESH_MS)||Object.values(out).some(ss=>ss.some(s=>s.todayIndex<0||s.source.expired)),missingZones};
  };
  const waiting=zones.filter(z=>{const r=records.get(z.id);return force||!r||r.stale||Date.now()-r.t>=WEATHER_FRESH_MS||!r.raw.every(row=>row.daily.time.includes(today));});
  if(records.size)onUpdate?.(snapshot(),{phase:'cache',pending:waiting.map(z=>z.id)});
  if(!waiting.length)return snapshot();
  const locs=waiting.flatMap(z=>z.bands.map((band,bi)=>({z,bi,band})));
  const params=new URLSearchParams({
    latitude:locs.map(l=>l.z.lat).join(','),longitude:locs.map(l=>l.z.lon).join(','),elevation:locs.map(l=>l.band).join(','),
    daily:GROWTH_DAILY,hourly:GROWTH_HOURLY,past_days:PAST_DAYS,forecast_days:FORECAST_DAYS,timezone:'Europe/Rome',
  });
  let failure;
  try{
    await fetchForecast(params,{signal,onProgress,onChunk:chunk=>{
      if(signal?.aborted)return;
      const z=locs[chunk.start]?.z;
      if(!z||!validWeatherRows(chunk.raw,z.bands.length))return;
      const record={t:chunk.fetchedAt.getTime(),raw:compactGrowth(chunk.raw),stale:chunk.stale};
      if(records.get(z.id)?.t>record.t)return;
      records.set(z.id,record);saveZoneWeather(z,'growth',record);
      onUpdate?.(snapshot(),{phase:'network',zoneId:z.id});
    }});
  }catch(err){failure=err;}
  if(!records.size)throw failure||new Error('Serie meteo incompleta');
  const result=snapshot();
  result.failedZones=waiting.filter(z=>!records.get(z.id)||records.get(z.id).local||records.get(z.id).stale).map(z=>z.id);
  if(failure)result.offline=true;
  return result;
}
