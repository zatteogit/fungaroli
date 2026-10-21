import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch, fullTrailKm, sampleFits, compatibleTrails, trailBandFit, bandFitNote, nearBandFirst, fitRange, sourceHours, dinHours, sourceTimeIssue, MIN_SHARE_OF_DIN, SOURCE_TIME_NOTE } from '../js/walks.js';
import { SPECIES } from '../js/species.js';
import { PARAMS } from '../js/model.js';

const data = (name) => JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));

test('one proposal per place, with its best day; ties favour the earlier day', () => {
  const rows = [
    { z: { id: 'a' }, o: 1, r: 8 }, { z: { id: 'a' }, o: 3, r: 9 },
    { z: { id: 'b' }, o: 4, r: 9 }, { z: { id: 'b' }, o: 2, r: 9 },
  ];
  assert.deepEqual(uniquePlaceProposals(rows).map(c => [c.z.id, c.o]), [['b', 2], ['a', 3]]);
  assert.equal(rows[0].o, 1);
});

test('trail selection keeps compatibility and exposes fallback without inventing a model', () => {
  const long = { id: 1, difficulty: 'E', total_km: 100, in_zone_km: 4 };
  const local = { id: 2, difficulty: 'E', total_km: 5, in_zone_km: 4.8 };
  const expert = { id: 3, difficulty: 'EE', total_km: 4, in_zone_km: 4 };
  assert.equal(chooseWalkTrail([long, expert, local], [], () => []).id, 2);
  assert.equal(chooseWalkTrail([expert], [local], () => []).id, 3);
  assert.equal(chooseWalkTrail([], [local], () => []).id, 2);
  assert.equal(chooseWalkTrail([local, long], [], t => t.id === 1 ? [{}] : []).id, 1);
  assert.equal(chooseWalkTrail([], [], () => []), null);
});

test('un «intero» più corto del tratto locale non è una lunghezza né rende locale il sentiero', () => {
  // Caso reale: CAP «Con le Ali ai Piedi» (OSM 21004687) ha distance=1 ma 6,9 km nella zona.
  const cap = { id: 9, difficulty: 'E', total_km: 1, in_zone_km: 6.9 };
  const local = { id: 2, difficulty: 'E', total_km: 5, in_zone_km: 4.8 };
  assert.equal(fullTrailKm(cap), null);
  assert.equal(fullTrailKm(local), 5);
  assert.equal(fullTrailKm({ total_km: 4.1, in_zone_km: 4.1 }), 4.1);
  assert.equal(fullTrailKm({ total_km: null, in_zone_km: 2.4 }), null);
  assert.equal(fullTrailKm({ total_km: 0, in_zone_km: 0 }), null);
  assert.equal(fullTrailKm({ total_km: 3 }), 3);
  assert.equal(fullTrailKm(null), null);
  assert.equal(chooseWalkTrail([cap, local], [], () => []).id, 2);
  // con la lunghezza n.d. il cammino resta scelto solo se non ci sono alternative locali
  assert.equal(chooseWalkTrail([{ ...cap, total_km: null }, local], [], () => []).id, 2);
  assert.equal(chooseWalkTrail([{ ...cap, total_km: null }], [], () => []).id, 9);
});

test('microzone only names a nearby parking or a documented road; no invented trailhead', () => {
  const z = { title: 'Tancia', parking: [{ name: 'Osteria Tancia', lat: 42.3046, lon: 12.7497 }] };
  const t = { ref: '355' };
  assert.equal(walkContext(z, t, [{ lat: 42.30641, lon: 12.74865 }]).microzone, 'Dintorni di Osteria Tancia');
  assert.equal(walkContext(z, t, [{ lat: 42.34, lon: 12.74, road: 'SP 1' }]).microzone, 'Imbocco su SP 1');
  assert.equal(walkContext(z, t, []).h, null);
  assert.equal(walkContext(z, t, []).microzone, 'Tratto nella zona di Tancia');
  assert.equal(walkContext(z, null, []), null);
});

