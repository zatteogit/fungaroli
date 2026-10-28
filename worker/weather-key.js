// Chiave unica del meteo salvato: provider, snapshot e avvisi devono calcolarla allo stesso modo.
export const weatherDigest=async params=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(params.toString()))),b=>b.toString(16).padStart(2,'0')).join('');
export const weatherCacheKey=async params=>`weather:v3:${await weatherDigest(params)}`;
