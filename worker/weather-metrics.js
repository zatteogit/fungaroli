// Misure del servizio meteo per decidere su prefetch, lock distribuito o piano a pagamento
// (docs/meteo-cache.md). Le scritture non devono mai rallentare o rompere il meteo.
// Stesso schema di migrations/0004_weather_metrics.sql (un test li confronta): qui come
// stringa perché il modulo viene importato anche da Node nei test.
export const WEATHER_METRICS_SCHEMA = `CREATE TABLE IF NOT EXISTS weather_metrics (
  day TEXT NOT NULL, hour INTEGER NOT NULL, profile TEXT NOT NULL, event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0, locations INTEGER NOT NULL DEFAULT 0, weighted REAL NOT NULL DEFAULT 0,
  timed INTEGER NOT NULL DEFAULT 0, total_ms INTEGER NOT NULL DEFAULT 0, max_ms INTEGER NOT NULL DEFAULT 0,
  under_1s INTEGER NOT NULL DEFAULT 0, under_3s INTEGER NOT NULL DEFAULT 0, under_10s INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, profile, event)
)`;

export const OPEN_METEO_FREE = { perMinute: 600, perHour: 5000, perDay: 10000 };
export const METRICS_RETENTION_DAYS = 180;
const ready = new WeakMap();
const romeParts = (now) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Rome' })
  .formatToParts(new Date(now)).map((p) => [p.type, p.value]));
function init(db) {
  if (!ready.has(db)) ready.set(db, db.prepare(WEATHER_METRICS_SCHEMA).run()
    .catch((e) => { ready.delete(db); throw e; }));
  return ready.get(db);
}

const UPSERT = `INSERT INTO weather_metrics(day,hour,profile,event,count,locations,weighted,timed,total_ms,max_ms,under_1s,under_3s,under_10s)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(day,hour,profile,event) DO UPDATE SET count=count+excluded.count,locations=locations+excluded.locations,weighted=weighted+excluded.weighted,
    timed=timed+excluded.timed,total_ms=total_ms+excluded.total_ms,max_ms=max(max_ms,excluded.max_ms),
    under_1s=under_1s+excluded.under_1s,under_3s=under_3s+excluded.under_3s,under_10s=under_10s+excluded.under_10s`;
// Le risposte all'app sono molte (circa 30 per apertura): si sommano in memoria e si
// scrivono al massimo una volta al minuto per isolate, perché D1 condivide il budget di
// scritture con account, diario e redazione. Se l'isolate viene chiuso prima, si perdono
// al massimo i conteggi di quel minuto. Le chiamate a Open-Meteo, poche, si scrivono subito.
export const SERVED_FLUSH_MS = 60000;
const buffers = new WeakMap();
const slot = (now) => { const p = romeParts(now); return [`${p.year}-${p.month}-${p.day}`, +p.hour]; };

export async function flushWeatherMetrics(db, now = Date.now()) {
  const buffer = buffers.get(db);
  if (!db || !buffer?.rows.size) return;
  const rows = [...buffer.rows.values()];
  buffers.set(db, { since: now, rows: new Map() });
  try {
    await init(db);
    await db.batch(rows.map((r) => db.prepare(UPSERT).bind(r.day, r.hour, r.profile, r.event, r.count, 0, 0, 0, 0, 0, 0, 0, 0)));
  } catch { /* metriche facoltative */ }
}

export async function recordWeatherMetric(db, { profile, event, ms, locations = 0, weighted = 0 }, now = Date.now()) {
  if (!db || !profile || !event) return;
  if (event.startsWith('served:')) {
    const buffer = buffers.get(db) || { since: now, rows: new Map() }, [day, hour] = slot(now), key = `${day}|${hour}|${profile}|${event}`;
    buffers.set(db, buffer);
    const row = buffer.rows.get(key) || { day, hour, profile, event, count: 0 };
    row.count++; buffer.rows.set(key, row);
    if (now - buffer.since >= SERVED_FLUSH_MS) await flushWeatherMetrics(db, now);
    return;
  }
  if (buffers.get(db)?.rows.size) await flushWeatherMetrics(db, now);
  try {
    await init(db);
    const [day, hour] = slot(now), t = Number.isFinite(ms) ? Math.max(0, Math.round(ms)) : null;
    await db.prepare(UPSERT).bind(day, hour, profile, event, 1, locations, weighted,
      t == null ? 0 : 1, t ?? 0, t ?? 0, t != null && t < 1000 ? 1 : 0, t != null && t < 3000 ? 1 : 0, t != null && t < 10000 ? 1 : 0).run();
  } catch { /* metriche facoltative */ }
}

