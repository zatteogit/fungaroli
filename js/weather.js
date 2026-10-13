// Dati meteo da Open-Meteo (gratuito, senza chiave, CORS abilitato).
// past_days: rianalisi/previsioni a breve per i giorni passati (non stazioni a terra).
// Il parametro `elevation` applica la correzione di quota (gradiente termico).

import {fetchForecast} from './weather-request.js';
export const PAST_DAYS = 62;
export const FORECAST_DAYS = 8;
const CACHE_KEY = 'fungaroli:weather:v2';
const CACHE_TTL_MS = 60 * 60 * 1000;
export const MAX_FORECAST_AGE_MS = 24 * 60 * 60 * 1000;
const finite = (v) => Number.isFinite(v) ? v : null;

// anyAge: senza rete va bene anche un meteo vecchio, purche' per le stesse zone e quote
function readCache(sig, anyAge = false) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    const where = (x) => x.slice(x.indexOf('|') + 1);
    if (c && c.sig === sig && Date.now() - c.t < CACHE_TTL_MS) return c;
    if (anyAge && c && where(c.sig) === where(sig) && Date.now() - c.t < 6 * 864e5) return c;
  } catch { /* storage non disponibile */ }
  return null;
}

function writeCache(sig, data, fetchedAt) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sig, t: fetchedAt.getTime(), data })); } catch { /* quota o privato */ }
}

export function toDaily(loc, todayStr, source = {}) {
  const d = loc.daily;
  const h = loc.hourly || {};
  const byDay = {};
  (h.time || []).forEach((t, k) => {
    const day = t.slice(0, 10);
    const b = (byDay[day] ||= { m: 0, n: 0, st: 0, ns: 0 });
    const sm = h.soil_moisture_3_to_9cm?.[k];
    const st = h.soil_temperature_6cm?.[k];
    if (Number.isFinite(sm) && sm >= 0 && sm <= 1) { b.m += sm; b.n++; }
    if (Number.isFinite(st)) { b.st += st; b.ns++; }
  });
  const dates = d.time;
  return {
    dates,
    p: dates.map((_, k) => d.precipitation_sum?.[k] >= 0 ? finite(d.precipitation_sum[k]) : null),
    tmean: dates.map((_, k) => finite(d.temperature_2m_mean?.[k])),
    tmin: dates.map((_, k) => finite(d.temperature_2m_min?.[k])),
    tmax: dates.map((_, k) => finite(d.temperature_2m_max?.[k])),
    soilm: dates.map((x) => (byDay[x]?.n >= 24 ? byDay[x].m / byDay[x].n : null)),
    soilt: dates.map((x) => (byDay[x]?.ns >= 24 ? byDay[x].st / byDay[x].ns : null)),
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
export async function loadWeather(zones, { force = false } = {}) {
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
        if (i < 0) stale = true;
        s.issuedIndex ??= Number.isFinite(age) ? s.dates.indexOf(todayISO(fetchedAt)) : -1;
        s.source = { ...s.source, fetchedAt: snap.fetchedAt,
          expired: !Number.isFinite(age) || age > MAX_FORECAST_AGE_MS, snapshot: true };
      }
    }
    return { series: snap.series, fetchedAt, snapshot: true, stale };
  }

  const locs = [];
  for (const z of zones) z.bands.forEach((band, bi) => locs.push({ zid: z.id, bi, lat: z.lat, lon: z.lon, band }));
  const today = todayISO();
  const sig = today + '|' + locs.map((l) => `${l.lat},${l.lon},${l.band}`).join(';');

  let raw = null, fetchedAt = null, offline = false;
  const cached = force ? null : readCache(sig);
  if (cached) {
    raw = cached.data; fetchedAt = new Date(cached.t);
  } else {
    try {
    const params = new URLSearchParams({
      latitude: locs.map((l) => l.lat).join(','),
      longitude: locs.map((l) => l.lon).join(','),
      elevation: locs.map((l) => l.band).join(','),
      daily: 'precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max',
      hourly: 'soil_moisture_3_to_9cm,soil_temperature_6cm',
      past_days: PAST_DAYS,
      forecast_days: FORECAST_DAYS,
      timezone: 'Europe/Rome',
    });
    const received=await fetchForecast(params);
    raw=received.raw; fetchedAt=received.fetchedAt; offline=received.stale;
    if(raw.length!==locs.length||raw.some(r=>!Array.isArray(r?.daily?.time)))throw new Error('Serie meteo incompleta');
    writeCache(sig, raw, fetchedAt);
    } catch (err) {
      // senza campo (o servizio limitato): l'ultimo meteo salvato, dichiarato come tale
      const old = readCache(sig, true);
      if (!old) throw err;
      raw = old.data; fetchedAt = new Date(old.t); offline = true;
    }
  }

  const out = {};
  const expired = Date.now() - fetchedAt.getTime() > MAX_FORECAST_AGE_MS;
  locs.forEach((l, k) => {
    if (!raw[k]?.daily?.time) throw new Error('Serie meteo incompleta');
    (out[l.zid] ||= [])[l.bi] = toDaily(raw[k], today, {
      fetchedAt: fetchedAt.toISOString(), expired, requested: { latitude: l.lat, longitude: l.lon, elevation: l.band },
    });
  });
  const stale = offline || expired || Object.values(out).some((ss) => ss.some((s) => s.todayIndex < 0));
  return { series: out, fetchedAt, offline, stale };
}
