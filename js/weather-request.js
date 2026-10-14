// Il browser usa la cache condivisa del Worker; gli strumenti di esportazione
// possono interrogare direttamente il provider senza dipendere dal sito.
const API = 'https://api.open-meteo.com/v1/forecast';
export async function fetchForecast(params,{onProgress,onChunk,signal:parentSignal}={}) {
  if(typeof document!=='undefined') {
    const coords=['latitude','longitude','elevation'].map(name=>params.get(name).split(','));
    const groups=[];
    for(let start=0;start<coords[0].length;){
      let end=start+1;while(end<coords[0].length&&coords[0][end]===coords[0][start]&&coords[1][end]===coords[1][start])end++;
      const query=new URLSearchParams(params);['latitude','longitude','elevation'].forEach((name,i)=>query.set(name,coords[i].slice(start,end).join(',')));
      groups.push({query,start});start=end;
    }
    const results=[],deadline=AbortSignal.timeout(45000);let next=0,finished=0,firstError;
    await Promise.all(Array.from({length:Math.min(3,groups.length)},async()=>{while(next<groups.length){
      const i=next++,{query,start}=groups[i],count=query.get('latitude').split(',').length;
      const signal=AbortSignal.any([deadline,AbortSignal.timeout(20000),...(parentSignal?[parentSignal]:[])]);
      try {
        let received;
        try {received=await requestForecast(query,signal);}catch(e){
          // Una risposta transitoria non deve cancellare tutte le altre zone.
          if(!signal.aborted&&e.status>=500)received=await requestForecast(query,signal);else throw e;
        }
        if(received.raw.length!==count)throw new Error('Serie meteo incompleta');
        onChunk?.({...received,start,count});
        if(received.refreshing){
          // Publish the shared saved copy before awaiting its in-flight refresh.
          // If the refresh fails, keep that same dated copy in the result.
          try{const fresh=await requestForecast(query,signal,true);if(fresh.raw.length!==count)throw new Error('Serie meteo incompleta');received=fresh;onChunk?.({...fresh,start,count});}catch{/* the saved response remains usable within its age limit */}
        }
        results[i]=received;
      }catch(e){firstError??=e;results[i]={raw:Array(count).fill(null)};}
      onProgress?.(++finished,groups.length);
    }}));
    const valid=results.filter(r=>r.fetchedAt);
    if(!valid.length)throw firstError;
    return {raw:results.flatMap(r=>r.raw),fetchedAt:new Date(Math.min(...valid.map(r=>r.fetchedAt.getTime()))),stale:valid.some(r=>r.stale),partial:valid.length!==results.length};
  }
  return requestForecast(params);
}
async function requestForecast(params,signal=AbortSignal.timeout(20000),waitForFresh=false) {
  const endpoint = typeof document === 'undefined' ? API : '/api/weather/v1/forecast';
  const response = await fetch(`${endpoint}?${params}`, {cache:'no-store',signal,...(waitForFresh?{headers:{'x-weather-refresh':'1'}}:{})});
  if (!response.ok) {
    let detail;
    try {detail=await response.json();} catch { /* risposta non JSON */ }
    throw Object.assign(new Error(detail?.error || (response.status===429
      ? 'Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco.'
      : 'Il servizio meteo non è disponibile. Riprova tra poco.')), {status:response.status});
  }
  const raw=await response.json(), stamp=response.headers?.get('x-weather-fetched-at');
  const stamped=stamp ? new Date(stamp) : new Date();
  if(!Number.isFinite(stamped.getTime()))throw new Error('Il meteo ricevuto non ha una data di aggiornamento valida.');
  // Il server data la risposta con il proprio orologio: se quello del dispositivo è
  // indietro, una copia appena scaricata risulterebbe "dal futuro" e verrebbe scartata.
  const fetchedAt=new Date(Math.min(stamped.getTime(),Date.now()));
  return {raw:Array.isArray(raw)?raw:[raw],fetchedAt,stale:response.headers?.get('x-weather-cache')==='stale',refreshing:response.headers?.get('x-weather-refreshing')==='1'};
}
export const weatherErrorMessage = err => err?.name==='TimeoutError'||err?.name==='AbortError'
  ? 'Il meteo impiega troppo tempo a rispondere. Riprova tra poco.'
  : err?.status ? err.message : 'Non riesco a ricevere il meteo. Verifica la connessione o riprova tra poco.';
