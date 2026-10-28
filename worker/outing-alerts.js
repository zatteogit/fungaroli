import { buildPushPayload } from "@block65/webcrypto-web-push";
import { forecastParams } from "./weather-provider.js";
import { weatherStorage } from "./weather-storage.js";
import { weatherCacheKey } from "./weather-key.js";
import { outingFor } from "../js/outing.js";
import { todayISO } from "../js/weather.js";
const response = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const fail = (message, status = 422, code) => {
  throw Object.assign(Error(message), { status, code });
};
export const ALERT_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS outing_alert_devices (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, subscription TEXT NOT NULL, expires_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS outing_alerts (device_id TEXT NOT NULL, zone_id TEXT NOT NULL, day TEXT NOT NULL, baseline INTEGER NOT NULL, last_sent INTEGER NOT NULL DEFAULT -1, lease_until INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(device_id,zone_id,day))",
  "CREATE INDEX IF NOT EXISTS outing_alert_days ON outing_alerts(day)",
  "CREATE TABLE IF NOT EXISTS outing_alert_rate (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
];
const initialized = new WeakMap();
async function init(db) {
  if (!db) fail("Notifiche temporaneamente non disponibili.", 503);
  if (!initialized.has(db))
    initialized.set(
      db,
      db.batch(ALERT_SCHEMA.map((s) => db.prepare(s))).catch((e) => {
        initialized.delete(db);
        throw e;
      }),
    );
  await initialized.get(db);
}
const hash = async (text) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
export function validateSubscription(s) {
  let u;
  try {
    u = new URL(s?.endpoint);
  } catch {
    fail("Iscrizione alle notifiche non valida.");
  }
  const allowed =
    u.hostname === "fcm.googleapis.com" ||
    u.hostname === "updates.push.services.mozilla.com" ||
    u.hostname === "push.services.mozilla.com" ||
    u.hostname.endsWith(".push.apple.com") ||
    u.hostname === "web.push.apple.com" ||
    u.hostname === "wns2-par02p.notify.windows.com" ||
    u.hostname.endsWith(".notify.windows.com");
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    !allowed ||
    u.href.length > 2500 ||
    !s?.keys ||
    typeof s.keys.p256dh !== "string" ||
    !/^B[A-Za-z0-9_-]{86}$/.test(s.keys.p256dh) ||
    typeof s.keys.auth !== "string" ||
    !/^[A-Za-z0-9_-]{22}$/.test(s.keys.auth)
  )
    fail("Iscrizione alle notifiche non valida.");
  return {
    endpoint: u.href,
    expirationTime: null,
    keys: { p256dh: s.keys.p256dh, auth: s.keys.auth },
  };
}
export const alertSeverity = (w) =>
  w?.available
    ? ({ ok: 0, attenzione: 1, sconsigliata: 2 }[w.level] ?? null)
    : null;
