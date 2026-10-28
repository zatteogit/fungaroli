// Inventario dei blocchi renderizzati della pagina Uscita, in sessioni isolate con meteo sintetico.
// Uso: node inventario-uscita.mjs <radice-repo> <file-uscita.json>   (server statico avviato a parte su 8796)
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8796/';
const out = process.argv[3];
const WEATHER = { sereno: { code: 1, gust: 8, rain: 0, prob: 0 }, temporale: { code: 95, gust: 10, rain: 0, prob: 90 } };
const scenarios = [
  { id: 'vallonina-funghi-porcino-sereno', zone: 'vallonina', target: 'funghi', species: ['edulis'], weather: 'sereno' },
  { id: 'vallonina-funghi-porcino-temporale', zone: 'vallonina', target: 'funghi', species: ['edulis'], weather: 'temporale' },
  { id: 'vallonina-funghi-pioppino-sereno', zone: 'vallonina', target: 'funghi', species: ['cyclocybe-aegerita'], weather: 'sereno' },
  { id: 'vallonina-piante-sereno', zone: 'vallonina', target: 'piante', species: [], weather: 'sereno' },
  { id: 'vallonina-sentieri-sereno', zone: 'vallonina', target: 'passeggiata', species: [], weather: 'sereno' },
  { id: 'allumiere-funghi-porcino-sereno', zone: 'allumiere-faggeto', target: 'funghi', species: ['edulis'], weather: 'sereno' },
  { id: 'vallonina-piante-temporale', zone: 'vallonina', target: 'piante', species: [], weather: 'temporale' },
  { id: 'vallonina-funghi-pioppino-temporale', zone: 'vallonina', target: 'funghi', species: ['cyclocybe-aegerita'], weather: 'temporale' },
  { id: 'allumiere-sentieri-meteo-assente', zone: 'allumiere-faggeto', target: 'passeggiata', species: [], weather: null },
  { id: 'allumiere-funghi-porcino-meteo-assente', zone: 'allumiere-faggeto', target: 'funghi', species: ['edulis'], weather: null },
];

// Estrae i blocchi: figli diretti di testata e corpo, scendendo nei contenitori; per i <details> riepilogo e corpo.
const extract = () => {
  const root = document.querySelector('#detail');
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const keyOf = el => {
    if (el.dataset.sec) return 'sec-' + el.dataset.sec;
    if (el.matches('h1,.phero-title')) return 'titolo';
    if (el.matches('h2,h3')) return 'titolo-' + norm(el.textContent).toLowerCase().replace(/[^a-zà-ù]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    if (el.id) return el.id;
    const cls = [...el.classList].find(c => !['notice', 'small', 'muted', 'sec', 'btn', 'ghost', 'pill', 'glass'].includes(c));
    if (cls) return cls;
    if (el.classList.contains('notice')) return 'avviso-' + norm(el.textContent).toLowerCase().replace(/[^a-zà-ù]+/g, '-').slice(0, 24);
    return el.tagName.toLowerCase() + '-' + norm(el.textContent).toLowerCase().replace(/[^a-zà-ù]+/g, '-').slice(0, 24);
  };
  const WRAP = '.outing-visual,.phero-body,.essential-sections,.zone-more,.outing-days,.pbody,header.phero';
  const blocks = [];
  const seen = new Map();
  const push = (key, el, disclosure, text, actions) => {
    const n = (seen.get(key) || 0) + 1; seen.set(key, n);
    blocks.push({ key: n > 1 ? `${key}-${n}` : key, disclosure, actions, characters: text.length, excerpt: text.slice(0, 160), tag: el.tagName.toLowerCase() });
  };
  const walk = parent => {
    for (const el of parent.children) {
      if (el.matches('script,style,template,.shade')) continue;
      if (el.matches(WRAP)) { walk(el); continue; }
      if (el.matches('details')) {
        const summary = el.querySelector(':scope > summary');
        const wasOpen = el.open;
        el.open = true;
        const bodyText = norm([...el.children].filter(c => c !== summary).map(c => c.innerText || c.textContent).join(' '));
        const extras = [...el.querySelectorAll('.outing-extra-content')].map(c => norm(c.textContent)).join(' ');
        el.open = wasOpen;
        const k = keyOf(el);
        push(k + '.riepilogo', el, 'now', norm(summary?.innerText), 0);
        push(k + '.dettaglio', el, wasOpen ? 'now' : 'on-demand', bodyText, wasOpen ? 0 : 1);
        if (extras) push(k + '.consultazione', el, 'on-demand', extras, wasOpen ? 1 : 2);
        continue;
      }
      if (el.matches('section.outing-search')) {
        const det = el.querySelector('details');
        const wasOpen = det.open; det.open = true;
        const body = norm(det.querySelector('.outing-search-content')?.textContent);
        det.open = wasOpen;
        push('scelte.riepilogo', el, 'now', norm(det.querySelector('summary')?.innerText), 0);
        push('scelte.dettaglio', el, 'on-demand', body, 1);
        push('scelte.modifica', el, 'now', norm(el.querySelector('[data-outing-filters]')?.innerText), 0);
        continue;
      }
      const text = norm(el.innerText || el.getAttribute('aria-label') || el.querySelector('img')?.alt);
      if (!text && !el.querySelector('img')) continue;
      push(keyOf(el), el, 'now', text || '(immagine)', 0);
    }
  };
  walk(root);
  return { blocks, open: [...root.querySelectorAll('details[open]')].map(d => d.dataset.sec || d.className) };
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
const report = [];
for (const s of scenarios) {
  const context = await browser.newContext({ locale: 'it-IT', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(sc => {
    localStorage.setItem('fungaroli:legal-accepted', '62026-10-20');
    localStorage.setItem('fungaroli:prefs:v2', JSON.stringify({ interests: [sc.target], target: sc.target, easyTrails: false, speciesIds: sc.species }));
  }, s);
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (!url.includes('/api/weather/v1/forecast') || !s.weather) return route.fulfill({ status: 503, body: '' });
    const c = WEATHER[s.weather];
    const q = new URL(url).searchParams, count = (q.get('latitude') || '0').split(',').length;
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const days = Array.from({ length: 70 }, (_, i) => iso(new Date(Date.now() + (i - 62) * 864e5)));
    const time = days.flatMap(d => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = v => Array(time.length).fill(v);
    await route.fulfill({ json: Array.from({ length: count }, () => ({ daily: { time: days, precipitation_sum: days.map((_, i) => i % 4 ? 3 : 12), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18), et0_fao_evapotranspiration: Array(70).fill(2) }, hourly: { time, soil_moisture_3_to_9cm: fill(.3), soil_moisture_9_to_27cm: fill(.3), soil_temperature_6cm: fill(13), precipitation: fill(c.rain), precipitation_probability: fill(c.prob), weather_code: fill(c.code), wind_gusts_10m: fill(c.gust), temperature_2m: fill(13) } })) });
  });
  await page.goto(`${BASE}#/zona/${s.zone}/1`);
  await page.locator('#detail .field-tools').waitFor({ state: 'visible', timeout: 45000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(extract);
  report.push({ scenario: s, ...r });
  await context.close();
}
await browser.close();
writeFileSync(out, JSON.stringify(report, null, 1));
console.log(report.map(r => `${r.scenario.id}: ${r.blocks.length} blocchi`).join('\n'));
