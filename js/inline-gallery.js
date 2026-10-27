import {openLightbox} from './lightbox.js';
import {applyCrop,markKnown} from './images.js';

// One stationary image frame: page controls and thumbnails share the selected photo.
export function mountInlineGallery(root,items,{selector='[data-photo]',indexOf=button=>Number(button.dataset.photo)}={}){
 const frame=root.querySelector('.phero-img'),hero=frame?.closest('.phero'),image=frame?.querySelector('img');
 if(!frame||!hero||!image||!items.length)return;
 let current=0,wanted=0,revision=0,outgoing=null,animation=null;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let controls,counter,status;
 if(items.length>1){
  controls=document.createElement('div');controls.className='inline-gallery-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Scorri le fotografie');
  controls.innerHTML='<button type="button" data-gallery-prev aria-label="Foto precedente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><span data-gallery-counter role="status" aria-live="polite" aria-atomic="true"></span><button type="button" data-gallery-next aria-label="Foto successiva"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>';
  counter=controls.querySelector('[data-gallery-counter]');hero.append(controls);
  status=document.createElement('p');status.className='inline-gallery-error';status.setAttribute('role','status');status.hidden=true;hero.append(status);
  const strip=root.querySelector('.sp-strip');
  if(strip&&!strip.querySelector('[data-inline-first]')){
   const first=document.createElement('button');first.type='button';first.className='zoomable';first.dataset.inlineFirst='';
   const thumb=document.createElement('img');thumb.src=image.getAttribute('src')||image.dataset.src||items[0].src;thumb.alt='';thumb.loading='lazy';first.append(thumb);strip.prepend(first);
  }
 }
 const strip=root.querySelector('.sp-strip');
 const thumbs=[...root.querySelectorAll('.sp-strip button')].filter(b=>b.matches(selector)||b.hasAttribute('data-inline-first'));
 const number=b=>b.hasAttribute('data-inline-first')?0:indexOf(b);
 function revealCurrent(){
  const thumb=thumbs.find(b=>number(b)===current);
  if(!strip||!thumb)return;
  // Scroll only the rail: scrollIntoView would also move the page or parent dialog.
  const rail=strip.getBoundingClientRect(),photo=thumb.getBoundingClientRect(),style=getComputedStyle(strip);
  const left=rail.left+parseFloat(style.paddingLeft),right=rail.right-parseFloat(style.paddingRight);
  const delta=photo.left<left?photo.left-left:photo.right>right?photo.right-right:0;
  if(Math.abs(delta)>1)strip.scrollBy({left:delta,behavior:reduced()?'instant':'smooth'});
 }
 function sync(){
  if(counter){counter.textContent=`${current+1} / ${items.length}`;counter.setAttribute('aria-label',`Foto ${current+1} di ${items.length}`);}
  frame.setAttribute('aria-label',`Ingrandisci foto ${current+1} di ${items.length}`);
  thumbs.forEach(b=>{const i=number(b);b.setAttribute('aria-pressed',String(i===current));b.setAttribute('aria-label',`Mostra foto ${i+1} in pagina`);});
 }
 async function show(index){
  wanted=(index+items.length)%items.length;const next=wanted,mine=++revision;
  if(next===current){controls?.removeAttribute('aria-busy');if(status)status.hidden=true;revealCurrent();return;}
  status.hidden=true;controls.setAttribute('aria-busy','true');
  const preload=new Image();preload.decoding='async';
  try{
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),12000);preload.onload=()=>{clearTimeout(timer);resolve();};preload.onerror=()=>{clearTimeout(timer);reject(new Error('image'));};preload.src=items[next].src;});
   try{await preload.decode();}catch{/* The loaded image can still be displayed. */}
   if(mine!==revision||!image.isConnected)return;
   animation?.cancel();outgoing?.remove();
   outgoing=image.cloneNode(false);outgoing.removeAttribute('data-src');outgoing.alt='';outgoing.setAttribute('aria-hidden','true');outgoing.classList.add('inline-gallery-outgoing');outgoing.dataset.imageFast='1';outgoing.dataset.imageState='ready';
   const old=outgoing;frame.append(old);
   markKnown(items[next].src);image.removeAttribute('data-src');image.dataset.imageFast='1';image.dataset.imageState='ready';image.src=items[next].src;image.alt=items[next].alt||'';applyCrop(image);
   current=next;sync();revealCurrent();
   if(reduced())old.remove();else{
    animation=old.animate([{opacity:1},{opacity:0}],{duration:300,easing:'ease-in-out',fill:'forwards'});
    animation.finished.then(()=>old.remove()).catch(()=>old.remove());
   }
  }catch{
   if(mine===revision&&image.isConnected){wanted=current;status.textContent='Foto non disponibile. Riprova.';status.hidden=false;}
  }finally{if(mine===revision)controls?.removeAttribute('aria-busy');}
 }
 function keys(event){
  if(items.length<2)return;
  const index=event.key==='ArrowLeft'?wanted-1:event.key==='ArrowRight'?wanted+1:event.key==='Home'?0:event.key==='End'?items.length-1:null;
  if(index==null)return;event.preventDefault();event.stopPropagation();show(index);
 }
 const zoom=()=>openLightbox(items,current,{container:root.closest('dialog')||document.body});
 if(strip&&items.length>1){
  strip.dataset.inlineGallery='';
  strip.addEventListener('inline-gallery-step',event=>{if(event.detail===-1||event.detail===1)show(wanted+event.detail);});
 }
 root.querySelectorAll(selector).forEach(b=>{b.onclick=b.closest('.sp-strip')?()=>show(number(b)):zoom;b.addEventListener('keydown',keys);});
 thumbs.filter(b=>b.hasAttribute('data-inline-first')).forEach(b=>{b.onclick=()=>show(0);b.addEventListener('keydown',keys);});
 if(controls){controls.querySelector('[data-gallery-prev]').onclick=()=>show(wanted-1);controls.querySelector('[data-gallery-next]').onclick=()=>show(wanted+1);controls.addEventListener('keydown',keys);}
 sync();
}
