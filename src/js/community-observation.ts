import type { NotebookNote, SharedObservation } from "./notebook-types.js";
import { normalizeFieldRecord } from "./core/field-record.js";
// Le regole delle osservazioni stanno nel nucleo portatile (src/js/core): questo modulo resta l'ingresso pubblico.
export { PRESENCE, HABITATS, EFFORT_CLASSES, STOP_REASONS, FIELD_NOTE_V2, effortClassFor, normalizeFieldRecord } from "./core/field-record.js";
export function sharedObservation(
  entry: NotebookNote,
  {
    now = Date.now(),
    references,
    zoneIds,
  }: {
    now?: number;
    references?: ReadonlySet<string>;
    zoneIds?: ReadonlySet<string>;
  } = {},
): SharedObservation {
  const record = normalizeFieldRecord(entry.record, entry.category),
    reference = entry.reference;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  const prefixes: Partial<Record<NotebookNote["category"], RegExp>> = {
    animale: /^#\/animale\//,
    fungo: /^#\/(fungo|specie|commestibile)\//,
    botanica: /^#\/pianta\//,
    albero: /^#\/albero\//,
  };
  const prefix = prefixes[entry.category];
  if (
    entry.kind !== "note" ||
    !prefix ||
    !reference ||
    !prefix.test(reference.href) ||
    (references && !references.has(reference.href)) ||
    !entry.zoneId ||
    (zoneIds && !zoneIds.has(entry.zoneId)) ||
    entry.date > today ||
    record.presence === "unknown"
  )
    throw new Error(
      "Per condividere indica specie, zona, giorno e osservazione.",
    );
  return {
    category: entry.category,
    taxonId: reference.href.split("/").at(-1)!,
    reference: reference.href,
    zoneId: entry.zoneId,
    day: entry.date,
    ...record,
    phases:
      entry.observation?.phases?.map((p) => ({
        code: p.code,
        status: p.status,
      })) || [],
    availability: entry.observation?.availability || "unknown",
    validation: "unreviewed",
  };
}
