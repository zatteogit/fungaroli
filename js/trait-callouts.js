// Richiami editoriali su un livello distinto: nessun filtro, ritaglio o modifica del raster.
// Gli ancoraggi sono revisionati per il file esatto, mai dedotti dal nome del carattere.
let callouts = null;
export function calloutSvg(point) {
  if (!point || ![point.x,point.y].every(n=>Number.isFinite(n)&&n>=0&&n<=128)) return '';
  const {x,y}=point, tip=x+4;
  return `<svg class="cmp-callout" viewBox="0 0 160 128" aria-hidden="true" focusable="false"><path d="M154 64 H140 V${y} H${tip} M${tip+8} ${y-5} L${tip} ${y} L${tip+8} ${y+5}"/></svg>`;
}
function update(slot) {
  slot.querySelector('.cmp-callout')?.remove();
  const image=slot.querySelector('img'), field=slot.closest('[data-trait]')?.dataset.trait;
  if (!image?.complete || !image.naturalWidth || !field || !callouts) return;
  const asset=new URL(image.src).pathname.replace(/^\//,'');
  const point=callouts.assets?.[asset]?.points?.[field];
  const svg=calloutSvg(point);
  if(svg)slot.insertAdjacentHTML('beforeend',svg);
}
export function initTraitCallouts() {
  document.addEventListener('load',event=>{
    if(event.target instanceof HTMLImageElement){
      const slot=event.target.closest('.cmp-part-art');if(slot)update(slot);
    }
  },true);
  // Il vecchio richiamo sparisce subito quando il selettore cambia file.
  const observer=new MutationObserver(records=>{
    for(const record of records)if(record.target instanceof HTMLImageElement){
      const slot=record.target.closest('.cmp-part-art');if(slot)update(slot);
    }
  });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['src']});
  fetch('data/trait-callouts.json').then(r=>r.ok?r.json():null).then(data=>{
    callouts=data;document.querySelectorAll('.cmp-part-art').forEach(update);
  }).catch(()=>{});
}
