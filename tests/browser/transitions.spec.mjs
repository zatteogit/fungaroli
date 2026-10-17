import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';

// Transizioni tra le pagine (js/motion.js, css/style.css «movimento»): direzione push/pop/dissolvenza,
// posizione di scorrimento, nessuno spostamento di layout, riduzione del movimento e browser senza View Transitions.
async function setup(page,width,{reduced=false,noVT=false}={}) {
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // le risorse esterne sono bloccate di proposito qui sotto: contano solo gli errori dell'app
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.pathname!=='/api/weather/v1/forecast'&&u.hostname!=='api.open-meteo.com')return u.protocol==='https:'?route.abort():route.fallback();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(noVT=>{
    localStorage.setItem('fungaroli:legal-accepted','32026-10-16');
    if(noVT)delete Document.prototype.startViewTransition;
    // registro delle direzioni (<html data-nav>) e degli spostamenti di layout, anche quelli dopo un tocco
    window.__navs=[];window.__shifts=[];
    new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shifts.push({v:e.value,t:e.startTime});}).observe({type:'layout-shift',buffered:true});
    const watch=()=>new MutationObserver(()=>{const n=document.documentElement.dataset.nav;if(n)window.__navs.push(n);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-nav']});
    if(document.documentElement)watch();else document.addEventListener('readystatechange',watch,{once:true});
  },noVT);
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
  // il primo meteo e le foto della home sono assestati: da qui ogni spostamento è colpa della navigazione
  await page.waitForTimeout(1500);
  return errors;
}
// fine della transizione in corso (o nessuna transizione)
const settled=page=>expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.nav||'')).toBe('');
// esegue un passo e restituisce le direzioni viste e la somma degli spostamenti di layout
async function step(page,fn) {
  const t0=await page.evaluate(()=>{window.__navs=[];return performance.now();});
  await fn();await settled(page);await page.waitForTimeout(700);
  return page.evaluate(t0=>({navs:[...new Set(window.__navs)],shift:window.__shifts.filter(e=>e.t>=t0).reduce((s,e)=>s+e.v,0),y:scrollY}),t0);
}
const back=page=>page.locator('[data-back]:visible').first().click();
const SHIFT_MAX=.005;

