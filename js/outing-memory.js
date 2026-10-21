// Ricordi personali: non sono quantità, identificazioni o misure GPS.
export const FATIGUE = [['easy','Tranquilla'],['moderate','Un po’ di fatica'],['hard','Impegnativa']];
export const MUSHROOMS = [['observed','Ho osservato funghi'],['searched-none','Ho cercato, senza osservarne'],['not-searched','Non li ho cercati']];
export function outingMemory(entry, species=[]) {
  const raw=entry?.experience||{},known=new Set(species.map(s=>s.id));
  const observedIds=raw.mushrooms==='observed'&&Array.isArray(raw.observedIds)?[...new Set(raw.observedIds.filter(id=>known.has(id)))].slice(0,100):[];
  const route=raw.route&&/^#\/zona\/[a-z0-9_-]+(?:\/[0-7])?(?:\/sentiero\/[a-z0-9_-]+)?$/i.test(raw.route.href)&&typeof raw.route.name==='string'&&raw.route.name.trim()
    ?{href:raw.route.href,name:raw.route.name.slice(0,200),followed:raw.route.followed===true}:null;
  return {version:'fronda-outing-memory-v1',
    fatigue:FATIGUE.some(([v])=>v===raw.fatigue)?raw.fatigue:null,
    durationMinutes:Number.isInteger(raw.durationMinutes)&&raw.durationMinutes>0&&raw.durationMinutes<=1440?raw.durationMinutes:null,
    mushrooms:MUSHROOMS.some(([v])=>v===raw.mushrooms)?raw.mushrooms:'unknown',
    observedIds,route,fromEntryId:typeof raw.fromEntryId==='string'&&/^[a-zA-Z0-9-]{4,64}$/.test(raw.fromEntryId)?raw.fromEntryId:null};
}
export function outingStory(entry,{zones=[],species=[]}={}) {
  if(entry.kind!=='outing')return '';
  const memory=outingMemory(entry,species),zone=zones.find(z=>z.id===entry.zoneId);
  const when=new Date(entry.date+'T12:00:00');
  const day=Number.isFinite(+when)?when.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):'';
  const sentences=[`${day?`Il ${day}, un giro`:'Un giro'}${zone?` a ${zone.title||zone.name}`:''}.`];
  if(memory.route?.followed)sentences.push(`Percorso dichiarato: ${memory.route.name}.`);
  const effort={easy:'senza troppa fatica',moderate:'con un po’ di fatica',hard:'impegnativa'}[memory.fatigue];
  if(memory.durationMinutes)sentences.push(`Un’uscita di ${memory.durationMinutes} minuti${effort?`, ${effort}`:''}.`);
  else if(effort)sentences.push(`Un’uscita ${effort}.`);
  const ids=[...new Set([...memory.observedIds,...Object.keys(entry.finds||{}).filter(id=>entry.finds[id]>0)])];
  const names=ids.map(id=>species.find(s=>s.id===id)?.name).filter(Boolean);
  if(names.length)sentences.push(`Funghi annotati: ${names.join(', ')}.`);
  else if(memory.mushrooms==='observed')sentences.push('Funghi osservati, senza indicare le specie.');
  else if(memory.mushrooms==='searched-none')sentences.push('Ricerca di funghi senza osservazioni annotate.');
  else if(memory.mushrooms==='not-searched')sentences.push('Durante il giro non sono stati cercati funghi.');
  return sentences.join(' ');
}
