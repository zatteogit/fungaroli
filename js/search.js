import {matchSpecies} from './species-search.js';
// Cerca: un solo campo per tutto. Zone, funghi, velenosi e sosia, alberi, sentieri, pagine e regole.
// Le voci arrivano da app.js gia' pronte (titolo, sottotitolo, testo in cui cercare, link o azione, miniatura).

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ');

const KINDS = {
  pianta:'Piante e fiori', zona: 'Zone', fungo: 'Funghi', velenoso: 'Velenosi e sosia', albero: 'Alberi', sentiero: 'Sentieri', termine: 'Glossario', pagina: 'Pagine e regole',
};
const ORDER = Object.keys(KINDS);
const SUGGEST = ['Terminillo', 'Porcino', 'More', 'Ortica', 'Faggio', 'Emergenza', 'Fragolina', 'Castagno'];
const RECENT_KEY = 'fungaroli:search-recent';

// la sezione in cui sei decide cosa viene prima (la ricerca resta su tutto)
const PRIORITY = {
  piante:['pianta'],pianta:['pianta'],glossario: ['termine'],
  fungo: ['velenoso', 'fungo'], commestibile: ['fungo', 'velenoso'],
  specie: ['fungo', 'velenoso'], 'specie-dettaglio': ['fungo', 'velenoso'], riconosci: ['velenoso', 'fungo'],
  alberi: ['albero'], albero: ['albero'], uscite: ['zona', 'sentiero'], zona: ['sentiero', 'zona'], mappa: ['zona', 'sentiero'], diario: ['zona', 'fungo'], info: ['pagina'], impara: ['pagina', 'termine'], 'guide-list': ['pagina'], guide: ['pagina'], metodo: ['pagina'], sfide: ['pagina'],
};
const PLACEHOLDER = {
  piante:'Cerca piante, erbe e frutti…',pianta:'Cerca piante, erbe e frutti…',glossario: 'Cerca una parola del glossario…',
  specie: 'Cerca funghi, sosia, alberi, zone…', 'specie-dettaglio': 'Cerca funghi, sosia, alberi, zone…', riconosci: 'Cerca velenosi, sosia, funghi…',
  alberi: 'Cerca alberi, funghi, zone…', albero: 'Cerca alberi, funghi, zone…', mappa: 'Cerca zone, sentieri, funghi…',
};
const SCOPES = [['', 'Tutto'], ['zona', 'Zone'], ['fungo', 'Funghi'], ['velenoso', 'Velenosi'], ['pianta', 'Piante'], ['albero', 'Alberi'], ['sentiero', 'Sentieri'], ['termine', 'Glossario']];
let ITEMS = [], dlg = null, sel = -1, scope = '', prio = [];

export function initSearch(items) {
  ITEMS = items.map((it) => ({ ...it, _t: norm(it.title), _h: norm([it.title, it.sub, it.hay].join(' ')) }));
  const apple = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.platform || '');
  document.querySelectorAll('[data-open-search]').forEach((b) => {
    b.addEventListener('click', openSearch);
    b.title = `Cerca (${apple ? '⌘ K' : 'Ctrl+K'})`;
    b.setAttribute('aria-keyshortcuts', apple ? 'Meta+K' : 'Control+K');
    const hint = b.querySelector('kbd');
    if (hint) hint.textContent = apple ? '⌘ K' : 'Ctrl K';
  });
  // se cambi pagina (indietro del telefono, link), la ricerca si chiude
  addEventListener('hashchange', () => { if (dlg?.open) dlg.close(); });
  // Ctrl/Cmd+K funziona anche sul layout italiano; "/" resta un’alternativa.
  addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
    }
  });
}

// quante voci per tipo trova una ricerca, esclusi i tipi della pagina in cui sei («Anche in…»)
export function hitsByKind(q, exclude = []) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const n = {};
  for(const {it} of searchHits(q))if(!exclude.includes(it.kind))n[it.kind]=(n[it.kind]||0)+1;
  return ORDER.filter((k) => n[k]).map((k) => [k, KINDS[k], n[k]]);
}

