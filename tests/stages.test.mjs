import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STAGE_IDS, STAGE_TILES, stageErrors, validateContent } from '../worker/content-validation.js';

const doc = JSON.parse(readFileSync(new URL('../data/species-traits.json', import.meta.url), 'utf8'));
const withStages = Object.entries(doc.taxa).filter(([, t]) => t.stages);

test('le fasi di crescita ci sono e passano la validazione del CMS', () => {
  assert.ok(withStages.length >= 30);
  for (const [key, t] of withStages) assert.deepEqual(stageErrors(key, t), [], key);
  assert.doesNotThrow(() => validateContent('species-traits', doc, doc));
});

test('ogni fase ha id, etichetta e fonte tra le fonti della specie', () => {
  for (const [key, t] of withStages) for (const s of t.stages) {
    assert.ok(STAGE_IDS.includes(s.id), `${key}: ${s.id}`);
    assert.ok(s.label?.trim() && s.desc?.trim(), `${key}/${s.id}: etichetta o descrizione`);
    assert.ok(t.sources.some((x) => x.url === s.source), `${key}/${s.id}: fonte non tra le fonti della specie`);
  }
});

test('le tessere sono solo quelle esistenti; la sezione solo nella fase a uovo', () => {
  for (const [key, t] of withStages) for (const s of t.stages) {
    assert.ok(s.tiles.length && s.tiles.every((x) => STAGE_TILES.includes(x)), `${key}/${s.id}`);
    if (s.tiles.includes('taglio')) assert.equal(s.id, 'uovo', `${key}/${s.id}`);
  }
});

test('forma e colori sotto il cappello sono valori già presenti nei caratteri della specie', () => {
  for (const [key, t] of withStages) for (const s of t.stages) {
    if (s.cap_shape) assert.ok(t.traits.cap_shape.includes(s.cap_shape), `${key}/${s.id}: ${s.cap_shape}`);
    for (const c of s.hymenophore_color || []) assert.ok(t.traits.hymenophore_color.includes(c), `${key}/${s.id}: ${c}`);
  }
});

test('la validazione rifiuta fasi inventate, tessere sconosciute e forme fuori dai dati', () => {
  const t = structuredClone(doc.taxa.caesarea);
  const bad = (f) => { const c = structuredClone(t); f(c.stages); return stageErrors('caesarea', c).length > 0; };
  assert.ok(bad((s) => { s[0].id = 'bottone'; }));
  assert.ok(bad((s) => { s[1].tiles = ['lamelle']; }));
  assert.ok(bad((s) => { s[1].tiles = ['cappello', 'taglio']; }));
  assert.ok(bad((s) => { s[1].cap_shape = 'imbuto'; }));
  assert.ok(bad((s) => { s[1].source = 'https://example.org/'; }));
  assert.ok(bad((s) => { delete s[1].label; }));
  assert.ok(bad((s) => { s.reverse(); }));
  const c = structuredClone(doc); c.taxa.caesarea.stages[0].tiles = ['ombra'];
  assert.throws(() => validateContent('species-traits', c, doc), /tessere/);
});
