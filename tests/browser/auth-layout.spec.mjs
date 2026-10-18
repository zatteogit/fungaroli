import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])test(`accesso compatto con tastiera e chiusura sempre disponibile a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 await page.addInitScript(w=>{
  localStorage.setItem('fungaroli:install-later',String(Date.now()));
  const vv=new EventTarget();Object.assign(vv,{height:844,width:w,offsetTop:0,offsetLeft:0,scale:1});
  Object.defineProperty(window,'visualViewport',{value:vv,configurable:true});
  window.authKeyboard=(height,offsetTop)=>{Object.assign(vv,{height,offsetTop});vv.dispatchEvent(new Event('resize'));vv.dispatchEvent(new Event('scroll'));};
 },width);
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill({json:{user:null}}));
 await page.goto('/#/diario');await page.evaluate(async()=>await (await import('/js/community.js')).communityReady());await page.locator('.appbar [data-community-account]').click();
 const dialog=page.locator('.auth-dialog[open]'),close=dialog.getByRole('button',{name:'Chiudi l’accesso'}),input=dialog.locator('[data-handle]');
 await expect(close).toBeFocused();await expect(input).not.toBeFocused();
 expect(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth)).toBe(true);
 for(const button of await dialog.locator('.auth-actions button').all()){const r=await button.boundingBox();expect(r.height).toBeGreaterThanOrEqual(44);expect(r.height).toBeLessThan(54);}
 await input.fill('Un nome di prova');
 for(const [height,top]of [[390,0],[330,70]]){
  await page.evaluate(([h,y])=>window.authKeyboard(h,y),[height,top]);
  await expect.poll(async()=>{const d=await dialog.boundingBox(),x=await close.boundingBox(),field=await input.boundingBox();return d.y>=top+11&&d.y+d.height<=top+height-11&&x.y>=top+12&&x.y+x.height<=top+height&&field.y>=x.y+x.height&&field.y+field.height<=top+height-12;}).toBe(true);
  await dialog.evaluate(d=>d.scrollTop=d.scrollHeight);
  await expect(close).toBeInViewport();
 }
 await close.click();await expect(dialog).toBeHidden();await expect(page.locator('dialog[open]:modal')).toHaveCount(0);
 await context.close();
});
