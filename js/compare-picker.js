// Scelta esplicita di due specie del catalogo: non crea nuove relazioni di sosia.
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value || '').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('it');
const name = t => t.name || t.latin;
const image = (t,photo,asset) => { const p=photo(t); return p?`<img data-src="${esc(asset(p.thumb||p.file))}" alt="" loading="lazy" decoding="async">`:'<span class="cmp-picker-placeholder" aria-hidden="true">?</span>'; };

export function openComparePicker({taxa,photo,asset,title='Scegli un fungo',current='',exclude='',related=[],onSelect}) {
  const origin=document.activeElement, initialHash=location.hash;
  const dialog=document.createElement('dialog');dialog.className='cmp-chooser cmp-finder';
  dialog.setAttribute('aria-label',title);
  dialog.innerHTML=`<header class="cmp-chooser-head"><h2>${esc(title)}</h2><button type="button" data-finder-close aria-label="Chiudi">×</button></header>
    <label class="cmp-finder-search"><span>Cerca nel catalogo</span><input type="search" placeholder="Nome comune o scientifico" autocomplete="off"></label>
    ${related.length?`<div class="cmp-finder-scopes" role="group" aria-label="Specie da mostrare"><button type="button" data-scope="related" aria-pressed="true">Sosia documentati · ${related.length}</button><button type="button" data-scope="all" aria-pressed="false">Tutti i funghi</button></div>`:''}
    <p class="cmp-finder-count" role="status"></p><div class="cmp-finder-results"></div>`;
  document.body.append(dialog);
  const relatedKeys=new Set(related.map(t=>t.key));
  let scope=related.length?'related':'all';
  const input=dialog.querySelector('input');
  const paint=()=>{
    const q=normalize(input.value.trim());
    const items=taxa.filter(t=>t.key!==exclude && (scope==='all'||relatedKeys.has(t.key)) && normalize(`${name(t)} ${t.latin||''}`).includes(q));
    dialog.querySelector('.cmp-finder-count').textContent=`${items.length} specie${scope==='related'?' · dalle relazioni documentate':' · intero catalogo'}`;
    dialog.querySelector('.cmp-finder-results').innerHTML=items.length?items.map(t=>`<button type="button" class="cmp-finder-item" data-choose="${esc(t.key)}" aria-pressed="${t.key===current}">${image(t,photo,asset)}<span><b>${esc(name(t))}</b><i>${esc(t.latin||'')}</i><small${['mortale','tossico'].includes(t.toxicity)?' class="cmp-finder-risk"':''}>${esc(t.tox_label||t.toxicity||'')}${relatedKeys.has(t.key)?' · sosia documentato':''}</small></span>${t.key===current?'<span aria-hidden="true">✓</span>':''}</button>`).join(''):'<p class="cmp-picker-empty">Nessuna specie corrisponde. Prova un altro nome o passa a tutti i funghi.</p>';
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
  paint();dialog.showModal();
}

export function mountCompareStart(box,{taxa,photo,asset,related,left='',right=''}) {
  let a=taxa.find(t=>t.key===left)||null,b=taxa.find(t=>t.key===right)||null;
  if(a?.key===b?.key)b=null;
  const paint=()=>{
    const field=(t,side,label)=>`<button type="button" class="cmp-start-choice${t?' is-filled':''}" data-pick-side="${side}" aria-haspopup="dialog"><span class="cmp-start-label">${label}</span>${t?`${image(t,photo,asset)}<b>${esc(name(t))}</b><i>${esc(t.latin||'')}</i><span class="cmp-start-change">Cambia fungo <span aria-hidden="true">↗</span></span>`:'<span class="cmp-start-empty" aria-hidden="true">＋</span><b>Scegli un fungo</b><span class="cmp-start-change">Sfoglia o cerca nel catalogo</span>'}</button>`;
    const documented=a&&b&&related(a).some(t=>t.key===b.key);
    box.innerHTML=`<div class="cmp-start-pair">${field(a,'left','1 · Riferimento')}<span class="cmp-start-vs" aria-hidden="true">vs</span>${field(b,'right','2 · Da confrontare')}</div>
      <div class="cmp-start-actions"><button type="button" class="btn ghost" data-swap-pair${a&&b?'':' disabled'}>Inverti i due funghi</button><button type="button" class="btn primary" data-start-compare${a&&b?'':' disabled'}>Confronta i caratteri <span aria-hidden="true">→</span></button></div>
      <p class="cmp-start-context" role="status">${a&&b?(documented?'Sosia documentati nel catalogo.':'Confronto libero: relazione di sosia non documentata nel catalogo.'):'Puoi scegliere due specie diverse, anche fuori dalle relazioni di sosia.'}</p>
      <aside class="cmp-start-note"><b>Confrontare per osservare meglio</b><p>Vedrai differenze e somiglianze nei caratteri documentati per entrambe le specie. Il confronto non identifica un esemplare né ne certifica la commestibilità.</p></aside>`;
    box.querySelectorAll('[data-pick-side]').forEach(button=>button.onclick=()=>{
      const side=button.dataset.pickSide;
      openComparePicker({taxa,photo,asset,title:side==='left'?'Scegli il fungo di riferimento':'Confronta con…',current:(side==='left'?a:b)?.key,exclude:(side==='left'?b:a)?.key,related:side==='right'&&a?related(a):[],onSelect:t=>{
        if(side==='left')a=t;else b=t;paint();box.querySelector(`[data-pick-side="${side}"]`).focus({preventScroll:true});
      }});
    });
    box.querySelector('[data-swap-pair]').onclick=()=>{[a,b]=[b,a];paint();box.querySelector('[data-swap-pair]').focus({preventScroll:true});};
    box.querySelector('[data-start-compare]').onclick=()=>{if(a&&b&&a.key!==b.key)location.hash=`#/riconosci/confronta/${encodeURIComponent(a.key)}/${encodeURIComponent(b.key)}`;};
  };
  paint();
}
