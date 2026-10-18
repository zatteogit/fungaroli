import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const motion of ['no-preference','reduce'])test(`varianti: loader, ultima scelta ed errore ${motion}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:motion}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/riconosci/confronta/edulis/caesarea');const slide=page.locator('#cmp-caesarea');
 const cream=slide.locator('[data-cmp-variant="color"][data-cmp-variant-key="edulis"][value="crema"]').first();
 for(const tab of await slide.getByRole('tab').all()){await tab.click();if(await cream.isVisible())break;}
 await expect(cream).toBeVisible();
 const cell=cream.locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," cmp-cell ")][1]'),art=cell.locator('.cmp-part-art'),image=art.locator('img'),original=await image.getAttribute('src');
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/traits/edulis-*-crema.webp',async route=>{await gate;await route.fulfill({contentType:'image/webp',body:readFileSync(new URL(route.request().url()).pathname.slice(1))});});
 await cream.click();await expect(art).toHaveAttribute('aria-busy','true');await expect(image).toHaveAttribute('src',original);
 expect(await art.evaluate(el=>getComputedStyle(el,'::after').content)).not.toBe('none');
 const before=await art.boundingBox(),brown=cell.locator('[data-cmp-variant="color"][value="bruno"]');
 // Il ritorno alla variante già visibile cancella il caricamento precedente.
 await brown.click();await expect(art).not.toHaveAttribute('aria-busy','true');release();
 await page.waitForLoadState('networkidle');await expect(image).toHaveAttribute('src',original);
 // Il raster ora in cache entra comunque con una dissolvenza, senza un'attesa finta.
 await cream.click();await expect(image).toHaveAttribute('src',/edulis-cappello-crema\.webp$/);
 expect(Math.abs((await art.boundingBox()).height-before.height)).toBeLessThan(1);
 if(motion==='no-preference')await expect.poll(()=>art.evaluate(el=>el.getAnimations().length>0)).toBe(true);
 else expect(await art.evaluate(el=>el.getAnimations().length)).toBe(0);
 const loaded=await image.getAttribute('src');
 await page.route('**/assets/traits/edulis-*-crema-emisferico.webp',route=>route.abort());
 const hemisphere=slide.locator('[data-cmp-variant="shape"][data-cmp-variant-key="edulis"][value="emisferico"]').first();
 for(const tab of await slide.getByRole('tab').all()){await tab.click();if(await hemisphere.isVisible())break;}
 await hemisphere.click();await expect(cell.locator('.cmp-variant-status')).toContainText('Disegno non disponibile');await expect(art).not.toHaveAttribute('aria-busy','true');await expect(image).toHaveAttribute('src',loaded);
 await context.close();
});
