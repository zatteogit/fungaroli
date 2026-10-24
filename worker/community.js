import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import schema from '../migrations/0001_community.sql';
import legalAcceptancesSchema from '../migrations/0009_legal_acceptances.sql';
import preferencesSchema from '../migrations/0003_account_preferences.sql';
import observationsSchema from '../migrations/0007_shared_observations.sql';
import animalObservationsSchema from '../migrations/0013_animal_observations.sql';
import basePrecisionSchema from '../migrations/0014_base_precision.sql';
import researchConsentSchema from '../migrations/0015_research_consent.sql';
import {RESEARCH_CONSENT_VERSION,researchState} from '../js/research-consent.js';
import animalCatalog from '../data/animals.json';
import {rankingPolicy} from './admin-dashboard.js';
import {initExternalObservations} from './external-observations.js';
import {sharedObservation} from '../js/community-observation.js';
import treeCatalog from '../data/trees.json';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {normalizeNotebookPhoto} from '../js/notebook-photo.js';
import plantCatalog from '../data/plants.json';
import {normalizeBase,validPoint} from '../js/travel-model.js';
import {searchPlaces} from './travel-provider.js';
import {cachedRoutes} from './travel-cache.js';
import { buildEdibleCatalog } from '../js/edible-catalog.js';
import traits from '../data/species-traits.json';
import edibleCatalog from '../data/edible-catalog.json';
import zones from '../data/zones.json';
import { publishedResources } from './cms.js';
import { provinceGroups } from '../js/community-aggregate.js';

