// D1 owns the live public cache. KV is only a read fallback for records acquired
// before this release; scheduled refreshes do not consume KV's daily write quota.
export const WEATHER_STORAGE_SCHEMA=`CREATE TABLE IF NOT EXISTS weather_live_cache (
  cache_key TEXT PRIMARY KEY,
  acquired_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  payload TEXT NOT NULL
)`;
const initialized=new WeakMap();
async function init(db){
  if(!initialized.has(db))initialized.set(db,db.prepare(WEATHER_STORAGE_SCHEMA).run().catch(e=>{initialized.delete(db);throw e;}));
  await initialized.get(db);
}
export function weatherStorage(env){
  const db=env.CMS_DB;
  return {
    async get(key){
      if(db)try{
        await init(db);
        const row=await db.prepare('SELECT payload FROM weather_live_cache WHERE cache_key=? AND expires_at>?').bind(key,Date.now()).first();
        if(row)return JSON.parse(row.payload);
      }catch{/* Independent legacy copies remain readable during a D1 outage. */}
      return env.DIARIO?.get(key,'json')??null;
    },
    async put(key,payload,{expirationTtl}){
      if(!db)throw new Error('Archivio meteo non disponibile.');
      await init(db);const record=JSON.parse(payload);
      await db.prepare(`INSERT INTO weather_live_cache(cache_key,acquired_at,expires_at,payload) VALUES(?,?,?,?)
        ON CONFLICT(cache_key) DO UPDATE SET acquired_at=excluded.acquired_at,expires_at=excluded.expires_at,payload=excluded.payload
        WHERE weather_live_cache.acquired_at<=excluded.acquired_at`)
        .bind(key,record.t,record.t+expirationTtl*1000,payload).run();
    },
  };
}
export async function cleanupWeatherStorage(env,now=Date.now()){
  if(!env.CMS_DB)return;
  await init(env.CMS_DB);
  await env.CMS_DB.prepare('DELETE FROM weather_live_cache WHERE expires_at<=?').bind(now).run();
}
