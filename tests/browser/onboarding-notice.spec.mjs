import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
import {readFileSync} from 'node:fs';
import {CONTENT_RESOURCES} from '../../js/content-schema.js';
test('studio dell’indice: ospite escluso e rinvio separato per profilo',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:740},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 let account=null,writes=0;
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill(account?{json:{user:{id:account,handle:'Prova',role:'member',research:{granted:false,version:null,since:null}}}}:{status:401,json:{error:'Accedi'}}));
 await page.route('**/api/community/summary',r=>r.fulfill({json:{access:'locked',reports:[],observations:[]}}));
 await page.route('**/api/community/research-consent',r=>{writes++;return r.fulfill({status:500,json:{error:'Non deve essere salvato nulla'}});});
 await page.goto('/#/diario');await expect(page.locator('#journal-list .diary-empty')).toBeVisible();await page.waitForTimeout(900);await expect(page.locator('#research-consent-invite')).toBeHidden();
 account='first-account';await page.reload();const invite=page.locator('#research-consent-invite');await expect(invite).toBeVisible();
 expect(await invite.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(false);await page.keyboard.press('Escape');await expect(invite).toBeHidden();
 await page.reload();await expect(page.locator('#journal-list .diary-empty')).toBeVisible();await page.waitForTimeout(900);await expect(invite).toBeHidden();
 account='second-account';await page.reload();await expect(invite).toBeVisible();await invite.locator('[data-later]').click();expect(writes).toBe(0);
 await context.close();
});
for(const granted of [false,true])test(`studio dell’indice alla prima occasione libera: ${granted?'consenso':'rifiuto'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context);
 let research={granted:false,version:null,since:null},writes=0,finish;
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'research-user',handle:'Prova',role:'member',research}}}));
 await page.route('**/api/community/summary',r=>r.fulfill({json:{access:'locked',reports:[],observations:[]}}));
 await page.route('**/api/community/research-consent',async r=>{
  writes++;await new Promise(resolve=>finish=resolve);
  if(writes===1)return r.fulfill({status:503,json:{error:'Scelta non salvata. Riprova.'}});
  research={granted:r.request().postDataJSON().granted,version:'fronda-research-v1',since:new Date().toISOString()};await r.fulfill({json:{research}});
 });
 await page.addInitScript(async()=>{
  // Un percorso già aperto deve finire prima dell'invito.
  addEventListener('fronda:boot-ready',async()=>{const dialog=document.createElement('dialog');dialog.id='research-blocker';dialog.innerHTML='<button>Chiudi percorso</button>';document.body.append(dialog);(await import('/js/modal-flow.js')).openModal(dialog);dialog.querySelector('button').onclick=()=>dialog.close();},{once:true});
 });
 await page.goto('/#/diario');const invite=page.locator('#research-consent-invite');
 await expect(page.locator('#research-blocker')).toBeVisible();await expect(invite).toBeHidden();expect(writes).toBe(0);
 await page.getByRole('button',{name:'Chiudi percorso'}).click();await expect(invite).toBeVisible();
 await expect(invite).toContainText('Gli appunti privati restano fuori');await expect(invite.locator('[data-choice]')).toHaveCount(2);
 const choice=invite.locator(`[data-choice="${granted}"]`);await choice.click();await expect(invite).toHaveAttribute('aria-busy','true');await expect(choice).toBeDisabled();await expect.poll(()=>writes).toBe(1);finish();
 await expect(invite.locator('[data-status]')).toHaveText('Scelta non salvata. Riprova.');await expect(choice).toBeEnabled();
 await choice.click();await expect.poll(()=>writes).toBe(2);finish();await expect(invite).toBeHidden();
 await page.reload();await expect(page.locator('#research-blocker')).toBeVisible();await page.getByRole('button',{name:'Chiudi percorso'}).click();
 await page.locator('.profile-entry[data-community-account]').click();if(granted)await expect(page.locator('[data-research-switch]')).toBeChecked();else await expect(page.locator('[data-research-switch]')).not.toBeChecked();
 await page.locator('.profile-dialog [data-close]').first().click();await page.waitForTimeout(900);await expect(invite).toBeHidden();expect(writes).toBe(2);
 await context.close();
});
for(const width of [320,390])test(`avviso prototipo e cookie con una sola conferma a ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('legal-seeded')){localStorage.setItem('fungaroli:legal-accepted','32026-10-16');sessionStorage.setItem('legal-seeded','1');}localStorage.setItem('fungaroli:install-later',String(Date.now()));});
 await page.goto('/');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();
 await expect(dialog.locator('#ob-h')).toBeInViewport();expect(await dialog.evaluate(el=>el.scrollTop)).toBe(0);await expect(page.locator('#views')).toHaveAttribute('inert','');
 await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
 await page.evaluate(()=>document.querySelector('#onboarding').close());await expect(dialog).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-legal-pending','');
 await dialog.locator('#ob-more').tap();await expect(dialog.locator('#ob-legal-details')).toContainText('Privacy e dati');await expect(page.locator('#views')).toHaveAttribute('inert','');await dialog.locator('#ob-more').tap();
 await expect(dialog.locator('#ob-prototype')).toContainText('esperimento personale di Matteo Sgambato');await expect(dialog.locator('#ob-prototype')).toContainText('piccolo gruppo di persone invitate');
 await expect(dialog.locator('#ob-cookie-summary')).toContainText('cookie tecnici');await expect(dialog.locator('button')).toHaveCount(1);await expect(dialog.locator('input[type="checkbox"]')).toHaveCount(2);await expect(dialog.locator('#ob-share')).not.toBeChecked();await expect(dialog.locator('#ob-research')).not.toBeChecked();
 await dialog.locator('.ob-data summary').tap();await expect(dialog.locator('#ob-cookie-policy')).toContainText('__Host-fungaroli_challenge');await expect(dialog.locator('#ob-cookie-policy')).toContainText('5 minuti');await expect(dialog.locator('#ob-cookie-policy')).toContainText('30 giorni');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);
 expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('32026-10-16');
 await dialog.locator('.ob-data summary').tap();await dialog.locator('#ob-accept').tap();await expect(dialog).toBeHidden();expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('cgs-1');
 const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(receipt.source).toBe('explicit');expect(receipt.noticeHash).toMatch(/^[a-f0-9]{64}$/);expect(Number.isFinite(Date.parse(receipt.acceptedAt))).toBe(true);await expect(page.locator('#views')).not.toHaveAttribute('inert','');
 await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(dialog).toBeHidden();
 await page.goto('/#/info');await expect(page.locator('#info-pilot')).toContainText('esperimento personale');const policy=page.locator('#legal-sections details').filter({hasText:'Cookie policy e memoria del browser'});await policy.locator('summary').click();await expect(policy).toContainText('__Host-fungaroli_session');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);await context.close();
});

