import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {preparePage,auditState} from '../../tools/visual-audit.mjs';
async function start(browser,width=390,theme='dark',offline=false){
 const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await preparePage(c,{theme}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const js=readFileSync('node_modules/leaflet/dist/leaflet.js','utf8');
 await p.route('**/leaflet.min.js',r=>r.fulfill({contentType:'text/javascript',body:js+'\n;const mapInit=L.map;L.map=(...args)=>(window.auditMap=mapInit(...args));'}));
 if(offline)await p.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await p.goto('/#/mappa');await expect(p.locator('#map-results')).toBeVisible();await expect(p.locator('#map-results [data-map-zone]').first()).toBeAttached();await expect(p.locator('#refresh')).toHaveAttribute('aria-busy','false');
 if(!offline){await expect(p.locator('#map .zone-label:not(:has(.pc))')).toHaveCount(0);await expect(p.locator('#map-results [data-map-zone]:not(:has(.pc))')).toHaveCount(0);await expect(p.locator('#map-weather-status')).toBeHidden();}
 return {c,p,errors};
}
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test(`mappa utile e compatta: ${width}px ${theme}`,async({browser})=>{
 const {c,p,errors}=await start(browser,width,theme);
 expect(await p.locator('.map-top').evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(85);
 await expect(p.locator('#map-filters > button')).toHaveCount(2);
 await p.locator('#map-filters [data-days]').click();await expect(p.locator('#map-days [data-day-offset]')).toHaveCount(8);
 await expect(p.locator('#map-days .pc,#map-days .d-weather')).toHaveCount(0);
 await p.locator('#map-days [data-day-offset="1"]').click();await expect(p.locator('#map-days')).toBeHidden();await expect(p.locator('#map-filters [data-days]')).toContainText('Domani');
 await p.locator('#map-filters [data-days]').click();await p.locator('#map-days [data-day-offset="1"]').click();await expect(p.locator('#map-days')).toBeHidden();await expect(p.locator('#map-filters [data-days]')).toHaveAttribute('aria-expanded','false');
 await p.locator('#map-results > summary').click();const first=p.locator('[data-map-zone]').first(),name=await first.locator('.map-result-name').innerText();await first.click();
 await expect(p.locator('#map-sheet')).toBeVisible();await expect(p.locator('#map-sheet .sheet-title')).toContainText(name);
 await expect(p.locator('#map-results')).toBeHidden();await p.locator('#map-sheet .sheet-close').click();await expect(p.locator('#map-results')).toBeVisible();
 await p.locator('#map-filters [data-more]').click();const dlg=p.locator('#full-filters');await expect(dlg.locator('.map-filter-section')).toHaveCount(2);
 await expect(dlg.locator('.map-filter-section[open]')).toHaveCount(0);await dlg.locator('.map-filter-section').first().locator(':scope > summary').click();await dlg.locator('[data-group="porcini"]').click();await expect(dlg.locator('.map-filter-section').first()).toHaveAttribute('open','');
 await dlg.locator('[data-close]').last().click();await expect(p.locator('#map-filters [data-more]')).toBeFocused();
 const layers=p.locator('.mapctl [data-act="layers"]').first();await layers.click();await expect(p.locator('.mapctl-panel .legend-box')).toBeVisible();await p.locator('.mapctl-x').click();
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
 expect(errors).toEqual([]);await c.close();
});
test('preferenze leggibili nell’elenco, senza cambiare indice né posizione della carta',async({browser})=>{
 const {c,p,errors}=await start(browser);
 const read=()=>p.locator('[data-map-zone]').evaluateAll(rows=>rows.map(r=>({id:r.dataset.mapZone,index:r.querySelector('.pc')?.textContent})));
 const before=await read(),camera=await p.evaluate(()=>auditMap.getCenter());
 await p.locator('#map-filters [data-more]').click();await p.locator('#full-filters [data-pref="distancePenalty"]').click();await p.locator('#full-filters [data-close]').last().click();
 await expect.poll(read).not.toEqual(before);const after=await read();expect(new Map(after.map(r=>[r.id,r.index]))).toEqual(new Map(before.map(r=>[r.id,r.index])));expect(await p.evaluate(()=>auditMap.getCenter())).toEqual(camera);
 await p.locator('#map-results > summary').click();await expect(p.locator('[data-map-order]')).toContainText('vicino a me');
 expect(errors).toEqual([]);await c.close();
});
test('difficoltà e lunghezza restringono le zone anche senza interesse Sentieri',async({browser})=>{
 const {c,p,errors}=await start(browser);const before=await p.locator('[data-map-zone]').count();
 await p.locator('#map-filters [data-more]').click();const section=p.locator('.map-filter-section').filter({hasText:'Tipo di sentiero'});await section.locator(':scope > summary').click();await section.locator('[data-pref="easyTrails"]').click();await section.locator('[data-pref="shortTrails"]').click();await p.locator('#full-filters [data-close]').last().click();
 await expect.poll(()=>p.locator('[data-map-zone]').count()).toBeLessThan(before);for(const text of await p.locator('.map-result-meta').allTextContents()){expect(text).toContain('T ·');const km=Number(text.match(/· ([\d,]+) km/)?.[1].replace(',','.'));expect(km).toBeLessThanOrEqual(5);}
 expect(errors).toEqual([]);await c.close();
});
test('spostarsi fuori copertura distingue area vuota da filtri senza risultati',async({browser})=>{
 const {c,p,errors}=await start(browser);await p.evaluate(()=>{auditMap.setView([0,0],10,{animate:false});});
 await expect(p.locator('[data-map-count]')).toHaveText('0 zone nell’area');await p.locator('#map-results > summary').click();await expect(p.locator('[data-map-empty]')).toContainText('Sposta la carta');await p.locator('[data-map-fit]').click();await expect(p.locator('[data-map-zone]').first()).toBeVisible();
 expect(errors).toEqual([]);await c.close();
});
test('senza meteo la mappa resta esplorabile, senza indici inventati',async({browser})=>{
 const {c,p,errors}=await start(browser,390,'light',true);
 await expect(p.locator('#map .zone-label').first()).toBeVisible();await expect(p.locator('#map .pc')).toHaveCount(0);await expect(p.locator('#map-results .pc')).toHaveCount(0);
 await p.locator('#map-results > summary').click();await p.locator('[data-map-zone]').first().click();await expect(p.locator('#map-sheet')).toBeVisible();
 expect(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);expect(errors).toEqual([]);await c.close();
});
for(const theme of ['light','dark'])test(`contrasto e stati interattivi della mappa: ${theme}`,async({browser})=>{
 test.setTimeout(120000);const {c,p}=await start(browser,390,theme);await p.locator('#map-results > summary').click();
 for(const state of ['default','hover','focus']){const button=p.locator('[data-map-zone]').first();if(state==='hover')await button.hover();if(state==='focus')await button.focus();const records=await auditState(p,{root:'#map-results'});expect(records.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold).map(r=>({text:r.text,ratio:r.ratio}))).toEqual([]);}
 const records=await auditState(p,{root:'.map-top'});expect(records.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold)).toEqual([]);await c.close();
});