for(const width of [390,1280]) test(`push, pop e dissolvenza senza spostamenti di layout a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  // Uscite → zona: la pagina entra in profondità, la copertina è pronta e dalla cima
  let r=await step(page,()=>page.locator('#hero .cover-link').click());
  expect(r.navs).toEqual(['push']);expect(r.shift).toBeLessThan(SHIFT_MAX);expect(r.y).toBe(0);
  await expect(page.locator('.view:not([hidden]) .phero-img img')).toHaveAttribute('data-image-state','ready');
  await page.evaluate(()=>scrollTo(0,500));
  r=await step(page,()=>back(page));
  expect(r.navs).toEqual(['pop']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  // barra delle sezioni: dissolvenza, mai push/pop
  r=await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  expect(r.navs).toEqual(['right']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  // griglia → scheda → indietro
  r=await step(page,()=>page.locator('.view:not([hidden]) .sp-card').nth(3).click());
  expect(r.navs).toEqual(['push']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  r=await step(page,()=>back(page));
  expect(r.navs).toEqual(['pop']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  for(const [tab,dir] of [['diario','right'],['uscite','left'],['specie','right']]) {
    r=await step(page,()=>page.locator(`.tabbar [data-tab="${tab}"]`).click());
    expect(r.navs).toEqual([dir]);expect(r.shift).toBeLessThan(SHIFT_MAX);
  }
  // da una pagina interna la barra delle sezioni sfuma comunque (non è un «indietro»)
  await step(page,()=>page.locator('.view:not([hidden]) .sp-card').first().click());
  r=await step(page,()=>page.locator('.tabbar [data-tab="uscite"]').click());
  expect(r.navs).toEqual(['left']);
  // Scopri: Impara è una scheda accanto (dissolvenza), il glossario un livello sotto
  await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  r=await step(page,()=>page.locator('.view:not([hidden]) [data-scopri-nav] a[data-section="impara"]').click());
  expect(r.navs).toEqual(['right']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  r=await step(page,()=>page.locator('.learn-card[data-learn="glossario"]').click());
  expect(r.navs).toEqual(['push']);expect(r.shift).toBeLessThan(SHIFT_MAX);
  r=await step(page,()=>page.evaluate(()=>{location.hash='#/glossario/volva';}));
  expect(r.shift).toBeLessThan(SHIFT_MAX);
  await expect(page.locator('#glossary-term-volva')).toBeInViewport();
  // finita la transizione nessun nome resta assegnato: la foto condivisa è unica e temporanea
  expect(await page.evaluate(()=>[...document.querySelectorAll('*')].filter(el=>el.style?.viewTransitionName).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('indietro e sezioni ritrovano la posizione, una pagina nuova parte dalla cima',async({page})=>{
  const errors=await setup(page,390);
  await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  await page.evaluate(()=>scrollTo(0,900));await page.waitForTimeout(200);
  const y=await page.evaluate(()=>scrollY);expect(y).toBeGreaterThan(800);
  let r=await step(page,()=>page.locator('.view:not([hidden]) .sp-card').nth(6).click());
  expect(r.y).toBe(0);
  // il focus va al titolo della scheda, senza far scorrere la pagina
  await expect(page.locator('.view:not([hidden]) .phero-title')).toBeFocused();
  r=await step(page,()=>back(page));
  expect(Math.abs(r.y-y)).toBeLessThanOrEqual(2);
  // tornando indietro il focus torna sulla card da cui eri partito
  await expect(page.locator('.view:not([hidden]) .sp-card').nth(6)).toBeFocused();
  // ogni sezione della barra ricorda la sua posizione
  await step(page,()=>page.locator('.tabbar [data-tab="diario"]').click());
  r=await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  expect(Math.abs(r.y-y)).toBeLessThanOrEqual(2);
  // la sezione già aperta toccata di nuovo torna in cima
  await page.locator('.tabbar [data-tab="specie"]').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test('con «riduci movimento» nessuna transizione, stessa navigazione',async({page})=>{
  const errors=await setup(page,390,{reduced:true});
  let r=await step(page,()=>page.locator('#hero .cover-link').click());
  expect(r.navs).toEqual([]);expect(r.y).toBe(0);
  await expect(page.locator('.view[data-view="zona"]')).toBeVisible();
  await expect(page.locator('.view:not([hidden]) .phero-title')).toBeFocused();
  r=await step(page,()=>back(page));
  expect(r.navs).toEqual([]);
  r=await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  expect(r.navs).toEqual([]);expect(r.shift).toBeLessThan(SHIFT_MAX);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>String(a.effect?.pseudoElement||'').startsWith('::view-transition')).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('senza View Transitions la navigazione funziona senza errori',async({page})=>{
  const errors=await setup(page,390,{noVT:true});
  expect(await page.evaluate(()=>typeof document.startViewTransition)).toBe('undefined');
  let r=await step(page,()=>page.locator('#hero .cover-link').click());
  expect(r.navs).toEqual([]);await expect(page.locator('.view[data-view="zona"]')).toBeVisible();
  r=await step(page,()=>back(page));
  await expect(page.locator('.view[data-view="uscite"]')).toBeVisible();
  await step(page,()=>page.locator('.tabbar [data-tab="specie"]').click());
  await step(page,()=>page.locator('.view:not([hidden]) .sp-card').first().click());
  await expect(page.locator('.view:not([hidden]) .phero-title')).toBeVisible();
  expect(errors).toEqual([]);
});

// Scheda della zona: cambiando giorno copertina, anello e giorni restano gli stessi nodi; l'anello arriva al valore
// del giorno scelto; nessuno spostamento; le azioni della scheda non si duplicano.
async function pickDays(page,n) {
  const offsets=await page.locator('#zone-days [data-day-offset]').evaluateAll(els=>els.filter(b=>b.getAttribute('aria-selected')!=='true').map(b=>b.dataset.dayOffset));
  return offsets.slice(0,n).reverse();
}
const ringState=page=>page.evaluate(()=>{const r=document.querySelector('#detail .phero .hero-indicators > .ring');return{same:r===window.__ring,cover:document.querySelector('#detail .phero')===window.__cover,img:document.querySelector('#detail .phero-img img')===window.__img,text:r.querySelector('b').textContent,p:parseFloat(getComputedStyle(r).getPropertyValue('--p')),focus:document.activeElement?.dataset?.dayOffset||''};});
for(const width of [390,1280]) test(`cambio di giorno nella zona senza ricreare la copertina a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  // alone «ambilight»: mai in home (proposta e card), sì dietro la testata della zona, come fratello prima di .phero
  await expect(page.locator('[data-view="uscite"] .ambi')).toHaveCount(0);
  await step(page,()=>page.locator('#hero .cover-link').click());
  await expect(page.locator('#detail > .ambi.on + .phero')).toHaveCount(1);
  await expect(page.locator('#detail > .ambi img')).toHaveCount(1);
  expect(await page.locator('#detail > .ambi').evaluate(a=>getComputedStyle(a).pointerEvents==='none'&&a.getAttribute('aria-hidden')==='true')).toBe(true);
  await page.evaluate(()=>{window.__ring=document.querySelector('#detail .phero .hero-indicators > .ring');window.__cover=document.querySelector('#detail .phero');window.__img=document.querySelector('#detail .phero-img img');window.__ambi=document.querySelector('#detail > .ambi');});
  const days=await pickDays(page,3);expect(days.length).toBe(3);
  // Il calendario segue una hero che cresce con il contenuto: da quando è visibile non deve saltare.
  await page.locator('#zone-days').scrollIntoViewIfNeeded();
  const initialScroll=await page.evaluate(()=>scrollY);
  for(const o of days) {
    const day=page.locator(`#zone-days [data-day-offset="${o}"]`),expected=await day.locator('.pc').textContent();
    const r=await step(page,()=>day.click());
    expect(r.shift).toBeLessThan(SHIFT_MAX);
    await expect(day).toHaveAttribute('aria-selected','true');
    const s=await ringState(page);
    expect(s.same).toBe(true);expect(s.cover).toBe(true);expect(s.img).toBe(true);
    // l'alone resta lo stesso nodo, prima della testata, anche dopo l'aggiornamento sul posto
    expect(await page.evaluate(()=>document.querySelector('#detail > .ambi')===window.__ambi&&window.__ambi.nextElementSibling===window.__cover)).toBe(true);
    expect(s.text).toBe(expected);
    expect(Math.abs(s.p-Number(expected.replace(',','.'))*10)).toBeLessThan(.6);
    // il giorno toccato resta col focus, la pagina non scorre
    expect(s.focus).toBe(o);expect(r.y).toBe(initialScroll);
  }
  expect(page.url()).toContain(`/zona/`);expect(page.url()).toContain(`/${days.at(-1)}`);
  // dopo tre cambi di giorno un'azione della scheda si esegue una volta sola
  await page.evaluate(()=>{window.__writes=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(/^fungaroli:diario/.test(k))window.__writes++;return set.call(this,k,v);};});
  await page.locator('#detail [data-save-plan]').click();
  await expect(page.locator('#detail [data-plan-status]')).toContainText('salvati');
  await page.waitForTimeout(400);
  expect(await page.evaluate(()=>window.__writes)).toBe(1);
  expect(errors).toEqual([]);
});

test('cambio di giorno con «riduci movimento»: valori subito finali',async({page})=>{
  const errors=await setup(page,390,{reduced:true});
  await page.locator('#hero .cover-link').click();await expect(page.locator('#detail .phero .hero-indicators > .ring')).toBeVisible();
  await page.evaluate(()=>{window.__ring=document.querySelector('#detail .phero .hero-indicators > .ring');});
  const [o]=await pickDays(page,1),day=page.locator(`#zone-days [data-day-offset="${o}"]`),expected=await day.locator('.pc').textContent();
  await day.click();
  // nessun conteggio e nessuna transizione dell'arco: il valore è già quello finale
  const s=await page.evaluate(()=>{const r=document.querySelector('#detail .phero .hero-indicators > .ring');return{same:r===window.__ring,text:r.querySelector('b').textContent,p:parseFloat(getComputedStyle(r).getPropertyValue('--p')),anims:r.getAnimations().length};});
  expect(s.same).toBe(true);expect(s.text).toBe(expected);expect(s.anims).toBe(0);
  expect(Math.abs(s.p-Number(expected.replace(',','.'))*10)).toBeLessThan(.6);
  expect(errors).toEqual([]);
});