test('uno snapshot CMS precedente non nasconde le nuove informative',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.route('**/api/content/v1/snapshot',async route=>{const response=await route.fetch(),snapshot=await response.json(),legal=snapshot.resources.legal;legal.version=3;delete legal.onboarding.prototype_notice;delete legal.onboarding.cookie_summary;legal.info_sections=legal.info_sections.filter(section=>section.id!=='cookie');await route.fulfill({json:snapshot});});
 await page.goto('/');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();await expect(dialog.locator('#ob-prototype')).toContainText('esperimento personale');await dialog.locator('.ob-data summary').click();await expect(dialog.locator('#ob-cookie-policy')).toContainText('__Host-fungaroli_session');await dialog.locator('#ob-accept').click();expect(await page.evaluate(()=>localStorage.getItem('fungaroli:legal-accepted'))).toBe('cgs-1');await context.close();
});

test('il blocco resta attivo su link diretto e apertura di altre modali',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.goto('/#/specie/edulis');const dialog=page.locator('#onboarding');await expect(dialog).toBeVisible();
 const blocked=await page.evaluate(async()=>{const probe=document.createElement('dialog');document.body.append(probe);(await import('/js/modal-flow.js')).openModal(probe);const blocked=!probe.open;probe.remove();location.hash='#/diario';return blocked;});expect(blocked).toBe(true);
 await expect(page).toHaveURL(/#\/diario$/);await expect(dialog).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');await expect(page.locator('dialog[open]:modal')).toHaveCount(1);await context.close();
});

