// Background updates retain matching links, decoded photos and focused nodes.
// Use for display-only fragments whose actions are delegated, not chart widgets
// or controls with handlers that close over a particular forecast.
const identity=n=>n.nodeType===1?(n.getAttribute('data-weather-key')||n.id||n.getAttribute('data-day-offset')||''):'';
function compatible(a,b){return a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName)&&identity(a)===identity(b);}
function patch(a,b){
  if(a.nodeType===3){if(a.textContent!==b.textContent)a.textContent=b.textContent;return;}
  if(a.nodeType!==1)return;
  if(a.tagName==='IMG'){
    const src=b.getAttribute('data-src')||b.getAttribute('src');
    if(src&&(a.getAttribute('src')===src||a.getAttribute('data-src')===src)){
      if(a.getAttribute('alt')!==b.getAttribute('alt'))a.setAttribute('alt',b.getAttribute('alt')||'');return;
    }
  }
  for(const attr of [...a.attributes])if(!b.hasAttribute(attr.name)&&!['data-counted','data-image-state'].includes(attr.name)&&!(a.matches('a.glossary-link,a[data-entity]')&&['aria-expanded','aria-controls'].includes(attr.name)))a.removeAttribute(attr.name);
  for(const attr of b.attributes)if(a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
  reconcileChildren(a,b);
}
export function reconcileChildren(target,source){
  const unused=[...target.childNodes];let cursor=target.firstChild;
  for(const desired of [...source.childNodes]){
    const key=identity(desired);
    let actual=key?unused.find(n=>compatible(n,desired)):unused.find(n=>n===cursor&&compatible(n,desired));
    if(actual){unused.splice(unused.indexOf(actual),1);if(actual!==cursor)target.insertBefore(actual,cursor);patch(actual,desired);}
    else{actual=desired;target.insertBefore(actual,cursor);}
    cursor=actual.nextSibling;
  }
  unused.forEach(n=>n.remove());
}
export function updateWeatherHTML(target,html){
  const fragment=document.createElement('template');fragment.innerHTML=html;
  reconcileChildren(target,fragment.content);
}

export function keepWeatherReadingPosition(render){
  const x=scrollX,y=scrollY,active=document.activeElement;
  const candidates=[...document.querySelectorAll('.view:not([hidden]) details[data-sec]>summary,.view:not([hidden]) .phero-title')];
  const anchor=candidates.find(el=>el.getBoundingClientRect().bottom>60),sec=anchor?.closest('[data-sec]')?.dataset.sec,top=anchor?.getBoundingClientRect().top;
  const photos=new Map();document.querySelectorAll('.view:not([hidden]) img').forEach(img=>{const src=img.getAttribute('src')||img.dataset.src;if(src){if(!photos.has(src))photos.set(src,[]);photos.get(src).push(img);}});
  const focusId=active?.id,focusSec=active?.closest('[data-sec]')?.dataset.sec;
  render();
  document.querySelectorAll('.view:not([hidden]) img').forEach(img=>{const src=img.dataset.src||img.getAttribute('src'),old=photos.get(src)?.shift();if(old&&old!==img){old.alt=img.alt;img.replaceWith(old);}});
  const next=sec?document.querySelector(`.view:not([hidden]) [data-sec="${CSS.escape(sec)}"]>summary`):document.querySelector('.view:not([hidden]) .phero-title');
  scrollTo({left:x,top:next&&Number.isFinite(top)?y+next.getBoundingClientRect().top-top:y,behavior:'instant'});
  if(active!==document.body&&!active?.isConnected){
    const focus=focusId?document.getElementById(focusId):focusSec?document.querySelector(`.view:not([hidden]) [data-sec="${CSS.escape(focusSec)}"]>summary`):null;
    focus?.focus({preventScroll:true});
  }
}
