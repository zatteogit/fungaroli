// Previsioni datate salvate in automatico (decisione di Matteo, 21/10/2026; js/forecast-autosave.js, js/journal.js):
// aprire la scheda di un'uscita conserva in silenzio la previsione di zona e giorno, una sola volta; senza profilo
// resta nella memoria del diario locale; il ricordo dell'uscita si collega alla previsione che lo precede.
//   npx playwright test tests/browser/forecast-autosave.spec.mjs
import { test, expect } from '@playwright/test';
import { todayISO } from '../../js/weather.js';
test.use({ locale: 'it-IT', timezoneId: 'Europe/Rome' });

const NOW = new Date('2026-10-16T06:00:00Z');
const TODAY = todayISO(NOW), TOMORROW = todayISO(new Date(NOW.getTime() + 864e5));
const KEY = 'fungaroli:diario:v1';

async function setup(page, { diary = null } = {}) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(NOW);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://**/*', (r) => r.abort());
  await page.route('**/api/weather/v1/forecast?**', (r) => {
    const dates = Array.from({ length: 70 }, (_, i) => todayISO(new Date(NOW.getTime() + (i - 62) * 864e5)));
    const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = (v) => Array(time.length).fill(v);
    const out = Array.from({ length: new URL(r.request().url()).searchParams.get('latitude').split(',').length }, () => ({
      daily: { time: dates, precipitation_sum: Array(70).fill(7), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) },
      hourly: { time, soil_moisture_3_to_9cm: fill(0.3), soil_temperature_6cm: fill(13), soil_moisture_9_to_27cm: fill(0.32), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
    return r.fulfill({ json: out });
  });
  await page.addInitScript(({ diary, key }) => {
    if (window.top !== window) return; // la mini mappa dell'accesso è un iframe senza localStorage
    localStorage.setItem('fungaroli:legal-accepted', '62026-10-20');
    localStorage.setItem('fungaroli:prefs:v2', JSON.stringify({ target: 'funghi', speciesIds: ['edulis'] }));
    if (diary && !sessionStorage.getItem('seeded')) { localStorage.setItem(key, JSON.stringify(diary)); sessionStorage.setItem('seeded', '1'); }
  }, { diary, key: KEY });
  return errors;
}
const diary = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), KEY);
const autoPlans = async (page) => (await diary(page)).filter((e) => e.kind === 'plan' && e.auto);

