// Questionario: la pagina (js/questionario.js), la redazione e il service worker usano lo schema condiviso
// (js/survey-schema.js) invece di ripeterne valori e limiti. Controlli statici sul codice delle pagine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANSWERS_SPEC, RESPONDENT_LIMITS, SURVEY_ENDPOINT, SURVEY_ID, SURVEY_VERSION, fieldSpec, validateSurvey } from '../js/survey-schema.js';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const page = read('js/questionario.js');

// Le domande della pagina: elenchi «const X_FIELDS = [ … ];», una definizione per riga con il suo percorso nello schema.
const block = (name) => {
  const m = page.match(new RegExp(`^const ${name} = \\[\\n([\\s\\S]*?)^\\];`, 'm'));
  assert.ok(m, `manca l'elenco ${name}`);
  return m[1];
};
const GROUPS = ['A_FIELDS', 'SPECIES_FIELDS', 'C_FIELDS', 'D_FIELDS'];
const paths = (name) => [...block(name).matchAll(/\{ t: '(\w+)', path: '([\w.]+)'/g)].map((m) => ({ t: m[1], path: m[2] }));

test('ogni domanda della pagina ha il suo campo nello schema v2, e ogni campo dello schema ha la sua domanda', () => {
  const asked = GROUPS.flatMap(paths);
  assert.equal(asked.length, 14, JSON.stringify(asked));
  for (const { t, path } of asked) {
    if (path === 'consent.recontact') continue;
    if (path.startsWith('respondent.')) { assert.ok(Number.isInteger(RESPONDENT_LIMITS[path.split('.')[1]]), path); continue; }
    const spec = fieldSpec(path);
    assert.ok(spec, `la pagina chiede ${path}, che lo schema non conosce`);
    const expected = { choice: 'enum', multi: 'set', months: 'set', texts: 'list', area: 'text', text: 'text' }[t];
    assert.equal(spec.t, expected, `${path}: controllo «${t}» per un campo «${spec.t}»`);
  }
  // nessun campo dello schema resta senza domanda (le schede: id e nome vengono dalla domanda 2)
  const leaves = [];
  const walk = (spec, prefix) => { for (const [k, f] of Object.entries(spec.fields)) { const p = prefix ? `${prefix}.${k}` : k; if (f.t === 'obj') walk(f, p); else if (f.t === 'list' && f.item.t === 'obj') walk(f.item, p); else leaves.push(p); } };
  walk(ANSWERS_SPEC, '');
  const askedPaths = new Set(asked.map((x) => x.path));
  for (const p of leaves) if (!['species.id', 'species.name'].includes(p)) assert.ok(askedPaths.has(p), `nessuna domanda per ${p}`);
});

test('limiti, indirizzo e nome del questionario vengono dallo schema, non dalla pagina', () => {
  for (const name of GROUPS) assert.doesNotMatch(block(name), /\b(?:max|min|count): \d/, `${name}: limiti scritti a mano`);
  assert.ok(!page.includes(SURVEY_ENDPOINT) && !page.includes(`'${SURVEY_ID}'`), 'indirizzo o nome ripetuti nella pagina');
  assert.match(page, /import\('\.\/survey-schema\.js'\)/);
  assert.match(page, /S\.fieldSpec\(/);
  // controllo prima dell'invio con lo schema condiviso; il campo trappola lo giudica solo il server (201 finto)
  assert.match(page, /S\.validateSurvey\(\{ \.\.\.body, website: '' \}\)/);
  assert.equal(SURVEY_ENDPOINT, '/api/survey/v1/responses');
  assert.match(read('worker/index.js'), /startsWith\('\/api\/survey\/v1\/'\)\) return handleSurvey/);
  assert.equal(validateSurvey({ survey: SURVEY_ID, version: SURVEY_VERSION, consent: { anonymousUse: true }, respondent: { name: 'x'.repeat(RESPONDENT_LIMITS.name + 1) }, answers: {} }).errors[0].field, 'respondent.name');
});

test('bozza per versione: chiave …:v2, le bozze v1 non si riaprono; ricevute leggibili anche dalla versione 1', () => {
  assert.match(page, /KEY = `fronda:questionario:\$\{SURVEY_ID\}:v\$\{SURVEY_VERSION\}`;/);
  assert.match(page, /return d\?\.state\?\.format === 2 \? d : null;/);
  assert.match(page, /OLD_KEYS = Array\.from\(\{ length: SURVEY_VERSION - 1 \}/);
  assert.match(page, /'Cancella la vecchia bozza'/);
  // le ricevute non dipendono dalla versione; quelle salvate dalla versione 1 restano visibili
  assert.match(page, /RECEIPTS_KEY = `fronda:questionario:\$\{SURVEY_ID\}:ricevute`;/);
  assert.match(page, /OLD_KEYS\.flatMap\(\(k\) => read\(`\$\{k\}:ricevute`\)\)/);
  // una pagina vecchia rimasta aperta: il server chiede di ricaricare, la pagina mostra il suo messaggio
  assert.match(page, /\(data\.fields \|\| \[\]\)\.includes\('version'\)/);
});

test('versione corta: titolo e introduzione dicono poche domande su ciò che sai per abitudine, «Non so» va benissimo', () => {
  const html = read('questionario.html');
  assert.match(html, /<title>Funghi nel Reatino: poche domande su quello che sai<\/title>/);
  assert.match(html, /<h1>Funghi nel Reatino: poche domande su quello che sai<\/h1>/);
  assert.match(page, /Sono poche domande, 3 o 4 minuti, su quello che sai per abitudine/);
  assert.match(page, /'«Non so» va benissimo\.'/);
  // nessuna domanda su episodi, numeri, stagioni passate, uscite a vuoto, quantità, classifiche
  const questions = GROUPS.map(block).join('\n');
  assert.doesNotMatch(questions, /quanti (?!anni)|quante |giorni dopo|buttat|uscit[ae] a vuoto|classific|stagione è cambiata|in che anno|ore di ricerca|ricordi/i);
  // dopo l'invio: invito a usare l'app sul campo, con «Annota» e la durata, e il link alla home
  assert.match(page, /tocca «Annota»: segna subito cosa hai trovato, oppure che non hai trovato niente, e quanto hai cercato\./);
  assert.match(page, /h\('a', \{ href: '\/', class: 'q-btn q-btn-primary' \}, 'Apri Fronda'\)/);
});

test('nome e contatto solo dopo «sì» o «forse» e la richiesta di ricontatto', () => {
  const d = block('D_FIELDS');
  assert.match(d, /path: 'consent\.recontact'[^\n]*when: reachableAnswer \}/);
  assert.match(d, /path: 'respondent\.name'[^\n]*when: wantsContact \}/);
  assert.match(d, /path: 'respondent\.contact'[^\n]*when: wantsContact \}/);
  assert.match(page, /const name = contact \? clean\(state\.respondent\.name/);
  // nessuna risposta già scelta: lo stato iniziale è vuoto
  assert.match(page, /years: null, zones: \[\], speciesSought: \[\], speciesOther: \[\]/);
  assert.match(page, /willReport: null/);
  assert.match(page, /consent: \{ anonymousUse: false, recontact: null \}/);
});

