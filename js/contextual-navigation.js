// Generated from src/js/contextual-navigation.ts. Run npm run build:typescript; do not edit.
import { stepDockSpring } from "./navigation-dock.js";
const notePages = new Set([
    "diario",
    "zona",
    "specie-dettaglio",
    "fungo",
    "commestibile",
    "pianta",
    "albero",
    "animale",
    "guide",
]);
export function contextCanAnnotate(page) {
    return notePages.has(page);
}
// Header occupancy changes with the page, profile and font. A viewport breakpoint
// cannot tell us whether labels actually fit. Never measure on the scroll path.
function desktopNavigationFit(bar) {
    const desktop = matchMedia("(min-width:900px)");
    const header = document.querySelector(".appbar");
    const destinations = bar.querySelector(".tab-destinations");
    let queued = 0, actionNeeded = false;
    const fit = (reserveAction) => {
        actionNeeded = reserveAction;
        if (!desktop.matches || !header || !destinations) {
            delete bar.dataset.fitReady;
            delete bar.dataset.labels;
            return;
        }
        const head = header.getBoundingClientRect();
        let left = head.left, right = head.right;
        for (const item of header.querySelectorAll(".brand,.brand-place,.appbar-actions")) {
            const r = item.getBoundingClientRect();
            if (!r.width || getComputedStyle(item).visibility === "hidden")
                continue;
            if (item.classList.contains("appbar-actions"))
                right = Math.min(right, r.left - 16);
            else
                left = Math.max(left, r.right + 16);
        }
        bar.style.setProperty("--nav-left", `${left}px`);
        bar.style.setProperty("--nav-right", `${Math.max(0, document.documentElement.clientWidth - right)}px`);
        bar.dataset.fitReady = "";
        // Full labels are the default. Read their natural size before choosing a
        // fallback in this same frame, so no hidden measuring copy enters the DOM.
        bar.dataset.labels = "full";
        const css = getComputedStyle(bar);
        const needed = destinations.getBoundingClientRect().width +
            (reserveAction ? parseFloat(css.getPropertyValue("--nav-action-size")) + 8 : 0);
        if (needed > right - left)
            bar.dataset.labels = "compact";
        bar.style.setProperty("--nav-destinations-width", `${destinations.getBoundingClientRect().width}px`);
    };
    const schedule = () => {
        if (!queued)
            queued = requestAnimationFrame(() => { queued = 0; fit(actionNeeded); });
    };
    const observer = new ResizeObserver(schedule);
    for (const item of header?.querySelectorAll(".brand,.brand-place,.appbar-actions") || [])
        observer.observe(item);
    addEventListener("resize", schedule, { passive: true });
    desktop.addEventListener("change", schedule);
    document.fonts.ready.then(schedule);
    document.fonts.addEventListener("loadingdone", schedule);
    return fit;
}
export function initContextualNavigation() {
    const bar = document.querySelector(".tabbar");
    const slot = document.querySelector(".tab-action-slot");
    const action = slot?.querySelector("[data-annotate]");
    const views = document.getElementById("views");
    if (!bar || !slot || !action || !views)
        return;
    const fitDesktop = desktopNavigationFit(bar);
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    const seen = new Set();
    let value = 0, velocity = 0, target = 0, frame = 0, previous = 0, queued = 0;
    let pressing = false, pressedRoute = null;
    const paint = () => {
        bar.style.setProperty("--nav-action", String(Math.max(0, Math.min(1, value))));
        bar.dataset.actionVisible = String(target === 1);
        bar.dataset.actionCollapsed = String(target === 0 && value < 0.0005);
        const usable = target === 1 && value >= 0.98;
        slot.inert = !usable;
        slot.setAttribute("aria-hidden", String(!usable));
        action.disabled = !usable;
    };
    const held = () => pressing || action.matches(":focus-visible");
    const tick = (time) => {
        frame = 0;
        if (held() || document.hidden) {
            previous = 0;
            return;
        }
        if (reduced.matches) {
            value = target;
            velocity = 0;
            paint();
            fitDesktop(target === 1);
            return;
        }
        const next = stepDockSpring(value, velocity, target, previous ? (time - previous) / 1000 : 1 / 60);
        previous = time;
        value = next.value;
        velocity = next.velocity;
        paint();
        if (!next.settled)
            frame = requestAnimationFrame(tick);
        else {
            previous = 0;
            fitDesktop(target === 1);
        }
    };
    const animate = () => {
        if (held())
            return;
        if (reduced.matches) {
            cancelAnimationFrame(frame);
            frame = 0;
            value = target;
            velocity = 0;
            previous = 0;
            paint();
            fitDesktop(target === 1);
        }
        else if (!frame && (value !== target || velocity)) {
            previous = 0;
            frame = requestAnimationFrame(tick);
        }
    };
    const choose = () => {
        if (held())
            return;
        const wanted = contextCanAnnotate(document.body.dataset.page || "") && seen.size === 0;
        target = wanted ? 1 : 0;
        fitDesktop(target === 1 || value > 0.0005);
        animate();
        paint();
    };
    const intersection = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6)
                seen.add(entry.target);
            else
                seen.delete(entry.target);
        }
        choose();
    }, { threshold: [0, 0.6, 1], rootMargin: "-64px 0px -88px 0px" });
    const refresh = () => {
        queued = 0;
        intersection.disconnect();
        seen.clear();
        const page = views.querySelector(".view:not([hidden])");
        if (!pressing) {
            const inline = page?.querySelector(".notebook-context-action");
            for (const key of [
                "noteKind",
                "noteId",
                "noteTitle",
                "noteZone",
                "noteHref",
            ]) {
                const next = inline?.dataset[key];
                if (next)
                    action.dataset[key] = next;
                else
                    delete action.dataset[key];
            }
        }
        for (const button of page?.querySelectorAll("[data-annotate],.notebook-context-action") || []) {
            const r = button.getBoundingClientRect();
            if (!r.width ||
                !r.height ||
                getComputedStyle(button).visibility === "hidden")
                continue;
            intersection.observe(button);
            const visible = Math.max(0, Math.min(r.bottom, innerHeight - 88) - Math.max(r.top, 64));
            if (visible / r.height >= 0.6)
                seen.add(button);
        }
        choose();
    };
    const schedule = () => {
        if (!queued)
            queued = requestAnimationFrame(refresh);
    };
    new MutationObserver(schedule).observe(views, {
        childList: true,
        subtree: true,
    });
    new MutationObserver(schedule).observe(document.body, {
        attributes: true,
        attributeFilter: ["data-page"],
    });
    bar.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary)
            return;
        pressing = true;
        pressedRoute = location.hash;
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
    }, { capture: true, passive: true });
    // A route changed while pressed: never annotate a different context on release.
    action.addEventListener("click", (event) => {
        if (pressedRoute !== null && pressedRoute !== location.hash) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        pressedRoute = null;
    }, { capture: true });
    const release = () => {
        pressing = false;
        requestAnimationFrame(() => {
            pressedRoute = null;
            schedule();
            animate();
        });
    };
    action.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
            pressing = true;
            pressedRoute = location.hash;
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
        }
    });
    addEventListener("keyup", (event) => {
        if (event.key === "Enter" || event.key === " ")
            release();
    });
    addEventListener("pointerup", release, { passive: true });
    addEventListener("pointercancel", release, { passive: true });
    addEventListener("blur", release);
    bar.addEventListener("focusout", schedule);
    addEventListener("hashchange", schedule);
    addEventListener("resize", schedule, { passive: true });
    reduced.addEventListener("change", animate);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        else {
            schedule();
            animate();
        }
    });
    refresh();
}
