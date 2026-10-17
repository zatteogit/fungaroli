// Le schede contestuali usano gli stessi renderer delle pagine, senza cambiare rotta.
let renderEntity, enhance, dialog, origin, frames = [], sequence = 0, locked = false;
const entityRoute = href => /^#\/(albero|pianta|specie|fungo|commestibile)\/[^/]+$/.test(href || '');

export function initEntitySheets(options) {
  renderEntity = options.render; enhance = options.enhance;
  addEventListener('hashchange', () => closeEntitySheet(false));
}

export function closeEntitySheet(restore = true) {
  if (!dialog?.open) return;
  const target = origin;
  origin = null;
  dialog.close();
  cleanup();
  if (restore && target?.isConnected) target.focus({preventScroll:true});
}

function cleanup() {
  frames = [];
  dialog?.querySelector('[data-entity-content]')?.replaceChildren();
  if (locked) { document.documentElement.classList.remove('entity-open'); locked = false; }
}

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'entity-sheet'; dialog.className = 'entity-sheet';
  dialog.setAttribute('aria-labelledby', 'entity-sheet-title');
  dialog.innerHTML = '<header class="entity-toolbar"><button type="button" class="btn ghost" data-entity-back hidden>← Indietro</button><span id="entity-sheet-title"></span><button type="button" class="icon-btn" data-entity-close aria-label="Chiudi la scheda">×</button></header><div data-entity-content></div><footer><a class="btn ghost" data-entity-page>Apri come pagina →</a></footer>';
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeEntitySheet(); });
  dialog.addEventListener('close', () => {
    // Anche una chiusura nativa deve liberare il blocco dello scroll.
    if (!dialog.open) { const target = origin; origin = null; cleanup(); target?.isConnected && target.focus({preventScroll:true}); }
  });
  dialog.addEventListener('click', e => {
    if (e.target.closest('[data-entity-close]')) { closeEntitySheet(); return; }
    if (e.target.closest('[data-entity-back]')) {
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
    else if (!link.classList.contains('glossary-link')) closeEntitySheet(false);
  });
  document.body.append(dialog);
  return dialog;
}

function showFrame(frame) {
  dialog.querySelector('[data-entity-content]').replaceChildren(frame.body);
  dialog.querySelector('#entity-sheet-title').textContent = frame.title;
  dialog.querySelector('[data-entity-page]').href = frame.href;
  dialog.querySelector('[data-entity-back]').hidden = frames.length < 2;
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
  const body = document.createElement('div'); body.className = 'entity-body';
  const title = renderEntity(body, href);
  if (!title) return false;
  decorate?.(body);
  ensureDialog();
  enhance?.(body); namespaceIds(body);
  if (dialog.open) frames.at(-1).scroll = dialog.scrollTop;
  else { origin = trigger; frames = []; }
  frames.push({body, href, title, trigger, scroll:0});
  showFrame(frames.at(-1));
  if (!dialog.open) {
    document.documentElement.classList.add('entity-open'); locked = true;
    dialog.showModal();
    dialog.querySelector('[data-entity-close]').focus({preventScroll:true});
  }
  return true;
}
