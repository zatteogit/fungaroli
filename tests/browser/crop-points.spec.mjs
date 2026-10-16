import { test, expect } from '@playwright/test';
import { todayISO } from '../../js/weather.js';
// previsione sintetica (come in weather-background.spec): la scheda del luogo mostra la sua copertina
function forecast(request) {
  const q = new URL(request.url()).searchParams, count = q.get('latitude').split(',').length;
  const days = Array.from({ length: 70 }, (_, i) => todayISO(new Date(Date.now() + (i - 62) * 864e5))), time = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`)), fill = (v) => Array(time.length).fill(v);
  return Array.from({ length: count }, () => ({ daily: { time: days, precipitation_sum: Array(70).fill(5), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) }, hourly: { time, soil_moisture_3_to_9cm: fill(.3), soil_temperature_6cm: fill(13), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
}
test.use({ locale: 'it-IT' });
const pct = (v) => `${Math.round(v * 1000) / 10}%`;
for (const width of [320, 390, 768, 1280]) test(`punti di ritaglio su copertina e schede a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/weather/v1/forecast?**', (r) => r.fulfill({ json: forecast(r.request()) }));
  await page.route('https://**', (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem('fungaroli:legal-accepted', '32026-10-16'));
  const crops = (await (await page.request.get('/data/crop-points.json')).json()).files;
  // copertina di Rascino nella scheda del luogo: la posizione è quella del suo formato, non il centro
  await page.goto('/#/zona/rascino/0');
  const cover = page.locator('.phero-img > img');
  await expect(cover).toHaveAttribute('data-image-state', 'ready');
  const file = await cover.evaluate((img) => img.getAttribute('src').slice(img.getAttribute('src').indexOf('assets/')));
  const fmt = width >= 900 ? '16:7' : '3:4';
  const [x, y] = crops[file][fmt];
  await expect.poll(() => cover.evaluate((img) => getComputedStyle(img).objectPosition)).toBe(`${pct(x)} ${pct(y)}`);
  if (fmt === '16:7') expect(y).toBeLessThan(0.4); // il monte, in alto nella foto verticale
  // una scheda del catalogo con il soggetto non al centro usa il suo 4:5
  await page.goto('/#/specie');
  const card = page.locator('#sp-cards .sp-card > img').first();
  await expect(card).toHaveAttribute('data-image-state', 'ready');
  const cardFile = await card.evaluate((img) => img.getAttribute('src').slice(img.getAttribute('src').indexOf('assets/')));
  if (crops[cardFile]) {
    const [cx, cy] = crops[cardFile]['4:5'];
    await expect.poll(() => card.evaluate((img) => getComputedStyle(img).objectPosition)).toBe(`${pct(cx)} ${pct(cy)}`);
  }
  expect(errors).toEqual([]);
});
