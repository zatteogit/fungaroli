import './modal-flow.js';
// Blocco condiviso per il dialog attivo e i passaggi conservati dal percorso.
// Nessun position:fixed sul body: intestazione e navigazione mantengono il viewport.
const root = document.documentElement;
let saved = null, opening = null, touch = null;
const layers = [];
function topModal() {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (!layers[i].isConnected || !layers[i].matches('dialog[open]:modal')) layers.splice(i, 1);
  }
  for (const dialog of document.querySelectorAll('dialog[open]:modal')) {
    if (!layers.includes(dialog)) layers.push(dialog);
  }
  return layers.at(-1);
}

function sync() {
  const modal = topModal();
  if (modal && !saved) {
    saved = opening || {x:scrollX, y:scrollY, hash:location.hash};
    root.classList.add('modal-scroll-locked');
  } else if (!modal && saved) {
    const position = saved;
    saved = null;
    root.classList.remove('modal-scroll-locked');
    // Una navigazione verso un'altra pagina mantiene la propria gestione dello scroll.
    if (position.hash === location.hash) scrollTo({left:position.x, top:position.y, behavior:'instant'});
  }
  opening = null;
  fitViewport();
}

let viewportFrame = 0;
function fitViewport() {
  const viewport = window.visualViewport, top = viewport?.offsetTop || 0, height = viewport?.height || innerHeight;
  root.style.setProperty('--modal-visible-top', `${top}px`);
  root.style.setProperty('--modal-visible-height', `${height}px`);
  const modal = topModal();
  root.classList.toggle('modal-viewport-constrained', !!modal && (top > 1 || height < innerHeight - 1));
  const field = document.activeElement;
  if (modal && field?.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),textarea,[contenteditable="true"]') && modal.contains(field)) {
    const box = modal.getBoundingClientRect(), header = modal.querySelector('.report-header,.cmp-chooser-head,.account-header')?.getBoundingClientRect();
    const upper = Math.max(top + 12, box.top + 12, header?.bottom || 0) + 8;
    const lower = Math.min(top + height - 12, box.bottom - 12), rect = field.getBoundingClientRect();
    const delta = rect.top < upper ? rect.top - upper : rect.bottom > lower ? rect.bottom - lower : 0;
    // Scorre soltanto il contenuto della modale, mai il documento sottostante.
    if (delta) for (let node = field.parentElement; node; node = node.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) {
        node.scrollTop += delta; break;
      }
      if (node === modal) break;
    }
  }
  window.dispatchEvent(new Event('modalviewportchange'));
}
function scheduleViewport() {
  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(fitViewport);
}
window.visualViewport?.addEventListener('resize', scheduleViewport, {passive:true});
window.visualViewport?.addEventListener('scroll', scheduleViewport, {passive:true});
window.addEventListener('resize', scheduleViewport, {passive:true});
document.addEventListener('focusin', scheduleViewport);

document.addEventListener('beforetoggle', event => {
  if (!(event.target instanceof HTMLDialogElement)) return;
  if (event.newState === 'open') {
    const index = layers.indexOf(event.target);
    if (index >= 0) layers.splice(index, 1);
    layers.push(event.target);
    if (!saved) opening = {x:scrollX, y:scrollY, hash:location.hash};
  }
  queueMicrotask(sync);
}, true);
document.addEventListener('close', sync, true);
new MutationObserver(records => {
  if (records.some(record => record.type === 'attributes' && record.target instanceof HTMLDialogElement ||
    [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
      (node.matches('dialog') || node.querySelector('dialog[open]'))))) sync();
}).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['open']});

// Safari può propagare il gesto alla pagina anche con overflow:hidden sul documento.
// Lascia scorrere i contenitori della modale; ferma il gesto soltanto al loro limite.
function canScroll(target, dx, dy, modal) {
  if (!modal.contains(target)) return false;
  for (let el = target; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1 &&
        (dy < 0 ? el.scrollTop > 0 : el.scrollTop < el.scrollHeight - el.clientHeight - 1)) return true;
    } else if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1 &&
      (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft < el.scrollWidth - el.clientWidth - 1)) return true;
    if (el === modal) break;
  }
  return false;
}

document.addEventListener('touchstart', event => {
  touch = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
}, {passive:true});
document.addEventListener('touchmove', event => {
  if (!saved) return;
  const modal = topModal();
  if (!modal || !touch || event.touches.length !== 1) return;
  const next = event.touches[0], dx = touch.x - next.clientX, dy = touch.y - next.clientY;
  touch = {x:next.clientX, y:next.clientY};
  if ((!dx && !dy) || event.target.closest('input[type="range"]')) return;
  if (!canScroll(event.target, dx, dy, modal) && event.cancelable) event.preventDefault();
}, {passive:false});
document.addEventListener('touchend', () => { touch = null; }, {passive:true});
document.addEventListener('touchcancel', () => { touch = null; }, {passive:true});
document.addEventListener('wheel', event => {
  if (!saved) return;
  const modal = topModal();
  if (!modal || event.ctrlKey || (!event.deltaX && !event.deltaY)) return;
  if (!canScroll(event.target, event.deltaX, event.deltaY, modal) && event.cancelable) event.preventDefault();
}, {passive:false});
sync();
