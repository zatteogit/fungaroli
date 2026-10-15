// Schede degli alberi simbionti e collegamenti automatici nei testi (#/albero/<id>).

import { SPECIES } from './species.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { cardLatin } from './names.js';
import { treeGroup } from './plant-catalog.js';
import { searchFieldHtml, matchesQuery, renderAlsoIn } from './catalog-search.js';
import { loadKeyData, loadTreeIcons, traitTilesHtml } from './guided-key.js';
import { sourceRows, photoRows } from './identify.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let T = {}, MEDIA = {}, ASSET = (f) => f, ZONES = [], HAB = {}, THUMB = () => '';
let aliasRe = null, aliasMap = {};

// nomi che sono anche parole comuni («tasso di umidità», il tasso animale): niente link automatico nei testi
const NOT_IN_TEXT = new Set(['tasso']);

export function initTrees({ trees, media, assetUrl, zones, habitat, thumb }) {
  T = trees?.trees || {}; MEDIA = media?.trees || {}; if (assetUrl) ASSET = assetUrl;
  ZONES = zones || []; HAB = habitat || {}; if (thumb) THUMB = thumb;
  aliasMap = {};
  for (const [id, t] of Object.entries(T)) {
    for (const a of [id, t.name, ...(t.aliases || [])]) if (a && !NOT_IN_TEXT.has(a.toLowerCase())) aliasMap[a.toLowerCase()] = id;
  }
  const words = Object.keys(aliasMap).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
  aliasRe = words.length ? new RegExp(`(^|[^\\p{L}])(${words.join('|')})(?=[^\\p{L}]|$)`, 'giu') : null;
}

export const hasTrees = () => Object.keys(T).length > 0;

// Testo semplice -> HTML sanificato con i nomi degli alberi trasformati in link
export function linkTrees(text) {
  const safe = esc(text);
  if (!aliasRe) return safe;
  return safe.replace(aliasRe, (m, pre, word) => {
    const id = aliasMap[word.toLowerCase().replace(/\s+/g, ' ')];
    return id ? `${pre}<a class="tree-link" href="#/albero/${encodeURIComponent(id)}">${word}</a>` : m;
  });
}

// Testo pulito e, sotto, gli alberi citati come chip con miniatura (niente link dentro le frasi)
export function treeChips(text) {
  const ids = [];
  if (aliasRe) for (const m of String(text || '').matchAll(aliasRe)) { const id = aliasMap[m[2].toLowerCase().replace(/\s+/g, ' ')]; if (id && !ids.includes(id)) ids.push(id); }
  return ids.length ? `<div class="ent-chips" aria-label="Alberi citati">${ids.map((id) => `<a class="ent-chip" href="#/albero/${encodeURIComponent(id)}" data-entity>${treeThumb(id, 28)}<span>${esc(T[id]?.name || id)}</span></a>`).join('')}</div>` : '';
}

// Albero dominante di una categoria della Carta Forestale (per legende e barre del bosco)
export function treeForCategory(cat) {
  return Object.entries(T).find(([, t]) => (t.forest_categories || [])[0] === cat)?.[0]
    || Object.entries(T).find(([, t]) => (t.forest_categories || []).includes(cat))?.[0] || null;
}

const credit = (m) => m ? `Foto: ${esc(m.author)}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source)}</a>` : '';

const treePhotos=id=>[MEDIA[id]?.ref,...(MEDIA[id]?.inat||[]),...(MEDIA[id]?.commons||[])].filter((p,i,a)=>p&&a.findIndex(x=>x?.file===p.file)===i);

// Foto principale per le card più grandi (sfide Confronta)
export const treePhotoSrc = (id) => { const m = treePhotos(id)[0]; return m ? ASSET(m.file) : ''; };

export function treeThumb(id, size = 56) {
  const m = treePhotos(id)[0];
  return m ? `<img class="thumb" data-src="${ASSET(m.thumb || m.file)}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`
    : `<span class="thumb thumb-ph" style="width:${size}px;height:${size}px">${esc((T[id]?.name || '?').slice(0, 2))}</span>`;
}

