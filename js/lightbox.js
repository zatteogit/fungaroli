// Visore a schermo intero per foto e infografiche: pizzico/doppio tocco/rotellina per lo zoom,
// trascinamento per spostarsi, swipe o frecce per passare da un'immagine all'altra.
// Nessuna dipendenza esterna.
import {setImageSource} from './images.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MAX = 6;

let dlg, stage, img, cap, counter, items = [], index = 0;
let scale = 1, tx = 0, ty = 0;
const pointers = new Map();
let pinch = null, drag = null, lastTap = 0, swipe = null;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Visore immagini');
  dlg.innerHTML = `
    <div class="lb-stage" aria-busy="true"><img alt="" draggable="false"><p class="lb-loading" role="status">Carico la foto…</p><button type="button" class="lb-retry lb-btn" data-lb="retry" hidden>Riprova</button></div>
    <div class="lb-top">
      <span class="lb-count" aria-live="polite"></span>
      <div class="lb-tools">
        <button type="button" class="lb-btn" data-lb="out" aria-label="Riduci">−</button>
        <button type="button" class="lb-btn" data-lb="in" aria-label="Ingrandisci">+</button>
        <button type="button" class="lb-btn" data-lb="close" aria-label="Chiudi">✕</button>
      </div>
    </div>
    <button type="button" class="lb-nav lb-prev" data-lb="prev" aria-label="Immagine precedente">‹</button>
    <button type="button" class="lb-nav lb-next" data-lb="next" aria-label="Immagine successiva">›</button>
    <div class="lb-cap"></div>`;
  document.body.appendChild(dlg);
  stage = dlg.querySelector('.lb-stage');
  img = stage.querySelector('img');
  cap = dlg.querySelector('.lb-cap');
  counter = dlg.querySelector('.lb-count');
  stage.addEventListener('fungaroli:image-state',e=>{
    if(e.target!==img)return;
    const state=e.detail.state;
    stage.setAttribute('aria-busy',String(state==='loading'||state==='waiting'));
    stage.querySelector('.lb-loading').hidden=state==='ready';
    stage.querySelector('.lb-loading').textContent=state==='error'?'Foto non disponibile.':'Carico la foto…';
    stage.querySelector('.lb-retry').hidden=state!=='error';
  });

  dlg.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]')?.dataset.lb;
    if (a === 'close') dlg.close();
    if (a === 'prev') show(index - 1);
    if (a === 'next') show(index + 1);
    if (a === 'in') zoomAt(scale * 1.6);
    if (a === 'out') zoomAt(scale / 1.6);
    if (a === 'retry') show(index);
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === '+' || e.key === '=') zoomAt(scale * 1.6);
    if (e.key === '-') zoomAt(scale / 1.6);
  });
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('lb-open'); });

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  }, { passive: false });
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
}

function apply() {
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  dlg.classList.toggle('zoomed', scale > 1.01);
}

function clampPan() {
  const r = stage.getBoundingClientRect();
  const w = img.offsetWidth * scale, h = img.offsetHeight * scale;
  const mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
  tx = Math.max(-mx, Math.min(mx, tx));
  ty = Math.max(-my, Math.min(my, ty));
}

function zoomAt(next, cx, cy) {
  const r = stage.getBoundingClientRect();
  const ox = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
  const oy = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
  const s = Math.max(1, Math.min(MAX, next));
  // mantiene fermo il punto sotto le dita / il cursore
  tx = ox - ((ox - tx) * s) / scale;
  ty = oy - ((oy - ty) * s) / scale;
  scale = s;
  if (scale === 1) { tx = 0; ty = 0; }
  clampPan();
  apply();
}

function onDown(e) {
  if(e.target.closest('button,a'))return;
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
    drag = null; swipe = null;
  } else if (pointers.size === 1) {
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    swipe = scale <= 1.01 ? { x: e.clientX, y: e.clientY, t: Date.now() } : null;
    const now = Date.now();
    if (now - lastTap < 300) { zoomAt(scale > 1.01 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; drag = null; swipe = null; }
    else lastTap = now;
  }
}

function onMove(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt(pinch.s * (d / pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
  } else if (drag && scale > 1.01) {
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    clampPan();
    apply();
  }
}

function onUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (swipe && pointers.size === 0) {
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - swipe.t < 600) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) dlg.close(); // trascina giu' per chiudere
  }
  if (pointers.size === 0) { drag = null; swipe = null; }
}

function show(i) {
  if (!items.length) return;
  index = (i + items.length) % items.length;
  const it = items[index];
  scale = 1; tx = 0; ty = 0; apply();
  stage.setAttribute('aria-busy','true');
  stage.querySelector('.lb-loading').hidden=false;
  stage.querySelector('.lb-loading').textContent='Carico la foto…';
  stage.querySelector('.lb-retry').hidden=true;
  setImageSource(img,it.src);
  img.alt = it.alt || '';
  cap.innerHTML = it.caption || '';
  counter.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : '';
  dlg.classList.toggle('single', items.length < 2);
}

// items: [{ src, alt, caption (HTML gia' sanificato) }]
export function openLightbox(list, start = 0, {container=document.body} = {}) {
  if (!dlg) build();
  container.append(dlg);
  items = list;
  show(start);
  document.documentElement.classList.add('lb-open');
  if (!dlg.open) dlg.showModal();
}

export const captionHtml = ({ title, text, credit }) =>
  `${title ? `<b>${title}</b>` : ''}${text ? `<span>${text}</span>` : ''}${credit ? `<small>${credit}</small>` : ''}`;

export { esc as escLb };
