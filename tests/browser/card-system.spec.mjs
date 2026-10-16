import {test,expect} from '@playwright/test';
import {parseCssColor,contrastRatio} from '../../tools/legibility.mjs';
import {preparePage,loadAllImages,auditState} from '../../tools/visual-audit.mjs';

for(const theme of ['light','dark']) test(`template editoriali: testi lunghi, tastiera e contrasto in ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:920},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#hero .cover-editorial')).toBeVisible();await loadAllImages(page);
 await expect(page.locator('#days [data-day-offset="1"] .d1')).toHaveText('Domani');
 for(const day of await page.locator('#days .day').all())expect(await day.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=80&&r.height>=132;})).toBe(true);
 // A long place name must grow the panel and leave the action fully reachable.
 await page.locator('#hero .cover-title').evaluate(e=>e.textContent='Poggio Bustone e Cantalice, sentieri del versante occidentale');
 await page.locator('#hero .cover-cta').scrollIntoViewIfNeeded();
 expect(await page.locator('#hero .cover-cta').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.cover').getBoundingClientRect();return a.bottom<=b.bottom&&a.right<=b.right;})).toBe(true);
 await page.goto('/#/guide');await expect(page.locator('.editorial-card').first()).toBeVisible();
 const card=page.locator('.editorial-card').first();
 for(const state of ['default','hover','focus']){
  if(state==='hover')await card.hover();
  if(state==='focus'){
   await card.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
   const colors=await card.evaluate(e=>[getComputedStyle(e).outlineColor,getComputedStyle(document.documentElement).getPropertyValue('--bg')]);
   expect(contrastRatio(...colors.map(parseCssColor))).toBeGreaterThanOrEqual(3);
  }
  const readings=await auditState(page,{root:'.editorial-cards'});
  expect(readings.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio}))).toEqual([]);
 }
 await page.goto('/#/piante');await expect(page.locator('.plant-card').first()).toBeVisible();
 await expect(page.locator('.plant-risk').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);await context.close();
});

test('temperatura negativa centrata sui numeri, range e avviso visibili',async({browser})=>{
 const c=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(c);
 await page.route('**/api/weather/v1/forecast?**',route=>{
  const n=new URL(route.request().url()).searchParams.get('latitude').split(',').length;
  const days=Array.from({length:70},(_,i)=>new Date(Date.now()+(i-62)*864e5).toISOString().slice(0,10));
  const time=days.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
  return route.fulfill({json:Array.from({length:n},()=>({daily:{time:days,precipitation_sum:days.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(45),temperature_2m:time.map((_,i)=>i%24<9?-8:-3)}}))});
 });
 await page.goto('/#/zona/tancia/0');const ring=page.locator('.weather-ring');await expect(ring).toBeVisible();
 await expect(ring.locator('.temperature-sign')).toHaveText('−');await expect(page.locator('.weather-caption')).toContainText('Vento forte');
 expect(await ring.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e.querySelector('.temperature'));const digits=[...e.querySelector('.temperature').childNodes].find(n=>n.nodeType===Node.TEXT_NODE);r.selectNodeContents(digits);const text=r.getBoundingClientRect(),circle=e.getBoundingClientRect();return Math.abs((text.left+text.right-circle.left-circle.right)/2)<1;})).toBe(true);
 const cdp=await c.newCDPSession(page);
 await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
 await expect(page.locator('.hero-indicators')).toHaveCSS('backdrop-filter','none');
 await expect(ring).toHaveCSS('backdrop-filter','none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await c.close();
});

for(const offline of [false,true])test(`hero botanica con ${offline?'nessun indicatore':'solo meteo'}`,async({browser})=>{
 const c=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(c,{theme:'dark'});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:['piante'],target:'piante',speciesIds:[]})));
 if(offline)await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await page.goto('/#/zona/tancia/0');await expect(page.locator('#detail .outing-hero .phero-title')).toBeVisible();
 await expect(page.locator('#detail .hero-indicators > .ring')).toHaveCount(0);
 await expect(page.locator('#detail .weather-indicator')).toHaveCount(offline?0:1);
 if(offline)await expect(page.locator('#detail .hero-indicators')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await c.close();
});
