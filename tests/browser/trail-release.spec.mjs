import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [390,1280])test(`sentiero: accesso visuale, fonti compatte e privacy a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 await page.goto('/#/zona/vallonina/0/sentiero/10645640');
 await expect(page.locator('#detail .hero-indicators [data-index-tip]')).toContainText('Condizioni di crescita');
 await expect(page.locator('#legal-loading')).toBeHidden();
 await expect(page.locator('.primary-species .idx-dot .fungus-glyph')).toHaveCount(1);await expect(page.locator('.primary-species .idx-dot i')).toHaveCount(0);
 await page.locator('#detail summary').filter({hasText:/^Come arrivare/}).click();
 await expect(page.locator('.access-mini-map')).toBeVisible();
 const frame=page.locator('.access-mini-map iframe');await expect(frame).toHaveAttribute('src',/openstreetmap\.org\/export\/embed\.html.*marker=/);
 await expect(page.getByRole('link',{name:'Apri il navigatore',exact:true})).toBeVisible();
 await expect(page.locator('.mapped-place-link')).toHaveCount(3);await expect(page.locator('.access-notes')).not.toHaveAttribute('open','');
 await expect(page.locator('.zone-privacy-story')).toContainText('Se condividi');await expect(page.locator('.zone-actions')).not.toContainText('0%');
 await page.locator('#detail summary').filter({hasText:'La passeggiata, più da vicino'}).click();
 const contextBlock=page.locator('.trail-provenance').first();await expect(contextBlock.getByRole('link',{name:'Altro itinerario su Wikiloc'})).toBeVisible();
 await expect(contextBlock).toContainText('Include passaggi fuori sentiero');await expect(contextBlock.locator('details')).not.toHaveAttribute('open','');
 await contextBlock.locator('summary').click();await expect(contextBlock).toContainText('31/03/2024');await expect(contextBlock).toContainText('fb1947');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});
test('avvio unico: il consenso continua a bloccare le viste e poi lascia il contenuto',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{legal:false});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');
 await expect(page.locator('#legal-loading')).toContainText('Anche una ricerca a vuoto');await expect(page.locator('#hero .loader')).toHaveAttribute('aria-hidden','true');
 await page.getByRole('button',{name:'Ho letto, continua',exact:true}).click();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#legal-loading')).toBeHidden();
 await expect(page.locator('#days .day-all')).not.toContainText('Raggio');await expect(page.locator('#days .d-area')).toHaveCount(0);await expect(page.locator('#hero .cover-trace')).toHaveCount(1);await expect(page.locator('.regional-route-preview').first()).toBeVisible();
 await context.close();
});
for(const [width,theme]of [[320,'light'],[390,'dark'],[1280,'light']])test(`324: andata, ritorno e raccordo distinti a ${width}px ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme});
 await page.goto('/#/zona/cicolano/0/sentiero/11098449');await page.locator('#detail summary').filter({hasText:'La passeggiata, più da vicino'}).click();
 await expect(page.locator('.outing-leg').nth(0)).toContainText('Rieti → Ascrea');await expect(page.locator('.outing-leg').nth(0)).toContainText('43,3 km · 1 h 5 min');await expect(page.locator('.outing-leg').nth(1)).toContainText('Sosta → partenza a Ascrea');await expect(page.locator('.outing-leg').nth(2)).toContainText('Ascrea → Fonte le Forche');await expect(page.locator('.outing-leg').nth(2)).toContainText('3,5 km · 2 h');await expect(page.locator('.walk-timing-status')).toContainText('Ascrea');await expect(page.locator('.outing-leg').nth(3)).toContainText('Fonte le Forche → Ascrea');await expect(page.locator('.outing-leg').nth(3)).toContainText('3,5 km · 1 h 30 min');await expect(page.locator('.outing-subtotal')).toContainText('3 h 30 min');await expect(page.locator('.outing-subtotal')).toContainText('Raccordo dalla sosta e pause esclusi');await expect(page.locator('.walk-summary')).not.toContainText('Imbocchi');await expect(page.locator('.outing-evidence')).not.toHaveAttribute('open','');await expect(page.locator('.th-chip').first()).toHaveAttribute('href',/openstreetmap.org/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});

test('un solo ingresso: annotazione privata, ricerca a vuoto e scelta di condivisione',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context),writes=[];
 page.on('request',r=>{if(r.method()==='POST'&&/\/(reports|observations)(?:\?|$)/.test(r.url()))writes.push(r.url());});
 await page.goto('/#/zona/cicolano/0/sentiero/11098449');const actions=page.locator('.zone-actions');
 await expect(actions.locator('button')).toHaveCount(1);await expect(actions).toContainText('Anche una ricerca a vuoto conta. Scegli tu se condividere.');await actions.getByRole('button',{name:'Com’è andata?'}).click();
 const dialog=page.locator('.notebook-dialog[open]');await expect(dialog).toContainText('Quello che hai osservato');await expect(dialog.getByRole('switch',{name:/Condividi con Fronda/})).not.toBeChecked();await expect(dialog.locator('[name="presence"]')).toHaveValue('unknown');
 await dialog.locator('[name="presence"]').selectOption('searched_absent');await expect(dialog.locator('[name="amount"]')).toBeDisabled();if(await dialog.locator('[name="effortClass"]').count())await dialog.locator('[name="effortClass"]').selectOption('lt30');await dialog.getByRole('button',{name:'Salva nel taccuino',exact:true}).click();await expect(dialog).toBeHidden();
 await page.goto('/#/diario');await page.locator('[href^="#/diario/pagina/"]').first().click();await expect(page.locator('.j-privacy').first()).toContainText('Solo per te');expect(writes).toEqual([]);await context.close();
});
