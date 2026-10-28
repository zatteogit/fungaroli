import type { NotebookEntry, NotebookPhoto } from "./notebook-types.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
// Le fotografie restano fuori dal piccolo spazio localStorage. Ogni archivio ha chiavi proprie.
let opening: Promise<IDBDatabase> | null;
const queues = new Map<string, Promise<unknown>>();
function serial<T>(scope: string, work: () => T | Promise<T>): Promise<T> {
  const pending = (queues.get(scope) || Promise.resolve())
    .catch(() => {})
    .then(work);
  queues.set(scope, pending);
  pending
    .finally(() => {
      if (queues.get(scope) === pending) queues.delete(scope);
    })
    .catch(() => {});
  return pending;
}
function database() {
  return (opening ||= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("fronda-notebook-photos", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(
        Error(
          "Archivio fotografico non disponibile. Riprova senza chiudere questa pagina.",
        ),
      );
  }).catch((e) => {
    opening = null;
    throw e;
  }));
}
async function photoIO(
  method: "get" | "put" | "delete",
  key: string,
  value?: NotebookPhoto,
): Promise<unknown> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
        "photos",
        method === "get" ? "readonly" : "readwrite",
      ),
      store = tx.objectStore("photos"),
      r =
        method === "put"
          ? store.put(value, key)
          : method === "get"
            ? store.get(key)
            : store.delete(key);
    let result: unknown;
    r.onsuccess = () => (result = r.result);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        Error(
          "Spazio per le fotografie non disponibile. La nota non è stata salvata.",
        ),
      );
    tx.onabort = tx.onerror;
  });
}
// Copia locale del taccuino di un profilo: chiave di localStorage e prefisso delle sue foto in IndexedDB.
export const accountNotebookScope = (id: string) =>
  "fungaroli:diario:account:" + id;
// Toglie dal dispositivo una copia del taccuino (decisione del 22/10/2026): voci in localStorage e foto con il
// prefisso dell'archivio. Usata dopo «Elimina profilo e dati»; aspetta le scritture già in coda su quell'archivio.
export function clearNotebookStore(scope: string) {
  return serial(scope, async () => {
    try {
      localStorage.removeItem(scope);
      localStorage.removeItem(scope + ":non-leggibili");
    } catch {
      /* memoria non disponibile: restano solo le foto da togliere */
    }
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").delete(
        IDBKeyRange.bound(scope + ":", scope + ":\uffff"),
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(Error("Non riesco a togliere le foto da questo dispositivo."));
      tx.onabort = tx.onerror;
    });
  });
}
export function notebookLocalStore(scope = "fungaroli:diario:v1") {
  // Righe non leggibili: si mettono da parte invece di bloccare tutto il taccuino.
  const asideKey = scope + ":non-leggibili";
  const stored = (): { entries: NotebookEntry[]; unreadable: unknown[] } => {
    let value: unknown;
    try {
      value = JSON.parse(localStorage.getItem(scope) || "[]");
    } catch {
      throw Error(
        "Non riesco a leggere il taccuino salvato. Gli appunti restano conservati sul dispositivo.",
      );
    }
    if (!Array.isArray(value))
      throw Error(
        "Il taccuino salvato contiene dati non leggibili. Gli appunti restano conservati sul dispositivo.",
      );
    return {
      entries: value.filter(isEntry),
      unreadable: value.filter((x) => !isEntry(x)),
    };
  };
  const metadata = () => stored().entries;
  const setAside = (rows: unknown[]) => {
    if (!rows.length) return;
    let previous: unknown = [];
    try {
      previous = JSON.parse(localStorage.getItem(asideKey) || "[]");
    } catch {
      /* copia precedente illeggibile: si conserva soltanto la nuova */
    }
    const seen = new Set(
      (Array.isArray(previous) ? previous : []).map((x) => JSON.stringify(x)),
    );
    localStorage.setItem(
      asideKey,
      JSON.stringify([
        ...(Array.isArray(previous) ? previous : []),
        ...rows.filter((x) => !seen.has(JSON.stringify(x))),
      ]),
    );
  };
  const hydrate = async (entry: NotebookEntry): Promise<NotebookEntry> => {
    if (!entry.photo || !("key" in entry.photo)) return entry;
    const raw = await photoIO("get", entry.photo.key);
    const photo =
      isRecord(raw) &&
      typeof raw.data === "string" &&
      isFiniteNumber(raw.width) &&
      isFiniteNumber(raw.height)
        ? { data: raw.data, width: raw.width, height: raw.height }
        : null;
    return {
      ...entry,
      photo: photo || null,
      ...(!photo ? { photoUnavailable: true } : {}),
    };
  };
  async function write(entries: NotebookEntry[]) {
    if (!entries.every(isEntry))
      throw Error(
        "La nota contiene una foto non valida. Rifai la foto e riprova.",
      );
    const { entries: before, unreadable } = stored(),
      oldKeys = new Set(before.map(photoKey).filter((k): k is string => !!k)),
      written: string[] = [];
    try {
      const rows: NotebookEntry[] = [];
      for (const e of entries) {
        if (!e.photo || !("data" in e.photo)) {
          rows.push(e);
          continue;
        }
        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(e.photo.data),
        );
        const hash = Array.from(new Uint8Array(digest), (b) =>
            b.toString(16).padStart(2, "0"),
          ).join(""),
          key = scope + ":" + e.id + ":" + hash;
        await photoIO("put", key, e.photo);
        if (!oldKeys.has(key)) written.push(key);
        rows.push({
          ...e,
          photo: { key, width: e.photo.width, height: e.photo.height },
        });
      }
      setAside(unreadable);
      localStorage.setItem(scope, JSON.stringify(rows));
      const keep = new Set(rows.map(photoKey).filter((k): k is string => !!k));
      await Promise.all(
        [...oldKeys]
          .filter((k) => !keep.has(k))
          .map((k) => photoIO("delete", k).catch(() => {})),
      );
    } catch (error) {
      await Promise.all(
        written.map((k) => photoIO("delete", k).catch(() => {})),
      );
      throw error;
    }
  }
  return {
    kind: "local",
    async list() {
      return Promise.all(metadata().map(hydrate));
    },
    replace: (entries: NotebookEntry[]) => serial(scope, () => write(entries)),
    put: (e: NotebookEntry) =>
      serial(scope, () =>
        write([...metadata().filter((x) => x.id !== e.id), e]),
      ),
    remove: (id: string) =>
      serial(scope, () => write(metadata().filter((x) => x.id !== id))),
  };
}

function photoKey(entry: NotebookEntry): string | undefined {
  return entry.photo && "key" in entry.photo ? entry.photo.key : undefined;
}
function isEntry(value: unknown): value is NotebookEntry {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  const photo = value.photo;
  return (
    photo == null ||
    (isRecord(photo) &&
      isFiniteNumber(photo.width) &&
      isFiniteNumber(photo.height) &&
      (typeof photo.key === "string" || typeof photo.data === "string"))
  );
}
