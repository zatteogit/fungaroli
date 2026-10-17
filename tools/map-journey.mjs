import {chromium} from '@playwright/test';
import {preparePage,loadAllImages} from './visual-audit.mjs';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
// Usage: node tools/map-journey.mjs --base http://127.0.0.1:8795 --out /tmp/map-audit --phase after
// Fixture weather is explicit and reproducible; --weather live records actual API failures too.
const arg=(key,fallback)=>{const i=process.argv.indexOf('--'+key);return i<0?fallback:process.argv[i+1];};
const run=promisify(execFile),phase=arg('phase','after'),base=arg('base','http://127.0.0.1:8795'),source=arg('weather','fixture'),folder=arg('out','/tmp/fronda-map-audit'),out=folder+'/'+phase,cache=folder+'/network';await mkdir(out,{recursive:true});await mkdir(cache,{recursive:true});

const network=[],memo=new Map();let active=0;const queue=[];
async function remote(url){
 if(memo.has(url))return memo.get(url);
 const promise=(async()=>{
  if(active>=4)await new Promise(r=>queue.push(r));active++;
  const file=cache+'/'+createHash('sha256').update(url).digest('hex');
  try{try{await stat(file);}catch{await run('curl',['-fLsS','--max-time','35',url,'-o',file],{maxBuffer:2e6});}const bytes=await readFile(file);network.push({url,bytes:bytes.length,ok:true});return bytes;}
  catch(e){network.push({url,ok:false,error:e.message.slice(0,180)});throw e;}
  finally{active--;queue.shift()?.();}
 })();memo.set(url,promise);return promise;
}
const leaflet=readFileSync(new URL('../node_modules/leaflet/dist/leaflet.js',import.meta.url),'utf8')+'\n;const auditMap=L.map;L.map=(...args)=>(window.__mapAudit=auditMap(...args));';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
let previous;try{previous=JSON.parse(await readFile(out+'/states.json','utf8'));}catch{}const records=previous?.records||[],errors=previous?.errors||[];
async function session(width,theme,mode=source){
 const c=await browser.newContext({viewport:{width,height:844},colorScheme:theme,locale:'it-IT',reducedMotion:'reduce',serviceWorkers:'block',hasTouch:width<700});const p=await preparePage(c,{theme});p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/leaflet.min.js',r=>r.fulfill({contentType:'text/javascript',body:leaflet}));
 await p.route(/https:\/\/(?:[abc]\.tile\.opentopomap\.org|tile\.openstreetmap\.org)\//,async r=>{try{await r.fulfill({contentType:'image/png',body:await remote(r.request().url())});}catch{await r.abort();}});
 if(mode==='live')await p.route('**/api/weather/v1/forecast?**',async r=>{try{const u=new URL(r.request().url());await r.fulfill({contentType:'application/json',body:await remote('https://api.open-meteo.com/v1/forecast'+u.search)});}catch{await r.fulfill({status:503,json:{error:'Source unavailable during audit'}});}});
 if(mode==='offline')await p.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'Offline audit'}}));
 await p.goto(base+'/#/mappa');await p.waitForSelector('#map-filters [data-more]');
 await p.waitForFunction(()=>!!window.__mapAudit);await p.waitForTimeout(1500);
 if(mode==='live')await p.waitForFunction(()=>document.querySelectorAll('#map .zone-label .pc').length>0,{timeout:55000}).catch(()=>{});
 async function shot(id,title){
  if(records.some(r=>r.id===id&&r.width===width&&r.theme===theme))return;
  await p.mouse.move(-10,-10);await p.waitForTimeout(400);await loadAllImages(p);
  const data=await p.evaluate(()=>{
   const root=document.querySelector('.view-map'),toolbar=document.querySelector('.map-top'),r=toolbar.getBoundingClientRect(),m=__mapAudit;
   return {prefs:JSON.parse(localStorage.getItem('fungaroli:prefs:v2')||'{}'),day:document.querySelector('[data-days]')?.textContent,labels:[...document.querySelectorAll('#map .zone-label')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()})),toolbar:r.toJSON(),map:document.querySelector('#map').getBoundingClientRect().toJSON(),mapBounds:m.getBounds(),resultIds:[...document.querySelectorAll('[data-map-zone]')].map(e=>e.dataset.mapZone),zoom:m.getZoom(),circles:Object.values(m._layers).filter(l=>l instanceof L.Circle).length,paths:Object.values(m._layers).filter(l=>l instanceof L.Polyline&&!(l instanceof L.Polygon)).length,visibleText:root.innerText,sheetVisible:!document.querySelector('#map-sheet').hidden,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const file=`${String(records.length+1).padStart(2,'0')}-${id}-${width}-${theme}.png`;await p.screenshot({path:out+'/'+file});records.push({id,title,width,theme,mode,file,...data});await writeFile(out+'/states.json',JSON.stringify({phase,records,network,errors},null,2));console.log(phase,id,width,theme,'labels',data.labels.length,'toolbar',Math.round(data.toolbar.height));
 }
 async function interests(ids){
 const advanced=!(await p.locator('#map-filters [data-intent]').count());
 if(advanced)await p.locator('#map-filters [data-more]').click();
 const scope=advanced?'#full-filters':'#map-filters';
 for(const id of ['funghi','piante','passeggiata']){const q=p.locator(`${scope} [data-intent="${id}"]`);if((await q.getAttribute('aria-pressed')==='true')!==ids.includes(id))await q.click();}
 if(advanced)await p.locator('#full-filters [data-close]').last().click();
 }
 async function pref(key){
 const q=p.locator(`#map-filters [data-p="${key}"]`);if(await q.count())await q.click();else{await p.locator('#map-filters [data-more]').click();await p.locator(`#full-filters [data-pref="${key}"]`).click();await p.locator('#full-filters [data-close]').last().click();}
 }

 return {p,c,shot,interests,pref};
}
try{
 const {p,c,shot,interests,pref}=await session(390,'dark');
 await shot('opening','01 · Apertura, funghi');await p.locator('#map-results > summary').click();await shot('results','Elenco nell’area visibile');await p.locator('#map-results > summary').click();
 for(const [key,label]of [['avoidCrowd','Poca gente'],['preferComfort','Accesso comodo'],['distancePenalty','Vicino a casa']]){await pref(key);await shot(key,label+' attivo');await p.locator('#map-results > summary').click();await shot(key+'-results',label+': elenco ordinato');await p.locator('#map-results > summary').click();await pref(key);}
 await p.locator('#map-filters [data-days]').click();await shot('calendar','Calendario aperto');await p.locator('#map-days [data-day-offset="1"]').click();await shot('tomorrow','Domani');
 for(const ids of [['funghi','piante'],['piante'],['piante','passeggiata'],['passeggiata'],[],['funghi','passeggiata'],['funghi','piante','passeggiata']]){await interests(ids);await shot('interest-'+(ids.join('-')||'none'),'Interessi: '+(ids.join(' + ')||'nessuno'));}
 await interests(['funghi']);await p.locator('#map-filters [data-more]').click();await shot('advanced','Filtri avanzati');
 const dlg=p.locator('#full-filters');if(await dlg.locator('.map-filter-section').count())await dlg.locator('.map-filter-section').first().locator(':scope > summary').click();await dlg.locator('[data-group="porcini"]').click();await dlg.locator('[data-close]').last().click();await shot('porcini','Gruppo porcini');
 await p.locator('#map-filters [data-more]').click();if(await dlg.locator('.map-filter-section').filter({hasText:'Tipo di sentiero'}).getAttribute('open')===null)await dlg.locator('.map-filter-section').filter({hasText:'Tipo di sentiero'}).locator(':scope > summary').click();await dlg.locator('[data-pref="easyTrails"]').click();await dlg.locator('[data-close]').last().click();await shot('easy','Solo difficoltà T');
 await p.locator('#map-filters [data-more]').click();if(await dlg.locator('.map-filter-section').filter({hasText:'Tipo di sentiero'}).getAttribute('open')===null)await dlg.locator('.map-filter-section').filter({hasText:'Tipo di sentiero'}).locator(':scope > summary').click();await dlg.locator('[data-pref="shortTrails"]').click();await dlg.locator('[data-close]').last().click();await shot('short','Anche tratto entro 5 km');
 await p.locator('#map-filters [data-more]').click();await dlg.locator('[data-reset]').click();await dlg.locator('[data-close]').last().click();await shot('reset','Azzera i filtri');
 await p.locator('.mapctl [data-act="layers"]').first().click();await shot('layers','Livelli');await p.locator('.mapctl [data-base="1"]').click();await p.locator('.mapctl-panel [data-act="layers"]').click();await shot('street','Carta stradale');
 await p.locator('.mapctl [data-act="layers"]').first().click();await p.locator('.mapctl [data-base="0"]').click();await p.locator('.mapctl-panel [data-act="layers"]').click();
 await p.evaluate(()=>{__mapAudit.setView([42.49,12.915],12,{animate:false});});await shot('zoom','Zoom nei boschi');
 await p.evaluate(()=>{const l=Object.values(__mapAudit._layers).find(l=>l instanceof L.Circle&&l.getRadius()>100&&__mapAudit.getBounds().contains(l.getLatLng()));l?.fire('click',{latlng:L.latLng(0,0)});});await shot('zone','Zona selezionata');
 if(await p.locator('#map-sheet .sheet-close').isVisible())await p.locator('#map-sheet .sheet-close').click();
 await p.evaluate(()=>{__mapAudit.setView([42.4,13.05],10,{animate:false});});if(!await p.locator('.legend-box summary').isVisible())await p.locator('.mapctl [data-act="layers"]').first().click();await p.locator('.legend-box summary').click();await shot('legend','Legenda');await c.close();
 for(const [width,theme]of [[1280,'light'],[320,'light'],[768,'dark']]){const s=await session(width,theme);await s.shot('opening','Apertura');await s.interests(['piante']);await s.shot('plants','Piante');await s.interests(['passeggiata']);await s.shot('trails','Sentieri');await s.c.close();}
 const off=await session(390,'light','offline');await off.shot('offline','Senza meteo');await off.c.close();
}finally{await writeFile(out+'/states.json',JSON.stringify({phase,records,network,errors},null,2));await browser.close();}
