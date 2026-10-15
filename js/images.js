// Carica le foto solo avvicinandosi al viewport, mantenendo la geometria della
// scheda. Anche modali, accordion e copie offline usano gli stessi stati.
const tracked=new WeakMap();
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries)if(isIntersecting){observer.unobserve(target);start(target);}
},{rootMargin:'240px 0px'}):null;

// Punti di ritaglio (data/crop-points.json): per ogni foto la posizione CSS nei sei formati dell'app,
// come variabili sull'<img>; ogni contenitore usa la sua (css/style.css, «Punti di ritaglio»). Senza dati: centro.
const OP={'5:4':'--op-54','3:4':'--op-34','4:5':'--op-45','16:7':'--op-167','4:3':'--op-43','1:1':'--op-11'};
let CROPS=null;
const cropKey=src=>{const i=String(src||'').indexOf('assets/');return i<0?'':src.slice(i).split(/[?#]/)[0];};
export function applyCrop(img){
  const c=CROPS?.[cropKey(img.getAttribute('data-src')||img.getAttribute('src'))];
  for(const [k,v] of Object.entries(OP)){if(c?.[k])img.style.setProperty(v,`${Math.round(c[k][0]*1000)/10}% ${Math.round(c[k][1]*1000)/10}%`);else img.style.removeProperty(v);}
}
fetch('data/crop-points.json').then(r=>(r.ok?r.json():null)).then(d=>{CROPS=d?.files||{};document.querySelectorAll('img').forEach(applyCrop);}).catch(()=>{CROPS={};});
// Foto già scaricate e decodificate in questa sessione (o preparate al tocco da motion.js): quando ricompaiono
// in una pagina ridisegnata non aspettano il viewport e non ripassano dallo scheletro, si mostrano subito.
const known=new Set();
const abs=src=>{try{return new URL(src,document.baseURI).href;}catch{return '';}};
export const markKnown=src=>{const u=abs(src);if(u){known.add(u);if(known.size>400)known.delete(known.values().next().value);}};
function finish(img,state) {
  if(!img.isConnected)return;
  if(state==='ready')known.add(img.currentSrc||img.src);
  img.dataset.imageState=state;
  img.dispatchEvent(new CustomEvent('fungaroli:image-state',{bubbles:true,detail:{state}}));
}
function watch(img) {
  if(tracked.has(img))return;
  tracked.set(img,{source:''});
  img.decoding='async';
  img.addEventListener('load',async()=>{
    const source=img.getAttribute('src');
    // se decode() resta in sospeso (possibile con gli SVG in alcuni browser) l’immagine non resta «in caricamento»
    try {await Promise.race([img.decode(),new Promise(r=>setTimeout(r,800))]);}catch { /* il browser può aver già decodificato */ }
    if(img.getAttribute('src')===source&&img.naturalWidth){
      // arrivata subito dalla cache: niente dissolvenza (era il «lampeggio» al caricamento)
      if(performance.now()-(tracked.get(img)?.started??-1e9)<150)img.dataset.imageFast='1';
      finish(img,'ready');
    }
  });
  img.addEventListener('error',()=>{
    if(!img.getAttribute('src'))return;
    img.removeAttribute('src'); // niente icona rotta sopra testi e badge
    finish(img,'error');
  });
}
function start(img) {
  const source=img.dataset.src;
  if(!source||!img.isConnected)return;
  watch(img);tracked.get(img).source=source;
  img.loading='eager';
  img.removeAttribute('data-src');
  // foto già visibile che cambia (un'altra copertina): la vecchia resta finché la nuova non è pronta
  if(img.dataset.imageState==='ready'&&img.getAttribute('src')&&img.getAttribute('src')!==source){
    const next=new Image();next.decoding='async';
    next.onload=async()=>{try{await next.decode();}catch{/* già decodificata */} if(tracked.get(img)?.source===source){img.dataset.imageFast='1';img.src=source;}};
    next.onerror=()=>{if(tracked.get(img)?.source===source){img.dataset.imageState='loading';img.src=source;}};
    next.src=source;return;
  }
  img.dataset.imageState='loading';
  tracked.get(img).started=performance.now();
  img.src=source;
  // già in cache: nessuna dissolvenza, la foto c'è e basta
  if(img.complete&&img.naturalWidth){img.dataset.imageFast='1';finish(img,'ready');}
}
// Carica subito una foto (copertina della pagina che sta entrando) e risolve quando è pronta, in errore o senza foto.
export function loadNow(img) {
  if(!img)return Promise.resolve();
  if(img.dataset.src){observer?.unobserve(img);start(img);}
  if(img.dataset.imageState==='ready'||img.dataset.imageState==='error'||!img.getAttribute('src'))return Promise.resolve();
  return new Promise(resolve=>img.addEventListener('fungaroli:image-state',()=>resolve(),{once:true}));
}
export function setImageSource(img,source) {
  observer?.unobserve(img);watch(img);
  img.dataset.imageState='loading';
  tracked.get(img).source=source;
  img.src=source;
  if(img.complete&&img.naturalWidth)finish(img,'ready');
}
function prepare(img) {
  watch(img);
  if(CROPS)applyCrop(img);
  if(img.dataset.src){
    // una foto già mostrata che cambia sorgente si sostituisce senza tornare vuota
    if(img.dataset.imageState==='ready'&&img.getAttribute('src')){start(img);return;}
    img.dataset.imageState='waiting';
    if(img.fetchPriority==='high'||!observer||known.has(abs(img.dataset.src)))start(img);else observer.observe(img);
  }else if(img.getAttribute('src')){
    if(img.complete&&img.naturalWidth)finish(img,'ready');
    else img.dataset.imageState='loading';
  }
}
function scan(node,fn) {
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  if(node.matches('img'))fn(node);
  node.querySelectorAll('img').forEach(fn);
}
new MutationObserver(records=>{
  for(const r of records){
    if(r.type==='attributes'){if(r.target.dataset.imageState!=='error')prepare(r.target);continue;}
    r.removedNodes.forEach(n=>scan(n,img=>observer?.unobserve(img)));
    r.addedNodes.forEach(n=>scan(n,prepare));
  }
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-src']});
document.querySelectorAll('img').forEach(prepare);
