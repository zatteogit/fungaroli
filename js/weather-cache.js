// Generated from src/js/weather-cache.ts. Run npm run build:typescript; do not edit.
import { compactGrowth } from "./weather-data.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
export const WEATHER_FRESH_MS = 3600000;
export const GROWTH_FRESH_MS = 4 * WEATHER_FRESH_MS;
export const WEATHER_SYNC_MS = 5 * 60000;
export const WEATHER_LOCAL_RETENTION_MS = 6 * 86400000;
const key = (kind) => `fungaroli:${kind === "growth" ? "weather" : "outing"}:zones:v3`;
export const zoneWeatherSignature = (z, kind = "growth") => `${z.id}|${z.lat},${z.lon}|${(kind === "growth" ? z.bands : [z.bands[Math.floor(z.bands.length / 2)]]).join(",")}`;
const parsed = new Map();
const read = (kind) => {
    try {
        const raw = localStorage.getItem(key(kind)) || "{}", previous = parsed.get(kind);
        if (previous?.raw === raw)
            return previous.data;
        const value = JSON.parse(raw), data = isRecord(value) ? value : {};
        parsed.set(kind, { raw, data });
        return data;
    }
    catch {
        return {};
    }
};
export function weatherCacheNeedsSync(kind, now = Date.now()) {
    const records = Object.values(read(kind));
    return (!records.length ||
        records.some((r) => !isRecord(r) ||
            !isFiniteNumber(r.t) ||
            r.t > now ||
            now - r.t >= WEATHER_SYNC_MS ||
            r.stale));
}
export function validWeatherRows(raw, count, kind = "growth") {
    if (!Array.isArray(raw) || raw.length !== count)
        return false;
    const name = kind === "growth" ? "daily" : "hourly", required = kind === "growth"
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
    return raw.every((row) => {
        if (!isRecord(row))
            return false;
        const group = row[name];
        if (!isRecord(group) ||
            !Array.isArray(group.time) ||
            !group.time.length ||
            !group.time.every((t) => typeof t === "string"))
            return false;
        const count = group.time.length;
        return (required.every((f) => Array.isArray(group[f])) &&
            Object.entries(group).every(([k, values]) => k === "time" ||
                (Array.isArray(values) &&
                    values.length === count &&
                    values.every((v) => v === null || isFiniteNumber(v)))));
    });
}
export function cachedZoneWeather(z, kind = "growth", now = Date.now()) {
    const r = read(kind)[zoneWeatherSignature(z, kind)];
    if (!isRecord(r) ||
        !isFiniteNumber(r.t) ||
        r.t > now ||
        now - r.t > WEATHER_LOCAL_RETENTION_MS ||
        !validWeatherRows(r.raw, kind === "growth" ? z.bands.length : 1, kind))
        return null;
    return { t: r.t, raw: r.raw, stale: !!r.stale, local: true };
}
export function saveZoneWeather(z, kind, record, now = Date.now()) {
    if (!isRecord(record) ||
        !isFiniteNumber(record.t) ||
        record.t > now ||
        !validWeatherRows(record.raw, kind === "growth" ? z.bands.length : 1, kind))
        return;
    try {
        // Copia: se lo spazio è esaurito, la memoria non deve tenere dati mai salvati.
        const data = { ...read(kind) }, id = zoneWeatherSignature(z, kind), previous = data[id];
        if (isRecord(previous) &&
            isFiniteNumber(previous.t) &&
            previous.t > record.t)
            return;
        for (const [id, r] of Object.entries(data))
            if (!isRecord(r) ||
                !isFiniteNumber(r.t) ||
                now - r.t > WEATHER_LOCAL_RETENTION_MS)
                delete data[id];
        const rawRows = kind === "growth" && validWeatherRows(record.raw, z.bands.length)
            ? compactGrowth(record.raw)
            : record.raw;
        data[id] = { t: record.t, raw: rawRows, stale: !!record.stale };
        const raw = JSON.stringify(data);
        localStorage.setItem(key(kind), raw);
        parsed.set(kind, { raw, data });
    }
    catch {
        /* Storage failure must never discard live data. */
    }
}
const dropLegacy = (k) => {
    try {
        localStorage.removeItem(k);
    }
    catch { }
};
export function migrateGrowthCache(zones, now = Date.now()) {
    try {
        const c = JSON.parse(localStorage.getItem("fungaroli:weather:v2") || "null");
        if (!isRecord(c))
            return;
        const sig = zones
            .flatMap((z) => z.bands.map((b) => `${z.lat},${z.lon},${b}`))
            .join(";");
        if (!isFiniteNumber(c.t) || now - c.t > WEATHER_LOCAL_RETENTION_MS)
            return dropLegacy("fungaroli:weather:v2");
        if (typeof c.sig !== "string" ||
            c.sig.slice(c.sig.indexOf("|") + 1) !== sig ||
            c.t > now)
            return;
        let start = 0;
        const rows = Array.isArray(c.data) ? c.data : [];
        for (const z of zones) {
            if (!cachedZoneWeather(z, "growth", now))
                saveZoneWeather(z, "growth", { t: c.t, raw: rows.slice(start, start + z.bands.length) }, now);
            start += z.bands.length;
        }
        dropLegacy("fungaroli:weather:v2");
    }
    catch { }
}
export function migrateOutingCache(zones, now = Date.now()) {
    try {
        const c = JSON.parse(localStorage.getItem("fungaroli:outing:v2") || "null");
        if (!isRecord(c))
            return;
        const sig = zones
            .map((z) => `${z.lat},${z.lon},${z.bands[Math.floor(z.bands.length / 2)]}`)
            .join(";");
        if (!isFiniteNumber(c.t) || now - c.t > WEATHER_LOCAL_RETENTION_MS)
            return dropLegacy("fungaroli:outing:v2");
        if (typeof c.sig !== "string" ||
            c.sig.slice(c.sig.indexOf("|") + 1) !== sig ||
            c.t > now)
            return;
        const data = isRecord(c.data) ? c.data : {};
        for (const z of zones) {
            const s = data[z.id];
            if (!isRecord(s) || cachedZoneWeather(z, "outing", now))
                continue;
            saveZoneWeather(z, "outing", {
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
            }, now);
        }
        dropLegacy("fungaroli:outing:v2");
    }
    catch { }
}
