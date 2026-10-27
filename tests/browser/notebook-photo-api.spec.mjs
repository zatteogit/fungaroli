import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
import {randomBytes} from 'node:crypto';
// Il profilo e l’azione Annota sono nel Taccuino nel layout corrente.
test('ritrovamento fotografico: profilo, API privata e riapertura sincronizzata',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block',reducedMotion:'reduce',extraHTTPHeaders:{'CF-Connecting-IP':'fd00:'+randomBytes(14).toString('hex').match(/.{4}/g).join(':')}}),page=await preparePage(context);await page.goto('/#/diario');
 const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 await page.locator('.appbar [data-community-account]').click();await page.locator('[data-handle]').fill('Foto di campo');await page.locator('[data-register]').click();await expect(page.locator('dialog.community-dialog[open]')).toHaveCount(0);
 await page.locator('.diary-header-actions [data-annotate]').click();const dialog=page.locator('.notebook-dialog[open]');await dialog.locator('[data-quick-photo]').setInputFiles(new URL('../../assets/species/caesarea-inat2.jpg',import.meta.url).pathname);await expect(dialog.locator('.quick-photo img')).toBeVisible();
 await dialog.getByRole('button',{name:'Salva nel taccuino'}).click();await expect(page).toHaveURL(/#\/diario\/pagina\//);await expect(page.locator('.diary-detail-photo.is-personal img')).toBeVisible();
 const entries=await page.evaluate(async()=>{const r=await fetch('/api/community/entries');if(!r.ok)throw Error('Archivio non disponibile');return (await r.json()).entries;});expect(entries).toHaveLength(1);expect(entries[0].photo.data).toMatch(/^data:image\/jpeg;base64,/);expect(atob(entries[0].photo.data.split(',')[1]).includes('\xff\xe1')).toBe(false);expect(entries[0].reference).toBeNull();expect(entries[0].shared).toBe(false);expect(JSON.stringify(entries[0]).length).toBeLessThan(250_000);
 await page.reload();await expect(page.locator('.diary-detail-photo.is-personal img')).toBeVisible();
 const stranger=await browser.newContext(),p=await stranger.newPage();const response=await p.request.get(new URL('/api/community/entries',page.url()).href);expect(response.status()).toBe(401);await stranger.close();
 const deleted=await page.evaluate(async id=>(await fetch('/api/community/entries/'+id,{method:'DELETE'})).status,entries[0].id);expect(deleted).toBe(200);await context.close();
});
