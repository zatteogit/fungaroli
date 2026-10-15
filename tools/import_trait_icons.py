#!/usr/bin/env python3
"""Icone dei caratteri (cappello, sotto, gambo) dalle tavole 3×3 del ramo gpt/immagini.

Uso:
  git archive origin/gpt/immagini incoming | tar -x -C /tmp/inc
  python3 tools/import_trait_icons.py /tmp/inc/incoming

Ogni riga «illustrazione» del manifest indica tavola, specie (chiave di data/species-traits.json),
tessera e cella. La cella è `cella` (0-8, da sinistra a destra e dall'alto in basso); se manca,
vale l'ordine delle righe della stessa tavola, come nelle prime 30 tavole.

Varianti (docs/handoff-immagini-varianti.md): le righe con `variante` = "colore:<valore>" o
"forma:<valore>" sono un altro colore o un'altra forma del cappello; `base` = {"colore", "forma"}
dice cosa mostra il disegno principale. Le tessere di una variante sono «cappello» e «gambo».
Scrive assets/traits/<specie>-<tessera>[-<variante>].webp e data/trait-icons.json.
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/traits"
PARTS = ("cappello", "sotto", "gambo")
SIZE = 128


def fit(tile):
    """Ritaglia il disegno (i fogli hanno margini ampi e diversi) e lo centra in un quadrato con margine uguale."""
    box = tile.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
    if box:
        tile = tile.crop(box)
    side = round(max(tile.size) * 1.08)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def main(inc):
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    taxa = json.loads((ROOT / "data/species-traits.json").read_text(encoding="utf-8"))["taxa"]
    # le icone degli alberi (soggetto "alberi") hanno il loro import: tools/import_tree_icons.py
    rows = [r for r in manifest if r["tipo"] == "illustrazione" and r.get("soggetto") != "alberi"]
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.webp"):
        f.unlink()
    have, base, variants, sheets = {}, {}, {}, {}
    for r in rows:
        key = r["soggetto"]
        if key not in taxa:
            sys.exit(f"{key}: non è in species-traits.json")
        im = sheets.setdefault(r["file"], Image.open(inc.parent / r["file"]).convert("RGBA"))
        cell = r.get("cella", [x for x in rows if x["file"] == r["file"]].index(r))
        side = im.size[0] // 3
        row, col = divmod(cell, 3)
        tile = fit(im.crop((col * side, row * side, (col + 1) * side, (row + 1) * side)))
        var = r.get("variante")
        if var:
            kind, value = var.split(":", 1)
            if value not in (taxa[key]["traits"].get("cap_color" if kind == "colore" else "cap_shape") or []):
                sys.exit(f"{key}: {var} non è tra i valori delle fonti")
            name = f"{key}-{r['tessera']}-{value}.webp"
            variants.setdefault(key, {}).setdefault(kind, {}).setdefault(value, set()).add(r["tessera"])
        else:
            name = f"{key}-{r['tessera']}.webp"
            have.setdefault(key, set()).add(r["tessera"])
        if r.get("base"):
            base[key] = r["base"]
        tile.save(OUT / name, "WEBP", quality=90, method=6)
    index = {}
    for key in sorted(k for k, v in have.items() if set(PARTS) <= v):
        entry = {}
        for kind, field in (("colore", "colors"), ("forma", "shapes")):
            done = [v for v, parts in variants.get(key, {}).get(kind, {}).items() if {"cappello", "gambo"} <= parts]
            drawn = base.get(key, {}).get(kind)
            if done and drawn:
                order = taxa[key]["traits"].get("cap_color" if kind == "colore" else "cap_shape") or []
                entry[field] = {"drawn": drawn, "values": [v for v in order if v == drawn or v in done]}
        index[key] = entry
    out = {
        "note": "Icone dei caratteri disegnate con AI (image_gen) a partire dai caratteri strutturati di data/species-traits.json, riviste dal proprietario del progetto. Mostrano varianti descritte nelle fonti; non sono foto e non servono a identificare.",
        "parts": list(PARTS),
        "taxa": index,
    }
    (ROOT / "data/trait-icons.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(index)} specie; varianti di colore per {sum('colors' in e for e in index.values())}, di forma per {sum('shapes' in e for e in index.values())}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "incoming")
