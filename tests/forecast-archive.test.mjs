// Archivio quotidiano delle previsioni (D1): righe per zona, fascia e giorno di emissione; nulli conservati;
// nessuna riga parziale; nessun doppione; passaggi brevi con poche zone. D1 finto su node:sqlite, fetcher finto.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { DatabaseSync } from 'node:sqlite';

register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && (url.endsWith('.sql') || url.endsWith('.json') && !context.importAttributes?.type)) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return {format: 'module', shortCircuit: true, source: 'export default ' + (url.endsWith('.sql') ? JSON.stringify(text) : text) + ';'};
  }
  return next(url, context);
}`));
const { archiveForecasts, archiveParams, ARCHIVE_CRON } = await import('../worker/forecast-archive.js');
const { default: worker } = await import('../worker/index.js');

function d1(sql) {
  const stmt = (q, params = []) => {
    const exec = () => {
      const s = sql.prepare(q);
      if (/^\s*SELECT\b/i.test(q)) return { results: s.all(...params), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(s.run(...params).changes) } };
    };
    return { exec, bind: (...p) => stmt(q, p), all: async () => exec(), run: async () => exec(), first: async () => exec().results[0] ?? null };
  };
  return { prepare: (q) => stmt(q), batch: async (list) => { sql.exec('BEGIN'); try { const out = list.map((s) => s.exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; } } };
}
const NOW = Date.parse('2026-10-24T04:05:00Z'), TODAY = '2026-10-24';
const zones = [{ id: 'tancia', lat: 42.3, lon: 12.7, bands: [650, 850, 1100] }, { id: 'laga', lat: 42.6, lon: 13.3, bands: [1200, 1500] }, { id: 'rascino', lat: 42.3, lon: 13.1, bands: [1100] }];
const days = Array.from({ length: 9 }, (_, i) => new Date(Date.parse('2026-10-23T12:00:00Z') + i * 864e5).toISOString().slice(0, 10));
function answer(url, { gap = false } = {}) {
  const u = new URL(url), n = u.searchParams.get('latitude').split(',').length, elev = u.searchParams.get('elevation').split(',').map(Number);
  const time = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));
  return Array.from({ length: n }, (_, i) => ({ latitude: 42.31, longitude: 12.69, elevation: elev[i] + 7,
    daily: { time: days, precipitation_sum: days.map((_, k) => gap && k === 8 ? null : k), temperature_2m_mean: days.map(() => 12), temperature_2m_min: days.map(() => 6), temperature_2m_max: days.map(() => 18), et0_fao_evapotranspiration: days.map(() => 1.2) },
    hourly: { time, soil_moisture_3_to_9cm: time.map(() => 0.3), soil_temperature_6cm: time.map(() => 11), soil_moisture_9_to_27cm: time.map(() => 0.32) } }));
}
const setup = () => { const sql = new DatabaseSync(':memory:'); return { sql, env: { COMMUNITY_DB: d1(sql) } }; };

test('parametri: un punto per fascia, profilo di crescita, dal giorno prima a D+7', () => {
  const { points, params } = archiveParams(zones);
  assert.equal(points.length, 6);
  assert.equal(params.get('elevation'), '650,850,1100,1200,1500,1100');
  assert.deepEqual([params.get('past_days'), params.get('forecast_days'), params.get('timezone')], ['1', '8', 'Europe/Rome']);
  assert.match(params.get('daily'), /et0_fao_evapotranspiration/);
  assert.match(params.get('hourly'), /soil_moisture_9_to_27cm/);
});

test('passaggi brevi: due zone per volta, tutte le fasce, nulli conservati, nessun doppione', async () => {
  const { sql, env } = setup(), calls = [], events = [];
  const fetcher = async (url) => { calls.push(url); return Response.json(answer(url, { gap: true })); };
  const metrics = (m) => events.push(m);
  assert.deepEqual(await archiveForecasts(env, { zones, fetcher, now: NOW, metrics }), { saved: 5, pending: 1 });
  assert.deepEqual(await archiveForecasts(env, { zones, fetcher, now: NOW + 3e5, metrics }), { saved: 1, pending: 0 });
  assert.deepEqual(await archiveForecasts(env, { zones, fetcher, now: NOW + 6e5, metrics }), { saved: 0, pending: 0 });
  assert.equal(calls.length, 2, 'a lavoro finito non chiama più Open-Meteo');
  const rows = sql.prepare('SELECT * FROM forecast_archive ORDER BY zone_id,band').all();
  assert.equal(rows.length, 6);
  assert.ok(rows.every((r) => r.issued_on === TODAY && r.provider === 'open-meteo' && r.profile === 'growth-v2'));
  const tancia = rows.find((r) => r.zone_id === 'tancia' && r.band === 850), payload = JSON.parse(tancia.payload);
  assert.equal(tancia.cell_elevation, 857);
  assert.deepEqual(payload.time, days);
  assert.equal(payload.precipitation_sum[8], null, 'un nullo resta nullo, mai 0');
  assert.equal(payload.precipitation_sum[0], 0);
  assert.ok(Math.abs(payload.soil_moisture_9_to_27cm_mean[3] - 0.32) < 1e-9);
  assert.deepEqual(events.map((e) => [e.profile, e.event, e.locations]), [['archive', 'upstream:ok', 5], ['archive', 'upstream:ok', 1]]);
  // Il giorno dopo si ricomincia.
  await archiveForecasts(env, { zones, fetcher: async (url) => Response.json(answer(url).map((r) => ({ ...r, daily: { ...r.daily, time: r.daily.time.map((d, i) => new Date(Date.parse(d + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10)) } }))), now: NOW + 864e5 });
  assert.equal(sql.prepare("SELECT count(*) AS n FROM forecast_archive WHERE issued_on='2026-10-25'").get().n, 5);
});

test('errori: nessuna riga parziale, errore registrato, il passaggio dopo riprova', async () => {
  const { sql, env } = setup(), events = [];
  await assert.rejects(archiveForecasts(env, { zones, fetcher: async () => new Response('', { status: 429 }), now: NOW, metrics: (m) => events.push(m.event) }));
  await assert.rejects(archiveForecasts(env, { zones, fetcher: async (url) => Response.json(answer(url).slice(1)), now: NOW, metrics: (m) => events.push(m.event) }));
  await assert.rejects(archiveForecasts(env, { zones, fetcher: async (url) => Response.json(answer(url).map((r, i) => i === 2 ? { ...r, daily: { ...r.daily, time: r.daily.time.slice(1) } } : r)), now: NOW, metrics: (m) => events.push(m.event) }));
  assert.deepEqual(events, ['upstream:429', 'upstream:invalid', 'upstream:invalid']);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM forecast_archive').get().n, 0);
  assert.equal((await archiveForecasts(env, { zones, fetcher: async (url) => Response.json(answer(url)), now: NOW })).saved, 5);
});

test('cron: l’archivio gira solo nel suo orario, le pulizie restano sull’altro', async () => {
  assert.equal(ARCHIVE_CRON, '*/5 4,5 * * *');
  const waits = [], ctx = { waitUntil: (p) => waits.push(p) };
  await worker.scheduled({ cron: '17 3 * * *' }, {}, ctx);
  assert.equal(waits.length, 4, 'community, questionario, contatori e cache meteo');
  await Promise.allSettled(waits);
});