test('local sketch preserves disconnected fragments and has finite coordinates', () => {
  const sketch = trailSketch({ lines: [[[42, 13], [42.001, 13]], [[42.003, 13], [42.004, 13]]] }, { lat: 42, lon: 13 });
  assert.equal(sketch.paths.length, 2);
  assert.ok(sketch.head.every(Number.isFinite));
  assert.ok(sketch.paths.every(p => !/NaN|Infinity/.test(p)));
  const withHeads=trailSketch({lines:[[[42,13],[42.001,13]]]}, {lat:42,lon:13}, [{lat:42.002,lon:13.001}]);
  assert.equal(withHeads.heads.length,2);
  assert.ok(withHeads.heads.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=360&&y>=0&&y<=200));
  assert.equal(trailSketch({ lines: [] }), null);
});

// ---- OUT-11: il sentiero e la fascia di quota dell'indice ----
test('per i funghi un campione del sentiero è adatto solo nella fascia del modello (±150 m); le piante tengono la loro regola', () => {
  assert.equal(PARAMS.bandHalfWidth, 150);
  const fungus = { forest: { Faggeta: 0.8 }, elev: [200, 1500] };
  assert.equal(sampleFits(fungus, 1300, 'Faggeta', 1450), true);
  assert.equal(sampleFits(fungus, 1299, 'Faggeta', 1450), false); // prima (±250 m) era «compatibile»
  assert.equal(sampleFits(fungus, 1550, 'Faggeta', 1450), false); // fuori dall'intervallo della specie
  assert.equal(sampleFits(fungus, 1400, 'Cerreta', 1450), false); // bosco non adatto
  assert.equal(sampleFits({ ...fungus, forest: { Faggeta: 0.5 } }, 1400, 'Faggeta', 1450), false); // affinità < 0,6
  assert.equal(sampleFits(null, 1400, 'Faggeta', 1450), false);
  const plant = { kind: 'plant', forest: { Faggeta: 0.3 }, elevationRange: [800, 1200] };
  assert.equal(sampleFits(plant, 1250, 'Faggeta', 1450), true);
  assert.equal(sampleFits(plant, 1199, 'Faggeta', 1450), false);
  assert.deepEqual(fitRange(fungus, 1450), [1300, 1500]);
  assert.deepEqual(fitRange(fungus, 900), [750, 1050]);
  assert.equal(fitRange(plant, 1450), null);
});

test('Rascino, chiodino a 1450 m: 490 e 491A non passano dalla fascia, il 485 sì; la passeggiata proposta diventa il 485', () => {
  const tz = data('trails').zones.rascino, heads = data('trailheads'), mellea = SPECIES.find((s) => s.id === 'mellea');
  const zh = (heads.zones || heads).rascino || {}, headsOf = (t) => zh[String(t.id)] || [];
  const trail = (id) => tz.trails.find((t) => t.id === id);
  const f490 = trailBandFit(trail(12420231), tz.sample_categories, mellea, 1450);
  const f491A = trailBandFit(trail(12217083), tz.sample_categories, mellea, 1450);
  const f485 = trailBandFit(trail(13673705), tz.sample_categories, mellea, 1450);
  assert.equal(f490.fit, 0); assert.equal(f490.inBand, 0); assert.equal(f490.off, true);
  assert.equal(f491A.fit, 0); assert.equal(f491A.off, true);
  assert.ok(f485.fit >= 1);
  assert.deepEqual([f490.lo, f490.hi], [1144, 1271]);
  assert.equal(bandFitNote(f490), 'Indice della zona a 1450 m; questo sentiero sta tra 1144 e 1271 m. L’indice non è calcolato sul sentiero.');
  assert.equal(bandFitNote(f485), '');
  const compatible = compatibleTrails(tz, mellea, 1450);
  assert.ok(!compatible.some((t) => [12420231, 12217083].includes(t.id)));
  assert.ok(compatible.every((t) => t.goodSamples >= 3 && t.lo >= 1300 && t.hi <= 1500));
  assert.equal(chooseWalkTrail(compatible, nearBandFirst(tz.trails, 1450), headsOf).id, 13673705);
});

