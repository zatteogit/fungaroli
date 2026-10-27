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
export function contextCanAnnotate(page: string): boolean {
  return notePages.has(page);
}

export function initContextualNavigation(): void {
  const bar = document.querySelector<HTMLElement>(".tabbar");
  const slot = document.querySelector<HTMLElement>(".tab-action-slot");
  const action = slot?.querySelector<HTMLButtonElement>("[data-annotate]");
  const views = document.getElementById("views");
  if (!bar || !slot || !action || !views) return;
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const seen = new Set<Element>();
  let value = 0,
    velocity = 0,
    target = 0,
    frame = 0,
    previous = 0,
    queued = 0;
  let pressing = false,
    pressedRoute: string | null = null;
  const paint = () => {
    bar.style.setProperty(
      "--nav-action",
      String(Math.max(0, Math.min(1, value))),
    );
    bar.dataset.actionVisible = String(target === 1);
    bar.dataset.actionCollapsed = String(target === 0 && value < 0.0005);
    const usable = target === 1 && value >= 0.98;
    slot.inert = !usable;
    slot.setAttribute("aria-hidden", String(!usable));
    action.disabled = !usable;
  };
  const held = () => pressing || action.matches(":focus-visible");
  const tick = (time: number) => {
    frame = 0;
    if (held() || document.hidden) {
      previous = 0;
      return;
    }
    if (reduced.matches) {
      value = target;
      velocity = 0;
      paint();
      return;
    }
    const next = stepDockSpring(
      value,
      velocity,
      target,
      previous ? (time - previous) / 1000 : 1 / 60,
    );
    previous = time;
    value = next.value;
    velocity = next.velocity;
    paint();
    if (!next.settled) frame = requestAnimationFrame(tick);
    else previous = 0;
  };
  const animate = () => {
    if (held()) return;
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      value = target;
      velocity = 0;
      previous = 0;
      paint();
    } else if (!frame && (value !== target || velocity)) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  };
  const choose = () => {
    if (held()) return;
    const wanted =
      contextCanAnnotate(document.body.dataset.page || "") && seen.size === 0;
    target = wanted ? 1 : 0;
    animate();
    paint();
  };
  const intersection = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6)
          seen.add(entry.target);
        else seen.delete(entry.target);
      }
      choose();
    },
    { threshold: [0, 0.6, 1], rootMargin: "-64px 0px -88px 0px" },
  );
  const refresh = () => {
    queued = 0;
    intersection.disconnect();
    seen.clear();
    const page = views.querySelector<HTMLElement>(".view:not([hidden])");
    if (!pressing) {
      const inline = page?.querySelector<HTMLElement>(
        ".notebook-context-action",
      );
      for (const key of [
        "noteKind",
        "noteId",
        "noteTitle",
        "noteZone",
        "noteHref",
      ]) {
        const next = inline?.dataset[key];
        if (next) action.dataset[key] = next;
        else delete action.dataset[key];
      }
    }

    for (const button of page?.querySelectorAll<HTMLElement>(
      "[data-annotate],.notebook-context-action",
    ) || []) {
      const r = button.getBoundingClientRect();
      if (
        !r.width ||
        !r.height ||
        getComputedStyle(button).visibility === "hidden"
      )
        continue;
      intersection.observe(button);
      const visible = Math.max(
        0,
        Math.min(r.bottom, innerHeight - 88) - Math.max(r.top, 64),
      );
      if (visible / r.height >= 0.6) seen.add(button);
    }
    choose();
  };
  const schedule = () => {
    if (!queued) queued = requestAnimationFrame(refresh);
  };
  new MutationObserver(schedule).observe(views, {
    childList: true,
    subtree: true,
  });
  new MutationObserver(schedule).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-page"],
  });
  bar.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary) return;
      pressing = true;
      pressedRoute = location.hash;
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    },
    { capture: true, passive: true },
  );
  // A route changed while pressed: never annotate a different context on release.
  action.addEventListener(
    "click",
    (event) => {
      if (pressedRoute !== null && pressedRoute !== location.hash) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      pressedRoute = null;
    },
    { capture: true },
  );
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
    if (event.key === "Enter" || event.key === " ") release();
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
    } else {
      schedule();
      animate();
    }
  });
  refresh();
}
