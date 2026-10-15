#!/usr/bin/env node
// Rapporto degli asset: richiesti dai dati, mancanti, eccezioni e da rifare.
//   node tools/asset-report.mjs              rapporto in testo (per la descrizione della PR)
//   node tools/asset-report.mjs --json       lo stesso in JSON
//   node tools/asset-report.mjs --snapshot   dopo un import di icone ridisegnate: riscrive
//                                            data/asset-drawn-from.json con i dati di oggi
// L'elenco delle pendenze (data/asset-pending.json) si aggiorna a mano, con il motivo:
// il test tests/asset-completeness.test.mjs fallisce se un asset manca senza essere elencato
// o se una voce elencata non manca più.
import { writeFileSync, readFileSync } from 'node:fs';
import { load, missing, redo, coherence, snapshot } from './asset-requirements.mjs';

const d = load();
const arg = process.argv[2];
if (arg === '--snapshot') {
  const out = { note: d.drawnFrom.note, generated: new Date().toISOString().slice(0, 10), icons: snapshot(d) };
  writeFileSync(new URL('../data/asset-drawn-from.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
  console.log(`${Object.keys(out.icons).length} icone registrate`);
  process.exit(0);
}
const pending = JSON.parse(readFileSync(new URL('../data/asset-pending.json', import.meta.url), 'utf8'));
const { missing: miss, required } = missing(d);
const listed = (cat, kind) => (pending[kind] || []).filter((g) => g.categoria === cat).flatMap((g) => g.voci);
const report = Object.keys({ ...required, ...miss }).sort().map((cat) => ({
  categoria: cat, richiesti: required[cat] || 0, mancanti: (miss[cat] || []).length,
  da_fare: listed(cat, 'pendenze').length, eccezioni: listed(cat, 'eccezioni').length,
  non_elencati: (miss[cat] || []).filter((x) => !listed(cat, 'pendenze').includes(x) && !listed(cat, 'eccezioni').includes(x)),
}));
const out = { report, da_rifare: redo(d), incoerenze: coherence(d) };
if (arg === '--json') console.log(JSON.stringify(out, null, 1));
else {
  console.log('| Categoria | Richiesti | Mancanti | Da fare | Eccezioni | Non elencati |\n|---|---:|---:|---:|---:|---:|');
  for (const r of report) console.log(`| ${r.categoria} | ${r.richiesti} | ${r.mancanti} | ${r.da_fare} | ${r.eccezioni} | ${r.non_elencati.length} |`);
  console.log(`\nDa rifare (dato cambiato dopo il disegno): ${out.da_rifare.length ? out.da_rifare.join('; ') : 'nessuna'}`);
  console.log(`Incoerenze tra immagini e dati: ${out.incoerenze.length ? out.incoerenze.join('; ') : 'nessuna'}`);
  for (const r of report) if (r.non_elencati.length) console.log(`\nNon elencati in ${r.categoria}:\n  ${r.non_elencati.join('\n  ')}`);
}
