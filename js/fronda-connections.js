// Shared identity and observation rules. No habitat inference or public fallback data.
import {PROVINCES} from './community-aggregate.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function entityIdentity(kind,id,{taxa={},modeledIds=[]}={}){
 const category={pianta:'botanica',albero:'albero',animale:'animale',specie:'fungo',commestibile:'fungo',fungo:'fungo'}[kind];
 if(!category)return null;
 if(category!=='fungo')return {kind,id,category,ids:[id],href:`#/${kind}/${id}`,references:[`#/${kind}/${id}`]};
 const pair=Object.entries(taxa).find(([key,t])=>key===id||t.edible_id===id),taxonId=pair?.[0]||id,modelId=pair?.[1]?.edible_id;
 const ids=[...new Set([id,taxonId,modelId].filter(Boolean))];
 const target=modeledIds.includes(modelId||id)?['specie',modelId||id]:modelId?['commestibile',modelId]:[kind==='fungo'?'fungo':'commestibile',id];
 // Historic notebook references used all three paths, including older alias URLs.
 return {kind:target[0],id:target[1],category,ids,href:`#/${target[0]}/${target[1]}`,references:ids.flatMap(key=>['specie','commestibile','fungo'].map(prefix=>`#/${prefix}/${key}`))};
}
export function entityEntries(entries,context){
 return entries.filter(e=>{
  if(e.kind==='note')return context.references.includes(e.reference?.href)||(e.category===context.category&&context.ids.includes(e.observation?.taxonId));
  return context.category==='fungo'&&(e.kind==='outing'||e.kind==null)&&context.ids.some(id=>Number.isFinite(e.finds?.[id])&&(e.finds[id]>0||e.finds[id]===0&&e.searched?.includes(id)));
 }).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.savedAt||'').localeCompare(String(a.savedAt||'')));
}
export function entityCommunity(summary,context){
 if(summary?.access!=='granted')return {access:summary?.access||'unavailable',records:[]};
 return {access:'granted',records:[
  ...(summary.observations||[]).filter(r=>r.category===context.category&&context.ids.includes(r.taxonId)).map(r=>({...r,series:'notes'})),
  ...(context.category==='fungo'?(summary.reports||[]).filter(r=>context.ids.includes(r.speciesId)).map(r=>({...r,series:'outings'})):[]),
  ...(summary.provinceObservations||[]).filter(r=>r.category===context.category&&context.ids.includes(r.taxonId)).map(r=>({...r,series:'province',note:true})),
  ...(context.category==='fungo'?(summary.provinceReports||[]).filter(r=>context.ids.includes(r.speciesId)).map(r=>({...r,series:'province'})):[]),
 ]};
}
const presence=e=>e.kind!=='note'?'Uscita annotata':e.record?.presence==='observed'?'Osservato':e.record?.presence==='searched_absent'?'Cercato, non osservato':'Appunto';
export function connectionsHtml({notes=[],community,zoneLabel,links=[]}){
 const date=d=>new Date(d+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
 const records=series=>community.records.filter(r=>r.series===series);
 const rows=series=>`<ul>${records(series).map(r=>`<li>${series==='province'?`<b>Provincia di ${esc(PROVINCES[r.province]||r.province)}</b>`:`<a href="#/zona/${esc(r.zoneId)}">${esc(zoneLabel(r.zoneId))}</a>`}<span>${r.sightings} ${series==='outings'||series==='province'&&!r.note?(r.sightings===1?'ritrovamento dichiarato':'ritrovamenti dichiarati'):(r.sightings===1?'osservazione dichiarata':'osservazioni dichiarate')} · ${r.zeros} ${r.zeros===1?'ricerca senza osservazione':'ricerche senza osservazione'}</span></li>`).join('')}</ul>`;
 return `<h2>Nel tuo Fronda</h2><div class="fronda-connections-grid"><div><h3>Le tue osservazioni</h3>${notes.length?`<ul>${notes.slice(0,5).map(e=>`<li><a href="#/diario/pagina/${encodeURIComponent(e.id)}">${esc(date(e.date))} · ${presence(e)}</a>${e.zoneId?`<a class="fronda-note-zone" href="#/zona/${esc(e.zoneId)}">${esc(zoneLabel(e.zoneId))}</a>`:'<span>Zona non indicata</span>'}</li>`).join('')}</ul>`:'<p>Non hai ancora annotazioni collegate a questa scheda.</p>'}<a href="#/diario">Apri il tuo taccuino →</a></div><div><h3>Segnalazioni per zona</h3>${community.access==='granted'?(community.records.length?`${records('notes').length?`<h4>Osservazioni dal Taccuino</h4>${rows('notes')}`:''}${records('outings').length?`<h4>Uscite condivise</h4>${rows('outings')}`:''}${records('province').length?`<h4>Per provincia</h4><p class="small">Quando le singole zone non bastano.${records('outings').length||records('notes').length?' Comprende anche le zone elencate sopra.':''}</p>${rows('province')}`:''}`:'<p>Non ci sono segnalazioni pubblicabili per questa specie negli ultimi 7 giorni. Non significa che sia assente.</p>'):`<p>${esc(community.status)}</p>`}<details class="fronda-sharing-limits"><summary>Come leggiamo le segnalazioni</summary><p>Solo zone ampie o province, negli ultimi 7 giorni, con almeno 3 contributori e 2 giorni diversi. La provincia compare solo se anche la parte non già mostrata per zona rispetta questa soglia. Le segnalazioni sono dichiarate, non verificate: non confermano la presenza attuale. Uscite e osservazioni restano separate perché possono descrivere lo stesso giro. Le tue note restano private finché non scegli di condividerle dal Taccuino.</p></details></div></div><nav class="fronda-connections-links" aria-label="Esplora Fronda da questa scheda">${links.map(l=>`<a href="${esc(l.href)}"${/^#\/(albero|pianta|specie|fungo|commestibile)\/[^/]+$/.test(l.href)?' data-entity':''}>${esc(l.label)}</a>`).join('')}</nav>`;
}
