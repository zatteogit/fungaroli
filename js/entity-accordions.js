// Un solo approfondimento principale aperto per scheda; i dettagli annidati restano nel loro contesto.
let groupId = 0;
const boundRoots = new WeakSet();
const pendingScroll = new WeakMap();
function scrollPort(element) {
  for(let node=element.parentElement;node&&node!==document.body;node=node.parentElement){
    if(/auto|scroll/.test(getComputedStyle(node).overflowY))return node;
  }
  return document.scrollingElement;
}
// Un solo movimento per apertura, chiusura e compensazione della sezione precedente.
export function keepSummary(summary,change) {
  const port=scrollPort(summary),page=port===document.scrollingElement;
  pendingScroll.get(port)?.finish();
  const current=summary.parentElement;
  const scope=current.closest('.entity-accordion-root')||current.parentElement;
  const details=[...scope.querySelectorAll('details')].filter(d=>d===current||d.open);
  if(!details.includes(current))details.push(current);
  const before=new Map(details.map(d=>[d,d.getBoundingClientRect().height]));
  const rect=summary.getBoundingClientRect(),bounds=page?{top:0,bottom:innerHeight}:port.getBoundingClientRect();
  const vv=globalThis.visualViewport,top=Math.max(bounds.top,vv?.offsetTop||0),bottom=Math.min(bounds.bottom,(vv?.offsetTop||0)+(vv?.height||innerHeight));
  const dialog=summary.closest('dialog');
  const header=dialog?.querySelector(':scope > header')||(!dialog?document.querySelector('.appbar'):null);
  const visibleTop=Math.max(top,header?.getBoundingClientRect().bottom||top)+12;
  const opening=!current.open;
  // Sposta solo se titolo e inizio del contenuto non entrano nell'area leggibile.
  const target=rect.top<visibleTop||opening&&rect.bottom+96>bottom?visibleTop:rect.top;
  const styles={anchor:port.style.overflowAnchor,behavior:port.style.scrollBehavior};
  port.style.overflowAnchor='none';port.style.scrollBehavior='auto';
  details.forEach(d=>d.dataset.accordionMotion='');
  change();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    port.scrollTop+=summary.getBoundingClientRect().top-target;
    details.forEach(d=>delete d.dataset.accordionMotion);
    port.style.overflowAnchor=styles.anchor;port.style.scrollBehavior=styles.behavior;
    return;
  }
  const animations=[];
  for(const d of details){
    const from=before.get(d),to=d.getBoundingClientRect().height;
    if(Math.abs(from-to)<1)continue;
    if(!d.open)d.dataset.accordionClosing='';
    animations.push(d.animate([{height:`${from}px`},{height:`${to}px`}],{duration:280,easing:'cubic-bezier(.22,.61,.36,1)'}));
  }
  let stopped=false,done=false,frame,start=performance.now();
  const stop=()=>{stopped=true;};
  const keyStop=e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stop();};
  const scrollTarget=page?window:port;
  scrollTarget.addEventListener('wheel',stop,{passive:true});scrollTarget.addEventListener('touchstart',stop,{passive:true});
  document.addEventListener('keydown',keyStop);
  const finish=()=>{
    if(done)return;done=true;cancelAnimationFrame(frame);
    animations.forEach(a=>{try{a.finish();}catch{a.cancel();}});
    details.forEach(d=>{delete d.dataset.accordionMotion;delete d.dataset.accordionClosing;});
    if(!stopped&&summary.isConnected)port.scrollTop+=summary.getBoundingClientRect().top-target;
    port.style.overflowAnchor=styles.anchor;port.style.scrollBehavior=styles.behavior;
    scrollTarget.removeEventListener('wheel',stop);scrollTarget.removeEventListener('touchstart',stop);document.removeEventListener('keydown',keyStop);
    if(pendingScroll.get(port)?.finish===finish)pendingScroll.delete(port);
  };
  pendingScroll.set(port,{finish});
  const tick=now=>{
    if(done)return;
    if(!summary.isConnected){stop();finish();return;}
    const t=Math.min(1,(now-start)/280),ease=1-Math.pow(1-t,3);
    if(!stopped)port.scrollTop+=summary.getBoundingClientRect().top-(rect.top+(target-rect.top)*ease);
    if(t<1)frame=requestAnimationFrame(tick);else finish();
  };
  frame=requestAnimationFrame(tick);
}
export function enhanceEntityAccordions(root) {
  root.classList.add('entity-accordion-root');
  const name = `fronda-entity-${++groupId}`;
  for (const detail of root.querySelectorAll('details')) {
    const parent = detail.parentElement.closest('details');
    if (parent && root.contains(parent)) continue;
    detail.dataset.entityAccordion = '';
    detail.name = name;
  }
  if (boundRoots.has(root)) return;
  boundRoots.add(root);
  // Misura il summary prima che il gruppo nativo chiuda la sezione precedente.
  root.addEventListener('click',event=>{
    const summary=event.target.closest('summary'),current=summary?.parentElement;
    if(!current?.matches('details')||!root.contains(current)||event.defaultPrevented||event.button>0)return;
    if(event.target.closest('a,button,input,select,textarea'))return;
    event.preventDefault();
    keepSummary(summary,()=>{
      const opening=!current.open;
      if(opening&&current.hasAttribute('data-entity-accordion'))root.querySelectorAll('details[data-entity-accordion][open]').forEach(other=>{if(other!==current&&other.name===current.name)other.open=false;});
      current.open=opening;
    });
  });
  // Anche sui browser che non supportano ancora i gruppi nativi di <details>.
  root.addEventListener('toggle', event => {
    const current = event.target;
    if (!current.matches('details[data-entity-accordion]') || !current.open) return;
    root.querySelectorAll('details[data-entity-accordion][open]').forEach(other => {
      if (other !== current && other.name === current.name) other.open = false;
    });
  }, true);
}
