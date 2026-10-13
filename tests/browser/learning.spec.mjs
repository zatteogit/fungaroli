import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';

async function setup(page,width) {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',async route=>{
    const u=new URL(route.request().url());if(u.hostname!=='api.open-meteo.com')return route.abort();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','22026-10-12'));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();return errors;
}

for(const width of [320,768,1280]) test(`le card fotografiche riempiono le colonne del catalogo a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  for(const route of ['/#/specie','/#/alberi']){
    await page.goto(route);await page.evaluate(()=>document.fonts.ready);
    const grid=page.locator('.view:not([hidden]) .card-grid');await expect(grid.locator('.sp-card').first()).toBeVisible();
    const metrics=await grid.evaluate(el=>{
      const widths=getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat);
      return [...el.querySelectorAll('.sp-card')].map((card,i)=>{const rect=card.getBoundingClientRect(),title=card.querySelector('.sp-card-body b');return{width:rect.width,expected:widths[i%widths.length],ratio:rect.width/rect.height,titleFits:title.scrollWidth<=title.clientWidth+1};});
    });
    expect(metrics.length).toBeGreaterThan(10);
    for(const card of metrics){expect(Math.abs(card.width-card.expected)).toBeLessThan(1);expect(card.ratio).toBeCloseTo(.8,2);expect(card.titleFits).toBe(true);}
    await page.screenshot({path:`/tmp/fungaroli-catalog-width-${route.endsWith('alberi')?'trees':'fungi'}-${width}.png`});
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
  await page.goto('/#/specie/edulis');await expect(page.locator('#species-detail')).toBeVisible();
  const keyword=page.locator('#species-detail a.glossary-link[data-term="volva"]').first();
  await expect(keyword).toBeVisible();await keyword.click();await expect(panel.locator('h2')).toHaveText('Volva');
  await panel.locator('.learning-related [data-term="anello"]').click();await expect(panel.locator('h2')).toHaveText('Anello');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(keyword).toBeFocused();
  const attention=page.locator('#species-detail .attention');
  await expect(attention.locator('summary')).toHaveText('Attenzione');
  await expect(attention.locator(':scope > ul')).toBeHidden();
  await attention.locator('summary').click();await expect(attention.locator(':scope > ul')).toBeVisible();
  await attention.locator('summary').click();
  await page.locator('[data-tab="specie"]').click();await expect(page.locator('[data-view="specie"]')).toBeVisible();
  await expect(page.locator('#species-grid .sp-card')).not.toHaveCount(0);
  await expect(page.locator('[data-tab="specie"]')).toContainText('Impara');
  await page.locator('[data-view="specie"] .seg-nav a[href="#/glossario"]').click();
  await page.locator('#glossary-q').fill('ectomicorriza');await expect(page.locator('#glossary-results details')).toHaveCount(1);
  await expect(page.locator('#glossary-results')).toContainText('Micorriza');
  await page.locator('#glossary-q').fill('parola inesistente');await expect(page.locator('#glossary-results')).toContainText('Nessuna voce');
  await page.goto('/#/glossario/dislivello');await expect(page.locator('#glossary-term-dislivello')).toHaveAttribute('open','');
  await page.goto('/#/riconosci/alberi');await page.locator('[data-observation="aghi a coppie"]').click();
  await expect(page.locator('#tree-observation-count')).toHaveText('4 schede da confrontare');
  const treeResult=page.locator('#tree-observation-results a').first();
  await treeResult.click();await expect(sheet.locator('h1')).toContainText('Pino nero');
  expect(page.url()).toContain('#/riconosci/alberi');await page.keyboard.press('Escape');
  await expect(treeResult).toBeFocused();await expect(page.locator('#tree-observation-q')).toHaveValue('aghi a coppie');
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
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
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
  await expect(sheet).toBeVisible();await expect(sheet.locator('h3',{hasText:'Cosa controllare'})).toBeVisible();
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
  await page.goto('/#/riconosci/alberi');await page.locator('#tree-observation-q').fill('Farnetto');
  const trigger=page.locator('#tree-observation-results a').first();await trigger.click();
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
