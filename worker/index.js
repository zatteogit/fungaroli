// Worker di Fungaroli Rieti: i file statici sono serviti da Workers Assets (wrangler.jsonc);
// qui arrivano solo le richieste che non corrispondono a un file, cioe' l'API del diario.
import { handleDiario } from '../functions/api/diario/[[path]].js';
import { handleCommunity, cleanupCommunity } from './community.js';
import { handleCms, handleContent, publishedResources } from './cms.js';
import { cachedForecast } from './weather-provider.js';
import { recordWeatherMetric, cleanupWeatherMetrics } from './weather-metrics.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if(url.pathname==='/api/weather/v1/forecast') {
      if(request.method!=='GET')return new Response('Metodo non consentito.',{status:405});
      try {
        const content=await publishedResources(env,url.origin,['zones'],{initialize:false});
        const zones=content?.zones?.zones||(await (await env.ASSETS.fetch(new Request(new URL('/data/zones.json',url)))).json()).zones;
        const metrics=env.CMS_DB&&ctx?.waitUntil?m=>ctx.waitUntil(recordWeatherMetric(env.CMS_DB,m)):undefined;
        return await cachedForecast(url.searchParams,{zones,cache:env.DIARIO,waitUntil:ctx?.waitUntil?.bind(ctx),waitForFresh:request.headers.get('x-weather-refresh')==='1',metrics});
      } catch(e) {return Response.json({error:e?.status?e.message:'Il servizio meteo non è disponibile. Riprova tra poco.',...(e?.code?{code:e.code}:{})},{status:e?.status||503,headers:{'cache-control':'no-store'}});}
    }
    if(url.pathname==='/redazione'||url.pathname==='/redazione/')return env.ASSETS.fetch(request);
    if(url.pathname.startsWith('/api/cms/v1/'))return handleCms(request,env);
    if(url.pathname==='/api/content/v1/snapshot')return handleContent(request,env);
    if (url.pathname.startsWith('/api/community/')) return handleCommunity(request, env);
    const m = url.pathname.match(/^\/api\/diario\/?(.*)$/);
    if (m) return handleDiario(request, env, m[1] ? m[1].split('/').filter(Boolean) : []);
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(cleanupCommunity(env)); ctx.waitUntil(cleanupWeatherMetrics(env.CMS_DB)); },
};
