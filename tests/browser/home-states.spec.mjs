import {test,expect} from '@playwright/test';
// Stati della home con orologio e meteo simulati (decisioni del 21/10/2026, docs/ux-navigazione.md).
const romeISO=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const T=(hm,day='2026-10-21')=>new Date(`${day}T${hm}:00+02:00`);
const WX={good:{morning:()=>null},storm:{morning:()=>({p:2,pp:90,wc:95,g:30})}};
function forecast(url,now,wx){
 const count=new URL(url).searchParams.get('latitude').split(',').length,today=romeISO(now),days=Array.from({length:70},(_,i)=>addDays(today,i-62));
 const time=days.flatMap(day=>Array.from({length:24},(_,h)=>`${day}T${String(h).padStart(2,'0')}:00`));
 const m=o=>wx.morning(o)||{p:0,pp:0,wc:1,g:8},per=fn=>time.map(t=>fn(Math.round((Date.parse(t.slice(0,10))-Date.parse(today))/864e5),+t.slice(11,13)));
 return Array.from({length:count},()=>({daily:{time:days,precipitation_sum:Array(70).fill(7),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},
  hourly:{time,soil_moisture_3_to_9cm:per(()=>.3),soil_temperature_6cm:per(()=>13),precipitation:per(o=>m(o).p),precipitation_probability:per(o=>m(o).pp),weather_code:per(o=>m(o).wc),wind_gusts_10m:per(o=>m(o).g),temperature_2m:per((o,h)=>11+Math.min(4,Math.max(0,h-8)))}}));
}
async function openHome(page,{time,weather='good',fail=false,width=390}){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:width>=1000?1000:844});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>fail?r.fulfill({status:503,json:{error:'Servizio temporaneamente indisponibile'}}):r.fulfill({json:forecast(r.request().url(),time,WX[weather])}));
 await page.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:install-later',String(Date.now()));});
 await page.clock.install({time});await page.goto('/');
 await expect(page.locator('#hero .home-empty, #hero .cover').first()).toBeVisible();
 await expect(page.locator('#refresh')).not.toHaveAttribute('aria-busy','true');
 return errors;
}
const selectedDay=page=>page.locator('#days [aria-selected="true"]').getAttribute('data-day-offset');
const noOverflow=async page=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);

// Decisione di Matteo del 24/10: la home apre «Questa settimana» con la copertina; il singolo giorno non ha copertina.
// Supera il passaggio automatico a domani del 21/10: il caso «tardi» resta su Oggi, scelto dall'utente.
const weekSelected=page=>expect(page.locator('#days .day-all')).toHaveAttribute('aria-selected','true');
const pickToday=async page=>{await page.locator('#days [data-day-offset="0"]').click();expect(await selectedDay(page)).toBe('0');};

test('alle 16:30 la home apre la settimana; su Oggi la card «tardi» porta a domani senza copertina',async({page})=>{
 const errors=await openHome(page,{time:T('16:30')});
 await weekSelected(page);await expect(page.locator('#home-day-note')).toBeHidden();
 await expect(page.locator('#hero .cover-link')).not.toHaveAttribute('href',/\/0(\/|$)/);
 await expect(page.locator('#days [data-day-offset="0"]')).toContainText('tardi');
 await expect(page.locator('#days .day-all')).not.toContainText('Raggio');
 await pickToday(page);
 const card=page.locator('#hero [data-home-state="late"]');
 await expect(card).toContainText('Oggi è tardi per partire.');await expect(card).toContainText(/L’ultima partenza utile era alle \d{1,2}:\d{2}/);
 await expect(card).not.toContainText('finestra');await expect(card.locator('.home-next img')).toHaveCount(1);
 await expect(card.locator('.home-next')).toContainText(/Domani · giovedì 22/i);await expect(card.locator('.home-next .ring')).toContainText('Condizioni');
 const cta=card.getByRole('button',{name:/Vedi domani/});await expect(cta).toBeVisible();
 // Un aggiornamento del meteo non sposta la scelta manuale.
 await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');expect(await selectedDay(page)).toBe('0');
 await cta.click();expect(await selectedDay(page)).toBe('1');
 // Giorno singolo: intestazione compatta, nessuna copertina, classifica dalla prima.
 await expect(page.locator('#hero .home-day-head')).toContainText('Domani');await expect(page.locator('#hero .cover-link')).toHaveCount(0);
 await expect(page.locator('#ranking li').first()).toBeVisible();
 await page.locator('#hero [data-home-week]').click();await weekSelected(page);await expect(page.locator('#hero .cover-link')).toBeVisible();
 expect(errors).toEqual([]);
});

