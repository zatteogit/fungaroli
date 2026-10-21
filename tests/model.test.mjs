import test from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES } from '../js/species.js';
import { scoreSpecies, seasonWeight, habitatAtBand, elevationFit, weatherFactors, inputQuality, combine, formatIndex, scoreLabel, soilTemperatureShock, soilDrop, PARAMS, MODEL_VERSION } from '../js/model.js';

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

test('input mancanti e habitat senza campioni non significano assenza di funghi', () => {
  for (const key of ['p', 'tmean', 'soilm', 'tmin', 'tmax']) {
    const s = series({ rainAt: { 12: 40 } }); s[key][38] = null;
    const r = scoreSpecies(edulis, s, 39, beech, 1300);
    assert.equal(r.score, null, key); assert.equal(r.quality.complete, false);
  }
  assert.equal(scoreSpecies(edulis, series(), 39, { samples: [] }, 1300).score, null);
});
test('anche gli estremi del giorno corrente includono previsioni', () => {
  const s = series();
  assert.equal(inputQuality(edulis, s, 39).usesForecast, true);
  assert.equal(inputQuality(edulis, s, 38).usesForecast, false);
});
test('meteo scaduto non produce consigli per oggi', () => {
  const s = series(); s.source = { expired: true };
  assert.equal(scoreSpecies(edulis, s, 39, beech, 1300).score, null);
  assert.ok(Number.isFinite(scoreSpecies(edulis, s, 38, beech, 1300).score));
});
test('aggiungere specie identiche non gonfia l’indice', () => {
  assert.equal(combine([50, 50, 50, null]), 50);
  assert.equal(combine([null]), null); assert.equal(combine([0, null]), 0);
});
test('scala pubblica 0–10 con un decimale italiano', () => {
  assert.equal(formatIndex(72), '7,2'); assert.equal(formatIndex(100), '10,0');
  assert.equal(formatIndex(0), '0,0'); assert.equal(formatIndex(null), '–');
  assert.equal(scoreLabel(null), 'Non calcolabile');
});
test('interpolazione continua sulle vere date centrali dei mesi', () => {
  const months = [1, ...Array(11).fill(0)];
  const a = seasonWeight(months, '2026-01-31'), b = seasonWeight(months, '2026-02-01');
  assert.ok(Math.abs((a - b) - 1 / 31) < 1e-9);
});

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

test('habitatPotential: faggeta alla quota giusta = alta; prato = scarsa', async () => {
  const { habitatPotential } = await import('../js/model.js');
  const beechZone = { sample_categories: ['Faggeta'], samples: Array.from({ length: 40 }, (_, k) => [1100 + k * 10, 0]) };
  const meadow = { sample_categories: [], samples: Array.from({ length: 40 }, () => [1200, -1]) };
  const a = habitatPotential(edulis, beechZone, 2800);
  assert.equal(a.level, 'alta');
  assert.equal(a.ha, 2800);
  assert.deepEqual(a.elevRange, [1100, 1490]);
  assert.equal(habitatPotential(edulis, meadow, 2800).level, 'scarsa');
});

// ---- Shock sul suolo (Olivier et al. 1997): solo B. edulis e B. pinophilus, 2.1.0 ----
const pinophilus = SPECIES.find((s) => s.id === 'pinophilus');
// serie di 40 giorni con temperatura del suolo costante a 15 °C; `soil` sovrascrive alcuni giorni (indice: valore)
function withSoil(soil = {}, base = 15) {
  const s = series({ rainAt: { 12: 25, 11: 15 } });
  s.soilt = Array(s.dates.length).fill(base);
  for (const k in soil) s.soilt[k] = soil[k];
  return s;
}
// un calo netto il giorno 20 che dura tre giorni (20, 21, 22), poi il suolo torna a 15 °C
const dropAt20 = (c) => withSoil({ 20: 15 - c, 21: 15 - c, 22: 15 - c });

test('versione del modello e parametri dello shock dichiarati', () => {
  assert.equal(MODEL_VERSION, '2.1.0');
  assert.equal(PARAMS.shockSoilDropC, 5);
  assert.deepEqual(PARAMS.shockLagDays, [6, 15]);
  assert.equal(PARAMS.shockBonus, 1.15);
  assert.equal(PARAMS.shockDropC, undefined); // la vecchia soglia sull'aria non esiste più
  assert.deepEqual(SPECIES.filter((sp) => sp.soilShock).map((sp) => sp.id), ['edulis', 'pinophilus']);
  assert.ok(SPECIES.every((sp) => sp.shockWeight === undefined)); // niente peso 3 per il chiodino
});

