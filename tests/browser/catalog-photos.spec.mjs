import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';
async function setup(page,width) {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.pathname!=='/api/weather/v1/forecast'&&u.hostname!=='api.open-meteo.com')return u.protocol==='https:'?route.abort():route.fallback();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();return errors;
}

for(const width of [320,1280])for(const theme of ['light','dark'])test(`nuove gallerie reali, zoom e scoperte a ${width}px in ${theme}`,async({page})=>{
 const errors=await setup(page,width);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 await expect(page.locator('#during-walk')).toBeVisible();await page.locator('#during-walk').screenshot({path:`/tmp/fungaroli-discoveries-${width}-${theme}.png`});
 for(const [route,selector,count,author]of [['/#/commestibile/agaricus-bisporus','#edible-detail',2,/iNaturalist/],['/#/pianta/rovo','#plant-detail',3,/Trieste/],['/#/albero/noce','#tree-detail',3,/Trieste/]]){
  await page.goto(route);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  const view=page.locator(selector);await expect(view.locator('.phero-img img')).toHaveAttribute('data-image-state','ready');await expect(view.locator('.sp-strip button')).toHaveCount(count-1);await expect(view.locator('[data-note-kind]')).toHaveCount(1);await expect(view).toContainText(author);
  await view.screenshot({path:`/tmp/fungaroli-gallery-${route.split('/').at(-1)}-${width}-${theme}.png`});await view.locator('.phero-img').click();await expect(page.locator('.lb[open]')).toBeVisible();await expect(page.locator('.lb-stage img')).toHaveAttribute('data-image-state','ready');await expect(page.locator('.lb-cap')).toContainText(author);await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.goto('/#/fungo/cortinarius-rubellus');await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.locator('#taxon-detail .attention').screenshot({path:`/tmp/fungaroli-warning-block-${width}-${theme}.png`});expect(errors).toEqual([]);
});
