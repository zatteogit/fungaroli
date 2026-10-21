// Aree protette, informazioni sul bosco e punto d'accesso (data/habitat-info.json, data/access-info.json).
// Decisioni del 16/10/2026: nessun punto proposto per la raccolta in zona A o B del Gran Sasso-Laga, avviso nella
// scheda, livello «Aree protette» sulla mappa, informazioni sul bosco fuori dall'indice, piste mai proposte in auto.
// Adattato il 21/10/2026 alla produzione v319 (scheda della zona riscritta, nessun pulsante «Salva» del piano)
// e alla riga d'accesso sotto l'imbocco del sentiero. Da lanciare con
//   npx playwright test tests/browser/site-info.spec.mjs
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { todayISO } from '../../js/weather.js';
import { chooseAccess, accessFieldIndex, accessRow } from '../../js/human.js';
import { prepareSiteInfo, excludedFn, infoRow, RESERVE_BAND_TEXT } from '../../js/site-info.js';
import { SPECIES } from '../../js/species.js';
test.use({ locale: 'it-IT', timezoneId: 'Europe/Rome' });

const json = (f) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), 'utf8'));
const habitat = json('habitat.json'), habitatInfo = json('habitat-info.json'), accessInfo = json('access-info.json');
const leafletJS = readFileSync(new URL('../../node_modules/leaflet/dist/leaflet.js', import.meta.url), 'utf8');
const leafletCSS = readFileSync(new URL('../../node_modules/leaflet/dist/leaflet.css', import.meta.url), 'utf8');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
// ora fissa: metà ottobre, mattina (il porcino rosso è in stagione e la fascia dei 1600 m vince a meteo uguale)
const NOW = new Date('2026-10-16T06:00:00Z');

// Il punto atteso, calcolato qui con gli stessi moduli e gli stessi dati dell'app
const si = prepareSiteInfo(habitatInfo, habitat), aidx = accessFieldIndex(accessInfo);
const rows = (zid) => (i) => accessRow(accessInfo.zones[zid].samples[i], aidx, accessInfo.zones[zid].strade);
const pinophilus = SPECIES.find((s) => s.id === 'pinophilus');
const allowedAt = (band) => chooseAccess({ hab: habitat.zones.laga, sp: pinophilus, band, rows: rows('laga'), excluded: excludedFn(si, 'laga') });
const allowed = allowedAt(1600);
const forbidden = chooseAccess({ hab: habitat.zones.laga, sp: pinophilus, band: 1600, rows: rows('laga') });

