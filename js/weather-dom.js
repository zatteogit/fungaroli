// Generated from src/js/weather-dom.ts. Run npm run build:typescript; do not edit.
// Background updates retain matching links, decoded photos and focused nodes.
// Use for display-only fragments whose actions are delegated, not chart widgets
// or controls with handlers that close over a particular forecast.
const identity = (node) => {
    const n = node;
    return n.nodeType === 1
        ? n.getAttribute("data-weather-key") ||
            n.id ||
            n.getAttribute("data-sec") ||
            n.getAttribute("data-day-offset") ||
            ""
        : "";
};
function compatible(a, b) {
    return (a.nodeType === b.nodeType &&
        (a.nodeType !== 1 || a.tagName === b.tagName) &&
        identity(a) === identity(b));
}
// Elementi il cui testo cambia davvero durante un aggiornamento (per una breve dissolvenza): si annota il testo di
// prima del genitore alla prima modifica e alla fine si tengono solo quelli diversi (una parola del glossario
// trasformata in link e poi riportata a testo non conta come cambiamento).
let tracking = null;
function patch(first, second) {
    const a = first, b = second;
    if (a.nodeType === 3) {
        if (a.textContent !== b.textContent) {
            const p = a.parentElement;
            if (tracking && p && !tracking.text.has(p))
                tracking.text.set(p, p.textContent);
            a.textContent = b.textContent;
        }
        return;
    }
    if (a.nodeType !== 1)
        return;
    if (a.tagName === "IMG") {
        const src = b.getAttribute("data-src") || b.getAttribute("src");
        if (src &&
            (a.getAttribute("src") === src || a.getAttribute("data-src") === src)) {
            if (a.getAttribute("alt") !== b.getAttribute("alt"))
                a.setAttribute("alt", b.getAttribute("alt") || "");
            return;
        }
    }
    for (const attr of [...a.attributes])
        if (!b.hasAttribute(attr.name) &&
            !["data-counted", "data-image-state"].includes(attr.name) &&
            !(a.matches("a.glossary-link,a[data-entity]") &&
                ["aria-expanded", "aria-controls"].includes(attr.name)))
            a.removeAttribute(attr.name);
    for (const attr of b.attributes)
        if (a.getAttribute(attr.name) !== attr.value)
            a.setAttribute(attr.name, attr.value);
    reconcileChildren(a, b);
}
// js/rails.js avvolge le righe che scorrono (giorni, strisce di foto) in un .rail-host con le frecce: per il confronto
// conta la riga dentro, e l'involucro si sposta con lei
const inner = (node) => {
    const n = node;
    return n.nodeType === 1 && n.classList.contains("rail-host")
        ? n.querySelector(":scope > :not(.rail-arrow)") || n
        : n;
};
// I nodi con data-dom-keep (l'alone dietro la testata, js/ambilight.js) non stanno nell'HTML: restano dove sono.
const kept = (n) => n?.nodeType === 1 && n.hasAttribute("data-dom-keep");
const skipKept = (n) => {
    while (kept(n))
        n = n?.nextSibling || null;
    return n;
};
export function reconcileChildren(target, source) {
    const unused = [...target.childNodes].filter((n) => !kept(n));
    let cursor = skipKept(target.firstChild);
    for (const desired of [...source.childNodes]) {
        const key = identity(desired);
        let actual = key
            ? unused.find((n) => compatible(inner(n), desired))
            : unused.find((n) => n === cursor && compatible(inner(n), desired));
        if (actual) {
            unused.splice(unused.indexOf(actual), 1);
            if (actual !== cursor)
                target.insertBefore(actual, cursor);
            patch(inner(actual), desired);
        }
        else {
            actual = desired;
            target.insertBefore(actual, cursor);
            if (tracking && actual.nodeType === 1)
                tracking.added.add(actual);
        }
        cursor = skipKept(actual.nextSibling);
    }
    unused.forEach((n) => n.remove());
}
export function updateWeatherHTML(target, html) {
    const fragment = document.createElement("template");
    fragment.innerHTML = html;
    reconcileChildren(target, fragment.content);
}
// Come updateWeatherHTML, e restituisce gli elementi con testo cambiato o nuovi.
export function updateHTMLTracked(target, html) {
    const t = (tracking = {
        text: new Map(),
        added: new Set(),
    });
    try {
        updateWeatherHTML(target, html);
    }
    finally {
        tracking = null;
    }
    const out = new Set([...t.added].filter((el) => el.isConnected));
    for (const [el, before] of t.text)
        if (el.isConnected && el.textContent !== before)
            out.add(el);
    return out;
}
export function keepWeatherReadingPosition(render) {
    const x = scrollX, y = scrollY, active = document.activeElement;
    const candidates = [
        ...document.querySelectorAll(".view:not([hidden]) details[data-sec]>summary,.view:not([hidden]) .phero-title"),
    ];
    const anchor = candidates.find((el) => el.getBoundingClientRect().bottom > 60), sec = anchor?.closest("[data-sec]")?.dataset.sec, top = anchor?.getBoundingClientRect().top;
    const photos = new Map();
    document
        .querySelectorAll(".view:not([hidden]) img")
        .forEach((img) => {
        const src = img.getAttribute("src") || img.dataset.src;
        if (src) {
            if (!photos.has(src))
                photos.set(src, []);
            photos.get(src).push(img);
        }
    });
    const focusId = active?.id, focusSec = active?.closest("[data-sec]")?.dataset.sec;
    render();
    document
        .querySelectorAll(".view:not([hidden]) img")
        .forEach((img) => {
        const src = img.dataset.src || img.getAttribute("src"), old = src ? photos.get(src)?.shift() : undefined;
        if (old && old !== img) {
            old.alt = img.alt;
            img.replaceWith(old);
        }
    });
    const next = sec
        ? document.querySelector(`.view:not([hidden]) [data-sec="${CSS.escape(sec)}"]>summary`)
        : document.querySelector(".view:not([hidden]) .phero-title");
    scrollTo({
        left: x,
        top: next && typeof top === "number" && Number.isFinite(top)
            ? y + next.getBoundingClientRect().top - top
            : y,
        behavior: "instant",
    });
    if (active !== document.body && !active?.isConnected) {
        const focus = focusId
            ? document.getElementById(focusId)
            : focusSec
                ? document.querySelector(`.view:not([hidden]) [data-sec="${CSS.escape(focusSec)}"]>summary`)
                : null;
        focus?.focus({ preventScroll: true });
    }
}
