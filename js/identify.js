// Riconosci: ricerca per caratteristiche (visiva, testuale, guidata) su commestibili E velenose.
// Non e' un'identificazione: restringe i candidati e dice sempre cosa controllare.

import { openLightbox, captionHtml } from './lightbox.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// domande: chiave del tratto, etichetta, valori (con eventuale icona/colore)
const COLORS = { bianco: '#f4f2ec', crema: '#efe2c4', giallo: '#e9c43a', arancio: '#e47b23', rosa: '#e7a3b0', rosso: '#b8352b', verde: '#8aa36b', grigio: '#9a9792', bruno: '#7a5434', violetto: '#8b6fae', nero: '#2b2826' };
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
const FLESH = { nessuno: '#f4f2ec', blu: '#3a6fc4', rosso: '#b8352b', giallo: '#e9c43a', bruno: '#7a5434', nero: '#2b2826' };
const QUESTIONS = [
  { key: 'hymenophore', label: 'Cosa c\'è sotto il cappello?', short: 'Sotto il cappello', values: ['lamelle', 'pori', 'aculei', 'pliche', 'liscio'], icon: (v) => HYM_ICON[v], hint: 'Gira il fungo e guarda la parte sotto il cappello.' },
  { key: 'stem_volva', label: 'Alla base del gambo c\'è una volva?', short: 'Volva', bool: true, art: (v) => ART[`volva_${v}`], labels: { true: 'sì, un sacco o un bulbo con orlo', false: 'no, base semplice' }, hint: 'Per vederla bisogna estrarre il fungo intero, senza tagliarlo.' },
  { key: 'stem_ring', label: 'C\'è un anello sul gambo?', short: 'Anello', bool: true, art: (v) => ART[`ring_${v}`], labels: { true: 'sì, una gonnellina', false: 'no' } },
  { key: 'cap_color', label: 'Di che colore è il cappello?', short: 'Cappello', values: Object.keys(COLORS), color: true },
  { key: 'hymenophore_color', label: 'Di che colore sono lamelle o pori?', short: 'Lamelle/pori', values: Object.keys(COLORS), color: true },
  { key: 'flesh_change', label: 'Tagliata, la carne cambia colore?', short: 'Carne al taglio', values: ['nessuno', 'blu', 'rosso', 'giallo', 'bruno', 'nero'], labels: { nessuno: 'non cambia' }, flesh: true, hint: 'Taglia il gambo e aspetta un minuto.' },
  { key: 'habitat', label: 'Dove cresce?', short: 'Dove', values: ['latifoglie', 'conifere', 'prati/radure', 'ceppaie/legno'], art: (v) => ART[v], labels: { latifoglie: 'sotto latifoglie', conifere: 'sotto conifere', 'prati/radure': 'prati e radure', 'ceppaie/legno': 'su ceppaie o legno' } },
  { key: 'growth', label: 'Come cresce?', short: 'Crescita', values: ['singolo', 'gregario', 'cespitoso'], art: (v) => ART[v], labels: { singolo: 'da solo', gregario: 'a gruppi sparsi', cespitoso: 'a cespi, uniti alla base' } },
  { key: 'stem_reticulum', label: 'Il gambo ha un reticolo in rilievo?', short: 'Reticolo', bool: true, art: (v) => ART[`ret_${v}`], labels: { true: 'sì, una rete', false: 'no, liscio' } },
];
const TOX_ORDER = { mortale: 0, tossico: 1, 'non commestibile': 2, 'commestibile con cautela': 3, commestibile: 4 };

let BANNER = '', TAXA = [], RULES = [], MEDIA = {}, ASSET = (f) => f, THUMB = () => '', POTENTIAL = () => null, ZONES = [];
const state = { q: '', ans: {}, zone: '', guided: true };

export function initIdentify({ traits, media, assetUrl, thumb, potential, zones, banner }) {
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

function matches(t) {
  let ok = 0, tot = 0, contra = [];
  for (const [k, v] of Object.entries(state.ans)) {
    if (v == null) continue;
    const tv = t.traits?.[k];
    if (tv == null) continue;          // carattere ignoto per il taxon: non penalizza
    tot++;
    const hit = Array.isArray(tv) ? tv.includes(v) : tv === v;
    if (hit) ok++; else contra.push(k);
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
    const vals = q.bool ? [true, false] : q.values;
    const counts = vals.map((v) => list.filter((c) => { const tv = c.t.traits?.[q.key]; return Array.isArray(tv) ? tv.includes(v) : tv === v; }).length);
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < 2) continue;
    const h = -counts.filter(Boolean).reduce((s, c) => s + (c / n) * Math.log2(c / n), 0);
    if (!best || h > best.h) best = { q, h };
  }
  return best?.q || null;
}

