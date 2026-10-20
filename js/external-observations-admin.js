import {EXTERNAL_ENUMS,externalUsability} from './external-observation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={sourceType:'Tipo di fonte',outcome:'Esito',evidence:'Tipo di testimonianza',datePrecision:'Precisione della data',spatialScope:'Precisione del luogo',quality:'Qualità della fonte',reviewStatus:'Revisione',
 sourceUrl:'Link alla fonte',sourceLabel:'Nome della fonte',sourceRecordId:'Riferimento nella fonte',publicationLabel:'Data di pubblicazione come mostrata',publishedOn:'Giorno di pubblicazione verificato',observedOn:'Giorno dell’osservazione verificato',observationLabel:'Quando è avvenuta l’osservazione',placeName:'Zona ampia dichiarata',province:'Provincia',reportedTaxon:'Specie come dichiarata',scientificName:'Nome scientifico risolto',zoneId:'Zona del catalogo',taxonId:'Specie del catalogo',summary:'Sintesi',limitations:'Limiti e incertezze',license:'Licenza o condizioni della fonte',attribution:'Attribuzione',eventKey:'Gruppo evento per i duplicati',effortMinutes:'Durata effettiva della ricerca (minuti)'};
const values={facebook:'Facebook',inaturalist:'iNaturalist',forum:'Forum',editorial:'Bollettino o articolo',other:'Altra fonte',presence:'Presenza',searched_absent:'Ricerca esplicita a vuoto',absence_claim:'Assenza dichiarata senza ricerca documentata',mixed:'Esito misto',context:'Solo contesto',direct:'Testimonianza diretta',reported:'Sentito dire',identification:'Osservazione con identificazione',model:'Previsione o modello',day:'Giorno esatto',month:'Solo mese',relative:'Data relativa',unknown:'Sconosciuta',zone:'Zona del catalogo',municipality:'Comune / area dichiarata',province:'Provincia',region:'Regione',multi_area:'Più aree non separabili',research:'Confermata dalla fonte',needs_id:'Identificazione da confermare',unverified:'Non verificata',pending:'Da revisionare',accepted:'Accettata',excluded:'Esclusa'};
const when=n=>new Date(n).toLocaleString('it-IT');
const usability=u=>u.regional?(u.zone?'Utilizzabile anche per la zona del catalogo':'Utilizzabile alla scala dichiarata'):u.reasons.join(' · ');
const select=(key,value,options,blank=false)=>`<label>${esc(labels[key])}<select name="${key}">${blank?'<option value="">Non risolta</option>':''}${options.map(([v,l])=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
const input=(k,value,type='text')=>`<label>${esc(labels[k])}<input name="${k}" type="${type}" value="${esc(value)}"${type==='number'?' min="1" max="1440" step="1"':''}></label>`;

export function mountExternalObservations(root,{api}){
 let list,catalog,current=null,dead=false,loading=false,dirty=false,detailRevision=0;
 const filters={q:'',status:'',source:'',page:0};
 const status=(text,error=false)=>{const el=root.querySelector('[data-external-status]');if(el){el.textContent=text;el.classList.toggle('error',error);}};
 function scaffold(){
  root.innerHTML=`<section class="admin-section external-register"><header class="admin-heading"><div><p class="eyebrow">Fonti esterne</p><h2>Registro delle segnalazioni</h2><p>Consulta, correggi e revisiona ritrovamenti, ricerche a vuoto e informazioni di contesto.</p></div><button class="btn primary" type="button" data-new>Nuova segnalazione</button></header><p class="cms-status" role="status" aria-live="polite" data-external-status></p><p class="small muted">Il motore legge solo i dati con i requisiti necessari. Date mancanti, sentito dire e previsioni restano distinguibili. Queste fonti non entrano nei contributi volontari né cambiano automaticamente l’indice.</p><form data-external-filters class="external-filters"><label>Cerca luogo o specie<input type="search" name="q" maxlength="160"></label><label>Revisione<select name="status"><option value="">Tutte</option>${EXTERNAL_ENUMS.reviewStatus.map(v=>`<option value="${v}">${values[v]}</option>`).join('')}</select></label><label>Fonte<select name="source"><option value="">Tutte</option>${EXTERNAL_ENUMS.sourceType.map(v=>`<option value="${v}">${values[v]}</option>`).join('')}</select></label><button class="btn ghost" type="submit">Cerca</button></form><div class="cms-actions"><button class="btn ghost" type="button" data-export>Esporta per il motore</button><button class="btn ghost" type="button" data-external-refresh>Rileggi il registro</button></div><p data-external-count></p><div class="admin-records" data-external-list></div><div class="cms-actions"><button class="btn ghost" type="button" data-prev>Precedenti</button><span data-page></span><button class="btn ghost" type="button" data-next>Successive</button></div><section data-external-editor aria-label="Modifica segnalazione"></section></section>`;
  root.querySelector('[data-external-filters]').onsubmit=e=>{e.preventDefault();const f=e.target;filters.q=f.elements.q.value;filters.status=f.elements.status.value;filters.source=f.elements.source.value;filters.page=0;load();};
  root.querySelector('[data-prev]').onclick=()=>{filters.page--;load();};root.querySelector('[data-next]').onclick=()=>{filters.page++;load();};
  root.querySelector('[data-external-refresh]').onclick=load;
  root.querySelector('[data-new]').onclick=()=>{
   if(!catalog){status('Attendi il caricamento del registro o premi Rileggi il registro.',true);return;}
   if(dirty){status('Salva la modifica aperta o premi Annulla prima di creare una voce.',true);return;}
   current={id:null,version:0,data:Object.fromEntries([...Object.keys(labels)].map(k=>[k,null]))};
   Object.assign(current.data,{sourceType:'other',outcome:'context',evidence:'context',datePrecision:'unknown',spatialScope:'unknown',quality:'unverified',reviewStatus:'pending',searched:false,eventKey:crypto.randomUUID()});
   renderEditor();
  };
  root.querySelector('[data-export]').onclick=async()=>{
   status('Preparo il dataset…');
   try{const data=await api('external-observations/engine');if(dead)return;const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='fronda-segnalazioni-motore.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);status(`${data.occurrences.length} osservazioni utilizzabili; ${data.excluded.length} voci escluse con motivo nel file. Nessun effetto automatico sull’indice.`);}
   catch(e){status(e.message,true);}
  };
 }
 async function open(id){
  if(dirty){status('Salva la modifica aperta o premi Annulla prima di cambiare voce.',true);return;}
  const n=++detailRevision;
  try{const next=await api('external-observations/'+id);if(dead||n!==detailRevision)return;current=next;renderEditor();}
  catch(e){status(e.message,true);}
 }
 function renderList(){
  root.querySelector('[data-external-count]').textContent=`${list.total} voci · pagina ${list.page+1}. Ogni voce è una fonte o un resoconto, non necessariamente un’uscita indipendente.`;
  root.querySelector('[data-page]').textContent=String(list.page+1);
  root.querySelector('[data-prev]').disabled=list.page===0;root.querySelector('[data-next]').disabled=(list.page+1)*list.pageSize>=list.total;
  root.querySelector('[data-external-list]').innerHTML=list.items.length?list.items.map(r=>`<article><h3>${esc(r.data.placeName)}</h3><p><b>${esc(r.data.reportedTaxon||'Specie non dichiarata')}</b> · ${esc(values[r.data.outcome])}</p><p>${esc(r.data.summary)}</p><p class="small muted">${esc(r.data.observedOn||r.data.observationLabel||'Data osservazione sconosciuta')} · ${esc(values[r.data.reviewStatus])} · ${esc(r.data.sourceLabel)}</p><p class="small">${esc(usability(r.usability))}</p><div class="cms-actions"><a href="${esc(r.data.sourceUrl)}" target="_blank" rel="noopener noreferrer">Apri fonte</a><button class="btn ghost" type="button" data-edit="${esc(r.id)}">Consulta e modifica</button></div></article>`).join(''):'<p>Nessuna voce per questi filtri.</p>';
  root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>open(b.dataset.edit));
 }
 function renderEditor(restored){
  const r=restored||current.data,box=root.querySelector('[data-external-editor]');
  box.innerHTML=`<div class="external-editor"><h3>${current.id?'Modifica segnalazione':'Nuova segnalazione'}</h3><p class="small" data-usability>${esc(usability(externalUsability(r)))}</p><form data-external-form><div class="external-fields">${['sourceType','reviewStatus','outcome','evidence','quality'].map(k=>select(k,r[k],EXTERNAL_ENUMS[k].map(v=>[v,values[v]]))).join('')}${input('sourceLabel',r.sourceLabel)}${input('sourceUrl',r.sourceUrl,'url')}${input('placeName',r.placeName)}${input('province',r.province)}${select('spatialScope',r.spatialScope,EXTERNAL_ENUMS.spatialScope.map(v=>[v,values[v]]))}${select('zoneId',r.zoneId,catalog.zones.map(z=>[z.id,z.name]),true)}${input('reportedTaxon',r.reportedTaxon)}${select('taxonId',r.taxonId,catalog.taxa.map(t=>[t.id,t.name+' · '+t.latin]),true)}${input('scientificName',r.scientificName)}${select('datePrecision',r.datePrecision,EXTERNAL_ENUMS.datePrecision.map(v=>[v,values[v]]))}${input('observedOn',r.observedOn,'date')}${input('observationLabel',r.observationLabel)}${input('publicationLabel',r.publicationLabel)}${input('publishedOn',r.publishedOn,'date')}${input('effortMinutes',r.effortMinutes,'number')}<label class="external-check"><input type="checkbox" name="searched"${r.searched?' checked':''}> La ricerca di questa specie è dichiarata esplicitamente</label></div><label>Sintesi<textarea name="summary" maxlength="2000" required>${esc(r.summary)}</textarea></label><label>Limiti e incertezze<textarea name="limitations" maxlength="2000">${esc(r.limitations)}</textarea></label><details><summary>Fonte, licenza e duplicati</summary><div class="external-fields">${input('sourceRecordId',r.sourceRecordId)}${input('license',r.license)}${input('attribution',r.attribution)}${input('eventKey',r.eventKey)}</div><p class="small muted">Voci relative allo stesso evento usano lo stesso gruppo. Una fonte già presente non viene importata due volte.</p></details><label>Motivo della revisione<textarea name="reason" minlength="5" maxlength="500" required placeholder="Quale dato hai verificato o corretto?"></textarea></label><div class="cms-actions"><button class="btn primary" type="submit">Salva segnalazione</button><button class="btn ghost" type="button" data-cancel>Annulla</button></div></form><h4>Storico delle revisioni</h4><ol>${(current.history||[]).map(h=>`<li>Revisione ${h.version} · ${esc(when(h.updatedAt))}<p>${esc(h.reason)}</p><button class="btn ghost small" type="button" data-restore="${h.version}">Riprendi questi valori</button></li>`).join('')||'<li>Il primo salvataggio registrerà la voce.</li>'}</ol></div>`;
  const f=box.querySelector('form');
  f.oninput=()=>{dirty=true;};
  f.elements.taxonId.onchange=()=>{const t=catalog.taxa.find(t=>t.id===f.elements.taxonId.value);if(t)f.elements.scientificName.value=t.latin;};
  f.elements.zoneId.onchange=()=>{if(f.elements.zoneId.value)f.elements.spatialScope.value='zone';else if(f.elements.spatialScope.value==='zone')f.elements.spatialScope.value='unknown';};
  f.elements.observedOn.onchange=()=>{f.elements.datePrecision.value=f.elements.observedOn.value?'day':'unknown';};
  box.querySelector('[data-cancel]').onclick=()=>{detailRevision++;dirty=false;current=null;box.replaceChildren();status('Modifica chiusa.');};
  box.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{dirty=true;renderEditor(current.history.find(h=>h.version===Number(b.dataset.restore)).data);status('Valori ripresi. Indica il motivo e salva come nuova revisione.');});
  f.onsubmit=async e=>{
   e.preventDefault();dirty=true;const data={...r};
   for(const k of Object.keys(labels))data[k]=f.elements[k]?.value?.trim()||null;
   for(const k of Object.keys(EXTERNAL_ENUMS))data[k]=f.elements[k].value;
   data.searched=f.elements.searched.checked;data.effortMinutes=f.elements.effortMinutes.value?Number(f.elements.effortMinutes.value):null;
   const button=f.querySelector('[type=submit]');button.disabled=true;status('Salvo la segnalazione…');
   try{const saved=await api('external-observations'+(current.id?'/'+current.id:''),current.id?'PATCH':'POST',{data,version:current.version,reason:f.elements.reason.value});if(dead)return;dirty=false;current=saved;renderEditor();await load();status('Segnalazione salvata e riletta dal database. La revisione è nello storico.');}
   catch(e){status(e.message,true);}finally{button.disabled=false;}
  };
  box.scrollIntoView({behavior:'instant',block:'start'});
 }
 async function load(){
  if(loading||dead)return;loading=true;if(!root.childElementCount)scaffold();
  const button=root.querySelector('[data-external-refresh]');button.disabled=true;status('Leggo il registro…');
  try{const next=await api('external-observations?'+new URLSearchParams(filters));if(dead)return;list=next;catalog=next.catalog;renderList();status('Registro aggiornato.');return true;}
  catch(e){status(e.message,true);return false;}finally{loading=false;button.disabled=false;}
 }
 return {load,dispose(){dead=true;detailRevision++;root.replaceChildren();}};
}
