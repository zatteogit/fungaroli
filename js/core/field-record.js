// Generated from src/js/core/field-record.ts. Run npm run build:typescript; do not edit.
import { isRecord, isFiniteNumber } from "./guards.js";
// Osservazioni dichiarate: separate dai report fungini e dalla taratura automatica.
export const PRESENCE = [
    ["unknown", "Non indicato"],
    ["observed", "Osservato"],
    ["searched_absent", "Cercato, non osservato"],
];
export const HABITATS = [
    ["unknown", "Non indicato"],
    ["broadleaf", "Bosco di latifoglie"],
    ["conifer", "Conifere"],
    ["mixed", "Bosco misto"],
    ["grassland", "Prato o pascolo"],
    ["other", "Altro ambiente"],
];
// Sforzo dell'appunto sul fungo (D3, decisioni di Matteo del 16 e del 24/10/2026): durata in classi, ricerca
// conclusa e motivo di fine. La durata è obbligatoria solo per «Cercato, non osservato» negli appunti v2; gli appunti
// v1 restano validi come sono e i loro minuti si leggono nella classe corrispondente.
export const EFFORT_CLASSES = [
    ["lt30", "Meno di 30 minuti", 1, 29],
    ["30-60", "Da 30 a 60 minuti", 30, 60],
    ["60-120", "Da 1 a 2 ore", 61, 120],
    ["gt120", "Più di 2 ore", 121, 1440],
];
export const STOP_REASONS = [
    ["planned_time", "Tempo previsto finito"],
    ["found_target", "Ho trovato quello che cercavo"],
    ["weather", "Meteo"],
    ["other", "Altro"],
];
export const FIELD_NOTE_V2 = "fronda-field-note-v2";
export const effortClassFor = (minutes) => isFiniteNumber(minutes) && Number.isInteger(minutes)
    ? (EFFORT_CLASSES.find(([, , min, max]) => minutes >= min && minutes <= max)?.[0] ?? null)
    : null;
export function normalizeFieldRecord(input, category = null) {
    function fail(message = "Osservazione non valida: controlla presenza, quantità e sforzo.") {
        throw new Error(message);
    }
    if (!isRecord(input))
        fail();
    const record = input;
    if (!PRESENCE.some(([k]) => k === record.presence) ||
        !HABITATS.some(([k]) => k === record.habitat))
        fail();
    const number = (key, min, max) => {
        const v = record[key];
        if (v == null || v === "")
            return null;
        if (!isFiniteNumber(v) || !Number.isInteger(v) || v < min || v > max)
            fail();
        return v;
    };
    const amount = number("amount", 0, 3);
    if ((record.presence === "searched_absent" && amount != null && amount !== 0) ||
        (record.presence === "observed" && amount === 0) ||
        (record.presence === "unknown" && amount != null))
        fail();
    const minutes = number("minutes", 1, 1440), v2 = record.protocolVersion === FIELD_NOTE_V2;
    const effortClass = record.effortClass ?? null, completed = record.completed ?? null, stopReason = record.stopReason ?? null;
    if ((effortClass !== null &&
        !EFFORT_CLASSES.some(([k]) => k === effortClass)) ||
        (completed !== null && typeof completed !== "boolean") ||
        (stopReason !== null && !STOP_REASONS.some(([k]) => k === stopReason)))
        fail();
    if (minutes !== null &&
        effortClass !== null &&
        effortClassFor(minutes) !== effortClass)
        fail();
    if (record.presence === "unknown" &&
        (completed !== null || stopReason !== null))
        fail();
    if (record.presence === "searched_absent" && stopReason === "found_target")
        fail();
    if (v2 &&
        category === "fungo" &&
        record.presence === "searched_absent" &&
        effortClass === null &&
        minutes === null)
        fail("Indica per quanto tempo hai cercato: senza durata una ricerca a vuoto non si può leggere.");
    return {
        protocolVersion: v2 ? FIELD_NOTE_V2 : "fronda-field-note-v1",
        presence: record.presence,
        amount: record.presence === "searched_absent" ? 0 : amount,
        minutes,
        effortClass: effortClass ?? effortClassFor(minutes),
        completed: completed,
        stopReason: stopReason,
        people: number("people", 1, 100),
        elevation: number("elevation", 0, 4500),
        habitat: record.habitat,
        identification: "unreviewed",
    };
}
