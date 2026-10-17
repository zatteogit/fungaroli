export async function mapToggle(page, id) {
  const panel=page.locator('#full-filters');
  await page.locator('#map-filters [data-more]').click();
  await panel.locator(`[data-intent="${id}"]`).click();
  await panel.locator('[data-close]').last().click();
}
export async function mapLegend(page) {
  const layers=page.locator('.mapctl [data-act="layers"]').first();
  if(await layers.count()) { if(!await page.locator('.mapctl-panel').isVisible())await layers.click(); }
  else if(!await page.locator('.legend-box > summary').isVisible())await page.locator('#map-results > summary').click();
  if(await page.locator('.legend-box').getAttribute('open')===null)await page.locator('.legend-box > summary').click();
}
