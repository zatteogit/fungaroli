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
Fasi di crescita (docs/handoff-immagini-fasi.md): le righe con `fase` = "<id>" sono il disegno della
tessera in quella fase; la fase deve essere in `stages` della specie e la tessera tra le sue `tiles`
(«taglio» = sezione dell'uovo). File <specie>-<tessera>-fase-<id>.webp. Righe che non tornano: errore.
Scrive assets/traits/<specie>-<tessera>[-<variante>].webp e data/trait-icons.json.
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))  # ritaglio per componenti condiviso con import_tree_icons.py
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


def fit_like(tile, size):
    """Variante di colore: stessa inquadratura del disegno base (stessa altezza e stesso centro nel quadrato),
    così cambiando colore il fungo non si sposta né cambia scala. size = (larghezza, altezza) del disegno base."""
    box = tile.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
    if box:
        tile = tile.crop(box)
    bw, bh = size
    w = round(tile.size[0] * bh / tile.size[1])
    side = round(max(bw, bh, w) * 1.08)  # se la variante è più larga, il quadrato si allarga: mai disegni tagliati
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(tile.resize((w, bh), Image.LANCZOS), ((side - w) // 2, (side - bh) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def drawings(im, name):
    """Riquadro di ogni disegno per cella, per componenti: ogni macchia connessa va alla cella del suo baricentro.
    Le tavole non sono una griglia esatta (un gambo può scendere oltre il terzo del foglio): a terzi fissi
    il disegno restava tagliato. Errore se un disegno tocca il bordo del foglio o due celle si sovrappongono."""
    import numpy as np
    from import_tree_icons import components, ALPHA, NOISE
    W, H = im.size
    k = 2
    lab, n = components(np.array(im.getchannel("A").resize((W // k, H // k), Image.NEAREST)) > ALPHA)
    boxes = {}
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) * k * k < NOISE * W * H:
            continue
        x0, x1, y0, y1 = xs.min() * k, (xs.max() + 1) * k, ys.min() * k, (ys.max() + 1) * k
        if x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1:
            sys.exit(f"{name}: un disegno tocca il bordo del foglio")
        cell = min(int(ys.mean() * k // (H / 3)), 2) * 3 + min(int(xs.mean() * k // (W / 3)), 2)
        b = boxes.get(cell)
        boxes[cell] = (x0, y0, x1, y1) if not b else (min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1))
    cells = sorted(boxes)
    for i, c in enumerate(cells):
        for d in cells[i + 1:]:
            a, b = boxes[c], boxes[d]
            if a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]:
                sys.exit(f"{name}: i disegni delle celle {c} e {d} si sovrappongono")
    return boxes


def main(inc):
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    taxa = json.loads((ROOT / "data/species-traits.json").read_text(encoding="utf-8"))["taxa"]
    # le icone degli alberi (soggetto "alberi") hanno il loro import: tools/import_tree_icons.py
    rows = [r for r in manifest if r["tipo"] == "illustrazione" and r.get("soggetto") != "alberi"]
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.webp"):
        f.unlink()
    have, base, variants, sheets, margins, combos, stages = {}, {}, {}, {}, {}, {}, {}
    base_size = {}  # (specie, tessera) -> dimensioni del disegno base, per allineare le varianti di colore
    rows = sorted(rows, key=lambda r: bool(r.get("variante") or r.get("fase")))  # prima i disegni base
    for r in rows:
        key = r["soggetto"]
        if key not in taxa:
            sys.exit(f"{key}: non è in species-traits.json")
        if r.get("fase"):
            st = {f["id"]: f for f in taxa[key].get("stages") or []}
            if r["fase"] not in st:
                sys.exit(f"{key}: la fase «{r['fase']}» non è tra le fasi della specie (stages)")
            if r["tessera"] not in st[r["fase"]]["tiles"]:
                sys.exit(f"{key}: nella fase «{r['fase']}» la tessera «{r['tessera']}» non cambia (tiles)")
            if r.get("variante"):
                sys.exit(f"{key}: una riga ha sia fase sia variante")
        elif r["tessera"] not in (("cappello", "gambo") if r.get("variante") else PARTS):
            sys.exit(f"{key}: tessera «{r['tessera']}» non prevista")
        if r["file"] not in sheets:
            im = Image.open(inc.parent / r["file"]).convert("RGBA")
            sheets[r["file"]] = (im, drawings(im, r["file"]))
        im, boxes = sheets[r["file"]]
        cell = r.get("cella", [x for x in rows if x["file"] == r["file"]].index(r))
        if cell not in boxes:
            sys.exit(f"{r['file']}: la cella {cell} è vuota")
        crop = im.crop(boxes[cell])
        var = r.get("variante")
        if not var and not r.get("fase"):
            cb = crop.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
            base_size[(key, r["tessera"])] = (cb[2] - cb[0], cb[3] - cb[1]) if cb else crop.size
        same_frame = var and var.startswith("colore:") and "+" not in var and (key, r["tessera"]) in base_size
        tile = fit_like(crop, base_size[(key, r["tessera"])]) if same_frame else fit(crop)
        if r.get("fase"):
            name = f"{key}-{r['tessera']}-fase-{r['fase']}.webp"
            stages.setdefault(key, {}).setdefault(r["fase"], set()).add(r["tessera"])
        elif var and "+" in var:
            # combinazione colore + forma (es. "colore:giallo+forma:piano"): file <specie>-<tessera>-<colore>-<forma>
            parts = dict(x.split(":", 1) for x in var.split("+"))
            c, f = parts.get("colore"), parts.get("forma")
            if c not in (taxa[key]["traits"].get("cap_color") or []) or f not in (taxa[key]["traits"].get("cap_shape") or []):
                sys.exit(f"{key}: {var} non è tra i valori delle fonti")
            name = f"{key}-{r['tessera']}-{c}-{f}.webp"
            combos.setdefault(key, {}).setdefault(f"{c}|{f}", set()).add(r["tessera"])
        elif var:
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
        # margine vuoto attorno al disegno: il test lo usa per dire che l'icona è intera
        x0, y0, x1, y1 = tile.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
        margins[name[:-5]] = min(x0, y0, SIZE - x1, SIZE - y1)
    index = {}
    for key in sorted(k for k, v in have.items() if set(PARTS) <= v):
        entry = {}
        for kind, field in (("colore", "colors"), ("forma", "shapes")):
            done = [v for v, parts in variants.get(key, {}).get(kind, {}).items() if {"cappello", "gambo"} <= parts]
            drawn = base.get(key, {}).get(kind)
            if done and drawn:
                order = taxa[key]["traits"].get("cap_color" if kind == "colore" else "cap_shape") or []
                entry[field] = {"drawn": drawn, "values": [v for v in order if v == drawn or v in done]}
        done = sorted(k for k, parts in combos.get(key, {}).items() if {"cappello", "gambo"} <= parts)
        if done:
            entry["combos"] = done
        # fasi complete: tutte le tessere che cambiano in quella fase, nell'ordine dei dati
        done = [f["id"] for f in taxa[key].get("stages") or [] if set(f["tiles"]) <= stages.get(key, {}).get(f["id"], set())]
        if done:
            entry["stages"] = done
        # cosa mostra il disegno base (dal manifest; con un solo valore nelle fonti, quel valore):
        # serve al test di completezza (tests/asset-completeness.test.mjs) per sapere quali varianti mancano
        b = {k: v for k, v in (base.get(key) or {}).items() if k in ("colore", "forma")}
        for kind, field in (("colore", "cap_color"), ("forma", "cap_shape")):
            vals = taxa[key]["traits"].get(field) or []
            if kind not in b and len(vals) == 1:
                b[kind] = vals[0]
        if b:
            entry["base"] = b
        index[key] = entry
    out = {
        "note": "Icone dei caratteri disegnate con AI (image_gen) a partire dai caratteri strutturati di data/species-traits.json, riviste dal proprietario del progetto. Mostrano varianti descritte nelle fonti; non sono foto e non servono a identificare.",
        "parts": list(PARTS),
        "taxa": index,
        "margins": dict(sorted(margins.items())),
    }
    (ROOT / "data/trait-icons.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(index)} specie; varianti di colore per {sum('colors' in e for e in index.values())}, di forma per {sum('shapes' in e for e in index.values())}, fasi per {sum('stages' in e for e in index.values())}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "incoming")
