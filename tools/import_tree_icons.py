#!/usr/bin/env python3
"""Icone dei caratteri degli alberi dalle tavole 3×3 del ramo gpt/immagini (una icona per valore, non per specie).

Uso:
  git archive origin/gpt/immagini incoming/icone-alberi incoming/manifest.json | tar -x -C /tmp/inc
  python3 tools/import_tree_icons.py /tmp/inc/incoming

Le righe del manifest con `soggetto: "alberi"` danno tavola, `chiave`, `valore` e `cella` (0-8, da sinistra a
destra e dall'alto in basso). Chiave e valore devono esistere in data/recognize-trees.json → schema.

Ritaglio per componenti, non a terzi fissi (tools/sheet_cells.py, lo stesso delle icone dei funghi): ogni macchia
di disegno connessa va alla cella del suo baricentro, anche se supera il terzo del foglio. La tavola è rifiutata
se un disegno tocca il bordo del foglio, se due disegni si sovrappongono, se una cella del manifest è vuota o se
c'è un disegno in una cella che il manifest non usa.
--stato: solo le tavole che incoming/bozze/STATO.md segna «pronta da integrare»; --stati cambia gli stati
accettati. Con --stato le icone già presenti restano (si riscrive solo ciò che si importa).
Scrive assets/tree-traits/<chiave>-<valore>.webp (128 px, margine uguale) e data/tree-trait-icons.json.

Piante (docs/handoff-immagini-piante.md): stesso formato, righe con `soggetto: "piante"`, schema di
data/recognize-plants.json; scrive assets/plant-traits/ e data/plant-trait-icons.json.
  python3 tools/import_tree_icons.py /tmp/inc/incoming --piante
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from sheet_cells import ALPHA, STATE_OK, drawings, ready_sheets, sheet_states  # noqa: E402

OUT = ROOT / "assets/tree-traits"
SIZE = 128


def cut_sheet(path, used):
    """Ritagli per cella {cella: immagine RGBA}, per componenti (tools/sheet_cells.py).
    Errore se un disegno tocca il bordo del foglio, se due disegni si sovrappongono, se una cella del manifest
    è vuota o se c'è un disegno in una cella che il manifest non usa."""
    im = Image.open(path).convert("RGBA")
    boxes = drawings(im, path.name)
    for cell in used:
        if cell not in boxes:
            sys.exit(f"{path.name}: la cella {cell} del manifest è vuota")
    extra = sorted(set(boxes) - set(used))
    if extra:
        sys.exit(f"{path.name}: disegni nelle celle {extra}, che il manifest non usa")
    return {cell: im.crop(boxes[cell]) for cell in used}


def fit(tile):
    """Centra il disegno in un quadrato con margine uguale (come le icone dei funghi)."""
    side = round(max(tile.size) * 1.08)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


MODES = {
    "alberi": ("data/recognize-trees.json", "assets/tree-traits", "data/tree-trait-icons.json", "degli alberi"),
    "piante": ("data/recognize-plants.json", "assets/plant-traits", "data/plant-trait-icons.json", "delle piante"),
}
# chiavi con un'icona per valore: le domande che si pongono, senza taglia, ambiente e segni particolari
SKIP = ("size", "habitat", "special")


def main(inc, mode="alberi", stato=False, stati=(STATE_OK,)):
    global OUT
    src, out_dir, index, who = MODES[mode]
    OUT = ROOT / out_dir
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    schema = json.loads((ROOT / src).read_text(encoding="utf-8"))["schema"]
    rows = [r for r in manifest if r.get("soggetto") == mode and r.get("tipo") == "illustrazione"]
    if stato:
        ok, states = ready_sheets(inc / "bozze/STATO.md", stati), sheet_states(inc / "bozze/STATO.md")
        for f in sorted({r["file"] for r in rows if r["file"].removeprefix("incoming/") not in ok}):
            print(f"saltata {f}: {states.get(f.removeprefix('incoming/'), 'senza stato')}")
        rows = [r for r in rows if r["file"].removeprefix("incoming/") in ok]
    for r in rows:
        q = schema.get(r["chiave"])
        if not q or not q.get("ask") or r["chiave"] in SKIP or r["valore"] not in {v["id"] for v in q["values"]}:
            sys.exit(f"{r['chiave']}={r['valore']}: non è un valore delle domande di {src}")
    OUT.mkdir(parents=True, exist_ok=True)
    asked = {f"{k}-{v['id']}" for k, q in schema.items() if q.get("ask") and k not in SKIP for v in q["values"]}
    for f in OUT.glob("*.webp"):
        if not stato or f.stem not in asked:  # import completo: si riparte da zero; con --stato restano le icone già presenti
            f.unlink()
    sheets = {}
    for r in rows:
        sheets.setdefault(r["file"], []).append(r)
    count = 0
    for file, rs in sorted(sheets.items()):
        cells = [r["cella"] for r in rs]
        if len(set(cells)) != len(cells):
            sys.exit(f"{file}: celle ripetute nel manifest")
        tiles = cut_sheet(inc.parent / file, cells)
        for r in rs:
            icon = fit(tiles[r["cella"]])
            icon.save(OUT / f"{r['chiave']}-{r['valore']}.webp", "WEBP", quality=90, method=6)
            count += 1
    # indice dai file presenti; margine vuoto attorno al disegno: il test lo usa per dire che l'icona è intera
    values, margins = {}, {}
    for f in sorted(OUT.glob("*.webp")):
        k, v = next((k, f.stem[len(k) + 1:]) for k in sorted(schema, key=len, reverse=True) if f.stem.startswith(k + "-"))
        values.setdefault(k, []).append(v)
        x0, y0, x1, y1 = Image.open(f).getchannel("A").point(lambda a: 255 if a > ALPHA else 0).getbbox()
        margins[f.stem] = min(x0, y0, SIZE - x1, SIZE - y1)
    out = {
        "note": f"Icone dei caratteri {who} disegnate con AI (image_gen) a partire dallo schema dei caratteri di {src}, riviste dal proprietario del progetto. Una icona per valore, non per specie: non sono foto e non servono a identificare.",
        "path": f"{out_dir}/<chiave>-<valore>.webp",
        "values": {k: [v["id"] for v in schema[k]["values"] if v["id"] in values.get(k, [])] for k in schema if k in values},
        "margins": dict(sorted(margins.items())),
    }
    (ROOT / index).write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{count} icone importate da {len(sheets)} tavole; {sum(len(v) for v in values.values())} nell'indice")


if __name__ == "__main__":
    stati = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--stati" and i + 1 < len(sys.argv)), None)
    args = [a for a in sys.argv[1:] if not a.startswith("--") and a != stati]
    main(args[0] if args else "incoming", "piante" if "--piante" in sys.argv else "alberi",
         "--stato" in sys.argv or bool(stati), tuple(x.strip() for x in stati.split(",")) if stati else (STATE_OK,))
