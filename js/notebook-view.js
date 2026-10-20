import {FATIGUE,outingMemory,outingStory} from './outing-memory.js';
import {notebookGlyph} from './ui-icons.js';
import {HABITATS} from './community-observation.js';
import {PHENO_PHASES} from './notebook-entry.js';
const esc = value => String(value ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const date = value => {const d=new Date(value+'T12:00:00');return Number.isFinite(+d)?d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):value;};
const labels={animale:'Animali',fungo:'Funghi',botanica:'Piante',albero:'Alberi',percorso:'Giro salvato',lettura:'Letture',appunto:'Appunti'};
const levels=['','Pochi','Discreti','Tanti'];
const kind=e=>e.kind==='note'?labels[e.category]||'Appunti':e.kind==='plan'?'Giro salvato':'Uscita';
const isOuting=e=>!['note','plan'].includes(e.kind);
const iconPaths={
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  note:'<path d="M5 3h14v18H5zM9 3v18m3-13h4m-4 4h4"/>',
  leaf:'<path d="M5 19C0 6 10 3 21 3c0 11-3 21-16 16Zm0 0L16 8M3 22l2-3"/>',
  route:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/>',
  mushroom:'<path d="M3 12a9 9 0 0 1 18 0H3Zm7 0v7a2 2 0 0 0 4 0v-7"/>',
  pages:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M8 14h8M8 17h5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list:'<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  minus:'<path d="M5 12h14"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};
const glyph=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
const entryIcon=e=>isOuting(e)||e.kind==='plan'||e.category==='percorso'?'route':e.category==='fungo'?'mushroom':['botanica','albero'].includes(e.category)?'leaf':'note';
export function notebookRoute(hash=location.hash) {
  const parts=hash.split('/');const demo=parts[2]==='esempio';
  let id='';try{id=decodeURIComponent(demo?parts[3]||'':parts[2]==='pagina'?parts[3]||'':'');}catch{/* Invalid deep link gets the missing-page state. */id='invalid';}
  return {demo,id,base:demo?'#/diario/esempio':'#/diario'};
}
export const notebookTitle=(e,zones)=>e?.title||zones.find(z=>z.id===e?.zoneId)?.title||zones.find(z=>z.id===e?.zoneId)?.name||'Appunto dal bosco';

