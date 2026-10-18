import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])for(const theme of ['light','dark'])test(`sporata e glossario dei caratteri a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/specie/edulis');const card=page.locator('#species-detail .ts-card-spores');await expect(card.locator('.spore-color-row')).toHaveText(['bruno oliva','bruna']);await expect(card.locator('svg')).toHaveCount(0);
 const heading=card.locator('.glossary-heading'),body=page.locator('#species-detail .ts-card-stem .glossary-link[data-term="anello"]');
 expect(await heading.evaluate(e=>getComputedStyle(e).textDecorationLine)).toBe('none');expect(await body.evaluate(e=>getComputedStyle(e).textDecorationStyle)).toBe('dotted');
 expect((await heading.boundingBox()).height).toBeGreaterThanOrEqual(44);
 await heading.tap();const panel=page.locator('#learning-sheet');await expect(panel).toBeVisible();await expect(panel.locator('h2')).toHaveText('Sporata');await expect(panel).toContainText('Deposito di spore');await panel.locator('[data-learning-close]').click();await expect(heading).toBeFocused();
 await body.tap();await expect(panel.locator('h2')).toHaveText('Anello');await panel.locator('[data-learning-close]').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===390&&theme==='light'){await card.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/fronda-sporata-colori-390.png'});}
 await context.close();
});
test('titolo del carattere dalla scheda modale: un solo pannello e ritorno alla scheda',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));await page.goto('/#/specie/edulis');await expect(page.locator('#species-detail .ts-card-spores')).toBeAttached();
 await page.evaluate(async()=>{(await import('/js/entity-sheet.js')).openEntitySheet('#/specie/edulis');});const sheet=page.locator('#entity-sheet');await sheet.locator('.ts-card-spores .glossary-heading').click();
 await expect(sheet).toBeHidden();await expect(page.locator('dialog[open]:modal')).toHaveCount(1);await page.locator('#learning-sheet [data-modal-flow-back]').click();await expect(sheet).toBeVisible();await expect(page.locator('dialog[open]:modal')).toHaveCount(1);await context.close();
});
