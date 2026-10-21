// Richiami editoriali su un livello distinto: nessun filtro, ritaglio o modifica del raster.
// Gli ancoraggi sono revisionati per il file esatto, mai dedotti dal nome del carattere.
let callouts = null;
let nextCallout=0;
const rasterSamples=new WeakMap();
export function calloutSvg(point) {
  if (!point || ![point.x,point.y].every(n=>Number.isFinite(n)&&n>=0&&n<=128)) return '';
  const {x,y}=point,id=`cmp-leader-${++nextCallout}`,end=Math.min(154,x+20);
  const path=`M154 64 C134 64 ${Math.min(134,x+28)} ${y} ${x+5} ${y}`;
  return `<svg class="cmp-callout" viewBox="0 0 160 128" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-ink" gradientUnits="userSpaceOnUse" x1="${x}" x2="${end}" y1="${y}" y2="${y}"><stop stop-color="var(--cmp-callout-tip)"/><stop offset="1" stop-color="var(--text-2)"/></linearGradient><linearGradient id="${id}-halo" gradientUnits="userSpaceOnUse" x1="${x}" x2="${end}" y1="${y}" y2="${y}"><stop stop-color="var(--cmp-callout-edge)"/><stop offset="1" stop-color="var(--surface)"/></linearGradient></defs><path class="cmp-callout-halo" d="${path}" stroke="url(#${id}-halo)"/><path d="${path}" stroke="url(#${id}-ink)"/><circle cx="${x}" cy="${y}" r="4"/></svg>`;
}
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
function localTone(image,point,slot){
  // Campiona soltanto il colore appena dentro il bordo già revisionato.
  // Questo non sceglie né sposta il punto anatomico e non modifica l'immagine.
  try{
    let cached=rasterSamples.get(image);
    if(cached?.src!==image.currentSrc){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,128,128);
      cached={src:image.currentSrc,pixels:ctx.getImageData(0,0,128,128).data};rasterSamples.set(image,cached);
    }
    const sum=[0,0,0];let weight=0;
    for(let y=Math.max(0,Math.floor(point.y)-3);y<=Math.min(127,Math.floor(point.y)+3);y++){
      for(let x=Math.max(0,Math.floor(point.x)-8);x<=Math.min(127,Math.floor(point.x)-2);x++){
        const i=(y*128+x)*4,a=cached.pixels[i+3]/255;if(a<.5)continue;
        weight+=a;sum.forEach((_,channel)=>sum[channel]+=cached.pixels[i+channel]*a);
      }
    }
    const style=getComputedStyle(slot),swatch=document.createElement('canvas');swatch.width=swatch.height=1;
    const ctx=swatch.getContext('2d',{willReadFrequently:true});
    const color=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
    const dark=luminance(color(style.getPropertyValue('--story-ink').trim()));
    const light=luminance(color(style.getPropertyValue('--story-avorio').trim()));
    const target=luminance(weight?sum.map(v=>v/weight):color(style.getPropertyValue('--surface').trim()));
    return contrast(light,target)>contrast(dark,target)?'light':'dark';
  }catch{return 'auto';} // Il bordo a contrasto resta leggibile anche senza accesso ai pixel.
}
function update(slot) {
  slot.querySelector('.cmp-callout')?.remove();
  delete slot.dataset.calloutTone;
  const image=slot.querySelector('img'), field=slot.closest('[data-trait]')?.dataset.trait;
  if (!image?.complete || !image.naturalWidth || !field || !callouts) return;
  const asset=new URL(image.src).pathname.replace(/^\//,'');
  const point=callouts.assets?.[asset]?.points?.[field];
  const svg=calloutSvg(point);
  if(svg){slot.dataset.calloutTone=localTone(image,point,slot);slot.insertAdjacentHTML('beforeend',svg);}
}
export function initTraitCallouts() {
  addEventListener('themechange',()=>document.querySelectorAll('.cmp-part-art').forEach(update));
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
