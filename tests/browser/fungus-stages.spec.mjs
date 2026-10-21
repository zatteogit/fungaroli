import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {availableGrowthStages} from '../../js/fungus-stages.js';
import {preparePage,loadAllImages,auditState} from '../../tools/visual-audit.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../data/${f}.json`,import.meta.url)));
const taxa=read('species-traits').taxa,icons=read('trait-icons').taxa;

test('every complete species exposes exactly its documented phases and loads every illustration',async({browser})=>{
 test.setTimeout(180000);const c=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),p=await preparePage(c),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const[key,t]of Object.entries(taxa)){
  const stages=availableGrowthStages(t,icons[key]);if(!stages.length)continue;
  await p.goto('/#/fungo/'+key);const root=p.locator('.view:not([hidden]) .growth-traits');
  await expect(root.locator('[data-growth-stage]')).toHaveCount(stages.length+1);
  for(const s of stages){await root.locator(`[data-growth-stage="${s.id}"]`).click();await expect(root.locator('.growth-description')).toHaveText(s.desc);await expect(root.locator('.growth-gallery img')).toHaveCount(s.tiles.length);
   for(const image of await root.locator('.growth-gallery img').all())await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  }
 }
 expect(errors).toEqual([]);await c.close();
});
for(const width of [320,768,1440])for(const theme of ['light','dark'])test(`fasi accessibili, avviso uovo e ritorno alla panoramica: ${width}px ${theme}`,async({browser})=>{
 const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),p=await preparePage(c,{theme});
 await p.goto('/#/specie/caesarea');const root=p.locator('.view:not([hidden]) .growth-traits'),egg=root.locator('[data-growth-stage="uovo"]');await expect(egg).toBeVisible();
 for(const b of await root.locator('.growth-selector button').all())expect(await b.evaluate(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44;})).toBe(true);
 await egg.focus();await p.keyboard.press('Enter');await expect(egg).toBeFocused();await expect(egg).toHaveAttribute('aria-pressed','true');await expect(root.locator('.growth-warning')).toContainText('vietato');await expect(root.locator('img[alt^="Sezione"]')).toBeVisible();
 await loadAllImages(p);const records=await auditState(p,{root:'.view:not([hidden]) .growth-traits'});expect(records.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio}))).toEqual([]);
 const adult=root.locator('[data-growth-stage="adulto"]');await adult.hover();await adult.focus();const controls=await auditState(p,{root:'.view:not([hidden]) .growth-selector'});expect(controls.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold)).toEqual([]);
 await adult.click();await expect(root.locator('.growth-warning')).toHaveCount(0);await expect(root.locator('.growth-gallery img')).toHaveCount(2);
 await root.locator('[data-growth-stage=""]').click();await expect(root.locator('.ts-dot')).not.toHaveCount(0);await expect(root.locator('.growth-gallery')).toHaveCount(0);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await c.close();
});
test('partial or undelivered series do not expose a selector; late icons enhance the open page',async({browser})=>{
 const c=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),p=await preparePage(c);let release;const wait=new Promise(r=>release=r);
 await p.route('**/data/trait-icons.json',async r=>{await wait;const data=read('trait-icons');delete data.taxa['agaricus-arvensis'].stages[Object.keys(data.taxa['agaricus-arvensis'].stages)[0]];delete data.taxa.edulis.stages;await r.fulfill({json:data});});
 await p.goto('/#/specie/caesarea');await expect(p.locator('.view:not([hidden]) .trait-strip')).toBeVisible();await expect(p.locator('.view:not([hidden]) .growth-selector')).toHaveCount(0);release();await expect(p.locator('.view:not([hidden]) .growth-selector')).toBeVisible();
 for(const key of ['agaricus-arvensis','edulis']){await p.goto('/#/fungo/'+key);await expect(p.locator('.view:not([hidden]) .trait-strip')).toBeVisible();await expect(p.locator('.view:not([hidden]) .growth-selector')).toHaveCount(0);}
 await c.close();
});