test('redazione: pannello delle risposte per gli amministratori, con l’API dello schema', () => {
  const html = read('redazione.html'), cms = read('js/cms.js');
  assert.match(html, /<button class="btn ghost" id="cms-survey" type="button" hidden>Questionari<\/button>/);
  assert.match(html, /<dialog id="cms-survey-dialog"/);
  // «CSV per Excel» (punto e virgola, &sep=semicolon) come scelta principale; restano la virgola e il JSON
  assert.match(html, /<button type="button" class="btn primary" data-survey-download="csv-excel">CSV per Excel<\/button>/);
  assert.match(html, /data-survey-download="csv">CSV con la virgola<\/button>/);
  assert.match(html, /data-survey-download="json">/);
  assert.match(cms, /excel\?'&sep=semicolon':''/);
  assert.match(cms, /\$\{excel\?'-excel':''\}\.\$\{format\}/);
  assert.match(cms, /import \{ SURVEY_ID, SURVEY_ENDPOINT, SURVEY_VERSION \} from '\.\/survey-schema\.js';/);
  // una versione per file: scelta nella finestra, &version nella richiesta e nel nome del file
  assert.match(html, /<select id="cms-survey-version"><option value="2">[^<]*<\/option><option value="1">[^<]*archiviata[^<]*<\/option><\/select>/);
  assert.match(cms, /'&version='\+encodeURIComponent\(version\)/);
  assert.match(cms, /questionario-\$\{SURVEY_ID\}-v\$\{version\}-/);
  assert.match(cms, /\$\('#cms-survey'\)\.hidden=!can\('admin'\)/);
  assert.doesNotMatch(cms.slice(cms.indexOf('function surveyRow')), /innerHTML/, 'le risposte si mostrano come testo');
});

