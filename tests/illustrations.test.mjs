import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Illustrazioni generate (schemi del glossario, aperture delle guide, infografiche): file presenti, testo
// alternativo e crediti registrati, mai al posto delle foto di una specie (AGENTS.md).
const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url)));
const has = (f) => existsSync(new URL(`../${f}`, import.meta.url));
const credited = (m) => ['alt', 'author', 'license'].every((k) => typeof m[k] === 'string' && m[k].trim());

test('le aperture delle guide hanno file, testo alternativo e crediti', () => {
  for (const g of read('guides').guides.filter((x) => x.image)) {
    assert.ok(has(g.image.file), `${g.id}: manca ${g.image.file}`);
    assert.ok(credited(g.image) && g.image.generated === true, `${g.id}: crediti incompleti`);
  }
});

test('le infografiche hanno file e crediti e sono segnate come generate', () => {
  const ids = new Set(Object.keys(read('species-id').species));
  for (const [id, m] of Object.entries(read('infografiche').species)) {
    assert.ok(ids.has(id), `${id}: specie sconosciuta`);
    assert.equal(m.file, `assets/infografiche/${id}.webp`);
    assert.ok(has(m.file), `${id}: manca ${m.file}`);
    assert.ok(credited(m) && m.generated === true && m.credit, `${id}: crediti incompleti`);
  }
});

test('gli schemi generati del glossario esistono e sono schemi, non foto', () => {
  for (const [id, row] of Object.entries(read('media-glossary').terms)) for (const m of row.illustrations) {
    assert.ok(/^https:/.test(m.file) || has(m.file), `${id}: manca ${m.file}`);
    if (m.generated) assert.equal(m.kind, 'diagram', `${id}: un'immagine generata deve essere uno schema`);
  }
});
