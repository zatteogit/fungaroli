// Confronto di caratteri dichiarati dall'utente, non identificazione né probabilità.
// Stessa applicabilità del percorso guidato: l'attaccatura riguarda lamelle
// e pliche. Un imenoforo ignoto non autorizza a dichiararla non applicabile.
export function comparisonTraitState(taxon,key,value=taxon.traits?.[key]) {
 if(key==='gill_attachment'){
  const types=[].concat(taxon.traits?.hymenophore??[]);
  if(types.length&&types.every(type=>['pori','aculei','liscio'].includes(type)))return 'not-applicable';
 }
 return value==null||Array.isArray(value)&&!value.length?'missing':'known';
}

export function matchTraits(taxon, answers, questions) {
  let ok = 0, tot = 0;
  const contra = [];
  for (const [key, value] of Object.entries(answers)) {
    if (value == null) continue;
    const q = questions.find((q) => q.key === key);
    if (!q) continue;
    const trait = q.get ? q.get(taxon) : taxon.traits?.[key];
    if (trait == null || (Array.isArray(trait) && !trait.length)) continue;
    tot++;
    const hit = q.match ? q.match([].concat(trait), value) : Array.isArray(trait) ? trait.includes(value) : trait === value;
    if (hit) ok++; else contra.push(key);
  }
  return { ok, tot, contra };
}

export function retainCandidate(taxon, match) {
  // Una risposta sbagliata su base, velo o anello non autorizza a escludere un mortale.
  if (taxon.toxicity === 'mortale') return true;
  return match.contra.length === 0 || (match.contra.length === 1 && match.ok >= 2);
}

// Il richiamo ai mortali non dipende dai filtri, dalla zona o da una ricerca testuale.
export const deadlyWarnings = (taxa) => taxa.filter((t) => t.toxicity === 'mortale');

// Indice chiuso degli avvisi di una scheda (field_rules): quanti per tipo, in parole.
// Si contano gli avvisi, non le specie: un solo avviso può valere per più sosia («amanite mortali»).
export const ATT_COUNT = {
  sosia: ['avviso sui sosia', 'avvisi sui sosia'], caratteri: ['carattere da controllare', 'caratteri da controllare'],
  regole: ['regola di raccolta', 'regole di raccolta'], cottura: ['cautela in cucina', 'cautele in cucina'],
  tossicita: ['rischio di intossicazione', 'rischi di intossicazione'], ambiente: ['cautela sul raccolto', 'cautele sul raccolto'],
  altro: ['avviso', 'avvisi'],
};
// gruppi nell'ordine di arrivo degli avvisi, poi prima i tipi con avvisi critici e i più numerosi
export function attentionGroups(rules) {
  const groups = [];
  for (const r of rules || []) {
    const k = ATT_COUNT[r?.kind] ? r.kind : 'altro';
    let g = groups.find((x) => x.k === k);
    if (!g) groups.push(g = { k, n: 0, crit: false });
    g.n++; g.crit ||= r?.severity === 'critico';
  }
  groups.sort((a, b) => b.crit - a.crit || b.n - a.n);
  return groups.map((g) => ({ ...g, text: `${g.n} ${ATT_COUNT[g.k][g.n === 1 ? 0 : 1]}` }));
}

