import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
async function contributorPage(context){const page=await preparePage(context);await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));await page.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'community-filter-fixture',handle:'Contributore di prova'}}}));return page;}
for(const width of [320,1280])test(`community: vuoto reale, filtro condiviso home/mappa e rimozione a ${width}px`,async({browser})=>{
 const c=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block',reducedMotion:'reduce'}),p=await contributorPage(c);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/community/summary',r=>r.fulfill({json:{access:'granted',reports:[],observations:[],totalReports:0,updatedAt:new Date().toISOString()}}));
 await p.goto('/');await expect(p.locator('#hero .cover-link')).toBeVisible();await p.locator('#appbar-home-filters [data-more]:visible,#home-filter-action [data-more]:visible').first().click();const d=p.locator('#full-filters');await expect(d.locator('[data-community-filter]').locator('..')).toContainText('Dati community Fronda');await d.locator('[data-community-filter]').check();await d.locator('[data-close]').last().click();await expect(p.locator('#hero')).toContainText('Dati insufficienti per pubblicare aggregati');await expect(p.locator('#hero .cover-link')).toHaveCount(0);
 await p.goto('/#/mappa');await p.locator('#map-filters [data-more]').click();await expect(d.locator('[data-community-filter]')).toBeChecked();await d.locator('[data-close]').last().click();await expect(p.locator('[data-map-zone]')).toHaveCount(0);await p.locator('#map-results > summary').click();await expect(p.locator('[data-map-empty]')).toContainText('In sviluppo');await p.locator('[data-map-empty] [data-clear-community]').click();await expect(p.locator('[data-map-zone]').first()).toBeVisible();await p.goto('/');await expect(p.locator('#hero .cover-link')).toBeVisible();expect(errors).toEqual([]);await c.close();
});
test('community: contributi botanici filtrano le zone e non modificano l’indice fungino',async({browser})=>{
 const c=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),p=await contributorPage(c);let zone;
 await p.route('**/api/community/summary',r=>r.fulfill({json:{access:'granted',reports:[],observations:zone?[{zoneId:zone,category:'botanica',taxonId:'corbezzolo',observations:1}]:[],totalReports:0,updatedAt:new Date().toISOString()}}));
 await p.goto('/#/mappa');await expect(p.locator('#map .leaflet-map-pane')).toBeAttached();await expect(p.locator('#refresh')).not.toHaveAttribute('aria-busy','true');await expect(p.locator('[data-map-zone]').first()).toBeAttached();const row=p.locator('[data-map-zone]').first();zone=await row.getAttribute('data-map-zone');const index=await row.locator('.pc').textContent();await p.evaluate(()=>document.dispatchEvent(new CustomEvent('fungaroli:refresh-community')));
 await p.locator('#map-filters [data-more]').click();await p.locator('#full-filters [data-community-filter]').check();await p.locator('#full-filters [data-close]').last().click();await expect(p.locator('[data-map-zone]')).toHaveCount(1);await expect(p.locator(`[data-map-zone="${zone}"] .pc`)).toHaveText(index);await p.reload();await expect(p.locator('[data-map-zone]')).toHaveCount(1);await p.goto('/');await expect(p.locator('#hero .cover-link')).toHaveAttribute('href',new RegExp('/zona/'+zone+'/'));await c.close();
});

test('community: osservazioni in ritardo inquadrate al primo accesso, senza annullare lo spostamento della carta',async({browser})=>{
 const c=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),p=await contributorPage(c);
 await c.addInitScript(()=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({communityOnly:true,interests:['funghi']})));
 await p.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await p.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'community-filter-fixture',handle:'Contributore di prova'}}}));
 let release;const gate=new Promise(resolve=>release=resolve);
 await p.route('**/api/community/summary',async r=>{await gate;await r.fulfill({json:{access:'granted',reports:[],observations:[{zoneId:'poggio-cantalice',category:'botanica',taxonId:'corbezzolo',observations:1}],totalReports:0,updatedAt:new Date().toISOString()}});});
 await p.goto('/#/mappa');await expect(p.locator('#map .leaflet-map-pane')).toBeAttached();await expect(p.locator('[data-map-zone]')).toHaveCount(0);
 const response=p.waitForResponse(r=>r.url().endsWith('/api/community/summary'));release();await response;await expect(p.locator('#refresh')).not.toHaveAttribute('aria-busy','true');await expect(p.locator('[data-map-zone="poggio-cantalice"]')).toHaveCount(1);
 const map=p.locator('#map'),rect=await map.boundingBox();await p.mouse.move(rect.x+rect.width*.1,rect.y+rect.height*.5);await p.mouse.down();await p.mouse.move(rect.x+rect.width*.85,rect.y+rect.height*.5,{steps:12});await p.mouse.up();
 await expect(p.locator('[data-map-zone]')).toHaveCount(0);
 const refreshed=p.waitForResponse(r=>r.url().endsWith('/api/community/summary'));await p.evaluate(()=>document.dispatchEvent(new CustomEvent('fungaroli:refresh-community')));await refreshed;
 // Il filtro resta attivo; l'elenco rispetta l'area che l'utente ha appena scelto.
 await expect(p.locator('[data-map-zone]')).toHaveCount(0);await p.locator('#map-results > summary').click();await expect(p.locator('[data-map-fit]')).toBeVisible();await p.locator('[data-map-fit]').click();await expect(p.locator('[data-map-zone="poggio-cantalice"]')).toHaveCount(1);await c.close();
});
