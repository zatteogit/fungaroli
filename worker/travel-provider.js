import {validPoint,pointKey} from '../js/travel-model.js';
export async function searchPlaces(q,fetcher=fetch) {
  if(typeof q!=='string'||q.trim().length<2||q.length>120)throw new Error('Scrivi almeno due caratteri per cercare una località.');
  const url=new URL('https://photon.komoot.io/api/');
  url.search=new URLSearchParams({q:q.trim(),limit:'6',lat:'42.404',lon:'12.8623'}).toString();
  const r=await fetcher(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Ricerca delle località non disponibile. Riprova.');
  const data=await r.json();
  return (data.features||[]).map(f=>{
    const p=f.properties||{},[lon,lat]=f.geometry?.coordinates||[];
    const name=[p.name||p.city||p.street,p.city!==p.name?p.city:null,p.state,p.country].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(', ').slice(0,100);
    return {name,lat,lon};
  }).filter(p=>validPoint(p)&&p.name).slice(0,6);
}
export async function routeMatrix(base,targets,fetcher=fetch) {
  if(!validPoint(base)||!Array.isArray(targets)||!targets.length||targets.length>50||targets.some(p=>!validPoint(p)))throw new Error('Punti del percorso non validi.');
  const coords=[base,...targets].map(p=>`${p.lon},${p.lat}`).join(';');
  const url=new URL(`https://routing.openstreetmap.de/routed-car/table/v1/driving/${coords}`);
  url.search=new URLSearchParams({sources:'0',destinations:targets.map((_,i)=>i+1).join(';'),annotations:'distance,duration'}).toString();
  const r=await fetcher(url,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw new Error('Calcolo stradale non disponibile. Riprova.');
  const data=await r.json();if(data.code!=='Ok')throw new Error('Il servizio non riesce a calcolare questi percorsi.');
  return targets.map((p,i)=>{
    const seconds=data.durations?.[0]?.[i],meters=data.distances?.[0]?.[i];
    const known=Number.isFinite(seconds)&&seconds>=0&&Number.isFinite(meters)&&meters>=0;
    return {key:pointKey(p),minutes:known?Math.round(seconds/60):null,km:known?meters/1000:null};
  });
}
