const environments = new Set(['local', 'test', 'staging']);
/** Entry point used only by the generated isolated configurations. */
export function createEnvironmentBoundary(application) {
  return {
  async fetch(request, env, ctx) {
    if (!environments.has(env.FRONDA_ENVIRONMENT)) {
      return Response.json({ error: 'Ambiente non configurato.' }, { status: 503 });
    }
    const url = new URL(request.url);
    if (url.pathname === '/_fronda/health') {
      return Response.json({ environment: env.FRONDA_ENVIRONMENT, scheduledJobs: false }, { headers: { 'cache-control': 'no-store' } });
    }
    const response = await application.fetch(request, env, ctx);
    const result = new Response(response.body, response);
    result.headers.set('x-fronda-environment', env.FRONDA_ENVIRONMENT);
    result.headers.set('x-robots-tag', 'noindex, nofollow');
    return result;
  },
  // Explicitly disabled: scheduling needs a separate, documented staging exercise.
  async scheduled() {},
  };
}
