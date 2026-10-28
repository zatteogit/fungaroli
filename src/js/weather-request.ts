import type {
  ForecastOptions,
  ForecastResult,
  ForecastChunk,
} from "./weather-types.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
interface ForecastGroup {
  query: URLSearchParams;
  start: number;
}
// Il browser usa la cache condivisa del Worker; gli strumenti di esportazione
// possono interrogare direttamente il provider senza dipendere dal sito.
import {
  WEATHER_LOCAL_RETENTION_MS,
  weatherCacheNeedsSync,
} from "./weather-cache.js";
const API = "https://api.open-meteo.com/v1/forecast";
const prefetched = new Map<
  string,
  { promise: Promise<Response>; controller: AbortController; startedAt: number }
>();
export function prefetchWeatherSnapshots() {
  if (typeof window === "undefined") return;
  for (const profile of ["growth", "outing"] as const)
    if (weatherCacheNeedsSync(profile) && !prefetched.has(profile)) {
      const controller = new AbortController(),
        signal = AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(20000),
        ]);
      const promise = fetch(`/api/weather/v1/snapshot?profile=${profile}`, {
        cache: "no-store",
        signal,
      });
      prefetched.set(profile, { promise, controller, startedAt: Date.now() });
      void promise.catch(() => {});
    }
}
export async function fetchForecast(
  params: URLSearchParams,
  { onProgress, onChunk, signal: parentSignal }: ForecastOptions = {},
) {
  if (typeof document !== "undefined") {
    const coords = ["latitude", "longitude", "elevation"].map((name) =>
      params.get(name)!.split(","),
    );
    const groups: ForecastGroup[] = [];
    for (let start = 0; start < coords[0]!.length;) {
      let end = start + 1;
      while (
        end < coords[0]!.length &&
        coords[0]![end] === coords[0]![start] &&
        coords[1]![end] === coords[1]![start]
      )
        end++;
      const query = new URLSearchParams(params);
      ["latitude", "longitude", "elevation"].forEach((name, i) =>
        query.set(name, coords[i]!.slice(start, end).join(",")),
      );
      groups.push({ query, start });
      start = end;
    }
    // Una lettura per profilo dal deposito del server, al posto di un viaggio
    // HTTP per ogni zona. Le vecchie installazioni/server restano compatibili.
    // Una sola zona da aggiornare non scarica il pacchetto di tutte.
    let saved = new Map<number, ForecastChunk>();
    if (typeof window !== "undefined" && groups.length > 1)
      try {
        const bulk = await requestSnapshot(params, groups, {
          onChunk,
          onProgress,
          signal: parentSignal,
        });
        if (bulk && !bulk.partial) {
          const { chunks: _chunks, ...complete } = bulk;
          return complete;
        }
        if (bulk) saved = bulk.chunks;
      } catch (e) {
        // Pacchetto fallito (5xx, timeout, prefetch rotto): si passa alle zone,
        // a meno che sia stato l'utente ad annullare.
        if (parentSignal?.aborted) throw e;
      }
    // Solo le zone che il pacchetto non ha portato.
    const todo = groups.filter((g) => !saved.has(g.start));
    const results = new Map<
        number,
        | ForecastResult
        | { raw: null[]; fetchedAt?: undefined; stale?: undefined }
      >(),
      deadline = AbortSignal.timeout(45000);
    let next = 0,
      finished = saved.size,
      firstError: unknown;
    await Promise.all(
      Array.from({ length: Math.min(3, todo.length) }, async () => {
        while (next < todo.length) {
          const { query, start } = todo[next++]!,
            count = query.get("latitude")!.split(",").length;
          const signal = AbortSignal.any([
            deadline,
            AbortSignal.timeout(20000),
            ...(parentSignal ? [parentSignal] : []),
          ]);
          try {
            let received;
            try {
              received = await requestForecast(query, signal);
            } catch (e) {
              // Una risposta transitoria non deve cancellare tutte le altre zone.
              if (
                !signal.aborted &&
                isRecord(e) &&
                isFiniteNumber(e.status) &&
                e.status >= 500 &&
                e.code !== "cache-warming"
              )
                received = await requestForecast(query, signal);
              else throw e;
            }
            if (received.raw.length !== count)
              throw new Error("Serie meteo incompleta");
            onChunk?.({ ...received, start, count });
            if (received.refreshing) {
              // Publish the shared saved copy before awaiting its in-flight refresh.
              // If the refresh fails, keep that same dated copy in the result.
              try {
                const fresh = await requestForecast(query, signal, true);
                if (fresh.raw.length !== count)
                  throw new Error("Serie meteo incompleta");
                received = fresh;
                onChunk?.({ ...fresh, start, count });
              } catch {
                /* the saved response remains usable within its age limit */
              }
            }
            results.set(start, received);
          } catch (e) {
            firstError ??= e;
            results.set(start, { raw: Array(count).fill(null) });
          }
          onProgress?.(++finished, groups.length);
        }
      }),
    );
    const ordered = groups.map((g) => saved.get(g.start) || results.get(g.start)!);
    const valid = ordered.filter((r): r is ForecastResult => !!r.fetchedAt);
    if (!valid.length) throw firstError;
    return {
      raw: ordered.flatMap((r) => r.raw),
      fetchedAt: new Date(Math.min(...valid.map((r) => r.fetchedAt.getTime()))),
      stale: valid.some((r) => r.stale),
      partial: valid.length !== ordered.length,
    };
  }
  return requestForecast(params);
}
async function requestSnapshot(
  params: URLSearchParams,
  groups: ForecastGroup[],
  { onChunk, onProgress, signal: parentSignal }: ForecastOptions,
) {
  const profile = params.has("daily") ? "growth" : "outing";
  let early = prefetched.get(profile);
  prefetched.delete(profile);
  if (early && Date.now() - early.startedAt >= 20000) {
    early.controller.abort();
    early = undefined;
  }
  const signal = AbortSignal.any([
    AbortSignal.timeout(20000),
    ...(parentSignal ? [parentSignal] : []),
  ]);
  if (signal.aborted) throw signal.reason;
  const abort = () => early?.controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  let response;
  try {
    response = await (early?.promise ||
      fetch(`/api/weather/v1/snapshot?profile=${profile}`, {
        cache: "no-store",
        signal,
      }));
  } finally {
    signal.removeEventListener("abort", abort);
  }
  if ([404, 405].includes(response.status)) return null;
  if (!response.ok)
    throw Object.assign(new Error("La copia meteo non è disponibile."), {
      status: response.status,
    });
  if (
    response.headers.get("x-weather-format") !== "ndjson-v1" &&
    !response.headers.get("content-type")?.includes("application/x-ndjson")
  ) {
    await response.body?.cancel();
    return null;
  }
  const targets = new Map(
    groups.map((g) => [
      ["latitude", "longitude", "elevation"]
        .map((k) => g.query.get(k))
        .join("|"),
      g,
    ]),
  );
  if (!response.body) throw Error("Copia meteo incompleta.");
  const records = new Map<number, ForecastChunk>(),
    reader = response.body.getReader(),
    decoder = new TextDecoder();
  let pending = "";
  const accept = (line: string) => {
    if (!line.trim()) return;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      return;
    }
    if (
      !isRecord(row) ||
      typeof row.coordinates !== "string" ||
      !isRecord(row.record)
    )
      return;
    const group = targets.get(row.coordinates),
      record = row.record;
    if (
      !group ||
      !isFiniteNumber(record?.t) ||
      Date.now() - record.t > WEATHER_LOCAL_RETENTION_MS ||
      !Array.isArray(record.raw) ||
      record.raw.length !== group.query.get("latitude")!.split(",").length
    )
      return;
    const chunk = {
      raw: record.raw,
      fetchedAt: new Date(Math.min(record.t, Date.now())),
      stale: !!record.stale,
      start: group.start,
      count: record.raw.length,
    };
    records.set(group.start, chunk);
    onChunk?.(chunk);
    onProgress?.(records.size, groups.length);
  };
  const cancel = () => {
    void reader.cancel(signal.reason).catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw signal.reason;
      const { done, value } = await reader.read();
      if (signal.aborted) throw signal.reason;
      pending += decoder.decode(value || new Uint8Array(), { stream: !done });
      let end;
      while ((end = pending.indexOf("\n")) >= 0) {
        accept(pending.slice(0, end));
        pending = pending.slice(end + 1);
      }
      if (done) {
        accept(pending);
        break;
      }
    }
  } catch (error) {
    if (signal.aborted || !records.size) throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
  if (!records.size) throw new Error("Copia meteo incompleta.");
  const values = [...records.values()];
  return {
    raw: groups.flatMap(
      (g) =>
        records.get(g.start)?.raw ||
        Array(g.query.get("latitude")!.split(",").length).fill(null),
    ),
    fetchedAt: new Date(Math.min(...values.map((r) => r.fetchedAt.getTime()))),
    stale: values.some((r) => r.stale),
    partial: records.size !== groups.length,
    chunks: records,
  };
}
async function requestForecast(
  params: URLSearchParams,
  signal = AbortSignal.timeout(20000),
  waitForFresh = false,
) {
  const endpoint =
    typeof document === "undefined" ? API : "/api/weather/v1/forecast";
  const response = await fetch(`${endpoint}?${params}`, {
    cache: "no-store",
    signal,
    ...(waitForFresh ? { headers: { "x-weather-refresh": "1" } } : {}),
  });
  if (!response.ok) {
    let detail;
    try {
      const value: unknown = await response.json();
      detail = isRecord(value) ? value : undefined;
    } catch {
      /* risposta non JSON */
    }
    throw Object.assign(
      new Error(
        typeof detail?.error === "string"
          ? detail.error
          : response.status === 429
            ? "Il servizio meteo ha raggiunto il limite di richieste. Riprova tra poco."
            : "Il servizio meteo non è disponibile. Riprova tra poco.",
      ),
      { status: response.status, code: detail?.code },
    );
  }
  const raw: unknown = await response.json(),
    stamp = response.headers?.get("x-weather-fetched-at");
  const stamped = stamp ? new Date(stamp) : new Date();
  if (!Number.isFinite(stamped.getTime()))
    throw new Error(
      "Il meteo ricevuto non ha una data di aggiornamento valida.",
    );
  // Il server data la risposta con il proprio orologio: se quello del dispositivo è
  // indietro, una copia appena scaricata risulterebbe "dal futuro" e verrebbe scartata.
  const fetchedAt = new Date(Math.min(stamped.getTime(), Date.now()));
  return {
    raw: Array.isArray(raw) ? raw : [raw],
    fetchedAt,
    stale: response.headers?.get("x-weather-cache") === "stale",
    refreshing: response.headers?.get("x-weather-refreshing") === "1",
  };
}
export const weatherErrorMessage = (error: unknown) => {
  const err = isRecord(error) ? error : undefined;
  return err?.name === "TimeoutError" || err?.name === "AbortError"
    ? "Il meteo impiega troppo tempo a rispondere. Riprova tra poco."
    : err?.status
      ? String(err.message)
      : "Non riesco a ricevere il meteo. Verifica la connessione o riprova tra poco.";
};
