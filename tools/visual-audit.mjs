#!/usr/bin/env node
/**
 * Audit visivo della leggibilità: visita le viste principali dell'app a più larghezze e nei due temi,
 * misura il contrasto di ogni testo visibile e scrive un report JSON e un riepilogo Markdown.
 *
 *   - testo su fondo pieno: contrasto WCAG tra colore del testo e fondo effettivo (antenati, trasparenze, opacità);
 *   - testo su foto, gradienti o vetro sfocato: screenshot del riquadro con il testo nascosto e contrasto
 *     pixel per pixel; vale il 10° percentile (il 10 % peggiore del fondo). Si misura due volte: senza ombre
 *     («rigoroso») e con l'ombra del testo («con alone», credito prudente: l'ombra conta solo dove scurisce davvero
 *     il fondo dentro il riquadro della riga). Il verdetto usa la misura con alone;
 *   - copertine: per la proposta in home, la prima card di «Altre buone uscite» e la testata del luogo prova in
 *     successione ogni foto di luogo (originali e varianti di stagione/meteo) e le foto delle specie usate come ripiego.
 *
 * Soglie: 4,5:1 testo normale, 3:1 testo grande (≥ 24 px, o ≥ 18,66 px in grassetto).
 *
 *   node tools/visual-audit.mjs --base http://127.0.0.1:8801 --out /percorso/report --label prima
 *   opzioni: --widths 320,390,768,1280  --themes light,dark  --views uscite,zona  --sweep all|none
 *            --compare /percorso/report/prima  (aggiunge il confronto prima/dopo al riepilogo)
 * Serve un server dell'app già avviato (es. npx wrangler dev --port 8801). Chromium: CHROMIUM_PATH.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AUDIT_CSS, blend, collectTextItems, contrastRatio, decodePng, photoContrast, shownTextColor, textRectsOf, thresholdFor } from './legibility.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback; };
const BASE = arg('base', 'http://127.0.0.1:8801');
const LABEL = arg('label', 'audit');
const OUT = resolve(arg('out', join(ROOT, 'test-results', 'visual-audit')), LABEL);
const WIDTHS = arg('widths', '320,390,768,1280').split(',').map(Number);
const THEMES = arg('themes', 'light,dark').split(',');
const ONLY = arg('views', '') ? arg('views', '').split(',') : null;
const SWEEP = arg('sweep', 'all');
const COMPARE = arg('compare', '');
const HEIGHT = { 320: 640, 390: 844, 768: 1024, 1280: 800 };
const CHROMIUM = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'].find((p) => existsSync(p));

// ------------------------------------------------------------------ dati per le copertine
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const CROPS = json('data/crop-points.json').files || {};
export function coverPhotos() {
  const zones = json('data/media-zones.json').zones, media = json('data/media.json').species, out = [];
  for (const [zone, z] of Object.entries(zones)) {
    out.push({ key: `${zone} · originale`, hd: z.file_hd || z.file, small: z.file });
    for (const v of z.variants || []) out.push({ key: `${zone} · ${v.season} ${v.weather}`, hd: v.file_hd || v.file, small: v.file });
  }
  // ripiego: senza foto del luogo si vede la foto della specie migliore (le 14 con modello)
  for (const id of ['edulis', 'pinophilus', 'aereus', 'aestivalis', 'caesarea', 'cibarius', 'cornucopioides', 'repandum', 'procera', 'mellea', 'virescens', 'suillus', 'terreum', 'nuda']) {
    const p = media[id]?.ref || media[id]?.inat?.[0];
    if (p) out.push({ key: `ripiego specie · ${id}`, hd: p.file_hd || p.file, small: p.file });
  }
  return out;
}

// previsione sintetica (come negli spec): così la home ha proposte, card e copertine
function forecast(url) {
  const q = new URL(url).searchParams, count = q.get('latitude').split(',').length;
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const days = Array.from({ length: 70 }, (_, i) => iso(new Date(Date.now() + (i - 62) * 864e5)));
  const time = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = (v) => Array(time.length).fill(v);
  return Array.from({ length: count }, () => ({ daily: { time: days, precipitation_sum: days.map((_, i) => (i % 4 ? 3 : 12)), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) }, hourly: { time, soil_moisture_3_to_9cm: fill(0.3), soil_temperature_6cm: fill(13), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
}

// Chiave dell'avviso legale accettato, calcolata come in js/app.js (version + verified_on): così non
// invecchia quando cambiano le regole.
const LEGAL = JSON.parse(readFileSync(join(ROOT, 'data/legal.json'), 'utf8'));
const LEGAL_KEY = String(LEGAL.version || 0) + (LEGAL.verified_on || '');

export async function preparePage(context, { legal = true, theme = 'light' } = {}) {
  const page = await context.newPage();
  const leafletJS = readFileSync(join(ROOT, 'node_modules/leaflet/dist/leaflet.js'), 'utf8');
  const leafletCSS = readFileSync(join(ROOT, 'node_modules/leaflet/dist/leaflet.css'), 'utf8');
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.endsWith('/leaflet.min.js')) return route.fulfill({ contentType: 'text/javascript', body: leafletJS });
    if (u.pathname.endsWith('/leaflet.min.css')) return route.fulfill({ contentType: 'text/css', body: leafletCSS });
    if (u.pathname === '/api/weather/v1/forecast' || u.hostname === 'api.open-meteo.com') return route.fulfill({ json: forecast(u.href) });
    return u.protocol === 'https:' ? route.abort() : route.fallback();
  });
  await page.addInitScript(([legalOk, th, key]) => {
    try {
      if (legalOk) localStorage.setItem('fungaroli:legal-accepted', key); else localStorage.removeItem('fungaroli:legal-accepted');
      localStorage.setItem('fungaroli:theme', th);
    } catch { /* storage non disponibile */ }
  }, [legal, theme, LEGAL_KEY]);
  return page;
}

