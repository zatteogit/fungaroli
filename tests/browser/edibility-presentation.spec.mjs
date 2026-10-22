// Commestibilità presentata come dato neutro (audit del 22/10, F1-F7 e F11): nessun giudizio gastronomico nella testata,
// nessun verde su «commestibile», «con cautela» con fondo neutro e anello ambra, la cautela dell'Ispettorato presente.
// Controlli dal browser che completano tests/edibility-presentation.test.mjs.
import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';

// colore calcolato di un token, per confrontarlo con quelli delle etichette
const tokenColor=(page,name,prop='color')=>page.evaluate(([n,p])=>{const e=document.createElement('span');e.style[p]=`var(${n})`;document.body.append(e);const c=getComputedStyle(e)[p];e.remove();return c;},[name,prop]);
const style=(loc,prop)=>loc.evaluate((e,p)=>getComputedStyle(e)[p],prop);

for(const theme of ['light','dark'])test(`commestibilità neutra, senza giudizi e con la cautela dell’Ispettorato (${theme})`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await preparePage(context,{theme}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/specie/edulis');
 const card=page.locator('.view:not([hidden]) .fungus-page');await expect(card.locator('h1')).toBeVisible();
 const okBg=await tokenColor(page,'--ok-bg','backgroundColor'),okInk=await tokenColor(page,'--ok-ink');
 // F1: testata con l'etichetta a vocabolario chiuso, mai «ottimo» o «buono»
 const badges=card.locator('.sp-badges .pill');
 await expect(badges.first()).toHaveText('commestibile');
 for(const b of await badges.all())await expect(b).not.toHaveText(/ottim|buon[oa]\b/i);
 // F3: anello neutro attorno al fungo di riferimento
 expect(await style(card.locator('.cc-th.ref'),'boxShadow')).not.toContain(okInk);
 // F2: le etichette dei sosia non usano il verde
 for(const t of await card.locator('.look .tox').all())expect(await style(t,'backgroundColor')).not.toBe(okBg);
 // F7: avviso unico, chiuso, con lo scudo e il «!»
 const safety=card.locator('.species-safety');
 await expect(safety).toHaveCount(1);await expect(safety).not.toHaveAttribute('open');
 await expect(safety).toContainText('Ispettorato');
 await expect(safety.locator('summary svg path').nth(1)).toHaveAttribute('d','M12 8v5M12 16h.01');

 // F4-F5: il sosia Laccaria amethystina di nuda ha etichetta e colore di species-traits («con cautela»)
 await page.goto('/#/specie/nuda');
 const laccaria=page.locator('.view:not([hidden]) .look li',{hasText:'Laccaria amethystina'});
 await expect(laccaria).toHaveClass(/tox-commestibile-con-cautela/);
 const caution=laccaria.locator('.tox');await expect(caution).toHaveText('commestibile con cautela');
 expect(await style(caution,'backgroundColor')).toBe(await tokenColor(page,'--surface-2','backgroundColor'));
 expect(await style(caution,'boxShadow')).toContain(await tokenColor(page,'--warn-ink'));
 expect(await caution.evaluate(e=>getComputedStyle(e,'::before').content)).toMatch(/!/);
 await expect(page.locator('.view:not([hidden]) .sp-badges .pill.caution i')).toHaveText('!');
 // la didascalia della foto ingrandita del sosia ha anello e «!» nell'ambra chiaro delle foto (fondo sempre scuro)
 await laccaria.locator('.id-zoom').click();
 const lbTox=page.locator('.lb-cap .tox-commestibile-con-cautela');await expect(lbTox).toBeVisible();
 expect(await style(lbTox,'boxShadow')).toContain(await tokenColor(page,'--photo-warning'));
 expect(await lbTox.evaluate(e=>getComputedStyle(e,'::before').content)).toMatch(/!/);
 await page.keyboard.press('Escape');await expect(page.locator('.lb-cap')).toBeHidden();

 // nel confronto la regola di species-pages.css non toglie l'anello ambra a «con cautela»
 await page.goto('/#/riconosci/confronta/mellea');
 const ref=page.locator('.view:not([hidden]) .cmp-slide:not([hidden]) .cmp-fig.tox-commestibile-con-cautela .tox').first();
 await expect(ref).toHaveText('commestibile solo prebollito');
 expect(await style(ref,'boxShadow')).toContain(await tokenColor(page,'--warn-ink'));
 expect(await ref.evaluate(e=>getComputedStyle(e,'::before').content)).toMatch(/!/);

 // F2: nel confronto «commestibile» ha lo stesso fondo di «non commestibile»
 await page.goto('/#/riconosci/confronta/edulis/tylopilus-felleus');
 const slide=page.locator('#cmp-tylopilus-felleus');await expect(slide).toBeVisible();
 const edible=slide.locator('.cmp-fig.tox-commestibile .tox'),other=slide.locator('.cmp-fig.tox-non-commestibile .tox');
 await expect(edible).toHaveText('commestibile');
 expect(await style(edible,'backgroundColor')).toBe(await style(other,'backgroundColor'));
 await expect(slide.locator('.cmp-verdict')).toContainText('Ispettorato micologico ASL');

 // scheda del catalogo: etichetta neutra e stessa cautela
 await page.goto('/#/commestibile/agaricus-campestris');
 const taxon=page.locator('.view:not([hidden]) .fungus-page');await expect(taxon.locator('h1')).toBeVisible();
 const pill=taxon.locator('.tx-pill');
 await expect(pill).not.toHaveText(/ottim|buon[oa]\b/i);
 expect(await style(pill,'backgroundColor')).not.toBe(okBg);
 await expect(taxon.locator('.species-safety')).toContainText('Ispettorato');

 // F6: Scopri e filtri dell'uscita con etichette neutre e la riga di cautela
 await page.goto('/#/specie');
 await expect(page.locator('.view:not([hidden]) [data-fungi-group="edible"]')).toHaveText('Con usi alimentari documentati');
 await expect(page.locator('.view:not([hidden]) [data-catalog-count="specie"]')).toHaveText(/^\d+ con usi alimentari documentati · \d+ velenosi e sosia$/i);
 await page.goto('/');
 await page.locator('#appbar-home-filters [data-more]:visible,#home-filter-action [data-more]:visible').first().click();
 await expect(page.locator('#full-filters [data-all]')).toHaveText('Tutte le specie del catalogo');
 await expect(page.locator('#full-filters .fp-safety')).toHaveText('Scegli cosa cercare, non cosa mangiare: fai controllare il raccolto all’Ispettorato micologico ASL.');
 expect(errors).toEqual([]);
 await context.close();
});
