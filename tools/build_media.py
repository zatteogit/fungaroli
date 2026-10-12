#!/usr/bin/env python3
"""Foto reali, calendario delle osservazioni e modelli 3D per ogni specie (e per i sosia).

Fonti (tutte con autore e licenza salvati):
- Wikidata P18 + Wikimedia Commons: foto di riferimento della voce del taxon
- iNaturalist: foto "research grade" (identificazione confermata dalla comunita') dall'Italia centrale
- GBIF: numero di osservazioni in Italia per mese (fenologia reale)
- Sketchfab: scansioni 3D di esemplari reali con licenza Creative Commons

Uso: python3 tools/build_media.py  -> data/media.json + assets/species/*.jpg
I sosia vengono letti da data/species-id.json (campo lookalikes[].latin) se presente.
"""
import json, re, subprocess, sys, time, urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_habitat import get_json  # noqa: E402  (curl + cache + retry)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "species"
CENTRAL_IT = {"swlat": 41.5, "swlng": 11.5, "nelat": 43.6, "nelng": 14.6}
INAT_LICENSES = "cc-by,cc-by-sa,cc0,cc-by-nc,cc-by-nc-sa"


def species_list():
    src = (ROOT / "js" / "species.js").read_text()
    out = []
    for m in re.finditer(r"id: '([a-z]+)'.*?latin: '([^']+)'", src, re.S):
        sid, latin = m.group(1), m.group(2)
        # prende il primo binomio (es. "Suillus luteus, S. granulatus" -> "Suillus luteus")
        out.append((sid, re.match(r"[A-Z][a-z]+ [a-z]+", latin).group(0)))
    return out


def download(url, dest):
    for i in range(5):
        r = subprocess.run(["curl", "-sS", "-L", "-m", "120", "-A", "fungaroli/0.1 (uso personale)", "-o", str(dest), url])
        if r.returncode == 0 and dest.exists() and dest.stat().st_size > 2000:
            return True
        time.sleep(2 ** (i + 1))
    return False


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def commons_photo(latin, slug):
    q = f'SELECT ?item ?img WHERE {{ ?item wdt:P225 "{latin}" . OPTIONAL {{ ?item wdt:P18 ?img }} }} LIMIT 1'
    d = get_json("https://query.wikidata.org/sparql", {"query": q, "format": "json"})
    b = d["results"]["bindings"]
    if not b:
        return None, None
    qid = b[0]["item"]["value"].rsplit("/", 1)[-1]
    if "img" not in b[0]:
        return qid, None
    fname = urllib.parse.unquote(b[0]["img"]["value"].rsplit("/", 1)[-1])
    info = get_json("https://commons.wikimedia.org/w/api.php", {
        "action": "query", "titles": f"File:{fname}", "prop": "imageinfo", "iiprop": "url|extmetadata",
        "iiurlwidth": 640, "format": "json"})
    page = next(iter(info["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    dest = OUT / f"{slug}-ref.jpg"
    if not download(ii["thumburl"], dest):
        return qid, None
    return qid, {
        "file": f"assets/species/{dest.name}", "source": "Wikimedia Commons", "page": ii["descriptionurl"],
        "author": strip_html(meta.get("Artist", {}).get("value")) or "autore su Commons",
        "license": meta.get("LicenseShortName", {}).get("value", ""),
    }


def inat_photos(latin, slug, n=3):
    d = get_json("https://api.inaturalist.org/v1/observations", {
        "taxon_name": latin, "quality_grade": "research", "photo_license": INAT_LICENSES,
        "per_page": 12, "order_by": "votes", **CENTRAL_IT})
    out = []
    for o in d.get("results", []):
        if not o.get("photos") or o.get("taxon", {}).get("name") != latin:
            continue
        ph = o["photos"][0]
        url = ph["url"].replace("square", "medium")
        dest = OUT / f"{slug}-inat{len(out) + 1}.jpg"
        if not download(url, dest):
            continue
        out.append({
            "file": f"assets/species/{dest.name}", "source": "iNaturalist (research grade)",
            "page": f"https://www.inaturalist.org/observations/{o['id']}",
            "author": o["user"].get("name") or o["user"]["login"], "license": ph.get("license_code", "").upper(),
            "place": o.get("place_guess"), "date": o.get("observed_on"),
        })
        time.sleep(1)
        if len(out) >= n:
            break
    return out


def gbif_months(latin):
    m = get_json("https://api.gbif.org/v1/species/match", {"name": latin, "kingdom": "Fungi"})
    key = m.get("usageKey")
    if not key:
        return None
    d = get_json("https://api.gbif.org/v1/occurrence/search", {"taxonKey": key, "country": "IT", "limit": 0, "facet": "month", "facetLimit": 12})
    months = [0] * 12
    for f in (d.get("facets") or [{}])[0].get("counts", []):
        months[int(f["name"]) - 1] = f["count"]
    return {"taxonKey": key, "total": d.get("count", 0), "months": months,
            "page": f"https://www.gbif.org/occurrence/search?taxon_key={key}&country=IT"}


def sketchfab(latin):
    d = get_json("https://api.sketchfab.com/v3/search", {"type": "models", "q": latin, "count": 24})
    genus, epithet = latin.lower().split()
    best = None
    for m in d.get("results", []):
        name = m["name"].lower()
        lic = (m.get("license") or {}).get("label", "")
        if not (genus in name and epithet in name) or not lic.startswith("CC"):
            continue
        score = (2 if re.search(r"museum|nhm|scan|photogramm|real", name + m["user"]["displayName"].lower()) else 0) + (1 if "low poly" not in name else -2)
        if not best or score > best[0]:
            best = (score, m)
    if not best:
        return None
    m = best[1]
    return {"uid": m["uid"], "name": m["name"], "author": m["user"]["displayName"], "license": m["license"]["label"],
            "page": m["viewerUrl"], "embed": f"https://sketchfab.com/models/{m['uid']}/embed?autostart=0&ui_infos=0&ui_watermark=0"}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ids = {}
    idp = ROOT / "data" / "species-id.json"
    if idp.exists():
        ids = json.loads(idp.read_text()).get("species", {})
    media = {"generated": time.strftime("%Y-%m-%d"),
             "note": "Foto reali con autore e licenza. Le foto iNaturalist sono 'research grade': identificazione confermata da piu' utenti, non da un micologo ufficiale.",
             "species": {}, "lookalikes": {}}
    for sid, latin in species_list():
        print(sid, latin, file=sys.stderr)
        qid, ref = commons_photo(latin, sid)
        media["species"][sid] = {"latin": latin, "wikidata": qid, "ref": ref, "inat": inat_photos(latin, sid),
                                 "gbif": gbif_months(latin), "model3d": sketchfab(latin)}
        for lk in ids.get(sid, {}).get("lookalikes", []):
            ll = re.match(r"[A-Z][a-z]+ [a-z]+", lk.get("latin", "") or "")
            if not ll or ll.group(0) in media["lookalikes"]:
                continue
            slug = ll.group(0).lower().replace(" ", "-")
            print("  sosia", ll.group(0), file=sys.stderr)
            lq, lref = commons_photo(ll.group(0), slug)
            media["lookalikes"][ll.group(0)] = {"wikidata": lq, "ref": lref, "inat": inat_photos(ll.group(0), slug, n=1)}
    (ROOT / "data" / "media.json").write_text(json.dumps(media, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
