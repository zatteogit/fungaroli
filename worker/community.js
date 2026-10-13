import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import schema from '../migrations/0001_community.sql';
import { SPECIES } from '../js/species.js';
import zones from '../data/zones.json';

const SESSION = '__Host-fungaroli_session', CHALLENGE = '__Host-fungaroli_challenge';
const SESSION_SECONDS = 30 * 86400, MAX_BYTES = 250_000;
const speciesIds = new Set(SPECIES.map((s) => s.id)), zoneIds = new Set(zones.zones.map((z) => z.id));
const initialized = new WeakMap();
const enc = new TextEncoder();
const token = () => crypto.randomUUID() + crypto.randomUUID();
const hash = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), (b) => b.toString(16).padStart(2, '0')).join('');
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const cookie = (name, value, age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const readCookie = (req, name) => (req.headers.get('cookie') || '').split(';').map((x) => x.trim()).find((x) => x.startsWith(name + '='))?.slice(name.length + 1) || '';
const result = (data, status = 200, cookies = []) => {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  cookies.forEach((c) => headers.append('set-cookie', c));
  return new Response(JSON.stringify(data), { status, headers });
};
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };

async function init(db) {
  if (!initialized.has(db)) initialized.set(db, (async () => {
    // D1 exec treats individual lines as statements; use complete SQL statements.
    await db.batch(schema.split(';').map((s) => s.trim()).filter((s) => s && !s.startsWith('PRAGMA')).map((s) => db.prepare(s)));
    await db.prepare("INSERT INTO community_meta(key,value) VALUES('ip_salt',?) ON CONFLICT(key) DO NOTHING").bind(token()).run();
  })().catch((e) => { initialized.delete(db); throw e; }));
  return initialized.get(db);
}

async function body(req) {
  if (!req.headers.get('content-type')?.includes('application/json')) fail('Serve una richiesta JSON.', 415);
  const reader = req.body?.getReader();
  if (!reader) fail('Richiesta vuota.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel(); fail('Richiesta troppo grande.', 413); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const c of chunks) { buffer.set(c, offset); offset += c.length; }
  const text = new TextDecoder().decode(buffer);
  try { return JSON.parse(text); } catch { fail('Richiesta non valida.'); }
}

export function validDay(day, now = Date.now(), maxDays = 365) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(day + 'T12:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  return day <= today && (new Date(today + 'T12:00:00Z') - date) / 864e5 <= maxDays;
}

export function validateReport(data, now = Date.now()) {
  if (!data || !zoneIds.has(data.zoneId) || !speciesIds.has(data.speciesId) || !validDay(data.day, now)
      || !Number.isInteger(data.amount) || data.amount < 0 || data.amount > 3
      || (data.amount === 0 && data.searched !== true)) fail('Indica zona, specie, giorno e quantità. Uno zero richiede una ricerca esplicita.');
  return { ...data, searched: data.searched === true, identificationChecked: data.identificationChecked === true };
}

async function rate(db, key, limit, seconds, now) {
  const r = await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at < ? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at < ? THEN excluded.expires_at ELSE expires_at END RETURNING count')
    .bind(key, now + seconds * 1000, now, now).first();
  if (r.count > limit) fail('Troppe richieste. Riprova più tardi.', 429);
}

async function signedIn(req, db, now) {
  const raw = readCookie(req, SESSION);
  if (!raw) fail('Accedi con la tua passkey.', 401);
  const user = await db.prepare('SELECT a.id,a.handle,a.created_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?')
    .bind(await hash(raw), now).first();
  if (!user) fail('Sessione scaduta. Accedi di nuovo.', 401);
  return user;
}

async function newSession(db, id, now) {
  const raw = token();
  await db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await hash(raw), id, now + SESSION_SECONDS * 1000).run();
  return cookie(SESSION, raw, SESSION_SECONDS);
}

async function challenge(db, req, kind, origin, rpID, now, data) {
  const raw = readCookie(req, CHALLENGE);
  if (!raw) fail('Richiesta di accesso scaduta. Riprova.');
  // DELETE RETURNING consuma la sfida una sola volta, anche con richieste concorrenti.
  const saved = await db.prepare('DELETE FROM challenges WHERE token_hash=? AND expires_at>? RETURNING *').bind(await hash(raw), now).first();
  if (!saved || saved.kind !== kind || saved.origin !== origin || saved.rp_id !== rpID) fail('Richiesta di accesso non valida.');
  return saved;
}

