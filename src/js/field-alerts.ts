import type { AlertConfig, AlertCredentials, OutingKey } from "./types.js";
import { record } from "./field-contracts.js";
import { todayISO } from "./weather.js";
const KEY = "fronda:outing-alerts:v1";
const read = (): AlertCredentials | null => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!value) return null;
    const data = record(value);
    if (
      typeof data.token !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(data.token) ||
      !Array.isArray(data.outings) ||
      !data.outings.every((x): x is string => typeof x === "string")
    )
      return null;
    // Il server cancella i giorni passati: l'elenco locale li toglie allo stesso modo.
    const today = todayISO();
    return {
      token: data.token,
      outings: data.outings.filter((x) => (x.split("|")[1] || "") >= today),
    };
  } catch {
    return null;
  }
};
let config: AlertConfig | undefined;
export async function loadAlertConfig() {
  try {
    const r = await fetch("/api/alerts/v1/config", {
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const value: unknown = await r.json(),
        data = record(value);
      if (
        typeof data.enabled !== "boolean" ||
        (data.enabled &&
          (typeof data.publicKey !== "string" ||
            !/^[A-Za-z0-9_-]{87}$/.test(data.publicKey)))
      )
        throw Error("Configurazione degli avvisi non valida.");
      config = {
        enabled: data.enabled,
        publicKey: typeof data.publicKey === "string" ? data.publicKey : "",
      };
    }
  } catch {
    /* offline: do not request any permission */
  }
  return config;
}
export const alertsEnabled = (zoneId: string, date: string) =>
  !!read()?.outings?.includes(zoneId + "|" + date);
export function alertAvailability() {
  if (
    !("Notification" in window) ||
    !("PushManager" in window) ||
    !navigator.serviceWorker
  )
    return "Le notifiche non sono disponibili qui. Su iPhone apri Fronda dalla schermata Home.";
  if (Notification.permission === "denied")
    return "Hai bloccato le notifiche. Puoi riabilitarle nelle impostazioni del browser o del dispositivo.";
  if (!config?.enabled)
    return "Notifiche temporaneamente non disponibili. Riprova con una connessione attiva.";
  return null;
}
function credentials(): AlertCredentials {
  let data = read();
  if (!data) {
    data = {
      token: btoa(
        String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, ""),
      outings: [],
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  return data;
}
async function request(
  method: "POST" | "DELETE",
  data: OutingKey & { subscription?: PushSubscriptionJSON },
  token: string,
) {
  const r = await fetch("/api/alerts/v1/subscriptions", {
    method,
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  });
  let result;
  try {
    const value: unknown = await r.json();
    result = record(value);
  } catch {
    throw Error("Risposta non valida. Riprova.");
  }
  if (!r.ok || result.ok !== true)
    throw Object.assign(
      Error(
        typeof result.error === "string"
          ? result.error
          : "Non riesco a modificare gli avvisi.",
      ),
      { code: typeof result.code === "string" ? result.code : "" },
    );
}
export async function toggleOutingAlerts({ zoneId, date }: OutingKey) {
  const own = credentials(),
    id = zoneId + "|" + date;
  if (own.outings.includes(id)) {
    await request("DELETE", { zoneId, date }, own.token);
    own.outings = own.outings.filter((x) => x !== id);
    localStorage.setItem(KEY, JSON.stringify(own));
    return false;
  }
  if (!navigator.onLine)
    throw Error("Ricollegati a Internet per attivare gli avvisi.");
  const unavailable = alertAvailability();
  if (unavailable) throw Error(unavailable);
  const current = config;
  if (!current?.enabled)
    throw Error("Notifiche temporaneamente non disponibili.");
  // Called immediately in the click handler: iOS requires a direct user gesture.
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw Error("Notifiche non attivate. L’uscita resta disponibile.");
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(Error("Apri di nuovo Fronda e riprova.")), 10000),
    ),
  ]);
  const key = Uint8Array.from(
    atob(current.publicKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
  const subscribe = () =>
    reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  let subscription = await reg.pushManager.getSubscription();
  let created = !subscription;
  if (!subscription) subscription = await subscribe();
  const post = (s: PushSubscription) =>
    request("POST", { zoneId, date, subscription: s.toJSON() }, own.token);
  try {
    try {
      await post(subscription);
    } catch (e) {
      // Dati locali cancellati: l'iscrizione push appartiene a un token perso.
      // Una nuova iscrizione ha un altro endpoint, quindi un dispositivo nuovo sul server.
      if (created || (e as { code?: string }).code !== "device-token") throw e;
      await subscription.unsubscribe();
      subscription = await subscribe();
      created = true;
      await post(subscription);
    }
  } catch (e) {
    if (created)
      try {
        await subscription.unsubscribe();
      } catch {
        /* browser can retry unsubscribe */
      }
    throw e;
  }
  own.outings.push(id);
  localStorage.setItem(KEY, JSON.stringify(own));
  return true;
}

addEventListener("online", () => void loadAlertConfig());
