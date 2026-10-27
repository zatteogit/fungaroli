import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
import {todayISO} from '../../js/weather.js';

async function outing(browser,prefs,offline=false) {
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await preparePage(context);
 await page.addInitScript(prefs=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify(prefs)),prefs);
 if(offline)await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'fixture offline'}}));
 await page.goto('/#/zona/vallonina/1');
 await expect(page.locator('#legal-loading')).toBeHidden();
 await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#detail .field-tools')).toBeVisible();
 return {context,page};
}
for(const [name,prefs,offline] of [
 ['funghi',{interests:['funghi'],target:'funghi',speciesIds:['edulis']},false],
 ['interessi e vincoli combinati',{interests:['funghi','piante'],target:'funghi',easyTrails:true,shortTrails:true},false],
 ['piante',{interests:['piante'],target:'piante'},false],
 ['sentieri senza meteo',{interests:['passeggiata'],target:'passeggiata',easyTrails:true,shortTrails:true},true],
 ['funghi senza meteo',{interests:['funghi'],target:'funghi',speciesIds:['edulis']},true],
])test(`gerarchia dell’uscita: ${name}, nessun testo coperto nei due temi`,async({browser})=>{
 const {context,page}=await outing(browser,prefs,offline);
 try{
 for(const width of [320,390,768,1280])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const fit=await page.locator('#detail').evaluate(root=>{
   const rect=s=>root.querySelector(s)?.getBoundingClientRect(),search=rect('.outing-search'),days=rect('.outing-days'),indicators=rect('.hero-indicators'),body=rect('.pbody'),tools=rect('.field-tools');
   const captions=[...root.querySelectorAll('.hero-indicators .weather-caption,.hero-indicators .ring-caption')].map(e=>e.getBoundingClientRect().bottom);
   const last=root.querySelector('.outing-search-content').lastElementChild.getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth,toolsOverflow:root.querySelector('.field-tools').scrollWidth>tools.width+1,toolsHeight:tools.height,searchEnd:search.bottom,searchTextEnd:last.bottom,daysStart:days.top,daysEnd:days.bottom,indicatorsStart:indicators?.top,indicatorsEnd:indicators?.bottom,bodyStart:body?.top,captionEnd:Math.max(0,...captions)};
  });
  expect(fit.overflow,`${name} ${width} ${theme}`).toBe(false);expect(fit.toolsOverflow).toBe(false);expect(fit.toolsHeight).toBeLessThan(160);
  expect(fit.searchTextEnd).toBeLessThanOrEqual(fit.searchEnd+1);expect(fit.searchEnd).toBeLessThanOrEqual(fit.daysStart+1);
  if(fit.indicatorsStart!==undefined){expect(fit.daysEnd).toBeLessThanOrEqual(fit.indicatorsStart+1);expect(fit.captionEnd).toBeLessThanOrEqual(fit.indicatorsEnd+1);}
  if(fit.bodyStart!==undefined)expect(fit.indicatorsEnd??fit.daysEnd).toBeLessThanOrEqual(fit.bodyStart+1);
 }
 const tools=page.locator('#detail .field-tools');await expect(tools.locator('[data-field-prepare]')).toHaveText('Salva offline');await expect(tools.locator('[data-keep-awake]')).toBeHidden();await expect(tools.locator('[data-field-alert]')).toBeHidden();
 await tools.locator('summary').click();await expect(tools.locator('[data-keep-awake]')).toBeVisible();await expect(tools.locator('.field-notifications')).toContainText('Non sono allerte ufficiali né un servizio di sicurezza.');
 if(!offline&&prefs.target==='funghi')expect(await page.locator('#detail').evaluate(root=>!!(root.querySelector('.essential-sections').compareDocumentPosition(root.querySelector('.field-tools'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }finally{await context.close();}
});

test('filtri e giorno restano modificabili; gli approfondimenti aperti sopravvivono al meteo',async({browser})=>{
 const {context,page}=await outing(browser,{interests:['funghi','piante'],target:'funghi',speciesIds:['edulis']});
 try{
 const help=page.locator('#detail .outing-context-help'),options=page.locator('#detail .field-options');
 await help.locator('summary').click();await options.locator('summary').click();
 await page.evaluate(()=>document.querySelector('#refresh').click());await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await expect(help).toHaveAttribute('open','');await expect(options).toHaveAttribute('open','');
 await page.locator('#zone-days [data-day-offset="2"]').click();await expect(page.locator('#zone-days [data-day-offset="2"]')).toHaveAttribute('aria-selected','true');
 await expect(options).not.toHaveAttribute('open','');
 await page.locator('#detail [data-outing-filters]').click();await expect(page.locator('#full-filters[open]')).toBeVisible();await expect(page.locator('#species-filter-search')).toBeVisible();
 }finally{await context.close();}
});

test('strumenti compatti: stato attivo visibile, wake lock facoltativo e copia offline raggiungibile',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 try{
 const tomorrow=todayISO(new Date(Date.now()+864e5));
 await page.addInitScript(date=>{
  localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({target:'funghi',interests:['funghi'],speciesIds:['edulis']}));
  localStorage.setItem('fronda:outing-alerts:v1',JSON.stringify({token:'a'.repeat(43),outings:['vallonina|'+date]}));
  window.wakeCalls=0;Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{window.wakeCalls++;const lock=new EventTarget();lock.released=false;lock.release=async()=>{lock.released=true;lock.dispatchEvent(new Event('release'));};return lock;}}});
  // No real registration or permission request: exercise the real cache and IDB behind a ready fixture.
  Object.defineProperty(navigator.serviceWorker,'ready',{value:Promise.resolve({})});
 },tomorrow);
 await page.goto('/#/zona/vallonina/1');await expect(page.locator('#legal-loading')).toBeHidden();await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 const tools=page.locator('#detail .field-tools');await expect(tools.locator('[data-field-active]')).toHaveText('Avvisi attivi');expect(await page.evaluate(()=>wakeCalls)).toBe(0);
 await tools.locator('summary').click();await tools.locator('[data-keep-awake]').click();await expect(tools.locator('[data-field-active]')).toHaveText('Schermo acceso · Avvisi attivi');
 await tools.locator('summary').click();await expect(tools.locator('[data-field-active]')).toBeVisible();await tools.locator('summary').click();await tools.locator('[data-keep-awake]').click();await tools.locator('summary').click();
 await tools.locator('[data-field-prepare]').click();await expect(tools.locator('[data-field-progress]')).toContainText('Pronta su questo dispositivo');await expect(tools.locator('[data-field-prepare]')).toHaveText('Aggiorna copia');
 await expect(tools.locator('.field-link')).toBeVisible();await expect(tools.locator('.field-options')).not.toHaveAttribute('open','');
 const packs=await page.evaluate(async()=>{const {listFieldPacks}=await import('/js/field-store.js');return listFieldPacks();});expect(packs).toHaveLength(1);expect(packs[0].zone.id).toBe('vallonina');expect(packs[0].species.length).toBeGreaterThan(0);
 }finally{await context.close();}
});
