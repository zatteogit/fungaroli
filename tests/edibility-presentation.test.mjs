// Presentazione della commestibilità (audit del 22/10, rilievi F1-F11): l'app descrive la specie,
// non dà un via libera. Niente verde sulle etichette «commestibile», niente giudizi gastronomici,
// etichetta e colore dei sosia dalla stessa fonte, la cautela del controllo micologico dove compare la commestibilità.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { speciesSafetyNote } from '../js/species-context.js';
import { factCards } from '../js/content-ui.js';
import { validateContent } from '../worker/content-validation.js';

const root = new URL('../', import.meta.url);
const text = (f) => fs.readFileSync(new URL(f, root), 'utf8');
const read = (f) => JSON.parse(text(`data/${f}`));
const traits = read('species-traits.json'), speciesId = read('species-id.json'), prep = read('preparation.json'), legal = read('legal.json');

// regole CSS «selettore { dichiarazioni }», anche dentro @media (i blocchi più interni)
const cssRules = (src) => [...src.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));
const cssFiles = fs.readdirSync(new URL('css/', root)).filter((f) => f.endsWith('.css')).map((f) => `css/${f}`);
const allRules = cssFiles.flatMap((f) => cssRules(text(f)).map((r) => ({ ...r, file: f })));
// elenco dei ruoli ammessi, non dei vietati: superfici e testi neutri, cautela, rischio, l'ambra chiaro sulle foto e i font.
// Così restano fuori anche i ruoli pubblici verdi nel tema chiaro (--brand, --link, --action, --focus, --line…)
const ALLOWED_VAR = /^--(?:surface(?:-[23])?|text(?:-2)?|muted|warn-(?:bg|ink)|caution(?:-bg|-ink)?|crit(?:-bg|-ink)?|on-crit|photo-warning|font-(?:body|display))$/;
// colori scritti a mano: ammesse solo le ombre nere
const LITERAL_COLOR = /#[0-9a-f]{3,8}\b|rgba?\((?!0[ ,]+0[ ,]+0\b)/i;
// fonte di una funzione nel sorgente: dalla dichiarazione alla successiva dichiarazione di primo livello
const fnSource = (src, decl) => {
  const at = src.indexOf(decl);
  assert.ok(at >= 0, decl);
  const next = src.slice(at + decl.length).search(/\n(?:export )?(?:async )?function |\nexport const |\nconst [A-Za-z]+ = \(/);
  return next < 0 ? src.slice(at) : src.slice(at, at + decl.length + next);
};

test('le etichette «commestibile» e il fungo di riferimento non usano colori positivi o verdi', () => {
  const edible = allRules.filter((r) => /tox-commestibile|tox-ok\b|\.cc-th\.ref|chip-ref|\.pill\.caution/.test(r.sel));
  assert.ok(edible.length >= 3, 'regole trovate');
  for (const r of edible) {
    assert.doesNotMatch(r.body, LITERAL_COLOR, `${r.file}: ${r.sel}`);
    for (const [, v] of r.body.matchAll(/var\((--[\w-]+)/g)) assert.match(v, ALLOWED_VAR, `${r.file}: ${r.sel} usa ${v}`);
  }
  for (const v of ['--ok-bg', '--ok-ink', '--brand', '--link', '--action', '--focus', '--forest', '--line', '--germoglio', '--s4']) assert.doesNotMatch(v, ALLOWED_VAR, v);
  // la base di .tox (usata da «commestibile» e «non commestibile») resta neutra
  const base = allRules.find((r) => r.file === 'css/style.css' && r.sel === '.tox');
  assert.match(base.body, /background:\s*var\(--surface-2\)/);
  assert.match(base.body, /color:\s*var\(--text-2\)/);
});

test('«commestibile con cautela»: fondo neutro, anello e «!» ambra, solo token pubblici', () => {
  const defs = allRules.filter((r) => /--caution(?:-bg|-ink)?\s*:/.test(r.body));
  assert.ok(defs.length >= 1);
  for (const r of defs) {
    for (const [, name, value] of r.body.matchAll(/(--caution(?:-bg|-ink)?)\s*:\s*([^;]+)/g)) {
      if (name === '--caution') assert.equal(value.trim(), 'var(--warn-ink)', r.sel);
      else assert.match(value.trim(), /^var\(--(?:surface(?:-[23])?|text(?:-2)?)\)$/, `${name}: ${value}`);
    }
  }
  const css = text('css/style.css');
  // il simbolo accompagna il colore: «!» sulle etichette con cautela e nella pillola della scheda
  assert.match(css, /tox-commestibile-con-cautela[^{]*::before\s*\{[^}]*content:\s*"!"/);
  assert.match(text('js/speciescard.js'), /class="pill caution"[^`]*<i aria-hidden="true">!<\/i>/);
  // didascalia della foto ingrandita dei sosia: fondo sempre scuro, anello e «!» nell'ambra chiaro delle foto in entrambi i temi
  const lb = allRules.filter((r) => r.file === 'css/style.css' && r.sel.startsWith('.lb-cap .tox-commestibile-con-cautela'));
  assert.match(lb.find((r) => !r.sel.includes('::before'))?.body || '', /box-shadow:\s*inset 0 0 0 1\.5px var\(--photo-warning\)/);
  assert.match(lb.find((r) => r.sel.endsWith('::before'))?.body || '', /content:\s*"!"[^}]*color:\s*var\(--photo-warning\)/);
});

test('«con cautela»: i fogli caricati dopo style.css non tolgono l’anello ambra alle etichette', () => {
  const order = [...text('index.html').matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)].map((m) => m[1]);
  const later = order.slice(order.indexOf('css/style.css') + 1);
  assert.ok(later.includes('css/species-pages.css'), later.join(' '));
  const sels = (r) => r.sel.split(',').map((x) => x.trim());
  let resets = 0;
  for (const f of later) {
    const rules = cssRules(text(f));
    rules.forEach((r, i) => {
      if (!/box-shadow:\s*none/.test(r.body)) return;
      for (const sel of sels(r).filter((x) => /\.tox$/.test(x))) {
        resets++;
        // stesso selettore con in più la classe della cautela, quindi più specifico: l'anello torna
        const back = rules.slice(i + 1).some((x) => sels(x).some((y) => y.includes('.tox-commestibile-con-cautela') && y.replace('.tox-commestibile-con-cautela', '') === sel)
          && /box-shadow:\s*inset 0 0 0 1\.5px var\(--caution\)/.test(x.body));
        assert.ok(back, `${f}: «${sel}» toglie l'anello a «con cautela»`);
      }
    });
  }
  assert.ok(resets >= 1, 'regola del confronto trovata');
});

test('la testata della scheda non mostra giudizi gastronomici: nessun renderer legge «edibility»', () => {
  for (const f of fs.readdirSync(new URL('js/', root)).filter((x) => x.endsWith('.js'))) {
    assert.doesNotMatch(text(`js/${f}`), /\bedibility\b/, `js/${f}`);
  }
  const card = text('js/speciescard.js');
  const hero = card.slice(card.indexOf('<p class="sp-badges">'), card.indexOf('<h1 class="phero-title">'));
  assert.match(hero, /TRAITS\[id\]/, 'etichetta a vocabolario chiuso di species-traits');
  assert.match(hero, /tox_label \|\| tx\.toxicity/);
  // il dato è stato tolto anche dal seed del CMS
  for (const [id, s] of Object.entries(speciesId.species)) assert.ok(!('edibility' in s), `species-id/${id}`);
});

test('CMS: il campo «edibility» non torna nelle schede delle specie modellate', () => {
  const old = structuredClone(speciesId);
  old.species.edulis.edibility = 'ottimo';
  const { value } = validateContent('species-id', old, speciesId);
  assert.ok(!('edibility' in value.species.edulis));
  assert.equal(value.species.edulis.name, speciesId.species.edulis.name);
});

test('etichette di commestibilità e preparazione a vocabolario chiuso, senza lodi né rassicurazioni', () => {
  const PRAISE = /ottim|\bbuon[oaie]\b|squisit|prelibat|delizi|eccellent|\bsicur|innocu/i;
  const labels = [
    ...Object.values(traits.vocabulary.toxicity),
    ...Object.values(traits.taxa).flatMap((t) => [t.tox_label, t.tox_short]),
    ...Object.values(prep.species || {}).map((p) => p.label),
  ].filter(Boolean);
  assert.ok(labels.length > 10);
  for (const l of labels) assert.doesNotMatch(l, PRAISE, l);
  const vocabulary = Object.keys(traits.vocabulary.toxicity);
  for (const [id, t] of Object.entries(traits.taxa)) assert.ok(vocabulary.includes(t.toxicity), `${id}: ${t.toxicity}`);
});

test('«I classici in cucina» descrivono usi, senza superlativi gastronomici', () => {
  const PRAISE = /\bottim[oaie]\b|\bil migliore\b|\bper eccellenza\b|\bperfett[oaie]\b|\bbuon[oaie]\b|\bapprezzat[oaie]\b|\bpreferit[oaie]\b/i;
  let n = 0;
  for (const [id, c] of Object.entries(prep.cucina || {})) {
    for (const t of [c.taste, c.local, ...(c.uses || []).map((u) => u.text)].filter(Boolean)) { assert.doesNotMatch(t, PRAISE, `${id}: ${t}`); n++; }
    for (const u of c.uses || []) assert.ok(u.sources?.length, `${id}: fonti dell'uso «${u.text}»`);
  }
  assert.ok(n > 40);
});

// sosia di species-id → scheda di species-traits, con la stessa regola di taxonKeyByLatin (js/identify.js)
const taxa = Object.entries(traits.taxa).map(([key, t]) => ({ key, ...t }));
const taxonOf = (latin) => { for (const b of String(latin || '').match(/[A-Z][a-z]+ [a-z]+/g) || []) { const t = taxa.find((x) => x.latin?.includes(b)); if (t) return t; } return null; };

test('sosia: etichetta e colore della scheda vengono dalla stessa classificazione', () => {
  const card = text('js/speciescard.js'), look = fnSource(card, 'function lookalikes(');
  assert.match(look, /TOX\[toxKeyOf\(l\)\]/, 'classe del colore da toxKeyOf');
  assert.doesNotMatch(look, /TOX\[l\.toxicity\]/, 'niente classe dal solo valore di species-id');
  assert.match(look, /esc\(toxOf\(l\)\)/, 'etichetta da toxOf');
  // anche nella didascalia della foto ingrandita
  assert.match(card, /<span class="tox tox-\$\{esc\(toxKeyOf\(x\.l\)\)[^`]*\$\{esc\(toxOf\(x\.l\)\)\}<\/span>/);
  assert.match(card, /const toxOf = \(l\) => TRAITS\[taxonKeyByLatin\(l\.latin\)\]\?\.tox_label \|\| toxKeyOf\(l\)/);
  assert.match(card, /const toxKeyOf = \(l\) => TRAITS\[taxonKeyByLatin\(l\.latin\)\]\?\.toxicity \|\| l\.toxicity/);
  // ogni classificazione ha la sua classe: «con cautela» non ricade su quella dei commestibili
  assert.match(card, /'commestibile con cautela': 'tox-commestibile-con-cautela'/);
});

// Incoerenze note fra species-id e species-traits, da risolvere con una fonte (non si cambiano i dati senza):
// la scheda mostra comunque etichetta e colore di species-traits. Il test fallisce se ne compare una nuova
// e anche quando una di queste viene risolta, così la voce si toglie da qui.
const KNOWN_MISMATCH = {
  'nuda/Laccaria amethystina': { 'species-id': 'commestibile', 'species-traits': 'commestibile con cautela' },
};
test('sosia: la classificazione coincide fra species-id e species-traits (salvo incoerenze note e segnalate)', () => {
  let checked = 0;
  const found = {};
  for (const [id, s] of Object.entries(speciesId.species)) for (const l of s.lookalikes || []) {
    const t = taxonOf(l.latin);
    if (!t || !l.toxicity) continue;
    checked++;
    if (t.toxicity !== l.toxicity) found[`${id}/${l.latin}`] = { 'species-id': l.toxicity, 'species-traits': t.toxicity };
  }
  assert.ok(checked > 40, `sosia confrontati: ${checked}`);
  assert.deepEqual(found, KNOWN_MISMATCH);
});

test('la cautela del controllo micologico accompagna ogni vista con la commestibilità', () => {
  // avviso unico, chiuso, con lo scudo e il «!» (non la spunta, che si leggerebbe «verificato»)
  const note = speciesSafetyNote();
  assert.match(note, /<details class="context-note species-context species-safety"/);
  assert.doesNotMatch(note, /<details[^>]*\bopen\b/);
  assert.match(note, /Prima del consumo/);
  assert.match(note, /Ispettorato micologico ASL/);
  assert.match(note, /M12 8v5M12 16h\.01/);
  assert.doesNotMatch(note, /m8 12 3 3 5-6/);
  assert.match(speciesSafetyNote(legal.species_footer), /Ispettorato/);
  for (const k of ['species_footer', 'identify_banner']) { assert.match(legal[k], /Ispettorato/i, k); assert.match(legal[k], /ASL/, k); }
  // cautele nelle schede: stesso scudo con «!»
  const caution = factCards([{ label: 'Preparazione e cautele', value: 'Solo cotte.', icon: 'shield', tone: 'caution' }]);
  assert.match(caution, /content-fact-caution/);
  assert.match(caution, /M12 8v5M12 16h\.01/);
  // schede modellate, schede di Riconosci e del catalogo, confronto, cucina, filtri dell'uscita
  const card = text('js/speciescard.js'), identify = text('js/identify.js'), app = text('js/app.js');
  assert.match(fnSource(card, 'export function renderSpeciesDetail('), /speciesSafetyNote\(FOOTER\)/);
  assert.match(fnSource(identify, 'export function renderTaxonView('), /speciesSafetyNote\(\)/);
  assert.match(identify, /class="cmp-verdict">[^\n]*Fai controllare il raccolto all’Ispettorato micologico ASL\./);
  assert.match(fnSource(card, 'function kitchen('), /Solo dopo il controllo del raccolto all’Ispettorato micologico\./);
  assert.match(app, /hasInterest\('funghi'\)\?'<p class="small muted fp-safety">Scegli cosa cercare, non cosa mangiare: fai controllare il raccolto all’Ispettorato micologico ASL\.<\/p>'/);
  assert.doesNotMatch(app, /Tutti i commestibili|\['edible', 'Commestibili'\]/);
  // il contatore di Scopri → Funghi usa lo stesso vocabolario del filtro
  assert.match(app, /specie: `\$\{catalog\.length\} con usi alimentari documentati · \$\{otherFungi\(\)\.length\} velenosi e sosia`/);
  assert.doesNotMatch(app, /\} commestibili ·/);
  // Riconosci: l'avviso dell'Ispettorato (legal.identify_banner, o il testo di ripiego) sta sopra le card dei candidati
  const idf = fnSource(identify, 'export function renderIdentify(');
  const warn = idf.search(/<details class="id-warn context-note"[^\n]*\$\{BANNER \? esc\(BANNER\) : "[^"]*Ispettorato micologico ASL[^"]*"\}/);
  assert.ok(warn >= 0, 'avviso con il banner');
  assert.ok(idf.indexOf('<ul class="id-cards">') > warn, 'avviso prima delle card');
  assert.match(app, /banner: legal\?\.identify_banner/);
});
