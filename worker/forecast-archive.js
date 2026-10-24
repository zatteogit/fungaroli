// Archivio quotidiano delle previsioni (D1, decisione di Matteo del 16/10/2026; progetto in
// docs/ipotesi/valutazione-modello-v3.md, 4.1). Ogni giorno salva, per ogni zona e fascia di quota, la previsione del
// profilo di crescita dal giorno prima (D−1) a D+7: è l'unico archivio prospettico dello stesso prodotto usato
// dall'app. Non cambia l'indice né l'interfaccia.
//
// Il lavoro è diviso in passaggi brevi (cron ogni 5 minuti fra le 4 e le 5:55 UTC), ciascuno con poche zone: un
// passaggio solo con tutte le 36 zone supererebbe il limite di CPU del Worker, come già successo al meteo globale.
// Peso stimato per Open-Meteo: un punto per fascia, 8 variabili e 9 giorni, cioè circa 108 chiamate al giorno.
import {GROWTH_DAILY,GROWTH_HOURLY,compactGrowth} from '../js/weather-data.js';
import archiveSchema from '../migrations/0016_forecast_archive.sql';
import {requestWeight} from './weather-provider.js';

export const ARCHIVE_PROFILE='growth-v2',ARCHIVE_PROVIDER='open-meteo',ARCHIVE_MODEL='best_match',ARCHIVE_ZONES_PER_RUN=2;
export const ARCHIVE_CRON='*/5 4,5 * * *';
const API='https://api.open-meteo.com/v1/forecast';
const initialized=new WeakMap();
const romeDay=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));

async function init(db){
  if(!initialized.has(db))initialized.set(db,db.batch(archiveSchema.split(';').map(s=>s.replace(/^\s*--.*$/gm,'').trim()).filter(Boolean).map(s=>db.prepare(s))).catch(e=>{initialized.delete(db);throw e;}));
  return initialized.get(db);
}
export function archiveParams(zones){
  const points=zones.flatMap(z=>z.bands.map(band=>({zone:z,band})));
  return {points,params:new URLSearchParams({latitude:points.map(p=>p.zone.lat).join(','),longitude:points.map(p=>p.zone.lon).join(','),
    elevation:points.map(p=>p.band).join(','),daily:GROWTH_DAILY,hourly:GROWTH_HOURLY,past_days:'1',forecast_days:'8',timezone:'Europe/Rome'})};
}
// Una risposta incompleta non lascia righe parziali: o tutte le fasce delle zone del passaggio, o nessuna.
function rowsFrom(raw,points,today){
  const rows=Array.isArray(raw)?raw:[raw];
  if(rows.length!==points.length)throw new Error('Risposta di Open-Meteo incompleta.');
  const fields=GROWTH_DAILY.split(',');
  return compactGrowth(rows).map((row,i)=>{
    const d=row?.daily;
    if(!Array.isArray(d?.time)||d.time.length!==9||!d.time.includes(today)||fields.some(f=>!Array.isArray(d[f])||d[f].length!==d.time.length))throw new Error('Risposta di Open-Meteo incompleta.');
    const values=Object.fromEntries(Object.entries(d).map(([k,v])=>[k,k==='time'?v:v.map(x=>Number.isFinite(x)?x:null)]));
    return {point:points[i],cell:{lat:row.latitude??null,lon:row.longitude??null,elevation:row.elevation??null},values};
  });
}
// metrics: stesse misure delle chiamate dell'app (profilo «archive»), così il peso entra nella stima della quota.
export async function archiveForecasts(env,{zones,fetcher=fetch,now=Date.now(),perRun=ARCHIVE_ZONES_PER_RUN,metrics}={}){
  const db=env.COMMUNITY_DB;if(!db)return {saved:0,pending:0};
  await init(db);
  const today=romeDay(now);
  const {results}=await db.prepare('SELECT zone_id,COUNT(*) AS n FROM forecast_archive WHERE issued_on=? GROUP BY zone_id').bind(today).all();
  const done=new Map(results.map(r=>[r.zone_id,r.n]));
  const missing=zones.filter(z=>(done.get(z.id)||0)<z.bands.length);
  const batch=missing.slice(0,perRun);
  if(!batch.length)return {saved:0,pending:0};
  const {points,params}=archiveParams(batch);
  const started=Date.now();let outcome='upstream:network',rows;
  try{
    const res=await fetcher(`${API}?${params}`,{headers:{accept:'application/json','user-agent':'Fungaroli/1.0 (+https://fungaroli.zatteo.workers.dev)'},signal:AbortSignal.timeout(20000)});
    if(!res.ok){outcome=res.status===429?'upstream:429':'upstream:error';throw new Error(`Open-Meteo ha risposto ${res.status}.`);}
    outcome='upstream:invalid';rows=rowsFrom(await res.json(),points,today);outcome='upstream:ok';
  }finally{try{await metrics?.({profile:'archive',event:outcome,ms:Date.now()-started,...requestWeight(params)});}catch{/* metriche facoltative */}}
  await db.batch(rows.map(r=>db.prepare('INSERT INTO forecast_archive(zone_id,band,issued_on,fetched_at,provider,model,profile,cell_lat,cell_lon,cell_elevation,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(zone_id,band,issued_on) DO NOTHING')
    .bind(r.point.zone.id,r.point.band,today,now,ARCHIVE_PROVIDER,ARCHIVE_MODEL,ARCHIVE_PROFILE,r.cell.lat,r.cell.lon,r.cell.elevation,JSON.stringify(r.values))));
  return {saved:rows.length,pending:missing.length-batch.length};
}
