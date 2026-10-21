// Sentieri e fascia dell'indice (OUT-11), tempi della fonte (OUT-02). Logica pura in js/walks.js
// (tests/walks.test.mjs); qui il risultato a schermo. Era tests/browser/home-orari.spec.mjs: con l'unione della
// produzione v319 i test sugli orari (OUT-03) sono stati tolti, perché orari e giorno proposto seguono la logica
// della produzione (syncAutomaticDates, practicalTiming, js/planning-time.js) e i suoi test.
// Adattato senza eseguirlo (la suite gira altrove): da lanciare con
//   npx playwright test tests/browser/sentieri-fascia.spec.mjs
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { todayISO } from '../../js/weather.js';
import { compatibleTrails } from '../../js/walks.js';
import { SPECIES } from '../../js/species.js';
test.use({ locale: 'it-IT', timezoneId: 'Europe/Rome' });

const trails = JSON.parse(readFileSync(new URL('../../data/trails.json', import.meta.url), 'utf8'));
// 16 ottobre 2026, ora legale (UTC+2): 08:00 a Roma.
const MORNING = new Date('2026-10-16T06:00:00Z');

async function setup(page, now, { species = null, width = 390 } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(now);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://**/*', (r) => r.abort());
  // meteo uniforme e favorevole, con le date allineate all'orologio della pagina
  await page.route('**/api/weather/v1/forecast?**', (r) => {
    const dates = Array.from({ length: 70 }, (_, i) => todayISO(new Date(now.getTime() + (i - 62) * 864e5)));
    const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = (v) => Array(time.length).fill(v);
    const out = Array.from({ length: new URL(r.request().url()).searchParams.get('latitude').split(',').length }, () => ({
      daily: { time: dates, precipitation_sum: Array(70).fill(7), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) },
      hourly: { time, soil_moisture_3_to_9cm: fill(0.3), soil_temperature_6cm: fill(13), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
    return r.fulfill({ json: out });
  });
  await page.addInitScript((ids) => {
    localStorage.setItem('fungaroli:legal-accepted', '62026-10-20');
    localStorage.setItem('fungaroli:prefs:v2', JSON.stringify({ target: 'funghi', speciesIds: ids }));
  }, species);
  return errors;
}
const openSec = async (page, id) => {
  const sec = page.locator(`#detail [data-sec="${id}"]`);
  if (await sec.getAttribute('open') === null) await sec.locator(':scope > summary').click({ position: { x: 5, y: 10 } });
  await expect(sec).toHaveAttribute('open', '');
  return sec;
};

test('chiodino a Rascino: il sentiero fuori fascia lo dice; la passeggiata proposta passa dalla fascia dell’indice', async ({ page }) => {
  const errors = await setup(page, MORNING, { species: ['mellea'] });
  // sentiero scelto dall'utente (491A), fuori dalla fascia dell'indice
  await page.goto('/#/zona/rascino/1/sentiero/12217083');
  const plan = page.locator('#detail .essential-sections');
  await expect(plan).toContainText('Indice della zona a');
  await expect(plan).toContainText('questo sentiero sta tra');
  await expect(page.locator('#detail')).toContainText('Bosco della zona intorno a');
  // senza sentiero scelto: la passeggiata è tra quelle compatibili con la specie alla quota dell'indice (±150 m)
  await page.goto('/#/zona/rascino/1');
  const band = +(await plan.locator('[data-sec="specie"] summary .observation-altitude b').first().textContent()).match(/(\d{3,4}) m/)[1];
  const ok = compatibleTrails(trails.zones.rascino, SPECIES.find((s) => s.id === 'mellea'), band).map((t) => String(t.id));
  const chosen = await page.locator('#detail .walk-focus[data-walk-trail]').getAttribute('data-walk-trail');
  if (ok.length) expect(ok).toContain(chosen);
  expect(errors).toEqual([]);
});

test('tempo della fonte non plausibile: il numero non si mostra, «da verificare» con il motivo', async ({ page }) => {
  const errors = await setup(page, MORNING);
  await page.goto('/#/zona/rascino/0/sentiero/12217083');
  const walk = await openSec(page, 'passeggiata');
  await expect(walk.locator('.walk-facts')).toContainText('tempo della fonte da verificare');
  await expect(walk.locator('.walk-facts')).not.toContainText('1 h 20');
  await expect(walk).toContainText('Verificalo con la sezione CAI o sul posto');
  expect(errors).toEqual([]);
});