// Riepilogo per giorno: quota stimata di Open-Meteo, picco orario, errori, latenza, uso della cache.
export async function weatherMetrics(db, days = 30, now = Date.now()) {
  await flushWeatherMetrics(db, now);
  await init(db);
  const since = romeParts(now - Math.max(1, Math.min(METRICS_RETENTION_DAYS, days)) * 86400000), from = `${since.year}-${since.month}-${since.day}`;
  const rows = (await db.prepare('SELECT * FROM weather_metrics WHERE day>=? ORDER BY day DESC,hour DESC,profile,event').bind(from).all()).results;
  const byDay = new Map();
  for (const r of rows) {
    const d = byDay.get(r.day) || { day: r.day, upstream: { calls: 0, weighted: 0, failed: 0, rateLimited: 0, timed: 0, totalMs: 0, maxMs: 0, under1s: 0, under3s: 0, under10s: 0 }, served: {}, hours: new Map() };
    if (r.event.startsWith('upstream:')) {
      const u = d.upstream; u.calls += r.count; u.weighted += r.weighted;
      if (r.event !== 'upstream:ok') u.failed += r.count;
      if (r.event === 'upstream:429') u.rateLimited += r.count;
      u.timed += r.timed; u.totalMs += r.total_ms; u.maxMs = Math.max(u.maxMs, r.max_ms); u.under1s += r.under_1s; u.under3s += r.under_3s; u.under10s += r.under_10s;
      d.hours.set(r.hour, (d.hours.get(r.hour) || 0) + r.weighted);
    } else {
      const mode = r.event.slice('served:'.length); d.served[mode] = (d.served[mode] || 0) + r.count;
    }
    byDay.set(r.day, d);
  }
  const summary = [...byDay.values()].map(({ hours, upstream: u, ...d }) => {
    const [peakHour = null, peakWeighted = 0] = [...hours].sort((a, b) => b[1] - a[1])[0] || [];
    const served = Object.values(d.served).reduce((a, b) => a + b, 0);
    return { ...d, upstream: { calls: u.calls, weightedEstimate: Math.round(u.weighted * 10) / 10, failed: u.failed, rateLimited: u.rateLimited,
      meanMs: u.timed ? Math.round(u.totalMs / u.timed) : null, maxMs: u.timed ? u.maxMs : null,
      shareUnder1s: u.timed ? u.under1s / u.timed : null, shareUnder3s: u.timed ? u.under3s / u.timed : null, shareUnder10s: u.timed ? u.under10s / u.timed : null },
      peakHour, peakHourWeightedEstimate: Math.round(peakWeighted * 10) / 10,
      dailyQuotaShare: u.weighted / OPEN_METEO_FREE.perDay, peakHourQuotaShare: peakWeighted / OPEN_METEO_FREE.perHour,
      servedTotal: served, servedWithoutWaiting: served ? ((d.served.hit || 0) + (d.served.stale || 0)) / served : null };
  });
  return { limits: OPEN_METEO_FREE, weighting: 'stima: ogni punto conta come una chiamata, moltiplicata per max(1, variabili/10) × max(1, giorni/14)', days: summary, rows };
}

export async function cleanupWeatherMetrics(db, now = Date.now()) {
  if (!db) return;
  await init(db);
  const p = romeParts(now - METRICS_RETENTION_DAYS * 86400000);
  await db.prepare('DELETE FROM weather_metrics WHERE day<?').bind(`${p.year}-${p.month}-${p.day}`).run();
}