const optLabel = (q, v) => (q.bool ? (q.labels?.[String(v)] || (v ? 'sì' : 'no')) : (q.labels?.[v] || v));
const valLabel = (q, v) => (q.bool ? `${q.short}: ${v ? 'sì' : 'no'}` : `${q.short}: ${q.labels?.[v] || v}`);

// tessere illustrate di una domanda
function options(q, { big = false } = {}) {
  const vals = q.bool ? [true, false] : q.values;
  const cur = state.ans[q.key];
  const tiles = vals.map((v) => {
    let art = '';
    if (q.art) art = q.art(v);
    else if (q.icon) art = `<span class="id-hym">${q.icon(v)}</span>`;
    else if (q.color) art = `<span class="id-sw" style="background:${COLORS[v]}"></span>`;
    else if (q.flesh) art = `<span class="id-flesh"><span style="background:${FLESH[v]}"></span></span>`;
    return `<button type="button" class="id-opt${q.color || q.flesh ? ' id-opt-sw' : ''}" data-k="${q.key}" data-v="${esc(String(v))}" aria-pressed="${cur === v}">
      <span class="id-art" aria-hidden="true">${art}</span><span class="id-opt-l">${esc(optLabel(q, v))}</span></button>`;
  }).join('');
  const dk = big ? `<button type="button" class="id-opt id-opt-dk" data-skip="${q.key}"><span class="id-art" aria-hidden="true">${ART.dontknow}</span><span class="id-opt-l">non lo so</span></button>` : '';
  return `<div class="id-grid${q.color || q.flesh ? ' id-grid-sw' : ''}">${tiles}${dk}</div>`;
}

