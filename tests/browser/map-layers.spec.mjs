import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280]) test(`il pannello livelli supera filtri e frecce a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await preparePage(context,{theme:'dark'});
 await page.goto('/#/mappa/tancia');
 await expect.poll(()=>page.locator('#map').evaluate(el=>Math.abs(el.getBoundingClientRect().width-innerWidth))).toBeLessThan(1);
 await page.locator('.mapctl [data-act="layers"]').first().click();
 const panel=page.locator('.mapctl-panel');await expect(panel).toBeVisible();
 // Riproduce la sovrapposizione con la barra espansa, indipendentemente dal numero di pillole.
 const result=await page.evaluate(()=>{
  const panel=document.querySelector('.mapctl-panel'),bar=document.querySelector('.map-top');
  const r=panel.getBoundingClientRect(),parent=bar.offsetParent.getBoundingClientRect();
  bar.style.top=`${r.top-parent.top}px`;bar.style.left=`${r.left-parent.left}px`;
  const rect=bar.getBoundingClientRect(),x=Math.max(r.left,rect.left)+8,y=Math.max(r.top,rect.top)+8;
  return {overlaps:x<Math.min(r.right,rect.right)&&y<Math.min(r.bottom,rect.bottom),panelOnTop:!!document.elementFromPoint(x,y)?.closest('.mapctl-panel')};
 });
 expect(result.overlaps).toBe(true);expect(result.panelOnTop).toBe(true);
 await panel.locator('.mapctl-x').click();await expect(panel).toBeHidden();
 await context.close();
});

for(const width of [390,1280]) test(`interessi prima delle preferenze sulla mappa a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await preparePage(context);await page.goto('/#/mappa/tancia');
 const bar=page.locator('#map-filters');await expect(bar.locator('[data-more]')).toBeVisible();
 const order=await bar.locator('button').evaluateAll(els=>els.map(el=>el.hasAttribute('data-more')?'more':el.hasAttribute('data-p')?'pref':el.hasAttribute('data-intent')?'fungo':'day'));
 expect(order.indexOf('more')).toBeLessThan(order.indexOf('pref'));expect(order.lastIndexOf('fungo')).toBeLessThan(order.indexOf('pref'));
 await bar.locator('[data-more]').click();await expect(page.locator('#full-filters[open]')).toBeVisible();await context.close();
});
