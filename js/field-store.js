// Generated from src/js/field-store.ts. Run npm run build:typescript; do not edit.
import { parseFieldPack, parseStoredFieldPack } from "./field-contracts.js";
// Public outing packs only; private notebook data stays in its own scoped archive.
export const PACK_PREFIX = "fronda-field-pack-";
let opening;
function database() {
    return (opening ||= new Promise((resolve, reject) => {
        const r = indexedDB.open("fronda-field", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("packs", { keyPath: "id" });
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(Error("Archivio offline non disponibile su questo dispositivo."));
    }).catch((e) => {
        opening = null;
        throw e;
    }));
}
async function io(operation) {
    const { method } = operation;
    const db = await database();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("packs", method === "get" || method === "getAll" ? "readonly" : "readwrite"), store = tx.objectStore("packs"), r = method === "getAll"
            ? store.getAll()
            : method === "put"
                ? store.put(operation.value)
                : method === "delete"
                    ? store.delete(operation.value)
                    : store.get(operation.value);
        let result;
        r.onsuccess = () => (result = r.result);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(Error("Spazio offline non disponibile. La copia precedente resta conservata."));
        tx.onabort = tx.onerror;
    });
}
const parsed = (value) => {
    try {
        return parseStoredFieldPack(value);
    }
    catch {
        return null;
    }
};
const rawId = (value) => typeof value === "object" &&
    value &&
    "id" in value &&
    typeof value.id === "string"
    ? value.id
    : null;
const rawCache = (value) => typeof value === "object" &&
    value &&
    "cache" in value &&
    typeof value.cache === "string" &&
    value.cache.startsWith(PACK_PREFIX)
    ? value.cache
    : null;
export const listFieldPacks = async () => {
    const values = await io({ method: "getAll" });
    if (!Array.isArray(values))
        throw Error("Archivio offline non valido.");
    const packs = [], unreadable = [];
    for (const value of values) {
        const pack = parsed(value), id = rawId(value);
        if (pack)
            packs.push(pack);
        else if (id)
            unreadable.push({ id });
    }
    return {
        packs: packs.sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
        unreadable,
    };
};
export const getFieldPack = async (id) => {
    const value = await io({ method: "get", value: id });
    return value == null ? undefined : (parsed(value) ?? undefined);
};
// Cancella senza interpretare la copia: funziona anche se non è più leggibile.
export async function removeFieldPack(id) {
    const cache = rawCache(await io({ method: "get", value: id }));
    await io({ method: "delete", value: id });
    if (cache)
        await caches.delete(cache);
}
export function packageAssets(pack) {
    const paths = [
        "offline.html",
        "js/field-reader.js",
        "js/field-store.js",
        "js/field-device.js",
        "js/field-render.js",
        "js/field-contracts.js",
        "css/field.css",
        "css/tokens.css",
        "assets/fronda-icon.svg",
    ];
    for (const p of [pack.cover, ...pack.species.map((s) => s.photo)].filter(Boolean))
        if (typeof p === "string" &&
            /^assets\/[a-zA-Z0-9_./-]+\.(webp|png|jpg|jpeg|svg)$/.test(p))
            paths.push(p);
    return [...new Set(paths)];
}
export async function saveFieldPack(input, onProgress = () => { }) {
    if (!globalThis.caches || !globalThis.indexedDB)
        throw Error("Questo browser non permette di preparare contenuti offline.");
    if (!navigator.serviceWorker)
        throw Error("L’uso offline non è disponibile su questo browser.");
    await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(Error("L’app si sta preparando. Attendi qualche secondo e riprova.")), 15000)),
    ]);
    const pack = parseFieldPack(input);
    const previousCache = rawCache(await io({ method: "get", value: pack.id })), name = PACK_PREFIX + crypto.randomUUID(), cache = await caches.open(name), assets = packageAssets(pack);
    let bytes = 0;
    try {
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const url = new URL(asset, location.href), response = await fetch(url, { signal: AbortSignal.timeout(20000) });
            if (!response.ok ||
                response.type === "opaque" ||
                (response.headers.get("content-type")?.includes("text/html") &&
                    !asset.endsWith(".html")))
                throw Error("Un contenuto non è disponibile. Riprova con una connessione stabile.");
            const data = await response.arrayBuffer();
            bytes += data.byteLength;
            await cache.put(url.href, new Response(data, { headers: response.headers }));
            onProgress(i + 1, assets.length);
        }
        // The reader must also work when its query string contains the pack id.
        const reader = new URL("offline.html", location.href);
        const readerResponse = await cache.match(reader);
        if (!readerResponse)
            throw Error("Lettore offline non disponibile. Riprova.");
        await cache.put(new URL("offline.html?outing=" + encodeURIComponent(pack.id), location.href), readerResponse);
        const saved = {
            ...pack,
            cache: name,
            bytes,
            savedAt: new Date().toISOString(),
        };
        await io({ method: "put", value: saved });
        if (previousCache && previousCache !== name)
            await caches.delete(previousCache);
        let persistent = false;
        try {
            persistent = (await navigator.storage?.persist?.()) || false;
        }
        catch {
            /* saving succeeded even if eviction protection is unavailable */
        }
        return { ...saved, persistent };
    }
    catch (error) {
        await caches.delete(name);
        throw error;
    }
}