/** Carica subito tutte le foto differite (il caricamento pigro dipende dallo scorrimento). */
export async function loadAllImages(page) {
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[data-src]')) { img.src = img.dataset.src; img.removeAttribute('data-src'); img.loading = 'eager'; }
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); setTimeout(r, 4000); }))));
    for (const img of document.images) if (img.naturalWidth) { img.dataset.imageState = 'ready'; img.dataset.imageFast = '1'; }
  });
}

async function ensureCss(page) {
  await page.evaluate((css) => {
    if (!document.getElementById('la-audit-css')) { const s = document.createElement('style'); s.id = 'la-audit-css'; s.textContent = css; document.head.append(s); }
    document.documentElement.classList.remove('la-hide', 'la-noshadow');
    getSelection()?.removeAllRanges();
    for (const el of document.querySelectorAll('[data-la-id]')) el.removeAttribute('data-la-id');
    for (const el of document.querySelectorAll('[data-la-host]')) el.removeAttribute('data-la-host');
    document.documentElement.dataset.laNext = '0'; document.documentElement.dataset.laHostNext = '0';
  }, AUDIT_CSS);
}

/** Scatta il riquadro del fondo con il testo nascosto (senza e con ombre) e misura gli elementi dati. */
export async function measureHost(page, host, items, { scroll = true } = {}) {
  const geo = await page.evaluate(([h, ids, sc]) => {
    const el = document.querySelector(`[data-la-host="${h}"]`);
    if (!el) return null;
    if (sc) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { host: { x: r.left, y: r.top, width: r.width, height: r.height }, vw: innerWidth, vh: innerHeight };
  }, [host, items.map((i) => i.id), scroll]);
  if (!geo) return {};
  const rects = await page.evaluate(textRectsOf, items.map((i) => i.id));
  let x0 = geo.host.x, y0 = geo.host.y, x1 = geo.host.x + geo.host.width, y1 = geo.host.y + geo.host.height;
  for (const rs of Object.values(rects)) for (const r of rs) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height); }
  const clip = { x: Math.max(0, Math.floor(x0)), y: Math.max(0, Math.floor(y0)) };
  clip.width = Math.min(geo.vw, Math.ceil(x1)) - clip.x; clip.height = Math.min(geo.vh, Math.ceil(y1)) - clip.y;
  if (clip.width < 2 || clip.height < 2) return {};
  const shownPng = items.some((i) => i.filtered) ? decodePng(await page.screenshot({ clip, animations: 'disabled' })) : null;
  await page.evaluate(() => document.documentElement.classList.add('la-hide', 'la-noshadow'));
  const strictPng = decodePng(await page.screenshot({ clip, animations: 'disabled' }));
  await page.evaluate(() => document.documentElement.classList.remove('la-noshadow'));
  const haloPng = decodePng(await page.screenshot({ clip, animations: 'disabled' }));
  await page.evaluate(() => document.documentElement.classList.remove('la-hide'));
  const out = {};
  for (const it of items) {
    const rs = (rects[it.id] || []).map((r) => ({ x: r.x - clip.x, y: r.y - clip.y, width: r.width, height: r.height }));
    if (!rs.length) continue;
    const fg = it.filtered && shownPng ? shownTextColor({ shown: shownPng.data, hidden: haloPng.data, width: haloPng.width, height: haloPng.height, rects: rs }) || it.fg : it.fg;
    const strict = photoContrast({ pixels: strictPng.data, width: strictPng.width, height: strictPng.height, rects: rs, fg });
    const halo = it.textShadow ? photoContrast({ pixels: haloPng.data, width: haloPng.width, height: haloPng.height, rects: rs, fg }) : strict;
    if (strict && halo) out[it.id] = { strict: strict.worst, halo: halo.worst, median: halo.median };
  }
  return out;
}

