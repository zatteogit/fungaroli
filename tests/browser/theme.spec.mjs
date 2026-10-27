import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
async function start(browser,{mode='auto',system='light',width=390,blocked=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,colorScheme:system,serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme:mode});
 await page.addInitScript(blocked=>{if(blocked){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='fungaroli:theme')throw new DOMException('Storage blocked','SecurityError');return set.call(this,k,v);};}},blocked);
 await page.goto('/#/diario');await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');await page.locator('.notebook-storage summary').click();await expect(page.locator('#theme-select')).toBeVisible();return{context,page,select:page.locator('#theme-select')};
}
for(const system of ['light','dark'])for(const mode of ['light','dark','auto'])test(`tema: scelta esplicita ${mode}, dispositivo ${system}, conservata alla riapertura`,async({browser})=>{
 const {context,page,select}=await start(browser,{mode,system});await expect(select).toHaveValue(mode);
 for(const next of ['dark','light','auto']){await select.selectOption(next);expect(await page.evaluate(()=>document.documentElement.dataset.theme||'auto')).toBe(next);expect(await page.evaluate(()=>localStorage.getItem('fungaroli:theme'))).toBe(next);}
 const reopened=await context.newPage();await reopened.goto('/#/diario');await reopened.locator('.notebook-storage summary').click();await expect(reopened.locator('#theme-select')).toHaveValue('auto');await context.close();
});
for(const width of [320,390])test(`tema: controllo nel Taccuino, 44px e dentro la pagina a ${width}px`,async({browser})=>{
 const {context,page,select}=await start(browser,{mode:'light',width});const box=await select.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);await select.selectOption('dark');await expect(select).toHaveValue('dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});
test('tema: Auto segue il sistema e storage indisponibile conserva la scelta nella sessione',async({browser})=>{
 const {context,page,select}=await start(browser,{mode:'auto',system:'light',blocked:true});await page.emulateMedia({colorScheme:'dark'});await expect(select).toHaveValue('auto');expect(await page.locator('meta[name="theme-color"]').first().getAttribute('content')).toBe('#f7f4ea');await select.selectOption('light');expect(await page.evaluate(()=>document.documentElement.dataset.theme)).toBe('light');await context.close();
});
