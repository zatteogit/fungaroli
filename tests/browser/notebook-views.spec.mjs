import {test,expect} from '@playwright/test';
import {preparePage,auditState} from '../../tools/visual-audit.mjs';
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test(`viste taccuino: pagine, griglia ed elenco ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/diario/esempio');const grid=page.locator('.diary-grid');await expect(grid.locator('.diary-card')).toHaveCount(14);
 const ids=await grid.locator('.diary-card').evaluateAll(xs=>xs.map(x=>x.dataset.journalId));
 const storage=await page.evaluate(()=>localStorage.getItem('fungaroli:diario:v1'));
 const columns=()=>grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 for(const layout of ['gallery','list','pages']){
  await page.locator(`[data-notebook-layout="${layout}"]`).click();await expect(grid).toHaveAttribute('data-notebook-view',layout);
  expect(await grid.locator('.diary-card').evaluateAll(xs=>xs.map(x=>x.dataset.journalId))).toEqual(ids);
  if(layout==='gallery'){
   expect(await columns()).toBe(width<600?2:width<1000?3:4);
   await expect(grid.locator('.diary-card-paper').first()).toBeVisible();
   await page.locator('[data-notebook-density="compact"]').click();expect(await columns()).toBe(width<600?3:width<1000?4:6);
   await page.locator('[data-notebook-density="large"]').click();
  }
  if(layout==='list'){
   expect(await columns()).toBe(1);
   const geometry=await grid.locator('.diary-card').first().evaluate(el=>{const image=el.querySelector('.diary-card-image').getBoundingClientRect(),text=el.querySelector('.diary-card-body').getBoundingClientRect();return {right:image.right,left:text.left,topGap:Math.abs(image.top-text.top)};});
   expect(geometry.left-geometry.right).toBeGreaterThanOrEqual(15);expect(geometry.topGap).toBeLessThan(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.diary-view-bar').evaluate(el=>{el.scrollIntoView({block:'start'});scrollBy(0,-80);});
  await page.screenshot({path:`/tmp/fronda-notebook-${layout}-${width}-${theme}.png`});
 }
 await page.locator('[data-notebook-filter="fungo"]').click();const filtered=await grid.locator('.diary-card').count();expect(filtered).toBeLessThan(14);
 await page.locator('[data-notebook-layout="gallery"]').click();await expect(grid.locator('.diary-card')).toHaveCount(filtered);
 const href=await grid.locator('.diary-card-link').first().getAttribute('href');await grid.locator('.diary-card-link').first().click();await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
 await page.locator('.diary-back').click();await expect(grid).toHaveAttribute('data-notebook-view','gallery');await expect(grid.locator('.diary-card')).toHaveCount(filtered);
 await page.reload();await expect(grid).toHaveAttribute('data-notebook-view','gallery');
 expect(await page.evaluate(()=>localStorage.getItem('fungaroli:diario:v1'))).toBe(storage);
 const records=await auditState(page,{root:'.diary-view-bar'});expect(records.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold)).toEqual([]);
 expect(errors).toEqual([]);await context.close();
});
test('cambio vista conserva la pagina visibile e la ricerca',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));await page.goto('/#/diario/esempio');await expect(page.locator('.diary-card')).toHaveCount(14);await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 await page.locator('.diary-card').nth(6).scrollIntoViewIfNeeded();
 const id=await page.evaluate(()=>{const edge=document.querySelector('.diary-view-bar').getBoundingClientRect().bottom+8;return [...document.querySelectorAll('.diary-card')].find(c=>c.getBoundingClientRect().bottom>edge).dataset.journalId;});
 await page.locator('[data-notebook-layout="gallery"]').click();await expect(page.locator(`.diary-card[data-journal-id="${id}"]`)).toBeInViewport();
 await page.locator('#notebook-query').fill('bosco');const ids=await page.locator('.diary-card').evaluateAll(xs=>xs.map(x=>x.dataset.journalId));
 await page.locator('[data-notebook-layout="list"]').click();await expect(page.locator('#notebook-query')).toHaveValue('bosco');expect(await page.locator('.diary-card').evaluateAll(xs=>xs.map(x=>x.dataset.journalId))).toEqual(ids);
 await context.close();
});