async function setPhoto(page, selector, src) {
  return page.evaluate(async ([sel, file, crop]) => {
    const img = document.querySelector(sel);
    if (!img) return false;
    img.removeAttribute('srcset'); img.removeAttribute('data-src');
    const map = { '5:4': '--op-54', '3:4': '--op-34', '4:5': '--op-45', '16:7': '--op-167', '4:3': '--op-43', '1:1': '--op-11' };
    for (const [k, v] of Object.entries(map)) { if (crop?.[k]) img.style.setProperty(v, `${Math.round(crop[k][0] * 1000) / 10}% ${Math.round(crop[k][1] * 1000) / 10}%`); else img.style.removeProperty(v); }
    img.src = file;
    try { await img.decode(); } catch { return false; }
    img.dataset.imageState = 'ready'; img.dataset.imageFast = '1';
    return true;
  }, [selector, src, CROPS[src] || null]);
}

const round = (n) => Math.round(n * 100) / 100;

/** Misura tutto il testo visibile nello stato corrente della pagina; se la pagina si ridisegna durante la misura, ripete. */
export async function auditState(page, opts = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const res = await auditOnce(page, opts);
    const ids = res.map((r) => r.id);
    const ok = await page.evaluate((list) => list.every((id) => document.querySelector(`[data-la-id="${id}"]`)), ids);
    if (ok || attempt >= 2) return res;
    await page.waitForTimeout(500);
  }
}
async function auditOnce(page, { root = 'body' } = {}) {
  await ensureCss(page);
  const items = await page.evaluate(collectTextItems, { root });
  const results = [];
  const byHost = new Map();
  for (const it of items) {
    const threshold = thresholdFor(it.fontSize, it.fontWeight);
    const rec = { ...it, threshold };
    if (it.method === 'pieno') {
      rec.ratio = round(contrastRatio(blend(it.fg, it.bg), it.bg)); rec.strict = rec.ratio;
    } else {
      if (!byHost.has(it.host)) byHost.set(it.host, []);
      byHost.get(it.host).push(rec);
    }
    results.push(rec);
  }
  for (const [host, group] of byHost) {
    const m = await measureHost(page, host, group);
    for (const rec of group) if (m[rec.id]) { rec.ratio = round(m[rec.id].halo); rec.strict = round(m[rec.id].strict); }
  }
  await page.evaluate(() => scrollTo(0, 0));
  return results.filter((r) => Number.isFinite(r.ratio));
}

