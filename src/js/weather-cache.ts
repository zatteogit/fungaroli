import { compactGrowth } from "./weather-data.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
import type {
  GrowthRow,
  OutingRow,
  WeatherRow,
  WeatherRecord,
  WeatherZone,
  WeatherProfile,
} from "./weather-types.js";
export const WEATHER_FRESH_MS = 3600000;
export const GROWTH_FRESH_MS = 4 * WEATHER_FRESH_MS;
export const WEATHER_SYNC_MS = 5 * 60000;
export const WEATHER_LOCAL_RETENTION_MS = 6 * 86400000;
const key = (kind: WeatherProfile) =>
  `fungaroli:${kind === "growth" ? "weather" : "outing"}:zones:v3`;
export const zoneWeatherSignature = (
  z: WeatherZone,
  kind: WeatherProfile = "growth",
) =>
  `${z.id}|${z.lat},${z.lon}|${(kind === "growth" ? z.bands : [z.bands[Math.floor(z.bands.length / 2)]]).join(",")}`;
const parsed = new Map<
  WeatherProfile,
  { raw: string; data: Record<string, unknown> }
>();
const read = (kind: WeatherProfile): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem(key(kind)) || "{}",
      previous = parsed.get(kind);
    if (previous?.raw === raw) return previous.data;
    const value: unknown = JSON.parse(raw),
      data = isRecord(value) ? value : {};
    parsed.set(kind, { raw, data });
    return data;
  } catch {
    return {};
  }
};
export function weatherCacheNeedsSync(kind: WeatherProfile, now = Date.now()) {
  const records = Object.values(read(kind));
  return (
    !records.length ||
    records.some(
      (r) =>
        !isRecord(r) ||
        !isFiniteNumber(r.t) ||
        r.t > now ||
        now - r.t >= WEATHER_SYNC_MS ||
        r.stale,
    )
  );
}
// Optional soil layers remain optional: older cache copies keep their original keys.
export function validWeatherRows(
  raw: unknown,
  count: number,
  kind?: "growth",
): raw is GrowthRow[];
export function validWeatherRows(
  raw: unknown,
  count: number,
  kind: "outing",
): raw is OutingRow[];
export function validWeatherRows(
  raw: unknown,
  count: number,
  kind: WeatherProfile,
): raw is WeatherRow[];
export function validWeatherRows(
  raw: unknown,
  count: number,
  kind: WeatherProfile = "growth",
): raw is WeatherRow[] {
  if (!Array.isArray(raw) || raw.length !== count) return false;
  const name = kind === "growth" ? "daily" : "hourly",
    required =
      kind === "growth"
        ? [
            "precipitation_sum",
            "temperature_2m_mean",
            "temperature_2m_min",
            "temperature_2m_max",
          ]
        : [
            "precipitation",
            "precipitation_probability",
            "weather_code",
            "wind_gusts_10m",
            "temperature_2m",
          ];
  return raw.every((row: unknown) => {
    if (!isRecord(row)) return false;
    const group = row[name];
    if (
      !isRecord(group) ||
      !Array.isArray(group.time) ||
      !group.time.length ||
      !group.time.every((t) => typeof t === "string")
    )
      return false;
    const count = group.time.length;
    return (
      required.every((f) => Array.isArray(group[f])) &&
      Object.entries(group).every(
        ([k, values]) =>
          k === "time" ||
          (Array.isArray(values) &&
            values.length === count &&
            values.every((v) => v === null || isFiniteNumber(v))),
      )
    );
  });
}
export function cachedZoneWeather(
  z: WeatherZone,
  kind?: "growth",
  now?: number,
): WeatherRecord<GrowthRow> | null;
export function cachedZoneWeather(
  z: WeatherZone,
  kind: "outing",
  now?: number,
): WeatherRecord<OutingRow> | null;
export function cachedZoneWeather(
  z: WeatherZone,
  kind: WeatherProfile = "growth",
  now = Date.now(),
): WeatherRecord | null {
  const r = read(kind)[zoneWeatherSignature(z, kind)];
  if (
    !isRecord(r) ||
    !isFiniteNumber(r.t) ||
    r.t > now ||
    now - r.t > WEATHER_LOCAL_RETENTION_MS ||
    !validWeatherRows(r.raw, kind === "growth" ? z.bands.length : 1, kind)
  )
    return null;
  return { t: r.t, raw: r.raw, stale: !!r.stale, local: true };
}
export function saveZoneWeather(
  z: WeatherZone,
  kind: WeatherProfile,
  record: unknown,
  now = Date.now(),
) {
  if (
    !isRecord(record) ||
    !isFiniteNumber(record.t) ||
    record.t > now ||
    !validWeatherRows(record.raw, kind === "growth" ? z.bands.length : 1, kind)
  )
    return;
  try {
    const data = read(kind),
      id = zoneWeatherSignature(z, kind),
      previous = data[id];
    if (
      isRecord(previous) &&
      isFiniteNumber(previous.t) &&
      previous.t > record.t
    )
      return;
    for (const [id, r] of Object.entries(data))
      if (
        !isRecord(r) ||
        !isFiniteNumber(r.t) ||
        now - r.t > WEATHER_LOCAL_RETENTION_MS
      )
        delete data[id];
    const rawRows =
      kind === "growth" && validWeatherRows(record.raw, z.bands.length)
        ? compactGrowth(record.raw)
        : record.raw;
    data[id] = { t: record.t, raw: rawRows, stale: !!record.stale };
    const raw = JSON.stringify(data);
    localStorage.setItem(key(kind), raw);
    parsed.set(kind, { raw, data });
  } catch {
    /* Storage failure must never discard live data. */
  }
}
const dropLegacy = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {}
};
export function migrateGrowthCache(zones: WeatherZone[], now = Date.now()) {
  try {
    const c: unknown = JSON.parse(
      localStorage.getItem("fungaroli:weather:v2") || "null",
    );
    if (!isRecord(c)) return;
    const sig = zones
      .flatMap((z) => z.bands.map((b) => `${z.lat},${z.lon},${b}`))
      .join(";");
    if (!isFiniteNumber(c.t) || now - c.t > WEATHER_LOCAL_RETENTION_MS)
      return dropLegacy("fungaroli:weather:v2");
    if (
      typeof c.sig !== "string" ||
      c.sig.slice(c.sig.indexOf("|") + 1) !== sig ||
      c.t > now
    )
      return;
    let start = 0;
    const rows = Array.isArray(c.data) ? c.data : [];
    for (const z of zones) {
      if (!cachedZoneWeather(z, "growth", now))
        saveZoneWeather(
          z,
          "growth",
          { t: c.t, raw: rows.slice(start, start + z.bands.length) },
          now,
        );
      start += z.bands.length;
    }
    dropLegacy("fungaroli:weather:v2");
  } catch {}
}
export function migrateOutingCache(zones: WeatherZone[], now = Date.now()) {
  try {
    const c: unknown = JSON.parse(
      localStorage.getItem("fungaroli:outing:v2") || "null",
    );
    if (!isRecord(c)) return;
    const sig = zones
      .map(
        (z) => `${z.lat},${z.lon},${z.bands[Math.floor(z.bands.length / 2)]}`,
      )
      .join(";");
    if (!isFiniteNumber(c.t) || now - c.t > WEATHER_LOCAL_RETENTION_MS)
      return dropLegacy("fungaroli:outing:v2");
    if (
      typeof c.sig !== "string" ||
      c.sig.slice(c.sig.indexOf("|") + 1) !== sig ||
      c.t > now
    )
      return;
    const data = isRecord(c.data) ? c.data : {};
    for (const z of zones) {
      const s = data[z.id];
      if (!isRecord(s) || cachedZoneWeather(z, "outing", now)) continue;
      saveZoneWeather(
        z,
        "outing",
        {
          t: typeof s.fetchedAt === "string" ? Date.parse(s.fetchedAt) : NaN,
          raw: [
            {
              hourly: {
                time: s.time,
                precipitation: s.p,
                precipitation_probability: s.pp,
                weather_code: s.wc,
                wind_gusts_10m: s.g,
                temperature_2m: s.t,
              },
            },
          ],
        },
        now,
      );
    }
    dropLegacy("fungaroli:outing:v2");
  } catch {}
}
