import {forecastParams} from './weather-provider.js';
import {weatherStorage} from './weather-storage.js';
import {weatherCacheKey} from './weather-key.js';

// Lettura pubblica in blocco: niente provider, nessuna ricostruzione del grande JSON
// nel Worker. Ogni riga conserva la data di acquisizione della propria zona.
export async function weatherSnapshot(profile,zones,env){
 if(!['growth','outing'].includes(profile))return Response.json({error:'Profilo meteo non valido.'},{status:422});
 const entries=await Promise.all(zones.filter(z=>z.publicationStatus!=='draft'&&z.bands?.length).map(async z=>{
  const params=forecastParams([z],profile);
  return {key:await weatherCacheKey(params),coordinates:['latitude','longitude','elevation'].map(k=>params.get(k)).join('|')};
 }));
 const records=await weatherStorage(env).getMany(entries.map(e=>e.key));
 if(!records.size)return Response.json({error:'Copia meteo in preparazione.',code:'cache-warming'},{status:503,headers:{'cache-control':'no-store'}});
 const encoder=new TextEncoder();let index=0;
 return new Response(new ReadableStream({pull(controller){
  while(index<entries.length){const entry=entries[index++],payload=records.get(entry.key);if(payload){controller.enqueue(encoder.encode(`{"coordinates":${JSON.stringify(entry.coordinates)},"record":${payload}}\n`));return;}}
  controller.close();
 }}),{headers:{'content-type':'text/plain; charset=utf-8','x-weather-format':'ndjson-v1','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
