import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seasonOf, pickCover, weatherOf, SEASONS, WEATHERS } from '../js/zone-cover.js';

test('meteorological seasons from the chosen day', () => {
  assert.equal(seasonOf('2026-12-03'), 'inverno');
  assert.equal(seasonOf('2027-02-28'), 'inverno');
  assert.equal(seasonOf('2026-03-01'), 'primavera');
  assert.equal(seasonOf('2026-08-15'), 'estate');
  assert.equal(seasonOf('2026-10-14'), 'autunno');
});

test('season and weather of the day pick the image; a real photo wins at equal match', () => {
  const v = (season, weather, generated = true) => ({ season, weather, file: `assets/zones/x-${season}-${weather}.webp`, generated });
  const base = { file: 'assets/zones/x.webp', season: 'estate', weather: 'sereno', variants: [v('autunno', 'sereno'), v('autunno', 'nebbia'), v('inverno', 'neve'), v('inverno', 'sereno')] };
  assert.equal(pickCover(base, '2026-08-10', 'sun').file, 'assets/zones/x.webp');
  assert.equal(pickCover(base, '2026-10-14', 'fog').file, 'assets/zones/x-autunno-nebbia.webp');
  // pioggia d'autunno non c'è: stessa stagione col tempo sereno
  assert.equal(pickCover(base, '2026-10-14', 'rain').file, 'assets/zones/x-autunno-sereno.webp');
  assert.equal(pickCover(base, '2027-01-10', 'snow').file, 'assets/zones/x-inverno-neve.webp');
  // primavera assente: la foto base
  assert.equal(pickCover(base, '2027-04-10', 'cloud').file, 'assets/zones/x.webp');
  const real = { ...base, variants: [v('autunno', 'nebbia', true), { ...v('autunno', 'nebbia', false), file: 'assets/zones/x-real.webp' }] };
  assert.equal(pickCover(real, '2026-10-14', 'fog').file, 'assets/zones/x-real.webp');
  assert.equal(pickCover(null, '2027-05-10'), null);
});

test('weather icons map to the weather of the images', () => {
  assert.equal(weatherOf('fog'), 'nebbia');
  assert.equal(weatherOf('storm'), 'pioggia');
  assert.equal(weatherOf('wind'), 'nuvoloso');
  assert.equal(weatherOf('unknown'), 'sereno');
});

test('every cover variant has a file, a known season and weather, and the credit of its source photo', () => {
  const zones = JSON.parse(readFileSync(new URL('../data/media-zones.json', import.meta.url))).zones;
  for (const [id, m] of Object.entries(zones)) {
    if (m.season) assert.ok(SEASONS.includes(m.season), id);
    if (m.weather) assert.ok(WEATHERS.includes(m.weather), id);
    for (const p of m.variants || []) {
      assert.ok(SEASONS.includes(p.season) && WEATHERS.includes(p.weather), `${id}: ${p.season} ${p.weather}`);
      assert.match(p.file, /^assets\/zones\/.+\.webp$/, `${id}: ${p.file}`);
      // elaborata o reale, l'attribuzione resta quella della foto di partenza
      assert.ok(p.author && p.license && /^https:\/\//.test(p.page), `${id}: crediti di ${p.file}`);
    }
  }
});
