import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const width of [320,390])test(`avviso prototipo e cookie con una sola conferma a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('legal-seeded')){localStorage.setItem('fungaroli:legal-accepted','32026-10-16');sessionStorage.setItem('legal-seeded','1');}localStorage.setItem('fungaroli:install-later',String(Date.now()));});
 await page.goto('/');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();
 await expect(dialog.locator('#ob-h')).toBeInViewport();expect(await dialog.evaluate(el=>el.scrollTop)).toBe(0);await expect(page.locator('#views')).toHaveAttribute('inert','');
 await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
 await page.evaluate(()=>document.querySelector('#onboarding').close());await expect(dialog).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-legal-pending','');
 await dialog.locator('#ob-more').tap();await expect(dialog.locator('#ob-legal-details')).toContainText('Privacy e dati');await expect(page.locator('#views')).toHaveAttribute('inert','');await dialog.locator('#ob-more').tap();
 await expect(dialog.locator('#ob-prototype')).toContainText('mio esperimento personale');await expect(dialog.locator('#ob-prototype')).toContainText('esclusivamente per provarla e aiutarmi a migliorare il prototipo');
 await expect(dialog.locator('#ob-cookie-summary')).toContainText('cookie tecnici');await expect(dialog.locator('button')).toHaveCount(1);await expect(dialog.locator('input[type="checkbox"]')).toHaveCount(0);
 await dialog.locator('.ob-data summary').tap();await expect(dialog.locator('#ob-cookie-policy')).toContainText('__Host-fungaroli_challenge');await expect(dialog.locator('#ob-cookie-policy')).toContainText('5 minuti');await expect(dialog.locator('#ob-cookie-policy')).toContainText('30 giorni');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('32026-10-16');
 await dialog.locator('.ob-data summary').tap();await dialog.locator('#ob-accept').tap();await expect(dialog).toBeHidden();expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('42026-10-16');
 const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(receipt.source).toBe('explicit');expect(receipt.noticeHash).toMatch(/^[a-f0-9]{64}$/);expect(Number.isFinite(Date.parse(receipt.acceptedAt))).toBe(true);await expect(page.locator('#views')).not.toHaveAttribute('inert','');
 await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(dialog).toBeHidden();
 await page.goto('/#/info');await expect(page.locator('#info-pilot')).toContainText('esperimento personale');const policy=page.locator('#legal-sections details').filter({hasText:'Cookie policy e memoria del browser'});await policy.locator('summary').click();await expect(policy).toContainText('__Host-fungaroli_session');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);await context.close();
});

test('uno snapshot CMS precedente non nasconde le nuove informative',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.route('**/api/content/v1/snapshot',async route=>{const response=await route.fetch(),snapshot=await response.json(),legal=snapshot.resources.legal;legal.version=3;delete legal.onboarding.prototype_notice;delete legal.onboarding.cookie_summary;legal.info_sections=legal.info_sections.filter(section=>section.id!=='cookie');await route.fulfill({json:snapshot});});
 await page.goto('/');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();await expect(dialog.locator('#ob-prototype')).toContainText('esperimento personale');await dialog.locator('.ob-data summary').click();await expect(dialog.locator('#ob-cookie-policy')).toContainText('__Host-fungaroli_session');await dialog.locator('#ob-accept').click();expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('42026-10-16');await context.close();
});

test('il blocco resta attivo su link diretto e apertura di altre modali',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.goto('/#/specie/edulis');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();
 const blocked=await page.evaluate(async()=>{const probe=document.createElement('dialog');document.body.append(probe);(await import('/js/modal-flow.js')).openModal(probe);const blocked=!probe.open;probe.remove();location.hash='#/diario';return blocked;});expect(blocked).toBe(true);
 await expect(page).toHaveURL(/#\/diario$/);await expect(dialog).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);await context.close();
});

test('ricevuta sincronizzata al profilo soltanto dopo la conferma',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null}),receipts=[];
 await page.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'audit-user',handle:'Nome',role:'member'}}}));
 await page.route('**/api/community/legal-acceptance',async r=>{receipts.push(r.request().postDataJSON());await r.fulfill({json:{receipt:receipts.at(-1)}});});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();expect(receipts).toHaveLength(0);await page.locator('#ob-accept').click();await expect.poll(()=>receipts.length).toBe(1);
 expect(receipts[0]).toMatchObject({accountId:'audit-user',version:'42026-10-16',source:'explicit',platform:'browser'});expect(receipts[0].noticeHash).toMatch(/^[a-f0-9]{64}$/);await context.close();
});

test('memoria bloccata: conferma per questa apertura, nuova richiesta al riavvio',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('fungaroli:legal-'))throw new DOMException('blocked','SecurityError');return set.call(this,key,value);};});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();await expect(page.locator('#views')).not.toHaveAttribute('inert','');await expect(page.locator('.app-toast.on')).toContainText('questa apertura');
 await page.reload();await expect(page.locator('#onboarding')).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');await context.close();
});

for(const standalone of [false,true])test(`condizioni e installazione fullscreen: ${standalone?'app installata':'Safari'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:660},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1',hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.addInitScript(value=>Object.defineProperty(navigator,'standalone',{value}),standalone);await page.goto('/');const onboarding=page.locator('#onboarding');await expect(onboarding).toBeVisible();await expect(page.locator('#install-invite[open]')).toHaveCount(0);
 await page.locator('#ob-accept').tap();await expect(onboarding).toBeHidden();const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(receipt.platform).toBe(standalone?'standalone':'browser');
 if(!standalone){const install=page.locator('#install-invite');await expect(install).toBeVisible();await expect(page.locator('dialog[open]:modal')).toHaveCount(1);await install.locator('.iv-close').tap();await expect(install).toBeHidden();}else{await expect(page.locator('#install-invite[open]')).toHaveCount(0);}
 await expect(page.locator('#views')).not.toHaveAttribute('inert','');await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(onboarding).toBeHidden();await expect(page.locator('#install-invite[open]')).toHaveCount(0);await context.close();
});

test('testi diversi con la stessa versione richiedono una nuova conferma senza riscrivere la ricevuta precedente',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});let changed=false;
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.route('**/api/content/v1/snapshot',async route=>{const response=await route.fetch(),snapshot=await response.json();if(changed)snapshot.resources.legal.onboarding.prototype_notice+=' Testo aggiornato per la prova.';await route.fulfill({json:snapshot});});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));
 changed=true;await page.reload();await expect(page.locator('#onboarding')).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')))).toEqual(before);
 await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(after.version).toBe(before.version);expect(after.noticeHash).not.toBe(before.noticeHash);await context.close();
});
