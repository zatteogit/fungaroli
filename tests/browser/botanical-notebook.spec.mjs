import {test,expect} from '@playwright/test';
test.use({locale:'it-IT'});
async function start(page,hash='#/piante',width=390){
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/weather/v1/forecast*',r=>r.fulfill({status:503,json:{error:'test'}}));
 await page.route('https://**',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','42026-10-16'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/'+hash);
 await expect(page.locator('#plant-grid [data-plant-results]')).toBeVisible();return errors;
}
test('plants: search, comparison sheets and private simultaneous phenophases on mobile and desktop',async({page})=>{
 const errors=await start(page);await expect(page.locator('#plant-grid .sp-card')).toHaveCount(70);
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===1280)await page.screenshot({path:'/tmp/fungaroli-plants-desktop.png'});}
 await page.setViewportSize({width:390,height:900});await expect(page.locator('#plant-grid input[type="search"]')).toHaveCount(0);await page.keyboard.press('/');const search=page.locator('dialog.search-dlg[open]');await search.locator('input').fill('sambuco');await expect(search.locator('.sr-group > .sr-h').first()).toHaveText('Piante e fiori');await expect(search.locator('.sr-item').filter({hasText:'Sambuco'}).first()).toBeVisible();await page.keyboard.press('Escape');
 await page.goto('/#/pianta/sambuco');await expect(page.locator('#plant-detail')).toContainText('Frutti crudi o immaturi');
 await page.locator('#plant-detail a[href="#/pianta/ebbio"]').click();const sheet=page.locator('#entity-sheet[open]');await expect(sheet).toContainText('Tutte le parti sono tossiche');expect(new URL(page.url()).hash).toBe('#/pianta/sambuco');await sheet.locator('[data-entity-close]').click();
 await page.locator('#plant-detail [data-note-kind]').click();const form=page.locator('.notebook-dialog[open]');await form.locator('[type="submit"]').click();await form.locator('[name="note"]').fill('Alcuni fiori e frutti ancora verdi.');await form.locator('.composer-phases summary').click();await form.locator('[name="phase-open_flowers"]').selectOption('present');await form.locator('[name="phase-unripe_fruits"]').selectOption('present');await form.screenshot({path:'/tmp/fungaroli-botanical-note-mobile.png'});await form.locator('[type="submit"]').click();await expect(form).toHaveCount(0);
 await page.goto('/#/diario');await expect(page.locator('#journal-list')).toContainText('0 uscite');await page.locator('.diary-card-link').first().click();await expect(page.locator('#journal-list')).toContainText('Fiori aperti · presente');await expect(page.locator('#journal-list')).toContainText('Frutti immaturi · presente');await expect(page.locator('#journal-list [data-share-entry]')).toHaveCount(0);
 await page.locator('[data-edit-note]').click();await page.locator('.notebook-dialog[open] [name="note"]').fill('Ritorno fra una settimana.');await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('#journal-list')).toContainText('Ritorno fra una settimana.');
 await page.reload();await expect(page.locator('#journal-list')).toContainText('Ritorno fra una settimana.');
 await page.goto('/#/diario');await page.locator('[data-new-note]').first().click();await page.locator('[data-note-type="appunto"]').click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await page.locator('.notebook-dialog[open] [name="title"]').fill('Idea per il prossimo giro');await page.locator('.notebook-dialog[open] [name="note"]').fill('Portare il binocolo.');await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('#journal-list .diary-card')).toHaveCount(2);await page.screenshot({path:'/tmp/fungaroli-notebook-mobile.png'});
 await page.locator('#notebook-query').fill('binocolo');await expect(page.locator('#journal-list .diary-card')).toHaveCount(1);await page.locator('.diary-card-link').click();await page.locator('[data-del]').click();await page.locator('[data-del]').click();await expect(page.locator('#journal-list')).not.toContainText('Portare il binocolo.');
 await page.goto('/#/riconosci/piante');await expect(page.locator('#field-identify .gk-q')).toBeVisible();
 // percorso guidato: risponde come il finocchietto finché ci sono domande, e la cicuta resta accanto con le differenze
 const traits=await page.evaluate(()=>fetch('data/recognize-plants.json').then(r=>r.json()).then(d=>d.items.finocchietto.traits));
 for(let i=0;i<12;i++){const q=page.locator('#field-identify .gk-q [data-k]').first();if(!await q.count())break;const k=await q.getAttribute('data-k'),v=[].concat(traits[k]??[])[0];await page.locator(v?`#field-identify .gk-q [data-k="${k}"][data-v="${v}"]`:`#field-identify .gk-q [data-skip="${k}"]`).click();}
 await expect(page.locator('#field-identify .gk-results .field-card').first()).toContainText('Finocchietto');
 await expect(page.locator('#field-identify .gk-results')).toContainText('Cicuta');await expect(page.locator('#field-identify .gk-pair')).toContainText('Finocchietto e cicuta');
 await page.locator('#field-identify .gk-results a',{hasText:'Finocchietto'}).click();await expect(page.locator('#entity-sheet[open]')).toContainText('Apiaceae comprendono specie mortali');expect(new URL(page.url()).hash).toBe('#/riconosci/piante');expect(errors).toEqual([]);
});

