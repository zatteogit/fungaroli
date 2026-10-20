import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
test.setTimeout(process.env.CI ? 120000 : 60000);
async function start(browser,{reducedMotion='no-preference',width=390,legal=true}={}){
 const context=await browser.newContext({viewport:{width,height:920},reducedMotion,serviceWorkers:'block'});
 const page=await preparePage(context,{legal});return {page,context};
}
test('still prima del video: rete ritardata, buffer e loop senza spostare il pannello',async({browser})=>{
 const {page,context}=await start(browser);let release;const gate=new Promise(r=>release=r);let stillFirst=false;
 await page.route('**/assets/video/**/*.mp4',async route=>{stillFirst=await page.locator('#hero .atmosphere-still').evaluate(i=>i.complete&&i.naturalWidth>0);await gate;await route.continue();});
 try{
  await page.goto('/',{waitUntil:'domcontentloaded'});const hero=page.locator('#hero .atmosphere'),video=hero.locator('video');
  await expect(hero).toBeVisible({timeout:60000});await expect.poll(()=>hero.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(video).toHaveCSS('opacity','0');const before=await page.locator('#hero .cover-body').boundingBox();
  await page.screenshot({path:'output/playwright/atmosphere-still.png'});release();
  await expect(video).toHaveAttribute('data-video-ready','true');await expect(video).toHaveCSS('opacity','1');expect(stillFirst).toBe(true);
  expect(await video.evaluate(v=>v.buffered.end(v.buffered.length-1)-v.currentTime>=2)).toBe(true);
  expect((await page.locator('#hero .cover-body').boundingBox()).y).toBe(before.y);
  await video.evaluate(v=>v.currentTime=7.7);await expect.poll(()=>video.evaluate(v=>v.currentTime<1&&!v.paused)).toBe(true);
  await expect(hero.locator('figcaption')).toHaveText('Video di atmosfera');
 }finally{release();await context.close();}
});
test('un video alla volta, pausa globale, inviti alle guide e taccuino vuoto',async({browser})=>{
 const {page,context}=await start(browser,{width:1280});await page.goto('/');
 await expect(page.locator('#hero .atmosphere')).toBeVisible({timeout:60000});
 const video=page.locator('#hero .atmosphere video');await expect(video).toHaveAttribute('data-video-ready','true');
 await page.locator('#hero .atmosphere-toggle').click();await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
 await page.locator('#days').getByRole('tab',{name:/Domani/}).click();
 await expect(page.locator('#hero .atmosphere-toggle')).toHaveAccessibleName('Riprendi il video di atmosfera');
 await page.locator('#hero .atmosphere-toggle').click();await expect.poll(()=>page.locator('#hero .atmosphere video').evaluate(v=>!v.paused)).toBe(true);
 const invite=page.locator('[data-view="uscite"] .story-photo.atmosphere');await invite.scrollIntoViewIfNeeded();await expect(invite.locator('video')).toHaveAttribute('data-video-ready','true');
 expect(await page.locator('video').evaluateAll(vs=>vs.filter(v=>!v.paused).length)).toBe(1);
 await page.goto('/#/piante');await expect(page.locator('#plant-grid')).toBeVisible();
 expect(await page.locator('#plant-grid [data-atmosphere]').count()).toBe(0);
 await page.goto('/#/diario');const empty=page.locator('.diary-empty [data-atmosphere="ombre-di-foglie"]');await expect(empty).toBeVisible();await empty.scrollIntoViewIfNeeded();await expect(empty.locator('video')).toHaveAttribute('data-video-ready','true');
 await context.close();
});
for(const mode of ['reduced','save-data'])test(`solo still e nessun MP4 con ${mode}`,async({browser})=>{
 const {page,context}=await start(browser,{reducedMotion:mode==='reduced'?'reduce':'no-preference'});let requests=0;page.on('request',r=>{if(r.url().endsWith('.mp4'))requests++;});
 if(mode==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator.connection,'saveData',{get:()=>true}));
 await page.goto('/');await expect(page.locator('#hero .atmosphere')).toBeVisible({timeout:60000});await expect.poll(()=>page.locator('#hero .atmosphere-still').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await expect(page.locator('#hero video')).toHaveCSS('opacity','0');expect(requests).toBe(0);await context.close();
});
test('prima dell’avviso obbligatorio non parte alcun video e un errore conserva lo still',async({browser})=>{
 const {page,context}=await start(browser,{legal:false});let requests=0;page.on('request',r=>{if(r.url().endsWith('.mp4'))requests++;});await page.route('**/assets/video/**/*.mp4',r=>r.abort());
 await page.goto('/');await expect(page.locator('#onboarding[open]')).toBeVisible();expect(requests).toBe(0);
 await page.locator('#ob-accept').click();
 await expect.poll(()=>requests).toBeGreaterThan(0);await expect(page.locator('#hero .atmosphere video')).toHaveCSS('opacity','0');await expect(page.locator('#hero .atmosphere-still')).toBeVisible();await expect(page.locator('#hero .atmosphere-toggle')).toBeHidden();
 await context.close();
});
test('copertine responsive e comando compatto negli inviti alle guide',async({browser})=>{
 const {page,context}=await start(browser,{width:320});await page.goto('/');
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:920});await expect(page.locator('#hero .atmosphere')).toBeVisible({timeout:60000});
  await page.screenshot({path:`output/playwright/atmosphere-home-${width}.png`});
  expect(await page.locator('#hero .atmosphere').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})).toBe(true);
 }
 await page.setViewportSize({width:320,height:920});await expect(page.locator('#hero video')).toHaveAttribute('data-video-ready','true');
 await page.locator('#hero .atmosphere-toggle').click();
 const invite=page.locator('[data-view="uscite"] .story-photo.atmosphere');await invite.scrollIntoViewIfNeeded();const button=invite.locator('button');
 await expect(button).toHaveAccessibleName('Riprendi il video di atmosfera');
 const [media,control]=await Promise.all([invite.boundingBox(),button.boundingBox()]);expect(control.x).toBeGreaterThanOrEqual(media.x);expect(control.x+control.width).toBeLessThanOrEqual(media.x+media.width);
 await page.screenshot({path:'output/playwright/atmosphere-guide-320.png'});await context.close();
});