async function setup(page, { species = ['pinophilus'], target = 'funghi', width = 390, map = false, geoportale = null } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(NOW);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://**/*', (r) => r.abort());
  if (map) {
    await page.route('**/leaflet.min.js', (r) => r.fulfill({ contentType: 'text/javascript', body: leafletJS + '\n;const originalMap=L.map;L.map=(...args)=>(window.testMap=originalMap(...args));' }));
    await page.route('**/leaflet.min.css', (r) => r.fulfill({ contentType: 'text/css', body: leafletCSS }));
  }
  if (geoportale) await page.route('https://geoportale.regione.lazio.it/**', (r) => { geoportale.push(r.request().url()); return r.fulfill({ contentType: 'image/png', body: PNG }); });
  await page.route('**/api/weather/v1/forecast?**', (r) => {
    const dates = Array.from({ length: 70 }, (_, i) => todayISO(new Date(NOW.getTime() + (i - 62) * 864e5)));
    const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = (v) => Array(time.length).fill(v);
    const out = Array.from({ length: new URL(r.request().url()).searchParams.get('latitude').split(',').length }, () => ({
      daily: { time: dates, precipitation_sum: Array(70).fill(7), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) },
      hourly: { time, soil_moisture_3_to_9cm: fill(0.3), soil_temperature_6cm: fill(13), soil_moisture_9_to_27cm: fill(0.32), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
    return r.fulfill({ json: out });
  });
  await page.addInitScript(({ ids, target }) => {
    // solo nella pagina: la mini mappa dell'accesso è un iframe (OpenStreetMap, qui bloccato) e la pagina d'errore
    // del browser non ha localStorage
    if (window.top !== window) return;
    localStorage.setItem('fungaroli:legal-accepted', '62026-10-20');
    localStorage.setItem('fungaroli:prefs:v2', JSON.stringify({ target, speciesIds: ids }));
    // niente geolocalizzazione continua: si contano le richieste di posizione
    window.__geo = 0;
    if (navigator.geolocation) for (const k of ['watchPosition', 'getCurrentPosition']) navigator.geolocation[k] = () => { window.__geo++; return 0; };
  }, { ids: species, target });
  return errors;
}
const ready = async (page, v = 'ok') => {
  await expect(page.locator('html')).toHaveAttribute('data-site-info', v);
  await expect(page.locator('html')).toHaveAttribute('data-access-info', v);
};
const openSec = async (page, id) => {
  const sec = page.locator(`#detail [data-sec="${id}"]`);
  if (await sec.getAttribute('open') === null) await sec.locator(':scope > summary').click({ position: { x: 5, y: 10 } });
  await expect(sec).toHaveAttribute('open', '');
  return sec;
};

test('Laga, porcino rosso a 1600 m: nessun punto proposto in zona B, avviso e punto consentito con la sua quota', async ({ page }) => {
  // i dati di partenza: senza esclusione il punto più comodo era in zona B, dentro la fascia
  expect(infoRow(si, 'laga', forbidden.i).zona).toBe('B');
  expect(allowed.outOfBand).toBe(true);
  expect(['A', 'B']).not.toContain(infoRow(si, 'laga', allowed.i).zona);
  const errors = await setup(page);
  await page.goto('/#/zona/laga/1');
  await ready(page);
  const plan = page.locator('#detail .essential-sections');
  await expect(plan.locator('[data-sec="specie"] summary')).toContainText('1600 m');
  await expect(plan.locator('[data-sec="specie"] summary .plan-reserve')).toHaveText(RESERVE_BAND_TEXT);
  // l'avviso della zona (data/zones.json, protection) resta
  await expect(page.locator('#detail .notice').first()).toContainText('Parco Nazionale del Gran Sasso e Monti della Laga');
  const acc = await openSec(page, 'accesso');
  await expect(acc.locator('.access-reserve')).toContainText(RESERVE_BAND_TEXT);
  // mai «in auto su sentiero o pista»: il punto è su una strada; la pista, se c'è, è un'avvertenza
  await expect(acc).not.toContainText('In auto su sentiero o pista');
  // Con un imbocco del sentiero (decisione del 21/10/2026): resta l'imbocco e, sotto, una riga breve con il bosco
  // adatto consentito, il cammino e la salita dal punto sulla strada (data/access-info.json)
  const line = acc.locator('[data-access-forest]');
  if (await line.count()) {
    await expect(line).toHaveCount(1);
    await expect(line).toContainText('Punto consentito più comodo');
    await expect(line).toContainText(`a ${allowed.e} m`);
    await expect(line).toContainText('fuori dalla fascia dell’indice');
    await expect(line).toContainText(/a piedi, [+−]?\d+ m dal punto sulla strada|a bordo strada|fuori sentiero da verificare/);
    const dest = new URL(await line.locator('a', { hasText: 'punto sulla strada' }).getAttribute('href')).searchParams.get('destination');
    expect(dest).toBe(`${allowed.rlat},${allowed.rlon}`);
    expect(dest).not.toBe(`${forbidden.rlat},${forbidden.rlon}`);
    // l'imbocco resta, prima della riga; l'avviso della riserva rimanda alle avvertenze
    const items = acc.locator('.access-notes li');
    await expect(items.filter({ hasText: /Accesso da|Imbocco/ }).first()).toBeAttached();
    expect(await items.evaluateAll((li) => li.findIndex((x) => x.querySelector('[data-access-forest]')) > li.findIndex((x) => /Accesso da|Imbocco/.test(x.textContent)))).toBe(true);
    await expect(acc.locator('.access-reserve')).toContainText('Nelle avvertenze, il punto consentito più comodo');
    await expect(acc).toContainText('DIN 33466');
  } else if (await acc.getByText('Punto consentito più comodo').count()) {
    await expect(acc).toContainText(`a ${allowed.e} m`);
    await expect(acc).toContainText('fuori dalla fascia dell’indice');
    const href = await acc.locator('a', { hasText: 'punto sulla strada' }).getAttribute('href');
    const dest = new URL(href).searchParams.get('destination');
    expect(dest).toBe(`${allowed.rlat},${allowed.rlon}`);
    expect(dest).not.toBe(`${forbidden.rlat},${forbidden.rlon}`);
    await expect(acc).toContainText('Transito e sosta da verificare sul posto');
    await expect(acc).toContainText(/fuori sentiero, da verificare|a piedi su sentieri e strade mappati|a bordo strada/);
    await expect(acc).toContainText('DIN 33466');
  } else await expect(acc.locator('.access-reserve')).toContainText('sulla mappa della zona');
  // home: la proposta dice che la fascia è in zona di riserva (copertina o elenco)
  await page.goto('/#/');
  const laga = page.locator('[data-walk-zone="laga"]');
  if (await laga.count()) await expect(laga.first().locator('xpath=ancestor-or-self::*[self::li or contains(@class,"cover")][1]')).toContainText(/in zona di riserva del Parco|Fascia in zona di riserva del Parco/);
  expect(errors).toEqual([]);
});

test('scheda con imbocco del sentiero: sotto l’imbocco una riga breve con il bosco adatto, il cammino e la salita', async ({ page }) => {
  const errors = await setup(page, { species: ['edulis'] });
  let shown = 0;
  for (const zid of ['vallonina', 'tancia', 'terminillo-ovest', 'leonessa', 'domo']) {
    await page.goto(`/#/zona/${zid}/1`);
    await ready(page);
    const acc = await openSec(page, 'accesso');
    const items = acc.locator('.access-notes li');
    if (!await items.filter({ hasText: /Accesso da|Imbocco/ }).count()) continue;
    shown++;
    const line = acc.locator('[data-access-forest]');
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(/^Bosco adatto per porcino/);
    await expect(line).toContainText(/a \d{3,4} m/);
    await expect(line).toContainText(/\d+(,\d)? k?m a piedi, [+−]?\d+ m dal punto sulla strada|a bordo strada|fuori sentiero da verificare/);
    // una riga: niente paragrafi o elenchi dentro, stesso stile delle righe vicine
    await expect(line.locator('p, ul, div')).toHaveCount(0);
    expect(await line.evaluate((el) => getComputedStyle(el.closest('li')).fontSize)).toBe(await items.first().evaluate((el) => getComputedStyle(el).fontSize));
    await expect(acc.locator('.access-src')).toContainText('OpenStreetMap');
  }
  expect(shown).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('mappa, Laga: il punto d’accesso è quello consentito, su strada, con la sua quota e senza la zona B', async ({ page }) => {
  const errors = await setup(page, { width: 1280, map: true });
  await page.goto('/#/mappa/laga');
  await ready(page);
  await expect(page.locator('#map-sheet .sheet-row')).toBeVisible();
  const band = +(await page.locator('#map-sheet .sheet-row .small').first().textContent()).match(/(\d{3,4}) m s\.l\.m\./)[1];
  const ok = allowedAt(band);
  expect(['A', 'B']).not.toContain(infoRow(si, 'laga', ok.i).zona);
  await page.getByTitle("Qui lasci l'auto e prosegui a piedi").first().click();
  const text = page.locator('#map-sheet .pt-text');
  await expect(text).toContainText(`a ${ok.e} m`);
  await expect(text).toContainText('Verifica sul posto transito e possibilità di sosta');
  await expect(text).not.toContainText('su sentiero o pista');
  if (band === 1600) { await expect(text).toContainText(RESERVE_BAND_TEXT); await expect(text).toContainText('fuori dalla fascia dell’indice'); }
  const dest = new URL(await page.locator('#map-sheet .pt-actions a.btn.primary').getAttribute('href')).searchParams.get('destination');
  expect(dest).toBe(`${ok.rlat},${ok.rlon}`);
  expect(errors).toEqual([]);
});

test('informazioni sul bosco della fascia: struttura, esposizione, disturbi, aree protette e fonti, fuori dall’indice', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/#/zona/laga/1');
  await ready(page);
  const indexRing = page.locator('#detail .hero-indicators').getByRole('button', { name: /^Condizioni per l’uscita/ }).locator('b');
  const ring = await indexRing.textContent();
  const bosco = await openSec(page, 'bosco');
  const info = bosco.locator('[data-site-info="band"]');
  await expect(info).toContainText('Informazioni sul bosco, fuori dall’indice');
  await expect(info).toContainText(/Struttura: (fustaia|ceduo)/);
  await expect(info).toContainText(/Nella fascia dei 1600 m il bosco adatto è per il \d+% su versanti esposti a/);
  await expect(info).toContainText(/disturbo rilevato da satellite|Nessun disturbo rilevato da satellite/i);
  await expect(info).toContainText('In zona B il Piano del Parco esclude la raccolta');
  await expect(info).toContainText('TINITALY');
  await expect(info).toContainText('European Forest Disturbance Atlas');
  await expect(info.locator('a[href^="https://"]')).toHaveCount(4);
  const zona = await openSec(page, 'zona');
  await expect(zona.locator('[data-site-info="zone"]')).toContainText('fuori dal Lazio');
  // l'indice non cambia aprendo le informazioni
  expect(await indexRing.textContent()).toBe(ring);
  // una zona fuori dai parchi: niente righe sulle aree protette
  await page.goto('/#/zona/vallonina/1');
  const v = await openSec(page, 'bosco');
  await expect(v.locator('[data-site-info="band"]')).toContainText('Struttura:');
  await expect(v.locator('[data-site-info="band"]')).not.toContainText('Parco');
  expect(errors).toEqual([]);
});

for (const variant of ['mancanti', 'non allineati']) test(`file statici ${variant}: l'app parte, nessuna esclusione, punto e testi di prima`, async ({ page }) => {
  const errors = await setup(page);
  for (const f of ['habitat-info', 'access-info']) {
    await page.route(`**/data/${f}.json`, (r) => variant === 'mancanti' ? r.fulfill({ status: 404, body: '' })
      : r.fulfill({ json: { ...json(`${f}.json`), habitat: { ...json(`${f}.json`).habitat, generated: '2000-01-01' } } }));
  }
  await page.goto('/#/zona/laga/1');
  await ready(page, 'no');
  await expect(page.locator('#detail .essential-sections .plan-reserve')).toHaveCount(0);
  await expect(page.locator('#detail .notice').first()).toContainText('Parco Nazionale del Gran Sasso e Monti della Laga');
  const acc = await openSec(page, 'accesso');
  await expect(acc.locator('.access-reserve')).toHaveCount(0);
  await expect(acc).not.toContainText('Punto consentito');
  // senza access-info allineato niente riga sotto l'imbocco: niente cammino e salita inventati
  await expect(acc.locator('[data-access-forest]')).toHaveCount(0);
  // con un imbocco del sentiero la scheda non elenca il punto: se c'è, è quello di habitat.json, in linea d'aria
  if (await acc.getByText('Punto più comodo').count()) await expect(acc).toContainText('in linea d’aria');
  const bosco = await openSec(page, 'bosco');
  await expect(bosco.locator('[data-site-info]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mappa: livello «Aree protette» dal Geoportale con legenda A/B/C/D e attribuzione', async ({ page }) => {
  const requests = [];
  const errors = await setup(page, { width: 1280, map: true, geoportale: requests });
  await page.goto('/#/mappa/laga');
  await expect(page.locator('#map-filters')).toBeVisible();
  await ready(page);
  await page.locator('.mapctl [data-act="layers"]').first().click();
  const tile = page.locator('.mapctl [data-act="protected"]');
  await expect(tile).toContainText('Aree protette');
  await tile.click();
  await expect(tile).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => requests.some((u) => /request=GetMap/i.test(u) && u.includes('geonode%3Azoning_pngsl') || u.includes('geonode:zoning_pngsl'))).toBe(true);
  const legend = page.locator('#legend .wms-pa');
  await expect(legend).toBeVisible();
  await expect(legend).toContainText('Aree protette e zone dei piani');
  for (const t of ['riserva integrale', 'riserva generale orientata', 'aree di protezione', 'fa fede la cartografia dell’ente']) await expect(legend).toContainText(t);
  await expect(legend.locator('img.pa-leg-img')).toHaveCount(3);
  await expect(page.locator('.leaflet-control-attribution')).toContainText('Aree protette © Regione Lazio');
  // riquadro della zona: quanta parte è nel Parco (senza geometrie, solo conteggi del file)
  await expect(page.locator('#map-sheet .pa-sheet')).toContainText('Parco nazionale Gran Sasso e Monti della Laga');
  // spento: niente legenda; nessuna geolocalizzazione chiesta
  await tile.click();
  await expect(tile).toHaveAttribute('aria-pressed', 'false');
  await expect(legend).toBeHidden();
  expect(await page.evaluate(() => window.__geo)).toBe(0);
  expect(errors).toEqual([]);
});

// La produzione v319 non ha più il pulsante «Salva» del piano nella scheda della zona (journal.savePlan non è
// chiamato): la previsione datata con e senza il bonus dello shock resta coperta da tests/forecast-capture.test.mjs.

// Piante e passeggiata: nessun indice e nessun punto di raccolta, ma l'avviso del Parco e le informazioni sul bosco
// e sulle aree protette della zona restano (il Piano esclude ogni prelievo in zona A e B).
for (const target of ['piante', 'passeggiata']) test(`intento ${target}: alla Laga avviso del Parco, bosco e aree protette, nessun indice`, async ({ page }) => {
  const errors = await setup(page, { target, species: [] });
  await page.goto('/#/zona/laga/1');
  await ready(page);
  await expect(page.locator('#detail .ring')).toHaveCount(0);
  await expect(page.locator('#detail .notice', { hasText: 'Gran Sasso e Monti della Laga' })).toContainText('zone «a» e «b»');
  const zona = await openSec(page, 'zona');
  await expect(zona).toContainText('Bosco e aree protette');
  await expect(zona.locator('[data-site-info="zone"]')).toContainText('Parco nazionale Gran Sasso e Monti della Laga');
  await expect(zona.locator('[data-site-info="zone"]')).toContainText('fuori dal Lazio');
  await expect(zona).toContainText('fuori da ogni indice');
  await expect(page.locator('#detail')).not.toContainText('Punto consentito');
  expect(errors).toEqual([]);
});

test('mappa, intento passeggiata: il livello «Aree protette» ha la sua legenda anche senza indice fungino', async ({ page }) => {
  const requests = [];
  const errors = await setup(page, { target: 'passeggiata', species: [], width: 1280, map: true, geoportale: requests });
  await page.goto('/#/mappa');
  await expect(page.locator('#legend')).toContainText('Zone e sentieri mappati');
  await page.locator('.mapctl [data-act="layers"]').first().click();
  await page.locator('.mapctl [data-act="protected"]').click();
  await expect(page.locator('#legend .wms-pa')).toBeVisible();
  await expect(page.locator('#legend .wms-pa')).toContainText('prelievo di funghi e piante');
  expect(errors).toEqual([]);
});

// Difetto del 16/10/2026: nella scheda specie «Dove trovarlo nelle zone» l'indice di oggi era sulla scala 0–100.
test('scheda specie: «dove trovarlo» mostra l’indice di oggi su 0–10 con la virgola', async ({ page }) => {
  const errors = await setup(page, { species: ['edulis'] });
  await page.goto('/#/');
  await expect(page.locator('#hero .cover-index')).toBeVisible();
  await page.goto('/#/specie/edulis');
  const where = page.locator('ul.where');
  await expect(where.first()).toContainText('indice oggi');
  const texts = await where.locator('li').allTextContents();
  const shown = texts.map((t) => t.match(/indice oggi (\S+)/)?.[1]).filter(Boolean);
  expect(shown.length).toBeGreaterThan(0);
  for (const v of shown) expect(v).toMatch(/^(\d|10),\d$/);
  expect(errors).toEqual([]);
});
