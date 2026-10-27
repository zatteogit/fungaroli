import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390,768,1100,1280])test(`navigazione contestuale senza azioni duplicate e senza spostare la pagina: ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await preparePage(context);
 try{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
  await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','true');await expect(page.locator('.appbar .profile-entry')).toBeHidden();await expect(page.locator('.appbar-actions > :visible')).toHaveCount(1);await expect(page.locator('.tabbar a')).toHaveCount(4);
  await page.goto('/#/diario');await expect(page.locator('.diary-header-actions [data-annotate]')).toBeVisible();await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','true');await expect(page.locator('.appbar .profile-entry')).toBeVisible();
  await page.goto('/#/specie/nuda');const inline=page.locator('.view:not([hidden]) .notebook-context-action');await inline.scrollIntoViewIfNeeded();await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','true');
  await page.evaluate(()=>{window.__actionFrames=[];window.__actionUntil=performance.now()+1100;function sample(){const bar=document.querySelector('.tabbar');__actionFrames.push({p:Number(getComputedStyle(bar).getPropertyValue('--nav-action')),y:scrollY});if(performance.now()<__actionUntil)requestAnimationFrame(sample);}scrollTo(0,document.querySelector('.view:not([hidden]) .phero').offsetHeight+220);sample();});
  await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','false');await expect.poll(()=>page.locator('.tabbar').evaluate(e=>Number(getComputedStyle(e).getPropertyValue('--nav-action')))).toBe(1);
  const frames=await page.evaluate(()=>__actionFrames);expect(frames.some(f=>f.p>0&&f.p<1)).toBe(true);expect(Math.max(...frames.map(f=>f.y))-Math.min(...frames.map(f=>f.y))).toBeLessThan(2);
  await page.locator('.tabbar [data-annotate]').click();await expect(page.locator('.notebook-dialog[open] [data-quick-species]')).toHaveValue('Agarico violetto');await page.locator('[data-quick-close]').click();expect(errors).toEqual([]);
 }finally{await context.close();}
});
test('riduci movimento e cambio pagina durante una pressione: nessuna annotazione nel contesto sbagliato',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 try{
  await page.goto('/#/specie/nuda');await expect(page.locator('.view:not([hidden]) .phero')).toBeVisible();await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','false');
  expect(await page.locator('.tabbar').evaluate(e=>getComputedStyle(e).getPropertyValue('--nav-action'))).toBe('1');const box=await page.locator('.tabbar [data-annotate]').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.evaluate(()=>location.hash='#/specie/pinophilus');await expect(page.locator('.view:not([hidden]) .phero-title')).toHaveText('Porcino rosso');await page.mouse.up();await expect(page.locator('.notebook-dialog[open]')).toHaveCount(0);
 }finally{await context.close();}
});