export function renderNotebook({entries,zones,species,zoneImage,referenceImage,route,filter='',query='',layout='pages',density='large',canPreview=false,actions=()=>'',analysis=()=>'',shared=e=>!!e.shared}) {
  layout=['pages','gallery','list'].includes(layout)?layout:'pages';
  density=density==='compact'?'compact':'large';
  const place=e=>zones.find(z=>z.id===e.zoneId)?.title||zones.find(z=>z.id===e.zoneId)?.name||'';
  const href=e=>`${route.base}${route.demo?'/':'/pagina/'}${encodeURIComponent(e.id)}`;
  const image=e=>{const ref=e.reference&&referenceImage(e.reference.href);return ref?.file?{src:ref.file,label:'Foto dalla scheda collegata',link:e.reference.href}:e.zoneId&&zoneImage(e.zoneId)?{src:zoneImage(e.zoneId),label:'Immagine del luogo · dal catalogo',link:`#/zona/${e.zoneId}`} :null;};
  const finds=e=>Object.entries(e.finds||{}).filter(([,amount])=>amount>0).map(([id,amount])=>`${species.find(s=>s.id===id)?.name||id} · ${levels[amount]||amount}`);
  const facts=e=>{
    const r=e.record,items=[],memory=outingMemory(e,species);
    if(memory.fatigue)items.push(FATIGUE.find(([v])=>v===memory.fatigue)[1]);
    if(memory.durationMinutes)items.push(`${memory.durationMinutes} min di giro`);
    if(memory.observedIds.length)items.push(`${memory.observedIds.length} ${memory.observedIds.length===1?'nome di fungo annotato':'nomi di funghi annotati'}`);
    if(r?.presence==='searched_absent')items.push('Cercato, non osservato');
    if(r?.presence==='observed')items.push(r.amount>0?`Osservato · ${levels[r.amount]||r.amount}`:'Osservato');
    if(r?.minutes||e.effort?.minutes)items.push(`${r?.minutes||e.effort.minutes} min`);
    if(e.band||r?.elevation)items.push(`${e.band||r.elevation} m`);
    if(!r&&isOuting(e))items.push(...finds(e).slice(0,1));
    return items;
  };
  const demoBanner=route.demo?`<aside class="diary-demo-banner"><span class="diary-demo-tag">Diario di prova</span><p>Esempi inventati, separati dalle tue note e dai dati community.</p><a href="#/diario">${notebookGlyph}Le tue note →</a></aside>`:'';
  const e=entries.find(e=>String(e.id)===route.id);
  if(route.id){
    if(!e)return {title:'Pagina non trovata',subtitle:'Questa pagina potrebbe essere stata eliminata.',kicker:'Taccuino',detail:true,html:`<div class="diary-empty"><p>Non trovo questa pagina nel taccuino aperto.</p><a class="btn ghost" href="${route.base}">Torna al taccuino</a></div>`};
    const photo=image(e),index=entries.indexOf(e),prev=entries[index-1],next=entries[index+1],r=e.record;
    const memory=outingMemory(e,species),summary=outingStory(e,{zones,species});
    const number=String(entries.length-index).padStart(2,'0'),day=new Date(e.date+'T12:00:00');
    const stamp=Number.isFinite(+day)?`<time class="diary-date-stamp" datetime="${esc(e.date)}"><b>${day.getDate()}</b><span>${day.toLocaleDateString('it-IT',{month:'long'})}</span><small>${day.getFullYear()}</small></time>`:`<time>${esc(e.date)}</time>`;
    const data=[['Luogo',place(e)],['Fatica percepita',FATIGUE.find(([v])=>v===memory.fatigue)?.[1]],['Durata del giro',memory.durationMinutes?`${memory.durationMinutes} minuti · indicati da te`:''],['Osservazione',r?.presence==='searched_absent'?'Cercato, non osservato':r?.presence==='observed'?'Osservato':''],['Quantità',r?.amount>0?levels[r.amount]||r.amount:''],['Ambiente',r?.habitat&&r.habitat!=='unknown'?(HABITATS.find(([code])=>code===r.habitat)?.[1]||r.habitat):''],['Tempo di ricerca',r?.minutes||e.effort?.minutes?`${r?.minutes||e.effort.minutes} minuti`:''],['Persone',r?.people||e.effort?.people],['Quota',e.band||r?.elevation?`${e.band||r.elevation} m`:'']].filter(([,v])=>v);
    const photos=photo?`<figure class="diary-detail-photo"><div class="diary-photo-print"><img src="${esc(photo.src)}" alt="${esc(e.reference?.title||place(e))}" decoding="async"></div><figcaption><span>${esc(photo.label)}</span><a href="${esc(photo.link)}" data-entity>Scheda e crediti ${glyph('arrow')}</a></figcaption></figure>`:'';
    const phases=e.observation?.phases?.filter(p=>p.status!=='unsure')||[];
    const hasMargin=data.length||memory.observedIds.length||finds(e).length||['fungo','botanica','animale'].includes(e.category);
    const write=!route.demo?`<button type="button" class="diary-write" ${e.zoneId?`data-note-kind="zona" data-note-id="${esc(e.zoneId)}" data-note-zone="${esc(e.zoneId)}" data-note-title="${esc(place(e))}"`:'data-new-note'}>${notebookGlyph}<span>Aggiungi un appunto</span>${glyph('plus')}</button>`:'';
    const saved=e.kind==='plan'||e.category==='percorso';
    const personal=e.note?`<section class="diary-written"><p class="diary-section-label">${saved?'Prima di partire':'Con parole tue'}</p>${e.note.split(/\n\s*\n/).map(p=>`<p class="diary-prose">${esc(p)}</p>`).join('')}</section>`:'';
    const story=summary?`<section class="diary-written diary-outing-summary"><p class="diary-section-label">Il giro, in breve</p><p class="diary-prose">${esc(summary)}</p><p class="diary-summary-credit">Composto da Fronda con i dettagli che hai indicato.</p></section>${personal}`:personal||`<section class="diary-unwritten"><span class="diary-section-label">${saved?'Un giro da tenere a mente':'Una pagina da ricordare'}</span><p class="diary-unwritten-title">${saved?'Da qui, il prossimo giro.':'Il ricordo comincia dai dettagli.'}</p><p>${saved?'Il percorso è salvato. Quando torni, tocca “Ci sono stato”: pochi dettagli e Fronda compone la pagina del giro.':'Puoi aggiungere un appunto, se vuoi.'}</p>${saved?'':write}</section>`;
    const pagination=(entry,label)=>entry?`<a href="${href(entry)}"><small>${label}</small><b>${esc(notebookTitle(entry,zones))}</b><time datetime="${esc(entry.date)}">${esc(date(entry.date))}</time></a>`:'<span></span>';
    return {
      title:notebookTitle(e,zones),kicker:kind(e),subtitle:[date(e.date),place(e)].filter(Boolean).join(' · '),detail:true,
      html:`${demoBanner}<div class="diary-reading-nav"><a class="diary-back" href="${route.base}">← Tutte le pagine</a><span>Il taccuino / ${number}</span></div>
        <article class="diary-detail${photo?' has-photo':' is-unillustrated'}${e.note?' has-writing':' is-unwritten'}" data-journal-id="${esc(e.id)}">
          <div class="diary-running-head"><span>Fronda · Taccuino di campo</span><span>Pagina ${number}</span></div>
          <header class="diary-entry-masthead">${stamp}<div class="diary-entry-heading"><p class="diary-section-label">${glyph(entryIcon(e))}${kind(e)}</p><h2 class="diary-entry-title">${esc(notebookTitle(e,zones))}</h2>${place(e)&&place(e)!==notebookTitle(e,zones)?`<p class="diary-entry-place">${esc(place(e))}</p>`:''}</div></header>
          <div class="diary-detail-layout${hasMargin?'':' diary-detail-full'}"><div class="diary-story">${photos}${story}
            ${memory.route?`<a class="diary-reference" href="${esc(memory.route.href)}" data-entity>${glyph('route')}<span><small>${memory.route.followed?'Percorso dichiarato · senza traccia GPS':'Percorso di riferimento'}</small><b>${esc(memory.route.name)}</b></span>${glyph('arrow')}</a>`:''}
            ${e.reference?`<a class="diary-reference" href="${esc(e.reference.href)}" data-entity>${glyph(entryIcon(e))}<span><small>Fra queste pagine</small><b>${esc(e.reference.title)}</b></span>${glyph('arrow')}</a>`:''}
            ${phases.length?`<section class="diary-phase-detail"><h2>Fasi annotate</h2><ul>${phases.map(p=>`<li>${esc(PHENO_PHASES.find(([code])=>code===p.code)?.[1]||p.code)} · ${p.status==='present'?'presente':'cercato, non osservato'}</li>`).join('')}</ul><p class="small muted">Identificazione proposta · non verificata</p></section>`:''}
            ${!route.demo&&e.kind!=='note'?analysis(e):''}
          </div>${hasMargin?`<aside class="diary-field-data"><span class="diary-margin-mark" aria-hidden="true">${notebookGlyph}</span><h2>A margine</h2><p class="diary-margin-sub">Appunti di campo</p><dl>${data.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${memory.observedIds.length?`<h3>Funghi osservati</h3><ul>${memory.observedIds.map(id=>`<li>${esc(species.find(s=>s.id===id)?.name||id)}</li>`).join('')}</ul><p class="diary-field-caution">Nomi annotati da te, da verificare.</p>`:''}${finds(e).length?`<h3>Ritrovamenti annotati</h3><ul>${finds(e).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}${['fungo','botanica','animale'].includes(e.category)?'<p class="diary-field-caution">Il nome annotato è una proposta, non un’identificazione verificata.</p>':''}</aside>`:''}</div>
          ${route.demo?'<footer class="diary-detail-actions"><span class="diary-demo-tag">Contenuto dimostrativo</span><p>Prova ad aggiungere una nota nel tuo taccuino per usare modifica e condivisione.</p></footer>':`<footer class="diary-detail-actions">${actions(e)}</footer>`}
          <div class="diary-page-end" aria-hidden="true"><span>Fronda</span><span>${number}</span><span>Taccuino di campo</span></div>
        </article><nav class="diary-pagination" aria-label="Altre pagine">${pagination(prev,'← Pagina più recente')}${pagination(next,'Pagina precedente →')}</nav>`
    };
  }

  const match=e=>!filter||filter==='animale'&&e.category==='animale'||filter==='fungo'&&e.category==='fungo'||filter==='botanica'&&['botanica','albero'].includes(e.category)||filter==='uscita'&&isOuting(e)||filter==='salvati'&&(e.kind==='plan'||e.category==='percorso')||filter==='appunto'&&e.kind==='note'&&['appunto','lettura'].includes(e.category);
  const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=entries.filter(e=>match(e)&&normalize([e.title,e.note,e.reference?.title,place(e),outingStory(e,{zones,species})].join(' ')).includes(normalize(query.trim())));
  const outings=entries.filter(isOuting).length,notes=entries.filter(e=>e.kind==='note').length;
  const tabs=[['','Tutto'],['fungo','Funghi'],['botanica','Piante e alberi'],['animale','Animali'],['uscita','Uscite'],['salvati','Giri salvati'],['appunto','Appunti']];
  const toolbar=`<div class="diary-index"><p><b>${entries.length} ${entries.length===1?'pagina':'pagine'}</b><span>${notes} ${notes===1?'appunto':'appunti'} · ${outings} ${outings===1?'uscita':'uscite'}</span></p><label class="diary-search"><span aria-hidden="true">⌕</span><span class="sr-only">Cerca nel taccuino</span><input type="search" id="notebook-query" placeholder="Cerca una pagina, un luogo…" value="${esc(query)}"></label><div class="diary-filters" role="group" aria-label="Filtra le pagine">${tabs.map(([value,label])=>`<button type="button" data-notebook-filter="${value}" aria-pressed="${value===filter}">${label}</button>`).join('')}</div></div>`;
  const viewBar=`<div class="diary-view-bar"><div class="diary-view-switch" role="group" aria-label="Vista del taccuino">${[['pages','Pagine','pages'],['gallery','Griglia','grid'],['list','Elenco','list']].map(([value,label,icon])=>`<button type="button" data-notebook-layout="${value}" aria-pressed="${layout===value}">${glyph(icon)}<span>${label}</span></button>`).join('')}</div>${layout==='gallery'?`<div class="diary-density" role="group" aria-label="Dimensione delle miniature"><span>Miniature ${density==='large'?'grandi':'piccole'}</span><button type="button" data-notebook-density="compact" aria-label="Miniature più piccole"${density==='compact'?' disabled':''}>${glyph('minus')}</button><button type="button" data-notebook-density="large" aria-label="Miniature più grandi"${density==='large'?' disabled':''}>${glyph('plus')}</button></div>`:''}</div>`;
  const featureId=visible.find(e=>image(e))?.id||visible.find(e=>e.note?.length>200)?.id;
  const cards=visible.map((e,i)=>{const photo=image(e),number=entries.length-entries.indexOf(e);return `<li class="diary-card${e.id===featureId&&!filter&&!query?' is-featured':''}${photo?' has-photo':' is-text'}" data-journal-id="${esc(e.id)}" data-entry-kind="${esc(e.category||e.kind)}"><a class="diary-card-link" href="${href(e)}">${photo?`<div class="diary-card-image"><img data-src="${esc(photo.src)}" alt="" loading="lazy" decoding="async"><span>Dal catalogo</span></div>`:layout!=='pages'?`<div class="diary-card-paper" aria-hidden="true">${glyph(entryIcon(e))}<p>${esc(e.note||notebookTitle(e,zones))}</p></div>`:''}<div class="diary-card-body"><span class="diary-card-folio" aria-hidden="true">${String(number).padStart(2,'0')}</span><div class="diary-card-meta"><span>${glyph(entryIcon(e))}${kind(e)}</span><time datetime="${esc(e.date)}">${esc(date(e.date))}</time></div><h2>${esc(notebookTitle(e,zones))}</h2>${place(e)?`<p class="diary-card-place">${esc(place(e))}</p>`:''}<p class="diary-card-preview">${esc(outingStory(e,{zones,species})||e.note||(e.category==='animale'?(e.record?.presence==='observed'?'Un incontro annotato nel bosco.':e.record?.presence==='searched_absent'?'Una ricerca annotata, senza avvistamento.':'Un appunto sugli animali del bosco.'):'Un giro da ritrovare. Al ritorno, aggiungi ciò che hai osservato.'))}</p>${facts(e).length?`<ul class="diary-card-facts">${facts(e).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}<footer><span>${route.demo?'Esempio':shared(e)?'Osservazione condivisa':`${glyph('lock')}Solo per te`}</span>${photo?'<span class="diary-card-origin">Dal catalogo</span>':''}<span class="diary-card-open">Leggi la pagina ${glyph('arrow')}</span><span class="diary-page-number" aria-hidden="true">${String(number).padStart(2,'0')}</span></footer></div></a></li>`;}).join('');
  const empty=entries.length?'<div class="diary-empty"><h2>Nessuna pagina trovata.</h2><p>Prova un’altra parola o cambia filtro.</p><button class="btn ghost" type="button" data-notebook-reset>Mostra tutte le pagine</button></div>':'<div class="diary-empty"><span class="diary-empty-icon">'+glyph('note')+'</span><h2>La prossima scoperta comincia qui.</h2><p>Un’osservazione, un luogo da ritrovare, un pensiero dopo il giro. Le tue pagine restano private finché scegli di condividere le osservazioni.</p></div>';
  const invitation=canPreview&&!route.demo?`<aside class="diary-demo-invite"><div><span class="diary-section-label">Da sfogliare</span><h2>Un autunno di scoperte.</h2><p>Esplora un diario di prova con 14 pagine: uscite, funghi, piante e piccoli promemoria.</p></div><a class="btn ghost" href="#/diario/esempio">${notebookGlyph}Sfoglia il diario di prova →</a></aside>`:'';
  return {title:route.demo?'Un autunno nel taccuino':'Il mio taccuino',kicker:route.demo?'Un diario da esplorare':'Appunti di campo',subtitle:route.demo?'Quattordici pagine, tanti modi di ricordare il bosco.':'Salva il giro. Ricorda le scoperte. Al racconto pensiamo insieme.',detail:false,html:`${demoBanner}${entries.length?toolbar+viewBar:''}${cards?`<ul class="diary-grid" data-notebook-view="${layout}" data-notebook-density="${density}">${cards}</ul>`:empty}${invitation}`};
}
