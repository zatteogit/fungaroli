import type {
  NotebookNote,
  NoteCategory,
  PhenoObservation,
  PhenoPhase,
  PhenoCode,
} from "./notebook-types.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
import { normalizePosition } from "./field-device.js";
import { normalizeNotebookPhoto } from "./notebook-photo.js";
import { normalizeFieldRecord } from "./community-observation.js";
// Internal phase status absent means searched, not observed; it does not prove absence.
// Private notes have no forecast/finds payload and cannot become mushroom reports.
export const PHENO_PHASES: [PhenoCode, string][] = [
  ["young_leaves", "Foglie giovani"],
  ["open_flowers", "Fiori aperti"],
  ["unripe_fruits", "Frutti immaturi"],
  ["ripe_fruits", "Frutti maturi"],
  ["dry_fruits", "Frutti secchi"],
];
const refPattern =
  /^#\/(?:animale|pianta|albero|specie|fungo|commestibile|guide|glossario|giri)\/[a-zA-Z0-9%-]+$|^#\/zona\/[a-z0-9-]+(?:\/[0-7](?:\/sentiero\/[a-zA-Z0-9-]+)?)?$/;
function invalid(): never {
  throw new Error(
    "Appunto non valido: controlla titolo, giorno, testo e riferimento.",
  );
}
export function normalizeNotebookNote(
  input: unknown,
  {
    zoneIds,
    plantIds,
    now = Date.now(),
  }: {
    zoneIds?: ReadonlySet<string>;
    plantIds?: ReadonlySet<string>;
    now?: number;
  } = {},
): NotebookNote {
  if (!isRecord(input)) invalid();
  const e = input;
  if (
    !e ||
    e.kind !== "note" ||
    typeof e.id !== "string" ||
    !/^[a-zA-Z0-9-]{4,64}$/.test(e.id) ||
    typeof e.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(e.date)
  )
    invalid();
  const d = new Date(e.date + "T12:00:00Z");
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== e.date)
    invalid();
  if (
    typeof e.title !== "string" ||
    !e.title.trim() ||
    e.title.length > 120 ||
    typeof e.note !== "string" ||
    e.note.length > 2000 ||
    typeof e.category !== "string" ||
    ![
      "appunto",
      "percorso",
      "botanica",
      "fungo",
      "albero",
      "animale",
      "lettura",
    ].includes(e.category)
  )
    invalid();
  const zoneId = e.zoneId || null;
  if (
    zoneId &&
    (typeof zoneId !== "string" ||
      !/^[a-z0-9-]{1,40}$/.test(zoneId) ||
      (zoneIds && !zoneIds.has(zoneId)))
  )
    invalid();
  let reference: NotebookNote["reference"] = null,
    observation: PhenoObservation | null = null;
  if (e.reference != null) {
    if (!isRecord(e.reference)) invalid();
    if (
      typeof e.reference.href !== "string" ||
      !refPattern.test(e.reference.href) ||
      typeof e.reference.title !== "string" ||
      !e.reference.title.trim() ||
      e.reference.title.length > 160
    )
      invalid();
    reference = { href: e.reference.href, title: e.reference.title };
  }
  if (e.observation != null) {
    if (!isRecord(e.observation)) invalid();
    const o = e.observation,
      today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(now));
    if (e.date > today) invalid();
    if (
      e.category !== "botanica" ||
      typeof o.taxonId !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(o.taxonId) ||
      (plantIds && !plantIds.has(o.taxonId)) ||
      reference?.href !== `#/pianta/${o.taxonId}` ||
      !Array.isArray(o.phases) ||
      o.phases.length > PHENO_PHASES.length
    )
      invalid();
    const codes = new Set<unknown>();
    const phases: PhenoPhase[] = [];
    for (const p of o.phases as unknown[]) {
      if (!isRecord(p)) invalid();
      if (
        !PHENO_PHASES.some(([c]) => c === p.code) ||
        codes.has(p.code) ||
        typeof p.status !== "string" ||
        !["present", "absent", "unsure"].includes(p.status)
      )
        invalid();
      codes.add(p.code);
      phases.push({
        code: p.code as PhenoCode,
        status: p.status as PhenoPhase["status"],
      });
    }
    if (
      typeof o.availability !== "string" ||
      !["unknown", "none", "few", "many"].includes(o.availability) ||
      (o.minutes != null &&
        (!isFiniteNumber(o.minutes) ||
          !Number.isInteger(o.minutes) ||
          o.minutes < 1 ||
          o.minutes > 1440)) ||
      typeof o.patchLabel !== "string" ||
      o.patchLabel.length > 120
    )
      invalid();
    observation = {
      protocolVersion: "fungaroli-phenology-notes-v1",
      taxonId: o.taxonId,
      identification: "unreviewed",
      phases,
      availability: o.availability as PhenoObservation["availability"],
      minutes: (o.minutes as number | null | undefined) ?? null,
      patchLabel: o.patchLabel,
      locationPrecision: zoneId ? "zone" : "unspecified",
      researchConsent: false,
    };
  }
  const photo = normalizeNotebookPhoto(e.photo),
    position = normalizePosition(e.position);
  if (
    photo &&
    e.date >
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(now))
  )
    invalid();
  let weather: NotebookNote["weather"];
  if (e.weather != null) {
    if (!isRecord(e.weather)) invalid();
    const w = e.weather;
    if (
      w.zoneId !== zoneId ||
      w.date !== e.date ||
      typeof w.icon !== "string" ||
      !["sun", "cloud", "wind", "fog", "rain", "storm", "snow"].includes(
        w.icon,
      ) ||
      ![w.tmin, w.tmax].every(
        (v) => isFiniteNumber(v) && v >= -70 && v <= 60,
      ) ||
      !isFiniteNumber(w.tmin) ||
      !isFiniteNumber(w.tmax) ||
      w.tmin > w.tmax ||
      typeof w.capturedAt !== "string" ||
      !Number.isFinite(Date.parse(w.capturedAt))
    )
      invalid();
    weather = {
      zoneId: zoneId as string | null,
      date: e.date,
      icon: w.icon as NonNullable<NotebookNote["weather"]>["icon"],
      tmin: w.tmin,
      tmax: w.tmax,
      capturedAt: w.capturedAt,
    };
  }
  if (!reference && !e.note.trim() && !photo) invalid();
  return {
    ...(e.record != null
      ? { record: normalizeFieldRecord(e.record, e.category) }
      : {}),
    ...(photo ? { photo } : {}),
    ...(position ? { position } : {}),
    ...(weather ? { weather } : {}),
    id: e.id,
    kind: "note",
    title: e.title.trim(),
    category: e.category as NoteCategory,
    date: e.date,
    zoneId: zoneId as string | null,
    note: e.note,
    reference,
    observation,
    savedAt:
      typeof e.savedAt === "string" && Number.isFinite(Date.parse(e.savedAt))
        ? e.savedAt
        : new Date().toISOString(),
  };
}
