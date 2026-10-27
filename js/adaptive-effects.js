// Generated from src/js/adaptive-effects.ts. Run npm run build:typescript; do not edit.
export const EFFECTS_CHANGE = "fronda:effects-change";
const qualities = ["full", "reduced", "minimal"];
// Product heuristics, not device ratings or Web Vitals. Two poor windows lower
// decoration; restoring one level needs twelve clean windows and a long hold.
export function createEffectsPolicy() {
    let level = 0, bad = 0, good = 0, cadence = 0, changedAt = 0;
    return {
        get quality() { return qualities[level]; },
        resetEvidence(resetCadence = false) {
            bad = good = 0;
            if (resetCadence)
                cadence = 0;
        },
        read(frames, now) {
            const valid = frames.filter(n => Number.isFinite(n) && n >= 1 && n <= 1000);
            if (valid.length < 8)
                return qualities[level];
            const sorted = [...valid].sort((a, b) => a - b);
            const fast = Math.max(8, Math.min(34, sorted[Math.floor(sorted.length * .1)]));
            cadence = cadence ? Math.min(cadence, fast) : fast;
            const budget = Math.max(28, cadence * 1.7);
            const slow = valid.filter(n => n > budget).length / valid.length;
            const total = valid.reduce((sum, n) => sum + n, 0);
            const blocked = valid.reduce((sum, n) => sum + Math.max(0, n - budget), 0) / total;
            const long = valid.filter(n => n > 50).length;
            const poor = slow > .18 || (blocked > .18 && long >= 2) || sorted[Math.floor(sorted.length / 2)] > 38;
            const clean = !poor && slow < .05 && long === 0;
            bad = poor ? bad + 1 : 0;
            good = clean ? good + 1 : 0;
            if (bad >= 2 && level < 2) {
                level++;
                changedAt = now;
                bad = good = 0;
            }
            else if (good >= 12 && level > 0 && now - changedAt >= 30000) {
                level--;
                changedAt = now;
                bad = good = 0;
            }
            return qualities[level];
        },
    };
}
export function effectsQuality() {
    const quality = document.documentElement.dataset.effects;
    return quality === "minimal" || quality === "reduced" ? quality : "full";
}
let initialized = false;
export function initAdaptiveEffects() {
    if (initialized)
        return;
    initialized = true;
    const root = document.documentElement, policy = createEffectsPolicy();
    root.dataset.effects = "full";
    let frame = 0, last = 0, start = 0, until = 0;
    let warmUntil = performance.now() + 1500;
    let samples = [];
    const clearWindow = () => { last = start = 0; samples = []; };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; clearWindow(); };
    const tick = (time) => {
        frame = 0;
        if (document.hidden || time > until) {
            clearWindow();
            return;
        }
        if (last && time - last > 1000) {
            clearWindow();
            policy.resetEvidence();
        }
        if (last)
            samples.push(time - last);
        if (!start)
            start = time;
        last = time;
        if (time - start >= 1000 && samples.length >= 8) {
            const next = policy.read(samples, time);
            if (next !== root.dataset.effects) {
                root.dataset.effects = next;
                document.dispatchEvent(new CustomEvent(EFFECTS_CHANGE, { detail: { quality: next } }));
            }
            start = time;
            samples = [];
        }
        frame = requestAnimationFrame(tick);
    };
    const activity = () => {
        const now = performance.now();
        if (document.hidden || now < warmUntil || document.body.hasAttribute("data-legal-pending"))
            return;
        if (now - until > 4000)
            policy.resetEvidence();
        until = now + 1400;
        if (!frame)
            frame = requestAnimationFrame(tick);
    };
    // Capture also scroll inside a panel. Never read fields, DOM geometry, UA,
    // hardware identifiers or network data; sampling stops when interaction ends.
    for (const name of ["scroll", "wheel", "pointerdown", "keydown"])
        document.addEventListener(name, activity, { capture: true, passive: true });
    addEventListener("hashchange", activity);
    document.addEventListener("visibilitychange", () => {
        stop();
        policy.resetEvidence(true);
        until = 0;
        warmUntil = performance.now() + 800;
    });
    addEventListener("pagehide", stop);
    addEventListener("resize", () => { stop(); policy.resetEvidence(true); });
}
