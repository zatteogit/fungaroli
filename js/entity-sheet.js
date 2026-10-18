import {registerEntityNavigation,rememberNavigationContext,pushEntityNavigation,backNavigation,dismissEntityNavigation,contextualBackTitle,navigateContextPage} from './navigation-context.js';
import {openModal,modalScrollPosition} from './modal-flow.js';
// Le schede contestuali usano gli stessi renderer delle pagine, senza cambiare rotta.
let renderEntity, enhance, dialog, origin, frames = [], sequence = 0, locked = false, historyTracked = false, silentCloses = 0;
const entityRoute = href => /^#\/(albero|pianta|specie|fungo|commestibile)\/[^/]+$/.test(href || '');

export function initEntitySheets(options) {
  renderEntity = options.render; enhance = options.enhance;
  addEventListener('hashchange', () => closeEntitySheet(false,{navigation:true}));
}

export function closeEntitySheet(restore = true, {navigation=false} = {}) {
  if (!dialog?.open) return;
  rememberNavigationContext();
  const target = origin, tracked=historyTracked;
  origin = null;
  silentCloses++;dialog.close();
  cleanup();
  if(tracked&&!navigation)dismissEntityNavigation();
  if (restore && target?.isConnected) target.focus({preventScroll:true});
}

function cleanup() {
  frames = [];historyTracked=false;
  dialog?.querySelector('[data-entity-content]')?.replaceChildren();
  if (locked) { document.documentElement.classList.remove('entity-open'); locked = false; }
}

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'entity-sheet'; dialog.className = 'entity-sheet';
  dialog.setAttribute('aria-labelledby', 'entity-sheet-title');
  dialog.innerHTML = '<header class="entity-toolbar"><button type="button" class="modal-flow-back" data-entity-back hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><span id="entity-sheet-title"></span><button type="button" class="icon-btn" data-entity-close aria-label="Chiudi la scheda">×</button></header><div data-entity-content></div><footer><a class="btn ghost" data-entity-page>Apri come pagina →</a></footer>';
  dialog.addEventListener('cancel', e => { e.preventDefault(); if(!historyTracked||!backNavigation())closeEntitySheet(); });
  dialog.addEventListener('close', () => {
    if(silentCloses){silentCloses--;return;}
    // Anche una chiusura nativa deve liberare il blocco dello scroll.
    if (!dialog.open) { const target = origin,tracked=historyTracked; origin = null; cleanup();if(tracked)dismissEntityNavigation(); target?.isConnected && target.focus({preventScroll:true}); }
  });
  dialog.addEventListener('click', e => {
    if (e.target.closest('[data-entity-close]')) { closeEntitySheet(); return; }
    if (e.target.closest('[data-entity-back]')) {
      if(historyTracked){if(!backNavigation())closeEntitySheet();return;}
      if (frames.length < 2) return;
      const old = frames.pop(); showFrame(frames.at(-1));
      old.trigger?.isConnected && old.trigger.focus({preventScroll:true});
      return;
    }
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeEntitySheet();
    }
    const link = e.target.closest('a[href^="#/"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!link.hasAttribute('data-entity-page') && entityRoute(link.getAttribute('href')) && openEntitySheet(link.getAttribute('href'), link)) e.preventDefault();
    else if (!link.classList.contains('glossary-link')) {const href=link.getAttribute('href');e.preventDefault();closeEntitySheet(false,{navigation:true});navigateContextPage(href);}
  });
  document.body.append(dialog);
  return dialog;
}

function showFrame(frame) {
  dialog.querySelector('[data-entity-content]').replaceChildren(frame.body);
  dialog.querySelector('#entity-sheet-title').textContent = frame.title;
  dialog.querySelector('[data-entity-page]').href = frame.href;
  const back=dialog.querySelector('[data-entity-back]');
  back.hidden=frames.length<2&&!historyTracked;
  back.setAttribute('aria-label',`Indietro: ${historyTracked?contextualBackTitle()||'pagina precedente':frames.at(-2)?.title||'pagina precedente'}`);
  dialog.scrollTop = frame.scroll;
  dialog.querySelector('[data-entity-close]').focus({preventScroll:true});
}

