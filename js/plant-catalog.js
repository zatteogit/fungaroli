import {matchSpecies} from './species-search.js';
// Ricerca e filtri dei cataloghi di Scopri (piante e alberi). Funzioni pure, testabili senza DOM.
const norm=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function searchPlants(rows,query='',category=''){
  return matchSpecies(rows.filter(p=>!category||p.category===category),query).items;
}

// Sosia pericoloso: tra i sosia indicati nella scheda c'è una pianta della categoria «Pericolose».
const dangerousIds=rows=>new Set(rows.filter(p=>p.category==='Pericolose').map(p=>p.id));
export const hasDangerousLookalike=(p,danger)=>(p.lookalikes||[]).some(id=>danger.has(id));

// Filtri in AND: categoria, testo, fioritura nel mese, sosia pericolosi, ambiente.
export function filterPlants(rows,{category='',q='',flowering=false,month=new Date().getMonth()+1,lookalikes=false,habitat=''}={}){
  const danger=lookalikes?dangerousIds(rows):null;
  const eligible=rows.filter(p=>(!category||p.category===category)&&
    (!flowering||(p.flowerMonths||[]).includes(month))&&
    (!lookalikes||hasDangerousLookalike(p,danger))&&
    (!habitat||(p.habitatCategories||[]).includes(habitat)));
  return searchPlants(eligible,q);
}

// Ambienti presenti nel catalogo, dal più frequente; a parità, in ordine alfabetico.
export function plantHabitats(rows){
  const n=new Map();
  for(const p of rows)for(const h of p.habitatCategories||[])n.set(h,(n.get(h)||0)+1);
  return [...n].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'it')).map(([name,count])=>({name,count}));
}

// Gruppo di un albero dal campo `type` («latifoglia caducifoglia», «conifera»…). Valori diversi: nessun gruppo.
export function treeGroup(type=''){
  const t=norm(type).trim();
  return t.startsWith('conifer')?'conifere':t.startsWith('latifogli')?'latifoglie':'';
}
