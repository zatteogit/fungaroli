// Schede degli alberi simbionti e collegamenti automatici nei testi (#/albero/<id>).

import { SPECIES } from './species.js';
import { openLightbox, captionHtml } from './lightbox.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let T = {}, MEDIA = {}, ASSET = (f) => f, ZONES = [], HAB = {}, THUMB = () => '';
let aliasRe = null, aliasMap = {};

export function initTrees({ trees, media, assetUrl, zones, habitat, thumb }) {
  T = trees?.trees || {}; MEDIA = media?.trees || {}; if (assetUrl) ASSET = assetUrl;
  ZONES = zones || []; HAB = habitat || {}; if (thumb) THUMB = thumb;
  aliasMap = {};
  for (const [id, t] of Object.entries(T)) {
    for (const a of [id, t.name, ...(t.aliases || [])]) if (a) aliasMap[a.toLowerCase()] = id;
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

// Albero dominante di una categoria della Carta Forestale (per legende e barre del bosco)
export function treeForCategory(cat) {
  return Object.entries(T).find(([, t]) => (t.forest_categories || [])[0] === cat)?.[0]
    || Object.entries(T).find(([, t]) => (t.forest_categories || []).includes(cat))?.[0] || null;
}

const credit = (m) => m ? `Foto: ${esc(m.author)}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source)}</a>` : '';

export function treeThumb(id, size = 56) {
  const m = MEDIA[id]?.ref || MEDIA[id]?.inat?.[0];
  return m ? `<img class="thumb" src="${ASSET(m.file)}" width="${size}" height="${size}" alt="" loading="lazy">`
    : `<span class="thumb thumb-ph" style="width:${size}px;height:${size}px">${esc((T[id]?.name || '?').slice(0, 2))}</span>`;
}

export function renderTreeGrid(box) {
  const html = Object.entries(T).map(([id, t]) => {
    const m = MEDIA[id]?.ref || MEDIA[id]?.inat?.[0];
    return `<a class="sp-card" href="#/albero/${encodeURIComponent(id)}" aria-label="${esc(t.name)}">
      ${m ? `<img src="${ASSET(m.file)}" alt="" loading="lazy">` : ''}<span class="shade"></span>
      <span class="sp-card-body"><b>${esc(t.name)}</b><i>${esc(t.latin)}</i></span></a>`;
  }).join('');
  box.innerHTML = html ? `<div class="card-grid">${html}</div>` : '<p class="muted">Schede degli alberi in preparazione.</p>';
}

export function renderTreePage(body, id) {
  const t = T[id];
  if (!t) { body.innerHTML = '<p class="muted">Scheda non ancora disponibile.</p>'; return; }
  const m = MEDIA[id] || {};
  const photos = [m.ref, ...(m.inat || [])].filter(Boolean);
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
      ${photos[0] ? `<button type="button" class="phero-img" data-photo="0" aria-label="Ingrandisci la foto"><img src="${ASSET(photos[0].file_hd || photos[0].file)}" alt="${esc(t.name)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"><button type="button" class="fab" data-back aria-label="Indietro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button></div>
      <div class="phero-body">
        <p class="sp-badges">${t.type ? `<span class="pill glass">${esc(t.type)}</span>` : ''}${t.altitude_m ? `<span class="pill glass">${t.altitude_m[0]}–${t.altitude_m[1]} m</span>` : ''}</p>
        <h1 class="phero-title">${esc(t.name)}</h1>
        <p class="phero-sub"><i>${esc(t.latin)}</i></p>
      </div>
    </header>
    <div class="pbody">
    ${photos.length > 1 ? `<div class="sp-strip">${photos.slice(1).map((p, k) => `<button type="button" class="zoomable" data-photo="${k + 1}" aria-label="Foto ${k + 2}: ingrandisci"><img src="${ASSET(p.file)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    ${t.recognize?.length ? `<h3>Come riconoscerlo</h3><ol class="keys">${t.recognize.map((k) => `<li>${esc(k)}</li>`).join('')}</ol>` : ''}
    ${fungi.length ? `<h3>Funghi che ci crescono</h3><div class="tree-fungi">${fungi.map((s) => `<a href="#/specie/${s.id}" class="tf">${THUMB(s.id, 52)}<span>${esc(s.name)}</span></a>`).join('')}</div>${t.fungi_note ? `<p class="small muted">${esc(t.fungi_note)}</p>` : ''}` : ''}
    <div class="sp-more">
      ${sec('Nelle zone', zrows.length ? `<p class="small muted">Ettari dei boschi in cui domina (${esc(cats.join(', '))}), dalla Carta Forestale.</p><ul class="where">${zrows.map(({ z, ha }) => `
        <li><a href="#/zona/${z.id}/0"><div class="where-top"><b>${esc(z.name)}</b><span class="small">~${ha.toLocaleString('it-IT')} ha</span></div><div class="bar"><i style="width:${Math.round((ha / maxHa) * 100)}%;background:var(--line)"></i></div></a></li>`).join('')}</ul>` : (t.where_reatino ? '' : ''))}
      ${sec('Foglia, corteccia, frutto', `<dl class="traits">${[['Foglia', t.leaf], ['Corteccia', t.bark], ['Frutto', t.fruit], ['Portamento', t.habit], ["D'inverno", t.season_tip], ['Nel Reatino', t.where_reatino]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
      ${sec('Con cosa si confonde', t.confusable?.length ? `<ul class="reasons">${t.confusable.map((c) => `<li><b>${esc(c.name)}</b>: ${esc(c.how_to_tell)}</li>`).join('')}</ul>` : '')}
      ${sec('Fonti e crediti delle foto', `${t.sources?.length ? `<ul class="small sources">${t.sources.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`).join('')}</ul>` : ''}${photos.length ? `<ul class="small sources">${photos.map((p) => `<li>${credit(p)}</li>`).join('')}</ul>` : ''}`)}
    </div>
    </div>`;
  const gallery = photos.map((p) => ({ src: ASSET(p.file_hd || p.file), alt: t.name, caption: captionHtml({ title: esc(t.name), text: esc(t.latin), credit: credit(p) }) }));
  body.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => openLightbox(gallery, +b.dataset.photo)));
}
