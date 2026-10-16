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
 await page.addInitScript(prefs=>{localStorage.setItem('fungaroli:legal-accepted','32026-10-16');if(!localStorage.getItem('fungaroli:prefs:v2'))localStorage.setItem('fungaroli:prefs:v2',JSON.stringify(prefs));},prefs);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('#active-filters [data-intent="funghi"]')).toBeVisible();
}
test('tre intenti: home, filtri, mappa, dettaglio e memoria coerenti',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await expect(page.locator('#hero .ring')).toBeVisible();
 await page.locator('#active-filters [data-intent="passeggiata"]').click();
 await expect(page.locator('#hero .outdoor-hero')).toBeVisible();await expect(page.locator('#hero .ring')).toHaveCount(0);
 await page.locator('#active-filters [data-more]').click();const filters=page.locator('#full-filters[open]');await expect(filters.locator('#species-filter-search')).toHaveCount(0);
 await filters.locator('[data-pref="shortTrails"]').click();await filters.locator('[data-close]').last().click();
 await page.reload();await expect(page.locator('#active-filters [data-intent="passeggiata"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#hero .outdoor-hero').click();await expect(page.locator('#detail h1')).toBeVisible();await expect(page.locator('#detail .ring')).toHaveCount(0);
 await page.goto('/#/mappa');await expect(page.locator('#legend')).toContainText('senza indice fungino');
 await page.locator('#map-filters [data-intent="piante"]').click();await expect(page.locator('#legend')).toContainText('presenza da verificare');
 await page.goto('/#/uscite');await expect(page.locator('#season .outdoor-plant').first()).toBeVisible();
 expect(await page.evaluate(()=>!!(document.querySelector('#hero').compareDocumentPosition(document.querySelector('#season'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await page.locator('#active-filters [data-more]').click();await expect(page.locator('#species-filter-search')).toBeVisible();await page.keyboard.press('Escape');
 for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
 await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===390)await page.screenshot({path:`/tmp/intent-plants-${theme}.png`,fullPage:true});
 }
 await page.locator('#active-filters [data-intent="funghi"]').click();await expect(page.locator('#hero .ring')).toBeVisible();expect(errors).toEqual([]);
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
 await page.addInitScript(intent=>{localStorage.setItem('fungaroli:legal-accepted','32026-10-16');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({target:intent}));},intent);
 await page.goto('/#/mappa');await expect(page.locator('.leaflet-container')).toBeVisible();
 await expect(page.locator('#map .zone-label').first()).toBeVisible();
 await page.setViewportSize({width:390,height:900});await page.locator('#map-filters [data-days]').click();await expect(page.locator('#map-days')).toBeVisible();await page.locator('#map-days [data-day-offset="2"]').click();await expect(page.locator('#map-days')).toBeHidden();await page.setViewportSize({width:1280,height:900});await expect(page.locator('#map .pc')).toHaveCount(0);
 await page.locator('#map .zone-label').first().click();await expect(page.locator('#map-sheet')).toBeVisible();await expect(page.locator('#map-sheet .ring')).toHaveCount(0);
 await page.locator('#map-sheet .sheet-close').click();await page.locator('#map-filters [data-intent="funghi"]').click();await expect(page.locator('#legend')).toContainText('habitat potenziale');
 await page.evaluate(()=>{testMap.setZoom(13,{animate:false});});await expect(page.locator('#map')).toHaveClass(/cells-on/);expect(errors).toEqual([]);
});
