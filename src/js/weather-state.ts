// Public forecast state survives partial responses and unavailable device storage.
// Timestamps belong to provider acquisitions, never to a cache read.
import type { GrowthMap, OutingMap } from "./weather-types.js";
function merge<T>(
  previous: Record<string, T> | null | undefined,
  incoming: Record<string, T> | null | undefined,
  stamp: (value: T | undefined) => number,
) {
  const result = { ...previous };
  for (const [id, value] of Object.entries(incoming || {})) {
    const old = stamp(result[id]),
      next = stamp(value);
    if (Number.isFinite(next) && (!Number.isFinite(old) || next >= old))
      result[id] = value;
  }
  return result;
}
export const mergeGrowth = (
  previous: GrowthMap | null | undefined,
  incoming: GrowthMap | null | undefined,
) =>
  merge(previous, incoming, (value) =>
    Date.parse(value?.[0]?.source?.fetchedAt || ""),
  );
export const mergeOuting = (
  previous: OutingMap | null | undefined,
  incoming: OutingMap | null | undefined,
) => merge(previous, incoming, (value) => Date.parse(value?.fetchedAt || ""));

// A retained in-memory copy must age even when both disk and network fail.
export function rebaseGrowth(
  series: GrowthMap | null | undefined,
  today: string,
  now = Date.now(),
  maxAge = 24 * 3600000,
) {
  return Object.fromEntries(
    Object.entries(series || {}).map(([id, rows]) => [
      id,
      rows.map((s) => {
        const t = Date.parse(s.source?.fetchedAt || ""),
          expired = !Number.isFinite(t) || now < t || now - t > maxAge;
        const todayIndex = s.dates.indexOf(today);
        return s.todayIndex === todayIndex && s.source?.expired === expired
          ? s
          : { ...s, todayIndex, source: { ...s.source, expired } };
      }),
    ]),
  );
}
