// Sfide didattiche di Impara: Osserva, Confronta e Di stagione, con timbri come ricompensa.
// «L'ho visto» è un'annotazione dell'utente: non riconosce e non certifica nulla.
// I progressi restano in questo browser (localStorage), senza posizione e fuori dai conteggi della community.

export const CHALLENGE_KEY = 'fungaroli:challenges:v1';
const KIND_LABEL = { osserva: 'Osserva', confronta: 'Confronta', stagione: 'Di stagione' };
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => { const t = String(s ?? '').trim(); return t ? t[0].toLocaleUpperCase('it') + t.slice(1) : ''; };

// ------------------------------------------------------------ funzioni pure

export const itemKey = (item) => `${item.kind}:${item.id}`;
export const emptyProgress = () => ({ version: 1, seen: {}, answers: {}, done: {} });

export function normalizeProgress(raw) {
  const p = emptyProgress();
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return p;
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
  for (const [cid, row] of Object.entries(obj(raw.seen))) {
    const keys = Object.entries(obj(row)).filter(([, v]) => v === true).map(([k]) => k);
    if (keys.length) p.seen[cid] = Object.fromEntries(keys.map((k) => [k, true]));
  }
  for (const [cid, row] of Object.entries(obj(raw.answers))) {
    const ans = Object.entries(obj(row)).filter(([k, v]) => /^\d+$/.test(k) && typeof v === 'string');
    if (ans.length) p.answers[cid] = Object.fromEntries(ans);
  }
  for (const [cid, date] of Object.entries(obj(raw.done))) if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) p.done[cid] = date;
  return p;
}

export function loadProgress(storage = globalThis.localStorage) {
  try { return normalizeProgress(JSON.parse(storage?.getItem(CHALLENGE_KEY) || 'null')); } catch { return emptyProgress(); }
}
export function saveProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(CHALLENGE_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}

// Le sfide di stagione si vedono solo nei mesi indicati (1-12).
export const isInSeason = (ch, month) => ch.kind !== 'stagione' || !ch.months?.length || ch.months.includes(month);

export function challengeProgress(ch, progress) {
  if (ch.kind === 'confronta') {
    const qs = ch.questions || [], ans = progress.answers?.[ch.id] || {};
    const answered = qs.filter((_, i) => typeof ans[i] === 'string').length;
    const correct = qs.filter((q, i) => ans[i] === q.answer).length;
    return { count: answered, total: qs.length, target: qs.length, correct, complete: qs.length > 0 && answered === qs.length };
  }
  const items = ch.items || [], seen = progress.seen?.[ch.id] || {};
  const count = items.filter((it) => seen[itemKey(it)]).length;
  const target = Math.min(items.length, ch.target || items.length);
  return { count, total: items.length, target, complete: items.length > 0 && count >= target };
}
export const isComplete = (ch, progress) => challengeProgress(ch, progress).complete;
// Il timbro resta anche se la sfida viene rifatta: «done» registra la prima volta che è stata completata.
export const hasStamp = (ch, progress) => Boolean(progress.done?.[ch.id]) || isComplete(ch, progress);

function markDone(next, ch, today) {
  if (isComplete(ch, next) && !next.done[ch.id]) next.done[ch.id] = today;
  return next;
}
export function toggleSeen(progress, ch, item, today) {
  const next = structuredClone(progress), key = itemKey(item);
  if (!(ch.items || []).some((it) => itemKey(it) === key)) return next;
  const row = { ...(next.seen[ch.id] || {}) };
  if (row[key]) delete row[key]; else row[key] = true;
  if (Object.keys(row).length) next.seen[ch.id] = row; else delete next.seen[ch.id];
  return markDone(next, ch, today);
}
// Una risposta per domanda: dopo la scelta non si cambia (si può rifare la sfida).
export function answerQuestion(progress, ch, index, choice, today) {
  const next = structuredClone(progress), q = ch.questions?.[index];
  if (!q || ![q.a, q.b].includes(choice) || typeof next.answers[ch.id]?.[index] === 'string') return next;
  next.answers[ch.id] = { ...(next.answers[ch.id] || {}), [index]: choice };
  return markDone(next, ch, today);
}
export function resetChallenge(progress, ch) {
  const next = structuredClone(progress);
  delete next.seen[ch.id]; delete next.answers[ch.id];
  return next;
}

