import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const anchored=async page=>{
 await expect(page.locator('.tabbar')).toBeVisible();
 await expect.poll(()=>page.locator('.tabbar').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return Math.abs(r.bottom-(innerHeight-parseFloat(s.bottom)));})).toBeLessThan(2);
};
for(const width of [390,768])test(`navigazione mobile ancorata dopo scroll, resize e cambio pagina a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},userAgent:iphone,hasTouch:true,serviceWorkers:'block'});
 const page=await preparePage(context),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('fungaroli:install-later',String(Date.now()));window.__snapshotCalls=0;const start=Document.prototype.startViewTransition;if(start)Document.prototype.startViewTransition=function(...args){window.__snapshotCalls++;return start.apply(this,args);};});
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
 for(const y of [500,1200,100,0]){await page.evaluate(y=>scrollTo(0,y),y);await anchored(page);}
 for(const height of [660,844,720,844]){await page.setViewportSize({width,height});await anchored(page);}
 await page.locator('#hero .cover-link').click();await expect(page.locator('#detail .phero-title')).toBeVisible();await page.evaluate(()=>scrollTo(0,900));await anchored(page);
 await page.locator('.tabbar [data-tab="uscite"]').click();await expect(page.locator('#hero .cover-link')).toBeVisible();await anchored(page);
 const canVT=await page.evaluate(async()=>{const {canVT}=await import('/js/motion.js');return canVT();});expect(canVT).toBe(false);expect(await page.evaluate(()=>window.__snapshotCalls)).toBe(0);expect(errors).toEqual([]);await context.close();
});

test('navigazione ripristinata dopo tastiera: viewport ridotto e ripristinato',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},userAgent:iphone,hasTouch:true,serviceWorkers:'block'});
 const page=await preparePage(context);
 await page.addInitScript(()=>{
  localStorage.setItem('fungaroli:install-later',String(Date.now()));
  window.__visualHeight=844;const viewport=new EventTarget();Object.defineProperties(viewport,{height:{get:()=>window.__visualHeight},width:{get:()=>innerWidth},offsetTop:{value:0},offsetLeft:{value:0},scale:{value:1}});Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
 });
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await anchored(page);await page.evaluate(()=>scrollTo(0,650));
 await page.locator('.tab-search').click();await expect(page.locator('.search-dlg input')).toBeFocused();
 await page.evaluate(()=>{window.__visualHeight=360;visualViewport.dispatchEvent(new Event('resize'));});await expect(page.locator('html')).toHaveClass(/kb-open/);await expect(page.locator('.tabbar')).toBeHidden();
 await page.locator('.search-cancel').click();await page.evaluate(()=>{window.__visualHeight=844;visualViewport.dispatchEvent(new Event('resize'));});await expect(page.locator('html')).not.toHaveClass(/kb-open/);await anchored(page);await page.evaluate(()=>scrollTo(0,1100));await anchored(page);await context.close();
});

for(const width of [320,768,1280])test(`confronto sticky: riferimento completo e sosia a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context);await page.goto('/#/riconosci/confronta/edulis/tylopilus-felleus');const bar=page.locator('.cmp-pair-nav'),content=bar.locator('.cmp-nav-content'),master=bar.locator('[data-change-master]');
 await expect(master).toHaveText('Porcino');await expect(bar.locator('.cmp-nav-vs')).toHaveText('vs');
 await page.evaluate(()=>scrollTo(0,900));await expect(bar).toHaveClass(/is-stuck/);
 await expect.poll(()=>content.evaluate(e=>Math.abs(e.getBoundingClientRect().top-parseFloat(getComputedStyle(e).top)))).toBeLessThan(2);
 expect(await master.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await expect(master).toBeInViewport();
 const reference=await master.innerText();await page.locator('[data-cmp-step="1"]').click();await expect(master).toHaveText(reference,{useInnerText:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});
