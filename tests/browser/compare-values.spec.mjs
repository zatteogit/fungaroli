import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,768])for(const theme of ['light','dark'])test(`confronto descrittivo: valori distinti dai selettori, senza miniature duplicate a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme});await page.goto('/#/riconosci/confronta/repandum/hydnum-rufescens');
 const slide=page.locator('#cmp-hydnum-rufescens'),row=slide.locator('[data-trait="hymenophore_color"]');
 await slide.getByRole('tab',{name:'A volte simili',exact:true}).click();
 await expect(row.locator('.cmp-k')).toHaveText(['Colore degli aculei','Colore degli aculei']);
 const cells=row.locator('.cmp-cell');await expect(cells.nth(0).locator('.cmp-value-text')).toHaveText(['crema','arancio','bianco','rosa']);await expect(cells.nth(1).locator('.cmp-value-text')).toHaveText(['crema','arancio']);
 for(const cell of await cells.all()){
  const values=cell.locator('.cmp-v');await expect(cell.locator('.cmp-or,.cmp-v-art')).toHaveCount(0);
  await expect(cell.locator('.cmp-color-dot')).toHaveCount(await values.count());
  await expect(cell.locator('.cmp-relation')).toHaveCount(await values.count());
  expect(await values.evaluateAll(els=>els.every(e=>{const s=getComputedStyle(e);return s.borderRadius==='0px'&&s.borderTopWidth==='0px'&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.cursor==='default';}))).toBe(true);
  await expect(cell.locator('.cmp-vals button,.cmp-vals [role="button"],.cmp-vals [aria-pressed],.cmp-vals [tabindex]')).toHaveCount(0);
  for(const control of await cell.locator('.cmp-variant-controls button').all())expect(await control.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});

for(const width of [320,768])for(const theme of ['light','dark'])test(`gruppi del confronto: una sezione, tastiera e scelta conservata a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/#/riconosci/confronta/edulis/tylopilus-felleus');
 const slide=()=>page.locator('.cmp-slide:not([inert])');const tabs=slide().getByRole('tablist',{name:'Caratteri da confrontare'});
 await expect(tabs.getByRole('tab',{selected:true})).toHaveText('Differenti');await expect(slide().locator('.cmp-panel:visible')).toHaveCount(1);expect(await slide().locator('.cmp-legend').isHidden()).toBe(!(await slide().locator('.cmp-panel:visible .cmp-row.part').count()));
 for(const button of await tabs.getByRole('tab').all())expect(await button.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 await tabs.getByRole('tab',{name:'Differenti',exact:true}).focus();await page.keyboard.press('ArrowRight');
 await expect(tabs.getByRole('tab',{name:'A volte simili',exact:true})).toBeFocused();await expect(slide().locator('[data-cmp-panel="part"]')).toBeVisible();await expect(slide().locator('.cmp-legend')).toBeVisible();await expect(slide().locator('.cmp-panel:visible')).toHaveCount(1);
 await page.keyboard.press('End');await expect(tabs.getByRole('tab',{name:'In comune',exact:true})).toBeFocused();await expect(slide().locator('[data-cmp-panel="same"]')).toBeVisible();
 expect(await slide().locator('.cmp-legend').isHidden()).toBe(!(await slide().locator('.cmp-panel:visible .cmp-row.part').count()));
 await page.locator('[data-cmp-step="1"]').click();await expect(slide().getByRole('tab',{name:'In comune',exact:true})).toHaveAttribute('aria-selected','true');await expect(slide().locator('.cmp-panel:visible')).toHaveCount(1);
 await expect(slide().locator('.cmp-verdict')).toBeVisible();await slide().locator('.cmp-sources > summary').click();await expect(slide().locator('.cmp-sources a').first()).toBeVisible();
 const current=slide().getByRole('tab',{name:'In comune',exact:true});await current.focus();await page.keyboard.press('Home');await expect(slide().locator('[data-cmp-panel="diff"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await context.close();
});

// Decisione di Matteo del 24/10: i caratteri con varianti in parte comuni compaiono in tutte le schede pertinenti e
// i selettori dei disegni seguono la scheda (condivise in «A volte simili» e «In comune», di base in «Differenti»).
test('confronto: le schede impostano le varianti dei disegni e non escludono i caratteri con più varianti',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme:'dark'});await page.goto('/#/riconosci/confronta/cibarius/pinophilus');
 const slide=page.locator('#cmp-pinophilus'),pressed=key=>slide.locator(`button[data-cmp-variant="shape"][data-cmp-variant-key="${key}"][aria-pressed="true"]`).first();
 const tab=name=>slide.getByRole('tab',{name,exact:true});
 await expect(slide.locator('[data-cmp-panel="diff"] [data-trait="cap_shape"]')).toBeVisible();
 const base={cibarius:await pressed('cibarius').getAttribute('value'),pinophilus:await pressed('pinophilus').getAttribute('value')};
 await tab('A volte simili').click();await expect(slide.locator('[data-cmp-panel="part"] [data-trait="cap_shape"]')).toBeVisible();
 await expect(pressed('cibarius')).toHaveAttribute('value','convesso');await expect(pressed('pinophilus')).toHaveAttribute('value','convesso');
 await tab('In comune').click();await expect(slide.locator('[data-cmp-panel="same"] [data-trait="cap_shape"]')).toBeVisible();
 await expect(pressed('cibarius')).toHaveAttribute('value','convesso');
 // in «Differenti» tornano i disegni di base, gli unici con i richiami revisionati
 await tab('Differenti').click();await expect(pressed('cibarius')).toHaveAttribute('value',base.cibarius);await expect(pressed('pinophilus')).toHaveAttribute('value',base.pinophilus);
 await context.close();
});
