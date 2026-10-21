import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390,768])for(const theme of ['light','dark'])test(`Animali: rail, scheda, fonti e back ${width} ${theme}`,async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const page=await preparePage(context,{theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${baseURL}/#/animali`);await expect(page.locator('.animal-card')).toHaveCount(27);
 const nav=page.locator('[data-view="animali"] [data-scopri-nav]');await expect(nav.locator('a')).toHaveCount(5);await expect(nav.locator('[aria-current="page"]')).toHaveText('Animali');
 await expect(page.locator('.tabbar [aria-current="page"]')).toContainText('Scopri');
 await page.getByRole('button',{name:'Sui fiori',exact:true}).click();await expect(page.locator('.animal-card')).toHaveCount(7);
 await page.getByRole('link',{name:/Sirfidi.*Esplora/}).click();await expect(page.locator('#animal-detail h1')).toHaveText('Sirfidi');
 await expect(page.locator('#animal-detail').getByRole('button',{name:'Annota un’osservazione'})).toBeVisible();
 await expect(page.locator('#animal-detail').getByRole('link',{name:'Apri il tuo taccuino',exact:false})).toBeVisible();
 const source=page.locator('#animal-detail [data-animal-source]').first();const target=await source.boundingBox();expect(target.width).toBeGreaterThanOrEqual(24);expect(target.height).toBeGreaterThanOrEqual(24);await source.click();await expect(page).toHaveURL(/#\/animale\/sirfidi$/);await expect(page.locator('#animal-detail li:focus')).toBeVisible();
 await page.goBack();await expect(page.locator('.animal-card')).toHaveCount(7);
 await page.goto(`${baseURL}/#/animale/zecche`);await expect(page.locator('.animal-caution')).toBeVisible();await expect(page.locator('.animal-caution details')).toHaveCount(0);
 await page.goto(`${baseURL}/#/animale/vipera-comune`);await expect(page.locator('#animal-detail h1')).toHaveText('Scheda non disponibile');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await context.close();
});
test('Animali nella ricerca globale, caratteri come seconda scelta e bozze assenti',async({browser,baseURL})=>{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await preparePage(context);
 await page.goto(`${baseURL}/#/animali`);await expect(page.locator('.animal-card')).toHaveCount(27);
 await page.locator('[data-open-search]').first().click();const dialog=page.locator('.search-dlg');const input=dialog.locator('input');await input.fill('sirfidi');await expect(dialog.locator('.sr-group').filter({hasText:'Animali'})).toContainText('Sirfidi');
 await input.fill('paio di ali');await expect(dialog).toContainText('suggerimenti per caratteri');await expect(dialog).toContainText('Sirfidi');
 await input.fill('processionaria');await expect(dialog.locator('.sr-group').filter({hasText:'Animali'})).toHaveCount(0);
 await context.close();
});
