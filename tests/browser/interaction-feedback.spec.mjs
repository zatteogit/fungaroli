import {test,expect} from '@playwright/test';
import {preparePage} from '../../tools/visual-audit.mjs';

const visual=el=>{const props=['backgroundColor','color','boxShadow','outlineColor','outlineWidth','outlineOffset','textDecorationLine','textDecorationStyle','textDecorationThickness','opacity'];return JSON.stringify([el,...el.querySelectorAll('h2,h3,.att-more,.glossary-heading-mark')].flatMap(e=>[null,'::after'].map(p=>{const s=getComputedStyle(e,p);return props.map(k=>s[k]);})));};
async function hoverChanges(page,control){
 await control.scrollIntoViewIfNeeded();await page.mouse.move(page.viewportSize().width-1,page.viewportSize().height-1);await page.waitForTimeout(180);const before=await control.evaluate(visual);
 await control.hover();await expect.poll(()=>control.evaluate(visual)).not.toBe(before);
}
async function focusVisible(page,control){
 await page.keyboard.press('Tab');await control.focus();expect(await control.evaluate(e=>e.matches(':focus-visible')&&(parseFloat(getComputedStyle(e).outlineWidth)>0||getComputedStyle(e,'::after').opacity==='1'))).toBe(true);
}

for(const theme of ['light','dark'])test(`ritorno e galleria allineati, hover e pressione: ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme});await page.goto('/#/specie/pinophilus');const gallery=page.locator('.view:not([hidden]) .inline-gallery-controls');await expect(gallery).toBeVisible();
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
  const back=page.locator(width<900?'.appbar-back':'.page-back:not([hidden])'),zoom=page.locator('.view:not([hidden]) .phero-bar .fab');
  const boxes=await Promise.all([back,gallery,zoom].map(l=>l.boundingBox()));const center=r=>r.y+r.height/2;
  expect(Math.abs(center(boxes[1])-center(boxes[2]))).toBeLessThan(1);if(width<900){expect(Math.abs(center(boxes[0])-center(boxes[1]))).toBeLessThan(1);expect(boxes[1].x-(boxes[0].x+boxes[0].width)).toBeGreaterThanOrEqual(4);}
  for(const button of [zoom,...await gallery.locator('button').all()]){
   expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
   const hit=await button.evaluate(e=>{const r=e.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{matched:target?.closest('button')===e,label:e.getAttribute('aria-label'),blockedBy:target?.className};});expect(hit,`${width}px: controllo raggiungibile`).toMatchObject({matched:true});
  }
  await hoverChanges(page,back);await focusVisible(page,back);
 }
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>scrollTo(0,0));const back=page.locator('.appbar-back');await back.hover();await page.waitForTimeout(180);const hover=await back.evaluate(e=>getComputedStyle(e).backgroundColor);await page.mouse.down();await expect.poll(()=>back.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(hover);await page.mouse.move(389,899);await page.mouse.up();
 await page.evaluate(()=>scrollTo(0,750));await page.waitForTimeout(150);await hoverChanges(page,back);await page.evaluate(()=>scrollTo(0,0));
 await gallery.locator('[data-gallery-next]').click();await expect(gallery.locator('[data-gallery-counter]')).toHaveText('2 / 5');const top=await page.evaluate(()=>scrollY);await page.locator('.view:not([hidden]) .phero-bar .fab').click();const lightbox=page.locator('.lb[open]');await expect(lightbox).toBeVisible();await expect(lightbox.locator('.lb-count')).toHaveText('2 / 5');await hoverChanges(page,lightbox.locator('[data-lb="close"]'));await lightbox.locator('[data-lb="close"]').click();await expect(gallery.locator('[data-gallery-counter]')).toHaveText('2 / 5');expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(2);await focusVisible(page,back);await page.keyboard.press('Enter');await expect(page).toHaveURL(/#\/specie$/);await context.close();
});

for(const theme of ['light','dark'])test(`risposta dei controlli nelle schede e nelle sezioni principali: ${theme}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context,{theme});
 await page.goto('/#/specie/pinophilus');await expect(page.locator('.view:not([hidden]) .phero')).toBeVisible();
 for(const selector of ['.phero-img','.sp-strip button[aria-pressed="true"]','.sp-strip button[aria-pressed="false"]','.ts-controls .ts-form[aria-pressed="true"]','.ts-controls .ts-form[aria-pressed="false"]','.attention > summary','.trait-strip .ts-v .glossary-link']){
  const control=page.locator('.view:not([hidden])').locator(selector).first();await hoverChanges(page,control);await focusVisible(page,control);
 }
 const selected=page.locator('.view:not([hidden]) .ts-controls .ts-form[aria-pressed="true"]').first(),marker=await selected.evaluate(e=>getComputedStyle(e).boxShadow);await selected.hover();expect(await selected.evaluate(e=>getComputedStyle(e).boxShadow)).toBe(marker);await expect(selected).toHaveAttribute('aria-pressed','true');
 await page.goto('/');await expect(page.locator('#lazio-explore')).toBeVisible();
 for(const selector of ['.profile-entry','.tabbar a[href="#/mappa"]','a.daily-thought-credit','.editorial-trip-link','.home-notebook-link'])await hoverChanges(page,page.locator(selector).first());
 await page.locator('.appbar [data-open-feedback]').click();const close=page.locator('.feedback-dialog[open] .profile-close');await hoverChanges(page,close);await focusVisible(page,close);await close.click();
 await page.goto('/#/riconosci/confronta/edulis/caloboletus-calopus');for(const selector of ['.appbar-context-action','.cmp-pair-menu'])await hoverChanges(page,page.locator(selector).first());
 await page.goto('/#/zona/vallonina/0');const trail=page.locator('.walk-focus');await trail.locator(':scope > summary').click();await hoverChanges(page,trail.locator('.trail-view-tabs button[aria-selected="false"]').first());
 await page.goto('/#/diario');await hoverChanges(page,page.locator('.notebook-storage > summary'));await context.close();
});

test('galleria touch: controlli raggiungibili e nessun hover persistente',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:740},hasTouch:true,isMobile:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await preparePage(context);await page.goto('/#/specie/pinophilus');const next=page.locator('.view:not([hidden]) [data-gallery-next]');await expect(next).toBeVisible();const before=await next.evaluate(e=>getComputedStyle(e).backgroundColor);await next.tap();await expect(page.locator('.view:not([hidden]) [data-gallery-counter]')).toHaveText('2 / 5');await expect.poll(()=>next.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(before);await context.close();
});
