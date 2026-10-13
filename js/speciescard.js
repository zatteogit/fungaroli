// Scheda dettagliata di una specie: foto reali, riconoscimento, sosia pericolosi,
// calendario delle osservazioni (GBIF) a confronto con il modello, modello 3D.

import { traitStrip, compareCta, taxonKeyByLatin, openTaxon, attentionBox, compareHref, lookalikeRank } from './identify.js';
import { tick } from './motion.js';
import { SPECIES } from './species.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { linkTrees } from './trees.js';
import { openEntitySheet } from './entity-sheet.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONTHS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const TOX = { mortale: 'tox-deadly', tossico: 'tox-toxic', 'non commestibile': 'tox-no', commestibile: 'tox-ok' };

let PREP = null, ID = null, MEDIA = null, ASSET = (f) => f, EMBED_3D = true, INFO = {}, WHERE = () => '', TRAITS = {}, FOOTER = '';

export function initSpeciesCards({ idData, media, assetUrl, allow3d = true, infographics = {}, whereSection, traits, footer, prep }) {
  PREP = prep || null;
  ID = idData; MEDIA = media; if (assetUrl) ASSET = assetUrl; EMBED_3D = allow3d; INFO = infographics || {}; if (whereSection) WHERE = whereSection;
  TRAITS = traits?.taxa || {}; FOOTER = footer || '';
  // I richiami contestuali aprono la stessa scheda senza abbandonare la vista.
  document.addEventListener('click', (e) => {
    const ck = e.target.closest('.checks li[aria-checked]');
    if (ck) { toggleCheck(ck); return; }
    const t = e.target.closest('[data-species]');
    if (t && !t.hasAttribute('data-report')) { e.preventDefault(); const href = `#/specie/${t.dataset.species}`; if (!openEntitySheet(href,t)) location.hash = href; }
  });
}

// Miniatura fotografica (o segnaposto con le iniziali se manca la foto).
export function thumb(id, size = 36) {
  const m = MEDIA?.species?.[id]?.ref || MEDIA?.species?.[id]?.inat?.[0];
  const sp = SPECIES.find((s) => s.id === id);
  if (m) return `<img class="thumb" src="${ASSET(m.thumb || m.file)}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`;
  return `<span class="thumb thumb-ph" style="width:${size}px;height:${size}px">${esc((sp?.name || '?').slice(0, 2))}</span>`;
}

// Foto principale di una specie (oggetto di media.json, con file e file_hd)
export const speciesPhoto = (id) => MEDIA?.species?.[id]?.ref || MEDIA?.species?.[id]?.inat?.[0] || null;

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
  const note = g?.total ? `<p class="small muted">Le osservazioni GBIF dicono quando la specie viene fotografata e segnalata in tutta Italia, Alpi comprese: descrivono la frequenza delle segnalazioni, influenzata da osservatori, luoghi e anni. Non misurano abbondanza o stagionalità locale nel Reatino. <a href="${esc(g.page)}" target="_blank" rel="noopener">Dati GBIF</a></p>` : '';
  return html + note;
}