test('etichetta del sentiero fuori fascia: tre casi, nessuna etichetta per le piante o senza campioni', () => {
  const sp = { forest: { Faggeta: 1 }, elev: [200, 1800] }, cats = ['Faggeta', 'Cerreta'];
  const t = (samples) => ({ samples });
  // passa dalla fascia, ma in un bosco non adatto
  const noForest = trailBandFit(t([[1400, 1], [1420, 1], [1440, 1], [1200, 0]]), cats, sp, 1450);
  assert.equal(noForest.inBand, 3); assert.equal(noForest.fit, 0);
  assert.match(bandFitNote(noForest), /^Indice della zona a 1450 m; questo sentiero sta tra 1200 e 1440 m e a quella quota non attraversa bosco adatto\./);
  // due campioni adatti: meno di 0,3 km
  const little = trailBandFit(t([[1400, 0], [1420, 0], [1440, 1]]), cats, sp, 1450);
  assert.equal(little.off, true); assert.match(bandFitNote(little), /attraversa poco bosco adatto/);
  // tre campioni adatti: compatibile, nessuna etichetta
  assert.equal(trailBandFit(t([[1400, 0], [1420, 0], [1440, 0]]), cats, sp, 1450).off, false);
  // categoria -1 = non bosco
  assert.equal(trailBandFit(t([[1450, -1]]), cats, { forest: { 'non bosco': 0.6 }, elev: [0, 2000] }, 1450).fit, 1);
  assert.equal(trailBandFit(t([[1450, 0]]), cats, { kind: 'plant', forest: { Faggeta: 1 } }, 1450), null);
  assert.equal(trailBandFit(t([]), cats, sp, 1450), null);
  assert.equal(trailBandFit(t([[1450, 0]]), cats, sp, null), null);
  assert.equal(bandFitNote(null), '');
});

test('nel ripiego si propone prima il sentiero più vicino alla quota dell’indice, a parità del resto', () => {
  const low = { id: 1, samples: [[600, 0], [700, 0]] }, mid = { id: 2, samples: [[900, 0], [1300, 0]] }, high = { id: 3, samples: [[1500, 0]] }, none = { id: 4, samples: [] };
  assert.deepEqual(nearBandFirst([none, low, high, mid], 1000).map((t) => t.id), [2, 1, 3, 4]);
  assert.deepEqual(nearBandFirst([low, mid], null).map((t) => t.id), [1, 2]);
  const a = { id: 5, samples: [[1000, 0]] }, b = { id: 6, samples: [[1000, 0]] };
  assert.deepEqual(nearBandFirst([b, a], 1000).map((t) => t.id), [6, 5]); // stabile
});

// ---- OUT-02: plausibilità dei tempi della fonte (DIN 33466) ----
test('tempi della fonte: formati leggibili e riferimento DIN 33466', () => {
  assert.equal(sourceHours('01:20'), 1 + 20 / 60);
  assert.equal(sourceHours('2:30'), 2.5);
  assert.equal(sourceHours('16'), 16);
  for (const bad of ['0300', '1:5', '12:60', '0', '', null, undefined, 'PT1H']) assert.equal(sourceHours(bad), null);
  // esempio delle fonti: 8 km (2 h) e 900 m di salita (3 h) → 3 h + 1 h = 4 h
  assert.equal(dinHours(8, 900, 0), 4);
  assert.equal(dinHours(4, 0, 0), 1);
  assert.equal(dinHours(0, 0, 500), 1);
  assert.ok(Math.abs(dinHours(9.9, 360, 210) - 3.29) < 0.01);
  assert.equal(MIN_SHARE_OF_DIN, 0.5);
});

// Tag OpenStreetMap letti dall'API 0.6 il 16/10/2026 (identici a quelli del 15/10 dell'audit):
// https://api.openstreetmap.org/api/0.6/relations.json?relations=12217083,12420231,11211746,12343875,13895359,12460968,12216979,13888857,10646876
// (dati © OpenStreetMap contributors, ODbL). total_km e in_zone_km sono quelli di data/trails.json.
const osm = {
  '491A': { total_km: 9.9, in_zone_km: 3, ascent: '360', descent: '210', duration: '01:20', duration_back: '02:50' }, // 12217083
  490: { total_km: 10.3, in_zone_km: 8.3, ascent: '180', descent: '170', duration: '01:30', duration_back: '01:20' }, // 12420231
  421: { total_km: 4.1, in_zone_km: 4.1, ascent: '905', descent: '45', duration: '01:45', duration_back: '01:35' }, // 11211746
  365: { total_km: 4.5, in_zone_km: 3.5, ascent: '850', descent: '100', duration: '01:45' }, // 12343875
  '478F': { total_km: 3.7, in_zone_km: 3.7, ascent: '345', descent: '130', duration: '1:05', duration_back: '1:35' }, // 13895359
  489: { total_km: 7.5, in_zone_km: 7.1, ascent: '150', descent: '300', duration: '02:10', duration_back: '02:25' }, // 12460968
  491: { total_km: 7.9, in_zone_km: 6.6, ascent: '380', descent: '330', duration: '02:20', duration_back: '02:20' }, // 12216979
  407: { total_km: 10.2, in_zone_km: 4.2, ascent: '1295', descent: '235', duration: '04:00', duration_back: '0300' }, // 10646876, ritorno malformato
  478: { total_km: 9.1, in_zone_km: 9.1, ascent: '535', descent: '620', duration: '04:25', duration_back: '04:15' }, // 13888857
};

