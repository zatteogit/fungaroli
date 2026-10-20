import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {preparePage, auditState} from '../../tools/visual-audit.mjs';

test('frase compatta nei due temi: non sposta hero e proposte, resta stabile al reload', async ({browser}) => {
  const context = await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
  const page = await preparePage(context);
  await page.goto('/');
  const card = page.locator('#daily-thought');
  await expect(card).toBeVisible();
  const id = await card.getAttribute('data-thought-id');
  await expect(page.locator('#hero .cover')).toBeVisible();
  expect(await card.evaluate(e => Boolean(document.querySelector('.home-alternatives').compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const heroTop = await page.locator('#hero').evaluate(e => e.getBoundingClientRect().top);
  await card.evaluate(e => e.hidden = true);
  expect(await page.locator('#hero').evaluate(e => e.getBoundingClientRect().top)).toBe(heroTop);
  await card.evaluate(e => e.hidden = false);
  for (const theme of ['light','dark']) for (const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
    expect(await card.evaluate(e => e.getBoundingClientRect().height)).toBeLessThan(145);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const readings = await auditState(page,{root:'#daily-thought'});
    expect(readings.length).toBeGreaterThan(0);
    expect(readings.filter(r => !r.disabled && !r.decorative && r.ratio < r.threshold)).toEqual([]);
    if (width === 390 || width === 1280) await card.screenshot({path:`../output/playwright/fronda-daily-${width}-${theme}.png`});
  }
  await page.reload();
  await expect(card).toHaveAttribute('data-thought-id', id);
  await context.close();
});

test('archivio non disponibile: la home resta utilizzabile senza card vuota', async ({browser}) => {
  const context = await browser.newContext({serviceWorkers:'block'});
  const page = await preparePage(context);
  await page.route('**/data/daily-thoughts.json', route => route.fulfill({status:503,body:'unavailable'}));
  await page.route('**/api/content/v1/snapshot', route => route.fulfill({status:503,body:'unavailable'}));
  await page.goto('/');
  await expect(page.locator('#hero .cover')).toBeVisible();
  await expect(page.locator('#daily-thought')).toBeHidden();
  await context.close();
});

test('la home usa la frase pubblicata dal CMS prima del seed JSON', async ({browser}) => {
  const context = await browser.newContext({serviceWorkers:'block'});
  const page = await preparePage(context);
  const read = id => JSON.parse(readFileSync(new URL(`../../data/${id}.json`, import.meta.url)));
  const resources = Object.fromEntries(['zones','habitat','species-traits','edible-catalog','guides','legal','daily-thoughts'].map(id => [id,read(id)]));
  resources['daily-thoughts'].items = [{...resources['daily-thoughts'].items[0],text:'Una pausa pubblicata dalla Redazione.'}];
  await page.route('**/api/content/v1/snapshot', route => route.fulfill({json:{schemaVersion:1,resources}}));
  let fallback = false;
  await page.route('**/data/daily-thoughts.json', route => { fallback = true; return route.abort(); });
  await page.goto('/');
  await expect(page.locator('#daily-thought')).toContainText('Una pausa pubblicata dalla Redazione.');
  expect(fallback).toBe(false);
  await context.close();
});
