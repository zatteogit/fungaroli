import{test,expect}from'@playwright/test';import{preparePage}from'../../tools/visual-audit.mjs';
const KEY='fungaroli:legal-accepted',PROOF='fungaroli:legal-acceptance:v1';
test('CGS: copy e release non chiedono di nuovo; una revisione sostanziale sì',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{legal:null});
 await page.goto('/');const dialog=page.locator('#onboarding'),button=dialog.locator('#ob-accept');await expect(dialog).toBeVisible();await expect(button).toBeInViewport();
 const isVisible=()=>button.evaluate(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});expect(await isVisible()).toBe(true);
 await dialog.evaluate(d=>{d.scrollTop=d.scrollHeight/2;});expect(await isVisible()).toBe(true);await button.click();await expect(dialog).toBeHidden();
 const original=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PROOF);expect(original.version).toBe('cgs-1');
 let material=false;await page.route('**/api/content/v1/snapshot',async route=>{const response=await route.fetch(),snapshot=await response.json(),legal=snapshot.resources.legal;legal.version+=1;legal.verified_on='2026-10-21';legal.onboarding.subtitle='Testo editoriale aggiornato';if(material)legal.acceptance_version=2;await route.fulfill({json:snapshot});});
 await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(dialog).toBeHidden();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PROOF)).toEqual(original);
 material=true;await page.reload();await expect(dialog).toBeVisible();await expect(page.locator('#views')).toHaveAttribute('inert','');expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe('cgs-1');
 await button.click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PROOF)).toMatchObject({version:'cgs-2',source:'explicit'});await context.close();
});
test('CGS: migrazione compatibile conserva data e impronta della vecchia accettazione',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{legal:null});
 const proof={version:'62026-10-20',acceptedAt:'2026-10-20T10:00:00.000Z',noticeHash:'a'.repeat(64),source:'explicit',platform:'browser'};
 await page.addInitScript(([key,storage,value])=>{if(!localStorage.getItem(key)){localStorage.setItem(key,value.version);localStorage.setItem(storage,JSON.stringify(value));}},[KEY,PROOF,proof]);
 await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#onboarding')).toBeHidden();
 expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe('cgs-1');expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PROOF)).toEqual({...proof,acceptanceVersion:'cgs-1'});
 await page.reload();await expect(page.locator('#hero .cover-link')).toBeVisible();await expect(page.locator('#onboarding')).toBeHidden();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),PROOF)).toEqual({...proof,acceptanceVersion:'cgs-1'});await context.close();
});
