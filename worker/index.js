import {handleFeedback,cleanupFeedback} from './feedback.js';
// Worker di Fronda: i file statici sono serviti da Workers Assets (wrangler.jsonc);
// qui arrivano solo le richieste che non corrispondono a un file, cioe' l'API del diario.
import {publicExternalSignals} from './external-engine.js';
import { handleDiario } from '../functions/api/diario/[[path]].js';
import { handleCommunity, cleanupCommunity } from './community.js';
import { handleSurvey, cleanupSurvey } from './survey.js';
import { handleCms, handleContent, publishedResources } from './cms.js';
import {weatherStorage,cleanupWeatherStorage} from './weather-storage.js';
import {WEATHER_REFRESH_CRON,refreshSavedWeather} from './weather-refresh.js';
import { cachedForecast } from './weather-provider.js';
import {weatherSnapshot} from './weather-snapshot.js';
import { recordWeatherMetric, cleanupWeatherMetrics } from './weather-metrics.js';
import { ARCHIVE_CRON, archiveForecasts } from './forecast-archive.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if(url.pathname==='/api/forecast/v1/external-signals'){
      if(request.method!=='GET')return Response.json({error:'Metodo non consentito.'},{status:405});
      try{await publishedResources(env,url.origin,['zones','species-traits']);return Response.json(await publicExternalSignals(env),{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});}
      catch{return Response.json({error:'Segnalazioni temporaneamente non disponibili.'},{status:503,headers:{'cache-control':'no-store'}});}
    }
    if(['/api/weather/v1/forecast','/api/weather/v1/snapshot'].includes(url.pathname)) {
      if(request.method!=='GET')return new Response('Metodo non consentito.',{status:405});
      try {
        // A CMS outage must not prevent reading the independent weather cache.
        let content;
        try { content=await publishedResources(env,url.origin,['zones'],{initialize:false}); } catch { /* fall back to the published bundled zones */ }
        const zones=content?.zones?.zones||(await (await env.ASSETS.fetch(new Request(new URL('/data/zones.json',url)))).json()).zones;
        if(url.pathname.endsWith('/snapshot'))return await weatherSnapshot(url.searchParams.get('profile'),zones,env);
        const metrics=env.CMS_DB&&ctx?.waitUntil?m=>ctx.waitUntil(recordWeatherMetric(env.CMS_DB,m)):undefined;
        return await cachedForecast(url.searchParams,{zones,cache:weatherStorage(env),waitUntil:ctx?.waitUntil?.bind(ctx),cacheOnly:true,metrics});
      } catch(e) {return Response.json({error:e?.status?e.message:'Il servizio meteo non è disponibile. Riprova tra poco.',...(e?.code?{code:e.code}:{})},{status:e?.status||503,headers:{'cache-control':'no-store'}});}
    }
    if(url.pathname==='/redazione'||url.pathname==='/redazione/')return env.ASSETS.fetch(request);
    if(url.pathname.startsWith('/api/cms/v1/'))return handleCms(request,env);
    if(url.pathname==='/api/content/v1/snapshot')return handleContent(request,env);
    if (url.pathname.startsWith('/api/community/')) return handleCommunity(request, env);
    if (url.pathname.startsWith('/api/feedback/')) return handleFeedback(request,env);
    if (url.pathname.startsWith('/api/survey/v1/')) return handleSurvey(request, env);
    const m = url.pathname.match(/^\/api\/diario\/?(.*)$/);
    if (m) return handleDiario(request, env, m[1] ? m[1].split('/').filter(Boolean) : []);
    return env.ASSETS.fetch(request);
  },
  // Alle 3:17 UTC pulizie indipendenti: community, questionario e contatori meteo. Archivio delle previsioni (D1):
  // passaggi brevi ogni 5 minuti fra le 4 e le 5:55 UTC, poche zone per volta.
  async scheduled(event, env, ctx) {
    if(event.cron===WEATHER_REFRESH_CRON){ctx.waitUntil(weatherRefreshRun(env,event.scheduledTime));return;}
    if (event.cron === ARCHIVE_CRON) { ctx.waitUntil(archiveRun(env)); return; }
    ctx.waitUntil(cleanupFeedback(env)); ctx.waitUntil(cleanupWeatherStorage(env)); ctx.waitUntil(cleanupCommunity(env)); ctx.waitUntil(cleanupSurvey(env)); ctx.waitUntil(cleanupWeatherMetrics(env.CMS_DB));
  },
};

// Zone pubblicate dal CMS, con ripiego sul file del repository, come per il meteo dell'app.
async function archiveRun(env) {
  const origin = env.APP_ORIGIN || 'https://fungaroli.zatteo.workers.dev';
  let content;
  try { content = await publishedResources(env, origin, ['zones'], { initialize: false }); } catch { /* ripiego sotto */ }
  const zones = content?.zones?.zones || (await (await env.ASSETS.fetch(new Request(new URL('/data/zones.json', origin)))).json()).zones;
  const metrics = env.CMS_DB ? (m) => recordWeatherMetric(env.CMS_DB, m) : undefined;
  try { return await archiveForecasts(env, { zones, metrics }); } catch { /* il passaggio successivo riprova le zone mancanti */ }
}

async function weatherRefreshRun(env,scheduledTime){
  const origin=env.APP_ORIGIN||'https://fungaroli.zatteo.workers.dev';
  let content;
  try{content=await publishedResources(env,origin,['zones'],{initialize:false});}catch{/* catalogue bundled below */}
  const zones=content?.zones?.zones||(await (await env.ASSETS.fetch(new Request(new URL('/data/zones.json',origin)))).json()).zones;
  const metrics=env.CMS_DB?m=>recordWeatherMetric(env.CMS_DB,m):undefined;
  const outcomes=await refreshSavedWeather(env,{zones,scheduledTime,metrics});
  if(outcomes.some(r=>!r.ok))console.warn(JSON.stringify({event:'weather-refresh-incomplete',outcomes}));
}
