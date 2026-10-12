#!/usr/bin/env python3
"""Foto degli alberi di data/trees.json -> data/media-trees.json (separato da media.json).

Per ogni albero 3 foto iNaturalist research grade (Italia centrale, poi Italia, poi ovunque),
con miniatura (560 px) e versione per il visore (`file_hd`, 1024 px).
Per le schede di genere (pioppo, salice) usa una specie rappresentativa, indicata in `photo_taxon`.

Uso: python3 tools/build_media_trees.py
"""
import json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_media import inat_photos, download  # noqa: E402
from build_media_hd import hd_url  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
GENUS_STAND_IN = {"pioppo": "Populus nigra", "salice": "Salix alba"}


def shrink(path, side, q):
    from PIL import Image
    im = Image.open(path).convert("RGB")
    im.thumbnail((side, side))
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)


def main():
    trees = json.loads((ROOT / "data" / "trees.json").read_text())["trees"]
    out_p = ROOT / "data" / "media-trees.json"
    out = json.loads(out_p.read_text()) if out_p.exists() else {"trees": {}}
    for tid, t in trees.items():
        if out["trees"].get(tid, {}).get("inat"):
            continue
        latin = GENUS_STAND_IN.get(tid) or (re.match(r"[A-Z][a-z]+ [a-z]+", t.get("latin") or "") or [None])[0]
        if not latin:
            continue
        print("albero", tid, latin, file=sys.stderr)
        slug = "tree-" + re.sub(r"[^a-z]+", "-", tid)
        try:
            photos = inat_photos(latin, slug, 3)
        except Exception as e:  # noqa: BLE001
            print("  saltato", tid, str(e)[:100], file=sys.stderr)
            continue
        for m in photos:
            shrink(ROOT / m["file"], 560, 72)
            try:
                dest = ROOT / re.sub(r"\.jpg$", "-hd.jpg", m["file"])
                url = hd_url(m)
                if url and download(url, dest):
                    shrink(dest, 1600, 80)
                    m["file_hd"] = str(dest.relative_to(ROOT))
            except Exception as e:  # noqa: BLE001
                print("  hd saltata", m["file"], str(e)[:100], file=sys.stderr)
        out["trees"][tid] = {"latin": t.get("latin"), "photo_taxon": latin, "inat": photos}
        out_p.write_text(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
