// Selezione da un catalogo: il testo cercato non sostituisce mai l'identificativo scelto.
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function mountSearchSelect({input, list, options, selectedId = '', onChange, bounds = () => ({top:12,bottom:innerHeight-12}), empty = 'Nessun risultato.'}) {
  list.classList.add('search-select-options');
  const events = new AbortController(), signal = events.signal;
  let selected = options.find(o=>o.value===selectedId), matches = [], active = -1;
  const close = () => { list.hidden=true; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); active=-1; };
  const position = () => {
    if(list.hidden)return;
    const r=input.getBoundingClientRect(),frame=bounds(),above=r.top-frame.top,below=frame.bottom-r.bottom;
    const flip=below<120&&above>below;
    list.style.top=flip?'auto':`${input.offsetTop+input.offsetHeight+4}px`;
    list.style.bottom=flip?`${input.closest('.search-select').getBoundingClientRect().bottom-r.top+4}px`:'auto';
    list.style.maxHeight=`${Math.min(224,Math.max(64,(flip?above:below)-8))}px`;
  };
  const choose = option => {
    selected=option; input.value=option.label; input.setCustomValidity('');
    onChange(option.value); close(); input.focus({preventScroll:true});
  };
  const highlight = () => {
    [...list.querySelectorAll('[role="option"]')].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));
    const option=list.querySelector(`[data-option="${active}"]`);
    if(option) { input.setAttribute('aria-activedescendant',option.id); option.scrollIntoView({block:'nearest'}); }
    else input.removeAttribute('aria-activedescendant');
  };
  const render = () => {
    const q=norm(selected && input.value===selected.label ? '' : input.value), words=q.split(' ').filter(Boolean);
    matches=options.filter(o=>words.every(w=>norm([o.label,o.detail,...(o.aliases||[])].join(' ')).includes(w)))
      .sort((a,b)=>Number(norm(b.label).startsWith(q))-Number(norm(a.label).startsWith(q)) || a.label.localeCompare(b.label,'it'));
    active=-1;
    list.innerHTML=matches.map((o,i)=>`<li role="presentation"><button type="button" role="option" tabindex="-1" id="${list.id}-${i}" data-option="${i}" aria-selected="false"><span><b>${esc(o.label)}</b>${o.detail?`<small>${esc(o.detail)}</small>`:''}</span>${o.value===selected?.value?'<span aria-hidden="true">✓</span>':''}</button></li>`).join('') || `<li role="presentation" class="search-select-empty">${esc(empty)}</li>`;
    list.hidden=false; input.setAttribute('aria-expanded','true'); input.removeAttribute('aria-activedescendant');
    position();
  };
  input.setAttribute('role','combobox'); input.setAttribute('aria-autocomplete','list'); input.setAttribute('aria-controls',list.id);
  list.setAttribute('role','listbox');
  if(selected) { input.value=selected.label; onChange(selected.value); }
  else { onChange(''); input.setCustomValidity('Scegli un risultato dall’elenco.'); }
  close();
  input.addEventListener('focus',render,{signal});
  input.addEventListener('click',()=>{if(list.hidden)render();},{signal});
  input.addEventListener('input',()=>{
    selected=null; onChange(''); input.setCustomValidity('Scegli un risultato dall’elenco.'); render();
  },{signal});
  input.addEventListener('blur',close,{signal});
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp') {
      e.preventDefault(); if(list.hidden)render(); if(!matches.length)return;
      active=active<0 ? (e.key==='ArrowDown'?0:matches.length-1) : (active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;
      highlight();
    } else if(e.key==='Enter'&&!list.hidden) {
      e.preventDefault(); if(matches.length)choose(matches[active<0?0:active]);
    } else if(e.key==='Escape'&&!list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
  },{signal});
  list.addEventListener('pointerdown',e=>{if(e.target.closest('[data-option]'))e.preventDefault();},{signal});
  list.addEventListener('click',e=>{const b=e.target.closest('[data-option]');if(b)choose(matches[+b.dataset.option]);},{signal});
  addEventListener('resize',position,{signal});
  input.closest('dialog')?.addEventListener('scroll',position,{signal,passive:true});
  return {
    clear:()=>{selected=null;input.value='';input.setCustomValidity(input.required?'Scegli un risultato dall’elenco.':'');onChange('');close();},
    destroy:()=>events.abort()
  };
}
