// Public outing packs only; private notebook data stays in its own scoped archive.
export const PACK_PREFIX = "fronda-field-pack-";
let opening;
function database() {
  return (opening ||= new Promise((resolve, reject) => {
    const r = indexedDB.open("fronda-field", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("packs", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(Error("Archivio offline non disponibile su questo dispositivo."));
  }).catch((e) => {
    opening = null;
    throw e;
  }));
}
async function io(method, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
        "packs",
        method === "get" || method === "getAll" ? "readonly" : "readwrite",
      ),
      store = tx.objectStore("packs"),
      r = value === undefined ? store[method]() : store[method](value);
    let result;
    r.onsuccess = () => (result = r.result);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        Error(
          "Spazio offline non disponibile. La copia precedente resta conservata.",
        ),
      );
    tx.onabort = tx.onerror;
  });
}
export const listFieldPacks = async () =>
  (await io("getAll")).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
export const getFieldPack = (id) => io("get", id);
export async function removeFieldPack(id) {
  const old = await io("get", id);
  await io("delete", id);
  if (old?.cache) await caches.delete(old.cache);
}
export function packageAssets(pack) {
  const paths = [
    "offline.html",
    "js/field-reader.js",
    "js/field-store.js",
    "js/field-device.js",
    "js/field-render.js",
    "css/field.css",
    "css/tokens.css",
    "assets/fronda-icon.svg",
  ];
  for (const p of [pack.cover, ...pack.species.map((s) => s.photo)].filter(
    Boolean,
  ))
    if (/^assets\/[a-zA-Z0-9_./-]+\.(webp|png|jpg|jpeg|svg)$/.test(p))
      paths.push(p);
  return [...new Set(paths)];
}
export async function saveFieldPack(pack, onProgress = () => {}) {
  if (!globalThis.caches || !globalThis.indexedDB)
    throw Error("Questo browser non permette di preparare contenuti offline.");
  if (!navigator.serviceWorker)
    throw Error("L’uso offline non è disponibile su questo browser.");
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            Error(
              "L’app si sta preparando. Attendi qualche secondo e riprova.",
            ),
          ),
        15000,
      ),
    ),
  ]);
  const previous = await getFieldPack(pack.id),
    name = PACK_PREFIX + crypto.randomUUID(),
    cache = await caches.open(name),
    assets = packageAssets(pack);
  let bytes = 0;
  try {
    for (let i = 0; i < assets.length; i++) {
      const url = new URL(assets[i], location.href),
        response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (
        !response.ok ||
        response.type === "opaque" ||
        (response.headers.get("content-type")?.includes("text/html") &&
          !assets[i].endsWith(".html"))
      )
        throw Error(
          "Un contenuto non è disponibile. Riprova con una connessione stabile.",
        );
      const data = await response.arrayBuffer();
      bytes += data.byteLength;
      await cache.put(
        url.href,
        new Response(data, { headers: response.headers }),
      );
      onProgress(i + 1, assets.length);
    }
    // The reader must also work when its query string contains the pack id.
    const reader = new URL("offline.html", location.href);
    await cache.put(
      new URL(
        "offline.html?outing=" + encodeURIComponent(pack.id),
        location.href,
      ),
      await cache.match(reader),
    );
    const saved = {
      ...pack,
      cache: name,
      bytes,
      savedAt: new Date().toISOString(),
    };
    await io("put", saved);
    if (previous?.cache && previous.cache !== name)
      await caches.delete(previous.cache);
    let persistent = false;
    try {
      persistent = (await navigator.storage?.persist?.()) || false;
    } catch {
      /* saving succeeded even if eviction protection is unavailable */
    }
    return { ...saved, persistent };
  } catch (error) {
    await caches.delete(name);
    throw error;
  }
}
