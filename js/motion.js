// Movimento: transizioni tra le viste (View Transitions), foto che "volano" dalla card alla testata,
// riordino animato delle liste, fogli trascinabili, conteggi. Con prefers-reduced-motion tutto si spegne.

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
export const canVT = () => typeof document.startViewTransition === 'function' && !reduce.matches;
if (canVT()) root.classList.add('vt');

// l'ultima immagine toccata prima di cambiare vista: e' quella che diventa la testata
let tapped = null;
document.addEventListener('click', (e) => {
  const el = e.target.closest('a[href^="#/"], [data-species], [data-go-zone]');
  // la copertina ha un link sovrapposto (senza immagine dentro): la foto e' quella della card
  tapped = (el?.closest('.cover') || el)?.querySelector('img') || null;
}, true);

const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
const readyPhoto=el=>el?.complete&&el.naturalWidth>0;
let transition=null,revision=0;
function settle(vt,cleanup){
  transition=vt;
  // Una transizione interrotta è prevista durante tocchi rapidi, non un errore.
  vt.ready.catch(()=>{});
  vt.finished.then(()=>{},()=>{}).finally(()=>{cleanup?.();if(transition===vt){transition=null;delete root.dataset.nav;}});
}
const heroImg = () => document.querySelector('.view:not([hidden]) .phero-img img');

// "fresco" per un attimo dopo un cambio di vista: anelli e liste entrano animati solo li', non a ogni filtro
let freshT;
function fresh() {
  if (reduce.matches) return;
  root.classList.add('fresh');
  clearTimeout(freshT);
  freshT = setTimeout(() => root.classList.remove('fresh'), 900);
}

// nav: 'push' (piu' in profondita'), 'pop' (indietro), 'left'/'right' (tra schede), 'none'
export function navigate(update, { nav = 'none', back = '' } = {}) {
  const current=++revision;
  if(transition){transition.skipTransition();update();tapped=null;return;}
  if (!canVT() || nav === 'none') { update(); fresh(); countUp(); tapped = null; return; }
  root.dataset.nav = nav;
  let from = null;
  if (nav === 'push' && readyPhoto(tapped) && inView(tapped)) from = tapped;
  if (nav === 'pop' && readyPhoto(heroImg())) from = heroImg();
  if (from) from.style.viewTransitionName = 'hero';
  const vt = document.startViewTransition(() => {
    if (from) from.style.viewTransitionName = '';
    if(current!==revision)return;
    update();
    fresh();
    countUp();
    let to = null;
    if (nav === 'push' && from) to = heroImg();
    if (nav === 'pop' && from && back) {
      const id = back.split('/')[2];
      to = document.querySelector(`.view:not([hidden]) a[href="${CSS.escape(back)}"] img, .view:not([hidden]) [data-species="${CSS.escape(id || '')}"] img`);
      if (to && !inView(to)) to = null;
    }
    if (to && readyPhoto(to)) { to.style.viewTransitionName = 'hero'; vt.finished.then(()=>{},()=>{}).finally(() => { to.style.viewTransitionName = ''; }); }
  });
  settle(vt,()=>{if(from)from.style.viewTransitionName='';});
  tapped = null;
}

// aggiornamento nella stessa vista (filtri, giorno, risposte): gli elementi con un nome si spostano, il resto sfuma
// tocchi veloci: se una transizione e' ancora in corso, l'aggiornamento successivo si applica subito
export function soft(update) {
  const current=++revision;
  if(transition){transition.skipTransition();update();return;}
  if (!canVT()) { update(); return; }
  root.dataset.nav = 'soft';
  settle(document.startViewTransition(()=>{if(current===revision)update();}));
}

// numeri degli anelli: contano da 0 al valore quando la vista e' appena entrata
function countUp() {
  if (reduce.matches || !root.classList.contains('fresh')) return;
  document.querySelectorAll('.view:not([hidden]) .ring b').forEach((b) => {
    const final=b.textContent,to = Number(final.replace(',','.'));
    if (!Number.isFinite(to) || to <= 0 || b.dataset.counted) return;
    b.dataset.counted = '1';
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      if(!b.isConnected)return;
      b.textContent = k===1?final:(to * (1 - (1 - k) ** 3)).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1});
      if (k < 1) requestAnimationFrame(step);
    };
    b.textContent = '0';
    requestAnimationFrame(step);
  });
}

// fogli dal basso: si chiudono anche trascinandoli giu' dalla parte alta
function sheetDrag(dlg) {
  let y0 = null, dy = 0, t0 = 0;
  dlg.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('[data-drag]');
    if (e.pointerType === 'mouse' || (!handle && e.clientY - dlg.getBoundingClientRect().top > 56) || dlg.scrollTop > 0) return;
    if (e.target.closest('button, a, input, select, textarea, summary')) return;
    y0 = e.clientY; dy = 0; t0 = performance.now();
    dlg.classList.add('dragging');
  });
  dlg.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    // giu' chiude; su (se il pannello ha una scheda completa) la apre, con un po' di resistenza
    dy = e.clientY - y0;
    if (dy < 0 && !dlg.dataset.expand) dy = 0;
    dlg.style.transform = `translateY(${dy < 0 ? dy * 0.45 : dy}px)`;
  });
  const end = () => {
    if (y0 == null) return;
    const v = dy / Math.max(1, performance.now() - t0);
    y0 = null;
    dlg.classList.remove('dragging');
    dlg.style.transform = '';
    if (dy > 110 || v > 0.6) dlg.close();
    else if (dlg.dataset.expand && (dy < -70 || v < -0.6)) { const to = dlg.dataset.expand; dlg.close(); location.hash = to; }
  };
  dlg.addEventListener('pointerup', end);
  dlg.addEventListener('pointercancel', end);
}
const watched = new WeakSet();
function watchSheets() {
  document.querySelectorAll('dialog.sheet-dlg').forEach((d) => { if (!watched.has(d)) { watched.add(d); sheetDrag(d); } });
}
new MutationObserver(watchSheets).observe(document.body, { childList: true });
watchSheets();

// vibrazione minima dove c'e' (Android): conferma tattile delle scelte
export const tick = () => { try { if (!reduce.matches) navigator.vibrate?.(6); } catch { /* non supportato */ } };
