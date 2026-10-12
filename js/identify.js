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
const QUESTIONS = [
  { key: 'hymenophore', label: 'Sotto il cappello', values: ['lamelle', 'pori', 'aculei', 'pliche', 'liscio'], icon: (v) => HYM_ICON[v] },
  { key: 'stem_volva', label: 'Alla base del gambo c\'è una volva (sacco o bulbo con orlo)?', short: 'Volva', bool: true },
  { key: 'stem_ring', label: 'C\'è un anello sul gambo?', short: 'Anello', bool: true },
  { key: 'cap_color', label: 'Colore del cappello', values: Object.keys(COLORS), color: true },
  { key: 'hymenophore_color', label: 'Colore di lamelle / pori', values: Object.keys(COLORS), color: true },
  { key: 'flesh_change', label: 'Tagliata, la carne cambia colore?', short: 'Carne al taglio', values: ['nessuno', 'blu', 'rosso', 'giallo', 'bruno', 'nero'], labels: { nessuno: 'non cambia' } },
  { key: 'habitat', label: 'Dove cresce?', short: 'Dove', values: ['latifoglie', 'conifere', 'prati/radure', 'ceppaie/legno'] },
  { key: 'growth', label: 'Come cresce?', short: 'Crescita', values: ['singolo', 'gregario', 'cespitoso'], labels: { cespitoso: 'a cespi (molti uniti alla base)' } },
  { key: 'stem_reticulum', label: 'Il gambo ha un reticolo in rilievo?', short: 'Reticolo', bool: true },
];
const TOX_ORDER = { mortale: 0, tossico: 1, 'non commestibile': 2, 'commestibile con cautela': 3, commestibile: 4 };

let BANNER = '', TAXA = [], RULES = [], MEDIA = {}, ASSET = (f) => f, THUMB = () => '', POTENTIAL = () => null, ZONES = [];
const state = { q: '', ans: {}, zone: '', guided: false };

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

function chips(q) {
  const vals = q.bool ? [true, false] : q.values;
  const cur = state.ans[q.key];
  return `<div class="id-chips">${vals.map((v) => {
    const label = q.bool ? (v ? 'sì' : 'no') : (q.labels?.[v] || v);
    const sw = q.color ? `<span class="sw-c" style="background:${COLORS[v]}"></span>` : '';
    const ic = q.icon ? `<span class="id-ic">${q.icon(v)}</span>` : '';
    return `<button type="button" class="chip id-chip" data-k="${q.key}" data-v="${esc(String(v))}" aria-pressed="${cur === v}">${ic}${sw}${esc(label)}</button>`;
  }).join('')}${cur !== undefined ? `<button type="button" class="link-btn small" data-clear="${q.key}">azzera</button>` : ''}</div>`;
}

