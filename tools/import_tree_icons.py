#!/usr/bin/env python3
"""Icone dei caratteri degli alberi dalle tavole 3×3 del ramo gpt/immagini (una icona per valore, non per specie).

Uso:
  git archive origin/gpt/immagini incoming/icone-alberi incoming/manifest.json | tar -x -C /tmp/inc
  python3 tools/import_tree_icons.py /tmp/inc/incoming

Le righe del manifest con `soggetto: "alberi"` danno tavola, `chiave`, `valore` e `cella` (0-8, da sinistra a
destra e dall'alto in basso). Chiave e valore devono esistere in data/recognize-trees.json → schema.

Ritaglio per componenti, non a terzi fissi: si cercano le macchie di disegno connesse (alfa > 16) e ognuna va
alla cella del suo baricentro. La tavola è rifiutata se un disegno è tagliato: una macchia che attraversa il
confine tra due celle o tocca il bordo del foglio, una cella del manifest vuota, una macchia grande in una cella
che il manifest non usa.
Scrive assets/tree-traits/<chiave>-<valore>.webp (128 px, margine uguale) e data/tree-trait-icons.json.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/tree-traits"
SIZE = 128
ALPHA = 16
NOISE = 0.0002  # macchie sotto lo 0,02% del foglio: polvere dell'antialias, ignorate


def components(mask):
    """Etichetta le macchie connesse (8 vicini). Restituisce (etichette, n)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]:
            continue
        n += 1
        stack = [(y, x)]
        lab[y, x] = n
        while stack:
            cy, cx = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        stack.append((ny, nx))
    return lab, n


def cut_sheet(path, used):
    """Ritagli per cella {cella: immagine RGBA}; errore se un disegno è tagliato."""
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    # etichettatura su una copia ridotta (più veloce), coordinate riportate al foglio intero
    k = 2
    small = np.array(im.getchannel("A").resize((W // k, H // k), Image.NEAREST)) > ALPHA
    lab, n = components(small)
    cw, ch = W / 3, H / 3
    boxes = {}
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) * k * k < NOISE * W * H:
            continue
        x0, x1, y0, y1 = xs.min() * k, (xs.max() + 1) * k, ys.min() * k, (ys.max() + 1) * k
        if x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1:
            sys.exit(f"{path.name}: un disegno tocca il bordo del foglio ({x0},{y0}–{x1},{y1})")
        cols = {int(x0 // cw), int(min(x1 - 1, W - 1) // cw)}
        rows = {int(y0 // ch), int(min(y1 - 1, H - 1) // ch)}
        if len(cols) > 1 or len(rows) > 1:
            sys.exit(f"{path.name}: un disegno attraversa il confine tra due celle ({x0},{y0}–{x1},{y1})")
        cell = rows.pop() * 3 + cols.pop()
        b = boxes.get(cell)
        boxes[cell] = (x0, y0, x1, y1) if not b else (min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1))
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


def main(inc):
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    schema = json.loads((ROOT / "data/recognize-trees.json").read_text(encoding="utf-8"))["schema"]
    rows = [r for r in manifest if r.get("soggetto") == "alberi" and r.get("tipo") == "illustrazione"]
    for r in rows:
        q = schema.get(r["chiave"])
        if not q or r["valore"] not in {v["id"] for v in q["values"]}:
            sys.exit(f"{r['chiave']}={r['valore']}: non è nello schema di data/recognize-trees.json")
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.webp"):
        f.unlink()
    sheets = {}
    for r in rows:
        sheets.setdefault(r["file"], []).append(r)
    values, margins = {}, {}
    for file, rs in sorted(sheets.items()):
        cells = [r["cella"] for r in rs]
        if len(set(cells)) != len(cells):
            sys.exit(f"{file}: celle ripetute nel manifest")
        tiles = cut_sheet(inc.parent / file, cells)
        for r in rs:
            icon = fit(tiles[r["cella"]])
            icon.save(OUT / f"{r['chiave']}-{r['valore']}.webp", "WEBP", quality=90, method=6)
            values.setdefault(r["chiave"], []).append(r["valore"])
            # margine vuoto attorno al disegno nell'icona finale: il test lo usa per dire che è intera
            x0, y0, x1, y1 = icon.getchannel("A").point(lambda a: 255 if a > ALPHA else 0).getbbox()
            margins[f"{r['chiave']}-{r['valore']}"] = min(x0, y0, SIZE - x1, SIZE - y1)
    out = {
        "note": "Icone dei caratteri degli alberi disegnate con AI (image_gen) a partire dallo schema dei caratteri di data/recognize-trees.json, riviste dal proprietario del progetto. Una icona per valore, non per specie: non sono foto e non servono a identificare.",
        "path": "assets/tree-traits/<chiave>-<valore>.webp",
        "values": {k: [v["id"] for v in schema[k]["values"] if v["id"] in values.get(k, [])] for k in schema if k in values},
        "margins": dict(sorted(margins.items())),
    }
    (ROOT / "data/tree-trait-icons.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{sum(len(v) for v in values.values())} icone da {len(sheets)} tavole")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "incoming")