test('la soglia 0,5 del riferimento DIN e il controllo sul verso segnalano 491A, 490, 421, 365 e 478F', () => {
  assert.equal(sourceTimeIssue(osm['491A']), 'verso'); // andata 1:20 con più salita del ritorno 2:50: tempi invertiti
  assert.equal(sourceTimeIssue(osm['478F']), 'verso');
  assert.equal(sourceTimeIssue(osm[490]), 'troppo breve'); // 1:30 per 10,3 km
  assert.equal(sourceTimeIssue(osm[421]), 'troppo breve'); // 1:45 per 905 m di salita
  assert.equal(sourceTimeIssue(osm[365]), 'troppo breve');
  // differiscono dal CAI ma rientrano nel riferimento: si mostrano
  assert.equal(sourceTimeIssue(osm[489]), null);
  assert.equal(sourceTimeIssue(osm[491]), null);
  // andata più lunga del ritorno con meno salita: tempo prudente, si mostra
  assert.equal(sourceTimeIssue(osm[478]), null);
  // un tempo di ritorno malformato («0300») non entra nel controllo sul verso
  assert.equal(sourceTimeIssue(osm[407]), null);
  // senza discesa e tempo di ritorno (dati attuali) il riferimento conta discesa zero: 491A resta segnalato
  const { descent, duration_back, ...bare } = osm['491A'];
  assert.equal(sourceTimeIssue(bare), 'troppo breve');
  assert.ok(Object.values(SOURCE_TIME_NOTE).every((s) => !/\d/.test(s.replace('33466', ''))), 'la spiegazione non ripete il tempo scartato');
});

test('casi limite del controllo: formato illeggibile, lunghezza n.d., nessun tempo', () => {
  assert.equal(sourceTimeIssue({ total_km: 10.2, in_zone_km: 4.2, ascent: '1295', duration: '0300' }), 'illeggibile');
  assert.equal(sourceTimeIssue({ total_km: null, in_zone_km: 6.9, duration: '00:30' }), null); // senza lunghezza intera non si giudica
  assert.equal(sourceTimeIssue({ total_km: 1, in_zone_km: 6.9, duration: '00:30' }), null); // lunghezza incoerente = n.d.
  assert.equal(sourceTimeIssue({ total_km: 5, duration: null }), null);
  assert.equal(sourceTimeIssue({ total_km: 5, duration: '' }), null);
  assert.equal(sourceTimeIssue(null), null);
  assert.equal(sourceTimeIssue({ total_km: 4, ascent: 'n.d.', duration: '00:25' }), 'troppo breve'); // salita illeggibile = 0; 25 min per 4 km
  assert.equal(sourceTimeIssue({ total_km: 4, ascent: 'n.d.', duration: '00:40' }), null);
});

test('dati attuali: i tempi segnalati sono 421 e 491A (aggiornare l’elenco se cambiano i dati dei sentieri)', () => {
  const seen = new Set(), flagged = [];
  for (const z of Object.values(data('trails').zones)) for (const t of z.trails) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    const issue = sourceTimeIssue(t);
    if (issue) flagged.push(`${t.ref} ${t.id} ${issue}`);
  }
  // Con discesa e tempo di ritorno nei dati (handoff OUT-02) si aggiungono 490, 365 e 478F.
  assert.deepEqual(flagged.sort(), ['421 11211746 troppo breve', '491A 12217083 troppo breve']);
});