const SESSION = '__Host-fungaroli_session', CHALLENGE = '__Host-fungaroli_challenge';
const SESSION_SECONDS = 30 * 86400, MAX_BYTES = 250_000;
const speciesIds = new Set(buildEdibleCatalog(traits, edibleCatalog).map((s) => s.id)), zoneIds = new Set(zones.zones.map((z) => z.id));
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
    await db.batch((schema+';'+preferencesSchema+';'+observationsSchema+';'+legalAcceptancesSchema+';'+basePrecisionSchema+';'+researchConsentSchema).split(';').map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter((s) => s && !s.startsWith('PRAGMA')).map((s) => db.prepare(s)));
    const observationTable=await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='shared_observations'").first('sql');
    if(!observationTable?.includes("'animale'"))await db.batch(animalObservationsSchema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
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

// Campi di un'uscita che finiscono nella segnalazione condivisa: se cambiano, la segnalazione va ritirata.
// Lo sforzo (minuti, cercatori, inizio) è nel contesto della segnalazione come gli altri campi.
const effortOf = (e) => ({ minutes: e?.effort?.minutes ?? null, people: e?.effort?.people ?? null, startedAt: e?.effort?.startedAt ?? null });
export function sharedFieldsChanged(old, entry) {
  return old.zoneId !== entry.zoneId || old.date !== entry.date || JSON.stringify(old.finds) !== JSON.stringify(entry.finds)
    || JSON.stringify(old.searched) !== JSON.stringify(entry.searched) || JSON.stringify(effortOf(old)) !== JSON.stringify(effortOf(entry));
}

export function validateReport(data, now = Date.now(), ids = {speciesIds,zoneIds}) {
  if (!data || !ids.zoneIds.has(data.zoneId) || !ids.speciesIds.has(data.speciesId) || !validDay(data.day, now)
      || !Number.isInteger(data.amount) || data.amount < 0 || data.amount > 3
      || (data.amount === 0 && data.searched !== true)) fail('Indica zona, specie, giorno e quantità. Uno zero richiede una ricerca esplicita.');
  return { ...data, searched: data.searched === true, identificationChecked: data.identificationChecked === true };
}

export async function readCommunityUser(request,env,now=Date.now()) {
  if(!env.COMMUNITY_DB) return null;
  await init(env.COMMUNITY_DB);
  try{return await signedIn(request,env.COMMUNITY_DB,now);}catch(e){if(e.status===401)return null;throw e;}
}
async function currentCatalogIds(env,origin) {
  const content=await publishedResources(env,origin,['species-traits','edible-catalog','zones','plants','trees','animals']);
  const references=new Set([...(content?.animals?.items||animalCatalog.items).filter(a=>a.publicationStatus==='ready').map(a=>'#/animale/'+a.id),...Object.keys(content?.['species-traits']?.taxa||traits.taxa).map(id=>'#/fungo/'+id),...buildEdibleCatalog(content?.['species-traits']||traits,content?.['edible-catalog']||edibleCatalog).flatMap(s=>['#/specie/'+s.id,'#/commestibile/'+s.id]),...Object.keys(content?.plants?.plants||plantCatalog.plants).map(id=>'#/pianta/'+id),...Object.keys(content?.trees?.trees||treeCatalog.trees).map(id=>'#/albero/'+id)]);
  if(!content)return {speciesIds,zoneIds,plantIds:new Set(Object.keys(plantCatalog.plants)),references};
  return {references,plantIds:new Set(Object.keys(content.plants?.plants||plantCatalog.plants)),speciesIds:new Set(buildEdibleCatalog(content['species-traits'],content['edible-catalog']).map(s=>s.id)),zoneIds:new Set(content.zones.zones.map(z=>z.id))};
}

async function rate(db, key, limit, seconds, now) {
  const r = await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at < ? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at < ? THEN excluded.expires_at ELSE expires_at END RETURNING count')
    .bind(key, now + seconds * 1000, now, now).first();
  if (r.count > limit) fail('Troppe richieste. Riprova più tardi.', 429);
}

async function signedIn(req, db, now) {
  const raw = readCookie(req, SESSION);
  if (!raw) fail('Accedi con la tua passkey.', 401);
  const user = await db.prepare('SELECT a.id,a.handle,a.created_at,p.base FROM sessions s JOIN accounts a ON a.id=s.account_id LEFT JOIN account_preferences p ON p.account_id=a.id WHERE s.token_hash=? AND s.expires_at>?')
    .bind(await hash(raw), now).first();
  if (!user) fail('Sessione scaduta. Accedi di nuovo.', 401);
  // Arrotondata anche in lettura (migrazione 0014): nessuna risposta espone una base più precisa di circa 1 km.
  try{user.base=user.base?normalizeBase(JSON.parse(user.base)):null;}catch{user.base=null;}
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

    if (path === 'status' && request.method === 'GET') {
      const externalImport=await initExternalObservations(db);
      return result({ enabled: true, modelStatus: 'experimental', registration: 'passkey',externalImport });
    }

    if (['auth/register-options', 'auth/login-options'].includes(path) && request.method === 'POST') {
      const register = path === 'auth/register-options';
      await rate(db, 'auth:' + ipKey, register ? 10 : 30, 3600, now);
      const data = await body(request);
      const id = crypto.randomUUID();
      const handle = typeof data.handle === 'string' ? data.handle.trim().slice(0, 32) : '';
      const name = handle || 'Fungarolo ' + id.slice(0, 4);
      const options = register
        ? await generateRegistrationOptions({ rpName: 'Fronda', rpID, userName: name, userID: enc.encode(id), attestationType: 'none',
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

    const user = await signedIn(request, db, now);
    if (path === 'summary' && request.method === 'GET') {
      // Reciprocity is enforced here, before reading any collective data.
      // A withdrawn contribution no longer grants access; a negative report does.
      const contributes = await db.prepare('SELECT EXISTS(SELECT 1 FROM reports WHERE account_id=?) OR EXISTS(SELECT 1 FROM shared_observations WHERE account_id=?) AS active').bind(user.id,user.id).first('active');
      const base = {windowDays:7,validation:'unvalidated',updatedAt:new Date(now).toISOString()};
      if (!contributes) return result({...base,access:'contribution_required',reports:[],observations:[],totalReports:0});
      const since = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now - 6 * 864e5));
      // Guardia di pubblicazione: 3 contributori distinti e 2 giorni diversi. Dal 22/10/2026 (decisione di Matteo)
      // contano solo i profili attivi da almeno 24 ore: le righe dei profili più recenti restano fuori dagli aggregati,
      // per zona e per provincia. È soppressione dei piccoli gruppi, non una validazione né una garanzia di anonimato.
      // In uscita solo zone del catalogo e totali della finestra: niente persone, note, giorni o GPS. Il numero di
      // contributori serve solo a communityMultiplier ed è troncato a 10, oltre cui il suo peso non cresce.
      const established = now - 864e5;
      const { results } = await db.prepare('SELECT r.zone_id AS zoneId,r.species_id AS speciesId,COUNT(*) AS reports,SUM(r.amount>0) AS sightings,SUM(r.amount=0) AS zeros,MIN(COUNT(DISTINCT r.account_id),10) AS establishedContributors FROM reports r JOIN accounts a ON a.id=r.account_id WHERE r.day>=? AND a.created_at<=? GROUP BY r.zone_id,r.species_id HAVING COUNT(DISTINCT r.account_id)>=3 AND COUNT(DISTINCT r.day)>=2').bind(since, established).all();
      const {results:observations}=await db.prepare("SELECT o.zone_id AS zoneId,o.category AS category,o.taxon_id AS taxonId,COUNT(*) AS observations,SUM(json_extract(o.payload,'$.presence')='observed') AS sightings,SUM(json_extract(o.payload,'$.presence')='searched_absent') AS zeros FROM shared_observations o JOIN accounts a ON a.id=o.account_id WHERE o.day>=? AND a.created_at<=? GROUP BY o.zone_id,o.category,o.taxon_id HAVING COUNT(DISTINCT o.account_id)>=3 AND COUNT(DISTINCT o.day)>=2").bind(since, established).all();
      // Aggregato più largo per provincia (decisione del 22/10): stessa guardia, solo dove la parte non già
      // pubblicata per zona la supera anch'essa (js/community-aggregate.js). Righe per account lette qui e mai restituite.
      const content=await publishedResources(env,url.origin,['zones']).catch(()=>null);
      const zoneList=content?.zones?.zones||zones.zones;
      const {results:reportRows}=await db.prepare('SELECT r.zone_id AS zoneId,r.species_id AS speciesId,r.account_id AS accountId,r.day AS day,CASE WHEN r.amount>0 THEN \'sighting\' ELSE \'zero\' END AS outcome FROM reports r JOIN accounts a ON a.id=r.account_id WHERE r.day>=? AND a.created_at<=?').bind(since, established).all();
      const {results:observationRows}=await db.prepare("SELECT o.zone_id AS zoneId,o.category AS category,o.taxon_id AS taxonId,o.account_id AS accountId,o.day AS day,CASE json_extract(o.payload,'$.presence') WHEN 'observed' THEN 'sighting' WHEN 'searched_absent' THEN 'zero' ELSE 'other' END AS outcome FROM shared_observations o JOIN accounts a ON a.id=o.account_id WHERE o.day>=? AND a.created_at<=?").bind(since, established).all();
      const provinceReports=provinceGroups(reportRows,{zones:zoneList,keyOf:r=>r.speciesId,fields:r=>({speciesId:r.speciesId}),published:new Set(results.map(r=>`${r.zoneId}|${r.speciesId}`))});
      const provinceObservations=provinceGroups(observationRows,{zones:zoneList,keyOf:r=>`${r.category}|${r.taxonId}`,fields:r=>({category:r.category,taxonId:r.taxonId}),published:new Set(observations.map(r=>`${r.zoneId}|${r.category}|${r.taxonId}`))});
      const policy=await rankingPolicy(db);
      return result({...base,access:'granted',policy:{maxPercent:policy.maxPercent,version:policy.version},observations,reports:results,totalReports:results.reduce((n,r)=>n+r.reports,0),provinceReports,provinceObservations});
    }

    if (path === 'session' && request.method === 'GET') {
      const assigned=key=>(env[key]||'').split(',').map(s=>s.trim()).filter(Boolean).includes(user.id);
      const role=assigned('CMS_ADMIN_IDS')?'admin':assigned('CMS_EDITOR_IDS')?'editor':'member';
      return result({ user: { id:user.id, handle:user.handle, base:user.base, role, research:await researchConsent(db,user.id) } });
    }
    await rate(db, 'user:' + user.id, 120, 3600, now);
    if(path==='legal-acceptance'&&request.method==='POST') {
      const data=await body(request);
      if(data.accountId!==user.id)fail('Il profilo è cambiato. Riprova.',409);
      if(typeof data.version!=='string'||!/^(?:cgs-[1-9]\d{0,5}|\d{1,6}\d{4}-\d{2}-\d{2})$/.test(data.version)||typeof data.noticeHash!=='string'||!/^([a-f0-9]{64})$/.test(data.noticeHash)||!['explicit','legacy'].includes(data.source)||!['browser','standalone'].includes(data.platform)||(data.source==='explicit'&&(typeof data.acceptedAt!=='string'||data.acceptedAt.length>32||!Number.isFinite(Date.parse(data.acceptedAt))||new Date(data.acceptedAt).toISOString()!==data.acceptedAt))||(data.source==='legacy'&&data.acceptedAt!==null))fail('Conferma non valida.',422);
      await db.prepare('INSERT INTO legal_acceptances(account_id,version,notice_hash,accepted_at,recorded_at,source,platform) VALUES(?,?,?,?,?,?,?) ON CONFLICT(account_id,version,notice_hash) DO NOTHING').bind(user.id,data.version,data.noticeHash,data.acceptedAt,now,data.source,data.platform).run();
      const receipt=await db.prepare('SELECT version,notice_hash AS noticeHash,accepted_at AS acceptedAt,recorded_at AS recordedAt,source,platform FROM legal_acceptances WHERE account_id=? AND version=? AND notice_hash=?').bind(user.id,data.version,data.noticeHash).first();
      return result({receipt});
    }
    if(path==='profile'&&request.method==='PUT') {
      const data=await body(request);
      if(data.accountId!==user.id)fail('Il profilo è cambiato. Riaprilo prima di salvare.',409);
      let base;try{base=normalizeBase(data.base);}catch(e){fail(e.message,422);}
      if(base===null)await db.prepare('DELETE FROM account_preferences WHERE account_id=?').bind(user.id).run();
      else await db.prepare('INSERT INTO account_preferences(account_id,base,updated_at) VALUES(?,?,?) ON CONFLICT(account_id) DO UPDATE SET base=excluded.base,updated_at=excluded.updated_at').bind(user.id,JSON.stringify(base),now).run();
      return result({base});
    }
    if(path==='research-consent'&&request.method==='PUT') {
      const data=await body(request);
      if(data.accountId!==user.id)fail('Il profilo è cambiato. Riaprilo prima di salvare.',409);
      if(typeof data.granted!=='boolean'||data.version!==RESEARCH_CONSENT_VERSION)fail('Scelta non valida. Ricarica la pagina e riprova.',422);
      const current=await researchConsent(db,user.id);
      // Una riga per ogni cambiamento reale: ripetere la stessa scelta non riscrive la data.
      if(current.granted!==data.granted||data.granted&&current.version!==data.version)await db.prepare('INSERT INTO research_consents(account_id,version,granted,recorded_at) VALUES(?,?,?,?)').bind(user.id,data.version,data.granted?1:0,now).run();
      return result({research:await researchConsent(db,user.id)});
    }
    if(path==='places'&&request.method==='GET'){
      const q=url.searchParams.get('q');if(!q||q.trim().length<2||q.length>120)fail('Scrivi da 2 a 120 caratteri per cercare una località.',422);
      return result({places:await searchPlaces(q)});
    }
    if(path==='travel'&&request.method==='POST') {
      const data=await body(request);
      // The origin always comes from this account, never from a body supplied by another tab.
      if(!user.base)fail('Imposta prima la tua base nel profilo.',422);
      if(!Array.isArray(data.targets)||!data.targets.length||data.targets.length>50||data.targets.some(p=>!validPoint(p)))fail('Punti del percorso non validi.',422);
      await rate(db,'travel:'+user.id,60,3600,now);
      const routes=await cachedRoutes({base:user.base,targets:data.targets,owner:user.id,origin:url.origin,cache:globalThis.caches?.default,hash});
      const out={base:user.base,routes,source:'OSRM / OpenStreetMap',traffic:false};
      return result(out);
    }

    if (path === 'auth/logout' && request.method === 'POST') {
      await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(readCookie(request, SESSION))).run();
      return result({ ok: true }, 200, [cookie(SESSION, '', 0)]);
    }
    if (path === 'account' && request.method === 'DELETE') {
      // Cancellazioni esplicite per tabella, dai dati che dipendono dalle voci fino al profilo: non si affidano
      // soltanto a ON DELETE CASCADE. Anche i contatori legati all'ID del profilo spariscono subito.
      await db.batch([
        ...['shared_observations', 'reports', 'research_consents', 'legal_acceptances', 'account_preferences', 'diary_entries', 'sessions', 'passkeys', 'challenges']
          .map((t) => db.prepare(`DELETE FROM ${t} WHERE account_id=?`).bind(user.id)),
        db.prepare(`DELETE FROM rate_limits WHERE key IN (${ACCOUNT_RATE_KEYS.map(() => '?').join(',')})`).bind(...ACCOUNT_RATE_KEYS.map((k) => k + user.id)),
        db.prepare('DELETE FROM accounts WHERE id=?').bind(user.id),
      ]);
      return result({ ok: true }, 200, [cookie(SESSION, '', 0)]);
    }
    if (path === 'export' && request.method === 'GET') {
      await rate(db, 'export:' + user.id, EXPORT_PER_DAY, 86400, now);
      return accountExport(db, user, now);
    }

    if (path === 'entries' && request.method === 'GET') {
      // shared: l'uscita ha segnalazioni attive nei conteggi della community (calcolato, mai salvato nella voce)
      const { results } = await db.prepare('SELECT d.payload, (EXISTS(SELECT 1 FROM reports r WHERE r.account_id=d.account_id AND r.entry_id=d.id) OR EXISTS(SELECT 1 FROM shared_observations o WHERE o.account_id=d.account_id AND o.entry_id=d.id)) AS shared FROM diary_entries d WHERE d.account_id=? ORDER BY d.saved_at DESC LIMIT 1000').bind(user.id).all();
      return result({ entries: results.map((r) => ({ ...JSON.parse(r.payload), shared: !!r.shared })) });
    }
    const entryMatch = path.match(/^entries\/([a-zA-Z0-9-]{4,64})$/);
    if (entryMatch && request.method === 'PUT') {
      let entry = await body(request); const id = entryMatch[1];
      if (entry && typeof entry === 'object') delete entry.shared;
      const liveIds=await currentCatalogIds(env,url.origin);
      if(entry.kind==='note'){try{entry=normalizeNotebookNote(entry,liveIds);}catch(e){fail(e.message);}}
      // Le foto passano sempre dalla stessa validazione, che toglie i metadati EXIF/XMP anche dalle chiamate dirette.
      else if(entry?.photo!=null){try{entry.photo=normalizeNotebookPhoto(entry.photo);}catch(e){fail(e.message);}}
      if(entry.kind!=null&&!['outing','plan','note'].includes(entry.kind))fail('Tipo di voce non valido.');
      if (entry.id !== id || (entry.kind==='note'?entry.zoneId!=null&&!liveIds.zoneIds.has(entry.zoneId):!liveIds.zoneIds.has(entry.zoneId)) || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
          || (entry.note != null && (typeof entry.note !== 'string' || entry.note.length > 2000))) fail('Voce del taccuino non valida.');
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
        if (count >= 1000) fail('Il taccuino ha raggiunto 1000 voci. Scarica i tuoi dati dal profilo ed elimina le voci che non ti servono prima di aggiungerne altre.', 409);
      }
      if(entry.kind==='note')entry.savedAt=new Date(now).toISOString();
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
      if(previous)writes.push(db.prepare('DELETE FROM shared_observations WHERE account_id=? AND entry_id=?').bind(user.id,id));
      // Una segnalazione condivisa porta con sé zona, giorno, ritrovamenti, specie cercate e sforzo dell'uscita
      // (validation_context.effort). Se uno di questi cambia, la segnalazione si ritira: la community non conta
      // dati che l'uscita non dice più. L'utente può condividerla di nuovo.
      if (previous && sharedFieldsChanged(JSON.parse(previous), entry))
        writes.push(db.prepare('DELETE FROM reports WHERE account_id=? AND entry_id=?').bind(user.id, id));
      await db.batch(writes);
      const shared = !!(await db.prepare('SELECT 1 AS x FROM reports WHERE account_id=? AND entry_id=? UNION ALL SELECT 1 AS x FROM shared_observations WHERE account_id=? AND entry_id=? LIMIT 1').bind(user.id,id,user.id,id).first('x'));
      return result({ ok: true, entry: { ...entry, shared } });
    }
    if (entryMatch && request.method === 'DELETE') {
      await db.prepare('DELETE FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, entryMatch[1]).run();
      return result({ ok: true });
    }

    const observationMatch=path.match(/^observations\/([a-zA-Z0-9-]{4,64})$/);
    if(observationMatch&&['PUT','DELETE'].includes(request.method)){
      const id=observationMatch[1],raw=await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? AND id=?').bind(user.id,id).first('payload');
      if(!raw)fail('Questa nota non appartiene al tuo taccuino.',404);
      if(request.method==='DELETE'){await db.prepare('DELETE FROM shared_observations WHERE account_id=? AND entry_id=?').bind(user.id,id).run();return result({ok:true});}
      const data=await body(request);if(data.consent!==true)fail('Serve il consenso esplicito alla condivisione.');
      await rate(db,'observations:'+user.id,30,86400,now);
      const ids=await currentCatalogIds(env,url.origin);let snapshot;
      try{snapshot=sharedObservation(normalizeNotebookNote(JSON.parse(raw),ids),{...ids,now});}catch(error){fail(error.message);}
      await db.prepare('INSERT INTO shared_observations(account_id,entry_id,day,zone_id,category,taxon_id,payload,consent_version,consented_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id,entry_id) DO UPDATE SET day=excluded.day,zone_id=excluded.zone_id,category=excluded.category,taxon_id=excluded.taxon_id,payload=excluded.payload,consent_version=excluded.consent_version,consented_at=excluded.consented_at').bind(user.id,id,snapshot.day,snapshot.zoneId,snapshot.category,snapshot.taxonId,JSON.stringify(snapshot),'fronda-community-v1',now).run();
      return result({ok:true});
    }

    if (path === 'reports' && request.method === 'POST') {
      await rate(db, 'reports:' + user.id, 30, 86400, now);
      const data = validateReport(await body(request), now,await currentCatalogIds(env,url.origin));
      const entryId = typeof data.entryId === 'string' && /^[a-zA-Z0-9-]{4,64}$/.test(data.entryId) ? data.entryId : crypto.randomUUID();
      let entry = await db.prepare('SELECT payload FROM diary_entries WHERE account_id=? AND id=?').bind(user.id, entryId).first('payload');
      if (data.entryId && !entry) fail('Questa uscita non appartiene al tuo taccuino.', 404);
      if (!entry) {
        const count = await db.prepare('SELECT COUNT(*) AS n FROM diary_entries WHERE account_id=?').bind(user.id).first('n');
        if (count >= 1000) fail('Il taccuino ha raggiunto 1000 voci. Scarica i tuoi dati dal profilo ed elimina le voci che non ti servono prima di aggiungerne altre.', 409);
        entry = JSON.stringify({ id: entryId, kind: 'outing', date: data.day, zoneId: data.zoneId, band: null,
        finds: { [data.speciesId]: data.amount }, searched: data.searched ? [data.speciesId] : [],
        note: '', predicted: {}, forecast: { mode: 'none' }, savedAt: new Date(now).toISOString() });
      }
      const e = JSON.parse(entry);
      if (e.zoneId !== data.zoneId || e.date !== data.day || (e.finds?.[data.speciesId] ?? null) !== data.amount || ['plan','note'].includes(e.kind)
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

// Copia dei propri dati (art. 15 e 20 GDPR, decisione di Matteo del 22/10/2026): un file JSON leggibile anche da
// altri programmi. Le voci del taccuino, con le foto, arrivano a pagine in streaming per non tenerle tutte in memoria.
// Esclusi hash delle sessioni, sfide, sale degli IP, contatori e chiavi delle passkey: non sono dati da consultare
// e servirebbero solo a un attacco. L'ultimo campo, complete:true, permette al client di riconoscere un file troncato.
export const EXPORT_FORMAT = 'fronda-export-v1', EXPORT_PAGE = 50, EXPORT_PER_DAY = 5;
const ACCOUNT_RATE_KEYS = ['user:', 'reports:', 'observations:', 'travel:', 'export:'];
const isoTime = (ms) => Number.isFinite(ms) ? new Date(ms).toISOString() : null;
const jsonOrNull = (text) => { try { return text == null ? null : JSON.parse(text); } catch { return null; } };
async function researchConsent(db,accountId){
  return researchState(await db.prepare('SELECT version,granted,recorded_at FROM research_consents WHERE account_id=? ORDER BY id DESC LIMIT 1').bind(accountId).first());
}
async function accountExport(db, user, now) {
  const all = async (sql) => (await db.prepare(sql).bind(user.id).all()).results;
  const preferences = await db.prepare('SELECT updated_at FROM account_preferences WHERE account_id=?').bind(user.id).first();
  const head = {
    format: EXPORT_FORMAT, exportedAt: isoTime(now),
    description: 'Copia dei tuoi dati in Fronda: profilo, taccuino con le foto (JPEG in base64), segnalazioni, osservazioni condivise, scelte sul consenso alla ricerca e conferme degli avvisi.',
    account: { id: user.id, handle: user.handle, createdAt: isoTime(user.created_at) },
    passkeys: (await all('SELECT created_at,transports,backed_up FROM passkeys WHERE account_id=? ORDER BY created_at'))
      .map((p) => ({ createdAt: isoTime(p.created_at), transports: jsonOrNull(p.transports) || [], backedUp: !!p.backed_up })),
    preferences: { base: user.base, updatedAt: isoTime(preferences?.updated_at) },
    reports: (await all('SELECT id,entry_id,day,zone_id,species_id,amount,searched,identification_checked,validation_context,created_at FROM reports WHERE account_id=? ORDER BY created_at,id'))
      .map((r) => ({ id: r.id, entryId: r.entry_id, day: r.day, zoneId: r.zone_id, speciesId: r.species_id, amount: r.amount, searched: !!r.searched,
        identificationChecked: !!r.identification_checked, validationContext: jsonOrNull(r.validation_context), createdAt: isoTime(r.created_at) })),
    sharedObservations: (await all('SELECT entry_id,day,zone_id,category,taxon_id,payload,consent_version,consented_at FROM shared_observations WHERE account_id=? ORDER BY consented_at,entry_id'))
      .map((o) => ({ entryId: o.entry_id, day: o.day, zoneId: o.zone_id, category: o.category, taxonId: o.taxon_id, payload: jsonOrNull(o.payload),
        consentVersion: o.consent_version, consentedAt: isoTime(o.consented_at) })),
    researchConsents: (await all('SELECT version,granted,recorded_at FROM research_consents WHERE account_id=? ORDER BY id'))
      .map((c) => ({ version: c.version, granted: !!c.granted, recordedAt: isoTime(c.recorded_at) })),
    legalAcceptances: (await all('SELECT version,notice_hash,accepted_at,recorded_at,source,platform FROM legal_acceptances WHERE account_id=? ORDER BY recorded_at'))
      .map((a) => ({ version: a.version, noticeHash: a.notice_hash, acceptedAt: a.accepted_at, recordedAt: isoTime(a.recorded_at), source: a.source, platform: a.platform })),
  };
  let after = '', count = 0, done = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(enc.encode(JSON.stringify(head).slice(0, -1) + ',"entries":[')); },
    async pull(controller) {
      if (done) return;
      // Paginazione sull'ID, che non cambia con le modifiche: una voce salvata durante il download non si ripete.
      const { results } = await db.prepare('SELECT id,payload,saved_at FROM diary_entries WHERE account_id=? AND id>? ORDER BY id LIMIT ?').bind(user.id, after, EXPORT_PAGE).all();
      let chunk = results.map((r) => (count++ ? ',' : '') + JSON.stringify({ ...jsonOrNull(r.payload), serverSavedAt: isoTime(r.saved_at) })).join('');
      if (results.length < EXPORT_PAGE) { chunk += '],"complete":true}'; done = true; }
      else after = results.at(-1).id;
      controller.enqueue(enc.encode(chunk));
      if (done) controller.close();
    },
  });
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    'content-disposition': `attachment; filename="fronda-dati-${day}.json"` } });
}

export async function cleanupCommunity(env, now = Date.now()) {
  if (!env.COMMUNITY_DB) return;
  await init(env.COMMUNITY_DB);
  await env.COMMUNITY_DB.batch(['sessions', 'challenges', 'rate_limits'].map((t) => env.COMMUNITY_DB.prepare(`DELETE FROM ${t} WHERE expires_at<?`).bind(now)));
}