test('botanical layouts, global search and short note form in both themes',async({page})=>{
 const errors=await start(page,'#/piante',1280);
 await expect(page.locator('.tab-search')).toBeVisible();await page.keyboard.press('Control+k');await page.locator('dialog.search-dlg input').fill('Foeniculum vulgare');await expect(page.locator('dialog.search-dlg')).toContainText('Finocchietto selvatico');await page.locator('dialog.search-dlg .search-cancel').click();await expect(page.locator('dialog.search-dlg[open]')).toHaveCount(0);
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await expect.poll(()=>page.locator('.recognize-modes button').nth(1).evaluate(b=>getComputedStyle(b).color)).toBe(theme==='dark'?'rgb(244, 243, 233)':'rgb(24, 56, 44)');
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const heights=await page.locator('#plant-grid .sp-card').evaluateAll(cards=>cards.slice(0,2).map(c=>({top:Math.round(c.getBoundingClientRect().top),height:Math.round(c.getBoundingClientRect().height)})));
   if(heights[0].top===heights[1].top)expect(heights[0].height).toBe(heights[1].height);
   if(width===390||width===1280)await page.screenshot({path:`/tmp/fungaroli-plants-${width}-${theme}.png`});
  }
 }
 await page.goto('/#/pianta/cicuta');await expect(page.locator('#plant-detail img').first()).toHaveAttribute('data-image-state','ready');await page.screenshot({path:'/tmp/fungaroli-cicuta-dark-stable.png',fullPage:true});
 await page.locator('#plant-detail a[href="#/pianta/finocchietto"]').click();const sheet=page.locator('#entity-sheet[open]');await sheet.locator('[data-note-kind]').click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(sheet.locator('.app-toast.on')).toContainText('Salvato nel taccuino');await sheet.locator('[data-entity-close]').click();expect(new URL(page.url()).hash).toBe('#/pianta/cicuta');
 await page.goto('/#/pianta/corbezzolo');await page.setViewportSize({width:390,height:900});await page.locator('#plant-detail [data-note-kind]').click();const dialog=page.locator('.notebook-dialog[open]');await expect(dialog.locator('[type="submit"]')).toBeInViewport();await expect(dialog.locator('.notebook-context')).not.toHaveAttribute('open','');await dialog.screenshot({path:'/tmp/fungaroli-note-short-dark.png'});await dialog.locator('[data-note-close]').first().click();
 expect(errors).toEqual([]);
});
test('i mesi abbreviati non diventano termini del glossario («ago» di agosto non è un ago)',async({page})=>{
 const errors=await start(page);await page.goto('/#/pianta/ortica');
 await page.locator('#plant-detail .character-details > summary').click();
 const view=page.locator('.view:not([hidden])');await expect(view.locator('#plant-detail .keys')).toBeVisible();await expect(view).toContainText('ago');
 await expect(view.locator('a.glossary-link').filter({hasText:/^ago$/i})).toHaveCount(0);
 expect(errors).toEqual([]);
});
// Collegamenti automatici solo nelle zone descrittive dichiarate (data-glossary) e solo con voci del loro ambito.
const outsideZones=view=>view.locator('a.glossary-link').evaluateAll(links=>links.filter(a=>!a.closest('[data-glossary],.trait-strip')).map(a=>a.textContent));
test('glossario: parole collegate nelle descrizioni, mai in mesi, fonti e crediti, e solo nel loro ambito',async({page})=>{
 const errors=await start(page);
 // scheda albero: «Aghi» nella descrizione è una voce del glossario
 await page.goto('/#/albero/pino%20nero');const tree=page.locator('#tree-detail');await tree.locator('.character-details > summary').click();await expect(tree.locator('.keys')).toBeVisible();
 await expect(tree.locator('.keys a.glossary-link[data-term="aghi"]')).toHaveCount(1);
 await expect(tree.locator('[data-tree-traits] .trait-strip')).toBeVisible();
 expect(await outsideZones(tree)).toEqual([]);
 // fonti e crediti delle foto, aperti: nessun termine collegato
 await tree.locator('details.sec summary',{hasText:'Fonti e crediti delle foto'}).click();
 await expect(tree.locator('.src-rows a.glossary-link, .src-h a.glossary-link')).toHaveCount(0);
 // scheda pianta: mesi della fioritura, tutela e fonti senza termini; gli aculei del rovo sono quelli botanici, non quelli dei funghi
 await page.goto('/#/pianta/rovo');const plant=page.locator('#plant-detail');await plant.locator('.character-details > summary').click();await expect(plant.locator('.keys')).toBeVisible();
 await expect(plant.locator('.keys a.glossary-link[data-term="aculei-piante"]')).toHaveCount(1);
 await expect(plant.locator('a.glossary-link[data-term="aculei"]')).toHaveCount(0);
 await expect(plant.locator('.sci-params div',{hasText:'Fioritura'}).locator('a.glossary-link')).toHaveCount(0);
 for(const term of ['lamelle','pori','gambo','cappello','volva'])await expect(plant.locator(`a.glossary-link[data-term="${term}"]`)).toHaveCount(0);
 expect(await outsideZones(plant)).toEqual([]);
 expect(errors).toEqual([]);
});
for(const width of [390,1280])test(`filtri aggiuntivi delle piante nel pannello a ${width}px`,async({page})=>{
 const errors=await start(page,'#/piante',width),opener=page.locator('[data-open-plant-filters]'),panel=page.locator('.plant-filter-panel');
 await expect(panel).not.toHaveAttribute('open','');await opener.click();await expect(panel).toBeVisible();
 await panel.locator('[data-plant-filter="lookalikes"]').click();await expect(opener.locator('[data-filter-n]')).toContainText('1 attivo');
 await expect(panel.locator('[data-plant-filter-results]')).toContainText(/Mostra \d+ schede?/);
 await panel.locator('[data-plant-filter-results]').click();await expect(panel).not.toHaveAttribute('open','');await expect(opener).toBeFocused();
 await opener.click();await expect(panel.locator('[data-plant-filter="lookalikes"]')).toHaveAttribute('aria-pressed','true');
 await panel.locator('[data-reset-plant-filters]').click();await expect(opener.locator('[data-filter-n]')).toBeEmpty();await expect(page.locator('[data-plant-results] .sp-card')).toHaveCount(70);
 await page.keyboard.press('Escape');await expect(opener).toBeFocused();expect(errors).toEqual([]);
});
