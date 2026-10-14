import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seasonOf, pickCover, veilOf } from '../js/zone-cover.js';

test('meteorological seasons from the chosen day', () => {
  assert.equal(seasonOf('2026-12-03'), 'inverno');
  assert.equal(seasonOf('2027-02-28'), 'inverno');
  assert.equal(seasonOf('2026-03-01'), 'primavera');
  assert.equal(seasonOf('2026-08-15'), 'estate');
  assert.equal(seasonOf('2026-10-14'), 'autunno');
});

test('a real photo of the season wins, then the seasonal version, then the base photo', () => {
  const base = { file: 'base.webp', season: 'autunno', seasons: { inverno: { file: 'inv.webp', generated: true } } };
  assert.equal(pickCover(base, '2026-10-14').file, 'base.webp');
  assert.equal(pickCover(base, '2027-01-10').file, 'inv.webp');
  assert.equal(pickCover(base, '2027-01-10').alt_of, base);
  assert.equal(pickCover(base, '2027-05-10').file, 'base.webp');
  assert.equal(pickCover(null, '2027-05-10'), null);
});

test('weather becomes a veil only for fog, rain, snow and cloud', () => {
  assert.equal(veilOf('fog'), 'fog');
  assert.equal(veilOf('storm'), 'rain');
  assert.equal(veilOf('sun'), '');
  assert.equal(veilOf('wind'), '');
});

test('every seasonal cover has a file, a known season and the credit of its source photo', () => {
  const zones = JSON.parse(readFileSync(new URL('../data/media-zones.json', import.meta.url))).zones;
  for (const [id, m] of Object.entries(zones)) {
    if (m.season) assert.ok(['inverno', 'primavera', 'estate', 'autunno'].includes(m.season), id);
    for (const [s, p] of Object.entries(m.seasons || {})) {
      assert.ok(['inverno', 'primavera', 'estate', 'autunno'].includes(s), `${id}: ${s}`);
      assert.match(p.file, /^assets\/zones\/.+\.webp$/, `${id}.${s}`);
      // elaborata o reale, l'attribuzione resta quella della foto di partenza
      assert.ok(p.author && p.license && /^https:\/\//.test(p.page), `${id}.${s}: crediti`);
    }
  }
});
