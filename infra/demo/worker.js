import { normalizeFieldRecord, FIELD_NOTE_V2, EDITIONS, resolveModules } from '../../js/core/index.js';

const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
/** Dedicated synthetic demo: no app Worker, account system, provider or persistence. */
export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (!['GET', 'HEAD'].includes(request.method)) {
      return Response.json({ error: 'La demo è in sola lettura.' }, { status: 405, headers: { ...headers, allow: 'GET, HEAD' } });
    }
    let response;
    if (pathname === '/api/demo/v1/foundation') {
      response = Response.json({
        environment: 'demo', synthetic: true,
        editions: Object.fromEntries(Object.entries(EDITIONS).map(([name, modules]) => [name, resolveModules(modules)])),
        observation: normalizeFieldRecord({
          protocolVersion: FIELD_NOTE_V2, presence: 'searched_absent', amount: 0,
          effortClass: '30-60', completed: true, stopReason: 'planned_time', habitat: 'unknown',
        }, 'fungo'),
      });
    } else if (pathname.startsWith('/api/') || pathname.startsWith('/redazione')) {
      response = Response.json({ error: 'Servizio assente nella demo della base comune.' }, { status: 404 });
    } else response = await env.ASSETS.fetch(request);
    const result = new Response(request.method === 'HEAD' ? null : response.body, response);
    for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
    return result;
  },
};
