// Cloudflare Pages Function: sincronizzazione del diario delle uscite.
//
// Configurazione (Cloudflare dashboard -> Pages -> progetto -> Settings):
// - Bindings: KV namespace con nome variabile DIARIO
// - Variables and secrets: DIARIO_TOKEN = il "codice diario" (segreto, almeno 12 caratteri)
//
// API (header Authorization: Bearer <codice>):
//   GET    /api/diario          -> { entries: [...] }
//   PUT    /api/diario/<id>     -> salva o aggiorna un'uscita (corpo JSON)
//   DELETE /api/diario/<id>     -> elimina un'uscita

const MAX_BYTES = 20_000;
const ID_RE = /^[a-z0-9]{4,32}$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// confronto a tempo costante per non rivelare il codice con misure di tempo
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function validEntry(e, id) {
  return e && typeof e === 'object' && e.id === id
    && /^\d{4}-\d{2}-\d{2}$/.test(e.date || '')
    && typeof e.zoneId === 'string' && e.zoneId.length <= 40
    && (e.finds == null || typeof e.finds === 'object')
    && (e.note == null || (typeof e.note === 'string' && e.note.length <= 2000));
}

export async function onRequest({ request, env, params }) {
  if (!env.DIARIO || !env.DIARIO_TOKEN) return json({ error: 'not_configured' }, 503);
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!sameSecret(token, env.DIARIO_TOKEN)) return json({ error: 'unauthorized' }, 401);

  const path = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const id = path[0];

  if (request.method === 'GET' && !id) {
    const entries = [];
    let cursor;
    do {
      const page = await env.DIARIO.list({ prefix: 'entry:', cursor });
      const vals = await Promise.all(page.keys.map((k) => env.DIARIO.get(k.name, 'json')));
      entries.push(...vals.filter(Boolean));
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor);
    return json({ entries });
  }

  if (!id || !ID_RE.test(id)) return json({ error: 'bad_id' }, 400);

  if (request.method === 'PUT') {
    const body = await request.text();
    if (body.length > MAX_BYTES) return json({ error: 'too_large' }, 413);
    let entry;
    try { entry = JSON.parse(body); } catch { return json({ error: 'bad_json' }, 400); }
    if (!validEntry(entry, id)) return json({ error: 'bad_entry' }, 400);
    await env.DIARIO.put(`entry:${id}`, JSON.stringify(entry));
    return json({ ok: true });
  }

  if (request.method === 'DELETE') {
    await env.DIARIO.delete(`entry:${id}`);
    return json({ ok: true });
  }

  return json({ error: 'method_not_allowed' }, 405);
}
