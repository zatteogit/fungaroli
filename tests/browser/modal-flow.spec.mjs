import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])test(`scheda → taccuino: un pannello e ritorno alla stessa scheda a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.goto('/#/pianta/cicuta');await page.locator('#plant-detail a[href="#/pianta/finocchietto"]').click();
 const sheet=page.locator('#entity-sheet'),note=page.locator('.notebook-dialog');
 const annotate=sheet.locator('[data-note-kind]');await annotate.scrollIntoViewIfNeeded();
 await sheet.evaluate(el=>{window.originalEntityBody=el.querySelector('[data-entity-content]').firstElementChild;window.originalEntityScroll=el.scrollTop;});
 await annotate.click();await expect(note).toBeVisible();
 await expect(sheet).toBeHidden();await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 await expect(note.locator('.composer-reference')).toContainText('Finocchietto');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await note.locator('[data-modal-flow-back]').click();await expect(sheet).toBeVisible();await expect(note).toBeHidden();
 expect(await sheet.evaluate(el=>el.querySelector('[data-entity-content]').firstElementChild===window.originalEntityBody)).toBe(true);
 expect(await sheet.evaluate(el=>Math.abs(el.scrollTop-window.originalEntityScroll))).toBeLessThan(2);
 await expect(annotate).toBeFocused();await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 await annotate.click();await expect(note).toBeVisible();
 if(width===390){
  await note.locator('[type="submit"]').click();await note.locator('[name="note"]').fill('Prova del pannello unico');
  await expect(note.locator('[data-modal-flow-back]')).toHaveCount(1);
  await note.locator('[type="submit"]').click();await expect(sheet).toBeVisible();await expect(note).toBeHidden();
  await sheet.locator('[data-entity-close]').click();
 }else{
  // La X chiude il percorso; non fa ricomparire la scheda sotto.
  await note.locator('[data-note-close]').click();
 }
 await expect(page.locator('dialog[open]:modal')).toHaveCount(0);await expect(sheet).toBeHidden();
 await expect(page.locator('html')).not.toHaveClass(/modal-scroll-locked|entity-open/);
 expect(new URL(page.url()).hash).toBe('#/pianta/cicuta');expect(errors).toEqual([]);
 await context.close();
});
test('passi conservati: bozza e cleanup once, Escape e navigazione di rotta',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 await page.goto('/#/diario');
 await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');
 await page.evaluate(async()=>{
  const {openModal}=await import('/js/modal-flow.js');window.flowCleanup={a:0,b:0};
  for(const id of ['a','b','c']){
   const d=document.createElement('dialog');d.id='flow-'+id;d.className='community-dialog';d.innerHTML=`<header><h2>Passo ${id}</h2><button aria-label="Chiudi">×</button></header><input aria-label="Bozza ${id}"><button data-next>Avanti</button>`;
   d.querySelector('[aria-label="Chiudi"]').onclick=()=>d.close();document.body.append(d);
   if(id!=='c')d.addEventListener('close',()=>window.flowCleanup[id]++,{once:true});
  }
  document.querySelector('#flow-a [data-next]').onclick=()=>openModal(document.querySelector('#flow-b'));
  document.querySelector('#flow-b [data-next]').onclick=()=>openModal(document.querySelector('#flow-c'));
  openModal(document.querySelector('#flow-a'));
 });
 await page.getByRole('textbox',{name:'Bozza a'}).fill('Prima bozza');await page.locator('#flow-a [data-next]').click();
 await page.getByRole('textbox',{name:'Bozza b'}).fill('Seconda bozza');await page.locator('#flow-b [data-next]').click();
 await expect(page.locator('dialog[open]:modal')).toHaveCount(1);expect(await page.evaluate(()=>window.flowCleanup)).toEqual({a:0,b:0});
 await page.locator('#flow-c [data-modal-flow-back]').click();await expect(page.getByRole('textbox',{name:'Bozza b'})).toHaveValue('Seconda bozza');
 await page.keyboard.press('Escape');await expect(page.getByRole('textbox',{name:'Bozza a'})).toHaveValue('Prima bozza');
 expect(await page.evaluate(()=>window.flowCleanup)).toEqual({a:0,b:1});
 await page.locator('#flow-a [data-next]').click();await expect(page.locator('#flow-b')).toBeVisible();
 // Riaprire un singleton conservato non crea un ciclo A → B → A.
 await page.evaluate(async()=>{const {openModal}=await import('/js/modal-flow.js');openModal(document.querySelector('#flow-a'));});
 await expect(page.getByRole('textbox',{name:'Bozza a'})).toHaveValue('Prima bozza');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 await page.locator('#flow-a [data-next]').click();
 await page.evaluate(()=>location.hash='#/scopri');await expect(page.locator('dialog[open]:modal')).toHaveCount(0);
 expect(await page.evaluate(()=>window.flowCleanup)).toEqual({a:1,b:1});await expect(page.locator('html')).not.toHaveClass(/modal-scroll-locked/);
 await context.close();
});
