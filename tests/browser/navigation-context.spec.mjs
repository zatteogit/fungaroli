import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
async function setup(browser,width=390){const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));return{context,page};}
for(const width of [320,390])test(`nota → scheda → Malito: ritorno completo e stato conservato a ${width}px`,async({browser})=>{
 const {context,page}=await setup(browser,width),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/diario/esempio/demo-page-2');const reference=page.locator('.diary-reference');await expect(reference).toBeVisible();await reference.tap();
 const sheet=page.locator('#entity-sheet');await expect(sheet).toBeVisible();const zone=sheet.locator('a[href="#/zona/malito/0"]');await expect(zone).toBeAttached();
 const section=zone.locator('xpath=ancestor::details[1]');await section.locator(':scope > summary').tap();await zone.scrollIntoViewIfNeeded();
 await sheet.evaluate(el=>{window.savedEntityBody=el.querySelector('[data-entity-content]').firstElementChild;window.savedEntityScroll=el.scrollTop;el.addEventListener('pointerdown',event=>{if(event.target.closest('a[href="#/zona/malito/0"]'))window.savedEntityScroll=el.scrollTop;},{capture:true});});
 await zone.tap();await expect(page).toHaveURL(/#\/zona\/malito\/0$/);await expect(sheet).toBeHidden();
 await expect(page.locator('.appbar [data-back]')).toHaveAttribute('aria-label','Indietro: Porcino');
 if(width===320)await page.goBack();else await page.locator('.appbar [data-back]').tap();
 await expect(page).toHaveURL(/#\/diario\/esempio\/demo-page-2$/);await expect(sheet).toBeVisible();
 expect(await sheet.evaluate(el=>el.querySelector('[data-entity-content]').firstElementChild===window.savedEntityBody)).toBe(true);await expect(section).toHaveAttribute('open','');
 expect(await sheet.evaluate(el=>Math.abs(el.scrollTop-window.savedEntityScroll))).toBeLessThan(3);await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 await sheet.locator('[data-entity-back]').tap();await expect(sheet).toBeHidden();await expect(reference).toBeFocused();await expect(page.locator('dialog[open]:modal')).toHaveCount(0);
 await page.goForward();await expect(sheet).toBeVisible();await page.goForward();await expect(page).toHaveURL(/#\/zona\/malito\/0$/);await expect(sheet).toBeHidden();
 expect(errors).toEqual([]);await context.close();
});
test('schede concatenate: Indietro un passo, X ritorna alla pagina di partenza',async({browser})=>{
 const {context,page}=await setup(browser);await page.goto('/#/pianta/cicuta');await page.locator('#plant-detail a[href="#/pianta/finocchietto"]').click();const sheet=page.locator('#entity-sheet');await expect(sheet.locator('#entity-sheet-title')).toContainText('Finocchietto');
 await page.evaluate(async()=>{(await import('/js/entity-sheet.js')).openEntitySheet('#/pianta/ortica');});await expect(sheet.locator('#entity-sheet-title')).toHaveText('Ortica');await page.goBack();await expect(sheet.locator('#entity-sheet-title')).toContainText('Finocchietto');await expect(sheet).toBeVisible();
 await sheet.locator('[data-entity-close]').click();await expect(sheet).toBeHidden();await expect(page).toHaveURL(/#\/pianta\/cicuta$/);await expect(page.locator('dialog[open]:modal')).toHaveCount(0);await context.close();
});
test('link diretto: padre di ripiego; i link tra sezioni conservano il percorso',async({browser})=>{
 const {context,page}=await setup(browser);await page.goto('/#/zona/malito/0');await expect(page.locator('.appbar [data-back]')).toHaveAttribute('aria-label','Indietro: Uscite');await page.locator('.appbar [data-back]').click();await expect(page).toHaveURL(/#\/$/);
 await page.goto('/#/specie/edulis');const zone=page.locator('#species-detail a[href="#/zona/malito/0"]');await expect(zone).toBeAttached();await zone.locator('xpath=ancestor::details[1]').locator(':scope > summary').click();await zone.click();await expect(page.locator('.appbar [data-back]')).toHaveAttribute('aria-label','Indietro: Porcino');await page.locator('.appbar [data-back]').click();await expect(page).toHaveURL(/#\/specie\/edulis$/);await context.close();
});

test('le schede lontane nella cronologia si ricostruiscono senza trattenere tutti i DOM',async({browser})=>{
 const {context,page}=await setup(browser);await page.goto('/#/pianta/cicuta');await expect(page.locator('#plant-detail h1')).toBeVisible();
 await page.evaluate(async()=>{const {openEntitySheet}=await import('/js/entity-sheet.js');openEntitySheet('#/pianta/finocchietto');for(let i=0;i<17;i++)openEntitySheet('#/pianta/ortica');history.go(-17);});
 const sheet=page.locator('#entity-sheet');await expect(sheet.locator('#entity-sheet-title')).toContainText('Finocchietto');await expect(sheet.locator('h1')).toContainText('Finocchietto');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 await sheet.locator('[data-entity-back]').click();await expect(sheet).toBeHidden();await expect(page).toHaveURL(/#\/pianta\/cicuta$/);await context.close();
});

test('Apri come pagina con lo stesso URL conserva un ritorno alla scheda',async({browser})=>{
 const {context,page}=await setup(browser);await page.goto('/#/pianta/cicuta');await expect(page.locator('#plant-detail h1')).toBeVisible();
 await page.evaluate(async()=>{(await import('/js/entity-sheet.js')).openEntitySheet('#/pianta/cicuta');});
 const sheet=page.locator('#entity-sheet');await expect(sheet).toBeVisible();await sheet.locator('[data-entity-page]').click();await expect(sheet).toBeHidden();await expect(page.locator('.appbar [data-back]')).toHaveAttribute('aria-label','Indietro: Cicuta maggiore');
 await page.goBack();await expect(sheet).toBeVisible();await sheet.locator('[data-entity-back]').click();await expect(sheet).toBeHidden();await expect(page).toHaveURL(/#\/pianta\/cicuta$/);await context.close();
});

test('cambiare account invalida i contesti e lascia una chiusura funzionante',async({browser})=>{
 const {context,page}=await setup(browser);await page.goto('/#/pianta/cicuta');await page.locator('#plant-detail a[href="#/pianta/finocchietto"]').click();
 await page.evaluate(()=>{document.dispatchEvent(new CustomEvent('fungaroli:community',{detail:{user:null}}));document.dispatchEvent(new CustomEvent('fungaroli:community',{detail:{user:{id:'navigation-test'}}}));});
 expect(await page.evaluate(()=>history.state?.frondaContext)).toBeUndefined();const sheet=page.locator('#entity-sheet');await sheet.locator('[data-entity-back]').click();await expect(sheet).toBeHidden();await expect(page.locator('dialog[open]:modal')).toHaveCount(0);await context.close();
});