/** Prova ogni foto del catalogo dietro una copertina e restituisce, per ogni testo, il caso peggiore. */
export async function sweepCover(page, { host, img, size = 'hd', photos = coverPhotos(), shotDir = null, tag = '' }) {
  await ensureCss(page);
  const scope = await page.evaluate(([h]) => { const el = document.querySelector(h); if (!el) return null; el.scrollIntoView({ block: 'center' }); el.setAttribute('data-la-sweep', ''); return true; }, [host]);
  if (!scope) return null;
  let items = (await page.evaluate(collectTextItems, { root: '[data-la-sweep]' })).filter((i) => i.method !== 'pieno');
  // un solo riquadro per tutta la copertina: si segna la copertina come fondo comune
  const hostId = await page.evaluate(([h]) => { const el = document.querySelector(h); el.dataset.laHost = 'sweep'; return 'sweep'; }, [host]);
  const perPhoto = [], worst = new Map();
  // la pagina può ridisegnare la copertina (meteo in background): allora si raccolgono di nuovo i testi
  const alive = () => page.evaluate((ids) => !!document.querySelector('[data-la-host="sweep"]') && ids.every((id) => document.querySelector(`[data-la-id="${id}"]`)?.isConnected), items.map((i) => i.id));
  const recollect = async () => {
    await page.evaluate(([h]) => { const el = document.querySelector(h); el.scrollIntoView({ block: 'center' }); el.setAttribute('data-la-sweep', ''); }, [host]);
    items = (await page.evaluate(collectTextItems, { root: '[data-la-sweep]' })).filter((i) => i.method !== 'pieno');
    await page.evaluate(([h]) => { document.querySelector(h).dataset.laHost = 'sweep'; }, [host]);
  };
  for (const ph of photos) {
    const file = size === 'hd' ? ph.hd : ph.small;
    let m = null;
    for (let attempt = 0; attempt < 3 && !m; attempt += 1) {
      if (!(await alive())) await recollect();
      if (!(await setPhoto(page, img, file))) break;
      const res = await measureHost(page, hostId, items, { scroll: false });
      if (await alive()) m = res;
    }
    if (!m) continue;
    let min = Infinity, minItem = null;
    for (const it of items) {
      const v = m[it.id]; if (!v) continue;
      const th = thresholdFor(it.fontSize, it.fontWeight), margin = v.halo / th;
      if (margin < min) { min = margin; minItem = { text: it.text, ratio: round(v.halo), strict: round(v.strict), threshold: th }; }
      const wk = `${it.where}|${it.text}`, w = worst.get(wk);
      if (!w || v.halo < w.ratio) worst.set(wk, { ...it, threshold: th, ratio: round(v.halo), strict: round(v.strict), photo: ph.key, file });
    }
    perPhoto.push({ photo: ph.key, file, worstMargin: round(min), worstItem: minItem, below: items.filter((it) => m[it.id] && m[it.id].halo < thresholdFor(it.fontSize, it.fontWeight)).length, measured: items.length });
  }
  perPhoto.sort((a, b) => a.worstMargin - b.worstMargin);
  if (shotDir && perPhoto.length) {
    await setPhoto(page, img, perPhoto[0].file);
    const el = page.locator(host).first();
    await el.screenshot({ path: join(shotDir, `${tag}-peggiore.png`), animations: 'disabled' }).catch(() => {});
  }
  await page.evaluate(([h]) => document.querySelector(h)?.removeAttribute('data-la-sweep'), [host]);
  return { items: [...worst.values()], perPhoto };
}

