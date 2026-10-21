import {scenarios,composeHome} from './home-states-model.js';
const $=s=>document.querySelector(s),app='https://fungaroli.zatteo.workers.dev/';
const icons={rain:'<path d="M6 15a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1 1 8M7 18v3m5-5v3m5-1v3"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',leaf:'<path d="M4 20C1 7 10 3 21 3c0 11-4 20-17 17Zm0 0L16 8"/>',people:'<circle cx="8" cy="7" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 5 5"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',note:'<path d="M5 3h14v18H5zM9 3v18m3-13h4m-4 4h4"/>'};
const glyph=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.info}</svg>`;
let source=scenarios[0],dayOverride=null,showReview=false,visitor='first',howOverride=null,howAutoMode=null;
const date=offset=>{const d=new Date(2026,9,21+offset,12);return d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});};
const when=offset=>offset===0?'Oggi':offset===1?'Domani':date(offset);
const fmt=n=>(n/10).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1});
const href=c=>app+'#/zona/'+c.id;
function compact(c,label){return `<li class="compact-proposal"><img src="../../${c.photo}" alt=""><div><small>${label||c.area}</small><h3>${c.name}</h3>${c.weather.level==='attenzione'?'<small>Meteo incerto · da ricontrollare</small>':''}</div>${Number.isFinite(c.score)?`<b class="score">${fmt(c.score)}</b>`:''}<a href="${href(c)}" target="_blank" rel="noopener">Dettagli ↗</a></li>`;}
const stateCopy={
 low:['Oggi, nessuna uscita da consigliare.','Nelle zone selezionate le condizioni per i funghi sono poco favorevoli. Puoi continuare a conoscere luoghi e specie.','leaf'],
 weather:['Con questo meteo, meglio aspettare.','Nelle zone selezionate il meteo non è favorevole all’uscita. Qui sotto trovi comunque luoghi, letture e idee per il prossimo giro.','rain'],
 review:['Ci sono proposte da valutare.','Le condizioni sono discrete oppure il meteo è incerto. Le teniamo separate dalle uscite consigliate.','info'],
 unknown:['Le condizioni sono da verificare.','Mancano dati aggiornati sufficienti per consigliare un’uscita. Questo non significa che le condizioni siano sfavorevoli.','info'],
 filters:['Nessuna uscita con questi filtri.','Il risultato riguarda le tue scelte, non tutti i boschi. Puoi rivedere i filtri senza cambiare il giorno selezionato.','info'],
 closed:['Nessuna proposta disponibile qui.','Le limitazioni di accesso o dell’attività escludono le zone selezionate. Un indice alto non le rende proponibili.','info'],
 late:['Per oggi, la partenza sarebbe tardi.','La finestra di partenza considerata per le proposte è passata. Puoi valutare un altro giorno o esplorare i luoghi.','clock'],
 unsupported:['Per queste specie l’indice non c’è ancora.','Le schede restano consultabili. Per organizzare un giro puoi scegliere anche Sentieri, senza un indice fungino.','leaf'],
 loading:['Stiamo valutando le uscite.','Controlliamo le condizioni nelle zone selezionate. Nel frattempo puoi sfogliare il resto della pagina.','clock'],
 community:['Il filtro community è da verificare.','Non riusciamo ad aggiornare i riepiloghi. Non equivale ad assenza di segnalazioni: puoi riprovare o togliere il filtro.','info']
};
function composeHow(model){
 const autoExpanded=['first','new-account'].includes(visitor)&&model.state==='ready';
 howAutoMode ||= visitor==='dismissed'?'hidden':autoExpanded?'expanded':'compact';
 const mode=howOverride||howAutoMode;
 if(mode==='hidden'){$('#how').innerHTML='';return;}
 if(mode==='compact'){$('#how').innerHTML=`<div class="how-compact"><span>${glyph('people')}<b>Un bosco, tante esperienze.</b></span><button class="text-button" data-how-open>Come funziona ${glyph('arrow')}</button></div>`;return;}
 $('#how').innerHTML=`<article class="how-expanded"><header><h2>Come funziona</h2><button class="how-close" aria-label="Chiudi Come funziona" data-how-close>×</button></header><div class="how-tiles"><div class="how-paper">${glyph('people')}<h3>Vedi cosa si trova in giro</h3><p>Ritrovamenti e giri a vuoto, zona per zona.</p></div><div class="how-bubble">${glyph('leaf')}<h3>Racconta un’uscita</h3><p>I tuoi posti segreti restano tuoi.</p></div><div class="how-pill">${glyph('arrow')}<h3>Diamoci una mano</h3><p>Condividi e scopri le segnalazioni degli altri.</p></div></div><details><summary>Dimmi di più</summary><p>Condividere un’osservazione permette di accedere ai riepiloghi degli altri. La condivisione è facoltativa; nei riepiloghi non mostriamo punti GPS, nomi o giorni precisi.</p><p>Ultimi 7 giorni, almeno 3 persone e almeno 2 giorni diversi. Poche segnalazioni non significano pochi funghi.</p></details></article>`;
}
function render(){
 const input=dayOverride?{...source,loading:false,communityUnavailable:false,selectedOffset:dayOverride.offset,rows:[dayOverride],future:[]}:source;
 const m=composeHome(input),label=when(m.selectedOffset);
 $('#day-label').textContent=label+' · '+date(m.selectedOffset);$('#reset-day').hidden=!dayOverride;
 const calendarStart=m.selectedOffset>2?Math.min(5,m.selectedOffset-1):0;
 $('#calendar').innerHTML=[calendarStart,calendarStart+1,calendarStart+2].map(o=>`<button data-day="${o}" aria-pressed="${m.selectedOffset===o}"><span>${o>1?date(o).split(' ')[0]:when(o)}</span><b>${21+o}</b></button>`).join('');
 const interests=m.intent==='walking'?['Sentieri']:m.intent==='plants'?['Piante']:m.intent==='browse'?[]:['Funghi'];
 $('#interest').innerHTML=['Funghi','Piante','Sentieri'].map(s=>`<span class="${interests.includes(s)?'chosen':''}">${interests.includes(s)?'✓ ':''}${s}</span>`).join('');
 $('#filter-count').textContent=source.id==='filters'?'4':'2';
 let main='';
 if(m.state==='ready'){
 const c=m.ready[0],fungi=m.intent==='fungi';main=`<article class="proposal"><img src="../../${c.photo}" alt="Paesaggio del luogo, foto di catalogo"><div class="proposal-body"><p class="eyebrow">${label} · ${fungi?'Un’uscita da valutare prima di partire':m.intent==='plants'?'Osservazione botanica':m.intent==='browse'?'Un luogo da esplorare':'Un sentiero da conoscere'}</p>${fungi?`<span class="ring"><small>Condizioni</small><b>${fmt(c.score)}</b></span>`:''}<h2>${c.name}</h2><p class="muted">${c.area}</p><p class="muted">${fungi?'Condizioni favorevoli nello scenario simulato.':'Proposta indipendente dall’indice dei funghi.'}</p><a class="action" href="${href(c)}" target="_blank" rel="noopener">Dai uno sguardo ${glyph('arrow')}</a></div></article>${m.partial?'<p class="caption">Alcune zone non sono valutabili: mostriamo solo le proposte con dati sufficienti.</p>':''}`;
 if(m.ready.length>1)main+=`<section class="alternatives"><h3>${m.ready.length===2?'Un’altra uscita':'Altre uscite'}</h3><ul class="compact-list">${m.ready.slice(1).map(c=>compact(c)).join('')}</ul></section>`;
 }else{let [title,copy,icon]=stateCopy[m.state];if(m.selectedOffset&&m.state==='low')title='Per '+date(m.selectedOffset)+', nessuna uscita da consigliare.';
 main=`<div class="empty-state" data-state="${m.state}"><span class="state-symbol">${glyph(icon)}</span><div><h2>${title}</h2><p>${copy}</p>${m.state==='loading'?'<div class="loading-line" aria-hidden="true"></div>':''}<div class="empty-actions">${['filters','closed'].includes(m.state)?'<button class="text-button" data-reset-filters>Rivedi i filtri</button>':m.state==='review'?`<button class="text-button" data-review>${showReview?'Nascondi le proposte':'Mostra le proposte da valutare'} (${m.review.length})</button>`:m.state==='unknown'||m.state==='community'?'<button class="text-button" data-retry>Riprova nella demo</button>':m.state==='unsupported'?'<button class="text-button" data-walking>Esplora i sentieri</button>':''}${m.state==='community'?'<button class="text-button" data-reset-filters>Togli il filtro community</button>':''}</div></div></div>`;
 if(showReview&&m.state==='review')main+=`<ul class="compact-list review-list">${m.review.map(c=>compact(c,'Da valutare · '+label)).join('')}</ul>`;
 }
 $('#recommendations').innerHTML=main;
 $('#next').innerHTML=m.next?`<div class="future-slot"><img src="../../${m.next.photo}" alt=""><div><p class="eyebrow">Un altro giorno</p><h3>${when(m.next.offset)} · ${m.next.name}</h3><p>Nello scenario ci sono condizioni favorevoli. Previsioni da ricontrollare prima di partire.</p></div><button class="action" data-next>Valuta ${when(m.next.offset).toLowerCase()}</button></div>`:!['ready','loading','filters','closed','unsupported','community'].includes(m.state)?'<p class="no-future">Per ora non abbiamo un’altra data favorevole da proporre nei prossimi sette giorni.</p>':'';
 composeHow(m);
 $('#reading').innerHTML=m.rain?`<div><p class="eyebrow">Pioggia e bosco</p><h3>Goccia dopo goccia.</h3><p>Piogge precedenti, temperatura e habitat: leggi come entrano nella valutazione delle condizioni.</p><a href="${app}#/guide/pioggia-e-crescita" target="_blank" rel="noopener">Leggi la guida →</a></div><img src="../../assets/video/nature/gocce-sulla-felce-poster.webp" alt="Gocce su un ramo" loading="lazy">`:`<div><p class="eyebrow">Leggere il bosco</p><h3>Ogni dettaglio conta.</h3><p>Alberi, lettiera ed esposizione: una guida da leggere prima del prossimo giro.</p><a href="${app}#/guide/leggere-il-bosco" target="_blank" rel="noopener">Leggi la guida →</a></div><img src="../../assets/guides/leggere-il-bosco.webp" alt="Illustrazione del sottobosco" loading="lazy">`;
 $('#reason').textContent=dayOverride?'Hai scelto esplicitamente il giorno futuro. La pagina mostra adesso i contenuti di quella selezione.':source.reason;
 $('#composition').innerHTML=`<ul><li>Proposte principali: ${m.ready.length}.</li><li>Proposte da valutare: ${m.review.length}${showReview?' · aperte su richiesta':''}.</li><li>Altra data: ${m.next?date(m.next.offset):'nessuna proposta'}.</li><li>“Come funziona”: ${visitor==='new-account'?'il solo accesso non lo nasconde':visitor==='experienced'?'ridotto dopo una prima annotazione':visitor==='dismissed'?'chiuso esplicitamente, sempre riapribile':'dipende da prima visita e spazio utile'}.</li></ul>`;
 $('#note-icon').innerHTML=glyph('note');
 $('#next [data-next]')?.addEventListener('click',()=>{dayOverride=m.next;showReview=false;render();$('#recommendations').scrollIntoView({block:'start',behavior:'instant'});});
}
$('#scenario').innerHTML=scenarios.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');
$('#scenario').onchange=()=>{source=scenarios.find(s=>s.id===$('#scenario').value);dayOverride=null;showReview=false;howAutoMode=null;render();};
$('#visitor').onchange=()=>{visitor=$('#visitor').value;howOverride=null;howAutoMode=null;render();};
$('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').textContent=dark?'Tema chiaro':'Tema scuro';};
$('#reset-day').onclick=()=>{dayOverride=null;render();};
const openHow=()=>{howOverride='expanded';composeHow(composeHome(dayOverride?{...source,rows:[dayOverride]}:source));$('#how').scrollIntoView({block:'start',behavior:'instant'});$('#how .how-close')?.focus({preventScroll:true});};
$('#help-open').onclick=openHow;
$('#filters').onclick=()=>{source=scenarios.find(s=>s.id==='filters');$('#scenario').value=source.id;dayOverride=null;showReview=false;render();};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-review')){showReview=!showReview;render();$('#recommendations [data-review]')?.focus({preventScroll:true});}if(b.hasAttribute('data-reset-filters')||b.hasAttribute('data-retry')){source=scenarios.find(s=>s.id==='good');$('#scenario').value=source.id;dayOverride=null;render();}if(b.hasAttribute('data-walking')){source=scenarios.find(s=>s.id==='walking');$('#scenario').value=source.id;render();}if(b.hasAttribute('data-how-open'))openHow();if(b.hasAttribute('data-how-close')){howOverride='hidden';composeHow(composeHome(source));$('#help-open').focus({preventScroll:true});}});
$('#calendar').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;const o=Number(b.dataset.day);dayOverride=o===(source.selectedOffset||0)?null:(source.future||[]).find(c=>c.offset===o)||{...source.rows[0],id:source.rows[0]?.id||'vallonina',name:source.rows[0]?.name||'Vallonina',inScope:true,eligible:true,timing:true,modeled:true,offset:o,growth:null,weather:{available:false,level:'non_disponibile'}};showReview=false;render();$('#calendar [data-day="'+o+'"]')?.focus({preventScroll:true});});
render();
