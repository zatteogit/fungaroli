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
  await page.locator('.walk-focus .species-link').click();await expect(panel).toBeVisible();
  await panel.locator('footer a').click();await expect(page.locator('#species-detail')).toBeVisible();
  const keyword=page.locator('#species-detail a.glossary-link[data-term="volva"]').first();
  await expect(keyword).toBeVisible();await keyword.click();await expect(panel.locator('h2')).toHaveText('Volva');
  await panel.locator('.learning-related [data-term="anello"]').click();await expect(panel.locator('h2')).toHaveText('Anello');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(keyword).toBeFocused();
  await page.locator('[data-tab="specie"]').click();await expect(page.locator('[data-view="impara"]')).toBeVisible();
  await expect(page.locator('[data-tab="specie"]')).toContainText('Impara');
  await page.locator('.learn-paths a[href="#/glossario"]').click();
  await page.locator('#glossary-q').fill('ectomicorriza');await expect(page.locator('#glossary-results details')).toHaveCount(1);
  await expect(page.locator('#glossary-results')).toContainText('Micorriza');
  await page.locator('#glossary-q').fill('parola inesistente');await expect(page.locator('#glossary-results')).toContainText('Nessuna voce');
  await page.goto('/#/glossario/dislivello');await expect(page.locator('#glossary-term-dislivello')).toHaveAttribute('open','');
  await page.goto('/#/riconosci/alberi');await page.locator('[data-observation="aghi a coppie"]').click();
  await expect(page.locator('#tree-observation-count')).toHaveText('4 schede da confrontare');
  await page.locator('#tree-observation-results a').first().click();await expect(page.locator('#tree-detail h1')).toContainText('Pino nero');
  await page.goto('/#/riconosci/bosco');await page.locator('#field-glossary [data-category="Sentiero"]').click();
  await page.locator('#field-glossary-q').fill('segnavia');await expect(page.locator('#field-glossary-results')).toContainText('Segnavia');
  await page.goto('/#/riconosci');await expect(page.locator('#identify .id-deadly')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
