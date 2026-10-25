// Meteo dell'uscita: le previsioni orarie nella finestra della raccolta (da un'ora prima dell'alba alle 13),
// separate dal meteo passato che fa nascere i funghi. Servono a dire "oggi lì piove, puoi andare altrove".
import { sunTimes, todayGone } from './human.js';
import {fetchForecast} from './weather-request.js';
import {cachedZoneWeather,saveZoneWeather,migrateOutingCache,validWeatherRows,WEATHER_SYNC_MS} from './weather-cache.js';

const TTL = 60 * 60 * 1000;
export const MAX_OUTING_AGE_MS = 3 * TTL;
const HOURLY = 'precipitation,precipitation_probability,weather_code,wind_gusts_10m,temperature_2m';

// weather_code WMO: 45/48 nebbia, 51-67 pioviggine e pioggia, 71-77 e 85-86 neve, 80-82 rovesci, 95-99 temporali
const isThunder = (c) => c >= 95;
const isSnow = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86;
const isFog = (c) => c === 45 || c === 48;

export async function loadOuting(zones, { force = false,onUpdate,signal } = {}) {
  const snap = globalThis.FUNGAROLI_REVIEW?.outing || globalThis.FUNGAROLI_DATA?.outing;
  if (snap) return snap;
  migrateOutingCache(zones);
  const records=new Map();for(const z of zones){const saved=cachedZoneWeather(z,'outing');if(saved)records.set(z.id,saved);}
  const snapshot=()=>Object.fromEntries(zones.flatMap(z=>{
    const r=records.get(z.id),h=r?.raw?.[0]?.hourly;if(!h)return [];
    return [[z.id,{time:h.time,p:h.precipitation,pp:h.precipitation_probability,wc:h.weather_code,g:h.wind_gusts_10m,t:h.temperature_2m,fetchedAt:new Date(r.t).toISOString(),elevation:z.bands[Math.floor(z.bands.length/2)]}]];
  }));
  const waiting=zones.filter(z=>{const r=records.get(z.id);return force||!r||r.stale||Date.now()-r.t>=WEATHER_SYNC_MS;});
  if(records.size)onUpdate?.(snapshot(),{phase:'cache'});
  if(!waiting.length)return snapshot();
  const q=new URLSearchParams({latitude:waiting.map(z=>z.lat).join(','),longitude:waiting.map(z=>z.lon).join(','),elevation:waiting.map(z=>z.bands[Math.floor(z.bands.length/2)]).join(','),hourly:HOURLY,forecast_days:8,timezone:'Europe/Rome'});
  try{
    await fetchForecast(q,{signal,onChunk:chunk=>{
      if(signal?.aborted)return;
      const z=waiting[chunk.start];if(!z||!validWeatherRows(chunk.raw,1,'outing'))return;
      const record={t:chunk.fetchedAt.getTime(),raw:chunk.raw,stale:chunk.stale};if(records.get(z.id)?.t>record.t)return;records.set(z.id,record);saveZoneWeather(z,'outing',record);onUpdate?.(snapshot(),{phase:'network',zoneId:z.id});
    }});
  }catch{/* Keep the saved copy; outingFor independently enforces its age limit. */}
  return records.size?snapshot():null;
}

