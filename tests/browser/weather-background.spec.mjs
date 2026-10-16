import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';
function forecast(request,rain=7){
 const q=new URL(request.url()).searchParams,count=q.get('latitude').split(',').length;
 const days=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5))),time=days.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
 return Array.from({length:count},()=>({daily:{time:days,precipitation_sum:Array(70).fill(rain),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
}
for(const width of [390,1280])test(`cache immediata, aggiornamento discreto e consiglio stabile a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));let paused=false,fail=false,rain=7;const pending=[];
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',async r=>{if(paused)await new Promise(resolve=>pending.push(resolve));await r.fulfill(fail?{status:429,json:{error:'Limite'}}:{json:forecast(r.request(),rain)});});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#season li').first()).toBeVisible();await expect(page.locator('#season-h')).toBeVisible();
 await page.evaluate(()=>{for(const k of ['fungaroli:weather:zones:v3','fungaroli:outing:zones:v3']){const c=JSON.parse(localStorage.getItem(k));for(const r of Object.values(c))r.t=Date.now()-7200000;localStorage.setItem(k,JSON.stringify(c));}});
 paused=true;await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');await expect(page.locator('#updated')).toContainText('Sto aggiornando il meteo');await expect(page.locator('#weather-work')).toBeHidden();
 const score=await page.locator('#hero .ring .ring-num').count()?await page.locator('#hero .ring .ring-num').innerText():await page.locator('#hero .ring').innerText();
 const href=await page.locator('#hero .cover-link').getAttribute('href');await page.evaluate(()=>{window.savedHero=document.querySelector('#hero .cover-link');window.savedPhoto=document.querySelector('#hero .cover-img');});
 rain=1;paused=false;pending.splice(0).forEach(r=>r());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);
 expect(await page.evaluate(()=>savedHero===document.querySelector('#hero .cover-link')&&savedPhoto===document.querySelector('#hero .cover-img'))).toBe(true);
 const placed=await page.locator('#hero [data-walk-zone],#ranking [data-walk-zone]').evaluateAll(n=>n.map(a=>a.dataset.walkZone));expect(new Set(placed).size).toBe(placed.length);await expect(page.locator('#season li').first()).toBeVisible();
 await expect(page.locator('#updated')).toContainText('Meteo aggiornato');await expect(page.locator('#app-toast.on')).toHaveCount(0);await page.evaluate(()=>document.dispatchEvent(new Event('fungaroli:community')));await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);expect(await page.locator('#hero .ring').innerText()).not.toBe(score);
 fail=true;await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);await expect(page.locator('#weather-work')).toBeHidden();await expect(page.locator('#updated')).toContainText('in parte');
 await expect(page.locator('#stale')).toContainText('non sono arrivati');await expect(page.locator('#stale button')).toHaveText('Riprova');await expect(page.locator('#app-toast.on')).toHaveCount(0);await page.screenshot({path:`/tmp/weather-partial-${width}.png`});
 await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#weather-work')).toBeHidden();await expect(page.locator('#app-toast.on')).toHaveCount(0);
 await page.screenshot({path:`/tmp/weather-cached-${width}.png`});expect(errors).toEqual([]);
});

test('aggiornamento della scheda conserva accordion aperto e pannello contestuale',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let paused=false;const pending=[];
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',async r=>{if(paused)await new Promise(resolve=>pending.push(resolve));await r.fulfill({json:forecast(r.request())});});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));await page.goto('/');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await page.locator('#hero .cover-link').click();
 const section=page.locator('#detail details.sec[data-sec="sentieri"]');await section.locator('summary').click();await expect(section).toHaveAttribute('open','');
 const keyword=section.locator('.glossary-link').first();await keyword.click();await expect(page.locator('#learning-popover')).toBeVisible();const opener=await keyword.elementHandle();
 paused=true;await page.evaluate(()=>document.querySelector('#refresh').click());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');paused=false;pending.splice(0).forEach(r=>r());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#learning-popover')).toBeVisible();expect(await opener.evaluate(e=>e.isConnected)).toBe(true);await page.locator('[data-learning-close]').click();await expect(section).toHaveAttribute('open','');expect(errors).toEqual([]);
});