// ------------------------------------------------------------------ viste
const openAllSections = async page => page.evaluate(() => {
  // Solo per l'audit: leggere insieme anche i contenuti degli accordion esclusivi.
  document.addEventListener('toggle',e=>{if(e.target.matches('details.sec[data-sec]'))e.stopImmediatePropagation();},true);
  for(const d of document.querySelectorAll('[data-view]:not([hidden]) details')){d.removeAttribute('name');d.open=true;}
  document.querySelector('#detail')?._onSecOpen?.('meteo');
});
export const VIEWS = [
  { id: 'avvisi', path: '/', legal: false, wait: '#onboarding[open]', root: '#onboarding' },
  { id: 'uscite', path: '/', wait: '#hero .cover-link', sweep: [{ host: '#hero .cover', img: '#hero .cover > img', size: 'hd', tag: 'proposta' }, { host: '#ranking li:first-child .tile', img: '#ranking li:first-child .tile > img', size: 'small', tag: 'altre-uscite' }] },
  { id: 'zona', path: '/#/zona/tancia/0', wait: '.phero', act: openAllSections, sweep: [{ host: '[data-view="zona"] .phero', img: '[data-view="zona"] .phero-img > img', size: 'hd', tag: 'zona' }] },
  { id: 'mappa', path: '/#/mappa/tancia', wait: '.leaflet-container' },
  { id: 'funghi', path: '/#/specie', wait: '#sp-cards .sp-card' },
  { id: 'fungo', path: '/#/specie/edulis', wait: '[data-view="specie-dettaglio"] .phero', act: openAllSections },
  { id: 'piante', path: '/#/piante', wait: '[data-view="piante"] .sp-card' },
  { id: 'pianta', path: '/#/pianta/ortica', wait: '#plant-detail .phero', act: openAllSections },
  { id: 'alberi', path: '/#/alberi', wait: '[data-view="alberi"] .sp-card' },
  { id: 'albero', path: '/#/albero/faggio', wait: '[data-view="albero"] .phero', act: openAllSections },
  { id: 'impara', path: '/#/impara', wait: '[data-view="impara"] .view-title' },
  { id: 'guide', path: '/#/guide', wait: '[data-view="guide-list"] .view-title' },
  { id: 'guida', path: '/#/guide/leggere-il-bosco', wait: '#guide-body h1' },
  { id: 'glossario', path: '/#/glossario', wait: '#glossary .glossary-alphabet' },
  { id: 'termine', path: '/#/guide/leggere-il-bosco', wait: '#guide-body .glossary-link', act: async (page) => { await page.locator('#guide-body .glossary-link').first().click(); await page.waitForSelector('.learning-panel', { state: 'visible' }); }, root: '.learning-panel' },
  { id: 'sfide', path: '/#/sfide', wait: '[data-view="sfide"] .view-title' },
  { id: 'riconosci', path: '/#/riconosci', wait: '[data-view="riconosci"] [data-mode]', act: async (page) => { const b = page.locator('[data-view="riconosci"] .wiz-choice, [data-view="riconosci"] .id-opt').first(); if (await b.count()) await b.click().catch(() => {}); } },
  { id: 'riconosci-filtri', path: '/#/riconosci', wait: '[data-view="riconosci"] [data-mode]', act: async (page) => { await page.locator('[data-view="riconosci"] [data-mode="all"]').click(); } },
  { id: 'taccuino', path: '/#/diario', wait: '[data-view="diario"] .view-title, #journal-h' },
  { id: 'profilo', path: '/#/diario', wait: '#journal-h', before: async page => { await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}})); await page.route('**/api/community/session',r=>r.fulfill({json:{user:null}})); }, act: async (page) => { await page.evaluate(async()=>await (await import('/js/community.js')).communityReady()); await page.locator('.appbar [data-community-account]').first().click(); await page.waitForSelector('dialog[open]'); }, root: 'dialog[open]' },
  { id: 'profilo-con-base', path: '/#/diario', wait: '#journal-h', before: async page => {
      await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
      await page.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'contrast-fixture',handle:'Profilo di prova'}}}));
      await page.route('**/api/community/entries',r=>r.fulfill({json:{entries:[]}}));
    }, act: async page => {
      await page.evaluate(async()=>await (await import('/js/community.js')).communityReady());
      await page.locator('.appbar [data-community-account]').first().click();
      await page.locator('.base-settings > summary').click();
    }, root: 'dialog.community-dialog[open]' },
  { id: 'info', path: '/#/info', wait: '#info-h', act: openAllSections },
  { id: 'ricerca', path: '/#/glossario', wait: '#glossary .glossary-alphabet', act: async page => { await page.keyboard.press('/'); await page.locator('.search-dlg input').fill('porcino'); }, root: '.search-dlg[open]' },
  { id: 'filtri-home', path: '/', wait: '#hero .cover-link', act: async page => { await page.locator('#active-filters [data-more]').click(); }, root: '#full-filters[open]' },
  { id: 'filtri-caratteri', path: '/#/riconosci', wait: '#identify [data-mode]', act: async page => { await page.locator('#identify [data-mode="all"]').click(); await page.locator('#identify [data-idf-open]').click(); }, root: '#identify-filters[open]' },
  { id: 'osservazione', path: '/', wait: '#hero .cover-link', act: async page => { await page.locator('#community-intro [data-report]').click(); await page.locator('.report-dialog[open]').waitFor(); }, root: '.report-dialog[open]' },
  { id: 'appunto', path: '/#/diario', wait: '#journal-h', act: async page => { await page.locator('[data-new-note]').first().click(); await page.locator('.notebook-dialog[open]').waitFor(); }, root: '.notebook-dialog[open]' },
  { id: 'confronto', path: '/#/riconosci/confronta/edulis/tylopilus-felleus', wait: '.cmp-rows' },
  { id: 'riconosci-piante', path: '/#/riconosci/piante', wait: '#field-identify .gk-q' },
  { id: 'riconosci-alberi', path: '/#/riconosci/alberi', wait: '#field-identify .gk-q' },
  { id: 'metodo', path: '/#/metodo', wait: '#metodo-h' },
];

