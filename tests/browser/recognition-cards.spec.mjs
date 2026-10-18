import {test,expect} from '@playwright/test';
import {preparePage,auditState} from '../../tools/visual-audit.mjs';
for(const width of [320,1280])for(const theme of ['light','dark'])test(`risultati sintetici e confronto completo nei dettagli: ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(width===1280?'/#/specie':'/#/riconosci');if(width===1280)await page.locator('.view:not([hidden]) [data-open-recognition]').click();
 const selector=width===1280?'.recognition-sheet[open] .recognition-content':'#identify',root=page.locator(selector);await root.locator('[data-mode="all"]').click();await expect(root.locator('.id-card').first()).toBeVisible();
 await expect(root.locator('.id-match-summary')).toHaveCount(0);
 await root.locator('[data-mode="guided"]').click();
 for(let i=0;i<10;i++){
  const option=root.locator('.id-q-big .id-opt[data-k]').first();if(!await option.count())break;await option.click();
 }
 const card=root.locator('.id-card.tox-mortale').filter({has:page.locator('.id-match-different dt').filter({hasText:/[3-9]|1\d/})}).first();await expect(card).toBeVisible();
 await expect(card.locator('.tox').first()).toContainText(/mortale/i);await expect(card.locator('.id-contra,.id-why,.id-fit')).toHaveCount(0);
 const summary=card.locator('.id-match-summary');await expect(summary.locator('dt')).toHaveCount(2);expect((await summary.innerText()).length).toBeLessThan(180);
 const differing=Number((await summary.locator('.id-match-different dt').innerText()).match(/\d+/)[0]);
 const trigger=card.getByRole('button',{name:/^Dettagli di/}),url=page.url();await trigger.focus();await page.keyboard.press('Enter');
 const sheet=page.locator('#entity-sheet[open]'),details=sheet.locator('.id-answer-details');await expect(details).toBeVisible();await expect(details.locator('h4').last()).toHaveText(`Diversi · ${differing}`);await expect(details.locator('ul').last().locator('li')).toHaveCount(differing);await expect(details).toContainText('Hai indicato');expect(page.url()).toBe(url);
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(summary).toBeVisible();
 const records=await auditState(page,{root:selector+' .id-cards'});expect(records.filter(r=>!r.disabled&&!r.decorative&&r.ratio<r.threshold).map(r=>r.text)).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await context.close();
});
