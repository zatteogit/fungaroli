import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';

async function setup(page,width,heroSelector='#hero .cover-link') {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.pathname!=='/api/weather/v1/forecast'&&u.hostname!=='api.open-meteo.com')return u.protocol==='https:'?route.abort():route.fallback();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
  await page.goto('/');await expect(page.locator(heroSelector)).toBeVisible();return errors;
}

for(const width of [320,768,1280]) test(`le card fotografiche riempiono le colonne del catalogo a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  for(const route of ['/#/specie','/#/alberi','/#/piante']){
    await page.goto(route);await page.evaluate(()=>document.fonts.ready);
    const grid=page.locator('.view:not([hidden]) .card-grid');await expect(grid.locator('.sp-card').first()).toBeVisible();
    const metrics=await grid.evaluate(el=>{
      const widths=getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat);
      return [...el.querySelectorAll('.sp-card')].map((card,i)=>{const rect=card.getBoundingClientRect(),title=card.querySelector('.sp-card-body b');return{width:rect.width,expected:widths[i%widths.length],ratio:rect.width/rect.height,titleFits:title.scrollWidth<=title.clientWidth+1};});
    });
    expect(metrics.length).toBeGreaterThan(10);
    for(const card of metrics){expect(Math.abs(card.width-card.expected)).toBeLessThan(1);expect(card.ratio).toBeCloseTo(.8,2);expect(card.titleFits).toBe(true);}
    await page.screenshot({path:`/tmp/fungaroli-catalog-width-${route.endsWith('alberi')?'trees':route.endsWith('piante')?'plants':'fungi'}-${width}.png`});
  }
  expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`spiegazioni contestuali, glossario e riconoscimento del bosco a ${width}px`,async({page})=>{
  const errors=await setup(page,width),panel=page.locator(width<700?'#learning-sheet':'#learning-popover');
  await page.locator('#hero .cover-link').click();
  const trigger=page.locator('.walk-focus [data-term]').first(),original=page.url();
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();await expect(panel.locator('.difficulty-legend > div')).toHaveCount(4);
  expect(page.url()).toBe(original);
  expect(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
  await expect(page.locator('.walk-focus')).not.toHaveAttribute('open','');
  await page.locator('.walk-focus > summary').click();
  const speciesTrigger=page.locator('.walk-focus .species-link').first();
  await speciesTrigger.click();const sheet=page.locator('#entity-sheet');await expect(sheet).toBeVisible();
  expect(page.url()).toBe(original);await expect(sheet.locator('h1')).toBeVisible();
  await page.keyboard.press('Escape');await expect(sheet).toBeHidden();await expect(speciesTrigger).toBeFocused();
  // Dal catalogo invece la scheda è una normale pagina navigabile.
  // le parole si collegano nel testo, non nelle tessere: la volva è nell'elenco dei caratteri della tignosa
  await page.goto('/#/fungo/amanita-phalloides');await expect(page.locator('#taxon-detail')).toBeVisible();
  const keyword=page.locator('#taxon-detail a.glossary-link[data-term="volva"]:visible').first();
  await expect(keyword).toBeVisible();await keyword.click();await expect(panel.locator('h2')).toHaveText('Volva');
  await panel.locator('.learning-related [data-term="anello"]').click();await expect(panel.locator('h2')).toHaveText('Anello');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(keyword).toBeFocused();
  await expect(page.locator('#taxon-detail .trait-strip a.glossary-link')).toHaveCount(0);
  await page.goto('/#/specie/edulis');await expect(page.locator('#species-detail')).toBeVisible();
  await expect(page.locator('#species-detail .trait-strip a.glossary-link')).toHaveCount(0);
  const attention=page.locator('#species-detail .attention');
  await expect(attention.locator('summary .att-h')).toHaveText('Attenzione');await expect(attention.locator('summary .att-index li').first()).toHaveText(/^\d+ (sosia|caratter|regol|cautel|risch|avvis)/);
  await expect(attention.locator(':scope > ul')).toBeHidden();
  await attention.locator('summary').click();await expect(attention.locator(':scope > ul')).toBeVisible();
  await attention.locator('summary').click();
  await page.locator('[data-tab="specie"]').click();await expect(page.locator('[data-view="specie"]')).toBeVisible();
  await expect(page.locator('#species-grid .sp-card')).not.toHaveCount(0);
  await expect(page.locator('[data-tab="specie"]')).toContainText('Scopri');
  await page.locator('[data-tab="specie"]').click();await page.locator('.view:not([hidden]) .seg-nav [data-section="impara"]').click();await page.locator('#learn-hub [data-learn="glossario"]').click();await expect(page.locator('[data-view="glossario"] h1')).toHaveText('Glossario');
  await page.locator('#glossary-q').fill('ectomicorriza');await expect(page.locator('#glossary-results details')).toHaveCount(1);
  await expect(page.locator('#glossary-results')).toContainText('Micorriza');
  await page.locator('#glossary-q').fill('parola inesistente');await expect(page.locator('#glossary-results')).toContainText('Nessuna voce');
  await page.goto('/#/glossario/dislivello');await expect(page.locator('#glossary-term-dislivello')).toHaveAttribute('open','');
  // percorso guidato degli alberi: si parte dalla foglia, gli aghi lasciano solo le conifere
  await page.goto('/#/riconosci/alberi');await page.locator('#field-identify [data-k="leaf_kind"][data-v="aghi"]').click();
  await expect(page.locator('#field-identify .id-head h2')).toHaveText('8 candidati');
  await expect(page.locator('#field-identify .id-answers')).toContainText('Aghi');
  // icone dei caratteri degli alberi: nella risposta data e nelle opzioni della domanda successiva
  await expect(page.locator('#field-identify .id-answers img.gk-row-ill')).toHaveAttribute('src',/tree-traits\/leaf_kind-aghi\.webp$/);
  await expect(page.locator('#field-identify .gk-grid-ill .id-opt img.ts-ill').first()).toBeVisible();
  const treeResult=page.locator('#field-identify .gk-results a',{hasText:'Pino nero'});
  await treeResult.click();await expect(sheet.locator('h1')).toContainText('Pino nero');
  expect(page.url()).toContain('#/riconosci/alberi');await page.keyboard.press('Escape');
  await expect(treeResult).toBeFocused();
  // scheda del castagno: 8 tessere, ognuna con l'icona del suo valore (riccio spinoso compreso)
  await page.goto('/#/albero/castagno');const tiles=page.locator('[data-tree-traits] .trait-strip-ill li');
  await expect(tiles).toHaveCount(8);await expect(page.locator('[data-tree-traits] img.ts-ill')).toHaveCount(8);
  await expect(page.locator('[data-tree-traits] img[src$="fruit_type-riccio_spinoso.webp"]')).toBeVisible();
  await page.goto('/#/riconosci/bosco');await page.locator('#field-glossary [data-category="Sentiero"]').click();
  await page.locator('#field-glossary-q').fill('segnavia');await expect(page.locator('#field-glossary-results')).toContainText('Segnavia');
  await page.goto('/#/riconosci');
  const deadly=page.locator('#identify .id-deadly'),notice=page.locator('#identify .id-warn');
  await expect(deadly).toBeVisible();await expect(deadly).toHaveJSProperty('tagName','DETAILS');
  await expect(deadly.locator('summary')).toHaveText('Le risposte e i filtri non escludono i funghi mortali.');
  await expect(deadly.locator('p')).toBeHidden();await expect(deadly.locator('ul,a[href^="#/fungo/"]')).toHaveCount(0);
  await expect(notice.locator('summary')).toHaveText("Non è un'identificazione.");
  for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    await deadly.screenshot({path:`/tmp/fungaroli-notice-closed-${width}-${theme}.png`});
  }
  await deadly.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(deadly.locator('p')).toBeVisible();await expect(deadly.locator('p')).toContainText('né la commestibilità');
  await deadly.screenshot({path:`/tmp/fungaroli-notice-open-${width}.png`});
  await notice.locator('summary').click();await expect(deadly.locator('p')).toBeHidden();
  await expect(notice.locator('p')).toContainText('Restringe i candidati, velenosi compresi.');
  await expect(page.locator('#identify > details[open]')).toHaveCount(1);
  // The same behaviour also works without the browser's native name grouping.
  await page.locator('#identify > details[name="identify-notices"]').evaluateAll(nodes=>nodes.forEach(el=>el.removeAttribute('name')));
  await deadly.locator('summary').click();await expect(notice.locator('p')).toBeHidden();
  await expect(page.locator('#identify > details[open]')).toHaveCount(1);
  await deadly.locator('summary').click();await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.locator('#identify [data-mode="all"]').click();
  const lamelle=page.locator('#identify .idf-primary [data-fk="hymenophore"][data-fv="lamelle"]');
  await lamelle.focus();await page.keyboard.press('Enter');await expect(lamelle).toHaveAttribute('aria-pressed','true');await expect(lamelle).toBeFocused();
  const more=page.locator('#identify [data-idf-open]');await expect(more).toHaveText('Altri');await more.click();
  const filters=page.locator('#identify-filters');await expect(filters).toBeVisible();
  await expect(filters.locator('[data-fk="hymenophore"][data-fv="lamelle"]')).toHaveAttribute('aria-pressed','true');
  await filters.locator('[data-fk="hymenophore_color"][data-fv="bianco"]').click();
  await filters.locator('[data-idf-close]').first().click();await expect(more).toBeFocused();await expect(more).toContainText('Altri');
  await expect(page.locator('#identify .idf-bar [data-fclear="hymenophore_color"]')).toBeVisible();
  await page.locator('#identify .idf-primary [data-fclear="hymenophore"]').click();
  await expect(lamelle).toHaveAttribute('aria-pressed','false');await expect(page.locator('#identify .idf-bar [data-fclear="hymenophore_color"]')).toHaveCount(0);
  await more.click();await expect(filters.locator('[data-fk="hymenophore_color"][aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(filters).toBeHidden();await expect(more).toBeFocused();
  await page.locator('#identify [data-mode="guided"]').click();await expect(page.locator('#identify .id-q-big')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&r.width>0}).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width}))))).toBe(true);expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`schede contestuali complete, ritorno e navigazione esplicita a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  await page.locator('#hero .cover-link').click();
  await page.locator('.walk-focus > summary').click();
  const tree=page.locator('.walk-focus a.tree-link').first(),href=await tree.getAttribute('href');
  await tree.scrollIntoViewIfNeeded();await tree.focus();
  const before=await page.evaluate(()=>({hash:location.hash,scroll:scrollY,history:history.length}));
  await page.keyboard.press('Enter');
  const sheet=page.locator('#entity-sheet'),panel=page.locator(width<700?'#learning-sheet':'#learning-popover');
  await expect(sheet).toBeVisible();await expect(sheet.locator('h1')).toBeVisible();
  await expect(sheet.locator('summary', {hasText:'Foglia, corteccia, frutto'})).toBeVisible();
  expect(await page.evaluate(()=>({hash:location.hash,scroll:scrollY,history:history.length}))).toEqual(before);
  expect(await sheet.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`/tmp/fungaroli-contextual-tree-${width}.png`});
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  await page.screenshot({path:`/tmp/fungaroli-contextual-tree-${width}-dark.png`});
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  const features=sheet.locator('summary',{hasText:'Foglia, corteccia, frutto'});
  await features.click();const treeTitle=await sheet.locator('h1').textContent();
  const fungus=sheet.locator('.tree-fungi a').first();await fungus.scrollIntoViewIfNeeded();
  const treeScroll=await sheet.evaluate(el=>el.scrollTop);
  await fungus.click();await expect(sheet.locator('h1')).not.toHaveText(treeTitle);
  await expect(sheet.locator('[data-entity-back]')).toBeVisible();
  // Le parole del glossario rimangono consultabili anche nella modale, con focus corretto.
  const keyword=sheet.locator('a.glossary-link:visible').first();await keyword.click();await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(sheet).toBeVisible();await expect(keyword).toBeFocused();
  await sheet.locator('.phero [data-photo]').first().click();await expect(page.locator('dialog.lb')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('dialog.lb')).toBeHidden();await expect(sheet).toBeVisible();
  await sheet.locator('[data-entity-back]').click();await expect(sheet.locator('h1')).toHaveText(treeTitle);
  await expect(features.locator('..')).toHaveAttribute('open','');await expect(fungus).toBeFocused();
  expect(await sheet.evaluate(el=>el.scrollTop)).toBeCloseTo(treeScroll,0);
  await sheet.locator('[data-entity-close]').click();await expect(sheet).toBeHidden();await expect(tree).toBeFocused();
  await expect(page.locator('.walk-focus')).toHaveAttribute('open','');
  expect(await page.evaluate(()=>({hash:location.hash,scroll:scrollY,history:history.length}))).toEqual(before);
  // Ridimensionare non chiude la scheda; aprire come pagina è una scelta esplicita.
  await tree.click();await page.setViewportSize({width:width===320?768:600,height:900});await expect(sheet).toBeVisible();
  await sheet.locator('[data-entity-page]').click();await expect(sheet).toBeHidden();
  expect(page.url()).toContain(href);await expect(page.locator('#tree-detail h1')).toHaveText(treeTitle);
  expect(await page.evaluate(()=>document.documentElement.classList.contains('entity-open'))).toBe(false);
  // Stessa specie presente nella pagina e nel pannello: ID distinti e comandi locali.
  await page.goto('/#/specie/edulis');
  const relatedTree=page.locator('#species-detail a.tree-link').first();await relatedTree.click();
  const porcino=sheet.locator('.tree-fungi a[href="#/specie/edulis"]');await porcino.click();
  await expect(sheet.locator('h1')).toContainText('Porcino');
  expect(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.length===new Set(ids).size;})).toBe(true);
  await sheet.locator('[data-entity-back]').click();
  await sheet.locator('.tree-fungi a[href="#/specie/mellea"]').click();
  await sheet.locator('[data-jump-k]').click();await expect(sheet.locator('.kitchen')).toBeInViewport();
  await page.keyboard.press('Escape');await expect(relatedTree).toBeFocused();
  // I risultati di Riconosci aprono la scheda completa, mantenendo i caratteri scelti.
  await page.goto('/#/riconosci');await page.locator('#identify [data-mode="all"]').click();
  const candidate=page.locator('#identify [data-taxon]').first();await candidate.click();
  await expect(sheet).toBeVisible();await expect(sheet.locator('h3',{hasText:'Caratteri da confrontare'})).toBeVisible();
  expect(page.url()).toContain('#/riconosci');await page.keyboard.press('Escape');await expect(candidate).toBeFocused();
  expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`le keyword non spezzano gli elenchi numerati a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  const verify=async row=>{
    await expect(row).toContainText('Gemme grosse, brune e pelose, senza filamenti');
    const metrics=await row.evaluate(el=>{
      const text=el.querySelector('.key-text'),link=text.querySelector('a[data-term="gemma"]')||text.querySelector('a.glossary-link');
      const tail=[...text.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.includes('grosse'));
      const range=document.createRange(),i=tail.textContent.indexOf('grosse');range.setStart(tail,i);range.setEnd(tail,i+6);
      const a=link.getBoundingClientRect(),b=range.getBoundingClientRect();
      return {delta:Math.abs(a.top-b.top),inline:b.left>=a.right-2,linkWidth:a.width,height:el.getBoundingClientRect().height};
    });
    expect(metrics.delta).toBeLessThan(4);expect(metrics.inline).toBe(true);expect(metrics.linkWidth).toBeLessThan(100);expect(metrics.height).toBeLessThan(80);
  };
  await page.goto('/#/albero/farnetto');await page.evaluate(()=>document.fonts.ready);
  const row=page.locator('#tree-detail .keys > li').nth(3);await verify(row);
  await row.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/fungaroli-gemme-inline-${width}.png`});
  // Anche con le vecchie regole grid, l'intera frase deve restare una sola cella.
  await page.addStyleTag({content:'.keys li{display:grid;position:static;padding-left:0;grid-template-columns:30px 1fr;gap:12px}.keys li::before{position:static}'});
  await verify(row);
  await page.goto('/#/riconosci/alberi');await page.locator('#field-identify [data-k="leaf_kind"][data-v="foglia_larga"]').click();
  await page.locator('#field-identify [data-k="fruit_type"][data-v="ghianda"]').click();
  const trigger=page.locator('#field-identify .gk-results a',{hasText:'Farnetto'});await trigger.click();
  const modalRow=page.locator('#entity-sheet .keys > li').nth(3);await verify(modalRow);
  const word=modalRow.locator('a.glossary-link');await word.click();
  const panel=page.locator(width<700?'#learning-sheet':'#learning-popover');await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');await expect(word).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  for(const route of ['/#/specie/edulis','/#/fungo/amanita-phalloides']){
    await page.goto(route);const keys=page.locator('.view:not([hidden]) .keys > li');await expect(keys.first()).toBeVisible();
    const links=keys.locator('a.glossary-link');expect(await links.count()).toBeGreaterThan(0);
    expect(await links.evaluateAll(nodes=>nodes.every(el=>el.getBoundingClientRect().width<150))).toBe(true);
  }
  expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`guide in Scopri e taccuino personale distinti a ${width}px`,async({page})=>{
  // Una release CMS precedente deve restare leggibile con la terminologia aggiornata.
  await page.route('**/api/content/v1/snapshot',async route=>{
    const response=await route.fetch(),snapshot=await response.json();
    snapshot.resources['ui-copy'].editorialEyebrow='Il taccuino del bosco';
    const guide=snapshot.resources.guides.guides[0];guide.category='Taccuino di campo';guide.title='Una guida dal CMS';
    guide.body=guide.body.replace('Conosci gli alberi','Apri il taccuino degli alberi');
    await route.fulfill({json:snapshot});
  });
  const errors=await setup(page,width);
  await expect(page.locator('[data-view="uscite"] #editorial')).toHaveCount(0);
  await expect(page.locator('[data-tab="diario"]')).toHaveText('Taccuino');
  await page.locator('[data-tab="specie"]').click();await expect(page.locator('#species-grid')).toBeVisible();
  await page.locator('[data-tab="specie"]').click();await page.locator('.view:not([hidden]) .seg-nav [data-section="impara"]').click();await expect(page.locator('#learn-hub .learn-card')).toHaveCount(6);
  await page.locator('#learn-hub [data-learn="guide"]').click();
  const view=page.locator('[data-view="guide-list"]');await expect(view).toBeVisible();
  // dentro Impara niente riga delle sezioni di Scopri: solo le quattro sotto-schede, con Guide scelta
  await expect(view.locator('.seg-nav')).toBeHidden();await expect(view.locator('.seg-nav a')).toHaveCount(0);
  await expect(view.locator('.sub-nav a')).toHaveCount(4);await expect(view.locator('.sub-nav [aria-current="page"]')).toHaveText('Guide');
  await expect(page.locator('[data-back]:visible span')).toHaveText('Impara');
  await expect(page.locator('[data-tab="specie"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#editorial .eyebrow').first()).toHaveText('Guide del bosco');
  await expect(page.locator('#editorial .editorial-card')).toHaveCount(3);
  await expect(page.locator('#editorial')).not.toContainText('Taccuino');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`/tmp/fungaroli-guide-navigation-${width}.png`});
  await page.locator('#editorial a').first().click();await expect(page.locator('#guide-body h1')).toHaveText('Una guida dal CMS');
  await expect(page.locator('#guide-body')).toContainText('Conosci gli alberi');
  await expect(page.locator('[data-back]:visible')).toHaveAttribute('aria-label','Indietro: Guide');
  await page.locator('[data-back]:visible').click();await expect(view).toBeVisible();
  await page.goto('/#/guide/leggere-il-bosco');await expect(page.locator('[data-back]:visible')).toHaveAttribute('aria-label','Indietro: Guide');
  await page.locator('[data-back]:visible').click();await expect(view).toBeVisible();
  await page.locator('[data-tab="diario"]').click();await expect(page.locator('#journal-h')).toHaveText('Il mio taccuino');
  await expect(page.locator('#journal-storage')).toContainText('Il taccuino');
  await page.goto('/#/info');await expect(page.locator('#legal-sections')).toContainText('Taccuino privato');
  await page.goto('/');await expect(page.locator('#hero .cover-cta')).toContainText('Vedi l’uscita');
  await page.locator('#hero .cover-link').click();await page.locator('.walk-focus > summary').click();
  await expect(page.locator('.walk-focus > summary')).not.toContainText('taccuino');
  await expect(page.locator('.walk-focus [data-note-kind="zona"]')).toContainText('Salva il giro nel taccuino');
  await page.locator('.walk-focus [data-note-kind="zona"]').click();await page.locator('.notebook-dialog[open] [type="submit"]').click();await expect(page.locator('.notebook-dialog[open]')).toHaveCount(0);
  await page.goto('/#/diario');await page.locator('[data-notebook-filter="percorso"]').click();await expect(page.locator('#journal-list .notebook-entry')).toHaveCount(1);await expect(page.locator('#journal-list .notebook-entry .notebook-reference-link')).toHaveAttribute('href',/^#\/zona\/.+\/sentiero\//);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&r.width>0}).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width}))))).toBe(true);expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`illustrazioni del glossario, fonti e ingrandimento senza perdere il contesto a ${width}px`,async({page})=>{
  const errors=await setup(page,width),panel=page.locator(width<700?'#learning-sheet':'#learning-popover');
  await page.goto('/#/glossario/pliche');
  const entry=page.locator('#glossary-term-pliche'),image=entry.locator('[data-learning-image]');
  await expect(entry.locator('.learning-sources a')).toHaveAttribute('href','https://enciclopedia.funghiitaliani.it/termine.php?show=2638');
  await expect(image.locator('img')).toBeVisible();await expect.poll(()=>image.locator('img').evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
  await expect(entry.locator('figcaption')).toContainText('Japonica');await expect(entry.locator('figcaption a').first()).toHaveAttribute('href','https://creativecommons.org/licenses/by-sa/4.0/');
  const hash=await page.evaluate(()=>location.hash);await image.focus();await page.keyboard.press('Enter');
  await expect(page.locator('dialog.lb')).toBeVisible();await expect(page.locator('.lb-cap')).toContainText('Pliche del finferlo');
  await page.keyboard.press('Escape');await expect(image).toBeFocused();await expect(entry).toHaveAttribute('open','');expect(await page.evaluate(()=>location.hash)).toBe(hash);
  await page.goto('/#/specie/cibarius');
  const keyword=page.locator('#species-detail a.glossary-link[data-term="pliche"]:visible').first();await keyword.click();
  await expect(panel).toBeVisible();const zoom=panel.locator('[data-learning-image]');await expect(zoom).toBeVisible();
  await expect.poll(()=>zoom.locator('img').evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
  await expect.poll(()=>panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await page.evaluate(()=>document.fonts.ready);await panel.screenshot({path:`/tmp/fungaroli-glossary-pliche-${width}-light.png`});
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');await panel.screenshot({path:`/tmp/fungaroli-glossary-pliche-${width}-dark.png`});
  await zoom.click();await expect(page.locator('dialog.lb')).toBeVisible();
  await page.keyboard.press('Escape');await expect(panel).toBeVisible();await expect(zoom).toBeFocused();
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(keyword).toBeFocused();
  await page.goto('/#/glossario/imenoforo');await expect(page.locator('#glossary-term-imenoforo .learning-image')).toHaveCount(4);
  await page.goto('/#/glossario/volva');await expect(page.locator('#glossary-term-volva .learning-diagram img')).toBeVisible();
  expect(errors).toEqual([]);
});

for(const width of [320,1280]) test(`titoletti senza link e keyword complete nel testo a ${width}px`,async({page})=>{
  const errors=await setup(page,width);await page.goto('/#/specie/caesarea');
  await expect(page.locator('#species-detail .trait-strip .ts-k a')).toHaveCount(0);
  const cap=page.locator('#species-detail .keys [data-term="cappello"]').first(),stem=page.locator('#species-detail .keys [data-term="gambo"]').first();
  await expect(cap).toBeVisible();await expect(stem).toBeVisible();
  await cap.click();const panel=page.locator(width<700?'#learning-sheet':'#learning-popover');await expect(panel.locator('h2')).toHaveText('Cappello');
  await page.keyboard.press('Escape');await expect(cap).toBeFocused();
  for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('#species-detail .trait-strip').screenshot({path:`/tmp/fungaroli-traits-${width}-${theme}.png`});}
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#hero .sp-also').first()).toBeVisible();
  expect(await page.locator('#hero .sp-also').evaluateAll(nodes=>nodes.every(el=>{const score=el.querySelector('.sp-also-score');return !!score&&score.children[0].tagName==='I'&&score.children[1].tagName==='B';}))).toBe(true);
  // Screenshot diagnostico: un ridisegno tardivo (community, meteo) può riconciliare il riquadro mentre viene catturato.
  await expect(async()=>page.locator('#hero .cover-sp').screenshot({path:`/tmp/fungaroli-also-species-${width}.png`,timeout:3000})).toPass({timeout:15000});
  const repeated=await page.locator('#hero .cover-walk,#ranking .tile-body').evaluateAll(nodes=>nodes.some(el=>{const text=el.textContent;const refs=text.match(/sentiero\s+\d+/gi)||[];return new Set(refs.map(x=>x.toLowerCase())).size<refs.length;}));expect(repeated).toBe(false);
  expect(errors).toEqual([]);
});

test('foto fuori vista differite, skeleton stabili e visore recuperabile dopo un errore',async({page})=>{
  const errors=await setup(page,390);await page.goto('/#/specie');
  const cards=page.locator('#species-grid .sp-card'),last=cards.filter({has:page.locator('img')}).last();
  await expect(last.locator('img')).toHaveAttribute('data-src',/.+/);await expect(last.locator('img')).not.toHaveAttribute('src',/.+/);
  const before=await last.boundingBox();await last.scrollIntoViewIfNeeded();await expect.poll(()=>last.locator('img').evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
  const after=await last.boundingBox();expect(after.width).toBeCloseTo(before.width,0);expect(after.height).toBeCloseTo(before.height,0);
  // Trattiene una vera immagine per verificare lo stato durante il download.
  let release;const gate=new Promise(r=>release=r);let failFull=true;
  await page.route('**/assets/glossary/pliche.jpg*',async route=>{await gate;if(failFull&&route.request().url().includes('full-test'))return route.abort();return route.continue();});
  await page.goto('/#/glossario/pliche');const image=page.locator('#glossary-term-pliche .learning-image img');
  await expect(image).toHaveAttribute('data-image-state','loading');const pending=await image.boundingBox();
  await page.screenshot({path:'/tmp/fungaroli-photo-skeleton.png'});release();await expect(image).toHaveAttribute('data-image-state','ready');const ready=await image.boundingBox();expect(ready.height).toBe(pending.height);
  await page.evaluate(async()=>{const {openLightbox}=await import('/js/lightbox.js');openLightbox([{src:'/assets/glossary/pliche.jpg?full-test',alt:'Pliche del finferlo'}]);});
  await expect(page.locator('.lb-retry')).toBeVisible();await expect(page.locator('.lb-loading')).toHaveText('Foto non disponibile.');failFull=false;
  await page.locator('.lb-retry').click();await expect(page.locator('.lb-stage img')).toHaveAttribute('data-image-state','ready');await expect(page.locator('.lb-loading')).toBeHidden();
  await page.keyboard.press('Escape');await expect(page.locator('#glossary-term-pliche')).toHaveAttribute('open','');expect(errors).toEqual([]);
});

test('tocchi rapidi nelle transizioni mantengono l’ultima vista e i decimali dell’indice',async({page})=>{
  const errors=await setup(page,1280);await page.emulateMedia({reducedMotion:'no-preference'});
  const final=await page.locator('#hero .ring b').innerText();
  await page.evaluate(async()=>{
    const {navigate,soft}=await import('/js/motion.js');
    navigate(()=>{location.hash='#/specie';},{nav:'push'});
    soft(()=>{location.hash='#/alberi';});
    navigate(()=>{location.hash='#/glossario';},{nav:'left'});
  });
  await expect(page.locator('[data-view="glossario"]')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.nav||'')).toBe('');
  await page.goto('/');await expect(page.locator('#hero .ring b')).toHaveText(final);expect(final).toMatch(/^\d,\d$/);expect(errors).toEqual([]);
});

for(const width of [320,1280])test(`funghi al centro, scoperte contestuali e taccuino a ${width}px`,async({page})=>{
 const errors=await setup(page,width);
 await expect(page.locator('[data-target]')).toHaveCount(0);await expect(page.locator('#during-walk')).toBeVisible();
 const hero=await page.locator('#hero .cover-link').getAttribute('href'),index=await page.locator('#hero .ring b').innerText();
 const cards=page.locator('#during-walk .discovery-grid>li');expect(await cards.count()).toBeGreaterThan(0);expect(await cards.count()).toBeLessThanOrEqual(3);await expect(page.locator('#during-walk .ring')).toHaveCount(0);
 const link=page.locator('#during-walk [data-discovery]').first(),href=await link.getAttribute('href'),original=page.url();await link.click();const sheet=page.locator('#entity-sheet[open]');await expect(sheet.locator('.discovery-context')).toContainText('presenza');expect(page.url()).toBe(original);await expect(sheet.locator('[data-note-kind]').first()).toHaveAttribute('data-note-zone',/\S+/);
 await sheet.locator('[data-entity-close]').click();await expect(link).toBeFocused();
 await page.goto('/'+hero);
 const observations=page.locator('#detail [data-sec="specie"]');
 if(await observations.getAttribute('open')===null)await observations.locator(':scope > summary').click({position:{x:5,y:5}});
 await expect(observations.locator('.observation-discoveries')).toBeVisible();
 await expect(page.locator('#detail [data-sec="scoperte"]')).toHaveCount(0);
 const discovery=observations.locator('[data-discovery]').first(),zoneUrl=page.url();
 await discovery.click();await expect(sheet).toBeVisible();expect(page.url()).toBe(zoneUrl);
 await sheet.locator('[data-entity-close]').click();await expect(discovery).toBeFocused();
 // la preferenza sugli appunti botanici sta nel taccuino, non tra i filtri
 await expect(page.locator('#full-filters [data-botanical-personalize]')).toHaveCount(0);
 await page.goto('/#/diario');await page.locator('#notebook-storage-panel > summary').click();const notesToggle=page.locator('[data-botanical-personalize]');await expect(notesToggle).not.toBeChecked();await notesToggle.check();
 await page.goto('/#/');await expect(page.locator('#hero .cover-link')).toBeVisible();
 await page.locator('#active-filters [data-more]').click();await page.locator('[data-discoveries-toggle]').uncheck();await page.locator('#full-filters [data-close]').first().click();await expect(page.locator('#during-walk')).toBeHidden();await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',hero);await expect(page.locator('#hero .ring b')).toHaveText(index);
 await page.reload();await expect(page.locator('#during-walk')).toBeHidden();await expect(page.locator('#hero .cover-link')).toHaveAttribute('href',hero);
 await page.goto('/#/pianta/ortica');await expect(page.locator('#plant-detail [data-botanical-discover]')).toHaveCount(0);await page.locator('[data-botanical-method]>summary').click();await expect(page.locator('[data-botanical-method]')).toContainText('Durante il giro');
 await page.goto('/#/scopri');await expect(page.locator('[data-tab="specie"]')).toContainText('Scopri');await expect(page.locator('#species-grid .sp-card').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('la preferenza botanica salvata riconfigura la home',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({target:'piante',plantIds:null})));
 const errors=await setup(page,390,'#hero .outdoor-hero');await expect(page.locator('#active-filters [data-intent="piante"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#hero .outdoor-hero')).toBeVisible();await expect(page.locator('#hero .ring')).toHaveCount(0);expect(errors).toEqual([]);
});
for(const width of [320,1280])test(`avvisi brevi visibili e caratteri senza verdetti di raccolta a ${width}px`,async({page})=>{
 const errors=await setup(page,width);await page.goto('/#/fungo/cortinarius-rubellus');const warning=page.locator('#taxon-detail .attention');await expect(warning).toBeVisible();await expect(warning.locator('summary')).toHaveCount(0);await expect(warning.locator('ul')).toContainText('danni renali tardivi');await expect(warning).not.toContainText(/scarta/i);await expect(warning.locator('[data-term="cappello"]')).toBeVisible();
 await page.screenshot({path:`/tmp/fungaroli-warning-${width}.png`});
 await page.goto('/#/specie/procera');await expect(page.locator('#species-detail .checks [role="checkbox"]')).toHaveCount(0);await expect(page.locator('#species-detail')).toContainText('Caratteri da confrontare');await expect(page.locator('#species-detail')).not.toContainText(/Scarta/i);expect(errors).toEqual([]);
});
for(const width of [320,1280])test(`omonimi nel glossario: piante, alberi, funghi e pannelli annidati a ${width}px`,async({page})=>{
 const errors=await setup(page,width),panel=page.locator(width<700?'#learning-sheet':'#learning-popover');
 for(const route of ['/#/pianta/rovo','/#/pianta/rosa-canina','/#/albero/faggio']){
  await page.goto(route);const view=page.locator('.view:not([hidden])');await expect(view.locator('[data-term="aculei-piante"]:visible').first()).toBeVisible();await expect(view.locator('[data-term="aculei"]')).toHaveCount(0);
  await view.locator('[data-term="aculei-piante"]:visible').first().click();await expect(panel.locator('.learning-category')).toHaveText('Piante');await expect(panel).toContainText('tessuti superficiali');await page.keyboard.press('Escape');
 }
 await page.goto('/#/specie/repandum');await page.locator('#species-detail [data-term="aculei"]:visible').first().click();await expect(panel.locator('.learning-category')).toHaveText('Funghi');await expect(panel).toContainText('sotto il cappello');await page.keyboard.press('Escape');
 // A modal plant sheet opened from a fungal route has its own context.
 await page.evaluate(()=>{const a=document.createElement('a');a.href='#/pianta/rovo';a.dataset.entity='';a.textContent='Apri il rovo';document.querySelector('#species-detail').append(a);});await page.locator('#species-detail [data-entity][href="#/pianta/rovo"]').click();await page.locator('#entity-sheet[open] [data-term="aculei-piante"]:visible').first().click();await expect(panel.locator('.learning-category')).toHaveText('Piante');await page.keyboard.press('Escape');await page.locator('#entity-sheet[open] [data-entity-close]').click();
 await page.goto('/#/pianta/corbezzolo');await page.locator('#plant-detail details.sec').first().locator(':scope > summary').click();await page.locator('#plant-detail [data-term="substrato-piante"]:visible').first().click();await expect(panel.locator('.learning-category')).toHaveText('Piante');await page.keyboard.press('Escape');
 // la prova sta dentro una zona descrittiva delle piante: lì si collegano solo i termini validi per le piante
 await page.evaluate(()=>{const host=document.querySelector('#plant-detail [data-glossary="Piante"]');const p=document.createElement(/^(OL|UL)$/.test(host.tagName)?'li':'p');p.id='context-probe';p.textContent='Habitat compatibile: anello, cappello e cespitosa.';host.append(p);});await expect(page.locator('#context-probe [data-term="anello"],#context-probe [data-term="cappello"],#context-probe [data-term="cespitoso"]')).toHaveCount(0);await page.locator('#plant-detail [data-term="habitat"]:visible').first().click();await panel.locator('[data-term="substrato-piante"]').click();await expect(panel.locator('.learning-category')).toHaveText('Piante');await page.keyboard.press('Escape');
 await page.goto('/#/albero/leccio');await page.locator('.view:not([hidden]) [data-term="pollone"]').first().click();await expect(panel).toContainText('non significa necessariamente');await page.keyboard.press('Escape');
 await page.goto('/#/');await page.locator('#hero .cover-link').click();await page.locator('.walk-focus .sec-body').waitFor({state:'attached'});await page.evaluate(()=>{const p=document.createElement('p');p.id='trail-probe';p.dataset.glossary='Sentiero';p.textContent='Un percorso ad anello: porta un cappello, controlla il dislivello.';document.querySelector('.walk-focus .sec-body').append(p);});await expect(page.locator('.walk-focus [data-term="dislivello"]').first()).toBeAttached();await expect(page.locator('#trail-probe [data-term="anello"],#trail-probe [data-term="cappello"]')).toHaveCount(0);
 await page.goto('/#/glossario');await page.locator('#glossary-q').fill('aculei');await expect(page.locator('#glossary-term-aculei')).toBeVisible();await expect(page.locator('#glossary-term-aculei-piante')).toBeVisible();expect(errors).toEqual([]);
});

for(const width of [390,1280]) test(`Scopri: tre cataloghi più Impara e ricerca contestuale a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  const places=[['/#/specie','Funghi','Sfoglia'],['/#/riconosci','Funghi','Impara a riconoscere'],['/#/piante','Piante e fiori','Sfoglia'],['/#/riconosci/piante','Piante e fiori','Impara a riconoscere'],['/#/alberi','Alberi','Sfoglia'],['/#/riconosci/alberi','Alberi','Impara a riconoscere']];
  for(const [route,section,mode] of places){
    await page.goto(route);const view=page.locator('.view:not([hidden])');
    await expect(view.locator('.seg-nav [aria-current="page"]')).toHaveText(section);
    await expect(view.locator('.sub-nav a')).toHaveCount(0);
    if(mode==='Sfoglia'){
      const trigger=view.locator('[data-open-recognition]');await expect(trigger).toBeVisible();const before=page.url();
      await trigger.click();const panel=page.locator('.recognition-sheet[open]');await expect(panel).toBeVisible();
      await expect(panel.locator('.id-q').first()).toBeVisible();expect(page.url()).toBe(before);
      await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();expect(page.url()).toBe(before);
    }
    await expect(view.locator('.seg-nav a')).toHaveText(['Funghi','Piante e fiori','Alberi','Impara']);
  }
  // Impara: quarta sezione di Scopri. La pagina indice ha la riga delle sezioni (Impara scelta); le pagine interne
  // hanno solo le sotto-schede e «indietro» (niente terzo livello)
  // si arriva dalla pagina indice di Impara: «indietro» riporta lì
  for(const [route,title] of [['/#/glossario','Glossario'],['/#/guide','Guide'],['/#/riconosci/bosco','Bosco e sentiero'],['/#/sfide','Sfide']]){
    await page.goto('/#/impara');await expect(page.locator('#learn-hub')).toBeVisible();
    const hub=page.locator('.view:not([hidden])');
    await expect(hub.locator('.seg-nav a')).toHaveText(['Funghi','Piante e fiori','Alberi','Impara']);await expect(hub.locator('.seg-nav [data-section="impara"]')).toHaveAttribute('aria-current','page');
    await page.goto(route);const view=page.locator('.view:not([hidden])');
    await expect(view.locator('.seg-nav')).toBeHidden();await expect(view.locator('.seg-nav a')).toHaveCount(0);
    await expect(view.locator('.sub-nav a')).toHaveCount(4);await expect(view.locator('.sub-nav [aria-current="page"]')).toHaveText(title);
    await expect(page.locator('[data-tab="specie"]')).toHaveAttribute('aria-current','page');
    await expect(page.locator('[data-back]:visible span')).toHaveText('Impara');
  }
  // Nei Funghi si usa la ricerca generale, senza un secondo campo nel catalogo.
  await page.goto('/#/specie');await expect(page.locator('#species-grid [data-catalog-search]')).toHaveCount(0);
  await expect(page.locator('.tab-search')).toBeVisible();
  await page.keyboard.press('/');await expect(page.locator('dialog.search-dlg[open] input')).toBeFocused();
  await page.locator('dialog.search-dlg[open] input').fill('porcino');
  await expect(page.locator('dialog.search-dlg[open]')).toContainText('Porcino');
  await page.locator('dialog.search-dlg .search-cancel').click();
  await page.goto('/#/alberi');await expect(page.locator('#tree-grid [data-catalog-search]')).toHaveCount(0);
  await page.locator('[data-tree-group="conifere"]').click();await expect(page.locator('[data-tree-results] .sp-card').first()).toBeVisible();
  await page.locator('[data-tree-group=""]').click();await expect(page.locator('[data-tree-results] .sp-card')).toHaveCount(39);
  // fuori dai cataloghi la ricerca generale resta disponibile
  await page.goto('/#/glossario');await expect(page.locator('.tab-search')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('confronto: colore etichettato per struttura in ciascuna colonna',async({page})=>{
 await setup(page,390);
 for(const [ref,pick,labels] of [['edulis','tylopilus-felleus',['Colore dei pori','Colore dei pori']],['cibarius','omphalotus-olearius',['Colore delle pliche','Colore delle lamelle']]]){
  await page.goto(`/#/riconosci/confronta/${ref}/${pick}`);
  const slide=page.locator(`#cmp-${pick}`),row=slide.locator('[data-trait="hymenophore_color"]');
  await expect(slide.locator('.cmp-same')).toHaveCount(0);
  await expect(slide.locator('.cmp-legend')).toContainText('Fondo colorato: in comune');
  await expect(slide.locator('.cmp-legend')).toContainText('Solo contorno: differenze');
  const legend=await slide.locator('.cmp-legend').evaluate(el=>({common:getComputedStyle(el.querySelector('.common')).backgroundColor,own:getComputedStyle(el.querySelector('.own')).backgroundColor}));
  expect(legend.common).not.toBe('rgba(0, 0, 0, 0)');expect(legend.own).toBe('rgba(0, 0, 0, 0)');
  await expect(row.locator('.cmp-cell > .cmp-k')).toHaveText(labels);
  for(const cell of await row.locator('.cmp-cell').all()){
   const values=await cell.locator('.cmp-v').count();
   await expect(cell.locator('.cmp-or')).toHaveCount(Math.max(0,values-1));
  }
  if(ref==='cibarius'){await expect(row).toHaveClass(/diff/);await expect(row.locator('.cmp-v.common')).toHaveCount(0);}
 }
});