test('alle 8:45 la settimana propone anche oggi',async({page})=>{
 const errors=await openHome(page,{time:T('08:45')});
 await weekSelected(page);await expect(page.locator('#hero .cover-link')).toBeVisible();
 await expect(page.locator('#days [data-day-offset="0"]')).not.toContainText('tardi');
 expect(errors).toEqual([]);
});

test('a mezzanotte un giorno scelto e ormai passato torna alla settimana',async({page})=>{
 await openHome(page,{time:T('16:30')});await pickToday(page);
 await page.clock.setSystemTime(T('07:00','2026-10-22'));await page.clock.runFor(61000);
 await expect(page.locator('#days .day-all')).toHaveAttribute('aria-selected','true');
});

for(const width of [320,390,1760])test(`stato tardi senza overflow a ${width}px, azione nel primo schermo`,async({page})=>{
 const errors=await openHome(page,{time:T('16:30'),width});await noOverflow(page);
 const height=page.viewportSize().height;
 if(width===390){const cta=await page.locator('#hero .cover-cta').boundingBox();expect(cta.y+cta.height).toBeLessThanOrEqual(height);}
 await pickToday(page);await expect(page.locator('#hero [data-home-next]')).toBeVisible();await noOverflow(page);
 if(width===390){const cta=await page.locator('#hero [data-home-next]').boundingBox();expect(cta.y+cta.height).toBeLessThanOrEqual(height);}
 expect(errors).toEqual([]);
});

test('nessuna data favorevole e dati insufficienti hanno testi distinti',async({page})=>{
 // Temporali ogni giorno: i dati ci sono, nessuna data favorevole. Su Oggi la card lo dice.
 await openHome(page,{time:T('16:30'),weather:'storm'});await pickToday(page);
 const card=page.locator('#hero [data-home-state="late"]');
 await expect(card).toContainText('Nei prossimi 7 giorni non emerge un’altra data favorevole');await expect(card).not.toContainText('Senza meteo aggiornato');
});

test('senza meteo il riquadro lo dice una volta sola, con un solo «Riprova»',async({page})=>{
 await openHome(page,{time:T('16:30'),fail:true});await pickToday(page);
 const card=page.locator('#hero [data-home-state="late"]');
 await expect(card).toContainText('Senza meteo aggiornato non possiamo indicare un altro giorno');await expect(card).not.toContainText('non emerge');
 await expect(page.getByRole('button',{name:'Riprova'}).filter({visible:true})).toHaveCount(1);await expect(page.locator('#refresh')).toBeHidden();
});

