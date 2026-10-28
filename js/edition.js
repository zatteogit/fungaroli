// Applica l'edizione servita dal Worker (/edition.json) alla testata dell'app.
import { DEFAULT_EDITION, editionErrors, normalizeEnvironment } from './edition-core.js';
export { editionZones } from './edition-core.js';

const ENV_LABEL = { local: 'locale', staging: 'staging' };

export async function loadEdition({ fetcher = fetch } = {}) {
  try {
    const r = await fetcher('edition.json', { signal: AbortSignal.timeout(4000) });
    const e = r.ok ? await r.json() : null;
    if (e && !editionErrors(e).length) return { ...e, environment: normalizeEnvironment(e.environment) };
  } catch { /* file statici o rete assente: edizione generalista */ }
  return DEFAULT_EDITION;
}

// Fuori dalla produzione l'ambiente precede l'etichetta, così una prova non si confonde con l'app pubblica.
export function applyEdition(edition, doc = document) {
  const env = ENV_LABEL[edition.environment];
  doc.documentElement.dataset.edition = edition.id;
  if (env) doc.documentElement.dataset.environment = edition.environment;
  else delete doc.documentElement.dataset.environment;
  const place = doc.querySelector('.brand-place');
  if (!place) return;
  const pre = env ? `${env} · ${edition.place.pre}` : edition.place.pre;
  const pieces = [doc.createElement('span'), doc.createTextNode(edition.place.label), doc.createElement('span')];
  pieces[0].className = 'bp-pre'; pieces[0].textContent = `${pre} · `;
  pieces[2].className = 'sr-only'; pieces[2].textContent = `: ${edition.place.srText}${env ? `, ambiente ${env}` : ''}`;
  place.replaceChildren(...pieces);
  place.title = edition.demo ? `${edition.place.title}. Preparata per ${edition.demo.partner}.` : edition.place.title;
}