// «Non confonderlo con»: scheda con foto, nome, latino e differenze; se l'albero è in catalogo la scheda intera apre la sua pagina
const confusableCard = (self) => (c) => {
  // il collegamento passa dall'id (i nomi dei sosia possono essere più specifici della scheda: «Pioppo bianco» → pioppo)
  const cid = T[c.id] ? c.id : Object.keys(T).find((k) => T[k].name.toLowerCase() === String(c.name || '').toLowerCase());
  const [, nm, lat] = String(c.name || '').match(/^(.*?)\s*(?:\(([^)]+)\))?$/) || [];
  const name = nm || (cid ? T[cid].name : ''), latin = cardLatin(lat || c.latin || (cid ? T[cid].latin : ''));
  // scheda di genere (pioppo, salice): la sua foto è di un'altra specie, quindi non la si mostra per «Pioppo bianco»
  const m = cid && (!c.latin || (MEDIA[cid]?.photo_taxon || T[cid].latin) === c.latin) && treePhotos(cid)[0];
  const img = m ? `<img data-src="${ASSET(m.thumb || m.file)}" alt="" loading="lazy" decoding="async">` : `<span class="thumb-ph tx-look-ph" aria-hidden="true">${esc(String(name || '?').slice(0, 2))}</span>`;
  const inner = `${img}<span><b>${esc(name)}</b>${latin ? `<i>${esc(latin)}</i>` : ''}<small class="muted">${esc(c.how_to_tell)}</small></span>`;
  return `<li>${cid && cid !== self ? `<a class="tx-look-main" data-entity href="#/albero/${encodeURIComponent(cid)}">${inner}</a>` : `<div class="tx-look-main">${inner}</div>`}</li>`;
};

// Filtro per gruppo, dal campo `type`: resta in memoria per la sessione.
let TREE_GROUP = '', TREE_QUERY = '';
const TREE_GROUPS = [['', 'Tutti'], ['latifoglie', 'Latifoglie'], ['conifere', 'Conifere']];

