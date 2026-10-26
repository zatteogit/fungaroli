import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])for(const route of ['/#/scopri','/'])test(`titolo sticky stabile, soglia con margine e ritorno a ${width}px ${route}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:740},hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto(route);await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');const heading=page.locator(route==='/'?'#active-filters':'.view:not([hidden]) .view-title');await expect(heading).toBeVisible();await expect(page.locator('.appbar-title')).toHaveText(route==='/'?'Dove andare':'Funghi');await page.evaluate(()=>document.fonts.ready);await page.locator('.view:not([hidden])').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const boundary=await heading.evaluate(h=>h.getBoundingClientRect().bottom+scrollY-document.querySelector('.appbar').offsetHeight);
 const root=page.locator('html'),bar=page.locator('.appbar');
 await page.evaluate(y=>scrollTo(0,y),boundary+8);await expect(root).toHaveClass(/title-in-bar/);
 // Piccole inversioni sul confine non spengono il titolo compatto.
 for(const y of [boundary+2,boundary-4,boundary+7,boundary+3,450,700,680]){
  await page.evaluate(y=>scrollTo(0,y),y);await expect(root).toHaveClass(/title-in-bar/);await expect(root).not.toHaveClass(/header-away/);
  await expect.poll(()=>bar.evaluate(b=>Math.abs(b.getBoundingClientRect().top))).toBeLessThan(1);
 }
 await page.waitForTimeout(700);await expect(root).toHaveClass(/title-in-bar/);await expect(page.locator('.appbar-title')).toBeVisible();
 const transition=await page.locator('.appbar-title').evaluate(el=>({property:getComputedStyle(el).transitionProperty,duration:getComputedStyle(el).transitionDuration,filter:getComputedStyle(el).filter}));
 expect(transition.property).toBe('opacity');expect(parseFloat(transition.duration)).toBeGreaterThanOrEqual(.2);expect(transition.filter).toBe('none');
 await page.setViewportSize({width,height:650});await expect(root).toHaveClass(/title-in-bar/);
 await heading.evaluate(h=>scrollTo(0,Math.max(0,h.getBoundingClientRect().bottom+scrollY-document.querySelector('.appbar').offsetHeight-20)));await expect(root).not.toHaveClass(/title-in-bar/);
 await page.evaluate(()=>scrollTo(0,0));await expect(root).not.toHaveClass(/title-in-bar/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});
