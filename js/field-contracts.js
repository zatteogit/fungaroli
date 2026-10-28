// Generated from src/js/field-contracts.ts. Run npm run build:typescript; do not edit.
// TypeScript cannot validate JSON, IndexedDB or the remaining JavaScript app.
export function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw Error("Dati dell’uscita non validi. Riapri l’uscita e riprova.");
    return value;
}
function text(value) {
    if (typeof value !== "string")
        throw Error("Testo dell’uscita non valido.");
    return value;
}
function optionalText(value) {
    return value == null ? undefined : text(value);
}
function array(value) {
    if (value == null)
        return [];
    if (!Array.isArray(value))
        throw Error("Elenco dell’uscita non valido.");
    return value;
}
function timestamp(value) {
    const result = text(value);
    if (!Number.isFinite(Date.parse(result)))
        throw Error("Data dell’uscita non valida.");
    return result;
}
function finite(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
        throw Error("Valore dell’uscita non valido.");
    return value;
}
function lines(value) {
    return array(value).map((line) => array(line).map((point) => {
        const pair = array(point);
        if (pair.length !== 2)
            throw Error("Traccia dell’uscita non valida.");
        const lat = finite(pair[0]), lon = finite(pair[1]);
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180)
            throw Error("Traccia dell’uscita non valida.");
        return [lat, lon];
    }));
}
function species(value) {
    const s = record(value);
    if (s.kind !== "plant" && s.kind !== "fungus")
        throw Error("Scheda dell’uscita non valida.");
    return {
        kind: s.kind,
        name: text(s.name),
        latin: optionalText(s.latin),
        description: optionalText(s.description),
        features: array(s.features).map(text),
        caution: optionalText(s.caution),
        photo: optionalText(s.photo),
        credit: optionalText(s.credit),
        creditUrl: optionalText(s.creditUrl),
        licenseUrl: optionalText(s.licenseUrl),
        lookalikes: array(s.lookalikes).map((value) => {
            const l = record(value);
            return {
                name: optionalText(l.name),
                latin: optionalText(l.latin),
                diff: optionalText(l.diff),
                risk: optionalText(l.risk),
            };
        }),
        sources: array(s.sources).map((value) => {
            const r = record(value);
            return {
                url: text(r.url),
                title: optionalText(r.title),
                name: optionalText(r.name),
            };
        }),
    };
}
/** Rebuild a public snapshot; extra fields (including private GPS) never persist. */
export function parseFieldPack(value) {
    const p = record(value), z = record(p.zone);
    if (p.version !== 1)
        throw Error("Versione della copia offline non supportata.");
    let trail = null, weather = null;
    if (p.trail != null) {
        const t = record(p.trail);
        const id = typeof t.id === "number" ? finite(t.id) : text(t.id);
        trail = {
            id,
            name: text(t.name),
            difficulty: optionalText(t.difficulty),
            length: t.length == null ? undefined : finite(t.length),
            lines: lines(t.lines),
        };
    }
    if (p.weather != null) {
        const w = record(p.weather), level = w.level;
        if (level != null &&
            level !== "ok" &&
            level !== "attenzione" &&
            level !== "sconsigliata")
            throw Error("Meteo salvato non valido.");
        weather = {
            text: text(w.text),
            level: level ?? undefined,
            fetchedAt: w.fetchedAt == null ? undefined : timestamp(w.fetchedAt),
        };
    }
    return {
        version: 1,
        id: text(p.id),
        preparedAt: timestamp(p.preparedAt),
        date: text(p.date),
        zone: {
            id: text(z.id),
            title: text(z.title),
            description: optionalText(z.description),
            access: optionalText(z.access),
            protection: optionalText(z.protection),
            parking: array(z.parking).map((value) => ({
                name: text(record(value).name),
            })),
        },
        cover: optionalText(p.cover),
        coverCredit: optionalText(p.coverCredit),
        coverCreditUrl: optionalText(p.coverCreditUrl),
        coverLicenseUrl: optionalText(p.coverLicenseUrl),
        trail,
        weather,
        rules: text(p.rules),
        species: array(p.species).map(species),
    };
}
export function parseStoredFieldPack(value) {
    const p = record(value);
    return {
        ...parseFieldPack(p),
        cache: text(p.cache),
        bytes: finite(p.bytes),
        savedAt: timestamp(p.savedAt),
    };
}
export function errorMessage(error) {
    return error instanceof Error
        ? error.message
        : "Operazione non riuscita. Riprova.";
}
