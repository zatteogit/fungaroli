import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {todayISO} from '../../js/weather.js';

const leafletJS=readFileSync(new URL('../../node_modules/leaflet/dist/leaflet.js',import.meta.url),'utf8');
const leafletCSS=readFileSync(new URL('../../node_modules/leaflet/dist/leaflet.css',import.meta.url),'utf8');
async function setup(page,{width=1280,outingGate}={}) {
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/leaflet.min.js',r=>r.fulfill({contentType:'text/javascript',body:leafletJS+'\n;const originalMap=L.map;L.map=(...args)=>(window.testMap=originalMap(...args));'}));
  await page.route('**/leaflet.min.css',r=>r.fulfill({contentType:'text/css',body:leafletCSS}));
  await page.route('**/api/weather/v1/forecast?**',async r=>{
    if(outingGate&&!new URL(r.request().url()).searchParams.has('daily'))await outingGate;
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:new URL(r.request().url()).searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:Array(70).fill(7),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    return r.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
  await page.goto('/#/mappa');await expect(page.locator('#map-filters')).toContainText('Porcini');
  await page.evaluate(()=>{testMap.setView([42.49,12.915],13,{animate:false});});
  await expect(page.locator('#map')).toHaveClass(/cells-on/);
  await page.waitForFunction(()=>Object.values(testMap._layers).some(l=>l instanceof L.Rectangle&&!l.options.stroke));
  const sample=await page.evaluate(()=>{
    const map=testMap,rect=map.getContainer().getBoundingClientRect(),center=map.getCenter();
    const cells=Object.values(map._layers).filter(l=>l instanceof L.Rectangle&&!l.options.stroke&&map.getBounds().contains(l.getBounds().getCenter()));
    cells.sort((a,b)=>center.distanceTo(a.getBounds().getCenter())-center.distanceTo(b.getBounds().getCenter()));
    for(const c of cells){const ll=c.getBounds().getCenter(),p=map.latLngToContainerPoint(ll),x=rect.left+p.x,y=rect.top+p.y,target=document.elementFromPoint(x,y);if(target?.closest('#map')&&!target.closest('.leaflet-marker-icon,.leaflet-control'))return{x,y,lat:ll.lat,lon:ll.lng};}
  });
  expect(sample).toBeTruthy();return {sample,errors};
}

test('il passaggio del mouse mostra solo l’etichetta, il clic apre la scheda',async({page})=>{
  const {sample,errors}=await setup(page);const card=page.locator('.cell-card'),peek=page.locator('.cell-peek');
  await page.mouse.move(sample.x,sample.y);await expect(peek).toBeVisible();await expect(peek).toContainText('clic per i dettagli');await expect(card).toHaveCount(0);
  await page.mouse.move(-20,-20);await expect(peek).toHaveCount(0);
  await page.mouse.click(sample.x,sample.y);await expect(card).toBeVisible();await expect(peek).toHaveCount(0);await expect(page.locator('#map-sheet')).toBeHidden();
  await page.mouse.move(-20,-20);await page.waitForTimeout(350);await expect(card).toBeVisible();
  await page.locator('#map').focus();await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(errors).toEqual([]);
});

test('dalla scheda aperta col clic il mouse raggiunge il link senza chiuderla',async({page})=>{
  const {sample,errors}=await setup(page);await page.mouse.click(sample.x,sample.y);const card=page.locator('.cell-card');await expect(card).toBeVisible();
  const original=await card.innerText(),bounds=await card.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height-5,{steps:8});await page.waitForTimeout(350);
  await expect(card).toHaveText(original,{useInnerText:true});await expect(page.locator('.cell-peek')).toHaveCount(0);
  await card.locator('[data-term="habitat"]').click();await expect(page.locator('#learning-popover')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#/mappa');await page.locator('[data-learning-close]').click();
  await expect(card.locator('[data-term="habitat"]')).toBeFocused();
  await card.locator('[data-cell-close]').click();await expect(card).toHaveCount(0);await expect(page.locator('#map')).toBeFocused();expect(errors).toEqual([]);
});

for(const width of [320,390])test(`un tap apre un pannello utilizzabile e contenuto nella mappa a ${width}px`,async({browser})=>{
  const context=await browser.newContext({hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  try {
    const {sample,errors}=await setup(page,{width});await page.touchscreen.tap(sample.x,sample.y);const card=page.locator('.cell-card');await expect(card).toBeVisible();
    expect(await card.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
    await card.locator('[data-term="habitat"]').tap();await expect(page.locator('#learning-sheet[open]')).toBeVisible();await page.locator('[data-learning-close]').tap();await expect(card).toBeVisible();expect(await page.evaluate(()=>testMap.getZoom())).toBe(13);
    await page.screenshot({path:`/tmp/fungaroli-map-popover-${width}.png`});await card.locator('[data-cell-close]').tap();await expect(card).toHaveCount(0);expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test('la tastiera apre il riquadro, segue il link e torna alla mappa',async({page})=>{
  const {errors}=await setup(page);await page.locator('#map').focus();await page.keyboard.press('Enter');const card=page.locator('.cell-card');await expect(card).toBeVisible();await expect(card.locator('[data-cell-close]')).toBeFocused();
  await card.locator('[data-term="habitat"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#learning-popover')).toBeVisible();await page.keyboard.press('Escape');await expect(card.locator('[data-term="habitat"]')).toBeFocused();
  await page.keyboard.press('Escape');await expect(card).toHaveCount(0);await expect(page.locator('#map')).toBeFocused();expect(errors).toEqual([]);
});

test('l’aggiornamento del meteo della mattina conserva il pannello e il link aperto',async({page})=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  try {
    const {sample,errors}=await setup(page,{outingGate:gate});await page.mouse.click(sample.x,sample.y);const card=page.locator('.cell-card'),link=card.locator('[data-term="habitat"]');
    await link.click();await expect(page.locator('#learning-popover')).toBeVisible();const original=await link.elementHandle();release();
    await expect.poll(()=>page.evaluate(()=>!!localStorage.getItem('fungaroli:outing:zones:v3'))).toBe(true);
    expect(await original.evaluate(e=>e.isConnected)).toBe(true);await expect(card).toBeVisible();await expect(page.locator('#learning-popover')).toBeVisible();
    await page.locator('[data-learning-close]').click();await expect(link).toBeFocused();await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(errors).toEqual([]);
  } finally { release(); }
});

test('aggiornare il meteo non sostituisce il pannello della sosta con il riepilogo zona',async({page})=>{
 const {errors}=await setup(page);await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await page.evaluate(()=>{const circle=Object.values(testMap._layers).find(l=>l instanceof L.Circle&&l.getRadius()>100);circle.fire('click',{latlng:L.latLng(0,0)});});
 await expect(page.locator('#map-sheet .sheet-row')).toBeVisible();await page.evaluate(()=>{const parking=Object.values(testMap._layers).find(l=>l instanceof L.Marker&&l.getElement()?.querySelector('.map-p'));parking.fire('click');});
 await expect(page.locator('#map-sheet')).toContainText("Sosta per l'auto");const title=await page.locator('#map-sheet .sheet-title').innerText();await page.evaluate(()=>document.querySelector('#refresh').click());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#map-sheet .sheet-title')).toHaveText(title);await expect(page.locator('#map-sheet .sheet-back')).toBeVisible();expect(errors).toEqual([]);
});

for (const width of [390, 1280]) test(`quattro sezioni: la mappa è al primo livello della barra (${width}px)`, async ({page}) => {
  const {errors}=await setup(page,{width});
  await expect(page.locator('.tabbar a[data-tab]')).toHaveCount(4);
  await expect(page.locator('.tabbar a[data-tab]')).toHaveText(['Uscite','Mappa','Scopri','Taccuino']);
  await expect(page.locator('.tabbar [data-tab="mappa"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('.tab-search')).toBeVisible();
  await page.goto('/#/');await expect(page.locator('.tabbar [data-tab="uscite"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('[data-map-link], .map-back')).toHaveCount(0);
  await page.locator('.tabbar [data-tab="mappa"]').click();
  await expect(page).toHaveURL(/#\/mappa$/);
  await expect(page.locator('.tabbar [data-tab="mappa"]')).toHaveAttribute('aria-current','page');
  expect(errors).toEqual([]);
});