// --- caratteri e somiglianza tra due funghi ---
// Pesi e regole di confronto dei caratteri: una sola fonte per Riconosci e per l'ordine dei sosia.
export const TREE_GROUPS = {
  faggio: ['faggio'], castagno: ['castagno'], querce: ['cerro', 'roverella', 'rovere', 'farnia', 'farnetto', 'leccio', 'sughera'],
  pini: ['pino nero', 'pino silvestre', 'pino domestico', "pino d'aleppo", 'pino marittimo'], abeti: ['abete bianco', 'abete rosso'],
  betulla: ['betulla'], carpino: ['carpino nero', 'carpino bianco', 'nocciolo'], 'legno morto': ['ceppaie e legno morto di latifoglie'],
};
const SEASONS = { primavera: [3, 4, 5], estate: [6, 7, 8], autunno: [9, 10, 11], inverno: [12, 1, 2] };
export const monthsOf = (v, now = new Date()) => (v === 'adesso' ? [now.getMonth() + 1] : SEASONS[v] || []);
const TRAIT_KEYS = ['hymenophore', 'stem_volva', 'stem_ring', 'cap_color', 'hymenophore_color', 'flesh_change', 'habitat', 'growth', 'cap_shape', 'cap_size',
  'trees', 'smell', 'season', 'gill_attachment', 'cap_veil', 'cap_surface', 'latex', 'flesh_texture', 'stem_base', 'spore_print', 'stem_reticulum'];
const TRAIT_CORE = {
  hymenophore: { weight: 1.4 },
  trees: { weight: 0.85, values: Object.keys(TREE_GROUPS), get: (t) => t.trees, match: (tv, v) => tv.some((x) => TREE_GROUPS[v]?.includes(x)) },
  smell: { weight: 0.75 },
  season: { weight: 0.5, values: Object.keys(SEASONS), match: (tv, v) => monthsOf(v).some((m) => tv.includes(m)) },
  flesh_texture: { weight: 0.85 },
  spore_print: { weight: 0.35 },
};
const TRAIT_QUESTIONS = TRAIT_KEYS.map((key) => ({ key, ...TRAIT_CORE[key] }));
export const traitQuestions = () => TRAIT_QUESTIONS;

// Quanto un carattere distingue i funghi del catalogo (0-1): impurita' di Gini dei suoi valori.
// "Nessuna volva" o "nessun lattice", comuni a quasi tutti, valgono poco; il colore del cappello molto.
const traitValues = (t, q) => {
  let v = q.get ? q.get(t) : t.traits?.[q.key];
  if (v == null) return null;
  v = [].concat(v);
  if (q.match && q.values) v = q.values.filter((x) => q.match(v, x));
  return v.length ? v : null;
};
const spreadMemo = new WeakMap();
export function traitSpread(taxa, questions = TRAIT_QUESTIONS) {
  if (spreadMemo.has(taxa)) return spreadMemo.get(taxa);
  const out = {};
  for (const q of questions) {
    const share = new Map();let n = 0;
    for (const t of taxa) {
      const v = traitValues(t, q);
      if (!v) continue;
      n++;
      for (const x of v) share.set(String(x), (share.get(String(x)) || 0) + 1 / v.length);
    }
    out[q.key] = n ? 1 - [...share.values()].reduce((s, c) => s + (c / n) ** 2, 0) : 0;
  }
  spreadMemo.set(taxa, out);
  return out;
}

// Quanto due funghi si somigliano, da 0 a 1. Non e' mostrato: serve solo a mettere prima i sosia piu' simili.
// Per ogni carattere noto a entrambi: valori in comune su valori totali (Jaccard). Il carattere pesa come la domanda
// di Riconosci per quanto distingue nel catalogo (taxa), cosi' le assenze comuni a tutti non appiattiscono l'indice.
// Con pochi caratteri noti il valore resta vicino a 0,5.
export function traitSimilarity(a, b, taxa = null, questions = TRAIT_QUESTIONS) {
  const spread = taxa ? traitSpread(taxa, questions) : null;
  let s = 0, w = 0;
  for (const q of questions) {
    const A = traitValues(a, q), B = traitValues(b, q);
    if (!A || !B) continue;
    const U = new Set([...A, ...B].map(String));
    const wq = (q.weight ?? 1) * (spread ? spread[q.key] : 1);
    if (!wq) continue;
    s += (wq * A.filter((v) => B.includes(v)).length) / U.size; w += wq;
  }
  return (s + 0.5) / (w + 1);
}
