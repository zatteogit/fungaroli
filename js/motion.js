// Movimento: transizioni tra le viste (View Transitions), foto che "volano" dalla card alla testata,
// riordino animato delle liste, fogli trascinabili, conteggi. Con prefers-reduced-motion tutto si spegne.

import { loadNow, markKnown } from './images.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
// Sui dispositivi iOS le snapshot di navigazione possono disancorare la barra fissa
// durante lo scroll o il ridimensionamento del viewport. Restano le microanimazioni CSS.
const iosSnapshots = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canVT = () => typeof document.startViewTransition === 'function' && !reduce.matches && !iosSnapshots;
if (canVT()) root.classList.add('vt');

// Durate e curve stanno nei token CSS (--nav-*, css/style.css «movimento»). Qui solo il tetto di attesa:
// la pagina che entra aspetta la sua copertina al massimo READY_CAP ms, poi entra con lo scheletro della foto.
export const READY_CAP = 280;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// l'ultima immagine toccata prima di cambiare vista: e' quella che diventa la testata
let tapped = null;
document.addEventListener('click', (e) => {
  const el = e.target.closest('a[href^="#/"], [data-species], [data-go-zone]');
  // la copertina ha un link sovrapposto (senza immagine dentro): la foto e' quella della card
  tapped = photoIn(el);
}, true);
const photoIn = (el) => (el?.closest('.cover') || el)?.querySelector('img') || null;

// Preparazione al tocco (pointerdown) e al passaggio del mouse: la copertina della pagina di destinazione
// si scarica e si decodifica mentre il dito è ancora giù. I dati delle pagine sono già in memoria.
let coverOf = null;
export function setCoverResolver(fn) { coverOf = fn; }
const warm = new Map();
export function warmImage(src) {
  if (!src || warm.has(src)) return warm.get(src);
  const im = new Image();
  im.decoding = 'async';
  im.src = src;
  const p = im.decode().then(() => markKnown(src), () => {});
  warm.set(src, p);
  // poche copertine alla volta: l'oggetto Image tiene la foto decodificata finché serve
  if (warm.size > 16) warm.delete(warm.keys().next().value);
  return p;
}
function prepareFor(target) {
  const a = target?.closest?.('a[href^="#/"]');
  if (!a || !coverOf) return;
  try { warmImage(coverOf(a.getAttribute('href'))); } catch { /* destinazione senza copertina */ }
}
document.addEventListener('pointerdown', (e) => prepareFor(e.target), { capture: true, passive: true });
let hoverT = null;
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  clearTimeout(hoverT);
  const t = e.target;
  hoverT = setTimeout(() => prepareFor(t), 80);
}, { passive: true });
document.addEventListener('focusin', (e) => prepareFor(e.target));

const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
const readyPhoto=el=>el?.complete&&el.naturalWidth>0&&el.dataset.imageState!=='loading'&&el.dataset.imageState!=='waiting';
let transition=null,revision=0;
function settle(vt,cleanup){
  transition=vt;
  // Una transizione interrotta è prevista durante tocchi rapidi, non un errore.
  vt.ready.catch(()=>{});
  vt.finished.then(()=>{},()=>{}).finally(()=>{cleanup?.();if(transition===vt){transition=null;delete root.dataset.nav;}});
}
const heroImg = () => document.querySelector('.view:not([hidden]) .phero-img img');
// la testata intera (foto, titolo, indice): è lei la destinazione della foto toccata, così il titolo resta sopra la foto in volo
const heroBox = (img) => img?.closest('.phero') || img;
// la card che porta alla pagina appena lasciata (per il ritorno della foto): link con la foto dentro o copertina della home
function cardPhoto(back) {
  const id = back.split('/')[2] || '';
  const link = document.querySelector(`.view:not([hidden]) a[href="${CSS.escape(back)}"]`);
  return photoIn(link) || document.querySelector(`.view:not([hidden]) [data-species="${CSS.escape(id)}"] img`);
}
// la foto è pronta entro il tetto? (scaricata e decodificata; senza foto non c'è niente da aspettare)
async function ready(img) {
  if (!img) return;
  await Promise.race([loadNow(img), wait(READY_CAP)]);
  // arrivata durante l'attesa, mentre la vista vecchia è ancora ferma: niente dissolvenza, entra già piena
  if (img.dataset.imageState === 'ready') img.dataset.imageFast = '1';
}

// "fresco" per un attimo dopo un cambio di vista: anelli e liste entrano animati solo li', non a ogni filtro.
// Tornando indietro no: la pagina è quella che hai lasciato, ferma dove l'avevi lasciata.
let freshT;
function fresh(nav) {
  if (reduce.matches || nav === 'pop') return;
  root.classList.add('fresh');
  clearTimeout(freshT);
  freshT = setTimeout(() => root.classList.remove('fresh'), 900);
}

// nav: 'push' (piu' in profondita'), 'pop' (indietro), 'left'/'right' (tra sezioni e schede: dissolvenza), 'none'
// Durante la transizione <html data-nav> dice la direzione (la usa il CSS e la verificano i test).
export function navigate(update, { nav = 'none', back = '' } = {}) {
  const current=++revision;
  if(transition){transition.skipTransition();update();fresh(nav);tapped=null;return;}
  if (!canVT() || nav === 'none') { update(); fresh(nav); countUp(); tapped = null; return; }
  root.dataset.nav = nav;
  let from = null;
  if (nav === 'push' && readyPhoto(tapped) && inView(tapped)) from = tapped;
  if (nav === 'pop' && readyPhoto(heroImg()) && inView(heroImg())) from = heroBox(heroImg());
  if (from) from.style.viewTransitionName = 'hero';
  let to = null;
  const sheets = [];
  const liftSheet = hero => {
    const sheet = hero?.parentElement?.querySelector('.pbody');
    if (sheet) { sheet.style.viewTransitionName = 'detail-sheet'; sheets.push(sheet); }
  };
  if (from && nav === 'pop') liftSheet(from);
  const vt = document.startViewTransition(async () => {
    if (from) from.style.viewTransitionName = '';
    if(current!==revision)return;
    update();
    fresh(nav);
    countUp();
    // la pagina nuova non entra a metà: aspetta la sua copertina (o la foto della card a cui torni) fino al tetto
    let photo = null;
    if (nav === 'push') photo = heroImg();
    if (nav === 'pop' && back) { photo = cardPhoto(back); if (photo && !inView(photo)) photo = null; }
    await ready(photo);
    if (current !== revision) return;
    if (from && readyPhoto(photo)) { to = nav === 'push' ? heroBox(photo) : photo; to.style.viewTransitionName = 'hero'; if (nav === 'push') liftSheet(to); }
  });
  settle(vt,()=>{if(from)from.style.viewTransitionName='';if(to)to.style.viewTransitionName='';for(const sheet of sheets)sheet.style.viewTransitionName='';});
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
