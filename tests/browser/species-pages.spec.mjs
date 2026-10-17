import {test,expect} from '@playwright/test';
import {preparePage,loadAllImages,auditState} from '../../tools/visual-audit.mjs';

for(const width of [320,390,768,1440])for(const theme of ['light','dark'])test(`schede reali e confronto: ${width}px, ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['fungo/caloboletus-calopus','specie/edulis']){
  await page.goto('/#/'+route);const root=page.locator('.view:not([hidden]) .fungus-page');
  await expect(root.locator('h1')).toBeVisible();await loadAllImages(page);await page.evaluate(()=>document.fonts.ready);
  const hero=root.locator('.phero'),note=hero.locator('[data-note-kind]');await expect(note).toBeVisible();
  expect(await note.evaluate(e=>{const a=e.getBoundingClientRect(),h=e.closest('.phero').getBoundingClientRect();return a.height>=44&&a.bottom<=h.bottom&&a.right<=h.right;})).toBe(true);
  const art=root.locator('.trait-strip img.ts-ill');for(const img of await art.all())expect(await img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  for(const chip of await root.locator('.ts-dot.ts-chip').all())expect(await chip.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  const chip=root.locator('.ts-dot.ts-chip[aria-pressed="false"]').first();if(await chip.count()){
   const label=await chip.textContent(),value=await chip.getAttribute('data-ill-v');await chip.click();await expect(root.locator(`.ts-dot.ts-chip[data-ill-v="${value}"]`)).toHaveAttribute('aria-pressed','true');await expect(root.locator('.trait-strip')).toContainText(label);
  }
  const details=root.locator('.character-details');if(await details.count())await expect(details).not.toHaveAttribute('open');
  if(await details.count()){await details.locator('summary').focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');}
  if(route.startsWith('fungo')){await note.click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('dialog[open] .notebook-form [name="title"]')).toHaveValue(/Boleto dal bel piede/i);await page.locator('dialog[open] [data-note-close]').first().click();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.goto('/#/riconosci/confronta/edulis/caloboletus-calopus');
 const slide=page.locator('#cmp-caloboletus-calopus');await expect(slide).toBeVisible();
 await expect(slide.locator('.cmp-legend')).toContainText('Valore diverso');
 await expect(slide.locator('[data-cmp-panel="diff"]')).toBeVisible();await expect(slide.locator('[data-cmp-panel="diff"] .cmp-v.own').first()).toBeVisible();
 await page.setViewportSize({width:width+20,height:900});
 await expect.poll(()=>slide.evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.parentElement.getBoundingClientRect().left))).toBeLessThan(2);
 await page.setViewportSize({width,height:900});
 await expect.poll(()=>slide.evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.parentElement.getBoundingClientRect().left))).toBeLessThan(2);
 const same=slide.locator('[data-cmp-panel="same"]');await expect(same).toBeHidden();await slide.getByRole('tab',{name:'In comune',exact:true}).click();await expect(same.locator('.cmp-rows')).toBeVisible();
 await slide.locator('.cmp-sources > summary').click();await expect(slide.locator('.cmp-sources a').first()).toBeVisible();
 const currentTab=page.locator('.cmp-chip[aria-selected="true"]');await currentTab.focus();await page.keyboard.press('ArrowRight');
 await expect.poll(()=>page.locator('.cmp-slide:not([inert])').count()).toBe(1);
 const chip=page.locator('.cmp-chip[aria-selected="false"]').first(),go=await chip.getAttribute('data-go');await chip.click();await expect(page.locator(`.cmp-chip[data-go="${go}"]`)).toHaveAttribute('aria-selected','true');
 await page.goto('/#/riconosci');await expect(page.locator('.fungus-compare')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);await context.close();
});

for(const theme of ['light','dark'])test(`contrasto schede e confronto, inclusi hover e focus: ${theme}`,async({browser})=>{
 test.setTimeout(180000);
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});
 for(const [route,selector,target]of [['fungo/caloboletus-calopus','.view:not([hidden]) .fungus-page','.ts-chip[aria-pressed="false"]'],['riconosci/confronta/edulis/caloboletus-calopus','#cmp-caloboletus-calopus','.cmp-name button']]){
  await page.goto('/#/'+route);await expect(page.locator(selector)).toBeVisible();await loadAllImages(page);
  for(const state of ['default','hover','focus']){
   const control=page.locator(selector).locator(target).first();
   if(state==='hover')await control.hover();if(state==='focus')await control.focus();
   const readings=await auditState(page,{root:selector});
   expect(readings.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio}))).toEqual([]);
  }
 }
 await context.close();
});
