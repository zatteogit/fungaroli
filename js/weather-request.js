// Il browser usa la cache condivisa del Worker; gli strumenti di esportazione
// possono interrogare direttamente il provider senza dipendere dal sito.
const API = 'https://api.open-meteo.com/v1/forecast';
export async function fetchForecast(params) {
  if(typeof document!=='undefined') {
    const coords=['latitude','longitude','elevation'].map(name=>params.get(name).split(','));
    const groups=[];
    for(let start=0;start<coords[0].length;){
      let end=start+1;while(end<coords[0].length&&coords[0][end]===coords[0][start]&&coords[1][end]===coords[1][start])end++;
      const query=new URLSearchParams(params);['latitude','longitude','elevation'].forEach((name,i)=>query.set(name,coords[i].slice(start,end).join(',')));
      groups.push(query);start=end;
    }
    const results=[],controller=new AbortController(),signal=AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);let next=0;
    try {await Promise.all(Array.from({length:Math.min(3,groups.length)},async()=>{while(next<groups.length){signal.throwIfAborted();const i=next++;results[i]=await requestForecast(groups[i],signal);}}));}
    catch(e){controller.abort();throw e;}
    return {raw:results.flatMap(r=>r.raw),fetchedAt:new Date(Math.min(...results.map(r=>r.fetchedAt.getTime()))),stale:results.some(r=>r.stale)};
  }
  return requestForecast(params);
}
async function requestForecast(params,signal=AbortSignal.timeout(20000)) {
  const endpoint = typeof document === 'undefined' ? API : '/api/weather/v1/forecast';
  const response = await fetch(`${endpoint}?${params}`, {cache:'no-store',signal});
  if (!response.ok) {
    let detail;
    try {detail=await response.json();} catch { /* risposta non JSON */ }
    throw Object.assign(new Error(detail?.error || (response.status===429
      ? 'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.'
      : 'Il servizio meteo non è disponibile. Riprova tra poco.')), {status:response.status});
  }
  const raw=await response.json(), stamp=response.headers?.get('x-weather-fetched-at');
  const fetchedAt=stamp ? new Date(stamp) : new Date();
  if(!Number.isFinite(fetchedAt.getTime()))throw new Error('Il meteo ricevuto non ha una data di aggiornamento valida.');
  return {raw:Array.isArray(raw)?raw:[raw],fetchedAt,stale:response.headers?.get('x-weather-cache')==='stale'};
}
export const weatherErrorMessage = err => err?.name==='TimeoutError'||err?.name==='AbortError'
  ? 'Il meteo impiega troppo tempo a rispondere. Riprova tra poco.'
  : err?.status ? err.message : 'Non riesco a ricevere il meteo. Verifica la connessione o riprova tra poco.';
