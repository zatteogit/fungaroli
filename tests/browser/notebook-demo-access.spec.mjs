import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';
for(const role of [null,'member','editor','admin'])test(`proposta del diario di prova: ${role||'anonimo'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);
 await page.addInitScript(()=>localStorage.setItem('fungaroli:install-later',String(Date.now())));
 await page.route('**/api/community/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/community/session',r=>r.fulfill(role?{json:{user:{id:'demo-role-'+role,handle:'Prova',base:null,role}}}:{status:401,json:{error:'Accedi'}}));
 await page.route('**/api/community/summary',r=>r.fulfill({json:{reports:[],observations:[],totalReports:0,updatedAt:new Date().toISOString()}}));
 await page.route('**/api/community/entries',r=>r.fulfill({json:{entries:[]}}));
 await page.goto('/#/diario');await expect(page.locator('#journal-list .diary-empty')).toBeVisible();
 const allowed=['editor','admin'].includes(role);
 await expect(page.locator('.diary-demo-link'))[allowed?'toBeVisible':'toBeHidden']();
 await expect(page.locator('.diary-demo-invite')).toHaveCount(allowed?1:0);
 if(allowed){
  await page.locator('.diary-demo-link').click();await expect(page.locator('.diary-demo-banner')).toBeVisible();
  await page.goto('/#/diario');await page.locator('.profile-entry[data-community-account]').click();
  let finishLogout,logoutCalls=0;
  await page.route('**/api/community/auth/logout',async r=>{
   logoutCalls++;await new Promise(resolve=>{finishLogout=resolve;});
   await r.fulfill(logoutCalls===1?{status:503,json:{error:'Connessione non disponibile. Riprova.'}}:{json:{ok:true}});
  });
  const logout=page.locator('[data-logout]'),status=page.locator('.profile-status');
  await logout.click();await expect(logout).toHaveText('Uscita in corso…');await expect(logout).toBeDisabled();await expect(logout).toHaveAttribute('aria-busy','true');
  await expect(status).toHaveText('Sto chiudendo il profilo…');await expect.poll(()=>logoutCalls).toBe(1);finishLogout();
  await expect(status).toHaveText('Connessione non disponibile. Riprova.');await expect(logout).toBeEnabled();await expect(logout).toHaveText('Esci dal profilo');
  await expect(page.locator('.profile-dialog')).toBeVisible();
  await logout.click();await expect.poll(()=>logoutCalls).toBe(2);await expect(logout).toBeDisabled();finishLogout();
  await expect(page.locator('.profile-dialog')).toBeHidden();await expect(page.locator('#app-toast.on')).toHaveText('Sei uscito dal profilo.');
  await expect(page.locator('.profile-entry[data-community-account]')).toContainText('Accedi');
  await expect(page.locator('.diary-demo-link')).toBeHidden();await expect(page.locator('.diary-demo-invite')).toHaveCount(0);
 }
 await context.close();
});
