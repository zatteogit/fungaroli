import {test,expect} from '@playwright/test';
import {preparePage,auditState} from '../../tools/visual-audit.mjs';
const photoPath=new URL('../../assets/species/caesarea-inat2.jpg',import.meta.url).pathname;
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test(`Annota: foto privata, pagina e modifica ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{theme});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/content/v1/snapshot',r=>r.fulfill({status:503,json:{error:'fixture'}}));
 await page.goto('/');await page.locator('.tabbar [data-annotate]').click();const dialog=page.locator('.notebook-dialog[open]');
 await expect(dialog.getByRole('heading',{name:'Annota un ritrovamento'})).toBeVisible();await expect(page.locator('.tabbar [data-open-search]')).toHaveCount(0);await expect(page.locator('.tabbar [data-annotate] .notebook-glyph')).toHaveCount(1);
 await dialog.locator('[data-quick-photo]').setInputFiles(photoPath);await expect(dialog.locator('.quick-photo img')).toBeVisible();
 await expect(dialog.locator('[data-quick-status]')).not.toContainText('Preparo');await page.screenshot({path:`output/playwright/annota-composer-${width}-${theme}.png`});
 expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 if(width===390){const readings=await auditState(page,{root:'.notebook-dialog[open]'});expect(readings.filter(r=>!r.decorative&&!r.disabled&&r.ratio<r.threshold).map(r=>r.text)).toEqual([]);}
 await dialog.getByRole('button',{name:'Salva nel taccuino'}).click();await expect(page).toHaveURL(/#\/diario\/pagina\//);
 await expect(page.locator('.diary-detail-photo.is-personal img')).toBeVisible();await expect(page.locator('.diary-detail')).toContainText('Un fungo da conoscere');await expect(page.locator('.diary-detail')).toContainText('La tua fotografia · privata');
 await expect(page.locator('.diary-detail-photo a')).toHaveCount(0);await page.screenshot({path:`output/playwright/annota-pagina-${width}-${theme}.png`});
 expect(await page.locator('.diary-detail-photo img').evaluate(i=>i.naturalWidth>0&&Math.max(i.naturalWidth,i.naturalHeight)<=1280)).toBe(true);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:diario:v1')));expect(stored[0].photo.key).toContain('fungaroli:diario:v1');expect(stored[0].photo.data).toBeUndefined();expect(stored[0].reference).toBeNull();
 await page.reload();await expect(page.locator('.diary-detail-photo.is-personal img')).toBeVisible();await page.locator('.diary-detail-actions [data-edit-note]').click();await expect(dialog.locator('.quick-photo img')).toBeVisible();
 await dialog.locator('[name="note"]').fill('Un incontro da ricordare.');await dialog.getByRole('button',{name:'Salva modifiche'}).click();await expect(dialog).toHaveCount(0);await expect(page.locator('.diary-prose')).toHaveText('Un incontro da ricordare.');await expect(page.locator('.diary-detail-photo.is-personal img')).toBeVisible();
 await page.locator('.diary-back').click();await expect(page.locator('.diary-card-image')).toContainText('La tua fotografia');
 expect(errors).toEqual([]);await context.close();
});
test('salvataggio rapido senza foto, contesto della scheda e ricerca ancora accessibile',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block'}),page=await preparePage(context);await page.goto('/');await page.locator('.tabbar [data-annotate]').click();const dialog=page.locator('.notebook-dialog[open]');
 await dialog.getByRole('button',{name:'Salva nel taccuino'}).click();await expect(dialog.locator('[data-quick-status]')).toContainText('Aggiungi una foto');
 await dialog.locator('summary').click();await dialog.locator('[name="note"]').fill('Il bosco profuma di pioggia.');await dialog.getByRole('button',{name:'Salva nel taccuino'}).click();await expect(page.locator('.diary-prose')).toHaveText('Il bosco profuma di pioggia.');
 await page.goto('/#/fungo/agaricus-campestris');await page.locator('.tabbar [data-annotate]').click();await expect(dialog.locator('[data-quick-species]')).toHaveValue('Prataiolo');await dialog.locator('[data-quick-close]').click();
 await page.goto('/');await page.evaluate(()=>scrollTo(0,0));await page.locator('.appbar [data-open-search]').click();await expect(page.locator('.search-dlg[open]')).toBeVisible();await context.close();
});
test('archivio foto isolato per profilo, cancellazione e nessuna copia falsa dopo errore',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await preparePage(context);await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {notebookLocalStore}=await import('/js/notebook-photo-store.js');const a=notebookLocalStore('test-owner-a'),b=notebookLocalStore('test-owner-b'),photo={data:'data:image/jpeg;base64,'+btoa('\xff\xd8test\xff\xd9'),width:20,height:20};
  await Promise.all([a.put({id:'parallel-one',photo}),a.put({id:'parallel-two',photo})]);if((await a.list()).length!==2)throw Error('Una foto sovrascrive un’altra nota');await a.remove('parallel-one');await a.remove('parallel-two');
  await a.put({id:'same-entry',photo});await b.put({id:'same-entry',photo:{...photo,width:10}});await a.remove('same-entry');
  const isolated=(await b.list())[0].photo.width===10&&(await a.list()).length===0;
  const set=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Quota');};let failed=false;try{await b.put({id:'another',photo});}catch{failed=true;}finally{Storage.prototype.setItem=set;}
  const intact=(await b.list()).length===1;await b.remove('same-entry');return {isolated,failed,intact};
 });expect(result).toEqual({isolated:true,failed:true,intact:true});await context.close();
});

test('CTA con penna d’oca e ricerca in testata a 320px',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:850},serviceWorkers:'block'}),page=await preparePage(context);await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#legal-loading')).toBeHidden();
 await page.evaluate(()=>scrollTo(0,0));await expect(page.locator('.appbar [data-open-search]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'output/playwright/annota-home-320.png'});await page.locator('.appbar [data-open-search]').click();await expect(page.locator('.search-dlg[open]')).toBeVisible();
 await page.goto('/#/diario');await expect(page.locator('.diary-empty')).toBeVisible();await expect(page.locator('.diary-capture-invite')).toHaveCount(0);
 await expect(page.locator('[data-annotate]:visible')).toHaveCount(1);
 await expect(page.locator('.diary-header-actions [data-new-outing]')).toBeVisible();await expect(page.locator('.diary-header-actions [data-new-note]')).toBeVisible();
 await page.locator('.tabbar [data-annotate]').click();await expect(page.locator('.notebook-dialog[open] h2')).toHaveText('Annota un ritrovamento');await context.close();
});

test('Annota mantiene accessibili gli altri appunti e il racconto dell’uscita',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block'}),page=await preparePage(context);await page.goto('/');await page.locator('.tabbar [data-annotate]').click();await page.locator('[data-quick-more]').click();
 await expect(page.locator('.notebook-dialog[open] [data-note-type="uscita"]')).toBeVisible();await page.locator('[data-note-type="appunto"]').click();await page.locator('[name="date"]').fill('2026-10-20');await page.locator('.notebook-dialog[open] [type="submit"]').click();
 await page.locator('.notebook-dialog[open] [name="title"]').fill('Un pensiero');await page.locator('.notebook-dialog[open] [name="note"]').fill('Il ritorno nel bosco.');await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('.notebook-dialog[open]')).toHaveCount(0);await context.close();
});
