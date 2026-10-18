import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const theme of ['light','dark'])test(`focus in ${theme}: niente anello dopo il tap, focus visibile da tastiera e colore coerente`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));await page.route('**/api/community/session',r=>r.fulfill({json:{user:null}}));
 await page.goto('/#/diario');await page.evaluate(async()=>await(await import('/js/community.js')).communityReady());await page.locator('.profile-entry').tap();
 const close=page.getByRole('button',{name:'Chiudi l’accesso'});await expect(close).toBeFocused();
 expect(await close.evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('none');
 await page.keyboard.press('Tab');const input=page.locator('.auth-dialog [data-handle]');await expect(input).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(close).toBeFocused();
 const style=await close.evaluate(e=>{const probe=document.createElement('span');probe.style.color='var(--focus)';document.body.append(probe);const expected=getComputedStyle(probe).color;probe.remove();const c=getComputedStyle(e);return{expected,color:c.outlineColor,width:parseFloat(c.outlineWidth),style:c.outlineStyle};});
 expect(style.style).toBe('solid');expect(style.width).toBeGreaterThanOrEqual(2);expect(style.color).toBe(style.expected);
 if(theme==='light'){const rgb=style.color.match(/\d+/g).map(Number);expect(rgb[1]).toBeGreaterThan(rgb[2]);}
 await page.keyboard.press('Escape');await expect(close).toBeHidden();await context.close();
});
