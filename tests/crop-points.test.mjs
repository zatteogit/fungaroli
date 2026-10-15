import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const crops = JSON.parse(readFileSync(new URL('../data/crop-points.json', import.meta.url))).files;
const FORMATS = ['5:4', '3:4', '4:5', '16:7', '4:3', '1:1'];

test('every crop entry points to an existing file, with six positions between 0 and 1', () => {
  assert.ok(Object.keys(crops).length > 500);
  for (const [file, c] of Object.entries(crops)) {
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `manca ${file}`);
    for (const f of FORMATS) {
      assert.equal(c[f]?.length, 2, `${file}: formato ${f}`);
      for (const v of c[f]) assert.ok(v >= 0 && v <= 1, `${file} ${f}: ${v}`);
    }
    assert.equal(typeof c.dubbio, 'boolean');
  }
});

test('every season and weather cover has the crop of its real photo', () => {
  const dir = new URL('../assets/zones/var/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.webp'));
  assert.ok(files.length > 100);
  for (const f of files) {
    const c = crops[`assets/zones/var/${f}`];
    assert.ok(c, `copertina senza punto: ${f}`);
    const zone = f.split('-').slice(0, f.startsWith('poggio-cantalice') ? 2 : 1).join('-');
    // stessa inquadratura: le misure differiscono di qualche pixel, le posizioni quasi per nulla
    const real = crops[`assets/zones/${zone}-hd.webp`];
    for (const fm of FORMATS) for (const i of [0, 1]) assert.ok(Math.abs(c[fm][i] - real[fm][i]) < 0.03, `${f} ${fm}`);
  }
});

test('a vertical cover in 16:7 frames the subject, not the centre', () => {
  // Rascino: foto verticale con il monte in alto; in 16:7 la finestra sale verso il monte
  const y = crops['assets/zones/rascino-hd.webp']['16:7'][1];
  assert.ok(y < 0.4, `Rascino 16:7 y = ${y}`);
});
