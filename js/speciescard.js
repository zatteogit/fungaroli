// Scheda dettagliata di una specie: foto reali, riconoscimento, sosia pericolosi,
// calendario delle osservazioni (GBIF) a confronto con il modello, modello 3D.

import { SPECIES } from './species.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONTHS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const TOX = { mortale: 'tox-deadly', tossico: 'tox-toxic', 'non commestibile': 'tox-no', commestibile: 'tox-ok' };

let ID = null, MEDIA = null, ASSET = (f) => f, EMBED_3D = true;

export function initSpeciesCards({ idData, media, assetUrl, allow3d = true }) {
  ID = idData; MEDIA = media; if (assetUrl) ASSET = assetUrl; EMBED_3D = allow3d;
  const dlg = document.getElementById('species-dialog');
  dlg.querySelector('.sp-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-species]');
    if (t) { e.preventDefault(); openSpeciesCard(t.dataset.species); }
  });
}

// Miniatura fotografica (o segnaposto con le iniziali se manca la foto).
export function thumb(id, size = 36) {
  const m = MEDIA?.species?.[id]?.ref || MEDIA?.species?.[id]?.inat?.[0];
  const sp = SPECIES.find((s) => s.id === id);
  if (m) return `<img class="thumb" src="${ASSET(m.file)}" width="${size}" height="${size}" alt="" loading="lazy">`;
  return `<span class="thumb thumb-ph" style="width:${size}px;height:${size}px">${esc((sp?.name || '?').slice(0, 2))}</span>`;
}

const credit = (m) => m ? `<span class="credit">Foto: ${esc(m.author)}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source)}</a></span>` : '';

function phenology(id) {
  const sp = SPECIES.find((s) => s.id === id);
  const g = MEDIA?.species?.[id]?.gbif;
  const row = (vals, cls, title, fmt) => {
    const max = Math.max(...vals, 1e-9);
    return `<div class="phen-row"><div class="phen-title">${title}</div><div class="phen-bars">${vals.map((v, k) => `
      <span class="phen-cell" title="${MONTHS_LONG[k]}: ${fmt(v)}"><i class="${cls}" style="height:${Math.round((v / max) * 100)}%"></i><b>${MONTHS[k]}</b></span>`).join('')}</div></div>`;
  };
  let html = row(sp.months, 'model', 'Calendario del modello', (v) => `peso ${v}`);
  if (g?.total) html = row(g.months, 'obs', `Osservazioni in Italia (GBIF, ${g.total.toLocaleString('it-IT')})`, (v) => `${v} osservazioni`) + html;
  const note = g?.total ? `<p class="small muted">Le osservazioni GBIF dicono quando la specie viene fotografata e segnalata in tutta Italia, Alpi comprese: servono a controllare la forma della stagione, non le date esatte nel Reatino. <a href="${esc(g.page)}" target="_blank" rel="noopener">Dati GBIF</a></p>` : '';
  return html + note;
}

