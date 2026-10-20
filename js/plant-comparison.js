import {plants,plantHeroSrc} from './plants.js';
import {loadKeyData,loadPlantArtwork,traitTilesHtml} from './guided-key.js';
import {mountCompareStart,openComparePicker} from './compare-picker.js';
import {sourceRows} from './identify.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={choose:'Scegli una pianta',change:'Cambia pianta',reference:'Scegli la pianta di riferimento',all:'Tutte le piante'};
const photo=t=>({file:plantHeroSrc(t.key)});
const route=(a,b)=>`#/confronta/piante/${encodeURIComponent(a)}/${encodeURIComponent(b)}`;
const related=t=>plants().filter(p=>(t.lookalikes||[]).includes(p.id)).map(p=>({...p,key:p.id,toxicity:p.foodUse.status}));
export function plantComparisonRows(data,left,right){
 return Object.entries(data.schema).map(([key,schema])=>{
  const a=[].concat(left?.traits?.[key]??[]),b=[].concat(right?.traits?.[key]??[]);
  const kind=!a.length||!b.length?'unknown':a.length===b.length&&a.every(v=>b.includes(v))?'same':a.some(v=>b.includes(v))?'overlap':'different';
  return {key,schema,a,b,kind};
 });
}
export async function renderPlantComparison(box,left='',right=''){
 const token={},initialHash=location.hash;box._plantComparison=token;box.dataset.glossaryContext='Piante';
 const taxa=plants().map(p=>({...p,key:p.id,toxicity:p.foodUse.status,features:p.recognize}));
 const a=taxa.find(p=>p.key===left),b=taxa.find(p=>p.key===right);
 if(!a||!b||a.key===b.key){
  mountCompareStart(box,{taxa,photo,asset:f=>f,related,left,right,labels,onCompare:(a,b)=>location.hash=route(a.key,b.key)});return;
 }
 box.innerHTML='<p role="status">Carico i caratteri del confronto…</p>';
 const [data,artwork]=await Promise.all([loadKeyData('piante'),loadPlantArtwork()]);
 if(box._plantComparison!==token||location.hash!==initialHash)return;
 if(!data){box.innerHTML='<p class="notice">Caratteri non disponibili. <a href="#/piante">Apri le schede delle piante</a>.</p>';return;}
 const rows=plantComparisonRows(data,data.items[a.key],data.items[b.key]);
 const relation=(data.confusables||[]).find(c=>c.ids.includes(a.key)&&c.ids.includes(b.key));
 const documented=(a.lookalikes||[]).includes(b.key)||(b.lookalikes||[]).includes(a.key)||!!relation;
 const value=(p,row)=>{
  const traits=data.items[p.key]?.traits||{},values=[].concat(traits[row.key]??[]);
  if(!values.length)return '<p class="plant-cmp-unknown">Non documentato</p>';
  if(row.key==='special')return `<ul>${values.map(v=>`<li>${esc(row.schema.values.find(x=>x.id===v)?.label||v)}</li>`).join('')}</ul>`;
  return traitTilesHtml({...data,schema:{[row.key]:{...row.schema,ask:true}}},{[row.key]:traits[row.key]},artwork?.values,'piante',artwork?.species?.[p.key]);
 };
 const header=p=>`<div class="plant-cmp-species"><button type="button" class="btn ghost" data-change-plant="${esc(p.key)}" aria-haspopup="dialog">${esc(p.name)} <span aria-hidden="true">⌄</span></button><a href="#/pianta/${esc(p.key)}"><img src="${esc(plantHeroSrc(p.key))}" alt="${esc(p.photos[0]?.alt||p.name)}" loading="lazy"><i>${esc(p.latin)}</i></a><small>${esc(p.foodUse.status)}</small><a href="#/pianta/${esc(p.key)}">Apri la scheda →</a></div>`;
 box.innerHTML=`<div class="plant-compare"><div class="plant-cmp-pair">${header(a)}${header(b)}</div><p class="small">${documented?'Specie simili documentate.':'Confronto libero di due specie del catalogo.'} I caratteri non identificano un esemplare e non certificano la commestibilità.</p>
 <div class="recognize-modes plant-cmp-filters" role="group" aria-label="Caratteri da mostrare"><button type="button" class="btn ghost small" data-cmp-filter="all" aria-pressed="true">Tutti</button><button type="button" class="btn ghost small" data-cmp-filter="different" aria-pressed="false">Differenze</button><button type="button" class="btn ghost small" data-cmp-filter="same" aria-pressed="false">In comune</button><button type="button" class="btn ghost small" data-cmp-filter="unknown" aria-pressed="false">Dati incompleti</button></div>
 <p class="small muted">I valori parzialmente sovrapposti mostrano varianti in comune e differenti. «Non documentato» indica un dato mancante. I disegni sono schematici; le forme che richiedono una revisione per specie restano testuali finché non è disponibile un disegno approvato.</p>
 <div class="plant-cmp-rows">${rows.map(row=>`<section class="plant-cmp-row" data-comparison-kind="${row.kind}"><h3>${esc(row.schema.short)} <small>${{same:'In comune',different:'Differenti',overlap:'In parte in comune',unknown:'Dati incompleti'}[row.kind]}</small></h3><div class="plant-cmp-pair"><div aria-label="${esc(a.name)}">${value(a,row)}</div><div aria-label="${esc(b.name)}">${value(b,row)}</div></div></section>`).join('')}</div><p class="small" data-comparison-empty hidden>Nessun carattere in questo gruppo.</p>
 ${relation?`<aside class="notice" data-glossary="Piante"><h3>Da controllare insieme</h3><ul>${relation.differences.map(([,text])=>`<li>${esc(text)}</li>`).join('')}</ul><p>${esc(relation.caution||'')}</p></aside>`:''}
 <details class="sec"><summary>Fonti del confronto</summary><div class="sec-body">${sourceRows([...a.sources,...b.sources,...(data.items[a.key]?.sources||[]),...(data.items[b.key]?.sources||[])])}</div></details><p class="notice">Non assaggiare una pianta per riconoscerla. Consulta cautele, specie simili e fonti nelle schede.</p><a class="btn ghost" href="#/confronta/piante">Scegli un nuovo confronto</a></div>`;
 box.querySelectorAll('[data-change-plant]').forEach(button=>button.onclick=()=>{
  const master=button.dataset.changePlant===a.key,current=master?a:b,other=master?b:a;
  openComparePicker({taxa,photo,asset:f=>f,title:labels.choose,allLabel:labels.all,current:current.key,exclude:other.key,related:related(other),onSelect:t=>location.hash=master?route(t.key,b.key):route(a.key,t.key)});
 });
 box.querySelectorAll('[data-cmp-filter]').forEach(button=>button.onclick=()=>{
  box.querySelectorAll('[data-cmp-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const filter=button.dataset.cmpFilter;
  const nodes=[...box.querySelectorAll('[data-comparison-kind]')];nodes.forEach(row=>row.hidden=filter!=='all'&&(filter==='different'?!['different','overlap'].includes(row.dataset.comparisonKind):filter==='same'?!['same','overlap'].includes(row.dataset.comparisonKind):row.dataset.comparisonKind!=='unknown'));
  box.querySelector('[data-comparison-empty]').hidden=nodes.some(row=>!row.hidden);
 });
}
