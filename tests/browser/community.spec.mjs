import { test, expect } from '@playwright/test';
import { todayISO } from '../../js/weather.js';

async function setup(page) {
  await page.route('https://**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname !== 'api.open-meteo.com') return route.abort();
    const count = u.searchParams.get('latitude').split(',').length;
    const dates = Array.from({ length: 70 }, (_, i) => todayISO(new Date(Date.now() + (i - 62) * 864e5)));
    const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));
    const fill = (v) => Array(time.length).fill(v);
    const out = Array.from({ length: count }, () => ({ daily: { time: dates, precipitation_sum: dates.map((_, i) => i % 4 ? 3 : 12), temperature_2m_mean: Array(70).fill(13), temperature_2m_min: Array(70).fill(8), temperature_2m_max: Array(70).fill(18) }, hourly: { time, soil_moisture_3_to_9cm: fill(.3), soil_temperature_6cm: fill(13), precipitation: fill(0), precipitation_probability: fill(0), weather_code: fill(1), wind_gusts_10m: fill(8), temperature_2m: fill(13) } }));
    return route.fulfill({ json: out });
  });
  await page.addInitScript(() => localStorage.setItem('fungaroli:legal-accepted', '22026-10-12'));
  const errors=[]; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#editorial a')).toHaveCount(3);
  return errors;
}
async function register(page, name) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await page.locator('#community-intro [data-community-account]').click();
  await page.locator('[data-handle]').fill(name);
  await page.locator('[data-register]').click();
  await expect(page.locator('dialog.community-dialog[open]')).toHaveCount(0);
  return cdp;
}
async function api(page, path, method='GET', data) {
  return page.evaluate(async ({path,method,data}) => { const r=await fetch('/api/community/'+path,{method,headers:data==null?{}:{'content-type':'application/json'},body:data==null?undefined:JSON.stringify(data)}); return {status:r.status,data:await r.json()}; }, {path,method,data});
}
test('editoriale, filtri completi, passkey, isolamento e condivisione revocabile', async ({ browser, page }) => {
  const errors = await setup(page);
  await expect(page.locator('#community-intro')).toContainText('nessuna segnalazione');
  await page.locator('#active-filters [data-more]').click();
  await expect(page.locator('#full-filters [data-group]')).toHaveCount(11);
  await page.locator('#full-filters [data-close]').first().click();
  await page.locator('#editorial a').first().click();
  await expect(page.locator('.editorial-article h1')).toBeVisible();
  await page.goto('/');
  await expect(page.locator('#hero .pc').first()).toHaveText(/^\d{1,2},\d$/);
  await register(page, 'Test privato A');
  const e={id:crypto.randomUUID(),kind:'outing',zoneId:'vallonina',date:todayISO(),finds:{edulis:2},searched:['edulis'],note:'nota privata da non pubblicare'};
  expect((await api(page, 'entries/'+e.id,'PUT',e)).status).toBe(200);
  expect((await api(page, 'reports','POST',{entryId:e.id,zoneId:e.zoneId,day:e.date,speciesId:'edulis',amount:2,searched:true})).status).toBe(200);
  expect((await api(page, 'reports','POST',{entryId:e.id,zoneId:e.zoneId,day:e.date,speciesId:'edulis',amount:2,searched:true})).status).toBe(200);
  const pub=await api(page,'summary');
  expect(pub.data.reports.find(r=>r.zoneId==='vallonina'&&r.speciesId==='edulis').sightings).toBe(1);
  expect(JSON.stringify(pub.data)).not.toContain(e.note); expect(JSON.stringify(pub.data)).not.toContain('Test privato A');
  const otherContext=await browser.newContext({serviceWorkers:'block'}); const other=await otherContext.newPage(); await setup(other); await register(other,'Test privato B');
  expect((await api(other,'entries')).data.entries).toEqual([]);
  expect((await api(other,'reports','POST',{entryId:e.id,zoneId:e.zoneId,day:e.date,speciesId:'edulis',amount:2})).status).toBe(404);
  await api(other,'entries/'+e.id,'DELETE');
  expect((await api(page,'entries')).data.entries).toHaveLength(1);
  const csrf=await page.request.post('/api/community/reports',{headers:{origin:'https://evil.example'},data:{}}); expect(csrf.status()).toBe(403);
  expect((await api(page,'reports','POST',{zoneId:e.zoneId,day:e.date,speciesId:'edulis',amount:0})).status).toBe(400);
  await api(page,'reports','DELETE',{entryId:e.id});
  expect((await api(page,'summary')).data.totalReports).toBe(0); expect((await api(page,'entries')).data.entries).toHaveLength(1);
  await api(page,'auth/logout','POST',{}); expect((await api(page,'entries')).status).toBe(401);
  await page.goto('/');
  await page.locator('#community-intro [data-community-account]').click(); await page.locator('[data-login]').click();
  await expect(page.locator('dialog.community-dialog[open]')).toHaveCount(0);
  expect((await api(page,'entries')).data.entries).toHaveLength(1);
  await api(page,'account','DELETE'); expect((await api(page,'session')).status).toBe(401);
  await api(other,'account','DELETE'); await otherContext.close();
  expect(errors).toEqual([]);
});

