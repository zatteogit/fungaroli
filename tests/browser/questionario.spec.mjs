// Questionario per cercatori esperti (/questionario), versione 2 (corta): compilazione, bozza locale, consenso,
// invio, ricevuta con l'invito ad «Annota», versione 1 archiviata, telefono stretto.
// Usa il Worker locale della suite (API /api/survey/v1/responses su D1 locale).
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEY = 'fronda:questionario:esperti-reatino:v2';
const OLD_KEY = 'fronda:questionario:esperti-reatino:v1';
const ENDPOINT = '/api/survey/v1/responses';
const MIGRATION = new URL('../../migrations/0004_survey.sql', import.meta.url).pathname;
const LEGAL = JSON.parse(readFileSync(new URL('../../data/legal.json', import.meta.url), 'utf8'));
// Indirizzo del titolare: unica fonte data/legal.json, sezione «Privacy e dati» (link mailto).
const LEGAL_MAIL = LEGAL.info_sections.find((x) => x.id === 'privacy').html.match(/href="(mailto:[^"]+)"/)[1];
test.use({ locale: 'it-IT' });

// Client distinti: nessuna scrittura SQLite concorrente per azzerare i limiti.
test.beforeEach(async ({ context }) => {
  const ip = 'fd00:' + randomBytes(14).toString('hex').match(/.{4}/g).join(':');
  await context.setExtraHTTPHeaders({ 'CF-Connecting-IP': ip });
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
  await expect(page.getByRole('heading', { level: 2, name: 'Mi dai una mano?' })).toBeVisible();
  return errors;
}
const title = (page) => page.locator('#q-step-title');
const next = (page) => page.getByRole('button', { name: 'Avanti', exact: true }).click();
const draft = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const group = (page, name) => page.getByRole('group', { name });
const card = (page, key) => page.locator(`[data-card="${key}"]`);
const consent = (page) => page.getByRole('checkbox', { name: /Acconsento all’uso delle mie risposte/ });

// Percorso minimo: anni, una zona, il porcino con due mesi → riepilogo.
async function shortRun(page) {
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  await expect(title(page)).toHaveText('Parte 1 di 4: Tu e i funghi');
  await group(page, 'Da quanti anni cerchi funghi?').getByRole('radio', { name: 'Da 15 a 29 anni' }).check();
  await page.getByLabel('Zona 1', { exact: true }).fill('Terminillo');
  await page.getByRole('checkbox', { name: 'Porcino (Boletus edulis)' }).check();
  await next(page);
  await expect(title(page)).toContainText('Le tue specie');
  await card(page, 'edulis').getByRole('checkbox', { name: 'ottobre' }).check();
  await card(page, 'edulis').getByRole('checkbox', { name: 'settembre' }).check();
  await next(page);
  await expect(title(page)).toContainText('Quello che hai notato');
  await next(page);
  await expect(title(page)).toContainText('Con l’app');
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
}

test('titolo e introduzione: poche domande su ciò che sai per abitudine, «Non so» va benissimo; informativa apribile', async ({ page }) => {
  const errors = await open(page);
  await expect(page).toHaveTitle('Funghi nel Reatino: poche domande su quello che sai');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Funghi nel Reatino: poche domande su quello che sai');
  const intro = page.locator('.q-step');
  await expect(intro).toContainText('Sono poche domande, 3 o 4 minuti, su quello che sai per abitudine');
  await expect(intro).toContainText('«Non so» va benissimo.');
  await expect(intro).toContainText('Stiamo preparando un’app');
  // nessuna scelta tra versioni: c'è solo la versione corta
  await expect(page.getByRole('button', { name: /Versione (breve|completa)/ })).toHaveCount(0);
  const privacy = page.locator('footer details#informativa');
  await expect(privacy).not.toHaveAttribute('open');
  await privacy.locator('summary').click();
  await expect(privacy.getByRole('heading', { name: 'Informativa sul trattamento dei dati' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('compilazione e invio: niente parte prima di «Invia», poi ricevuta, invito ad «Annota» e bozza cancellata', async ({ page }) => {
  const errors = await open(page);
  const posts = [];
  page.on('request', (r) => { if (r.url().includes('/api/survey/') && r.method() === 'POST') posts.push(r); });
  await shortRun(page);
  await expect(page.locator('.q-sum')).toHaveCount(4);
  await expect(page.locator('.q-sum').first()).toContainText('Da 15 a 29 anni');
  await expect(page.locator('.q-sum').nth(1)).toContainText('Settembre, Ottobre');
  await consent(page).check();
  expect(posts).toHaveLength(0);
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(request.headers()['content-type']).toContain('application/json');
  const body = request.postDataJSON();
  expect(Object.keys(body).sort()).toEqual(['answers', 'consent', 'respondent', 'startedAt', 'survey', 'version', 'website']);
  expect(body).toMatchObject({ survey: 'esperti-reatino', version: 2, website: '', respondent: {}, consent: { anonymousUse: true, recontact: false } });
  expect(body.answers).toEqual({ profile: { years: 'da 15 a 29 anni', zones: ['Terminillo'], speciesSought: ['edulis'] }, species: [{ id: 'edulis', months: ['settembre', 'ottobre'] }] });
  expect(response.status()).toBe(201);
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  await expect(page.locator('[data-receipt]')).toHaveText(/^[A-HJ-NP-Z2-9]{8}$/);
  // per la cancellazione: lo stesso indirizzo dell'informativa
  await expect(page.locator('.q-receipt-box a[href^="mailto:"]')).toHaveAttribute('href', LEGAL_MAIL);
  // invito al campo: «Annota», anche quando non si trova niente, con la durata; link alla home
  const invite = page.locator('.q-app-invite');
  await expect(invite).toContainText('tocca «Annota»: segna subito cosa hai trovato, oppure che non hai trovato niente, e quanto hai cercato.');
  await expect(invite.getByRole('link', { name: 'Apri Fronda' })).toHaveAttribute('href', '/');
  expect(await draft(page)).toBeNull();
  const [[version, stored]] = await d1(page, 'SELECT version, answers FROM survey_responses WHERE receipt=?', [(await response.json()).receipt]);
  expect(version).toBe(2);
  expect(JSON.parse(stored)).toEqual(body.answers);
  // la ricevuta resta sul dispositivo per chiedere la cancellazione
  await page.reload();
  await expect(page.locator('.q-step .q-code')).toHaveText(/^[A-HJ-NP-Z2-9]{8}$/);
  expect(errors).toEqual([]);
});

test('salvataggio automatico a ogni risposta e ripristino dopo la ricarica; «Ricomincia» cancella la bozza', async ({ page }) => {
  const errors = await open(page);
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  await group(page, 'Da quanti anni cerchi funghi?').getByRole('radio', { name: '30 anni o più' }).check();
  await page.getByLabel('Zona 1', { exact: true }).fill('Leonessa');
  await page.getByRole('button', { name: 'Aggiungi un’altra zona' }).click();
  await page.getByLabel('Zona 2', { exact: true }).fill('Rascino');
  await page.getByRole('checkbox', { name: 'Chiodino' }).check();
  await next(page);
  await card(page, 'armillaria').getByRole('checkbox', { name: 'Faggeta' }).check();
  await expect.poll(async () => (await draft(page))?.state?.cards?.armillaria?.forests).toEqual(['faggeta']);
  const saved = await draft(page);
  expect(saved.state.a.profile).toMatchObject({ years: '30 anni o più', speciesSought: ['armillaria'] });
  expect(saved.state.a.profile.zones.map((z) => z.value)).toEqual(['Leonessa', 'Rascino']);
  expect(saved.state.startedAt).toBeTruthy();

  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toContainText('Le tue specie');
  await expect(card(page, 'armillaria').getByRole('checkbox', { name: 'Faggeta' })).toBeChecked();
  await page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await expect(group(page, 'Da quanti anni cerchi funghi?').getByRole('radio', { name: '30 anni o più' })).toBeChecked();
  await expect(page.getByLabel('Zona 2', { exact: true })).toHaveValue('Rascino');
  await expect(page.getByRole('checkbox', { name: 'Chiodino' })).toBeChecked();

  await page.reload();
  await page.getByRole('button', { name: 'Ricomincia' }).click();
  await page.getByRole('button', { name: 'Sì, cancella la bozza' }).click();
  await expect(page.getByRole('button', { name: 'Comincia', exact: true })).toBeVisible();
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
  await expect(consent(page)).toBeFocused();
  await expect(consent(page)).toHaveAttribute('aria-invalid', 'true');
  expect(posts).toHaveLength(0);
  await consent(page).check();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('nessuna risposta preimpostata e nessuna domanda da ricordare: parti vuote, niente numeri', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  const empty = async () => {
    await expect(page.locator('#q-step input:checked')).toHaveCount(0);
    await expect(page.locator('#q-step [aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('[placeholder]')).toHaveCount(0);
    await expect(page.locator('#q-step input[inputmode="numeric"], #q-step input[type="number"]')).toHaveCount(0);
    for (const value of await page.locator('#q-step input.q-input, #q-step textarea').evaluateAll((els) => els.map((e) => e.value))) expect(value).toBe('');
    await expect(page.locator('#q-step')).not.toContainText(/buttat|uscite a vuoto|giorni dopo la pioggia|in che anno|classifica|la stagione è cambiata/i);
  };
  await empty(); // Tu e i funghi
  await page.getByRole('checkbox', { name: 'Ovolo buono' }).check();
  await next(page);
  await expect(card(page, 'caesarea').locator('input:checked')).toHaveCount(0);
  await expect(card(page, 'caesarea').getByRole('checkbox')).toHaveCount(12 + 1 + 8 + 1 + 4 + 1);
  await next(page);
  await empty(); // Quello che hai notato
  await next(page);
  await empty(); // Con l'app
  // nome e contatto non si chiedono finché non c'è «Sì» o «Forse» e la richiesta di ricontatto
  await expect(page.getByLabel('Il tuo nome', { exact: true })).toBeHidden();
  await expect(page.getByLabel('Come posso ricontattarti?', { exact: true })).toBeHidden();
});

test('«Non so» esclude le altre scelte, i mesi restano in ordine; oltre 5 specie si scelgono le schede', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  for (const name of ['Porcino (Boletus edulis)', 'Porcino nero (B. aereus)', 'Ovolo buono', 'Chiodino', 'Mazza di tamburo']) await page.getByRole('checkbox', { name }).check();
  await page.getByRole('button', { name: 'Aggiungi una specie' }).click();
  await page.getByLabel('Altra specie 1', { exact: true }).fill('Spugnola');
  await next(page);
  // sei specie: nessuna scheda finché non si sceglie quali compilare (niente scelte fatte al posto della persona)
  const pick = group(page, /Hai scelto 6 specie: per quali compili la scheda\?/);
  await expect(pick).toBeVisible();
  await expect(page.locator('[data-card]')).toHaveCount(0);
  for (const name of ['Porcino (Boletus edulis)', 'Ovolo buono', 'Chiodino', 'Mazza di tamburo', 'Spugnola']) await pick.getByRole('checkbox', { name }).check();
  await expect(pick.getByRole('checkbox', { name: 'Porcino nero (B. aereus)' })).toBeDisabled();
  await expect(page.locator('[data-card]')).toHaveCount(5);
  const edulis = card(page, 'edulis');
  await edulis.getByRole('checkbox', { name: 'novembre' }).check();
  await edulis.getByRole('checkbox', { name: 'settembre' }).check();
  const forests = edulis.getByRole('group', { name: 'In che boschi la trovi?' });
  await forests.getByRole('checkbox', { name: 'Faggeta' }).check();
  await forests.getByRole('checkbox', { name: 'Non so' }).check();
  await expect(forests.getByRole('checkbox', { name: 'Faggeta' })).not.toBeChecked();
  await forests.getByRole('checkbox', { name: 'Castagneto' }).check();
  await expect(forests.getByRole('checkbox', { name: 'Non so' })).not.toBeChecked();
  const quota = edulis.getByRole('group', { name: 'A che quota la trovi, di solito?' });
  await quota.getByRole('checkbox', { name: 'Non so' }).check();
  const other = page.locator('[data-card^="altra:"]');
  await other.getByRole('group', { name: 'In che mesi la trovi di solito?' }).getByRole('checkbox', { name: 'Non so' }).check();
  await next(page); await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await consent(page).check();
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  const { answers } = request.postDataJSON();
  expect(answers.profile.speciesSought).toEqual(['edulis', 'aereus', 'caesarea', 'armillaria', 'procera']);
  expect(answers.profile.speciesOther).toEqual(['Spugnola']);
  expect(answers.species).toEqual([
    { id: 'edulis', months: ['settembre', 'novembre'], forests: ['castagneto'], elevation: ['non so'] },
    { id: 'caesarea' }, { id: 'armillaria' }, { id: 'procera' },
    { id: 'altra', name: 'Spugnola', months: ['non so'] },
  ]);
  expect(response.status()).toBe(201);
});

test('nome e contatto solo dopo «Sì» o «Forse» e «Vuoi che ti ricontatti? Sì»; con «No» non partono', async ({ page }) => {
  const errors = await open(page);
  await shortRun(page);
  await page.getByRole('button', { name: 'Modifica: Con l’app' }).click();
  const report = group(page, /Segnaleresti con l’app i tuoi ritrovamenti/);
  expect(await report.getByRole('radio').evaluateAll((els) => els.map((e) => e.labels[0]?.textContent.trim()))).toEqual(['Sì', 'Forse', 'No']);
  await expect(group(page, 'Vuoi che ti ricontatti?')).toBeHidden();
  await report.getByRole('radio', { name: 'Forse' }).check();
  await group(page, 'Vuoi che ti ricontatti?').getByRole('radio', { name: 'Sì' }).check();
  await page.getByLabel('Il tuo nome', { exact: true }).fill('Mario');
  await page.getByLabel('Come posso ricontattarti?', { exact: true }).fill('333 0000000');
  // cambio idea: con «No» spariscono ricontatto, nome e contatto, e non partono
  await report.getByRole('radio', { name: 'No', exact: true }).check();
  await expect(group(page, 'Vuoi che ti ricontatti?')).toBeHidden();
  await expect(page.getByLabel('Il tuo nome', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(page.locator('.q-send-what')).toContainText('Nessun nome e nessun contatto.');
  await expect(page.locator('.q-step')).not.toContainText('333 0000000');
  // di nuovo «Sì»: nome e contatto tornano, e partono
  await page.getByRole('button', { name: 'Modifica: Con l’app' }).click();
  await report.getByRole('radio', { name: 'Sì', exact: true }).check();
  await expect(page.getByLabel('Il tuo nome', { exact: true })).toHaveValue('Mario');
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await expect(page.locator('.q-send-what')).toContainText('Nome e contatto: Mario, 333 0000000.');
  await consent(page).check();
  const [request, response] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.waitForResponse((r) => r.url().endsWith(ENDPOINT) && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.respondent).toEqual({ name: 'Mario', contact: '333 0000000' });
  expect(body.consent).toEqual({ anonymousUse: true, recontact: true });
  expect(body.answers.willReport).toBe('sì');
  const [[name, contact, recontact]] = await d1(page, 'SELECT name, contact, consent_recontact FROM survey_responses WHERE receipt=?', [(await response.json()).receipt]);
  expect([name, contact, recontact]).toEqual(['Mario', '333 0000000', 1]);
  expect(errors).toEqual([]);
});

test('zone che non danno nulla: il «perché» compare dopo la zona ed è un parere; errori e pericoli; riepilogo uguale all’invio', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  await next(page); await next(page);
  await expect(title(page)).toContainText('Quello che hai notato');
  await expect(page.getByLabel('Secondo te, perché?')).toBeHidden();
  await page.getByLabel('Ci sono zone che sembrano adatte, ma non danno mai niente?').fill('I castagneti bassi verso Rieti.');
  await expect(page.getByLabel('Secondo te, perché?')).toBeVisible();
  await expect(page.locator('.q-field').filter({ has: page.getByLabel('Secondo te, perché?') })).toContainText('È un tuo parere');
  await page.getByLabel('Secondo te, perché?').fill('Troppo secco, credo.');
  await page.getByLabel(/Un errore da principiante che vedi spesso/).fill('Si perdono nella nebbia.');
  await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  const noticed = page.locator('.q-sum').filter({ has: page.getByRole('heading', { name: 'Quello che hai notato' }) });
  await expect(noticed).toContainText('Perché, secondo te (parere)');
  await expect(noticed).toContainText('Troppo secco, credo.');
  await consent(page).check();
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith(ENDPOINT) && r.method() === 'POST'),
    page.getByRole('button', { name: 'Invia', exact: true }).click(),
  ]);
  expect(request.postDataJSON().answers).toEqual({ barrenZones: { where: 'I castagneti bassi verso Rieti.', opinion: 'Troppo secco, credo.' }, warning: 'Si perdono nella nebbia.' });
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
});

test('versione 1 archiviata: la vecchia bozza non si riapre e si può cancellare, le vecchie ricevute restano; una pagina vecchia riceve «ricarica la pagina»', async ({ page }) => {
  await page.goto('/questionario');
  await page.evaluate(([oldKey]) => {
    localStorage.setItem(oldKey, JSON.stringify({ savedAt: new Date().toISOString(), state: { format: 1, mode: 'breve', step: 'A', profile: { years: 30 } } }));
    localStorage.setItem(`${oldKey}:ricevute`, JSON.stringify([{ receipt: 'ABCDEFGH', sentAt: '2026-10-17T09:00:00.000Z' }]));
  }, [OLD_KEY]);
  const errors = await open(page);
  await expect(page.getByRole('button', { name: 'Riprendi la bozza' })).toHaveCount(0);
  const old = page.locator('.q-old-draft');
  await expect(old).toContainText('bozza della versione lunga');
  await expect(page.locator('.q-step .q-code')).toHaveText('ABCDEFGH');
  await old.getByRole('button', { name: 'Cancella la vecchia bozza' }).click();
  await expect(old).toContainText('Vecchia bozza cancellata.');
  expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBeNull();
  // il server rifiuta un corpo della versione 1 (pagina rimasta aperta prima dell'aggiornamento), senza salvarlo
  const before = await savedCount(page);
  const r = await page.evaluate(async ([url, body]) => {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, json: await res.json() };
  }, [ENDPOINT, { survey: 'esperti-reatino', version: 1, website: '', respondent: {}, consent: { anonymousUse: true }, answers: { profile: { years: 30 } } }]);
  expect(r.status).toBe(400);
  const out = r.json;
  expect(out.fields).toContain('version');
  expect(out.error).toMatch(/ricarica la pagina/);
  expect(await savedCount(page)).toBe(before);
  // la pagina mostra il messaggio del server così com'è
  await shortRun(page);
  await consent(page).check();
  await page.route(`**${ENDPOINT}`, (route) => route.fulfill({ status: 400, json: out }));
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ricarica la pagina');
  expect((await draft(page)).state.a.profile.years).toBe('da 15 a 29 anni');
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
  await page.route('https://**/*', (r) => r.abort());
  await page.route('**/api/weather/v1/forecast?**', (r) => r.fulfill({ status: 503, json: { error: 'Meteo non disponibile nella prova.' } }));
  await page.goto('/#/info');
  // conferma obbligatoria dell'avviso (dal 18/10 serve una conferma esplicita, non basta il vecchio marcatore)
  const onboarding = page.locator('#onboarding');
  await expect(onboarding).toBeVisible();
  await onboarding.locator('#ob-accept').click();
  await expect(onboarding).toBeHidden();
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
  await consent(page).check();
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
  await consent(page).check();
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
  expect((await draft(page)).state.a.profile.years).toBe('da 15 a 29 anni');
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
  await consent(page).check();
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
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  await page.getByRole('button', { name: 'Aggiungi un’altra zona' }).click();
  await page.getByRole('checkbox', { name: 'Porcino rosso (B. pinophilus)' }).check();
  await page.getByRole('button', { name: 'Aggiungi una specie' }).click();
  await page.getByLabel('Altra specie 1', { exact: true }).fill('Una specie dal nome molto lungo da provare');
  await fits('Tu e i funghi');
  await next(page);
  await fits('Le tue specie');
  await next(page);
  await page.getByLabel('Ci sono zone che sembrano adatte, ma non danno mai niente?').fill('x');
  await fits('Quello che hai notato');
  await next(page);
  await group(page, /Segnaleresti con l’app/).getByRole('radio', { name: 'Sì', exact: true }).check();
  await group(page, 'Vuoi che ti ricontatti?').getByRole('radio', { name: 'Sì', exact: true }).check();
  await fits('Con l’app');
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await fits('Riepilogo');
  await expect(page.locator('#informativa')).toBeAttached();
});

test('invio con la rete giù: messaggio chiaro, bozza salvata, si riprende e si invia', async ({ page }) => {
  await open(page);
  await shortRun(page);
  await consent(page).check();
  await page.route('**/api/survey/v1/responses', (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('manchi la connessione');
  await expect(title(page)).toHaveText('Riepilogo e invio');
  const saved = await draft(page);
  expect(saved.state.a.profile.years).toBe('da 15 a 29 anni');
  expect(saved.state.consent.anonymousUse).toBe(true);

  await page.unroute('**/api/survey/v1/responses');
  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la bozza' }).click();
  await expect(title(page)).toHaveText('Riepilogo e invio');
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Grazie!' })).toBeVisible();
  expect(await draft(page)).toBeNull();
});

test('invio vuoto: messaggio utile, nessuna richiesta e bozza conservata; «Leggi l’informativa» la apre', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Comincia', exact: true }).click();
  for (let i = 0; i < 3; i++) await next(page);
  await page.getByRole('button', { name: 'Vai al riepilogo' }).click();
  await page.getByRole('link', { name: 'Leggi l’informativa', exact: true }).click();
  await expect(page.locator('footer details#informativa')).toHaveAttribute('open', '');
  await consent(page).check();
  const posts = [];
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith(ENDPOINT)) posts.push(r); });
  await page.getByRole('button', { name: 'Invia', exact: true }).click();
  await expect(page.getByText(/Per inviare, rispondi ad almeno una domanda/)).toBeVisible();
  expect(posts).toHaveLength(0);
  await expect.poll(() => page.evaluate((key) => !!localStorage.getItem(key), KEY)).toBe(true);
});
