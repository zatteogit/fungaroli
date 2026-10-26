import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchTraits, retainCandidate, deadlyWarnings, traitSimilarity, traitSpread,comparisonTraitState } from '../js/identify-model.js';
const taxa = Object.entries(JSON.parse(fs.readFileSync(new URL('../data/species-traits.json', import.meta.url))).taxa).map(([key, t]) => ({ key, ...t }));
test('attaccatura: non applicabile ai porcini, distinta dai dati mancanti',()=>{
 for(const key of ['edulis','pinophilus','aereus','aestivalis'])assert.equal(comparisonTraitState(taxa.find(t=>t.key===key),'gill_attachment'),'not-applicable');
 for(const hymenophore of [['lamelle'],['pliche'],['lamelle','pori'],null,[]])assert.equal(comparisonTraitState({traits:{hymenophore,gill_attachment:null}},'gill_attachment'),'missing');
 for(const hymenophore of [['pori'],['aculei'],['liscio']])assert.equal(comparisonTraitState({traits:{hymenophore,gill_attachment:null}},'gill_attachment'),'not-applicable');
 assert.equal(comparisonTraitState({traits:{hymenophore:['lamelle'],gill_attachment:['libere']}},'gill_attachment'),'known');
 assert.equal(comparisonTraitState({traits:{stem_ring:false}},'stem_ring'),'known');
 assert.equal(comparisonTraitState({traits:{cap_color:null}},'cap_color'),'missing');
});
test('due risposte errate non eliminano Amanita phalloides', () => {
  const t = taxa.find((t) => t.latin === 'Amanita phalloides');
  const answers = { hymenophore: 'lamelle', hymenophore_color: 'bianco', cap_color: 'verde', stem_ring: false, stem_volva: false };
  const m = matchTraits(t, answers, Object.keys(answers).map((key) => ({ key })));
  assert.equal(m.contra.length, 2); assert.equal(retainCandidate(t, m), true);
  assert.ok(deadlyWarnings(taxa).includes(t));
});
test('nessuna checklist pubblica suggerisce assaggi per identificare', () => {
  const checklist = taxa.flatMap((t) => t.check_before_picking || []).join(' ');
  assert.doesNotMatch(checklist, /punta della lingua|frammento crudo|assaggio/i);
});

// --- indice di somiglianza per ordinare i sosia ---
const refOf = (id) => taxa.find((t) => t.edible_id === id && !t.lookalike_of?.length);
const sosiaOf = (ref) => taxa.filter((t) => t !== ref && t.lookalike_of?.includes(ref.edible_id))
  .sort((a, b) => traitSimilarity(ref, b, taxa) - traitSimilarity(ref, a, taxa));
test('la somiglianza è simmetrica, tra 0 e 1, e massima con se stesso', () => {
  for (const a of taxa.slice(0, 20)) for (const b of taxa.slice(0, 20)) {
    const s = traitSimilarity(a, b, taxa);
    assert.ok(s >= 0 && s <= 1, `${a.key}/${b.key} fuori scala: ${s}`);
    assert.equal(s, traitSimilarity(b, a, taxa));
    if (a !== b) assert.ok(traitSimilarity(a, a, taxa) > s, `${a.key} somiglia più a ${b.key} che a se stesso`);
  }
});
test('le assenze comuni a quasi tutti contano poco: il colore pesa più della volva', () => {
  const spread = traitSpread(taxa);
  assert.ok(spread.cap_color > spread.stem_volva && spread.hymenophore_color > spread.latex);
  const none = { stem_ring: false, stem_volva: false, latex: false, stem_reticulum: false, flesh_change: ['nessuno'] };
  const a = { key: 'a', traits: { ...none, cap_color: ['rosso'], hymenophore: ['lamelle'], cap_size: ['grande'] } };
  const b = { key: 'b', traits: { ...none, cap_color: ['bianco'], hymenophore: ['pori'], cap_size: ['piccolo'] } };
  assert.ok(traitSimilarity(a, b, taxa) < 0.5, 'due funghi diversi in tutto ciò che si vede non devono sembrare simili');
  assert.ok(traitSimilarity(a, b, taxa) < traitSimilarity(a, b), 'con i pesi del catalogo le assenze comuni contano meno');
});
test('i sosia curati somigliano alla specie più del resto del catalogo', () => {
  // AUC: probabilità che un sosia della lista superi un fungo qualsiasi che non lo è
  const aucs = taxa.filter((r) => r.edible_id && !r.lookalike_of?.length).map((ref) => {
    const pos = taxa.filter((t) => t !== ref && t.lookalike_of?.includes(ref.edible_id)), neg = taxa.filter((t) => t !== ref && !pos.includes(t));
    if (!pos.length) return null;
    let win = 0;
    for (const p of pos) for (const n of neg) { const d = traitSimilarity(ref, p, taxa) - traitSimilarity(ref, n, taxa); win += d > 0 ? 1 : d === 0 ? 0.5 : 0; }
    return [ref.edible_id, win / (pos.length * neg.length)];
  }).filter(Boolean);
  assert.ok(aucs.length >= 10);
  for (const [id, auc] of aucs) assert.ok(auc >= 0.75, `${id}: i sosia non emergono (AUC ${auc.toFixed(2)})`);
  assert.ok(aucs.reduce((s, [, a]) => s + a, 0) / aucs.length >= 0.9);
});
test('prima i sosia più somiglianti: casi di manuale', () => {
  // porcino: il porcino di fiele è il sosia classico; agarico violetto: prima il cortinario della stessa taglia, poi i piccoli
  assert.equal(sosiaOf(refOf('edulis'))[0].latin, 'Tylopilus felleus');
  const nuda = sosiaOf(refOf('nuda')).map((t) => t.latin);
  assert.equal(nuda[0], 'Cortinarius violaceus');
  const finferlo = sosiaOf(refOf('cibarius')).map((t) => t.latin);
  assert.ok(finferlo.indexOf('Cortinarius orellanus') > finferlo.indexOf('Hygrophoropsis aurantiaca'));
});
test('sosia pericolosi dei commestibili del catalogo: caratteri dal vocabolario e collegamenti validi', () => {
  const V = JSON.parse(fs.readFileSync(new URL('../data/species-traits.json', import.meta.url))).vocabulary;
  const keys = new Set(taxa.map((t) => t.key));
  for (const t of taxa) {
    assert.ok(V.toxicity[t.toxicity], `${t.key}: tossicità fuori vocabolario`);
    for (const [k, v] of Object.entries(t.traits || {})) {
      if (k === 'season' || v == null || typeof v === 'boolean') continue;
      for (const x of v) assert.ok(V[k]?.[x], `${t.key}: ${k}=${x} fuori vocabolario`);
    }
    for (const tr of t.trees || []) assert.ok(V.trees[tr], `${t.key}: albero ${tr} fuori vocabolario`);
    for (const d of t.dangerous_lookalikes || []) assert.ok(keys.has(d), `${t.key}: sosia ${d} inesistente`);
  }
  const dl = (k) => taxa.find((t) => t.key === k).dangerous_lookalikes;
  assert.ok(dl('agaricus-campestris').includes('agaricus-xanthodermus'));
  assert.ok(dl('morchella-esculenta').includes('gyromitra-esculenta'));
  assert.ok(dl('amanita-rubescens').includes('amanita-pantherina'));
  assert.ok(dl('tricholoma-portentosum').includes('tricholoma-equestre'));
  assert.ok(dl('marasmius-oreades').includes('clitocybe-rivulosa'));
  assert.ok(deadlyWarnings(taxa).some((t) => t.key === 'gyromitra-esculenta'));
});
