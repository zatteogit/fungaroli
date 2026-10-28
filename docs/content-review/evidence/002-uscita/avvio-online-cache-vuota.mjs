import { chromium } from 'playwright';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const ORIGIN = 'https://fungaroli.zatteo.workers.dev';
const exe = process.env.CHROMIUM_PATH;
const profile = mkdtempSync(join(tmpdir(), 'fronda-cold-'));
const ctx = await chromium.launchPersistentContext(profile, { executablePath: exe, headless: true, viewport: { width: 390, height: 844 } });
const page = ctx.pages()[0] || await ctx.newPage();
const errors = [], failed = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => failed.push(r.url() + ' ' + (r.failure()?.errorText || '')));
const t0 = Date.now();
const resp = await page.goto(ORIGIN + '/', { waitUntil: 'load' });
const loadMs = Date.now() - t0;
const out = { status: resp.status(), loadMs };
out.appVersion = await page.locator('meta[name="app-version"]').getAttribute('content');
out.swCacheBefore = await page.evaluate(async () => (await caches.keys()));
// wait for SW activation and precache
out.sw = await page.evaluate(async () => {
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 30000))]);
  return reg ? { scope: reg.scope, active: reg.active?.state, script: reg.active?.scriptURL } : null;
});
await page.waitForTimeout(8000);
out.caches = await page.evaluate(async () => {
  const res = {};
  for (const k of await caches.keys()) res[k] = (await (await caches.open(k)).keys()).length;
  return res;
});
out.controlledBeforeReload = await page.evaluate(() => !!navigator.serviceWorker.controller);
await page.reload({ waitUntil: 'load' });
out.controlledAfterReload = await page.evaluate(() => !!navigator.serviceWorker.controller);
out.bodyTextStart = (await page.locator('body').innerText()).slice(0, 300);
await page.screenshot({ path: new URL('./online.png', import.meta.url).pathname, fullPage: false });
// offline reopen
out.onlineErrors = [...new Set(errors)]; out.onlineFailed = [...failed]; errors.length = 0; failed.length = 0;
await ctx.setOffline(true);
await page.goto(ORIGIN + '/', { waitUntil: 'load' }).catch(e => out.offlineErr = e.message);
out.offlineVersion = await page.locator('meta[name="app-version"]').getAttribute('content').catch(() => null);
out.offlineText = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
await page.screenshot({ path: new URL('./offline.png', import.meta.url).pathname });
out.offlineErrorCount = errors.length; out.offlineUniqueErrors = [...new Set(errors)].filter(e => !e.includes("INTERNET_DISCONNECTED")); out.offlineFailedNonApi = failed.filter(u => !u.includes("/api/"));
console.log(JSON.stringify(out, null, 2));
await ctx.close();
