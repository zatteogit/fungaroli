import {test,expect} from '@playwright/test';
for(const width of [320,390,768,1280])test(`filtri della testata compatti con tutte le preferenze attive a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'No forecast needed for header layout'}}));
  await page.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','32026-10-16');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({avoidCrowd:true,preferComfort:true,distancePenalty:true}));});
  await page.goto('/');const header=page.locator('#active-filters'),prefs=header.locator('[data-p]');await expect(prefs).toHaveCount(3);for(const pref of await prefs.all())await expect(pref).toHaveAttribute('aria-pressed','true');
  const geometry=()=>header.evaluate(e=>{
    const r=e.getBoundingClientRect(),buttons=[...e.querySelectorAll('[data-p]')].map(b=>b.getBoundingClientRect());
    return {height:r.height,tops:[...new Set(buttons.map(b=>Math.round(b.top)))],fits:buttons.every(b=>b.left>=r.left&&b.right<=r.right+1),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  await expect.poll(async()=>{const g=await geometry();return g.fits&&!g.overflow&&g.tops.length===1&&g.height<90;}).toBe(true);
  await header.getByRole('button',{name:'Accesso comodo',exact:true}).click();await expect(header.locator('[data-p="preferComfort"]')).toHaveAttribute('aria-pressed','false');
  await header.getByRole('button',{name:'Accesso comodo',exact:true}).click();await expect(header.locator('[data-p="preferComfort"]')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).preferComfort)).toBe(true);
  await page.screenshot({path:`/tmp/fungaroli-header-${width}.png`});
  await header.locator('[data-more]').click();const panel=page.locator('#full-filters[open]');await expect(panel).toBeVisible();await expect(panel.getByRole('button',{name:'Vicino alla base',exact:true})).toHaveAttribute('aria-pressed','true');await panel.locator('[data-close]').first().click();
  await expect.poll(async()=>{const g=await geometry();return g.fits&&!g.overflow&&g.tops.length===1&&g.height<90;}).toBe(true);expect(errors).toEqual([]);
});
for(const width of [320,390,768])test(`titolo scheda nella barra dopo lo scroll a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'test'}}));
 await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','32026-10-16'));
 await page.goto('/#/fungo/mellea');
 const heading=page.locator('.view:not([hidden]) .phero-title'),bar=page.locator('.appbar-title');
 await expect(heading).toBeVisible();await expect(bar).toHaveText(await heading.innerText());
 await expect(bar).toHaveCSS('opacity','0');
 await page.evaluate(()=>scrollTo(0,650));await expect(bar).toHaveCSS('opacity','1');
 const geometry=await bar.evaluate(el=>{const r=el.getBoundingClientRect(),back=document.querySelector('.appbar-back').getBoundingClientRect(),header=document.querySelector('.appbar').getBoundingClientRect();return {center:(r.left+r.right)/2,headerCenter:(header.left+header.right)/2,backRight:back.right,left:r.left};});
 expect(Math.abs(geometry.center-geometry.headerCenter)).toBeLessThan(1);expect(geometry.backRight).toBeLessThanOrEqual(geometry.left);
 await expect(page.locator('.appbar-back span')).toBeVisible();
 await page.evaluate(()=>scrollTo(0,0));await expect(bar).toHaveCSS('opacity','0');
});
