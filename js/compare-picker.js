import {openModal} from './modal-flow.js';
import {matchSpecies} from './species-search.js';
// Scelta esplicita di due specie del catalogo: non crea nuove relazioni di sosia.
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const name = t => t.name || t.latin;
const image = (t,photo,asset,full=false) => { const p=photo(t); return p?`<img data-src="${esc(asset(full?(p.file||p.thumb):(p.thumb||p.file)))}" alt="" loading="lazy" decoding="async">`:'<span class="cmp-picker-placeholder" aria-hidden="true">?</span>'; };

export function openComparePicker({taxa,photo,asset,title='Scegli un fungo',current='',exclude='',related=[],allLabel='Tutti i funghi',onSelect}) {
  const origin=document.activeElement, initialHash=location.hash;
  const reference=taxa.find(t=>t.key===exclude);
  const heading=reference?`${name(reference)} vs…`:title;
  const dialog=document.createElement('dialog');dialog.className='cmp-chooser cmp-finder';
  dialog.setAttribute('aria-label',heading);
  dialog.innerHTML=`<header class="cmp-chooser-head"><h2>${esc(heading)}</h2><button type="button" data-finder-close aria-label="Chiudi">×</button></header>
    <label class="cmp-finder-search"><span>Cerca nel catalogo</span><input type="search" placeholder="Nome o carattere, es. verde" autocomplete="off"></label>
    ${related.length?`<div class="cmp-finder-scopes" role="group" aria-label="Specie da mostrare"><button type="button" data-scope="related" aria-pressed="true">Sosia documentati · ${related.length}</button><button type="button" data-scope="all" aria-pressed="false">${esc(allLabel)}</button></div>`:''}
    <p class="small muted" data-finder-search-help hidden>Ricerca testuale: le parole possono trovarsi in caratteri diversi. Per scegliere i caratteri usa «Impara a riconoscere» nella sezione di Scopri.</p><p class="cmp-finder-count" role="status"></p><div class="cmp-finder-results"></div>`;
  document.body.append(dialog);
  const relatedKeys=new Set(related.map(t=>t.key));
  let scope=related.length?'related':'all';
  const input=dialog.querySelector('input');
  const paint=()=>{
    const q=input.value.trim();
    const pool=taxa.filter(t=>t.key!==exclude && (scope==='all'||relatedKeys.has(t.key)));
    const result=matchSpecies(pool,q),items=result.items;
    dialog.querySelector('[data-finder-search-help]').hidden=!result.byTraits;
    dialog.querySelector('.cmp-finder-count').textContent=`${items.length} specie${result.byTraits?' · suggerimenti per caratteri':scope==='related'?' · dalle relazioni documentate':' · intero catalogo'}`;
    dialog.querySelector('.cmp-finder-results').innerHTML=items.length?items.map(t=>`<button type="button" class="cmp-finder-item" data-choose="${esc(t.key)}" aria-pressed="${t.key===current}">${image(t,photo,asset)}<span><b>${esc(name(t))}</b><i>${esc(t.latin||'')}</i>${result.byTraits?`<small class="search-feature-reason">${esc(result.reasons.get(t))}</small>`:''}<small${['mortale','tossico'].includes(t.toxicity)?' class="cmp-finder-risk"':''}>${esc(t.tox_label||t.toxicity||'')}${relatedKeys.has(t.key)?' · sosia documentato':''}</small></span>${t.key===current?'<span aria-hidden="true">✓</span>':''}</button>`).join(''):'<p class="cmp-picker-empty">Nessuna specie corrisponde. Prova un altro nome o passa al catalogo completo.</p>';
  };
  input.addEventListener('input',paint);
  dialog.addEventListener('click',event=>{
    const filter=event.target.closest('[data-scope]');
    if(filter){scope=filter.dataset.scope;dialog.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));paint();return;}
    const choice=event.target.closest('[data-choose]');
    if(choice){const t=taxa.find(t=>t.key===choice.dataset.choose);if(t&&t.key!==exclude){dialog.close();onSelect(t);}return;}
    if(event.target.closest('[data-finder-close]'))dialog.close();
    if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
  });
  const leave=()=>dialog.close();
  addEventListener('hashchange',leave);
  dialog.addEventListener('close',()=>{removeEventListener('hashchange',leave);dialog.remove();if(location.hash===initialHash&&origin?.isConnected)origin.focus({preventScroll:true});},{once:true});
  paint();openModal(dialog);
}

export function mountCompareStart(box,{taxa,photo,asset,related,left='',right='',labels={choose:'Scegli un fungo',change:'Cambia fungo',reference:'Scegli il fungo di riferimento',all:'Tutti i funghi'},onCompare=(a,b)=>{location.hash=`#/riconosci/confronta/${encodeURIComponent(a.key)}/${encodeURIComponent(b.key)}`;}}) {
  let a=taxa.find(t=>t.key===left)||null,b=taxa.find(t=>t.key===right)||null;
  if(a?.key===b?.key)b=null;
  const paint=()=>{
    const field=(t,side,label)=>`<button type="button" class="cmp-start-choice${t?' is-filled':''}" data-pick-side="${side}" aria-haspopup="dialog">${t?`${image(t,photo,asset,true)}<span class="cmp-start-label">${label}</span><b>${esc(name(t))}</b><i>${esc(t.latin||'')}</i><span class="cmp-start-change">${esc(labels.change)} <span aria-hidden="true">↗</span></span>`:`<span class="cmp-start-empty" aria-hidden="true">＋</span><span class="cmp-start-label">${label}</span><b>${esc(labels.choose)}</b><span class="cmp-start-change">Sfoglia o cerca nel catalogo</span>`}</button>`;
    box.innerHTML=`<div class="cmp-start-pair">${field(a,'left','1 · Riferimento')}<span class="cmp-start-vs" aria-hidden="true"><i>vs</i></span>${field(b,'right','2 · Da confrontare')}</div>
      <p class="cmp-start-context" role="status">Scegli due specie diverse: il confronto dei caratteri si apre subito.</p>
      <aside class="cmp-start-note"><b>Confrontare per osservare meglio</b><p>Vedrai differenze e somiglianze nei caratteri documentati per entrambe le specie. Il confronto non identifica un esemplare né ne certifica la commestibilità.</p></aside>`;
    box.querySelectorAll('[data-pick-side]').forEach(button=>button.onclick=()=>{
      const side=button.dataset.pickSide;
      openComparePicker({taxa,photo,asset,title:side==='left'?labels.reference:'Confronta con…',current:(side==='left'?a:b)?.key,exclude:(side==='left'?b:a)?.key,allLabel:labels.all,related:(side==='right'?a:b)?related(side==='right'?a:b):[],onSelect:t=>{
        if(side==='left')a=t;else b=t;
        if(a&&b&&a.key!==b.key){onCompare(a,b);return;}
        paint();box.querySelector(`[data-pick-side="${side}"]`).focus({preventScroll:true});
      }});
    });

  };
  paint();
}
