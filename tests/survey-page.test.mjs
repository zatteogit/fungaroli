// Questionario: la pagina (js/questionario.js), la redazione e il service worker usano lo schema condiviso
// (js/survey-schema.js) invece di ripeterne valori e limiti. Controlli statici sul codice delle pagine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUICK_ANSWERS, RESPONDENT_LIMITS, RISK_GATES, SURVEY_ENDPOINT, SURVEY_ID, fieldSpec, validateSurvey } from '../js/survey-schema.js';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const page = read('js/questionario.js');

// Campi definiti fuori dagli elenchi e richiamati per nome (zoneField, KNOWS_FIELD…).
const FIELD = /\bt: '(\w+)'(?:, of: '(\w+)')?, k: '(\w+)'/;
const shared = Object.fromEntries([...page.matchAll(/^const (\w+) = (\{ t: '\w+'.*\});$/gm)].filter(([, , def]) => FIELD.test(def)).map(([, name, def]) => [name, def]));
const block = (name) => {
  const m = page.match(new RegExp(`^const ${name} = \\[\\n([\\s\\S]*?)^\\];`, 'm'));
  assert.ok(m, `manca l'elenco ${name}`);
  return m[1];
};
// Le definizioni di un elenco: una per riga, oppure il nome di un campo condiviso.
function definitions(name) {
  return block(name).split('\n').flatMap((line) => {
    if (FIELD.test(line)) return [line];
    return line.split(/[\s,[\]]+/).filter((w) => shared[w]).map((w) => shared[w]);
  });
}
const GROUPS = { A_FIELDS: 'profile', SPECIES_FIELDS: 'species', C_FIELDS: 'rain', EVENT_FIELDS: 'weatherEvents', FLUSH_FIELDS: 'flushes',
  EMPTY_FIELDS: 'emptyTrips', F_FIELDS: 'forest', G_FIELDS: 'access', H_FIELDS: 'risks', I_FIELDS: 'followUp' };

test('ogni domanda della pagina ha il suo campo nello schema, con il percorso giusto', () => {
  let n = 0;
  for (const [name, prefix] of Object.entries(GROUPS)) {
    for (const def of definitions(name)) {
      const [, t, of, k] = def.match(FIELD);
      if (of === 'consent' || /send: false/.test(def)) continue;
      n++;
      if (of === 'respondent') { assert.ok(Number.isInteger(RESPONDENT_LIMITS[k]), `respondent.${k}`); continue; }
      const path = `${of || prefix}.${k}`;
      const spec = fieldSpec(path);
      assert.ok(spec, `la pagina chiede ${path}, che lo schema non conosce`);
      if (t === 'open') {
        assert.equal(spec.t, 'open', path);
        const declared = def.match(/path: '([\w.]+)'/)?.[1];
        assert.equal(declared, path, `risposte rapide di ${path}`);
        assert.equal(spec.key, path);
      }
      if (t === 'num') assert.ok(['int', 'dec'].includes(spec.t), path);
    }
  }
  assert.ok(n >= 60, `domande trovate: ${n}`);
  // ogni chiave delle risposte rapide è usata da una domanda della pagina
  for (const key of Object.keys(QUICK_ANSWERS)) assert.ok(page.includes(`path: '${key}'`), `risposte rapide non usate: ${key}`);
});

test('limiti, indirizzo e nome del questionario vengono dallo schema, non dalla pagina', () => {
  for (const name of Object.keys(GROUPS)) assert.doesNotMatch(block(name), /\b(?:max|min): \d/, `${name}: limiti scritti a mano`);
  for (const def of Object.values(shared)) assert.doesNotMatch(def, /\b(?:max|min): \d/);
  assert.ok(!page.includes(SURVEY_ENDPOINT) && !page.includes(`'${SURVEY_ID}'`), 'indirizzo o nome ripetuti nella pagina');
  assert.match(page, /import\('\.\/survey-schema\.js'\)/);
  assert.match(page, /S\.fieldSpec\(/);
  // controllo prima dell'invio con lo schema condiviso; il campo trappola lo giudica solo il server (201 finto)
  assert.match(page, /S\.validateSurvey\(\{ \.\.\.body, website: '' \}\)/);
  assert.equal(SURVEY_ENDPOINT, '/api/survey/v1/responses');
  assert.match(read('worker/index.js'), /startsWith\('\/api\/survey\/v1\/'\)\) return handleSurvey/);
  assert.equal(validateSurvey({ survey: SURVEY_ID, version: 1, consent: { anonymousUse: true }, respondent: { name: 'x'.repeat(RESPONDENT_LIMITS.name + 1) }, answers: {} }).errors[0].field, 'respondent.name');
});

