// «Impara a riconoscere» per piante e alberi: una domanda alla volta, come per i funghi.
// Confronta i caratteri dichiarati dalle fonti (data/recognize-*.json): restringe i candidati, non identifica.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DATA = {}, STATE = {};
const load = (mode) => (DATA[mode] ||= fetch(`data/recognize-${mode === 'alberi' ? 'trees' : 'plants'}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));

// un carattere senza valore (null) non filtra; «doppiamente dentato» vale anche come «dentato»;
// i segni particolari contano solo se ci sono (la loro assenza nelle fonti non è una prova)
const POSITIVE_ONLY = new Set(['special']);
export function hit(data, key, have, answer) {
  if (have == null) return null;
  const list = [].concat(have);
  return list.includes(answer) || list.some((v) => (data.implies?.[v] || []).includes(answer));
}
export function matchItem(data, traits, ans) {
  let ok = 0; const contra = [];
  for (const [k, v] of Object.entries(ans)) {
    if (v == null) continue;
    const h = hit(data, k, traits?.[k], v);
    if (h === true) ok++;
    else if (h === false && !POSITIVE_ONLY.has(k)) contra.push(k);
  }
  return { ok, contra, tot: ok + contra.length };
}
// come per i funghi: una sola contraddizione è tollerata se almeno due caratteri tornano.
// Le specie pericolose ne tollerano due: una risposta sbagliata non deve nasconderle.
export const keep = (c) => (c.danger ? c.contra.length <= 2 : c.contra.length === 0 || (c.contra.length === 1 && c.ok >= 2));
export function candidatesFor(data, items, ans) {
  return items.map((it) => ({ ...it, ...matchItem(data, it.traits, ans) })).filter(keep)
    .sort((a, b) => (b.tot ? b.ok / b.tot : 1) - (a.tot ? a.ok / a.tot : 1) || b.ok - a.ok || a.name.localeCompare(b.name, 'it'));
}
const applies = (q, ans) => !q.applies_if || Object.entries(q.applies_if).every(([k, v]) => ans[k] === v);
// prossima domanda: la prima del percorso, poi quella che divide meglio i candidati rimasti (entropia)
export function nextQuestion(data, list, ans) {
  // le domande con moltissime opzioni (segni particolari) arrivano solo quando restano pochi candidati
  const open = Object.entries(data.schema).filter(([k, q]) => q.ask !== false && ans[k] === undefined && applies(q, ans) && !(q.ask_when_at_most && list.length > q.ask_when_at_most));
  if (data.start && ans[data.start] === undefined) return data.start;
  let best = null;
  for (const [k, q] of open) {
    const counts = q.values.map((v) => list.filter((c) => hit(data, k, c.traits?.[k], v.id)).length);
    const n = counts.reduce((a, b) => a + b, 0), groups = counts.filter(Boolean).length;
    if (n < 2 || groups < 2) continue;
    const h = -counts.filter(Boolean).reduce((s, c) => s + (c / n) * Math.log2(c / n), 0);
    // conta anche quanti candidati hanno il carattere: una domanda che pochi possono rispondere aiuta poco
    const score = h * (n / Math.max(1, list.length));
    if (!best || score > best.score) best = { k, score };
  }
  return best?.k || null;
}

const label = (q, v) => q.values.find((x) => x.id === v)?.label || v;
// termine botanico del valore (Margine: «Intero»); senza termine, la prima parte dell'etichetta
const termOf = (q, v) => q.values.find((x) => x.id === v)?.term || shortLabel(q, v);
const glossOf = (q, v) => q.values.find((x) => x.id === v)?.gloss || '';
// termine con il collegamento alla sua voce del glossario, che lo spiega
const termHtml = (q, v, lower = false) => {
  const t = lower ? termOf(q, v).replace(/^\p{Lu}(?!\p{Lu})/u, (c) => c.toLowerCase()) : termOf(q, v), g = glossOf(q, v);
  return g ? `<a class="glossary-link" data-term="${esc(g)}" href="#/glossario/${esc(g)}" aria-haspopup="dialog">${esc(t)}</a>` : esc(t);
};
// nelle risposte basta la prima parte dell'etichetta («tanti fiorellini su un piano, a ombrella…» → «tanti fiorellini su un piano»)
const shortLabel = (q, v) => label(q, v).split(/,\s|\s\(/)[0];
const X_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
const MORE_IC = '<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>';

export const loadKeyData = load;
// icone dei caratteri degli alberi: una per valore (data/tree-trait-icons.json); le piante non le hanno
let TREE_ICONS = null;
export const loadTreeIcons = () => (TREE_ICONS ||= fetch('data/tree-trait-icons.json').then((r) => (r.ok ? r.json() : null)).then((d) => d?.values || null).catch(() => null));
const iconSrc = (icons, k, v) => (icons?.[k]?.includes(v) ? `assets/tree-traits/${k}-${v}.webp` : '');
const ill = (src, size, cls = 'ts-ill') => `<img class="${cls}" src="${esc(src)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;
// tessere dei caratteri per le schede di piante e alberi: stessi caratteri del percorso guidato, con le loro etichette.
// I segni particolari stanno in una riga a parte; i valori non verificati (null) non compaiono.
// Con `icons` (alberi) ogni tessera mostra il disegno del valore sopra il testo: con due o più valori, i primi due
// affiancati in piccolo e il testo completo sotto. Un valore senza icona resta solo testo.
export function traitTilesHtml(data, traits, icons = null) {
  if (!data || !traits) return '';
  const tiles = Object.entries(data.schema).filter(([k, q]) => k !== 'special' && q.ask !== false && traits[k] != null && [].concat(traits[k]).length)
    .map(([k, q]) => {
      const vals = [].concat(traits[k]), srcs = vals.map((v) => iconSrc(icons, k, v)).filter(Boolean).slice(0, 2);
      const art = srcs.length ? `<span class="ts-art${srcs.length > 1 ? ' ts-art-2' : ''}" aria-hidden="true">${srcs.map((s) => ill(s, srcs.length > 1 ? 44 : 64)).join('')}</span>` : '';
      return `<li>${art}<span class="ts-k" data-no-glossary>${esc(q.short)}</span><span class="ts-v">${vals.map((v, i) => termHtml(q, v, i > 0)).join(' o ')}</span></li>`;
    });
  const special = data.schema.special && [].concat(traits.special || []).map((v) => label(data.schema.special, v));
  return tiles.length ? `<ul class="trait-strip ${icons ? 'trait-strip-ill' : 'trait-strip-txt'}" aria-label="Caratteri principali">${tiles.join('')}</ul>${special?.length ? `<p class="small"><b>Segni particolari:</b> ${esc(special.join(' · '))}</p>` : ''}` : '';
}

export async function renderGuidedKey(box, mode, { items, thumb, note = '' }) {
  box.dataset.glossaryContext = mode === 'alberi' ? 'Alberi' : 'Piante';
  if (!box.innerHTML.trim()) box.innerHTML = '<p class="small muted">Carico i caratteri…</p>';
  const [data, icons] = await Promise.all([load(mode), mode === 'alberi' ? loadTreeIcons() : null]);
  if (!data) { box.innerHTML = '<p class="notice">I caratteri per il percorso guidato non sono disponibili in questo momento. Puoi sfogliare il catalogo.</p>'; return; }
  const st = (STATE[mode] ||= { ans: {}, editing: '' });
  const pool = items.filter((it) => data.items[it.id]).map((it) => ({ ...it, traits: data.items[it.id].traits, confusables: data.items[it.id].confusables || [] }));
  const missing = items.length - pool.length;
  const list = candidatesFor(data, pool, st.ans);
  const nk = st.editing ? null : nextQuestion(data, list, st.ans);
  const answered = Object.keys(st.ans).filter((k) => data.schema[k]);
  // termine botanico in grassetto, sotto la spiegazione in parole semplici (se dice qualcosa in più)
  const optLabelHtml = (v) => v.term && v.term.toLowerCase() !== v.label.toLowerCase()
    ? `<span class="id-opt-l"><b class="gk-term">${esc(v.term)}</b><span class="gk-expl">${esc(v.label)}</span></span>` : `<span class="id-opt-l">${esc(v.label)}</span>`;
  const qCard = (k, n) => {
    const q = data.schema[k];
    return `<section class="id-q id-q-big gk-q">${n ? `<p class="eyebrow">Domanda ${n}</p>` : ''}<h3>${esc(q.question)}</h3><p class="small muted">${esc(q.short)}</p>
      ${(() => { const withArt = q.values.some((v) => iconSrc(icons, k, v.id)); return `<div class="id-grid id-grid-txt${withArt ? ' gk-grid-ill' : ''}">${q.values.map((v) => `<button type="button" class="id-opt" data-k="${esc(k)}" data-v="${esc(v.id)}" aria-pressed="${st.ans[k] === v.id}">${withArt ? `<span class="id-art" aria-hidden="true">${iconSrc(icons, k, v.id) ? ill(iconSrc(icons, k, v.id), 56) : ''}</span>` : ''}${optLabelHtml(v)}</button>`).join('')}`; })()}
      <button type="button" class="id-opt id-opt-dk" data-skip="${esc(k)}"><span class="id-opt-l">non lo vedo</span></button></div></section>`;
  };
  const row = (k) => {
    const q = data.schema[k], v = st.ans[k];
    if (st.editing === k) return `</ul>${qCard(k, 0)}<ul class="id-answers">`;
    return `<li class="id-row${v == null ? ' skipped' : ''}"><button type="button" class="id-row-main" data-edit="${esc(k)}" aria-label="${esc(q.short)}: ${esc(v == null ? 'non lo vedo' : label(q, v))}. Cambia">
      <span class="id-row-k">${esc(q.short)}</span><span class="id-row-v">${v != null && iconSrc(icons, k, v) ? ill(iconSrc(icons, k, v), 28, 'ts-ill gk-row-ill') : ''}${esc(v == null ? 'non lo vedo' : termOf(q, v))}</span><span class="id-row-edit" aria-hidden="true">${MORE_IC}</span></button>
      <button type="button" class="id-row-x" data-clear="${esc(k)}" aria-label="Togli la risposta">${X_IC}</button></li>`;
  };
  const head = answered.length ? `<div class="id-answers-head"><span>${answered.length === 1 ? 'La tua risposta' : `Le tue ${answered.length} risposte`}</span><button type="button" class="af-add" data-gk-reset>Ricomincia</button></div><ul class="id-answers">${answered.map(row).join('')}</ul>`.replaceAll('<ul class="id-answers"></ul>', '') : '';
  const next = st.editing ? '' : nk ? qCard(nk, answered.filter((k) => st.ans[k] != null).length + 1)
    : '<section class="id-q id-q-big"><h3>Non ci sono altre domande utili</h3><p class="small muted">Confronta i candidati qui sotto, carattere per carattere, con la scheda completa.</p></section>';
  const ids = new Set(list.map((c) => c.id));
  // differenze dichiarate tra candidati ancora in gioco: è la parte che insegna
  const pairs = (data.confusables || []).filter((c) => c.ids.length >= 2 && c.ids.every((id) => ids.has(id)));
  const say = (c) => {
    const why = c.contra.map((k) => `<b>Non torna: ${esc(data.schema[k].short.toLowerCase())}.</b> Di solito ${esc([].concat(c.traits[k]).map((v) => label(data.schema[k], v)).join(' o '))}.`).join(' ');
    const tell = list.length <= 6 ? c.confusables.filter((x) => ids.has(x.id)).map((x) => `<span class="gk-tell"><b>Rispetto a ${esc(x.name)}:</b> ${esc(x.how_to_tell)}</span>`).join('') : '';
    return why + tell;
  };
  box.innerHTML = `
    <details class="id-warn"><summary><b>Non è un'identificazione.</b></summary><p>Restringe i candidati in base ai caratteri descritti dalle fonti. Il catalogo è incompleto: confronta sempre più caratteri e la scheda completa.${mode === 'piante' ? ' Non assaggiare per riconoscere una pianta.' : ''}</p></details>
    ${head}${next}
    ${!answered.some((k) => st.ans[k] != null) ? `<p class="small muted gk-start">${pool.length} schede nel catalogo. Rispondi alla prima domanda: i candidati compaiono man mano che restringi.</p>` : `<div class="id-head"><h2 class="sec-title">${list.length} ${list.length === 1 ? 'candidato' : 'candidati'}</h2></div>
    ${pairs.length && list.length <= 12 ? pairs.map((p) => `<section class="notice gk-pair"><h3>${esc(p.title)}</h3><ul>${p.differences.map(([k, t]) => `<li><b>${esc(data.schema[k]?.short || k)}:</b> ${esc(t)}</li>`).join('')}</ul>${p.caution ? `<p class="small">${esc(p.caution)}</p>` : ''}</section>`).join('') : ''}
    <div class="field-results gk-results">${list.slice(0, 40).map((c) => `<article class="field-card${c.danger ? ' gk-danger' : ''}"><a class="field-card-head" data-entity href="${esc(c.href)}">${thumb(c.id, 52)}<span><b>${esc(c.name)}</b><i>${esc(c.latin)}</i></span>${c.danger ? '<span class="tag warn">pericolosa</span>' : ''}${c.tot ? `<span class="id-fit${c.contra.length ? ' warn' : ''}">${c.ok}/${c.tot}</span>` : ''}</a>${say(c) ? `<p class="small">${say(c)}</p>` : ''}</article>`).join('') || '<p class="notice">Nessuna scheda corrisponde a queste risposte. Il catalogo non comprende tutte le specie: prova a togliere una risposta.</p>'}</div>`}
    ${missing ? `<p class="small muted">${note || `${missing} schede del catalogo non hanno ancora i caratteri strutturati: le trovi in Sfoglia.`}</p>` : ''}
    <p class="small muted">${mode === 'alberi' ? 'Caratteri dalle schede dello European Atlas of Forest Tree Species (JRC, 2016), con incroci sulle flore italiane.' : 'Caratteri dalle schede di Acta Plantarum (basate su Pignatti) e di Info Flora (Flora Helvetica 2018).'} Ogni scheda riporta le fonti.</p>`;
  const again = () => renderGuidedKey(box, mode, { items, thumb, note });
  box.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    st.ans[b.dataset.k] = b.dataset.v; st.editing = '';
    // cambiato il tipo di foglia: le domande che ne dipendono vanno rifatte
    for (const [k, q] of Object.entries(data.schema)) if (st.ans[k] !== undefined && !applies(q, st.ans)) delete st.ans[k];
    again();
  }));
  box.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => { st.ans[b.dataset.skip] = null; st.editing = ''; again(); }));
  box.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { st.editing = st.editing === b.dataset.edit ? '' : b.dataset.edit; again(); }));
  box.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => { delete st.ans[b.dataset.clear]; st.editing = ''; again(); }));
  box.querySelector('[data-gk-reset]')?.addEventListener('click', () => { st.ans = {}; st.editing = ''; again(); });
}
