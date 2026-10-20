import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';
const entries=date=>[
 {id:'layout-leaves',kind:'note',title:'More, foglie e piccoli dettagli',category:'botanica',date,zoneId:'rascino',note:'Le more sono ancora in parte chiare. Tornare qui dopo qualche giorno e guardare anche le foglie.',reference:{href:'#/pianta/rovo',title:'Rovo e more'},observation:{taxonId:'rovo',phases:[{code:'unripe_fruits',status:'present'},{code:'ripe_fruits',status:'present'}],availability:'few'},savedAt:date+'T15:00:00Z'},
 {id:'layout-idea',kind:'note',title:'Il bosco dopo la pioggia',category:'appunto',date,zoneId:null,note:'La luce passa fra i rami e sul sentiero si sente il profumo della terra.\n\nLa prossima volta vorrei fermarmi più a lungo, senza pensare soltanto a dove arrivare.',reference:null,savedAt:date+'T14:00:00Z'},
 {id:'layout-outing',kind:'outing',date,zoneId:'rascino',finds:{'agaricus-campestris':3},searched:['agaricus-campestris'],band:null,note:'Una mattina sull’altopiano. Erba bagnata e aria fresca vicino al lago.',predicted:{},savedAt:date+'T13:00:00Z'},
 {id:'layout-route',kind:'note',category:'percorso',date,zoneId:'rascino',title:'Un giro da rifare',note:'Portare il binocolo e lasciare un po’ di tempo per il ritorno.',reference:{href:'#/zona/rascino/0',title:'Altopiano di Rascino'},savedAt:date+'T12:00:00Z'}
];
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test(`taccuino a pagine con appunti e foto a ${width}px in ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:950});await page.emulateMedia({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'Nessun meteo necessario per il taccuino'}}));await page.route('https://**/*',r=>r.abort());
 await page.addInitScript(({entries,theme})=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:diario:v1',JSON.stringify(entries));localStorage.setItem('fungaroli:theme',theme);},{entries:entries(todayISO()),theme});
 await page.goto('/#/diario');await expect(page.locator('.diary-card')).toHaveCount(4);await expect(page.locator('.diary-card-image')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#notebook-storage-panel')).not.toHaveAttribute('open','');
 await page.locator('#notebook-query').fill('binocolo');await expect(page.locator('.diary-card')).toHaveCount(1);await expect(page.locator('.diary-card')).toContainText('Un giro da rifare');await page.locator('#notebook-query').fill('');await page.locator('[data-notebook-filter="uscita"]').click();await expect(page.locator('.diary-card')).toHaveCount(1);await page.locator('[data-notebook-filter=""]').click();
 await page.locator('[data-journal-id="layout-leaves"] .diary-card-link').click();await expect(page).toHaveURL(/#\/diario\/pagina\/layout-leaves$/);await expect(page.locator('.diary-phase-detail')).toContainText('Frutti immaturi');
 await page.locator('.diary-reference').click();await expect(page.locator('#entity-sheet[open]')).toBeVisible();await page.locator('#entity-sheet[open] [data-entity-close]').click();expect(new URL(page.url()).hash).toBe('#/diario/pagina/layout-leaves');
 await page.locator('.diary-back').click();await expect(page.locator('.diary-card')).toHaveCount(4);await page.locator('[data-new-note]').first().click();await expect(page.locator('.notebook-dialog[open]')).toBeVisible();await page.locator('.notebook-dialog[open] [data-note-close]').first().click();expect(errors).toEqual([]);
});

test('prima pagina vuota e appunto lungo leggibile senza perdere il testo',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'No forecast'}}));await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));await page.goto('/#/diario');await expect(page.locator('.diary-empty')).toBeVisible();await expect(page.locator('.diary-card')).toHaveCount(0);await page.screenshot({path:'/tmp/notebook-pages-empty.png',fullPage:true});await page.locator('[data-new-note]').first().click();const dialog=page.locator('.notebook-dialog[open]'),text='Un ricordo da conservare. '.repeat(35);await dialog.locator('[data-note-type="appunto"]').click();await dialog.locator('[type="submit"]').click();await dialog.locator('[name="title"]').fill('Un appunto lungo');await dialog.locator('[name="note"]').fill(text);await dialog.locator('[type="submit"]').click();await expect(page.locator('.diary-card')).toHaveCount(1);await page.locator('.diary-card-link').click();await expect(page.locator('.diary-prose')).toHaveText(text.trim());await expect(page.locator('[data-edit-note]')).toBeVisible();await page.reload();await expect(page.locator('.diary-prose')).toHaveText(text.trim());
});
test('condividere un appunto: testo completo, annullamento e copia senza pubblicazione',async({page})=>{
 await page.setViewportSize({width:390,height:900});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'test'}}));
 await page.addInitScript(data=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:diario:v1',JSON.stringify(data));Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.sharedNote=payload;throw new DOMException('Cancelled','AbortError');}});},entries(todayISO()));
 await page.goto('/#/diario/pagina/layout-idea');const note=page.locator('[data-journal-id="layout-idea"]'),before=await page.evaluate(()=>localStorage.getItem('fungaroli:diario:v1'));
 await note.locator('[data-share-note]').click();
 expect(await page.evaluate(()=>window.sharedNote.text)).toContain('La prossima volta vorrei fermarmi più a lungo');
 await expect(page.locator('.notebook-share-dialog')).not.toHaveAttribute('open','');
 expect(await page.evaluate(()=>localStorage.getItem('fungaroli:diario:v1'))).toBe(before);
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copiedNote=text}});});
 await note.locator('[data-share-note]').click();const dialog=page.locator('.notebook-share-dialog[open]');await expect(dialog.locator('textarea')).toContainText('Il bosco dopo la pioggia');
 await dialog.locator('[data-copy-note]').click();await expect(dialog.locator('[role="status"]')).toContainText('Appunto copiato');expect(await page.evaluate(()=>window.copiedNote)).toBe(await page.evaluate(()=>window.sharedNote.text));
 await dialog.locator('[data-share-close]').click();await expect(note.locator('[data-share-note]')).toBeFocused();
 expect(await page.evaluate(()=>localStorage.getItem('fungaroli:diario:v1'))).toBe(before);
});
