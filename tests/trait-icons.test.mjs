import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url)));
const icons = read('trait-icons'), taxa = read('species-traits').taxa;
const file = (name) => existsSync(new URL(`../assets/traits/${name}.webp`, import.meta.url));

test('every drawn species has cap, underside and whole-mushroom icons', () => {
  assert.ok(Object.keys(icons.taxa).length > 0);
  for (const key of Object.keys(icons.taxa)) {
    assert.ok(taxa[key], `${key} non è in species-traits`);
    for (const part of icons.parts) assert.ok(file(`${key}-${part}`), `manca ${key}-${part}`);
  }
});

test('variants use only colours and shapes given by the sources, and have both tiles', () => {
  for (const [key, e] of Object.entries(icons.taxa)) {
    for (const [field, trait] of [['colors', 'cap_color'], ['shapes', 'cap_shape']]) {
      if (!e[field]) continue;
      const allowed = taxa[key].traits[trait] || [];
      assert.ok(e[field].values.includes(e[field].drawn), `${key}: il disegno base non è tra le varianti`);
      for (const v of e[field].values) {
        assert.ok(allowed.includes(v), `${key}: ${v} non è nelle fonti`);
        if (v !== e[field].drawn) for (const part of ['cappello', 'gambo']) assert.ok(file(`${key}-${part}-${v}`), `manca ${key}-${part}-${v}`);
      }
    }
  }
});

test('ogni icona dei funghi è intera: il disegno non tocca il bordo', () => {
  const names = Object.keys(icons.margins || {});
  assert.ok(names.length >= 264);
  for (const n of names) {
    assert.ok(file(n), `${n}: file mancante`);
    assert.ok(icons.margins[n] >= 2, `${n}: il disegno tocca il bordo (tagliato?)`);
  }
});
