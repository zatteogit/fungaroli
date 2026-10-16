import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Illustrazioni generate (schemi del glossario, aperture delle guide, infografiche): file presenti, testo
// alternativo e crediti registrati, mai al posto delle foto di una specie (AGENTS.md).
const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url)));
const has = (f) => existsSync(new URL(`../${f}`, import.meta.url));
const credited = (m) => ['alt', 'author', 'license'].every((k) => typeof m[k] === 'string' && m[k].trim());
// licenza delle illustrazioni generate: CC BY-SA 4.0 del progetto (decisione di Matteo, 16/10)
const LICENSE = 'CC BY-SA 4.0', LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.it';
const licensed = (m) => m.license === LICENSE && m.licenseUrl === LICENSE_URL && /senza opere di terzi/.test(m.note || '');

test('le aperture delle guide hanno file, testo alternativo e crediti', () => {
  for (const g of read('guides').guides.filter((x) => x.image)) {
    assert.ok(has(g.image.file), `${g.id}: manca ${g.image.file}`);
    assert.ok(credited(g.image) && licensed(g.image) && g.image.generated === true, `${g.id}: crediti incompleti`);
  }
});

test('le infografiche hanno file e crediti e sono segnate come generate', () => {
  const ids = new Set(Object.keys(read('species-id').species));
  for (const [id, m] of Object.entries(read('infografiche').species)) {
    assert.ok(ids.has(id), `${id}: specie sconosciuta`);
    assert.equal(m.file, `assets/infografiche/${id}.webp`);
    assert.ok(has(m.file), `${id}: manca ${m.file}`);
    assert.ok(credited(m) && licensed(m) && m.generated === true && m.credit, `${id}: crediti incompleti`);
  }
});

test('gli schemi generati del glossario esistono e sono schemi, non foto', () => {
  for (const [id, row] of Object.entries(read('media-glossary').terms)) for (const m of row.illustrations) {
    assert.ok(/^https:/.test(m.file) || has(m.file), `${id}: manca ${m.file}`);
    if (m.generated) assert.ok(m.kind === 'diagram' && licensed(m), `${id}: un'immagine generata deve essere uno schema con la licenza del progetto`);
  }
});

test('timbri e icone dei caratteri: licenza del progetto', () => {
  const st = read('challenges').stamps;
  assert.ok(st.license === LICENSE && st.licenseUrl === LICENSE_URL && /senza opere di terzi/.test(st.note));
  for (const f of ['trait-icons', 'tree-trait-icons']) {
    const d = read(f);
    assert.ok(d.license === LICENSE && d.licenseUrl === LICENSE_URL && /senza opere di terzi/.test(d.note), f);
  }
});

test('il segno «da rivedere con un micologo» resta sull\'ovolo buono finché non è rivisto', () => {
  const info = read('infografiche').species;
  assert.equal(info.caesarea.review, 'Da rivedere con un micologo');
  for (const m of Object.values(info)) if (m.review) assert.match(m.review, /micologo/);
});
