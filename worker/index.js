// Worker di Fungaroli Rieti: i file statici sono serviti da Workers Assets (wrangler.jsonc);
// qui arrivano solo le richieste che non corrispondono a un file, cioe' l'API del diario.
import { handleDiario } from '../functions/api/diario/[[path]].js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/diario\/?(.*)$/);
    if (m) return handleDiario(request, env, m[1] ? m[1].split('/').filter(Boolean) : []);
    return env.ASSETS.fetch(request);
  },
};
