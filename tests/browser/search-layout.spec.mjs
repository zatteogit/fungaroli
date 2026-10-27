import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390,768,1280,1720])test(`ricerca: campo, filtri e risultati nella stessa colonna a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<900,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 try{
  await page.addInitScript(()=>localStorage.setItem('fungaroli:search-recent',JSON.stringify(['ape','ovulo'])));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await page.locator('.appbar [data-open-search]').click();
  const dialog=page.locator('.search-dlg[open]'),input=dialog.locator('input');await expect(input).toBeFocused();
  if(width>=900)await expect(page.locator('.search-dlg > .rail-host')).toHaveCount(1);
  const check=async selector=>{
   const geometry=await dialog.evaluate((dlg,selector)=>{
    const field=dlg.querySelector('.search-main').getBoundingClientRect(),scopes=dlg.querySelector('.search-scopes').getBoundingClientRect(),top=dlg.querySelector('.search-top').getBoundingClientRect(),body=dlg.querySelector('.search-res').getBoundingClientRect(),content=dlg.querySelector(selector).getBoundingClientRect();
    return {column:Math.max(Math.abs(scopes.left-top.left),Math.abs(body.left-top.left),Math.abs(scopes.width-top.width),Math.abs(body.width-top.width)),content:Math.abs(field.left-content.left),overflow:dlg.scrollWidth-dlg.clientWidth};
   },selector);
   expect(geometry.column).toBeLessThan(1);expect(geometry.content).toBeLessThan(3);expect(geometry.overflow).toBeLessThan(2);
  };
  await check('.sr-chips');
  await input.fill('Porcino');await expect(dialog.locator('.sr-item').first()).toBeVisible();await check('.sr-group ul');
  const glossary=dialog.locator('[data-scope="termine"]');await glossary.scrollIntoViewIfNeeded();await glossary.click();await expect(glossary).toHaveAttribute('aria-pressed','true');
  await input.fill('habitat');await expect(dialog.locator('#search-res')).not.toBeEmpty();
  await dialog.locator('.search-cancel').click();await expect(dialog).toHaveCount(0);await expect(page.locator('.appbar [data-open-search]')).toBeVisible();
 }finally{await context.close();}
});
