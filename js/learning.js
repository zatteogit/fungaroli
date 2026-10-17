// Lessico di campo e spiegazioni contestuali: i link restano utilizzabili senza popover.
import {buildGlossaryIndex,relatedGlossaryTerms,linkableGlossaryTerm,normalizeGlossaryScope,GLOSSARY_CONTEXTS} from './glossary-context.js';
import { openEntitySheet } from './entity-sheet.js';
import {openLightbox,captionHtml} from './lightbox.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const normalizeLearning = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[’']/g, ' ');
let TERMS = [], TREES = {}, aliasMap = new Map(), aliasRe, active = null, opener = null, observer;
let ILLUSTRATIONS={},ASSET=f=>f;
export const glossaryTerms = () => TERMS;
export const glossaryTitle = id => TERMS.find(t => t.id === id)?.term || 'Glossario';
const difficultyIds = {T:'difficolta-t', E:'difficolta-e', EE:'difficolta-ee', EEA:'difficolta-eea'};

export function difficultyLink(code, label) {
  const id = difficultyIds[code];
  return id ? `<a class="glossary-link" data-term="${id}" href="#/glossario/${id}" aria-haspopup="dialog">${esc(label || code)}</a>` : esc(label || code);
}

const sourceLinks = sources => (sources || []).filter(s => /^https?:\/\//.test(s?.url || '')).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(' · ');
const imagesFor=id=>(ILLUSTRATIONS[id]?.illustrations||[]).filter(m=>m?.alt&&/^(?:https:\/\/[^\s"'<>]+|\/?assets\/[a-zA-Z0-9_/-]+\.(?:svg|webp|png|jpe?g))$/.test(m.file||''));
const imageCredit=m=>`${m.generated?'Schema generato':m.kind==='diagram'?'Schema':'Foto'}: ${esc(m.author)} · ${/^https:\/\//.test(m.licenseUrl||'')?`<a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a>`:esc(m.license)}${/^https:\/\//.test(m.page||'')?` · <a href="${esc(m.page)}" target="_blank" rel="noopener noreferrer">Originale</a>`:''}${m.note?` · ${esc(m.note)}`:''}`;
function termImages(id) {
  const images=imagesFor(id);
  if(!images.length)return '';
  return `<div class="learning-media${images.length>1?' learning-media-grid':''}">${images.map((m,i)=>`<figure data-no-glossary>
    <button type="button" class="learning-image ${m.kind==='diagram'?'learning-diagram':''}" data-learning-image="${esc(id)}" data-image-index="${i}" aria-label="Ingrandisci: ${esc(m.alt)}"><img data-src="${esc(ASSET(m.file))}" alt="${esc(m.alt)}" loading="lazy" decoding="async"><span aria-hidden="true">⤢</span></button>
    <figcaption><span>${esc(m.caption)}</span><small>${imageCredit(m)}</small></figcaption></figure>`).join('')}</div>`;
}
function termBody(t, legend = false, context=t.category) {
  const related=relatedGlossaryTerms(aliasMap,TERMS,t,context);
  if(legend && t.id.startsWith('difficolta-')) return `<div class="difficulty-legend" aria-label="Legenda delle difficoltà">${Object.values(difficultyIds).map(id => TERMS.find(x => x.id === id)).filter(Boolean).map(x => `<div${x.id === t.id ? ' class="current"' : ''}><b>${esc(x.term)}</b><p>${esc(x.definition)}</p></div>`).join('')}</div><p class="learning-observe">${esc(t.observe)}</p><p class="small muted">Sigla dalla fonte del percorso: verifica stato del sentiero, meteo, tempi e dislivelli prima di partire.</p><p class="learning-sources small muted">Fonte: ${sourceLinks(t.sources)}</p>`;
  return `<p class="small muted learning-category">${esc(t.category)}</p><p>${esc(t.definition)}</p>${termImages(t.id)}${t.observe ? `<p class="learning-observe">${esc(t.observe)}</p>` : ''}
    ${related.length ? `<div class="learning-related">${related.map(x => `<a class="glossary-link" data-term="${x.id}" href="#/glossario/${x.id}">${esc(x.term)}</a>`).join('')}</div>` : ''}
    <p class="learning-sources small muted">Fonti: ${sourceLinks(t.sources)}</p>`;
}

export function renderGlossary(box, selected = '', categories = ['Funghi','Piante','Alberi','Bosco','Sentiero']) {
  const category = TERMS.find(t => t.id === selected)?.category || '';
  box.innerHTML = `<div class="learning-filters" role="group" aria-label="Argomento del glossario">${['', ...categories].map(c => `<button type="button" class="chip" data-category="${c}" aria-pressed="${c === category}">${c || 'Tutto'}</button>`).join('')}</div>
    <div class="glossary-index"><nav class="glossary-alphabet filter-rail" aria-label="Indice alfabetico"></nav></div>
    <p id="${box.id}-count" class="small muted" role="status"></p><div id="${box.id}-results" data-no-glossary></div>`;
  let current = category;
  const initial = t => normalizeLearning(t.term).charAt(0).toUpperCase();
  const paint = () => {
    const hits = TERMS.filter(t => categories.includes(t.category) && (!current || t.category === current)).sort((a,b) => a.term.localeCompare(b.term, 'it'));
    const letters = new Set(hits.map(initial));
    box.querySelector('.glossary-alphabet').innerHTML = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', letter => `<button type="button" class="glossary-letter-link" data-letter="${letter}" aria-label="Vai alla lettera ${letter}"${letters.has(letter) ? '' : ' disabled'}>${letter}</button>`).join('');
    box.querySelector(`#${box.id}-count`).textContent = `${hits.length} ${hits.length === 1 ? 'voce' : 'voci'}`;
    let previous = '';
    box.querySelector(`#${box.id}-results`).innerHTML = hits.length ? hits.map(t => {
      const letter = initial(t), heading = letter !== previous ? `<h2 class="glossary-letter" id="${box.id}-letter-${letter}" tabindex="-1">${letter}</h2>` : '';
      previous = letter;
      return `${heading}<details class="glossary-entry" id="${box.id}-term-${t.id}"${selected === t.id ? ' open' : ''}><summary><span><small>${esc(t.category)}</small><b>${esc(t.term)}</b></span><span aria-hidden="true">+</span></summary><div>${termBody(t, true)}</div></details>`;
    }).join('') : '<p class="notice">Nessuna voce in questo argomento.</p>';
  };
  box.querySelector('.glossary-alphabet').addEventListener('click', e => {
    const button = e.target.closest('[data-letter]');
    if (!button || button.disabled) return;
    const heading = box.querySelector(`#${box.id}-letter-${button.dataset.letter}`);
    if (!heading) return;
    box.querySelectorAll('[data-letter]').forEach(b => b.removeAttribute('aria-current'));
    button.setAttribute('aria-current', 'location');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  box.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { current = b.dataset.category; selected = ''; box.querySelectorAll('[data-category]').forEach(x => x.setAttribute('aria-pressed',String(x === b))); paint(); });
  paint();
  // la voce richiesta (#/glossario/<voce>) la porta in vista routeNow, nello stesso passo della transizione: niente scatto dopo
}

// Modifica soltanto nodi di testo: niente regex sull'HTML, link annidati o controlli alterati.
// Le parole si collegano solo dentro le zone descrittive dichiarate nel markup con data-glossary="<ambito>"
// (Funghi, Piante, Alberi, Bosco, Sentiero, Generale; vuoto = ambito del data-glossary-context più vicino).
// Fuori da quelle zone (mesi, date, misure, crediti, fonti, didascalie, tessere, pulsanti, titoli) niente link automatici.
// Ambiti compatibili e regola delle parole corte: js/glossary-context.js.
const NO_LINK='a,button,label,select,textarea,input,code,pre,script,style,svg,h1,h2,h3,h4,summary,figcaption,[contenteditable],[data-no-glossary],.trait-strip,.cmp-rows,.id-grid,.id-answers,.tag,.chip,.pill,.sp-card,.tile,.sci-params dt';
export const glossaryScopeOf = zone => normalizeGlossaryScope(zone?.dataset.glossary || zone?.closest('[data-glossary-context]')?.dataset.glossaryContext);
export function enhanceGlossary(root) {
  if (!root || !aliasRe) return;
  root.querySelectorAll('a.tree-link,a.species-link,a[data-entity]').forEach(a=>a.setAttribute('aria-haspopup','dialog'));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode(node) {
    const p = node.parentElement;
    if (!p || !node.textContent.trim() || p.closest(NO_LINK)) return NodeFilter.FILTER_REJECT;
    return p.closest('[data-glossary]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }});
  const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
  // ogni parola si collega una volta sola nella pagina, e mai due link a ridosso: è un'app, non un ipertesto
  // il testo dentro una sezione chiusa ha il suo conteggio: la prima occorrenza deve essere quella che si vede
  const linked = new Set([...root.querySelectorAll('a.glossary-link')].filter((a) => !a.closest('details:not([open])')).map((a) => a.dataset.term));
  const hidden = new Map();
  const seenFor = (node) => { const d = node.parentElement.closest('details:not([open])'); if (!d) return linked; if (!hidden.has(d)) hidden.set(d, new Set([...d.querySelectorAll('a.glossary-link')].map((a) => a.dataset.term))); return hidden.get(d); };
  for(const node of nodes) {
    const seen = seenFor(node);
    const scope=glossaryScopeOf(node.parentElement.closest('[data-glossary]'));
    aliasRe.lastIndex = 0;
    const matches = [...node.textContent.matchAll(aliasRe)];
    if(!matches.length) continue;
    const fragment = document.createDocumentFragment(); let pos = 0;
    for(const m of matches) {
      const start = m.index + m[1].length, word = m[2];
      const id = linkableGlossaryTerm(aliasMap,word,scope)?.id;
      if(!id || seen.has(id) || (pos && start - pos < 24)) continue;
      seen.add(id);
      fragment.append(document.createTextNode(node.textContent.slice(pos,start)));
      const a = document.createElement('a'); a.className = 'glossary-link'; a.dataset.term = id; a.href = `#/glossario/${id}`; a.setAttribute('aria-haspopup','dialog'); a.textContent = word;
      fragment.append(a); pos = start + word.length;
    }
    if(!pos)continue;
    fragment.append(document.createTextNode(node.textContent.slice(pos))); node.replaceWith(fragment);
  }
}

function closePanel(restore = true) {
  if (!active) return;
  const panel = active; active = null;
  if(panel.tagName === 'DIALOG') panel.close(); else if(panel.matches(':popover-open')) panel.hidePopover();
  opener?.setAttribute('aria-expanded','false');
  if(restore && opener?.isConnected) opener.focus({preventScroll:true});
}
function ensurePanel(mobile) {
  const id = mobile ? 'learning-sheet' : 'learning-popover';
  let panel = document.getElementById(id);
  if(panel) return panel;
  panel = document.createElement(mobile ? 'dialog' : 'div'); panel.id = id; panel.className = 'learning-panel'; panel.dataset.noGlossary = '';
  if(!mobile) { panel.setAttribute('popover','auto'); panel.setAttribute('role','dialog'); }
  panel.setAttribute('aria-labelledby', `${id}-title`);
  panel.addEventListener('load',()=>{if(active===panel&&!mobile)positionPopover(panel);},true);
  panel.addEventListener('click', e => {
    if(e.target.closest('dialog.lb'))return;
    if(e.target.closest('[data-learning-close]')) closePanel();
    else if(e.target.closest('a:not(.glossary-link)')) closePanel(false);
    else if(mobile && e.target === panel) { const r=panel.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) closePanel(); }
  });
  const dismissed = () => { if(active === panel) { active=null; opener?.setAttribute('aria-expanded','false'); const focus=document.activeElement; if(opener?.isConnected && (focus===document.body || panel.contains(focus))) opener.focus({preventScroll:true}); } };
  panel.addEventListener(mobile ? 'close' : 'toggle', e => { if(mobile || e.newState === 'closed') dismissed(); });
  document.body.append(panel); return panel;
}
function positionPopover(panel) {
  if(!opener?.isConnected) {closePanel(false);return;}
  const r=opener.getBoundingClientRect(), p=panel.getBoundingClientRect();
  const left=Math.max(12,Math.min(r.left,innerWidth-p.width-12));
  const below=r.bottom+10, top=below+p.height<=innerHeight-12 ? below : Math.max(12,r.top-p.height-10);
  panel.style.left=`${left}px`; panel.style.top=`${top}px`;
}
function openPanel(link, title, body, href, label, context) {
  const mobile = matchMedia('(max-width: 699px)').matches || !('showPopover' in HTMLElement.prototype);
  const panel = ensurePanel(mobile), prior = opener, same = active === panel;
  if(!same) closePanel(false);
  // Un popover sopra una scheda modale deve restare dentro il suo ambito attivo.
  if(!mobile) (link.closest('dialog[open]') || document.body).append(panel);
  opener = link.closest('.learning-panel') ? prior : link; active = panel;
  if(context)panel.dataset.glossaryContext=context;else delete panel.dataset.glossaryContext;
  panel.innerHTML = `<header><h2 id="${panel.id}-title">${esc(title)}</h2><button type="button" class="icon-btn" data-learning-close aria-label="Chiudi la spiegazione">×</button></header><div class="learning-panel-body">${body}</div><footer><a class="btn ghost" href="${esc(href)}">${esc(label)} →</a></footer>`;
  panel.scrollTop = 0;
  opener?.setAttribute('aria-expanded','true'); opener?.setAttribute('aria-controls',panel.id);
  if(mobile) {if(!panel.open)panel.showModal();else panel.querySelector('[data-learning-close]').focus({preventScroll:true});}
  else {
    if(!panel.matches(':popover-open'))panel.showPopover();
    positionPopover(panel);
    panel.querySelector('[data-learning-close]').focus({preventScroll:true});
  }
}

export function initLearning({glossary, trees,media,assetUrl}) {
  TERMS = Array.isArray(glossary?.terms) ? glossary.terms : []; TREES = trees?.trees || {};
  ILLUSTRATIONS=media?.terms||{};if(assetUrl)ASSET=assetUrl;
  aliasMap = buildGlossaryIndex(TERMS);
  const words=[...aliasMap.keys()].sort((a,b)=>b.length-a.length).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s+'));
  aliasRe=words.length ? new RegExp(`(^|[^\\p{L}\\p{N}])(${words.join('|')})(?=[^\\p{L}\\p{N}]|$)`,'giu') : null;
  document.addEventListener('click',e=>{
    const zoom=e.target.closest('[data-learning-image]');
    if(zoom){
      e.preventDefault();
      const images=imagesFor(zoom.dataset.learningImage);
      openLightbox(images.map(m=>({src:ASSET(m.file),alt:m.alt,caption:captionHtml({text:esc(m.caption),credit:imageCredit(m)})})),Number(zoom.dataset.imageIndex),{container:zoom.closest('.learning-panel')||document.body});
      return;
    }
    const link=e.target.closest('a.glossary-link,a.tree-link,a.species-link,a[data-entity]');
    if(!link || e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t=TERMS.find(x=>x.id===link.dataset.term);
    // il pannello usa l'ambito della zona da cui viene la parola, poi quello della pagina
    const zoneScope=link.closest('[data-glossary]')?glossaryScopeOf(link.closest('[data-glossary]')):'';
    const context=(GLOSSARY_CONTEXTS.includes(zoneScope)?zoneScope:'')||link.closest('[data-glossary-context]')?.dataset.glossaryContext||t?.category;
    let title,body,href,label;
    if(t) {title=t.term;body=termBody(t,true,context);href=`#/glossario/${t.id}`;label='Nel glossario';}
    else {
      const match=link.getAttribute('href')?.match(/^#\/(albero|pianta|specie|fungo|commestibile)\/([^/]+)$/);
      if(!match) return;
      if(openEntitySheet(link.getAttribute('href'),link)) {e.preventDefault();closePanel(false);}
      return;
    }
    e.preventDefault();openPanel(link,title,body,href,label,context);
  });
  addEventListener('hashchange',()=>closePanel(false));
  addEventListener('resize',()=>closePanel(false));
  addEventListener('scroll',()=>{if(active && active.tagName!=='DIALOG')positionPopover(active);},{passive:true});
  const main=document.querySelector('main');
  observer=new MutationObserver(()=>{
    observer.disconnect();
    main.querySelectorAll('.view:not([hidden])').forEach(enhanceGlossary);
    observer.observe(main,{childList:true,subtree:true,characterData:true});
  });
  observer.observe(main,{childList:true,subtree:true,characterData:true});
}

// «Bosco e sentiero» in Impara: le voci del glossario di bosco e sentiero (alberi e piante hanno il percorso guidato)
export function renderFieldIdentify(box) {
  box.dataset.glossaryContext='Bosco';
  box.innerHTML='<p class="learning-observe" data-glossary>Guarda il substrato, il margine del bosco e i segni sul sentiero. Queste voci aiutano a descrivere ciò che vedi.</p><div id="field-glossary"></div>';
  renderGlossary(box.querySelector('#field-glossary'), '', ['Bosco','Sentiero']);
}
