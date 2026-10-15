import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { missing, redo } from '../tools/asset-requirements.mjs';

// Principio (AGENTS.md): a ogni aggiunta di dati si verifica che ci siano tutti gli asset.
// Ciò che manca oggi è elencato con il motivo in data/asset-pending.json; il rapporto completo
// si ottiene con node tools/asset-report.mjs.
const pending = JSON.parse(readFileSync(new URL('../data/asset-pending.json', import.meta.url), 'utf8'));
const listed = (cat) => ['pendenze', 'eccezioni'].flatMap((k) => (pending[k] || []).filter((g) => g.categoria === cat).flatMap((g) => g.voci));

test('ogni gruppo di pendenze ed eccezioni ha categoria, motivo e voci', () => {
  for (const g of [...pending.pendenze, ...pending.eccezioni]) {
    assert.ok(g.categoria && g.motivo?.trim().length > 10 && g.voci?.length, JSON.stringify(g).slice(0, 80));
  }
});

test('ogni asset richiesto dai dati c\'è, oppure è elencato con il motivo', () => {
  const { missing: miss } = missing();
  for (const [cat, items] of Object.entries(miss)) {
    const known = new Set(listed(cat));
    const fresh = items.filter((x) => !known.has(x));
    assert.deepEqual(fresh, [], `${cat}: asset mancanti non elencati in data/asset-pending.json`);
  }
});

test('le voci elencate mancano davvero (quando arrivano si tolgono dall\'elenco)', () => {
  const { missing: miss } = missing();
  for (const g of [...pending.pendenze, ...pending.eccezioni]) {
    const now = new Set(miss[g.categoria] || []);
    assert.deepEqual(g.voci.filter((x) => !now.has(x)), [], `${g.categoria}: voci da togliere da data/asset-pending.json`);
  }
});

test('immagini da rifare: il dato è cambiato dopo il disegno', () => {
  const want = (pending.da_rifare || []).map((x) => x.voce).sort();
  for (const x of pending.da_rifare || []) assert.ok(x.motivo?.trim(), x.voce);
  assert.deepEqual(redo(), want, 'elenco «da rifare» diverso da data/asset-pending.json (da_rifare)');
});
