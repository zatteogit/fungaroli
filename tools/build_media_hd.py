#!/usr/bin/env python3
"""Versioni ad alta risoluzione delle foto in data/media.json, per il visore con zoom.

Per ogni foto aggiunge `file_hd` (assets/species/<nome>-hd.jpg, lato max 1600 px):
- iNaturalist: dimensione "large" (1024 px) dalla stessa osservazione
- Wikimedia Commons: miniatura a 1600 px dello stesso file (richieste distanziate)
Le miniature esistenti restano per elenchi e anteprime.

Uso: python3 tools/build_media_hd.py
"""
import json, re, sys, time, urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_habitat import get_json  # noqa: E402
from build_media import download  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MAX_SIDE = 1600


def hd_url(m):
    if "inaturalist.org/observations/" in m["page"]:
        oid = m["page"].rsplit("/", 1)[-1]
        d = get_json(f"https://api.inaturalist.org/v1/observations/{oid}", {})
        ph = d["results"][0]["photos"][0]
        return ph["url"].replace("square", "large")
    if "commons.wikimedia.org" in m["page"]:
        title = urllib.parse.unquote(m["page"].rsplit("/", 1)[-1])
        info = get_json("https://commons.wikimedia.org/w/api.php", {
            "action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": MAX_SIDE, "format": "json"})
        page = next(iter(info["query"]["pages"].values()))
        time.sleep(5)
        return page["imageinfo"][0]["thumburl"]
    return None


def main():
    from PIL import Image
    p = ROOT / "data" / "media.json"
    media = json.loads(p.read_text())
    photos = []
    for v in list(media["species"].values()) + list(media["lookalikes"].values()):
        photos += [x for x in [v.get("ref"), *(v.get("inat") or [])] if x]
    done = 0
    for m in photos:
        if m.get("file_hd") and (ROOT / m["file_hd"]).exists():
            continue
        dest = ROOT / re.sub(r"\.jpg$", "-hd.jpg", m["file"])
        try:
            url = hd_url(m)
            if not url or not download(url, dest):
                continue
            im = Image.open(dest).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE))
            im.save(dest, "JPEG", quality=80, optimize=True, progressive=True)
            m["file_hd"] = str(dest.relative_to(ROOT))
            done += 1
            p.write_text(json.dumps(media, ensure_ascii=False, indent=1))
            time.sleep(1)
        except Exception as e:  # noqa: BLE001
            print("  saltato", m["file"], str(e)[:100], file=sys.stderr)
    print(f"{done} foto HD aggiunte; {sum(1 for m in photos if m.get('file_hd'))}/{len(photos)} totali", file=sys.stderr)


if __name__ == "__main__":
    main()
