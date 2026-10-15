#!/usr/bin/env python3
"""Punti di ritaglio delle foto dal ramo gpt/ritagli (docs/handoff: «Punti di ritaglio delle foto»).

Uso:
  git show origin/gpt/ritagli:incoming/ritagli/punti.json > /tmp/punti.json
  python3 tools/import_crop_points.py /tmp/punti.json [--thumbs]

Per ogni foto `punti.json` dà il centro visivo del soggetto (`punto`) e la parte da non tagliare
(`riquadro`), in frazioni 0–1 con origine in alto a sinistra. Il punto NON è object-position:
per ciascuno dei sei formati dell'app si calcola la posizione CSS così:
  finestra visibile  cw = min(W, H·r), ch = min(H, W/r)
  origine            centrata sul punto, spostata quanto basta per tenere dentro il riquadro
                     (se ci sta), limitata ai bordi: ox ∈ [0, W − cw]
  posizione CSS      px = ox / (W − cw)  (0,5 se la foto non sborda), idem per y
Scrive data/crop-points.json: { "files": { "<file>": { "5:4": [px, py], …, "dubbio": bool } } }.
Le varianti delle copertine ricevono i valori della foto reale (stessa inquadratura).
Restano senza dati, quindi al centro come oggi, le foto in cui il soggetto stesso è incerto.

--thumbs rigenera le miniature quadrate 160×160 (-t.webp), già ritagliate al centro, dalla foto grande centrate sul punto.
"""
import json, re, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FORMATS = {"5:4": 5 / 4, "3:4": 3 / 4, "4:5": 4 / 5, "16:7": 16 / 7, "4:3": 4 / 3, "1:1": 1.0}
UNCERTAIN = re.compile(r"selezione dubbia|impossibile delimitare|nessun esemplare intero|non è distinguibile|non esiste un fungo intero", re.I)
THUMB = 160


def axis(full, view, point, lo, hi):
    """Origine della finestra lungo un asse, come frazione dello spazio di scorrimento."""
    extra = full - view
    if extra < max(2, full * 0.005):  # sborda di pochi pixel (arrotondamenti): resta al centro
        return 0.5
    start = point * full - view / 2
    a, b = hi * full - view, lo * full  # il riquadro resta dentro se start ∈ [a, b]
    if a <= b:
        start = min(max(start, a), b)
    return round(min(max(start, 0), extra) / extra, 3)


def positions(size, v):
    W, H = size
    (x, y), (x0, y0, x1, y1) = v["punto"], v["riquadro"]
    out = {}
    for name, r in FORMATS.items():
        cw, ch = min(W, H * r), min(H, W / r)
        out[name] = [axis(W, cw, x, x0, x1), axis(H, ch, y, y0, y1)]
    return out


def valid(v):
    try:
        (x, y), (x0, y0, x1, y1) = v["punto"], v["riquadro"]
    except (KeyError, TypeError, ValueError):
        return "dati mancanti"
    if not all(0 <= n <= 1 for n in (x, y, x0, y0, x1, y1)):
        return "coordinate fuori da 0–1"
    if not (x0 < x1 and y0 < y1):
        return "riquadro vuoto"
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return "punto fuori dal riquadro"
    return ""


def thumb_of(path):
    p = path.replace("-hd.webp", ".webp")
    return p[:-5] + "-t.webp" if p.endswith(".webp") else ""


def regen_thumb(src, dst, v):
    from PIL import ImageOps
    im = ImageOps.exif_transpose(Image.open(ROOT / src)).convert("RGB")
    W, H = im.size
    side = min(W, H)
    px, py = positions((W, H), v)["1:1"]
    ox, oy = round(px * (W - side)), round(py * (H - side))
    # stessa misura e compressione di tools/build_webp.py (Q_THUMB = 72)
    im.crop((ox, oy, ox + side, oy + side)).resize((THUMB, THUMB), Image.LANCZOS).save(ROOT / dst, "WEBP", quality=72, method=6)


def main(src, thumbs=False):
    data = json.loads(Path(src).read_text(encoding="utf-8"))
    files, rejected, centred, made = {}, [], [], set()
    for path, v in data.items():
        why = "" if (ROOT / path).exists() else "file inesistente"
        why = why or valid(v)
        if why:
            rejected.append((path, why))
            continue
        # i luoghi non si escludono: i loro dubbi riguardano il meteo di singole varianti, l'inquadratura resta valida
        if v.get("dubbio") and UNCERTAIN.search(v.get("nota", "")) and not path.startswith("assets/zones/"):
            centred.append(path)
            continue
        targets = [path]
        for inc in v.get("varianti", []):  # copertine: stessa inquadratura in tutte le varianti
            stem = Path(inc).stem
            targets += [f for f in (f"assets/zones/var/{stem}.webp", f"assets/zones/var/{stem}-hd.webp") if (ROOT / f).exists()]
        if path.startswith("assets/zones/") and path.endswith("-hd.webp"):
            small = path.replace("-hd.webp", ".webp")
            if (ROOT / small).exists() and small not in data:
                targets.append(small)
        for f in targets:
            with Image.open(ROOT / f) as im:
                files[f] = {**positions(im.size, v), "dubbio": bool(v.get("dubbio"))}
        t = thumb_of(path)
        # solo le miniature quadrate già ritagliate al centro; le altre hanno le proporzioni della foto e usano il CSS
        if thumbs and t and t not in made and (ROOT / t).exists() and Image.open(ROOT / t).size == (THUMB, THUMB):
            # dalla foto più grande disponibile
            big = path if path.endswith("-hd.webp") else (path[:-5] + "-hd.webp" if (ROOT / (path[:-5] + "-hd.webp")).exists() else path)
            regen_thumb(big, t, v)
            made.add(t)
    out = {
        "note": "Posizioni CSS (0–1) per object-fit: cover nei sei formati dell'app, dai punti di ritaglio di gpt/ritagli (incoming/ritagli/punti.json, verificati da Matteo a campione). Generato da tools/import_crop_points.py.",
        "files": dict(sorted(files.items())),
    }
    (ROOT / "data/crop-points.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(files)} immagini con posizioni; {len(centred)} lasciate al centro (soggetto incerto); {len(rejected)} scartate")
    for p, why in rejected:
        print(f"  scartata: {p} — {why}")
    if thumbs:
        print(f"{len(made)} miniature rigenerate")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else "punti.json", "--thumbs" in sys.argv)
