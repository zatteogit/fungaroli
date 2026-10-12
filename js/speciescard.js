// Scheda dettagliata di una specie: foto reali, riconoscimento, sosia pericolosi,
// calendario delle osservazioni (GBIF) a confronto con il modello, modello 3D.

import { SPECIES } from './species.js';
import { openLightbox, captionHtml } from './lightbox.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONTHS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const TOX = { mortale: 'tox-deadly', tossico: 'tox-toxic', 'non commestibile': 'tox-no', commestibile: 'tox-ok' };

let ID = null, MEDIA = null, ASSET = (f) => f, EMBED_3D = true, INFO = {}, WHERE = () => '';

export function initSpeciesCards({ idData, media, assetUrl, allow3d = true, infographics = {}, whereSection }) {
  ID = idData; MEDIA = media; if (assetUrl) ASSET = assetUrl; EMBED_3D = allow3d; INFO = infographics || {}; if (whereSection) WHERE = whereSection;
  // ogni elemento con data-species apre la pagina della specie
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-species]');
    if (t) { e.preventDefault(); location.hash = `#/specie/${t.dataset.species}`; }
  });
}

// Miniatura fotografica (o segnaposto con le iniziali se manca la foto).
export function thumb(id, size = 36) {
  const m = MEDIA?.species?.[id]?.ref || MEDIA?.species?.[id]?.inat?.[0];
  const sp = SPECIES.find((s) => s.id === id);
  if (m) return `<img class="thumb" src="${ASSET(m.file)}" width="${size}" height="${size}" alt="" loading="lazy">`;
  return `<span class="thumb thumb-ph" style="width:${size}px;height:${size}px">${esc((sp?.name || '?').slice(0, 2))}</span>`;
}

const creditText = (m) => m ? `Foto: ${esc(m.author)}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source)}</a>` : '';
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
      <button type="button" class="look-btn" data-look="${esc(key || '')}" ${m ? '' : 'disabled'} aria-label="${esc(l.name || l.latin)}: ingrandisci la foto">
        ${m ? `<img src="${ASSET(m.file)}" alt="" loading="lazy"><span class="zoom-ic" aria-hidden="true">⤢</span>` : '<span class="look-ph">senza foto</span>'}
      </button>
      <div><div class="look-name"><span class="tox">${esc(l.toxicity)}</span> ${esc(l.name || '')} <i>${esc(l.latin)}</i></div>
      <div class="look-diff">${esc(l.how_to_tell)}</div></div></li>`;
  }).join('')}</ul>`;
}

