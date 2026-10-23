import {mapToggle,mapLegend} from './map-helpers.mjs';
import {test,expect} from '@playwright/test';
import {preparePage,loadAllImages,auditState} from '../../tools/visual-audit.mjs';
const ids=['funghi','piante','passeggiata'];
// La carta può avere etichette sovrapposte: sceglie un’icona realmente raggiungibile al tocco.
async function chooseVisibleBotanical(page){
 const badges=page.locator('#map .map-plant-badge');let index=-1;
 await expect.poll(async()=>index=await badges.evaluateAll(nodes=>nodes.findIndex(el=>{
  const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  return r.width>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));
 }))).toBeGreaterThanOrEqual(0);
 await badges.nth(index).click();
}

for(const width of [320,1280])test(`interessi indipendenti: tutte le combinazioni, home e mappa a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme:'dark'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 for(let mask=0;mask<8;mask++){
  const selected=ids.filter((id,i)=>mask&(1<<i));
  for(const id of ids){const b=page.locator(`#active-filters [data-intent="${id}"]`);if((await b.getAttribute('aria-pressed')==='true')!==selected.includes(id))await b.click();}
  await expect(page.locator('#hero .cover')).toBeVisible();
  await expect(page.locator('#hero .cover-index')).toHaveCount(selected.includes('funghi')?1:0);
  if(selected.includes('piante'))await expect(page.locator('#hero .cover-plant')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/#/mappa');
  await page.locator('#map-filters [data-more]').click();
  for(const id of ids)await expect(page.locator(`#full-filters [data-intent="${id}"]`)).toHaveAttribute('aria-pressed',String(selected.includes(id)));
  await page.locator('#full-filters [data-close]').last().click();
  if(selected.includes('funghi')&&selected.includes('piante')){await expect(page.locator('#legend')).toContainText('Potenziale dei funghi e meteo previsto');await expect(page.locator('#legend')).toContainText('Piante da osservare');}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#map-filters > button')).toHaveCount(2);
  await page.goto('/#/uscite');
 }
 await page.reload();for(const id of ids)await expect(page.locator(`#active-filters [data-intent="${id}"]`)).toHaveAttribute('aria-pressed','true');
 await loadAllImages(page);
 for(const theme of ['light','dark']){
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const readings=await auditState(page,{root:'#active-filters'});expect(readings.length).toBeGreaterThanOrEqual(ids.length);
  expect(readings.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio,threshold:r.threshold}))).toEqual([]);
 }
 await page.locator('#active-filters').screenshot({path:`/tmp/fronda-interests-${width}.png`});
 expect(errors).toEqual([]);await context.close();
});
test('filtri sulle specie indipendenti nella ricerca combinata',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme:'dark'});
 await page.goto('/');await page.locator('#active-filters [data-intent="piante"]').click();
 await page.locator('#appbar-home-filters [data-more]:visible,#home-filter-action [data-more]:visible').first().click();
 const panel=page.locator('#full-filters');await expect(panel.locator('[data-intent][aria-pressed="true"]')).toHaveCount(2);
 await panel.locator('#species-filter-search').fill('prugnolo');await panel.locator('#species-filter-options [role="option"]').first().click();
 const plants=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).plantIds);expect(plants.length).toBeGreaterThan(0);
 await panel.locator('[data-group="porcini"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).plantIds)).toEqual(plants);
 const fungi=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).speciesIds);expect(fungi.length).toBeGreaterThan(0);
 await panel.locator('[data-close]').first().click();await page.reload();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')));expect(saved.interests).toEqual(['funghi','piante']);expect(saved.plantIds).toEqual(plants);expect(saved.speciesIds).toEqual(fungi);
 await context.close();
});
test('mappa botanica: spunti concreti e spiegazione progressiva',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme:'dark'});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:['piante','passeggiata']})));
 await page.goto('/#/mappa');
 const note=page.locator('#legend .map-plant-note');await expect(note).toHaveCount(1);await expect(note).not.toHaveAttribute('open','');
 await expect(page.locator('#map .pc')).toHaveCount(0);await expect(page.locator('#map')).not.toContainText('0 spunti');
 const badge=page.locator('#map .map-plant-badge').first();await expect(badge).toBeVisible();await expect(badge).toHaveAttribute('title',/^Da osservare: /);
 await chooseVisibleBotanical(page);await expect(page.locator('#map-sheet .map-discoveries-title')).toHaveText('Da osservare');await expect(page.locator('#map-sheet .discovery-link').first()).toBeVisible();await expect(page.locator('#map-sheet .discovery-intro')).toHaveCount(0);
 await expect(page.locator('#map-sheet')).not.toContainText('presenza da verificare');
 await loadAllImages(page);await page.locator('#map-sheet').screenshot({path:'/tmp/fronda-v98-plant-sheet-final.png'});
 await page.locator('#map-sheet .sheet-close').click();
 await mapToggle(page,'funghi');await expect(page.locator('#map .pc').first()).toBeVisible();
 await chooseVisibleBotanical(page);await expect(page.locator('#map-sheet .ring')).toBeVisible();await expect(page.locator('#map-sheet .discovery-link').first()).toBeVisible();
 await page.locator('#map-sheet .sheet-close').click();await mapLegend(page);await note.locator('summary').click();await expect(note).toHaveAttribute('open','');await expect(note).toContainText('Non sono avvistamenti confermati');
 await context.close();
});
test('Poca gente mantiene testo, icona e selezione',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:800},serviceWorkers:'block'}),page=await preparePage(context,{theme:'dark'});await page.goto('/');
 const button=page.locator('#active-filters [data-p="avoidCrowd"]');await expect(button).toContainText('Poca gente');await expect(button.locator('.pref-icon')).toBeVisible();
 await button.click();await expect(button).toContainText('Poca gente');await expect(button).toHaveAttribute('aria-pressed','true');await expect(button.locator('.pref-icon')).toBeHidden();
 await page.reload();await expect(button).toHaveAttribute('aria-pressed','true');await expect(button).toContainText('Poca gente');await context.close();
});

test('mappa con copertura botanica vuota: conserva i sentieri senza falsi zeri',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme:'light'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/content/v1/snapshot',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await page.route('**/data/plants.json',r=>r.fulfill({json:{plants:{}}}));
 await page.route('**/data/botanical-models.json',r=>r.fulfill({json:{models:{}}}));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:['piante','passeggiata']})));
 await page.goto('/#/mappa');await expect(page.locator('#map .zone-label').first()).toBeVisible();await expect(page.locator('#map .map-plant-badge')).toHaveCount(0);await expect(page.locator('#map .pc')).toHaveCount(0);
 await expect(page.locator('#map')).not.toContainText(/0 spunti|Nessuna pianta|Piante non disponibili/);
 await expect(page.locator('#legend .map-plant-note')).toHaveCount(1);expect(errors).toEqual([]);await context.close();
});
