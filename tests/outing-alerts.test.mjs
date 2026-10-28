import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  handleOutingAlerts,
  sendOutingAlerts,
  validateSubscription,
  alertChange,
  alertSeverity,
  cleanupOutingAlerts,
} from "../worker/outing-alerts.js";
import { weatherStorage } from "../worker/weather-storage.js";
import { forecastParams, cachedForecast } from "../worker/weather-provider.js";
import { weatherCacheKey } from "../worker/weather-key.js";
const origin = "https://fronda.test",
  zone = {
    id: "tancia",
    title: "Monte Tancia",
    lat: 42.3,
    lon: 12.8,
    bands: [800],
  },
  now = Date.parse("2026-10-27T08:00:00Z"),
  day = "2026-10-28",
  token = "a".repeat(43);
function db() {
  const sql = new DatabaseSync(":memory:");
  const stmt = (q, args = []) => {
    const exec = () =>
      /\bRETURNING\b|^SELECT/i.test(q)
        ? { results: sql.prepare(q).all(...args) }
        : { meta: { changes: Number(sql.prepare(q).run(...args).changes) } };
    return {
      exec,
      bind: (...a) => stmt(q, a),
      run: async () => exec(),
      all: async () => exec(),
      first: async () => exec().results[0] || null,
    };
  };
  return {
    sql,
    prepare: (q) => stmt(q),
    batch: async (rows) => {
      sql.exec("BEGIN");
      try {
        const out = rows.map((s) => s.exec());
        sql.exec("COMMIT");
        return out;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
const bytes = (b) => Buffer.from(b).toString("base64url");
async function setup() {
  const vapid = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    ),
    key = await crypto.subtle.exportKey("jwk", vapid.privateKey),
    publicKey = await crypto.subtle.exportKey("raw", vapid.publicKey);
  const client = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test-device",
    keys: {
      auth: bytes(crypto.getRandomValues(new Uint8Array(16))),
      p256dh: bytes(await crypto.subtle.exportKey("raw", client.publicKey)),
    },
  };
  const env = {
    APP_ORIGIN: origin,
    COMMUNITY_DB: db(),
    CMS_DB: db(),
    PUSH_PUBLIC_KEY: bytes(publicKey),
    PUSH_PRIVATE_KEY: key.d,
  };
  return { env, subscription };
}
async function wx(env, code = 0, at = now) {
  const h = {
    time: Array.from(
      { length: 24 },
      (_, i) => day + "T" + String(i).padStart(2, "0") + ":00",
    ),
    precipitation: Array(24).fill(0),
    precipitation_probability: Array(24).fill(0),
    weather_code: Array(24).fill(code),
    wind_gusts_10m: Array(24).fill(0),
    temperature_2m: Array(24).fill(15),
  };
  await weatherStorage(env).put(
    await weatherCacheKey(forecastParams([zone], "outing")),
    JSON.stringify({ t: at, raw: [{ hourly: h }] }),
    { expirationTtl: 86400 * 5 },
  );
}
const req = (method, data, auth = token, from = origin) =>
  new Request(origin + "/api/alerts/v1/subscriptions", {
    method,
    headers: {
      origin: from,
      authorization: "Bearer " + auth,
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
test("notifiche: niente geolocalizzazione, origine e proprietà del dispositivo protette, revoca senza profilo", async () => {
  const { env, subscription } = await setup();
  await wx(env);
  const data = { zoneId: zone.id, date: day, subscription };
  assert.equal(
    (
      await handleOutingAlerts(
        req("POST", data, token, "https://evil.test"),
        env,
        { zones: [zone], now },
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleOutingAlerts(req("POST", data), env, { zones: [zone], now }))
      .status,
    201,
  );
  const lost = await handleOutingAlerts(req("POST", data, "b".repeat(43)), env, {
    zones: [zone],
    now,
  });
  assert.equal(lost.status, 409);
  assert.equal((await lost.json()).code, "device-token", "il client riconosce il token perso e rifà l'iscrizione");
  assert.equal(
    env.COMMUNITY_DB.sql.prepare("SELECT COUNT(*) n FROM outing_alerts").get()
      .n,
    1,
  );
  await handleOutingAlerts(
    req("DELETE", { zoneId: zone.id, date: day }, "b".repeat(43)),
    env,
    { now },
  );
  assert.equal(
    env.COMMUNITY_DB.sql.prepare("SELECT COUNT(*) n FROM outing_alerts").get()
      .n,
    1,
  );
  await handleOutingAlerts(req("DELETE", { zoneId: zone.id, date: day }), env, {
    now,
  });
  assert.equal(
    env.COMMUNITY_DB.sql.prepare("SELECT COUNT(*) n FROM outing_alerts").get()
      .n,
    0,
  );
});
test("push: invio cifrato solo al peggioramento, claim contro cron duplicati e niente invii per dati scaduti", async () => {
  const { env, subscription } = await setup();
  await wx(env);
  await handleOutingAlerts(
    req("POST", { zoneId: zone.id, date: day, subscription }),
    env,
    { zones: [zone], now },
  );
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(url, subscription.endpoint);
    assert.equal(
      new Headers(options.headers).get("content-encoding"),
      "aes128gcm",
    );
    assert.ok(
      new Headers(options.headers).get("authorization").includes("vapid"),
    );
    assert.equal(options.redirect, "error");
    return new Response(null, { status: 201 });
  };
  await sendOutingAlerts(env, { zones: [zone], now, fetcher });
  assert.equal(calls, 0);
  await wx(env, 95);
  await Promise.all([
    sendOutingAlerts(env, { zones: [zone], now: now + 11 * 60000, fetcher }),
    sendOutingAlerts(env, { zones: [zone], now: now + 11 * 60000, fetcher }),
  ]);
  assert.equal(calls, 1);
  await sendOutingAlerts(env, {
    zones: [zone],
    now: now + 22 * 60000,
    fetcher,
  });
  assert.equal(calls, 1);
  assert.equal(
    alertSeverity({ level: "sconsigliata", available: false }),
    null,
  );
  assert.equal(alertChange(0, -1, null), false);
  assert.equal(alertChange(0, 2, 2), false);
});
test("endpoint arbitrari, credenziali, porte, date e corpi non validi sono rifiutati", async () => {
  const { env, subscription } = await setup();
  await wx(env);
  for (const endpoint of [
    "http://fcm.googleapis.com/test",
    "https://127.0.0.1/test",
    "https://evil.test/push",
    "https://fcm.googleapis.com:8443/test",
    "https://user@fcm.googleapis.com/test",
  ])
    assert.throws(() => validateSubscription({ ...subscription, endpoint }));
  for (const date of ["2026-11-28", "2026-10-26", "not-a-day"])
    assert.equal(
      (
        await handleOutingAlerts(
          req("POST", { zoneId: zone.id, date, subscription }),
          env,
          { zones: [zone], now },
        )
      ).status,
      422,
    );
  const result = await handleOutingAlerts(
    req("POST", {
      zoneId: zone.id,
      date: day,
      subscription: {
        ...subscription,
        keys: { ...subscription.keys, auth: "invalid" },
      },
    }),
    env,
    { zones: [zone], now },
  );
  assert.equal(result.status, 422);
});
test("avvisi: leggono il meteo salvato dal Worker con la stessa chiave del provider", async () => {
  const { env, subscription } = await setup();
  const params = forecastParams([zone], "outing");
  const time = ["2026-10-27", day].flatMap((d) =>
    Array.from({ length: 24 }, (_, i) => d + "T" + String(i).padStart(2, "0") + ":00"),
  );
  const hourly = { time };
  for (const field of params.get("hourly").split(","))
    hourly[field] = time.map(() => 0);
  const daily = params.get("daily")
    ? Object.fromEntries([["time", ["2026-10-27", day]], ...params.get("daily").split(",").map((f) => [f, [0, 0]])])
    : undefined;
  await cachedForecast(params, {
    zones: [zone],
    cache: weatherStorage(env),
    now,
    refresh: true,
    strictCache: true,
    fetcher: async () => Response.json([{ hourly, ...(daily && { daily }) }]),
  });
  const res = await handleOutingAlerts(
    req("POST", { zoneId: zone.id, date: day, subscription }),
    env,
    { zones: [zone], now },
  );
  assert.equal(res.status, 201, await res.clone().text());
});
test("avvisi: le pulizie notturne tolgono giorni passati e dispositivi scaduti, l'invio salta i giorni passati", async () => {
  const { env, subscription } = await setup();
  await wx(env);
  await handleOutingAlerts(
    req("POST", { zoneId: zone.id, date: day, subscription }),
    env,
    { zones: [zone], now },
  );
  const later = Date.parse("2026-10-30T08:00:00Z");
  let calls = 0;
  await sendOutingAlerts(env, { zones: [zone], now: later, fetcher: async () => (calls++, new Response(null, { status: 201 })) });
  assert.equal(calls, 0);
  const n = (t) => env.COMMUNITY_DB.sql.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
  assert.equal(n("outing_alerts"), 1, "l'invio non cancella più a ogni minuto");
  await cleanupOutingAlerts(env, later);
  assert.equal(n("outing_alerts"), 0);
  assert.equal(n("outing_alert_devices"), 0);
});
