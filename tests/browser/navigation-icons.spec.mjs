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
