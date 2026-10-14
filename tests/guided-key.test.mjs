import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hit, matchItem, candidatesFor, nextQuestion } from '../js/guided-key.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url)));
const trees = read('recognize-trees'), plantsKey = read('recognize-plants');
const treeItems = Object.entries(trees.items).map(([id, x]) => ({ id, name: id, latin: '', traits: x.traits, confusables: x.confusables }));
const plantItems = Object.entries(plantsKey.items).map(([id, x]) => ({ id, name: id, latin: '', traits: x.traits }));

test('every key entry is a catalogue entry, with known values and https sources', () => {
  const catalogue = { trees: Object.keys(read('trees').trees), plants: Object.keys(read('plants').plants) };
  for (const [data, ids] of [[trees, catalogue.trees], [plantsKey, catalogue.plants]]) {
    for (const [id, x] of Object.entries(data.items)) {
      assert.ok(ids.includes(id), `${id} non è nel catalogo`);
      assert.ok(x.sources.length && x.sources.every((s) => /^https:\/\//.test(s.url)), `${id}: fonti`);
      for (const [k, v] of Object.entries(x.traits)) {
        if (v == null || !data.schema[k]) continue;
        const known = data.schema[k].values.map((o) => o.id);
        for (const val of [].concat(v)) assert.ok(known.includes(val), `${id}.${k}: valore sconosciuto ${val}`);
      }
    }
  }
  assert.equal(Object.keys(trees.items).length, catalogue.trees.length);
});

test('a missing trait never filters, a doubly toothed margin also counts as toothed', () => {
  assert.equal(hit(trees, 'leaf_margin', null, 'dentato'), null);
  assert.equal(hit(trees, 'leaf_margin', ['doppiamente_dentato'], 'dentato'), true);
  assert.equal(hit(trees, 'leaf_margin', ['dentato'], 'doppiamente_dentato'), false);
});

test('special marks only add agreement: their absence in the sources is not a contradiction', () => {
  const m = matchItem(plantsKey, { special: ['peli_urticanti'] }, { special: 'odore_aglio' });
  assert.deepEqual(m.contra, []);
});

test('the tree path starts from the leaf and a few answers bring the beech to the top', () => {
  assert.equal(nextQuestion(trees, candidatesFor(trees, treeItems, {}), {}), 'leaf_kind');
  const list = candidatesFor(trees, treeItems, { leaf_kind: 'foglia_larga', fruit_type: 'faggiola', bark: 'liscia_grigia' });
  assert.equal(list[0].id, 'faggio');
  // con gli aghi le domande sulle foglie larghe non si pongono
  const conifers = candidatesFor(trees, treeItems, { leaf_kind: 'aghi' });
  assert.ok(conifers.every((c) => c.traits.leaf_kind.includes('aghi') || c.contra.length <= 1));
  assert.ok(!['leaf_margin', 'leaf_shape', 'leaf_arrangement', 'leaf_type'].includes(nextQuestion(trees, conifers, { leaf_kind: 'aghi' })));
});

test('dangerous plants stay among the candidates even when an answer does not fit', () => {
  const items = plantItems.map((p) => ({ ...p, danger: p.id === 'cicuta' }));
  // cicuta: fiori bianchi, frutto secco, foglie divise; qui due risposte non tornano ma resta tra i candidati
  const list = candidatesFor(plantsKey, items, { flower_color: 'giallo', fruit_type: 'carnoso', leaf_margin: 'dentato' });
  assert.ok(list.some((c) => c.id === 'cicuta'));
  // e le piante a fiori gialli e foglie divise finissime trovano il finocchietto
  const fennel = candidatesFor(plantsKey, plantItems, { flower_color: 'giallo', leaf_type: 'molto_divisa_fine' });
  assert.ok(fennel.slice(0, 3).some((c) => c.id === 'finocchietto'));
});

test('the next question always splits the remaining candidates until none helps', () => {
  let ans = {}, steps = 0;
  for (;;) {
    const list = candidatesFor(plantsKey, plantItems, ans), k = nextQuestion(plantsKey, list, ans);
    if (!k || list.length <= 1 || steps > 12) break;
    const counts = plantsKey.schema[k].values.map((v) => list.filter((c) => hit(plantsKey, k, c.traits[k], v.id)).length);
    assert.ok(counts.filter(Boolean).length >= 2, `${k} non divide`);
    // risponde come l'ortica, per seguire un percorso reale
    ans = { ...ans, [k]: [].concat(plantsKey.items.ortica.traits[k] ?? [null])[0] };
    steps++;
  }
  assert.ok(candidatesFor(plantsKey, plantItems, ans).some((c) => c.id === 'ortica'));
});

test('every flower of the plant catalogue has key traits, and orchid answers bring the spurred purple orchids up', () => {
  const flowers = Object.entries(read('plants').plants).filter(([, p]) => p.category === 'Fiori').map(([id]) => id);
  assert.ok(flowers.length >= 12);
  for (const id of flowers) assert.ok(plantsKey.items[id], `${id}: manca nel percorso guidato`);
  // fiore con labello tipo orchidea, rosa-viola, con sperone
  const list = candidatesFor(plantsKey, plantItems, { flower_shape: 'labello', flower_color: 'rosa', special: 'sperone' });
  assert.ok(list.slice(0, 3).some((c) => c.id === 'orchide-maschia' || c.id === 'orchide-purpurea'));
  assert.ok(list.slice(0, 3).every((c) => c.traits.flower_shape?.includes('labello')));
  // le coppie di confronto citano solo schede presenti
  for (const c of plantsKey.confusables) for (const id of c.ids) assert.ok(plantsKey.items[id], `${c.title}: ${id}`);
});
