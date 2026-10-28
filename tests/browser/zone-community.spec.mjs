import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
const report={zoneId:'tancia',speciesId:'edulis',reports:6,sightings:4,zeros:2};
for(const variant of ['guest','locked','empty','province','granted','granted-dark'])test(`riepilogo sociale della zona: ${variant}`,async({browser})=>{
 const mode=variant.replace('-dark',''),theme=variant.endsWith('-dark')?'dark':'light';
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill(mode==='guest'?{status:401,json:{error:'Accedi'}}:{json:{user:{id:'zone-social',handle:'Prova'}}}));
 let summary={access:mode==='locked'?'locked':'granted',reports:mode==='granted'?[report,{...report,zoneId:'gennaro-roccagiovine',sightings:99}]:[],observations:mode==='granted'?[{zoneId:'tancia',category:'botanica',taxonId:'corbezzolo',sightings:3,zeros:1}]:[],provinceReports:mode==='province'?[{province:'RI',speciesId:'edulis',sightings:8,zeros:1}]:[],updatedAt:new Date().toISOString()};
 await page.route('**/api/community/summary',r=>r.fulfill({json:summary}));
 await page.route('**/api/community/entries',r=>r.fulfill({json:{entries:[]}}));
 await page.goto('/#/zona/tancia/0');const box=page.locator('#detail .zone-community');
 await expect(box).toBeVisible({timeout:60000});await expect(box.locator('h2')).toContainText('Cosa dicono gli altri su');
 await expect(box).toContainText('Ultimi 7 giorni');await expect(box.locator('a[href="#/diario"]')).toBeVisible();
 if(mode==='guest'){await expect(box.locator('[data-community-account]')).toBeVisible();await expect(box).toContainText('Accedi e condividi');}
 if(mode==='locked'){await expect(box).toContainText('Condividi cosa hai osservato');await expect(box.locator('.zone-community-list')).toHaveCount(0);}
 if(mode==='empty')await expect(box).toContainText('Non ci sono ancora osservazioni sufficienti');
 if(mode==='province'){await expect(box).toContainText('In provincia di Rieti');await expect(box).toContainText('non un dato di');}
 if(mode==='granted'){
  await expect(box).toContainText('4 ritrovamenti dichiarati');await expect(box).toContainText('3 presenze dichiarate');await expect(box).toContainText('Corbezzolo');await expect(box).not.toContainText('99 ritrovamenti');
  await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});await box.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(async()=>{await box.screenshot({path:`output/playwright/social-zone-${width}${theme==='dark'?'-dark':''}.png`});}).toPass();}
  summary={access:'locked',reports:[],observations:[]};await page.evaluate(()=>document.dispatchEvent(new CustomEvent('fungaroli:refresh-community')));
  await expect(box.locator('.zone-community-list')).toHaveCount(0);await expect(box).not.toContainText('4 ritrovamenti');
 }
 await box.locator('.zone-community-method > summary').click();await expect(box.locator('.zone-community-limits')).toBeVisible();await box.locator('[data-home-how-open]').click();await expect(page.locator('#community-help')).toBeVisible();
 expect(errors).toEqual([]);
 await context.close();
});
