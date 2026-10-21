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
test('lo strato 9–27 cm è una media giornaliera; le istantanee senza strati del suolo ricevono serie vuote, non errori', async () => {
  const r = raw(); r.hourly.soil_moisture_9_to_27cm = Array(24).fill(.27);
  const s = toDaily(r, '2026-10-12'); assert.ok(Math.abs(s.soilm9to27[0] - .27) < 1e-12);
  r.hourly.soil_moisture_9_to_27cm[5] = null; assert.equal(toDaily(r, '2026-10-12').soilm9to27[0], null);
  const old = toDaily(raw(), '2026-10-12'); delete old.soilm9to27; delete old.soilt;
  globalThis.FUNGAROLI_DATA = { weather: { fetchedAt: '2026-10-12T06:00:00Z', series: { test: [old] } } };
  try { const w = await loadWeather([]); assert.deepEqual(w.series.test[0].soilm9to27, [null]); assert.deepEqual(w.series.test[0].soilt, [null]); }
  finally { delete globalThis.FUNGAROLI_DATA; }
});

test('umidità del suolo: la media compatta fuori da 0–1 diventa null, come i valori orari', () => {
  // righe compatte del Worker e copie locali: medie giornaliere già calcolate, senza le ore
  const compact = (v, deep = v) => ({ daily: { time: ['2026-10-12'], precipitation_sum: [0], temperature_2m_mean: [13], temperature_2m_min: [6], temperature_2m_max: [18],
    soil_moisture_3_to_9cm_mean: [v], soil_temperature_6cm_mean: [13], soil_moisture_9_to_27cm_mean: [deep] } });
  for (const bad of [1.4, -0.02, 37]) {
    const s = toDaily(compact(bad), '2026-10-12');
    assert.equal(s.soilm[0], null, `soilm ${bad}`); assert.equal(s.soilm9to27[0], null, `soilm9to27 ${bad}`);
  }
  for (const ok of [0, 0.31, 1]) assert.equal(toDaily(compact(ok), '2026-10-12').soilm[0], ok);
  // la temperatura del suolo non è una frazione: resta com'è
  assert.equal(toDaily(compact(0.3), '2026-10-12').soilt[0], 13);
  // la via oraria scartava già i valori fuori intervallo: un'ora sbagliata rende nulla la media del giorno
  const r = raw(); r.hourly.soil_moisture_3_to_9cm[3] = 1.7;
  assert.equal(toDaily(r, '2026-10-12').soilm[0], null);
});
test('ET₀ giornaliera (Open-Meteo et0_fao_evapotranspiration, mm/giorno): serie registrata; senza il campo, null', async () => {
  const r = raw(); r.daily.et0_fao_evapotranspiration = [2.4];
  assert.deepEqual(toDaily(r, '2026-10-12').et0, [2.4]);
  r.daily.et0_fao_evapotranspiration = [-1]; assert.deepEqual(toDaily(r, '2026-10-12').et0, [null]);
  assert.deepEqual(toDaily(raw(), '2026-10-12').et0, [null]);
  const old = toDaily(raw(), '2026-10-12'); delete old.et0;
  globalThis.FUNGAROLI_DATA = { weather: { fetchedAt: '2026-10-12T06:00:00Z', series: { test: [old] } } };
  try { const w = await loadWeather([]); assert.deepEqual(w.series.test[0].et0, [null]); }
  finally { delete globalThis.FUNGAROLI_DATA; }
});
