// Riconosci: ricerca per caratteristiche (visiva, testuale, guidata) su commestibili E velenose.
// Non e' un'identificazione: restringe i candidati e dice sempre cosa controllare.

import { openLightbox, captionHtml } from './lightbox.js';
import { soft, tick } from './motion.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// domande: chiave del tratto, etichetta, valori (con eventuale icona/colore)
// colori come appaiono davvero sui funghi: luce, tono, ombra (il verde e' oliva, il violetto lilla, il nero bruno-nero)
const COLORS = {
  bianco: ['#fbfaf5', '#ece7da', '#cfc6b2'], crema: ['#f7ecd2', '#e3cfa3', '#bea475'],
  giallo: ['#f3db74', '#d9b13c', '#a57d1f'], arancio: ['#f4a65a', '#d9732a', '#9c4716'],
  rosa: ['#f3cdcd', '#d99aa2', '#a8687a'], rosso: ['#e5604a', '#bb3226', '#7c1b17'],
  verde: ['#c9c58f', '#9a9a5c', '#66683a'], grigio: ['#cdc8be', '#9d968a', '#6c665c'],
  bruno: ['#c4935f', '#8e5f36', '#57361d'], violetto: ['#c3a6d3', '#8e6aa8', '#5a3f74'],
  nero: ['#6a605a', '#3a3330', '#1b1716'],
};
let swN = 0; // id unici: lo stesso gradiente puo' comparire piu' volte (anche dentro <details> chiusi)
const hymKind = (h) => { const a = [].concat(h ?? []); return a.includes('lamelle') || a.includes('pliche') ? 'gill' : a.includes('pori') ? 'pore' : a.includes('aculei') ? 'spine' : 'plain'; };
const swatch = (kind, v) => {
  const [l, m, d] = COLORS[v], id = `sw-${kind}-${v}-${++swN}`;
  return kind === 'cap'
    ? `<svg viewBox="0 0 56 40" class="id-sw" aria-hidden="true"><defs><radialGradient id="${id}" cx="38%" cy="22%" r="85%"><stop offset="0" stop-color="${l}"/><stop offset=".5" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs><path d="M3 33 C3 4 53 4 53 33 Q28 39 3 33 Z" fill="url(#${id})" stroke="${d}" stroke-opacity=".5"/></svg>`
    : (() => {
      // sotto il cappello: la trama segue la risposta (lamelle, pori, aculei); senza risposta resta neutra
      const tex = kind === 'gill' ? [10, 17, 24, 32, 39, 46].map((x) => `<path d="M${x} 7 L${28 + (x - 28) * 0.12} 34" stroke="${d}" stroke-opacity=".45" stroke-width=".9"/>`).join('')
        : kind === 'pore' ? [[14, 11], [22, 10], [30, 10], [38, 10], [44, 11], [20, 17], [28, 16], [36, 17], [24, 23], [32, 23], [28, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${d}" fill-opacity=".5"/>`).join('')
        : kind === 'spine' ? [14, 21, 28, 35, 42].map((x) => `<path d="M${x - 2} 9 L${x} 15 L${x + 2} 9" fill="${d}" fill-opacity=".45"/>`).join('') + [18, 25, 32, 39].map((x) => `<path d="M${x - 2} 17 L${x} 23 L${x + 2} 17" fill="${d}" fill-opacity=".45"/>`).join('')
        : '';
      return `<svg viewBox="0 0 56 40" class="id-sw" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs><path d="M3 8 Q28 3 53 8 L31 36 h-6 Z" fill="url(#${id})" stroke="${d}" stroke-opacity=".5"/>${tex}</svg>`;
    })();
};
const HYM_ICON = {
  lamelle: '<svg viewBox="0 0 40 24"><path d="M2 4h36L34 10H6z" fill="currentColor" opacity=".25"/>' + [8, 12, 16, 20, 24, 28, 32].map((x) => `<path d="M${x} 4.5v5" stroke="currentColor" stroke-width="1.2"/>`).join('') + '</svg>',
  pori: '<svg viewBox="0 0 40 24"><path d="M2 4h36L34 10H6z" fill="currentColor" opacity=".25"/>' + [8, 13, 18, 23, 28, 33].map((x) => `<circle cx="${x}" cy="7" r="1.3" fill="currentColor"/>`).join('') + '</svg>',
  aculei: '<svg viewBox="0 0 40 24"><path d="M2 4h36L34 8H6z" fill="currentColor" opacity=".25"/>' + [8, 12, 16, 20, 24, 28, 32].map((x) => `<path d="M${x - 1} 8l1 6 1-6" fill="currentColor"/>`).join('') + '</svg>',
  pliche: '<svg viewBox="0 0 40 24"><path d="M4 4h32L22 20h-4z" fill="currentColor" opacity=".25"/><path d="M10 5l9 14M16 5l3.5 14M24 5l-3.5 14M30 5l-9 14" stroke="currentColor" stroke-width="1"/></svg>',
  liscio: '<svg viewBox="0 0 40 24"><path d="M4 4h32L22 20h-4z" fill="currentColor" opacity=".25"/></svg>',
};
// disegni delle opzioni (tratto semplice, currentColor) — servono a riconoscere, non a decorare
const CAP = '<path d="M10 30 C10 14 54 14 54 30 Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="2"/>';
const STEM = '<path d="M27 30 L26 54 H38 L37 30" fill="none" stroke="currentColor" stroke-width="2"/>';
const ART = {
  volva_true: `<svg viewBox="0 0 64 64">${CAP}${STEM}<path d="M20 50 C20 60 44 60 44 50 L40 54 H24 Z" fill="currentColor" opacity=".55"/><path d="M20 50 Q22 46 26 48 M44 50 Q42 46 38 48" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
  volva_false: `<svg viewBox="0 0 64 64">${CAP}${STEM}<path d="M22 56 H42" stroke="currentColor" stroke-width="2"/></svg>`,
  ring_true: `<svg viewBox="0 0 64 64">${CAP}${STEM}<path d="M24 36 Q32 44 40 36 L38 40 Q32 46 26 40 Z" fill="currentColor" opacity=".6"/></svg>`,
  ring_false: `<svg viewBox="0 0 64 64">${CAP}${STEM}</svg>`,
  ret_true: `<svg viewBox="0 0 64 64">${CAP}<path d="M26 30 Q24 44 25 54 H39 Q40 44 38 30" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="2"/><path d="M27 34 l4 4 4-4 M27 40 l4 4 4-4 M27 46 l4 4 4-4 M31 34 v16" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  ret_false: `<svg viewBox="0 0 64 64">${CAP}<path d="M26 30 Q24 44 25 54 H39 Q40 44 38 30" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="2"/></svg>`,
  latifoglie: '<svg viewBox="0 0 64 64"><circle cx="32" cy="24" r="16" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2"/><path d="M32 40 V58 M32 46 l-6 -5 M32 44 l6 -5" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>',
  conifere: '<svg viewBox="0 0 64 64"><path d="M32 6 L46 26 H38 L50 42 H14 L26 26 H18 Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M32 42 V58" stroke="currentColor" stroke-width="3"/></svg>',
  'prati/radure': '<svg viewBox="0 0 64 64"><path d="M6 52 H58" stroke="currentColor" stroke-width="2"/><path d="M12 52 q2 -10 0 -16 M18 52 q-2 -8 2 -14 M44 52 q2 -10 -1 -15 M50 52 q-1 -8 3 -12" stroke="currentColor" stroke-width="2" fill="none"/><path d="M24 40 C24 32 40 32 40 40 Z" fill="currentColor" opacity=".5"/><path d="M31 40 v12 h2 v-12" fill="currentColor"/></svg>',
  'ceppaie/legno': '<svg viewBox="0 0 64 64"><path d="M14 30 V54 H50 V30" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="30" rx="18" ry="6" fill="currentColor" opacity=".3" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="30" rx="9" ry="3" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M48 40 C48 34 60 34 60 40 Z M10 44 C10 38 22 38 22 44 Z" fill="currentColor" opacity=".7"/></svg>',
  singolo: '<svg viewBox="0 0 64 64"><path d="M18 34 C18 20 46 20 46 34 Z" fill="currentColor" opacity=".35" stroke="currentColor" stroke-width="2"/><path d="M29 34 V54 H35 V34" fill="currentColor" opacity=".5"/><path d="M8 56 H56" stroke="currentColor" stroke-width="2"/></svg>',
  gregario: '<svg viewBox="0 0 64 64"><path d="M4 56 H60" stroke="currentColor" stroke-width="2"/>' + [[12, 40], [32, 32], [50, 42]].map(([x, y]) => `<path d="M${x - 9} ${y} C${x - 9} ${y - 10} ${x + 9} ${y - 10} ${x + 9} ${y} Z" fill="currentColor" opacity=".35" stroke="currentColor" stroke-width="1.6"/><path d="M${x - 2} ${y} V56 H${x + 2} V${y}" fill="currentColor" opacity=".5"/>`).join('') + '</svg>',
  cespitoso: '<svg viewBox="0 0 64 64"><path d="M4 58 H60" stroke="currentColor" stroke-width="2"/><path d="M32 58 L20 34 M32 58 L32 28 M32 58 L44 34" stroke="currentColor" stroke-width="3"/>' + [[20, 34], [32, 26], [44, 34]].map(([x, y]) => `<path d="M${x - 9} ${y} C${x - 9} ${y - 9} ${x + 9} ${y - 9} ${x + 9} ${y} Z" fill="currentColor" opacity=".4" stroke="currentColor" stroke-width="1.6"/>`).join('') + '</svg>',
  dontknow: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M26 26 q0 -7 6 -7 q6 0 6 6 q0 4 -6 6 v4 M32 42 v1" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
};
// viraggio: dalla carne appena tagliata al colore che prende (il blu dei boleti, il rosso dei lattari, ecc.)
// forme del cappello (sagome semplici) e dimensioni
const SST = '<path d="M28 34 L27 56 H37 L36 34" fill="none" stroke="currentColor" stroke-width="2"/>';
const sh = (d, stem = true) => `<svg viewBox="0 0 64 64">${stem ? SST : ''}<path d="${d}" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const SHAPE = {
  convesso: sh('M8 34 C10 16 54 16 56 34 Z'),
  piano: sh('M6 30 C8 25 56 25 58 30 L58 34 H6 Z'),
  emisferico: sh('M14 34 C14 8 50 8 50 34 Z'),
  conico: sh('M32 8 C36 16 46 26 50 34 H14 C18 26 28 16 32 8 Z'),
  ombrellato: sh('M4 32 C14 26 22 22 27 17 Q32 9 37 17 C42 22 50 26 60 32 L60 34 H4 Z'),
  imbuto: sh('M6 20 Q32 36 58 20 L46 34 H18 Z'),
  trombetta: sh('M12 10 Q32 22 52 10 L38 54 H26 Z', false),
};
const SIZE = (k) => `<svg viewBox="0 0 64 64"><g transform="translate(32 58) scale(${k}) translate(-32 -58)">${SST.replace('stroke-width="2"', `stroke-width="${2 / k}"`)}<path d="M8 34 C10 16 54 16 56 34 Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="${2 / k}"/></g><path d="M6 61 H58" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3"/></svg>`;
const SEASONS = { primavera: [3, 4, 5], estate: [6, 7, 8], autunno: [9, 10, 11], inverno: [12, 1, 2] };
const MESE_IT = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const monthsOf = (v) => (v === 'adesso' ? [new Date().getMonth() + 1] : SEASONS[v] || []);
const TREE_GROUPS = {
  faggio: ['faggio'], castagno: ['castagno'], querce: ['cerro', 'roverella', 'rovere', 'farnia', 'farnetto', 'leccio', 'sughera'],
  pini: ['pino nero', 'pino silvestre', 'pino domestico', "pino d'aleppo", 'pino marittimo'], abeti: ['abete bianco', 'abete rosso'],
  betulla: ['betulla'], carpino: ['carpino nero', 'carpino bianco', 'nocciolo'], 'legno morto': ['ceppaie e legno morto di latifoglie'],
};
const FLESH = { nessuno: '#efe6d0', blu: '#2f5fb3', rosso: '#b23a2c', giallo: '#e2b52f', bruno: '#7a5434', nero: '#2b2826' };
const QUESTIONS = [
  { key: 'hymenophore', label: 'Cosa c\'è sotto il cappello?', short: 'Sotto il cappello', values: ['lamelle', 'pori', 'aculei', 'pliche', 'liscio'], icon: (v) => HYM_ICON[v], hint: 'Gira il fungo e guarda la parte sotto il cappello.',
    tip: { title: 'Lamelle, pori, aculei: come si distinguono', items: [
      ['lamelle', 'Lamelle', 'Lamine sottili, come le pagine di un libro, che vanno dal gambo al bordo. Es. ovolo, prataiolo.'],
      ['pori', 'Pori', 'Una spugna di tubetti con tanti forellini. Si stacca dalla carne come un cuscinetto. Es. porcino.'],
      ['aculei', 'Aculei', 'Tante piccole punte morbide che pendono verso il basso. Es. steccherino.'],
      ['pliche', 'Pliche', 'Costolature basse e ramificate, scendono sul gambo: sembrano lamelle "sciolte". Es. finferlo.'],
      ['liscio', 'Liscio', 'Nessuna struttura: superficie liscia o appena rugosa. Es. trombetta dei morti.'],
    ] } },
  { key: 'stem_volva', label: 'Alla base del gambo c\'è una volva?', short: 'Volva', bool: true, art: (v) => ART[`volva_${v}`], labels: { true: 'sì, un sacco o un bulbo con orlo', false: 'no, base semplice' }, hint: 'Per vederla bisogna estrarre il fungo intero, senza tagliarlo.' },
  { key: 'stem_ring', label: 'C\'è un anello sul gambo?', short: 'Anello', bool: true, art: (v) => ART[`ring_${v}`], labels: { true: 'sì, una gonnellina', false: 'no' } },
  { key: 'cap_color', label: 'Di che colore è il cappello?', short: 'Cappello', values: Object.keys(COLORS), color: true },
  { key: 'hymenophore_color', label: 'Di che colore sono lamelle o pori?', short: 'Lamelle/pori', values: Object.keys(COLORS), color: true, after: 'hymenophore',
    labelFor: (h) => ({ lamelle: 'Di che colore sono le lamelle?', pori: 'Di che colore sono i pori?', aculei: 'Di che colore sono gli aculei?', pliche: 'Di che colore sono le pliche?', liscio: 'Di che colore è la parte sotto il cappello?' }[h]),
    shortFor: (h) => ({ lamelle: 'Lamelle', pori: 'Pori', aculei: 'Aculei', pliche: 'Pliche' }[h]) },
  { key: 'flesh_change', label: 'Tagliata, la carne cambia colore?', short: 'Carne al taglio', values: ['nessuno', 'blu', 'rosso', 'giallo', 'bruno', 'nero'], labels: { nessuno: 'non cambia' }, flesh: true, hint: 'Taglia il gambo e aspetta un minuto.' },
  { key: 'habitat', label: 'Dove cresce?', short: 'Dove', values: ['latifoglie', 'conifere', 'prati/radure', 'ceppaie/legno'], art: (v) => ART[v], labels: { latifoglie: 'sotto latifoglie', conifere: 'sotto conifere', 'prati/radure': 'prati e radure', 'ceppaie/legno': 'su ceppaie o legno' } },
  { key: 'growth', label: 'Come cresce?', short: 'Crescita', values: ['singolo', 'gregario', 'cespitoso'], art: (v) => ART[v], labels: { singolo: 'da solo', gregario: 'a gruppi sparsi', cespitoso: 'a cespi, uniti alla base' } },
  { key: 'cap_shape', label: 'Che forma ha il cappello?', short: 'Forma', values: Object.keys(SHAPE), art: (v) => SHAPE[v], labels: { imbuto: 'a imbuto, depresso', trombetta: 'a trombetta', ombrellato: 'a ombrello, con umbone', conico: 'conico o a campana' }, hint: 'Guardalo di profilo. Nei funghi giovani il cappello è più chiuso.' },
  { key: 'cap_size', label: 'Quanto è grande il cappello?', short: 'Dimensione', values: ['piccolo', 'medio', 'grande'], art: (v) => SIZE({ piccolo: 0.45, medio: 0.72, grande: 1 }[v]), labels: { piccolo: 'fino a 5 cm', medio: 'da 5 a 12 cm', grande: 'oltre 12 cm' }, hint: 'Il diametro. Una carta di credito è lunga 8,5 cm.' },
  { key: 'trees', label: 'Vicino a quali alberi?', short: 'Alberi', values: Object.keys(TREE_GROUPS), text: true, get: (t) => t.trees,
    match: (tv, v) => tv.some((x) => TREE_GROUPS[v].includes(x)), labels: { querce: 'querce (cerro, roverella, leccio)', pini: 'pini', abeti: 'abeti', carpino: 'carpino o nocciolo', 'legno morto': 'su legno morto' },
    hint: 'Molti funghi vivono in simbiosi con alberi precisi: guarda quelli entro pochi metri.' },
  { key: 'smell', label: 'Che odore ha?', short: 'Odore', values: ['gradevole', 'farina', 'anice', 'rapa/terroso', 'sgradevole', 'nessuno'], text: true,
    labels: { gradevole: 'gradevole, di fungo', farina: 'di farina', anice: 'di anice', 'rapa/terroso': 'di rapa o terra', sgradevole: 'sgradevole', nessuno: 'quasi nessuno' }, hint: 'Annusa la carne appena tagliata e le lamelle. Non assaggiare.' },
  { key: 'season', label: 'Quando l\'hai trovato?', short: 'Quando', values: ['adesso', 'primavera', 'estate', 'autunno', 'inverno'], text: true,
    match: (tv, v) => monthsOf(v).some((m) => tv.includes(m)), labels: { adesso: `adesso (${MESE_IT[new Date().getMonth()]})` } },
  { key: 'stem_reticulum', label: 'Il gambo ha un reticolo in rilievo?', short: 'Reticolo', bool: true, art: (v) => ART[`ret_${v}`], labels: { true: 'sì, una rete', false: 'no, liscio' } },
];
const TOX_ORDER = { mortale: 0, tossico: 1, 'non commestibile': 2, 'commestibile con cautela': 3, commestibile: 4 };

let HOWTO = () => '', BANNER = '', TAXA = [], RULES = [], MEDIA = {}, ASSET = (f) => f, THUMB = () => '', POTENTIAL = () => null, ZONES = [];
const state = { q: '', ans: {}, zone: '', guided: true, compare: '', editing: '' };

export function initIdentify({ traits, media, assetUrl, thumb, potential, zones, banner, howTo }) {
  if (howTo) HOWTO = howTo;
  BANNER = banner || '';
  TAXA = Object.entries(traits?.taxa || {}).map(([key, t]) => ({ key, ...t }));
  RULES = traits?.general_rules || [];
  MEDIA = media || {}; if (assetUrl) ASSET = assetUrl; if (thumb) THUMB = thumb; if (potential) POTENTIAL = potential; ZONES = zones || [];
}
export const hasIdentify = () => TAXA.length > 0;

const slug = (s) => norm(s).replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
function photoOf(t) {
  if (t.edible_id) { const m = MEDIA.species?.[t.edible_id]; return m?.ref || m?.inat?.[0]; }
  const L = MEDIA.lookalikes || {};
  // per nome latino; se la nomenclatura e' cambiata (es. Desarmillaria), per epiteto o per chiave
  let m = L[t.latin?.match(/[A-Z][a-z]+ [a-z]+/)?.[0]];
  if (!m) {
    const ep = t.latin?.split(' ')[1];
    const k = Object.keys(L).find((x) => slug(x) === t.key || (ep && x.endsWith(' ' + ep)));
    m = k && L[k];
  }
  return m?.ref || m?.inat?.[0];
}

const QK = (k) => QUESTIONS.find((q) => q.key === k);
const traitOf = (t, q) => (q.get ? q.get(t) : t.traits?.[q.key]);
const hitOf = (q, tv, v) => (q.match ? q.match([].concat(tv), v) : Array.isArray(tv) ? tv.includes(v) : tv === v);
function matches(t) {
  let ok = 0, tot = 0, contra = [];
  for (const [k, v] of Object.entries(state.ans)) {
    if (v == null) continue;
    const q = QK(k), tv = q && traitOf(t, q);
    if (tv == null || (Array.isArray(tv) && !tv.length)) continue; // carattere ignoto per il taxon: non penalizza
    tot++;
    if (hitOf(q, tv, v)) ok++; else contra.push(k);
  }
  return { ok, tot, contra };
}

function textHit(t) {
  if (!state.q) return true;
  const hay = norm([t.name, t.latin, ...(t.check_before_picking || []), ...Object.values(t.traits || {}).flat()].join(' '));
  return norm(state.q).split(/\s+/).every((w) => hay.includes(w));
}

function candidates() {
  return TAXA.filter(textHit).map((t) => {
    const m = matches(t);
    let prior = 1;
    if (state.zone && t.edible_id) prior = 0.4 + 0.6 * (POTENTIAL(t.edible_id, state.zone)?.score ?? 0.5);
    const fit = m.tot ? m.ok / m.tot : 1;
    return { t, ...m, fit, rank: fit * prior };
  }).filter((c) => !c.contra.length || (c.contra.length === 1 && c.ok >= 2)) // un solo carattere discordante, e solo se almeno due tornano
    .sort((a, b) => b.rank - a.rank || (TOX_ORDER[a.t.toxicity] ?? 9) - (TOX_ORDER[b.t.toxicity] ?? 9));
}

// prossima domanda: quella che divide meglio i candidati rimasti (entropia)
function nextQuestion(list) {
  let best = null;
  for (const q of QUESTIONS) {
    if (state.ans[q.key] !== undefined) continue;
    if (q.after && state.ans[q.after] === undefined) continue; // il colore di lamelle o pori solo dopo aver detto quali sono
    const vals = q.bool ? [true, false] : q.values;
    const counts = vals.map((v) => list.filter((c) => { const tv = traitOf(c.t, q); return tv != null && hitOf(q, tv, v); }).length);
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < 2) continue;
    const h = -counts.filter(Boolean).reduce((s, c) => s + (c / n) * Math.log2(c / n), 0);
    if (!best || h > best.h) best = { q, h };
  }
  return best?.q || null;
}

const qLabel = (q) => q.labelFor?.(state.ans[q.after]) || q.label;
const qShort = (q) => q.shortFor?.(state.ans[q.after]) || q.short;
const tipHtml = (q) => (q.tip ? `<details class="id-tip"><summary>${esc(q.tip.title)}</summary><ul>${q.tip.items.map(([v, t, d]) => `<li><span class="id-hym" aria-hidden="true">${HYM_ICON[v] || ''}</span><span><b>${esc(t)}</b> ${esc(d)}</span></li>`).join('')}</ul></details>` : '');
const optLabel = (q, v) => (q.bool ? (q.labels?.[String(v)] || (v ? 'sì' : 'no')) : (q.labels?.[v] || v));
const valLabel = (q, v) => (q.bool ? `${qShort(q)}: ${v ? 'sì' : 'no'}` : `${qShort(q)}: ${q.labels?.[v] || v}`);

function artFor(q, v) {
  if (v == null) return ART.dontknow;
  if (q.art) return q.art(v);
  if (q.icon) return `<span class="id-hym">${q.icon(v)}</span>`;
  if (q.color) return swatch(q.key === 'cap_color' ? 'cap' : hymKind(state.ans.hymenophore), v);
  if (q.flesh) return `<span class="id-flesh" style="background:linear-gradient(100deg, #f4ecd8 30%, ${FLESH[v]} 85%)"></span>`;
  return '';
}
// risposta data: una riga compatta "carattere · disegno · valore", tocchi per cambiarla
const X_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
function answerRow(q) {
  const v = state.ans[q.key];
  return `<li class="id-row vtn${v == null ? ' skipped' : ''}" style="--vtn:q-${q.key}">
    <button type="button" class="id-row-main" data-edit="${q.key}" aria-label="${esc(qShort(q))}: ${esc(v == null ? 'non lo so' : optLabel(q, v))}. Cambia">
      <span class="id-row-k">${esc(qShort(q))}</span><span class="id-row-art" aria-hidden="true">${artFor(q, v)}</span><span class="id-row-v">${esc(v == null ? 'non lo so' : optLabel(q, v))}</span><span class="id-row-edit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>
    </button><button type="button" class="id-row-x" data-clear="${q.key}" aria-label="Togli la risposta">${X_IC}</button></li>`;
}
const questionCard = (q, { big = false, n = 0 } = {}) => `<section class="id-q vtn${big ? ' id-q-big' : ''}${state.editing === q.key ? ' editing' : ''}" style="--vtn:q-${q.key}">
  ${big && n ? `<p class="eyebrow">Domanda ${n}</p>` : ''}<h3>${esc(qLabel(q))}</h3>${big && q.hint ? `<p class="small muted">${esc(q.hint)}</p>` : ''}${tipHtml(q)}${options(q, { big })}</section>`;

// tessere illustrate di una domanda
function options(q, { big = false } = {}) {
  const vals = q.bool ? [true, false] : q.values;
  const cur = state.ans[q.key];
  const tiles = vals.map((v) => {
    const art = artFor(q, v);
    return `<button type="button" class="id-opt${q.color || q.flesh ? ' id-opt-sw' : ''}" data-k="${q.key}" data-v="${esc(String(v))}" aria-pressed="${cur === v}">
      <span class="id-art" aria-hidden="true">${art}</span><span class="id-opt-l">${esc(optLabel(q, v))}</span></button>`;
  }).join('');
  const dk = big ? `<button type="button" class="id-opt id-opt-dk" data-skip="${q.key}"><span class="id-art" aria-hidden="true">${ART.dontknow}</span><span class="id-opt-l">non lo so</span></button>` : '';
  return `<div class="id-grid${q.color || q.flesh ? ' id-grid-sw' : ''}${q.text ? ' id-grid-txt' : ''}">${tiles}${dk}</div>`;
}

// quale carattere non torna, cosa hai indicato e cosa ci si aspetta per la specie
const orList = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} o ${a[a.length - 1]}` : a[0]);
function contraText(c) {
  return c.contra.map((k) => {
    const q = QUESTIONS.find((x) => x.key === k);
    if (!q) return '';
    const exp = [].concat(traitOf(c.t, q));
    if (k === 'season') return `<b>Non torna: stagione.</b> Di solito si trova in ${esc(monthsTxt(exp))}.`;
    if (k === 'trees') return `<b>Non torna: alberi.</b> Di solito vicino a ${esc(orList(exp.slice(0, 4)))}.`;
    if (q.bool) return `<b>Non torna: ${esc(q.short.toLowerCase())}.</b> Hai indicato ${state.ans[k] ? 'sì' : 'no'}, in questa specie di solito ${exp[0] ? 'c\'è' : 'manca'}.`;
    const say = (v) => (k === 'flesh_change' ? (v === 'nessuno' ? 'non cambia' : `vira al ${v}`) : optLabel(q, v));
    const verb = { hymenophore: 'ha ', cap_color: 'è ', hymenophore_color: 'sono ', habitat: 'cresce ', growth: 'cresce ' }[k] || '';
    return `<b>Non torna: ${esc(q.short.toLowerCase())}.</b> Hai indicato ${esc(say(state.ans[k]))}, ma di solito ${verb}${esc(orList(exp.map(say)))}.`;
  }).join(' ');
}

function resultCard(c) {
  const t = c.t, ph = photoOf(t);
  const tox = esc(t.toxicity || '');
  const href = t.edible_id ? `#/specie/${t.edible_id}` : '';
  const name = esc(t.name || t.latin);
  // tutta la card porta alla scheda (link "allungato"); la foto si ingrandisce dal suo pulsante
  return `<li class="id-card vtn tox-${tox.replace(/\s/g, '-')}" style="--vtn:c-${t.key.replace(/[^a-z0-9-]/gi, '')}">
    <div class="id-card-img">
      ${ph ? `<img src="${ASSET(ph.file)}" alt="" loading="lazy">` : ''}<span class="tox">${tox}</span>
      ${ph ? `<button type="button" class="id-zoom" data-photo="${esc(t.key)}" aria-label="${name}: ingrandisci la foto"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/></svg></button>` : ''}
      ${c.tot ? `<span class="id-fit${c.contra.length ? ' warn' : ''}">${c.ok}/${c.tot}</span>` : ''}</div>
    <div class="id-card-body">
      ${href ? `<a class="id-link" href="${href}">${name}</a>` : `<button type="button" class="id-link" data-taxon="${esc(t.key)}">${name}</button>`}${t.name && t.name !== t.latin ? `<i>${esc(t.latin)}</i>` : ''}
      ${t.caution ? `<span class="small id-why"><b>Perché con cautela:</b> ${esc(t.caution)}</span>` : ''}
      ${c.contra.length ? `<span class="small id-contra">${contraText(c)}</span>` : ''}
      ${t.check_before_picking?.length ? `<details><summary>Cosa controllare</summary><ul class="reasons small">${t.check_before_picking.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
      <span class="small id-more" aria-hidden="true">Scheda ›</span>
    </div></li>`;
}

// --- confronto con i sosia (dalla scheda della specie) ---
const refOf = (edibleId) => TAXA.find((t) => t.edible_id === edibleId && !t.lookalike_of?.length) || TAXA.find((t) => t.edible_id === edibleId);
const sosiaOf = (ref) => TAXA.filter((t) => t !== ref && ref.edible_id && t.lookalike_of?.includes(ref.edible_id))
  .sort((a, b) => (TOX_ORDER[a.toxicity] ?? 9) - (TOX_ORDER[b.toxicity] ?? 9));
// caratteri che non si sovrappongono: sono quelli che li distinguono davvero
function diffs(ref, t) {
  return QUESTIONS.map((q) => {
    const a = ref.traits?.[q.key], b = t.traits?.[q.key];
    if (a == null || b == null) return null;
    const A = [].concat(a), B = [].concat(b);
    if (B.some((v) => A.includes(v))) return null;
    const say = (v) => (q.bool ? (v ? 'sì' : 'no') : q.key === 'flesh_change' ? (v === 'nessuno' ? 'non cambia' : `vira al ${v}`) : optLabel(q, v));
    return { q, txt: `${q.short}: ${orList(B.map(say))}`, ref: orList(A.map(say)) };
  }).filter(Boolean);
}
// tessere dei caratteri, con gli stessi disegni di Riconosci
export function traitStrip(edibleId) {
  const t = refOf(edibleId);
  if (!t) return '';
  const tr = t.traits || {};
  const tile = (art, k, v) => `<li><span class="ts-art" aria-hidden="true">${art}</span><span class="ts-k">${esc(k)}</span><span class="ts-v">${esc(v)}</span></li>`;
  const out = [];
  const one = (q, v) => optLabel(q, v);
  const Q = (k) => QUESTIONS.find((q) => q.key === k);
  if (tr.cap_color) out.push(tile([].concat(tr.cap_color).slice(0, 2).map((v) => swatch('cap', v)).join(''), 'Cappello', orList([].concat(tr.cap_color).map((v) => one(Q('cap_color'), v)))));
  if (tr.hymenophore) { const h = [].concat(tr.hymenophore)[0]; out.push(tile(`<span class="id-hym">${HYM_ICON[h] || ''}</span>`, 'Sotto', orList([].concat(tr.hymenophore)))); }
  if (tr.hymenophore_color) out.push(tile([].concat(tr.hymenophore_color).slice(0, 2).map((v) => swatch(hymKind(tr.hymenophore), v)).join(''), tr.hymenophore?.includes?.('pori') ? 'Pori' : 'Lamelle', orList([].concat(tr.hymenophore_color))));
  if (tr.stem_ring != null) out.push(tile(ART[`ring_${tr.stem_ring}`], 'Anello', tr.stem_ring ? 'sì' : 'no'));
  if (tr.stem_volva != null) out.push(tile(ART[`volva_${tr.stem_volva}`], 'Volva', tr.stem_volva ? 'sì' : 'no'));
  if (tr.stem_reticulum) out.push(tile(ART.ret_true, 'Reticolo', 'sì'));
  if (tr.flesh_change) { const f = [].concat(tr.flesh_change); out.push(tile(`<span class="id-flesh" style="background:linear-gradient(100deg, #f4ecd8 30%, ${FLESH[f[0]]} 85%)"></span>`, 'Al taglio', orList(f.map((v) => (v === 'nessuno' ? 'non cambia' : `vira al ${v}`))))); }
  return `<ul class="trait-strip" aria-label="Caratteri principali">${out.join('')}</ul>`;
}
export function compareCta(edibleId) {
  const t = refOf(edibleId), n = t ? sosiaOf(t).length : 0;
  return n ? `<a class="ts-cta" href="#/riconosci/confronta/${esc(t.key)}"><span class="ts-cta-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h7v12H4zM13 6h7v12h-7z"/><path d="M7.5 10v4M16.5 10v4"/></svg></span><span><b>Confrontalo con ${n === 1 ? 'il sosia' : `i ${n} sosia`}</b><small>Solo i caratteri che li distinguono, in Riconosci</small></span><span class="ts-cta-go" aria-hidden="true">›</span></a>` : '';
}
export function setCompare(key, pick) { state.compare = key || ''; state.pick = pick || ''; }

// righe del confronto: stessi disegni di Riconosci, un valore per lato
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const monthsTxt = (m) => { const a = [...m].sort((x, y) => x - y); return a.length && a[a.length - 1] - a[0] === a.length - 1 ? `${MESI[a[0] - 1]}–${MESI[a[a.length - 1] - 1]}` : a.map((x) => MESI[x - 1]).join(' '); };
const fleshSay = (v) => (v === 'nessuno' ? 'non cambia' : `vira al ${v}`);
const CMP = [
  { key: 'hymenophore', k: 'Sotto il cappello', art: (a) => `<span class="id-hym">${HYM_ICON[a[0]] || ''}</span>`, say: (v) => v },
  { key: 'hymenophore_color', k: 'Colore di lamelle o pori', art: (a, t) => a.slice(0, 3).map((v) => swatch(hymKind(t.traits?.hymenophore), v)).join(''), say: (v) => v },
  { key: 'flesh_change', k: 'Carne al taglio', art: (a) => `<span class="id-flesh" style="background:linear-gradient(100deg, #f4ecd8 30%, ${FLESH[a[0]]} 85%)"></span>`, say: fleshSay },
  { key: 'cap_color', k: 'Cappello', art: (a) => a.slice(0, 3).map((v) => swatch('cap', v)).join(''), say: (v) => v },
  { key: 'stem_ring', k: 'Anello', bool: true, art: (a) => ART[`ring_${a[0]}`] },
  { key: 'stem_volva', k: 'Volva', bool: true, art: (a) => ART[`volva_${a[0]}`] },
  { key: 'stem_reticulum', k: 'Reticolo sul gambo', bool: true, art: (a) => ART[`ret_${a[0]}`] },
  { key: 'smell', k: 'Odore', say: (v) => v },
  { key: 'habitat', k: 'Dove', art: (a) => ART[a[0]], say: (v) => (QUESTIONS.find((q) => q.key === 'habitat').labels[v] || v) },
  { key: 'growth', k: 'Come cresce', art: (a) => ART[a[0]], say: (v) => (QUESTIONS.find((q) => q.key === 'growth').labels[v] || v) },
  { key: 'cap_shape', k: 'Forma del cappello', art: (a) => SHAPE[a[0]], say: (v) => optLabel(QK('cap_shape'), v) },
  { key: 'cap_size', k: 'Dimensione', say: (v) => optLabel(QK('cap_size'), v) },
  { key: 'trees', k: 'Alberi', get: (t) => t.trees, say: (v) => v },
  { key: 'season', k: 'Stagione', info: true },
];
function cmpRows(ref, t) {
  return CMP.map((r) => {
    const a = r.get ? r.get(ref) : ref.traits?.[r.key], b = r.get ? r.get(t) : t.traits?.[r.key];
    if (a == null || b == null || (Array.isArray(a) && !a.length) || (Array.isArray(b) && !b.length)) return null;
    const A = [].concat(a), B = [].concat(b);
    const txt = (X) => (r.key === 'season' ? monthsTxt(X) : r.bool ? (X[0] ? 'sì' : 'no') : orList(X.map(r.say)));
    const shared = B.filter((v) => A.includes(v)).length;
    // info: la stagione aiuta poco a distinguere, quindi non diventa mai "qui li distingui"
    const kind = r.info ? 'same' : !shared ? 'diff' : (shared < B.length || shared < A.length) ? 'part' : 'same';
    const cell = (X, who) => `<div class="cmp-cell">${r.art ? `<span class="cmp-art" aria-hidden="true">${r.art(X, who)}</span>` : ''}<span>${esc(txt(X))}</span></div>`;
    return { kind, k: r.k, html: `<li class="cmp-row ${kind}"><span class="cmp-k">${esc(r.k)}</span>${cell(A, ref)}${cell(B, t)}</li>` };
  }).filter(Boolean);
}

function renderCompare(box, ref, pick) {
  const list = sosiaOf(ref);
  const pic = (t) => { const ph = photoOf(t); return ph ? `<img src="${ASSET(ph.file)}" alt="" loading="lazy">` : '<span class="look-ph">senza foto</span>'; };
  const toxCls = (t) => `tox-${String(t.toxicity || '').replace(/\s/g, '-')}`;
  const nameBtn = (t) => (t.edible_id && !t.lookalike_of?.length ? `<a href="#/specie/${t.edible_id}">${esc(t.name || t.latin)}</a>` : `<button type="button" data-taxon="${esc(t.key)}">${esc(t.name || t.latin)}</button>`);
  const slide = (t, k) => {
    const rows = cmpRows(ref, t), diff = rows.filter((r) => r.kind === 'diff'), part = rows.filter((r) => r.kind === 'part'), same = rows.filter((r) => r.kind === 'same');
    const how = HOWTO(ref.edible_id, t.latin);
    return `<section class="cmp-slide" id="cmp-${esc(t.key)}" data-i="${k}" aria-label="${esc(ref.name)} e ${esc(t.name || t.latin)}">
      <div class="cmp-pair">
        <figure class="cmp-fig ${toxCls(ref)}"><button type="button" class="cmp-zoom" data-photo="${esc(ref.key)}" aria-label="Ingrandisci la foto di ${esc(ref.name)}">${pic(ref)}</button><span class="tox">${esc(ref.toxicity)}</span></figure>
        <figure class="cmp-fig ${toxCls(t)}"><button type="button" class="cmp-zoom" data-photo="${esc(t.key)}" aria-label="Ingrandisci la foto di ${esc(t.name || t.latin)}">${pic(t)}</button><span class="tox">${esc(t.toxicity)}</span></figure>
        <span class="cmp-vs" aria-hidden="true">vs</span>
        <div class="cmp-name">${nameBtn(ref)}<i>${esc(ref.latin)}</i></div>
        <div class="cmp-name">${nameBtn(t)}${t.name !== t.latin ? `<i>${esc(t.latin)}</i>` : ''}</div>
      </div>
      ${how ? `<p class="cmp-how"><b>Come distinguerlo.</b> ${esc(how)}</p>` : ''}
      ${diff.length ? `<h4 class="cmp-h diff">Qui li distingui</h4><ul class="cmp-rows">${diff.map((r) => r.html).join('')}</ul>`
        : '<p class="cmp-none"><b>Nessuna domanda di Riconosci li separa con certezza.</b> Contano i dettagli: leggi "Come distinguerlo" e, nel dubbio, fallo vedere all\'Ispettorato micologico.</p>'}
      ${part.length ? `<h4 class="cmp-h part">A volte simili</h4><ul class="cmp-rows">${part.map((r) => r.html).join('')}</ul>` : ''}
      ${same.length ? `<details class="cmp-same"><summary>Uguali in: ${esc(same.map((r) => r.k.toLowerCase()).join(', '))}</summary><ul class="cmp-rows">${same.map((r) => r.html).join('')}</ul></details>` : ''}
      ${['mortale', 'tossico'].includes(t.toxicity) ? `<p class="cmp-verdict">Se il tuo fungo ha anche uno solo dei caratteri a destra, <b>non è ${esc(ref.name.toLowerCase())}</b>: lascialo dov'è.</p>` : ''}
    </section>`;
  };
  const start = Math.max(0, list.findIndex((t) => t.key === pick));
  box.innerHTML = `
    <a class="cmp-back" href="#/specie/${esc(ref.edible_id)}">‹ Scheda di ${esc(ref.name)}</a>
    <h2 class="sec-title cmp-title">${esc(ref.name)} o sosia?</h2>
    <p class="small muted cmp-lede">${list.length} ${list.length === 1 ? 'fungo che gli somiglia' : 'funghi che gli somigliano'}. Scorri di lato per confrontarli uno alla volta: a sinistra ${esc(ref.name.toLowerCase())}, a destra il sosia.</p>
    <div class="cmp-pick" role="tablist" aria-label="Scegli il sosia">${list.map((t, k) => `<button type="button" role="tab" class="cmp-chip ${toxCls(t)}" data-go="${k}" aria-selected="${k === start}"><span class="cmp-chip-img">${pic(t)}</span><span>${esc(t.name || t.latin)}</span></button>`).join('')}</div>
    <div class="cmp-track">${list.map(slide).join('')}</div>
    <p class="cmp-dots" aria-hidden="true">${list.map((_, k) => `<i${k === start ? ' class="on"' : ''}></i>`).join('')}</p>
    <p><a class="btn" href="#/riconosci">Riconosci un altro fungo</a></p>`;

  const track = box.querySelector('.cmp-track'), chips = [...box.querySelectorAll('.cmp-chip')], dots = [...box.querySelectorAll('.cmp-dots i')];
  const mark = (i) => {
    chips.forEach((c, k) => c.setAttribute('aria-selected', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i));
    chips[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    history.replaceState(null, '', `#/riconosci/confronta/${ref.key}/${list[i].key}`);
  };
  let cur = start;
  const slides = [...track.children];
  // l'altezza segue la slide visibile: niente vuoto sotto i confronti corti
  const fit = () => { const h = slides[cur]?.offsetHeight; if (h) track.style.height = `${h}px`; };
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== cur && list[i]) { cur = i; mark(i); fit(); }
  }, { passive: true });
  box.querySelectorAll('.cmp-same').forEach((d) => d.addEventListener('toggle', fit));
  addEventListener('resize', fit, { passive: true });
  box.querySelectorAll('.cmp-slide img').forEach((im) => im.addEventListener('load', fit, { once: true }));
  chips.forEach((c) => c.addEventListener('click', () => track.scrollTo({ left: +c.dataset.go * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })));
  requestAnimationFrame(() => { track.scrollLeft = start * track.clientWidth; fit(); });
  box.querySelectorAll('[data-taxon]').forEach((b) => b.addEventListener('click', () => openTaxon(b.dataset.taxon)));
  const all = [ref, ...list].map((t) => ({ t, ph: photoOf(t) })).filter((y) => y.ph);
  const lb = all.map(({ t, ph }) => ({ key: t.key, src: ASSET(ph.file_hd || ph.file), alt: t.name, caption: captionHtml({ title: `<span class="tox">${esc(t.toxicity)}</span> ${esc(t.name || '')} <i>${esc(t.latin)}</i>`, text: '', credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((y) => y.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}

// scheda breve per le specie senza pagina propria (velenose e sosia)
function openTaxon(key) {
  const t = TAXA.find((x) => x.key === key);
  if (!t) return;
  let dlg = document.getElementById('taxon-dlg');
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.id = 'taxon-dlg'; dlg.className = 'sheet-dlg taxon-dlg';
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.wiz-close')) dlg.close(); });
    document.body.append(dlg);
  }
  const ph = photoOf(t), tox = esc(t.toxicity || '');
  const look = (t.lookalike_of || []).map((id) => {
    const o = TAXA.find((x) => x.edible_id === id);
    return `<a class="tree-link" href="#/specie/${esc(id)}">${esc(o?.name || id)}</a>`;
  });
  dlg.innerHTML = `<button type="button" class="wiz-close" aria-label="Chiudi">✕</button>
    ${ph ? `<figure class="tx-img"><img src="${ASSET(ph.file_hd || ph.file)}" alt=""><figcaption>Foto: ${esc(ph.author)}, ${esc(ph.license)}</figcaption></figure>` : ''}
    <div class="tx-body tox-${tox.replace(/\s/g, '-')}"><span class="tox">${tox}</span>
    <h2>${esc(t.name || t.latin)}</h2>${t.name && t.name !== t.latin ? `<p class="tx-latin">${esc(t.latin)}</p>` : ''}
    ${t.caution ? `<p class="id-why"><b>Perché con cautela:</b> ${esc(t.caution)}</p>` : ''}
    ${look.length ? `<p><b>Si confonde con</b> ${look.join(', ')}</p>` : ''}
    ${t.field_rules?.length ? `<h3>Da sapere</h3><ul class="reasons">${t.field_rules.map((r) => `<li${r.severity === 'critico' ? ' class="crit"' : ''}>${esc(r.text)}</li>`).join('')}</ul>` : ''}
    ${t.check_before_picking?.length ? `<h3>Come riconoscerla</h3><ul class="reasons">${t.check_before_picking.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${t.sources?.length ? `<p class="small muted">Fonti: ${t.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ')}</p>` : ''}
    </div>`;
  dlg.showModal();
  dlg.scrollTop = 0;
}

export function renderIdentify(box) {
  if (!TAXA.length) { box.innerHTML = '<p class="notice">I caratteri delle specie sono in preparazione: la ricerca sarà disponibile a breve.</p>'; return; }
  const ref = state.compare && TAXA.find((t) => t.key === state.compare);
  if (ref) { renderCompare(box, ref, state.pick); return; }
  const list = candidates();
  const nq = state.guided ? nextQuestion(list) : null;
  const deadly = list.filter((c) => c.t.toxicity === 'mortale');
  const given = QUESTIONS.filter((q) => state.ans[q.key] != null);
  const answered = QUESTIONS.filter((q) => state.ans[q.key] !== undefined);
  // tutti i caratteri: le domande risposte si chiudono in righe, raggruppate quando sono di seguito
  const allMode = () => {
    const out = []; let run = [];
    const flush = () => { if (run.length) out.push(`<ul class="id-answers">${run.join('')}</ul>`); run = []; };
    for (const q of QUESTIONS) {
      if (state.ans[q.key] !== undefined && state.editing !== q.key) run.push(answerRow(q));
      else { flush(); out.push(questionCard(q)); }
    }
    flush();
    return out.join('');
  };
  const guidedMode = () => {
    const rows = answered.map((q) => (state.editing === q.key ? `</ul>${questionCard(q, { big: true })}<ul class="id-answers">` : answerRow(q))).join('');
    const head = answered.length ? `<div class="id-answers-head"><span>${answered.length === 1 ? 'La tua risposta' : `Le tue ${answered.length} risposte`}</span><button type="button" class="af-add" id="id-reset">Ricomincia</button></div><ul class="id-answers">${rows}</ul>`.replaceAll('<ul class="id-answers"></ul>', '') : '';
    const next = state.editing ? '' : nq ? questionCard(nq, { big: true, n: given.length + 1 })
      : '<section class="id-q id-q-big"><h3>Non ci sono altre domande utili</h3><p class="small muted">Confronta i candidati qui sotto e, nel dubbio, non raccogliere.</p></section>';
    return head + next;
  };
  box.innerHTML = `
    <details class="id-warn"><summary><b>Non è un'identificazione.</b> Restringe i candidati, velenosi compresi.</summary><p>${BANNER ? esc(BANNER) : "Prima di mangiare qualunque fungo: controllo gratuito all'Ispettorato Micologico ASL."} <a href="#/info">Emergenza</a></p></details>
    <div class="seg-tabs" role="tablist" aria-label="Modo">
      <button type="button" role="tab" data-mode="guided" aria-selected="${state.guided}">Guidata</button>
      <button type="button" role="tab" data-mode="all" aria-selected="${!state.guided}">Tutti i caratteri</button>
    </div>
    ${ZONES.length ? `<div class="filter-rail id-zones" role="group" aria-label="Dove l'hai trovato"><span class="af-label">Zona</span><button type="button" class="chip" data-zone="" aria-pressed="${!state.zone}">Ovunque</button>${ZONES.map((z) => `<button type="button" class="chip" data-zone="${z.id}" aria-pressed="${state.zone === z.id}">${esc(z.title || z.name)}</button>`).join('')}</div>` : ''}
    ${!state.guided && answered.length ? '<div class="id-answers-head"><span></span><button type="button" class="af-add" id="id-reset">Ricomincia</button></div>' : ''}
    ${state.guided ? guidedMode() : allMode()}
    <label class="search-box id-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input id="id-q" type="search" placeholder="Oppure cerca: anello, blu, castagno…" value="${esc(state.q)}" autocomplete="off" aria-label="Cerca per nome o caratteristica"></label>
    <div class="id-head"><h2 class="sec-title">${list.length} ${list.length === 1 ? 'candidato' : 'candidati'}</h2></div>
    ${deadly.length ? `<p class="id-deadly"><b>${deadly.length} ${deadly.length === 1 ? 'specie mortale compatibile' : 'specie mortali compatibili'}</b> con quello che hai indicato. Non raccogliere e non assaggiare nulla di cui non sei certo.</p>` : ''}
    <ul class="id-cards">${list.slice(0, 40).map(resultCard).join('')}</ul>
    ${RULES.length ? `<details class="sec"><summary>Regole generali di sicurezza</summary><div class="sec-body"><ul class="reasons">${RULES.map((r) => `<li${r.severity === 'critico' ? ' class="crit"' : ''}>${esc(r.text)}</li>`).join('')}</ul></div></details>` : ''}`;

  const rerender = () => renderIdentify(box);
  const rerenderSoft = () => { tick(); soft(() => renderIdentify(box)); };
  box.querySelector('#id-q').addEventListener('input', (e) => { state.q = e.target.value; clearTimeout(box._t); box._t = setTimeout(() => { rerender(); const i = box.querySelector('#id-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
  box.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.guided = b.dataset.mode === 'guided'; rerender(); }));
  box.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => { state.zone = b.dataset.zone; rerender(); }));
  box.querySelector('#id-reset')?.addEventListener('click', () => { state.ans = {}; state.q = ''; state.editing = ''; rerenderSoft(); });
  // scegli un valore: la domanda si chiude nella sua riga (anche quando la stavi cambiando)
  const answer = (k, v) => {
    state.ans[k] = v; state.editing = '';
    // cambiato "sotto il cappello": il colore di lamelle/pori va richiesto di nuovo
    if (k === 'hymenophore') delete state.ans.hymenophore_color;
    rerenderSoft();
  };
  box.querySelectorAll('.id-opt[data-k]').forEach((b) => b.addEventListener('click', () => {
    const q = QUESTIONS.find((y) => y.key === b.dataset.k);
    answer(q.key, q.bool ? b.dataset.v === 'true' : b.dataset.v);
  }));
  box.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { state.editing = state.editing === b.dataset.edit ? '' : b.dataset.edit; rerenderSoft(); }));
  box.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => { delete state.ans[b.dataset.clear]; if (b.dataset.clear === 'hymenophore') delete state.ans.hymenophore_color; state.editing = ''; rerenderSoft(); }));
  box.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.skip, null)));
  const items = list.slice(0, 40).map((c) => ({ c, ph: photoOf(c.t) })).filter((y) => y.ph);
  const lb = items.map(({ c, ph }) => ({ key: c.t.key, src: ASSET(ph.file_hd || ph.file), alt: c.t.name, caption: captionHtml({ title: `<span class="tox">${esc(c.t.toxicity)}</span> ${esc(c.t.name || '')} <i>${esc(c.t.latin)}</i>`, text: esc((c.t.check_before_picking || []).join(' · ')), credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-taxon]').forEach((b) => b.addEventListener('click', () => openTaxon(b.dataset.taxon)));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((y) => y.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}
