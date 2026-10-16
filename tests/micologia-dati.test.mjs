// Controlli sui dati dei funghi corretti dopo gli audit del 15-16/10: provenienza dei modelli 3D,
// classi di dimensione, motivo visibile delle classificazioni prudenziali, fonti di legge vigenti.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchTraits, traitQuestions, attentionGroups } from '../js/identify-model.js';
import { validateContent } from '../worker/content-validation.js';

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../data/${f}`, import.meta.url)));
const traits = read('species-traits.json'), speciesId = read('species-id.json'), media = read('media.json'), prep = read('preparation.json');
const taxa = Object.entries(traits.taxa).map(([key, t]) => ({ key, ...t }));
const FAOLEX = 'faolex.fao.org/docs/pdf/ita21952.pdf';

test('ogni modello 3D dichiara la provenienza: esemplare, riproduzione o non dichiarata', () => {
  const models = Object.entries(media.species).filter(([, v]) => v.model3d);
  assert.ok(models.length >= 6);
  for (const [id, { model3d }] of models) assert.ok(['esemplare', 'riproduzione', 'non dichiarata'].includes(model3d.provenance), `${id}: provenienza`);
  // modelli da museo (legno intagliato, cera) e modello senza provenienza nella fonte
  assert.equal(media.species.edulis.model3d.provenance, 'riproduzione');
  assert.equal(media.species.caesarea.model3d.provenance, 'riproduzione');
  assert.equal(media.species.mellea.model3d.provenance, 'non dichiarata');
  const card = fs.readFileSync(new URL('../js/speciescard.js', import.meta.url), 'utf8');
  assert.doesNotMatch(card, /esemplare reale/, 'la didascalia non è più la stessa per tutti i modelli');
});

test('le classi di dimensione del cappello coprono l’intervallo della scheda', () => {
  // piccolo fino a 5 cm, medio 5-12 cm, grande oltre 12 cm (domanda «Quanto è grande il cappello?»)
  let n = 0;
  for (const [id, s] of Object.entries(speciesId.species)) {
    const [a, b] = s.cap?.size_cm || [];
    if (a == null) continue;
    const t = taxa.find((x) => x.edible_id === id && !x.lookalike_of?.length);
    assert.ok(t, `${id}: taxon`);
    const cs = t.traits.cap_size || [];
    if (a < 5) assert.ok(cs.includes('piccolo'), `${id}: ${a}–${b} cm senza «piccolo»`);
    if (a <= 12 && b >= 5) assert.ok(cs.includes('medio'), `${id}: ${a}–${b} cm senza «medio»`);
    if (b > 12) assert.ok(cs.includes('grande'), `${id}: ${a}–${b} cm senza «grande»`);
    n++;
  }
  assert.ok(n >= 14);
  for (const k of ['virescens', 'nuda', 'repandum']) {
    const m = matchTraits(taxa.find((t) => t.key === k), { cap_size: 'grande' }, traitQuestions());
    assert.deepEqual(m.contra, [], `${k}: «grande» non deve contraddire la scheda`);
  }
});

test('l’ovolo ha lamelle libere: niente «adnate»', () => {
  assert.deepEqual(traits.taxa.caesarea.traits.gill_attachment, ['libere']);
});

test('pinarolo: il dato ANSES sul rischio anche da cotto è visibile e citato', () => {
  const p = prep.species.suillus, t = traits.taxa.suillus;
  assert.doesNotMatch(p.raw_why, /^Nessuna fonte/);
  assert.match(p.raw_why, /anche dopo la cottura/);
  assert.ok(p.sources.some((s) => /anses\.fr/.test(s.url)));
  assert.ok(t.sources.some((s) => /anses\.fr/.test(s.url)));
  assert.match(t.caution, /ANSES/);
  assert.equal(t.toxicity, 'commestibile con cautela');
  assert.match(t.tox_label, /ben cotto/);
});

test('le classificazioni prudenziali dicono il motivo, la classe resta «tossico»', () => {
  for (const t of taxa) if (t.toxicity === 'tossico' && /prudent/i.test([].concat(t.notes || []).join(' '))) assert.ok(t.caution?.trim(), `${t.key}: cautela mancante`);
  for (const k of ['russula-olivacea', 'amanita-crocea', 'chlorophyllum-rhacodes']) {
    const t = traits.taxa[k];
    assert.equal(t.toxicity, 'tossico', `${k}: la classe interna non cambia`);
    assert.ok(t.tox_label?.trim() && t.caution?.trim(), `${k}: etichetta e cautela`);
    assert.match(t.caution, /L’app non la propone/);
  }
  assert.ok(traits.taxa['russula-olivacea'].sources.some((s) => /anses\.fr/.test(s.url)));
});

test('le fonti di legge sono il testo coordinato vigente, non la copia FAOLEX superata', () => {
  for (const [name, d] of [['species-traits', traits], ['species-id', speciesId]]) assert.ok(!JSON.stringify(d).includes(FAOLEX), `${name}: FAOLEX ita21952`);
  // chiodino: nessuna taglia minima (art. 3 c. 2 bis), non una «deroga per i cespi»
  for (const d of [traits.taxa.mellea, speciesId.species.mellea]) assert.ok(!d.sources.some((s) => /deroga/.test(s.title)));
  // verdone 4 cm, R. cyanoxantha 3 cm
  const vr = traits.taxa.virescens.field_rules.find((r) => /Taglia minima/.test(r.text));
  assert.match(vr.text, /4 cm per il verdone/);
  assert.match(vr.text, /3 cm .*cyanoxantha/);
  // stesso testo nella scheda di species-id (avvisi): nessun testo attribuisce 4 cm a tutto il gruppo
  const vw = speciesId.species.virescens.warnings.find((w) => /Taglia minima/.test(w));
  assert.equal(vw, vr.text);
});

test('contenitori: niente plastica, nemmeno rigida o forata (L. 352/1993, art. 5 c. 4)', () => {
  const r = traits.general_rules.find((x) => /plastica/.test(x.text));
  assert.ok(r, 'regola dei contenitori');
  assert.match(r.text, /nemmeno rigidi o forati/);
  assert.match(r.source, /normattiva\.it.*352~art5/);
  assert.ok(traits.citations[r.source]?.author);
});

test('l’indice degli avvisi conta gli avvisi sui sosia, non i sosia', () => {
  const rules = [...traits.taxa.caesarea.field_rules].sort((a, b) => (a.severity === 'critico' ? 0 : 1) - (b.severity === 'critico' ? 0 : 1));
  const txt = attentionGroups(rules).map((g) => g.text);
  assert.ok(txt.includes('2 avvisi sui sosia'), txt.join(' · '));
  assert.ok(!txt.some((x) => /sosia pericolos/.test(x)));
  assert.deepEqual(attentionGroups([{ kind: 'sosia' }]).map((g) => g.text), ['1 avviso sui sosia']);
});

test('i dati corretti restano validi per il CMS', () => {
  for (const [id, d] of [['species-traits', traits], ['species-id', speciesId], ['media', media], ['preparation', prep]]) assert.doesNotThrow(() => validateContent(id, d), id);
});
