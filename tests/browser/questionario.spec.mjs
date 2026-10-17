// Questionario per cercatori esperti (/questionario): compilazione, bozza locale, consenso, invio, telefono stretto.
// Usa il Worker locale della suite (API /api/survey/v1/responses su D1 locale).
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEY = 'fronda:questionario:esperti-reatino:v1';
const ENDPOINT = '/api/survey/v1/responses';
const MIGRATION = new URL('../../migrations/0004_survey.sql', import.meta.url).pathname;
const LEGAL = JSON.parse(readFileSync(new URL('../../data/legal.json', import.meta.url), 'utf8'));
// Indirizzo del titolare: unica fonte data/legal.json, sezione «Privacy e dati» (link mailto).
const LEGAL_MAIL = LEGAL.info_sections.find((x) => x.id === 'privacy').html.match(/href="(mailto:[^"]+)"/)[1];
test.use({ locale: 'it-IT' });

// Client distinti: nessuna scrittura SQLite concorrente per azzerare i limiti.
test.beforeEach(async ({ context }) => {
  const ip = 'fd00:' + randomBytes(14).toString('hex').match(/.{4}/g).join(':');
  await context.setExtraHTTPHeaders({'CF-Connecting-IP': ip});
});

// SQL sul D1 locale della community (il database con le tabelle dei profili, dove il Worker tiene il questionario).
// Le tabelle del questionario si creano con la stessa migrazione idempotente del Worker, se lui non l'ha ancora applicata.
async function d1(page, sql, params = []) {
  await page.request.get('/api/community/status');
  return JSON.parse(execFileSync('python3', ['-c', `
import json,pathlib,sqlite3,sys
for path in pathlib.Path(sys.argv[1]).rglob('*.sqlite'):
 db=sqlite3.connect(path,timeout=20)
 if db.execute("SELECT COUNT(*) FROM sqlite_master WHERE name='accounts'").fetchone()[0]:
  db.executescript(pathlib.Path(sys.argv[2]).read_text())
  rows=db.execute(sys.argv[3],json.loads(sys.argv[4])).fetchall();db.commit();db.close();print(json.dumps(rows));break
 db.close()
else: raise Exception('D1 locale della community non trovato')
`, process.env.FUNGAROLI_BROWSER_PERSIST, MIGRATION, sql, JSON.stringify(params)], { encoding: 'utf8' }));
}
const savedCount = async (page) => (await d1(page, 'SELECT COUNT(*) FROM survey_responses'))[0][0];
const totalKey = () => `total:esperti-reatino:${new Date().toISOString().slice(0, 10)}`;

async function open(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/questionario');
  await expect(page.getByRole('heading', { level: 2, name: 'Prima di cominciare' })).toBeVisible();
  return errors;
}
const title = (page) => page.locator('#q-step-title');
const next = (page) => page.getByRole('button', { name: 'Avanti', exact: true }).click();
const draft = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);

// Versione breve: Chi sei → Le specie → Gli ultimi anni → Per finire → Riepilogo
async function shortRun(page) {
  await page.getByRole('button', { name: /Versione breve/ }).click();
  await expect(title(page)).toHaveText('Parte 1 di 4: Chi sei');
  await page.getByLabel(/Da quanti anni vai per funghi/).fill('25');
  await page.getByRole('button', { name: /^Terminillo/ }).click();
  await next(page);
  await expect(title(page)).toContainText('Le specie che conosci bene');
  await page.getByRole('checkbox', { name: 'Porcino (Boletus edulis)' }).check();
  await expect(page.locator('[data-card="edulis"]')).toBeVisible();
  await next(page);
  await expect(title(page)).toContainText('Gli ultimi anni');
  await next(page);
  await expect(title(page)).toContainText('Per finire');
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
}

