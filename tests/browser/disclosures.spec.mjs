import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const theme of ['light','dark'])test(`glossario: categoria una volta, definizione e fonti aperte (${theme})`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme});await page.goto('/#/glossario');
 const term=page.locator('#glossary .glossary-entry').filter({has:page.getByText('Campanulato',{exact:true})}).first();
 await term.locator(':scope > summary').focus();await page.keyboard.press('Enter');await expect(term).toHaveAttribute('open','');
 await expect(term.locator('summary small')).toHaveText('Piante');await expect(term.locator('.learning-category')).toHaveCount(0);
 await expect(term.locator(':scope > div')).toContainText('campana');await expect(term.locator('.learning-sources')).toContainText('Fonti');
 await term.locator(':scope > summary').press('Enter');await expect(term).not.toHaveAttribute('open','');await context.close();
});

for(const width of [390,1280])for(const theme of ['light','dark'])test(`passeggiata: dati unici e approfondimento progressivo a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme});await page.goto('/#/zona/poggio-cantalice/0');
 const card=page.locator('#detail .walk-focus'),summary=card.locator(':scope > summary');
 await expect(summary.locator('.walk-entrance-list')).toBeVisible();await summary.focus();await summary.press('Enter');
 await expect(summary.locator('.walk-stats')).toBeVisible();await expect(summary.locator('.walk-entrance-list')).toBeHidden();
 await expect(card.locator('.walk-facts dt')).toHaveText(['Itinerario completo']);
 const method=card.locator('.walk-data');await expect(method).not.toHaveAttribute('open','');
 await expect(card.locator(':scope > .sec-body > p').filter({hasText:'Verifica accesso, sosta'})).toBeVisible();
 await method.locator('summary').focus();await page.keyboard.press('Enter');await expect(method).toHaveAttribute('open','');
 await expect(method).toContainText('Il GPX contiene solo il tratto nella zona');await expect(method).toContainText('OpenStreetMap');
 await expect(card).toHaveAttribute('open','');await method.locator('summary').press('Enter');await summary.focus();await summary.press('Enter');
 await expect(summary.locator('.walk-entrance-list')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});
