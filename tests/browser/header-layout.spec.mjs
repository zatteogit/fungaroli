import {test,expect} from '@playwright/test';
for(const width of [320,390,768,1280])test(`filtri della testata contenuti e preferenze attive rimovibili a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'No forecast needed for header layout'}}));
  await page.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({avoidCrowd:true,preferComfort:true,distancePenalty:true}));});
  await page.goto('/');const header=page.locator('#active-filters'),prefs=header.locator('[data-p]'),filters=page.locator('#appbar-home-filters [data-more]:visible,#home-filter-action [data-more]:visible').first();await expect(prefs).toHaveCount(3);await expect(filters).toHaveAccessibleName(/Filtri avanzati/);await expect(filters).toContainText('Filtri');for(const pref of await prefs.all())await expect(pref).toHaveAttribute('aria-pressed','true');
  await expect(filters).toBeInViewport();
  const geometry=()=>header.evaluate(e=>{
    const r=e.getBoundingClientRect(),buttons=[...e.querySelectorAll('[data-p]')].map(b=>b.getBoundingClientRect());
    return {height:r.height,centers:[...new Set(buttons.map(b=>Math.round((b.top+b.bottom)/2)))],fits:buttons.every(b=>b.left>=r.left&&b.right<=r.right+1),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  await expect.poll(async()=>{const g=await geometry();return g.fits&&!g.overflow&&g.centers.length<=(width<400?2:1)&&g.height<190;}).toBe(true);
  await header.getByRole('button',{name:'Accesso comodo',exact:true}).click();await expect(header.locator('[data-p="preferComfort"]')).toHaveCount(0);
  await filters.click();const preferences=page.locator('#full-filters[open]');await preferences.getByRole('button',{name:'Accesso comodo',exact:true}).click();await preferences.locator('[data-close]').first().click();
  await expect(header.locator('[data-p="preferComfort"]')).toHaveAttribute('aria-pressed','true');
  await expect(header.locator('[data-p="preferComfort"] .pref-icon')).toBeHidden();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:prefs:v2')).preferComfort)).toBe(true);
  await page.screenshot({path:`/tmp/fungaroli-header-${width}.png`});
  await filters.click();const panel=page.locator('#full-filters[open]');await expect(panel).toBeVisible();await expect(panel.getByRole('button',{name:'Vicino a me',exact:true})).toHaveAttribute('aria-pressed','true');await panel.locator('[data-close]').first().click();
  await expect.poll(async()=>{const g=await geometry();return g.fits&&!g.overflow&&g.centers.length<=(width<400?2:1)&&g.height<190;}).toBe(true);expect(errors).toEqual([]);
});
for(const width of [320,390,768])for(const theme of ['light','dark'])for(const route of ['/#/fungo/mellea','/#/pianta/fragolina','/#/pianta/finocchietto'])test(`titolo scheda senza sovrapposizioni ${route} ${theme} a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'test'}}));
 await page.addInitScript(theme=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:theme',theme);localStorage.setItem('fungaroli:install-later',String(Date.now()));},theme);
 await page.goto(route);
 await expect(page.locator('body')).not.toHaveAttribute('data-legal-pending','');
 const heading=page.locator('.view:not([hidden]) .phero-title'),bar=page.locator('.appbar-title'),back=page.locator('.appbar-back');
 await expect(heading).toBeVisible();await expect(bar).toHaveText(await heading.innerText());
 await expect(bar).toHaveCSS('opacity','0');await expect(back.locator('span')).toBeVisible();
 // Il profilo autenticato usa la stessa area tattile dell'accesso anonimo.
 await page.locator('.profile-entry').evaluate(el=>{el.classList.add('is-user');el.dataset.initial='M';});
 await page.evaluate(()=>scrollTo(0,650));await expect(bar).toHaveCSS('opacity','1');
 const geometry=await bar.evaluate(el=>{
   const r=el.getBoundingClientRect(),back=document.querySelector('.appbar-back').getBoundingClientRect(),actions=document.querySelector('.appbar-actions').getBoundingClientRect();
   const controls=[document.querySelector('.appbar-back'),...document.querySelectorAll('.appbar-actions > button,.appbar-actions > a:not([hidden])')].filter(b=>b.getBoundingClientRect().width);
   return {backRight:back.right,left:r.left,right:r.right,actionsLeft:actions.width?actions.left:innerWidth,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth,
     controls:controls.map(b=>{const x=b.getBoundingClientRect();return {width:x.width,height:x.height,reachable:b.contains(document.elementFromPoint(x.left+x.width/2,x.top+x.height/2))};})};
 });
 expect(geometry.backRight+7).toBeLessThanOrEqual(geometry.left);
 expect(geometry.right+7).toBeLessThanOrEqual(geometry.actionsLeft);
 expect(geometry.width).toBeGreaterThan(60);expect(geometry.overflow).toBe(false);
 for(const control of geometry.controls){expect(control.width).toBeGreaterThanOrEqual(44);expect(control.height).toBeGreaterThanOrEqual(44);expect(control.reachable).toBe(true);}
 await expect(bar).toHaveCSS('text-overflow','ellipsis');await expect(back).toHaveAccessibleName(/Indietro:/);
 await expect(back.locator('span')).toBeHidden();
 if(width===390&&route.includes('fragolina'))await page.screenshot({path:`/tmp/fronda-sticky-title-${theme}.png`});
 await page.evaluate(()=>scrollTo(0,0));await expect(bar).toHaveCSS('opacity','0');await expect(back.locator('span')).toBeVisible();
});
