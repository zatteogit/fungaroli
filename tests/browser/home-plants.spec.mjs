import {test,expect} from '@playwright/test';
import {preparePage,loadAllImages} from '../../tools/visual-audit.mjs';
for(const width of [390,1280]) test(`hero comune e filtro piante persistente a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme:'dark'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#hero .cover-sp')).toContainText('Da conoscere');
 const structure=await page.locator('#hero .cover').evaluate(e=>[...e.children].map(c=>c.className));
 await page.locator('#active-filters [data-more]').click();await page.locator('#full-filters [data-target]').selectOption('piante');
 await page.locator('#full-filters [data-close]').first().click();
 await expect(page.locator('#hero .cover-sp')).toContainText('Da osservare');await expect(page.locator('#hero .cover-sp')).toContainText('Periodo indicativo:');
 expect(await page.locator('#hero .cover').evaluate(e=>[...e.children].map(c=>c.className))).toEqual(structure);
 await expect(page.locator('#hero .ring-title')).toHaveText('Contesto');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await loadAllImages(page);await page.locator('#hero .cover').screenshot({path:`/tmp/fronda-home-plants-${width}.png`});
 await page.reload();await expect(page.locator('#hero .cover-sp')).toContainText('Da osservare');
 await page.locator('#active-filters [data-more]').click();await expect(page.locator('#full-filters [data-target]')).toHaveValue('piante');
 await page.locator('#full-filters [data-target]').selectOption('funghi');await page.locator('#full-filters [data-close]').first().click();
 await expect(page.locator('#hero .cover-sp')).toContainText('Da conoscere');expect(errors).toEqual([]);await context.close();
});
