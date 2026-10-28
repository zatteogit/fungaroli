// Regole di raccolta nella scheda funghi anche senza indice o meteo: meteo sintetico, sessioni isolate.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8796/';
const WEATHER = { sereno: { code: 1, gust: 8, rain: 0, prob: 0 }, temporale: { code: 95, gust: 10, rain: 0, prob: 90 } };
const cases = [
  { id: 'pioppino-sereno', zone: 'vallonina', target: 'funghi', species: ['cyclocybe-aegerita'], weather: 'sereno', rules: true },
  { id: 'pioppino-temporale', zone: 'vallonina', target: 'funghi', species: ['cyclocybe-aegerita'], weather: 'temporale', rules: true },
  { id: 'porcino-meteo-assente', zone: 'allumiere-faggeto', target: 'funghi', species: ['edulis'], weather: null, rules: true },
  { id: 'porcino-sereno', zone: 'vallonina', target: 'funghi', species: ['edulis'], weather: 'sereno', rules: true },
  { id: 'piante-sereno', zone: 'vallonina', target: 'piante', species: [], weather: 'sereno', rules: false },
  { id: 'sentieri-meteo-assente', zone: 'allumiere-faggeto', target: 'passeggiata', species: [], weather: null, rules: false },
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
const report = [];
for (const c of cases) {
  const context = await browser.newContext({ locale: 'it-IT', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(sc => {
    localStorage.setItem('fungaroli:legal-accepted', '62026-10-20');
    localStorage.setItem('fungaroli:prefs:v2', JSON.stringify({ interests: [sc.target], target: sc.target, easyTrails: false, speciesIds: sc.species }));
  }, c);
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (!url.includes('/api/weather/v1/forecast') || !c.weather) return route.fulfill({ status: 503, body: '' });
    const w = WEATHER[c.weather], q = new URL(url).searchParams, count = (q.get('latitude') || '0').split(',').length;
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const days = Array.from({ length: 70 }, (_, i) => iso(new Date(Date.now() + (i - 62) * 864e5)));
    const time = days.flatMap(d => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = v => Array(time.length).fill(v);
    await route.fulfill({ json: Array.from({ length: count }, () => ({ daily: { time: days, precipitation_sum: days.map((_, i) => i % 4 ? 3 : 12), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18), et0_fao_evapotranspiration: Array(70).fill(2) }, hourly: { time, soil_moisture_3_to_9cm: fill(.3), soil_moisture_9_to_27cm: fill(.3), soil_temperature_6cm: fill(13), precipitation: fill(w.rain), precipitation_probability: fill(w.prob), weather_code: fill(w.code), wind_gusts_10m: fill(w.gust), temperature_2m: fill(13) } })) });
  });
  await page.goto(`${BASE}#/zona/${c.zone}/1`);
  await page.locator('#detail .field-tools').waitFor({ state: 'visible', timeout: 45000 });
  await page.waitForTimeout(2000);
  const rules = page.locator('#detail details.sec[data-sec="regole"]');
  const count = await rules.count();
  if (c.rules !== (count === 1)) throw Error(`${c.id}: sezione regole ${count}`);
  const r = { id: c.id, rulesSection: count, version: await page.locator('meta[name="app-version"]').getAttribute('content') };
  r.order = await page.evaluate(() => [...document.querySelectorAll('#detail details.sec[data-sec]')].map(d => d.dataset.sec));
  if (count) {
    // tastiera: apertura del riepilogo, primo dettaglio, Escape e ritorno del focus
    const summary = rules.locator('summary');
    await summary.focus(); await page.keyboard.press('Enter');
    if (!await rules.evaluate(d => d.open)) throw Error(c.id + ': regole non apribili da tastiera');
    r.cards = await rules.locator('.legal-fact b').allInnerTexts();
    const first = rules.locator('.legal-fact').first();
    await first.focus(); await page.keyboard.press('Enter');
    const dialog = page.locator('dialog.legal-rule-dialog');
    await dialog.waitFor({ state: 'visible' });
    r.dialogTitle = await dialog.locator('h2').innerText();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    r.focusReturned = await first.evaluate(el => document.activeElement === el);
    if (!r.focusReturned) throw Error(c.id + ': focus non restituito');
  }
  r.views = [];
  for (const width of [320, 390, 768, 1280]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ colorScheme: theme }); await page.waitForTimeout(250);
    const m = await page.evaluate(() => document.documentElement.scrollWidth);
    if (m > width + 1) throw Error(`${c.id}: overflow ${m} a ${width} ${theme}`);
    r.views.push(`${width}-${theme}`);
  }
  if (count) await page.screenshot({ path: new URL(`./regole-${c.id}.png`, import.meta.url).pathname, fullPage: false });
  r.aria = count ? await rules.ariaSnapshot() : null;
  report.push(r);
  await context.close();
}
await browser.close();
writeFileSync(process.argv[2], JSON.stringify(report, null, 1));
console.log(report.map(r => `${r.id}: regole=${r.rulesSection} ${r.version} ordine=${r.order.join('>')} viste=${r.views.length}${r.cards ? ' schede=' + r.cards.join('|') : ''}`).join('\n'));
