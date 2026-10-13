// Il browser usa la cache condivisa del Worker; gli strumenti di esportazione
// possono interrogare direttamente il provider senza dipendere dal sito.
const API = 'https://api.open-meteo.com/v1/forecast';
export async function fetchForecast(params) {
  const endpoint = typeof document === 'undefined' ? API : '/api/weather/v1/forecast';
  const response = await fetch(`${endpoint}?${params}`, {cache:'no-store',signal:AbortSignal.timeout(20000)});
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
