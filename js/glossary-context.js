// A word can have several meanings. Never resolve a tie by catalogue order.
export const GLOSSARY_CONTEXTS=['Funghi','Piante','Alberi','Bosco','Sentiero'];
export const glossaryAliasKey=word=>String(word||'').trim().toLowerCase().replace(/\s+/g,' ');
export function termContexts(term){
 if(Array.isArray(term.contexts))return term.contexts;
 // Older authored glossaries may lack the new metadata: keep domain-specific
 // meanings constrained rather than routing botanical words to fungi.
 if(term.category==='Funghi'&&!['micorriza','saprotrofo','micelio','ifa'].includes(term.id))return ['Funghi'];
 if(['Piante','Alberi'].includes(term.category)&&!['latifoglie','conifere','caducifoglia','sempreverde'].includes(term.id))return ['Piante','Alberi'];
 return GLOSSARY_CONTEXTS;
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
