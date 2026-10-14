import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateContent } from '../worker/content-validation.js';

const traits = JSON.parse(readFileSync(new URL('../data/species-traits.json', import.meta.url)));
const rules = [...traits.general_rules, ...Object.values(traits.taxa).flatMap((t) => t.field_rules || [])];

test('every warning has a type, a short title and a cited source', () => {
  for (const r of rules) {
    assert.ok(['sosia', 'caratteri', 'regole', 'cottura', 'tossicita', 'ambiente'].includes(r.kind), `tipo mancante: ${r.text}`);
    assert.ok(r.title && r.title.length <= 42, `titolo: ${r.title}`);
    const c = traits.citations[r.source];
    assert.ok(c && c.author && /^(\d{4}|s\.d\.)$/.test(c.year), `citazione per ${r.source}`);
  }
});

test('species boxes hold only species-specific warnings: generic ones live in the general rules', () => {
  const generic = ['Esemplari vecchi, molli, ammuffiti', 'I funghi possono accumulare contaminanti', 'Foto e app non certificano'];
  for (const [id, t] of Object.entries(traits.taxa)) for (const r of t.field_rules || []) assert.ok(!generic.some((g) => r.text.startsWith(g)), `${id}: ${r.text}`);
});

test('the CMS rejects unknown warning types and long titles', () => {
  const bad = structuredClone(traits);
  bad.general_rules[0].kind = 'folklore';
  assert.throws(() => validateContent('species-traits', bad), /Tipo di avviso/);
  const long = structuredClone(traits);
  long.general_rules[0].title = 'x'.repeat(61);
  assert.throws(() => validateContent('species-traits', long), /titolo/);
  assert.doesNotThrow(() => validateContent('species-traits', traits));
});
