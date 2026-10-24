// Stabilità della pagina mentre arrivano i dati (decisione di Matteo del 24/10/2026).
// Ogni dato ha una freschezza; un aggiornamento che cambia poco si applica al suo posto, uno che cambierebbe la
// proposta resta in attesa di «Aggiorna», salvo la pagina appena aperta. I peggioramenti di sicurezza si segnano subito.
export const FRESH_MS=3600000;            // meteo fresco: 1 ora (WEATHER_FRESH_MS)
export const OUTING_VALID_MS=3*FRESH_MS;  // meteo dell'uscita valido: 3 ore (MAX_OUTING_AGE_MS)
export const GROWTH_VALID_MS=24*FRESH_MS; // indice di crescita valido: 24 ore
export const SETTLE_MS=2000;              // pagina appena aperta: i dati arrivati entro 2 s si applicano
export function freshness(fetchedAt,now=Date.now(),valid=OUTING_VALID_MS){
 const t=fetchedAt instanceof Date?fetchedAt.getTime():Date.parse(fetchedAt);
 if(!Number.isFinite(t))return 'missing';
 const age=now-t;
 return age<FRESH_MS?'fresh':age<valid?'dated':'expired';
}
const key=c=>`${c.z?.id??c.id}|${c.o??''}`;
const severe=c=>{const w=c.weather||c.w;return !!w&&(w.level==='sconsigliata'||w.thunder===true);};
// Firma di ciò che si vede: copertina (prima) e ordine delle prime tre.
export function viewSignature(list){
 return {cover:list[0]?key(list[0]):null,top:list.slice(0,3).map(key),severe:new Set(list.filter(severe).map(key))};
}
// 'same' | 'values' (stessa copertina e stesso ordine delle prime tre) | 'major'.
// alerts: le card già visibili che ora sono sconsigliate o con temporali e prima no.
export function compareViews(prev,next){
 if(!prev)return {kind:'major',alerts:[]};
 const alerts=prev.top.filter(k=>next.severe.has(k)&&!prev.severe.has(k));
 const sameOrder=prev.cover===next.cover&&prev.top.length===next.top.length&&prev.top.every((k,i)=>k===next.top[i]);
 return {kind:sameOrder?(alerts.length?'values':'same'):'major',alerts};
}
// 'apply' o 'defer'. Applica sempre ciò che non cambia la proposta, e tutto quando la pagina è appena aperta.
export function updatePolicy({kind,shownAt,now=Date.now(),scrolled=false}){
 if(kind!=='major')return 'apply';
 return !scrolled&&Number.isFinite(shownAt)&&now-shownAt<SETTLE_MS?'apply':'defer';
}
