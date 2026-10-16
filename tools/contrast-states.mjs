#!/usr/bin/env node
// Contrast checks for actual pointer/keyboard states. Disabled controls are recorded but exempt.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {VIEWS,preparePage,loadAllImages,auditState} from './visual-audit.mjs';
import {collectTextItems,contrastRatio,blend,thresholdFor,AUDIT_CSS} from './legibility.mjs';
const arg=(k,f)=>{const n=process.argv.indexOf('--'+k);return n<0?f:process.argv[n+1];};
const base=arg('base','http://127.0.0.1:8801'),out=arg('out','/tmp/fronda-aa-states');
const widths=arg('widths','390,1280').split(',').map(Number),themes=arg('themes','light,dark').split(',');
const only=arg('views','').split(',').filter(Boolean),excluded=arg('exclude','').split(',').filter(Boolean),records=[],errors=[],skipped=[];
mkdirSync(out,{recursive:true});
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify({widths,themes,records,errors,skipped},null,1));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of widths)for(const theme of themes){
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
 for(const view of VIEWS){
  if((only.length&&!only.includes(view.id))||excluded.includes(view.id))continue;
  const page=await preparePage(context,{theme,legal:view.legal!==false});
  try{
   if(view.before)await view.before(page);
   await page.goto(base+view.path,{waitUntil:'domcontentloaded'});await page.locator(view.wait).first().waitFor({timeout:15000});
   await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:AUDIT_CSS+'\n* { user-select: none !important; }'});if(view.act)await view.act(page);await loadAllImages(page);
   await page.evaluate(()=>{document.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true);document.addEventListener('pointerdown',e=>{if(e.target.closest('select'))e.preventDefault();},true);});
   const controls=await page.evaluate(root=>{
    const scope=document.querySelector(root)||document.body,seen=new Set(),out=[];
    for(const el of scope.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=checkbox],[tabindex="0"]')){
     if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||!el.getClientRects().length||el.closest('.leaflet-overlay-pane'))continue;
     const rect=el.getBoundingClientRect();if(rect.right<=0||rect.left>=innerWidth)continue;
     const s=getComputedStyle(el),sig=[el.tagName,el.className,el.type,el.getAttribute('aria-pressed'),el.getAttribute('aria-selected'),el.getAttribute('aria-current'),el.disabled,s.color,s.backgroundColor,...[...el.querySelectorAll('small,svg,span')].slice(0,6).map(x=>getComputedStyle(x).color)].join('|');
     if(seen.has(sig))continue;seen.add(sig);const id=String(out.length);el.dataset.aaControl=id;
     out.push({id,name:(el.getAttribute('aria-label')||el.title||el.textContent||el.placeholder||el.type||'Controllo').trim().slice(0,100),signature:sig,disabled:!!el.closest(':disabled,[aria-disabled=true]')});
    }return out;
   },view.root||'body');
   for(const control of controls){
    const selector=`[data-aa-control="${control.id}"]`,el=page.locator(selector);
    if(!await el.count())continue;
    if(view.id==='mappa'){await page.mouse.move(0,0);await page.waitForTimeout(400);}
    for(const state of control.disabled?['disabled']:['normal','hover','focus','active']){
     try{
      await page.mouse.move(0,0);
      if(state==='focus'){await page.keyboard.press('Shift');await el.focus();}
      else {await page.evaluate(()=>document.activeElement?.blur());if(state!=='normal')await el.hover({force:true,timeout:5000});}
      if(state==='active')await page.mouse.down();
      await page.evaluate(()=>getSelection()?.removeAllRanges());
      const items=await page.evaluate(collectTextItems,{root:selector});
      for(const item of items.filter(x=>x.method==='pieno'))records.push({view:view.id,width,theme,control:control.name,state,kind:'text',text:item.text,where:item.where,ratio:contrastRatio(blend(item.fg,item.bg),item.bg),threshold:thresholdFor(item.fontSize,item.fontWeight),exempt:control.disabled||item.disabled||item.decorative});
      // Photo/gradient text uses rendered pixels, not a guessed flat background.
      if(items.some(x=>x.method!=='pieno')){
       const measured=await auditState(page,{root:selector});
       for(const item of measured.filter(x=>x.method!=='pieno'))records.push({view:view.id,width,theme,control:control.name,state,kind:'text-photo',text:item.text,where:item.where,ratio:item.ratio,threshold:item.threshold,exempt:control.disabled||item.disabled||item.decorative});
      }
      const cues=await el.evaluate((el,state)=>{
       const parse=v=>{const a=v?.match(/^rgba?\(([^)]+)\)/);if(a){const p=a[1].split(/[\s,/]+/).map(Number);return [p[0],p[1],p[2],p[3]??1];}const b=v?.match(/^color\(srgb\s+([^)]*)\)/);if(b){const p=b[1].split(/[\s/]+/).map(Number);return [p[0]*255,p[1]*255,p[2]*255,p[3]??1];}return null;};
       const bgOf=node=>{const selected=node?.closest?.('.tabbar a[aria-current="page"]');if(selected)return parse(getComputedStyle(selected).getPropertyValue('--select'))?.slice(0,3)||null;const layers=[];for(let p=node;p;p=p.parentElement){const s=getComputedStyle(p);if(s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c)layers.push(c);if(c?.[3]===1)break;}let bg=[255,255,255];for(const c of layers.reverse())bg=bg.map((x,i)=>c[i]*c[3]+x*(1-c[3]));return bg;};
       const cs=getComputedStyle(el),bg=bgOf(el),outer=bgOf(el.parentElement),out=[];
       if(state==='focus'&&parseFloat(cs.outlineWidth)>0&&cs.outlineStyle!=='none'&&outer)out.push({kind:'focus',fg:parse(cs.outlineColor),bg:outer,alternate:/0px 0px 0px 5px/.test(cs.boxShadow)?parse(cs.boxShadow.match(/(?:rgba?\([^)]*\)|color\(srgb[^)]*\))/)?.[0]):null});
       if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)&&!['range','hidden','checkbox','radio','file'].includes(el.type)&&parseFloat(cs.borderTopWidth)>0&&outer)out.push({kind:'field-edge',fg:parse(cs.borderTopColor),bg:outer});
       if(el.matches('.switch-input')&&bg){
        const thumb=getComputedStyle(el,'::before'),edge=parse(thumb.boxShadow.match(/(?:rgba?\([^)]*\)|color\(srgb[^)]*\))/)?.[0]);
        if(edge)out.push({kind:'switch-thumb',fg:edge,bg,alternate:parse(thumb.backgroundColor)});
       }
       for(const svg of el.querySelectorAll('svg')){
        if(svg.closest('a,button,[role=button]')!==el||svg.closest('.id-art,.id-row-art,.cmp-v-art,.ts-art,.ch-stamp,.wx-line,.fo-art,.leaflet-control-attribution'))continue;
        const part=svg.querySelector('path,circle,rect,line,polyline')||svg,s=getComputedStyle(part),fg=parse(s.stroke!=='none'?s.stroke:s.fill);
        const iconBg=bgOf(part);if(iconBg&&fg?.[3]>0){for(let p=part;p;p=p.parentElement)fg[3]*=Number(getComputedStyle(p).opacity);fg[3]*=Number(s.stroke!=='none'?s.strokeOpacity:s.fillOpacity);out.push({kind:'icon',fg,bg:iconBg});}
       }return out;
      },state);
      for(const cue of cues)if(cue.fg)records.push({view:view.id,width,theme,control:control.name,state,kind:cue.kind,ratio:Math.max(contrastRatio(blend(cue.fg,cue.bg),cue.bg),cue.alternate?contrastRatio(blend(cue.alternate,cue.bg),cue.bg):0),threshold:3,exempt:control.disabled});
      if(state==='active'){await page.mouse.move(0,0);await page.mouse.up();}
     }catch(e){await page.mouse.move(0,0);await page.mouse.up();const record={view:view.id,width,theme,control:control.name,state,error:e.message.split('\n')[0]};if(/not visible|outside of the viewport|not attached/.test(e.message))skipped.push(record);else errors.push(record);}
    }
   }
   if(records.some(r=>r.view===view.id&&r.width===width&&r.theme===theme&&!r.exempt&&r.ratio<r.threshold))await page.screenshot({path:resolve(out,`${view.id}-${width}-${theme}.png`)});
   console.log(`${view.id} ${width} ${theme}: ${controls.length} control families; ${records.filter(r=>r.view===view.id&&r.width===width&&r.theme===theme&&!r.exempt&&r.ratio<r.threshold).length} failures`);
  }catch(e){errors.push({view:view.id,width,theme,error:e.message.split('\n')[0]});}
  await page.close();save();
 }
 await context.close();
}
await browser.close();save();
console.log(`${records.length} measurements, ${records.filter(r=>!r.exempt&&r.ratio<r.threshold).length} failures, ${errors.length} errors`);
