import {test,expect} from '@playwright/test';
import {todayISO} from '../../js/weather.js';

async function setup(page,width) {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.pathname!=='/api/weather/v1/forecast'&&u.hostname!=='api.open-meteo.com')return u.protocol==='https:'?route.abort():route.fallback();
    const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
    const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
    const out=Array.from({length:u.searchParams.get('latitude').split(',').length},()=>({daily:{time:dates,precipitation_sum:dates.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(0),precipitation_probability:fill(0),weather_code:fill(1),wind_gusts_10m:fill(8),temperature_2m:fill(13)}}));
    await route.fulfill({json:out});
  });
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','22026-10-12'));
  await page.goto('/');await expect(page.locator('#hero .cover-link')).toBeVisible();return errors;
}

for(const width of [390,1280]) test(`sfide: Confronta dà il timbro e le spunte di Osserva restano dopo il ricaricamento a ${width}px`,async({page})=>{
  const errors=await setup(page,width);
  await page.goto('/#/sfide');
  const view=page.locator('.view[data-view="sfide"]');
  await expect(view.locator('h1')).toHaveText('Sfide');
  await expect(view.locator('[data-scopri-sub] a[aria-current="page"]')).toHaveText('Sfide');
  await expect(page.locator('.tabbar [data-tab="specie"]')).toHaveAttribute('aria-current','page');
  await expect(view.locator('#ch-stamps-h')).toHaveText('I tuoi timbri');
  await expect(view.locator('.ch-stamps-grid')).toHaveCount(0);

  // Confronta: rispondi a tutte le domande, la spiegazione cita la fonte, alla fine il timbro
  await view.locator('a.ch-card[data-challenge="funghi-sosia"]').click();
  await expect(page).toHaveURL(/#\/sfide\/funghi-sosia$/);
  await expect(page.locator('.appbar-back')).toBeVisible();
  const questions=view.locator('.ch-q');const n=await questions.count();
  expect(n).toBeGreaterThanOrEqual(3);
  for(let i=0;i<n;i++){
    const q=view.locator(`.ch-q[data-ch-q="${i}"]`);
    await q.locator('.ch-opt').first().click();
    const result=q.locator('.ch-result');
    await expect(result).toBeVisible();await expect(result.locator('.ch-source a[href^="https://"]')).toHaveCount(1);
    await expect(q.locator('.ch-opt.is-right')).toHaveCount(1);
    await expect(q.locator('.ch-opt').first()).toBeDisabled();
  }
  await expect(view.locator('.ch-done')).toContainText('Sfida completata');
  await expect(view.locator('.ch-done')).toContainText(/Risposte giuste: \d su \d/);
  await expect(view.locator('.ch-done svg.ch-stamp.is-earned')).toBeVisible();

  await page.goto('/#/sfide');
  await expect(view.locator('.ch-stamps-grid li')).toHaveCount(1);
  await expect(view.locator('.ch-stamps-grid a')).toHaveAttribute('href','#/sfide/funghi-sosia');

  // Osserva: una spunta resta dopo il ricaricamento; la nota usa il pulsante del taccuino
  await page.goto('/#/sfide/alberi-faggeta');
  const first=view.locator('[data-ch-seen]').first();
  await expect(first).toHaveAttribute('aria-pressed','false');
  await first.click();
  await expect(view.locator('[data-ch-seen]').first()).toHaveAttribute('aria-pressed','true');
  await expect(view.locator('.ch-progress .ch-count')).toContainText('1 di 4');
  await expect(view.locator('.ch-item').first().locator('[data-note-kind="albero"]')).toHaveCount(1);
  await page.reload();
  await expect(view.locator('[data-ch-seen]').first()).toHaveAttribute('aria-pressed','true');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('fungaroli:challenges:v1')));
  expect(Object.keys(stored.seen['alberi-faggeta'])).toEqual(['albero:faggio']);
  expect(stored.done['funghi-sosia']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(JSON.stringify(stored)).not.toMatch(/lat|lon/);

  // la voce apre la scheda nel pannello laterale, senza cambiare pagina
  const url=page.url();
  await view.locator('.ch-item-main').first().click();
  await expect(page.locator('#entity-sheet')).toBeVisible();expect(page.url()).toBe(url);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