export async function handleCommunity(request, env, now = Date.now()) {
  if (!env.COMMUNITY_DB) return result({ enabled: false, error: 'La community non è ancora attiva.' }, 503);
  const db = env.COMMUNITY_DB;
  const url = new URL(request.url), path = url.pathname.replace(/^\/api\/community\/?/, '');
  const expectedOrigin = env.APP_ORIGIN || url.origin, rpID = new URL(expectedOrigin).hostname;
  try {
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) fail('Metodo non consentito.', 405);
    if (request.method !== 'GET' && request.headers.get('origin') !== expectedOrigin) fail('Origine non autorizzata.', 403);
    await init(db);
    const salt = await db.prepare("SELECT value FROM community_meta WHERE key='ip_salt'").first('value');
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const ipKey = await hash(salt + new Date(now).toISOString().slice(0, 10) + ip);
    await rate(db, 'api:' + ipKey, 600, 3600, now);

    if (path === 'status' && request.method === 'GET') return result({ enabled: true, modelStatus: 'experimental', registration: 'passkey' });

    if (['auth/register-options', 'auth/login-options'].includes(path) && request.method === 'POST') {
      const register = path === 'auth/register-options';
      await rate(db, 'auth:' + ipKey, register ? 10 : 30, 3600, now);
      const data = await body(request);
      const id = crypto.randomUUID();
      const handle = typeof data.handle === 'string' ? data.handle.trim().slice(0, 32) : '';
      const name = handle || 'Fungarolo ' + id.slice(0, 4);
      const options = register
        ? await generateRegistrationOptions({ rpName: 'Fungaroli', rpID, userName: name, userID: enc.encode(id), attestationType: 'none',
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' } })
        : await generateAuthenticationOptions({ rpID, userVerification: 'required' });
      const raw = token();
      await db.prepare('INSERT INTO challenges(token_hash,kind,challenge,account_id,handle,origin,rp_id,expires_at) VALUES(?,?,?,?,?,?,?,?)')
        .bind(await hash(raw), register ? 'register' : 'login', options.challenge, register ? id : null, register ? name : null, expectedOrigin, rpID, now + 300000).run();
      return result(options, 200, [cookie(CHALLENGE, raw, 300)]);
    }

    if (['auth/register', 'auth/login'].includes(path) && request.method === 'POST') {
      await rate(db, 'verify:' + ipKey, 30, 3600, now);
      const data = await body(request), register = path === 'auth/register';
      const saved = await challenge(db, request, register ? 'register' : 'login', expectedOrigin, rpID, now);
      let id;
      if (register) {
        const v = await verifyRegistrationResponse({ response: data, expectedChallenge: saved.challenge, expectedOrigin, expectedRPID: rpID, requireUserVerification: true });
        if (!v.verified || !v.registrationInfo) fail('Passkey non verificata.');
        const c = v.registrationInfo.credential;
        id = saved.account_id;
        await db.batch([
          db.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').bind(id, saved.handle, now),
          db.prepare('INSERT INTO passkeys(id,account_id,public_key,counter,transports,backed_up,created_at) VALUES(?,?,?,?,?,?,?)')
            .bind(c.id, id, b64(c.publicKey), c.counter, JSON.stringify(c.transports || []), v.registrationInfo.credentialBackedUp ? 1 : 0, now),
        ]);
      } else {
        const key = await db.prepare('SELECT * FROM passkeys WHERE id=?').bind(typeof data.id === 'string' ? data.id : '').first();
        if (!key) fail('Passkey non riconosciuta.', 401);
        const v = await verifyAuthenticationResponse({ response: data, expectedChallenge: saved.challenge, expectedOrigin, expectedRPID: rpID,
          requireUserVerification: true, credential: { id: key.id, publicKey: bytes(key.public_key), counter: key.counter, transports: JSON.parse(key.transports) } });
        if (!v.verified) fail('Accesso non verificato.', 401);
        // Non sovrascrivere un contatore aggiornato da un accesso concorrente.
        const update = await db.prepare('UPDATE passkeys SET counter=? WHERE id=? AND counter=?').bind(v.authenticationInfo.newCounter, key.id, key.counter).run();
        if (!update.meta.changes) fail('Accesso concorrente: riprova.', 409);
        id = key.account_id;
      }
      return result({ ok: true }, 200, [await newSession(db, id, now), cookie(CHALLENGE, '', 0)]);
    }

    if (path === 'summary' && request.method === 'GET') {
      const since = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now - 6 * 864e5));
      const { results } = await db.prepare('SELECT r.zone_id AS zoneId,r.species_id AS speciesId,COUNT(*) AS reports,SUM(r.amount>0) AS sightings,SUM(r.amount=0) AS zeros,COUNT(DISTINCT r.account_id) AS contributors,COUNT(DISTINCT CASE WHEN a.created_at<? THEN r.account_id END) AS establishedContributors,COUNT(DISTINCT day) AS days,MAX(day) AS latestDay,SUM(amount=1) AS few,SUM(amount=2) AS some,SUM(amount=3) AS many FROM reports r JOIN accounts a ON a.id=r.account_id WHERE day>=? GROUP BY zone_id,species_id').bind(now - 864e5, since).all();
      const total = await db.prepare('SELECT COUNT(*) AS n FROM reports').first('n');
      return result({ reports: results, totalReports: total, windowDays: 7, validation: 'unvalidated', updatedAt: new Date(now).toISOString() });
    }

    const user = await signedIn(request, db, now);
    if (path === 'session' && request.method === 'GET') return result({ user: { id: user.id, handle: user.handle } });
    await rate(db, 'user:' + user.id, 120, 3600, now);

    if (path === 'auth/logout' && request.method === 'POST') {
      await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(readCookie(request, SESSION))).run();
      return result({ ok: true }, 200, [cookie(SESSION, '', 0)]);
    }
    if (path === 'account' && request.method === 'DELETE') {
      await db.prepare('DELETE FROM accounts WHERE id=?').bind(user.id).run();
      return result({ ok: true }, 200, [cookie(SESSION, '', 0)]);
    }

    if (path === 'entries' && request.method === 'GET') {
      const { results } = await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? ORDER BY saved_at DESC LIMIT 1000').bind(user.id).all();
      return result({ entries: results.map((r) => JSON.parse(r.payload)) });
    }
    const entryMatch = path.match(/^entries\/([a-zA-Z0-9-]{4,64})$/);
    if (entryMatch && request.method === 'PUT') {
      const entry = await body(request), id = entryMatch[1];
      if (entry.id !== id || !zoneIds.has(entry.zoneId) || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
          || (entry.note != null && (typeof entry.note !== 'string' || entry.note.length > 2000))) fail('Voce del diario non valida.');
      const date = new Date(entry.date + 'T12:00:00Z');
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== entry.date) fail('Giorno non valido.');
      if (entry.effort?.startedAt != null) {
        const started = Date.parse(entry.effort.startedAt);
        if (!Number.isFinite(started) || started > now) fail('L’inizio della ricerca deve essere un orario passato valido.');
      }
      for (const [k, max] of [['minutes', 1440], ['people', 100]]) {
        const v = entry.effort?.[k];
        if (v != null && (!Number.isInteger(v) || v < 1 || v > max)) fail('Durata o numero di cercatori non validi.');
      }
      const previous = await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, id).first('payload');
      // Le previsioni salvate sono immutabili e datate dal server; una reimportazione non le retrodata.
      if (previous && JSON.parse(previous).kind === 'plan') return result({ ok: true, entry: JSON.parse(previous) });
      if (!previous) {
        const count = await db.prepare('SELECT COUNT(*) AS n FROM diary_entries WHERE account_id=?').bind(user.id).first('n');
        if (count >= 1000) fail('Il diario ha raggiunto 1000 voci. Esporta e archivia le uscite prima di aggiungerne altre.', 409);
      }
      if (entry.kind === 'plan') {
        entry.forecast = { ...entry.forecast, mode: 'prospective', capturedAt: new Date(now).toISOString() };
        entry.savedAt = new Date(now).toISOString();
      } else if (entry.forecast?.mode === 'prospective') {
        const plan = typeof entry.forecast.planId === 'string' ? await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, entry.forecast.planId).first('payload') : null;
        const p = plan ? JSON.parse(plan) : null;
        if (p?.kind === 'plan' && p.zoneId === entry.zoneId && p.date === entry.date && Date.parse(p.forecast.capturedAt) < Date.parse(entry.effort?.startedAt)) {
          entry.forecast = { ...p.forecast, planId: p.id };
          entry.predicted = entry.band == null ? p.forecast.scores : p.forecast.scoresByBand?.[entry.band] || {};
        } else entry.forecast = { mode: 'retrospective', capturedAt: new Date(now).toISOString() };
      }
      const writes = [db.prepare('INSERT INTO diary_entries(account_id,id,payload,saved_at) VALUES(?,?,?,?) ON CONFLICT(account_id,id) DO UPDATE SET payload=excluded.payload,saved_at=excluded.saved_at')
        .bind(user.id, id, JSON.stringify(entry), now)];
      if (previous) {
        const old = JSON.parse(previous);
        if (old.zoneId !== entry.zoneId || old.date !== entry.date || JSON.stringify(old.finds) !== JSON.stringify(entry.finds) || JSON.stringify(old.searched) !== JSON.stringify(entry.searched))
          writes.push(db.prepare('DELETE FROM reports WHERE account_id=? AND entry_id=?').bind(user.id, id));
      }
      await db.batch(writes);
      return result({ ok: true, entry });
    }
    if (entryMatch && request.method === 'DELETE') {
      await db.prepare('DELETE FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, entryMatch[1]).run();
      return result({ ok: true });
    }

    if (path === 'reports' && request.method === 'POST') {
      await rate(db, 'reports:' + user.id, 30, 86400, now);
      const data = validateReport(await body(request), now);
      const entryId = typeof data.entryId === 'string' && /^[a-zA-Z0-9-]{4,64}$/.test(data.entryId) ? data.entryId : crypto.randomUUID();
      let entry = await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, entryId).first('payload');
      if (data.entryId && !entry) fail('Questa uscita non appartiene al tuo diario.', 404);
      if (!entry) {
        const count = await db.prepare('SELECT COUNT(*) AS n FROM diary_entries WHERE account_id=?').bind(user.id).first('n');
        if (count >= 1000) fail('Il diario ha raggiunto 1000 voci. Esporta e archivia le uscite prima di aggiungerne altre.', 409);
        entry = JSON.stringify({ id: entryId, kind: 'outing', date: data.day, zoneId: data.zoneId, band: null,
        finds: { [data.speciesId]: data.amount }, searched: data.searched ? [data.speciesId] : [],
        note: '', predicted: {}, forecast: { mode: 'none' }, savedAt: new Date(now).toISOString() });
      }
      const e = JSON.parse(entry);
      if (e.zoneId !== data.zoneId || e.date !== data.day || (e.finds?.[data.speciesId] ?? null) !== data.amount || e.kind === 'plan'
          || (data.amount === 0 && !e.searched?.includes(data.speciesId))) fail('La segnalazione non corrisponde all’uscita.');
      await db.batch([
        db.prepare('INSERT INTO diary_entries(account_id,id,payload,saved_at) VALUES(?,?,?,?) ON CONFLICT(account_id,id) DO NOTHING').bind(user.id, entryId, entry, now),
        db.prepare('INSERT INTO reports(id,account_id,entry_id,day,zone_id,species_id,amount,searched,identification_checked,validation_context,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id,day,zone_id,species_id) DO UPDATE SET entry_id=excluded.entry_id,amount=excluded.amount,searched=excluded.searched,identification_checked=excluded.identification_checked,validation_context=excluded.validation_context,created_at=excluded.created_at')
          .bind(crypto.randomUUID(), user.id, entryId, data.day, data.zoneId, data.speciesId, data.amount, data.searched ? 1 : 0, data.identificationChecked ? 1 : 0,
            JSON.stringify({ predicted: e.predicted?.[data.speciesId] ?? null, modelVersion: e.forecast?.modelVersion || null,
              mode: e.forecast?.mode || 'none', capturedAt: e.forecast?.capturedAt || null, effort: e.effort || null }), now),
      ]);
      return result({ ok: true, entryId });
    }
    if (path === 'reports' && request.method === 'GET') {
      const { results } = await db.prepare('SELECT id,entry_id AS entryId,day,zone_id AS zoneId,species_id AS speciesId,amount FROM reports WHERE account_id=? ORDER BY created_at DESC LIMIT 500').bind(user.id).all();
      return result({ reports: results });
    }
    if (path === 'reports' && request.method === 'DELETE') {
      const data = await body(request);
      if (typeof data.entryId !== 'string') fail('Segnalazione non valida.');
      await db.prepare('DELETE FROM reports WHERE account_id=? AND entry_id=?').bind(user.id, data.entryId).run();
      return result({ ok: true });
    }
    fail('Percorso non trovato.', 404);
  } catch (e) {
    // Nessun dettaglio di chiavi, cookie o query negli errori pubblici.
    return result({ error: e.status ? e.message : 'Servizio temporaneamente non disponibile. Riprova.' }, e.status || 503);
  }
}

export async function cleanupCommunity(env, now = Date.now()) {
  if (!env.COMMUNITY_DB) return;
  await init(env.COMMUNITY_DB);
  await env.COMMUNITY_DB.batch(['sessions', 'challenges', 'rate_limits'].map((t) => env.COMMUNITY_DB.prepare(`DELETE FROM ${t} WHERE expires_at<?`).bind(now)));
}
