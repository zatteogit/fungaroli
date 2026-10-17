// Revisione privacy e sicurezza del questionario (/questionario): limite di invii per blocco IPv6,
// risposta 400 di dimensione limitata, CSV sicuro anche in Excel italiano, contatto salvato solo con
// un consenso che lo giustifica, informativa (art. 13 GDPR) coerente con il codice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// worker/survey.js importa la migrazione .sql e, tramite community.js, JSON senza attributi (come Wrangler).
register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && (url.endsWith('.sql') || url.endsWith('.json') && !context.importAttributes?.type)) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return {format: 'module', shortCircuit: true, source: 'export default ' + (url.endsWith('.sql') ? JSON.stringify(text) : text) + ';'};
  }
  return next(url, context);
}`));
const { handleSurvey, csvCell, toCsv, rateSubject, SURVEY_DAILY_LIMIT, MAX_ERRORS } = await import('../worker/survey.js');
const { validateSurvey } = await import('../js/survey-schema.js');

// D1 essenziale (come in tests/survey-api.test.mjs).
function d1(sql) {
  const stmt = (q, params = []) => {
    const exec = () => {
      const s = sql.prepare(q);
      if (/^\s*SELECT\b/i.test(q) || /\bRETURNING\b/i.test(q)) return { results: s.all(...params), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(s.run(...params).changes) } };
    };
    return { exec, bind: (...p) => stmt(q, p), all: async () => exec(), run: async () => exec(),
      first: async (col) => { const r = exec().results[0] ?? null; return col && r ? r[col] : r; } };
  };
  return { prepare: (q) => stmt(q), batch: async (list) => {
    sql.exec('BEGIN');
    try { const out = list.map((s) => s.exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; }
  } };
}
const ORIGIN = 'https://fungaroli.test', URL_RESPONSES = `${ORIGIN}/api/survey/v1/responses`;
const NOW = Date.parse('2026-10-16T10:00:00Z');
function setup() {
  const sql = new DatabaseSync(':memory:');
  for (const f of ['0001_community.sql', '0003_account_preferences.sql']) sql.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  return { sql, env: { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN, CMS_ADMIN_IDS: '', CMS_EDITOR_IDS: '' } };
}
const valid = (extra = {}) => ({
  survey: 'esperti-reatino', version: 1, startedAt: new Date(NOW - 600_000).toISOString(), website: '',
  respondent: { name: 'Mario', contact: '333 0000000' }, consent: { anonymousUse: true, recontact: true, diary: false },
  answers: { profile: { years: 30, zones: ['Terminillo'] } }, ...extra,
});
const post = (env, body, ip = '203.0.113.7') => handleSurvey(new Request(URL_RESPONSES, {
  method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body),
}), env, NOW);

test('connessione del limite: IPv4 intero, IPv6 per blocco /64, IPv4 mappato come IPv4', () => {
  assert.equal(rateSubject('203.0.113.7'), '203.0.113.7');
  assert.equal(rateSubject(' 203.0.113.7 '), '203.0.113.7');
  assert.equal(rateSubject(''), 'local');
  assert.equal(rateSubject('2001:db8:1:2::1'), '2001:0db8:0001:0002::/64');
  assert.equal(rateSubject('2001:DB8:1:2:AAAA:BBBB:CCCC:DDDD'), '2001:0db8:0001:0002::/64');
  assert.equal(rateSubject('2001:0db8:0001:0002:0000:0000:0000:0001'), '2001:0db8:0001:0002::/64');
  assert.equal(rateSubject('2001:db8::'), '2001:0db8:0000:0000::/64');
  assert.equal(rateSubject('::1'), '0000:0000:0000:0000::/64');
  assert.equal(rateSubject('fe80::1%eth0'), 'fe80:0000:0000:0000::/64');
  assert.notEqual(rateSubject('2001:db8:1:3::1'), rateSubject('2001:db8:1:2::1'));
  assert.equal(rateSubject('::ffff:203.0.113.7'), '203.0.113.7');
  assert.equal(rateSubject('::ffff:cb00:7107'), '203.0.113.7');
  assert.equal(rateSubject('64:ff9b::203.0.113.7'), '0064:ff9b:0000:0000::/64');
  // valori non riconosciuti: restano com'erano (e finiscono solo nell'hash)
  assert.equal(rateSubject('1::2::3'), '1::2::3');
  assert.equal(rateSubject('zz::1'), 'zz::1');
});

test('IPv6: cambiare indirizzo nello stesso /64 non aggira il limite giornaliero', async () => {
  const { sql, env } = setup();
  for (let i = 0; i < SURVEY_DAILY_LIMIT; i++) assert.equal((await post(env, valid(), `2001:db8:1:2::${(i + 1).toString(16)}`)).status, 201, `invio ${i + 1}`);
  assert.equal((await post(env, valid(), '2001:db8:1:2:ffff:ffff:ffff:ffff')).status, 429);
  assert.equal((await post(env, valid(), '2001:db8:1:3::1')).status, 201, 'un altro /64 è un’altra connessione');
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM survey_rate WHERE key NOT LIKE 'total:%'").get().n, 2);
  // né l'indirizzo né il blocco finiscono nel database
  for (const { name } of sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all())
    for (const r of sql.prepare(`SELECT * FROM ${name}`).all()) assert.ok(!/2001:0?db8/i.test(JSON.stringify(r)), name);
  // IPv4 e la sua forma mappata in IPv6 condividono il contatore
  for (let i = 0; i < SURVEY_DAILY_LIMIT; i++) assert.equal((await post(env, valid(), i % 2 ? '198.51.100.9' : '::ffff:198.51.100.9')).status, 201);
  assert.equal((await post(env, valid(), '198.51.100.9')).status, 429);
});

test('400: la risposta riporta al massimo MAX_ERRORS errori, anche con migliaia di chiavi sconosciute', async () => {
  const { sql, env } = setup();
  const body = valid();
  body.answers.profile = Object.fromEntries(Array.from({ length: 3000 }, (_, i) => ['k' + i, 1]));
  const raw = JSON.stringify(body);
  const r = await post(env, body);
  assert.equal(r.status, 400);
  const text = await r.text(), out = JSON.parse(text);
  assert.equal(out.errors.length, MAX_ERRORS);
  assert.equal(out.fields.length, MAX_ERRORS);
  assert.equal(out.fields[0], 'answers.profile.k0');
  assert.ok(text.length < raw.length, 'la risposta non è più grande della richiesta');
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='survey_responses'").get().n, 0);
  // con pochi errori resta tutto come prima: messaggio del singolo errore
  const one = await post(env, valid({ consent: { anonymousUse: false } }));
  assert.deepEqual((await one.json()).fields, ['consent.anonymousUse']);
});

// Excel aperto con un doppio clic: separa con il separatore della lingua («;» in italiano, «,» in inglese) e
// ignora le virgolette che non aprono il suo campo. Qui, per prudenza, si separa a ogni separatore e a ogni a capo,
// anche dentro le virgolette: se nessuno di questi pezzi è una formula, non lo è nemmeno una cella vera.
// Un pezzo che comincia con le virgolette si legge come un campo tra virgolette («""» vale «"»), con attaccato il
// testo che segue la chiusura: così fanno i lettori tolleranti (Python csv con strict=False e, secondo i revisori,
// Excel: non verificato con Excel vero). «""=1+1» vale quindi «=1+1».
const quotedValue = (piece) => {
  const open = piece.match(/^\s*"/);
  if (!open) return piece;
  let out = '', i = open[0].length;
  for (; i < piece.length; i++) {
    if (piece[i] !== '"') out += piece[i];
    else if (piece[i + 1] === '"') { out += '"'; i++; } else { i++; break; }
  }
  return out + piece.slice(i);
};
const excelCells = (csv, sep) => csv.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/).flatMap((line) => line.split(sep)).map(quotedValue);
const italianExcelCells = (csv) => excelCells(csv, ';');
const formula = (cell) => /^\s*[=+\-@\t\r]/.test(cell);
// Lettore tollerante del file intero, come Python csv con strict=False: le virgolette aprono un campo solo come
// primo carattere; dopo la chiusura il testo si attacca al campo; un a capo fuori dalle virgolette chiude la riga.
function lenientCells(text, sep) {
  const cells = []; let cell = '', quoted = false, start = true;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c !== '"') cell += c; else if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; continue; }
    if (start && c === '"') { quoted = true; start = false; continue; }
    if (c === sep || c === '\n' || c === '\r') { cells.push(cell); cell = ''; start = true; if (c === '\r' && text[i + 1] === '\n') i++; continue; }
    cell += c; start = false;
  }
  cells.push(cell);
  return cells;
}
// Testi ostili dei revisori (16/10/2026): virgolette subito dopo un separatore o un a capo.
const QUOTE_ATTACKS = ['Mario;"=1+1;x', 'vedi sotto,"=2+2,fine', 'x\n"=2+2;y', 'x\n"=3+3;y', 'a; "=4+4;b', '"=5+5"', 'a,"@SUM(1),b', 'a;"-1;b', 'a;"+1\n"=6+6'];

test('CSV: nessuna cella diventa formula, né con la virgola né con il punto e virgola di Excel italiano', () => {
  const nasty = 'pioggia;=HYPERLINK("http://x","clic");@SUM(1);  +1;-2\n=cmd|\' /C calc\'!A0\n- elenco puntato\r\n\t=1';
  assert.equal(csvCell('a;=1'), `"a;'=1"`);
  assert.equal(csvCell('a; -1'), `"a;' -1"`);
  assert.equal(csvCell('a\n@x'), `"a\n'@x"`);
  assert.equal(csvCell('a;b'), '"a;b"', 'il punto e virgola da solo resta, tra virgolette');
  assert.equal(csvCell('a;b-c=d'), '"a;b-c=d"', 'solo l’inizio di una cella conta');
  assert.equal(csvCell(['x;=1']), `"[""x;'=1""]"`);
  const answers = { profile: { zonesOther: nasty, mentor: { quick: [], text: nasty } }, risks: { confusions: { quick: [], text: nasty } },
    species: [{ id: 'altra', name: 'x;=1' }] };
  const csv = toCsv([{ id: '00000000-0000-4000-8000-000000000000', created_at: NOW, survey: 'esperti-reatino', version: 1, receipt: 'ABCDEFGH',
    duration_s: 1, name: '@nome;=2', contact: '+39;-3', consent_recontact: 1, consent_diary: 0, answers: JSON.stringify(answers) }]);
  assert.deepEqual(italianExcelCells(csv).filter(formula), []);
  // con la virgola (RFC 4180) ogni cella inizia con l'apostrofo, e il testo resta leggibile
  assert.ok(csv.includes(`"'@nome;'=2"`));
  assert.ok(csv.includes(`"'+39;'-3"`));
  // «CSV per Excel» (separatore «;»): nessuna formula né in Excel italiano né in Excel inglese (che separa sulla virgola)
  const forExcel = toCsv([{ id: '00000000-0000-4000-8000-000000000000', created_at: NOW, survey: 'esperti-reatino', version: 1, receipt: 'ABCDEFGH',
    duration_s: 1, name: '@nome,=2', contact: '+39;-3', consent_recontact: 1, consent_diary: 0, answers: JSON.stringify({ ...answers, profile: { ...answers.profile, zonesOther: nasty + ', -4,+5' } }) }], ';');
  assert.deepEqual(excelCells(forExcel, ';').filter(formula), []);
  assert.deepEqual(excelCells(forExcel, ',').filter(formula), []);
  assert.ok(forExcel.includes(`;"'@nome,'=2";"'+39;'-3";`));
  assert.equal(csvCell('a, -1', ';'), `"a,' -1"`);
  assert.equal(csvCell('a, -1'), '"a, -1"', 'con la virgola come separatore la virgola dentro le virgolette basta');
  // la versione con la virgola resta sicura in Excel italiano (sopra); in Excel inglese le virgolette aprono il campo
  assert.deepEqual(parseCsvLine(csv.split('\r\n')[1], ',').filter(formula), []);
});

test('CSV: le virgolette subito dopo un separatore o un a capo non aprono una formula, con i due file e i due separatori', () => {
  assert.equal(csvCell('Mario;"=1+1;x'), `"Mario;'""=1+1;x"`);
  assert.equal(csvCell('x\n"=2+2;y'), `"x\n'""=2+2;y"`);
  assert.equal(csvCell('a; "=4+4;b'), `"a;' ""=4+4;b"`);
  assert.equal(csvCell('vedi sotto,"=2+2,fine', ';'), `"vedi sotto,'""=2+2,fine"`);
  assert.equal(csvCell('vedi sotto,"=2+2,fine'), `"vedi sotto,""=2+2,fine"`, 'nel file con la virgola la virgola sta dentro un campo tra virgolette');
  assert.equal(csvCell('"citazione"'), '"""citazione"""', 'a inizio cella le virgolette restano: aprono il campo vero');
  const row = (i, text) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, created_at: NOW, survey: 'esperti-reatino', version: 1, receipt: 'ABCDEFG' + 'HJKLMNPQR'[i],
    duration_s: 1, name: text.slice(0, 80), contact: text, consent_recontact: 1, consent_diary: 0,
    answers: JSON.stringify({ profile: { zonesOther: text }, risks: { confusions: { quick: [], text }, knowsPoisonings: 'sì', poisonings: { quick: [], text } } }) });
  const rows = QUOTE_ATTACKS.map((t, i) => row(i, t));
  for (const sep of [',', ';']) {
    const file = toCsv(rows, sep);
    for (const read of [',', ';']) {
      assert.deepEqual(lenientCells(file.replace(/^\uFEFF/, ''), read).filter(formula), [], `file «${sep}» letto con «${read}»`);
      // il controllo prudente (a ogni separatore, anche tra virgolette) vale dove il file mette l'apostrofo
      if (sep === ';' || read === ';') assert.deepEqual(excelCells(file, read).filter(formula), [], `file «${sep}», pezzi con «${read}»`);
    }
  }
  // con l'apostrofo di prima (senza le virgolette) i due lettori trovano formule: la prova non è vuota
  const before = (v) => { const s = v.replace(/(^|[;\r\n])(?=\s*[=+\-@\t\r])/g, "$1'"); return /[",;\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const oldFile = QUOTE_ATTACKS.map(before).join(',');
  assert.notDeepEqual(lenientCells(oldFile, ';').filter(formula), []);
  assert.notDeepEqual(excelCells(oldFile, ';').filter(formula), []);
});

// Una riga CSV letta con le virgolette (come Excel quando le virgolette aprono il campo).
function parseCsvLine(line, sep) {
  const out = []; let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) { if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c; }
    else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) { out.push(cell); cell = ''; }
    else cell += c;
  }
  out.push(cell);
  return out;
}

test('contatto salvato solo con il «sì» al ricontatto o al taccuino', async () => {
  const body = (consent) => valid({ consent: { anonymousUse: true, ...consent } });
  assert.equal(validateSurvey(body({ recontact: false, diary: false })).value.respondent.contact, null);
  assert.equal(validateSurvey(body({})).value.respondent.contact, null);
  assert.equal(validateSurvey(body({ recontact: true })).value.respondent.contact, '333 0000000');
  assert.equal(validateSurvey(body({ diary: true })).value.respondent.contact, '333 0000000');
  assert.equal(validateSurvey(body({})).value.respondent.name, 'Mario', 'il nome resta facoltativo e indipendente');
  // un contatto troppo lungo è comunque un errore, anche senza consenso
  assert.equal(validateSurvey(valid({ respondent: { contact: 'x'.repeat(121) }, consent: { anonymousUse: true } })).ok, false);
  const { sql, env } = setup();
  const out = await (await post(env, body({ recontact: false, diary: false }))).json();
  const row = sql.prepare('SELECT name,contact,consent_recontact,consent_diary FROM survey_responses WHERE id=?').get(out.id);
  assert.deepEqual({ ...row }, { name: 'Mario', contact: null, consent_recontact: 0, consent_diary: 0 });
});

// Indirizzo del titolare: unica fonte data/legal.json, sezione «Privacy e dati» (link mailto).
function legalContact() {
  const legal = JSON.parse(readFileSync(new URL('../data/legal.json', import.meta.url), 'utf8'));
  const html = legal.info_sections.find((x) => x.id === 'privacy').html;
  const links = [...html.matchAll(/<a href="mailto:([^"]+)">([^<]+)<\/a>/g)];
  assert.equal(links.length, 1, 'un solo contatto nella privacy dell’app');
  assert.equal(links[0][1], links[0][2]);
  return links[0][1];
}

test('contatto del titolare: in data/legal.json e accettato dal sanificatore del CMS', async () => {
  const legal = JSON.parse(readFileSync(new URL('../data/legal.json', import.meta.url), 'utf8'));
  const address = legalContact();
  assert.equal(address, 'zatteo@gmail.com');
  const privacy = legal.info_sections.find((x) => x.id === 'privacy').html;
  assert.match(privacy, /esercitare i diritti sui tuoi dati o richiedere assistenza scrivi a <a href="mailto:zatteo@gmail\.com">zatteo@gmail\.com<\/a>\./);
  assert.doesNotMatch(privacy, /canale con cui hai ricevuto il link/);
  // il sanificatore del CMS (worker/content-validation.js) tiene il link mailto
  const { validateContent } = await import('../worker/content-validation.js');
  const clean = validateContent('legal', legal).value.info_sections.find((x) => x.id === 'privacy').html;
  assert.match(clean, /<a href="mailto:zatteo@gmail\.com" rel="noopener noreferrer">zatteo@gmail\.com<\/a>/);
});

test('testi della pagina: consenso senza «anonimo», niente dati di salute né di altre persone', () => {
  const page = readFileSync(new URL('../js/questionario.js', import.meta.url), 'utf8');
  const schema = readFileSync(new URL('../js/survey-schema.js', import.meta.url), 'utf8');
  // le risposte restano legate alla ricevuta e, se dati, a nome e contatto: sono dati personali, non anonimi
  assert.match(page, /'Acconsento all’uso delle mie risposte per studiare stagioni e condizioni dei funghi nel Reatino, come spiegato nell’informativa\. Nei risultati non compariranno il mio nome né il mio contatto\.'/);
  assert.match(page, /'Per inviare serve il tuo consenso: spunta la casella qui sopra\.'/);
  for (const text of [page, schema]) assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm, ''), /anonim/i);
  assert.equal(validateSurvey(valid({ consent: { anonymousUse: false } })).errors[0].message, 'Per inviare serve il tuo consenso: spunta la casella qui sopra.');
  // intossicazioni: niente dati sulla salute di persone riconoscibili, nemmeno di chi risponde
  assert.match(page, /k: 'poisonings'[^\n]*hint: 'Racconta specie, anno e zona\. Non scrivere chi era e non dare dettagli sulla salute di persone riconoscibili, nemmeno tua\.'/);
  // altri esperti: nessun nome o contatto di terzi, come dice l'informativa
  assert.match(page, /k: 'knowsOthers'[^\n]*hint: 'Non scrivere nomi o contatti di altre persone: gira loro il link\.'/);
  assert.doesNotMatch(page, /senza il loro permesso/);
});

test('ricevuta dopo l’invio: il contatto è il link dell’informativa, non un indirizzo scritto nel codice', () => {
  const page = readFileSync(new URL('../js/questionario.js', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'nessun indirizzo email nel codice della pagina');
  assert.doesNotMatch(page, /pagina Info del sito/);
  assert.match(page, /document\.querySelector\('#informativa a\[href\^="mailto:"\]'\)/);
  assert.match(page, /scrivimi e mandami questo codice: ', \.\.\.contactLink\(\)/);
});

test('informativa (art. 13 GDPR): elementi obbligatori e coerenza con il codice', async () => {
  const html = readFileSync(new URL('../questionario.html', import.meta.url), 'utf8');
  const info = html.match(/<section id="informativa"[\s\S]*?<\/section>/)?.[0];
  assert.ok(info, 'informativa presente nella pagina');
  const plain = info.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const [what, re] of [
    ['titolare', /Matteo Sgambato, titolare del trattamento/],
    ['finalità', /studiare le stagioni e le condizioni dei funghi nel Reatino/],
    ['uso del contatto', /contatto serve solo a ricontattarti o per il taccuino/],
    ['natura facoltativa', /ogni domanda è facoltativa/],
    ['base giuridica', /consenso \(art\. 6, par\. 1, lett\. a\)/],
    ['revoca del consenso', /Puoi ritirarlo quando vuoi/],
    ['destinatari', /Non cediamo i dati a nessuno/],
    ['fornitore', /Cloudflare è il fornitore del servizio/],
    ['trasferimenti extra UE', /fuori dall’Unione europea[\s\S]*Data Privacy Framework[\s\S]*clausole contrattuali standard/],
    ['conservazione', /risposte e il nome[\s\S]*31\/12\/2028[\s\S]*contatto[\s\S]*31\/12\/2027/],
    ['diritti', /vedere le tue risposte, averne una copia \(anche in un formato leggibile da computer\), correggerle, limitarne l’uso o cancellarle/],
    ['dati di salute', /Nelle domande sui rischi non scrivere dati sulla salute, tuoi o di altri/],
    ['contatto del titolare', /titolare del trattamento\. [^.]*\. Per scrivergli: \S+@\S+ \./],
    ['contatto per i diritti', /codice ricevuta a Matteo Sgambato: scrivi a \S+@\S+ \./],
    ['reclamo', /reclamo al Garante per la protezione dei dati personali/],
    ['decisioni automatiche', /Nessuna decisione automatica/],
    ['IP', /Indirizzo IP Non lo salviamo/],
  ]) assert.match(plain, re, what);
  // coerenza con il codice: si salvano invio e durata (non l'ora di inizio); l'hash si cancella entro il terzo giorno
  // (da 24 a circa 51 ore: cron alle 03:17 UTC), quindi «circa 2 giorni», non «al massimo»
  assert.match(plain, /quando hai inviato e quanto tempo hai impiegato/);
  const migration = readFileSync(new URL('../migrations/0004_survey.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
  assert.match(migration, /created_at INTEGER NOT NULL, duration_s INTEGER/);
  assert.doesNotMatch(migration, /started_at|\bip\b/i);
  assert.match(plain, /si cancella dopo circa 2 giorni \(le copie di sicurezza di Cloudflare/);
  assert.doesNotMatch(plain, /al massimo 2 giorni/);
  // l'impronta non va descritta come irreversibile: il sale sta nello stesso database
  assert.doesNotMatch(plain, /non permette di risalire|anonim[ao] l’IP|irreversibil/);
  // un solo contatto, lo stesso di data/legal.json (scelto da Matteo il 16/10/2026): niente telefono, niente altri indirizzi
  const address = legalContact();
  assert.match(address, /^[^@\s"<>]+@[^@\s"<>]+\.[a-z]{2,}$/);
  const mails = [...info.matchAll(/<a href="mailto:([^"]+)">([^<]+)<\/a>/g)];
  assert.equal(mails.length, 2, 'titolare e diritti');
  for (const [, href, text] of mails) { assert.equal(href, address); assert.equal(text, address); }
  assert.deepEqual([...new Set(info.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g))], [address], 'nessun altro indirizzo');
  assert.doesNotMatch(info, /tel:/);
  assert.doesNotMatch(plain, /pagina Info/, 'il contatto è nell’informativa, non altrove');
  // link esterni solo verso fonti ufficiali, senza referrer
  for (const a of info.match(/<a [^>]*href="https?:[^"]*"[^>]*>/g) || []) assert.match(a, /rel="noopener noreferrer"/);
});