function namespaceIds(body) {
  const prefix = `entity-${++sequence}-`, ids = new Map();
  body.querySelectorAll('[id]').forEach(el => { ids.set(el.id, prefix + el.id); el.id = prefix + el.id; });
  body.querySelectorAll('*').forEach(el => {
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for', 'data-jump-k']) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, el.getAttribute(attr).split(' ').map(id => ids.get(id) || id).join(' '));
    }
    // SVG gradients and clip paths also need a local namespace.
    for (const attr of ['fill', 'stroke', 'clip-path', 'mask']) {
      const value = el.getAttribute(attr), match = value?.match(/^url\(#(.+)\)$/);
      if (match && ids.has(match[1])) el.setAttribute(attr, `url(#${ids.get(match[1])})`);
    }
  });
}

export function openEntitySheet(href, trigger = document.activeElement, {decorate} = {}) {
  if (!renderEntity || !entityRoute(href)) return false;
  rememberNavigationContext();
  const active=document.querySelector('dialog[open]:modal');
  const track=historyTracked||!active||active===dialog;
  const body = document.createElement('div'); body.className = 'entity-body';
  const title = renderEntity(body, href);
  if (!title) return false;
  decorate?.(body);
  ensureDialog();
  enhance?.(body); namespaceIds(body);
  if (dialog.open || dialog.hasAttribute('data-modal-suspended')) frames.at(-1).scroll = modalScrollPosition(dialog);
  else { origin = trigger; frames = []; }
  frames.push({body, href, title, trigger, scroll:0});
  historyTracked=track;
  showFrame(frames.at(-1));
  if (!dialog.open) {
    document.documentElement.classList.add('entity-open'); locked = true;
    openModal(dialog);
    dialog.scrollTop = frames.at(-1).scroll;
    dialog.querySelector('[data-entity-close]').focus({preventScroll:true});
  }
  if(historyTracked){pushEntityNavigation(title);dialog.querySelector('[data-entity-back]').setAttribute('aria-label',`Indietro: ${contextualBackTitle()}`);}
  return true;
}

registerEntityNavigation({
  capture(){
    if(!historyTracked||!frames.length)return null;
    if(dialog.open||dialog.hasAttribute('data-modal-suspended'))frames.at(-1).scroll=modalScrollPosition(dialog);
    const originHref=origin?.getAttribute?.('href'),links=[...document.querySelectorAll('.view:not([hidden]) a[href]')].filter(a=>a.getAttribute('href')===originHref);
    return {frames:frames.slice(),origin,originHref,originIndex:links.indexOf(origin)};
  },
  close(){closeEntitySheet(true,{navigation:true});},
  restore(snapshot){
    const previousTrigger=frames.at(-1)?.trigger;
    ensureDialog();frames=snapshot.frames.map(frame=>{
      if(frame.body)return frame;
      const body=document.createElement('div');body.className='entity-body';
      renderEntity(body,frame.href);enhance?.(body);namespaceIds(body);return {...frame,body};
    });historyTracked=true;
    origin=snapshot.origin?.isConnected?snapshot.origin:[...document.querySelectorAll('.view:not([hidden]) a[href]')].filter(a=>a.getAttribute('href')===snapshot.originHref)[Math.max(0,snapshot.originIndex)]||null;
    showFrame(frames.at(-1));
    document.documentElement.classList.add('entity-open');locked=true;
    if(!dialog.open)openModal(dialog);
    dialog.scrollTop=frames.at(-1).scroll;
    (previousTrigger?.isConnected&&dialog.contains(previousTrigger)?previousTrigger:dialog.querySelector('[data-entity-close]')).focus({preventScroll:true});
  }
});
