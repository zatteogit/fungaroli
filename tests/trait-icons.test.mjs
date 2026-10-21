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

test('le combinazioni colore + forma elencate hanno cappello e gambo e usano valori delle fonti', () => {
  for (const [key, e] of Object.entries(icons.taxa)) for (const pair of e.combos || []) {
    const [c, f] = pair.split('|');
    assert.ok(taxa[key].traits.cap_color.includes(c) && taxa[key].traits.cap_shape.includes(f), `${key}: ${pair} non è nelle fonti`);
    for (const part of ['cappello', 'gambo']) assert.ok(file(`${key}-${part}-${c}-${f}`), `manca ${key}-${part}-${c}-${f}`);
  }
});

test('le forme approvate convivono con le fasi e conservano la provenienza in archivio', () => {
  const dir = new URL('../archive/forme-con-fasi/', import.meta.url);
  const arch = JSON.parse(readFileSync(new URL('index.json', dir)));
  assert.ok(Object.keys(arch.items).length > 0);
  for (const [name, r] of Object.entries(arch.items)) {
    assert.ok(taxa[r.specie]?.stages?.length, `${name}: la specie non ha le fasi`);
    assert.ok(taxa[r.specie].traits.cap_shape.includes(r.forma), `${name}: forma non nei dati`);
    assert.equal(name, `${r.specie}-${r.tessera}-${r.forma}`);
    assert.ok(existsSync(new URL(`${name}.webp`, dir)), `${name}: file mancante`);
    assert.ok(r.tavola && Number.isInteger(r.cella) && r.prompt, `${name}: provenienza incompleta`);
    assert.ok(file(name), `${name}: forma approvata mancante in assets/traits`);
    assert.ok((icons.taxa[r.specie]?.shapes?.values || []).includes(r.forma), `${name}: forma approvata mancante nell'indice`);
    for (const stage of taxa[r.specie].stages) {
      if (stage.tiles.every(part=>file(`${r.specie}-${part}-fase-${stage.id}`)))
        assert.ok(icons.taxa[r.specie]?.stages?.includes(stage.id), `${name}: fase consegnata ${stage.id} mancante nell'indice`);
    }
  }
  const ignore = readFileSync(new URL('../.assetsignore', import.meta.url), 'utf8').split('\n').map((x) => x.trim());
  assert.ok(ignore.includes('archive'), '.assetsignore deve escludere archive/');
});
