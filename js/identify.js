import {matchSpecies} from './species-search.js';
import {mountCompareStart,openComparePicker} from './compare-picker.js';
import {enhanceEntityAccordions} from './entity-accordions.js';
import {speciesHabitat, speciesSafetyNote} from './species-context.js';
import { alertTriangleGlyph } from './ui-icons.js';
import { availableGrowthStages } from './fungus-stages.js';
// Riconosci: ricerca per caratteristiche (visiva, testuale, guidata) su commestibili E velenose.
// Non e' un'identificazione: restringe i candidati e dice sempre cosa controllare.

import { openLightbox, captionHtml } from './lightbox.js';
import { openEntitySheet } from './entity-sheet.js';
import { soft, tick } from './motion.js';
import { matchTraits, retainCandidate, traitQuestions, traitSimilarity, attentionGroups } from './identify-model.js';
const TQ = (key) => traitQuestions().find((q) => q.key === key);

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
const SHAPE_D = {
  convesso: 'M8 34 C10 16 54 16 56 34 Z', piano: 'M6 30 C8 25 56 25 58 30 L58 34 H6 Z', emisferico: 'M14 34 C14 8 50 8 50 34 Z',
  conico: 'M32 8 C36 16 46 26 50 34 H14 C18 26 28 16 32 8 Z', ombrellato: 'M4 32 C14 26 22 22 27 17 Q32 9 37 17 C42 22 50 26 60 32 L60 34 H4 Z',
  imbuto: 'M6 20 Q32 36 58 20 L46 34 H18 Z', trombetta: 'M12 10 Q32 22 52 10 L38 54 H26 Z',
};
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
// sporata, attaccatura delle lamelle, velo, lattice, superficie, carne, base del gambo
const SPORE = { bianco: '#f7f5ef', crema: '#ecdcb8', giallo: '#e2c35a', rosa: '#e3a99c', ocra: '#c99a4e', ruggine: '#a65a2a', bruno: '#6e4a2e', 'bruno-violaceo': '#4f3a46', nero: '#26221f', 'verde-oliva': '#7d7040' };
const sporeArt = (v) => `<svg viewBox="0 0 64 64"><rect x="6" y="8" width="52" height="48" rx="5" fill="#fbfaf6" stroke="currentColor" stroke-opacity=".35"/><rect x="32" y="8" width="26" height="48" rx="0" fill="#2b2826" opacity=".9"/><path d="M32 8 H53 a5 5 0 0 1 5 5 V51 a5 5 0 0 1 -5 5 H32 Z" fill="#2b2826"/><g opacity=".92">${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return `<path d="M32 32 L${(32 + Math.cos(a) * 19).toFixed(1)} ${(32 + Math.sin(a) * 19).toFixed(1)}" stroke="${SPORE[v]}" stroke-width="2.6" stroke-linecap="round"/>`; }).join('')}</g><circle cx="32" cy="32" r="4" fill="${SPORE[v]}"/></svg>`;
const GILL_CAP = '<path d="M4 22 Q32 2 60 22 Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="2"/><path d="M28 22 V60 M36 22 V60" stroke="currentColor" stroke-width="2"/>';
const gillArt = (pts) => `<svg viewBox="0 0 64 64">${GILL_CAP}<g fill="currentColor" opacity=".7"><path d="${pts}"/><path d="${pts}" transform="translate(64 0) scale(-1 1)"/></g></svg>`;
const ATTACH = {
  libere: gillArt('M40 22 H58 L52 31 H42 Z'),
  adnate: gillArt('M36 22 H58 L52 31 H36 Z'),
  smarginate: gillArt('M36 22 H58 L52 31 H42 Q39 25 36 29 Z'),
  decorrenti: gillArt('M36 22 H58 L50 30 L36 42 Z'),
};
const DOME = (extra = '') => `<svg viewBox="0 0 64 64"><path d="M6 44 C8 14 56 14 58 44 Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="2"/>${extra}</svg>`;
const SURF = {
  asciutta: DOME(),
  liscia: DOME('<path d="M18 28 Q24 20 32 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".55"/>'),
  viscida: DOME('<path d="M18 28 Q24 20 32 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/><path d="M44 44 q2 5 0 7 q-2 -2 0 -7 Z M24 44 q2 6 0 9 q-2 -3 0 -9 Z" fill="currentColor" opacity=".8"/>'),
  squamosa: DOME([[20, 34], [30, 28], [40, 30], [48, 38], [26, 40], [36, 38], [16, 41], [44, 25]].map(([x, y]) => `<path d="M${x - 3} ${y} q3 -4 6 0" stroke="currentColor" stroke-width="1.8" fill="none"/>`).join('')),
  'vellutata/feltrata': DOME(Array.from({ length: 26 }, (_, i) => `<circle cx="${12 + (i * 37) % 40}" cy="${24 + (i * 13) % 18}" r=".9" fill="currentColor"/>`).join('')),
};
const VEIL = { true: DOME([[20, 34], [30, 26], [42, 30], [48, 39], [27, 39], [37, 37], [16, 41]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" stroke="currentColor" stroke-width="1.2"/>`).join('')), false: DOME() };
const LATEX = {
  true: '<svg viewBox="0 0 64 64"><path d="M6 26 H58 L52 34 H12 Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="2"/><path d="M30 34 l-3 6 6 0 Z" fill="currentColor" opacity=".5"/><path d="M32 38 q-5 8 0 11 q5 -3 0 -11 Z" fill="#fff" stroke="currentColor" stroke-width="1.6"/><path d="M42 36 q-3 5 0 7 q3 -2 0 -7 Z" fill="#fff" stroke="currentColor" stroke-width="1.4"/></svg>',
  false: '<svg viewBox="0 0 64 64"><path d="M6 26 H58 L52 34 H12 Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="2"/><path d="M30 34 l-3 6 6 0 Z" fill="currentColor" opacity=".5"/></svg>',
};
const TEXTURE = {
  gessosa: '<svg viewBox="0 0 64 64"><path d="M24 8 H40 V28 H24 Z M24 36 H40 V58 H24 Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2"/><path d="M20 32 H44" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/></svg>',
  fibrosa: '<svg viewBox="0 0 64 64"><path d="M24 8 H40 V26 L37 32 L34 26 L31 33 L28 26 L24 31 Z M24 58 H40 V40 L37 34 L34 40 L31 33 L28 40 L24 35 Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M28 12 V24 M33 12 V24 M37 12 V24" stroke="currentColor" stroke-width="1"/></svg>',
  'elastica/coriacea': '<svg viewBox="0 0 64 64"><path d="M26 8 C26 30 44 34 44 58 H34 C34 38 18 34 18 8 Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2"/></svg>',
  soda: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="32" rx="18" ry="20" fill="currentColor" opacity=".3" stroke="currentColor" stroke-width="2"/><path d="M24 28 h4 M34 24 h4 M30 38 h4" stroke="currentColor" stroke-width="1.4" opacity=".6"/></svg>',
};
const stemArt = (d) => `<svg viewBox="0 0 64 64"><path d="M10 14 C12 4 52 4 54 14 Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.6"/><path d="${d}" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 52 H60" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3"/></svg>`;
const BASE = {
  normale: stemArt('M27 14 V52 H37 V14 Z'),
  bulbosa: stemArt('M28 14 V40 C18 42 18 54 32 54 C46 54 46 42 36 40 V14 Z'),
  radicante: stemArt('M27 14 V52 L31 62 L33 62 L37 52 V14 Z'),
  assottigliata: stemArt('M25 14 L29 54 H35 L39 14 Z'),
};
const MESE_IT = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const FLESH = { nessuno: '#efe6d0', blu: '#2f5fb3', rosso: '#b23a2c', giallo: '#e2b52f', bruno: '#7a5434', nero: '#2b2826' };
const QUESTIONS = [
  { ...TQ('hymenophore'), label: 'Cosa c\'è sotto il cappello?', short: 'Sotto il cappello', values: ['lamelle', 'pori', 'aculei', 'pliche', 'liscio'], icon: (v) => HYM_ICON[v], hint: 'Gira il fungo e guarda la parte sotto il cappello.',
    // link scritto nel markup: la domanda non è una zona del glossario automatico
    hintHtml: 'In micologia si chiama <a class="glossary-link" data-term="imenoforo" href="#/glossario/imenoforo" aria-haspopup="dialog">imenoforo</a>.',
    tip: { title: 'Lamelle, pori, aculei: come si distinguono', items: [
      ['lamelle', 'Lamelle', 'Lamine sottili, come le pagine di un libro, che vanno dal gambo al bordo. Es. ovolo, prataiolo.'],
      ['pori', 'Pori', 'Una spugna di tubetti con tanti forellini. Si stacca dalla carne come un cuscinetto. Es. porcino.'],
      ['aculei', 'Aculei', 'Tante piccole punte morbide che pendono verso il basso. Es. steccherino.'],
      ['pliche', 'Pliche', 'Costolature basse e ramificate, scendono sul gambo: sembrano lamelle "sciolte". Es. finferlo.'],
      ['liscio', 'Liscio', 'Nessuna struttura: superficie liscia o appena rugosa. Es. trombetta dei morti. Vale anche per spugnole e false spugnole (giromitre): sotto la testa non c’è nulla. La testa è a nido d’ape nelle spugnole, a pieghe come un cervello nella falsa spugnola, che è mortale.'],
    ] } },
  { key: 'stem_volva', label: 'Alla base del gambo c\'è una volva?', short: 'Volva', bool: true, art: (v) => ART[`volva_${v}`], labels: { true: 'sì, un sacco o un bulbo con orlo', false: 'no, base semplice' }, hint: 'Per vederla bisogna estrarre il fungo intero, senza tagliarlo.' },
  { key: 'stem_ring', label: 'C\'è un anello sul gambo?', short: 'Anello', bool: true, art: (v) => ART[`ring_${v}`], labels: { true: 'sì, una gonnellina', false: 'no' } },
  { key: 'cap_color', label: 'Di che colore è il cappello?', short: 'Cappello', values: Object.keys(COLORS), color: true },
  { key: 'hymenophore_color', label: 'Di che colore sono lamelle o pori?', short: 'Lamelle/pori', values: Object.keys(COLORS), color: true, after: 'hymenophore',
    labelFor: (h) => ({ lamelle: 'Di che colore sono le lamelle?', pori: 'Di che colore sono i pori?', aculei: 'Di che colore sono gli aculei?', pliche: 'Di che colore sono le pliche?', liscio: 'Di che colore è la parte sotto il cappello?' }[h]),
    shortFor: (h) => ({ lamelle: 'Lamelle', pori: 'Pori', aculei: 'Aculei', pliche: 'Pliche' }[h]) },
  { key: 'flesh_change', label: 'Tagliata, la carne cambia colore?', short: 'Carne al taglio', values: ['nessuno', 'blu', 'rosso', 'giallo', 'bruno', 'nero'], labels: { nessuno: 'non cambia colore' }, flesh: true, hint: 'Taglia il gambo e aspetta un minuto.' },
  { key: 'habitat', label: 'Dove cresce?', short: 'Dove', values: ['latifoglie', 'conifere', 'prati/radure', 'ceppaie/legno'], art: (v) => ART[v], labels: { latifoglie: 'sotto latifoglie', conifere: 'sotto conifere', 'prati/radure': 'prati e radure', 'ceppaie/legno': 'su ceppaie o legno' } },
  { key: 'growth', label: 'Come cresce?', short: 'Crescita', values: ['singolo', 'gregario', 'cespitoso'], art: (v) => ART[v], labels: { singolo: 'da solo', gregario: 'a gruppi sparsi', cespitoso: 'a cespi, uniti alla base' } },
  { key: 'cap_shape', label: 'Che forma ha il cappello?', short: 'Forma', values: Object.keys(SHAPE), art: (v) => SHAPE[v], labels: { imbuto: 'a imbuto, depresso', trombetta: 'a trombetta', ombrellato: 'a ombrello, con umbone', conico: 'conico o a campana' }, hint: 'Guardalo di profilo. Nei funghi giovani il cappello è più chiuso.' },
  { key: 'cap_size', label: 'Quanto è grande il cappello?', short: 'Dimensione', values: ['piccolo', 'medio', 'grande'], art: (v) => SIZE({ piccolo: 0.45, medio: 0.72, grande: 1 }[v]), labels: { piccolo: 'fino a 5 cm', medio: 'da 5 a 12 cm', grande: 'oltre 12 cm' }, hint: 'Il diametro. Una carta di credito è lunga 8,5 cm.' },
  { ...TQ('trees'), label: 'Vicino a quali alberi?', short: 'Alberi', text: true, labels: { querce: 'querce (cerro, roverella, leccio)', pini: 'pini', abeti: 'abeti', carpino: 'carpino o nocciolo', 'legno morto': 'su legno morto' },
    hint: 'Molti funghi vivono in simbiosi con alberi precisi: guarda quelli entro pochi metri.' },
  { ...TQ('smell'), label: 'Che odore ha?', short: 'Odore', values: ['gradevole', 'farina', 'anice', 'rapa/terroso', 'sgradevole', 'nessuno'], text: true,
    labels: { gradevole: 'gradevole, di fungo', farina: 'di farina', anice: 'di anice', 'rapa/terroso': 'di rapa o terra', sgradevole: 'sgradevole', nessuno: 'quasi nessuno' }, hint: 'Annusa la carne appena tagliata e le lamelle. Non assaggiare.' },
  { ...TQ('season'), label: 'Quando l\'hai trovato?', short: 'Quando', values: ['adesso', ...TQ('season').values], text: true, labels: { adesso: `adesso (${MESE_IT[new Date().getMonth()]})` } },
  { key: 'gill_attachment', label: 'Come si attaccano le lamelle al gambo?', short: 'Attaccatura', values: Object.keys(ATTACH), art: (v) => ATTACH[v],
    labels: { libere: 'libere, non toccano il gambo', adnate: 'attaccate dritte', smarginate: 'con una tacca vicino al gambo', decorrenti: 'scendono sul gambo' },
    when: () => ['lamelle', 'pliche'].includes(state.ans.hymenophore), hint: 'Taglia il fungo a metà dall\'alto in basso e guarda dove le lamelle incontrano il gambo.' },
  { key: 'cap_veil', label: 'Sul cappello ci sono fiocchi o verruche che si staccano?', short: 'Verruche', bool: true, art: (v) => VEIL[v], labels: { true: 'sì, fiocchi o placche', false: 'no, cappello pulito' },
    hint: 'Sono resti del velo: si tolgono con un dito. La pioggia può lavarli via, quindi "no" non esclude nulla con certezza.' },
  { key: 'cap_surface', label: 'Com\'è la superficie del cappello?', short: 'Superficie', values: Object.keys(SURF), art: (v) => SURF[v],
    labels: { asciutta: 'asciutta, opaca', liscia: 'liscia', viscida: 'viscida, appiccica', squamosa: 'con squame', 'vellutata/feltrata': 'vellutata' }, hint: 'Toccala con un dito. Con il bagnato molti cappelli sembrano viscidi.' },
  { key: 'latex', label: 'Spezzando una lamella esce un lattice?', short: 'Lattice', bool: true, art: (v) => LATEX[v], labels: { true: 'sì, gocce di "latte"', false: 'no' },
    when: () => !['pori', 'aculei'].includes(state.ans.hymenophore), hint: 'Rompi il bordo di una lamella o il gambo: nei lattari escono subito gocce bianche o colorate.' },
  { ...TQ('flesh_texture'), label: 'Come si spezza il gambo?', short: 'Gambo', values: Object.keys(TEXTURE), art: (v) => TEXTURE[v],
    labels: { gessosa: 'netto, come un gessetto', fibrosa: 'si sfilaccia in fibre', 'elastica/coriacea': 'si piega, elastico', soda: 'compatto e sodo' }, hint: 'Piegalo tra le dita finché si rompe.' },
  { key: 'stem_base', label: 'Com\'è la base del gambo?', short: 'Base', values: Object.keys(BASE), art: (v) => BASE[v],
    labels: { normale: 'dritta', bulbosa: 'con un bulbo', radicante: 'si allunga nel terreno', assottigliata: 'si assottiglia' }, hint: 'Estrai il fungo intero, senza tagliarlo: la base è spesso decisiva (le amanite mortali hanno bulbo e volva).' },
  { ...TQ('spore_print'), label: 'Di che colore è la sporata?', short: 'Sporata', values: Object.keys(SPORE), art: (v) => sporeArt(v),
    labels: { 'bruno-violaceo': 'bruno-violacea', 'verde-oliva': 'bruno oliva' }, hint: 'Facoltativa: chiede qualche ora. Ma è uno dei caratteri più affidabili.',
    tip: { title: 'Come si fa la sporata', steps: ['Taglia il gambo e appoggia il cappello, lamelle in giù, su un foglio metà bianco e metà nero.', 'Copri con un bicchiere perché non secchi.', 'Dopo 2-6 ore solleva il cappello: la polvere rimasta è il colore delle spore.', 'Base, taglio e sporata richiedono di raccogliere il fungo. Nel Lazio i funghi non commestibili si raccolgono solo con l\'autorizzazione per studio (L.R. 32/1998, art. 3, c. 5).'] } },
  { key: 'stem_reticulum', label: 'Il gambo ha un reticolo in rilievo?', short: 'Reticolo', bool: true, art: (v) => ART[`ret_${v}`], labels: { true: 'sì, una rete', false: 'no, liscio' } },
];
const TOX_ORDER = { mortale: 0, tossico: 1, 'non commestibile': 2, 'commestibile con cautela': 3, commestibile: 4 };

// icone disegnate dei caratteri (assets/traits): se mancano restano i disegni SVG
let ICONS = null;
fetch('data/trait-icons.json').then((r) => (r.ok ? r.json() : null)).then((d) => {
  ICONS = d?.taxa || null;
  refreshComparisonParts();
  // Il catalogo delle immagini è facoltativo: se arriva dopo la scheda aggiorna solo i caratteri.
  document.querySelectorAll('[data-growth-key]').forEach(root => {
    const t = TAXA.find(t => t.key === root.dataset.growthKey);
    if (t) root.innerHTML = growthBody(t);
  });
}).catch(() => {});
const illus = (key, part, colour) => `<img class="ts-ill" src="${esc(ASSET(`assets/traits/${key}-${part}${colour ? `-${colour}` : ''}.webp`))}" alt="" width="64" height="64" loading="lazy" decoding="async" data-ill="${part}">`;
// Nel confronto la parte illustrata è un esempio della specie, non di ogni variante.
const CMP_PARTS = {
  cap_color:'cappello', cap_surface:'cappello', cap_veil:'cappello',
  hymenophore:'sotto', hymenophore_color:'sotto', gill_attachment:'sotto',
  stem_ring:'gambo', stem_volva:'gambo', stem_reticulum:'gambo', stem_base:'gambo',
};
function comparisonIllustration(key, part, shape) {
  const record = ICONS?.[key];
  if (!record) return '';
  if (shape) {
    const drawn = record.shapes?.drawn || record.base?.forma;
    if (shape !== drawn && !record.shapes?.values?.includes(shape)) return '';
    return illus(key, part, shape === drawn ? '' : shape);
  }
  return illus(key, part);
}
const comparisonVariants = new Map();
function comparisonVariantState(key) {
  if (!comparisonVariants.has(key)) {
    const record = ICONS?.[key], traits = TAXA.find(t=>t.key===key)?.traits || {};
    comparisonVariants.set(key, {color:record?.colors?.drawn || record?.base?.colore || [].concat(traits.cap_color || [])[0], shape:record?.shapes?.drawn || record?.base?.forma || [].concat(traits.cap_shape || [])[0], underColor:[].concat(traits.hymenophore_color || [])[0]});
  }
  return comparisonVariants.get(key);
}
function comparisonControls(t, trait='cap_color') {
  const chosen = comparisonVariantState(t.key);
  const [key,label] = {cap_color:['color','Colore del cappello'],cap_shape:['shape','Forma del cappello'],hymenophore_color:['underColor','Colore sotto il cappello']}[trait];
  const values = [].concat(t.traits?.[trait] || []);
  if (values.length < 2) return '';
  if (!values.includes(chosen[key])) chosen[key]=values[0];
  const fields = `<div class="ts-dots${key==='shape'?' ts-forms':''}" role="group" aria-label="${label}: ${esc(t.name||t.latin)}">${values.map(v=>`<button type="button" class="${key==='shape'?'ts-form':'ts-dot ts-chip'}"${key!=='shape'?` style="--c:${esc(COLORS[v]?.[1] || 'var(--muted)')}"`:''} data-cmp-variant="${key}" data-cmp-variant-key="${esc(t.key)}" value="${esc(v)}" aria-pressed="${chosen[key]===v}">${esc(optLabel(QK(trait),v))}</button>`).join('')}</div>`;
  return `<div class="cmp-variant-fields">${fields}</div><span class="cmp-variant-status" role="status"></span>`;
}
function updateComparisonVariant(control, gallery) {
  const key = control.dataset.cmpVariantKey, record = ICONS?.[key] || {}, t = TAXA.find(t=>t.key===key);
  if (!t) return;
  const chosen = comparisonVariantState(key);
  chosen[control.dataset.cmpVariant] = control.value;
  const c0 = record.colors?.drawn || record.base?.colore, f0 = record.shapes?.drawn || record.base?.forma;
  const c = chosen.color, f = chosen.shape;
  let suffix = '', missing = false;
  if (c && f && c!==c0 && f!==f0) {
    if (record.combos?.includes(`${c}|${f}`)) suffix = `-${c}-${f}`;
    else { suffix = `-${f}`; missing = true; }
  } else if (c && c!==c0) suffix = `-${c}`;
  else if (f && f!==f0) suffix = `-${f}`;
  const controls = [...gallery.querySelectorAll('[data-cmp-controls]')].filter(el=>el.dataset.cmpControls===key);
  for (const group of controls) {
    group.querySelectorAll('[data-cmp-variant]').forEach(button=>button.setAttribute('aria-pressed',String(button.value===chosen[button.dataset.cmpVariant])));
    group.querySelector('.cmp-variant-status').textContent = '';
  }
  gallery.querySelectorAll('[data-cmp-ill-key]').forEach(slot=>{
    const part = slot.dataset.cmpIllPart;
    if (slot.dataset.cmpIllKey!==key || slot.dataset.cmpIllValue) return;
    if (part==='sotto') {
      if (control.dataset.cmpVariant==='underColor') { slot.dataset.variantWanted='schematic'; slot.innerHTML=hymArt([].concat(t.traits?.hymenophore || [])[0],[chosen.underColor]); }
      return;
    }
    if (!['cappello','gambo'].includes(part) || control.dataset.cmpVariant==='underColor') return;
    slot.dataset.variantWanted='';
    const colorAvailable = !c || c===c0 || record.colors?.values?.includes(c);
    const shapeAvailable = !f || f===f0 || record.shapes?.values?.includes(f);
    if (!ICONS?.[key] || !colorAvailable || !shapeAvailable || missing) {
      if (part==='cappello') slot.innerHTML=capArt([f || [].concat(t.traits?.cap_shape || [])[0]],[c || [].concat(t.traits?.cap_color || [])[0]],t.traits?.cap_veil===true);
      for (const group of controls) group.querySelector('.cmp-variant-status').textContent='Variante mostrata con un disegno schematico.';
      return;
    }
    if (!slot.querySelector('img')) slot.innerHTML=illus(key,part);
    const image = slot.querySelector('img');
    if (!image) return;
    const url = ASSET(`assets/traits/${key}-${part}${suffix}.webp`);
    slot.dataset.variantWanted = url;
    if (image.getAttribute('src')===url) return;
    const pre = new Image(); pre.src = url;
    pre.decode().then(()=>{
      if (!slot.isConnected || slot.dataset.variantWanted!==url) return;
      image.src = url;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) image.animate?.([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});
    }).catch(()=>{
      if (slot.dataset.variantWanted!==url) return;
      for (const group of controls) group.querySelector('.cmp-variant-status').textContent = 'Disegno non disponibile. Resta visibile l’ultima immagine caricata.';
    });
  });
}
function refreshComparisonParts() {
  document.querySelectorAll('[data-cmp-controls]').forEach(slot=>{
    if (slot.firstElementChild) return;
    const t = TAXA.find(t=>t.key===slot.dataset.cmpControls);
    if (t) slot.innerHTML = comparisonControls(t,slot.dataset.cmpTrait);
  });
  document.querySelectorAll('[data-cmp-ill-key]').forEach(slot => {
    if (slot.querySelector('img') || slot.dataset.variantWanted!==undefined || slot.querySelector('svg')&&!slot.dataset.cmpIllValue) return;
    const image = comparisonIllustration(slot.dataset.cmpIllKey, slot.dataset.cmpIllPart, slot.dataset.cmpIllValue);
    if (image) slot.innerHTML = image;
  });
}
// varianti del cappello (colori e forme descritti dalle fonti): cambiano insieme le tessere Cappello e Gambo.
// Colore e forma non si combinano: scegliere un colore riporta la forma a quella del disegno, e viceversa.
document.addEventListener('click', (e) => {
  let b = e.target.closest?.('[data-ill-v]');
  // toccare il disegno del cappello passa al colore successivo
  const art = !b && e.target.closest?.('.trait-strip li:has(.ts-dots) .ts-art');
  if (art) { const all = [...art.closest('li').querySelectorAll('.ts-dot')]; b = all[(all.findIndex((x) => x.getAttribute('aria-pressed') === 'true') + 1) % all.length]; }
  if (!b) return;
  const strip = b.closest('.trait-strip'), key = b.dataset.illKey;
  b.parentElement.querySelectorAll('[data-ill-v]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  // colore e forma si combinano: il disegno è la coppia scelta, se esiste; altrimenti la forma scelta nel colore del disegno
  const sel = (cls) => { const x = strip.querySelector(`.${cls}[aria-pressed="true"]`); return x ? [x.dataset.illV, x.dataset.illDrawn] : [null, null]; };
  const [c, c0] = sel('ts-dot'), [f, f0] = sel('ts-form');
  const combos = (ICONS?.[key]?.combos) || [];
  let suffix = '', missing = false;
  if (c && f && c !== c0 && f !== f0) { if (combos.includes(`${c}|${f}`)) suffix = `-${c}-${f}`; else { suffix = `-${f}`; missing = true; } }
  else if (c && c !== c0) suffix = `-${c}`;
  else if (f && f !== f0) suffix = `-${f}`;
  // la nuova immagine si scarica prima e poi entra con una breve dissolvenza (niente lampo a vuoto)
  for (const part of ['cappello', 'gambo']) {
    const el = strip.querySelector(`[data-ill="${part}"]`), url = ASSET(`assets/traits/${key}-${part}${suffix}.webp`);
    if (!el || el.getAttribute('src') === url) continue;
    const pre = new Image(); pre.src = url;
    (pre.decode ? pre.decode() : Promise.resolve()).catch(() => {}).then(() => {
      el.setAttribute('src', url);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) el.animate?.([{ opacity: .35, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    });
  }
  const li = strip.querySelector('li:has(.ts-dots)'); let note = li?.querySelector('.ts-note');
  if (li && missing && !note) { note = document.createElement('span'); note.className = 'ts-note'; li.querySelector('.ts-dots').after(note); }
  if (note) { note.hidden = !missing; note.textContent = missing ? 'Colore non ancora disegnato per questa forma' : ''; }
});
let CITES = {};
let HOWTO = () => '', BANNER = '', TAXA = [], RULES = [], MEDIA = {}, ASSET = (f) => f, THUMB = () => '', POTENTIAL = () => null, ZONES = [];
const state = { q: '', ans: {}, zone: '', guided: true, compare: '', editing: '' };

export function initIdentify({ traits, media, assetUrl, thumb, potential, zones, banner, howTo }) {
  if (howTo) HOWTO = howTo;
  BANNER = banner || '';
  TAXA = Object.entries(traits?.taxa || {}).map(([key, t]) => ({ key, ...t })); simMemo.clear();
  CITES = traits?.citations || {};
  RULES = traits?.general_rules || [];
  MEDIA = media || {}; if (assetUrl) ASSET = assetUrl; if (thumb) THUMB = thumb; if (potential) POTENTIAL = potential; ZONES = zones || [];
}
export const hasIdentify = () => TAXA.length > 0;

const slug = (s) => norm(s).replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
function photoOf(t) {
  if (t.edible_id) { const m = MEDIA.species?.[t.edible_id]; return m?.ref || m?.inat?.[0]; }
  if (MEDIA.species?.[t.key]) { const m = MEDIA.species[t.key]; return m.ref || m.inat?.[0]; }
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
function matches(t, ans = state.ans) {
  return matchTraits(t, ans, QUESTIONS);
}

function candidates(ans = state.ans) {
  const search=matchSpecies(TAXA,state.q);
  return search.items.map((t) => {
    const m = matches(t, ans);
    let prior = 1;
    if (state.zone && t.edible_id) prior = 0.4 + 0.6 * (POTENTIAL(t.edible_id, state.zone)?.score ?? 0.5);
    const fit = m.tot ? m.ok / m.tot : 1;
    return { t, ...m, fit, rank: fit * prior, searchReason:search.reasons.get(t) };
  }).filter((c) => retainCandidate(c.t, c))
    .sort((a, b) => b.rank - a.rank || (TOX_ORDER[a.t.toxicity] ?? 9) - (TOX_ORDER[b.t.toxicity] ?? 9));
}

// prossima domanda: quella che divide meglio i candidati rimasti (entropia)
function nextQuestion(list) {
  let best = null;
  for (const q of QUESTIONS) {
    if (state.ans[q.key] !== undefined) continue;
    if (q.after && state.ans[q.after] === undefined) continue; // il colore di lamelle o pori solo dopo aver detto quali sono
    if (q.when && !q.when()) continue;
    const vals = q.bool ? [true, false] : q.values;
    const counts = vals.map((v) => list.filter((c) => { const tv = traitOf(c.t, q); return tv != null && hitOf(q, tv, v); }).length);
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < 2) continue;
    const h = -counts.filter(Boolean).reduce((s, c) => s + (c / n) * Math.log2(c / n), 0);
    // peso: la sporata chiede ore, stagione e odore aiutano poco a separare; prima i caratteri che vedi subito
    const w = q.weight ?? 1;
    if (!best || h * w > best.h) best = { q, h: h * w };
  }
  return best?.q || null;
}

const qLabel = (q) => q.labelFor?.(state.ans[q.after]) || q.label;
const qShort = (q) => q.shortFor?.(state.ans[q.after]) || q.short;
const tipHtml = (q) => (!q.tip ? '' : q.tip.steps
  ? `<details class="id-tip"><summary>${esc(q.tip.title)}</summary><ol class="id-tip-steps">${q.tip.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>`
  : `<details class="id-tip"><summary>${esc(q.tip.title)}</summary><ul>${q.tip.items.map(([v, t, d]) => `<li><span class="id-hym" aria-hidden="true">${HYM_ICON[v] || ''}</span><span><b>${esc(t)}</b> ${esc(d)}</span></li>`).join('')}</ul></details>`);
// caratteri si/no detti per esteso: "con anello", "senza volva" (mai "anello" o "si'" da soli)
const BOOL_NOUN = { stem_ring: 'anello', stem_volva: 'volva', stem_reticulum: 'reticolo', cap_veil: 'verruche', latex: 'lattice' };
const withOut = (key, v) => (BOOL_NOUN[key] ? `${v ? 'con' : 'senza'} ${BOOL_NOUN[key]}` : (v ? 'sì' : 'no'));
const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const optLabel = (q, v) => (q.bool ? (q.labels?.[String(v)] || (v ? 'sì' : 'no')) : (q.labels?.[v] || v));
const valLabel = (q, v) => (q.bool ? cap1(withOut(q.key, v)) : `${qShort(q)}: ${q.labels?.[v] || v}`);

function artFor(q, v) {
  if (v == null) return ART.dontknow;
  if (q.art) return q.art(v);
  if (q.icon) return `<span class="id-hym">${q.icon(v)}</span>`;
  if (q.color) return swatch(q.key === 'cap_color' ? 'cap' : hymKind(state.ans.hymenophore), v);
  if (q.flesh) return fleshArt(v);
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
  ${big && n ? `<p class="eyebrow">Domanda ${n}</p>` : ''}<h3>${esc(qLabel(q))}</h3>${big && q.hint ? `<p class="small muted">${esc(q.hint)}${q.hintHtml ? ` ${q.hintHtml}` : ''}</p>` : ''}${tipHtml(q)}${options(q, { big })}</section>`;

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
// colori concordati: "lamelle bianche", "pori bianchi" (crema, rosa, arancio, viola restano invariati)
const PLUR = { bianco: ['bianche', 'bianchi', 'bianca'], giallo: ['gialle', 'gialli', 'gialla'], rosso: ['rosse', 'rossi', 'rossa'], verde: ['verdi', 'verdi', 'verde'], grigio: ['grigie', 'grigi', 'grigia'], bruno: ['brune', 'bruni', 'bruna'], violetto: ['violette', 'violetti', 'violetta'], nero: ['nere', 'neri', 'nera'] };
const agree = (c, g) => (g === 'ms' || !PLUR[c] ? c : PLUR[c][{ fp: 0, mp: 1, fs: 2 }[g]]);
const orList = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} o ${a[a.length - 1]}` : a[0]);
function contraText(c) {
  return c.contra.map((k) => {
    const q = QUESTIONS.find((x) => x.key === k);
    if (!q) return '';
    const exp = [].concat(traitOf(c.t, q));
    if (k === 'season') return `<b>Non torna: stagione.</b> Di solito si trova in ${esc(monthsTxt(exp))}.`;
    if (k === 'trees') return `<b>Non torna: alberi.</b> Di solito vicino a ${esc(orList(exp.slice(0, 4)))}.`;
    if (q.bool) return `<b>Non torna: ${esc(q.short.toLowerCase())}.</b> Hai indicato ${withOut(k, state.ans[k])}, ma di solito ${exp[0] ? 'ce l\'ha' : 'non ce l\'ha'}.`;
    // colori di lamelle e pori accordati: "bianche o crema" (lamelle), "bianchi o gialli" (pori)
    const h = [].concat(c.t.traits?.hymenophore || [])[0];
    const g = k === 'hymenophore_color' ? ({ lamelle: 'fp', pliche: 'fp', pori: 'mp', aculei: 'mp' }[h] || 'ms') : 'ms';
    const say = (v) => (k === 'flesh_change' ? fleshSay(v) : g !== 'ms' ? agree(v, g) : optLabel(q, v));
    const verb = { hymenophore: 'ha ', cap_color: 'è ', hymenophore_color: 'sono ', habitat: 'cresce ', growth: 'cresce ', spore_print: 'è ', gill_attachment: 'sono ', cap_surface: 'è ', flesh_texture: 'si spezza ', stem_base: 'è ' }[k] || '';
    return `<b>Non torna: ${esc(q.short.toLowerCase())}.</b> Hai indicato ${esc(say(state.ans[k]))}, ma di solito ${verb}${esc(orList(exp.map(say)))}.`;
  }).join(' ');
}

function matchedKeys(c) {
  return Object.entries(state.ans).filter(([key,value])=>{
    const q=QK(key),tv=q&&traitOf(c.t,q);
    return value!=null && q && tv!=null && (!Array.isArray(tv)||tv.length) && !c.contra.includes(key);
  }).map(([key])=>key);
}
function matchSummary(c) {
  if(!c.tot)return Object.values(state.ans).some(v=>v!=null)?'<p class="small id-why">Caratteri non documentati per queste risposte.</p>':'';
  const names=keys=>keys.length?keys.slice(0,2).map(k=>esc(qShort(QK(k)))).join(', ')+(keys.length>2?` · +${keys.length-2}`:''):'nessuno';
  return `<dl class="id-match-summary" aria-label="Rispetto alle tue risposte"><div><dt>In comune · ${c.ok}</dt><dd>${names(matchedKeys(c))}</dd></div><div class="id-match-different"><dt>Diversi · ${c.contra.length}</dt><dd>${names(c.contra)}</dd></div></dl>`;
}
function resultCard(c) {
  const t = c.t, ph = photoOf(t);
  const tox = esc(t.toxicity || ''), toxL = esc(t.tox_short || t.tox_label || t.toxicity || '');
  const name = esc(t.name || t.latin);
  // regola: dentro Riconosci la card apre l'anteprima nel pannello (non perdi la ricerca), per tutti i funghi;
  // dal pannello "Scheda completa". La lente apre la foto.
  return `<li class="id-card vtn tox-${tox.replace(/\s/g, '-')}" style="--vtn:c-${t.key.replace(/[^a-z0-9-]/gi, '')}">
    <div class="id-card-img">
      ${ph ? `<img data-src="${ASSET(ph.file)}" alt="" loading="lazy" decoding="async">` : ''}<span class="tox">${toxL}</span>
      ${ph ? `<button type="button" class="id-zoom" data-photo="${esc(t.key)}" aria-label="${name}: ingrandisci la foto"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/></svg></button>` : ''}
      </div>
    <div class="id-card-body">
      <button type="button" class="id-link" data-taxon="${esc(t.key)}">${name}</button>${t.name && t.name !== t.latin ? `<i>${esc(t.latin)}</i>` : ''}${c.searchReason?`<p class="search-feature-reason">Suggerimento per caratteri · ${esc(c.searchReason)}</p>`:''}
      ${matchSummary(c)}
      <button type="button" class="small id-more" data-taxon="${esc(t.key)}" aria-label="Dettagli di ${name}">Dettagli ›</button>
    </div></li>`;
}

// --- confronto con i sosia (dalla scheda della specie) ---
const refOf = (edibleId) => TAXA.find((t) => t.edible_id === edibleId && !t.lookalike_of?.length) || TAXA.find((t) => t.edible_id === edibleId);
// quanto due funghi si somigliano (0-1, non mostrato): calcolo in identify-model.js, qui solo la memoria
const simMemo = new Map();
function similarity(a, b) {
  const id = `${a.key}|${b.key}`;
  if (!simMemo.has(id)) simMemo.set(id, traitSimilarity(a, b, TAXA));
  return simMemo.get(id);
}
// i sosia piu' somiglianti per primi; a pari somiglianza il piu' pericoloso
// Entrambe le relazioni documentate, anche per i funghi fuori dal modello dell’indice.
const sosiaOf = (ref) => TAXA.filter((t) => t !== ref && (
  (ref.edible_id && t.lookalike_of?.includes(ref.edible_id)) ||
  (t.edible_id && ref.lookalike_of?.includes(t.edible_id)) ||
  ref.dangerous_lookalikes?.includes(t.key) || t.dangerous_lookalikes?.includes(ref.key)
))
  .sort((a, b) => (similarity(ref, b) - similarity(ref, a)) || ((TOX_ORDER[a.toxicity] ?? 9) - (TOX_ORDER[b.toxicity] ?? 9)));
// per la scheda della specie: lo stesso ordine dei sosia, dato il nome latino
export const lookalikeRank = (edibleId, latin) => { const ref = refOf(edibleId), k = taxonKeyByLatin(latin), t = k && TAXA.find((x) => x.key === k); return ref && t ? similarity(ref, t) : 0; };
// caratteri che non si sovrappongono: sono quelli che li distinguono davvero
function diffs(ref, t) {
  return QUESTIONS.map((q) => {
    const a = ref.traits?.[q.key], b = t.traits?.[q.key];
    if (a == null || b == null) return null;
    const A = [].concat(a), B = [].concat(b);
    if (B.some((v) => A.includes(v))) return null;
    const say = (v) => (q.bool ? withOut(q.key, v) : q.key === 'flesh_change' ? fleshSay(v) : optLabel(q, v));
    return { q, txt: q.bool ? cap1(orList(B.map(say))) : `${q.short}: ${orList(B.map(say))}`, ref: orList(A.map(say)) };
  }).filter(Boolean);
}
// tessere dei caratteri, con gli stessi disegni di Riconosci
export function traitStrip(edibleId, t = refOf(edibleId)) {
  if (!t) return '';
  const tr = t.traits || {};
  const tile = (art, k, v, sub = '', extra = '') => `<li><span class="ts-art" aria-hidden="true">${art}</span>${extra}<span class="ts-k" data-no-glossary>${esc(k)}</span><span class="ts-v">${esc(v)}</span>${sub ? `<span class="ts-sub">${esc(sub)}</span>` : ''}</li>`;
  const out = [];
  const one = (q, v) => optLabel(q, v);
  const Q = (k) => QUESTIONS.find((q) => q.key === k);
  const ic = t.key && ICONS?.[t.key];
  const pick = (field, q, label, dot) => {
    const g = ic?.[field];
    if (!g || g.values.length < 2) return '';
    return `<span class="ts-dots${dot ? '' : ' ts-forms'}" role="group" aria-label="${label}">${g.values.map((v) => {
      const name = esc(one(Q(q), v));
      // pillola con il colore e il suo nome: su telefono un pallino da solo è un bersaglio troppo piccolo e muto
      return `<button type="button" class="${dot ? 'ts-dot ts-chip' : 'ts-form'}"${dot ? ` style="--c:${COLORS[v]?.[1] || '#999'}"` : ''} aria-pressed="${v === g.drawn}" data-ill-key="${esc(t.key)}" data-ill-v="${esc(v)}" data-ill-drawn="${esc(g.drawn)}">${name}</button>`;
    }).join('')}</span>`;
  };
  const dots = pick('colors', 'cap_color', 'Colori del cappello descritti dalle fonti', true) + pick('shapes', 'cap_shape', 'Forme del cappello descritte dalle fonti', false);
  // cappello: la sua forma, nei suoi colori, con le verruche se ci sono; sotto forma e diametro
  if (tr.cap_color || tr.cap_shape) {
    const shapes = [].concat(tr.cap_shape || ['convesso']), cols = [].concat(tr.cap_color || ['bruno']);
    // con la frequenza dalle fonti: «rosso (di solito), arancio (a volte) o giallo (di rado)»
    const freq = (field, q, v) => { const w = t.trait_freq?.[field]?.[v]; return one(q, v) + (w ? ` (${w})` : ''); };
    out.push(tile(ic ? illus(t.key, 'cappello') : capArt(shapes, cols, tr.cap_veil === true), 'Cappello', orList([].concat(tr.cap_color || []).map((v) => freq('cap_color', Q('cap_color'), v))) || '',
      [orList([].concat(tr.cap_shape || []).slice(0, 2).map((v) => optLabel(Q('cap_shape'), v))), sizeTxt(tr.cap_size)].filter(Boolean).join(' · '), dots));
  }
  // sotto il cappello e il suo colore in una sola tessera: "Lamelle · bianche o crema"
  if (tr.hymenophore || tr.hymenophore_color) {
    const h = [].concat(tr.hymenophore || [])[0];
    const k = { lamelle: 'Lamelle', pori: 'Pori', aculei: 'Aculei', pliche: 'Pliche', liscio: 'Sotto il cappello' }[h] || 'Sotto il cappello';
    const g = { lamelle: 'fp', pliche: 'fp', pori: 'mp', aculei: 'mp' }[h] || 'ms';
    const cols = [].concat(tr.hymenophore_color || []);
    const art = ic ? illus(t.key, 'sotto') : hymArt(h, cols);
    out.push(tile(art, k, cols.length ? orList(cols.map((c) => agree(c, g))) : (h === 'liscio' ? 'liscio' : '')));
  }
  // gambo: anello, volva, reticolo e base nello stesso disegno
  if (tr.stem_ring != null || tr.stem_volva != null || tr.stem_reticulum != null || tr.stem_base?.length) {
    const base = [].concat(tr.stem_base || ['normale'])[0];
    const bits = [tr.stem_ring === true ? 'con anello' : tr.stem_ring === false ? 'senza anello' : 'anello variabile',
      tr.stem_volva === true ? 'con volva' : tr.stem_volva === false ? 'senza volva' : null, tr.stem_reticulum === true ? 'con reticolo' : null].filter(Boolean);
    out.push(tile(ic ? illus(t.key, 'gambo') : stemArt2(base, tr.stem_ring, tr.stem_volva, tr.stem_reticulum, [].concat(tr.cap_color || [])[0], [].concat(tr.cap_shape || [])[0]), 'Gambo', bits.join(', '),
      tr.stem_base?.length ? `base ${orList(tr.stem_base.map((v) => optLabel(Q('stem_base'), v)))}` : ''));
  }
  if (tr.flesh_change) { const f = [].concat(tr.flesh_change); out.push(tile(fleshArt(f), 'Al taglio', orList(f.map(fleshSay)))); }
  if (tr.spore_print?.length) out.push(tile(sporeArt(tr.spore_print[0]), 'Sporata', orList(tr.spore_print.map((v) => Q('spore_print').labels?.[v] || agree(v, 'fs')))));
  // le tessere di cappello, sotto e gambo sono disegni AI (assets/traits): detto una volta, sotto la fila
  const ai = out.some((h) => h.includes('class="ts-ill"')) ? '<p class="small muted ts-ai">Disegni schematici fatti con AI, non foto: confronta con le foto e con il testo.</p>' : '';
  return `<ul class="trait-strip" aria-label="Caratteri principali">${out.join('')}</ul>${ai}`;
}

const growthStages = t => availableGrowthStages(t, ICONS?.[t.key]);
function growthBody(t) {
  const stages = growthStages(t);
  return `${stages.length ? `<div class="growth-selector" role="group" aria-label="Fasi di crescita"><button type="button" data-growth-stage="" aria-pressed="true">Panoramica</button>${stages.map(s=>`<button type="button" data-growth-stage="${esc(s.id)}" aria-pressed="false">${esc(s.label)}</button>`).join('')}</div>` : ''}<div data-growth-content>${traitStrip(null,t)}</div>`;
}
export function growthTraits(edibleId, t = refOf(edibleId)) {
  return t ? `<div class="growth-traits" data-growth-key="${esc(t.key)}">${growthBody(t)}</div>` : '';
}
document.addEventListener('click', e => {
  const button = e.target.closest?.('[data-growth-stage]');
  if (!button) return;
  const root = button.closest('[data-growth-key]'), t = TAXA.find(t => t.key === root?.dataset.growthKey);
  if (!t) return;
  const stage = growthStages(t).find(s => s.id === button.dataset.growthStage);
  if (button.dataset.growthStage && !stage) return;
  root.querySelectorAll('[data-growth-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const content = root.querySelector('[data-growth-content]');
  if (!stage) { content.innerHTML = traitStrip(null,t); return; }
  const names = {cappello:'Cappello',sotto:'Sotto il cappello',gambo:'Fungo intero',taglio:'Sezione dell’uovo'};
  content.innerHTML = `<p class="growth-description" role="status">${esc(stage.desc)}</p>${stage.id==='uovo'?'<p class="growth-warning">Nel Lazio è vietato raccogliere ovoli chiusi. Aprirli non conferma la specie e non rende lecita la raccolta.</p>':''}<ul class="trait-strip growth-gallery" aria-label="Disegni della fase: ${esc(stage.label)}">${stage.tiles.map(part=>`<li><span class="ts-art"><img class="ts-ill" src="${esc(ASSET(`assets/traits/${t.key}-${part}-fase-${stage.id}.webp`))}" alt="${esc(names[part])}: ${esc(stage.label)}" width="96" height="96" decoding="async"></span><span class="ts-k" data-no-glossary>${esc(names[part])}</span></li>`).join('')}</ul><p class="small muted ts-ai">Disegni schematici fatti con AI, non foto: confronta con le foto e con il testo.</p><a class="growth-source" href="${esc(stage.source)}" target="_blank" rel="noopener">Fonte della fase</a>`;
});

// Avvisi: ognuno ha un tipo e un titolo breve (data/species-traits.json, field_rules).
// Chiuso mostra l'indice tipo · titolo; aperto ogni avviso per intero, con la citazione (Autore, anno).
const ATT_KIND = { sosia: 'Sosia', caratteri: 'Caratteri', regole: 'Regole', cottura: 'Cottura', tossicita: 'Tossicità', ambiente: 'Ambiente' };
const citeOf = (url) => { const c = url && CITES[url]; return c ? `${c.author}, ${c.year}` : ''; };
function attItem(r) {
  const k = ATT_KIND[r.kind], c = citeOf(r.source);
  const src = r.source && /^https?:\/\//.test(r.source) ? ` <a class="att-cite" href="${esc(r.source)}" target="_blank" rel="noopener"${CITES[r.source]?.title ? ` title="${esc(CITES[r.source].title)}"` : ''}>${c ? `(${esc(c)})` : 'Fonte'}</a>` : '';
  return `<li class="att-item${r.severity === 'critico' ? ' crit' : ''}">${k ? `<span class="att-k">${k}</span>` : ''}${r.title && r.text.length > 120 ? `<b class="att-t" data-no-glossary>${esc(r.title)}</b>` : ''}<p data-glossary>${esc(r.text)}${src}</p></li>`;
}
// elenco di avvisi senza riquadro (es. «Regole generali di sicurezza»): stesse righe delle schede
export const warningList = (rules) => rules?.length ? `<ul class="att-list warn-list">${[...rules].sort((a, b) => (a.severity === 'critico' ? 0 : 1) - (b.severity === 'critico' ? 0 : 1)).map(attItem).join('')}</ul>` : '';

// Fonti come righe: «Autore, anno» in evidenza, titolo completo sotto, icona del link esterno.
// La citazione viene da species-traits.json (citations); altrimenti si ricava dal titolo.
const EXT_IC = '<svg class="src-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
export function sourceLabel(src) {
  const c = src?.url && CITES[src.url];
  if (c?.author) return c.year ? `${c.author}, ${c.year}` : c.author;
  const title = String(src?.title || '').trim();
  const cut = [' · ', ' - ', ' — ', ','].map((s) => title.indexOf(s)).filter((i) => i > 0);
  const head = (cut.length ? title.slice(0, Math.min(...cut)) : title).trim();
  const year = title.match(/\b(1[5-9]\d\d|20\d\d)\b/)?.[1];
  return year && !head.includes(year) ? `${head}, ${year}` : head;
}
const srcRow = (href, label, sub, extra = '') => `<li class="src-row"><a class="src-a" href="${esc(href)}" target="_blank" rel="noopener"><span class="src-tx"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${EXT_IC}</a>${extra}</li>`;
export function sourceRows(sources) {
  const list = (sources || []).filter((x, i, a) => x?.url && a.findIndex((y) => y?.url === x.url) === i);
  return list.length ? `<ul class="src-rows">${list.map((x) => { const l = sourceLabel(x); return srcRow(x.url, l, x.title && x.title !== l ? x.title : ''); }).join('')}</ul>` : '';
}
// crediti delle foto: «Autore · Licenza», sotto la fonte; la riga apre la pagina originale
export function photoRows(photos) {
  const list = (photos || []).filter((p) => p && (p.author || p.page));
  return list.length ? `<ul class="src-rows src-photos">${list.map((p) => {
    const label = [p.author || 'Autore non indicato', p.license].filter(Boolean).join(' · ');
    const sub = [p.prefix, p.source || 'Fotografia originale'].filter(Boolean).join(' · ');
    const lic = p.licenseUrl ? `<a class="src-lic" href="${esc(p.licenseUrl)}" target="_blank" rel="noopener" aria-label="Testo della licenza ${esc(p.license || '')}">Licenza</a>` : '';
    return p.page ? srcRow(p.page, label, sub, lic) : `<li class="src-row"><span class="src-a"><span class="src-tx"><b>${esc(label)}</b><small>${esc(sub)}</small></span></span>${lic}</li>`;
  }).join('')}</ul>` : '';
}

// un solo avviso in riga (es. «Cosa osservare» in home): tipo, titolo, testo
export const attentionLine = (r) => r?.text ? `<span class="plan-crit${r.text.length<=120?' is-brief':''}" role="note"><span class="pc-k">${ATT_KIND[r.kind] || 'Attenzione'}</span>${r.title && r.text.length>120 ? `<b class="pc-t" data-no-glossary>${esc(r.title)}</b>` : ''}<span class="pc-x">${esc(r.text)}</span></span>` : '';
export function attentionBox(rules, extra = '') {
  if (!rules?.length) return '';
  const sorted = [...rules].sort((a, b) => (a.severity === 'critico' ? 0 : 1) - (b.severity === 'critico' ? 0 : 1));
  const crit = sorted.filter((r) => r.severity === 'critico').length;
  const n = sorted.length;
  const count = n === 1 ? '' : crit === n ? `${n} avvisi critici` : crit ? `${crit} ${crit === 1 ? 'critico' : 'critici'} su ${n}` : `${n} avvisi`;
  const head = `${alertTriangleGlyph}<span class="att-h">Attenzione</span>${count ? `<small class="att-n">${count}</small>` : ''}`;
  const list = `<ul class="att-list">${sorted.map(attItem).join('')}</ul>${extra ? `<p class="att-extra small">${esc(extra)}</p>` : ''}`;
  // uno o due avvisi: sempre aperti, niente da toccare
  if (sorted.length <= 2) return `<section class="attention att-c att-static${crit ? '' : ' attention-caution'}" role="note" aria-label="Attenzione"><div class="att-top">${head}</div>${list}</section>`;
  // chiuso: quanti avvisi per tipo, in parole («2 avvisi sui sosia»), i tipi con avvisi critici per primi (identify-model.js)
  const index = `<ul class="att-index att-sum" aria-hidden="true" data-no-glossary>${attentionGroups(sorted).map((g) => `<li class="${g.crit ? 'crit' : ''}"><span class="att-it">${esc(g.text)}</span></li>`).join('')}</ul>`;
  return `<details class="attention att-c${crit ? '' : ' attention-caution'}" role="note"><summary><span class="att-top">${head}</span>${index}<span class="att-more"><span class="att-open">Leggi i dettagli e le fonti</span><span class="att-close">Chiudi i dettagli</span></span></summary>${list}</details>`;
}

// disegni composti per le tessere della scheda
let capN = 0;
const STEMC = ['#f6efe0', '#e4d8bd', '#b9a782']; // gambo e carne: crema neutro
const gid = () => `ta-${++capN}`;
const lin = (id, [l, m, d], x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>`;
const rad = (id, [l, m, d]) => `<radialGradient id="${id}" cx="36%" cy="18%" r="90%"><stop offset="0" stop-color="${l}"/><stop offset=".5" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient>`;
const svgA = (vb, w, h, body) => `<svg class="ta" viewBox="${vb}" width="${w}" height="${h}">${body}</svg>`;
function capArt(shapes, cols, veil) {
  // solo il cappello, di profilo: una sagoma per ogni forma e colore possibile (al massimo due), affiancate
  const n = Math.min(2, Math.max(shapes.length, cols.length, 1));
  let hMax = 0;
  const one = (i) => {
    const sh = shapes[Math.min(i, shapes.length - 1)] || 'convesso', c = cols[Math.min(i, cols.length - 1)] || 'bruno';
    const C = COLORS[c] || COLORS.bruno, a = gid(), d = SHAPE_D[sh] || SHAPE_D.convesso;
    const bottom = sh === 'trombetta' ? 54 : 34, top = sh === 'trombetta' ? 10 : sh === 'piano' ? 22 : 8;
    const k = n > 1 ? Math.min(.62, 30 / (bottom - top)) : Math.min(1, 40 / (bottom - top));
    const x = n > 1 ? (i ? 44 : 1) : 10, y = 44 - bottom * k;
    hMax = Math.max(hMax, (bottom - top) * k);
    return `<g transform="translate(${x} ${y.toFixed(1)}) scale(${k.toFixed(3)})"><defs>${rad(a, C)}</defs>
      <path d="${d}" fill="url(#${a})" stroke="${C[2]}" stroke-opacity=".75" stroke-width="${(1.3 / k).toFixed(2)}" stroke-linejoin="round"/>
      ${veil ? [[22, 22], [31, 17], [41, 19], [47, 26], [27, 28], [37, 25], [16, 29]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="2.3" fill="#fff" stroke="rgb(0 0 0 / .2)" stroke-width=".7"/>`).join('') : ''}</g>`;
  };
  const body = Array.from({ length: n }, (_, i) => one(i)).join('');
  // riquadro stretto attorno ai cappelli: cosi' riempiono la tessera invece di restare piccoli in basso
  const h = Math.max(22, hMax + 4);
  return svgA(`0 ${(45 - h).toFixed(1)} 84 ${h.toFixed(1)}`, 84, Math.round(h), body);
}
// il sotto del cappello visto dal basso: un disco con la trama vera (lamelle, pori, aculei, pliche),
// uno spicchio per ogni colore possibile, al centro il gambo in sezione
function hymArt(h, cols) {
  const R = 25, cx = 30, cy = 30, cs = cols.length ? cols.slice(0, 4) : ['crema'];
  const pt = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const n = cs.length, a0 = -Math.PI / 2 - (n > 1 ? Math.PI / n : 0);
  const defs = [], slices = cs.map((c, i) => {
    const id = gid(); defs.push(`<radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset=".2" stop-color="${COLORS[c][0]}"/><stop offset="1" stop-color="${COLORS[c][1]}"/></radialGradient>`);
    if (n === 1) return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id})"/>`;
    const s1 = a0 + (i / n) * 2 * Math.PI, s2 = a0 + ((i + 1) / n) * 2 * Math.PI;
    return `<path d="M${cx} ${cy} L${pt(R, s1)} A${R} ${R} 0 ${s2 - s1 > Math.PI ? 1 : 0} 1 ${pt(R, s2)} Z" fill="url(#${id})"/>`;
  });
  const ink = 'rgb(60 40 20 / .38)';
  let tex = '';
  if (h === 'lamelle' || h === 'pliche') {
    const k = h === 'pliche' ? 22 : 44;
    for (let i = 0; i < k; i++) { const a = (i / k) * 2 * Math.PI, r0 = h === 'lamelle' && i % 2 ? 15 : 7.5;
      tex += `<path d="M${pt(r0, a)} L${pt(R - 1, a)}" stroke="${ink}" stroke-width="${h === 'pliche' ? 1.3 : .75}"/>`;
      if (h === 'pliche') tex += `<path d="M${pt(16, a)} L${pt(R - 1, a + 0.09)}" stroke="${ink}" stroke-width="1"/>`; }
  } else if (h === 'pori' || h === 'aculei') {
    for (let r = 10; r < R - 1; r += 3.6) { const m = Math.round((2 * Math.PI * r) / 3.8);
      for (let i = 0; i < m; i++) { const a = (i / m) * 2 * Math.PI + r; tex += h === 'pori' ? `<circle cx="${(cx + r * Math.cos(a)).toFixed(2)}" cy="${(cy + r * Math.sin(a)).toFixed(2)}" r="1.05" fill="${ink}"/>` : `<circle cx="${(cx + r * Math.cos(a)).toFixed(2)}" cy="${(cy + r * Math.sin(a)).toFixed(2)}" r="1.25" fill="${ink}"/><circle cx="${(cx + r * Math.cos(a) - .4).toFixed(2)}" cy="${(cy + r * Math.sin(a) - .4).toFixed(2)}" r=".45" fill="#fff" opacity=".7"/>`; } }
  }
  const sep = n > 1 ? cs.map((_, i) => `<path d="M${cx} ${cy} L${pt(R, a0 + (i / n) * 2 * Math.PI)}" stroke="#fff" stroke-width="1.2" opacity=".9"/>`).join('') : '';
  const sid = gid();
  return svgA('0 0 60 60', 60, 60, `<defs>${defs.join('')}${rad(sid, STEMC)}</defs>
    <circle cx="${cx}" cy="${cy}" r="${R + 2.6}" fill="${COLORS[cs[0]][2]}" opacity=".35"/>${slices.join('')}${tex}${sep}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgb(60 40 20 / .35)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="6.2" fill="url(#${sid})" stroke="${STEMC[2]}" stroke-width="1"/>`);
}
// Simbolo del viraggio, non ritratto della specie. Il campione iniziale è neutro:
// flesh_change non descrive né la forma del fungo né il colore originale della carne.
// Se il dato ammette più esiti, li mostriamo tutti, senza sceglierne uno arbitrariamente.
// al taglio: il fungo in sezione, nello stile delle icone dei caratteri. A sinistra appena tagliato,
// a destra dopo qualche minuto; se non cambia, le due metà restano uguali.
// la carne vira su toni smorzati, non sui colori pieni dei campioni: blu-indaco, rosso vinoso, giallo paglia
const CUT = { blu: '#7f95c4', rosso: '#c4897a', giallo: '#e6cd78', bruno: '#ab8a66', nero: '#77706a' };
function fleshArt(changes) {
  const values = [...new Set([].concat(changes))], n = values.length;
  const ink = '#4a2d1a', flesh = '#f3e7cc', w = 56, h = 50;
  const cut = 'M7 25 Q7 6 28 6 Q49 6 49 25 L36 25 L37.5 44 Q28 47.5 18.5 44 L20 25 Z';
  const one = (change, i) => {
    const id = `fl-${change}-${++swN}`, after = change === 'nessuno' ? flesh : CUT[change] || flesh;
    return `<g transform="translate(${i * (w + 4)} 0)">
      <defs><clipPath id="${id}"><rect x="28" y="0" width="28" height="${h}"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${after}" stop-opacity=".35"/><stop offset=".6" stop-color="${after}" stop-opacity=".95"/></linearGradient></defs>
      <path d="${cut}" fill="${flesh}"/>
      <path d="${cut}" fill="url(#${id}g)" clip-path="url(#${id})"/>
      <path d="M7.6 21 Q9 7 28 7 Q47 7 48.4 21" fill="none" stroke="#9a6a3e" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
      <path d="M28 8.5 V44.5" stroke="${ink}" stroke-width="1" stroke-dasharray="2 2.2" opacity=".45"/>
      <path d="${cut}" fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
    </g>`;
  };
  return `<svg class="ta ts-flesh" viewBox="0 0 ${n * (w + 4) - 4} ${h}" width="${n * (w + 4) - 4}" height="${h}" aria-hidden="true">${values.map(one).join('')}</svg>`;
}
const sizeTxt = (sz) => {
  const r = { piccolo: [0, 5], medio: [5, 12], grande: [12, 99] }, a = [].concat(sz || []).map((x) => r[x]).filter(Boolean);
  if (!a.length) return '';
  const lo = Math.min(...a.map((x) => x[0])), hi = Math.max(...a.map((x) => x[1]));
  return hi >= 99 ? (lo ? `oltre\u00a0${lo}\u00a0cm` : 'di ogni taglia') : lo ? `${lo}–${hi}\u00a0cm` : `fino a\u00a0${hi}\u00a0cm`;
};
function stemArt2(base, ring, volva, ret, capCol, shape) {
  const stem = { normale: 'M27 22 C26.5 36 26 46 25.5 54 H38.5 C38 46 37.5 36 37 22 Z', bulbosa: 'M27.5 22 V42 C18 44 18 56 32 56 C46 56 46 44 36.5 42 V22 Z', radicante: 'M27 22 V50 L31 60 H33 L37 50 V22 Z', assottigliata: 'M25 22 L29 54 H35 L39 22 Z' }[base] || 'M27 22 C26.5 36 26 46 25.5 54 H38.5 C38 46 37.5 36 37 22 Z';
  const C = COLORS[capCol] || COLORS.bruno, a = gid(), b = gid();
  const cap = SHAPE_D[shape === 'trombetta' ? 'imbuto' : shape] || SHAPE_D.convesso;
  return svgA('0 0 64 62', 64, 62, `<defs>${rad(a, C)}${lin(b, STEMC, 1, 0)}</defs>
    <ellipse cx="32" cy="58" rx="20" ry="2.4" fill="currentColor" opacity=".12"/>
    <path d="${stem}" fill="url(#${b})" stroke="${STEMC[2]}" stroke-width="1.1" stroke-linejoin="round"/>
    ${ret ? '<path d="M28 26 l4 4 4-4 M28 32 l4 4 4-4 M28 38 l4 4 4-4 M32 26 v18" stroke="#8a6a3e" stroke-width=".9" fill="none" opacity=".8"/>' : ''}
    <g transform="translate(0 -11) scale(1 .95)" opacity=".32"><path d="${cap}" fill="url(#${a})" stroke="${C[2]}" stroke-opacity=".6" stroke-width="1.2"/></g>
    ${ring === true ? '<path d="M23.5 28 Q32 35 40.5 28 L38.5 33 Q32 38.5 25.5 33 Z" fill="#fbf7ec" stroke="#a8977a" stroke-width=".9"/>' : ring == null ? '<path d="M25 30 Q32 35 39 30" stroke="#a8977a" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/>' : ''}
    ${volva === true ? '<path d="M19 47 C18 59 46 59 45 47 L40 51 Q32 49 24 51 Z" fill="#f4eee0" stroke="#a8977a" stroke-width="1"/><path d="M19 47 Q21 44 25 46 M45 47 Q43 44 39 46" stroke="#a8977a" stroke-width="1.1" fill="none"/>' : ''}`);
}

// pagina completa di un velenoso o di un sosia (le commestibili hanno la loro scheda)
const photosOf = (t) => {
  if (t.edible_id && !t.lookalike_of?.length) { const m = MEDIA.species?.[t.edible_id]; return [m?.ref, ...(m?.inat || [])].filter(Boolean); }
  // schede del catalogo diventate taxon: le foto stanno nell'archivio delle specie, con lo stesso id
  if (MEDIA.species?.[t.key]) { const m = MEDIA.species[t.key]; return [m.ref, ...(m.inat || [])].filter((x, i, a) => x && a.findIndex((y) => y?.file === x.file) === i); }
  const L = MEDIA.lookalikes || {}, b = t.latin?.match(/[A-Z][a-z]+ [a-z]+/)?.[0];
  const m = L[b]; const first = photoOf(t);
  return [first, ...(m?.inat || [])].filter((x, i, a) => x && a.findIndex((y) => y?.file === x.file) === i);
};
export const taxonByKey = (key) => TAXA.find((x) => x.key === key) || null;
export const taxonName = (key) => { const t = TAXA.find((x) => x.key === key); return t?.name || t?.latin || ''; };
export const hasTaxonPage = (key) => { const t = TAXA.find((x) => x.key === key); return !!t && !(t.edible_id && !t.lookalike_of?.length); };
// copertina della scheda di un taxon (renderTaxonView): preparata al tocco della card
export const taxonHeroSrc = (key, photos = null) => { const t = taxonByKey(key), p = (photos || (t ? photosOf(t) : []))[0]; return p ? ASSET(p.file_hd || p.file) : ''; };
export function renderTaxonPage(box, key) {
  const t = TAXA.find((x) => x.key === key);
  if (!t) { box.dataset.glossaryContext='Funghi'; box.innerHTML = '<p class="muted">Specie non trovata.</p>'; return; }
  renderTaxonView(box, t);
}
// Un solo modello per le schede dei funghi senza indice di crescita: i taxon di Riconosci e le schede brevi del catalogo.
// Le sezioni compaiono solo se c'e' il dato; extra e' HTML aggiuntivo della scheda (stagione testuale, segnalazioni).
export function renderTaxonView(box, t, { photos = null, habitatText = '', extra = '' } = {}) {
  box.dataset.glossaryContext='Funghi';
  box.classList.add('fungus-page');
  const ph = photos || photosOf(t), tox = esc(t.toxicity || ''), toxL = esc(t.tox_label || t.toxicity || '');
  // per una specie senza usi alimentari «non confonderlo con» suonerebbe come un invito a raccoglierla
  const lookTitle = /^commestibile/.test(t.toxicity || '') ? 'Non confonderlo con' : 'Specie simili';
  const look = (t.lookalike_of || []).map((id) => ({ id, o: TAXA.find((x) => x.edible_id === id && !x.lookalike_of?.length) })).filter((x) => x.o).sort((x, y) => similarity(y.o, t) - similarity(x.o, t));
  const months = t.traits?.season?.length ? monthsTxt(t.traits.season) : '';
  const habitat = [].concat(t.traits?.habitat || []).map((v) => optLabel(QK('habitat'), v));
  box.innerHTML = `
    <header class="phero phero-tall">
      ${ph[0] ? `<button type="button" class="phero-img" data-photo="0" aria-label="Ingrandisci la foto"><img data-src="${ASSET(ph[0].file_hd || ph[0].file)}" alt="${esc(t.name || t.latin)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"></div>
      <div class="phero-body"><span class="pill glass tx-pill tox-${tox.replace(/\s/g, '-')}">${toxL}</span>
        <h1 class="phero-title">${esc(t.name || t.latin)}</h1>${t.name !== t.latin ? `<p class="phero-sub"><i>${esc(t.latin)}</i></p>` : ''}</div>
    </header>
    <div class="pbody">
      ${ph.length > 1 ? `<div class="sp-strip">${ph.slice(1, 6).map((p, k) => `<button type="button" class="zoomable" data-photo="${k + 1}" aria-label="Foto ${k + 2}: ingrandisci"><img data-src="${ASSET(p.file)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
      ${t.field_rules?.length ? attentionBox(t.field_rules) + (t.caution ? `<p class="id-why" data-glossary><b>Cautele della specie:</b> ${esc(t.caution)}</p>` : '') : attentionBox(t.caution ? [{ text: t.caution, severity: 'importante' }] : [])}
      ${t.traits && Object.keys(t.traits).some((k) => k !== 'season') ? `<h3>Caratteri da confrontare</h3>${growthTraits(null, t)}` : '<p class="notice">Caratteri di confronto in preparazione.</p>'}
      ${compareCta(null, t)}
      ${t.check_before_picking?.length ? `<details class="sec character-details"><summary>Cosa controllare da vicino</summary><div class="sec-body"><ol class="keys" data-glossary>${t.check_before_picking.map((x) => `<li><span class="key-text">${esc(x)}</span></li>`).join('')}</ol></div></details>` : ''}
      ${look.length ? `<h3>${lookTitle}</h3><ul class="tx-look">${look.map(({ id, o }) => { const op = photoOf(o); return `<li>
        <a class="tx-look-main" data-entity href="#/specie/${esc(id)}">${op ? `<img data-src="${ASSET(op.thumb || op.file)}" alt="" loading="lazy" decoding="async">` : ''}<span><b>${esc(o.name)}</b><i>${esc(o.latin)}</i>${o.toxicity ? `<small class="tx-c tox-${esc(o.toxicity.replace(/\s/g, '-'))}"><span class="tox">${esc(o.tox_label || o.toxicity)}</span></small>` : ''}</span></a>
        <a class="tx-cmp-btn" href="#/riconosci/confronta/${esc(t.key)}/${esc(o.key)}" aria-label="Confronta con ${esc(o.name)}, carattere per carattere">Confronta</a></li>`; }).join('')}</ul>` : ''}
      ${(() => { // sosia pericolosi segnalati dalle fonti per le schede del catalogo (campo dangerous_lookalikes)
        // e nel verso opposto: dalla scheda del tossico, i commestibili che lo indicano come sosia
        const back = TAXA.filter((x) => x !== t && (x.dangerous_lookalikes || []).includes(t.key) && !look.some((l) => l.o === x));
        const ds = [...(t.dangerous_lookalikes || []).map((k) => TAXA.find((x) => x.key === k)).filter(Boolean), ...back.filter((x) => !(t.dangerous_lookalikes || []).includes(x.key))];
        // se la sezione c'è già (sosia del modello), le schede si aggiungono sotto lo stesso titolo
        return ds.length ? `${look.length ? '' : `<h3>${lookTitle}</h3>`}<ul class="tx-look${look.length ? ' tx-look-more' : ''}">${ds.map((o) => { const op = photoOf(o); return `<li><a class="tx-look-main" data-entity href="#/fungo/${esc(o.key)}">${op ? `<img data-src="${ASSET(op.thumb || op.file)}" alt="" loading="lazy" decoding="async">` : ''}<span><b>${esc(o.name || o.latin)}</b><i>${esc(o.latin)}</i><small class="tx-c tox-${esc((o.toxicity || '').replace(/\s/g, '-'))}"><span class="tox">${esc(o.tox_label || o.toxicity || '')}</span></small></span></a><a class="tx-cmp-btn" href="#/riconosci/confronta/${esc(t.key)}/${esc(o.key)}" aria-label="Confronta con ${esc(o.name || o.latin)}, carattere per carattere">Confronta</a></li>`; }).join('')}</ul>` : '';
      })()}
      ${speciesHabitat({habitat:habitat.length ? habitat : habitatText, trees:t.trees||[], months:t.traits?.season||months})}
      ${extra}
      ${speciesSafetyNote()}
      ${t.sources?.length || ph.length ? `<details class="sec"><summary>Fonti e fotografie</summary><div class="sec-body">${sourceRows(t.sources)}${ph.length ? `<p class="src-h">Fotografie</p>${photoRows(ph)}` : ''}</div></details>` : ''}
    </div>`;
  enhanceEntityAccordions(box);
  const lb = ph.map((p) => ({ src: ASSET(p.file_hd || p.file), alt: t.name, caption: captionHtml({ title: `<span class="tox">${toxL}</span> ${esc(t.name || '')} <i>${esc(t.latin)}</i>`, credit: `Foto: ${esc(p.author || '')}${p.license ? `, ${p.licenseUrl ? `<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>` : esc(p.license)}` : ''}${p.page ? ` · <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.source || 'Fotografia originale')}</a>` : ''}` }) }));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => openLightbox(lb, +b.dataset.photo)));
}
export function compareCta(edibleId, taxon = null) {
  const t = taxon || refOf(edibleId);
  const list = t ? sosiaOf(t) : [];
  if (!list.length) return '';
  // fotografico: lui e i sosia in miniatura (oltre 4, un "+N")
  const th = (x, cls = '') => { const ph = photoOf(x); return `<span class="cc-th ${cls} tox-${String(x.toxicity || '').replace(/\s/g, '-')}">${ph ? `<img data-src="${ASSET(ph.thumb || ph.file)}" alt="" loading="lazy" decoding="async">` : ''}</span>`; };
  const shown = list.slice(0, 4), more = list.length - shown.length;
  return `<a class="cmp-cta" href="#/riconosci/confronta/${esc(t.key)}">
    <span class="cc-row" aria-hidden="true">${th(t, 'ref')}<span class="cc-vs">vs</span><span class="cc-stack">${shown.map((x) => th(x)).join('')}${more > 0 ? `<span class="cc-th cc-more">+${more}</span>` : ''}</span></span>
    <span class="cc-txt"><b>Confrontalo con ${list.length === 1 ? 'il sosia' : `i ${list.length} sosia`}</b><small>${esc(list.slice(0, 3).map((x) => x.name || x.latin).join(', '))}${list.length > 3 ? '…' : ''} · solo i caratteri che li distinguono</small></span>
    <span class="ts-cta-go" aria-hidden="true">›</span></a>`;
}
// la card di un sosia porta al confronto con la specie della scheda
export const compareHref = (edibleId, taxonKey) => { const t = refOf(edibleId); return t && taxonKey ? `#/riconosci/confronta/${t.key}/${taxonKey}` : ''; };
// per la ricerca generale: le specie senza pagina propria (velenose e sosia), con la foto
// prova tutti i binomi del nome (anche i sinonimi tra parentesi, es. "Armillaria tabescens (= Desarmillaria tabescens)")
export const taxonKeyByLatin = (latin) => {
  for (const b of String(latin || '').match(/[A-Z][a-z]+ [a-z]+/g) || []) { const t = TAXA.find((x) => x.latin?.includes(b)); if (t) return t.key; }
  return '';
};
export const searchTaxa = () => TAXA.filter((t) => !t.edible_id || t.lookalike_of?.length).map((t) => ({ key: t.key, name: t.name, latin: t.latin, toxicity: t.toxicity, tox_label: t.tox_label || '', photo: photoOf(t), look: t.lookalike_of || [] }));
export function setCompare(key, pick) { state.compare = key || ''; state.pick = pick || ''; }

// righe del confronto: stessi disegni di Riconosci, un valore per lato
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const monthsTxt = (m) => { const a = [...m].sort((x, y) => x - y); return a.length && a[a.length - 1] - a[0] === a.length - 1 ? `${MESI[a[0] - 1]}–${MESI[a[a.length - 1] - 1]}` : a.map((x) => MESI[x - 1]).join(' '); };
const fleshSay = (v) => (v === 'nessuno' ? 'non cambia colore' : `vira al ${v}`);
const CMP = [
  { key: 'hymenophore', k: 'Sotto il cappello', art: (a) => `<span class="id-hym">${HYM_ICON[a[0]] || ''}</span>`, say: (v) => v },
  { key: 'hymenophore_color', k: 'Colore sotto il cappello', label: (t) => {
    const terms = { lamelle: 'delle lamelle', pori: 'dei pori', aculei: 'degli aculei', pliche: 'delle pliche', liscio: 'della superficie liscia' };
    const types = [].concat(t.traits?.hymenophore ?? []);
    return types.length === 1 && terms[types[0]] ? `Colore ${terms[types[0]]}` : 'Colore sotto il cappello';
  }, art: (a, t) => a.slice(0, 3).map((v) => swatch(hymKind(t.traits?.hymenophore), v)).join(''), say: (v) => v },
  { key: 'flesh_change', k: 'Carne al taglio', art: fleshArt, say: fleshSay },
  { key: 'cap_color', k: 'Colore del cappello', art: (a) => a.slice(0, 3).map((v) => swatch('cap', v)).join(''), say: (v) => v },
  { key: 'stem_ring', k: 'Anello', bool: true, art: (a) => ART[`ring_${a[0]}`] },
  { key: 'stem_volva', k: 'Volva', bool: true, art: (a) => ART[`volva_${a[0]}`] },
  { key: 'stem_reticulum', k: 'Reticolo sul gambo', bool: true, art: (a) => ART[`ret_${a[0]}`] },
  { key: 'smell', k: 'Odore', say: (v) => v },
  { key: 'habitat', k: 'Dove', art: (a) => ART[a[0]], say: (v) => (QUESTIONS.find((q) => q.key === 'habitat').labels[v] || v) },
  { key: 'growth', k: 'Come cresce', art: (a) => ART[a[0]], say: (v) => (QUESTIONS.find((q) => q.key === 'growth').labels[v] || v) },
  { key: 'cap_shape', k: 'Forma del cappello', art: (a) => SHAPE[a[0]], say: (v) => optLabel(QK('cap_shape'), v) },
  { key: 'cap_size', k: 'Diametro del cappello', say: (v) => optLabel(QK('cap_size'), v) },
  { key: 'trees', k: 'Alberi', get: (t) => t.trees, say: (v) => v },
  { key: 'spore_print', k: 'Sporata', art: (a) => sporeArt(a[0]), say: (v) => optLabel(QK('spore_print'), v) },
  { key: 'gill_attachment', k: 'Attaccatura delle lamelle', art: (a) => ATTACH[a[0]], say: (v) => optLabel(QK('gill_attachment'), v) },
  { key: 'cap_veil', k: 'Verruche sul cappello', bool: true, art: (a) => VEIL[a[0]] },
  { key: 'cap_surface', k: 'Superficie del cappello', art: (a) => SURF[a[0]], say: (v) => optLabel(QK('cap_surface'), v) },
  { key: 'latex', k: 'Lattice', bool: true, art: (a) => LATEX[a[0]] },
  { key: 'flesh_texture', k: 'Il gambo si spezza', art: (a) => TEXTURE[a[0]], say: (v) => optLabel(QK('flesh_texture'), v) },
  { key: 'stem_base', k: 'Base del gambo', art: (a) => BASE[a[0]], say: (v) => optLabel(QK('stem_base'), v) },
  { key: 'season', k: 'Stagione', info: true },
];
function cmpRows(ref, t) {
  return CMP.map((r) => {
    const a = r.get ? r.get(ref) : ref.traits?.[r.key], b = r.get ? r.get(t) : t.traits?.[r.key];
    if (a == null || b == null || (Array.isArray(a) && !a.length) || (Array.isArray(b) && !b.length)) return null;
    const A = [].concat(a), B = [].concat(b);
    const txt = (X) => (r.key === 'season' ? monthsTxt(X) : r.bool ? withOut(r.key, X[0]) : orList(X.map(r.say)));
    const differentStructure = r.key === 'hymenophore_color' && JSON.stringify([].concat(ref.traits?.hymenophore ?? []).sort()) !== JSON.stringify([].concat(t.traits?.hymenophore ?? []).sort());
    const shared = differentStructure ? 0 : B.filter((v) => A.includes(v)).length;
    // info: la stagione aiuta poco a distinguere, quindi non diventa mai "qui li distingui"
    const kind = r.info ? 'same' : !shared ? 'diff' : (shared < B.length || shared < A.length) ? 'part' : 'same';
    // Valori descrittivi con disegno e alternative esplicite, senza sembrare filtri.
    // I valori comuni precedono gli altri, nello stesso ordine sui due lati.
    const say = (v) => (r.bool ? withOut(r.key, v) : r.say ? r.say(v) : String(v));
    const value = (v, who, common) => `<li class="cmp-option"><span class="cmp-v ${common ? 'common' : 'own'}"><span class="cmp-relation" aria-hidden="true">${common?'=':'≠'}</span>${CMP_PARTS[r.key] && ['cap_color','hymenophore_color'].includes(r.key) && COLORS[v] ? `<i class="cmp-color-dot" style="--cmp-color:${esc(COLORS[v][1])}" aria-hidden="true"></i>` : ''}${r.art ? `<span class="cmp-v-art${r.key==='cap_shape'?' cmp-shape-art':''}"${r.key==='cap_shape'?` data-cmp-ill-key="${esc(who.key)}" data-cmp-ill-part="cappello" data-cmp-ill-value="${esc(v)}"`:''} aria-hidden="true">${r.key==='cap_shape' && comparisonIllustration(who.key,'cappello',v) || r.art([v], who) || ''}</span>` : ''}<span class="cmp-value-text">${esc(say(v))}</span><span class="sr-only">${common ? ', in comune' : ', valore diverso nel confronto'}</span></span></li>`;
    const illustration = who => r.key==='cap_shape' ? `<span class="cmp-part-art" data-cmp-ill-key="${esc(who.key)}" data-cmp-ill-part="cappello" aria-hidden="true">${comparisonIllustration(who.key,'cappello',comparisonVariantState(who.key).shape) || capArt([comparisonVariantState(who.key).shape],[comparisonVariantState(who.key).color],who.traits?.cap_veil===true)}</span>` : CMP_PARTS[r.key] ? `<span class="cmp-part-art" data-cmp-ill-key="${esc(who.key)}" data-cmp-ill-part="${CMP_PARTS[r.key]}" aria-hidden="true">${r.key==='hymenophore_color' && [].concat(who.traits?.hymenophore_color || []).length>1 ? hymArt([].concat(who.traits?.hymenophore || [])[0],[comparisonVariantState(who.key).underColor]) : ICONS?.[who.key] ? illus(who.key,CMP_PARTS[r.key]) : ''}</span>` : '';
    const cell = (X, Y, who) => r.key === 'season'
      ? `<div class="cmp-cell" role="group" aria-label="${esc(who.name||who.latin)}"><span>${esc(txt(X))}</span></div>`
      : `<div class="cmp-cell${['hymenophore','stem_ring','stem_volva','stem_reticulum','stem_base','gill_attachment'].includes(r.key)?' cmp-cell-miniature':''}" role="group" aria-label="${esc(who.name||who.latin)}">${r.label ? `<span class="cmp-k">${esc(r.label(who))}</span>` : ''}${illustration(who)}${['cap_color','cap_shape','hymenophore_color'].includes(r.key)?`<div class="cmp-variant-controls" data-cmp-controls="${esc(who.key)}" data-cmp-trait="${r.key}">${comparisonControls(who,r.key)}</div>`:''}<ul class="cmp-vals">${[...A.filter((v) => Y.includes(v) && X.includes(v)), ...X.filter((v) => !Y.includes(v))].map(v => value(v, who, !differentStructure && Y.includes(v))).join('')}</ul></div>`;
    return { kind, info:!!r.info, k: r.k, html: `<li class="cmp-row ${kind}" data-trait="${r.key}">${r.label ? '' : `<span class="cmp-k">${esc(r.k)}</span>`}${cell(A, B, ref)}${cell(B, A, t)}</li>` };
  }).filter(Boolean);
}

let disposeCompareHeader = () => {};
export function renderComparisonStart(box, left='', right='') {
  disposeCompareHeader();
  box.classList.remove('fungus-compare');
  box.dataset.glossaryContext='Funghi';
  mountCompareStart(box,{taxa:TAXA,photo:photoOf,asset:ASSET,related:sosiaOf,left,right});
}
function renderCompare(box, ref, pick) {
  disposeCompareHeader();
  comparisonVariants.clear();
  // Il riferimento resta fermo durante le frecce; i due menu possono cambiare entrambi i lati.
  const fromToxic = !!ref.lookalike_of?.length;
  const documented = sosiaOf(ref), documentedKeys = new Set(documented.map(t=>t.key));
  const selected = TAXA.find(t=>t.key===pick && t.key!==ref.key);
  const list = selected && !documentedKeys.has(selected.key) ? [...documented,selected] : documented;
  if (!list.length) { location.hash=`#/confronta/${encodeURIComponent(ref.key)}`; return; }
  const heading = () => 'Confronta';
  const editHref = t => `#/confronta/${encodeURIComponent(ref.key)}/${encodeURIComponent(t.key)}`;
  const pic = (t, small = false) => { const ph = photoOf(t); return ph ? `<img data-src="${ASSET(small ? ph.thumb || ph.file : ph.file)}" alt="" loading="lazy" decoding="async">` : '<span class="look-ph">senza foto</span>'; };
  const toxCls = (t) => `tox-${String(t.toxicity || '').replace(/\s/g, '-')}`;
  const nameBtn = (t) => `<button type="button" data-taxon="${esc(t.key)}">${esc(t.name || t.latin)}</button>`; // nel confronto: anteprima, per tutti
  const slide = (t, k) => {
    const rows = cmpRows(ref, t), groups = [
      {kind:'diff',label:'Differenti',empty:'Nessun carattere completamente diverso nei dati disponibili. Le somiglianze non confermano l’identità.'},
      {kind:'part',label:'A volte simili',empty:'Nessuna somiglianza parziale documentata.'},
      {kind:'same',label:'In comune',empty:'Nessun carattere interamente condiviso nei dati disponibili.'},
    ], info = rows.filter(r=>r.info);
    const how = documentedKeys.has(t.key) ? (fromToxic ? HOWTO(t.edible_id, ref.latin) : HOWTO(ref.edible_id, t.latin)) : '';
    return `<section class="cmp-slide" id="cmp-${esc(t.key)}" data-i="${k}" role="group" aria-roledescription="confronto" aria-label="${esc(ref.name || ref.latin)} e ${esc(t.name || t.latin)}" ${t.key === list[start]?.key ? '' : 'hidden inert'}>
      <div class="cmp-pair">
        ${[ref, t].map((x) => `<div class="cmp-side">
          <figure class="cmp-fig ${toxCls(x)}"><span class="cmp-zoom">${pic(x)}</span><span class="tox">${esc(x.tox_label || x.toxicity)}</span>
            ${photoOf(x) ? `<button type="button" class="id-zoom" data-photo="${esc(x.key)}" aria-label="Ingrandisci la foto di ${esc(x.name || x.latin)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/></svg></button>` : ''}</figure>
          <div class="cmp-name">${nameBtn(x)}${x.name !== x.latin ? `<i>${esc(x.latin)}</i>` : ''}</div></div>`).join('')}
        <span class="cmp-vs" aria-hidden="true">vs</span>
      </div>
      ${documentedKeys.has(t.key)?`<p class="cmp-related-badge">Sosia documentati${documented.length>1?` · ${documented.findIndex(x=>x.key===t.key)+1} di ${documented.length}`:' nel catalogo'}</p>`:''}
      ${how ? `<p class="cmp-how" data-glossary="Funghi"><b>Differenze descritte.</b> ${esc(how)}</p>` : ''}
      <div class="cmp-kind-tabs" role="tablist" aria-label="Caratteri da confrontare">${groups.map(g=>`<button type="button" role="tab" id="cmp-${esc(t.key)}-tab-${g.kind}" data-cmp-group="${g.kind}" aria-controls="cmp-${esc(t.key)}-panel-${g.kind}" aria-selected="${g.kind==='diff'}" tabindex="${g.kind==='diff'?0:-1}">${g.label}</button>`).join('')}</div>
      <p class="cmp-illustration-note">Disegni schematici generati con AI: mostrano un esempio. Leggi tutte le varianti elencate e confronta con le foto.</p>
      <p class="cmp-legend" hidden><span><span class="cmp-relation" aria-hidden="true">=</span> Valore in comune</span><span><span class="cmp-relation" aria-hidden="true">≠</span> Valore diverso</span></p>
      ${groups.map(g=>{const items=rows.filter(r=>!r.info&&r.kind===g.kind);return `<section class="cmp-panel" id="cmp-${esc(t.key)}-panel-${g.kind}" data-cmp-panel="${g.kind}" role="tabpanel" aria-labelledby="cmp-${esc(t.key)}-tab-${g.kind}" tabindex="0"${g.kind==='diff'?'':' hidden'}>${items.length?`<div class="cmp-column-head" aria-hidden="true"><span>${esc(ref.name||ref.latin)}</span><span>${esc(t.name||t.latin)}</span></div><ul class="cmp-rows">${items.map(r=>r.html).join('')}</ul>`:`<p class="cmp-none">${g.empty}</p>`}</section>`;}).join('')}
      ${info.length?`<div class="cmp-season"><ul class="cmp-rows">${info.map(r=>r.html).join('')}</ul></div>`:''}
      <details class="sec cmp-sources"><summary>Fonti del confronto</summary><div class="sec-body">${sourceRows([...(ref.sources || []), ...(t.sources || [])])}</div></details>
      <p class="cmp-verdict">${[ref,t].some(x=>['mortale','tossico'].includes(x.toxicity)) ? 'Il confronto include specie tossiche o mortali; i caratteri possono variare o essere incompleti. ' : ''}Somiglianze e differenze non identificano il tuo esemplare. Fai controllare il raccolto all’Ispettorato micologico ASL.</p>
    </section>`;
  };
  const start = Math.max(0, list.findIndex((t) => t.key === pick));
  box.innerHTML = `
    <h1 class="sec-title cmp-title">${esc(heading(list[start]))}</h1>
    <div class="cmp-gallery" role="group" aria-roledescription="carosello" aria-label="Confronti con ${esc(ref.name || ref.latin)}">
    <div class="cmp-pair-nav" role="group" aria-label="Specie a confronto"><div class="cmp-nav-content"><button type="button" class="cmp-pair-menu" data-change-master aria-haspopup="dialog" aria-label="Scegli il fungo di riferimento: ${esc(ref.name||ref.latin)}"><span>${esc(ref.name||ref.latin)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><i class="cmp-nav-vs" aria-hidden="true">vs</i><button type="button" class="cmp-pair-menu" data-change-lookalike aria-haspopup="dialog" aria-label="Confronta con: ${esc(list[start].name||list[start].latin)}"><span class="cmp-sosia-count"${documented.length>1&&documentedKeys.has(list[start].key)?'':' hidden'}>${documented.length} sosia</span><span data-current-lookalike>${esc(list[start].name||list[start].latin)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div></div>
    ${documented.length?`<div class="cmp-edge-arrows"${documented.length===1&&documentedKeys.has(list[start].key)?' hidden':''}><button type="button" data-cmp-step="-1" aria-label="Sosia precedente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button type="button" data-cmp-step="1" aria-label="Sosia successivo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div>`:''}
    <div class="cmp-track">${list.map(slide).join('')}</div><p class="sr-only" data-cmp-announcement role="status" aria-atomic="true"></p></div>
    <p><a class="btn primary" href="#/confronta">Scegli un nuovo confronto</a></p>`;

  const track = box.querySelector('.cmp-track');
  track.addEventListener('click', event => {
    const control = event.target.closest('button[data-cmp-variant]');
    if (control) updateComparisonVariant(control,track);
  });
  const mark = (i) => {
    box.querySelector('.cmp-title').textContent=heading(list[i]);
    const headerAction=document.querySelector('[data-appbar-action]');
    if(headerAction) headerAction.href=editHref(list[i]);
    const arrows=box.querySelector('.cmp-edge-arrows');
    if(arrows)arrows.hidden=documented.length<2&&documentedKeys.has(list[i].key);
    box.querySelector('.cmp-sosia-count').hidden=!(documented.length>1&&documentedKeys.has(list[i].key));
    const currentName = box.querySelector('[data-current-lookalike]');
    if (currentName) {
      currentName.textContent = list[i].name || list[i].latin;
      currentName.closest('button').setAttribute('aria-label', `Scegli il fungo: ${list[i].name || list[i].latin}`);
    }
    for (const [k, slide] of [...track.children].entries()) { slide.inert = k !== i; slide.hidden = k !== i; }
    history.replaceState(null, '', `#/riconosci/confronta/${ref.key}/${list[i].key}`);
    box.querySelector('[data-cmp-announcement]').textContent = `${ref.name||ref.latin} a confronto con ${list[i].name || list[i].latin}${documentedKeys.has(list[i].key)?', sosia documentati':''}`;
  };
  let cur = start;
  const slides = [...track.children];
  // l'altezza segue la slide visibile: niente vuoto sotto i confronti corti
  const gallery = box.querySelector('.cmp-gallery'), header = box.querySelector('.cmp-pair-nav');
  const headerContent = header.querySelector('.cmp-nav-content');
  const syncCompareHeader = () => {
    if (!gallery.getClientRects().length) return;
    const appbarHidden = matchMedia('(max-width:899px)').matches && document.documentElement.classList.contains('header-away');
    const appbar = document.querySelector('.appbar');
    const safeTop = parseFloat(appbar && getComputedStyle(appbar).paddingTop) || 0;
    const viewportTop = window.visualViewport?.offsetTop || 0;
    const contentTop = viewportTop + safeTop;
    const top = viewportTop + (appbarHidden ? safeTop : appbar?.offsetHeight || 0);
    // La soglia non cambia quando l'header principale si nasconde o riappare.
    // Scendendo, i nomi restano nell'area visibile anche sotto la safe area iOS.
    header.style.setProperty('--cmp-header-top', `${top}px`);
    const columns = slides[cur]?.querySelector('.cmp-panel:not([hidden]) .cmp-column-head') || slides[cur]?.querySelector('.cmp-kind-tabs');
    const rect = header.getBoundingClientRect();
    const pastColumns = columns && columns.getBoundingClientRect().bottom <= contentTop;
    const onScreen = gallery.getBoundingClientRect().bottom > top + headerContent.offsetHeight;
    if (!header.classList.contains('is-stuck') && !header.classList.contains('is-single')) {
      header.style.setProperty('--cmp-nav-height', `${headerContent.offsetHeight}px`);
    }
    header.style.setProperty('--cmp-header-left', `${rect.left}px`);
    header.style.setProperty('--cmp-header-width', `${rect.width}px`);
    header.classList.toggle('is-stuck', !!pastColumns && onScreen);
  };
  addEventListener('scroll', syncCompareHeader, {passive:true});
  addEventListener('resize', syncCompareHeader, {passive:true});
  window.visualViewport?.addEventListener('resize', syncCompareHeader, {passive:true});
  window.visualViewport?.addEventListener('scroll', syncCompareHeader, {passive:true});
  const headerChanges = new MutationObserver(syncCompareHeader);
  headerChanges.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  const headerSize = new ResizeObserver(syncCompareHeader);
  headerSize.observe(header);
  disposeCompareHeader = () => {
    removeEventListener('scroll', syncCompareHeader);
    removeEventListener('resize', syncCompareHeader);
    window.visualViewport?.removeEventListener('resize', syncCompareHeader);
    window.visualViewport?.removeEventListener('scroll', syncCompareHeader);
    headerChanges.disconnect(); headerSize.disconnect();
    ro.disconnect(); trackSize.disconnect();
    candidateAnimation?.cancel();
  };
  const fit = () => {
    const photo = slides[cur]?.querySelector('.cmp-zoom');
    if (photo) {
      const rect = photo.getBoundingClientRect();
      gallery.style.setProperty('--cmp-photo-mid', `${rect.top - gallery.getBoundingClientRect().top + rect.height/2}px`);
    }
    syncCompareHeader();
  };
  // l'altezza segue la slide visibile anche quando cresce dopo (foto caricate, sezioni aperte): mai uno scroll dentro lo scroll
  const ro = new ResizeObserver(() => fit());
  slides.forEach((sl) => ro.observe(sl));
  const selectGroup = kind => {
    for(const sl of slides){
      sl.querySelectorAll('[data-cmp-group]').forEach(b=>{const on=b.dataset.cmpGroup===kind;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
      sl.querySelectorAll('[data-cmp-panel]').forEach(panel=>panel.hidden=panel.dataset.cmpPanel!==kind);
      sl.querySelector('.cmp-legend').hidden=kind!=='part';
    }
    fit();
  };
  box.querySelectorAll('[data-cmp-group]').forEach(button=>{
    button.addEventListener('click',()=>selectGroup(button.dataset.cmpGroup));
    button.addEventListener('keydown',e=>{
      const tabs=[...button.parentElement.querySelectorAll('[data-cmp-group]')],i=tabs.indexOf(button);
      const next={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[e.key];
      if(next===undefined)return;
      e.preventDefault();selectGroup(tabs[next].dataset.cmpGroup);tabs[next].focus({preventScroll:true});
    });
  });
  box.querySelectorAll('.cmp-sources').forEach(d=>d.addEventListener('toggle',fit));
  const trackSize = new ResizeObserver(fit);
  trackSize.observe(track);
  box.querySelectorAll('.cmp-slide img').forEach(im => im.addEventListener('load', fit, {once:true}));
  // Il riferimento è lo stesso nodo DOM: resta fermo mentre cambia il candidato.
  // Animazione locale, anche su Safari, senza transizioni dell'intera pagina.
  let candidateAnimation;
  const go = k => {
    if (k === cur || !slides[k]) return;
    candidateAnimation?.cancel();
    const reference = slides[cur].querySelector('.cmp-side');
    const replacement = slides[k].querySelector('.cmp-side');
    const slot = document.createComment('reference');
    reference.replaceWith(slot);
    replacement.replaceWith(reference);
    slot.replaceWith(replacement);
    cur = k; mark(k); fit();
    const candidate = slides[k].querySelectorAll('.cmp-side')[1];
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && candidate.animate) {
      candidateAnimation = candidate.animate([
        {opacity:0, transform:'scale(.985)'},
        {opacity:1, transform:'scale(1)'},
      ], {duration:260, easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  };
  const stepSosia = step => {
    if (!documented.length) return;
    const index=documented.findIndex(t=>t.key===list[cur].key);
    const next=index<0?(step>0?0:documented.length-1):(index+step+documented.length)%documented.length;
    go(list.findIndex(t=>t.key===documented[next].key));
  };
  // Il gesto sceglie il sosia successivo: non trascina la coppia su un binario.
  let swipe;
  track.addEventListener('pointerdown', event => {
    swipe = event.pointerType !== 'mouse' && !event.target.closest('button,a,input,select,textarea,label,summary')
      ? {id:event.pointerId,x:event.clientX,y:event.clientY} : null;
  });
  track.addEventListener('pointercancel', () => { swipe = null; });
  track.addEventListener('pointerup', event => {
    const start = swipe; swipe = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX-start.x, dy = event.clientY-start.y;
    if (Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)*1.5) stepSosia(dx<0?1:-1);
  });
  box.querySelectorAll('[data-cmp-step]').forEach(button => button.onclick = () => stepSosia(Number(button.dataset.cmpStep)));
  box.querySelector('[data-change-lookalike]').onclick = () => {
    openComparePicker({taxa:TAXA,photo:photoOf,asset:ASSET,title:'Confronta con…',current:list[cur].key,exclude:ref.key,related:documented,onSelect:t=>{
      const i=list.findIndex(x=>x.key===t.key);
      if(i>=0)go(i);
      else location.hash=`#/riconosci/confronta/${encodeURIComponent(ref.key)}/${encodeURIComponent(t.key)}`;
    }});
  };
  box.querySelector('[data-change-master]').onclick = () => {
    const other=list[cur];
    openComparePicker({taxa:TAXA,photo:photoOf,asset:ASSET,title:'Scegli il riferimento',current:ref.key,exclude:other.key,related:sosiaOf(other),onSelect:t=>{
      if(t.key!==ref.key)location.hash=`#/riconosci/confronta/${encodeURIComponent(t.key)}/${encodeURIComponent(other.key)}`;
    }});
  };
  requestAnimationFrame(fit);
  box.querySelectorAll('[data-taxon]').forEach((b) => b.addEventListener('click', () => openTaxon(b.dataset.taxon)));
  const all = [ref, ...list].map((t) => ({ t, ph: photoOf(t) })).filter((y) => y.ph);
  const lb = all.map(({ t, ph }) => ({ key: t.key, src: ASSET(ph.file_hd || ph.file), alt: t.name, caption: captionHtml({ title: `<span class="tox">${esc(t.tox_label || t.toxicity)}</span> ${esc(t.name || '')} <i>${esc(t.latin)}</i>`, text: '', credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((y) => y.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}

// scheda breve per le specie senza pagina propria (velenose e sosia)
export function openTaxon(key, {answers = false} = {}) {
  const t = TAXA.find(x => x.key === key);
  if (!t) return;
  const href = t.edible_id && !t.lookalike_of?.length ? `#/specie/${t.edible_id}` : `#/fungo/${t.key}`;
  const decorate=answers?body=>{
    const c={t,...matches(t)};
    if(!c.tot)return;
    const section=document.createElement('section');section.className='id-answer-details';
    section.innerHTML=`<h3>Rispetto alle tue risposte</h3><p class="small muted">Confronto con i caratteri documentati: non identifica il fungo e non ne certifica la commestibilità.</p><h4>In comune · ${c.ok}</h4>${c.ok?`<ul>${matchedKeys(c).map(k=>`<li><b>${esc(qShort(QK(k)))}</b>: ${esc(optLabel(QK(k),state.ans[k]))}</li>`).join('')}</ul>`:'<p>Nessun carattere in comune fra quelli confrontabili.</p>'}<h4>Diversi · ${c.contra.length}</h4>${c.contra.length?`<ul>${c.contra.map(k=>`<li>${contraText({...c,contra:[k]})}</li>`).join('')}</ul>`:'<p>Nessuna differenza nei caratteri confrontabili. Non è una conferma dell’identità.</p>'}`;
    (body.querySelector('.pbody')||body).prepend(section);
  }:undefined;
  if (!openEntitySheet(href,document.activeElement,{decorate})) location.hash = href;
}

// --- Modo "Filtri": i caratteri come filtro avanzato (gruppi per parte del fungo, chip con il conteggio) ---
const FGROUPS = [
  ['Sotto il cappello', ['hymenophore', 'hymenophore_color', 'gill_attachment', 'latex']],
  ['Cappello', ['cap_color', 'cap_shape', 'cap_size', 'cap_surface', 'cap_veil']],
  ['Gambo', ['stem_ring', 'stem_volva', 'stem_reticulum', 'stem_base', 'flesh_texture']],
  ['Carne e odore', ['flesh_change', 'smell', 'spore_print']],
  ['Dove e quando', ['habitat', 'trees', 'growth', 'season']],
];
const shortOpt = (q, v) => (q.bool ? cap1(withOut(q.key, v)) : cap1(String(optLabel(q, v)).split(/,| \(/)[0]));
const PRIMARY_FILTERS = ['hymenophore', 'habitat'];
function facetsHtml(groups = FGROUPS, compact = false) {
  // per ogni carattere, quanti candidati restano scegliendo ciascun valore (contando gli altri filtri, non il suo)
  return groups.map(([title, keys]) => {
    const rows = keys.map(QK).filter((q) => q && (!q.when || q.when() || state.ans[q.key] !== undefined)).map((q) => {
      const others = { ...state.ans }; delete others[q.key];
      const pool = candidates(others);
      const vals = q.bool ? [true, false] : q.values;
      const cur = state.ans[q.key];
      const chips = vals.map((v) => {
        const n = pool.filter((c) => { const tv = traitOf(c.t, q); return tv != null && !(Array.isArray(tv) && !tv.length) && hitOf(q, tv, v); }).length;
        const on = cur === v;
        if (!n && !on) return '';
        return `<button type="button" class="fo${q.color || q.flesh ? ' fo-sw' : ''}" data-fk="${q.key}" data-fv="${esc(String(v))}" aria-pressed="${on}"><span class="fo-art" aria-hidden="true">${artFor(q, v)}</span><span class="fo-l">${esc(shortOpt(q, v))}</span><span class="fo-n">${n}</span></button>`;
      }).join('');
      if (!chips) return '';
      const heading = compact && q.key === 'habitat' ? 'Dove cresce' : qShort(q);
      return `<div class="facet${cur !== undefined ? ' on' : ''}" role="group" aria-label="${esc(heading)}"><div class="facet-h"><span>${esc(heading)}</span>${cur !== undefined ? `<button type="button" class="facet-x" data-fclear="${q.key}">Togli</button>` : ''}</div><div class="facet-o">${chips}</div></div>`;
    }).join('');
    return compact ? rows : rows ? `<section class="fgroup"><h3 class="fgroup-h">${esc(title)}</h3>${rows}</section>` : '';
  }).join('');
}
const activeChips = () => QUESTIONS.filter((q) => state.ans[q.key] != null && !PRIMARY_FILTERS.includes(q.key)).map((q) => `<button type="button" class="chip chip-x" data-fclear="${q.key}"><span>${esc(q.bool ? cap1(withOut(q.key, state.ans[q.key])) : `${qShort(q)}: ${shortOpt(q, state.ans[q.key]).toLowerCase()}`)}</span>${X_IC}</button>`).join('');
let idfSheet = null;
function openFilterSheet(box) {
  if (!idfSheet) {
    idfSheet = document.createElement('dialog');
    idfSheet.id = 'identify-filters';
    idfSheet.className = 'sheet-dlg idf-sheet';
    idfSheet.setAttribute('aria-labelledby', 'identify-filters-title');
    idfSheet.addEventListener('click', (e) => { if (e.target === idfSheet || e.target.closest('[data-idf-close]')) idfSheet.close(); });
    idfSheet.addEventListener('close', () => box.querySelector('[data-idf-open]')?.focus({preventScroll:true}));
    document.body.append(idfSheet);
  }
  const paint = () => {
    const n = candidates().length;
    idfSheet.innerHTML = `<div class="tx-handle" data-drag aria-hidden="true"><span class="sheet-grip"></span></div>
      <div class="idf-sh-h"><h2 id="identify-filters-title">Tutti i caratteri</h2><div>${Object.keys(state.ans).length ? '<button type="button" class="af-add" data-fall>Azzera</button>' : ''}<button type="button" class="icon-btn" data-idf-close aria-label="Chiudi il pannello dei caratteri">×</button></div></div>
      <div class="idf-sh-b">${facetsHtml()}</div>
      <div class="idf-sh-f"><button type="button" class="btn primary big" data-idf-close>Mostra ${n} ${n === 1 ? 'candidato' : 'candidati'}</button></div>`;
    wireFacets(idfSheet, selector => { renderIdentify(box); paint(); focusFilter(idfSheet, selector); });
  };
  idfSheet._paint = paint;
  paint();
  if (!idfSheet.open) idfSheet.showModal();
}
function focusFilter(root, selector) {
  (root.querySelector(selector) || root.querySelector('[data-idf-open],[data-idf-close]'))?.focus({preventScroll:true});
}
function wireFacets(root, after) {
  root.querySelectorAll('[data-fk]').forEach((b) => b.addEventListener('click', () => {
    const q = QK(b.dataset.fk), v = q.bool ? b.dataset.fv === 'true' : b.dataset.fv;
    if (state.ans[q.key] === v) delete state.ans[q.key]; else state.ans[q.key] = v;
    if (q.key === 'hymenophore') { delete state.ans.hymenophore_color; delete state.ans.gill_attachment; }
    tick(); after(`[data-fk="${q.key}"][data-fv="${CSS.escape(String(v))}"]`);
  }));
  root.querySelectorAll('[data-fclear]').forEach((b) => b.addEventListener('click', () => { delete state.ans[b.dataset.fclear]; if(b.dataset.fclear==='hymenophore'){delete state.ans.hymenophore_color;delete state.ans.gill_attachment;} tick(); after(`[data-fk="${b.dataset.fclear}"]`); }));
  root.querySelector('[data-fall]')?.addEventListener('click', () => { state.ans = {}; tick(); after('[data-fall]'); });
}

export function renderIdentify(box) {
  box.dataset.glossaryContext='Funghi';
  if (!TAXA.length) { box.innerHTML = '<p class="notice">I caratteri delle specie sono in preparazione: la ricerca sarà disponibile a breve.</p>'; return; }
  const ref = state.compare && TAXA.find((t) => t.key === state.compare);
  box.classList.toggle('fungus-compare', !!ref);
  if (ref) { renderCompare(box, ref, state.pick); return; }
  const list = candidates();
  const nq = state.guided ? nextQuestion(list) : null;
  const given = QUESTIONS.filter((q) => state.ans[q.key] != null);
  const answered = QUESTIONS.filter((q) => state.ans[q.key] !== undefined);
  const guidedMode = () => {
    const rows = answered.map((q) => (state.editing === q.key ? `</ul>${questionCard(q, { big: true })}<ul class="id-answers">` : answerRow(q))).join('');
    const head = answered.length ? `<div class="id-answers-head"><span>${answered.length === 1 ? 'La tua risposta' : `Le tue ${answered.length} risposte`}</span><button type="button" class="af-add" id="id-reset">Ricomincia</button></div><ul class="id-answers">${rows}</ul>`.replaceAll('<ul class="id-answers"></ul>', '') : '';
    const next = state.editing ? '' : nq ? questionCard(nq, { big: true, n: given.length + 1 })
      : '<section class="id-q id-q-big"><h3>Non ci sono altre domande utili</h3><p class="small muted">Confronta i candidati qui sotto e, nel dubbio, non raccogliere.</p></section>';
    return head + next;
  };
  box.innerHTML = `
    <details class="id-warn context-note" name="identify-notices"><summary><b>Non è un'identificazione.</b></summary><p>${BANNER ? esc(BANNER) : "La ricerca restringe i candidati, velenosi compresi. Prima del consumo: controllo gratuito all’Ispettorato micologico ASL."} <a href="#/info">Emergenza</a></p></details>
    <div class="identify-mode-action"><button type="button" class="link-btn" data-mode="${state.guided ? 'all' : 'guided'}">${state.guided ? 'Mostra tutti i filtri' : '← Torna alle domande'}</button></div>
    ${ZONES.length ? `<div class="filter-rail id-zones" role="group" aria-label="Dove l'hai trovato"><span class="af-label">Zona</span><button type="button" class="chip" data-zone="" aria-pressed="${!state.zone}">Ovunque</button>${ZONES.map((z) => `<button type="button" class="chip" data-zone="${z.id}" aria-pressed="${state.zone === z.id}">${esc(z.title || z.name)}</button>`).join('')}</div>` : ''}
    ${state.guided ? guidedMode() : `<div class="idf-primary" aria-label="Caratteri principali">${facetsHtml([['', PRIMARY_FILTERS]], true)}</div><div class="idf-bar">${activeChips()}<button type="button" class="btn idf-open" data-idf-open aria-haspopup="dialog" aria-controls="identify-filters">Altri${given.filter(q=>!PRIMARY_FILTERS.includes(q.key)).length ? ` <b>${given.filter(q=>!PRIMARY_FILTERS.includes(q.key)).length}</b>` : ''}</button>${given.length ? '<button type="button" class="af-add" data-fall>Azzera</button>' : ''}</div>`}
    ${state.guided && !given.length && !state.q && !state.zone ? '' : `<div class="id-head"><h2 class="sec-title">${list.length} ${list.length === 1 ? 'candidato' : 'candidati'}</h2></div>`}
    <label class="search-box id-search id-filter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg><input id="id-q" type="search" placeholder="Filtra i candidati: anello, blu, castagno…" value="${esc(state.q)}" autocomplete="off" aria-label="Filtra i candidati per parola"></label>
    <details class="id-deadly context-note" name="identify-notices"><summary><b>Le risposte e i filtri non escludono i funghi mortali.</b></summary><p>Anello e volva possono essere nascosti o danneggiati. Il catalogo è incompleto: anche un solo candidato o nessun mortale nei risultati non conferma la specie né la commestibilità.</p></details>
    ${state.guided && !given.length && !state.q && !state.zone
      ? `<p class="small muted gk-start">${list.length} funghi nel catalogo, velenosi compresi. Rispondi alla prima domanda o filtra per parola: i candidati compaiono man mano che restringi.</p>`
      : `<ul class="id-cards">${list.slice(0, 40).map(resultCard).join('')}</ul>`}
    ${RULES.length ? `<details class="sec" name="identify-notices"><summary>Regole generali di sicurezza</summary><div class="sec-body">${warningList(RULES)}</div></details>` : ''}`;

  const notices=[...box.querySelectorAll(':scope > details[name="identify-notices"]')];
  notices.forEach(el=>el.addEventListener('toggle',()=>{
    if(el.open)notices.forEach(other=>{if(other!==el)other.open=false;});
  }));

  const rerender = () => renderIdentify(box);
  const rerenderSoft = () => { tick(); soft(() => renderIdentify(box)); };
  box.querySelector('#id-q').addEventListener('input', (e) => { state.q = e.target.value; clearTimeout(box._t); box._t = setTimeout(() => { rerender(); const i = box.querySelector('#id-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
  box.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.guided = b.dataset.mode === 'guided'; rerender(); box.querySelector('[data-mode]')?.focus({preventScroll:true}); }));
  if (!state.guided) {
    wireFacets(box, selector => soft(() => { renderIdentify(box); focusFilter(box, selector); }));
    box.querySelector('[data-idf-open]')?.addEventListener('click', () => openFilterSheet(box));
  }
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
  const lb = items.map(({ c, ph }) => ({ key: c.t.key, src: ASSET(ph.file_hd || ph.file), alt: c.t.name, caption: captionHtml({ title: `<span class="tox">${esc(c.t.tox_label || c.t.toxicity)}</span> ${esc(c.t.name || '')} <i>${esc(c.t.latin)}</i>`, text: esc((c.t.check_before_picking || []).join(' · ')), credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-taxon]').forEach((b) => b.addEventListener('click', () => openTaxon(b.dataset.taxon,{answers:!!b.closest('.id-card')})));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((y) => y.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}
