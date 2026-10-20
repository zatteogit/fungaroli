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
 await expect(page.locator('#days .d-area')).toContainText(/km da/);await expect(page.locator('#hero .cover-trace')).toHaveCount(1);await expect(page.locator('.regional-route-preview').first()).toBeVisible();
 await context.close();
});
test('324: durata del sentiero intero distinta dall’uscita e dai raccordi',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 await page.goto('/#/zona/cicolano/0/sentiero/11098449');await page.locator('#detail summary').filter({hasText:'La passeggiata, più da vicino'}).click();
 await expect(page.locator('.walk-timing-status')).toContainText('2 h andata');await expect(page.locator('.walk-timing-status')).toContainText('Ascrea');await expect(page.locator('.walk-timing-status')).toContainText('Raccordo dalla sosta e ritorno da verificare');await context.close();
});
