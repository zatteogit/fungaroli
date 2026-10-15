import { test, expect } from '@playwright/test';
import { auditState, coverPhotos, loadAllImages, preparePage, sweepCover } from '../../tools/visual-audit.mjs';

// Leggibilità dei testi sulle copertine con la foto più chiara del catalogo (e con la foto autunnale
// del Monte Tancia segnalata da Matteo). Misura come tools/visual-audit.mjs: testo nascosto, contrasto
// pixel per pixel, 10° percentile; soglia 4,5:1 (3:1 per il testo grande).
const photos = coverPhotos();

/** La foto con la parte bassa (dove sta il testo) più luminosa, misurata nel browser. */
async function brightestPhoto(page) {
  const files = photos.filter((p) => !p.key.startsWith('ripiego')).map((p) => p.small);
  const best = await page.evaluate(async (list) => {
    const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
    const lin = (v) => { const n = v / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; };
    let top = { file: null, lum: -1 };
    for (const file of list) {
      const img = new Image(); img.src = file;
      try { await img.decode(); } catch { continue; }
      c.width = 64; c.height = 48; ctx.drawImage(img, 0, 0, 64, 48);
      const d = ctx.getImageData(0, 24, 64, 24).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
      const lum = s / (d.length / 4);
      if (lum > top.lum) top = { file, lum };
    }
    return top.file;
  }, files);
  return photos.find((p) => p.small === best);
}

const describeBelow = (items) => items.filter((r) => r.ratio < r.threshold).map((r) => `${r.text} (${r.where.split(' > ').pop()}): ${r.ratio} < ${r.threshold}${r.photo ? ` con ${r.photo}` : ''}`);

for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
  test(`testi della proposta e della copertina del luogo leggibili con la foto più chiara a ${width}px, tema ${theme === 'light' ? 'chiaro' : 'scuro'}`, async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 800 : 844 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', locale: 'it-IT', serviceWorkers: 'block' });
    const page = await preparePage(context, { theme });
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('#hero .cover-link')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await loadAllImages(page);
    const bright = await brightestPhoto(page);
    expect(bright).toBeTruthy();
    const hard = [bright, photos.find((p) => p.key === 'tancia · autunno sereno')].filter(Boolean);

    // proposta in home: testi sulla foto (desktop) e testi sul pannello pieno (telefono)
    const hero = await sweepCover(page, { host: '#hero .cover', img: '#hero .cover > img', size: 'hd', photos: hard });
    const heroSolid = (await auditState(page, { root: '#hero' })).filter((r) => r.method === 'pieno');
    expect(hero.items.length + heroSolid.length).toBeGreaterThan(8);
    expect(describeBelow([...hero.items, ...heroSolid])).toEqual([]);
    // prima card di «Altre buone uscite»
    const tile = await sweepCover(page, { host: '#ranking li:first-child .tile', img: '#ranking li:first-child .tile > img', size: 'small', photos: hard });
    expect(tile.items.length).toBeGreaterThan(2);
    expect(describeBelow(tile.items)).toEqual([]);

    // copertina della scheda del luogo
    await page.goto('/#/zona/tancia/0');
    await expect(page.locator('[data-view="zona"] .phero-title')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await loadAllImages(page);
    const zone = await sweepCover(page, { host: '[data-view="zona"] .phero', img: '[data-view="zona"] .phero-img > img', size: 'hd', photos: hard });
    expect(zone.items.length).toBeGreaterThan(2);
    expect(describeBelow(zone.items)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}
