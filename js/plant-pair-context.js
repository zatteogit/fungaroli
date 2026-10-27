// Le note di un gruppo non diventano automaticamente note della coppia.
export function plantPairContext(data,left,right){
 const relations=(data.confusables||[]).filter(c=>c.ids.includes(left)&&c.ids.includes(right));
 const pairs=relations.flatMap(c=>c.ids.length===2?[c]:(c.pairs||[]).filter(p=>p.ids.length===2&&p.ids.includes(left)&&p.ids.includes(right)));
 const others=[...new Map(relations.flatMap(c=>c.ids.filter(id=>id!==left&&id!==right).flatMap(id=>[[left,id],[right,id]])).map(ids=>[ids.slice().sort().join('|'),ids])).values()];
 return {documented:relations.length>0,differences:pairs.flatMap(p=>p.differences||[]),cautions:[...new Set(pairs.map(p=>p.caution).filter(Boolean))],others};
}
