// Asset richiesti dai dati: le immagini si disegnano dai dati, mai il contrario (AGENTS.md).
// Usato da tests/asset-coherence.test.mjs, tests/asset-completeness.test.mjs e tools/asset-report.mjs.
//
// coherence(): ogni voce degli indici delle immagini (trait-icons.json, tree-trait-icons.json, file in
//   assets/traits e assets/tree-traits, varianti dei luoghi, punti di ritaglio) corrisponde a un valore
//   che esiste nei dati. Restituisce l'elenco degli errori.
// missing(): per ogni entità e valore dei dati, gli asset che mancano, per categoria.
// redo(): le icone il cui dato è cambiato dopo il disegno (confronto con data/asset-drawn-from.json).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { STAGE_IDS, STAGE_TILES } from '../worker/content-validation.js';
import { SEASONS, WEATHERS } from '../js/zone-cover.js';

const ROOT = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const has = (p) => !!p && existsSync(new URL(p.replace(/^\//, ''), ROOT));
const list = (v) => [].concat(v ?? []);

export function load() {
  return {
    traits: read('data/species-traits.json'),
    icons: read('data/trait-icons.json'),
    trees: read('data/trees.json').trees,
    recTrees: read('data/recognize-trees.json'),
    treeIcons: read('data/tree-trait-icons.json'),
    plants: read('data/plants.json').plants,
    recPlants: read('data/recognize-plants.json'),
    media: read('data/media.json'),
    mediaTrees: read('data/media-trees.json').trees,
    zones: read('data/zones.json').zones,
    mediaZones: read('data/media-zones.json').zones,
    crops: read('data/crop-points.json').files,
    drawnFrom: read('data/asset-drawn-from.json'),
  };
}

export const ICON_PARTS = ['cappello', 'sotto', 'gambo'];
// tessere dei valori degli alberi: le domande che si pongono, senza taglia, ambiente e segni particolari
const TREE_KEYS = (schema) => Object.entries(schema).filter(([k, q]) => q.ask && !['size', 'habitat', 'special'].includes(k));
// copertine dei luoghi: ogni stagione con sereno, nuvoloso, nebbia e pioggia; la neve solo d'inverno
export const COVER_COMBOS = SEASONS.flatMap((s) => WEATHERS.filter((w) => w !== 'neve' || s === 'inverno').map((w) => `${s}-${w}`));

const traitFile = (name) => `assets/traits/${name}.webp`;

// foto di un fungo: come photosOf in js/identify.js (scheda commestibile, archivio specie, sosia per nome latino)
export function fungusPhotos(d, key) {
  const t = d.traits.taxa[key], S = d.media.species || {}, L = d.media.lookalikes || {};
  const m = S[t.edible_id] || S[key] || L[t.latin?.match(/[A-Z][a-z]+ [a-z]+/)?.[0]]
    || L[Object.keys(L).find((x) => x.toLowerCase().replace(/[^a-z]+/g, '-') === key || x.endsWith(' ' + t.latin?.split(' ')[1])) || ''];
  return m ? [m.ref, ...(m.inat || [])].filter(Boolean) : [];
}

// foto: file, miniatura, punto di ritaglio, crediti (autore, licenza, pagina della fonte)
function photoGaps(p, crops, { thumb = true } = {}) {
  const out = [];
  if (!has(p.file)) out.push('file');
  if (thumb && !has(p.thumb)) out.push('miniatura');
  if (![p.file, p.file_hd, p.thumb].some((f) => f && crops[f])) out.push('ritaglio');
  if (!['author', 'license', 'page'].every((k) => typeof p[k] === 'string' && p[k].trim())) out.push('crediti');
  return out;
}

export function missing(d = load()) {
  const out = {}, add = (cat, id, what) => (out[cat] ||= []).push(what ? `${id} (${what})` : id);
  const required = {};
  const need = (cat) => { required[cat] = (required[cat] || 0) + 1; };
  // ogni foto si conta una volta, anche se serve a più schede
  const seen = new Set();
  const photo = (p, opts) => {
    if (!p?.file || seen.has(p.file)) return;
    seen.add(p.file); need('foto-dettagli');
    const g = photoGaps(p, d.crops, opts);
    if (g.length) add('foto-dettagli', p.file, g.join(', '));
  };
  for (const [key, t] of Object.entries(d.traits.taxa)) {
    const tr = t.traits || {}, ic = d.icons.taxa[key] || {}, base = ic.base || {};
    // icone base: cappello, sotto, fungo intero
    for (const part of ICON_PARTS) { need('funghi-base'); if (!has(traitFile(`${key}-${part}`))) add('funghi-base', `${key}-${part}`); }
    // una variante per ogni colore del cappello diverso dal disegno base (cappello e fungo intero)
    const colors = list(tr.cap_color);
    if (colors.length > 1 && !base.colore) { need('funghi-colore'); add('funghi-colore', `${key}`, 'colore del disegno base non dichiarato'); }
    for (const c of colors) if (c !== base.colore && base.colore) {
      need('funghi-colore');
      const gaps = ['cappello', 'gambo'].filter((p) => !has(traitFile(`${key}-${p}-${c}`)));
      if (gaps.length) add('funghi-colore', `${key}:${c}`);
    }
    // forme: dove ci sono le fasi di crescita, le fasi sostituiscono le varianti di forma
    const shapes = list(tr.cap_shape);
    if (!t.stages?.length) {
      if (shapes.length > 1 && !base.forma) { need('funghi-forma'); add('funghi-forma', `${key}`, 'forma del disegno base non dichiarata'); }
      for (const f of shapes) if (f !== base.forma && base.forma) {
        need('funghi-forma');
        if (['cappello', 'gambo'].some((p) => !has(traitFile(`${key}-${p}-${f}`)))) add('funghi-forma', `${key}:${f}`);
      }
    }
    // fasi: ogni tessera che cambia; la sezione dell'uovo («taglio») ha la sua categoria
    for (const s of t.stages || []) for (const tile of s.tiles) {
      const cat = tile === 'taglio' ? 'funghi-sezione-uovo' : 'funghi-fasi';
      need(cat);
      if (!has(traitFile(`${key}-${tile}-fase-${s.id}`))) add(cat, `${key}-${tile}-fase-${s.id}`);
    }
    // foto del fungo
    const ph = fungusPhotos(d, key);
    need('funghi-foto');
    if (!ph.length) add('funghi-foto', key, 'nessuna foto');
    for (const p of ph) photo(p);
  }
  // alberi: un'icona per ogni valore delle domande; ogni albero con foto
  for (const [k, q] of TREE_KEYS(d.recTrees.schema)) for (const v of q.values) {
    need('alberi-valori');
    if (!has(`assets/tree-traits/${k}-${v.id}.webp`) || !list(d.treeIcons.values[k]).includes(v.id)) add('alberi-valori', `${k}-${v.id}`);
  }
  for (const id of Object.keys(d.trees)) {
    const m = d.mediaTrees[id], ph = m ? Object.values(m).filter(Array.isArray).flat() : [];
    need('alberi-foto');
    if (!ph.length) add('alberi-foto', id, 'nessuna foto');
    for (const p of ph) photo(p);
  }
  // piante: foto con miniatura, ritaglio e crediti
  for (const [id, p] of Object.entries(d.plants)) {
    need('piante-foto');
    if (!p.photos?.length) add('piante-foto', id, 'nessuna foto');
    for (const ph of p.photos || []) photo(ph);
  }
  // luoghi: foto reale e copertine per ogni stagione e meteo (o la foto reale che copre quella combinazione)
  for (const z of d.zones) {
    const m = d.mediaZones[z.id];
    need('luoghi-foto');
    if (!m) { add('luoghi-foto', z.id, 'nessuna foto'); continue; }
    photo(m);
    const have = new Set([...(m.variants || []).filter((v) => has(v.file)).map((v) => `${v.season}-${v.weather}`), m.season && m.weather ? `${m.season}-${m.weather}` : null]);
    for (const c of COVER_COMBOS) { need('luoghi-copertine'); if (!have.has(c)) add('luoghi-copertine', `${z.id}:${c}`); }
    // le copertine elaborate usano la miniatura della foto reale
    for (const v of m.variants || []) photo(v, { thumb: false });
  }
  for (const k of Object.keys(out)) out[k].sort();
  return { missing: out, required };
}

// valori disegnati in un'icona: per tessera, i campi dei dati che il disegno mostra
const DRAWN = {
  cappello: ['cap_veil', 'cap_surface'],
  sotto: ['hymenophore', 'hymenophore_color'],
  gambo: ['stem_ring', 'stem_volva', 'stem_reticulum', 'stem_base'],
};
export function drawnValues(d, key, tile, suffix) {
  const t = d.traits.taxa[key];
  const stage = suffix?.startsWith('fase-') && suffix.slice(5);
  if (stage) {
    const s = (t.stages || []).find((x) => x.id === stage);
    return s ? { tiles: s.tiles, cap_shape: s.cap_shape ?? null, hymenophore_color: s.hymenophore_color ?? null } : null;
  }
  return Object.fromEntries((DRAWN[tile] || []).map((f) => [f, t.traits?.[f] ?? null]));
}
// nome di un'icona: <specie>-<tessera>[-<variante> | -fase-<id>]
export const parseIcon = (name) => { const m = name.match(/^(.+?)-(cappello|sotto|gambo|taglio)(?:-(.+))?$/); return m && { key: m[1], tile: m[2], suffix: m[3] || null }; };
// istantanea dei dati per le icone che esistono oggi (tools/asset-report.mjs --snapshot)
export function snapshot(d = load()) {
  const out = {};
  for (const f of readdirSync(new URL('assets/traits/', ROOT)).filter((x) => x.endsWith('.webp')).sort()) {
    const name = f.slice(0, -5), m = parseIcon(name);
    if (!m || !d.traits.taxa[m.key]) continue;
    out[name] = drawnValues(d, m.key, m.tile, m.suffix);
  }
  return out;
}
// da rifare: un valore booleano o nullo cambiato, oppure un valore disegnato tolto dai dati
export function redo(d = load()) {
  const out = [];
  for (const [name, then] of Object.entries(d.drawnFrom.icons || {})) {
    const m = parseIcon(name);
    const now = m && d.traits.taxa[m.key] ? drawnValues(d, m.key, m.tile, m.suffix) : null;
    if (!now) { out.push(`${name} (dato tolto)`); continue; }
    const changed = Object.keys({ ...then, ...now }).filter((f) => {
      const a = then[f], b = now[f];
      if (Array.isArray(a) && Array.isArray(b) && f !== 'tiles') return a.some((x) => !b.includes(x));
      return JSON.stringify(a) !== JSON.stringify(b);
    });
    if (changed.length) out.push(`${name} (${changed.join(', ')})`);
  }
  return out.sort();
}

export function coherence(d = load()) {
  const err = [], taxa = d.traits.taxa;
  // indice delle icone dei funghi
  for (const [key, e] of Object.entries(d.icons.taxa)) {
    const t = taxa[key];
    if (!t) { err.push(`trait-icons: ${key} non è in species-traits`); continue; }
    const tr = t.traits || {};
    if (e.base?.colore && !list(tr.cap_color).includes(e.base.colore)) err.push(`trait-icons: ${key} base colore ${e.base.colore} non è nei dati`);
    if (e.base?.forma && !list(tr.cap_shape).includes(e.base.forma)) err.push(`trait-icons: ${key} base forma ${e.base.forma} non è nei dati`);
    for (const [field, trait] of [['colors', 'cap_color'], ['shapes', 'cap_shape']]) for (const v of e[field]?.values || []) if (!list(tr[trait]).includes(v)) err.push(`trait-icons: ${key} ${trait} ${v} non è nei dati`);
    for (const s of e.stages || []) if (!(t.stages || []).some((x) => x.id === s)) err.push(`trait-icons: ${key} fase ${s} non è nei dati`);
  }
  // ogni file delle icone dei funghi: specie, tessera, variante o fase esistenti
  for (const f of readdirSync(new URL('assets/traits/', ROOT)).filter((x) => x.endsWith('.webp'))) {
    const name = f.slice(0, -5), m = parseIcon(name);
    const t = m && taxa[m.key];
    if (!t) { err.push(`assets/traits/${f}: specie o tessera sconosciuta`); continue; }
    const { key, tile, suffix: rest } = m, tr = t.traits || {};
    if (!rest) { if (!ICON_PARTS.includes(tile)) err.push(`assets/traits/${f}: tessera base non prevista`); continue; }
    const st = rest.match(/^fase-([a-z]+)$/);
    if (st) {
      const s = (t.stages || []).find((x) => x.id === st[1]);
      if (!s || !s.tiles.includes(tile)) err.push(`assets/traits/${f}: fase o tessera non nei dati (${key})`);
      continue;
    }
    const vals = rest.split('-');
    const ok = vals.length === 1 ? list(tr.cap_color).includes(vals[0]) || list(tr.cap_shape).includes(vals[0])
      : vals.length === 2 && list(tr.cap_color).includes(vals[0]) && list(tr.cap_shape).includes(vals[1]);
    if (!ok || !['cappello', 'gambo'].includes(tile)) err.push(`assets/traits/${f}: variante non nei dati (${key})`);
  }
  for (const n of Object.keys(d.icons.margins || {})) if (!has(traitFile(n))) err.push(`trait-icons margins: ${n} senza file`);
  // alberi: ogni valore dell'indice e ogni file è un valore delle domande
  const asked = new Set(TREE_KEYS(d.recTrees.schema).flatMap(([k, q]) => q.values.map((v) => `${k}-${v.id}`)));
  for (const [k, vs] of Object.entries(d.treeIcons.values)) for (const v of vs) if (!asked.has(`${k}-${v}`)) err.push(`tree-trait-icons: ${k}-${v} non è un valore dello schema`);
  for (const f of readdirSync(new URL('assets/tree-traits/', ROOT))) if (!asked.has(f.replace(/\.webp$/, ''))) err.push(`assets/tree-traits/${f}: valore non nello schema`);
  // schede di riconoscimento: valori dentro lo schema
  for (const [label, rec] of [['recognize-trees', d.recTrees], ['recognize-plants', d.recPlants]]) for (const [id, it] of Object.entries(rec.items)) for (const [k, v] of Object.entries(it.traits)) {
    if (!rec.schema[k]) { err.push(`${label}: ${id} campo ${k} non nello schema`); continue; }
    const ids = rec.schema[k].values.map((x) => x.id);
    for (const x of list(v)) if (!ids.includes(x)) err.push(`${label}: ${id} ${k}=${x} non nello schema`);
  }
  // varianti dei luoghi: stagione e meteo esistenti, luogo esistente
  const zoneIds = new Set(d.zones.map((z) => z.id));
  for (const [id, m] of Object.entries(d.mediaZones)) {
    if (!zoneIds.has(id)) err.push(`media-zones: ${id} non è un luogo`);
    for (const v of m.variants || []) if (!COVER_COMBOS.includes(`${v.season}-${v.weather}`)) err.push(`media-zones: ${id} ${v.season}-${v.weather} non previsto`);
  }
  // fasi: vocabolario nel documento uguale agli elenchi chiusi del codice
  const voc = d.traits.vocabulary;
  if (JSON.stringify(Object.keys(voc.stages || {})) !== JSON.stringify(STAGE_IDS)) err.push('species-traits: vocabulary.stages diverso da STAGE_IDS');
  if (JSON.stringify(Object.keys(voc.stage_tiles || {})) !== JSON.stringify(STAGE_TILES)) err.push('species-traits: vocabulary.stage_tiles diverso da STAGE_TILES');
  // istantanea del disegno: solo icone esistenti
  for (const n of Object.keys(d.drawnFrom.icons || {})) if (!has(traitFile(n))) err.push(`asset-drawn-from: ${n} senza file`);
  return err;
}