async function main() {
  mkdirSync(join(OUT, 'shots'), { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  const saved = arg('resume', '') && existsSync(arg('resume', '')) ? JSON.parse(readFileSync(arg('resume', ''), 'utf8')) : {};
  const records = saved.records || [], sweeps = saved.sweeps || [], errors = saved.errors || [];
  const completed = new Set(records.map(r=>`${r.view}|${r.width}|${r.theme}`));
  const t0 = Date.now();
  for (const width of WIDTHS) for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: { width, height: HEIGHT[width] || 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', locale: 'it-IT', serviceWorkers: 'block' });
    for (const view of VIEWS) {
      if ((ONLY && !ONLY.includes(view.id)) || completed.has(`${view.id}|${width}|${theme}`)) continue;
      const page = await preparePage(context, { legal: view.legal !== false, theme });
      page.on('pageerror', (e) => errors.push({ view: view.id, width, theme, error: e.message }));
      try {
        if(view.before)await view.before(page);
        await page.goto(BASE + view.path, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector(view.wait, { timeout: 15000 });
        await page.waitForTimeout(400);
        await page.evaluate(() => document.fonts.ready);
        await loadAllImages(page);
        if (view.act) await view.act(page);
        await loadAllImages(page);
        await page.waitForTimeout(150);
        const recs = await auditState(page, { root: view.root || 'body' });
        for (const r of recs) records.push({ view: view.id, width, theme, ...r });
        writeFileSync(join(OUT, 'progress.json'), JSON.stringify({records,errors},null,1));
        console.log(`${view.id} ${width}px ${theme}: ${recs.length} testi, ${recs.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold).length} sotto soglia`);
        if (view.sweep && SWEEP !== 'none') for (const s of view.sweep) {
          const res = await sweepCover(page, { ...s, shotDir: join(OUT, 'shots'), tag: `${s.tag}-${width}-${theme}` });
          if (!res) continue;
          sweeps.push({ view: view.id, cover: s.tag, width, theme, perPhoto: res.perPhoto });
          for (const r of res.items) records.push({ view: view.id, width, theme, sweep: s.tag, ...r });
        }
      } catch (e) {
        errors.push({ view: view.id, width, theme, error: String(e.message || e).split('\n')[0] });
      }
      await page.close();
    }
    await context.close();
    console.log(`${width}px ${theme}: ${records.length} misure finora, ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  // screenshot dei 10 casi peggiori (testo visibile), dalle misure senza variazione di foto
  const worst = distinctWorst(records.filter((r) => !r.decorative), 10);
  for (const [i, w] of (arg('shots','all')==='none'?[]:worst).entries()) {
    if (w.sweep) continue; // la copertina peggiore è già salvata dalla prova delle foto
    const view = VIEWS.find((v) => v.id === w.view);
    const context = await browser.newContext({ viewport: { width: w.width, height: HEIGHT[w.width] || 900 }, deviceScaleFactor: 1, colorScheme: w.theme, reducedMotion: 'reduce', locale: 'it-IT', serviceWorkers: 'block' });
    const page = await preparePage(context, { legal: view.legal !== false, theme: w.theme });
    try {
      if(view.before)await view.before(page);
      await page.goto(BASE + view.path, {waitUntil: 'domcontentloaded'}); await page.waitForSelector(view.wait, { timeout: 15000 }); await loadAllImages(page);
      if (view.act) await view.act(page);
      await loadAllImages(page);
      const loc = page.locator(view.root || 'body').getByText(w.text.slice(0, 40), { exact: false }).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 3000 });
      const box = await loc.boundingBox();
      if (box) await page.screenshot({ path: join(OUT, 'shots', `peggiore-${i + 1}-${w.view}-${w.width}-${w.theme}.png`), clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 40), width: Math.min(w.width - Math.max(0, box.x - 60), box.width + 120), height: box.height + 80 } });
    } catch { /* screenshot facoltativo */ }
    await context.close();
  }
  await browser.close();
  const report = { label: LABEL, base: BASE, date: new Date().toISOString(), widths: WIDTHS, themes: THEMES, records, sweeps, errors };
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const before = COMPARE && existsSync(join(COMPARE, 'report.json')) ? JSON.parse(readFileSync(join(COMPARE, 'report.json'), 'utf8')) : null;
  writeFileSync(join(OUT, 'riepilogo.md'), summary(report, before));
  const below = records.filter((r) => !r.disabled && !r.decorative && r.ratio < r.threshold).length;
  console.log(`\n${records.length} misure, ${below} sotto soglia, ${errors.length} errori. Report: ${OUT}`);
}

const fmt = (n) => String(n.toFixed(2)).replace('.', ',');
const key = (r) => `${r.view}|${r.where}|${r.text}`;
export function distinctWorst(records, n) {
  const best = new Map();
  for (const r of records) {
    const m = r.ratio / r.threshold, k = key(r);
    if (!best.has(k) || m < best.get(k).ratio / best.get(k).threshold) best.set(k, r);
  }
  return [...best.values()].sort((a, b) => a.ratio / a.threshold - b.ratio / b.threshold).slice(0, n);
}

function countTable(records, widths = WIDTHS, themes = THEMES) {
  const views = [...new Set(records.map((r) => r.view))], combos = [];
  for (const w of widths) for (const t of themes) combos.push([w, t]);
  const rows = [`| Vista | ${combos.map(([w, t]) => `${w} ${t === 'light' ? 'chiaro' : 'scuro'}`).join(' | ')} |`, `|---|${combos.map(() => '---:').join('|')}|`];
  for (const v of views) rows.push(`| ${v} | ${combos.map(([w, t]) => { const rs = records.filter((r) => r.view === v && r.width === w && r.theme === t); return rs.length ? `${rs.filter((r) => !r.disabled && !r.decorative && r.ratio < r.threshold).length}/${rs.length}` : '—'; }).join(' | ')} |`);
  return rows.join('\n');
}

function worstTable(list) {
  return ['| # | Vista | Larghezza · tema | Testo | Elemento | px/peso | Metodo | Contrasto (rigoroso) | Soglia | Foto |', '|---:|---|---|---|---|---|---|---:|---:|---|',
    ...list.map((r, i) => `| ${i + 1} | ${r.view}${r.sweep ? ` (${r.sweep})` : ''} | ${r.width} · ${r.theme === 'light' ? 'chiaro' : 'scuro'} | ${r.text.replace(/\|/g, '/').slice(0, 48)} | \`${r.where.split(' > ').slice(-2).join(' > ')}\` | ${Math.round(r.fontSize * 10) / 10}/${r.fontWeight} | ${r.method} | ${fmt(r.ratio)} (${fmt(r.strict ?? r.ratio)}) | ${String(r.threshold).replace('.', ',')} | ${r.photo || r.photoSrc || ''} |`)].join('\n');
}

export function summary(report, before) {
  const all = report.records, rs = all.filter((r) => !r.decorative), below = rs.filter((r) => !r.disabled && !r.decorative && r.ratio < r.threshold);
  const deco = all.filter((r) => r.decorative && !r.disabled && !r.decorative && r.ratio < r.threshold);
  const out = [`# Audit di leggibilità — ${report.label}`, '', `${report.date.slice(0, 16).replace('T', ' ')} · server ${report.base} · larghezze ${report.widths.join(', ')} · temi ${report.themes.join(', ')}`, '',
    'Contrasto WCAG; soglia 4,5:1 (testo normale) e 3:1 (testo grande). Testo su foto: 10° percentile pixel per pixel, testo nascosto; il valore principale tiene conto dell’ombra del testo, tra parentesi la misura rigorosa senza ombre. Le copertine sono provate con tutte le foto del catalogo: per ogni testo vale la foto peggiore.', '',
    `**${rs.length} misure, ${below.length} sotto soglia.** Errori durante la visita: ${report.errors.length}.`, ''];
  if (before) {
    const br = before.records.filter((r) => !r.decorative), bb = br.filter((r) => !r.disabled && !r.decorative && r.ratio < r.threshold);
    out.push('## Prima e dopo', '', `Sotto soglia: prima ${bb.length} su ${br.length} misure, dopo ${below.length} su ${rs.length}.`, '', '### Prima: testi sotto soglia per vista, larghezza e tema', '', countTable(br, before.widths, before.themes), '', '### I 10 casi peggiori prima', '', worstTable(distinctWorst(br, 10)), '');
  }
  out.push('## Testi sotto soglia per vista, larghezza e tema', '', 'Formato: sotto soglia / misurati (le copertine contano una misura per testo e per foto peggiore).', '', countTable(rs, report.widths, report.themes), '',
    '## I 10 casi peggiori', '', worstTable(distinctWorst(rs, 10)), '');
  const cov = report.sweeps;
  if (cov.length) {
    out.push('## Copertine: le foto più difficili', '', 'Per ogni copertina, larghezza e tema: la foto con il margine peggiore (contrasto / soglia del testo più debole) e quante foto lasciano almeno un testo sotto soglia.', '',
      '| Copertina | Larghezza · tema | Foto peggiore | Testo più debole | Contrasto | Foto con testi sotto soglia |', '|---|---|---|---|---:|---:|');
    for (const s of cov) {
      const w = s.perPhoto[0];
      out.push(`| ${s.cover} | ${s.width} · ${s.theme === 'light' ? 'chiaro' : 'scuro'} | ${w?.photo || '—'} | ${w?.worstItem?.text?.slice(0, 40) || '—'} | ${w?.worstItem ? `${fmt(w.worstItem.ratio)} / ${String(w.worstItem.threshold).replace('.', ',')}` : '—'} | ${s.perPhoto.filter((p) => p.below > 0).length}/${s.perPhoto.length} |`);
    }
    out.push('');
  }
  const groups = new Map();
  for (const r of below) { const k = `${r.where.split(' > ').slice(-2).join(' > ')} · ${r.method}`; if (!groups.has(k)) groups.set(k, { n: 0, min: Infinity, views: new Set(), ex: r }); const g = groups.get(k); g.n += 1; g.min = Math.min(g.min, r.ratio); g.views.add(r.view); }
  out.push('## Sotto soglia raggruppati per elemento', '', '| Elemento | Casi | Peggiore | Viste | Esempio |', '|---|---:|---:|---|---|',
    ...[...groups].sort((a, b) => b[1].n - a[1].n).slice(0, 60).map(([k, g]) => `| \`${k}\` | ${g.n} | ${fmt(g.min)} | ${[...g.views].join(', ')} | ${g.ex.text.replace(/\|/g, '/').slice(0, 40)} |`), '');
  if (deco.length) out.push('## Testi decorativi sotto soglia (nascosti ai lettori di schermo, esclusi dai conteggi)', '', ...[...new Map(deco.map((r) => [`${r.view}|${r.where}|${r.text}`, r])).values()].slice(0, 30).map((r) => `- ${r.view} ${r.width} ${r.theme}: «${r.text}» \`${r.where.split(' > ').slice(-2).join(' > ')}\` ${fmt(r.ratio)} / ${String(r.threshold).replace('.', ',')}`), '');
  if (report.errors.length) out.push('## Errori', '', ...report.errors.slice(0, 30).map((e) => `- ${e.view} ${e.width} ${e.theme}: ${e.error}`), '');
  return out.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main().catch((e) => { console.error(e); process.exit(1); });