export function alertChange(baseline, lastSent, current) {
  return (
    current !== null &&
    baseline >= 0 &&
    current > baseline &&
    current > lastSent
  );
}
async function body(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    fail("Richiesta non valida.", 415);
  const reader = request.body?.getReader();
  if (!reader) fail("Richiesta vuota.");
  let text = "",
    size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > 7000) {
      await reader.cancel();
      fail("Richiesta troppo grande.", 413);
    }
    text += decoder.decode(r.value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    fail("Richiesta non valida.");
  }
}
async function weather(env, zone, day, now) {
  const r = await weatherStorage(env).get(
      await weatherCacheKey(forecastParams([zone], "outing")),
    ),
    h = r?.raw?.[0]?.hourly;
  if (!h) return null;
  return outingFor(
    {
      time: h.time,
      p: h.precipitation,
      pp: h.precipitation_probability,
      wc: h.weather_code,
      g: h.wind_gusts_10m,
      t: h.temperature_2m,
      fetchedAt: new Date(r.t).toISOString(),
    },
    zone,
    day,
    now,
  );
}
export async function handleOutingAlerts(
  request,
  env,
  { zones, now = Date.now() } = {},
) {
  try {
    const path = new URL(request.url).pathname;
    if (path === "/api/alerts/v1/config" && request.method === "GET")
      return response({
        enabled: !!(
          env.PUSH_PUBLIC_KEY &&
          env.PUSH_PRIVATE_KEY &&
          env.COMMUNITY_DB
        ),
        publicKey: env.PUSH_PUBLIC_KEY || null,
      });
    if (
      path !== "/api/alerts/v1/subscriptions" ||
      !["POST", "DELETE"].includes(request.method)
    )
      fail("Percorso non disponibile.", 404);
    if (
      request.headers.get("origin") !==
      (env.APP_ORIGIN || new URL(request.url).origin)
    )
      fail("Origine non autorizzata.", 403);
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token) fail("Riapri le impostazioni delle notifiche.", 401);
    const db = env.COMMUNITY_DB;
    await init(db);
    const tokenHash = await hash(token);
    if (request.method === "DELETE") {
      const data = await body(request);
      if (typeof data.zoneId !== "string" || typeof data.date !== "string")
        fail("Uscita non valida.");
      await db
        .prepare(
          "DELETE FROM outing_alerts WHERE zone_id=? AND day=? AND device_id IN (SELECT id FROM outing_alert_devices WHERE token_hash=?)",
        )
        .bind(data.zoneId, data.date, tokenHash)
        .run();
      await db
        .prepare(
          "DELETE FROM outing_alert_devices WHERE token_hash=? AND id NOT IN (SELECT device_id FROM outing_alerts)",
        )
        .bind(tokenHash)
        .run();
      return response({ ok: true });
    }
    if (!env.PUSH_PUBLIC_KEY || !env.PUSH_PRIVATE_KEY)
      fail("Notifiche non ancora disponibili.", 503);
    const data = await body(request),
      subscription = validateSubscription(data.subscription),
      zone = zones?.find((z) => z.id === data.zoneId),
      today = todayISO(new Date(now)),
      last = todayISO(new Date(now + 7 * 864e5));
    if (
      !zone ||
      typeof data.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      data.date < today ||
      data.date > last
    )
      fail("Scegli un’uscita nei prossimi sette giorni.");
    try {
      await crypto.subtle.importKey(
        "raw",
        Uint8Array.from(
          atob(subscription.keys.p256dh.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0),
        ),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        [],
      );
    } catch {
      fail(
        "Chiave del dispositivo non valida. Rimuovi e riattiva le notifiche.",
      );
    }
    const w = await weather(env, zone, data.date, now),
      severity = alertSeverity(w);
    if (severity === null)
      fail(
        "Aspetta che il meteo dell’uscita sia disponibile prima di attivare gli avvisi.",
        409,
      );
    const id = await hash(subscription.endpoint),
      old = await db
        .prepare("SELECT token_hash FROM outing_alert_devices WHERE id=?")
        .bind(id)
        .first();
    if (old && old.token_hash !== tokenHash)
      fail(
        "Rimuovi e riattiva il permesso alle notifiche per questo sito.",
        409,
        "device-token",
      );
    const rateId = await hash(
      env.PUSH_PRIVATE_KEY +
        "|" +
        (request.headers.get("CF-Connecting-IP") || "local") +
        "|" +
        Math.floor(now / 36e5),
    );
    await db
      .prepare(
        "INSERT INTO outing_alert_rate(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1",
      )
      .bind(rateId, now + 36e5)
      .run();
    if (
      (
        await db
          .prepare("SELECT count FROM outing_alert_rate WHERE id=?")
          .bind(rateId)
          .first()
      ).count > 30
    )
      fail("Troppe richieste. Riprova più tardi.", 429);
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM outing_alerts WHERE device_id=? AND day>=?",
      )
      .bind(id, today)
      .first();
    if (
      count.n >= 10 &&
      !(await db
        .prepare(
          "SELECT 1 FROM outing_alerts WHERE device_id=? AND zone_id=? AND day=?",
        )
        .bind(id, zone.id, data.date)
        .first())
    )
      fail("Puoi seguire al massimo dieci uscite su questo dispositivo.");
    await db.batch([
      db
        .prepare(
          "INSERT INTO outing_alert_devices(id,token_hash,subscription,expires_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,expires_at=excluded.expires_at WHERE token_hash=excluded.token_hash",
        )
        .bind(id, tokenHash, JSON.stringify(subscription), now + 30 * 864e5),
      db
        .prepare(
          "INSERT INTO outing_alerts(device_id,zone_id,day,baseline) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM outing_alert_devices WHERE id=? AND token_hash=?) AND (SELECT COUNT(*) FROM outing_alerts WHERE device_id=?)<10 ON CONFLICT(device_id,zone_id,day) DO NOTHING",
        )
        .bind(id, zone.id, data.date, severity, id, tokenHash, id),
    ]);
    const owner = await db
      .prepare("SELECT token_hash FROM outing_alert_devices WHERE id=?")
      .bind(id)
      .first();
    if (owner?.token_hash !== tokenHash)
      fail(
        "Rimuovi e riattiva il permesso alle notifiche per questo sito.",
        409,
        "device-token",
      );
    if (
      !(await db
        .prepare(
          "SELECT 1 FROM outing_alerts WHERE device_id=? AND zone_id=? AND day=?",
        )
        .bind(id, zone.id, data.date)
        .first())
    )
      fail("Puoi seguire al massimo dieci uscite su questo dispositivo.");
    return response({ ok: true }, 201);
  } catch (e) {
    return response(
      {
        error: e.status
          ? e.message
          : "Notifiche temporaneamente non disponibili. Riprova.",
        ...(e.code && { code: e.code }),
      },
      e.status || 503,
    );
  }
}
export async function cleanupOutingAlerts(env, now = Date.now()) {
  if (!env.COMMUNITY_DB) return;
  const db = env.COMMUNITY_DB;
  await init(db);
  await db.batch([
    db.prepare("DELETE FROM outing_alerts WHERE day<?").bind(todayISO(new Date(now))),
    db
      .prepare(
        "DELETE FROM outing_alert_devices WHERE expires_at<? OR id NOT IN (SELECT device_id FROM outing_alerts)",
      )
      .bind(now),
    db.prepare(
      "DELETE FROM outing_alerts WHERE device_id NOT IN (SELECT id FROM outing_alert_devices)",
    ),
    db.prepare("DELETE FROM outing_alert_rate WHERE expires_at<?").bind(now),
  ]);
}
export async function sendOutingAlerts(
  env,
  { zones, now = Date.now(), fetcher = fetch } = {},
) {
  if (!env.COMMUNITY_DB || !env.PUSH_PUBLIC_KEY || !env.PUSH_PRIVATE_KEY)
    return;
  const db = env.COMMUNITY_DB;
  await init(db);
  const today = todayISO(new Date(now));
  // Le pulizie girano nel cron notturno: qui si saltano soltanto i giorni passati.
  const { results: rows } = await db
    .prepare(
      "SELECT a.*,d.subscription FROM outing_alerts a JOIN outing_alert_devices d ON d.id=a.device_id WHERE a.lease_until<=? AND a.day>=? AND d.expires_at>=? ORDER BY a.lease_until LIMIT 10",
    )
    .bind(now, today, now)
    .all();
  const cached = new Map();
  for (const row of rows) {
    const key = row.zone_id + "|" + row.day,
      zone = zones.find((z) => z.id === row.zone_id);
    if (!zone) {
      await db
        .prepare(
          "DELETE FROM outing_alerts WHERE device_id=? AND zone_id=? AND day=?",
        )
        .bind(row.device_id, row.zone_id, row.day)
        .run();
      continue;
    }
    // Claim before inspecting or sending; a duplicate cron cannot send the same notification.
    const claim = await db
      .prepare(
        "UPDATE outing_alerts SET lease_until=? WHERE device_id=? AND zone_id=? AND day=? AND lease_until<=? RETURNING device_id",
      )
      .bind(now + 10 * 60000, row.device_id, row.zone_id, row.day, now)
      .first();
    if (!claim) continue;
    if (!cached.has(key))
      cached.set(key, await weather(env, zone, row.day, now));
    const w = cached.get(key),
      severity = alertSeverity(w);
    if (!alertChange(row.baseline, row.last_sent, severity)) continue;
    let subscription;
    try {
      subscription = validateSubscription(JSON.parse(row.subscription));
    } catch {
      await db
        .prepare("DELETE FROM outing_alert_devices WHERE id=?")
        .bind(row.device_id)
        .run();
      continue;
    }
    const message = {
      title: "Meteo cambiato per la tua uscita",
      body: `${zone.title || zone.name} · ${row.day}: ${w.main || w.text}. Apri Fronda e ricontrolla prima di partire.`,
      // Data, non scarto in giorni: la notifica aperta il giorno dopo porta ancora all'uscita seguita.
      url: `/#/zona/${zone.id}/${row.day}`,
      tag: "outing-" + key,
    };
    try {
      const payload = await buildPushPayload(
        { data: JSON.stringify(message), options: { ttl: 3600 } },
        subscription,
        {
          subject: env.APP_ORIGIN,
          publicKey: env.PUSH_PUBLIC_KEY,
          privateKey: env.PUSH_PRIVATE_KEY,
        },
      );
      const res = await fetcher(subscription.endpoint, {
        ...payload,
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      if (res.status === 404 || res.status === 410)
        await db
          .prepare("DELETE FROM outing_alert_devices WHERE id=?")
          .bind(row.device_id)
          .run();
      else if (res.ok)
        await db
          .prepare(
            "UPDATE outing_alerts SET last_sent=? WHERE device_id=? AND zone_id=? AND day=?",
          )
          .bind(severity, row.device_id, row.zone_id, row.day)
          .run();
      await res.body?.cancel();
    } catch {
      /* A transient push failure is retried after the lease; never log endpoint or keys. */
    }
  }
}
