import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';
const forecast=request=>{
  const count=new URL(request.url()).searchParams.get('latitude').split(',').length;
  const days=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
  const time=days.flatMap(day=>Array.from({length:24},(_,h)=>`${day}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
  return Array.from({length:count},()=>({daily:{time:days,precipitation_sum:Array(70).fill(7),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
};
test('limite del servizio esplicito e recupero dal pulsante senza chiamate dirette al provider',async({page})=>{
  let unavailable=true,externalCalls=0;
  await page.route('https://**/*',r=>{if(new URL(r.request().url()).hostname==='api.open-meteo.com')externalCalls++;return r.abort();});
  await page.route('**/api/weather/v1/forecast?**',r=>unavailable?r.fulfill({status:429,json:{error:'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.'}}):r.fulfill({json:forecast(r.request())}));
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
  await page.goto('/');await expect(page.locator('#hero .error')).toContainText('limite di richieste');
  await expect(page.locator('#hero .error')).not.toContainText('Controlla la connessione');
  unavailable=false;await page.locator('#hero [data-retry]').click();await expect(page.locator('#hero .cover-link')).toBeVisible();
  expect(externalCalls).toBe(0);
});
test('richiesta bloccata termina il loader con un messaggio di timeout',async({page})=>{
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/api/weather/v1/forecast?**',async r=>{await new Promise(resolve=>setTimeout(resolve,350));try{await r.fulfill({json:forecast(r.request())});}catch{/* richiesta già interrotta */}});
  await page.addInitScript(()=>{
    localStorage.setItem('fungaroli:legal-accepted','32026-10-16');
    const original=AbortSignal.timeout.bind(AbortSignal);AbortSignal.timeout=ms=>original(ms===20000?100:ms);
  });
  await page.goto('/');await expect(page.locator('#hero .error')).toContainText('impiega troppo tempo');
  await expect(page.locator('#hero .loader')).toHaveCount(0);await expect(page.locator('#hero [data-retry]')).toBeVisible();
});
test('una zona indisponibile mantiene le altre e il retry recupera l’intero catalogo',async({page})=>{
  let unavailable=true,missingLatitude;
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/api/weather/v1/forecast?**',r=>{
    const lat=new URL(r.request().url()).searchParams.get('latitude').split(',')[0];missingLatitude??=lat;
    return unavailable&&lat===missingLatitude?r.fulfill({status:503,json:{error:'Zona temporaneamente non disponibile'}}):r.fulfill({json:forecast(r.request())});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
  await expect(page.locator('#stale')).toContainText('14 zone su 15');await expect(page.locator('#stale')).toContainText('Le altre non vengono valutate');
  const zones=(await(await page.request.get('/data/zones.json')).json()).zones,missing=zones.find(z=>String(z.lat)===missingLatitude);
  await page.evaluate(id=>location.hash=`#/zona/${id}/0`,missing.id);
  await expect(page.locator('#detail h1')).toHaveText(missing.title||missing.name);await expect(page.locator('#detail')).toContainText('Meteo non disponibile per questa zona');
  unavailable=false;await page.locator('#detail [data-zone-weather-retry]').click();await expect(page.locator('#detail .phero-title')).toHaveText((missing.title||missing.name).split(' (')[0]);await expect(page.locator('#stale')).toBeHidden();
});
test('catalogo botanico e calendario accessibili senza meteo, senza falsi indici fungini',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'Servizio temporaneamente indisponibile'}}));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));await page.goto('/');await expect(page.locator('#hero .error')).toBeVisible();await expect(page.locator('[data-target]')).toHaveCount(0);
 await page.goto('/#/pianta/ortica');await expect(page.locator('#plant-detail h1')).toHaveText('Ortica');await page.locator('[data-botanical-method]>summary').click();await expect(page.locator('[data-botanical-method]')).toContainText(/calendario/i);await expect(page.locator('#plant-detail .ring')).toHaveCount(0);expect(errors).toEqual([]);
});
