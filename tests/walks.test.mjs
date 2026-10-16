import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch, fullTrailKm } from '../js/walks.js';

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
