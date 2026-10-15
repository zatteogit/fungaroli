// Grafici giorno per giorno: scale, tacche, collisioni delle etichette (js/viz.js) e frasi delle quattro domande (js/science.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleLinear, niceStep, niceTicks, overlaps, placeLabels, dayTicks, nearestIndex, textWidth } from '../js/viz.js';
import { soilLevel, dayStory } from '../js/science.js';
import { PARAMS } from '../js/model.js';

test('scala lineare e dominio degenere', () => {
  const y = scaleLinear(0, 10, 100, 0);
  assert.equal(y(0), 100); assert.equal(y(10), 0); assert.equal(y(5), 50);
  assert.equal(scaleLinear(3, 3, 0, 50)(3), 0);
});

test('tacche tonde che coprono i dati', () => {
  assert.deepEqual([1, 2, 2.5, 5, 10].map((f) => niceStep(f * 3, 3)), [1, 2, 2.5, 5, 10]);
  const t = niceTicks(0, 31, 2);
  assert.equal(t.min, 0); assert.ok(t.max >= 31); assert.deepEqual(t.ticks, [0, 20, 40]);
  const temp = niceTicks(2.6, 17.4, 3);
  assert.ok(temp.min <= 2.6 && temp.max >= 17.4);
  assert.ok(temp.ticks.every((v, k, a) => !k || v > a[k - 1]));
  assert.deepEqual(niceTicks(NaN, 5).ticks, [0, 1]);
  assert.ok(niceTicks(4, 4).max > 4);
});

test('sovrapposizione di rettangoli, anche con margine', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  assert.equal(overlaps(a, { x: 10, y: 0, w: 5, h: 5 }), false);
  assert.equal(overlaps(a, { x: 11, y: 0, w: 5, h: 5 }, 2), true);
  assert.equal(overlaps(a, { x: 5, y: 5, w: 1, h: 1 }), true);
});

test('le etichette scelgono il primo posto libero e non toccano dati né altre etichette', () => {
  const bars = [{ x: 0, y: 20, w: 10, h: 80 }, { x: 90, y: 20, w: 10, h: 80 }];
  const bounds = { x: 0, y: 0, w: 100, h: 100 };
  const placed = placeLabels([
    { id: 'thr', candidates: [{ x: 0, y: 40, w: 30, h: 12 }, { x: 40, y: 40, w: 30, h: 12 }] },
    { id: 'dup', candidates: [{ x: 45, y: 45, w: 20, h: 12 }, { x: 40, y: 70, w: 20, h: 12 }] },
    { id: 'none', candidates: [{ x: 0, y: 30, w: 20, h: 12 }, { x: 95, y: 0, w: 20, h: 12 }] },
  ], bars, bounds);
  assert.deepEqual(placed.get('thr'), { x: 40, y: 40, w: 30, h: 12 }); // la prima posizione toccava una barra
  assert.deepEqual(placed.get('dup'), { x: 40, y: 70, w: 20, h: 12 }); // la prima toccava l'etichetta già messa
  assert.equal(placed.has('none'), false); // nessun posto: va nella legenda, non sopra i dati
  for (const r of placed.values()) for (const b of bars) assert.equal(overlaps(r, b, 2), false);
});

test('tacche dei giorni: «oggi» sempre, una a settimana, mai sovrapposte, nemmeno vicino ai bordi', () => {
  const step = 8, x = (i) => 30 + step * (i + .5);
  const ticks = dayTicks(38, 30, x, () => 34, 10, 30, 30 + step * 38);
  assert.ok(ticks.includes(30));
  assert.ok(ticks.every((i) => i === 30 || (30 - i) % 7 === 0));
  // a 8 px per giorno una data larga 34 px ogni 7 giorni ci sta, ma quella dopo «oggi» (37) urta il bordo: scartata
  assert.equal(ticks.includes(37), false);
  const narrow = dayTicks(38, 30, (i) => 3 * i, () => 34, 10);
  for (let k = 1; k < narrow.length; k++) assert.ok(3 * narrow[k] - 3 * narrow[k - 1] >= 34 + 10 - 1e-9);
});

test('il giorno più vicino al puntatore', () => {
  assert.equal(nearestIndex(0, 30, 8, 38), 0);
  assert.equal(nearestIndex(30 + 8 * 5.9, 30, 8, 38), 5);
  assert.equal(nearestIndex(9999, 30, 8, 38), 37);
});

test('larghezza del testo stimata senza DOM', () => {
  assert.equal(textWidth('oggi', 10), Math.ceil(4 * 10 * .56));
});

test('umidità del suolo a parole con le soglie del modello', () => {
  assert.equal(soilLevel(null), null);
  assert.equal(soilLevel(PARAMS.moistDry - .01), 'secco');
  assert.equal(soilLevel(PARAMS.moistDry), 'medio');
  assert.equal(soilLevel(PARAMS.moistWet), 'umido');
});

const sp = { name: 'Porcino / Boletus edulis', lag: [7, 21], topt: 13, tsd: 3.5 };
const rows = (miss = []) => ['Pioggia', 'Temperatura', 'Umidità del suolo'].map((k) => ({ k, v: miss.includes(k) ? null : 0.8 }));
const days = [
  { date: '2026-10-15', i: 30, score: 50 }, { date: '2026-10-16', i: 31, score: 26 },
  { date: '2026-10-17', i: 32, score: 67 }, { date: '2026-10-18', i: 33, score: null },
];

test('le risposte usano la virgola, dicono i limiti e distinguono il dato assente', () => {
  const r = { effRain: 59, maxEvent: 31, triggered: true, r30: 104, t20: 12.84, sm: .2 };
  const t = dayStory({ r, sp, rows: rows(), days, todayIndex: 30, i: 30 });
  assert.match(t.rain, /59 mm tra 21 e 7 giorni prima/);
  assert.match(t.rain, /superato gli 8 mm/);
  assert.match(t.temp, /12,8 °C/);
  assert.match(t.temp, /tra 10 e 17 °C/);
  assert.match(t.temp, /dentro/);
  assert.match(t.soil, /mediamente umido/);
  assert.match(t.soil, /non una misura/);
  assert.doesNotMatch(t.soil, /m³/); // il valore tecnico sta nel dettaglio, non nella risposta
  assert.match(t.next, /vale 5,0 su 10/);
  assert.match(t.next, /da 2,6 a 6,7/); // il giorno senza indice non vale zero: è escluso
  assert.match(t.next, /previsioni/);
  assert.doesNotMatch(Object.values(t).join(' '), /probabilit|certo|sicur/i);
});

test('senza evento di innesco, con fattori mancanti, fuori fascia', () => {
  const r = { effRain: 12, maxEvent: 5, triggered: false, r30: 20, t20: 22, sm: null };
  const t = dayStory({ r, sp, rows: rows(['Umidità del suolo']), days, todayIndex: 30, i: 30 });
  assert.match(t.rain, /Nessun giorno ha raggiunto gli 8 mm dell'innesco/);
  assert.match(t.temp, /più caldo/);
  assert.match(t.soil, /non disponibile/);
  assert.match(t.soil, /non vuol dire terreno secco/);
  const m = dayStory({ r, sp, rows: rows(['Pioggia', 'Temperatura']), days: [], todayIndex: 30, i: 30 });
  assert.match(m.rain, /Mancano dati di pioggia/);
  assert.match(m.temp, /Mancano dati di temperatura/);
  assert.match(m.next, /non è calcolabile/);
});
