import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CHALLENGE_KEY, emptyProgress, normalizeProgress, loadProgress, saveProgress, challengeProgress, isComplete, hasStamp,
  toggleSeen, answerQuestion, resetChallenge, suggestChallenge, validateQuestion, isInSeason, stampSvg, itemKey,
} from '../js/challenges.js';

const read = (n) => JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`, import.meta.url)));
const data = read('challenges'), list = data.challenges;
const traits = read('species-traits').taxa, plants = read('plants').plants, trees = read('trees').trees;
const rPlants = read('recognize-plants').items, rTrees = read('recognize-trees').items;
const habitat = read('habitat').zones;

const traitsOf = (kind, id) => ({ fungo: traits[id]?.traits, pianta: rPlants[id]?.traits, albero: rTrees[id]?.traits }[kind]);
const checksOf = (kind, id) => (kind === 'fungo' ? traits[id]?.check_before_picking : null);
const sourcesOf = (kind, id) => ({
  fungo: traits[id]?.sources || [],
  pianta: [...(plants[id]?.sources || []), ...(rPlants[id]?.sources || [])],
  albero: [...(trees[id]?.sources || []), ...(rTrees[id]?.sources || [])],
}[kind]);
const record = (it) => (it.kind === 'albero' ? trees[it.id] : plants[it.id]);
const categoriesOf = (it) => (it.kind === 'albero' ? trees[it.id]?.forest_categories : plants[it.id]?.habitatCategories) || [];
const forestCategories = new Set(Object.values(habitat).flatMap((z) => Object.keys(z.forest?.categorie_ha || {})));

test('le sfide hanno id unici, tipi noti e testi presenti', () => {
  assert.equal(data.version, 1);
  assert.ok(list.length >= 6);
  assert.equal(new Set(list.map((c) => c.id)).size, list.length);
  for (const c of list) {
    assert.match(c.id, /^[a-z0-9-]+$/);
    assert.ok(['osserva', 'confronta', 'stagione'].includes(c.kind), c.id);
    for (const k of ['title', 'short', 'intro']) assert.ok(typeof c[k] === 'string' && c[k].trim(), `${c.id}.${k}`);
    if (c.stamp !== undefined) { assert.match(c.stamp, /^assets\/[a-zA-Z0-9_/-]+\.(svg|webp|png|jpe?g)$/); assert.ok(fs.existsSync(new URL(`../${c.stamp}`, import.meta.url)), c.stamp); }
    // niente verdetti di commestibilità o inviti alla raccolta nei testi delle sfide
    assert.doesNotMatch(JSON.stringify(c), /\b(commestibil|mangia|raccogli(?!ere\b)|tieni|scarta|trovane)/i, c.id);
  }
  for (const kind of ['osserva', 'confronta', 'stagione']) assert.ok(list.some((c) => c.kind === kind), kind);
});

test('Osserva e Di stagione: voci esistenti nei cataloghi, mai funghi, hint presi dalla scheda', () => {
  for (const c of list.filter((x) => x.kind !== 'confronta')) {
    assert.ok(c.items.length >= 3, c.id);
    assert.equal(new Set(c.items.map(itemKey)).size, c.items.length, `${c.id}: voci duplicate`);
    if (c.target !== undefined) assert.ok(Number.isInteger(c.target) && c.target >= 1 && c.target <= c.items.length, c.id);
    for (const it of c.items) {
      assert.ok(['albero', 'pianta'].includes(it.kind), `${c.id}: i funghi compaiono solo nelle sfide Confronta`);
      const r = record(it);
      assert.ok(r, `${c.id}: ${it.kind} ${it.id} non esiste`);
      const text = [...(r.recognize || []), r.leaf, r.season_tip].filter(Boolean).join(' \n ').toLowerCase();
      assert.ok(it.hint && text.includes(it.hint.toLowerCase()), `${c.id}: hint di ${it.id} non presente nella scheda`);
    }
    for (const cat of c.forest_categories || []) {
      assert.ok(forestCategories.has(cat), `${c.id}: categoria ${cat} assente dalla Carta Forestale`);
      assert.ok(c.items.some((it) => categoriesOf(it).includes(cat)), `${c.id}: nessuna voce legata a ${cat}`);
    }
  }
});

test('Di stagione: mesi validi e voci coerenti con la stagione', () => {
  for (const c of list) {
    if (c.kind !== 'stagione') { assert.equal(c.months, undefined, c.id); continue; }
    assert.ok(c.months.length && c.months.every((m) => Number.isInteger(m) && m >= 1 && m <= 12), c.id);
    for (const it of c.items) {
      if (it.kind === 'pianta') assert.ok(plants[it.id].flowerMonths.some((m) => c.months.includes(m)), `${c.id}: ${it.id} non fiorisce in quei mesi`);
      else if (c.months.every((m) => m >= 9 && m <= 11)) assert.match(trees[it.id].type, /caducifoglia/, `${c.id}: ${it.id} non è caducifoglio`);
    }
  }
  const spring = list.find((c) => c.id === 'fioriture-primavera');
  assert.ok(isInSeason(spring, 4)); assert.ok(!isInSeason(spring, 10));
  assert.ok(isInSeason(list.find((c) => c.kind === 'osserva'), 1));
});

test('Confronta: ogni domanda è verificabile dai dati e cita una fonte delle due schede', () => {
  for (const c of list.filter((x) => x.kind === 'confronta')) {
    assert.ok(c.questions.length >= 3 && c.questions.length <= 5, c.id);
    assert.ok(new Set(c.questions.map((q) => q.answer === q.a)).size === 2, `${c.id}: la risposta giusta non sta sempre nello stesso posto`);
    for (const q of c.questions) {
      assert.ok(['fungo', 'pianta', 'albero'].includes(q.kind));
      assert.equal(validateQuestion(q, { traitsOf, checksOf }), '', `${c.id}: ${q.ask}`);
      if (q.trait) {
        // esattamente una delle due ha il valore; l'altra ha il carattere non nullo senza quel valore
        const right = traitsOf(q.kind, q.answer)[q.trait], other = traitsOf(q.kind, q.answer === q.a ? q.b : q.a)[q.trait];
        assert.ok(Array.isArray(right) ? right.includes(q.value) : right === q.value);
        assert.ok(other !== null && other !== undefined);
        assert.ok(!(Array.isArray(other) ? other.includes(q.value) : other === q.value));
      }
      assert.match(q.source.url, /^https:\/\//);
      assert.ok([q.a, q.b].some((id) => sourcesOf(q.kind, id).some((s) => s.url === q.source.url)), `${c.id}: fonte non presente nelle schede (${q.source.url})`);
    }
  }
});

test('validateQuestion rifiuta domande che i dati non sostengono', () => {
  const base = { a: 'amanita-phalloides', b: 'agaricus-campestris', kind: 'fungo', ask: 'x', explain: 'y', source: { url: 'https://example.org' } };
  assert.equal(validateQuestion({ ...base, trait: 'stem_volva', value: true, answer: 'amanita-phalloides' }, { traitsOf, checksOf }), '');
  assert.match(validateQuestion({ ...base, trait: 'stem_volva', value: true, answer: 'agaricus-campestris' }, { traitsOf, checksOf }), /risposta/);
  assert.match(validateQuestion({ ...base, trait: 'hymenophore', value: 'lamelle', answer: 'amanita-phalloides' }, { traitsOf, checksOf }), /non distingue/);
  assert.match(validateQuestion({ ...base, trait: 'stem_ring', value: true, answer: 'amanita-phalloides' }, { traitsOf, checksOf }), /assente/);
  assert.match(validateQuestion({ ...base, trait: null, answer: 'amanita-phalloides', cite: [{ id: 'amanita-phalloides', text: 'testo inventato' }] }, { traitsOf, checksOf }), /non trovato/);
  assert.match(validateQuestion({ ...base, trait: 'stem_volva', value: true, answer: 'amanita-phalloides', source: { url: 'http://example.org' } }, { traitsOf, checksOf }), /https/);
});

test('progresso: spunte, completamento con target, timbro che resta anche rifacendo la sfida', () => {
  const ch = list.find((c) => c.id === 'alberi-faggeta');
  let p = emptyProgress();
  assert.deepEqual(challengeProgress(ch, p), { count: 0, total: 5, target: 4, complete: false });
  for (const it of ch.items.slice(0, 3)) p = toggleSeen(p, ch, it, '2026-10-14');
  assert.equal(isComplete(ch, p), false); assert.equal(p.done[ch.id], undefined);
  p = toggleSeen(p, ch, ch.items[3], '2026-10-14');
  assert.equal(isComplete(ch, p), true); assert.equal(p.done[ch.id], '2026-10-14');
  const before = structuredClone(p);
  p = toggleSeen(p, ch, ch.items[0], '2026-10-15');
  assert.deepEqual(before.seen[ch.id][itemKey(ch.items[0])], true, 'le funzioni non modificano il progresso ricevuto');
  assert.equal(isComplete(ch, p), false); assert.equal(hasStamp(ch, p), true); assert.equal(p.done[ch.id], '2026-10-14');
  assert.deepEqual(toggleSeen(p, ch, { kind: 'albero', id: 'leccio' }, 'x'), p, 'voce estranea ignorata');
  p = resetChallenge(p, ch);
  assert.equal(challengeProgress(ch, p).count, 0); assert.equal(hasStamp(ch, p), true);
});

test('progresso Confronta: una risposta per domanda, conteggio delle giuste', () => {
  const ch = list.find((c) => c.id === 'funghi-sosia');
  let p = emptyProgress();
  ch.questions.forEach((q, i) => { p = answerQuestion(p, ch, i, i === 0 ? (q.answer === q.a ? q.b : q.a) : q.answer, '2026-10-14'); });
  p = answerQuestion(p, ch, 0, ch.questions[0].answer, '2026-10-14');
  const pr = challengeProgress(ch, p);
  assert.equal(pr.complete, true); assert.equal(pr.correct, ch.questions.length - 1); assert.equal(p.done[ch.id], '2026-10-14');
  assert.deepEqual(answerQuestion(emptyProgress(), ch, 0, 'edulis', 'x').answers, {}, 'scelta fuori dalla coppia ignorata');
});

test('salvataggio locale: chiave v1, dati malformati scartati, errori di storage tollerati', () => {
  const mem = new Map(), storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const ch = list[0];
  const p = toggleSeen(emptyProgress(), ch, ch.items[0], '2026-10-14');
  assert.equal(saveProgress(p, storage), true);
  assert.ok(mem.has(CHALLENGE_KEY));
  assert.deepEqual(loadProgress(storage), p);
  assert.doesNotMatch(mem.get(CHALLENGE_KEY), /lat|lon|zona|zone/i, 'nessuna posizione nei progressi');
  mem.set(CHALLENGE_KEY, '{rotto');
  assert.deepEqual(loadProgress(storage), emptyProgress());
  assert.deepEqual(normalizeProgress({ version: 1, seen: { x: { a: 'si', b: true } }, answers: { y: { 0: 'a', z: 'b' } }, done: { x: 'ieri', y: '2026-10-01' } }),
    { version: 1, seen: { x: { b: true } }, answers: { y: { 0: 'a' } }, done: { y: '2026-10-01' } });
  const broken = { getItem() { throw new Error('bloccato'); }, setItem() { throw new Error('pieno'); } };
  assert.deepEqual(loadProgress(broken), emptyProgress());
  assert.equal(saveProgress(p, broken), false);
});

test('sfida suggerita: boschi principali della zona, mese, una sola e non completata', () => {
  const faggeta = { Faggeta: 1250, 'Arbusteto e macchia alta': 15 };
  assert.equal(suggestChallenge(list, { forest: faggeta, month: 7 }).id, 'alberi-faggeta');
  // in autunno la sfida di stagione sulla faggeta passa davanti
  assert.equal(suggestChallenge(list, { forest: faggeta, month: 10 }).id, 'colori-autunno');
  // le Confronta non vengono mai suggerite; un bosco minore non basta
  assert.equal(suggestChallenge(list, { forest: { Lecceta: 900, 'Pineta termofila': 10 }, month: 7 }), null);
  assert.equal(suggestChallenge(list, { forest: { Faggeta: 900, Lecceta: 800, Castagneto: 700, 'Pseudo-macchia': 600, Ostrieto: 1 }, month: 7, top: 3 }).id, 'alberi-faggeta');
  let p = emptyProgress();
  const fag = list.find((c) => c.id === 'alberi-faggeta');
  for (const it of fag.items) p = toggleSeen(p, fag, it, '2026-10-14');
  assert.equal(suggestChallenge(list, { forest: faggeta, month: 7, progress: p })?.id, 'margini-radure');
  assert.equal(suggestChallenge(list, {}), null);
  // tutte le zone reali hanno una sfida pertinente in ottobre
  for (const [id, z] of Object.entries(habitat)) assert.ok(suggestChallenge(list, { forest: z.forest?.categorie_ha, month: 10 }), id);
});

test('timbri SVG: doppio bordo, titolo sul bordo, immagine opzionale', () => {
  // timbro disegnato dal codice: per le sfide senza immagine e finché il timbro non è ottenuto
  const ch = { ...list.find((c) => c.kind === 'confronta'), stamp: undefined };
  const svg = stampSvg(ch, { earned: true });
  assert.match(svg, /<svg class="ch-stamp is-earned"/);
  assert.equal((svg.match(/<circle cx="50" cy="50" r="4[16]"/g) || []).length, 2);
  assert.match(svg, /<textPath[^>]*>SOSIA<\/textPath>/);
  assert.match(stampSvg(ch), /stroke-dasharray/);
  assert.match(stampSvg({ ...ch, stamp: 'assets/stamps/sosia.webp' }, { earned: true }), /<img class="ch-stamp-img" src="assets\/stamps\/sosia.webp"/);
  assert.doesNotMatch(stampSvg({ ...ch, stamp: 'javascript:alert(1)' }, { earned: true }), /<img/);
  assert.doesNotMatch(stampSvg({ ...ch, stampLabel: '<b>"x"</b>' }), /<b>/);
});

test('ogni timbro illustrato è un file in assets/stamps, uno per sfida', () => {
  for (const c of list.filter((x) => x.stamp)) {
    assert.equal(c.stamp, `assets/stamps/${c.id}.webp`, c.id);
    assert.ok(fs.existsSync(new URL(`../${c.stamp}`, import.meta.url)), `${c.id}: manca ${c.stamp}`);
  }
});
