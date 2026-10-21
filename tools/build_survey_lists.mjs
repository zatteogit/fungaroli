#!/usr/bin/env node
// Genera js/survey-species-names.js: nomi italiani, nomi latini e sinonimi delle specie del catalogo,
// per l'autocomplete del questionario (specie «altra», specie delle buttate). Così la pagina non carica
// i JSON grandi del catalogo. Uso: node tools/build_survey_lists.mjs  (riscrive il file)
//        node tools/build_survey_lists.mjs --check  (esce con errore se il file non è aggiornato)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SPECIES, fieldSpec } from '../js/survey-schema.js';

const root = new URL('../', import.meta.url);
const OUT = new URL('js/survey-species-names.js', root);
const MAX_OPTION = fieldSpec('species.name').max; // lunghezza massima del nome di una specie nelle risposte

const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// «Cyclocybe cylindracea (= Cyclocybe aegerita)» e «Russula virescens; Russula cyanoxantha» → nomi separati.
export const latinNames = (latin) => clean(latin).split(/;|\(=\s*/).map((s) => clean(s.replace(/\)\s*$/, ''))).filter(Boolean);

// Sinonimi senza indicazione regionale: «ovolaccio (Umbria)» resta fuori, perché nel Reatino
// lo stesso nome può indicare un'altra specie. «spinarolo / spinerolo» diventa due voci.
export const plainAliases = (list) => (list || []).flatMap((a) => /[()]/.test(a) ? [] : String(a).split('/')).map(clean).filter(Boolean);

export function buildSpeciesNames(traits, edible, identification) {
  const bySurvey = new Map(SPECIES.map((s) => [s.catalogId, s.id]));
  const extra = new Map((edible.species || []).map((s) => [s.id, s]));
  const names = Object.entries(traits.taxa).map(([id, t]) => {
    const name = clean(t.name || t.latin), latin = latinNames(t.latin);
    const seen = new Set([name.toLowerCase(), ...latin.map((l) => l.toLowerCase())]);
    const aliases = [...plainAliases(extra.get(id)?.aliases), ...plainAliases(identification.species?.[id]?.aka)]
      .filter((a) => !seen.has(a.toLowerCase()) && seen.add(a.toLowerCase()));
    return { id, name, latin, aliases, survey: bySurvey.get(id) || null };
  }).sort((a, b) => a.name.localeCompare(b.name, 'it') || a.id.localeCompare(b.id));
  for (const s of SPECIES) if (!names.some((n) => n.id === s.catalogId)) throw new Error(`Specie del questionario senza voce nel catalogo: ${s.id} → ${s.catalogId}`);
  const options = [];
  const add = (label) => { if (label.length <= MAX_OPTION && !options.includes(label)) options.push(label); };
  for (const n of names) add(n.latin[0] && n.latin[0] !== n.name ? `${n.name} (${n.latin[0]})` : n.name);
  for (const n of names) for (const l of n.latin.slice(1)) add(`${n.name} (${l})`);
  for (const n of names) for (const a of n.aliases) add(`${capital(a)} (${n.latin[0] || n.name})`);
  return { names, options };
}

export function render({ names, options }) {
  return `// Generato da tools/build_survey_lists.mjs: non modificare a mano.
// Fonti: data/species-traits.json (nomi italiani e latini), data/edible-catalog.json (sinonimi),
// data/species-id.json (nomi locali senza indicazione regionale).
// survey: l'id della specie nell'elenco del questionario (js/survey-schema.js), se c'è.
export const SPECIES_NAMES = ${JSON.stringify(names, null, 0).replace(/\},\{/g, '},\n  {').replace(/^\[/, '[\n  ').replace(/\]$/, ',\n]')};

// Testi per i suggerimenti (al massimo ${MAX_OPTION} caratteri): «Nome (Nome latino)», poi i sinonimi.
export const SPECIES_NAME_OPTIONS = ${JSON.stringify(options, null, 2)};
`;
}

export const generate = () => render(buildSpeciesNames(readJson('data/species-traits.json'), readJson('data/edible-catalog.json'), readJson('data/species-id.json')));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = generate();
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf8') !== output) { console.error('js/survey-species-names.js non è aggiornato: esegui node tools/build_survey_lists.mjs'); process.exit(1); }
    console.log('js/survey-species-names.js è aggiornato.');
  } else {
    writeFileSync(OUT, output);
    console.log(`Scritto ${fileURLToPath(OUT)}`);
  }
}
