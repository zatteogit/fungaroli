import {mountInlineGallery} from './inline-gallery.js';
import {notebookGlyph} from './ui-icons.js';
import {openModal} from './modal-flow.js';
import {matchSpecies} from './species-search.js';
import {factCards,monthCalendar} from './content-ui.js';
import {enhanceEntityAccordions} from './entity-accordions.js';
// Botanical descriptions are independent of the mushroom weather index.
import {captionHtml} from './lightbox.js';
import {filterPlants,plantHabitats} from './plant-catalog.js';
import { cardLatin } from './names.js';
import { renderAlsoIn } from './catalog-search.js';
import { attentionBox, sourceRows, photoRows } from './identify.js';
import { loadKeyData, loadPlantArtwork, traitTilesHtml } from './guided-key.js';
import { botanicalFieldGuide } from './botanical-explanation.js';
export {searchPlants} from './plant-catalog.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let PLANTS={},ASSET=f=>f,MODEL_FOR=()=>null;
export function initPlants(data,assetUrl,modelFor){if(modelFor)MODEL_FOR=modelFor;PLANTS=data?.plants||{};if(assetUrl)ASSET=assetUrl;}
export const plants=()=>Object.entries(PLANTS).map(([id,p])=>({...p,id}));
export const plantRecord=id=>PLANTS[id];
export const plantName=id=>PLANTS[id]?.name||'';
export const plantHeroSrc=id=>{const m=PLANTS[id]?.photos?.[0];return m?ASSET(m.file):'';};
export function plantThumb(id,size=44){const p=PLANTS[id],m=p?.photos?.[0];return m?`<img class="thumb" data-src="${esc(ASSET(m.file))}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`:'';}
// Tossica o mortale: le «Pericolose» e alcuni fiori, che restano da osservare.
const isToxic=p=>['tossico','mortale'].includes(p.foodUse?.status);
const LR61='https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=7250&sv=vigente';
const FLOWER_NOTE=`<details class="context-note" data-flower-note><summary>Fiori: osserva e fotografa, non cogliere</summary><p>Nel Lazio la <a href="${LR61}" target="_blank" rel="noopener">L.R. 61/1974</a> vieta la raccolta di alcune specie e per altre la limita a 5 steli fioriti al giorno, in totale. Nei parchi e nelle riserve valgono anche i divieti dell’area. Ogni scheda indica la tutela.</p></details>`;
function plantCatalogCard(p){
  const photo=p.photos?.[0],risk=isToxic(p)?p.foodUse.status:'';
  return `<a class="sp-card plant-card" href="#/pianta/${encodeURIComponent(p.id)}" aria-label="${esc(p.name)}${risk?' · '+esc(risk):''}">
    ${photo?`<img data-src="${esc(ASSET(photo.thumb||photo.file))}" alt="" loading="lazy" decoding="async">`:`<span class="catalog-placeholder" aria-hidden="true">${esc(p.name.slice(0,2))}</span>`}<span class="shade"></span>
    ${risk?`<span class="tox plant-risk${risk==='mortale'?' plant-risk-deadly':''}">${esc(risk)}</span>`:''}
    <span class="sp-card-body"><b>${esc(p.name)}</b><i>${esc(cardLatin(p.latin))}</i></span></a>`;
}
// Filtri del catalogo: restano in memoria per la sessione (non nel modo «riconosci»).
const CATALOG={category:'',q:'',flowering:false,lookalikes:false,habitat:''};
const monthName=m=>new Date(2026,m-1,1).toLocaleDateString('it-IT',{month:'long'});
const activeFilters=f=>Boolean(f.category||f.q.trim()||f.flowering||f.lookalikes||f.habitat);
export function renderPlants(box,{identify=false}={}){
  box.dataset.glossaryContext='Piante';
  const state=identify?{category:'',q:'',flowering:false,lookalikes:false,habitat:''}:CATALOG;
  const month=new Date().getMonth()+1,all=plants();
  const search=identify?'<label>Nome o caratteri che osservi<input type="search" class="wiz-input" autocomplete="off" placeholder="Foglie dentate, fiori bianchi…" data-plant-query></label>':'';
  const habitats=identify?[]:plantHabitats(all);
  const filters=identify?'':`<button type="button" class="btn ghost small plant-more-filters" data-open-plant-filters aria-haspopup="dialog">Altri filtri <span data-filter-n></span></button><dialog class="full-filters plant-filter-panel" aria-label="Filtri delle piante"><header class="filter-panel-head"><h2>Filtri delle piante</h2><button type="button" class="icon-btn" data-close-plant-filters aria-label="Chiudi i filtri">×</button></header><div class="fp-body"><div class="recognize-modes catalog-filters" role="group" aria-label="Altri filtri"><button type="button" class="btn ghost small" data-plant-filter="flowering" aria-pressed="false">In fiore a ${esc(monthName(month))}</button><button type="button" class="btn ghost small" data-plant-filter="lookalikes" aria-pressed="false">Simile a piante pericolose</button></div>${habitats.length?`<label class="plant-habitat-label">Ambiente<select class="catalog-select" data-plant-habitat><option value="">Tutti gli ambienti</option>${habitats.map(h=>`<option value="${esc(h.name)}">${esc(h.name)}</option>`).join('')}</select></label>`:''}</div><footer class="fp-foot"><button type="button" class="link-btn" data-reset-plant-filters>Azzera</button><button type="button" class="btn primary" data-close-plant-filters data-plant-filter-results>Mostra le schede</button></footer></dialog>`;
  box.innerHTML=`<div class="botanical-tools">${search}<div class="recognize-modes plant-groups" role="group" aria-label="Gruppi di piante">${[['','Tutte'],['Erbe','Erbe'],['Fiori','Fiori'],['Frutti','Frutti e bacche'],['Arbusti','Arbusti'],['Pericolose','Sosia pericolosi']].map(([id,name])=>`<button type="button" class="btn ghost small" data-plant-category="${id}" aria-pressed="false">${name}</button>`).join('')}</div>${filters}</div><details class="report-safety context-note"><summary>Le schede e i filtri non certificano la commestibilità.</summary><p>Confronta l’intera pianta, anche con i sosia tossici. Non assaggiare per riconoscere una specie. Il catalogo è incompleto; parti alimentari e preparazione sono indicate nella scheda. Prima di raccogliere verifica permessi, tutela e regole del luogo.</p></details><div data-flower-slot></div><p class="small muted" data-plant-count role="status"></p><div class="${identify?'botanical-grid':'card-grid'}" data-plant-results></div>${identify?'':'<div data-also-slot></div>'}`;
  const input=box.querySelector('[data-plant-query]'),select=box.querySelector('[data-plant-habitat]');
  const panel=box.querySelector('.plant-filter-panel'),opener=box.querySelector('[data-open-plant-filters]');
  if(panel){
    opener.addEventListener('click',()=>openModal(panel));
    panel.querySelectorAll('[data-close-plant-filters]').forEach(b=>b.addEventListener('click',()=>panel.close()));
    panel.addEventListener('close',()=>opener.isConnected&&opener.focus({preventScroll:true}));
    panel.querySelector('[data-reset-plant-filters]').addEventListener('click',()=>{Object.assign(state,{flowering:false,lookalikes:false,habitat:''});sync();update();});
    addEventListener('hashchange',()=>panel.close(),{once:true});
  }
  if(state.habitat&&!habitats.some(h=>h.name===state.habitat))state.habitat='';
  const sync=()=>{
    if(input)input.value=state.q;
    box.querySelectorAll('[data-plant-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.plantCategory===state.category)));
    box.querySelectorAll('[data-plant-filter]').forEach(x=>x.setAttribute('aria-pressed',String(Boolean(state[x.dataset.plantFilter]))));
    if(select)select.value=state.habitat;
    const n=[state.flowering,state.lookalikes,state.habitat].filter(Boolean).length,badge=box.querySelector('[data-filter-n]');
    if(badge)badge.textContent=n?`· ${n} attiv${n===1?'o':'i'}`:'';
  };
  const update=()=>{
    const hits=filterPlants(all,{...state,month}),filtered=!identify&&activeFilters(state);
    const resultButton=box.querySelector('[data-plant-filter-results]');if(resultButton)resultButton.textContent=`Mostra ${hits.length} ${hits.length===1?'scheda':'schede'}`;
    box.querySelector('[data-flower-slot]').innerHTML=state.category==='Fiori'?FLOWER_NOTE:'';
    box.querySelector('[data-plant-count]').textContent=`${hits.length} ${hits.length===1?'scheda':'schede'}${filtered?` su ${all.length}`:''}${state.q&&matchSpecies(all.filter(p=>!state.category||p.category===state.category),state.q).byTraits?' · suggerimenti per caratteri':''} · catalogo di confronto`;
    const empty=filtered?'<div class="notice catalog-empty"><p>Nessuna scheda corrisponde a questi filtri. Il catalogo non comprende tutte le piante.</p><button type="button" class="btn ghost small" data-plant-reset>Togli i filtri</button></div>':'<p class="notice">Nessuna scheda corrisponde. Prova un altro carattere: il catalogo non comprende tutte le piante e una corrispondenza non identifica l’esemplare.</p>';
    box.querySelector('[data-plant-results]').innerHTML=hits.length?hits.map(p=>identify?`<article class="botanical-card"><a href="#/pianta/${p.id}" data-entity class="botanical-photo"><img data-src="${esc(ASSET(p.photos[0].file))}" width="826" height="590" alt="${esc(p.photos[0].alt)}" loading="lazy" decoding="async"></a><div class="botanical-card-body"><span class="tag ${isToxic(p)?'warn':''}">${esc(p.category==='Pericolose'?p.foodUse.status.toUpperCase():p.category==='Frutti'?'FRUTTI E BACCHE':p.category.toLocaleUpperCase('it'))}</span><h2><a href="#/pianta/${p.id}" data-entity>${esc(p.name)}</a></h2><i>${esc(p.latin)}</i><p>${esc(p.recognize.slice(0,2).join(' '))}</p><a class="botanical-details" href="#/pianta/${p.id}" data-entity>${p.category==='Pericolose'?'Confronta i caratteri':p.category==='Fiori'?'Caratteri e tutela':'Caratteri, parti e cautele'} →</a></div></article>`:plantCatalogCard(p)).join(''):empty;
    if(!identify)renderAlsoIn(box.querySelector('[data-also-slot]'),state.q,['pianta']);
    box.querySelector('[data-plant-reset]')?.addEventListener('click',()=>{Object.assign(state,{category:'',q:'',flowering:false,lookalikes:false,habitat:''});sync();update();(input||opener)?.focus();});
  };
  input?.addEventListener('input',()=>{state.q=input.value;update();});
  box.querySelectorAll('[data-plant-category]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.plantCategory;sync();update();}));
  box.querySelectorAll('[data-plant-filter]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.plantFilter;state[k]=!state[k];sync();update();}));
  select?.addEventListener('change',()=>{state.habitat=select.value;sync();update();});
  sync();update();
}
function plantModelInfo(model,id){
 const guide=botanicalFieldGuide(model,PLANTS[id]);
 return `<details class="sec botanical-method" name="plant-${id}" data-botanical-method><summary>Quando osservarla e perché</summary><div class="sec-body">${monthCalendar(guide.months,{label:guide.region})}${factCards([{label:'Durante il giro',value:guide.calendar,icon:'calendar'},{label:'Dove guardare',value:guide.habitat,icon:'leaf'}],{glossary:'Piante'})}<p class="small muted">Il periodo è indicativo: quota, clima e condizioni del luogo possono cambiare la fase. La scheda non segnala una presenza verificata sul sentiero.</p></div></details><details class="sec" name="plant-${id}" data-botanical-method-detail><summary>Metodo e limiti dei dati</summary><div class="sec-body"><p>${esc(model.methodNote)}</p><p><b>Calendario.</b> ${esc(model.calendarNote)}</p>${PLANTS[id]?.phaseNote?`<p><b>Fase della pianta.</b> ${esc(PLANTS[id].phaseNote)}</p>`:''}${PLANTS[id]?.presenceNote?`<p>${esc(PLANTS[id].presenceNote)}</p>`:''}<p><b>Ambiente.</b> ${esc(model.habitatNote)}</p>${model.elevationNote?`<p><b>Quota.</b> ${esc(model.elevationNote)}</p>`:''}${sourceRows(model.sources)}</div></details>`;
}

export function renderPlantPage(box,id){
  box.dataset.glossaryContext='Piante';
  const p=PLANTS[id];if(!p){box.innerHTML='<p class="notice">Scheda non disponibile.</p>';return;}
  const model=MODEL_FOR(id);
  const photo=p.photos[0];
  // stesso modello della scheda dei funghi: Attenzione, caratteri a tessere e in elenco, sosia, dove e quando, fonti
  const att=isToxic(p)?attentionBox([{text:p.foodUse.caution,severity:p.foodUse.status==='mortale'?'critico':'importante'}]):'';
  const food=isToxic(p)?'':`<section class="botanical-food"><h2>${p.foodUse.status==='da osservare'?'Pianta da osservare':'Parti e preparazione documentate'}</h2>${factCards([{label:'Parti documentate',value:p.foodUse.parts,icon:'leaf'},{label:'Preparazione e cautele',value:p.foodUse.caution,icon:'shield',tone:'caution'}],{glossary:'Piante'})}</section>`;
  // la nota sui sosia si vede anche quando la specie simile non ha una scheda nel catalogo (lookalikes vuoto)
  const look=p.lookalikes.length||p.lookalikeNote?`<h3>${p.foodUse.status==='solo parti e preparazioni indicate'?'Non confonderlo con':'Specie simili'}</h3>${p.lookalikes.length?`<ul class="tx-look">${p.lookalikes.map(other=>{const o=PLANTS[other],m=o?.photos?.[0],risk=o&&isToxic(o)?o.foodUse.status:'';return `<li><a class="tx-look-main" data-entity href="#/pianta/${esc(other)}">${m?`<img data-src="${esc(ASSET(m.thumb||m.file))}" alt="" loading="lazy" decoding="async">`:''}<span><b>${esc(plantName(other))}</b><i>${esc(cardLatin(o?.latin||''))}</i>${risk?`<small class="tx-c tox-${risk==='mortale'?'mortale':'tossico'}"><span class="tox">${esc(risk)}</span></small>`:''}</span></a><a class="btn ghost small" href="#/confronta/piante/${esc(id)}/${esc(other)}">Confronta</a></li>`;}).join('')}</ul>`:''}${p.lookalikeNote?`<p class="small" data-glossary="Piante">${esc(p.lookalikeNote)}</p>`:''}`:'';
  box.innerHTML=`<header class="phero phero-tall"><button type="button" class="phero-img" data-plant-zoom="0" aria-label="Ingrandisci la fotografia"><img data-src="${esc(ASSET(photo.file))}" alt="${esc(photo.alt)}" width="826" height="590"></button><span class="shade"></span><div class="phero-body"><p class="sp-badges"><span class="pill glass">${esc(isToxic(p)?p.foodUse.status.toUpperCase():p.category)}</span></p><h1 class="phero-title">${esc(p.name)}</h1><p class="phero-sub"><i>${esc(p.latin)}</i></p></div></header><div class="pbody">${p.photos.length>1?`<div class="sp-strip">${p.photos.slice(1).map((m,i)=>`<button type="button" class="zoomable" data-plant-zoom="${i+1}" aria-label="Foto ${i+2}: ingrandisci"><img data-src="${esc(ASSET(m.thumb||m.file))}" alt="${esc(m.alt)}" loading="lazy" decoding="async"></button>`).join('')}</div>`:''}<button type="button" class="btn ghost plant-note-action" data-note-kind="pianta" data-note-id="${id}" data-note-title="${esc(p.name)}">${notebookGlyph}<span>Annota nel taccuino</span></button><a class="btn ghost" href="#/confronta/piante/${esc(id)}">Confronta questa pianta</a>${att}<h3>Caratteri da confrontare</h3><div data-plant-traits="${esc(id)}"></div><details class="sec character-details"><summary>Cosa controllare da vicino</summary><div class="sec-body"><ol class="keys" data-glossary="Piante">${p.recognize.map(s=>`<li><span class="key-text">${esc(s)}</span></li>`).join('')}</ol></div></details>${food}${p.protection?`<section class="notice plant-protection" data-plant-protection><h2>Tutela</h2><p>${esc(p.protection.summary)}</p><p class="small muted">${esc(p.protection.law)} · <a href="${esc(p.protection.url)}" target="_blank" rel="noopener">Testo della norma</a></p></section>`:''}${look}<section class="species-habitat"><h3>Dove e quando</h3>${factCards([{label:'Ambiente',value:p.habitat,icon:'pin',wide:true}],{glossary:'Piante'})}${monthCalendar(p.flowerMonths,{label:'Fioritura indicativa'})}</section>${model?'':`<details class="context-note"><summary>Periodo e presenza sul sentiero</summary><p>Periodo indicativo, non un calendario di raccolta né una presenza verificata sul sentiero. ${esc(p.phaseNote)}</p>${p.presenceNote?`<p>${esc(p.presenceNote)}</p>`:''}</details>`}${model?plantModelInfo(model,id):''}<div class="sp-more"><details class="sec" name="plant-${id}"><summary>Fonti e fotografie</summary><div class="sec-body">${sourceRows(p.sources)}${p.photos.length?`<p class="src-h">Fotografie</p>${photoRows(p.photos.map(m=>({...m,source:m.source||'Fotografia originale e attribuzione'})))}`:''}</div></details></div></div>`;
  enhanceEntityAccordions(box);
  Promise.all([loadKeyData('piante'),loadPlantArtwork()]).then(([d,artwork])=>{const slot=box.querySelector(`[data-plant-traits="${CSS.escape(id)}"]`);if(slot&&d?.items?.[id])slot.innerHTML=traitTilesHtml(d,d.items[id].traits,artwork?.values,'piante',artwork?.species?.[id])+(artwork?'<p class="small muted ts-ai">Disegni schematici, non foto: confronta con il testo e le foto.</p>':'');});
  const gallery=p.photos.map(m=>({src:ASSET(m.file_hd||m.file),alt:m.alt,caption:captionHtml({title:esc(p.name),text:esc(m.caption),credit:`${esc(m.attribution_required_text || m.author)} · <a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener">${esc(m.license)}</a> · <a href="${esc(m.page)}" target="_blank" rel="noopener">Originale</a>`})}));
  mountInlineGallery(box,gallery,{selector:'[data-plant-zoom]',indexOf:b=>Number(b.dataset.plantZoom)});
}
