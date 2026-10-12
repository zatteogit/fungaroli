// Dati meteo da Open-Meteo (gratuito, senza chiave, CORS abilitato).
// past_days: rianalisi/previsioni a breve per i giorni passati (non stazioni a terra).
// Il parametro `elevation` applica la correzione di quota (gradiente termico).

const API = 'https://api.open-meteo.com/v1/forecast';
export const PAST_DAYS = 62;
export const FORECAST_DAYS = 8;
const CACHE_KEY = 'fungaroli:weather:v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(sig) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.sig === sig && Date.now() - c.t < CACHE_TTL_MS) return c;
  } catch { /* storage non disponibile */ }
  return null;
}

function writeCache(sig, data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sig, t: Date.now(), data })); } catch { /* quota o privato */ }
}

export function toDaily(loc, todayStr) {
  const d = loc.daily;
  const h = loc.hourly;
  const byDay = {};
  h.time.forEach((t, k) => {
    const day = t.slice(0, 10);
    const b = (byDay[day] ||= { m: 0, n: 0, st: 0, ns: 0 });
    const sm = h.soil_moisture_3_to_9cm[k];
    const st = h.soil_temperature_6cm[k];
    if (sm != null) { b.m += sm; b.n++; }
    if (st != null) { b.st += st; b.ns++; }
  });
  const dates = d.time;
  return {
    dates,
    p: d.precipitation_sum.map((v) => v ?? 0),
    tmean: d.temperature_2m_mean,
    tmin: d.temperature_2m_min,
    tmax: d.temperature_2m_max,
    soilm: dates.map((x) => (byDay[x]?.n ? byDay[x].m / byDay[x].n : null)),
    soilt: dates.map((x) => (byDay[x]?.ns ? byDay[x].st / byDay[x].ns : null)),
    todayIndex: Math.max(0, dates.indexOf(todayStr)),
  };
}

export function todayISO() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

// Ritorna { [zoneId]: [serie per ciascuna fascia di quota] } e l'ora di aggiornamento.
export async function loadWeather(zones, { force = false } = {}) {
  // versione Artifact: serie gia' calcolate e incorporate (la pagina non puo' chiamare Open-Meteo)
  // (anche la copia di revisione su claude.ai: FUNGAROLI_REVIEW, solo meteo e mappa di base)
  const snap = globalThis.FUNGAROLI_DATA?.weather || globalThis.FUNGAROLI_REVIEW?.weather;
  if (snap) {
    const today = todayISO();
    let stale = false;
    for (const zid in snap.series) {
      for (const s of snap.series[zid]) {
        const i = s.dates.indexOf(today);
        if (i >= 0) s.todayIndex = i; else stale = true;
      }
    }
    return { series: snap.series, fetchedAt: new Date(snap.fetchedAt), snapshot: true, stale };
  }

  const locs = [];
  for (const z of zones) z.bands.forEach((band, bi) => locs.push({ zid: z.id, bi, lat: z.lat, lon: z.lon, band }));
  const today = todayISO();
  const sig = today + '|' + locs.map((l) => `${l.lat},${l.lon},${l.band}`).join(';');

  let raw = null, fetchedAt = null;
  const cached = force ? null : readCache(sig);
  if (cached) {
    raw = cached.data; fetchedAt = new Date(cached.t);
  } else {
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
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    raw = await res.json();
    if (!Array.isArray(raw)) raw = [raw];
    fetchedAt = new Date();
    writeCache(sig, raw);
  }

  const out = {};
  locs.forEach((l, k) => {
    (out[l.zid] ||= [])[l.bi] = toDaily(raw[k], today);
  });
  return { series: out, fetchedAt };
}
