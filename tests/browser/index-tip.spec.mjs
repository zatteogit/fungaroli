import {test,expect} from '@playwright/test';
import {preparePage,auditState} from '../../tools/visual-audit.mjs';
for(const theme of ['light','dark'])test(`indice compatto: hover, focus, Escape e clic senza aprire la scheda (${theme})`,async({browser})=>{
 const c=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),p=await preparePage(c,{theme});
 await p.goto('/#/');const button=p.locator('#hero [data-index-tip]'),tip=p.locator('#index-tip'),url=p.url();
 await expect(button).toBeVisible();await expect(button).toContainText('Condizioni');await expect(button).not.toContainText('Funghi');await expect(button.locator('.fungus-glyph')).toHaveCount(1);
 await button.hover();await expect(tip).toBeVisible();await expect(tip).toContainText('non una garanzia di ritrovamento');
 await tip.hover();await expect(tip).toBeVisible();await p.mouse.move(1,1);await expect(tip).toBeHidden();
 await button.focus();await expect(tip).toBeVisible();await expect(button).toBeFocused();await p.keyboard.press('Escape');await expect(tip).toBeHidden();await expect(button).toBeFocused();
 await button.click();await expect(tip).toBeVisible();expect(p.url()).toBe(url);
 const records=await auditState(p,{root:'#index-tip'});expect(records.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold)).toEqual([]);
 await button.click();await expect(tip).toBeHidden();await expect(button).toHaveAttribute('aria-expanded','false');await c.close();
});
for(const width of [320,390])test(`indice: tap, chiusura esterna e tip nel viewport a ${width}px`,async({browser})=>{
 const c=await browser.newContext({viewport:{width,height:844},hasTouch:true,serviceWorkers:'block'}),p=await preparePage(c);
 await p.goto('/#/');const url=p.url(),button=p.locator('#hero [data-index-tip]');await button.tap();const tip=p.locator('#index-tip');await expect(tip).toBeVisible();expect(p.url()).toBe(url);
 expect(await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})).toBe(true);
 expect(await tip.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 await p.touchscreen.tap(4,300);await expect(tip).toBeHidden();await button.tap();await expect(tip).toBeVisible();await button.tap();await expect(tip).toBeHidden();
 await p.locator('#hero .cover-link').click();await expect(p).toHaveURL(/#\/zona\//);await expect(tip).toBeHidden();await c.close();
});
