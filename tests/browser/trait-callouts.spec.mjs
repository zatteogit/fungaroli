import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])for(const theme of ['light','dark'])test(`richiami esterni per anello, volva e reticolo a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/riconosci/confronta/edulis/caesarea');
 const slide=page.locator('#cmp-caesarea');
 await expect(slide.locator('.cmp-callout')).toHaveCount(6);
 for(const field of ['stem_ring','stem_volva','stem_reticulum']){
  const row=slide.locator(`[data-trait="${field}"]`);
  await expect(row.locator('.cmp-callout')).toHaveCount(2);
  await expect(row.locator('.cmp-part-art img')).toHaveCount(2);
  await expect(row.locator('.cmp-callout circle')).toHaveCount(2);
  const gaps=await row.locator('.cmp-cell-miniature:has(.cmp-callout)').evaluateAll(cells=>cells.map(cell=>cell.querySelector('.cmp-vals').getBoundingClientRect().left-cell.querySelector('.cmp-callout').getBoundingClientRect().right));
  expect(gaps).toHaveLength(2);for(const gap of gaps)expect(gap).toBeGreaterThanOrEqual(10);

  expect(await row.locator('.cmp-part-art img').evaluateAll(images=>images.every(img=>/^(none|drop-shadow\(.+\))$/.test(getComputedStyle(img).filter)))).toBe(true);
 }
 await slide.getByRole('tab',{name:'Differenti',exact:true}).click();
 const ring=slide.locator('[data-trait="stem_ring"]');await ring.scrollIntoViewIfNeeded();await ring.screenshot({path:`/tmp/fronda-callout-${width}-${theme}.png`});await expect(ring).toContainText('senza anello');await expect(ring).toContainText('con anello');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Un'altra sagoma può spostare il particolare: niente coordinate ereditate dal file di base.
 await slide.getByRole('tab',{name:'A volte simili',exact:true}).click();
 const cream=slide.locator('[data-cmp-variant="color"][data-cmp-variant-key="edulis"][value="crema"]').first();
 for(const tab of await slide.getByRole('tab').all()){await tab.click();if(await cream.isVisible())break;}
 await cream.click();
 await expect(slide.locator('[data-trait="stem_ring"] [data-cmp-ill-key="edulis"] img')).toHaveAttribute('src',/edulis-gambo-crema\.webp$/);
 await expect(slide.locator('[data-cmp-ill-key="edulis"] .cmp-callout')).toHaveCount(0);
 await expect(slide.locator('[data-cmp-ill-key="caesarea"] .cmp-callout')).toHaveCount(3);
 await context.close();
});
