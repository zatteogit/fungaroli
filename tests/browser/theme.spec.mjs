import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
const labels={light:'Tema chiaro',dark:'Tema scuro',auto:'Tema automatico'};
async function start(browser,{mode='auto',system='light',width=390,blocked=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,colorScheme:system,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await preparePage(context,{theme:mode});
 await page.addInitScript(blocked=>{
  localStorage.setItem('fungaroli:install-later',String(Date.now()));
  if(blocked){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='fungaroli:theme')throw new DOMException('Storage blocked','SecurityError');return set.call(this,k,v);};}
 },blocked);
 await page.goto('/');await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');await expect(page.locator('#theme-btn svg')).toBeVisible();return{context,page,button:page.locator('#theme-btn')};
}
for(const system of ['light','dark'])for(const mode of ['light','dark','auto'])test(`tema: ${mode}, dispositivo ${system}, primo tap cambia aspetto e completa il ciclo`,async({browser})=>{
 const {context,page,button}=await start(browser,{mode,system});
 const visible=mode==='auto'?system:mode,opposite=visible==='light'?'dark':'light';
 for(const next of [opposite,'auto',visible,opposite]){
  await button.tap();await expect(button).toHaveAttribute('aria-label',new RegExp('^'+labels[next]));
  expect(await page.evaluate(()=>document.documentElement.dataset.theme||'auto')).toBe(next);
  expect(await page.evaluate(()=>localStorage.getItem('fungaroli:theme'))).toBe(next);
 }
 await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-label',/^Tema automatico/);await expect(button).toBeFocused();
 await context.close();
});
for(const width of [320,390])test(`tema: area tattile 44px, bordi cliccabili e nessuna sovrapposizione a ${width}px`,async({browser})=>{
 const {context,page,button}=await start(browser,{mode:'light',width});
 const boxes=await page.locator('.appbar-actions .icon-btn').evaluateAll(elements=>elements.filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
 expect(boxes.length).toBeGreaterThanOrEqual(2);
 for(let i=0;i<boxes.length;i++){expect(boxes[i].width).toBeGreaterThanOrEqual(44);expect(boxes[i].height).toBeGreaterThanOrEqual(44);expect(boxes[i].right).toBeLessThanOrEqual(width);if(i)expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i-1].right);}
 const rect=await button.boundingBox();
 for(const [x,y,next]of [[rect.x+rect.width/2,rect.y+3,'dark'],[rect.x+rect.width-3,rect.y+rect.height/2,'auto'],[rect.x+3,rect.y+rect.height/2,'light']]){
  expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.id,{x,y})).toBe('theme-btn');
  await page.touchscreen.tap(x,y);await expect(button).toHaveAttribute('aria-label',new RegExp('^'+labels[next]));
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===320)await page.screenshot({path:'/tmp/fronda-theme-tap-320.png'});
 await context.close();
});
test('tema: cambio del sistema in Auto e storage indisponibile non bloccano il ciclo',async({browser})=>{
 const {context,page,button}=await start(browser,{mode:'auto',system:'light',blocked:true});
 await page.emulateMedia({colorScheme:'dark'});await expect(button).toHaveAttribute('aria-label',/Passa a: tema chiaro/);
 for(const next of ['light','auto','dark']){await button.tap();expect(await page.evaluate(()=>document.documentElement.dataset.theme||'auto')).toBe(next);}
 await context.close();
});