test('compilazione minima e invio: niente parte prima di «Invia», poi ricevuta e bozza cancellata', async ({ page }) => {
  const errors = await open(page);
  const posts = [];
  page.on('request', (r) => { if (r.url().includes('/api/survey/') && r.method() === 'POST') posts.push(r); });
  await shortRun(page);
  await expect(page.locator('.q-sum')).toHaveCount(4);
  await expect(page.locator('.q-sum').first()).toContainText('25 anni');
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  expect(posts).toHaveLength(0);
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith('/api/survey/v1/responses') && r.method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(request.headers()['content-type']).toContain('application/json');
  const body = request.postDataJSON();
  expect(Object.keys(body).sort()).toEqual(['answers', 'consent', 'respondent', 'startedAt', 'survey', 'version', 'website']);
  expect(body).toMatchObject({ survey: 'esperti-reatino', version: 1, website: '', respondent: {},
    consent: { anonymousUse: true, recontact: false, diary: false },
    answers: { profile: { years: 25, zones: ['Terminillo'] }, species: [{ id: 'edulis' }] } });
  expect(Date.parse(body.startedAt)).toBeLessThanOrEqual(Date.now());
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  await expect(page.locator('[data-receipt]')).toHaveText(/^[A-HJ-NP-Z2-9]{8}$/);
  // per la cancellazione: lo stesso indirizzo dell'informativa
  await expect(page.locator('.q-receipt-box a[href^="mailto:"]')).toHaveAttribute('href', LEGAL_MAIL);
  expect(await draft(page)).toBeNull();
  // la ricevuta resta sul dispositivo per chiedere la cancellazione
  await page.reload();
  await expect(page.locator('.q-step .q-code')).toHaveText(/^[A-HJ-NP-Z2-9]{8}$/);
  expect(errors).toEqual([]);
});