function traitsTable(d) {
  const rows = [
    ['Cappello', d.cap && [d.cap.shape, d.cap.size_cm && `${d.cap.size_cm[0]}–${d.cap.size_cm[1]} cm`, d.cap.color, d.cap.surface]],
    ['Sotto il cappello', d.hymenophore && [d.hymenophore.type, d.hymenophore.color, d.hymenophore.notes]],
    ['Gambo', d.stem && [d.stem.shape, d.stem.color, d.stem.surface, d.stem.ring && `anello: ${d.stem.ring}`, d.stem.volva && `volva: ${d.stem.volva}`]],
    ['Carne', d.flesh && [d.flesh.color, d.flesh.change && `al taglio: ${d.flesh.change}`, d.flesh.smell && `odore: ${d.flesh.smell}`, d.flesh.taste && `sapore: ${d.flesh.taste}`]],
    ['Sporata', d.spore_print && [d.spore_print]],
    ['Habitat', d.habitat && [d.habitat]],
    ['Stagione', d.season && [d.season]],
  ].filter(([, v]) => v);
  return `<dl class="traits">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v.filter(Boolean).join(' · '))}</dd>`).join('')}</dl>`;
}

function lookalikes(d) {
  if (!d.lookalikes?.length) return '';
  const order = { mortale: 0, tossico: 1, 'non commestibile': 2, commestibile: 3 };
  const list = [...d.lookalikes].sort((a, b) => (order[a.toxicity] ?? 9) - (order[b.toxicity] ?? 9));
  return `<h3>Non confonderlo con</h3><ul class="look">${list.map((l) => {
    const key = (l.latin || '').match(/[A-Z][a-z]+ [a-z]+/)?.[0];
    const m = MEDIA?.lookalikes?.[key]?.ref || MEDIA?.lookalikes?.[key]?.inat?.[0];
    return `<li class="${TOX[l.toxicity] || ''}">
      ${m ? `<img src="${ASSET(m.file)}" alt="${esc(l.name || l.latin)}" loading="lazy">` : '<span class="look-ph"></span>'}
      <div><div class="look-name"><span class="tox">${esc(l.toxicity)}</span> ${esc(l.name || '')} <i>${esc(l.latin)}</i></div>
      <div class="look-diff">${esc(l.how_to_tell)}</div>${m ? credit(m) : ''}</div></li>`;
  }).join('')}</ul>`;
}

export function openSpeciesCard(id) {
  const dlg = document.getElementById('species-dialog');
  const sp = SPECIES.find((s) => s.id === id);
  const d = ID?.species?.[id] || {};
  const m = MEDIA?.species?.[id] || {};
  const photos = [m.ref, ...(m.inat || [])].filter(Boolean);
  const model = m.model3d;
  const body = dlg.querySelector('.sp-body');
  body.innerHTML = `
    <div class="sp-hero">
      ${photos[0] ? `<figure class="sp-main"><img src="${ASSET(photos[0].file)}" alt="${esc(sp.name)}">${credit(photos[0])}</figure>` : ''}
      ${photos.length > 1 ? `<div class="sp-gallery">${photos.slice(1).map((p) => `<figure><img src="${ASSET(p.file)}" alt="${esc(sp.name)}${p.place ? ', ' + esc(p.place) : ''}" loading="lazy">${credit(p)}</figure>`).join('')}</div>` : ''}
    </div>
    <header class="sp-head">
      <p class="eyebrow">${esc(d.edibility || '')}${sp.minCap ? ` · cappello minimo ${sp.minCap} cm` : ''}</p>
      <h2>${esc(d.name || sp.name)}</h2>
      <p class="sp-latin">${esc(d.latin || sp.latin)}${d.aka?.length ? ` · ${esc(d.aka.join(', '))}` : ''}</p>
    </header>
    ${d.key_features?.length ? `<h3>Riconoscerlo</h3><ol class="keys">${d.key_features.map((k) => `<li>${esc(k)}</li>`).join('')}</ol>` : `<p class="notice">Scheda di riconoscimento in preparazione.</p>`}
    ${lookalikes(d)}
    ${(d.warnings?.length || sp.warning) ? `<div class="notice">${esc([...(d.warnings || []), ...(d.warnings?.length ? [] : [sp.warning])].join(' '))}</div>` : ''}
    ${d.cap ? `<h3>Caratteri</h3>${traitsTable(d)}` : ''}
    <h3>Quando si trova</h3>
    ${phenology(id)}
    ${model ? `<h3>Modello 3D</h3>${EMBED_3D
      ? `<div class="sp-3d" data-embed="${esc(model.embed)}"><button type="button" class="btn">Carica il modello 3D</button></div>`
      : ''}<p class="small muted">${esc(model.name)} · ${esc(model.author)} · ${esc(model.license)} · <a href="${esc(model.page)}" target="_blank" rel="noopener">apri su Sketchfab</a></p>` : ''}
    ${d.sources?.length ? `<h3>Fonti</h3><ul class="small sources">${d.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul>` : ''}
    <p class="small muted">Scheda di supporto, non sostituisce il controllo dell'Ispettorato Micologico ASL. Nel dubbio non si raccoglie e non si mangia.</p>`;
  body.querySelector('.sp-3d button')?.addEventListener('click', (e) => {
    const box = e.target.closest('.sp-3d');
    box.innerHTML = `<iframe title="Modello 3D ${esc(sp.name)}" src="${esc(box.dataset.embed)}" allow="autoplay; fullscreen; xr-spatial-tracking" loading="lazy"></iframe>`;
  });
  dlg.showModal();
  body.scrollTop = 0;
}
