import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { blend, contrastRatio, decodePng, isLargeText, parseCssColor, percentile, photoContrast, thresholdFor } from '../tools/legibility.mjs';

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('contrasto WCAG: valori di riferimento', () => {
  close(contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  close(contrastRatio([255, 255, 255], [255, 255, 255]), 1);
  // #767676 su bianco è il grigio più chiaro che passa 4,5:1
  close(contrastRatio([0x76, 0x76, 0x76], [255, 255, 255]), 4.54);
  // simmetrico
  assert.equal(contrastRatio([10, 20, 30], [200, 210, 220]), contrastRatio([200, 210, 220], [10, 20, 30]));
});

test('colori CSS calcolati: rgb, rgba, color(srgb), esadecimale, trasparente', () => {
  assert.deepEqual(parseCssColor('rgb(24, 56, 44)'), [24, 56, 44, 1]);
  assert.deepEqual(parseCssColor('rgba(255, 255, 255, 0.5)'), [255, 255, 255, 0.5]);
  assert.deepEqual(parseCssColor('rgb(16 39 31 / 34%)'), [16, 39, 31, 0.34]);
  assert.deepEqual(parseCssColor('color(srgb 1 0.5 0 / 0.25)'), [255, 127.5, 0, 0.25]);
  assert.deepEqual(parseCssColor('#f7f4ea'), [247, 244, 234, 1]);
  assert.deepEqual(parseCssColor('transparent'), [0, 0, 0, 0]);
  assert.equal(parseCssColor('oklch(0.5 0.1 120)'), null);
});

test('testo trasparente: si miscela col fondo prima del contrasto', () => {
  assert.deepEqual(blend([255, 255, 255, 0.5], [0, 0, 0]), [127.5, 127.5, 127.5]);
  // bianco all'80 % su grigio medio contrasta meno del bianco pieno
  const bg = [128, 128, 128];
  assert.ok(contrastRatio(blend([255, 255, 255, 0.8], bg), bg) < contrastRatio([255, 255, 255], bg));
});

test('testo grande: 24 px, oppure 18,66 px in grassetto', () => {
  assert.equal(isLargeText(24, 400), true);
  assert.equal(isLargeText(19, 700), true);
  assert.equal(isLargeText(19, 600), false);
  assert.equal(isLargeText(18, 800), false);
  assert.equal(thresholdFor(15, 400), 4.5);
  assert.equal(thresholdFor(32, 700), 3);
});

test('percentile', () => {
  assert.equal(percentile([5, 1, 3, 2, 4], 0), 1);
  assert.equal(percentile([5, 1, 3, 2, 4], 50), 3);
  assert.equal(percentile([5, 1, 3, 2, 4], 100), 5);
});

test('contrasto su foto: conta il 10 % peggiore del fondo, non la media', () => {
  // 10×10: 85 pixel neri e 15 bianchi; testo bianco
  const w = 10, h = 10, px = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i += 1) { const v = i < 15 ? 255 : 0; px.set([v, v, v, 255], i * 4); }
  const r = photoContrast({ pixels: px, width: w, height: h, rects: [{ x: 0, y: 0, width: 10, height: 10 }], fg: [255, 255, 255, 1] });
  close(r.worst, 1); // il 10° percentile cade sui pixel bianchi
  close(r.median, 21);
  // con il fondo tutto scuro passa
  px.fill(0); for (let i = 3; i < px.length; i += 4) px[i] = 255;
  close(photoContrast({ pixels: px, width: w, height: h, rects: [{ x: 0, y: 0, width: 10, height: 10 }], fg: [255, 255, 255, 1] }).worst, 21);
});

function png(width, height, rgb) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  // righe con filtri diversi (0 nessuno, 1 sub, 2 up) per provare il decodificatore
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const f = y % 3, line = Buffer.alloc(width * 3 + 1); line[0] = f;
    for (let x = 0; x < width * 3; x += 1) {
      const v = rgb(x, y), left = x >= 3 ? rgb(x - 3, y) : 0, up = y ? rgb(x, y - 1) : 0;
      line[x + 1] = (f === 0 ? v : f === 1 ? v - left : v - up) & 255;
    }
    rows.push(line);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}

test('decodifica PNG RGB con filtri', () => {
  const val = (x, y) => (x * 7 + y * 31) % 256;
  const out = decodePng(png(5, 4, val));
  assert.equal(out.width, 5); assert.equal(out.height, 4);
  for (let y = 0; y < 4; y += 1) for (let x = 0; x < 5; x += 1) {
    const o = (y * 5 + x) * 4;
    assert.deepEqual([...out.data.subarray(o, o + 4)], [val(x * 3, y), val(x * 3 + 1, y), val(x * 3 + 2, y), 255]);
  }
});