// Valuta la mattina dell'uscita: livello ok / attenzione / sconsigliata, con le ragioni in parole.
const romeDay = (now) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export function outingFor(series, z, dateStr, now = Date.now()) {
  const unavailable = (text) => ({ level: 'non_disponibile', text, main: text, short: 'meteo non verificabile', available: false });
  // OUT-03, punto 2 (decisione di Matteo del 24/10): dalle 14 di oggi la mattina dell'uscita è passata. Niente
  // giudizio come se fosse una previsione e niente «Riprova»: il meteo è quello di una mattina già trascorsa.
  if (dateStr === romeDay(now) && todayGone(new Date(now))) {
    const text = 'Mattina di oggi già passata: il meteo dell’uscita riguarda la mattina.';
    return { level: 'passata', text, main: 'mattina già passata', short: 'mattina passata', available: false };
  }
  if (!series) return unavailable('Previsioni della mattina non disponibili: controlla il meteo aggiornato prima di uscire.');
  const fetched = Date.parse(series.fetchedAt);
  if (!Number.isFinite(fetched) || now - fetched > MAX_OUTING_AGE_MS) return unavailable('Previsioni della mattina scadute o senza data di acquisizione.');
  const { sunrise } = sunTimes(dateStr, z.lat, z.lon);
  // ora italiana, qualunque sia il fuso del dispositivo (le ore della serie sono in Europe/Rome)
  const from = +new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Rome' }).format(new Date(sunrise.getTime() - 3600e3));
  const idx = [];
  (series.time || []).forEach((t, i) => {
    if (!t.startsWith(dateStr)) return;
    const h = +t.slice(11, 13);
    if (h >= from && h <= 13) idx.push(i);
  });
  if (idx.length !== 14 - from || !['p', 'pp', 'wc', 'g', 't'].every((k) => idx.every((i) => Number.isFinite(series[k]?.[i])))) {
    return unavailable('Previsioni della mattina incomplete: il tempo non è valutabile.');
  }
  const pick = (arr) => idx.map((i) => arr[i]);
  const rain = pick(series.p).reduce((a, b) => a + b, 0);
  const prob = Math.max(0, ...pick(series.pp));
  const codes = pick(series.wc);
  const gust = Math.max(0, ...pick(series.g));
  const temps = pick(series.t);
  const thunder = codes.some(isThunder);
  const snow = codes.some(isSnow);
  const fog = codes.filter(isFog).length >= 2;
  const tmin = Math.round(Math.min(...temps)), tmax = Math.round(Math.max(...temps));
  const parts = [], shorts = [];
  if (thunder) shorts.push('temporali');
  if (snow) shorts.push('neve');
  if (rain >= 0.5) shorts.push(`pioggia (${rain < 10 ? rain.toFixed(1).replace('.', ',') : Math.round(rain)} mm)`);
  else if (prob >= 50) shorts.push(`piovaschi (${prob}%)`);
  if (gust >= 40) shorts.push(`vento forte (${Math.round(gust)} km/h)`);
  if (fog) shorts.push('nebbia');
  if (thunder) parts.push('temporali possibili');
  if (snow) parts.push('neve');
  if (rain >= 0.5) parts.push(`pioggia ${rain < 10 ? rain.toFixed(1).replace('.', ',') : Math.round(rain)} mm`);
  else if (prob >= 50) parts.push(`piovaschi possibili (${prob}%)`);
  if (gust >= 40) parts.push(`raffiche fino a ${Math.round(gust)} km/h`);
  if (fog) parts.push('nebbia');
  let level = 'ok';
  if (thunder || snow || rain >= 5 || gust >= 60) level = 'sconsigliata';
  else if (rain >= 1 || prob >= 50 || gust >= 40 || fog) level = 'attenzione';
  const main = parts.length ? parts.join(' · ') : (prob < 20 ? 'asciutto' : 'probabilmente asciutto');
  const text = `${main} · ${tmin === tmax ? tmin : `${tmin}–${tmax}`}\u00a0°C`;
  // short: la ragione principale in due parole, col numero tra parentesi (per le note compatte)
  const stale = now - fetched > TTL;
  return { level: stale && level === 'ok' ? 'non_disponibile' : level,
    text: text + (stale ? ' · previsione da aggiornare' : ''), main: parts[0] || main,
    short: stale ? (level === 'ok' ? 'previsione da aggiornare' : `${shorts[0] || main} · da aggiornare`) : shorts[0] || main,
    available: !stale, fetchedAt: series.fetchedAt, rain, prob, thunder, snow, fog, gust, tmin, tmax, from };
}

export const OUTING_LABEL = { ok: 'meteo senza criticità segnalate', attenzione: 'tempo incerto', sconsigliata: 'uscita sconsigliata', non_disponibile: 'meteo non verificabile', passata: 'mattina già passata' };
export const OUTING_SHORT = { ok: 'senza criticità segnalate', attenzione: 'incerto', sconsigliata: 'sconsigliata', non_disponibile: 'non verificabile', passata: 'mattina passata' };
// passata: stesso peso del meteo non verificabile; dalle 14 la home propone già il giorno dopo.
export const OUTING_RANK = { ok: 1, attenzione: 0.85, sconsigliata: 0.55, non_disponibile: 0.75, passata: 0.75 };

// Decisione di prodotto 20/10: le condizioni dell’uscita includono anche il meteo attuale.
// I pesi sono quelli già usati per ordinare le uscite; il modello biologico resta separato.
export function conditionsScore(growth,weather){
  if(!Number.isFinite(growth)||!weather?.available||!['ok','attenzione','sconsigliata'].includes(weather.level))return null;
  return Math.round(Math.max(0,Math.min(100,growth))*OUTING_RANK[weather.level]);
}
export function selectOutingWeather(items,weatherOf){
  const safer=items.filter(c=>{const w=weatherOf(c);return w?.available&&['ok','attenzione'].includes(w.level);});
  return safer.length?safer:items;
}
export function outingHeadings(weather,defaults={home:'Dove andare',others:'Altre buone uscite'}){
  if(!weather.length)return defaults;
  if(weather.every(w=>w?.level==='sconsigliata'))return {home:'Con questo meteo, meglio rimandare',others:'Zone da esplorare in un altro momento'};
  if(weather.some(w=>!w?.available))return {home:'Meteo da verificare',others:'Altre zone da valutare'};
  if(weather.some(w=>w.level==='attenzione'))return {home:'Uscite da valutare',others:'Altre uscite da valutare'};
  return defaults;
}

// Prima data futura con meteo verificabile senza criticità; distingue l’uscita
// consigliabile dalla sola pausa nel maltempo, senza modificare i punteggi.
export function nextOutingWindow(items,weatherOf,{after=0,canRecommend=()=>true}={}) {
  const ready=items.filter(c=>Number.isInteger(c.o)&&c.o>after&&weatherOf(c)?.available&&weatherOf(c).level==='ok');
  const order=(a,b)=>a.o-b.o||((b.r??b.s??0)-(a.r??a.s??0));
  const useful=ready.filter(canRecommend).sort(order);
  const proposal=useful[0]||ready.sort(order)[0];
  return proposal?{proposal,conditionsUseful:useful.includes(proposal)}:null;
}
