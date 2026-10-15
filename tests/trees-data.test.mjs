import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { trees } = JSON.parse(readFileSync(new URL('../data/trees.json', import.meta.url), 'utf8'));
const byName = new Map(Object.entries(trees).map(([id, t]) => [t.name.toLowerCase(), id]));

// «Non confonderlo con»: il collegamento alla scheda passa dall'id, non dal nome scritto
test('ogni sosia con id punta a una scheda albero esistente', () => {
  for (const [id, t] of Object.entries(trees)) for (const c of t.confusable || []) {
    if (c.id != null) assert.ok(trees[c.id], `${id} → ${c.name}: id «${c.id}» senza scheda`);
  }
});

test('un sosia che ha una scheda porta il suo id', () => {
  for (const [id, t] of Object.entries(trees)) for (const c of t.confusable || []) {
    const name = String(c.name).replace(/\s*\(.*\)$/, '').toLowerCase();
    if (byName.has(name)) assert.equal(c.id, byName.get(name), `${id} → ${c.name}`);
  }
});
