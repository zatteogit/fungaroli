import {test, expect} from '@playwright/test';
const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1';
async function open(browser, userAgent=safari, viewport={width:390,height:660}) {
  const context=await browser.newContext({userAgent,viewport,serviceWorkers:'block'});
  const page=await context.newPage();
  // Real install module and styles, isolated from onboarding/network and native install availability.
  await page.route('**/install-check', route=>route.fulfill({contentType:'text/html',body:`
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/tokens.css">
    <link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/fronda.css">
    <div id="install-info"></div><script>window.FUNGAROLI_DATA={};window.FUNGAROLI_TEST_INSTALL=true;</script>
    <script type="module">import {initInstall} from '/js/install.js';initInstall();</script>`}));
  await page.goto('/install-check');
  await page.locator('[data-install]').click();
  return {context,page};
}
const closeVisible=async page=>{
  const box=await page.locator('.iv-close').boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await page.locator('.iv-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
};
test('chiusura accessibile con barre aperte, scroll interno, resize e orientamento',async({browser})=>{
  const {context,page}=await open(browser);
  for(const viewport of [{width:390,height:660},{width:320,height:480},{width:844,height:390},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    await closeVisible(page);
    await page.locator('.iv-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
    await closeVisible(page);
    await page.locator('.iv-later').click();
    await expect(page.locator('dialog')).not.toBeVisible();
    await page.locator('[data-install]').click();
    await expect(page.locator('.iv-close')).toBeFocused();
  }
  const steps=page.locator('.iv-steps li');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(1)).toHaveText('Tocca Condividi');
  await expect(steps.nth(1).locator('svg')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await context.close();
});
test('segue visualViewport ridotto e spostato senza nascondere la X',async({browser})=>{
  const {context,page}=await open(browser);
  await page.evaluate(()=>{
    Object.defineProperty(window,'visualViewport',{configurable:true,value:{height:410,width:340,offsetTop:35,offsetLeft:12}});
    dispatchEvent(new Event('resize'));
  });
  await expect.poll(async()=>{const box=await page.locator('dialog').boundingBox();return {x:box.x,y:box.y,height:box.height,width:box.width};}).toEqual({x:12,y:35,height:410,width:340});
  await closeVisible(page);await page.locator('.iv-close').click();await context.close();
});
for(const [token,browserName] of [['CriOS','Chrome'],['FxiOS','browser'],['EdgiOS','browser']]) {
  test(`iOS ${token} non è classificato come browser interno`,async({browser})=>{
    const ua=`Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 ${token}/150.0 Mobile/15E148`;
    const {context,page}=await open(browser,ua);
    await expect(page.locator('.iv-t')).toContainText(browserName);
    await expect(page.locator('[data-copy]')).toHaveCount(0);
    await context.close();
  });
}
