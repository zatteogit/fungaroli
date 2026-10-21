import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
const forms=[['lepiota-brunneoincarnata','emisferico'],['cortinarius-rubellus','piano'],['entoloma-sinuatum','conico'],['amanita-virosa','piano'],['tylopilus-felleus','piano'],['morchella-esculenta','emisferico']];
test('le sei forme importate caricano il raster corretto nella scheda',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 for(const[key,form]of forms){
  await page.goto('/#/fungo/'+key);const strip=page.locator('.view:not([hidden]) .trait-strip').first();
  await strip.locator(`.ts-form[data-ill-v="${form}"]`).click();
  await expect.poll(()=>strip.locator('[data-ill="cappello"]').evaluate((i,end)=>i.src.endsWith(end)&&i.complete&&i.naturalWidth>0,`${key}-cappello-${form}.webp`)).toBe(true);
 }
 await context.close();
});
test('la combinazione del confronto cambia anche quando un altro carattere ha un solo valore',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/riconosci/confronta/edulis/amanita-verna');await expect(page.locator('.fungus-compare')).toBeVisible();
 for(const[kind,value]of [['color','crema'],['shape','emisferico']]){
  const control=page.locator(`[data-cmp-variant-key="amanita-verna"][data-cmp-variant="${kind}"][value="${value}"]`).first();
  for(const tab of await page.locator('.cmp-slide:not([inert]) [role="tab"]').all()){await tab.click();if(await control.isVisible())break;}
  await control.click();await expect(control).toHaveAttribute('aria-pressed','true');
 }
 const artwork=page.locator('[data-cmp-ill-key="amanita-verna"] img[src$="amanita-verna-cappello-crema-emisferico.webp"]').first();
 await expect(artwork).toHaveCount(1);await expect.poll(()=>artwork.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 expect(errors).toEqual([]);await context.close();
});
