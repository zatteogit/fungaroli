import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fullTrailKm } from '../js/walks.js';

const data = JSON.parse(readFileSync(new URL('../data/trails.json', import.meta.url), 'utf8'));
const rows = Object.entries(data.zones).flatMap(([zone, z]) => z.trails.map(t => ({ zone, t })));

test('ogni sentiero ha un intero non più corto del suo tratto nella zona, oppure lunghezza n.d.', () => {
  assert.ok(rows.length > 100);
  const bad = rows.filter(({ t }) => !(t.total_km === null || (Number.isFinite(t.total_km) && t.total_km > 0 && t.total_km >= t.in_zone_km)))
    .map(({ zone, t }) => `${zone}/${t.id} ${t.ref}: intero ${t.total_km}, nella zona ${t.in_zone_km}`);
  assert.deepEqual(bad, []);
  for (const { t } of rows) assert.ok(Number.isFinite(t.in_zone_km) && t.in_zone_km > 0, `${t.id}: tratto nella zona`);
  // l'app mostra la stessa lunghezza dei dati: il controllo di js/walks.js non deve scartare nulla
  for (const { t } of rows) assert.equal(fullTrailKm(t), t.total_km);
});

test('lo stesso sentiero ha la stessa lunghezza intera in tutte le zone', () => {
  const byId = new Map();
  for (const { t } of rows) (byId.get(t.id) || byId.set(t.id, new Set()).get(t.id)).add(t.total_km);
  assert.deepEqual([...byId].filter(([, s]) => s.size > 1).map(([id]) => id), []);
});

test('«Con le Ali ai Piedi» (OSM 21004687): il tag distance=1 non diventa una lunghezza', () => {
  const cap = rows.filter(({ t }) => t.id === 21004687);
  assert.deepEqual(cap.map(({ zone }) => zone).sort(), ['poggio-cantalice', 'terminillo-ovest']);
  for (const { t } of cap) assert.equal(t.total_km, null);
});