test('redazione: pannello delle risposte per gli amministratori, con l’API dello schema', () => {
  const html = read('redazione.html'), cms = read('js/cms.js');
  assert.match(html, /<button class="btn ghost" id="cms-survey" type="button" hidden>Risposte al questionario<\/button>/);
  assert.match(html, /<dialog id="cms-survey-dialog"/);
  // «CSV per Excel» (punto e virgola, &sep=semicolon) come scelta principale; restano la virgola e il JSON
  assert.match(html, /<button type="button" class="btn primary" data-survey-download="csv-excel">CSV per Excel<\/button>/);
  assert.match(html, /data-survey-download="csv">CSV con la virgola<\/button>/);
  assert.match(html, /data-survey-download="json">/);
  assert.match(cms, /excel\?'&sep=semicolon':''/);
  assert.match(cms, /\$\{excel\?'-excel':''\}\.\$\{format\}/);
  assert.match(cms, /import \{ SURVEY_ID, SURVEY_ENDPOINT \} from '\.\/survey-schema\.js';/);
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

test('rischi: intossicazioni e specie evitate si raccontano solo dopo «Sì» al loro cancello', () => {
  const defs = block('H_FIELDS');
  for (const [gate, key] of RISK_GATES) {
    const g = defs.match(new RegExp(`\\{ t: 'choice', k: '${gate}'[^\\n]*`))?.[0];
    assert.ok(g, `manca il cancello ${gate}`);
    assert.match(g, /options: \(\) => RISK_GATE/);
    const open = defs.match(new RegExp(`\\{ t: 'open', k: '${key}'[^\\n]*`))?.[0];
    assert.ok(open, key);
    assert.match(open, new RegExp(`when: \\(o\\) => o\\.${gate} === 'sì'`), `${key} solo dopo «Sì»`);
    assert.ok(defs.indexOf(g) < defs.indexOf(open), 'prima il cancello, poi il testo');
    assert.doesNotMatch(open, /omitQuick|detail/);
    assert.equal(QUICK_ANSWERS[`risks.${key}`], undefined, 'nessuna risposta rapida di contenuto');
  }
  // bozza: i cancelli partono vuoti (nessuna scelta preimpostata)
  assert.match(page, /knowsPoisonings: null, avoidsSpecies: null/);
  // il riepilogo mostra il cancello con la sua etichetta e il testo solo se parte (stessa regola di payload)
  assert.match(page, /function summarizeFields[\s\S]*?if \(f\.when && !f\.when\(owner\)\) continue;/);
  assert.match(page, /function collectFields[\s\S]*?if \(f\.when && !f\.when\(o\)\) continue;/);
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

test('cancelli della stagione e degli episodi: si inviano come quelli dei rischi; le bozze vecchie si convertono una volta sola', () => {
  // schede specie: il cancello è un campo dello schema (species.seasonChanged), il dettaglio solo dopo «Sì»
  const species = block('SPECIES_FIELDS');
  assert.match(species, /\{ t: 'choice', k: 'seasonChanged'[^\n]*options: \(\) => SEASON_GATE \}/);
  assert.match(species, /\{ t: 'open', k: 'changed'[^\n]*when: \(o\) => o\.seasonChanged === 'sì'/);
  assert.doesNotMatch(page, /send: false|derive/, 'nessuna risposta che si vede e non parte');
  // parte D: anche il «No» parte (answers.weatherRemembers) e compare nel riepilogo
  assert.ok(fieldSpec('weatherRemembers'));
  assert.match(page, /const WEATHER_FIELD = \{ t: 'choice', k: 'remembers'[^\n]*options: \(\) => WEATHER_GATE \};/);
  assert.match(page, /if \(gate !== undefined\) answers\.weatherRemembers = gate;/);
  assert.match(page, /function weatherSummary\(\) \{[\s\S]*?\[WEATHER_FIELD\.short, fmtValue\(WEATHER_FIELD, gate\)\]/);
  // bozze: un cancello vuoto dopo «Cancella la scelta» resta vuoto; solo una bozza senza la chiave del cancello si converte
  assert.match(page, /upgradeDraft\(draft\.state\)/);
  assert.match(page, /if \(Object\.hasOwn\(risks, gate\)\) continue;/);
  const draft = { survey: SURVEY_ID, version: 1, consent: { anonymousUse: true }, answers: { species: [{ id: 'edulis', seasonChanged: 'sì' }], weatherRemembers: 'no' } };
  assert.equal(validateSurvey(draft).ok, true);
});
