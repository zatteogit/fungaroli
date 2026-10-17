import {test,expect} from '@playwright/test';
import {preparePage,loadAllImages,auditState} from '../../tools/visual-audit.mjs';
for(const width of [390,1280]) test(`hero comune e filtro piante persistente a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme:'dark'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#hero .cover-sp')).toContainText('Da conoscere');
 // Le righe possono ricevere un contenitore per le frecce dopo il primo render.
 // Confronta l'ordine delle sezioni anche mentre quel contenitore viene creato.
 const sectionOrder=()=>page.locator('[data-view="uscite"]').evaluate(view=>[...view.children]
  .flatMap(e=>e.classList.contains('rail-host')?[...e.children]:[e])
  .filter(e=>['hero','others-h','ranking','during-walk','season-h','season'].includes(e.id)).map(e=>e.id));
 const order=await sectionOrder();
 const structure=await page.locator('#hero .cover').evaluate(e=>[...e.children].filter(c=>!c.classList.contains('outdoor-backdrop')).map(c=>c.className));
 await page.locator('#active-filters [data-more]').click();await page.locator('#full-filters [data-intent="piante"]').click();await page.locator('#full-filters [data-intent="funghi"]').click();
 await page.locator('#full-filters [data-close]').first().click();
 await expect(page.locator('#hero .cover-sp')).toContainText('Da osservare');await expect(page.locator('#hero .cover-sp')).toContainText('Periodo indicativo:');
 expect(await page.locator('#hero .cover').evaluate(e=>[...e.children].filter(c=>!c.classList.contains('outdoor-backdrop')).map(c=>c.className))).toEqual(structure);
 await expect(page.locator('#hero .ring')).toHaveCount(0);
 expect(await sectionOrder()).toEqual(order);
 await expect(page.locator('#season .outdoor-plant').first()).toHaveClass('portrait outdoor-plant');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await loadAllImages(page);
 for(const theme of ['light','dark'])for(const root of ['#hero .cover','#season']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);const readings=await auditState(page,{root});expect(readings.length).toBeGreaterThan(5);expect(readings.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio,threshold:r.threshold}))).toEqual([]);}
 await page.locator('#season').screenshot({path:`/tmp/fronda-plant-cards-${width}.png`});
 await page.locator('#hero .cover').screenshot({path:`/tmp/fronda-home-plants-${width}.png`});
 await page.reload();await expect(page.locator('#hero .cover-sp')).toContainText('Da osservare');
 await page.locator('#active-filters [data-more]').click();await expect(page.locator('#full-filters [data-intent="piante"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#full-filters [data-intent="funghi"]').click();await page.locator('#full-filters [data-intent="piante"]').click();await page.locator('#full-filters [data-close]').first().click();
 await expect(page.locator('#hero .cover-sp')).toContainText('Da conoscere');expect(await sectionOrder()).toEqual(order);expect(errors).toEqual([]);await context.close();
});
