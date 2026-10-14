// Botanical descriptions are independent of the mushroom weather index.
import {openLightbox,captionHtml} from './lightbox.js';
import {filterPlants,plantHabitats} from './plant-catalog.js';
import { cardLatin } from './names.js';
export {searchPlants} from './plant-catalog.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let PLANTS={},ASSET=f=>f,MODEL_FOR=()=>null;
export function initPlants(data,assetUrl,modelFor){if(modelFor)MODEL_FOR=modelFor;PLANTS=data?.plants||{};if(assetUrl)ASSET=assetUrl;}
export const plants=()=>Object.entries(PLANTS).map(([id,p])=>({...p,id}));
export const plantRecord=id=>PLANTS[id];
export const plantName=id=>PLANTS[id]?.name||'';
export function plantThumb(id,size=44){const p=PLANTS[id],m=p?.photos?.[0];return m?`<img class="thumb" data-src="${esc(ASSET(m.file))}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`:'';}
function plantCatalogCard(p){
  const photo=p.photos?.[0],risk=p.category==='Pericolose'?p.foodUse.status:'';
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
  const search=identify?'<label>Nome o caratteri che osservi<input type="search" class="wiz-input" autocomplete="off" placeholder="Foglie dentate, fiori bianchi…" data-plant-query></label>':'<label class="search-box plant-catalog-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" aria-label="Cerca una pianta" autocomplete="off" placeholder="Ortica, more, nome scientifico…" data-plant-query></label>';
  const habitats=identify?[]:plantHabitats(all);
  const filters=identify?'':`<div class="recognize-modes catalog-filters" role="group" aria-label="Altri filtri"><button type="button" class="btn ghost small" data-plant-filter="flowering" aria-pressed="false">In fiore a ${esc(monthName(month))}</button><button type="button" class="btn ghost small" data-plant-filter="lookalikes" aria-pressed="false">Simile a piante pericolose</button>${habitats.length?`<select class="catalog-select" aria-label="Ambiente" data-plant-habitat><option value="">Ambiente: tutti</option>${habitats.map(h=>`<option value="${esc(h.name)}">${esc(h.name)}</option>`).join('')}</select>`:''}</div>`;
  box.innerHTML=`<div class="botanical-tools">${search}<div class="recognize-modes" role="group" aria-label="Gruppi di piante">${[['','Tutte'],['Erbe','Erbe'],['Frutti','Frutti e bacche'],['Arbusti','Arbusti'],['Pericolose','Sosia pericolosi']].map(([id,name])=>`<button type="button" class="btn ghost small" data-plant-category="${id}" aria-pressed="false">${name}</button>`).join('')}</div>${filters}</div><details class="report-safety"><summary>Le schede e i filtri non certificano la commestibilità.</summary><p>Confronta l’intera pianta, anche con i sosia tossici. Non assaggiare per riconoscere una specie. Il catalogo è incompleto; parti alimentari e preparazione sono indicate nella scheda. Prima di raccogliere verifica permessi, tutela e regole del luogo.</p></details><p class="small muted" data-plant-count role="status"></p><div class="${identify?'botanical-grid':'card-grid'}" data-plant-results></div>`;
  const input=box.querySelector('[data-plant-query]'),select=box.querySelector('[data-plant-habitat]');
  if(state.habitat&&!habitats.some(h=>h.name===state.habitat))state.habitat='';
  const sync=()=>{
    input.value=state.q;
    box.querySelectorAll('[data-plant-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.plantCategory===state.category)));
    box.querySelectorAll('[data-plant-filter]').forEach(x=>x.setAttribute('aria-pressed',String(Boolean(state[x.dataset.plantFilter]))));
    if(select)select.value=state.habitat;
  };
  const update=()=>{
    const hits=filterPlants(all,{...state,month}),filtered=!identify&&activeFilters(state);
    box.querySelector('[data-plant-count]').textContent=`${hits.length} ${hits.length===1?'scheda':'schede'}${filtered?` su ${all.length}`:''} · catalogo di confronto`;
    const empty=filtered?'<div class="notice catalog-empty"><p>Nessuna scheda corrisponde a questi filtri. Il catalogo non comprende tutte le piante.</p><button type="button" class="btn ghost small" data-plant-reset>Togli i filtri</button></div>':'<p class="notice">Nessuna scheda corrisponde. Prova un altro carattere: il catalogo non comprende tutte le piante e una corrispondenza non identifica l’esemplare.</p>';
    box.querySelector('[data-plant-results]').innerHTML=hits.length?hits.map(p=>identify?`<article class="botanical-card"><a href="#/pianta/${p.id}" data-entity class="botanical-photo"><img data-src="${esc(ASSET(p.photos[0].file))}" width="826" height="590" alt="${esc(p.photos[0].alt)}" loading="lazy" decoding="async"></a><div class="botanical-card-body"><span class="tag ${p.category==='Pericolose'?'warn':''}">${esc(p.category==='Pericolose'?p.foodUse.status.toUpperCase():p.category==='Frutti'?'FRUTTI E BACCHE':p.category.toLocaleUpperCase('it'))}</span><h2><a href="#/pianta/${p.id}" data-entity>${esc(p.name)}</a></h2><i>${esc(p.latin)}</i><p>${esc(p.recognize.slice(0,2).join(' '))}</p><a class="botanical-details" href="#/pianta/${p.id}" data-entity>${p.category==='Pericolose'?'Confronta i caratteri':'Caratteri, parti e cautele'} →</a></div></article>`:plantCatalogCard(p)).join(''):empty;
    box.querySelector('[data-plant-reset]')?.addEventListener('click',()=>{Object.assign(state,{category:'',q:'',flowering:false,lookalikes:false,habitat:''});sync();update();input.focus();});
  };
  input.addEventListener('input',()=>{state.q=input.value;update();});
  box.querySelectorAll('[data-plant-category]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.plantCategory;sync();update();}));
  box.querySelectorAll('[data-plant-filter]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.plantFilter;state[k]=!state[k];sync();update();}));
  select?.addEventListener('change',()=>{state.habitat=select.value;update();});
  sync();update();
}
function plantModelInfo(model,id){
 const months=model.phaseMonths?.map(m=>new Date(2026,m-1,1).toLocaleDateString('it-IT',{month:'long'})).join(' · ');
 return `<details class="sec botanical-method" name="plant-${id}" data-botanical-method><summary>Quando osservarla e perché</summary><div class="sec-body"><p><b>${esc(model.phaseLabel)}</b>${months?`: ${esc(months)}`:': calendario non documentato'}.</p><p>${esc(model.calendarNote)}</p><p>${esc(model.habitatNote)}</p><p class="small muted">Queste informazioni accompagnano i consigli di uscita nel blocco “Durante il giro”. Il calendario e l’ambiente compatibile non dimostrano presenza, maturità o quantità.</p><details><summary>Fonti della fase e dell’ambiente</summary><ul>${model.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul></details></div></details>`;
}
export function renderPlantPage(box,id){
  box.dataset.glossaryContext='Piante';
  const p=PLANTS[id];if(!p){box.innerHTML='<p class="notice">Scheda non disponibile.</p>';return;}
  const model=MODEL_FOR(id);
  const photo=p.photos[0],months=p.flowerMonths.map(m=>new Date(2026,m-1,1).toLocaleDateString('it-IT',{month:'short'})).join(' · ');
  box.innerHTML=`<header class="phero phero-tall"><button type="button" class="phero-img" data-plant-zoom="0" aria-label="Ingrandisci la fotografia"><img data-src="${esc(ASSET(photo.file))}" alt="${esc(photo.alt)}" width="826" height="590"></button><span class="shade"></span><div class="phero-body"><p class="sp-badges"><span class="pill glass">${esc(p.category==='Pericolose'?p.foodUse.status.toUpperCase():p.category)}</span></p><h1 class="phero-title">${esc(p.name)}</h1><p class="phero-sub"><i>${esc(p.latin)}</i></p></div></header><div class="pbody">${p.photos.length>1?`<div class="sp-strip">${p.photos.slice(1).map((m,i)=>`<button type="button" class="zoomable" data-plant-zoom="${i+1}" aria-label="Foto ${i+2}: ingrandisci"><img data-src="${esc(ASSET(m.thumb||m.file))}" alt="${esc(m.alt)}" loading="lazy" decoding="async"></button>`).join('')}</div>`:''}<button type="button" class="btn ghost" data-note-kind="pianta" data-note-id="${id}" data-note-title="${esc(p.name)}">＋ Annota nel taccuino</button><h2>Caratteri da confrontare</h2><ol class="keys">${p.recognize.map(s=>`<li><span class="key-text">${esc(s)}</span></li>`).join('')}</ol><section class="botanical-food ${p.category==='Pericolose'?'notice-danger':''}"><h2>${p.category==='Pericolose'?'Specie pericolosa':p.foodUse.status==='da osservare'?'Pianta da osservare':'Parti e preparazione documentate'}</h2>${p.foodUse.parts?`<p><strong>${esc(p.foodUse.parts)}</strong></p>`:''}<p>${esc(p.foodUse.caution)}</p></section>${p.lookalikes.length?`<h2>Confronta anche</h2><div class="tree-fungi">${p.lookalikes.map(other=>`<a href="#/pianta/${other}" class="tf" data-entity>${plantThumb(other,52)}<span>${esc(plantName(other))}</span></a>`).join('')}</div>`:''}${model?plantModelInfo(model,id):''}<div class="sp-more"><details class="sec" name="plant-${id}"><summary>Habitat e fasi dell’anno</summary><div class="sec-body"><p>${esc(p.habitat)}</p><p><b>Fioritura indicativa:</b> ${months}.</p><p class="small muted">Periodo botanico descritto dalla fonte; non è un calendario di raccolta né una presenza verificata sul sentiero.</p><p>${esc(p.phaseNote)}</p></div></details><details class="sec" name="plant-${id}"><summary>Fonti e fotografia</summary><div class="sec-body"><ul class="small sources">${p.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}${p.photos.map(m=>`<li>${esc(m.author)} · <a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener">${esc(m.license)}</a> · <a href="${esc(m.page)}" target="_blank" rel="noopener">Fotografia originale e attribuzione</a></li>`).join('')}</ul></div></details></div></div>`;
  const gallery=p.photos.map(m=>({src:ASSET(m.file_hd||m.file),alt:m.alt,caption:captionHtml({title:esc(p.name),text:esc(m.caption),credit:`${esc(m.author)} · <a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener">${esc(m.license)}</a> · <a href="${esc(m.page)}" target="_blank" rel="noopener">Originale</a>`})}));
  box.querySelectorAll('[data-plant-zoom]').forEach(b=>b.onclick=()=>openLightbox(gallery,+b.dataset.plantZoom,{container:box.closest('dialog')||document.body}));
}
