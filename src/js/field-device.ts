import type { PrivatePosition, NoteLocationOptions } from "./types.js";
import { errorMessage } from "./field-contracts.js";
// Device features are offered when available, never inferred from the OS name.
export function normalizePosition(value: unknown): PrivatePosition | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw Error("Il punto privato non è valido. Rileva di nuovo la posizione.");
  const point = value as Record<string, unknown>;
  if (
    typeof point.latitude !== "number" ||
    typeof point.longitude !== "number" ||
    typeof point.accuracy !== "number" ||
    !Number.isFinite(point.latitude) ||
    Math.abs(point.latitude) > 90 ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.longitude) > 180 ||
    !Number.isFinite(point.accuracy) ||
    point.accuracy < 0 ||
    point.accuracy > 40_000_000 ||
    typeof point.capturedAt !== "string" ||
    !Number.isFinite(Date.parse(point.capturedAt))
  )
    throw Error("Il punto privato non è valido. Rileva di nuovo la posizione.");
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
    capturedAt: point.capturedAt,
  };
}
export function locate(): Promise<PrivatePosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        Error("La posizione non è disponibile. Puoi indicare il luogo a mano."),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        try {
          resolve(
            normalizePosition({
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
              accuracy: p.coords.accuracy,
              capturedAt: new Date(p.timestamp).toISOString(),
            })!,
          );
        } catch (e) {
          reject(e);
        }
      },
      (e) =>
        reject(
          Error(
            e.code === 1
              ? "Accesso alla posizione negato. Puoi indicare il luogo a mano."
              : "Posizione non disponibile. Riprova all’aperto oppure indica il luogo a mano.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}
export function locationFields(position?: PrivatePosition | null) {
  return `<section class="field-location"><b>Punto privato</b><p class="small">${position ? "Posizione registrata · precisione circa " + Math.round(position.accuracy) + " m." : "Se vuoi, conserva la posizione del ritrovamento nel tuo appunto. Con un profilo si salva arrotondata a circa 1 km. Non viene inclusa nei riepiloghi condivisi o nello Studio dell’indice."}</p><div class="field-actions"><button type="button" class="btn ghost" data-note-locate>${position ? "Rileva di nuovo" : "Usa la mia posizione"}</button>${position ? '<button type="button" class="link-btn" data-note-unlocate>Togli il punto</button>' : ""}</div><p class="small" data-location-status role="status"></p></section>`;
}
export function mountNoteLocation(
  root: ParentNode,
  { set, capture, active, render }: NoteLocationOptions,
) {
  let pending = false;
  root
    .querySelector<HTMLButtonElement>("[data-note-locate]")
    ?.addEventListener("click", async (event) => {
      if (pending) return;
      const button = event.currentTarget as HTMLButtonElement,
        message = root.querySelector<HTMLElement>("[data-location-status]");
      if (!message) return;
      pending = true;
      button.disabled = true;
      message.textContent = "Cerco la posizione…";
      try {
        const position = await locate();
        if (!active()) return;
        capture();
        set(position);
        render();
      } catch (error) {
        if (active()) message.textContent = errorMessage(error);
      } finally {
        pending = false;
        if (button.isConnected) button.disabled = false;
      }
    });
  root.querySelector("[data-note-unlocate]")?.addEventListener("click", () => {
    capture();
    set(null);
    render();
  });
}
export function wakeButton() {
  return '<button type="button" class="btn ghost" data-keep-awake aria-pressed="false">Mantieni lo schermo acceso</button><span class="small" data-wake-status role="status"></span>';
}
let mounted = false,
  refreshWake = () => {};
export const refreshWakeControls = () => refreshWake();
export function initWakeControls() {
  if (mounted) return;
  mounted = true;
  let lock: WakeLockSentinel | null = null,
    wanted = false,
    pending = false,
    revision = 0,
    lastMessage = "";
  const paint = (message = lastMessage) => {
    lastMessage = message;
    document.querySelectorAll<HTMLElement>("[data-keep-awake]").forEach((b) => {
      b.setAttribute("aria-pressed", String(!!lock && !lock.released));
      if (b.classList.contains("mapctl-btn")) {
        b.setAttribute(
          "aria-label",
          lock && !lock.released
            ? "Disattiva schermo acceso"
            : "Mantieni lo schermo acceso",
        );
        b.title = b.getAttribute("aria-label") || "";
      } else {
        const label =
          lock && !lock.released
            ? "Schermo acceso · Disattiva"
            : "Mantieni lo schermo acceso";
        if (b.textContent !== label) b.textContent = label;
      }
    });
    document
      .querySelectorAll<HTMLElement>("[data-wake-status]")
      .forEach((e) => {
        if (e.textContent !== (message || "")) {
          e.textContent = message || "";
          if (e.classList.contains("mapctl-wake-status")) {
            e.hidden = !message;
            if (message)
              setTimeout(() => {
                if (e.textContent === message) e.hidden = true;
              }, 5000);
          }
        }
      });
  };
  refreshWake = () => paint();
  const release = async () => {
    revision++;
    wanted = false;
    const old = lock;
    lock = null;
    paint("");
    try {
      await old?.release();
    } catch {
      /* already released */
    }
  };
  const request = async () => {
    if (
      pending ||
      !wanted ||
      (lock && !lock.released) ||
      document.visibilityState !== "visible"
    )
      return;
    pending = true;
    const mine = revision;
    try {
      const next = await navigator.wakeLock.request("screen");
      if (mine !== revision || !wanted) {
        await next.release();
        return;
      }
      lock = next;
      next.addEventListener("release", () => {
        if (lock === next) {
          lock = null;
          paint("Lo schermo può spegnersi. Puoi riattivarlo.");
        }
      });
      paint("Finché questa pagina è visibile. Consuma più batteria.");
    } catch {
      wanted = false;
      paint(
        "Il dispositivo non consente di mantenere lo schermo acceso in questo momento.",
      );
    } finally {
      pending = false;
      if (wanted && mine !== revision && !lock) void request();
    }
  };
  document.addEventListener(
    "click",
    (e) => {
      if (
        !(e.target instanceof Element) ||
        !e.target.closest("[data-keep-awake]")
      )
        return;
      if (!navigator.wakeLock) {
        paint("Funzione non disponibile su questo browser.");
        return;
      }
      if (wanted) {
        void release();
        return;
      }
      wanted = true;
      revision++;
      paint("Attivo lo schermo…");
      void request();
    },
    true,
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible" && wanted) void request();
    },
    true,
  );
  addEventListener("pagehide", () => void release());
  addEventListener("hashchange", () => void release());
}
