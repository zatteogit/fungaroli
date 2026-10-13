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
test('base privata del profilo: salvataggio, distanze, navigatori, isolamento e ripristino',async({page,browser})=>{
  await page.addInitScript(()=>{globalThis.baseGpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success){globalThis.baseGpsCalls++;success({coords:{latitude:42.5678,longitude:12.9648}});}}});});
  const errors=await setup(page),rome={name:'Roma',lat:41.9028,lon:12.4964};
  let unavailable=false;
  await page.route('**/api/community/places?*',r=>r.fulfill({json:{places:[rome]}}));
  await page.route('**/api/community/travel',async r=>{
    if(unavailable)return r.fulfill({status:503,json:{error:'Servizio temporaneamente non disponibile'}});
    const session=await page.request.get('/api/community/session'),data=await session.json();
    const targets=r.request().postDataJSON().targets;
    await r.fulfill({json:{base:data.user.base,routes:targets.map(p=>({key:`${p.lat.toFixed(5)},${p.lon.toFixed(5)}`,minutes:111,km:77})),source:'OSRM / OpenStreetMap',traffic:false}});
  });
  await register(page,'Base');const owner=(await api(page,'session')).data.user.id;
  const score=await page.locator('#hero .ring b').textContent();
  await page.locator('[data-community-account]').first().click();const profile=page.locator('dialog.profile-dialog[open]');
  await profile.locator('.base-settings summary').click();expect(await page.evaluate(()=>globalThis.baseGpsCalls)).toBe(0);await profile.locator('[data-base-gps]').click();expect(await page.evaluate(()=>globalThis.baseGpsCalls)).toBe(1);expect((await api(page,'session')).data.user.base).toBe(null);
  await profile.locator('[data-base-query]').fill('Roma');await profile.locator('[data-base-search]').click();
  await profile.locator('[data-place]').click();await profile.locator('[data-base-save]').click();await expect(profile.locator('[data-base-status]')).toContainText('Base salvata');
  expect((await api(page,'session')).data.user.base).toEqual(rome);
  for(const width of[320,390,1280]){await page.setViewportSize({width,height:900});expect(await profile.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);if(width===390)await profile.screenshot({path:'/tmp/fungaroli-profile-base-mobile.png'});}
  await profile.locator('.profile-actions [data-close]').click();await expect(page.locator('#hero .facts')).toContainText('111 min');
  expect(await page.locator('#hero .ring b').textContent()).toBe(score);
  await page.locator('#hero .cover-link').click();await page.locator('#detail [data-sec="accesso"] summary').click();
  await expect(page.locator('#detail [data-sec="accesso"]')).toContainText('Da Roma 111 min · 77 km');
  const href=await page.locator('#detail a[href*="google.com/maps/dir"]').first().getAttribute('href');expect(new URL(href).searchParams.get('origin')).toBe('41.9028,12.4964');
  await page.reload();await expect(page.locator('#detail [data-sec="accesso"]')).toContainText('Da Roma');
  expect((await api(page,'profile','PUT',{accountId:owner,base:{name:'Errata',lat:91,lon:0}})).status).toBe(422);
  expect((await page.request.post('/api/community/travel',{headers:{origin:'http://localhost:8788'},data:{targets:[]}})).status()).toBe(422);
  const csrf=await page.request.put('/api/community/profile',{headers:{origin:'https://evil.example'},data:{accountId:owner,base:null}});expect(csrf.status()).toBe(403);
  const second=await browser.newContext({serviceWorkers:'block'}),other=await second.newPage();await setup(other);await register(other,'Secondo');
  expect((await api(other,'session')).data.user.base).toBe(null);
  expect((await api(other,'profile','PUT',{accountId:owner,base:rome})).status).toBe(409);
  expect((await api(other,'travel','POST',{targets:[{lat:42.4,lon:12.8}]})).status).toBe(422);await second.close();
  expect(JSON.stringify((await api(page,'summary')).data)).not.toContain('Roma');
  unavailable=true;
  expect((await api(page,'profile','PUT',{accountId:owner,base:{name:'Leonessa',lat:42.5678,lon:12.9648}})).status).toBe(200);
  await page.reload();await page.locator('#detail [data-sec="accesso"] summary').click();
  await expect(page.locator('#detail [data-sec="accesso"]')).toContainText('in linea d’aria');await expect(page.locator('#detail [data-sec="accesso"]')).not.toContainText('111 min');
  await page.locator('[data-community-account]').first().click();await profile.locator('.base-settings summary').click();await profile.locator('[data-base-reset]').click();await expect(profile.locator('[data-base-status]')).toContainText('Base salvata');
  expect((await api(page,'session')).data.user.base).toBe(null);await profile.locator('.profile-actions [data-close]').click();
  const resetHref=await page.locator('#detail a[href*="google.com/maps/dir"]').first().getAttribute('href');expect(new URL(resetHref).searchParams.get('origin')).toBe('42.404,12.8623');
  expect(errors).toEqual([]);
});
test('vetrina varia e sentiero stabile passando dalla proposta ai giorni del taccuino', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  const errors = await setup(page);
  const proposals = page.locator('#hero [data-walk-zone], #ranking [data-walk-zone]');
  const places = await proposals.evaluateAll(nodes => nodes.map(n => n.dataset.walkZone));
  expect(places.length).toBeGreaterThan(3);
  expect(new Set(places).size).toBe(places.length);
  const paths = await proposals.evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  const trailIds = paths.map(p => p.split('/sentiero/')[1]).filter(Boolean);
  expect(new Set(trailIds).size).toBe(trailIds.length);
  await expect(page.locator('#hero .cover-walk')).toContainText('km nella zona');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/fungaroli-walks-mobile.png',fullPage:true});
  const href = await page.locator('#hero .cover-link').getAttribute('href');
  await page.locator('#hero .cover-link').click();
  const focus = page.locator('#detail .walk-focus');
  await expect(focus).toBeVisible();
  const trailId = href.split('/sentiero/')[1];
  await expect(focus).toHaveAttribute('data-walk-trail',trailId);
  await expect(focus).toContainText('Itinerario completo');
  await expect(focus).toContainText('non questo singolo sentiero');
  await page.locator('#zone-days [aria-selected="false"]').first().click();
  await expect(page).toHaveURL(new RegExp('/sentiero/'+trailId+'$'));
  await expect(focus).toHaveAttribute('data-walk-trail',trailId);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/fungaroli-walk-detail-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('tratto locale distinto dal percorso intero, segmenti separati e imbocco mancante', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/#/zona/tancia/0/sentiero/12313439');
  const focus = page.locator('#detail .walk-focus');
  await expect(focus).toHaveAttribute('data-walk-trail','12313439');
  await expect(focus).toContainText('più segmenti separati');
  await expect(focus.locator('.walk-sketch polyline')).toHaveCount(2);
  const values = await focus.locator('.walk-facts dd').allTextContents();
  expect(values[1]).toContain('4,1 km');
  expect(values[2]).toContain('9,9 km');
  const gpx = await focus.locator('a[download]').getAttribute('href');
  const xml = decodeURIComponent(gpx.split(',').slice(1).join(','));
  expect(xml.match(/<trkseg>/g)).toHaveLength(2);
  expect(xml).toContain('Tratto nella zona');
  await page.goto('/#/zona/sangiovanni/0/sentiero/12313439');
  await expect(focus).toContainText('Non disponibile; le soste indicate riguardano la zona');
  await expect(focus).toContainText('Apri un punto sulla traccia');
  expect(errors).toEqual([]);
});
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
  // Import while the archive is still opening: this must not reject a valid JSON file.
  await page.route('**/api/community/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.continue();
  });
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
  await page.goto('/'); await expect(page.locator('#followed-species')).toHaveCount(0);
  await page.goto('/#/specie'); await expect(page.locator('#sp-cards .pill')).toHaveCount(0);
  await page.locator('#sp-cards').getByRole('link',{name:'Pioppino',exact:true}).click();
  await expect(page.locator('#edible-detail')).toContainText('Pioppino');
  await expect(page.locator('#edible-detail')).toContainText('non è ancora disponibile');
  await page.goto('/'); await page.locator('#active-filters [data-more]').click();
  await input.fill('Boletus pinophilus'); await input.press('Enter');
  const pref=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')));
  expect(pref.speciesIds).toContain('pinophilus'); expect(pref.speciesIds).not.toContain('edulis');
  await page.locator('#full-filters [data-close]').first().click();
  await expect(page.locator('#hero')).toContainText('Porcino rosso');
  await page.goto('/'); await expect(page.locator('#followed-species')).toHaveCount(0);
  await page.locator('#active-filters [data-more]').click();
  await expect(page.locator('#full-filters [data-remove-species]')).toHaveCount(3);
  await expect(page.locator('#full-filters [data-remove-species] .season-badge')).toHaveCount(3);
  await page.locator('#full-filters [data-all]').click();
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
