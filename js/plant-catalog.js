const norm=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function searchPlants(rows,query='',category=''){
  const words=norm(query).trim().split(/\s+/).filter(Boolean);
  return rows.filter(p=>(!category||p.category===category)&&words.every(w=>norm([p.name,p.latin,...(p.aliases||[]),p.habitat,...(p.recognize||[])].join(' ')).includes(w)));
}