function resultCard(c) {
  const t = c.t, ph = photoOf(t);
  const pct = c.tot ? Math.round(c.fit * 100) : null;
  const tox = esc(t.toxicity || '');
  const href = t.edible_id ? `#/specie/${t.edible_id}` : '';
  return `<li class="id-res tox-${tox.replace(/\s/g, '-')}">
    <button type="button" class="id-photo" data-photo="${esc(t.key)}" ${ph ? '' : 'disabled'} aria-label="Ingrandisci la foto">${ph ? `<img src="${ASSET(ph.file)}" alt="" loading="lazy">` : ''}</button>
    <div class="id-body">
      <div class="id-name"><span class="tox">${tox}</span> <b>${esc(t.name || '')}</b> <i>${esc(t.latin)}</i></div>
      ${pct != null ? `<div class="small muted">compatibile con ${c.ok} su ${c.tot} caratteri${c.contra.length ? ' (uno non torna: verifica bene)' : ''}</div>` : ''}
      ${t.check_before_picking?.length ? `<details><summary class="small">Cosa controllare</summary><ul class="reasons small">${t.check_before_picking.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
      ${href ? `<a class="small" href="${href}">Scheda completa ›</a>` : ''}
    </div></li>`;
}

export function renderIdentify(box) {
  if (!TAXA.length) { box.innerHTML = '<p class="notice">I caratteri delle specie sono in preparazione: la ricerca sarà disponibile a breve.</p>'; return; }
  const list = candidates();
  const answered = Object.keys(state.ans).length;
  const nq = state.guided ? nextQuestion(list) : null;
  const deadly = list.filter((c) => c.t.toxicity === 'mortale');
  box.innerHTML = `
    <div class="notice id-warn">${BANNER ? esc(BANNER) : "<b>Non è un'identificazione.</b> Restringe i candidati, velenosi compresi. Prima di mangiare qualunque fungo: controllo gratuito all'Ispettorato Micologico ASL."} <a href="#/info">Emergenza</a></div>
    <div class="id-search"><input id="id-q" type="search" class="wiz-input" placeholder="Cerca per nome o caratteristica (es. anello, blu, castagno)" value="${esc(state.q)}" autocomplete="off"></div>
    <div class="id-mode"><button type="button" class="chip" id="id-guided" aria-pressed="${state.guided}">Guidami, una domanda alla volta</button>
      ${ZONES.length ? `<label class="small id-zone">Zona <select id="id-zone"><option value="">tutte</option>${ZONES.map((z) => `<option value="${z.id}" ${state.zone === z.id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></label>` : ''}
      ${answered ? '<button type="button" class="link-btn small" id="id-reset">Ricomincia</button>' : ''}</div>
    ${state.guided
      ? (nq ? `<div class="id-q"><h3>${esc(nq.label)}</h3>${chips(nq)}<button type="button" class="link-btn small" data-skip="${nq.key}">Non lo so</button></div>` : '<p class="small muted">Non ci sono altre domande utili: guarda i candidati qui sotto.</p>')
      : QUESTIONS.map((q) => `<div class="id-q"><h3>${esc(q.short || q.label)}</h3>${chips(q)}</div>`).join('')}
    <h2 class="sec-title">${list.length} candidati${deadly.length ? ` · <span class="tox-inline">${deadly.length} mortali compatibili</span>` : ''}</h2>
    <ul class="id-list">${list.slice(0, 40).map(resultCard).join('')}</ul>
    ${RULES.length ? `<details class="sec"><summary>Regole generali di sicurezza</summary><div class="sec-body"><ul class="reasons">${RULES.map((r) => `<li${r.severity === 'critico' ? ' class="crit"' : ''}>${esc(r.text)}</li>`).join('')}</ul></div></details>` : ''}`;

  const rerender = () => renderIdentify(box);
  box.querySelector('#id-q').addEventListener('input', (e) => { state.q = e.target.value; clearTimeout(box._t); box._t = setTimeout(() => { rerender(); const i = box.querySelector('#id-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
  box.querySelector('#id-guided').addEventListener('click', () => { state.guided = !state.guided; rerender(); });
  box.querySelector('#id-zone')?.addEventListener('change', (e) => { state.zone = e.target.value; rerender(); });
  box.querySelector('#id-reset')?.addEventListener('click', () => { state.ans = {}; state.q = ''; rerender(); });
  box.querySelectorAll('.id-chip').forEach((b) => b.addEventListener('click', () => {
    const q = QUESTIONS.find((x) => x.key === b.dataset.k);
    const v = q.bool ? b.dataset.v === 'true' : b.dataset.v;
    state.ans[q.key] = state.ans[q.key] === v ? undefined : v;
    if (state.ans[q.key] === undefined) delete state.ans[q.key];
    rerender();
  }));
  box.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => { delete state.ans[b.dataset.clear]; rerender(); }));
  box.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => { state.ans[b.dataset.skip] = null; rerender(); }));
  const items = list.slice(0, 40).map((c) => ({ c, ph: photoOf(c.t) })).filter((x) => x.ph);
  const lb = items.map(({ c, ph }) => ({ key: c.t.key, src: ASSET(ph.file_hd || ph.file), alt: c.t.name, caption: captionHtml({ title: `<span class="tox">${esc(c.t.toxicity)}</span> ${esc(c.t.name || '')} <i>${esc(c.t.latin)}</i>`, text: esc((c.t.check_before_picking || []).join(' · ')), credit: `Foto: ${esc(ph.author)}, ${esc(ph.license)}` }) }));
  box.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => { const i = lb.findIndex((x) => x.key === b.dataset.photo); if (i >= 0) openLightbox(lb, i); }));
}