function traitsTable(d) {
  const rows = [
    ['Cappello', d.cap && [d.cap.shape, d.cap.size_cm && `${d.cap.size_cm[0]}–${d.cap.size_cm[1]} cm`, d.cap.color, d.cap.surface]],
    ['Sotto il cappello', d.hymenophore && [d.hymenophore.type, d.hymenophore.color, d.hymenophore.notes]],
    ['Gambo', d.stem && [d.stem.shape, d.stem.color, d.stem.surface, d.stem.ring && `anello: ${d.stem.ring}`, d.stem.volva && `volva: ${d.stem.volva}`]],
    ['Carne', d.flesh && [d.flesh.color, d.flesh.change && `al taglio: ${d.flesh.change}`, d.flesh.smell && `odore: ${d.flesh.smell}`]],
    ['Sporata', d.spore_print && [d.spore_print]],
    ['Habitat', d.habitat && [d.habitat]],
    ['Stagione', d.season && [d.season]],
  ].filter(([, v]) => v);
  return `<dl class="traits">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${linkTrees(v.filter(Boolean).join(' · '))}</dd>`).join('')}</dl>`;
}

function lookalikes(d, sid) {
  if (!d.lookalikes?.length) return '';
  const order = { mortale: 0, tossico: 1, 'non commestibile': 2, commestibile: 3 };
  // i piu' somiglianti per primi (stesso ordine del confronto), a pari merito i piu' pericolosi
  const list = [...d.lookalikes].sort((a, b) => (lookalikeRank(sid, b.latin) - lookalikeRank(sid, a.latin)) || ((order[a.toxicity] ?? 9) - (order[b.toxicity] ?? 9)));
  return `<h3>Non confonderlo con</h3><ul class="look">${list.map((l) => {
    const key = (l.latin || '').match(/[A-Z][a-z]+ [a-z]+/)?.[0];
    const m = MEDIA?.lookalikes?.[key]?.ref || MEDIA?.lookalikes?.[key]?.inat?.[0];
    // tutta la riga apre la scheda del sosia; la lente ingrandisce la foto
    const tk = taxonKeyByLatin(l.latin);
    return `<li class="${TOX[l.toxicity] || ''}${tk ? ' look-link' : ''}">
      <span class="look-btn">${m ? `<img src="${ASSET(m.file)}" alt="" loading="lazy" decoding="async">` : '<span class="look-ph">senza foto</span>'}
        ${m ? `<button type="button" class="id-zoom" data-look="${esc(key || '')}" aria-label="${esc(l.name || l.latin)}: ingrandisci la foto"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/></svg></button>` : ''}</span>
      <div><div class="look-name"><span class="tox">${esc(l.toxicity)}</span> ${tk && compareHref(sid, tk) ? `<a class="look-open" href="${compareHref(sid, tk)}">${esc(l.name || '')} <i>${esc(l.latin)}</i><span aria-hidden="true"> ›</span></a>` : tk ? `<button type="button" class="look-open" data-taxon="${esc(tk)}">${esc(l.name || '')} <i>${esc(l.latin)}</i><span aria-hidden="true"> ›</span></button>` : `${esc(l.name || '')} <i>${esc(l.latin)}</i>`}</div>
      <div class="look-diff">${esc(l.how_to_tell)}</div></div></li>`;
  }).join('')}</ul>`;
}

// In cucina: prima cio' che e' obbligatorio (sicurezza), poi conservazione e quantita', infine i classici
const srcList = (src) => (src || []).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ');
function kitchen(id) {
  const p = PREP?.species?.[id], c = PREP?.cucina?.[id];
  if (!p && !c) return '';
  const must = (p?.steps || []).filter((x) => x.level === 'obbligatorio'), tips = (p?.steps || []).filter((x) => x.level !== 'obbligatorio');
  const step = (x) => `<li>${esc(x.text)}${x.why ? `<small>${esc(x.why)}</small>` : ''}</li>`;
  const keep = [
    p?.freeze && ['Congelare', p.freeze], p?.dry && ['Essiccare', p.dry], p?.amount && ['Quanto', p.amount],
  ].filter(Boolean);
  const srcs = [...(p?.sources || []), ...must.flatMap((x) => x.sources || []), ...(c?.uses || []).flatMap((u) => u.sources || [])].filter((x, i, a) => x?.url && a.findIndex((y) => y.url === x.url) === i);
  return `<section class="kitchen" aria-labelledby="k-h-${id}">
    <h3 id="k-h-${id}">In cucina</h3>
    ${p ? `<p class="k-raw"><span class="k-badge${p.raw === 'mai crudo' ? (p.raw_level === 'lieve' ? ' mild' : ' never') : ''}">${p.raw === 'mai crudo' ? (p.raw_level === 'lieve' ? 'Leggermente tossico crudo' : 'Tossico crudo') : 'Solo cotto'}</span>${esc(p.raw_why || '')}</p>` : ''}
    ${must.length ? `<p class="k-h">Obbligatorio</p><ol class="k-steps k-must">${must.map(step).join('')}</ol>` : ''}
    ${p?.discard ? `<p class="k-line"><b>Scarta:</b> ${esc(p.discard)}</p>` : ''}
    ${keep.length || tips.length ? `<details class="k-more"><summary>Conservare, quantità e consigli</summary>
      ${keep.length ? `<dl class="k-keep">${keep.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${tips.length ? `<ul class="k-steps k-tips">${tips.map(step).join('')}</ul>` : ''}
      <p class="small"><a href="#/info">Regole per tutti i funghi: sott'olio, congelamento, chi non deve mangiarli ›</a></p></details>` : ''}
    ${c?.uses?.length ? `<details class="k-food"><summary>I classici in cucina</summary>
      ${c.taste ? `<p class="k-taste">${esc(c.taste)}</p>` : ''}
      <ul class="k-uses">${c.uses.map((u) => `<li>${esc(u.text)}</li>`).join('')}</ul>
      ${c.local ? `<p class="k-line"><b>Nel Lazio:</b> ${esc(c.local)}</p>` : ''}
</details>` : ''}
    ${srcs.length ? `<details class="k-src-list"><summary>Fonti (${srcs.length})</summary><p class="k-sources small muted">${srcList(srcs)}</p></details>` : ''}
  </section>`;
}

// Modello 3D: Viewer API di Sketchfab per sostituire lo sfondo scelto dall'autore con il fondo dell'app.
// Il colore pieno e' consentito a tutti; il trasparente richiede un account Pro (docs Viewer API, setBackground).
const SKETCHFAB_API = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
let sfLoading = null;
const loadSketchfab = () => sfLoading || (sfLoading = new Promise((ok, ko) => {
  if (globalThis.Sketchfab) return ok();
  const sc = document.createElement('script'); sc.src = SKETCHFAB_API; sc.onload = () => ok(); sc.onerror = ko; document.head.append(sc);
}));
function open3d(box, model, name) {
  const rgb = (getComputedStyle(box).backgroundColor.match(/[\d.]+/g) || [243, 239, 231]).slice(0, 3).map((x) => +x / 255);
  box.classList.add('loading');
  box.innerHTML = `<iframe title="Modello 3D ${esc(name)}" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe><span class="sp-3d-wait">Carico il modello…</span>`;
  const frame = box.querySelector('iframe');
  const show = () => box.classList.remove('loading');
  const fallback = () => { frame.src = model.embed.replace('autostart=0', 'autostart=1'); frame.addEventListener('load', show, { once: true }); };
  loadSketchfab().then(() => {
    new globalThis.Sketchfab('1.12.1', frame).init(model.uid, {
      autostart: 1, ui_infos: 0, ui_watermark: 0, ui_stop: 0, ui_help: 0, ui_settings: 0, ui_vr: 0, ui_inspector: 0, ui_annotations: 0, transparent: 0,
      success: (api) => {
        api.start();
        api.addEventListener('viewerready', () => api.setBackground({ color: rgb }, () => setTimeout(show, 150)));
        setTimeout(show, 6000); // se lo sfondo non si puo' cambiare, il modello si mostra comunque
      },
      error: fallback,
    });
  }).catch(fallback);
}

// lista di controllo: si spunta toccando (o con spazio/invio)
function toggleCheck(li) { li.setAttribute('aria-checked', li.getAttribute('aria-checked') !== 'true'); tick(); }
document.addEventListener('keydown', (e) => {
  const li = e.target.closest?.('.checks li[aria-checked]');
  if (li && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleCheck(li); }
});

// Regole di comportamento sul campo (prima di tutto il resto)
function attention(id, warn) {
  // il testo di avvertenza della scheda ripete gli stessi punti: con le regole elencate non serve
  return attentionBox(TRAITS[id]?.field_rules || []);
}
function checks(id) {
  const c = TRAITS[id]?.check_before_picking || [];
  return c.length ? `<h3>Cosa controllare</h3><p class="small muted checks-tip">Spunta mentre guardi il fungo che hai in mano.</p><ul class="checks">${c.map((x) => `<li role="checkbox" aria-checked="false" tabindex="0">${esc(x)}</li>`).join('')}</ul>` : '';
}
function whereToLook(id) {
  const w = TRAITS[id]?.where_to_look;
  if (!w) return '';
  return `<h3>Dove guardare</h3><p>${linkTrees(w.summary || '')}</p>
    ${w.tips?.length ? `<ul class="reasons">${w.tips.map((t) => `<li>${linkTrees(t)}</li>`).join('')}</ul>` : ''}
    ${w.trees?.length ? `<p class="tree-chips">${w.trees.map((t) => linkTrees(t)).join(' ')}</p>` : ''}`;
}
export const whereSummary = (id) => TRAITS[id]?.where_to_look?.summary || '';
export const criticalRule = (id) => (TRAITS[id]?.field_rules || []).find((r) => r.severity === 'critico')?.text || '';

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
    <header class="phero phero-tall">
      ${photos[0] ? `<button type="button" class="phero-img" data-photo="0" aria-label="Ingrandisci la foto"><img src="${hd(photos[0])}" alt="${esc(sp.name)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar">
        ${photos[0] ? '<button type="button" class="fab" data-photo="0" aria-label="Foto a schermo intero"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>' : ''}</div>
      <div class="phero-body">
        <p class="sp-badges">${(() => {
          // "con cautela" non dice cosa fare: l'etichetta dice la condizione e porta alla sezione In cucina
          const lab = PREP?.species?.[id]?.label;
          if (lab) return `<button type="button" class="pill caution" data-jump-k="k-h-${id}"><i aria-hidden="true">!</i>${esc(lab)}</button>`;
          return d.edibility ? `<span class="pill glass">${esc(d.edibility)}</span>` : '';
        })()}${sp.minCap ? `<span class="pill glass">cappello ≥ ${sp.minCap} cm</span>` : sp.minCap === 0 ? '<span class="pill glass">nessuna taglia minima</span>' : ''}</p>
        <h1 class="phero-title">${esc(d.name || sp.name)}</h1>
        <p class="phero-sub"><i>${esc(d.latin || sp.latin)}</i></p>
      </div>
    </header>
    <div class="pbody">
    ${photos.length > 1 ? `<div class="sp-strip">${photos.slice(1).map((p, k) => `<button type="button" class="zoomable" data-photo="${k + 1}" aria-label="Foto ${k + 2}: ingrandisci"><img src="${ASSET(p.file)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
    ${attention(id, warn)}
    ${d.key_features?.length ? `<h3>Come riconoscerlo</h3>${traitStrip(id)}<ol class="keys">${d.key_features.map((k) => `<li>${esc(k)}</li>`).join('')}</ol>` : '<p class="notice">Scheda di riconoscimento in preparazione.</p>'}
    ${TRAITS[id] ? '' : (warn.length ? `<div class="notice">${esc(warn.join(' '))}</div>` : '')}
    ${checks(id)}
    ${compareCta(id)}
    ${kitchen(id)}
    ${whereToLook(id)}
    ${lookalikes(d, id)}
    ${INFO[id]?.file ? `<h3>Infografica</h3><button type="button" class="zoomable sp-info" data-info="1" aria-label="Apri l'infografica"><img src="${ASSET(INFO[id].file)}" alt="Infografica di riconoscimento: ${esc(sp.name)}" loading="lazy" decoding="async"><span class="zoom-ic" aria-hidden="true">⤢</span></button>` : ''}
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
    <p class="small muted sp-foot">${esc(FOOTER || 'Scheda di supporto: non sostituisce il controllo dell\'Ispettorato Micologico ASL. Nel dubbio non si raccoglie e non si mangia.')} <a href="#/info">Emergenza e note legali</a></p>
    </div>`;
  body.querySelector('.sp-3d button')?.addEventListener('click', (e) => {
    const box = e.target.closest('.sp-3d');
    open3d(box, model, sp.name);
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
  body.querySelector('[data-jump-k]')?.addEventListener('click', (e) => body.querySelector(`#${CSS.escape(e.currentTarget.dataset.jumpK)}`)?.closest('.kitchen')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  body.querySelectorAll('.look-open[data-taxon]').forEach((b) => b.addEventListener('click', () => openTaxon(b.dataset.taxon)));
  body.querySelectorAll('[data-look]').forEach((b) => b.addEventListener('click', () => {
    const i = lookItems.findIndex((it) => it.key === b.dataset.look);
    if (i >= 0) openLightbox(lookItems, i);
  }));
}
