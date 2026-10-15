import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const { schema } = read('data/recognize-trees.json');
const icons = read('data/tree-trait-icons.json');
// valori aggiunti allo schema dopo il giro di disegni: icona da disegnare (docs/handoff-immagini-varianti.md)
const PENDING = new Set(['leaf_type-composta_palmata']);
const asked = Object.entries(schema).filter(([k, q]) => q.ask && !['size', 'habitat', 'special'].includes(k))
  .flatMap(([k, q]) => q.values.map((v) => `${k}-${v.id}`));

test('ogni valore delle domande sugli alberi ha la sua icona (salvo quelle da disegnare, elencate)', () => {
  const have = new Set(Object.entries(icons.values).flatMap(([k, vs]) => vs.map((v) => `${k}-${v}`)));
  for (const id of asked) if (!PENDING.has(id)) assert.ok(have.has(id), `manca l'icona ${id}`);
  for (const id of PENDING) assert.ok(asked.includes(id) && !have.has(id), `${id}: togliere da PENDING`);
});

test('ogni icona corrisponde a un valore esistente, ha il file ed è intera', () => {
  const files = readdirSync(new URL('../assets/tree-traits/', import.meta.url));
  for (const [k, vs] of Object.entries(icons.values)) for (const v of vs) {
    const id = `${k}-${v}`;
    assert.ok(asked.includes(id), `${id}: non è un valore dello schema`);
    assert.ok(existsSync(new URL(`../assets/tree-traits/${id}.webp`, import.meta.url)), `${id}: file mancante`);
    assert.ok(icons.margins[id] >= 2, `${id}: il disegno tocca il bordo (tagliato?)`);
  }
  assert.equal(files.length, Object.values(icons.values).flat().length, 'file in assets/tree-traits senza voce nell\'indice');
});
