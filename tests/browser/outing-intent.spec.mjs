import {mapToggle,mapLegend} from './map-helpers.mjs';
import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';
const forecast=request=>{
  const count=new URL(request.url()).searchParams.get('latitude').split(',').length;
  const days=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
  const time=days.flatMap(day=>Array.from({length:24},(_,h)=>`${day}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
  return Array.from({length:count},()=>({daily:{time:days,precipitation_sum:Array(70).fill(7),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
};

async function start(page,prefs={},offline=false) {
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill(offline?{status:503,json:{error:'Offline'}}:{json:forecast(r.request())}));
 await page.addInitScript(prefs=>{localStorage.setItem('fungaroli:legal-accepted','42026-10-16');if(!localStorage.getItem('fungaroli:prefs:v2'))localStorage.setItem('fungaroli:prefs:v2',JSON.stringify(prefs));},prefs);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('#active-filters [data-intent="funghi"]')).toBeVisible();
}
test('tre intenti: home, filtri, mappa, dettaglio e memoria coerenti',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await expect(page.locator('#hero .cover-index')).toBeVisible();
 await page.locator('#active-filters [data-intent="passeggiata"]').click();await page.locator('#active-filters [data-intent="funghi"]').click();
 await expect(page.locator('#hero .outdoor-hero')).toBeVisible();await expect(page.locator('#hero .cover-index')).toHaveCount(0);
 await page.locator('#home-filter-action [data-more]:visible,#appbar-home-filters [data-more]:visible').click();const filters=page.locator('#full-filters[open]');await expect(filters.locator('#species-filter-search')).toHaveCount(0);
 await filters.locator('[data-pref="shortTrails"]').click();await filters.locator('[data-close]').last().click();
 await page.reload();await expect(page.locator('#active-filters [data-intent="passeggiata"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#hero .outdoor-hero').click();await expect(page.locator('#detail h1')).toBeVisible();await expect(page.locator('#detail .hero-indicators > .ring')).toHaveCount(0);await expect(page.locator('#detail .weather-ring')).toHaveCount(1);
 await page.goto('/#/mappa');await expect(page.locator('#map .pc')).toHaveCount(0);
 await mapToggle(page,'piante');await mapToggle(page,'passeggiata');await expect(page.locator('#legend .map-plant-note')).toHaveCount(1);await expect(page.locator('#legend .map-plant-note')).not.toHaveAttribute('open','');
 await page.goto('/#/uscite');await expect(page.locator('#season .outdoor-plant').first()).toBeVisible();
 expect(await page.evaluate(()=>!!(document.querySelector('#hero').compareDocumentPosition(document.querySelector('#season'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await page.locator('#home-filter-action [data-more]:visible,#appbar-home-filters [data-more]:visible').click();await expect(page.locator('#species-filter-search')).toBeVisible();await page.keyboard.press('Escape');
 for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
 await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===390)await page.screenshot({path:`/tmp/intent-plants-${theme}.png`,fullPage:true});
 }
 await page.locator('#active-filters [data-intent="funghi"]').click();await page.locator('#active-filters [data-intent="piante"]').click();await expect(page.locator('#hero .cover-index')).toBeVisible();expect(errors).toEqual([]);
});
test('scelta di specie fuori calendario sospesa una volta e ripristinabile',async({page})=>{
 await start(page,{target:'funghi',speciesIds:['morchella-esculenta']});
 const dialog=page.locator('.season-dialog[open]');await expect(dialog).toBeVisible();
 await dialog.locator('[data-restore-season]').click();await expect(dialog).toHaveCount(0);await page.reload();await expect(page.locator('.season-dialog[open]')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).speciesIds)).toContain('morchella-esculenta');
});
test('passeggiata utilizzabile senza meteo e senza falsi valori',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,{target:'passeggiata'},true);
 await expect(page.locator('#hero .outdoor-hero')).toBeVisible();await expect(page.locator('#hero')).toContainText(/Meteo non disponibile|Previsioni della mattina non disponibili/);await expect(page.locator('#days .pc')).toHaveCount(0);expect(errors).toEqual([]);
});

for(const intent of ['piante','passeggiata'])test(`mappa Leaflet: ${intent}, sentieri selezionabili e ritorno ai funghi`,async({page})=>{
 const {readFileSync}=await import('node:fs');const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/leaflet.min.js',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('node_modules/leaflet/dist/leaflet.js','utf8')+'\n;const orig=L.map;L.map=(...args)=>(window.testMap=orig(...args));'}));
 await page.route('**/leaflet.min.css',r=>r.fulfill({contentType:'text/css',body:readFileSync('node_modules/leaflet/dist/leaflet.css','utf8')}));
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({json:forecast(r.request())}));
 await page.addInitScript(intent=>{localStorage.setItem('fungaroli:legal-accepted','42026-10-16');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({target:intent}));},intent);
 await page.goto('/#/mappa');await expect(page.locator('.leaflet-container')).toBeVisible();
 await expect(page.locator('#map .zone-label').first()).toBeVisible();
 await page.setViewportSize({width:390,height:900});await page.locator('#map-filters [data-days]').click();await expect(page.locator('#map-days')).toBeVisible();await page.locator('#map-days [data-day-offset="2"]').click();await expect(page.locator('#map-days')).toBeHidden();await page.setViewportSize({width:1280,height:900});await expect(page.locator('#map .pc')).toHaveCount(0);
 await page.locator('#map .zone-label').first().click();await expect(page.locator('#map-sheet')).toBeVisible();await expect(page.locator('#map-sheet .ring')).toHaveCount(0);
 await page.locator('#map-sheet .sheet-close').click();await mapToggle(page,'funghi');await mapToggle(page,intent);await expect(page.locator('#legend')).toContainText('habitat potenziale');
 await page.evaluate(()=>{testMap.setZoom(13,{animate:false});});await expect(page.locator('#map')).toHaveClass(/cells-on/);expect(errors).toEqual([]);
});

for(const intent of ['piante','passeggiata'])test(`copertine ${intent}: ripiego contestuale e foto in errore`,async({page})=>{
 await page.route('**/api/content/v1/snapshot',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await page.route('**/data/media-zones.json',r=>r.fulfill({json:{zones:{}}}));
 await start(page,{target:intent});
 const hero=page.locator('#hero .outdoor-hero');await expect(hero).toBeVisible();
 await expect(hero.locator('> img')).toHaveCount(1);
 const cards=page.locator('#ranking .outdoor-tile');expect(await cards.count()).toBeGreaterThan(0);
 for(const card of await cards.all())await expect(card.locator('.outdoor-backdrop')).toHaveCount(1);
 await expect(cards.locator('> img').first()).toHaveCount(1);
 await hero.locator('> img').evaluate(img=>{img.dataset.imageState='error';img.removeAttribute('src');img.removeAttribute('data-src');});
 await expect(hero.locator('> img')).toHaveCSS('visibility','hidden');
 await expect(hero.locator('.outdoor-backdrop svg')).toBeVisible();
 const failedCard=page.locator('#ranking .outdoor-tile:has(> img)').first();
 const height=await failedCard.evaluate(e=>e.getBoundingClientRect().height);
 await failedCard.locator('> img').evaluate(img=>{img.dataset.imageState='error';img.removeAttribute('src');img.removeAttribute('data-src');});
 await expect(failedCard.locator('.outdoor-backdrop svg')).toBeVisible();
 expect(Math.abs(await failedCard.evaluate(e=>e.getBoundingClientRect().height)-height)).toBeLessThan(1);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