test('calo di 5 °C del suolo: bonus da 6 a 15 giorni dopo, solo per porcino e porcino rosso', () => {
  const s = dropAt20(5);
  for (const sp of [edulis, pinophilus]) {
    for (let i = 21; i <= 39; i++) {
      const r = soilTemperatureShock(sp, s, i), inside = i >= 26 && i <= 35;
      assert.equal(r.shock, inside ? PARAMS.shockBonus : 1, `${sp.id} giorno ${i}`);
      if (inside) { assert.equal(r.shockStatus, 'calo'); assert.equal(r.shockDate, s.dates[20]); assert.equal(r.shockDaysBefore, i - 20); assert.equal(r.drop, 5); }
    }
  }
  for (const sp of SPECIES.filter((x) => !['edulis', 'pinophilus'].includes(x.id))) {
    for (let i = 21; i <= 39; i++) {
      const w = weatherFactors(sp, s, i);
      assert.equal(w.shock, 1, `${sp.id} giorno ${i}`); assert.equal(w.shockStatus, 'non previsto');
    }
  }
});

test('nessun bonus per il chiodino, anche con un calo forte', () => {
  const mellea = SPECIES.find((x) => x.id === 'mellea');
  const s = dropAt20(9);
  for (let i = 26; i <= 35; i++) assert.equal(weatherFactors(mellea, s, i).shock, 1);
});

test('un calo di 4 °C non basta; conta il suolo, non l’aria', () => {
  const s = dropAt20(4);
  for (let i = 26; i <= 35; i++) { const r = soilTemperatureShock(edulis, s, i); assert.equal(r.shock, 1); assert.equal(r.shockStatus, 'nessun calo'); }
  assert.equal(soilTemperatureShock(edulis, s, 30).drop, 4);
  const air = withSoil(); for (let k = 20; k <= 22; k++) air.tmean[k] = 13 - 8; // aria −8 °C, suolo fermo
  for (let i = 26; i <= 35; i++) assert.equal(weatherFactors(edulis, air, i).shock, 1);
});

test('un calo graduale in pochi giorni conta dal giorno in cui raggiunge 5 °C; un freddo lungo è un solo evento', () => {
  const ramp = withSoil({ 18: 13, 19: 11.5, 20: 9.9, 21: 9.5, 22: 9.5, 23: 9.5, 24: 9.5, 25: 9.5 });
  assert.equal(soilDrop(ramp.soilt, 19).drop < 5, true);
  assert.ok(Math.abs(soilDrop(ramp.soilt, 20).drop - 5.1) < 1e-9); // 15 (media dei 3 giorni prima del calo) − 9,9
  assert.equal(soilTemperatureShock(edulis, ramp, 25).shock, 1); // 5 giorni dopo: ancora presto
  assert.equal(soilTemperatureShock(edulis, ramp, 26).shockDate, ramp.dates[20]);
  assert.equal(soilTemperatureShock(edulis, ramp, 35).shock, PARAMS.shockBonus);
  assert.equal(soilTemperatureShock(edulis, ramp, 36).shock, 1); // il freddo che continua non sposta l'evento
});

test('temperatura del suolo incompleta: niente bonus inventato, indice calcolabile, dichiarato in quality', () => {
  const s = dropAt20(6); s.soilt[20] = null; // manca proprio il giorno del calo
  const r = scoreSpecies(edulis, s, 30, beech, 1300);
  assert.equal(r.shock, 1); assert.equal(r.shockStatus, 'dati incompleti');
  assert.ok(Number.isFinite(r.score)); assert.equal(r.quality.complete, true);
  assert.deepEqual(r.quality.bonusUnavailable, ['temperatura del suolo']);
  const old = series({ rainAt: { 12: 40 } }); // serie senza `soilt` (copie e previsioni salvate prima)
  assert.equal(weatherFactors(edulis, old, 39).shockStatus, 'dati incompleti');
  assert.deepEqual(inputQuality(SPECIES.find((x) => x.id === 'mellea'), old, 39).bonusUnavailable, []);
  // un evento dimostrato da dati completi vale anche se manca un giorno lontano
  const far = dropAt20(6); far.soilt[29] = null;
  const ok = soilTemperatureShock(edulis, far, 30);
  assert.equal(ok.shock, PARAMS.shockBonus); assert.equal(inputQuality(edulis, far, 30).bonusUnavailable.length, 0);
});

test('con il bonus il prodotto resta limitato a 1 (indice massimo 10)', () => {
  const s = dropAt20(6);
  for (let k = 0; k < 40; k++) { s.p[k] = 20; s.soilm[k] = 0.4; }
  const r = scoreSpecies(edulis, s, 30, beech, 1300);
  assert.equal(r.shock, PARAMS.shockBonus);
  assert.ok(r.score <= 100);
  const raw = r.season * r.habitat * r.elev * r.rain * r.temp * r.moist * r.frost * r.heat * r.shock;
  assert.equal(r.score, Math.round(Math.min(1, raw) * 100));
});
