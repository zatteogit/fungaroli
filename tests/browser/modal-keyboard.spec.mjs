import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
test('tastiera con layout viewport invariato: modale, chiusura e suggerimenti restano nell’area visibile',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 await page.addInitScript(()=>{
  localStorage.setItem('fungaroli:install-later',String(Date.now()));
  const viewport=new EventTarget();Object.assign(viewport,{height:844,width:390,offsetTop:0,offsetLeft:0,scale:1});
  Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
  window.setKeyboardViewport=(height,offsetTop)=>{Object.assign(viewport,{height,offsetTop});viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));};
 });
 await page.goto('/#/diario');await page.locator('[data-new-note]').first().click();
 const dialog=page.locator('.notebook-dialog[open]');await dialog.locator('[data-note-type="fungo"]').click();
 const input=dialog.locator('[data-note-zone]'),list=dialog.locator('#notebook-zone-options');await input.focus();
 const documentScroll=await page.evaluate(()=>scrollY);
 for(const [height,offset]of [[390,0],[330,80],[440,0]]){
  await page.evaluate(([h,y])=>window.setKeyboardViewport(h,y),[height,offset]);
  await expect.poll(async()=>{
   const d=await dialog.boundingBox(),field=await input.boundingBox(),close=await dialog.locator('[data-note-close]').boundingBox();
   return d.y>=offset+11&&d.y+d.height<=offset+height-11&&field.y>=close.y+close.height&&field.y+field.height<=offset+height-12;
  }).toBe(true);
  await input.fill('Antro');await expect(list).toBeVisible();
  const popup=await list.boundingBox(),header=await dialog.locator('.report-header').boundingBox();
  expect(popup.y).toBeGreaterThanOrEqual(header.y+header.height);
  expect(popup.y+popup.height).toBeLessThanOrEqual(offset+height-12);
  expect(await page.evaluate(()=>scrollY)).toBe(documentScroll);
 }
 await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('Antrodoco');
 await page.evaluate(()=>window.setKeyboardViewport(844,0));await expect(page.locator('html')).not.toHaveClass(/modal-viewport-constrained/);
 await dialog.locator('[data-note-close]').click();await expect(dialog).toBeHidden();await expect(page.locator('html')).not.toHaveClass(/modal-scroll-locked/);
 await context.close();
});