test('service worker: il questionario resta fuori dalla shell dell’app', () => {
  const sw = read('sw.js');
  const rule = sw.match(/if\(\/(\^\\\/questionario.*?\$)\/\.test\(url\.pathname\)\)return;/);
  assert.ok(rule, 'manca la regola del questionario in sw.js');
  const re = new RegExp(rule[1]);
  for (const p of ['/questionario', '/questionario.html', '/questionario/']) assert.ok(re.test(p), p);
  for (const p of ['/questionario.css', '/js/questionario.js', '/questionari']) assert.ok(!re.test(p), p);
  assert.ok(sw.indexOf(rule[0]) < sw.indexOf("if (url.pathname.startsWith('/api/')) return;"));
});

test('campo trappola: nome che browser e gestori di password non riempiono; nel corpo la chiave resta «website»', () => {
  const html = read('questionario.html');
  const trap = html.match(/<div class="q-trap"([^>]*)>([\s\S]*?)<\/div>/);
  assert.ok(trap, 'manca il campo trappola');
  assert.match(trap[1], /aria-hidden="true"/);
  const input = trap[2].match(/<input [^>]*>/)[0];
  const attr = (name) => input.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  assert.equal(attr('id'), 'q-lascia-vuoto');
  assert.equal(attr('autocomplete'), 'off');
  assert.equal(attr('tabindex'), '-1');
  assert.equal(attr('type'), 'text');
  for (const flag of ['data-1p-ignore', 'data-bwignore', 'data-lpignore="true"']) assert.ok(input.includes(flag), flag);
  // parole che la compilazione automatica riconosce (in inglese e in italiano): né nell'id, né nel nome, né nell'etichetta
  const AUTOFILL = /web|url|site|sito|home|link|mail|name|nome|user|login|pass|phone|tel|fax|addr|indirizz|street|via|city|citt|zip|cap\b|postal|country|paese|company|azienda|organi|search|cerca|card|carta|cc-/i;
  const label = trap[2].match(/<label[^>]*>([^<]*)<\/label>/)[1];
  for (const v of [attr('id'), attr('name'), label]) assert.doesNotMatch(v, AUTOFILL, v);
  assert.match(trap[2], new RegExp(`<label for="${attr('id')}">`));
  // la pagina legge il campo con il nuovo id; il contratto del server non cambia
  assert.match(page, /website: \$\('#q-lascia-vuoto'\)\?\.value \|\| ''/);
  assert.doesNotMatch(page + html, /q-website/);
});

test('clickjacking: /questionario non si può mostrare in un riquadro di un altro sito (_headers di Workers Static Assets)', () => {
  // https://developers.cloudflare.com/workers/static-assets/headers/: «_headers» nella cartella degli asset,
  // non servito come asset; non vale per le risposte del Worker (run_worker_first).
  const headers = read('_headers');
  const rules = {};
  let current = null;
  for (const line of headers.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) { current = line.trim(); rules[current] = {}; continue; }
    const [name, ...value] = line.trim().split(':');
    rules[current][name.trim().toLowerCase()] = value.join(':').trim();
  }
  for (const path of ['/questionario', '/questionario.html']) {
    assert.equal(rules[path]?.['content-security-policy'], "frame-ancestors 'none'", path);
    assert.equal(rules[path]?.['x-frame-options'], 'DENY', path);
  }
  // il file sta nella cartella degli asset di wrangler.jsonc e il questionario non passa dal Worker
  const wrangler = read('wrangler.jsonc');
  assert.match(wrangler, /"directory": "\."/);
  const first = JSON.parse(wrangler.match(/"run_worker_first": (\[[^\]]*\])/)[1]);
  assert.ok(!first.some((p) => /questionario/.test(p) || p === '/*'), 'il Worker non deve servire la pagina');
  // .assetsignore non lo esclude (wrangler lo legge e non lo pubblica come file)
  const ignore = read('.assetsignore').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  assert.ok(!ignore.some((l) => /^\/?_headers$|^\/?_\*|^\*$/.test(l)), '.assetsignore esclude _headers');
  // limiti del servizio: al massimo 100 regole, righe sotto i 2.000 caratteri
  assert.ok(Object.keys(rules).length <= 100);
  assert.ok(headers.split('\n').every((l) => l.length < 2000));
});