test('senza profilo: aprire la scheda salva la previsione di zona e giorno in locale, una sola volta, senza mostrarla', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/#/zona/tancia/1');
  await expect(page.locator('#detail .essential-sections')).toBeVisible();
  await expect.poll(async () => (await autoPlans(page)).length).toBe(1);
  const [p] = await autoPlans(page);
  expect([p.zoneId, p.date]).toEqual(['tancia', TOMORROW]);
  expect(p.forecast.mode).toBe('prospective');
  expect(p.forecast.capturedAt).toBe(NOW.toISOString());
  // indice con e senza shock, serie del suolo profondo ed ET₀ (null se il servizio non le dà), versione del modello
  for (const k of ['scores', 'scoresNoShock', 'scoresByBand', 'scoresByBandNoShock', 'modelVersion']) expect(p.forecast[k], k).toBeTruthy();
  expect(p.forecast.inputs[0]).toHaveProperty('soilm9to27');
  expect(p.forecast.inputs[0]).toHaveProperty('et0');
  // entro il limite del server
  expect(new TextEncoder().encode(JSON.stringify(p)).length).toBeLessThan(250_000);
  // riaprire la stessa scheda (anche dopo un ricaricamento) non ne salva un'altra
  await page.reload();
  await expect(page.locator('#detail .essential-sections')).toBeVisible();
  await page.locator('#zone-days [data-day-offset="0"]').click();
  await expect.poll(async () => (await autoPlans(page)).map((e) => e.date).sort()).toEqual([TODAY, TOMORROW].sort());
  await page.locator('#zone-days [data-day-offset="1"]').click();
  await page.goto('/#/zona/tancia/1');
  await expect(page.locator('#detail .essential-sections')).toBeVisible();
  await page.waitForTimeout(300);
  expect((await autoPlans(page)).filter((e) => e.zoneId === 'tancia' && e.date === TOMORROW)).toHaveLength(1);
  // nessun pulsante nuovo e nessuna pagina nel Taccuino
  await expect(page.locator('#detail')).not.toContainText(/Salva (la )?previsione/i);
  await page.goto('/#/diario');
  await expect(page.locator('#journal-list')).not.toContainText('Giro salvato');
  await expect(page.locator('#journal-list .diary-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('un giorno passato non salva nulla; la memoria locale toglie le previsioni vecchie', async ({ page }) => {
  const old = { id: 'vecchia-1', kind: 'plan', auto: true, zoneId: 'laga', date: '2026-09-01', band: 1350, finds: {}, note: '',
    predicted: {}, forecast: { mode: 'prospective', capturedAt: '2026-08-31T08:00:00Z', scores: {} }, savedAt: '2026-08-31T08:00:00Z' };
  const manual = { ...old, id: 'manuale-1', auto: undefined };
  const errors = await setup(page, { diary: [old, manual] });
  await page.goto('/#/zona/tancia/0');
  await expect.poll(async () => (await autoPlans(page)).map((e) => e.id)).not.toContain('vecchia-1');
  const all = await diary(page);
  // il piano salvato a mano con le versioni precedenti resta
  expect(all.map((e) => e.id)).toContain('manuale-1');
  // solo oggi: nessuna previsione per giorni prima di oggi
  expect((await autoPlans(page)).every((e) => e.date >= TODAY)).toBe(true);
  expect(errors).toEqual([]);
});

test('il ricordo dell’uscita si collega alla previsione salvata prima, della stessa zona e dello stesso giorno', async ({ page }) => {
  const yesterday = new Date(NOW.getTime() - 864e5).toISOString();
  const plan = { id: 'piano-ieri', kind: 'plan', auto: true, zoneId: 'tancia', date: TODAY, band: null, finds: {}, note: '',
    predicted: { edulis: 55 }, forecast: { mode: 'prospective', capturedAt: yesterday, modelVersion: 'prova', scores: { edulis: 55 }, scoresByBand: {} }, savedAt: yesterday };
  const errors = await setup(page, { diary: [plan] });
  await page.goto('/#/diario');
  await page.locator('.diary-header-actions [data-new-outing]').click();
  const dlg = page.locator('#journal-dialog');
  await dlg.locator('[name="place"]').selectOption('tancia');
  await dlg.locator('[name="day"]').fill(TODAY);
  await dlg.getByRole('button', { name: 'Continua' }).click();
  await dlg.getByRole('button', { name: 'Salva l’uscita' }).click();
  await expect.poll(async () => (await diary(page)).filter((e) => e.kind === 'outing').length).toBe(1);
  const outing = (await diary(page)).find((e) => e.kind === 'outing');
  expect(outing.forecast.planId).toBe('piano-ieri');
  expect(outing.forecast.mode).toBe('prospective');
  expect(outing.forecast.capturedAt).toBe(yesterday);
  expect(outing.predicted).toEqual({ edulis: 55 });
  // inizio non indicato: vale l'inizio del giorno, dichiarato come limite
  expect(outing.effort.startedAtBound).toBe('inizio-del-giorno');
  expect(Date.parse(outing.effort.startedAt)).toBeGreaterThan(Date.parse(yesterday));
  // la pagina del ricordo mostra il confronto con la previsione salvata
  await expect(page.locator('#journal-list')).toContainText('Condizioni dell’uscita');
  expect(errors).toEqual([]);
});

test('una previsione salvata lo stesso giorno, senza ora d’inizio, non si collega: il ricordo resta retrospettivo', async ({ page }) => {
  const plan = { id: 'piano-oggi', kind: 'plan', auto: true, zoneId: 'tancia', date: TODAY, band: null, finds: {}, note: '',
    predicted: {}, forecast: { mode: 'prospective', capturedAt: NOW.toISOString(), scores: { edulis: 55 } }, savedAt: NOW.toISOString() };
  const errors = await setup(page, { diary: [plan] });
  await page.goto('/#/diario');
  await page.locator('.diary-header-actions [data-new-outing]').click();
  const dlg = page.locator('#journal-dialog');
  await dlg.locator('[name="place"]').selectOption('tancia');
  await dlg.getByRole('button', { name: 'Continua' }).click();
  await dlg.getByRole('button', { name: 'Salva l’uscita' }).click();
  await expect.poll(async () => (await diary(page)).filter((e) => e.kind === 'outing').length).toBe(1);
  const outing = (await diary(page)).find((e) => e.kind === 'outing');
  expect(outing.forecast.mode).toBe('retrospective');
  expect(outing.forecast.planId).toBeUndefined();
  expect(outing.effort.startedAt).toBeUndefined();
  expect(errors).toEqual([]);
});