test('di mattina senza meteo né copia: niente riga ripetuta sulla prossima data',async({page})=>{
 await openHome(page,{time:T('06:30'),fail:true});
 const card=page.locator('#hero [data-home-state="unknown"]');
 await expect(card).toContainText('Non riusciamo a ricevere il meteo');await expect(card.locator('.home-next-none')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Riprova'}).filter({visible:true})).toHaveCount(1);
 await expect(page.locator('.home-weather-details')).toBeHidden();
 // Stati senza proposta: Lazio e guida subito dopo il riquadro, poi un solo «Come funziona», poi la frase del giorno.
 const order=await page.locator('[data-view="uscite"] .home-bands > :not([hidden])').evaluateAll(n=>n.map(e=>e.id||e.className.split(' ')[0]));
 expect(order.indexOf('lazio-explore')).toBeLessThan(order.indexOf('community-intro'));
 expect(order.indexOf('story-invite')).toBeLessThan(order.indexOf('community-intro'));
 if(order.includes('daily-thought'))expect(order.indexOf('community-intro')).toBeLessThan(order.indexOf('daily-thought'));
 await expect(page.locator('[data-home-how-open]').filter({visible:true})).toHaveCount(1);
});

test('riga unica del meteo: copia delle 12:10 da aggiornare, dettagli su richiesta',async({page})=>{
 let fail=false;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>{const growth=new URL(r.request().url()).searchParams.has('daily');return fail&&growth?r.fulfill({status:503,json:{error:'Servizio temporaneamente indisponibile'}}):r.fulfill({json:forecast(r.request().url(),T('12:10'),WX.good)});});
 await page.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:install-later',String(Date.now()));});
 await page.clock.install({time:T('12:10')});await page.goto('/');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#updated')).toHaveText('Meteo delle 12:10');
 fail=true;await page.clock.setSystemTime(T('16:30'));await page.reload();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#updated')).toHaveText('Meteo delle 12:10 · da aggiornare');await expect(page.locator('#refresh')).toContainText('Aggiorna');
 const details=page.locator('.home-weather-details');await expect(details).toBeVisible();await expect(page.locator('#stale')).toBeHidden();
 await details.locator('summary').click();await expect(page.locator('#stale')).toBeVisible();await expect(page.locator('#stale .link-btn')).toBeHidden();
 await expect(page.locator('.home-weather-status')).not.toContainText('in parte ·');
 expect(errors).toEqual([]);
});
// OUT-03, punto 1 (24/10/2026): dopo la fine della raccolta consentita (un'ora dopo il tramonto) la scheda non dice
// «orario superato» ma «Raccolta chiusa». Il 21/10 a Rieti il tramonto è verso le 18:15: la raccolta chiude verso le 19:15.
test('scheda di oggi: orario superato nel pomeriggio, raccolta chiusa la sera',async({page})=>{
 const errors=await openHome(page,{time:T('16:30')});
 await page.goto('/#/zona/tancia/0');const when=page.locator('.view:not([hidden])').getByText(/Orario consigliato superato|Raccolta chiusa/).first();
 await expect(when).toHaveText('Orario consigliato superato');
 await page.clock.setSystemTime(T('19:30'));await page.goto('/#/');await page.goto('/#/zona/tancia/0');
 await expect(page.locator('.view:not([hidden])').getByText(/Orario consigliato superato|Raccolta chiusa/).first()).toHaveText('Raccolta chiusa');
 // OUT-03, punto 2: dalle 14 il meteo dell'uscita di oggi non è più una previsione.
 await expect(page.locator('.view:not([hidden]) .when-weather').first()).toContainText('Mattina di oggi già passata');
 expect(errors).toEqual([]);
});

// Stabilità (decisione di Matteo del 24/10): a pagina già letta, il meteo che cambierebbe tutta la proposta non
// ridisegna da solo. La copertina resta, le card che peggiorano lo dicono subito e «Aggiorna» applica il nuovo stato.
test('il meteo nuovo che cambia tutto aspetta «Aggiorna»; il peggioramento si vede subito',async({page})=>{
 let storm=false;const errors=[];page.on('pageerror',e=>errors.push(e.message));const time=T('09:30');
 await page.setViewportSize({width:390,height:844});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({json:forecast(r.request().url(),time,storm?WX.storm:WX.good)}));
 await page.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:install-later',String(Date.now()));});
 await page.clock.install({time});await page.goto('/');
 const cover=page.locator('#hero .cover-link');await expect(cover).toBeVisible();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 const href=await cover.getAttribute('href');
 const originalCover=await cover.elementHandle();
 await page.clock.runFor(3000);await page.mouse.wheel(0,400);await page.evaluate(()=>scrollTo(0,0));
 storm=true;await page.locator('#refresh').click();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 const bar=page.locator('#home-update');await expect(bar).toBeVisible();await expect(bar).toContainText('Nuove proposte in base al meteo.');
 await expect(cover).toHaveAttribute('href',href);
 expect(await originalCover.evaluate(el=>el.isConnected)).toBe(true);
 await expect(page.locator('#hero .fact.wx-sconsigliata')).toBeVisible();
 await expect(page.locator('#hero .weather-alert')).toHaveText('Meteo peggiorato');
 await bar.getByRole('button',{name:'Mostra proposte'}).click();
 await expect(bar).toBeHidden();await expect(page.locator('#hero [data-home-state="weather"]')).toBeVisible();
 expect(errors).toEqual([]);
});