test('segnalazione rapida su telefono, conteggi e ritiro dal diario', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); const errors=await setup(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/fungaroli-mobile-home.png',fullPage:true});
  await register(page,'Test rapido');
  await page.locator('#community-intro [data-report]').click();
  const dlg=page.locator('dialog[aria-label="Segnala dal bosco"]');
  await dlg.locator('[name="zone"]').selectOption('vallonina'); await dlg.locator('[name="species"]').selectOption('procera');
  await dlg.locator('[name="amount"][value="1"]').check(); await dlg.locator('[type="submit"]').click();
  await expect(dlg.locator('[data-status]')).toContainText('conteggi collettivi');
  await dlg.locator('[data-close]').click();
  expect((await api(page,'summary')).data.reports.find(r=>r.speciesId==='procera').sightings).toBe(1);
  await page.goto('/#/diario'); await expect(page.locator('[data-withdraw-entry]')).toHaveCount(1);
  await page.locator('[data-withdraw-entry]').click();
  await expect(page.locator('#journal-list .notice')).toContainText('Segnalazioni ritirate');
  expect((await api(page,'summary')).data.totalReports).toBe(0);
  await page.locator('[data-share-entry]').click();
  await expect(page.locator('#journal-list .notice')).toContainText('Osservazioni condivise');
  expect((await api(page,'summary')).data.totalReports).toBe(1);
  await api(page,'account','DELETE'); expect((await api(page,'summary')).data.totalReports).toBe(0);
  expect(errors).toEqual([]);
});

test('previsioni datate dal server, immutabili e mutazioni che ritirano dati obsoleti', async ({ page }) => {
  await setup(page); const registerRequest=page.waitForRequest(r=>r.url().endsWith('/api/community/auth/register'));
  await register(page,'Test provenienza'); const request=await registerRequest;
  expect((await api(page,'auth/register','POST',request.postDataJSON())).status).toBe(400);
  const cookies=await page.context().cookies(); const session=cookies.find(c=>c.name==='__Host-fungaroli_session');
  expect(session.secure).toBe(true); expect(session.httpOnly).toBe(true); expect(session.sameSite).toBe('Strict');
  const id=crypto.randomUUID(), plan={id,kind:'plan',date:todayISO(),zoneId:'vallonina',forecast:{capturedAt:'2000-01-01T00:00:00Z',scores:{edulis:72}},finds:{},note:''};
  const saved=(await api(page,'entries/'+id,'PUT',plan)).data.entry;
  expect(saved.forecast.capturedAt).not.toBe(plan.forecast.capturedAt);
  const changed=structuredClone(saved); changed.forecast.scores.edulis=0;
  expect((await api(page,'entries/'+id,'PUT',changed)).data.entry.forecast.scores.edulis).toBe(72);
  const outing={id:crypto.randomUUID(),date:todayISO(),zoneId:'vallonina',kind:'outing',finds:{edulis:2},searched:['edulis'],forecast:{mode:'prospective',planId:id},effort:{startedAt:'2000-01-01T01:00:00Z'},note:''};
  const e=(await api(page,'entries/'+outing.id,'PUT',outing)).data.entry;
  expect(e.forecast.mode).toBe('retrospective');
  await api(page,'reports','POST',{entryId:e.id,day:e.date,zoneId:e.zoneId,speciesId:'edulis',amount:2});
  expect((await api(page,'summary')).data.totalReports).toBe(1);
  e.finds.edulis=0; await api(page,'entries/'+e.id,'PUT',e);
  expect((await api(page,'summary')).data.totalReports).toBe(0);
  expect((await api(page,'entries')).data.entries).toHaveLength(2);
  await api(page,'account','DELETE');
});

test('taccuini e community restano accessibili senza dati meteo', async ({ page }) => {
  await setup(page);
  await page.route('https://api.open-meteo.com/**',r=>r.abort());
  await page.evaluate(()=>{localStorage.removeItem('fungaroli:weather:v2');localStorage.removeItem('fungaroli:outing:v2');});
  await page.reload();
  await expect(page.locator('#hero [data-retry]')).toBeVisible();
  await expect(page.locator('#editorial a')).toHaveCount(3);
  await expect(page.locator('#community-intro')).toContainText('nessuna segnalazione');
  await page.locator('#community-intro [data-community-account]').click();
  await expect(page.locator('[data-register]')).toBeVisible();
});

test('migrazione esplicita del diario con codice senza pubblicare osservazioni', async ({ page }) => {
  await setup(page); await register(page,'Test migrazione');
  await page.route('**/api/diario',r=>{
    expect(r.request().headers().authorization).toBe('Bearer codice-di-test');
    return r.fulfill({json:{entries:[{id:'legacy123',date:todayISO(),zoneId:'tancia',finds:{edulis:2},note:'nota del vecchio diario',predicted:{edulis:72},savedAt:new Date().toISOString()}]}});
  });
  await page.goto('/#/diario');
  await page.locator('#journal-storage details summary').click();
  await page.locator('[data-legacy-code]').fill('codice-di-test'); await page.locator('[data-import-legacy] [type="submit"]').click();
  await expect(page.locator('[data-legacy-status]')).toContainText('1 voci importate');
  expect((await api(page,'entries')).data.entries[0].note).toBe('nota del vecchio diario');
  expect((await api(page,'summary')).data.totalReports).toBe(0);
  await api(page,'account','DELETE');
});

