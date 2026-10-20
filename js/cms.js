import {mountSurveyAdmin} from './survey-admin.js';
import {mountResearchOverview} from './research-overview.js';
import {mountAdminDashboard} from './admin-dashboard.js';
import {mountExternalObservations} from './external-observations-admin.js';
import {openModal} from './modal-flow.js';
import './modal-scroll.js';
import { initCommunity, communityReady, currentUser } from './community.js';
import './images.js';
import { CONTENT_RESOURCES, CONTENT_TEMPLATES, FIELD_LABELS, isLockedField } from './content-schema.js';
import { SURVEY_ID, SURVEY_ENDPOINT } from './survey-schema.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dashboard,externalObservations,surveys,overview,workspaceView;
let actor,items=[],release='0',doc,published,collection='',record='',dirty=false,opening=0;
const editor=$('#cms-editor'),status=$('#cms-status');
const title=k=>FIELD_LABELS[k]||k.replace(/_/g,' ');
const pathCode=p=>esc(encodeURIComponent(JSON.stringify(p)));
const decode=p=>JSON.parse(decodeURIComponent(p));
const blank=v=>Array.isArray(v)?[]:v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,blank(x)])):typeof v==='number'?null:typeof v==='boolean'?false:'';
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
async function api(path,method='GET',data,headers={}) {
  const r=await fetch('/api/cms/v1/'+path,{method,credentials:'same-origin',cache:'no-store',headers:{...(data===undefined?{}:{'content-type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)});
  const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error||'Richiesta non riuscita.'),{status:r.status});return out;
}
function openSurveyExports(){openModal($('#cms-survey-dialog'));void surveyCount();}
function can(scope){return actor?.scopes?.includes(scope);}
async function access() {
  const n=++opening;surveys?.dispose();surveys=null;overview?.dispose();overview=null;dashboard?.dispose();dashboard=null;externalObservations?.dispose();externalObservations=null;
  try {
    const me=await api('me');if(n!==opening)return;actor=me.user;
    const allowed=can('read');$('#cms-access').hidden=allowed;$('#cms-workspace').hidden=!allowed;
    if(!allowed){$('#cms-access-status').textContent=`Il profilo ${actor.name} non ha ancora un ruolo di redazione. Il tuo ID è ${actor.id}.`;return;}
    const role={admin:'Amministratore',editor:'Editor'}[actor.role]||'Redazione';
    $('#cms-identity').textContent=`${actor.name} · ${role} · accesso con passkey`;
    dashboard?.dispose();dashboard=null;
    $('#cms-dashboard-tab').hidden=!can('admin');
    if(can('admin'))dashboard=mountAdminDashboard($('#cms-dashboard'),{api,openSurvey:openSurveyExports});
    if(can('admin'))externalObservations=mountExternalObservations($('#cms-external'),{api});
    if(can('admin')){surveys=mountSurveyAdmin($('#cms-questionnaires'),{api,openExports:openSurveyExports});overview=mountResearchOverview($('#cms-overview'),{api,navigate:setWorkspace,filter:v=>externalObservations.setFilters(v)});}
    document.querySelectorAll('[data-admin-tab]').forEach(b=>b.hidden=!can('admin'));
    setWorkspace(can('admin')?'overview':'content');
    $('#cms-agents').hidden=!can('admin');$('#cms-survey').hidden=!can('admin');
    await refreshItems();
    if(!doc)await openItem(items.find(i=>!i.readonly)?.id);
  }catch(e){if(n!==opening)return;dashboard?.dispose();dashboard=null;$('#cms-workspace').hidden=true;$('#cms-access').hidden=false;$('#cms-access-status').textContent=e.status===401?'Accedi con il pulsante in alto.':e.message;}
}
function setWorkspace(view){
 if(typeof view==='boolean')view=view?'overview':'content';
 if(view!=='surveys'&&surveys?.isDirty()){message('Salva o scarta la compilazione del questionario prima di cambiare sezione.',true);return;}
 if(!['records','sources','impact'].includes(view)&&externalObservations?.isDirty()){message('Salva o annulla la modifica della segnalazione prima di cambiare sezione.',true);return;}
 if(workspaceView==='content'&&view!=='content'&&dirty){message('Salva le modifiche al contenuto prima di cambiare sezione.',true);return;}
 workspaceView=view;
 $('#cms-dashboard').hidden=view!=='policy';$('#cms-content').hidden=view!=='content';$('#cms-overview').hidden=view!=='overview';$('#cms-external').hidden=!['records','sources','impact'].includes(view);$('#cms-questionnaires').hidden=view!=='surveys';
 document.querySelectorAll('[data-workspace]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspace===view)));
 if(view==='overview')overview?.load();
 if(view==='policy')dashboard?.ensureLoaded();
 if(['records','sources','impact'].includes(view)){externalObservations?.setView(view);if(!$('#cms-external [data-external-list]').childElementCount)externalObservations?.load();}
 if(view==='surveys')surveys?.load();
 message('');
}
document.querySelectorAll('[data-workspace]').forEach(b=>b.onclick=()=>setWorkspace(b.dataset.workspace));
async function refreshItems(){const r=await api('items');items=r.items;release=r.release;renderResources();}
function renderResources(){
  const q=$('#cms-resource-search').value.toLowerCase();let group='';
  $('#cms-resources').innerHTML=items.filter(r=>`${r.title} ${r.group}`.toLowerCase().includes(q)).map(r=>{
    const head=r.group!==group?`<p class="cms-resource-group">${esc(group=r.group)}</p>`:'';
    return head+`<button type="button" class="cms-resource" data-resource="${r.id}" aria-current="${doc?.id===r.id}"><span>${esc(r.title)}</span><span class="cms-dot">${r.readonly?'Dati':r.version!==r.publishedVersion?'Bozza':''}</span></button>`;
  }).join('');
}
async function openItem(id){
  if(!id)return;
  if(dirty){message('Salva la bozza o premi “Rileggi” per scartare le modifiche prima di cambiare sezione.');return;}
  const n=++opening;
  editor.inert=true;editor.setAttribute('aria-busy','true');
  try {
    const d=await api('items/'+id),p=await api(`items/${id}/preview?revision=${d.publishedVersion}`);
    if(n!==opening)return;doc=d;published=p.data;collection=CONTENT_RESOURCES.find(r=>r.id===id)?.collections?.[0]||'';record='';dirty=false;renderEditor();renderResources();message('');
  }catch(e){message(e.message,true);}finally{if(n===opening){editor.inert=false;editor.removeAttribute('aria-busy');}}
}
const entries=()=>{const v=collection?doc.data[collection]:null;return Array.isArray(v)?v.map((x,i)=>[String(i),x]):Object.entries(v||{});};
function recordPath(){return collection&&record!==''?[collection,Array.isArray(doc.data[collection])?Number(record):record]:[];}
function valueAt(path){return path.reduce((v,k)=>v?.[k],doc.data);}
function writeAt(path,value){let at=doc.data;for(const k of path.slice(0,-1))at=at[k];at[path.at(-1)]=value;dirty=true;}
function renderEditor(){
  if(doc.id==='trails')for(const z of Object.values(doc.data.zones||{}))for(const t of z.trails||[]){t.editorialNote??='';t.relatedLinks??=[];for(const l of t.relatedLinks)l.caution??='';}
  const schema=CONTENT_RESOURCES.find(r=>r.id===doc.id),rows=entries();if(record===''&&rows.length)record=rows[0][0];
  const path=recordPath(),value=valueAt(path)||doc.data;
  editor.innerHTML=`<p class="eyebrow">${esc(schema.group)}</p><h2>${esc(schema.title)}</h2><div class="cms-meta"><span>Revisione ${doc.version}</span><span>Pubblicata: ${doc.publishedVersion}</span>${schema.readonly?'<span>Dati generati · consultazione</span>':''}</div>
    <div class="cms-toolbar"><button class="btn primary" type="button" data-save ${!can('write')||schema.readonly?'disabled':''}>Salva bozza</button><button class="btn ghost" type="button" data-preview>Anteprima e controlli</button><button class="btn ghost" type="button" data-publish ${!can('publish')||schema.readonly?'disabled':''}>Pubblica bozza</button><button class="btn ghost" type="button" data-reload>Rileggi</button></div>
    ${actor.role==='editor'?'<p class="small muted">Puoi preparare e salvare bozze. La pubblicazione e la verifica delle fonti sono riservate agli amministratori.</p>':''}
    ${schema.readonly?'<p class="small muted">Questi campioni e percorsi provengono dai processi geografici. La redazione li consulta; l’aggiornamento avviene tramite importazione dei dati.</p>':''}
    ${schema.collections.length?`<div class="cms-record-picker"><label>Gruppo<select data-collection>${schema.collections.map(k=>`<option value="${esc(k)}" ${k===collection?'selected':''}>${esc(title(k))}</option>`).join('')}<option value="" ${!collection?'selected':''}>Impostazioni del documento</option></select></label><label>Voce<select data-record>${rows.map(([k,v])=>`<option value="${esc(k)}" ${k===record?'selected':''}>${esc(typeof v==='string'?v.slice(0,70):v.name||v.title||v.term||v.text||v.latin||v.id||k)}</option>`).join('')}</select></label></div>${!schema.readonly&&collection&&doc.id!=='trails'?'<button class="btn ghost small" type="button" data-new>＋ Nuova voce</button>':''}`:''}
    <fieldset class="cms-fieldset" ${!can('write')||schema.readonly?'disabled':''}><legend>Contenuto</legend><div class="cms-fields">${fields(value,path)}</div></fieldset>
    ${can('review')&&['species-traits','edible-catalog','legal','glossary','media-glossary','plants','botanical-models','trails'].includes(doc.id)?'<label class="cms-review"><span><input type="checkbox" data-reviewed> Ho verificato le fonti delle modifiche scientifiche o normative, quando richiesto.</span></label><p class="small muted">I controlli automatici verificano struttura e collegamenti; non certificano la correttezza scientifica.</p>':''}
    <p class="small muted">La pubblicazione include tutte le voci modificate in questa sezione.</p>
    <div id="cms-preview" hidden></div><details class="cms-revisions"><summary>Cronologia e ripristino</summary><div id="cms-revisions"></div></details>`;
  loadRevisions();
}
function fields(v,path,depth=0){
  if(['phaseMonths','elevationRange'].includes(path.at(-1)))return `<label>${esc(title(path.at(-1)))} <span class="small muted">Un numero per riga; vuoto = sconosciuto</span><textarea data-field="${pathCode(path)}" data-kind="nullable-numbers">${esc((v||[]).join('\n'))}</textarea></label>`;
  if(doc.id==='glossary'&&path.at(-1)==='contexts')return `<label>Contesti del collegamento <span class="small muted">Un contesto per riga: Funghi, Piante, Alberi, Animali, Bosco, Sentiero. Vuoto = significato condiviso.</span><textarea data-field="${pathCode(path)}" data-kind="nullable-contexts">${esc((v||[]).join('\n'))}</textarea></label>`;
  if(v===null)return `<label>${esc(title(path.at(-1)||'Valore'))}<input data-field="${pathCode(path)}" data-kind="nullable" placeholder="Non disponibile" value=""></label>`;
  if(typeof v!=='object')return field(v,path);
  if(Array.isArray(v)) {
    if(v.length>50||isLockedField(path.at(-1)))return `<p class="cms-readonly">${esc(title(path.at(-1)))} · ${v.length} valori del dataset</p>`;
    if(!['illustrations','photos'].includes(path.at(-1))&&v.every(x=>typeof x==='string'||typeof x==='number'))return `<label>${esc(title(path.at(-1)))} <span class="small muted">Un valore per riga</span><textarea data-field="${pathCode(path)}" data-kind="${path.at(-1)==='flowerMonths'||v.length&&typeof v[0]==='number'?'numbers':'strings'}">${esc(v.join('\n'))}</textarea></label>`;
    return `<details class="cms-fieldset" ${depth<1?'open':''}><summary>${esc(title(path.at(-1)))} · ${v.length} voci</summary><div class="cms-fields">${v.map((x,i)=>`<div class="cms-array-item">${fields(x,[...path,i],depth+1)}<button class="btn ghost small" type="button" data-remove="${pathCode([...path,i])}">Rimuovi voce</button></div>`).join('')}<button class="btn ghost small" type="button" data-add="${pathCode(path)}">＋ Aggiungi voce</button></div></details>`;
  }
  return Object.entries(v).map(([k,x])=>{
    const p=[...path,k];
    if(isLockedField(k)&&!(doc.id==='media-glossary'&&k==='generated')&&doc.id!=='daily-thoughts')return `<details class="cms-fieldset"><summary>${esc(title(k))} · dalla fonte</summary><pre class="cms-readonly">${esc(JSON.stringify(x,null,2).slice(0,800))}</pre></details>`;
    if(x&&typeof x==='object'&&!Array.isArray(x))return `<details class="cms-fieldset" ${depth<1?'open':''}><summary>${esc(title(k))}</summary><div class="cms-fields">${fields(x,p,depth+1)}</div></details>`;
    return fields(x,p,depth+1);
  }).join('');
}
function field(v,path){
  const key=path.at(-1),label=esc(title(key));
  if(typeof v==='boolean')return `<label><span><input type="checkbox" data-field="${pathCode(path)}" data-kind="boolean" ${v?'checked':''}> ${label}</span></label>`;
  if(key==='id')return `<label>${label}<input value="${esc(v)}" readonly></label>`;
  if(doc.id==='trails'&&path.includes('relatedLinks')&&['relationship','status'].includes(key))return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${Object.entries(key==='relationship'?{partly_overlapping:'Itinerario parzialmente sovrapposto',official_context:'Riferimento ufficiale di contesto'}:{pending:'Da verificare (non mostrato)',reviewed:'Pertinenza verificata'}).map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select></label>`;
  if(doc.id==='media-glossary'&&key==='kind')return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${[['photo','Fotografia'],['diagram','Schema didattico']].map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select></label>`;
  if(doc.id==='glossary'&&key==='category')return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${['Funghi','Piante','Alberi','Animali','Bosco','Sentiero'].map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select></label>`;
  if(doc.id==='botanical-models'&&['phase','calendarOrigin'].includes(key))return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${(key==='phase'?[['young_leaves','Foglie giovani'],['ripe_fruits','Frutti maturi'],['dry_fruits','Frutti aromatici maturi']]:[['hypothesis','Mesi ricavati da una stagione (ipotesi)'],['source_calendar','Mesi riportati dalla fonte']]).map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select></label>`;
  if(key==='toxicity')return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${['da verificare','commestibile','commestibile con cautela','non commestibile','tossico','mortale'].map(x=>`<option ${x===v||!v&&x==='da verificare'?'selected':''}>${x}</option>`).join('')}</select></label>`;
  if(doc.id==='plants'&&['category','status'].includes(key))return `<label>${label}<select data-field="${pathCode(path)}" data-kind="string">${(key==='category'?['Erbe','Fiori','Frutti','Arbusti','Pericolose']:['da verificare','da osservare','solo parti e preparazioni indicate','tossico','mortale']).map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select></label>`;
  if(['body','html'].includes(key))return `<label>${label}</label><div class="cms-rich-tools"><button type="button" data-format="bold">Grassetto</button><button type="button" data-format="italic">Corsivo</button><button type="button" data-format="insertUnorderedList">Elenco</button><button type="button" data-format="formatBlock" data-format-value="h2">Sottotitolo</button></div><div class="cms-rich" contenteditable="true" role="textbox" aria-label="${label}" aria-multiline="true" data-field="${pathCode(path)}" data-kind="html">${v}</div>`;
  const kind=typeof v==='number'?'number':'string';
  return typeof v==='string'&&(v.length>110||['excerpt','description','caution','note','editorialNote','definition','observe'].includes(key))?`<label>${label}<textarea data-field="${pathCode(path)}" data-kind="string">${esc(v)}</textarea></label>`:`<label>${label}<input ${kind==='number'?'type="number" step="any"':'type="text"'} data-field="${pathCode(path)}" data-kind="${kind}" value="${esc(v)}"></label>`;
}
editor.addEventListener('input',e=>{
  const el=e.target.closest('[data-field]');if(!el||!doc)return;
  let value=el.dataset.kind==='html'?el.innerHTML:el.value;
  if(el.dataset.kind==='number')value=el.value===''?null:Number(el.value);
  if(el.dataset.kind==='nullable')value=el.value||null;
  if(el.dataset.kind==='nullable-contexts')value=el.value.trim()?el.value.split('\n').map(x=>x.trim()).filter(Boolean):null;
  if(el.dataset.kind==='nullable-numbers')value=el.value.trim()?el.value.split('\n').filter(x=>x.trim()).map(Number):null;
  if(el.dataset.kind==='boolean')value=el.checked;
  if(['strings','numbers'].includes(el.dataset.kind))value=el.value.split('\n').filter(x=>x.trim()).map(x=>el.dataset.kind==='numbers'?Number(x):x);
  writeAt(decode(el.dataset.field),value);message('Modifiche locali: salva la bozza prima di pubblicare.');
});
editor.addEventListener('paste',e=>{if(e.target.closest('.cms-rich')){e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));}});
editor.addEventListener('change',e=>{
  if(e.target.matches('[data-collection]')){collection=e.target.value;record='';renderEditor();}
  if(e.target.matches('[data-record]')){record=e.target.value;renderEditor();}
});
function differences(a,b,path='',out=[]){
  if(JSON.stringify(a)===JSON.stringify(b))return out;
  if(a&&b&&typeof a==='object'&&typeof b==='object')for(const k of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[k],b[k],path?`${path}.${k}`:k,out);
  else if(out.length<100)out.push({path,before:a,after:b});
  return out;
}
async function preview(){
  const checked=await api(`items/${doc.id}/validate`,'POST',{data:doc.data});
  const p=recordPath(),v=p.reduce((a,k)=>a?.[k],checked.data)||checked.data;
  const box=$('#cms-preview');box.hidden=false;box.className='cms-preview';
  const diff=differences(published,checked.data);
  box.innerHTML=`<p class="eyebrow">Anteprima della bozza</p>${v.title||v.name||v.term?`<h3>${esc(v.title||v.name||v.term)}</h3>`:''}${v.excerpt?`<p>${esc(v.excerpt)}</p>`:''}${(v.illustrations||[]).map(m=>`<figure><img data-src="${esc(m.file)}" alt="${esc(m.alt)}" style="display:block;width:100%;height:210px;object-fit:contain"><figcaption>${esc(m.caption)}<br><small>${esc(m.generated?'Schema generato':m.kind==='diagram'?'Schema':'Foto')}: ${esc(m.author)} · ${esc(m.license)}</small></figcaption></figure>`).join('')}${v.body||v.html||`<p>${esc(v.definition||v.description||v.caution||v.latin||'I campi vengono presentati nelle schede dell’app.')}</p>`}<h4>${diff.length} modifiche rispetto al pubblicato${diff.length===100?' (prime 100)':''}</h4><ul class="cms-diff">${diff.map(d=>`<li><b>${esc(d.path)}</b><del>${esc(JSON.stringify(d.before)?.slice(0,300)||'Assente')}</del><ins>${esc(JSON.stringify(d.after)?.slice(0,300)||'Rimosso')}</ins></li>`).join('')}</ul>`;
  message(checked.needsReview?'Struttura valida. La modifica richiede verifica delle fonti prima di pubblicare.':'Struttura valida. La bozza resta privata fino alla pubblicazione.');
}
async function loadRevisions(){try{const r=await api(`items/${doc.id}/revisions`);$('#cms-revisions').innerHTML=r.revisions.map(v=>`<button type="button" class="btn ghost small" data-restore="${v.version}">Revisione ${v.version} · ${esc(v.actor==='seed'?'Originale':new Date(v.createdAt).toLocaleString('it-IT'))}</button>`).join('');}catch(e){message(e.message,true);}}
editor.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try {
    if(b.dataset.format){document.execCommand(b.dataset.format,false,b.dataset.formatValue||null);return;}
    b.disabled=true;
    if(b.hasAttribute('data-reload')){dirty=false;await openItem(doc.id);return;}
    if(b.hasAttribute('data-save')){doc=await api(`items/${doc.id}`,'PATCH',{data:doc.data},{'if-match':`"${doc.version}"`});dirty=false;renderEditor();await refreshItems();message('Bozza salvata. Il sito pubblico resta alla versione precedente.');}
    if(b.hasAttribute('data-preview'))await preview();
    if(b.hasAttribute('data-publish')){
      if(dirty)throw new Error('Salva la bozza prima di pubblicare.');
      const r=await api('releases','POST',{baseRelease:release,items:[{id:doc.id,version:doc.version}],reviewed:$('#cms-editor [data-reviewed]')?.checked||false});release=r.release;await openItem(doc.id);await refreshItems();message('Pubblicato. I contenuti dell’app si aggiornano al prossimo caricamento.');
    }
    if(b.dataset.restore!==undefined){if(dirty)throw new Error('Salva o rileggi prima di ripristinare.');doc=await api(`items/${doc.id}/restore`,'POST',{version:Number(b.dataset.restore)},{'if-match':`"${doc.version}"`});dirty=false;renderEditor();await refreshItems();message('Revisione recuperata come nuova bozza. Controlla e pubblica quando pronta.');}
    if(b.hasAttribute('data-new')){
      const id=prompt('Identificativo stabile (minuscole, numeri, trattini):');if(!id)return;if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))throw new Error('Identificativo non valido.');
      const target=doc.data[collection];const template=CONTENT_TEMPLATES[doc.id]?structuredClone(CONTENT_TEMPLATES[doc.id]):blank(entries()[0]?.[1]||{});
      if(typeof template!=='object')throw new Error('Aggiungi questa voce dai campi del documento.');
      if('toxicity' in template)template.toxicity='da verificare';
      if(Array.isArray(target)){if(target.some(x=>x.id===id))throw new Error('Identificativo già presente.');template.id=id;target.push(template);record=String(target.length-1);}
      else{if(id in target)throw new Error('Identificativo già presente.');target[id]=template;record=id;}
      for(const k of ['name','title','latin','excerpt','body','sources'])if(k in template)template[k]=Array.isArray(template[k])?[]:'';
      dirty=true;renderEditor();message('Nuova voce in bozza: completa i campi e le fonti prima di salvare.');
    }
    if(b.dataset.add){const p=decode(b.dataset.add),v=valueAt(p);v.push(p.at(-1)==='relatedLinks'?{provider:'Wikiloc',url:'',label:'Altro itinerario su Wikiloc',relationship:'partly_overlapping',note:'',caution:'',checkedOn:'',status:'pending'}:['illustrations','photos'].includes(p.at(-1))?{file:'',alt:'',caption:'',author:'',license:'',licenseUrl:'',page:'',...(p.at(-1)==='illustrations'?{kind:'photo',generated:false}:{sourceImage:''})}:typeof v[0]==='object'?blank(v[0]):'');dirty=true;renderEditor();}
    if(b.dataset.remove){const p=decode(b.dataset.remove),v=valueAt(p.slice(0,-1));v.splice(p.at(-1),1);dirty=true;renderEditor();}
  }catch(e){message(e.message,true);}finally{if(b.isConnected)b.disabled=false;}
});
$('#cms-resource-search').oninput=renderResources;
$('#cms-resources').onclick=e=>{const b=e.target.closest('[data-resource]');if(b)openItem(b.dataset.resource);};
$('#cms-agents').onclick=async()=>{
  const d=$('#cms-token-dialog');$('#cms-token-result').textContent='';
  $('#cms-token-resources').innerHTML='<legend>Sezioni</legend><label><input type="checkbox" name="resource" value="survey-responses"> Questionari: risposte, inserimento e revisione</label><label><input type="checkbox" name="resource" value="external-observations"> Segnalazioni esterne e analisi del motore</label>'+CONTENT_RESOURCES.filter(r=>!r.readonly).map(r=>`<label><input type="checkbox" name="resource" value="${r.id}" ${r.id===doc?.id?'checked':''}> ${esc(r.title)}</label>`).join('');
  openModal(d);await tokens();
};
$('#cms-token-dialog [data-close]').onclick=()=>{$('#cms-token-result').textContent='';$('#cms-token-dialog').close();};
async function tokens(){const r=await api('tokens');$('#cms-token-list').innerHTML='<h3>Credenziali esistenti</h3>'+r.tokens.map(t=>`<div class="cms-token-row"><b>${esc(t.name)}</b> · ${esc(t.scopes.join(', '))}<br><span class="small muted">${t.revokedAt?'Revocata':`Scade il ${new Date(t.expiresAt).toLocaleDateString('it-IT')}`}</span>${!t.revokedAt?` <button type="button" class="btn ghost small" data-revoke="${t.id}">Revoca</button>`:''}</div>`).join('');}
$('#cms-token-form').onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget,b=form.querySelector('[type=submit]');b.disabled=true;
  try{const r=await api('tokens','POST',{name:form.elements.name.value,days:Number(form.elements.days.value),scopes:['read',...Array.from(form.querySelectorAll('[name=scope]:checked:not(:disabled)'),el=>el.value)],resources:Array.from(form.querySelectorAll('[name=resource]:checked'),el=>el.value)});$('#cms-token-result').innerHTML='<p>Conserva questa chiave: non sarà mostrata di nuovo.</p>';const code=document.createElement('div');code.className='cms-token-code';code.textContent=r.token;$('#cms-token-result').append(code);await tokens();}catch(err){$('#cms-token-result').textContent=err.message;}finally{b.disabled=false;}
};
$('#cms-token-list').onclick=async e=>{const b=e.target.closest('[data-revoke]');if(b){try{await api('tokens/'+b.dataset.revoke,'DELETE');await tokens();}catch(err){$('#cms-token-result').textContent=err.message;}}};
// Risposte al questionario (/questionario): conteggio, esportazione e cancellazione su richiesta.
// Solo amministratori: il server (worker/survey.js) ricontrolla sessione e ruolo a ogni richiesta.
const surveyUrl=q=>`${SURVEY_ENDPOINT}?survey=${encodeURIComponent(SURVEY_ID)}${q}`;
async function surveyApi(url,method='GET'){
  const r=await fetch(url,{method,credentials:'same-origin',cache:'no-store'});
  if(!r.ok){const out=await r.json().catch(()=>({}));throw Object.assign(new Error(out.error||'Richiesta non riuscita.'),{status:r.status});}
  return r;
}
const surveyWhen=iso=>new Date(iso).toLocaleString('it-IT',{dateStyle:'long',timeStyle:'short'});
function surveyNote(text,error=false){const el=$('#cms-survey-count');el.textContent=text;el.classList.toggle('error',error);}
async function surveyCount(){
  surveyNote('Conto le risposte…');
  // format=count: solo numero e data dell'ultima, senza scaricare le risposte (né nomi né contatti)
  try{const r=await(await surveyApi(surveyUrl('&format=count'))).json();
    surveyNote(r.count?`${r.count===1?'Una risposta':`${r.count} risposte`}. L’ultima è arrivata il ${surveyWhen(r.lastAt)}.`:'Nessuna risposta per ora.');}
  catch(e){surveyNote(e.message,true);}
}
function surveyRow(x){
  const row=document.createElement('div');row.className='cms-survey-row';
  const info=document.createElement('p');info.textContent=`Ricevuta ${x.receipt} · arrivata il ${surveyWhen(x.createdAt)} · ${x.name?`nome: ${x.name}`:'senza nome'}${x.contact?' · con contatto':''}.`;
  const err=document.createElement('p');err.className='small';
  const del=document.createElement('button');del.type='button';del.className='btn ghost';del.textContent='Cancella questa risposta';
  del.onclick=async()=>{
    if(del.dataset.confirm!=='1'){del.dataset.confirm='1';del.textContent='Conferma: cancella per sempre';err.textContent='La cancellazione non si può annullare.';return;}
    del.disabled=true;
    try{await surveyApi(`${SURVEY_ENDPOINT}/${encodeURIComponent(x.id)}`,'DELETE');const done=document.createElement('p');done.textContent=`Risposta ${x.receipt} cancellata. Puoi confermarlo a chi l’ha chiesto.`;row.replaceChildren(done);surveyCount();}
    catch(e){del.disabled=false;err.textContent=e.message;}
  };
  row.append(info,del,err);return row;
}
$('#cms-survey').onclick=()=>setWorkspace('surveys');
$('#cms-survey-dialog [data-close]').onclick=()=>$('#cms-survey-dialog').close();
$('#cms-survey-dialog').addEventListener('click',async e=>{
  const b=e.target.closest('[data-survey-download]');if(!b)return;
  // csv-excel: separatore «;» per Excel in italiano (&sep=semicolon); csv: virgola (RFC 4180); json: dati esatti.
  const kind=b.dataset.surveyDownload,format=kind==='json'?'json':'csv',excel=kind==='csv-excel';b.disabled=true;
  try{
    const blob=await(await surveyApi(surveyUrl('&format='+format+(excel?'&sep=semicolon':'')))).blob();
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`questionario-${SURVEY_ID}-${new Date().toISOString().slice(0,10)}${excel?'-excel':''}.${format}`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }catch(err){surveyNote(err.message,true);}finally{b.disabled=false;}
});
$('#cms-survey-find').onsubmit=async e=>{
  e.preventDefault();const box=$('#cms-survey-result');box.textContent='Cerco la risposta…';
  try{
    const r=await(await surveyApi(surveyUrl('&format=json&receipt='+encodeURIComponent(e.currentTarget.elements.receipt.value)))).json();
    if(!r.responses.length){box.textContent='Nessuna risposta con questo codice: forse è già stata cancellata.';return;}
    box.replaceChildren(...r.responses.map(surveyRow));
  }catch(err){box.textContent=err.message;}
};
addEventListener('beforeunload',e=>{if(dirty||surveys?.isDirty()||externalObservations?.isDirty()){e.preventDefault();e.returnValue='';}});
document.addEventListener('fungaroli:community',()=>{if(currentUser()?.id!==actor?.id){doc=null;dirty=false;editor.textContent='';access();}});
initCommunity({zoneList:[]});await communityReady();await access();
