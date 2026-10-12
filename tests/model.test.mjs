import test from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES } from '../js/species.js';
import { scoreSpecies, seasonWeight, habitatAtBand, elevationFit, weatherFactors } from '../js/model.js';

const edulis = SPECIES.find((s) => s.id === 'edulis');

// 40 giorni, oggi = indice 39, data di riferimento 10 ottobre
function series({ rainAt = {}, t = 13, tmin = 6, tmax = 18, soil = 0.3 } = {}) {
  const n = 40;
  const dates = Array.from({ length: n }, (_, k) => {
    const d = new Date(Date.UTC(2026, 9, 10 - (n - 1 - k)));
    return d.toISOString().slice(0, 10);
  });
  const p = Array(n).fill(0);
  for (const k in rainAt) p[n - 1 - k] = rainAt[k];
  return { dates, p, tmean: Array(n).fill(t), tmin: Array(n).fill(tmin), tmax: Array(n).fill(tmax), soilm: Array(n).fill(soil), todayIndex: n - 1 };
}
const beech = { sample_categories: ['Faggeta'], samples: Array.from({ length: 50 }, () => [1300, 0]) };

test('pioggia 10-14 giorni fa + 13 °C in faggeta = indice alto per il porcino', () => {
  const s = series({ rainAt: { 12: 25, 11: 15 } });
  const r = scoreSpecies(edulis, s, s.todayIndex, beech, 1300);
  assert.ok(r.score >= 50, `score ${r.score}`);
});

test('senza pioggia l\'indice resta basso', () => {
  const s = series({ soil: 0.12 });
  const r = scoreSpecies(edulis, s, s.todayIndex, beech, 1300);
  assert.ok(r.score < 10, `score ${r.score}`);
});

test('pioggia caduta ieri non conta ancora per il porcino (latenza)', () => {
  const late = series({ rainAt: { 1: 40 } });
  const right = series({ rainAt: { 12: 40 } });
  const a = weatherFactors(edulis, late, late.todayIndex);
  const b = weatherFactors(edulis, right, right.todayIndex);
  assert.ok(b.rain > a.rain * 1.5);
});

test('le gelate penalizzano', () => {
  const ok = series({ rainAt: { 12: 40 } });
  const frost = series({ rainAt: { 12: 40 }, tmin: -3 });
  assert.ok(scoreSpecies(edulis, frost, 39, beech, 1300).score < scoreSpecies(edulis, ok, 39, beech, 1300).score / 2);
});

test('habitat non idoneo azzera l\'indice', () => {
  const s = series({ rainAt: { 12: 40 } });
  const meadow = { sample_categories: [], samples: Array.from({ length: 50 }, () => [1300, -1]) };
  assert.equal(scoreSpecies(edulis, s, 39, meadow, 1300).score, 0);
});

test('stagionalita\' interpolata tra mesi', () => {
  const w = seasonWeight(edulis.months, '2026-10-30');
  assert.ok(w < 1 && w > edulis.months[10]);
  assert.equal(seasonWeight(edulis.months, '2026-02-15'), 0);
});

test('habitatAtBand filtra per quota', () => {
  const hab = { sample_categories: ['Faggeta', 'Castagneto'], samples: [[1300, 0], [1350, 0], [700, 1], [1320, -1]] };
  const { frac, n } = habitatAtBand(hab, 1300);
  assert.equal(n, 3);
  assert.ok(Math.abs(frac.Faggeta - 2 / 3) < 1e-9);
  assert.ok(Math.abs(frac['non bosco'] - 1 / 3) < 1e-9);
});

test('elevationFit decresce fuori fascia', () => {
  assert.equal(elevationFit(edulis, 1200), 1);
  assert.equal(elevationFit(edulis, 500), 0);
  assert.ok(elevationFit(edulis, 600) > 0);
});
