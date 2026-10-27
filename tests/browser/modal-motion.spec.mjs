import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280])for(const motion of ['no-preference','reduce'])test(`pannelli: apertura e chiusura ${motion} a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:motion,serviceWorkers:'block'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/mappa');await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');
 await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
 const trigger=page.locator('#map-filters [data-more]'),dialog=page.locator('#full-filters');await expect(trigger).toBeVisible();
 const scroll=await page.evaluate(()=>scrollY);await trigger.click();await expect(dialog).toHaveAttribute('open','');
 if(motion==='no-preference'){
  await expect.poll(()=>dialog.evaluate(el=>el.getAnimations().some(a=>['opacity','translate'].includes(a.transitionProperty)))).toBe(true);
  await expect(dialog).toHaveCSS('opacity','1');await expect(dialog).toHaveCSS('translate','0px');
 }else expect(await dialog.evaluate(el=>el.getAnimations().length)).toBe(0);
 // close() mantiene il suo significato immediato; il top layer conserva solo
 // la rappresentazione visiva per completare l'uscita.
 const closing=await dialog.evaluate(el=>{el.querySelector('[data-close]').click();return {open:el.open,display:getComputedStyle(el).display,animations:el.getAnimations().map(a=>a.transitionProperty)};});
 expect(closing.open).toBe(false);
 // Engines without the overlay property remove the native top layer at close;
 // opening, focus restoration and the reduced-motion path still apply there.
 if(motion==='no-preference'&&await page.evaluate(()=>CSS.supports('overlay','auto'))){expect(closing.display).not.toBe('none');expect(closing.animations).toContain('opacity');}
 await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(scroll);
 await trigger.click();await expect(dialog).toHaveAttribute('open','');await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
 await context.close();
});