test('ricevuta sincronizzata al profilo soltanto dopo la conferma',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null}),receipts=[];
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill({json:{user:{id:'audit-user',handle:'Nome',role:'member'}}}));
 await page.route('**/api/community/legal-acceptance',async r=>{receipts.push(r.request().postDataJSON());await r.fulfill({json:{receipt:receipts.at(-1)}});});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();expect(receipts).toHaveLength(0);await page.locator('#ob-accept').click();await expect.poll(()=>receipts.length).toBe(1);
 expect(receipts[0]).toMatchObject({accountId:'audit-user',version:'cgs-1',source:'explicit',platform:'browser'});expect(receipts[0].noticeHash).toMatch(/^[a-f0-9]{64}$/);await context.close();
});

test('memoria bloccata: conferma per questa apertura, nuova richiesta al riavvio',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('fungaroli:legal-'))throw new DOMException('blocked','SecurityError');return set.call(this,key,value);};});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();await expect(page.locator('#views')).not.toHaveAttribute('inert','');await expect(page.locator('.app-toast.on')).toContainText('questa apertura');
 await page.reload();await expect(page.locator('#onboarding')).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');await context.close();
});

for(const standalone of [false,true])test(`installazione facoltativa dal terzo utilizzo: ${standalone?'app installata':'Safari'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:660},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1',hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});
 await page.addInitScript(value=>Object.defineProperty(navigator,'standalone',{value}),standalone);await page.goto('/');const onboarding=page.locator('#onboarding');await expect(onboarding).toBeVisible();await expect(page.locator('#install-invite[open]')).toHaveCount(0);
 await page.locator('#ob-accept').tap();await expect(onboarding).toBeHidden();const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(receipt.platform).toBe(standalone?'standalone':'browser');
 await expect(page.locator('#install-invite[open]')).toHaveCount(0);await expect(page.locator('#install-banner')).toBeHidden();
 await expect(page.locator('#views')).not.toHaveAttribute('inert','');await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(onboarding).toBeHidden();await expect(page.locator('#install-invite[open]')).toHaveCount(0);
 if(!standalone){
  const uses=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:install-uses:v1')));
  expect((await uses()).count).toBe(1);
  await page.addInitScript(()=>{const key='fungaroli:install-uses:v1',state=JSON.parse(localStorage.getItem(key));if(state){state.lastSeen=Date.now()-31*60e3;localStorage.setItem(key,JSON.stringify(state));}});
  for(const count of [2,3]){
   await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();expect((await uses()).count).toBe(count);
   await expect(page.locator('#install-invite[open]')).toHaveCount(0);
   await expect(page.locator('#install-banner'))[count===3?'toBeVisible':'toBeHidden']();
  }
  await page.locator('#install-banner [data-install]').tap();await expect(page.locator('#install-invite')).toBeVisible();await page.locator('#install-invite .iv-close').tap();
  await page.locator('#install-banner .ib-close').tap();await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#install-banner')).toBeHidden();
 }
 await page.goto('/#/info');await expect(page.locator('#install-info'))[standalone?'toBeHidden':'toBeVisible']();
 await context.close();
});

test('testi aggiornati conservano la ricevuta; una revisione delle CGS richiede una nuova conferma',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await preparePage(context,{legal:null});let changed=false,revision=false;
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.route('**/api/content/v1/snapshot',async route=>{const response=await route.fetch(),snapshot=response.ok()?await response.json():{schemaVersion:1,resources:Object.fromEntries(CONTENT_RESOURCES.map(r=>[r.id,JSON.parse(readFileSync(new URL(`../../data/${r.id}.json`,import.meta.url),'utf8'))]))};if(changed)snapshot.resources.legal.onboarding.prototype_notice+=' Testo aggiornato per la prova.';if(revision)snapshot.resources.legal.acceptance_version=2;await route.fulfill({json:snapshot});});
 await page.goto('/');await expect(page.locator('#onboarding')).toBeVisible();await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));
 changed=true;await page.reload();await expect(page.locator('#onboarding')).toBeHidden();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')))).toEqual(before);
 revision=true;await page.reload();await expect(page.locator('#onboarding')).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')))).toEqual(before);
 await page.locator('#ob-accept').click();await expect(page.locator('#onboarding')).toBeHidden();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:legal-acceptance:v1')));expect(after.version).toBe('cgs-2');expect(after.noticeHash).not.toBe(before.noticeHash);await context.close();
});
