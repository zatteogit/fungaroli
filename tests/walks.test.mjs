import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch } from '../js/walks.js';

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
  assert.equal(trailSketch({ lines: [] }), null);
});
