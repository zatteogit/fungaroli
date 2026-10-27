import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json=file=>JSON.parse(readFileSync(resolve(ROOT,file),'utf8'));
export const PERSONAS=[
 {id:'neofita',name:'Neofita',goal:'Capire cosa osservare e quali rischi evitare, senza scambiare l’app per un’identificazione.'},
 {id:'appassionato',name:'Appassionato',goal:'Decidere dove e quando andare e confrontare poche specie pertinenti.'},
 {id:'esperto',name:'Esperto',goal:'Confrontare caratteri, incertezze, nomenclatura e fonti senza percorsi obbligati.'},
 {id:'escursionista',name:'Escursionista',goal:'Valutare meteo, percorso, difficoltà, accessi e limiti dei dati pratici.'},
 {id:'naturalista',name:'Naturalista',goal:'Esplorare piante, alberi, animali e relazioni ecologiche, senza priorità alla raccolta.'},
];
const roleOf=path=> /(?:caution|warning|field_rules|toxicity|tox_label|protection|collectionStatus|collectionNote)/i.test(path)?'decision-caution':/(?:source|citation|license|author|credit|attribution|checkedOn|reviewedOn)/i.test(path)?'reference':/(?:file|thumb|photo|image|alt|caption)/i.test(path)?'media':/(?:trail|access|parking|difficulty|duration|ascent|length|return|lat|lon)/i.test(path)?'practical':/(?:name|latin|title|summary|excerpt)/i.test(path)?'orientation':/(?:trait|recognize|check_before|confusable|lookalike|observe)/i.test(path)?'observation':'context';
export function fieldsOf(value,path=''){
 if(value==null||value===''||Array.isArray(value)&&!value.length)return [];
 if(typeof value!=='object')return [{id:path,role:roleOf(path),characters:String(value).length}];
 return Object.entries(value).flatMap(([key,v])=>fieldsOf(v,path?`${path}.${key}`:key));
}
const proposed=(role,persona)=>role==='decision-caution'||role==='orientation'?'now':role==='observation'?(persona==='escursionista'?'on-demand':'now'):role==='practical'?(['appassionato','escursionista'].includes(persona)?'now':'on-demand'):'on-demand';
export function inventory(){
 const entries=[],add=(kind,id,label,href,file,key,record,rank)=>{
  const fields=fieldsOf(record);
  entries.push({id:`${kind}:${id}`,kind,label,href,inventoryKind:kind==='pagina'?'route-seed':'source-fields',source:{file,key,hash:hash(record)},rank,fields,
   // Proposals are not findings, human testing or completed reviews.
   proposals:Object.fromEntries(PERSONAS.map(p=>[p.id,Object.fromEntries([...new Set(fields.map(f=>f.role))].map(role=>[role,{placement:proposed(role,p.id),maxActions:proposed(role,p.id)==='now'?0:1,state:'proposal'}]))])),
   personas:Object.fromEntries(PERSONAS.map(p=>[p.id,{state:'queued',review:null}])),renderChecks:[]});
 };
 const main=[['uscita','Uscita: gerarchia e condizioni','#/zona/allumiere-faggeto/1',0],['home','Uscite: scegliere una proposta','#/',1],['mappa','Mappa: comprendere zone e tracciati','#/mappa',3],['funghi','Catalogo funghi','#/specie',2],['confronto','Confronto funghi','#/confronta',2],['riconosci','Percorso per caratteri','#/riconosci',2],['piante','Catalogo piante','#/piante',4],['alberi','Catalogo alberi','#/alberi',4],['animali','Catalogo animali','#/animali',5],['taccuino','Taccuino privato, vuoto e popolato','#/diario',6],['profilo','Profilo e permessi facoltativi','#/diario',6],['feedback','Invio feedback','#/diario',6],['ricerca','Ricerca globale e risultati','#/specie',2],['guide','Guide','#/guide',7],['glossario','Glossario','#/glossario',7],['sfide','Sfide','#/sfide',7],['info','Informazioni e regole','#/info',7],['metodo','Metodo e limiti','#/metodo',7],['benvenuto','Benvenuto e scelte facoltative','#/',8],['offline','Lettore e archivio offline','offline.html',8],['questionario','Questionario esperti','questionario.html',8]];
 for(const [id,label,href,rank] of main)add('pagina',id,label,href,'index.html',id,{goal:label},rank);
 const model=new Set(Object.keys(json('data/species-id.json').species));
 for(const [id,t] of Object.entries(json('data/species-traits.json').taxa)){
  add('fungo',id,t.name||t.latin,model.has(id)?`#/specie/${id}`:`#/fungo/${id}`,'data/species-traits.json',`taxa.${id}`,t,2);
  const e=entries.at(-1);e.variants=model.has(id)?[`#/fungo/${id}`]:[];
  if(model.has(id)){const details=json('data/species-id.json').species[id];e.fields.push(...fieldsOf(details,'species-id'));e.source.additional=[{file:'data/species-id.json',key:`species.${id}`}];e.source.hash=hash({taxon:t,details});}
 }
 for(const [kind,file,key,route,rank] of [['pianta','plants','plants','pianta',4],['albero','trees','trees','albero',4]])for(const [id,item] of Object.entries(json(`data/${file}.json`)[key]))add(kind,id,item.name,`#/${route}/${id}`,`data/${file}.json`,`${key}.${id}`,item,rank);
 for(const a of json('data/animals.json').items.filter(a=>a.publicationStatus==='ready'))add('animale',a.id,a.name,`#/animale/${a.id}`,'data/animals.json',a.id,a,5);
 for(const z of json('data/zones.json').zones)add('zona',z.id,z.title||z.name,`#/zona/${z.id}/1`,'data/zones.json',z.id,z,0);
 for(const [kind,file,key,route,rank] of [['guida','guides','guides','guide',7],['glossario','glossary','terms','glossario',7],['giro','editorial-outings','outings','giri',6],['sfida','challenges','challenges','sfide',7]])for(const a of json(`data/${file}.json`)[key])add(kind,a.id,a.title||a.term,`#/${route}/${a.id}`,`data/${file}.json`,a.id,a,rank);
 return {schemaVersion:1,generatedAt:new Date().toISOString(),scope:'Inventario statico locale. CMS e verifica visiva sono evidenze separate; nessuna riga in coda equivale a un contenuto revisionato.',personas:PERSONAS,entries:entries.sort((a,b)=>a.rank-b.rank||a.id.localeCompare(b.id))};
}
export function validateReview(entry,review){
 if(entry.inventoryKind==='route-seed')throw Error('Inventariare i contenuti effettivi della pagina prima di chiudere la revisione');
 if(review.unit!==entry.id||!PERSONAS.some(p=>p.id===review.persona))throw Error('Unità o persona non valida');
 if(review.sourceHash!==entry.source.hash)throw Error('La fonte è cambiata: riesaminare il contenuto');
 if(!/^[a-f0-9]{40}$/.test(review.testedCommit||''))throw Error('Commit della prova mancante');
 if(!Array.isArray(review.evidence)||!review.evidence.length)throw Error('Evidenza mancante');
 const decisions=new Map((review.decisions||[]).map(d=>[d.field,d]));
 for(const f of entry.fields){const d=decisions.get(f.id);if(!d||!['core','useful','reference'].includes(d.importance)||!['now','on-demand','inline'].includes(d.disclosure)||!Number.isInteger(d.actions)||d.actions<0||!d.reason||!d.format)throw Error(`Manca la valutazione completa di ${f.id}`);}
 return true;
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function report(data){
 const rows=data.entries.map(e=>`<tr data-kind="${e.kind}"><td><b>${escape(e.label)}</b>${(e.workNotes||[]).map(n=>`<small><a href="${escape(n.file.replace('docs/content-review/',''))}">${escape(n.label)}</a></small>`).join('')}<small>${escape(e.id)} · ${e.fields.length} campi</small></td><td>${escape(e.href)}</td>${PERSONAS.map(p=>`<td>${escape(e.personas[p.id].state)}</td>`).join('')}<td><details><summary>Contenuti e ipotesi di priorità</summary><p>Ipotesi da verificare: non giudizi conclusi.</p><ul>${e.fields.map(f=>`<li><code>${escape(f.id)}</code> · ${f.role} · ${f.characters} caratteri</li>`).join('')}</ul></details></td></tr>`).join('');
 const tasks=data.entries.length*PERSONAS.length,done=data.entries.reduce((n,e)=>n+Object.values(e.personas).filter(p=>p.state==='verified'||p.state==='released').length,0);
 return `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fronda · Pipeline contenuti</title><link rel="stylesheet" href="../../css/tokens.css"><style>body{font:15px/1.6 system-ui;background:var(--bg);color:var(--text);margin:0;padding:24px}main{max-width:1500px;margin:auto}h1{font:600 32px Georgia}input{font:inherit;padding:12px;width:min(100%,500px);box-sizing:border-box;margin:16px 0}table{border-collapse:collapse;width:100%;background:var(--surface)}td,th{padding:12px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}small{display:block;color:var(--text-2)}details ul{max-height:320px;overflow:auto;min-width:240px}summary{cursor:pointer;min-height:44px}code{font-size:12px}.scroll{overflow:auto}a{color:inherit}</style><main><h1>Ogni contenuto deve meritare il suo posto</h1><p>${data.entries.length} pagine e schede · ${data.entries.reduce((n,e)=>n+e.fields.length,0)} campi censiti · ${done}/${tasks} revisioni per persona concluse.</p><p>${escape(data.scope)}</p><p><a href="batches/001-uscita.md">Primo lotto: decisioni e prove sull’uscita</a></p><p><b>Per ogni contenuto:</b> importanza per la persona, percorso per raggiungerlo, disclosure, formato, organizzazione e prove. Le misure automatiche non sono una revisione editoriale o un test con utenti reali.</p><input aria-label="Cerca nella pipeline" placeholder="Pagina, fungo, campo, stato…"><div class="scroll"><table><thead><tr><th>Unità</th><th>Pagina</th>${PERSONAS.map(p=>`<th>${p.name}</th>`).join('')}<th>Inventario</th></tr></thead><tbody>${rows}</tbody></table></div></main><script>document.querySelector('input').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q));};</script></html>`;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path=resolve(ROOT,'docs/content-review/pipeline.json'),args=process.argv.slice(2);
 let data;
 if(args[0]==='init'||!existsSync(path)){
  data=inventory();const old=existsSync(path)?JSON.parse(readFileSync(path)):null;data.batches=old?.batches||[];
  for(const e of data.entries){const prev=old?.entries.find(p=>p.id===e.id);if(prev?.source.hash===e.source.hash){e.personas=prev.personas;e.renderChecks=prev.renderChecks||[];e.workNotes=prev.workNotes||[];if(prev.renderedFields?.length){e.renderedFields=prev.renderedFields;e.fields.push(...prev.renderedFields);e.inventoryKind='rendered-fields';}}}
 }else data=JSON.parse(readFileSync(path));
 if(args[0]==='next'){const e=data.entries.find(e=>Object.values(e.personas).some(p=>p.state==='queued'));console.log(JSON.stringify(e,null,2));process.exit(0);}
 if(args[0]==='record'){
  const reviewPath=args[1];if(!reviewPath)throw Error('Specificare il file della revisione');const review=JSON.parse(readFileSync(resolve(ROOT,reviewPath)));const e=data.entries.find(e=>e.id===review.unit);if(!e)throw Error('Unità non censita');validateReview(e,review);
  for(const f of review.evidence)if(!existsSync(resolve(ROOT,f)))throw Error(`Evidenza non trovata: ${f}`);
  e.personas[review.persona]={state:'verified',review:reviewPath};
 }
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(data,null,2)+'\n');writeFileSync(resolve(ROOT,'docs/content-review/index.html'),report(data));
 console.log(JSON.stringify({units:data.entries.length,fields:data.entries.reduce((n,e)=>n+e.fields.length,0),personas:PERSONAS.length,queued:data.entries.reduce((n,e)=>n+Object.values(e.personas).filter(p=>p.state==='queued').length,0)}));
}
