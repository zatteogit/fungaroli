// Generated from src/js/field-mode.ts. Run npm run build:typescript; do not edit.
import { errorMessage } from "./field-contracts.js";
import { saveFieldPack } from "./field-store.js";
import { esc } from "./field-render.js";
import { initWakeControls, wakeButton, refreshWakeControls, } from "./field-device.js";
import { loadAlertConfig, alertsEnabled, toggleOutingAlerts, } from "./field-alerts.js";
export function fieldTools(zone, date) {
    return `<section class="field-tools" data-field-tools="${esc(zone.id)}" data-field-date="${esc(date)}"><h2>Pronta per il bosco</h2><p>Porta con te il tratto mappato, le schede e una copia datata del meteo. Nessun profilo necessario.</p><div class="field-actions"><button type="button" class="btn ghost" data-field-prepare>Prepara per il bosco</button>${wakeButton()}</div><p class="small" data-field-progress role="status"></p><a class="field-link" href="offline.html">Le mie uscite offline →</a><div class="field-notifications"><button type="button" class="btn ghost" data-field-alert aria-pressed="${alertsEnabled(zone.id, date)}">${alertsEnabled(zone.id, date) ? "Avvisi attivi · Disattiva" : "Avvisami se il meteo peggiora"}</button><p class="small">Solo per questa zona e questo giorno, se aumenta il livello di cautela del meteo. Non sono allerte ufficiali né un servizio di sicurezza. Puoi disattivarli qui.</p><p class="small" data-alert-status role="status"></p></div></section>`;
}
const jobs = new Map(), alertJobs = new Map();
function paintJobs() {
    refreshWakeControls();
    for (const root of document.querySelectorAll("[data-field-tools]")) {
        const zoneId = root.dataset.fieldTools, date = root.dataset.fieldDate;
        if (!zoneId || !date)
            continue;
        const key = zoneId + "|" + date, alert = alertJobs.get(key);
        if (alert) {
            const b = root.querySelector("[data-field-alert]"), m = root.querySelector("[data-alert-status]"), enabled = alertsEnabled(zoneId, date), label = enabled
                ? "Avvisi attivi · Disattiva"
                : "Avvisami se il meteo peggiora";
            if (b.disabled !== alert.busy)
                b.disabled = alert.busy;
            if (b.textContent !== label)
                b.textContent = label;
            b.setAttribute("aria-pressed", String(enabled));
            if (m.textContent !== alert.message)
                m.textContent = alert.message;
        }
        const state = jobs.get(key);
        if (!state)
            continue;
        const button = root.querySelector("[data-field-prepare]"), message = root.querySelector("[data-field-progress]");
        if (button.disabled !== state.busy)
            button.disabled = state.busy;
        if (message.textContent !== state.message)
            message.textContent = state.message;
        if (state.url) {
            const link = root.querySelector(".field-link");
            if (link.getAttribute("href") !== state.url)
                link.setAttribute("href", state.url);
            if (link.textContent !== "Apri la copia offline →")
                link.textContent = "Apri la copia offline →";
            if (button.textContent !== "Aggiorna la copia offline")
                button.textContent = "Aggiorna la copia offline";
        }
    }
}
export function initFieldMode({ buildPack, }) {
    initWakeControls();
    void loadAlertConfig();
    new MutationObserver(paintJobs).observe(document.body, {
        childList: true,
        subtree: true,
    });
    document.addEventListener("click", async (event) => {
        if (!(event.target instanceof Element))
            return;
        const button = event.target.closest("[data-field-prepare],[data-field-alert]");
        if (!button || button.disabled)
            return;
        const root = button.closest("[data-field-tools]");
        if (!root)
            return;
        const zoneId = root.dataset.fieldTools, date = root.dataset.fieldDate, key = zoneId + "|" + date;
        if (!zoneId || !date)
            return;
        if (button.hasAttribute("data-field-alert")) {
            if (alertJobs.get(key)?.busy)
                return;
            const state = { busy: true, message: "Aggiorno gli avvisi…" };
            alertJobs.set(key, state);
            paintJobs();
            try {
                const enabled = await toggleOutingAlerts({ zoneId, date });
                state.message = enabled
                    ? "Avvisi attivi su questo dispositivo per questa uscita."
                    : "Avvisi disattivati per questa uscita.";
            }
            catch (e) {
                state.message = errorMessage(e);
            }
            finally {
                state.busy = false;
                paintJobs();
            }
            return;
        }
        if (jobs.get(key)?.busy)
            return;
        const state = {
            busy: true,
            message: "Preparo i contenuti…",
            url: jobs.get(key)?.url,
        };
        jobs.set(key, state);
        paintJobs();
        try {
            const pack = buildPack(zoneId, date);
            if (!pack)
                throw Error("Riapri l’uscita e riprova.");
            const saved = await saveFieldPack(pack, (n, total) => {
                state.message = `Conservo i contenuti: ${n} di ${total}…`;
                paintJobs();
            });
            state.message = `Pronta su questo dispositivo · ${(saved.bytes / 1048576).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB.${saved.persistent ? "" : " Il browser può liberare questo spazio: ricontrolla prima di partire."}`;
            state.url = "offline.html?outing=" + encodeURIComponent(saved.id);
        }
        catch (e) {
            state.message = errorMessage(e);
        }
        finally {
            state.busy = false;
            paintJobs();
        }
    });
}
