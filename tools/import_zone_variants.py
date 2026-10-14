#!/usr/bin/env python3
"""Importa le copertine stagione × meteo dei luoghi preparate sul ramo gpt/immagini.

Uso:
  git archive origin/gpt/immagini incoming | tar -x -C /tmp/inc
  python3 tools/import_zone_variants.py /tmp/inc/incoming

Prende solo le immagini segnate «ok» in bozze/STATO.md. La combinazione che corrisponde
alla foto reale (colonna «Foto reale riusata» di NOTE.md) non viene importata: si usa la
foto originale, a cui si assegnano stagione e tempo. Autore, licenza e pagina della foto di
partenza vengono dalla tabella delle attribuzioni di NOTE.md, verificata sulle pagine Commons.
Rilanciabile: rigenera le varianti e riscrive solo il campo `variants` (e i crediti base, se diversi).
"""
import json, re, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/zones/var"
DATA = ROOT / "data/media-zones.json"
SEASONS = ("primavera", "estate", "autunno", "inverno")
WEATHERS = ("sereno", "nuvoloso", "nebbia", "pioggia", "neve")


def table(md, first_header):
    """Righe della tabella markdown che inizia con l'intestazione indicata."""
    lines = md.splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith("|") and first_header in l)
    rows = []
    for l in lines[start + 2:]:
        if not l.startswith("|"):
            break
        rows.append([c.strip() for c in l.strip().strip("|").split("|")])
    return rows


def link(cell):
    m = re.match(r"\[(.+?)\]\((.+?)\)", cell)
    return (m.group(1), m.group(2)) if m else (cell, "")


def save(src, dest, side, quality):
    im = Image.open(src).convert("RGB")
    im.thumbnail((side, side), Image.LANCZOS)
    im.save(dest, "WEBP", quality=quality, method=6)
    return list(im.size)


def main(inc):
    inc = Path(inc)
    note = (inc / "NOTE.md").read_text(encoding="utf-8")
    stato = (inc / "bozze/STATO.md").read_text(encoding="utf-8")
    ok = {Path(r[0]).name for r in table(stato, "File") if r[0].startswith("luoghi/") and r[2] == "ok"}
    real = {}
    for zone, _n, _g, reused, *_ in table(note, "Foto reale riusata"):
        m = re.match(r"(primavera|estate|autunno|inverno)-(\w+)", reused)
        if m:
            real[zone] = m.groups()
    credits = {}
    for zone, author, lic, page in table(note, "Autore originale"):
        credits[zone] = {"author": author, "license": link(lic)[0], "license_url": link(lic)[1], "page": link(page)[1]}

    data = json.loads(DATA.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for zid, media in data["zones"].items():
        cr = credits.get(zid)
        if not cr:
            continue
        # crediti della foto originale: la pagina Commons fa fede
        if media.get("author") != cr["author"]:
            media["author"], media["license"] = cr["author"], cr["license"]
        media.pop("season", None), media.pop("weather", None)
        if zid in real:
            media["season"], media["weather"] = real[zid]
        variants = []
        for s in SEASONS:
            for w in WEATHERS:
                name = f"{zid}-{s}-{w}.webp"
                if name not in ok or real.get(zid) == (s, w):
                    continue
                src = inc / "luoghi" / name
                size = save(src, OUT / f"{zid}-{s}-{w}-hd.webp", 1600, 72)
                save(src, OUT / f"{zid}-{s}-{w}.webp", 640, 70)
                variants.append({"season": s, "weather": w, "file": f"assets/zones/var/{zid}-{s}-{w}.webp",
                                 "file_hd": f"assets/zones/var/{zid}-{s}-{w}-hd.webp", "size": size, "generated": True,
                                 "source": "Wikimedia Commons", "author": cr["author"], "license": cr["license"],
                                 "licenseUrl": cr["license_url"], "page": cr["page"]})
        if variants:
            media["variants"] = variants
        else:
            media.pop("variants", None)
        print(f"{zid}: {len(variants)} varianti" + (f", foto reale = {'-'.join(real[zid])}" if zid in real else ""))
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "incoming")