test('salvataggio automatico a ogni risposta e ripristino dopo la ricarica; «Ricomincia» cancella la bozza', async ({ page }) => {
  const errors = await open(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  await expect(title(page)).toHaveText('Parte 1 di 9: Chi sei');
  await page.getByLabel(/Da quanti anni vai per funghi/).fill('40');
  await page.getByRole('checkbox', { name: 'Un familiare' }).check();
  await page.getByRole('button', { name: /^Leonessa/ }).click();
  await next(page);
  await page.getByRole('checkbox', { name: 'Chiodino' }).check();
  await page.locator('[data-card="armillaria"]').getByLabel(/Quota più bassa/).fill('700');
  await expect.poll(async () => (await draft(page))?.state?.speciesData?.armillaria?.elevMin).toBe(700);
  const saved = await draft(page);
  expect(saved.state.profile).toMatchObject({ years: 40, zones: ['Leonessa'] });
  expect(saved.state.startedAt).toBeTruthy();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Riprendi la bozza' })).toBeVisible();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toContainText('Le specie che conosci bene');
  await expect(page.locator('[data-card="armillaria"]').getByLabel(/Quota più bassa/)).toHaveValue('700');
  await page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await expect(page.getByLabel(/Da quanti anni vai per funghi/)).toHaveValue('40');
  await expect(page.getByRole('checkbox', { name: 'Un familiare' })).toBeChecked();
  await expect(page.getByRole('button', { name: /^Leonessa/ })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await page.getByRole('button', { name: 'Ricomincia' }).click();
  await page.getByRole('button', { name: 'Sì, cancella la bozza' }).click();
  await expect(page.getByRole('button', { name: /Versione breve/ })).toBeVisible();
  expect(await draft(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('senza consenso non si invia: errore annunciato e focus sulla casella', async ({ page }) => {
  await open(page);
  const posts = [];
  page.on('request', (r) => { if (r.url().includes('/api/survey/') && r.method() === 'POST') posts.push(r); });
  await shortRun(page);
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Per inviare serve il tuo consenso: spunta la casella qui sopra.');
  // la casella non promette un uso «anonimo»: le risposte restano legate alla ricevuta (vedi l'informativa)
  await expect(page.getByRole('checkbox', { name: /Nei risultati non compariranno il mio nome né il mio contatto/ })).toBeVisible();
  await expect(page.locator('.q-consent')).not.toContainText(/anonim/i);
  await expect(page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ })).toBeFocused();
  await expect(page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ })).toHaveAttribute('aria-invalid', 'true');
  expect(posts).toHaveLength(0);
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('nessuna risposta preimpostata: niente scelte, numeri o esempi già compilati', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  const empty = async () => {
    await expect(page.locator('#q-step input:checked')).toHaveCount(0);
    await expect(page.locator('#q-step [aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('[placeholder]')).toHaveCount(0);
    for (const value of await page.locator('#q-step input.q-input, #q-step textarea').evaluateAll((els) => els.map((e) => e.value))) expect(value).toBe('');
  };
  await empty(); // Chi sei
  await next(page);
  await page.getByRole('checkbox', { name: 'Ovolo buono' }).check();
  const card = page.locator('[data-card="caesarea"]');
  await expect(card.locator('input:checked')).toHaveCount(0);
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(0);
  for (const value of await card.locator('input.q-num').evaluateAll((els) => els.map((e) => e.value))) expect(value).toBe('');
  await next(page);
  await empty(); // Pioggia
  await next(page);
  await empty(); // Temperatura, vento e secco
  await page.getByRole('group', { name: /Ricordi un episodio/ }).getByRole('radio', { name: 'Sì' }).check();
  await expect(page.locator('.q-card')).toHaveCount(1);
  await expect(page.locator('.q-card input:checked')).toHaveCount(0);
  await next(page);
  await empty(); // Gli ultimi anni
  await page.getByRole('button', { name: 'Aggiungi una buttata' }).click();
  await expect(page.locator('.q-card input:checked')).toHaveCount(0);
  await next(page);
  await empty(); // Bosco: la classifica parte vuota
  await expect(page.locator('.q-rank')).toHaveCount(7);
});

test('approfondimenti solo dopo un «sì», avvisi annunciati, «Non so» con il nome della domanda', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  await expect(page.getByRole('button', { name: 'Non so (Da quanti anni vai per funghi?)' })).toHaveAttribute('aria-pressed', 'false');
  await next(page);
  await page.getByRole('checkbox', { name: 'Chiodino' }).check();
  const card = page.locator('[data-card="armillaria"]');
  await expect(card.getByRole('group', { name: 'Come è cambiata?' })).toBeHidden();
  await card.getByRole('group', { name: 'La stagione è cambiata negli anni?' }).getByRole('radio', { name: 'Sì' }).check();
  await expect(card.getByRole('group', { name: 'Come è cambiata?' })).toBeVisible();
  // quote incoerenti: l'avviso compare dentro una regione annunciata e sparisce dopo la correzione
  await card.getByLabel(/Quota più bassa/).fill('1500');
  await card.getByLabel(/Quota più alta/).fill('900');
  const warn = card.getByRole('status').filter({ hasText: 'La quota più bassa è sopra la più alta' });
  await expect(warn).toBeVisible();
  await card.getByLabel(/Quota più alta/).fill('1900');
  await expect(warn).toHaveCount(0);
  for (let i = 0; i < 4; i++) await next(page);
  await expect(title(page)).toContainText('Bosco, versante e terreno');
  const spots = page.getByRole('group', { name: 'Ci sono posti che rendono quasi ogni anno?' });
  await expect(spots.getByLabel('Che cosa hanno in comune? (facoltativo)')).toHaveCount(0);
  await spots.getByRole('radio', { name: 'Sì, alcuni posti rendono quasi ogni anno' }).check();
  await expect(spots.getByLabel('Che cosa hanno in comune? (facoltativo)')).toBeVisible();
  await expect(spots.getByRole('checkbox', { name: 'Altro…' })).not.toBeChecked();
  // Rischi: il racconto si apre solo dopo «Sì» al cancello, e sparisce con «No»
  await next(page);
  await next(page);
  await expect(title(page)).toContainText('Rischi');
  const poison = page.getByRole('group', { name: 'Conosci casi di intossicazione da funghi?' });
  await expect(page.getByLabel('Cosa era successo?')).toBeHidden();
  await poison.getByRole('radio', { name: 'Sì', exact: true }).check();
  await expect(page.getByLabel('Cosa era successo?')).toBeVisible();
  await poison.getByRole('radio', { name: 'No', exact: true }).check();
  await expect(page.getByLabel('Cosa era successo?')).toBeHidden();
  const avoided = page.getByRole('group', { name: 'Ci sono specie che eviti di raccogliere?' });
  await expect(avoided.getByRole('radio', { name: 'Preferisco non dirlo' })).not.toBeChecked();
  await expect(page.getByLabel('Quali, e perché?')).toBeHidden();
});

test('versanti in equilibrio e cancelli dei rischi: riepilogo e invio con solo ciò che si vede', async ({ page }) => {
  const errors = await open(page);
  const before = await savedCount(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  for (let i = 0; i < 5; i++) await next(page);
  await expect(title(page)).toContainText('Bosco, versante e terreno');
  // i quattro versanti con la stessa forma, a inizio e a fine stagione
  const aspect = page.getByRole('group', { name: 'Quale versante guardi a inizio stagione? E a fine stagione?' });
  const labels = await aspect.getByRole('checkbox').evaluateAll((els) => els.map((e) => e.labels[0]?.textContent.trim()));
  for (const when of ['Inizio', 'Fine']) {
    expect(labels.filter((l) => l.startsWith(`${when} stagione: meglio a `))).toEqual(['nord', 'sud', 'est', 'ovest'].map((d) => `${when} stagione: meglio a ${d}`));
  }
  await aspect.getByRole('checkbox', { name: 'Inizio stagione: meglio a est' }).check();
  await aspect.getByRole('checkbox', { name: 'Fine stagione: meglio a ovest' }).check();
  await aspect.getByRole('checkbox', { name: 'Inizio stagione: il versante non conta' }).check();
  await expect(aspect.getByRole('checkbox', { name: 'Inizio stagione: meglio a est' })).not.toBeChecked();
  await expect(aspect.getByRole('checkbox', { name: 'Fine stagione: meglio a ovest' })).toBeChecked();
  await aspect.getByRole('checkbox', { name: 'Inizio stagione: meglio a est' }).check();
  await expect(aspect.getByRole('checkbox', { name: 'Inizio stagione: il versante non conta' })).not.toBeChecked();
  await next(page);
  await next(page);
  await expect(title(page)).toContainText('Rischi');
  // il cancello dice se c'è qualcosa da raccontare, non che cosa: tre scelte, nessuna già segnata
  const poison = page.getByRole('group', { name: 'Conosci casi di intossicazione da funghi?' });
  const avoided = page.getByRole('group', { name: 'Ci sono specie che eviti di raccogliere?' });
  for (const gate of [poison, avoided]) {
    expect(await gate.getByRole('radio').evaluateAll((els) => els.map((e) => e.labels[0]?.textContent.trim()))).toEqual(['Sì', 'No', 'Preferisco non dirlo']);
    await expect(gate.getByRole('radio', { checked: true })).toHaveCount(0);
  }
  await expect(page.getByLabel('Cosa era successo?')).toBeHidden();
  await expect(page.getByLabel('Quali, e perché?')).toBeHidden();
  await poison.getByRole('radio', { name: 'Sì', exact: true }).check();
  await avoided.getByRole('radio', { name: 'Sì', exact: true }).check();
  // solo testo: nessuna risposta rapida di contenuto accanto ai due racconti
  for (const label of ['Cosa era successo?', 'Quali, e perché?']) {
    const field = page.locator('.q-field').filter({ has: page.getByLabel(label) });
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="checkbox"], input[type="radio"]')).toHaveCount(0);
  }
  await page.getByLabel('Cosa era successo?').fill('Un racconto che poi non voglio mandare.');
  await page.getByLabel('Quali, e perché?').fill('Le russule rosse: non le conosco bene.');
  // cambio idea: il racconto scritto sparisce e non parte
  await poison.getByRole('radio', { name: 'Preferisco non dirlo' }).check();
  await expect(page.getByLabel('Cosa era successo?')).toBeHidden();
  await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
  const forest = page.locator('.q-sum').filter({ has: page.getByRole('heading', { name: 'Bosco, versante e terreno' }) });
  await expect(forest).toContainText('Fine stagione: meglio a ovest · Inizio stagione: meglio a est');
  const risks = page.locator('.q-sum').filter({ has: page.getByRole('heading', { name: /Rischi/ }) });
  await expect(risks).toContainText('Conosci casi di intossicazione');
  await expect(risks).toContainText('Preferisco non dirlo');
  await expect(risks).toContainText('Le russule rosse: non le conosco bene.');
  await expect(risks).not.toContainText('Un racconto che poi non voglio mandare.');
  await expect(risks).not.toContainText('Cosa era successo');
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  const { answers } = request.postDataJSON();
  expect(answers.forest).toEqual({ aspect: { quick: ['fine stagione: meglio a ovest', 'inizio stagione: meglio a est'], text: '' } });
  expect(answers.risks).toEqual({ knowsPoisonings: 'non dico', avoidsSpecies: 'sì', avoided: { quick: [], text: 'Le russule rosse: non le conosco bene.' } });
  expect(response.status()).toBe(201);
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  expect(await savedCount(page)).toBe(before + 1);
  const [[stored]] = await d1(page, 'SELECT answers FROM survey_responses WHERE receipt=?', [(await response.json()).receipt]);
  expect(JSON.parse(stored)).toMatchObject({ forest: answers.forest, risks: answers.risks });
  expect(errors).toEqual([]);
});

test('cancelli della stagione e degli episodi: anche «Sì» da solo e «No» arrivano nel riepilogo e al server', async ({ page }) => {
  const errors = await open(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  await next(page);
  await page.getByRole('checkbox', { name: 'Porcino (Boletus edulis)' }).check();
  await page.getByRole('checkbox', { name: 'Chiodino' }).check();
  const season = (key) => page.locator(`[data-card="${key}"]`).getByRole('group', { name: 'La stagione è cambiata negli anni?' });
  expect(await season('edulis').getByRole('radio').evaluateAll((els) => els.map((e) => e.labels[0]?.textContent.trim()))).toEqual(['Sì', 'No', 'Non so']);
  await expect(season('edulis').getByRole('radio', { checked: true })).toHaveCount(0);
  await season('edulis').getByRole('radio', { name: 'Sì', exact: true }).check();
  await season('armillaria').getByRole('radio', { name: 'No', exact: true }).check();
  await expect(page.locator('[data-card="armillaria"]').getByRole('group', { name: 'Come è cambiata?' })).toBeHidden();
  await next(page);
  await next(page);
  await expect(title(page)).toContainText('Temperatura, vento e secco');
  await page.getByRole('group', { name: /Ricordi un episodio/ }).getByRole('radio', { name: 'No', exact: true }).check();
  for (let i = 0; i < 5; i++) await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
  const sum = (name) => page.locator('.q-sum').filter({ has: page.getByRole('heading', { name }) });
  await expect(sum('Le specie che conosci bene')).not.toContainText('Solo indicata come specie che conosci');
  await expect(sum('Le specie che conosci bene').locator('dt', { hasText: 'La stagione è cambiata' })).toHaveCount(2);
  await expect(sum('Temperatura, vento e secco')).toContainText('Ricordi episodi di freddo, gelata, vento o caldo');
  await expect(sum('Temperatura, vento e secco').locator('dd')).toHaveText('No');
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  const { answers } = request.postDataJSON();
  expect(answers.species).toEqual([{ id: 'edulis', seasonChanged: 'sì' }, { id: 'armillaria', seasonChanged: 'no' }]);
  expect(answers.weatherRemembers).toBe('no');
  expect(answers.weatherEvents).toBeUndefined();
  expect(response.status()).toBe(201);
  const [[stored]] = await d1(page, 'SELECT answers FROM survey_responses WHERE receipt=?', [(await response.json()).receipt]);
  expect(JSON.parse(stored)).toMatchObject({ species: answers.species, weatherRemembers: 'no' });
  expect(errors).toEqual([]);
});

test('bozza: un cancello cancellato resta vuoto alla ripresa; solo una bozza di prima dei cancelli riceve «Sì»', async ({ page }) => {
  const errors = await open(page);
  await page.getByRole('button', { name: /Versione completa/ }).click();
  await page.getByLabel(/Da quanti anni vai per funghi/).fill('25');
  for (let i = 0; i < 7; i++) await next(page);
  await expect(title(page)).toContainText('Rischi');
  const poison = page.getByRole('group', { name: 'Conosci casi di intossicazione da funghi?' });
  await poison.getByRole('radio', { name: 'Sì', exact: true }).check();
  await page.getByLabel('Cosa era successo?').fill('Racconto che poi decido di non dare.');
  await poison.getByRole('radio', { name: 'Preferisco non dirlo' }).check();
  await poison.getByRole('button', { name: 'Cancella la scelta' }).click();
  await expect(poison.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect.poll(async () => {
    const r = (await draft(page))?.state?.risks;
    return r && Object.hasOwn(r, 'knowsPoisonings') && r.knowsPoisonings === null ? r.poisonings?.text : null;
  }).toBe('Racconto che poi decido di non dare.');
  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toContainText('Rischi');
  await expect(poison.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(page.getByLabel('Cosa era successo?')).toBeHidden();
  await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(page.locator('.q-step')).not.toContainText('Racconto che poi decido di non dare.');
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(request.postDataJSON().answers.risks).toBeUndefined();
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();

  // bozza salvata prima dei cancelli (16/10/2026): nessuna chiave del cancello, racconto già scritto
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ savedAt: new Date().toISOString(), state: {
    format: 1, mode: 'completa', step: 'H', speciesChosen: ['edulis'], speciesData: { edulis: { id: 'edulis', changedYes: 'sì', changed: { quick: [], text: '' } } },
    risks: { poisonings: { quick: [], text: 'Racconto vecchio.' } },
  } })), KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toContainText('Rischi');
  await expect(poison.getByRole('radio', { name: 'Sì', exact: true })).toBeChecked();
  await expect(page.getByLabel('Cosa era successo?')).toHaveValue('Racconto vecchio.');
  await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  const species = page.locator('.q-sum').filter({ has: page.getByRole('heading', { name: 'Le specie che conosci bene' }) });
  await expect(species.locator('dt', { hasText: 'La stagione è cambiata' })).toHaveCount(1);
  await expect(species).not.toContainText('Solo indicata come specie che conosci');
  // la bozza si risalva già convertita
  await expect.poll(async () => { const e = (await draft(page))?.state?.speciesData?.edulis; return e && !Object.hasOwn(e, 'changedYes') ? e.seasonChanged : null; }).toBe('sì');
  expect(errors).toEqual([]);
});

test('contatto del titolare: lo stesso indirizzo di data/legal.json nell’informativa e nella pagina Info', async ({ page }) => {
  expect(LEGAL_MAIL).toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]+$/);
  const errors = await open(page);
  // l'informativa nomina lo stesso indirizzo in «Chi tratta i dati» e in «I tuoi diritti», e nessun altro
  const links = page.locator('#informativa a[href^="mailto:"]');
  await expect(links).toHaveCount(2);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) expect(href).toBe(LEGAL_MAIL);
  await expect(links.first()).toHaveText(LEGAL_MAIL.slice('mailto:'.length));
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
  // la pagina Info dell'app, servita dallo snapshot del CMS: il sanificatore tiene il link mailto
  await page.addInitScript((key) => localStorage.setItem('fungaroli:legal-accepted', key), String(LEGAL.version) + LEGAL.verified_on);
  await page.route('https://**/*', (r) => r.abort());
  await page.route('**/api/weather/v1/forecast?**', (r) => r.fulfill({ status: 503, json: { error: 'Meteo non disponibile nella prova.' } }));
  await page.goto('/#/info');
  const privacy = page.locator('#legal-sections details').filter({ has: page.locator('summary h2', { hasText: 'Privacy e dati' }) });
  await expect(privacy).toHaveCount(1);
  await privacy.locator('summary').click();
  await expect(privacy.locator('a[href^="mailto:"]')).toHaveAttribute('href', LEGAL_MAIL);
  await expect(privacy).toContainText(`scrivi a ${LEGAL_MAIL.slice('mailto:'.length)}`);
  await expect(page.locator('#onboarding[open]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('campo trappola: nome neutro, fuori dal tab; se compilato risponde come un invio ma non salva niente', async ({ page }) => {
  await open(page);
  const trap = page.locator('#q-lascia-vuoto');
  await expect(trap).toHaveAttribute('name', 'lascia_vuoto');
  await expect(trap).toHaveAttribute('autocomplete', 'off');
  await expect(trap).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('.q-trap')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('input[name="website"], input[name="url"], #website')).toHaveCount(0);
  await shortRun(page);
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const before = await savedCount(page), ratesBefore = await d1(page, 'SELECT COUNT(*) FROM survey_rate');
  await trap.fill('https://spam.example');
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(request.postDataJSON().website).toBe('https://spam.example');
  expect(response.status()).toBe(201);
  expect(await savedCount(page)).toBe(before);
  expect(await d1(page, 'SELECT COUNT(*) FROM survey_rate')).toEqual(ratesBefore);
});

test('tetto del giorno raggiunto: messaggio chiaro, niente salvato, bozza intatta; il giorno dopo si invia', async ({ page }) => {
  const errors = await open(page);
  await shortRun(page);
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const before = await savedCount(page), day = new Date().toISOString().slice(0, 10);
  await d1(page, 'INSERT INTO survey_rate(key,day,count) VALUES(?,?,200) ON CONFLICT(key) DO UPDATE SET count=200', [totalKey(), day]);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(response.status()).toBe(429);
  expect(await response.json()).toMatchObject({ code: 'daily-limit' });
  const wait = Number(response.headers()['retry-after']);
  expect(wait).toBeGreaterThanOrEqual(60);
  expect(wait).toBeLessThanOrEqual(86400);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Per oggi il questionario ha ricevuto tutte le risposte che può accettare.');
  await expect(alert).toContainText(/Riprova tra circa (un minuto|\d+ minuti|un’ora|\d+ ore)\./);
  await expect(alert).toContainText('Le tue risposte restano salvate su questo dispositivo.');
  await expect(title(page)).toHaveText('Riepilogo e invio');
  expect((await draft(page)).state.profile.years).toBe(25);
  expect(await savedCount(page)).toBe(before);
  expect(await d1(page, 'SELECT count FROM survey_rate WHERE key=?', [totalKey()])).toEqual([[200]]);
  // il contatore del giorno torna libero (come a mezzanotte UTC): lo stesso invio passa e conta 1
  await d1(page, 'DELETE FROM survey_rate WHERE key=?', [totalKey()]);
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  expect(await savedCount(page)).toBe(before + 1);
  expect(await d1(page, 'SELECT count FROM survey_rate WHERE key=?', [totalKey()])).toEqual([[1]]);
  expect(errors).toEqual([]);
});

test('attesa detta al singolare e limite per connessione distinto dal tetto del giorno', async ({ page }) => {
  await open(page);
  await shortRun(page);
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  const cases = [
    ['daily-limit', 4000, 'Per oggi il questionario ha ricevuto tutte le risposte che può accettare. Riprova tra circa un’ora.'],
    ['daily-limit', 7 * 3600, 'Riprova tra circa 7 ore.'],
    ['connection-limit', 60, 'Da questa connessione sono già arrivati troppi invii oggi. Riprova tra circa un minuto.'],
    ['connection-limit', 600, 'Riprova tra circa 10 minuti.'],
  ];
  for (const [code, wait, text] of cases) {
    await page.route(`**${ENDPOINT}`, (route) => route.fulfill({ status: 429, headers: { 'retry-after': String(wait) }, json: { error: 'Troppi invii.', code } }));
    await page.getByRole('button', { name: 'Invia', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(text);
    await page.unroute(`**${ENDPOINT}`);
  }
  await expect(title(page)).toHaveText('Riepilogo e invio');
});

test('la pagina non si può incorniciare: intestazioni da _headers', async ({ page }) => {
  const res = await page.goto('/questionario');
  expect(res.headers()['x-frame-options']).toBe('DENY');
  expect(res.headers()['content-security-policy']).toBe("frame-ancestors 'none'");
  await expect(page.locator('#q-lascia-vuoto')).toHaveValue('');
});

test('a 320 px nessuno scorrimento orizzontale, anche con schede aperte', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await open(page);
  const fits = async (where) => {
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scroll, where).toBeLessThanOrEqual(client);
  };
  await fits('inizio');
  await page.getByRole('button', { name: /Versione completa/ }).click();
  await page.getByRole('button', { name: /^Cittaducale/ }).click();
  await fits('Chi sei');
  await next(page);
  await page.getByRole('checkbox', { name: 'Porcino rosso (B. pinophilus)' }).check();
  await page.getByRole('button', { name: 'Un’altra specie' }).click();
  await fits('Le specie');
  await next(page);
  await page.getByRole('checkbox', { name: 'Altro…' }).first().check();
  await fits('Pioggia');
  await next(page);
  await page.getByRole('group', { name: /Ricordi un episodio/ }).getByRole('radio', { name: 'Sì' }).check();
  await page.getByRole('button', { name: 'Aggiungi un altro episodio' }).click();
  await fits('Episodi');
  await next(page);
  await page.getByRole('button', { name: 'Aggiungi una buttata' }).click();
  await page.getByRole('button', { name: 'Aggiungi un’uscita a vuoto' }).click();
  await fits('Gli ultimi anni');
  for (const part of ['Bosco', 'Accessi', 'Rischi']) { await next(page); await fits(part); }
  await next(page);
  await fits('Per finire');
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await fits('Riepilogo');
  await expect(page.locator('#informativa')).toBeAttached();
});

test('invio con la rete giù: messaggio chiaro, bozza salvata, si riprende e si invia', async ({ page }) => {
  await open(page);
  await shortRun(page);
  await page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ }).check();
  await page.route('**/api/survey/v1/responses', (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('manchi la connessione');
  await expect(title(page)).toHaveText('Riepilogo e invio');
  const saved = await draft(page);
  expect(saved.state.profile.years).toBe(25);
  expect(saved.state.consent.anonymousUse).toBe(true);

  await page.unroute('**/api/survey/v1/responses');
  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  expect(await draft(page)).toBeNull();
});


test('invio vuoto: messaggio utile, nessuna richiesta e bozza conservata', async ({page}) => {
  await open(page);
  await page.getByRole('button', {name:/Versione breve/}).click();
  for (let i=0;i<3;i++) await next(page);
  await expect(page.getByLabel('Il tuo nome', {exact:true})).toBeVisible();
  await expect(page.locator('.q-hint').filter({hasText:'serve a collegare le risposte alla tua testimonianza'})).toBeVisible();
  await page.getByRole('button', {name:'Vai al riepilogo'}).click();
  await page.getByRole('checkbox', {name:/Acconsento all’uso delle mie risposte/}).check();
  const posts=[];
  page.on('request', r => {if(r.method()==='POST' && r.url().endsWith(ENDPOINT)) posts.push(r);});
  await page.getByRole('button', {name:'Invia',exact:true}).click();
  await expect(page.getByText(/Per inviare, rispondi ad almeno una domanda/)).toBeVisible();
  expect(posts).toHaveLength(0);
  expect(await page.evaluate(key=>!!localStorage.getItem(key), KEY)).toBe(true);
});
