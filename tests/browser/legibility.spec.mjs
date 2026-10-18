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
    // attese su elementi precisi, non sulla rete ferma: con la macchina carica «networkidle» può non arrivare mai
    await expect(page.locator('#ranking li:first-child .tile > img')).toBeAttached();
    await loadAllImages(page);
    const bright = await brightestPhoto(page);
    expect(bright).toBeTruthy();
    const hard = [bright, photos.find((p) => p.key === 'tancia · autunno sereno')].filter(Boolean);

    // Proposta e alternative: misurare sia vetro/foto sia i nuovi pannelli pieni.
    const hero = await sweepCover(page, { host: '#hero .cover', img: '#hero .cover > img', size: 'hd', photos: hard });
    const heroSolid = (await auditState(page, { root: '#hero' })).filter((r) => r.method === 'pieno');
    expect(hero.items.length + heroSolid.length).toBeGreaterThan(8);
    expect(describeBelow([...hero.items, ...heroSolid])).toEqual([]);
    // prima card di «Altre buone uscite»
    const tile = await sweepCover(page, { host: '#ranking li:first-child .tile', img: '#ranking li:first-child .tile > img', size: 'small', photos: hard });
    const tileSolid=(await auditState(page,{root:'#ranking li:first-child .tile'})).filter(r=>r.method==='pieno');
    expect(tile.items.length+tileSolid.length).toBeGreaterThan(2);
    expect(describeBelow([...tile.items,...tileSolid])).toEqual([]);

    // copertina della scheda del luogo
    await page.goto('/#/zona/tancia/0');
    await expect(page.locator('[data-view="zona"] .phero-title')).toBeVisible();
    await expect(page.locator('[data-view="zona"] .phero-img > img')).toBeAttached();
    await loadAllImages(page);
    const zone = await sweepCover(page, { host: '[data-view="zona"] .phero', img: '[data-view="zona"] .phero-img > img', size: 'hd', photos: hard });
    expect(zone.items.length).toBeGreaterThan(2);
    expect(describeBelow(zone.items)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

for (const width of [390,1280]) for (const theme of ['light','dark']) {
  test(`AA: imbocchi, filtri selezionati, ricerca e 112 negli stati interattivi a ${width}px ${theme}`,async({browser})=>{
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
    const page=await preparePage(context,{theme});
    const readable=async root=>{
      const items=(await auditState(page,{root})).filter(r=>!r.disabled&&!r.decorative);
      expect(items.length).toBeGreaterThan(0);expect(describeBelow(items)).toEqual([]);
    };
    await page.goto('/#/zona/tancia/0');await page.locator('.walk-focus > summary').click();
    const head=page.locator('.walk-focus .th-chip').first();await head.hover();await expect(head).toHaveClass(/is-active/);
    await head.evaluate(el=>el.dataset.contrastTarget='head');await readable('[data-contrast-target="head"]');
    await head.focus();await readable('[data-contrast-target="head"]');
    await page.goto('/#/specie');const selected=page.locator('#species-grid .recognize-modes [aria-pressed="true"]');
    await selected.hover();await selected.evaluate(el=>el.dataset.contrastTarget='filter');await readable('[data-contrast-target="filter"]');
    await page.goto('/#/glossario');await page.keyboard.press('/');await page.locator('.search-dlg input').fill('porcino');
    const result=page.locator('.sr-item').filter({has:page.locator('small mark')}).first();await expect(result).toBeVisible();
    await result.hover();await result.evaluate(el=>el.dataset.contrastTarget='result');await readable('[data-contrast-target="result"]');
    await page.keyboard.press('Escape');await page.goto('/#/info');
    const emergency=page.locator('.em-numbers a[href="tel:112"]');await emergency.hover();await readable('.em-numbers a[href="tel:112"]');
    await emergency.evaluate(el=>el.addEventListener('click',e=>e.preventDefault()));await emergency.hover();await page.mouse.down();
    await readable('.em-numbers a[href="tel:112"]');await page.mouse.move(0,0);await page.mouse.up();
    await context.close();
  });
}

for(const theme of ['light','dark']) test(`AA: dati dei grafici e previsioni distinguibili in tema ${theme}`,async({browser})=>{
  const {parseCssColor,contrastRatio,blend}=await import('../../tools/legibility.mjs');
  const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await preparePage(context,{theme});await page.goto('/#/zona/tancia/0');await page.locator('.walk-focus').waitFor();
  await page.locator('details[data-sec="meteo"]').evaluate(el=>el.open=true);
  await page.locator('details[data-sec="meteo"] details').evaluateAll(els=>els.forEach(el=>el.open=true));
  await expect(page.locator('.viz-bar').first()).toBeAttached();
  // Il meteo asciutto della fixture non genera barre future: prova anche pioggia prevista non nulla.
  await page.evaluate(async()=>{
    const {renderViz}=await import('/js/viz.js');const figure=document.createElement('figure');figure.className='viz';figure.dataset.viz='rain';
    document.querySelector('.view:not([hidden]) .pbody').append(figure);
    renderViz(figure,{kind:'bars',name:'Pioggia di prova',values:[3,5,2],dates:['2026-10-14','2026-10-15','2026-10-16'],todayIndex:0,selectedIndex:1,format:String,y:{min:0,max:10,ticks:[{v:0,label:'0'},{v:10,label:'10 mm'}]}});
  });
  await expect(page.locator('.viz-bar.is-forecast').first()).toBeAttached();
  const paints=await page.locator('.viz-bar,.viz-line,.viz-dot,.viz-missing,.viz-threshold,.viz-selected').evaluateAll(els=>els.filter(el=>el.checkVisibility({checkVisibilityCSS:true})&&el.getAttribute('d')!=='').map(el=>{
    const s=getComputedStyle(el),box=getComputedStyle(el.closest('.pbody'));
    return {kind:el.getAttribute('class'),fill:s.fill,stroke:s.stroke,fillOpacity:Number(s.fillOpacity),strokeOpacity:Number(s.strokeOpacity),background:box.backgroundColor,window:s.getPropertyValue('--surface-2'),heat:s.getPropertyValue('--viz-heat'),dash:s.strokeDasharray};
  }));
  expect(paints.length).toBeGreaterThan(10);
  for(const p of paints){
    const bg=parseCssColor(p.background),fill=parseCssColor(p.fill),stroke=parseCssColor(p.stroke);
    const backgrounds=[bg,parseCssColor(p.window),blend([...parseCssColor(p.heat).slice(0,3),.12],bg)];
    for(const background of backgrounds){
      const ratios=[];
      if(fill)ratios.push(contrastRatio(blend([...fill.slice(0,3),fill[3]*p.fillOpacity],background),background));
      if(stroke)ratios.push(contrastRatio(blend([...stroke.slice(0,3),stroke[3]*p.strokeOpacity],background),background));
      expect(Math.max(...ratios),p.kind).toBeGreaterThanOrEqual(3);
    }
    if(p.kind.includes('viz-bar')&&p.kind.includes('is-forecast'))expect(p.dash).not.toBe('none');
  }
  await context.close();
});

for(const theme of ['light','dark']) test(`AA: pomelli degli interruttori accesi e spenti in tema ${theme}`,async({browser})=>{
  const {parseCssColor,contrastRatio,blend}=await import('../../tools/legibility.mjs');
  const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await preparePage(context,{theme});await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.locator('#appbar-home-filters [data-more]:visible,#home-filter-action [data-more]:visible').first().click();
  const paints=await page.locator('#full-filters .switch-input').evaluateAll(els=>els.flatMap(el=>[false,true].map(checked=>{
    el.checked=checked;
    const s=getComputedStyle(el),thumb=getComputedStyle(el,'::before'),dialog=getComputedStyle(el.closest('dialog'));
    return {checked:el.checked,track:s.backgroundColor,thumb:thumb.backgroundColor,edge:thumb.boxShadow.match(/(?:rgba?\([^)]*\)|color\(srgb[^)]*\))/)?.[0],background:dialog.backgroundColor};
  })));
  expect(paints.some(p=>p.checked)).toBe(true);expect(paints.some(p=>!p.checked)).toBe(true);
  for(const p of paints){
    const bg=blend(parseCssColor(p.track),parseCssColor(p.background));
    const ratios=[p.thumb,p.edge].filter(Boolean).map(color=>contrastRatio(blend(parseCssColor(color),bg),bg));
    expect(Math.max(...ratios),`interruttore ${p.checked?'acceso':'spento'}`).toBeGreaterThanOrEqual(3);
  }
  await context.close();
});
