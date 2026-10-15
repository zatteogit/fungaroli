// Scheda zona, «Perché questo indice»: le condizioni giorno per giorno con un solo componente grafico (js/viz.js).
import { test, expect } from '@playwright/test';
import { todayISO } from '../../js/weather.js';
test.use({ locale: 'it-IT' });

const RAIN = [0, 0, 1.2, 0, 14, 22, 3, 0, 0, 0, 0.4, 0, 6, 0, 0, 31, 9, 0, 0, 0, 0, 2, 0, 0, 0, 11, 4, 0, 0, 0.2];
async function setup(page, theme = 'light') {
  await page.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname !== '/api/weather/v1/forecast' && u.hostname !== 'api.open-meteo.com') return u.protocol === 'https:' ? route.abort() : route.fallback();
    const count = u.searchParams.get('latitude').split(',').length;
    const dates = Array.from({ length: 70 }, (_, i) => todayISO(new Date(Date.now() + (i - 62) * 864e5)));
    const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));
    const tmean = dates.map((_, i) => 12 + 4 * Math.sin(i / 6));
    const fill = (v) => Array(time.length).fill(v);
    const out = Array.from({ length: count }, () => ({ daily: { time: dates, precipitation_sum: dates.map((_, i) => RAIN[i % 30]), temperature_2m_mean: tmean, temperature_2m_min: tmean.map((t) => t - 5), temperature_2m_max: tmean.map((t) => t + 6) }, hourly: { time, soil_moisture_3_to_9cm: time.map((_, h) => 0.22 + 0.12 * Math.sin(h / 120)), soil_temperature_6cm: fill(12), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
    return route.fulfill({ json: out });
  });
  await page.addInitScript((t) => { localStorage.setItem('fungaroli:legal-accepted', '22026-10-12'); localStorage.setItem('fungaroli:theme', t); }, theme);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/zona/poggio-cantalice/0');
  const meteo = page.locator('#detail [data-sec="meteo"]');
  await meteo.locator(':scope > summary').click();
  await expect(meteo).toHaveAttribute('open', '');
  await expect(meteo.locator('[data-viz] svg')).toHaveCount(4);
  return { meteo, errors };
}

// riquadri dei dati e delle etichette, letti dal browser
const geometry = (fig) => fig.evaluate((f) => {
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const svg = f.querySelector('svg'), m = svg.getScreenCTM();
  const points = [...f.querySelectorAll('.viz-line')].flatMap((p) => { const out = [], L = p.getTotalLength(); for (let s = 0; s <= L; s += 2) { const q = p.getPointAtLength(s); out.push({ x: q.x * m.a + m.e - 1, y: q.y * m.d + m.f - 1, w: 2, h: 2 }); } return out; });
  return { notes: [...f.querySelectorAll('.viz-note')].map(box), bars: [...f.querySelectorAll('.viz-bar')].map(box), points, dots: [...f.querySelectorAll('.viz-dot')].map(box), ticks: [...f.querySelectorAll('.viz-tick')].map(box), svgW: svg.getBoundingClientRect().width, figW: f.getBoundingClientRect().width };
});
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

for (const width of [320, 390, 768, 1280]) for (const theme of ['light', 'dark']) test(`condizioni giorno per giorno a ${width}px, tema ${theme}: una sola pioggia, etichette lontane dai dati`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const { meteo, errors } = await setup(page, theme);
  // una domanda per blocco, una sola pioggia nella sezione, nessun grafico doppio
  await expect(meteo.locator('.sci-q-h')).toHaveText(['Ha piovuto abbastanza, e al momento giusto?', 'Fa la temperatura giusta?', 'Il terreno è umido?', 'Come va nei prossimi giorni?']);
  await expect(meteo.locator('[data-viz="rain"]')).toHaveCount(1);
  await expect(meteo.locator('.viz-bar')).not.toHaveCount(0);
  expect(await meteo.locator('.viz-bar').evaluateAll((bars) => bars.every((b) => b.closest('[data-viz="rain"]')))).toBe(true);
  await expect(page.locator('#charts')).toHaveCount(0);
  // l'umidità del suolo si legge a parole; il valore tecnico resta nel dettaglio
  expect(await meteo.locator('[data-viz="soil"] .viz-tick').allTextContents()).toEqual(expect.arrayContaining(['secco', 'medio', 'umido']));
  await expect(meteo.locator('#sci-q-soil .sci-q-a')).not.toContainText('m³');
  // gerarchia: domanda > risposta > asse
  const size = (loc) => loc.first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const [q, a, axis] = [await size(meteo.locator('.sci-q-h')), await size(meteo.locator('.sci-q-a')), await size(meteo.locator('.viz-tick'))];
  expect(q).toBeGreaterThan(a); expect(a).toBeGreaterThan(axis);
  // il testo non porta il colore della serie
  const fills = await meteo.locator('.viz-tick, .viz-note').evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).fill))]);
  const series = await page.evaluate(() => ['--viz-water', '--viz-heat', '--viz-index'].map((v) => { const d = document.createElement('i'); d.style.color = `var(${v})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }));
  for (const f of fills) expect(series).not.toContain(f);
  for (const id of ['rain', 'temp', 'soil', 'index']) {
    const g = await geometry(meteo.locator(`[data-viz="${id}"]`));
    expect(g.svgW).toBeLessThanOrEqual(g.figW + 0.5);
    for (const n of g.notes) for (const d of [...g.bars, ...g.points, ...g.dots]) expect(hit(n, d), `${id}: etichetta sopra i dati`).toBe(false);
    for (const [k, t] of g.ticks.entries()) for (const u of g.ticks.slice(k + 1)) expect(hit(t, u), `${id}: tacche sovrapposte`).toBe(false);
  }
  // gli assi dei giorni sono allineati tra i grafici
  const lefts = await meteo.locator('[data-viz] .viz-baseline').evaluateAll((ls) => [...new Set(ls.map((l) => Math.round(l.getBoundingClientRect().left)))]);
  expect(lefts).toHaveLength(1);
  // nulla della sezione esce dallo schermo (la tabella scorre dentro il suo contenitore)
  expect(await meteo.evaluate((m) => [...m.querySelectorAll('*')].filter((e) => !e.closest('.viz-table-wrap, .viz-tip') && e.getBoundingClientRect().right > innerWidth + 0.5).map((e) => e.className.baseVal ?? e.className))).toEqual([]);
  await meteo.screenshot({ path: `/tmp/fungaroli-zone-charts-${width}-${theme}.png` });
  expect(errors).toEqual([]);
});

test('tooltip con valore e data al passaggio, al tocco e da tastiera; tabella dei valori', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const { meteo, errors } = await setup(page);
  const rain = meteo.locator('[data-viz="rain"]'), tip = rain.locator('.viz-tip');
  const date = /\d{1,2} (gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/;
  await rain.locator('.viz-hit').nth(15).hover();
  await expect(tip).toHaveClass(/\bon\b/);
  await expect(tip.locator('.viz-tip-v')).toHaveText(/^\d+(,\d)? mm$/);
  await expect(tip.locator('.viz-tip-d')).toHaveText(date);
  // la zona di tocco è tutta l'altezza del grafico, non la sola barra (≥ 44 px)
  expect((await rain.locator('.viz-hit').first().boundingBox()).height).toBeGreaterThanOrEqual(44);
  const soil = meteo.locator('[data-viz="soil"]');
  await soil.locator('.viz-plot').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(soil.locator('.viz-tip-v')).toHaveText(/^(secco|medio|umido)$/);
  await expect(soil.locator('.viz-tip-w')).toHaveText(/^0,\d\d m³\/m³$/);
  await expect(soil.locator('.viz-tip')).toHaveAttribute('role', 'status');
  const index = meteo.locator('[data-viz="index"] .viz-plot');
  await index.focus(); await page.keyboard.press('End');
  await expect(meteo.locator('[data-viz="index"] .viz-tip-v')).toHaveText(/su 10$/);
  await expect(meteo.locator('[data-viz="index"] .viz-tip-d')).toContainText('previsione');
  // la tabella ha un giorno per riga e dichiara il dato assente
  const table = meteo.locator('.viz-table');
  await table.locator('summary').click();
  await expect(table.locator('tbody tr')).toHaveCount(await meteo.locator('[data-viz="rain"] .viz-hit').count());
  await expect(table.locator('tr.is-selected')).toHaveCount(1);
  await expect(table).toContainText('dato assente: non vuol dire zero');
  expect(errors).toEqual([]);
});

test('aprire «Calcolo e fonti» non lascia l’intestazione sotto la barra in alto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  const { meteo, errors } = await setup(page);
  const summary = meteo.locator('.sci-technical > summary');
  await summary.evaluate((s) => { s.scrollIntoView({ block: 'start' }); scrollBy(0, s.getBoundingClientRect().top - 10); });
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(meteo.locator('.sci-technical')).toHaveAttribute('open', '');
  await page.waitForTimeout(200);
  const bar = await page.locator('.appbar').boundingBox();
  const top = (await summary.boundingBox()).y;
  expect(top).toBeGreaterThanOrEqual(bar.y + bar.height);
  expect(errors).toEqual([]);
});
