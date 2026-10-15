const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
let toastTimer;
function toast(text){$('#toast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').textContent=''},5000)}
function luminance(hex){const parts=hex.trim().replace('#','').match(/.{2}/g);if(!parts)return 0;const [r,g,b]=parts.map(h=>{const c=parseInt(h,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b}
function contrasts(){const s=getComputedStyle(document.documentElement),pairs=[['brand-fixed','on-brand-fixed','Avorio / Bosco'],['on-polline','polline','Inchiostro / Polline'],['on-calendula','calendula','Inchiostro / Calendula'],['on-fiordaliso','fiordaliso','Inchiostro / Fiordaliso'],['on-germoglio','germoglio','Inchiostro / Germoglio']];$('#contrast-table').innerHTML=pairs.map(([a,b,label])=>{const x=luminance(s.getPropertyValue('--'+a)),y=luminance(s.getPropertyValue('--'+b)),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);return `<tr><td>${label}</td><td>${ratio.toFixed(2)}:1</td></tr>`}).join('')}
function setTheme(dark){document.documentElement.dataset.theme=dark?'dark':'light';const b=$('#theme-toggle');b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Attiva tema chiaro':'Attiva tema scuro');b.lastChild.textContent=dark?'Tema chiaro':'Tema scuro';try{localStorage.setItem('fronda-theme',dark?'dark':'light')}catch{}contrasts()}
let initial=false;try{initial=localStorage.getItem('fronda-theme')==='dark'}catch{}setTheme(initial);
$$('[data-swatch-code]').forEach(e=>e.textContent=getComputedStyle(document.documentElement).getPropertyValue('--'+e.dataset.swatchCode).trim());
$('#theme-toggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme!=='dark'));
let beforePrintTheme;
window.addEventListener('beforeprint',()=>{beforePrintTheme=document.documentElement.dataset.theme;document.documentElement.dataset.theme='light';contrasts()});
window.addEventListener('afterprint',()=>{document.documentElement.dataset.theme=beforePrintTheme||'light';contrasts()});
$('#print-guide').addEventListener('click',()=>window.print());
$$('[data-toast]').forEach(b=>b.addEventListener('click',()=>toast(b.dataset.toast)));
const dialog=$('#note-dialog');let opener;
$$('[data-open-note]').forEach(b=>b.addEventListener('click',()=>{opener=b;$('#note-error').hidden=true;$('#note-title').removeAttribute('aria-invalid');dialog.showModal();$('#note-title').focus()}));
function closeNote(){dialog.close();opener?.focus()}
$('#close-note').addEventListener('click',closeNote);$('#cancel-note').addEventListener('click',closeNote);dialog.addEventListener('close',()=>opener?.focus());
function validate(input,error){const valid=Boolean(input.value.trim());input.setAttribute('aria-invalid',String(!valid));error.hidden=valid;error.textContent=valid?'':'Scrivi un titolo per continuare.';if(!valid)input.focus();return valid}
$('#note-form').addEventListener('submit',e=>{e.preventDefault();if(validate($('#note-title'),$('#note-error'))){closeNote();toast('Esempio confermato. Nessun dato inviato.')}});
$('#demo-form').addEventListener('submit',e=>{e.preventDefault();if(validate($('#demo-title'),$('#demo-error')))toast('Titolo valido. Questa prova non salva dati.')});
$$('.fr-chip').forEach(b=>b.addEventListener('click',()=>{$$('.fr-chip').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));$('#filter-result').textContent=b.textContent==='Tutte'?'Mostra tutte le osservazioni.':'Filtro di esempio: '+b.textContent.toLowerCase()+'.'}));
const tabs=$$('[role="tab"]');function activateTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=!active})}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>activateTab(t));t.addEventListener('keydown',e=>{let target;if(e.key==='ArrowRight')target=tabs[(i+1)%tabs.length];if(e.key==='ArrowLeft')target=tabs[(i-1+tabs.length)%tabs.length];if(e.key==='Home')target=tabs[0];if(e.key==='End')target=tabs.at(-1);if(target){e.preventDefault();activateTab(target);target.focus()}})});
$('#privacy-toggle').addEventListener('change',e=>$('#privacy-status').textContent=e.target.checked?'Preferenza di esempio: luogo privato.':'Preferenza di esempio: luogo visibile.');
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){$$('.rail nav a').forEach(a=>a.removeAttribute('aria-current'));const a=$(`.rail nav a[href="#${e.target.id}"]`);a?.setAttribute('aria-current','location')}}),{rootMargin:'-15% 0px -65% 0px'});$$('section.page').forEach(s=>observer.observe(s))}