export function renderSpeciesDetail(body, id) {
  const sp = SPECIES.find((s) => s.id === id);
  if (!sp) { body.innerHTML = '<p class="muted">Specie non trovata.</p>'; return; }
  const d = ID?.species?.[id] || {};
  const m = MEDIA?.species?.[id] || {};
  const photos = [m.ref, ...(m.inat || [])].filter(Boolean);
  const model = m.model3d;
  const hd = (p) => ASSET(p.file_hd || p.file);
  const warn = [...(d.warnings || []), ...(d.warnings?.length ? [] : [sp.warning])].filter(Boolean);
  const sec = (title, html) => html ? `<details class="sec"><summary>${title}</summary><div class="sec-body">${html}</div></details>` : '';
  const credits = [...photos.map((p) => creditText(p)), ...(d.lookalikes || []).flatMap((l) => {
    const key = (l.latin || '').match(/[A-Z][a-z]+ [a-z]+/)?.[0];
    return [MEDIA?.lookalikes?.[key]?.ref, ...(MEDIA?.lookalikes?.[key]?.inat || [])].filter(Boolean).map((p) => `${esc(l.latin)}: ${creditText(p)}`);
  })];
  body.innerHTML = `
    <div class="sp-hero">
      ${photos[0] ? `<button type="button" class="zoomable sp-main" data-photo="0" aria-label="Ingrandisci la foto"><img src="${ASSET(photos[0].file)}" alt="${esc(sp.name)}"><span class="zoom-ic" aria-hidden="true">⤢</span></button>` : ''}
      ${photos.length > 1 ? `<div class="sp-strip">${photos.slice(1).map((p, k) => `<button type="button" class="zoomable" data-photo="${k + 1}" aria-label="Foto ${k + 2}: ingrandisci"><img src="${ASSET(p.file)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>
    <header class="sp-head">
      <h1 class="zone-title">${esc(d.name || sp.name)}</h1>
      <p class="sp-latin">${esc(d.latin || sp.latin)}</p>
      <p class="sp-badges">${d.edibility ? `<span class="badge">${esc(d.edibility)}</span>` : ''}${sp.minCap ? `<span class="badge">cappello ≥ ${sp.minCap} cm</span>` : ''}</p>
    </header>
    ${d.key_features?.length ? `<h3>Come riconoscerlo</h3><ol class="keys">${d.key_features.map((k) => `<li>${esc(k)}</li>`).join('')}</ol>` : '<p class="notice">Scheda di riconoscimento in preparazione.</p>'}
    ${warn.length ? `<div class="notice">${esc(warn.join(' '))}</div>` : ''}
    ${lookalikes(d)}
    ${INFO[id]?.file ? `<h3>Infografica</h3><button type="button" class="zoomable sp-info" data-info="1" aria-label="Apri l'infografica"><img src="${ASSET(INFO[id].file)}" alt="Infografica di riconoscimento: ${esc(sp.name)}" loading="lazy"><span class="zoom-ic" aria-hidden="true">⤢</span></button>` : ''}
    <div class="sp-more">
      ${sec('Dove trovarlo nelle zone', WHERE(id))}
      ${sec('Tutti i caratteri', d.cap ? traitsTable(d) + (d.aka?.length ? `<p class="small"><b>Nomi locali:</b> ${esc(d.aka.join(', '))}</p>` : '') : '')}
      ${sec('Quando si trova', phenology(id))}
      ${model ? sec('Modello 3D', `${EMBED_3D
        ? `<div class="sp-3d" data-embed="${esc(model.embed)}"><button type="button" class="btn primary">Apri il modello 3D</button><p class="small muted">Si ruota con un dito, si ingrandisce con due. Scansione di un esemplare reale.</p></div>
           <button type="button" class="btn ghost sp-3d-full" hidden>Schermo intero</button>`
        : ''}<p class="small muted">${esc(model.name)} · ${esc(model.author)} · ${esc(model.license)} · <a href="${esc(model.page)}" target="_blank" rel="noopener">apri su Sketchfab</a></p>`) : ''}
      ${sec('Fonti e crediti delle foto', `${d.sources?.length ? `<ul class="small sources">${d.sources.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`).join('')}</ul>` : ''}${credits.length ? `<ul class="small sources">${credits.map((c) => `<li>${c}</li>`).join('')}</ul>` : ''}`)}
    </div>
    <p class="small muted">Scheda di supporto: non sostituisce il controllo dell'Ispettorato Micologico ASL. Nel dubbio non si raccoglie e non si mangia.</p>`;
  body.querySelector('.sp-3d button')?.addEventListener('click', (e) => {
    const box = e.target.closest('.sp-3d');
    box.innerHTML = `<iframe title="Modello 3D ${esc(sp.name)}" src="${esc(box.dataset.embed.replace('autostart=0', 'autostart=1'))}" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`;
    const full = body.querySelector('.sp-3d-full');
    if (full && box.requestFullscreen) {
      full.hidden = false;
      full.addEventListener('click', () => box.requestFullscreen().catch(() => {}));
    }
  });
  // foto della specie: visore con zoom e swipe tra tutte le foto
  const gallery = photos.map((p) => ({ src: hd(p), alt: sp.name, caption: captionHtml({ title: esc(d.name || sp.name), text: esc([p.place, p.date].filter(Boolean).join(' · ')), credit: creditText(p) }) }));
  body.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => openLightbox(gallery, +b.dataset.photo)));
  body.querySelectorAll('[data-info]').forEach((b) => b.addEventListener('click', () => openLightbox([{ src: ASSET(INFO[id].file), alt: `Infografica ${sp.name}`, caption: captionHtml({ title: `Infografica · ${esc(sp.name)}`, credit: esc(INFO[id].credit || '') }) }])));
  // sosia: foto grande con pericolosita' e differenza da guardare
  const looks = (d.lookalikes || []).map((l) => {
    const key = (l.latin || '').match(/[A-Z][a-z]+ [a-z]+/)?.[0];
    const ph = [MEDIA?.lookalikes?.[key]?.ref, ...(MEDIA?.lookalikes?.[key]?.inat || [])].filter(Boolean);
    return { key, ph, l };
  }).filter((x) => x.ph.length);
  const lookItems = looks.flatMap((x) => x.ph.map((p) => ({
    key: x.key, src: hd(p), alt: x.l.name || x.l.latin,
    caption: captionHtml({ title: `<span class="tox tox-${esc(x.l.toxicity).replace(/\s/g, '-')}">${esc(x.l.toxicity)}</span> ${esc(x.l.name || '')} <i>${esc(x.l.latin)}</i>`, text: `Differenza: ${esc(x.l.how_to_tell)}`,
      credit: `${creditText(p)} · <a href="https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(x.key)}" target="_blank" rel="noopener">altre foto</a> · <a href="https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(x.key)}" target="_blank" rel="noopener">Wikipedia</a>` }),
  })));
  body.querySelectorAll('[data-look]').forEach((b) => b.addEventListener('click', () => {
    const i = lookItems.findIndex((it) => it.key === b.dataset.look);
    if (i >= 0) openLightbox(lookItems, i);
  }));
}
