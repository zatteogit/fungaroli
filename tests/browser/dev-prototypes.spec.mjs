import {test,expect} from '@playwright/test';

test('le prove sono pubblicate e i Preferiti restano temporanei',async({page})=>{
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  const response=await page.goto('/dev/');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-robots-tag']).toContain('noindex');
  expect(response.headers()['cache-control']).toContain('no-store');
  await page.getByRole('link',{name:'Prova i Preferiti'}).click();
  await expect(page.getByRole('heading',{name:'Qualcosa da ritrovare.'})).toBeVisible();
  for(const image of await page.locator('img').all()){
    await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  }
  await page.locator('[data-save="outing"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Apri i Preferiti',exact:true}).click();
  await expect(page.locator('#collection')).toContainText('Valle di Canneto');
  await page.reload();
  await expect(page.locator('[data-save="outing"]')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('link',{name:'Tutte le prove',exact:false}).click();
  await expect(page).toHaveURL(/\/dev\/$/);
  expect(failures).toEqual([]);
});
