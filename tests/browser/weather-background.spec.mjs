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
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
 // Mattina di oggi: la proposta di oggi è ancora utile, a qualunque ora giri la prova (il caso tardi è in home-states.spec.mjs).
 await page.clock.install({time:new Date(`${todayISO()}T06:30:00+02:00`)});
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#season li').first()).toBeVisible();await expect(page.locator('#season-h')).toBeVisible();
 await page.evaluate(()=>{for(const k of ['fungaroli:weather:zones:v3','fungaroli:outing:zones:v3']){const c=JSON.parse(localStorage.getItem(k));for(const r of Object.values(c))r.t=Date.now()-1200000;localStorage.setItem(k,JSON.stringify(c));}});
 paused=true;await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');await expect(page.locator('#updated')).toContainText('Sto aggiornando il meteo');await expect(page.locator('#weather-work')).toBeHidden();
 const score=await page.locator('#hero .ring .ring-num').count()?await page.locator('#hero .ring .ring-num').innerText():await page.locator('#hero .cover-index').innerText();
 const href=await page.locator('#hero .cover-link').getAttribute('href');await page.evaluate(()=>{window.savedHero=document.querySelector('#hero .cover-link');window.savedPhoto=document.querySelector('#hero .cover-img');});
 rain=6;paused=false;pending.splice(0).forEach(r=>r());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);
 expect(await page.evaluate(()=>savedHero===document.querySelector('#hero .cover-link')&&savedPhoto===document.querySelector('#hero .cover-img'))).toBe(true);
 const placed=await page.locator('#hero [data-walk-zone],#ranking [data-walk-zone]').evaluateAll(n=>n.map(a=>a.dataset.walkZone));expect(new Set(placed).size).toBe(placed.length);await expect(page.locator('#season li').first()).toBeVisible();
 await expect(page.locator('#updated')).toContainText('Meteo aggiornato');await expect(page.locator('#app-toast.on')).toHaveCount(0);await page.evaluate(()=>document.dispatchEvent(new Event('fungaroli:community')));await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);expect(await page.locator('#hero .cover-index').innerText()).not.toBe(score);
 fail=true;await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',href);await expect(page.locator('#weather-work')).toBeHidden();await expect(page.locator('#updated')).toContainText('da aggiornare');
 // Una sola riga del meteo: il dettaglio è su richiesta e l'unico comando resta «Aggiorna».
 await expect(page.locator('.home-weather-details')).toBeVisible();await expect(page.locator('#stale')).toBeHidden();await page.locator('.home-weather-details > summary').click();await expect(page.locator('#stale')).toBeVisible();await expect(page.locator('#stale')).toContainText('meteo salvato');await expect(page.locator('#stale .link-btn')).toBeHidden();await expect(page.locator('#refresh')).toBeVisible();await expect(page.locator('#refresh')).toContainText('Aggiorna');await expect(page.locator('#app-toast.on')).toHaveCount(0);await page.screenshot({path:`/tmp/weather-partial-${width}.png`});
 await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await expect(page.locator('#weather-work')).toBeHidden();await expect(page.locator('#app-toast.on')).toHaveCount(0);
 await page.screenshot({path:`/tmp/weather-cached-${width}.png`});expect(errors).toEqual([]);
});

test('aggiornamento della scheda conserva accordion aperto e pannello contestuale',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let paused=false;const pending=[];
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',async r=>{if(paused)await new Promise(resolve=>pending.push(resolve));await r.fulfill({json:forecast(r.request())});});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));await page.goto('/');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');await page.locator('#hero .cover-link').click();
 const section=page.locator('#detail details.sec[data-sec="sentieri"]');await section.locator(':scope > summary').click();await expect(section).toHaveAttribute('open','');
 const keyword=section.locator('.glossary-link').first();await keyword.click();await expect(page.locator('#learning-popover')).toBeVisible();const opener=await keyword.elementHandle();
 paused=true;await page.evaluate(()=>document.querySelector('#refresh').click());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');paused=false;pending.splice(0).forEach(r=>r());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#learning-popover')).toBeVisible();expect(await opener.evaluate(e=>e.isConnected)).toBe(true);await page.locator('[data-learning-close]').click();await expect(section).toHaveAttribute('open','');expect(errors).toEqual([]);
});

for(const width of [390,1280])test(`sincronizzazione unica e calendario fermo a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});let outingCalls=0;
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',async r=>{
  if(!new URL(r.request().url()).searchParams.has('daily'))outingCalls++;
  await r.fulfill({json:forecast(r.request())});
 });
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
 const geometry=()=>page.locator('#days .day').evaluateAll(buttons=>buttons.map(b=>{
  const box=b.getBoundingClientRect();return {day:b.dataset.dayOffset,width:box.width,height:box.height,rows:[...b.querySelectorAll('.d1,.d2,.d3')].map(e=>e.getBoundingClientRect().top-box.top)};
 }));
 // The first usable generation includes both profiles. A following generation
 // keeps every visible node and number until the practical weather also arrives.
 await page.goto('/');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#days .day')).toHaveCount(9);
 const before=await geometry(),text=await page.locator('#days').innerText();
 await page.evaluate(()=>{window.savedDays=document.querySelector('#days .day');});
 const pending=[];
 await page.unroute('**/api/weather/v1/forecast?**');
 await page.route('**/api/weather/v1/forecast?**',async r=>{
  if(!new URL(r.request().url()).searchParams.has('daily')){outingCalls++;await new Promise(resolve=>pending.push(resolve));}
  await r.fulfill({json:forecast(r.request(),1)});
 });
 await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');
 await expect.poll(()=>pending.length).toBeGreaterThan(0);
 expect(await page.locator('#days').innerText()).toBe(text);expect(await geometry()).toEqual(before);
 // Release each of the bounded request waves, without blocking later waves.
 await page.unroute('**/api/weather/v1/forecast?**');
 await page.route('**/api/weather/v1/forecast?**',r=>{if(!new URL(r.request().url()).searchParams.has('daily'))outingCalls++;return r.fulfill({json:forecast(r.request(),1)});});
 pending.splice(0).forEach(r=>r());
 await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 expect(await geometry()).toEqual(before);
 expect(await page.evaluate(()=>savedDays===document.querySelector('#days .day'))).toBe(true);
 const calls=outingCalls;await page.reload();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 expect(outingCalls).toBe(calls);expect(await geometry()).toEqual(before);
});

for(const interest of ['Piante','Sentieri'])test(`la scheda ${interest} conserva nodi e sezioni durante la sincronizzazione`,async({page})=>{
 let paused=false;const pending=[];
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',async r=>{if(paused)await new Promise(resolve=>pending.push(resolve));await r.fulfill({json:forecast(r.request())});});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
 await page.goto('/');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await page.getByRole('button',{name:interest,exact:true}).click();await page.getByRole('button',{name:'Funghi',exact:true}).click();
 await page.goto('/#/zona/tancia/0');await expect(page.locator('#detail .phero-title')).toBeVisible();
 const section=page.locator('#detail details[data-sec="sentieri"]');
 if(!await section.evaluate(el=>el.open))await section.locator(':scope > summary').click();
 const original=await section.elementHandle(),title=await page.locator('#detail .phero-title').elementHandle();
 paused=true;await page.evaluate(()=>document.querySelector('#refresh').click());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','true');
 paused=false;pending.splice(0).forEach(resolve=>resolve());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 expect(await original.evaluate(el=>el.isConnected)).toBe(true);expect(await title.evaluate(el=>el.isConnected)).toBe(true);
 await expect(section).toHaveAttribute('open','');
});
