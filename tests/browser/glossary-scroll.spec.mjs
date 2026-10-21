import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280]) test(`il glossario riparte dall’inizio ma conserva i link ai termini a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context);await page.goto('/#/glossario');
 await expect(page.locator('#glossary .glossary-alphabet')).toBeVisible();
 await page.evaluate(()=>scrollTo(0,900));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(500);
 await page.evaluate(()=>location.hash='#/guide');await expect(page.locator('[data-view="guide-list"]')).toBeVisible();
 await page.goBack();await expect(page.locator('[data-view="glossario"]')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 await page.evaluate(()=>location.hash='#/glossario/volva');
 await expect(page.locator('#glossary-term-volva')).toHaveAttribute('open','');await expect(page.locator('#glossary-term-volva > summary')).toBeInViewport();
 await page.evaluate(()=>location.hash='#/guide');await expect(page.locator('[data-view="guide-list"]')).toBeVisible();
 await page.goBack();await expect(page.locator('#glossary-term-volva > summary')).toBeInViewport();
 await context.close();
});
