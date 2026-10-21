// Previsioni datate del Taccuino (js/forecast-capture.js): indice con e senza il bonus del calo del suolo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { captureForecastData, predictScores, FORECAST_INPUTS } from '../js/forecast-capture.js';
import { PARAMS } from '../js/model.js';
import { SPECIES } from '../js/species.js';

const N = 45, TODAY = 40;
const dates = Array.from({ length: N }, (_, k) => new Date(Date.UTC(2026, 9, 16 + k - TODAY)).toISOString().slice(0, 10));
// serie favorevole al porcino con un calo di 6 °C del suolo 10 giorni prima di oggi (bonus ×1,15 da 6 a 15 giorni dopo)
function band(drop = 6, extra = {}) {
  const p = Array(N).fill(1); for (const k of [25, 26, 27, 28]) p[k] = 12;
  const soilt = Array(N).fill(15); for (let k = TODAY - 10; k < N; k++) soilt[k] = 15 - drop;
  return { dates, p, tmean: Array(N).fill(13), tmin: Array(N).fill(7), tmax: Array(N).fill(18), soilm: Array(N).fill(0.3), soilt,
    soilm9to27: Array(N).fill(0.33), et0: Array(N).fill(1.8), todayIndex: TODAY, issuedIndex: TODAY, source: { fetchedAt: '2026-10-16T05:00:00Z' }, ...extra };
}
const zone = { id: 'prova', bands: [1100, 1350, 1600] };
const hab = { sample_categories: ['Faggeta'], samples: Array.from({ length: 60 }, (_, k) => [1100 + (k % 3) * 250, 0]) };
// il porcino al massimo resterebbe a 10/10 con e senza bonus: un mese a metà stagione abbassa il prodotto sotto 1
const edulis = { ...SPECIES.find((s) => s.id === 'edulis'), months: Array(12).fill(0.5) };
const species = [edulis, ...SPECIES.filter((s) => s.id !== 'edulis')];

test('la previsione datata salva l’indice con e senza il bonus del calo del suolo', () => {
  const sb = zone.bands.map(() => band());
  const f = captureForecastData({ zone, seriesByBand: sb, hab, date: dates[TODAY], band: 1350, species, now: new Date('2026-10-16T06:00:00Z') });
  assert.ok(f);
  for (const k of ['scores', 'scoresByBand', 'scoresNoShock', 'scoresByBandNoShock']) assert.ok(f[k], k);
  assert.ok(f.scores.edulis > f.scoresNoShock.edulis, `${f.scores.edulis} > ${f.scoresNoShock.edulis}`);
  // il bonus è al massimo ×1,15, senza cumulo
  assert.ok(f.scores.edulis <= Math.round(f.scoresNoShock.edulis * PARAMS.shockBonus) + 1);
  assert.equal(f.scores.pinophilus >= f.scoresNoShock.pinophilus, true);
  // le specie senza soilShock hanno lo stesso valore
  for (const s of SPECIES.filter((x) => !x.soilShock)) assert.equal(f.scores[s.id], f.scoresNoShock[s.id], s.id);
  for (const b of zone.bands) assert.deepEqual(Object.keys(f.scoresByBandNoShock[b]).sort(), Object.keys(f.scoresByBand[b]).sort());
  // i fattori dello shock per fascia: stato, data e calo
  assert.equal(f.shock.bonus, PARAMS.shockBonus);
  assert.equal(f.shock.byBand[1350].edulis.status, 'calo');
  assert.equal(f.shock.byBand[1350].edulis.date, dates[TODAY - 10]);
  assert.equal(f.shock.byBand[1350].edulis.drop, 6);
  assert.equal(f.shock.byBand[1350].mellea, undefined);
  // il JSON salvato nel Taccuino conserva i due valori
  const saved = JSON.parse(JSON.stringify(f));
  assert.equal(saved.scoresNoShock.edulis, f.scoresNoShock.edulis);
  assert.equal(saved.scoresByBandNoShock['1350'].edulis, f.scoresByBandNoShock[1350].edulis);
});

test('31 giorni di meteo per fascia, compresi temperatura del suolo, umidità 9–27 cm ed ET₀; serie assenti come null', () => {
  const sb = zone.bands.map((b, k) => band(6, k === 2 ? { soilm9to27: undefined, et0: undefined } : {}));
  const f = captureForecastData({ zone, seriesByBand: sb, hab, date: dates[TODAY + 2], band: 1600, species });
  assert.deepEqual(FORECAST_INPUTS, ['p', 'tmean', 'tmin', 'tmax', 'soilm', 'soilt', 'soilm9to27', 'et0']);
  for (const inp of f.inputs) {
    assert.equal(inp.dates.length, 31);
    assert.equal(inp.soilt.length, 31);
  }
  assert.equal(f.inputs[0].soilm9to27.length, 31);
  assert.deepEqual(f.inputs[0].et0, Array(31).fill(1.8));
  assert.equal(f.inputs[2].soilm9to27, null);
  assert.equal(f.inputs[2].et0, null);
  assert.equal(f.mode, 'prospective');
  assert.ok(f.model.params.shockBonus && f.model.species.find((s) => s.id === 'edulis').soilShock);
});

test('niente previsione datata per giorni passati, fuori serie o con meteo scaduto', () => {
  const sb = zone.bands.map(() => band());
  assert.equal(captureForecastData({ zone, seriesByBand: sb, hab, date: dates[TODAY - 1], band: 1350, species }), null);
  assert.equal(captureForecastData({ zone, seriesByBand: sb, hab, date: '2030-01-01', band: 1350, species }), null);
  const expired = zone.bands.map(() => band(6, { source: { expired: true } }));
  assert.equal(captureForecastData({ zone, seriesByBand: expired, hab, date: dates[TODAY], band: 1350, species }), null);
});

test('l’ET₀ si registra e basta: cambiarla non cambia l’indice', () => {
  const a = captureForecastData({ zone, seriesByBand: zone.bands.map(() => band()), hab, date: dates[TODAY], band: 1350, species });
  const b = captureForecastData({ zone, seriesByBand: zone.bands.map(() => band(6, { et0: Array(N).fill(6) })), hab, date: dates[TODAY], band: 1350, species });
  assert.deepEqual(a.scoresByBand, b.scoresByBand);
  assert.deepEqual(a.scoresByBandNoShock, b.scoresByBandNoShock);
});

test('predictScores senza shock coincide con il calcolo con shock quando il suolo non cala', () => {
  const sb = zone.bands.map(() => band(0));
  const a = predictScores({ zone, seriesByBand: sb, hab, i: TODAY, species });
  const b = predictScores({ zone, seriesByBand: sb, hab, i: TODAY, species, noShock: true });
  assert.deepEqual(a, b);
});
