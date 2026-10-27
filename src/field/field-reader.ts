import { errorMessage } from "./field-contracts.js";
import {
  listFieldPacks,
  getFieldPack,
  removeFieldPack,
} from "./field-store.js";
import { esc, packHtml, routeSvg, routeGpx } from "./field-render.js";
import { locate, wakeButton, initWakeControls } from "./field-device.js";
try {
  const saved = localStorage.getItem("fungaroli:theme");
  document.documentElement.dataset.theme =
    saved === "light" || saved === "dark"
      ? saved
      : matchMedia("(prefers-color-scheme:dark)").matches
        ? "dark"
        : "light";
} catch {}
const root = document.getElementById("field-reader");
if (!root) throw Error("Lettore offline non disponibile.");
initWakeControls();
try {
  const id = new URL(location.href).searchParams.get("outing"),
    pack = id && (await getFieldPack(id));
  if (pack) {
    root.innerHTML = packHtml(pack);
    document.title = pack.zone.title + " · Nel bosco · Fronda";
    const tools = root.querySelector<HTMLElement>("[data-field-map-tools]")!;
    tools.innerHTML =
      '<button type="button" class="btn ghost" data-field-locate>Mostra la mia posizione</button>' +
      wakeButton() +
      (pack.trail?.lines?.length
        ? '<button type="button" class="btn ghost" data-field-gpx>Esporta o condividi GPX</button>'
        : "") +
      '<p role="status" data-field-status></p>';
    tools
      .querySelector("[data-field-gpx]")
      ?.addEventListener("click", async () => {
        const file = new File(
          [routeGpx(pack)],
          "fronda-" + pack.zone.id + ".gpx",
          { type: "application/gpx+xml" },
        );
        if (navigator.canShare?.({ files: [file] }))
          try {
            await navigator.share({
              files: [file],
              title: pack.trail?.name || pack.zone.title,
            });
            return;
          } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;
          }
        const url = URL.createObjectURL(file),
          link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        tools.querySelector<HTMLElement>("[data-field-status]")!.textContent =
          "GPX preparato: contiene il tratto mappato del catalogo, senza la tua posizione.";
      });
    tools.querySelector<HTMLButtonElement>("[data-field-locate]")!.onclick =
      async (event) => {
        const button = event.currentTarget as HTMLButtonElement,
          status = tools.querySelector<HTMLElement>("[data-field-status]")!;
        button.disabled = true;
        status.textContent = "Cerco la posizione…";
        try {
          const p = await locate();
          root.querySelector<HTMLElement>("[data-field-map]")!.innerHTML =
            routeSvg(pack.trail?.lines, p);
          status.textContent =
            "La posizione è usata solo per questa vista e non viene salvata.";
        } catch (e) {
          status.textContent = errorMessage(e);
        } finally {
          button.disabled = false;
        }
      };
  } else {
    const packs = await listFieldPacks();
    root.innerHTML = `<h1>Pronte per il bosco</h1><p>Copie conservate solo su questo dispositivo. Preparale con «Prepara per il bosco» nella pagina dell’uscita.</p>${id ? "<p>Questa copia non è più disponibile sul dispositivo.</p>" : ""}<ul class="field-pack-list">${packs.map((p) => `<li><a href="offline.html?outing=${encodeURIComponent(p.id)}"><b>${esc(p.zone.title)}</b><span>${esc(p.date)} · ${(p.bytes / 1048576).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB</span></a><button class="btn ghost" data-remove="${esc(p.id)}">Rimuovi</button></li>`).join("")}</ul>${packs.length ? "" : "<p>Non hai ancora preparato un’uscita.</p>"}<p role="status" data-field-status></p>`;
    root.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          try {
            await removeFieldPack(b.dataset.remove!);
            b.closest("li")?.remove();
            root.querySelector<HTMLElement>(
              "[data-field-status]",
            )!.textContent = "Copia rimossa da questo dispositivo.";
          } catch (e) {
            root.querySelector<HTMLElement>(
              "[data-field-status]",
            )!.textContent = errorMessage(e);
            b.disabled = false;
          }
        }),
    );
  }
} catch (e) {
  root.innerHTML = "<h1>Archivio offline non disponibile</h1><p></p>";
  root.querySelector("p")!.textContent = errorMessage(e);
}