// Sfida per il giro: solo Osserva o Di stagione, non completata, in stagione nel mese del giorno,
// con un bosco tra quelli più estesi della zona (categoria → ettari della Carta Forestale).
export function suggestChallenge(list, { forest = {}, month, progress = emptyProgress(), top = 3 } = {}) {
  const main = Object.entries(forest || {}).filter(([, ha]) => ha > 0).sort((a, b) => b[1] - a[1]).slice(0, top);
  const rank = new Map(main.map(([cat, ha]) => [cat, ha]));
  let best = null, bestHa = 0;
  for (const ch of list || []) {
    if (!['osserva', 'stagione'].includes(ch.kind) || !isInSeason(ch, month) || hasStamp(ch, progress)) continue;
    const ha = Math.max(0, ...(ch.forest_categories || []).map((c) => rank.get(c) || 0));
    // a parità di bosco vince la sfida di stagione, che dura meno
    if (ha > bestHa || (ha === bestHa && ha > 0 && ch.kind === 'stagione' && best?.kind !== 'stagione')) { best = ch; bestHa = ha; }
  }
  return bestHa > 0 ? best : null;
}

// Un valore di carattere: elenco (contiene il valore) o valore singolo (uguale).
export const traitHas = (v, value) => (Array.isArray(v) ? v.includes(value) : v === value);
const present = (v) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length);
// Verifica una domanda Confronta sui dati: traitsOf(kind,id) restituisce l'oggetto dei caratteri,
// checksOf(kind,id) il testo «da controllare» per le domande senza carattere strutturato.
export function validateQuestion(q, { traitsOf, checksOf } = {}) {
  if (!q || !q.a || !q.b || q.a === q.b) return 'coppia non valida';
  if (![q.a, q.b].includes(q.answer)) return 'risposta fuori dalla coppia';
  if (!q.ask || !q.explain) return 'domanda o spiegazione mancante';
  if (!/^https:\/\//.test(q.source?.url || '')) return 'fonte senza url https';
  if (q.trait) {
    const ta = traitsOf?.(q.kind, q.a), tb = traitsOf?.(q.kind, q.b);
    if (!ta || !tb) return 'caratteri non trovati';
    const va = ta[q.trait], vb = tb[q.trait];
    if (!present(va) || !present(vb)) return `carattere ${q.trait} assente in una delle due specie`;
    const ha = traitHas(va, q.value), hb = traitHas(vb, q.value);
    if (ha === hb) return `il valore ${q.value} non distingue le due specie`;
    if ((ha ? q.a : q.b) !== q.answer) return 'la risposta non è la specie con quel valore';
    return '';
  }
  if (!q.cite?.length) return 'senza carattere serve un testo citato';
  for (const c of q.cite) {
    if (![q.a, q.b].includes(c.id)) return 'citazione di una specie fuori dalla coppia';
    const text = [].concat(checksOf?.(q.kind, c.id) || []).join(' \n ');
    if (!c.text || !text.includes(c.text)) return `testo citato non trovato in ${c.id}`;
  }
  if (!q.cite.some((c) => c.id === q.answer)) return 'nessuna citazione per la risposta';
  return '';
}

// ------------------------------------------------------------ timbri

let stampN = 0;
const ICON = {
  // foglia
  osserva: '<path d="M50 34c-11 4-16 13-14 25 12 1 20-6 22-18l1-9z" fill="currentColor" fill-opacity=".18"/><path d="M59 32c-14 2-23 10-23 27M37 58c6-8 12-14 21-20"/>',
  // lente
  confronta: '<circle cx="46" cy="46" r="10" fill="currentColor" fill-opacity=".12"/><path d="M53.5 53.5 63 63"/><path d="M41 43a6 6 0 0 1 5-4"/>',
  // sole
  sole: '<circle cx="50" cy="50" r="7" fill="currentColor" fill-opacity=".18"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return `<path d="M${(50 + 11 * c).toFixed(1)} ${(50 + 11 * s).toFixed(1)}L${(50 + 16 * c).toFixed(1)} ${(50 + 16 * s).toFixed(1)}"/>`; }).join(''),
  // fiocco
  fiocco: [0, 60, 120].map((a) => `<path d="M50 35v30M45 39l5 4 5-4M45 61l5-4 5 4" transform="rotate(${a} 50 50)"/>`).join(''),
};
const WINTER = [12, 1, 2];
const iconFor = (ch) => (ch.kind === 'stagione' ? (ch.months?.length && ch.months.every((m) => WINTER.includes(m)) ? ICON.fiocco : ICON.sole) : ICON[ch.kind] || ICON.osserva);
const IMG_RE = /^assets\/[a-zA-Z0-9_/-]+\.(?:svg|webp|png|jpe?g)$/;

// Cerchio a doppio bordo come un timbro postale, titolo breve sul bordo, icona al centro.
// Il colore viene da currentColor (impostato dal CSS con i token del tema).
export function stampSvg(ch, { earned = false, size = 96, assetUrl = (f) => f } = {}) {
  if (earned && ch.stamp && IMG_RE.test(ch.stamp)) return `<img class="ch-stamp-img" src="${esc(assetUrl(ch.stamp))}" width="${size}" height="${size}" alt="">`;
  const id = `ch-arc-${++stampN}`, label = String(ch.stampLabel || ch.title).toLocaleUpperCase('it').slice(0, 22);
  const kind = KIND_LABEL[ch.kind]?.toLocaleUpperCase('it') || '';
  return `<svg class="ch-stamp${earned ? ' is-earned' : ''}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <defs><path id="${id}" d="M18 50a32 32 0 1 1 64 0"/><path id="${id}b" d="M20 50a30 30 0 0 0 60 0"/></defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.4"${earned ? '' : ' stroke-dasharray="4 3"'}/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" stroke-width="1"/>
    <circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity=".55"/>
    <text font-size="8.4" font-weight="700" letter-spacing="1.1" fill="currentColor" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${esc(label)}</textPath></text>
    <text font-size="6.4" font-weight="600" letter-spacing="1.4" fill="currentColor" fill-opacity=".8" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${esc(kind)}</textPath></text>
    <circle cx="16.5" cy="50" r="1.4" fill="currentColor"/><circle cx="83.5" cy="50" r="1.4" fill="currentColor"/>
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconFor(ch)}</g>
  </svg>`;
}

// ------------------------------------------------------------ rendering

let LIST = [], ENTITY = () => null, ASSET = (f) => f, progress = null, NOW = () => new Date();
const LR61 = 'https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=7250&sv=vigente';
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const prog = () => (progress ||= loadProgress());
const commit = (next) => { progress = next; saveProgress(next); };

// entity(kind,id) → {name, latin, href, thumb(size), photo, protected}
export function initChallenges({ data, entity, assetUrl, now } = {}) {
  LIST = Array.isArray(data?.challenges) ? data.challenges : [];
  if (entity) ENTITY = entity;
  if (assetUrl) ASSET = assetUrl;
  if (now) NOW = now;
  progress = null;
}
export const challengeList = () => LIST;
export const challengeTitle = (id) => LIST.find((c) => c.id === id)?.title || '';
export const challengeProgressOf = (id) => { const c = LIST.find((x) => x.id === id); return c ? challengeProgress(c, prog()) : null; };
export function suggestedChallenge({ forest, month }) { return suggestChallenge(LIST, { forest, month, progress: prog() }); }

const monthsText = (ms) => (ms?.length ? (ms.length > 2 ? `da ${MONTHS[ms[0] - 1]} a ${MONTHS[ms[ms.length - 1] - 1]}` : ms.map((m) => MONTHS[m - 1]).join(' e ')) : '');
const fmtDone = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
function bar(p) {
  const pct = p.target ? Math.round((Math.min(p.count, p.target) / p.target) * 100) : 0;
  const label = p.target < p.total ? `${p.count} di ${p.target} (su ${p.total} voci)` : `${p.count} di ${p.total}`;
  return `<span class="ch-bar" role="img" aria-label="Avanzamento: ${esc(label)}"><i style="width:${pct}%"></i></span><small class="ch-count">${esc(label)}</small>`;
}

export function renderChallengeList(box) {
  delete box.dataset.glossaryContext;
  const p = prog(), month = NOW().getMonth() + 1;
  const earned = LIST.filter((c) => hasStamp(c, p));
  const stamps = earned.length
    ? `<ul class="ch-stamps-grid">${earned.map((c) => `<li><a href="#/sfide/${encodeURIComponent(c.id)}" class="ch-stamp-link" aria-label="${esc(c.title)}: timbro ottenuto">${stampSvg(c, { earned: true, size: 84, assetUrl: ASSET })}<small>${esc(c.stampLabel || c.title)}</small></a></li>`).join('')}</ul>`
    : '<p class="ch-stamps-empty">Completa una sfida per ricevere il primo timbro.</p>';
  const groups = [
    ['osserva', 'Sul campo', 'Spunta le specie che hai osservato lungo il giro.'],
    ['confronta', 'Confronta', 'Due specie simili, una domanda: quale ha quel carattere?'],
    ['stagione', 'Di stagione', 'Sfide che si aprono solo in alcuni mesi.'],
  ];
  const card = (c) => {
    const pr = challengeProgress(c, p), won = hasStamp(c, p);
    return `<li><a class="ch-card" href="#/sfide/${encodeURIComponent(c.id)}" data-challenge="${esc(c.id)}">
      <span class="ch-card-stamp">${stampSvg(c, { earned: won, size: 64, assetUrl: ASSET })}</span>
      <span class="ch-card-body"><small>${esc(KIND_LABEL[c.kind])}${c.months?.length ? ` · ${esc(monthsText(c.months))}` : ''}${won ? ' · <b class="ch-won">Timbro ottenuto</b>' : ''}</small><b>${esc(c.title)}</b><span class="ch-short">${esc(c.short)}</span>${bar(pr)}</span>
      <span class="ch-go" aria-hidden="true">›</span></a></li>`;
  };
  const later = LIST.filter((c) => c.kind === 'stagione' && !isInSeason(c, month) && !hasStamp(c, p));
  box.innerHTML = `<section class="ch-stamps" aria-labelledby="ch-stamps-h"><h2 id="ch-stamps-h">I tuoi timbri</h2>${stamps}</section>
    <p class="ch-note">«L'ho visto» è una tua annotazione: non conferma il riconoscimento. I progressi restano su questo dispositivo e non entrano nei conteggi della community.</p>
    ${groups.map(([kind, title, sub]) => {
      const rows = LIST.filter((c) => c.kind === kind && (isInSeason(c, month) || hasStamp(c, p)));
      const soon = kind === 'stagione' && later.length ? `<p class="ch-later">Più avanti: ${later.map((c) => `${esc(c.title)} (${esc(monthsText(c.months))})`).join(' · ')}.</p>` : '';
      return rows.length || soon ? `<section class="ch-group" aria-label="${esc(title)}"><h2 class="ch-group-title">${esc(title)}</h2><p class="ch-group-sub">${esc(sub)}</p>${rows.length ? `<ul class="ch-list">${rows.map(card).join('')}</ul>` : ''}${soon}</section>` : '';
    }).join('')}`;
}

function itemRow(c, it, seen, open) {
  const e = ENTITY(it.kind, it.id) || { name: it.id, href: '' }, key = itemKey(it), on = Boolean(seen[key]);
  const name = esc(e.name), thumb = e.thumb ? e.thumb(52) : '';
  return `<li class="ch-item${on ? ' is-seen' : ''}">
    ${e.href ? `<a class="ch-item-main" href="${esc(e.href)}" data-entity>${thumb}<span><small>${it.kind === 'albero' ? 'Albero' : 'Pianta'}</small><b>${name}</b>${it.hint ? `<span class="ch-hint">${esc(cap(it.hint))}</span>` : ''}</span></a>` : `<span class="ch-item-main"><span><b>${name}</b></span></span>`}
    <span class="ch-item-actions">
      <button type="button" class="ch-seen" data-ch-seen="${esc(key)}" aria-pressed="${on}"${open ? '' : ' disabled'}><span class="ch-check" aria-hidden="true"></span>L'ho visto<span class="ch-sr">: ${name}</span></button>
      <button type="button" class="ch-note-btn" data-note-kind="${it.kind === 'albero' ? 'albero' : 'pianta'}" data-note-id="${esc(it.id)}" data-note-title="${name}">＋ Nota<span class="ch-sr"> nel taccuino: ${name}</span></button>
    </span></li>`;
}

function optionHtml(q, i, id, ans) {
  const e = ENTITY(q.kind, id) || { name: id }, chosen = ans === id, answered = typeof ans === 'string';
  const state = answered ? (id === q.answer ? ' is-right' : chosen ? ' is-wrong' : '') : '';
  return `<button type="button" class="id-opt ch-opt${state}" data-ch-answer="${i}" data-choice="${esc(id)}" aria-pressed="${chosen}"${answered ? ' disabled' : ''}>
    <span class="ch-opt-img">${e.photo ? `<img data-src="${esc(e.photo)}" alt="" loading="lazy" decoding="async">` : `<span class="catalog-placeholder" aria-hidden="true">${esc(String(e.name).slice(0, 2))}</span>`}</span>
    <span class="id-opt-l">${esc(e.name)}</span>${e.latin ? `<i class="ch-opt-latin">${esc(e.latin)}</i>` : ''}</button>`;
}

function questionHtml(c, q, i, ans) {
  const answered = typeof ans === 'string', right = ans === q.answer, a = ENTITY(q.kind, q.a) || {}, b = ENTITY(q.kind, q.b) || {};
  const result = answered ? `<div class="ch-result ${right ? 'is-right' : 'is-wrong'}" data-ch-result="${i}" tabindex="-1">
      <p><b>${right ? 'Giusto.' : `Non è questa: è ${esc((ENTITY(q.kind, q.answer) || {}).name || q.answer)}.`}</b> ${esc(q.explain)}</p>
      <p class="ch-source">Fonte: <a href="${esc(q.source.url)}" target="_blank" rel="noopener">${esc(q.source.title)}</a> · Schede: ${[a, b].filter((x) => x.href).map((x) => `<a href="${esc(x.href)}" data-entity>${esc(x.name)}</a>`).join(', ')}</p></div>` : '';
  return `<fieldset class="ch-q" data-ch-q="${i}"><legend><span class="ch-q-n">Domanda ${i + 1} di ${c.questions.length}</span>${esc(q.ask)}</legend>
    <div class="ch-opts">${optionHtml(q, i, q.a, ans)}${optionHtml(q, i, q.b, ans)}</div>${result}</fieldset>`;
}

export function renderChallenge(box, id, { focus = '' } = {}) {
  const c = LIST.find((x) => x.id === id);
  if (!c) { box.innerHTML = '<p class="notice">Sfida non trovata. <a href="#/sfide">Tutte le sfide</a></p>'; return; }
  const p = prog(), pr = challengeProgress(c, p), month = NOW().getMonth() + 1, open = isInSeason(c, month), won = hasStamp(c, p);
  const firstKind = c.questions?.[0]?.kind || c.items?.[0]?.kind;
  box.dataset.glossaryContext = { fungo: 'Funghi', pianta: 'Piante', albero: 'Alberi' }[firstKind] || 'Bosco';
  const flowers = (c.items || []).some((it) => it.kind === 'pianta' && ENTITY('pianta', it.id)?.protected);
  const notice = c.kind === 'confronta'
    ? '<p class="ch-note">Le domande allenano lo sguardo su un carattere alla volta. Nessun carattere da solo basta a riconoscere una specie.</p>'
    : `<p class="ch-note">Spunta quello che hai osservato tu: è un appunto personale, non una conferma. ${flowers ? `Fiori da osservare e fotografare, non da cogliere (<a href="${LR61}" target="_blank" rel="noopener">L.R. 61/1974</a>).` : 'Osserva senza raccogliere.'}</p>`;
  const season = !open ? `<p class="notice">Questa sfida si apre ${esc(monthsText(c.months))}. Puoi già leggere le schede.</p>` : '';
  const done = pr.complete || won ? `<div class="ch-done" role="status">${stampSvg(c, { earned: true, size: 112, assetUrl: ASSET })}<div><p class="ch-done-t">${pr.complete ? 'Sfida completata' : 'Timbro ottenuto'}</p>${c.kind === 'confronta' && pr.complete ? `<p>Risposte giuste: ${pr.correct} su ${pr.total}.</p>` : ''}${p.done[c.id] ? `<p class="small muted">Timbro del ${esc(fmtDone(p.done[c.id]))}.</p>` : ''}${pr.count ? '<button type="button" class="btn ghost small" data-ch-reset>Rifai la sfida</button>' : ''}</div></div>` : '';
  const body = c.kind === 'confronta'
    ? `<div class="ch-questions">${(c.questions || []).map((q, i) => questionHtml(c, q, i, p.answers[c.id]?.[i])).join('')}</div>`
    : `<ul class="ch-items">${(c.items || []).map((it) => itemRow(c, it, p.seen[c.id] || {}, open)).join('')}</ul>`;
  box.innerHTML = `<article class="ch-page" data-challenge-page="${esc(c.id)}">
    <p class="ch-kicker">${esc(KIND_LABEL[c.kind])}${c.months?.length ? ` · ${esc(monthsText(c.months))}` : ''}</p>
    <h2 class="ch-title">${esc(c.title)}</h2><p class="ch-intro">${esc(c.intro)}</p>
    <div class="ch-progress">${bar(pr)}${c.kind === 'confronta' && pr.count ? `<small class="ch-count">Giuste: ${pr.correct}</small>` : ''}</div>
    ${season}${done}${notice}${body}
    <p class="ch-back"><a href="#/sfide">← Tutte le sfide</a></p></article>`;
  const today = isoDay(NOW());
  box.querySelectorAll('[data-ch-seen]').forEach((b) => b.addEventListener('click', () => {
    const it = c.items.find((x) => itemKey(x) === b.dataset.chSeen); if (!it) return;
    commit(toggleSeen(prog(), c, it, today)); renderChallenge(box, id, { focus: `[data-ch-seen="${CSS.escape(b.dataset.chSeen)}"]` });
  }));
  box.querySelectorAll('[data-ch-answer]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.chAnswer);
    commit(answerQuestion(prog(), c, i, b.dataset.choice, today)); renderChallenge(box, id, { focus: `[data-ch-result="${i}"]` });
  }));
  box.querySelector('[data-ch-reset]')?.addEventListener('click', () => { commit(resetChallenge(prog(), c)); renderChallenge(box, id, { focus: '.ch-title' }); });
  if (focus) { const el = box.querySelector(focus); if (el) { if (el.matches('.ch-title')) el.tabIndex = -1; el.focus({ preventScroll: !el.matches('[data-ch-result]') }); } }
}
