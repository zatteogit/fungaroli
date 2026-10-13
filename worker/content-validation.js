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
      if (['file','file_hd','thumb','page','url','href','src'].includes(key) && v && !/^(?:https?:\/\/[^\s"'<>]+|\/?assets\/[a-zA-Z0-9_./%-]+|\/?api\/content\/media\/[a-zA-Z0-9_./-]+|#\/[a-zA-Z0-9_/-]+)$/.test(v)) err(`Il campo ${key} deve contenere un URL o un percorso immagine valido.`);
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
  if (id==='guides') {
    if (!Array.isArray(value.guides)) err('Elenco articoli non valido.');
    checkIds(value.guides);
    if (value.guides.some(g=>typeof g.title!=='string'||!g.title.trim()||typeof g.body!=='string')) err('Ogni articolo richiede titolo e testo.');
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
      if(typeof t.term!=='string'||!t.term.trim()||typeof t.definition!=='string'||!t.definition.trim()||typeof t.observe!=='string'||!['Funghi','Alberi','Bosco','Sentiero'].includes(t.category)) err(`Completa parola, categoria, definizione e indicazioni di campo per ${t.id}.`);
      if(!Array.isArray(t.aliases)||t.aliases.some(a=>typeof a!=='string'||a.trim().length<3)||!Array.isArray(t.related)||t.related.some(id=>!ids.has(id)||id===t.id)) err(`Sinonimi o voci collegate non validi per ${t.id}.`);
      if(!Array.isArray(t.sources)||!t.sources.length||t.sources.some(s=>typeof s?.title!=='string'||!s.title.trim()||!/^https?:\/\//.test(s?.url||''))) err(`Aggiungi fonti consultabili alla voce ${t.id}.`);
      for(const word of [t.term,...t.aliases]) {
        const key=word.trim().toLowerCase();
        if(aliases.has(key)&&aliases.get(key)!==t.id) err(`La parola ${word} è associata a più voci del glossario.`);
        aliases.set(key,t.id);
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
