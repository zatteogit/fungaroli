// Registro delle edizioni pubblicabili: il Worker sceglie con la variabile EDITION (wrangler.jsonc).
import fronda from '../editions/fronda.json';
import demoEsempio from '../editions/demo-esempio.json';
import { DEFAULT_EDITION, editionErrors, normalizeEnvironment } from '../js/edition-core.js';

export const EDITIONS = Object.freeze({ [fronda.id]: fronda, [demoEsempio.id]: demoEsempio });

export function currentEdition(env) {
  const edition = EDITIONS[env?.EDITION] || DEFAULT_EDITION;
  return { ...edition, environment: normalizeEnvironment(env?.ENVIRONMENT) };
}

export function handleEdition(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Metodo non consentito.', { status: 405 });
  const edition = currentEdition(env);
  if (editionErrors(edition).length) return Response.json(DEFAULT_EDITION, { headers: { 'cache-control': 'no-cache' } });
  return Response.json(edition, { headers: { 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' } });
}
