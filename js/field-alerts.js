// Generated from src/js/field-alerts.ts. Run npm run build:typescript; do not edit.
import { record } from "./field-contracts.js";
const KEY = "fronda:outing-alerts:v1";
const read = () => {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) || "null");
        if (!value)
            return null;
        const data = record(value);
        if (typeof data.token !== "string" ||
            !/^[A-Za-z0-9_-]{43}$/.test(data.token) ||
            !Array.isArray(data.outings) ||
            !data.outings.every((x) => typeof x === "string"))
            return null;
        return { token: data.token, outings: data.outings };
    }
    catch {
        return null;
    }
};
let config;
export async function loadAlertConfig() {
    try {
        const r = await fetch("/api/alerts/v1/config", {
            signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
            const value = await r.json(), data = record(value);
            if (typeof data.enabled !== "boolean" ||
                (data.enabled &&
                    (typeof data.publicKey !== "string" ||
                        !/^[A-Za-z0-9_-]{87}$/.test(data.publicKey))))
                throw Error("Configurazione degli avvisi non valida.");
            config = {
                enabled: data.enabled,
                publicKey: typeof data.publicKey === "string" ? data.publicKey : "",
            };
        }
    }
    catch {
        /* offline: do not request any permission */
    }
    return config;
}
export const alertsEnabled = (zoneId, date) => !!read()?.outings?.includes(zoneId + "|" + date);
export function alertAvailability() {
    if (!("Notification" in window) ||
        !("PushManager" in window) ||
        !navigator.serviceWorker)
        return "Le notifiche non sono disponibili qui. Su iPhone apri Fronda dalla schermata Home.";
    if (Notification.permission === "denied")
        return "Hai bloccato le notifiche. Puoi riabilitarle nelle impostazioni del browser o del dispositivo.";
    if (!config?.enabled)
        return "Notifiche temporaneamente non disponibili. Riprova con una connessione attiva.";
    return null;
}
function credentials() {
    let data = read();
    if (!data) {
        data = {
            token: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, ""),
            outings: [],
        };
        localStorage.setItem(KEY, JSON.stringify(data));
    }
    return data;
}
async function request(method, data, token) {
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
        const value = await r.json();
        result = record(value);
    }
    catch {
        throw Error("Risposta non valida. Riprova.");
    }
    if (!r.ok || result.ok !== true)
        throw Error(typeof result.error === "string"
            ? result.error
            : "Non riesco a modificare gli avvisi.");
}
export async function toggleOutingAlerts({ zoneId, date }) {
    const own = credentials(), id = zoneId + "|" + date;
    if (own.outings.includes(id)) {
        await request("DELETE", { zoneId, date }, own.token);
        own.outings = own.outings.filter((x) => x !== id);
        localStorage.setItem(KEY, JSON.stringify(own));
        return false;
    }
    if (!navigator.onLine)
        throw Error("Ricollegati a Internet per attivare gli avvisi.");
    const unavailable = alertAvailability();
    if (unavailable)
        throw Error(unavailable);
    const current = config;
    if (!current?.enabled)
        throw Error("Notifiche temporaneamente non disponibili.");
    // Called immediately in the click handler: iOS requires a direct user gesture.
    const permission = await Notification.requestPermission();
    if (permission !== "granted")
        throw Error("Notifiche non attivate. L’uscita resta disponibile.");
    const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(Error("Apri di nuovo Fronda e riprova.")), 10000)),
    ]);
    let subscription = await reg.pushManager.getSubscription();
    const created = !subscription;
    if (!subscription) {
        const key = Uint8Array.from(atob(current.publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
        subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key,
        });
    }
    try {
        await request("POST", { zoneId, date, subscription: subscription.toJSON() }, own.token);
    }
    catch (e) {
        if (created)
            try {
                await subscription.unsubscribe();
            }
            catch {
                /* browser can retry unsubscribe */
            }
        throw e;
    }
    own.outings.push(id);
    localStorage.setItem(KEY, JSON.stringify(own));
    return true;
}
addEventListener("online", () => void loadAlertConfig());
