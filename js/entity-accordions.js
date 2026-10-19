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
export function keepSummary(summary,change) {
  const port=scrollPort(summary),page=port===document.scrollingElement;
  const rect=summary.getBoundingClientRect(),bounds=page?{top:0,bottom:innerHeight}:port.getBoundingClientRect();
  const vv=globalThis.visualViewport,top=Math.max(bounds.top,vv?.offsetTop||0),bottom=Math.min(bounds.bottom,(vv?.offsetTop||0)+(vv?.height||innerHeight));
  const header=summary.closest('dialog')?.querySelector(':scope > header')||(!summary.closest('dialog')?document.querySelector('.appbar'):null);
  const visibleTop=Math.max(top,header?.getBoundingClientRect().bottom||top)+8;
  const anchor=Math.max(visibleTop,Math.min(rect.top,bottom-rect.height-8));
  // Evita che l’ancoraggio nativo compensi una seconda volta la chiusura sopra.
  const previous=pendingScroll.get(port),state={anchor:previous?.anchor??port.style.overflowAnchor,behavior:previous?.behavior??port.style.scrollBehavior};
  pendingScroll.set(port,state);port.style.overflowAnchor='none';port.style.scrollBehavior='auto';
  change();
  port.scrollTop+=summary.getBoundingClientRect().top-anchor;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(pendingScroll.get(port)!==state)return;
    port.style.overflowAnchor=state.anchor;port.style.scrollBehavior=state.behavior;pendingScroll.delete(port);
  }));
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
    if(!current?.matches('details[data-entity-accordion]')||!root.contains(current)||event.defaultPrevented||event.button>0)return;
    if(event.target.closest('a,button,input,select,textarea'))return;
    event.preventDefault();
    keepSummary(summary,()=>{
      const opening=!current.open;
      if(opening)root.querySelectorAll('details[data-entity-accordion][open]').forEach(other=>{if(other!==current&&other.name===current.name)other.open=false;});
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
