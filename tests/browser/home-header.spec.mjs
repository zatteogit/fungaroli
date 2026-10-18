import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390,768])test(`testata home compatta e filtri ancorati durante lo scroll a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:740},serviceWorkers:'block'});
 const page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
 await expect(page.locator('.brand')).toBeVisible();
 await expect(page.locator('#appbar-home-filters')).not.toBeVisible();
 for(const y of [350,900,1600,800]) {
  await page.evaluate(y=>scrollTo(0,y),y);
  await expect(page.locator('html')).toHaveClass(/title-in-bar/);
  await expect(page.locator('html')).not.toHaveClass(/header-away/);
  await expect(page.locator('.appbar-title')).toHaveText('Dove andare');
  await expect(page.locator('.appbar-title')).toBeVisible();
  await expect(page.locator('#appbar-home-filters [data-more]')).toBeVisible();
  const boxes=await page.locator('.appbar').evaluate(el=>{const a=el.getBoundingClientRect(),t=el.querySelector('.appbar-title').getBoundingClientRect(),b=el.querySelector('#appbar-home-filters').getBoundingClientRect();return {top:a.top,titleRight:t.right,buttonLeft:b.left};});
  expect(Math.abs(boxes.top)).toBeLessThan(1);expect(boxes.titleRight).toBeLessThanOrEqual(boxes.buttonLeft);
 }
 const y=await page.evaluate(()=>scrollY);
 await page.locator('#appbar-home-filters [data-more]').click();
 await expect(page.locator('#full-filters')).toBeVisible();
 await page.locator('#full-filters .filter-panel-head [data-close]').click();
 await expect(page.locator('#appbar-home-filters [data-more]')).toBeFocused();
 expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(2);
 await page.evaluate(()=>scrollTo(0,0));
 await expect(page.locator('html')).not.toHaveClass(/title-in-bar/);
 await expect(page.locator('.brand')).toBeVisible();
 await expect(page.locator('#appbar-home-filters')).not.toBeVisible();
 await page.locator('.tabbar [href="#/scopri"]').click();
 await expect(page.locator('.appbar')).toHaveAttribute('data-context','default');
 await expect(page.locator('#appbar-home-filters')).not.toBeVisible();
 await context.close();
});
