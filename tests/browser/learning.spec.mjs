import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';

async function setup(page,width) {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',async route=>{
    const u=new URL(route.request().url());if(u.hostname!=='api.open-meteo.com')return route.abort();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','22026-10-12'));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();return errors;
}

for(const width of [320,1280]) test(`spiegazioni contestuali, glossario e riconoscimento del bosco a ${width}px`,async({page})=>{
  const errors=await setup(page,width),panel=page.locator(width<700?'#learning-sheet':'#learning-popover');
  await page.locator('#hero .cover-link').click();
  const trigger=page.locator('.walk-focus [data-term]').first(),original=page.url();
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();await expect(panel.locator('.difficulty-legend > div')).toHaveCount(4);
  expect(page.url()).toBe(original);
  expect(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
  await expect(page.locator('.walk-focus')).not.toHaveAttribute('open','');
  await page.locator('.walk-focus > summary').click();
  await page.locator('.walk-focus .species-link').click();await expect(panel).toBeVisible();
  await panel.locator('footer a').click();await expect(page.locator('#species-detail')).toBeVisible();
  const keyword=page.locator('#species-detail a.glossary-link[data-term="volva"]').first();
  await expect(keyword).toBeVisible();await keyword.click();await expect(panel.locator('h2')).toHaveText('Volva');
  await panel.locator('.learning-related [data-term="anello"]').click();await expect(panel.locator('h2')).toHaveText('Anello');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(keyword).toBeFocused();
  const attention=page.locator('#species-detail .attention');
  await expect(attention.locator('summary')).toHaveText('Attenzione');
  await expect(attention.locator(':scope > ul')).toBeHidden();
  await attention.locator('summary').click();await expect(attention.locator(':scope > ul')).toBeVisible();
  await attention.locator('summary').click();
  await page.locator('[data-tab="specie"]').click();await expect(page.locator('[data-view="specie"]')).toBeVisible();
  await expect(page.locator('#species-grid .sp-card')).not.toHaveCount(0);
  await expect(page.locator('[data-tab="specie"]')).toContainText('Impara');
  await page.locator('[data-view="specie"] .seg-nav a[href="#/glossario"]').click();
  await page.locator('#glossary-q').fill('ectomicorriza');await expect(page.locator('#glossary-results details')).toHaveCount(1);
  await expect(page.locator('#glossary-results')).toContainText('Micorriza');
  await page.locator('#glossary-q').fill('parola inesistente');await expect(page.locator('#glossary-results')).toContainText('Nessuna voce');
  await page.goto('/#/glossario/dislivello');await expect(page.locator('#glossary-term-dislivello')).toHaveAttribute('open','');
  await page.goto('/#/riconosci/alberi');await page.locator('[data-observation="aghi a coppie"]').click();
  await expect(page.locator('#tree-observation-count')).toHaveText('4 schede da confrontare');
  await page.locator('#tree-observation-results a').first().click();await expect(page.locator('#tree-detail h1')).toContainText('Pino nero');
  await page.goto('/#/riconosci/bosco');await page.locator('#field-glossary [data-category="Sentiero"]').click();
  await page.locator('#field-glossary-q').fill('segnavia');await expect(page.locator('#field-glossary-results')).toContainText('Segnavia');
  await page.goto('/#/riconosci');
  const deadly=page.locator('#identify .id-deadly'),notice=page.locator('#identify .id-warn');
  await expect(deadly).toBeVisible();await expect(deadly).toHaveJSProperty('tagName','DETAILS');
  await expect(deadly.locator('summary')).toHaveText('Le risposte e i filtri non escludono i funghi mortali.');
  await expect(deadly.locator('p')).toBeHidden();await expect(deadly.locator('ul,a[href^="#/fungo/"]')).toHaveCount(0);
  await expect(notice.locator('summary')).toHaveText("Non è un'identificazione.");
  for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    await deadly.screenshot({path:`/tmp/fungaroli-notice-closed-${width}-${theme}.png`});
  }
  await deadly.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(deadly.locator('p')).toBeVisible();await expect(deadly.locator('p')).toContainText('né la commestibilità');
  await deadly.screenshot({path:`/tmp/fungaroli-notice-open-${width}.png`});
  await notice.locator('summary').click();await expect(deadly.locator('p')).toBeHidden();
  await expect(notice.locator('p')).toContainText('Restringe i candidati, velenosi compresi.');
  await expect(page.locator('#identify > details[open]')).toHaveCount(1);
  // The same behaviour also works without the browser's native name grouping.
  await page.locator('#identify > details[name="identify-notices"]').evaluateAll(nodes=>nodes.forEach(el=>el.removeAttribute('name')));
  await deadly.locator('summary').click();await expect(notice.locator('p')).toBeHidden();
  await expect(page.locator('#identify > details[open]')).toHaveCount(1);
  await deadly.locator('summary').click();await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.locator('#identify [data-mode="all"]').click();
  const lamelle=page.locator('#identify .idf-primary [data-fk="hymenophore"][data-fv="lamelle"]');
  await lamelle.focus();await page.keyboard.press('Enter');await expect(lamelle).toHaveAttribute('aria-pressed','true');await expect(lamelle).toBeFocused();
  const more=page.locator('#identify [data-idf-open]');await expect(more).toHaveText('Altri');await more.click();
  const filters=page.locator('#identify-filters');await expect(filters).toBeVisible();
  await expect(filters.locator('[data-fk="hymenophore"][data-fv="lamelle"]')).toHaveAttribute('aria-pressed','true');
  await filters.locator('[data-fk="hymenophore_color"][data-fv="bianco"]').click();
  await filters.locator('[data-idf-close]').first().click();await expect(more).toBeFocused();await expect(more).toContainText('Altri');
  await expect(page.locator('#identify .idf-bar [data-fclear="hymenophore_color"]')).toBeVisible();
  await page.locator('#identify .idf-primary [data-fclear="hymenophore"]').click();
  await expect(lamelle).toHaveAttribute('aria-pressed','false');await expect(page.locator('#identify .idf-bar [data-fclear="hymenophore_color"]')).toHaveCount(0);
  await more.click();await expect(filters.locator('[data-fk="hymenophore_color"][aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(filters).toBeHidden();await expect(more).toBeFocused();
  await page.locator('#identify [data-mode="guided"]').click();await expect(page.locator('#identify .id-q-big')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
