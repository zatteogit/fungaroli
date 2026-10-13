// Meteo dell'uscita: le previsioni orarie nella finestra della raccolta (da un'ora prima dell'alba alle 13),
// separate dal meteo passato che fa nascere i funghi. Servono a dire "oggi lì piove, puoi andare altrove".
import { sunTimes } from './human.js';

const API = 'https://api.open-meteo.com/v1/forecast';
const KEY = 'fungaroli:outing:v2';
const TTL = 60 * 60 * 1000;
export const MAX_OUTING_AGE_MS = 3 * TTL;
const HOURLY = 'precipitation,precipitation_probability,weather_code,wind_gusts_10m,temperature_2m';

// weather_code WMO: 45/48 nebbia, 51-67 pioviggine e pioggia, 71-77 e 85-86 neve, 80-82 rovesci, 95-99 temporali
const isThunder = (c) => c >= 95;
const isSnow = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86;
const isFog = (c) => c === 45 || c === 48;

export async function loadOuting(zones, { force = false } = {}) {
  const snap = globalThis.FUNGAROLI_REVIEW?.outing || globalThis.FUNGAROLI_DATA?.outing;
  if (snap) return snap;
  const locs = zones.map((z) => ({ zid: z.id, lat: z.lat, lon: z.lon, elev: z.bands[Math.floor(z.bands.length / 2)] }));
  const sig = new Date().toDateString() + '|' + locs.map((l) => `${l.lat},${l.lon},${l.elev}`).join(';');
  let c = null;
  try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage non disponibile */ }
  if (!force && c?.sig === sig && Date.now() - c.t < TTL) return c.data;
  try {
    const q = new URLSearchParams({
      latitude: locs.map((l) => l.lat).join(','), longitude: locs.map((l) => l.lon).join(','), elevation: locs.map((l) => l.elev).join(','),
      hourly: HOURLY, forecast_days: 8, timezone: 'Europe/Rome',
    });
    const res = await fetch(`${API}?${q}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let raw = await res.json();
    if (!Array.isArray(raw)) raw = [raw];
    const data = {};
    locs.forEach((l, k) => {
      const h = raw[k].hourly;
      data[l.zid] = { time: h.time, p: h.precipitation, pp: h.precipitation_probability, wc: h.weather_code, g: h.wind_gusts_10m, t: h.temperature_2m,
        fetchedAt: new Date().toISOString(), elevation: l.elev };
    });
    try { localStorage.setItem(KEY, JSON.stringify({ sig, t: Date.now(), data })); } catch { /* quota */ }
    return data;
  } catch {
    // senza rete: l'ultima previsione salvata (stesse zone), se c'e'
    const where = (x) => x.slice(x.indexOf('|') + 1);
    return c && where(c.sig) === where(sig) && Date.now() - c.t < MAX_OUTING_AGE_MS ? c.data : null;
  }
}

// Valuta la mattina dell'uscita: livello ok / attenzione / sconsigliata, con le ragioni in parole.
export function outingFor(series, z, dateStr, now = Date.now()) {
  const unavailable = (text) => ({ level: 'non_disponibile', text, main: text, short: 'meteo non verificabile', available: false });
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
  const text = `${main} · ${tmin === tmax ? tmin : `${tmin}–${tmax}`} °C`;
  // short: la ragione principale in due parole, col numero tra parentesi (per le note compatte)
  const stale = now - fetched > TTL;
  return { level: stale && level === 'ok' ? 'non_disponibile' : level,
    text: text + (stale ? ' · previsione da aggiornare' : ''), main: parts[0] || main,
    short: stale && level === 'ok' ? 'previsione da aggiornare' : shorts[0] || main,
    available: !stale, fetchedAt: series.fetchedAt, rain, prob, thunder, snow, fog, gust, tmin, tmax, from };
}

export const OUTING_LABEL = { ok: 'meteo senza criticità segnalate', attenzione: 'tempo incerto', sconsigliata: 'uscita sconsigliata', non_disponibile: 'meteo non verificabile' };
export const OUTING_SHORT = { ok: 'senza criticità segnalate', attenzione: 'incerto', sconsigliata: 'sconsigliata', non_disponibile: 'non verificabile' };
export const OUTING_RANK = { ok: 1, attenzione: 0.85, sconsigliata: 0.55, non_disponibile: 0.75 };
