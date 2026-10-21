import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])for(const modal of [false,true])test(`accordion: intestazione stabile ${width}px ${modal?'modale':'pagina'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/specie/edulis');await expect(page.locator('#species-detail .phero-title')).toContainText('Porcino');
 if(modal)await page.evaluate(async()=>{(await import('/js/entity-sheet.js')).openEntitySheet('#/specie/edulis');});
 const scope=page.locator(modal?'#entity-sheet':'#species-detail'),details=scope.locator('details[data-entity-accordion]');
 await expect(details.first()).toBeAttached();expect(await details.count()).toBeGreaterThan(2);
 await details.first().locator(':scope > summary').tap();await expect(details.first()).toHaveAttribute('open','');
 const background=await page.evaluate(()=>scrollY);
 for(const index of [1,2,(await details.count())-1]){
  const current=details.nth(index),summary=current.locator(':scope > summary');await summary.scrollIntoViewIfNeeded();
  const before=await summary.evaluate(e=>{document.addEventListener('click',event=>{const s=event.target.closest('summary');if(s)window.accordionClickTop=s.getBoundingClientRect().top;},{capture:true,once:true});return e.getBoundingClientRect().top;});
  if(index!==2)await summary.tap();else{await summary.evaluate(e=>e.focus({preventScroll:true}));await summary.press('Enter');}
  await expect(current).toHaveAttribute('open','');await expect(scope.locator('details[data-entity-accordion][open]')).toHaveCount(1);
  const after=await summary.evaluate(e=>e.getBoundingClientRect().top);
  const diagnostic=await summary.evaluate(e=>({clickTop:window.accordionClickTop,dialog:e.closest('dialog')&&{top:e.closest('dialog').getBoundingClientRect().top,scroll:e.closest('dialog').scrollTop,max:e.closest('dialog').scrollHeight-e.closest('dialog').clientHeight}}));
  expect(Math.abs(after-diagnostic.clickTop),JSON.stringify({index,before,after,...diagnostic})).toBeLessThan(12);
  await page.waitForTimeout(100);expect(Math.abs(await summary.evaluate(e=>e.getBoundingClientRect().top)-after)).toBeLessThan(2);
 }
 if(modal)expect(await page.evaluate(()=>scrollY)).toBe(background);
 await context.close();
});