function resultCard(c) {
  const t = c.t, ph = photoOf(t);
  const tox = esc(t.toxicity || '');
  const href = t.edible_id ? `#/specie/${t.edible_id}` : '';
  return `<li class="id-card tox-${tox.replace(/\s/g, '-')}">
    <button type="button" class="id-card-img" data-photo="${esc(t.key)}" ${ph ? '' : 'disabled'} aria-label="${esc(t.name || t.latin)}: ingrandisci la foto">
      ${ph ? `<img src="${ASSET(ph.file)}" alt="" loading="lazy">` : ''}<span class="tox">${tox}</span>
      ${c.tot ? `<span class="id-fit${c.contra.length ? ' warn' : ''}">${c.ok}/${c.tot}</span>` : ''}</button>
    <div class="id-card-body">
      <b>${esc(t.name || t.latin)}</b><i>${esc(t.latin)}</i>
      ${c.contra.length ? '<span class="small id-contra">un carattere non torna: verifica bene</span>' : ''}
      ${t.check_before_picking?.length ? `<details><summary>Cosa controllare</summary><ul class="reasons small">${t.check_before_picking.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
      ${href ? `<a class="small id-more" href="${href}">Scheda completa ›</a>` : ''}
    </div></li>`;
}

export function renderIdentify(box) {
  if (!TAXA.length) { box.innerHTML = '<p class="notice">I caratteri delle specie sono in preparazione: la ricerca sarà disponibile a breve.</p>'; return; }
  const list = candidates();
  const nq = state.guided ? nextQuestion(list) : null;
  const deadly = list.filter((c) => c.t.toxicity === 'mortale');
  const given = QUESTIONS.filter((q) => state.ans[q.key] != null);
  const x = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  box.innerHTML = `
    <details class="id-warn"><summary><b>Non è un'identificazione.</b> Restringe i candidati, velenosi compresi.</summary><p>${BANNER ? esc(BANNER) : "Prima di mangiare qualunque fungo: controllo gratuito all'Ispettorato Micologico ASL."} <a href="#/info">Emergenza</a></p></details>
    <div class="seg-tabs" role="tablist" aria-label="Modo">
      <button type="button" role="tab" data-mode="guided" aria-selected="${state.guided}">Guidata</button>
      <button type="button" role="tab" data-mode="all" aria-selected="${!state.guided}">Tutti i caratteri</button>
    </div>
    ${ZONES.length ? `<div class="filter-rail id-zones" role="group" aria-label="Dove l'hai trovato"><span class="af-label">Zona</span><button type="button" class="chip" data-zone="" aria-pressed="${!state.zone}">Ovunque</button>${ZONES.map((z) => `<button type="button" class="chip" data-zone="${z.id}" aria-pressed="${state.zone === z.id}">${esc(z.title || z.name)}</button>`).join('')}</div>` : ''}
    ${given.length ? `<div class="id-given">${given.map((q) => `<button type="button" class="af-pill" data-clear="${q.key}" aria-label="Togli ${esc(valLabel(q, state.ans[q.key]))}">${esc(valLabel(q, state.ans[q.key]))}${x}</button>`).join('')}<button type="button" class="af-add" id="id-reset">Ricomincia</button></div>` : ''}
    ${state.guided
      ? (nq ? `<section class="id-q id-q-big"><p class="eyebrow">Domanda ${given.length + 1}</p><h3>${esc(nq.label)}</h3>${nq.hint ? `<p class="small muted">${esc(nq.hint)}</p>` : ''}${options(nq, { big: true })}</section>`
        : '<section class="id-q id-q-big"><h3>Non ci sono altre domande utili</h3><p class="small muted">Confronta i candidati qui sotto e, nel dubbio, non raccogliere.</p></section>')
      : QUESTIONS.map((q) => `<section class="id-q"><h3>${esc(q.label)}</h3>${options(q)}</section>`).join('')}
    <label class="search-box id-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input id="id-q" type="search" placeholder="Oppure cerca: anello, blu, castagno…" value="${esc(state.q)}" autocomplete="off" aria-label="Cerca per nome o caratteristica"></label>
    <div class="id-head"><h2 class="sec-title">${list.length} ${list.length === 1 ? 'candidato' : 'candidati'}</h2></div>
    ${deadly.length ? `<p class="id-deadly"><b>${deadly.length} ${deadly.length === 1 ? 'specie mortale compatibile' : 'specie mortali compatibili'}</b> con quello che hai indicato. Non raccogliere e non assaggiare nulla di cui non sei certo.</p>` : ''}
    <ul class="id-cards">${list.slice(0, 40).map(resultCard).join('')}</ul>
    ${RULES.length ? `<details class="sec"><summary>Regole generali di sicurezza</summary><div class="sec-body"><ul class="reasons">${RULES.map((r) => `<li${r.severity === 'critico' ? ' class="crit"' : ''}>${esc(r.text)}</li>`).join('')}</ul></div></details>` : ''}`;

  const rerender = () => renderIdentify(box);
  box.querySelector('#id-q').addEventListener('input', (e) => { state.q = e.target.value; clearTimeout(box._t); box._t = setTimeout(() => { rerender(); const i = box.querySelector('#id-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
  box.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.guided = b.dataset.mode === 'guided'; rerender(); }));
  box.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => { state.zone = b.dataset.zone; rerender(); }));
  box.querySelector('#id-reset')?.addEventListener('click', () => { state.ans = {}; state.q = ''; rerender(); });
  box.querySelectorAll('.id-opt[data-k]').forEach((b) => b.addEventListener('click', () => {
    const q = QUESTIONS.find((y) => y.key === b.dataset.k);
    const v = q.bool ? b.dataset.v === 'true' : b.dataset.v;
    state.ans[q.key] = state.ans[q.key] === v ? undefined : v;
    if (state.ans[q.key] === undefined) delete state.ans[q.key];
    rerender();
  }));
  box.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => { delete state.ans[b.dataset.clear]; rerender(); }));
  box.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => { state.ans[b.dataset.skip] = null; rerender(); }));
  const items = list.slice(0, 40).map((c) => ({ c, ph: photoOf(c.t) })).filter((y) => y.ph);
  const lb = items.map(({ c, ph }) => ({ key: c.t.key, src: ASSET(ph.file_hd || ph.file), alt: c.t.name, caption: captionHtml({ title: `<span class="tox">${esc(c.t.toxicity)}</span> ${esc(c.t.name || '')} <i>${esc(c.t.latin)}</i>`, text: esc((c.t.check_before_picking || []).join(' · ')), credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((y) => y.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}
