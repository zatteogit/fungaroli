#!/usr/bin/env python3
"""Schemi del glossario, aperture delle guide, timbri delle sfide e infografiche dal ramo gpt/immagini.

Uso:
  git archive origin/gpt/immagini incoming | tar -x -C /tmp/inc
  python3 tools/import_illustrations.py /tmp/inc/incoming [--stato] [--stati "ok,pronta da integrare"]
      [--scegli caesarea=caesarea-revisione,aereus=aereus-revisione] [--escludi terreum]

Righe del manifest con `tipo` «glossario», «guida», «timbro» o «infografica» (docs/handoff-immagini-glossario-guide.md,
docs/handoff-immagini-timbri.md). Il soggetto deve esistere nei dati: voce di data/glossary.json, guida di
data/guides.json, sfida di data/challenges.json, specie di data/species-id.json. Le righe che non tornano sono
rifiutate con il motivo.
--scegli: per un'infografica con più versioni, quale file usare (nome senza estensione); senza scelta vale il file
  <soggetto>.webp. --escludi: soggetti da non pubblicare. --stato: solo i file che incoming/bozze/STATO.md segna
  «pronta da integrare»; --stati cambia gli stati accettati.

Scrive solo le immagini (WebP):
  assets/glossary/<id>.webp (1024 px, fondo trasparente), assets/guides/<id>.webp (1600×900),
  assets/stamps/<id>.webp (256 px, fondo trasparente), assets/infografiche/<id>.webp (1600×2000).
Testi alternativi, didascalie e crediti stanno nei dati (data/media-glossary.json, data/guides.json,
data/challenges.json, data/infografiche.json): sono immagini generate per illustrazioni, mai al posto delle foto
di una specie (AGENTS.md).
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from sheet_cells import STATE_OK, ready_sheets, sheet_states  # noqa: E402

KINDS = {
    # tipo: (cartella, lato massimo, trasparente, qualità)
    "glossario": ("assets/glossary", 1024, True, 88),
    "guida": ("assets/guides", 1600, False, 85),
    "timbro": ("assets/stamps", 256, True, 90),
    "infografica": ("assets/infografiche", 2000, False, 85),
}


def subjects():
    read = lambda p: json.loads((ROOT / p).read_text(encoding="utf-8"))  # noqa: E731
    g = read("data/glossary.json")["terms"]
    return {
        "glossario": {t["id"] for t in g} if isinstance(g, list) else set(g),
        "guida": {x["id"] for x in read("data/guides.json")["guides"]},
        "timbro": {x["id"] for x in read("data/challenges.json")["challenges"]},
        "infografica": set(read("data/species-id.json")["species"]),
    }


def opt(name):
    return next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == name and i + 1 < len(sys.argv)), "")


def main(inc):
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    choose = dict(x.split("=", 1) for x in opt("--scegli").split(",") if "=" in x)
    exclude = {x for x in opt("--escludi").split(",") if x}
    stati = tuple(x.strip() for x in opt("--stati").split(",") if x.strip()) or (STATE_OK,)
    stato = "--stato" in sys.argv or "--stati" in sys.argv
    ok = ready_sheets(inc / "bozze/STATO.md", stati) if stato else None
    states = sheet_states(inc / "bozze/STATO.md")
    known = subjects()
    done, rejected, skipped = [], [], []
    for r in manifest:
        kind, key = r.get("tipo"), r.get("soggetto")
        if kind not in KINDS:
            continue
        f = r["file"].removeprefix("incoming/")
        stem = Path(f).stem
        if key not in known[kind]:
            rejected.append(f"{f}: {kind} «{key}» non esiste nei dati"); continue
        if key in exclude:
            skipped.append(f"{f}: escluso ({key})"); continue
        if kind == "infografica" and stem != choose.get(key, key):
            skipped.append(f"{f}: per {key} si usa {choose.get(key, key)}"); continue
        if ok is not None and f not in ok:
            skipped.append(f"{f}: stato «{states.get(f, 'senza stato')}»"); continue
        folder, side, alpha, q = KINDS[kind]
        im = Image.open(inc.parent / r["file"])
        im = im.convert("RGBA" if alpha else "RGB")
        if alpha:
            box = im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
            if not box or box[0] <= 1 or box[1] <= 1 or box[2] >= im.width - 1 or box[3] >= im.height - 1:
                rejected.append(f"{f}: il disegno tocca il bordo o il fondo non è trasparente"); continue
        im.thumbnail((side, side), Image.LANCZOS)
        out = ROOT / folder / f"{key}.webp"
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, "WEBP", quality=q, method=6)
        done.append(f"{folder}/{key}.webp ← {f} ({im.width}×{im.height}, {out.stat().st_size // 1024} KB)")
    print(f"{len(done)} immagini scritte")
    for x in done:
        print(f"  {x}")
    for title, items in (("Saltate", skipped), ("Rifiutate", rejected)):
        if items:
            print(f"\n{title}: {len(items)}")
            for x in items:
                print(f"  {x}")


if __name__ == "__main__":
    args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and sys.argv[i - 1] not in ("--scegli", "--escludi", "--stati")]
    main(args[0] if args else "incoming")