export function renderTreeGrid(box) {
  box.dataset.glossaryContext='Alberi';
  const rows = Object.entries(T);
  if (!rows.length) { box.innerHTML = '<p class="muted">Schede degli alberi in preparazione.</p>'; return; }
  const card = ([id, t]) => {
    const m = treePhotos(id)[0];
    return `<a class="sp-card" href="#/albero/${encodeURIComponent(id)}" aria-label="${esc(t.name)}">
      ${m ? `<img data-src="${ASSET(m.file)}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>
      <span class="sp-card-body"><b>${esc(t.name)}</b><i>${esc(cardLatin(t.latin))}</i></span></a>`;
  };
  box.innerHTML = `${searchFieldHtml('Cerca un albero', 'Faggio, cerro, nome scientifico…')}<div class="recognize-modes catalog-filters" role="group" aria-label="Gruppi di alberi">${TREE_GROUPS.map(([id, name]) => `<button type="button" class="btn ghost small" data-tree-group="${id}" aria-pressed="false">${name}</button>`).join('')}</div><p class="small muted" data-tree-count role="status"></p><div class="card-grid" data-tree-results></div><div data-also-slot></div>`;
  const input = box.querySelector('[data-catalog-search]');
  input.value = TREE_QUERY;
  const update = () => {
    const hits = rows.filter(([, t]) => (!TREE_GROUP || treeGroup(t.type) === TREE_GROUP) && matchesQuery([t.name, t.latin, ...(t.aliases || []), t.family], TREE_QUERY));
    const filtered = TREE_GROUP || TREE_QUERY.trim();
    box.querySelectorAll('[data-tree-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.treeGroup === TREE_GROUP)));
    box.querySelector('[data-tree-count]').textContent = `${hits.length} ${hits.length === 1 ? 'scheda' : 'schede'}${filtered ? ` su ${rows.length}` : ''}`;
    box.querySelector('[data-tree-results]').innerHTML = hits.length ? hits.map(card).join('') : `<p class="notice">${TREE_QUERY.trim() ? `Nessun albero corrisponde a «${esc(TREE_QUERY.trim())}».` : 'Nessuna scheda in questo gruppo.'}</p>`;
    renderAlsoIn(box.querySelector('[data-also-slot]'), TREE_QUERY, ['albero']);
  };
  input.addEventListener('input', () => { TREE_QUERY = input.value; update(); });
  box.querySelectorAll('[data-tree-group]').forEach((b) => b.addEventListener('click', () => { TREE_GROUP = b.dataset.treeGroup; update(); }));
  update();
}

// «al castagno», «alla roverella», «all'orniello»: preposizione articolata davanti al nome comune
const alNome = (name) => { const n = name.charAt(0).toLowerCase() + name.slice(1), w = n.split(' ')[0]; return /^[aeiouàèéìòù]/.test(n) ? `all'${n}` : /a$/.test(w) ? `alla ${n}` : `al ${n}`; };

export function renderTreePage(body, id) {
  body.dataset.glossaryContext='Alberi';
  const t = T[id];
  if (!t) { body.innerHTML = '<p class="muted">Scheda non ancora disponibile.</p>'; return; }
  const m = MEDIA[id] || {};
  const photos = treePhotos(id);
  const fungi = (t.fungi || []).map((fid) => SPECIES.find((s) => s.id === fid)).filter(Boolean);
  const cats = t.forest_categories || [];
  const zrows = ZONES.map((z) => {
    const ha = cats.reduce((s, c) => s + (HAB[z.id]?.forest?.categorie_ha?.[c] || 0), 0);
    return { z, ha: Math.round(ha) };
  }).filter((r) => r.ha > 0).sort((a, b) => b.ha - a.ha);
  const maxHa = Math.max(1, ...zrows.map((r) => r.ha));
  const sec = (title, html) => html ? `<details class="sec"><summary>${title}</summary><div class="sec-body">${html}</div></details>` : '';
  body.innerHTML = `
    <header class="phero phero-tall">
      ${photos[0] ? `<button type="button" class="phero-img" data-photo="0" aria-label="Ingrandisci la foto"><img data-src="${ASSET(photos[0].file_hd || photos[0].file)}" alt="${esc(t.name)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"></div>
      <div class="phero-body">
        <p class="sp-badges">${t.type ? `<span class="pill glass">${esc(t.type)}</span>` : ''}${t.altitude_m ? `<span class="pill glass">${t.altitude_m[0]}–${t.altitude_m[1]} m</span>` : ''}</p>
        <h1 class="phero-title">${esc(t.name)}</h1>
        <p class="phero-sub"><i>${esc(t.latin)}</i></p>
      </div>
    </header>
    <div class="pbody">
    ${photos.length > 1 ? `<div class="sp-strip">${photos.slice(1).map((p, k) => `<button type="button" class="zoomable" data-photo="${k + 1}" aria-label="Foto ${k + 2}: ingrandisci"><img data-src="${ASSET(p.file)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
    <h3>Caratteri da confrontare</h3><div data-tree-traits></div>
    ${t.recognize?.length ? `<ol class="keys">${t.recognize.map((k) => `<li><span class="key-text">${esc(k)}</span></li>`).join('')}</ol>` : ''}
    ${t.confusable?.length ? `<h3>Non confonderlo con</h3><ul class="tx-look tree-confusable">${t.confusable.map(confusableCard(id)).join('')}</ul>` : ''}
    ${fungi.length ? `<h3>Funghi legati ${esc(alNome(t.name))}</h3><div class="tree-fungi">${fungi.map((s) => `<a href="#/specie/${s.id}" class="tf" data-entity>${THUMB(s.id, 52)}<span>${esc(s.name)}</span></a>`).join('')}</div>${t.fungi_note ? `<p class="small muted">${esc(t.fungi_note)}</p>` : ''}` : ''}
    <div class="sp-more">
      ${sec('Nelle zone', zrows.length ? `<p class="small muted">Ettari dei boschi in cui domina (${esc(cats.join(', '))}), dalla Carta Forestale.</p><ul class="where">${zrows.map(({ z, ha }) => `
        <li><a href="#/zona/${z.id}/0"><div class="where-top"><b>${esc(z.name)}</b><span class="small">~${ha.toLocaleString('it-IT')} ha</span></div><div class="bar"><i style="width:${Math.round((ha / maxHa) * 100)}%;background:var(--line)"></i></div></a></li>`).join('')}</ul>` : (t.where_reatino ? '' : ''))}
      ${sec('Foglia, corteccia, frutto', `<dl class="traits">${[['Foglia', t.leaf], ['Corteccia', t.bark], ['Frutto', t.fruit], ['Portamento', t.habit], ["D'inverno", t.season_tip], ['Quota documentata',t.altitudeNote],['Nel Reatino', t.where_reatino]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
      ${sec('Fonti e crediti delle foto', `${sourceRows(t.sources)}${photos.length ? `<p class="src-h">Fotografie</p>${photoRows(photos)}` : ''}`)}
    </div>
    </div>`;
  Promise.all([loadKeyData('alberi'), loadTreeIcons()]).then(([d, icons]) => { const slot = body.querySelector('[data-tree-traits]'); if (slot && d?.items?.[id]) slot.innerHTML = traitTilesHtml(d, d.items[id].traits, icons); });
  const gallery = photos.map((p) => ({ src: ASSET(p.file_hd || p.file), alt: t.name, caption: captionHtml({ title: esc(t.name), text: esc(t.latin), credit: credit(p) }) }));
  body.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => openLightbox(gallery, +b.dataset.photo)));
}
