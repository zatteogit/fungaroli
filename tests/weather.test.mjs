import test from 'node:test';
import assert from 'node:assert/strict';
import { toDaily, todayISO, loadWeather } from '../js/weather.js';
import { outingFor } from '../js/outing.js';
const raw = () => ({ daily: { time: ['2026-10-12'], precipitation_sum: [null], temperature_2m_mean: [13], temperature_2m_min: [6], temperature_2m_max: [18] },
  hourly: { time: Array.from({ length: 24 }, (_, k) => `2026-10-12T${String(k).padStart(2, '0')}:00`), soil_moisture_3_to_9cm: Array(24).fill(.3), soil_temperature_6cm: Array(24).fill(13) } });
test('pioggia nulla e giorno fuori serie non vengono trasformati in zero o oggi', () => {
  const s = toDaily(raw(), '2026-10-13'); assert.equal(s.p[0], null); assert.equal(s.todayIndex, -1);
});
test('un dato orario mancante invalida la media giornaliera del suolo', () => {
  const r = raw(); r.hourly.soil_moisture_3_to_9cm[12] = null;
  assert.equal(toDaily(r, '2026-10-12').soilm[0], null);
});
test('la data di oggi usa il fuso italiano anche da dispositivi in altri fusi', () => {
  assert.equal(todayISO(new Date('2026-10-12T22:30:00Z')), '2026-10-13');
});
test('snapshot scaduto non conserva un indice oggi falso', async () => {
  const s = toDaily(raw(), '2026-10-12');
  globalThis.FUNGAROLI_DATA = { weather: { fetchedAt: '2026-01-01T12:00:00Z', series: { test: [s] } } };
  try { const w = await loadWeather([]); assert.equal(w.stale, true); assert.equal(w.series.test[0].source.expired, true); }
  finally { delete globalThis.FUNGAROLI_DATA; }
});
test('meteo incompleto o scaduto non diventa tempo buono', () => {
  const z = { lat: 42.4, lon: 12.86 }, now = Date.parse('2026-10-12T06:00:00Z');
  assert.equal(outingFor(null, z, '2026-10-12', now).level, 'non_disponibile');
  assert.equal(outingFor({ fetchedAt: '2026-10-11T00:00:00Z' }, z, '2026-10-12', now).level, 'non_disponibile');
  assert.equal(outingFor({ fetchedAt: new Date(now).toISOString(), time: ['2026-10-12T08:00'], p: [0], pp: [0], wc: [0], g: [0], t: [13] }, z, '2026-10-12', now).level, 'non_disponibile');
});
