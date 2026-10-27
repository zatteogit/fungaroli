// Device features are offered when available, never inferred from the OS name.
export function normalizePosition(value) {
  if (value == null) return null;
  if (
    !value ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180 ||
    !Number.isFinite(value.accuracy) ||
    value.accuracy < 0 ||
    value.accuracy > 40_000_000 ||
    typeof value.capturedAt !== "string" ||
    !Number.isFinite(Date.parse(value.capturedAt))
  )
    throw Error("Il punto privato non è valido. Rileva di nuovo la posizione.");
  return {
    latitude: value.latitude,
    longitude: value.longitude,
    accuracy: value.accuracy,
    capturedAt: value.capturedAt,
  };
}
export function locate() {
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
            }),
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
export function locationFields(position) {
  return `<section class="field-location"><b>Punto privato</b><p class="small">${position ? "Posizione registrata · precisione circa " + Math.round(position.accuracy) + " m." : "Se vuoi, conserva la posizione del ritrovamento nel tuo appunto. Non viene inclusa nei riepiloghi condivisi o nello Studio dell’indice."}</p><div class="field-actions"><button type="button" class="btn ghost" data-note-locate>${position ? "Rileva di nuovo" : "Usa la mia posizione"}</button>${position ? '<button type="button" class="link-btn" data-note-unlocate>Togli il punto</button>' : ""}</div><p class="small" data-location-status role="status"></p></section>`;
}
export function mountNoteLocation(root, { get, set, capture, active, render }) {
  let pending = false;
  root
    .querySelector("[data-note-locate]")
    ?.addEventListener("click", async (event) => {
      if (pending) return;
      pending = true;
      const button = event.currentTarget,
        message = root.querySelector("[data-location-status]");
      button.disabled = true;
      message.textContent = "Cerco la posizione…";
      try {
        const position = await locate();
        if (!active()) return;
        capture();
        set(position);
        render();
      } catch (error) {
        if (active()) message.textContent = error.message;
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
  let lock = null,
    wanted = false,
    pending = false,
    revision = 0,
    lastMessage = "";
  const paint = (message = lastMessage) => {
    lastMessage = message;
    document.querySelectorAll("[data-keep-awake]").forEach((b) => {
      b.setAttribute("aria-pressed", String(!!lock && !lock.released));
      if (b.classList.contains("mapctl-btn")) {
        b.setAttribute(
          "aria-label",
          lock && !lock.released
            ? "Disattiva schermo acceso"
            : "Mantieni lo schermo acceso",
        );
        b.title = b.getAttribute("aria-label");
      } else {
        const label =
          lock && !lock.released
            ? "Schermo acceso · Disattiva"
            : "Mantieni lo schermo acceso";
        if (b.textContent !== label) b.textContent = label;
      }
    });
    document.querySelectorAll("[data-wake-status]").forEach((e) => {
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
      if (!e.target.closest("[data-keep-awake]")) return;
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