function score(it, words) {
  let s = 0;
  for (const w of words) {
    if (!it._h.includes(w)) return 0;
    if (it._t.startsWith(w)) s += 6;
    else if (new RegExp(`(^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(it._t)) s += 4;
    else if (it._t.includes(w)) s += 2;
    else s += 1;
  }
  return s + (it.boost || 0);
}

const SPECIES_KINDS=new Set(['fungo','velenoso','pianta','albero']);
function searchHits(q, selectedScope='') {
  const words=norm(q).split(/\s+/).filter(Boolean);
  const pool=ITEMS.map((it,i)=>({it,i})).filter(({it})=>!selectedScope||it.kind===selectedScope);
  const species=matchSpecies(pool.filter(({it})=>SPECIES_KINDS.has(it.kind)),q,{
    names:({it})=>it.searchNames || [it.title,it.sub,it.hay].join(' '),
    features:({it})=>it.features || [],
  });
  return [
    ...pool.filter(({it})=>!SPECIES_KINDS.has(it.kind)).map(h=>({...h,s:score(h.it,words)})).filter(h=>h.s>0),
    ...species.items.map(h=>({...h,s:score(h.it,words)||1,byTraits:species.byTraits,reason:species.reasons.get(h)})),
  ];
}

function mark(text, words) {
  let out = esc(text);
  const n = norm(text);
  // evidenzia la prima occorrenza di ogni parola (sul testo originale, stessa lunghezza dopo la normalizzazione)
  const spans = [];
  for (const w of words) { const i = n.indexOf(w); if (i >= 0) spans.push([i, i + w.length]); }
  if (!spans.length || n.length !== text.length) return out;
  spans.sort((a, b) => a[0] - b[0]);
  let res = '', last = 0;
  for (const [a, b] of spans) { if (a < last) continue; res += esc(text.slice(last, a)) + `<mark>${esc(text.slice(a, b))}</mark>`; last = b; }
  return res + esc(text.slice(last));
}

const recent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
const remember = (q) => { try { const r = [q, ...recent().filter((x) => x !== q)].slice(0, 5); localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch { /* privato */ } };

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'search-dlg';
  dlg.setAttribute('aria-label', 'Cerca');
  dlg.innerHTML = `
    <div class="search-top">
      <label class="search-box search-main"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
        <input type="search" placeholder="Cerca zone, funghi, alberi, sentieri…" autocomplete="off" enterkeyhint="search" aria-label="Cerca in tutta l'app" aria-controls="search-res" aria-autocomplete="list"></label>
      <button type="button" class="search-cancel">Annulla</button>
    </div>
    <div class="search-scopes filter-rail" role="group" aria-label="Cerca in">${SCOPES.map(([k, l]) => `<button type="button" class="chip" data-scope="${k}" aria-pressed="${k === ''}">${l}</button>`).join('')}</div>
    <div class="search-res" id="search-res" role="listbox" aria-label="Risultati"></div>`;
  document.body.append(dlg);
  const input = dlg.querySelector('input');
  input.addEventListener('input', () => { sel = -1; render(input.value); });
  input.addEventListener('keydown', (e) => {
    const opts = [...dlg.querySelectorAll('.sr-item')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = Math.max(0, Math.min(opts.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      opts.forEach((o, k) => o.setAttribute('aria-selected', k === sel));
      opts[sel]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') { e.preventDefault(); (opts[sel] || opts[0])?.click(); }
  });
  dlg.querySelector('.search-cancel').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-scope]');
    if (sc) { scope = sc.dataset.scope; dlg.querySelectorAll('[data-scope]').forEach((b) => b.setAttribute('aria-pressed', String(b === sc))); render(input.value); input.focus(); return; }
    const chip = e.target.closest('[data-q]');
    if (chip) { input.value = chip.dataset.q; render(input.value); input.focus(); return; }
    const it = e.target.closest('.sr-item');
    if (!it) return;
    const item = ITEMS[+it.dataset.i];
    if (input.value.trim()) remember(input.value.trim());
    dlg.close();
    if (item.action) item.action(); else if (item.href) location.hash = item.href;
  });
}

function render(q) {
  const box = dlg.querySelector('.search-res');
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) {
    const r = recent();
    box.innerHTML = `${r.length ? `<p class="sr-h">Ricerche recenti</p><div class="sr-chips">${r.map((x) => `<button type="button" class="chip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
      <p class="sr-h">Prova con</p><div class="sr-chips">${SUGGEST.map((x) => `<button type="button" class="chip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <p class="small muted sr-hint">Cerca per nome, nome latino o dialettale, comune, numero del sentiero, tipo di bosco.</p>`;
    return;
  }
  const hits = searchHits(q,scope).map(h=>prio.includes(h.it.kind)?{...h,s:h.s+3-prio.indexOf(h.it.kind)}:h);
  if (!hits.length) { box.innerHTML = `<p class="sr-empty">Nessun risultato per <b>${esc(q)}</b>.<br><span class="small muted">Se hai un fungo in mano, prova <a href="#/riconosci" data-close>Impara a riconoscere</a>.</span></p>`; box.querySelector('[data-close]')?.addEventListener('click', () => dlg.close()); return; }
  const groups = ORDER.map((k) => [k, hits.filter((h) => h.it.kind === k).sort((a, b) => b.s - a.s).slice(0, scope ? 30 : k === 'velenoso' || k === 'sentiero' ? 5 : 6)]).filter(([, l]) => l.length);
  // il gruppo col risultato migliore va in cima
  groups.sort((a, b) => Number(prio.includes(b[0])) - Number(prio.includes(a[0])) || b[1][0].s - a[1][0].s);
  box.innerHTML = groups.map(([k, l]) => `<section class="sr-group"><p class="sr-h">${KINDS[k]}${l.every(h=>h.byTraits)?' · suggerimenti per caratteri':''}</p><ul>${l.map(({ it, i, reason }) => `
    <li><button type="button" class="sr-item" role="option" data-i="${i}" aria-selected="false">
      <span class="sr-img">${it.img || ''}</span>
      <span class="sr-txt"><b>${mark(it.title, words)}</b>${it.sub ? `<small>${mark(it.sub, words)}</small>` : ''}${reason?`<small class="search-feature-reason">${mark(reason,words)}</small>`:''}</span>
      ${it.badge ? `<span class="sr-badge ${esc(it.badgeCls || '')}">${esc(it.badge)}</span>` : ''}
    </button></li>`).join('')}</ul></section>`).join('');
}

export function openSearch(q = '', sc = '') {
  if (!dlg) build();
  const input = dlg.querySelector('input');
  const page = document.body.dataset.page || '';
  const recognition = document.querySelector('#entity-sheet[open]') || document.querySelector('.recognition-sheet[open]');
  const key = recognition?.querySelector('[data-glossary-context]')?.dataset.glossaryContext;
  const context = key === 'Piante' ? 'piante' : key === 'Alberi' ? 'alberi' : key === 'Funghi' ? 'riconosci' : page;
  prio = PRIORITY[context] || [];
  scope = typeof q === 'string' ? sc : '';
  dlg.querySelectorAll('[data-scope]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === scope)));
  input.placeholder = PLACEHOLDER[context] || 'Cerca zone, funghi, alberi, sentieri…';
  input.value = typeof q === 'string' ? q : '';
  render(input.value);
  dlg.showModal();
  input.focus();
}
