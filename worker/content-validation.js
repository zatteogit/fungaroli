import {GLOSSARY_CONTEXTS,termContexts,glossaryAliasKey} from '../js/glossary-context.js';
import sanitizeHtml from 'sanitize-html';
import { resourceOf, isLockedField } from '../js/content-schema.js';
import { SPECIES } from '../js/species.js';

const err = message => { throw Object.assign(new Error(message), {status:422}); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const cleanOptions = {
  allowedTags: ['p','h2','h3','h4','strong','b','em','i','ul','ol','li','a','br','span','small','div','dl','dt','dd','table','thead','tbody','tr','th','td','sup','sub','blockquote'],
  allowedAttributes: {a:['href','title','target','rel'], '*':['class']},
  allowedSchemes:['https','http','mailto','tel'], allowProtocolRelative:false,
  transformTags: {a:(tag,attrs) => ({tagName:tag,attribs:{...attrs,rel:'noopener noreferrer'}})},
};

// Fasi di crescita (species-traits, taxa.<id>.stages): elenchi chiusi, in quest'ordine.
// Le tessere sono quelle delle icone dei caratteri; «taglio» è la sezione dell'uovo, solo nella fase «uovo».
export const STAGE_IDS = ['uovo', 'apertura', 'giovane', 'adulto', 'maturo', 'sciolto'];
export const STAGE_TILES = ['cappello', 'sotto', 'gambo', 'taglio'];
const STAGE_KEYS = ['id', 'label', 'desc', 'cap_shape', 'hymenophore_color', 'tiles', 'source'];
export function stageErrors(key, t) {
  const out = [], s = t?.stages, tr = t?.traits || {};
  const urls = new Set((t?.sources || []).map((x) => (typeof x === 'string' ? x : x?.url)));
  if (!Array.isArray(s) || s.length < 2) return [`${key}: le fasi sono un elenco di almeno due voci.`];
  let last = -1;
  const seen = new Set();
  for (const f of s) {
    const at = STAGE_IDS.indexOf(f?.id);
    if (at < 0) { out.push(`${key}: fase «${f?.id}» non prevista (${STAGE_IDS.join(', ')}).`); continue; }
    if (seen.has(f.id) || at < last) out.push(`${key}: fasi ripetute o fuori ordine (${f.id}).`);
    seen.add(f.id); last = at;
    for (const k of Object.keys(f)) if (!STAGE_KEYS.includes(k)) out.push(`${key}/${f.id}: campo non previsto (${k}).`);
    if (typeof f.label !== 'string' || !f.label.trim() || f.label.length > 24) out.push(`${key}/${f.id}: serve un’etichetta breve.`);
    if (typeof f.desc !== 'string' || !f.desc.trim() || f.desc.length > 300) out.push(`${key}/${f.id}: serve una descrizione (al massimo 300 caratteri).`);
    if (!Array.isArray(f.tiles) || !f.tiles.length || new Set(f.tiles).size !== f.tiles.length || f.tiles.some((x) => !STAGE_TILES.includes(x))) out.push(`${key}/${f.id}: tessere non valide (${STAGE_TILES.join(', ')}).`);
    else if (f.tiles.includes('taglio') && f.id !== 'uovo') out.push(`${key}/${f.id}: la sezione («taglio») è prevista solo nella fase a uovo.`);
    if (f.cap_shape != null && (![].concat(tr.cap_shape || []).includes(f.cap_shape) || !f.tiles?.includes?.('cappello'))) out.push(`${key}/${f.id}: forma «${f.cap_shape}» non tra le forme della specie o tessera cappello mancante.`);
    if (f.hymenophore_color != null && (!Array.isArray(f.hymenophore_color) || !f.hymenophore_color.length || f.hymenophore_color.some((c) => ![].concat(tr.hymenophore_color || []).includes(c)) || !f.tiles?.includes?.('sotto'))) out.push(`${key}/${f.id}: colori sotto il cappello non tra quelli della specie o tessera sotto mancante.`);
    if (typeof f.source !== 'string' || !/^https:\/\/[^\s"'<>]+$/.test(f.source) || !urls.has(f.source)) out.push(`${key}/${f.id}: la fonte deve essere un URL tra le fonti della specie.`);
  }
  return out;
}

export function validateContent(id, data, previous) {
  const schema = resourceOf(id);
  if (!schema || !data || typeof data !== 'object' || Array.isArray(data)) err('Serve un documento del tipo indicato.');
  for (const key of schema.required) if (!(key in data)) err(`Manca il campo ${key}.`);
  for(const key of schema.required)if(previous?.[key]!=null&&(typeof data[key]!==typeof previous[key]||Array.isArray(data[key])!==Array.isArray(previous[key])||data[key]===null))err(`Il formato del campo ${key} non corrisponde allo schema.`);
  let count=0;
  function visit(v,key='',old,depth=0) {
    if (++count>180000 || depth>18) err('Il documento è troppo complesso.');
    if (id === 'trails' && isLockedField(key) && old !== undefined && !same(v,old)) err(`Il campo ${key} proviene dalla fonte del tracciato: aggiorna i dati tramite il processo di importazione.`);
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') { if (!Number.isFinite(v)) err('Numero non valido.'); return v; }
    if (typeof v === 'string') {
      if (v.length>200000) err('Testo troppo lungo.');
      if(!['html','body'].includes(key)&&v!==old&&/<\/?[a-z][^>]*>/i.test(v))err(`Il campo ${key} contiene HTML. Usa i campi di testo formattato per gli articoli.`);
      if (['file','file_hd','thumb','page','url','href','src','sourceImage','licenseUrl'].includes(key) && v && !/^(?:https?:\/\/[^\s"'<>]+|\/?assets\/[a-zA-Z0-9_./%-]+|\/?api\/content\/media\/[a-zA-Z0-9_./-]+|#\/[a-zA-Z0-9_/-]+)$/.test(v)) err(`Il campo ${key} deve contenere un URL o un percorso immagine valido.`);
      return ['html','body'].includes(key) ? sanitizeHtml(v,cleanOptions) : v;
    }
    if (Array.isArray(v)) return v.map((x,i)=>visit(x,key,old?.[i],depth+1));
    if (typeof v !== 'object') err('Valore non valido.');
    return Object.fromEntries(Object.entries(v).map(([k,x])=>{
      if (['__proto__','constructor','prototype'].includes(k)) err('Chiave non consentita.');
      return [k,visit(x,k,old?.[k],depth+1)];
    }));
  }
  const value=visit(data,'',previous);
  if(id==='trails')for(const z of Object.values(value.zones||{}))for(const t of z.trails||[])if(!t.editorialNote?.trim())delete t.editorialNote;
  function normalizeSources(v){
    if(!v||typeof v!=='object')return;
    if(Array.isArray(v.sources))v.sources=v.sources.map(s=>{
      if(typeof s!=='string')return s;
      if(!/^https?:\/\/[^\s"'<>]+$/.test(s))err('Le fonti aggiunte come testo devono essere URL consultabili.');
      return {title:s,url:s};
    });
    for(const x of Object.values(v))if(x&&typeof x==='object')normalizeSources(x);
  }
  normalizeSources(value);
  let needsReview=false;
  if(id==='botanical-models'){
    if(!value.models||typeof value.models!=='object'||Array.isArray(value.models))err('Elenco dei modelli botanici non valido.');
    for(const [key,m] of Object.entries(value.models)){
      if(!idPattern.test(key)||!idPattern.test(m.plantId)||typeof m.enabled!=='boolean'||!['young_leaves','ripe_fruits','dry_fruits'].includes(m.phase)||typeof m.phaseLabel!=='string'||!m.phaseLabel.trim()||m.parameterOrigin!=='editorial_hypothesis')err('Indica specie, fase e provenienza sperimentale dei parametri.');
      if(m.phaseMonths!=null&&!['source_calendar','hypothesis'].includes(m.calendarOrigin))err('Distingui calendario riportato dalla fonte e mesi ricavati da una stagione.');
      if(m.phaseMonths!=null&&(!Array.isArray(m.phaseMonths)||!m.phaseMonths.length||m.phaseMonths.some(x=>!Number.isInteger(x)||x<1||x>12)))err('Calendario della fase non valido.');
      if(m.elevationRange!=null&&(!Array.isArray(m.elevationRange)||m.elevationRange.length!==2||m.elevationRange.some(x=>!Number.isFinite(x)||x<0||x>4000)||m.elevationRange[0]>=m.elevationRange[1]))err('Intervallo di quota non valido.');
      if(!m.landscapeAffinity||typeof m.landscapeAffinity!=='object'||Array.isArray(m.landscapeAffinity)||Object.values(m.landscapeAffinity).some(x=>!Number.isFinite(x)||x<0||x>1)||!Number.isFinite(m.landscapeSaturation)||m.landscapeSaturation<=0||m.landscapeSaturation>1||!Number.isInteger(m.observationDays)||m.observationDays<1||m.observationDays>30)err('Affinità o freschezza delle osservazioni non valide.');
      if(!Array.isArray(m.sources)||!m.sources.length||m.sources.some(s=>!s?.title||!/^https:\/\/[^\s"'<>]+$/.test(s.url||'')))err('Ogni modello richiede fonti consultabili.');
    }
    needsReview=!previous||!same(value,previous);
  }
  const entries = (v,key) => Array.isArray(v[key]) ? v[key] : Object.entries(v[key]||{}).map(([id,t])=>({...t,id}));
  const checkIds = rows => {
    const seen=new Set();
    for (const t of rows) { if (!t || !idPattern.test(t.id) || seen.has(t.id)) err('Gli identificativi devono essere unici e stabili, con lettere minuscole, numeri e trattini.'); seen.add(t.id); }
  };
  if (id === 'species-traits' || id === 'edible-catalog') {
    const key=id==='species-traits'?'taxa':'species';
    if (id === 'species-traits' ? !value.taxa || Array.isArray(value.taxa) : !Array.isArray(value.species)) err('Elenco delle specie non valido.');
    const rows=entries(value,key), old=new Map(previous?entries(previous,key).map(t=>[t.id,t]):[]);
    if(id==='species-traits')for(const sp of SPECIES)if(previous?.taxa?.[sp.id]&&!value.taxa[sp.id])err(`Mantieni l’ID ${sp.id} della specie modellata; aggiorna la classificazione con fonti invece di eliminare la scheda.`);
    checkIds(rows);
    for (const t of rows) {
      if (typeof t.latin!=='string'||!t.latin.trim()||typeof t.name!=='string'||!t.name.trim()||!['da verificare','commestibile','commestibile con cautela','non commestibile','tossico','mortale'].includes(t.toxicity)) err(`Nome e classificazione mancanti o non validi per ${t.id}.`);
      if (id==='edible-catalog' && !['commestibile','commestibile con cautela'].includes(t.toxicity)) err('Il catalogo alimentare può contenere solo commestibili verificati.');
      const months=t.months??t.traits?.season;
      if (months != null && (!Array.isArray(months)||months.some(m=>!Number.isInteger(m)||m<1||m>12))) err(`Mesi non validi per ${t.id}.`);
      const before=old.get(t.id);
      if (!before || ['latin','toxicity','caution'].some(k=>!same(t[k],before[k]))) {
        needsReview=true;
        if (!Array.isArray(t.sources)||!t.sources.some(s=>/^https?:\/\//.test(typeof s==='string'?s:s?.url||s?.href||''))) err(`Aggiungi fonti con un riferimento consultabile alla modifica micologica di ${t.id}.`);
      }
    }
  }
  if (id === 'species-traits') {
    // avvisi: tipo da un elenco chiuso e titolo breve; senza tipo restano validi (vecchi contenuti)
    const KINDS = ['sosia', 'caratteri', 'regole', 'cottura', 'tossicita', 'ambiente'];
    const rules = [...(value.general_rules || []), ...Object.values(value.taxa || {}).flatMap((t) => t?.field_rules || [])];
    for (const r of rules) {
      if (!r || typeof r.text !== 'string' || !r.text.trim()) err('Ogni avviso richiede un testo.');
      if (r.kind != null && !KINDS.includes(r.kind)) err(`Tipo di avviso non valido: ${r.kind}.`);
      if (r.title != null && (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 60)) err('Il titolo di un avviso deve essere breve (al massimo 60 caratteri).');
    }
    // frequenza di un colore o di una forma: solo parole di una scala chiusa, solo per valori che la specie ha
    const FREQ = ['di solito', 'spesso', 'a volte', 'di rado'];
    for (const [key, t] of Object.entries(value.taxa || {})) for (const [field, m] of Object.entries(t?.trait_freq || {})) {
      if (!['cap_color', 'cap_shape'].includes(field)) err(`${key}: frequenza indicata per un carattere non previsto (${field}).`);
      for (const [v, w] of Object.entries(m || {})) {
        if (!FREQ.includes(w)) err(`${key}: «${w}» non è una frequenza ammessa (di solito, spesso, a volte, di rado).`);
        if (![].concat(t.traits?.[field] || []).includes(v)) err(`${key}: frequenza per «${v}», che non è tra i valori della specie.`);
      }
    }
    for (const [key, t] of Object.entries(value.taxa || {})) if (t?.stages != null) stageErrors(key, t).forEach(err);
    // citazione per valore di colore e forma del cappello: testo e fonte tra le fonti della specie
    for (const [key, t] of Object.entries(value.taxa || {})) for (const [field, m] of Object.entries(t?.trait_cites || {})) {
      if (!['cap_color', 'cap_shape'].includes(field)) err(`${key}: citazione per un carattere non previsto (${field}).`);
      const urls = new Set((t.sources || []).map((s) => (typeof s === 'string' ? s : s?.url)));
      for (const [v, c] of Object.entries(m || {})) {
        if (![].concat(t.traits?.[field] || []).includes(v)) err(`${key}: citazione per «${v}», che non è tra i valori della specie.`);
        if (typeof c?.quote !== 'string' || !c.quote.trim() || c.quote.length > 400 || !urls.has(c?.source)) err(`${key}: la citazione di «${v}» richiede il testo e una fonte tra le fonti della specie.`);
      }
    }
    for (const [url, c] of Object.entries(value.citations || {})) if (!/^https?:\/\//.test(url) || typeof c?.author !== 'string' || !c.author.trim() || typeof c?.year !== 'string' || !c.year.trim()) err('Ogni citazione richiede URL, autore e anno (o s.d.).');
  }
  if (id==='guides') {
    if (!Array.isArray(value.guides)) err('Elenco articoli non valido.');
    checkIds(value.guides);
    if (value.guides.some(g=>typeof g.title!=='string'||!g.title.trim()||typeof g.body!=='string')) err('Ogni articolo richiede titolo e testo.');
  }
  if(id==='plants'){
    if(!value.plants||typeof value.plants!=='object'||Array.isArray(value.plants))err('Elenco piante non valido.');
    checkIds(entries(value,'plants'));
    const ids=new Set(Object.keys(value.plants));
    for(const [pid,p] of Object.entries(value.plants)){
      if(!['name','latin','habitat','phaseNote'].every(k=>typeof p[k]==='string'&&p[k].trim())||!['Erbe','Fiori','Frutti','Arbusti','Pericolose'].includes(p.category)||!Array.isArray(p.aliases)||p.aliases.some(a=>typeof a!=='string')||!Array.isArray(p.recognize)||!p.recognize.length||p.recognize.some(s=>typeof s!=='string'||!s.trim()))err(`Completa nome, habitat, categoria e caratteri per ${pid}.`);
      if(!Array.isArray(p.flowerMonths)||p.flowerMonths.some(m=>!Number.isInteger(m)||m<1||m>12)||!Array.isArray(p.lookalikes)||p.lookalikes.some(id=>!ids.has(id)||id===pid))err(`Fioritura o schede di confronto non valide per ${pid}.`);
      if(!p.foodUse||!['da osservare','solo parti e preparazioni indicate','tossico','mortale'].includes(p.foodUse.status)||typeof p.foodUse.parts!=='string'||typeof p.foodUse.caution!=='string'||!p.foodUse.caution.trim()||p.category==='Pericolose'&&(!['tossico','mortale'].includes(p.foodUse.status)||p.foodUse.parts)||p.category==='Fiori'&&(!['da osservare','tossico','mortale'].includes(p.foodUse.status)||p.foodUse.parts)||!['Pericolose','Fiori'].includes(p.category)&&(!['da osservare','solo parti e preparazioni indicate'].includes(p.foodUse.status)||p.foodUse.status==='solo parti e preparazioni indicate'&&!p.foodUse.parts.trim()||p.foodUse.status==='da osservare'&&p.foodUse.parts))err(`Distingui parti alimentari, preparazione e tossicità per ${pid}.`);
      if(p.protection!=null&&(typeof p.protection!=='object'||!['status','law','summary'].every(k=>typeof p.protection[k]==='string'&&p.protection[k].trim())||!/^https:\/\/[^\s"'<>]+$/.test(p.protection.url||'')))err(`Completa tutela, norma e fonte per ${pid}.`);
      if(['lookalikeNote','presenceNote'].some(k=>p[k]!=null&&(typeof p[k]!=='string'||!p[k].trim())))err(`Note di confronto o presenza non valide per ${pid}.`);
      if(p.habitatCategories!=null&&(!Array.isArray(p.habitatCategories)||p.habitatCategories.some(c=>typeof c!=='string'||!c.trim())||typeof p.habitatMappingNote!=='string'||!p.habitatMappingNote.trim()))err(`Documenta la traduzione dell’habitat in categorie cartografiche per ${pid}.`);
      if(!Array.isArray(p.sources)||!p.sources.length||p.sources.some(s=>!s?.title?.trim()||!/^https:\/\/[^\s"'<>]+$/.test(s.url||'')))err(`Aggiungi fonti botaniche consultabili per ${pid}.`);
      if(!Array.isArray(p.photos)||!p.photos.length||p.photos.length>6)err(`Aggiungi fotografie attribuite per ${pid}.`);
      for(const m of p.photos)if(!['file','alt','caption','author','license'].every(k=>typeof m[k]==='string'&&m[k].trim())||!/^https:\/\/[^\s"'<>]+$/.test(m.page||'')||!/^https:\/\/[^\s"'<>]+$/.test(m.licenseUrl||''))err(`Completa fotografia, fonte e licenza per ${pid}.`);
    }
    needsReview=!previous||!same(value,previous);
  }
  if (id==='zones') {
    if (!Array.isArray(value.zones)) err('Elenco zone non valido.');
    checkIds(value.zones);
    for(const z of value.zones) if(!z.name||!Number.isFinite(z.lat)||Math.abs(z.lat)>90||!Number.isFinite(z.lon)||Math.abs(z.lon)>180||!Array.isArray(z.bands)||!Array.isArray(z.parking)||!(z.radius_m>0)) err(`Dati geografici non validi per ${z.id}.`);
  }
  if (id==='glossary') {
    if(!Array.isArray(value.terms)) err('Elenco del glossario non valido.');
    checkIds(value.terms);
    const ids=new Set(value.terms.map(t=>t.id)), aliases=new Map();
    for(const t of value.terms) {
      if(typeof t.term!=='string'||!t.term.trim()||typeof t.definition!=='string'||!t.definition.trim()||typeof t.observe!=='string'||!GLOSSARY_CONTEXTS.includes(t.category)) err(`Completa parola, categoria, definizione e indicazioni di campo per ${t.id}.`);
      if(!Array.isArray(t.aliases)||t.aliases.some(a=>typeof a!=='string'||a.trim().length<3)||!Array.isArray(t.related)||t.related.some(id=>!ids.has(id)||id===t.id)) err(`Sinonimi o voci collegate non validi per ${t.id}.`);
      if(!Array.isArray(t.sources)||!t.sources.length||t.sources.some(s=>typeof s?.title!=='string'||!s.title.trim()||!/^https?:\/\//.test(s?.url||''))) err(`Aggiungi fonti consultabili alla voce ${t.id}.`);
      if(t.contexts!=null&&(!Array.isArray(t.contexts)||!t.contexts.length||t.contexts.some(c=>!GLOSSARY_CONTEXTS.includes(c))||new Set(t.contexts).size!==t.contexts.length))err(`Contesti del glossario non validi per ${t.id}.`);
      for(const word of [t.term,...t.aliases]) {
        const key=glossaryAliasKey(word),prior=aliases.get(key)||[];
        if(prior.some(x=>x.id!==t.id&&termContexts(x).some(c=>termContexts(t).includes(c))))err(`La parola ${word} è associata a più voci del glossario nello stesso contesto.`);
        if(!prior.some(x=>x.id===t.id))prior.push(t);aliases.set(key,prior);
      }
    }
    for(const id of ['difficolta-t','difficolta-e','difficolta-ee','difficolta-eea']) if(!ids.has(id)) err('Mantieni le quattro voci della legenda CAI.');
    needsReview=!!previous&&!same(value,previous);
  }
  if(id==='media-glossary') {
    if(!value.terms||typeof value.terms!=='object'||Array.isArray(value.terms))err('Elenco delle illustrazioni non valido.');
    checkIds(entries(value,'terms'));
    for(const [term,row] of Object.entries(value.terms)) {
      if(!Array.isArray(row.illustrations)||row.illustrations.length>6)err(`Aggiungi al massimo sei illustrazioni alla voce ${term}.`);
      for(const image of row.illustrations) {
        if(!image||!['photo','diagram'].includes(image.kind)||typeof image.generated!=='boolean'||image.generated&&image.kind!=='diagram')err('Distingui le fotografie dagli schemi e indica le immagini generate.');
        if(!['file','alt','caption','author','license'].every(k=>typeof image[k]==='string'&&image[k].trim()))err(`Completa immagine, testo alternativo, didascalia, autore e licenza per ${term}.`);
        if(!/^(?:https:\/\/[^\s"'<>]+|\/?assets\/[a-zA-Z0-9_/-]+\.(?:svg|webp|png|jpe?g))$/.test(image.file))err('Usa un’immagine HTTPS o un file nella cartella assets.');
        if(!image.generated&&(!/^https:\/\/[^\s"'<>]+$/.test(image.page||'')||!/^https:\/\/[^\s"'<>]+$/.test(image.licenseUrl||'')))err('Per le immagini trovate indica la pagina di origine e il link alla licenza.');
        for(const k of ['page','licenseUrl'])if(image[k]&&!/^https:\/\/[^\s"'<>]+$/.test(image[k]))err('Fonte e licenza devono avere collegamenti HTTPS validi.');
      }
    }
    needsReview=!!previous&&!same(value,previous);
  }
  if (id==='legal' && previous && !same(value,previous)) {
    if (!Number.isInteger(value.version)||value.version<=previous.version) err('Aumenta la versione degli avvisi quando aggiorni le regole.');
    needsReview=true;
  }
  return {value,needsReview};
}
