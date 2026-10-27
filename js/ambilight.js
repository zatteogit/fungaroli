// Alone «ambilight» delle pagine di dettaglio (zona, fungo, specie, pianta, albero): dietro la testata fotografica
// (.phero) c'è una copia della stessa foto, nella versione normale (mai l'HD), sfocata, un po' più satura e
// ingrandita. Sporge dai bordi come luce colorata. Niente campionamento dei colori: la foto stessa è la luce.
// La copia è un fratello inserito PRIMA della testata (la testata ha overflow: hidden), con posizione assoluta
// allineata a lei, senza eventi e nascosta ai lettori di schermo. In home (copertina .cover, card) niente alone.
// Compare solo con la foto (dissolvenza in css/fronda.css), la segue quando cambia (cambio di giorno: stessa
// dissolvenza della copertina) ed è spenta con «riduci trasparenza».
import {effectsQuality,EFFECTS_CHANGE} from './adaptive-effects.js';
const SMALL = (src) => src.replace(/-hd(\.(?:webp|jpe?g|png|avif))(?=$|[?#])/i, '$1');
const abs = (src) => new URL(src, location.href).href;
const transparency = matchMedia('(prefers-reduced-transparency: reduce)');
const off = () => transparency.matches || effectsQuality()==='minimal';
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || effectsQuality()!=='full';
let sizes;

// la copia segue posizione e misura della testata (barra degli indirizzi, rotazione, larghezza della colonna)
function place(phero) {
  const a = phero.previousElementSibling;
  if (!a?.classList.contains('ambi')) return;
  Object.assign(a.style, { top: `${phero.offsetTop}px`, left: `${phero.offsetLeft}px`, width: `${phero.offsetWidth}px`, height: `${phero.offsetHeight}px` });
}
function host(phero) {
  let a = phero.previousElementSibling;
  if (a?.classList.contains('ambi')) return a;
  a = document.createElement('span');
  a.className = 'ambi';
  a.setAttribute('aria-hidden', 'true');
  // il confronto dell'HTML nelle pagine aggiornate sul posto (js/weather-dom.js) lascia stare questo nodo
  a.dataset.domKeep = '';
  phero.before(a);
  sizes ||= new ResizeObserver((entries) => entries.forEach((e) => place(e.target)));
  sizes.observe(phero);
  return a;
}
// mostra nell'alone la foto `src` (già scelta per la copertina): prima si decodifica, poi entra in dissolvenza
export function ambiFollow(phero, src) {
  if (!phero?.matches('#views .phero') || !src || off()) return;
  const a = host(phero), want = abs(SMALL(src)), cover = phero.querySelector('.phero-img > img:not(.phero-xfade)');
  place(phero);
  if (a.dataset.want === want) return;
  a.dataset.want = want;
  const pic = new Image();
  pic.alt = ''; pic.decoding = 'async'; pic.draggable = false;
  if (cover) pic.style.objectPosition = getComputedStyle(cover).objectPosition;
  const show = (expected) => {
    if (a.dataset.want !== expected || !a.isConnected || off()) return;
    const old = [...a.children];
    a.append(pic);
    if (!old.length || still()) { old.forEach((n) => n.remove()); a.classList.add('on'); return; }
    pic.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }).finished.then(() => old.forEach((n) => n.remove()), () => {});
  };
  pic.src = want;
  pic.decode().then(() => show(want), () => {
    // la versione normale manca: si usa la foto della copertina (già scaricata)
    const full = abs(src);
    if (a.dataset.want !== want || full === want) return;
    a.dataset.want = full; pic.src = full;
    pic.decode().then(() => show(full), () => {});
  });
}
export function initAmbilight() {
  const sync=()=>{
    if(off()){
      for(const a of document.querySelectorAll('#views .ambi')){
        const hero=a.nextElementSibling;
        if(hero?.matches('.phero'))sizes?.unobserve(hero);
        a.remove();
      }
      return;
    }
    for(const hero of document.querySelectorAll('.view:not([hidden]) .phero')){
      const img=hero.querySelector('.phero-img > img:not(.phero-xfade)');
      if(img?.complete&&img.naturalWidth)ambiFollow(hero,img.currentSrc||img.src);
    }
  };
  document.addEventListener(EFFECTS_CHANGE,sync);
  transparency.addEventListener('change',sync);
  new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.body,{attributes:true,attributeFilter:['data-page']});
  // la copertina pronta (anche dopo un cambio di sorgente) porta con sé l'alone
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.matches('.phero-img > img:not(.phero-xfade)')) ambiFollow(img.closest('.phero'), img.currentSrc || img.src);
  }, true);
}
