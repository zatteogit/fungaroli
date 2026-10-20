import {test,expect} from '@playwright/test';
import {preparePage,forecast} from '../../tools/visual-audit.mjs';
import {readFileSync} from 'node:fs';
test.setTimeout(process.env.CI ? 120000 : 60000);
async function start(browser,{reducedMotion='no-preference',width=390,legal=true,withPlaces=false}={}){
 const context=await browser.newContext({viewport:{width,height:920},reducedMotion,serviceWorkers:'block'});
 const page=await preparePage(context,{legal});
 await page.route('**/api/content/v1/snapshot',r=>r.fulfill({status:503,json:{error:'fixture'}}));
 if(!withPlaces)await page.route('**/data/media-zones.json',r=>r.fulfill({json:{zones:{}}}));
 return {page,context};
}
async function hoverVideo(page,media){const r=await media.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);}
test('still prima del video: rete ritardata, buffer e loop senza spostare il pannello',async({browser})=>{
 const {page,context}=await start(browser);let release;const gate=new Promise(r=>release=r);let stillFirst=false;
 await page.route('**/assets/video/**/*.mp4',async route=>{stillFirst=await page.locator('#hero .atmosphere-still').evaluate(i=>i.complete&&i.naturalWidth>0);await gate;await route.continue();});
 try{
  await page.goto('/',{waitUntil:'domcontentloaded'});const hero=page.locator('#hero .atmosphere'),video=hero.locator('video');
  await expect(hero).toBeVisible({timeout:60000});await expect.poll(()=>hero.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(page.locator('#refresh')).toHaveAttribute('aria-busy','false');
  await expect(video).toHaveCSS('opacity','0');const before=await page.locator('#hero .cover-body').boundingBox();
  await page.screenshot({path:'output/playwright/atmosphere-still.png'});release();
  await expect(video).toHaveAttribute('data-video-ready','true');await expect(video).toHaveCSS('opacity','1');expect(stillFirst).toBe(true);
  expect(await video.evaluate(v=>v.buffered.end(v.buffered.length-1)-v.currentTime>=2)).toBe(true);
  expect((await page.locator('#hero .cover-body').boundingBox()).y).toBe(before.y);
  await video.evaluate(v=>v.currentTime=7.7);await expect.poll(()=>video.evaluate(v=>v.currentTime<1&&!v.paused)).toBe(true);
  await expect(hero.locator('figcaption')).toHaveCount(0);
 }finally{release();await context.close();}
});
test('un video alla volta, pausa globale, inviti alle guide e taccuino vuoto',async({browser})=>{
 const {page,context}=await start(browser,{width:1280});await page.goto('/');
 await page.locator('#days [data-day-offset="0"]').click();
 await expect(page.locator('#hero .atmosphere')).toBeVisible({timeout:60000});
 const video=page.locator('#hero .atmosphere video');await expect(video).toHaveAttribute('data-video-ready','true');
 await hoverVideo(page,page.locator('#hero .atmosphere'));await page.locator('#hero .atmosphere-toggle').click();await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
 const initialClip=await page.locator('#hero [data-atmosphere]').getAttribute('data-atmosphere');
 await page.locator('#days [data-day-offset="1"]').click();
 await expect(page.locator('#hero [data-atmosphere]')).not.toHaveAttribute('data-atmosphere',initialClip);
 await expect(page.locator('#hero .atmosphere-toggle')).toHaveAccessibleName('Riprendi il video di atmosfera');
 await hoverVideo(page,page.locator('#hero .atmosphere'));await page.locator('#hero .atmosphere-toggle').click();await expect.poll(()=>page.locator('#hero .atmosphere video').evaluate(v=>!v.paused)).toBe(true);
 const invite=page.locator('[data-view="uscite"] .story-photo.atmosphere');await invite.scrollIntoViewIfNeeded();await expect(invite.locator('video')).toHaveAttribute('data-video-ready','true');
 expect(await page.locator('video').evaluateAll(vs=>vs.filter(v=>!v.paused).length)).toBe(1);
 await page.goto('/#/piante');await expect(page.locator('#plant-grid')).toBeVisible();
 expect(await page.locator('#plant-grid [data-atmosphere]').count()).toBe(0);
 await page.goto('/#/diario');const empty=page.locator('.diary-empty [data-atmosphere="ombre-di-foglie"]');await expect(empty).toBeVisible();await empty.scrollIntoViewIfNeeded();await expect(empty.locator('video')).toHaveAttribute('data-video-ready','true');
 await context.close();
});
test('comando video discreto: compare sul video al puntatore e con la tastiera',async({browser})=>{
 const {page,context}=await start(browser,{width:1280});await page.goto('/');
 const hero=page.locator('#hero .atmosphere'),video=hero.locator('video'),button=hero.locator('.atmosphere-toggle');
 await expect(video).toHaveAttribute('data-video-ready','true');
 await page.mouse.move(0,0);await expect(button).toHaveCSS('opacity','0');await expect(button).toHaveCSS('pointer-events','none');
 const box=await hero.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await expect(button).toHaveCSS('opacity','1');await button.click();await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
 await page.mouse.move(0,0);await expect(button).toHaveCSS('opacity','0');
 await page.keyboard.press('Tab');await button.focus();await expect(button).toHaveCSS('opacity','1');await button.press('Enter');await expect.poll(()=>video.evaluate(v=>!v.paused)).toBe(true);
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
 await hoverVideo(page,page.locator('#hero .atmosphere'));await page.locator('#hero .atmosphere-toggle').click();
 const invite=page.locator('[data-view="uscite"] .story-photo.atmosphere');await invite.scrollIntoViewIfNeeded();const button=invite.locator('button');
 await expect(button).toHaveAccessibleName('Riprendi il video di atmosfera');
 const [media,control]=await Promise.all([invite.boundingBox(),button.boundingBox()]);expect(control.x).toBeGreaterThanOrEqual(media.x);expect(control.x+control.width).toBeLessThanOrEqual(media.x+media.width);
 await page.screenshot({path:'output/playwright/atmosphere-guide-320.png'});await context.close();
});

for(const rain of [false,true])test(`Tancia: precedenza al luogo e meteo coerente, pioggia=${rain}`,async({browser})=>{
 const {page,context}=await start(browser,{withPlaces:true});
 const zones=JSON.parse(readFileSync(new URL('../../data/zones.json',import.meta.url),'utf8'));zones.zones=zones.zones.filter(z=>z.id==='tancia');
 await page.route('**/data/zones.json',r=>r.fulfill({json:zones}));
 if(rain)await page.route('**/api/weather/v1/forecast?**',r=>{
  const rows=forecast(r.request().url());for(const row of rows){row.hourly.precipitation.fill(2);row.hourly.precipitation_probability.fill(95);row.hourly.weather_code.fill(61);}
  return r.fulfill({json:rows});
 });
 await page.goto('/');await page.locator('#days [data-day-offset="1"]').click();
 const autumn=[9,10,11].includes(new Date().getMonth()+1),cover=page.locator('#hero [data-cover-kind]');
 if(!rain&&autumn){
  await expect(cover).toHaveAttribute('data-cover-kind','place-video');
  await expect(cover).toHaveAttribute('data-atmosphere','tancia-autunno-asciutto');
  await expect(cover.locator('video')).toHaveAttribute('data-video-ready','true');
 }else{
  await expect(cover).toHaveAttribute('data-cover-kind','place-photo');await expect(cover.locator('video')).toHaveCount(0);
  if(rain)await expect(cover.locator('img')).toHaveAttribute('src',/tancia-.*-pioggia/);
 }
 await page.screenshot({path:`output/playwright/tancia-${rain?'pioggia':'asciutto'}.png`});await context.close();
});
test('Canneto: loop locale verde in estate serena e foto locale sotto la pioggia',async({browser})=>{
 const {page,context}=await start(browser,{withPlaces:true});
 await page.route('**/canneto-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/css/atmosphere.css"></head><body style="margin:16px;--forest:#24513D;--on-photo:white"><style>.atmosphere{aspect-ratio:16/9;min-height:200px}</style><main id="hero"></main></body></html>'}));
 await page.goto('/canneto-fixture');
 await page.evaluate(async()=>{
  const {chooseHomeCover}=await import('/js/home-cover-media.js'),{atmosphere}=await import('/js/atmosphere.js');
  const media=(await(await fetch('/data/media-zones.json')).json()).zones['pnalm-settefrati-canneto'];
  const choice=chooseHomeCover({zone:'pnalm-settefrati-canneto',date:'2026-07-20',icon:'sun',media});
  document.querySelector('#hero').innerHTML=atmosphere(choice.id,{hero:true,kind:choice.kind});
  await import('/js/atmosphere-video.js');
 });
 const cover=page.locator('#hero [data-atmosphere="canneto-verde-sereno"]');await cover.scrollIntoViewIfNeeded();
 await expect(cover).toHaveAttribute('data-cover-kind','place-video');await expect(cover.locator('video')).toHaveAttribute('data-video-ready','true');
 expect(await cover.locator('video').evaluate(v=>v.loop&&v.muted&&v.videoWidth===1280&&Math.abs(v.duration-8)<.1)).toBe(true);
 await page.screenshot({path:'output/playwright/canneto-estate-sereno.png'});
 const wet=await page.evaluate(async()=>{
  const {chooseHomeCover}=await import('/js/home-cover-media.js');const media=(await(await fetch('/data/media-zones.json')).json()).zones['pnalm-settefrati-canneto'];
  return chooseHomeCover({zone:'pnalm-settefrati-canneto',date:'2026-07-20',icon:'rain',media});
 });expect(wet.kind).toBe('place-photo');expect(wet.photo.file).toContain('pnalm-settefrati-canneto');await context.close();
});