test('i campi del diario importato vengono visualizzati come testo', async ({ page }) => {
  await setup(page); await page.goto('/#/diario');
  const payload={id:'x123"><img src=x onerror="window.injected=1">',date:todayISO(),zoneId:'tancia',band:'<img src=x onerror="window.injected=1">',note:'<svg onload="window.injected=1">',finds:{},predicted:{},savedAt:new Date().toISOString()};
  await page.locator('#journal-import').setInputFiles({name:'diario.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({entries:[payload]}))});
  await expect(page.locator('#journal-list')).toContainText(payload.note);
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
  expect(await page.locator('#journal-list [onerror], #journal-list [onload]').count()).toBe(0);
});

test('autocomplete dei commestibili, selezione individuale, stagione e persistenza', async ({page})=>{
  await page.setViewportSize({width:390,height:844}); const errors=await setup(page);
  const baseline=await page.locator('#hero .pc').first().textContent();
  await page.locator('#active-filters [data-more]').click();
  const input=page.locator('#species-filter-search'), options=page.locator('#species-filter-options');
  await input.fill('phalloides'); await expect(options.getByRole('option')).toHaveCount(0);
  await input.fill('agrocybe aegerita'); await expect(options.getByRole('option')).toHaveCount(1);
  await input.press('ArrowDown'); await expect(input).toHaveAttribute('aria-activedescendant',/option-0$/);
  await input.press('Enter'); await expect(page.locator('[data-remove-species="cyclocybe-aegerita"]')).toBeVisible();
  await input.fill('spugnole');
  const month=Number(todayISO().slice(5,7));
  if (![3,4,5,6].includes(month)) await expect(options.getByRole('option').first()).toContainText('Fuori stagione');
  await options.getByRole('option').first().click();
  await expect(page.locator('[data-remove-species]')).toHaveCount(2);
  await page.screenshot({path:'/tmp/fungaroli-species-filter.png',fullPage:true});
  await page.locator('#full-filters [data-close]').first().click();
  await expect(page.locator('#hero')).toContainText('indice di crescita non è ancora disponibile');
  await expect(page.locator('#hero .ring')).toHaveCount(0);
  await page.locator('#hero .explore-fallback a').first().click();
  await expect(page.locator('#detail')).toContainText('Indice non ancora disponibile');
  await expect(page.locator('#detail .trails li').first()).toBeVisible();
  await page.goto('/'); await expect(page.locator('#followed-species .followed-card')).toHaveCount(2);
  await page.locator('#followed-species a').first().click();
  await expect(page.locator('#edible-detail')).toContainText('Pioppino');
  await expect(page.locator('#edible-detail')).toContainText('non è ancora disponibile');
  await page.goto('/'); await page.locator('#active-filters [data-more]').click();
  await input.fill('Boletus pinophilus'); await input.press('Enter');
  const pref=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')));
  expect(pref.speciesIds).toContain('pinophilus'); expect(pref.speciesIds).not.toContain('edulis');
  await page.locator('#full-filters [data-close]').first().click();
  await expect(page.locator('#hero')).toContainText('Porcino rosso');
  await page.goto('/'); await expect(page.locator('#followed-species .followed-card')).toHaveCount(3);
  await page.locator('#active-filters [data-more]').click(); await page.locator('#full-filters [data-all]').click();
  await page.locator('#full-filters [data-close]').first().click();
  await expect(page.locator('#hero .pc').first()).toHaveText(baseline);
  expect(errors).toEqual([]);
});

test('le nuove specie sono segnalabili e i tossici restano esclusi dal server',async({page})=>{
  const errors=await setup(page);await register(page,'Test nuovo catalogo');
  await page.locator('#community-intro [data-report]').click();
  const dlg=page.locator('dialog[aria-label="Segnala dal bosco"]');
  await expect(dlg.locator('[name="species"] option')).toHaveCount(46);
  await dlg.locator('[name="species"]').selectOption('cyclocybe-aegerita');
  await dlg.locator('[name="amount"][value="1"]').check();await dlg.locator('[type="submit"]').click();
  await expect(dlg.locator('[data-status]')).toContainText('conteggi collettivi');
  const entries=(await api(page,'entries')).data.entries; expect(entries[0].finds['cyclocybe-aegerita']).toBe(1);
  expect((await api(page,'reports','POST',{zoneId:'vallonina',speciesId:'amanita-phalloides',day:todayISO(),amount:1})).status).toBe(400);
  await dlg.locator('[data-close]').click();
  await page.goto('/#/diario');await expect(page.locator('#journal-list')).toContainText('Pioppino');
  await api(page,'account','DELETE');expect((await api(page,'summary')).data.totalReports).toBe(0);
  expect(errors).toEqual([]);
});
