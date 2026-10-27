import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280])test(`icone persistenti e ferme durante il cambio sezione a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference',serviceWorkers:'block'}),page=await preparePage(context,{theme:'dark'});await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();
 await page.evaluate(()=>{
  window.__navIcons=[...document.querySelectorAll('.tabbar a')].map(a=>a.firstElementChild);window.__iconFailures=[];window.__iconFrames=0;
  function check(){window.__iconFrames++;for(const icon of __navIcons){const s=getComputedStyle(icon),r=icon.getBoundingClientRect();if(!icon.isConnected||r.width<20||r.height<20||s.opacity!=='1'||s.visibility!=='visible'||s.transform!=='none'||icon.getAnimations({subtree:true}).some(a=>a.playState==='running'))__iconFailures.push({connected:icon.isConnected,width:r.width,height:r.height,opacity:s.opacity,transform:s.transform});}window.__iconRaf=requestAnimationFrame(check);}check();
 });
 for(const tab of ['specie','diario','mappa','uscite']){
  await page.locator(`.tabbar [data-tab="${tab}"]`).click();await expect(page.locator(`.tabbar [data-tab="${tab}"]`)).toHaveAttribute('aria-current','page');await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.nav||'')).toBe('');
 }
 const result=await page.evaluate(()=>{cancelAnimationFrame(__iconRaf);return {frames:__iconFrames,failures:__iconFailures,same:__navIcons.every((icon,i)=>document.querySelectorAll('.tabbar a')[i].firstElementChild===icon)};});expect(result.frames).toBeGreaterThan(10);expect(result.failures).toEqual([]);expect(result.same).toBe(true);await context.close();
});

test('testata: ricerca, annotazione e profilo restano separati anche cambiando breakpoint',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await preparePage(context);
 try{
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  for(const width of [390,768,899,900,1024,1199,1200,1279,1280,1440])for(const signedIn of [false,true]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(signedIn=>{const b=document.querySelector('.profile-entry');b.classList.toggle('is-user',signedIn);b.querySelector('[data-profile-label]').textContent=signedIn?'Matteo Alessandro':'Accedi';scrollTo(0,0);},signedIn);
   const overlaps=await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const controls=[...document.querySelectorAll('.appbar button,.appbar .appbar-actions a,.tabbar a,.tabbar button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert],[aria-hidden="true"]');});const out=[];for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i].getBoundingClientRect(),b=controls[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)out.push([controls[i].getAttribute('aria-label'),controls[j].getAttribute('aria-label')]);}return out;});
   expect(overlaps,`${width}px, profilo ${signedIn}`).toEqual([]);
  }
  await page.setViewportSize({width:390,height:900});await page.goto('/#/confronta/edulis/pinophilus');await expect(page.locator('.cmp-pair-nav')).toBeVisible();
  await expect(page.locator('.appbar [data-open-search]')).toBeVisible();await expect(page.locator('.appbar [data-appbar-action]')).toBeVisible();await expect(page.locator('.appbar [data-open-feedback]')).toBeHidden();
 }finally{await context.close();}
});

test('desktop: nomi visibili, gruppo centrato e nessuna collisione',async({browser})=>{
 const context=await browser.newContext({viewport:{width:900,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 try{
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  for(const width of [900,950,1024,1099,1280,1720]){
   await page.setViewportSize({width,height:900});
   for(const [route,ready] of [['/','#hero .cover-link'],['/#/diario','.diary-header-actions'],['/#/specie/nuda','.view:not([hidden]) .phero-title'],['/#/confronta/edulis/pinophilus','.cmp-pair-nav']]){
    await page.goto(route);await expect(page.locator(ready)).toBeVisible();
    if(route.includes('/specie/nuda')){await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await expect(page.locator('.tab-action-slot')).toHaveAttribute('aria-hidden','false');}
    await expect(page.locator('.tabbar')).toHaveAttribute('data-labels','full');
    const layout=await page.evaluate(()=>{
     const controls=[...document.querySelectorAll('.brand,.brand-place,.appbar-actions button,.appbar-actions a,.tabbar a,.tabbar button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert],[aria-hidden="true"]');});
     const overlaps=[];for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i].getBoundingClientRect(),b=controls[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlaps.push([controls[i].getAttribute('aria-label'),controls[j].getAttribute('aria-label')]);}
     const nav=document.querySelector('.tabbar').getBoundingClientRect(),viewport=document.documentElement.clientWidth;
     const brandRight=Math.max(...[...document.querySelectorAll('.brand,.brand-place')].map(e=>e.getBoundingClientRect().right));
     const actionsLeft=document.querySelector('.appbar-actions').getBoundingClientRect().left;
     const ideal=(viewport-nav.width)/2;
     // Exact viewport centre whenever it fits; otherwise the nearest clear edge.
     const expected=Math.max(brandRight+16,Math.min(ideal,actionsLeft-16-nav.width));
     return {widths:[...document.querySelectorAll('.tab-destinations a>span')].map(e=>e.getBoundingClientRect().width),overlaps,centeringError:Math.abs(nav.left-expected)};
    });
    expect(layout.widths.every(w=>w>20),`${width}px ${route}: etichette leggibili`).toBe(true);expect(layout.overlaps,`${width}px ${route}`).toEqual([]);
    expect(layout.centeringError,`${width}px ${route}: centro della finestra o minimo spostamento`).toBeLessThan(1);
   }
  }
  // A large text preference can really exhaust the interval; resizing restores
  // labels without changing destinations or their accessible names.
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await page.setViewportSize({width:900,height:900});
  const large=await page.addStyleTag({content:'@media(min-width:900px){.tabbar .tab-destinations a{font-size:28px;}}'});
  await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await expect(page.locator('.tabbar')).toHaveAttribute('data-labels','compact');
  await expect(page.locator('.tabbar a')).toHaveCount(4);await expect(page.locator('.tabbar a').first()).toHaveAccessibleName('Uscite');
  await page.setViewportSize({width:1440,height:900});await expect(page.locator('.tabbar')).toHaveAttribute('data-labels','full');await large.evaluate(e=>e.remove());
 }finally{await context.close();}
});
