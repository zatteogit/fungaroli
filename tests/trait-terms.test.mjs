import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const glossary = new Set(read('glossary').terms.map((t) => t.id));

// Tessere e risposte mostrano il termine botanico; il glossario lo spiega
for (const f of ['recognize-trees', 'recognize-plants']) test(`${f}: ogni valore ha il suo termine e i collegamenti puntano al glossario`, () => {
  for (const [k, q] of Object.entries(read(f).schema)) {
    assert.ok(q.short, `${k}: manca il nome della categoria`);
    if (q.short_gloss) assert.ok(glossary.has(q.short_gloss), `${k}: ${q.short_gloss} non è nel glossario`);
    for (const v of q.values) {
      assert.ok(v.term && v.term.trim(), `${k}.${v.id}: manca il termine`);
      if (v.gloss) assert.ok(glossary.has(v.gloss), `${k}.${v.id}: ${v.gloss} non è nel glossario`);
    }
  }
});