for(const theme of ['light','dark'])for(const inset of [0,54])test(`barra mappa opaca e safe area protetta: ${theme}, inset ${inset}px`,async({browser})=>{
 const {c,p,errors}=await start(browser,390,theme);
 const session=await c.newCDPSession(p);await session.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:inset,left:0,right:0,bottom:34}});
 const toolbar=p.locator('.map-top');await expect(toolbar).toHaveCSS('backdrop-filter','none');
 const state=await toolbar.evaluate(el=>{
  const style=getComputedStyle(el),shield=getComputedStyle(document.body,'::before'),r=el.getBoundingClientRect();
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.fillStyle=style.backgroundColor;ctx.fillRect(0,0,1,1);
  return {filter:style.getPropertyValue('-webkit-backdrop-filter')||style.backdropFilter,alpha:ctx.getImageData(0,0,1,1).data[3],top:r.top,shieldHeight:parseFloat(shield.height),shieldPosition:shield.position,shieldPointer:shield.pointerEvents};
 });
 expect(state.filter).toBe('none');expect(state.alpha).toBe(255);expect(state.shieldHeight).toBe(inset);expect(state.shieldPosition).toBe('fixed');expect(state.shieldPointer).toBe('none');expect(state.top).toBeGreaterThanOrEqual(inset);
 for(const button of await toolbar.locator('#map-filters > button').all()){
  expect(await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})).toBe(true);
 }
 await toolbar.locator('[data-days]').click();await expect(toolbar).toHaveClass(/days-open/);await expect(toolbar).toHaveCSS('backdrop-filter','none');
 await toolbar.locator('[data-days]').click();await expect(toolbar).not.toHaveClass(/days-open/);
 await p.screenshot({path:`/tmp/fronda-map-safe-${theme}-${inset}.png`});expect(errors).toEqual([]);await c.close();
});
