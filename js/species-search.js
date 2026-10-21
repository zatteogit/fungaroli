// Nomi prima dei caratteri: i suggerimenti usano solo descrizioni già documentate.
export const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g,' ').trim();
export const speciesNames = t => [t.name,t.title,t.latin,...(t.aliases || []),...(t.aka || [])].filter(Boolean).join(' ');
const LABELS = {cap_color:'Cappello',cap_shape:'Forma del cappello',cap_size:'Diametro del cappello',cap_surface:'Superficie del cappello',cap_veil:'Velo sul cappello',hymenophore:'Sotto il cappello',hymenophore_color:'Colore di lamelle o pori',gill_attachment:'Attacco delle lamelle',stem_ring:'Anello',stem_volva:'Volva',stem_reticulum:'Reticolo sul gambo',stem_base:'Base del gambo',flesh_change:'Al taglio',flesh_texture:'Consistenza',spore_print:'Sporata',smell:'Odore',habitat:'Ambiente',growth:'Come cresce',latex:'Latice'};
export function speciesFeatures(t) {
  const fields=[];
  for(const [key,label] of Object.entries(LABELS)) {
    const value=t.traits?.[key];
    for(const v of [].concat(value ?? [])) {
      if(typeof v==='string')fields.push(`${label}: ${v.replace(/_/g,' ')}`);
      else if(typeof v==='boolean')fields.push(`${label}: ${v?'presente':'assente'}`);
    }
  }
  if(t.habitat)fields.push(`Ambiente: ${t.habitat}`);
  if(t.type)fields.push(`Tipo: ${t.type}`);
  for(const text of t.recognize || [])fields.push(`Caratteri: ${text}`);
  for(const text of t.check_before_picking || [])fields.push(`Da controllare: ${text}`);
  return fields;
}
export function matchSpecies(rows,query,{names=speciesNames,features=speciesFeatures}={}) {
  const q=normalizeSearch(query),words=q.split(' ').filter(Boolean);
  if(!words.length)return {items:rows,byTraits:false,reasons:new Map()};
  const nameHits=rows.filter(t=>words.every(w=>normalizeSearch(names(t)).includes(w)));
  if(nameHits.length)return {items:nameHits,byTraits:false,reasons:new Map()};
  if(q.length<3)return {items:[],byTraits:false,reasons:new Map()};
  const reasons=new Map();
  const items=rows.filter(t=>{
    const fields=features(t),hay=normalizeSearch([names(t),...fields].join(' '));
    if(!fields.length||!words.every(w=>hay.includes(w)))return false;
    const matched=fields.filter(field=>words.some(w=>normalizeSearch(field).includes(w)));
    if(!matched.length)return false;
    reasons.set(t,matched.slice(0,2).join(' · '));return true;
  });
  return {items,byTraits:items.length>0,reasons};
}
