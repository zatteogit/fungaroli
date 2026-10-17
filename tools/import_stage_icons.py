#!/usr/bin/env python3
"""Icone delle fasi di crescita dei funghi dalle tavole fasi-NN del ramo gpt/immagini.

Uso:
  git archive origin/gpt/immagini incoming | tar -x -C /tmp/inc
  python3 tools/import_stage_icons.py /tmp/inc/incoming [--stato] [--stati "ok,pronta da integrare"]

Le immagini si disegnano dai dati: si importano solo le righe del manifest con il campo `fase`, e solo se
la fase è tra gli `stages` della specie in data/species-traits.json e la tessera tra le sue `tiles`
(«taglio» = sezione dell'uovo). Le altre righe sono rifiutate una per una, con il motivo:
specie sconosciuta, fase o tessera che i dati non prevedono, `fase` insieme a `variante`, due righe per lo
stesso disegno. Una tavola con un disegno tagliato o una cella del manifest vuota ferma l'import.

--stato: solo le tavole che incoming/bozze/STATO.md segna «pronta da integrare» (regola di Matteo, 16/10);
--stati cambia gli stati accettati. Le icone di fase già presenti restano.

Ritaglio per componenti (tools/sheet_cells.py); inquadratura come le icone base: il disegno, centrato, riempie
il quadrato con margine uguale (le tavole delle fasi sono normalizzate cella per cella, non in scala tra loro).
Scrive assets/traits/<specie>-<tessera>-fase-<id>.webp e aggiorna data/trait-icons.json (campo `stages`:
le fasi con tutte le tessere disegnate, nell'ordine dei dati). Dopo l'import: node tools/asset-report.mjs.
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from import_trait_icons import OUT, Sheets, cli, fit, load_rows, report, write_index  # noqa: E402
from sheet_cells import STATE_OK  # noqa: E402


def import_rows(rows, all_rows, taxa, sheets):
    """Importa le righe di fase. Restituisce (nomi scritti, righe rifiutate con il motivo)."""
    written, rejected, seen = [], [], {}
    for r in rows:
        key, fase, tile = r["soggetto"], r.get("fase"), r.get("tessera")
        where = f"{r['file'].removeprefix('incoming/')} cella {r.get('cella', '?')} {key} {fase}/{tile}"
        if key not in taxa:
            rejected.append(f"{where}: la specie non è in species-traits.json"); continue
        st = {s["id"]: s for s in taxa[key].get("stages") or []}
        if fase not in st:
            rejected.append(f"{where}: la fase «{fase}» non è tra le fasi della specie (stages)"); continue
        if tile not in st[fase]["tiles"]:
            rejected.append(f"{where}: nella fase «{fase}» la tessera «{tile}» non cambia (tiles: {', '.join(st[fase]['tiles'])})"); continue
        if r.get("variante"):
            rejected.append(f"{where}: una riga di fase non può avere anche una variante"); continue
        name = f"{key}-{tile}-fase-{fase}"
        if name in seen:
            rejected.append(f"{where}: lo stesso disegno è già in {seen[name]}"); continue
        seen[name] = where
        crop, _ = sheets.crop(r, all_rows)
        fit(crop).save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
        written.append(name)
    return written, rejected


def main(inc, stato=False, stati=(STATE_OK,)):
    taxa = json.loads((ROOT / "data/species-traits.json").read_text(encoding="utf-8"))["taxa"]
    rows, skipped, all_rows = load_rows(inc, stato, stati)
    rows = [r for r in rows if r.get("fase")]
    skipped = {f: s for f, s in skipped.items() if any(x["file"] == f and x.get("fase") for x in all_rows)}
    OUT.mkdir(parents=True, exist_ok=True)
    written, rejected = import_rows(rows, all_rows, taxa, Sheets(inc))
    index, removed = write_index(taxa)
    by = {}
    for n in written:
        by.setdefault(n.split("-fase-")[0].rsplit("-", 1)[0], []).append(n)
    print(f"{len(written)} icone di fase da {len({r['file'] for r in rows})} tavole, per {len(by)} specie")
    for key in sorted(by):
        want = sum(len(s["tiles"]) for s in taxa[key]["stages"])
        print(f"  {key}: {len(by[key])}/{want} tessere; fasi complete: {', '.join(index.get(key, {}).get('stages', [])) or 'nessuna'}")
    report(skipped, rejected, removed)


if __name__ == "__main__":
    cli(main)
