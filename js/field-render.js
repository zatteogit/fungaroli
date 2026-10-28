// Generated from src/js/field-render.ts. Run npm run build:typescript; do not edit.
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function routeSvg(lines = [], position = null) {
    const points = lines
        .flat()
        .filter((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
    if (!points.length)
        return "<p>Non è disponibile una traccia per questa zona.</p>";
    const lats = points.map((p) => p[0]), lons = points.map((p) => p[1]), lat0 = Math.min(...lats), lat1 = Math.max(...lats), lon0 = Math.min(...lons), lon1 = Math.max(...lons), cos = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180);
    const dx = Math.max((lon1 - lon0) * cos, 0.00001), dy = Math.max(lat1 - lat0, 0.00001), scale = Math.min(540 / dx, 320 / dy), x = (lon) => 30 + (540 - dx * scale) / 2 + (lon - lon0) * cos * scale, y = (lat) => 30 + (320 - dy * scale) / 2 + (lat1 - lat) * scale;
    const paths = lines
        .filter((l) => l.length > 1)
        .map((l) => `<polyline points="${l.map(([lat, lon]) => `${x(lon).toFixed(2)},${y(lat).toFixed(2)}`).join(" ")}"/>`)
        .join("");
    const inside = position &&
        position.latitude >= lat0 &&
        position.latitude <= lat1 &&
        position.longitude >= lon0 &&
        position.longitude <= lon1;
    return `<svg class="field-route" viewBox="0 0 600 380" role="img" aria-label="Geometria del tratto mappato, nord in alto"><text x="565" y="27">N ↑</text><g>${paths}</g>${inside ? `<circle class="field-you" cx="${x(position.longitude)}" cy="${y(position.latitude)}" r="7"/>` : ""}</svg>${position ? `<p class="small">${inside ? "Punto rilevato sulla vista." : "Il punto rilevato è fuori dall’inquadratura della traccia."} Precisione circa ${Math.round(position.accuracy)} m. Non è una guida di navigazione.</p>` : ""}`;
}
function photoCredit(text, url, licenseUrl) {
    const link = (href, label) => typeof href === "string" && /^https?:\/\//.test(href)
        ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`
        : "";
    return text || url
        ? `<p class="small field-photo-credit">Foto: ${esc(text || "fonte documentata")}${link(url, "Fonte della foto")}${link(licenseUrl, "Licenza")}</p>`
        : "";
}
export function packHtml(p) {
    return `<header>${p.cover ? `<img class="field-cover" src="${esc(p.cover)}" alt="${esc(p.zone.title)}">` : ""}${p.cover ? photoCredit(p.coverCredit, p.coverCreditUrl, p.coverLicenseUrl) : ""}<p class="eyebrow">La tua uscita · ${esc(p.date)}</p><h1>${esc(p.zone.title)}</h1><p>${esc(p.zone.description)}</p><p class="small">Copia preparata ${new Date("savedAt" in p ? p.savedAt : p.preparedAt).toLocaleString("it-IT")}. Dati salvati, non aggiornamenti in tempo reale.</p></header>
 <section><h2>Meteo salvato</h2><p>${esc(p.weather?.text || "Meteo non disponibile al momento della preparazione.")}</p>${p.weather?.fetchedAt ? `<p class="small">Acquisito ${new Date(p.weather.fetchedAt).toLocaleString("it-IT")} · verifica le previsioni prima di partire.</p>` : ""}</section>
 <section><h2>${esc(p.trail?.name || "Il luogo")}</h2>${p.trail ? `<p>${esc(p.trail.difficulty)} · ${esc(p.trail.length)} km nel tratto mappato</p>` : ""}<div data-field-map>${routeSvg(p.trail?.lines)}</div><p class="small">Traccia schematica offline · nord in alto · senza sfondo cartografico. © contributori OpenStreetMap · ODbL. Può essere solo un tratto: raccordi, ritorno e condizioni sul posto vanno verificati.</p><div class="field-actions" data-field-map-tools></div></section>
 <section><h2>Accesso e regole</h2><p>${esc(p.zone.access || "Accesso da verificare sul posto.")}</p>${p.zone.parking?.map((a) => `<p>${esc(a.name)} · sosta e disponibilità da confermare.</p>`).join("") || ""}${p.zone.protection ? `<p>${esc(p.zone.protection)}</p>` : ""}<p>${esc(p.rules)}</p></section>
 ${p.species.length ? `<section><h2>Schede da portare con te</h2><p>Specie selezionate per questa uscita. Le fotografie non documentano ritrovamenti locali e non certificano un’identificazione.</p>${p.species.map((s) => `<article class="field-species">${s.photo ? `<img src="${esc(s.photo)}" alt="${esc(s.name)}">` : ""}<h3>${esc(s.name)}</h3><p><i>${esc(s.latin)}</i></p><p>${esc(s.description)}</p>${s.features?.length ? `<ul>${s.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}${s.caution ? `<p class="field-caution">${esc(s.caution)}</p>` : ""}${s.lookalikes?.length ? `<h4>Specie simili documentate</h4><ul>${s.lookalikes.map((l) => `<li>${esc(l.name || l.latin)}${l.diff ? " · " + esc(l.diff) : ""}${l.risk ? " · " + esc(l.risk) : ""}</li>`).join("")}</ul>` : ""}${photoCredit(s.credit, s.creditUrl, s.licenseUrl)}<p class="small">${s.sources?.map((r) => `<a href="${esc(r.url)}" rel="noopener" target="_blank">${esc(r.title || r.name || r.url)}</a>`).join(" · ") || ""}</p></article>`).join("")}</section>` : ""}
 <p class="field-caution">Fronda descrive ambienti e caratteri. Non identifica esemplari né certifica commestibilità. Verifica regole, meteo e condizioni del sentiero prima di uscire.</p>`;
}
export function routeGpx(pack) {
    const segments = (pack.trail?.lines || [])
        .filter((line) => line.length > 1)
        .map((line) => "<trkseg>" +
        line
            .map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"/>`)
            .join("") +
        "</trkseg>")
        .join("");
    return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Fronda" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${esc(pack.zone.title)}</name><desc>Tratto del catalogo Fronda, non necessariamente itinerario completo. © contributori OpenStreetMap · ODbL.</desc></metadata><trk><name>${esc(pack.trail?.name || pack.zone.title)}</name>${segments}</trk></gpx>`;
}
