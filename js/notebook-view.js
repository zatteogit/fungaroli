import {notebookGlyph} from './ui-icons.js';
import {HABITATS} from './community-observation.js';
import {PHENO_PHASES} from './notebook-entry.js';
const esc = value => String(value ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const date = value => {const d=new Date(value+'T12:00:00');return Number.isFinite(+d)?d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):value;};
const labels={fungo:'Funghi',botanica:'Piante',albero:'Alberi',percorso:'Giro salvato',lettura:'Letture',appunto:'Appunti'};
const levels=['','Pochi','Discreti','Tanti'];
const kind=e=>e.kind==='note'?labels[e.category]||'Appunti':e.kind==='plan'?'Giro salvato':'Uscita';
const isOuting=e=>!['note','plan'].includes(e.kind);
const iconPaths={
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  note:'<path d="M5 3h14v18H5zM9 3v18m3-13h4m-4 4h4"/>',
  leaf:'<path d="M5 19C0 6 10 3 21 3c0 11-3 21-16 16Zm0 0L16 8M3 22l2-3"/>',
  route:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/>',
  mushroom:'<path d="M3 12a9 9 0 0 1 18 0H3Zm7 0v7a2 2 0 0 0 4 0v-7"/>',
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

export function renderNotebook({entries,zones,species,zoneImage,referenceImage,route,filter='',query='',canPreview=false,actions=()=>'',analysis=()=>'',shared=e=>!!e.shared}) {
  const place=e=>zones.find(z=>z.id===e.zoneId)?.title||zones.find(z=>z.id===e.zoneId)?.name||'';
  const href=e=>`${route.base}${route.demo?'/':'/pagina/'}${encodeURIComponent(e.id)}`;
  const image=e=>{const ref=e.reference&&referenceImage(e.reference.href);return ref?.file?{src:ref.file,label:'Foto dalla scheda collegata',link:e.reference.href}:e.zoneId&&zoneImage(e.zoneId)?{src:zoneImage(e.zoneId),label:'Immagine del luogo · dal catalogo',link:`#/zona/${e.zoneId}`} :null;};
  const finds=e=>Object.entries(e.finds||{}).filter(([,amount])=>amount>0).map(([id,amount])=>`${species.find(s=>s.id===id)?.name||id} · ${levels[amount]||amount}`);
  const facts=e=>{
    const r=e.record,items=[];
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
    const data=[['Luogo',place(e)],['Giorno',date(e.date)],['Osservazione',r?.presence==='searched_absent'?'Cercato, non osservato':r?.presence==='observed'?'Osservato':''],['Quantità',r?.amount>0?levels[r.amount]||r.amount:''],['Ambiente',r?.habitat&&r.habitat!=='unknown'?(HABITATS.find(([code])=>code===r.habitat)?.[1]||r.habitat):''],['Tempo di ricerca',r?.minutes||e.effort?.minutes?`${r?.minutes||e.effort.minutes} minuti`:''],['Persone',r?.people||e.effort?.people],['Quota',e.band||r?.elevation?`${e.band||r.elevation} m`:'']].filter(([,v])=>v);
    const photos=photo?`<figure class="diary-detail-photo"><img src="${esc(photo.src)}" alt="${esc(e.reference?.title||place(e))}" decoding="async"><figcaption>${esc(photo.label)}. <a href="${esc(photo.link)}" data-entity>Apri la scheda e i crediti →</a></figcaption></figure>`:'';
    const phases=e.observation?.phases?.filter(p=>p.status!=='unsure')||[];
    return {title:notebookTitle(e,zones),kicker:kind(e),subtitle:[date(e.date),place(e)].filter(Boolean).join(' · '),detail:true,html:`${demoBanner}<a class="diary-back" href="${route.base}">← Tutte le pagine</a><article class="diary-detail" data-journal-id="${esc(e.id)}">${photos}<div class="diary-detail-layout"><div class="diary-story"><p class="diary-section-label">La pagina</p>${e.note?e.note.split(/\n\s*\n/).map(p=>`<p class="diary-prose">${esc(p)}</p>`).join(''):'<p class="diary-prose muted">Un luogo da ritrovare al prossimo giro.</p>'}${e.reference?`<a class="diary-reference" href="${esc(e.reference.href)}" data-entity>${glyph(entryIcon(e))}<span><small>Scheda collegata</small><b>${esc(e.reference.title)}</b></span>${glyph('arrow')}</a>`:''}${phases.length?`<section class="diary-phase-detail"><h2>Fasi annotate</h2><ul>${phases.map(p=>`<li>${esc(PHENO_PHASES.find(([code])=>code===p.code)?.[1]||p.code)} · ${p.status==='present'?'presente':'cercato, non osservato'}</li>`).join('')}</ul><p class="small muted">Identificazione proposta · non verificata</p></section>`:''}${!route.demo&&!['note'].includes(e.kind)?analysis(e):''}</div><aside class="diary-field-data"><h2>Appunti di campo</h2><dl>${data.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${finds(e).length?`<h3>Ritrovamenti annotati</h3><ul>${finds(e).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}${['fungo','botanica'].includes(e.category)?'<p class="diary-field-caution">Il nome annotato è una proposta, non un’identificazione verificata.</p>':''}</aside></div>${route.demo?'<footer class="diary-detail-actions"><span class="diary-demo-tag">Contenuto dimostrativo</span><p>Prova ad aggiungere una nota nel tuo taccuino per usare modifica e condivisione.</p></footer>':`<footer class="diary-detail-actions">${actions(e)}</footer>`}</article><nav class="diary-pagination" aria-label="Altre pagine">${prev?`<a href="${href(prev)}"><small>← Pagina più recente</small><b>${esc(notebookTitle(prev,zones))}</b></a>`:'<span></span>'}${next?`<a href="${href(next)}"><small>Pagina precedente →</small><b>${esc(notebookTitle(next,zones))}</b></a>`:''}</nav>`};
  }
  const match=e=>!filter||filter==='fungo'&&e.category==='fungo'||filter==='botanica'&&['botanica','albero'].includes(e.category)||filter==='uscita'&&isOuting(e)||filter==='salvati'&&(e.kind==='plan'||e.category==='percorso')||filter==='appunto'&&e.kind==='note'&&['appunto','lettura'].includes(e.category);
  const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=entries.filter(e=>match(e)&&normalize([e.title,e.note,e.reference?.title,place(e)].join(' ')).includes(normalize(query.trim())));
  const outings=entries.filter(isOuting).length,notes=entries.filter(e=>e.kind==='note').length;
  const tabs=[['','Tutto'],['fungo','Funghi'],['botanica','Piante e alberi'],['uscita','Uscite'],['salvati','Giri salvati'],['appunto','Appunti']];
  const toolbar=`<div class="diary-index"><p><b>${entries.length} ${entries.length===1?'pagina':'pagine'}</b><span>${notes} ${notes===1?'appunto':'appunti'} · ${outings} ${outings===1?'uscita':'uscite'}</span></p><label class="diary-search"><span aria-hidden="true">⌕</span><span class="sr-only">Cerca nel taccuino</span><input type="search" id="notebook-query" placeholder="Cerca una pagina, un luogo…" value="${esc(query)}"></label><div class="diary-filters" role="group" aria-label="Filtra le pagine">${tabs.map(([value,label])=>`<button type="button" data-notebook-filter="${value}" aria-pressed="${value===filter}">${label}</button>`).join('')}</div></div>`;
  const cards=visible.map((e,i)=>{const photo=image(e),number=entries.length-entries.indexOf(e);return `<li class="diary-card${i===0&&!filter&&!query?' is-featured':''}${photo?' has-photo':' is-text'}" data-journal-id="${esc(e.id)}"><a class="diary-card-link" href="${href(e)}">${photo?`<div class="diary-card-image"><img data-src="${esc(photo.src)}" alt="" loading="lazy" decoding="async"><span>Dal catalogo</span></div>`:''}<div class="diary-card-body"><div class="diary-card-meta"><span>${glyph(entryIcon(e))}${kind(e)}</span><time datetime="${esc(e.date)}">${esc(date(e.date))}</time></div><h2>${esc(notebookTitle(e,zones))}</h2>${place(e)?`<p class="diary-card-place">${esc(place(e))}</p>`:''}<p class="diary-card-preview">${esc(e.note||'Un luogo e le condizioni da ritrovare al prossimo giro.')}</p>${facts(e).length?`<ul class="diary-card-facts">${facts(e).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}<footer><span>${route.demo?'Esempio':shared(e)?'Osservazione condivisa':`${glyph('lock')}Solo per te`}</span><span class="diary-card-open">Leggi la pagina ${glyph('arrow')}</span><span class="diary-page-number" aria-hidden="true">${String(number).padStart(2,'0')}</span></footer></div></a></li>`;}).join('');
  const empty=entries.length?'<div class="diary-empty"><h2>Nessuna pagina trovata.</h2><p>Prova un’altra parola o cambia filtro.</p><button class="btn ghost" type="button" data-notebook-reset>Mostra tutte le pagine</button></div>':'<div class="diary-empty"><span class="diary-empty-icon">'+glyph('note')+'</span><h2>La prossima scoperta comincia qui.</h2><p>Un’osservazione, un luogo da ritrovare, un pensiero dopo il giro. Le tue pagine restano private finché scegli di condividere le osservazioni.</p></div>';
  const invitation=canPreview&&!route.demo?`<aside class="diary-demo-invite"><div><span class="diary-section-label">Da sfogliare</span><h2>Un autunno di scoperte.</h2><p>Esplora un diario di prova con 14 pagine: uscite, funghi, piante e piccoli promemoria.</p></div><a class="btn ghost" href="#/diario/esempio">${notebookGlyph}Sfoglia il diario di prova →</a></aside>`:'';
  return {title:route.demo?'Un autunno nel taccuino':'Il mio taccuino',kicker:route.demo?'Un diario da esplorare':'Appunti di campo',subtitle:route.demo?'Quattordici pagine, tanti modi di ricordare il bosco.':'Luoghi, scoperte e pensieri da ritrovare.',detail:false,html:`${demoBanner}${entries.length?toolbar:''}${cards?`<ul class="diary-grid">${cards}</ul>`:empty}${invitation}`};
}
