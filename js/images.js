// Carica le foto solo avvicinandosi al viewport, mantenendo la geometria della
// scheda. Anche modali, accordion e copie offline usano gli stessi stati.
const tracked=new WeakMap();
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries)if(isIntersecting){observer.unobserve(target);start(target);}
},{rootMargin:'240px 0px'}):null;

function finish(img,state) {
  if(!img.isConnected)return;
  img.dataset.imageState=state;
  img.dispatchEvent(new CustomEvent('fungaroli:image-state',{bubbles:true,detail:{state}}));
}
function watch(img) {
  if(tracked.has(img))return;
  tracked.set(img,{source:''});
  img.decoding='async';
  img.addEventListener('load',async()=>{
    const source=img.getAttribute('src');
    try {await img.decode();}catch { /* il browser può aver già decodificato */ }
    if(img.getAttribute('src')===source&&img.naturalWidth)finish(img,'ready');
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
  img.dataset.imageState='loading';
  img.loading='eager';
  img.removeAttribute('data-src');img.src=source;
  if(img.complete&&img.naturalWidth)finish(img,'ready');
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
  if(img.dataset.src){
    img.dataset.imageState='waiting';
    if(img.fetchPriority==='high'||!observer)start(img);else observer.observe(img);
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
