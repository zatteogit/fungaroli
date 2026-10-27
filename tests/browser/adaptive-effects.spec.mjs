import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280])test(`effetti: carico osservato alleggerisce la resa senza perdere azioni o contenuti a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await preparePage(context,{theme:'dark'});
 try{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/#/specie/nuda');await expect(page.locator('.view:not([hidden]) .phero-title')).toHaveText('Agarico violetto');await expect(page.locator('.ambi.on')).toBeVisible();
  await page.waitForTimeout(1700);await expect(page.locator('html')).toHaveAttribute('data-effects','full');
  const before=await page.locator('.view:not([hidden]) .phero').boundingBox();
  await page.evaluate(()=>new Promise(resolve=>{
   const end=performance.now()+5600;window.__qualityChanges=[];
   const change=e=>__qualityChanges.push(e.detail.quality);document.addEventListener('fronda:effects-change',change);
   const timer=setInterval(()=>{
    if(performance.now()>=end){clearInterval(timer);document.removeEventListener('fronda:effects-change',change);resolve();return;}
    scrollTo(0,200+Math.sin(performance.now()/300)*100);document.dispatchEvent(new Event('scroll'));
    const start=performance.now();while(performance.now()-start<55){/* controlled CPU load */}
   },100);
  }));
  await expect(page.locator('html')).toHaveAttribute('data-effects','minimal');expect(await page.evaluate(()=>__qualityChanges)).toEqual(['reduced','minimal']);await expect(page.locator('.ambi')).toHaveCount(0);
  const after=await page.locator('.view:not([hidden]) .phero').boundingBox();expect(after.height).toBe(before.height);expect(after.width).toBe(before.width);
  if(width<900)expect(await page.locator('.tab-destinations').evaluate(e=>getComputedStyle(e).backdropFilter)).toBe('none');
  await expect(page.locator('.phero-title:visible')).toHaveText('Agarico violetto');await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','false');await page.locator('.tabbar [data-annotate]').click();await expect(page.locator('.notebook-dialog[open] [data-quick-species]')).toHaveValue('Agarico violetto');await page.locator('[data-quick-close]').click();
  // Exercise consumers on recovery; timings/hysteresis are checked by unit traces.
  await page.waitForTimeout(1500); // no pending sampler window from closing the note
  await page.evaluate(()=>{document.documentElement.dataset.effects='reduced';document.dispatchEvent(new CustomEvent('fronda:effects-change',{detail:{quality:'reduced'}}));});
  await expect(page.locator('.ambi.on')).toHaveCount(1);expect(await page.locator('.ambi img').evaluate(e=>getComputedStyle(e).filter)).toContain('blur(28px)');expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('riduci movimento prevale anche dopo il recupero della qualita',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 try{
  await page.goto('/#/specie/nuda');await expect(page.locator('.phero-title:visible')).toBeVisible();
  for(const quality of ['minimal','reduced','full']){
   await page.evaluate(quality=>{document.documentElement.dataset.effects=quality;document.dispatchEvent(new CustomEvent('fronda:effects-change',{detail:{quality}}));},quality);
   expect(await page.evaluate(async()=>{const {canVT}=await import('/js/motion.js');return canVT();})).toBe(false);
  }
 }finally{await context.close();}
});

test('riduci trasparenza prevale sui tre livelli di qualita',async({browser})=>{
 test.skip(browser.browserType().name()!=='chromium','Playwright espone questa preferenza tramite CDP, non in WebKit.');
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block'}),page=await preparePage(context);
 try{
  const session=await context.newCDPSession(page);await session.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
  await page.goto('/#/specie/nuda');await expect(page.locator('.phero-title:visible')).toBeVisible();
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-transparency: reduce)').matches)).toBe(true);
  for(const quality of ['minimal','reduced','full']){
   await page.evaluate(quality=>{document.documentElement.dataset.effects=quality;document.dispatchEvent(new CustomEvent('fronda:effects-change',{detail:{quality}}));},quality);
   await expect(page.locator('.ambi')).toHaveCount(0);expect(await page.locator('.tab-destinations').evaluate(e=>getComputedStyle(e).backdropFilter)).toBe('none');
  }
 }finally{await context.close();}
});

test('video decorativi: still al livello ridotto, pausa dell’utente conservata al recupero',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'}),page=await preparePage(context);
 try{
  await page.route('**/api/content/v1/snapshot',r=>r.fulfill({status:503,json:{error:'fixture'}}));
  await page.route('**/data/media-zones.json',r=>r.fulfill({json:{zones:{}}}));
  await page.goto('/');const media=page.locator('#hero .atmosphere'),video=media.locator('video');await expect(video).toHaveAttribute('data-video-ready','true');
  const before=await media.boundingBox();
  const quality=async value=>page.evaluate(value=>{document.documentElement.dataset.effects=value;document.dispatchEvent(new CustomEvent('fronda:effects-change',{detail:{quality:value}}));},value);
  await quality('reduced');await expect.poll(()=>video.evaluate(e=>e.paused)).toBe(true);await expect(video).toHaveCSS('opacity','0');await expect(media.locator('img')).toBeVisible();expect((await media.boundingBox()).height).toBe(before.height);
  await quality('full');await expect(video).toHaveAttribute('data-video-ready','true');
  const box=await media.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await media.locator('.atmosphere-toggle').click();await expect.poll(()=>video.evaluate(e=>e.paused)).toBe(true);
  await quality('minimal');await quality('full');await expect.poll(()=>video.evaluate(e=>e.paused)).toBe(true);await expect(media.locator('.atmosphere-toggle')).toHaveAccessibleName('Riprendi il video di atmosfera');
 }finally{await context.close();}
});
