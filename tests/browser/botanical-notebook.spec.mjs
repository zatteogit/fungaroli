import {test,expect} from '@playwright/test';
test.use({locale:'it-IT'});
async function start(page,hash='#/piante',width=390){
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/weather/v1/forecast*',r=>r.fulfill({status:503,json:{error:'test'}}));
 await page.route('https://**',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','22026-10-12'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/'+hash);
 await expect(page.locator('#plant-grid [data-plant-results]')).toBeVisible();return errors;
}
test('plants: search, comparison sheets and private simultaneous phenophases on mobile and desktop',async({page})=>{
 const errors=await start(page);await expect(page.locator('.botanical-card')).toHaveCount(54);
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===1280)await page.screenshot({path:'/tmp/fungaroli-plants-desktop.png'});}
 await page.setViewportSize({width:390,height:900});await page.locator('[data-plant-query]').fill('sambuco');await expect(page.locator('.botanical-card')).toHaveCount(2);
 await page.goto('/#/pianta/sambuco');await expect(page.locator('#plant-detail')).toContainText('Frutti crudi o immaturi');
 await page.locator('#plant-detail a[href="#/pianta/ebbio"]').click();const sheet=page.locator('#entity-sheet[open]');await expect(sheet).toContainText('Tutte le parti sono tossiche');expect(new URL(page.url()).hash).toBe('#/pianta/sambuco');await sheet.locator('[data-entity-close]').click();
 await page.locator('#plant-detail [data-note-kind]').click();const form=page.locator('.notebook-dialog[open]');await form.locator('[name="note"]').fill('Alcuni fiori e frutti ancora verdi.');await form.locator('.notebook-context summary').click();await form.locator('[data-phase="open_flowers"]').selectOption('present');await form.locator('[data-phase="unripe_fruits"]').selectOption('present');await form.screenshot({path:'/tmp/fungaroli-botanical-note-mobile.png'});await form.locator('[type="submit"]').click();await expect(form).toHaveCount(0);
 await page.goto('/#/diario');await expect(page.locator('#journal-list')).toContainText('Fiori aperti: presente');await expect(page.locator('#journal-list')).toContainText('Frutti immaturi: presente');await expect(page.locator('#journal-list')).toContainText('0 uscite');await expect(page.locator('#journal-list [data-share-entry]')).toHaveCount(0);
 await page.locator('[data-edit-note]').click();await page.locator('.notebook-dialog[open] [name="note"]').fill('Ritorno fra una settimana.');await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('#journal-list')).toContainText('Ritorno fra una settimana.');
 await page.reload();await expect(page.locator('#journal-list')).toContainText('Ritorno fra una settimana.');
 await page.locator('[data-new-note]').first().click();await page.locator('.notebook-dialog[open] [name="title"]').fill('Idea per il prossimo giro');await page.locator('.notebook-dialog[open] [name="note"]').fill('Portare il binocolo.');await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('#journal-list .notebook-entry')).toHaveCount(2);await page.screenshot({path:'/tmp/fungaroli-notebook-mobile.png'});
 await page.locator('#notebook-query').fill('binocolo');await expect(page.locator('#journal-list .notebook-entry')).toHaveCount(1);await page.locator('[data-del]').click();await page.locator('[data-del]').click();await expect(page.locator('#journal-list')).not.toContainText('Portare il binocolo.');
 await page.goto('/#/riconosci/piante');await expect(page.locator('#field-identify [data-plant-results]')).toBeVisible();await page.locator('#field-identify [data-plant-query]').fill('Foeniculum vulgare');await expect(page.locator('#field-identify .botanical-card')).toHaveCount(1);await page.locator('#field-identify .botanical-details').click();await expect(page.locator('#entity-sheet[open]')).toContainText('Apiaceae comprendono specie mortali');expect(new URL(page.url()).hash).toBe('#/riconosci/piante');expect(errors).toEqual([]);
});

test('botanical layouts, global search and short note form in both themes',async({page})=>{
 const errors=await start(page,'#/piante',1280);
 await page.locator('[data-open-search]').first().click();await page.locator('dialog.search-dlg input').fill('Foeniculum vulgare');await expect(page.locator('dialog.search-dlg')).toContainText('Finocchietto selvatico');await page.locator('dialog.search-dlg .search-cancel').click();await expect(page.locator('dialog.search-dlg[open]')).toHaveCount(0);
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await expect.poll(()=>page.locator('.recognize-modes button').nth(1).evaluate(b=>getComputedStyle(b).color)).toBe(theme==='dark'?'rgb(233, 239, 231)':'rgb(27, 25, 21)');
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const heights=await page.locator('.botanical-card').evaluateAll(cards=>cards.slice(0,2).map(c=>({top:Math.round(c.getBoundingClientRect().top),height:Math.round(c.getBoundingClientRect().height)})));
   if(heights[0].top===heights[1].top)expect(heights[0].height).toBe(heights[1].height);
   if(width===390||width===1280)await page.screenshot({path:`/tmp/fungaroli-plants-${width}-${theme}.png`});
  }
 }
 await page.goto('/#/pianta/cicuta');await expect(page.locator('#plant-detail img').first()).toHaveAttribute('data-image-state','ready');await page.screenshot({path:'/tmp/fungaroli-cicuta-dark-stable.png',fullPage:true});
 await page.locator('#plant-detail a[href="#/pianta/finocchietto"]').click();const sheet=page.locator('#entity-sheet[open]');await sheet.locator('[data-note-kind]').click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(sheet.locator('.app-toast.on')).toContainText('Salvato nel taccuino');await sheet.locator('[data-entity-close]').click();expect(new URL(page.url()).hash).toBe('#/pianta/cicuta');
 await page.goto('/#/pianta/corbezzolo');await page.setViewportSize({width:390,height:900});await page.locator('#plant-detail [data-note-kind]').click();const dialog=page.locator('.notebook-dialog[open]');await expect(dialog.locator('[type="submit"]')).toBeInViewport();await expect(dialog.locator('.notebook-context')).not.toHaveAttribute('open','');await dialog.screenshot({path:'/tmp/fungaroli-note-short-dark.png'});await dialog.locator('[data-note-close]').first().click();
 expect(errors).toEqual([]);
});
