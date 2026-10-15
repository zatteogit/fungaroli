// A word can have several meanings. Never resolve a tie by catalogue order.
export const GLOSSARY_CONTEXTS=['Funghi','Piante','Alberi','Bosco','Sentiero'];
export const glossaryAliasKey=word=>String(word||'').trim().toLowerCase().replace(/\s+/g,' ');

// Tabella di compatibilità: categoria della voce → ambiti delle zone di testo in cui la voce si collega.
//   Funghi            → solo Funghi (lamelle, volva, poro…)
//   Piante, Alberi    → Piante e Alberi (aghi, lobi, gemme…)
//   Bosco, Sentiero   → ovunque (habitat, lettiera, quota, dislivello…)
// Una voce può sostituire la riga della sua categoria con il campo `contexts` del glossario
// (es. micorriza e micelio valgono anche per piante, alberi e bosco).
export const CATEGORY_SCOPES={Funghi:['Funghi'],Piante:['Piante','Alberi'],Alberi:['Piante','Alberi'],Bosco:GLOSSARY_CONTEXTS,Sentiero:GLOSSARY_CONTEXTS};
// Glossari pubblicati prima del campo `contexts`: queste voci di ecologia erano già condivise.
const SHARED_WITHOUT_CONTEXTS=['micorriza','saprotrofo','micelio','ifa','latifoglie','conifere','caducifoglia','sempreverde'];
export function termContexts(term){
 if(Array.isArray(term.contexts))return term.contexts;
 // Older authored glossaries may lack the new metadata: keep domain-specific
 // meanings constrained rather than routing botanical words to fungi.
 if(SHARED_WITHOUT_CONTEXTS.includes(term.id))return GLOSSARY_CONTEXTS;
 return CATEGORY_SCOPES[term.category]||GLOSSARY_CONTEXTS;
}
export function buildGlossaryIndex(terms){
 const index=new Map();
 for(const term of terms)for(const word of [term.term,...(term.aliases||[])]){
  const key=glossaryAliasKey(word);if(key.length<=2)continue;
  const rows=index.get(key)||[];if(!rows.some(t=>t.id===term.id))rows.push(term);index.set(key,rows);
 }
 return index;
}
export function resolveGlossaryTerm(index,word,context){
 const candidates=index.get(glossaryAliasKey(word))||[];
 const matching=context?candidates.filter(t=>termContexts(t).includes(context)):candidates.filter(t=>termContexts(t).length===GLOSSARY_CONTEXTS.length);
 return matching.length===1?matching[0]:null;
}
export function relatedGlossaryTerms(index,terms,term,context){
 return (term.related||[]).flatMap(id=>{
  const original=terms.find(t=>t.id===id);if(!original)return [];
  const resolved=resolveGlossaryTerm(index,original.term,context);
  return resolved?[resolved]:[];
 });
}

// Collegamento automatico nel testo: solo dentro le zone dichiarate con data-glossary="<ambito>".
// «Generale» (o una zona senza ambito valido) accetta soltanto le voci che valgono ovunque.
export const GLOSSARY_SCOPES=[...GLOSSARY_CONTEXTS,'Generale'];
export function normalizeGlossaryScope(value){
 const v=String(value||'').trim().toLowerCase();
 return GLOSSARY_SCOPES.find(s=>s.toLowerCase()===v)||'Generale';
}
// Parole corte (al massimo 4 lettere: ago, poro, ife, lobo, pomo, GPX) sono spesso ambigue
// («ago» è anche agosto): si collegano solo nell'ambito della categoria della voce, mai altrove.
export const SHORT_WORD_MAX=4;
export const CATEGORY_HOME={Funghi:['Funghi'],Piante:['Piante','Alberi'],Alberi:['Piante','Alberi'],Bosco:['Bosco'],Sentiero:['Sentiero']};
export function linkableGlossaryTerm(index,word,scope){
 const s=normalizeGlossaryScope(scope);
 const term=resolveGlossaryTerm(index,word,s==='Generale'?undefined:s);
 if(!term)return null;
 const letters=glossaryAliasKey(word).replace(/[^\p{L}]/gu,'').length;
 if(letters<=SHORT_WORD_MAX&&!(CATEGORY_HOME[term.category]||[]).includes(s))return null;
 return term;
}
