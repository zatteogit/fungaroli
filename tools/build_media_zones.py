#!/usr/bin/env python3
"""Foto dei luoghi da Wikimedia Commons.

  python3 tools/build_media_zones.py candidates DIR zona [zona ...]
      cerca le foto georeferenziate entro qualche km dalla zona e quelle col nome dei posti,
      scarta mappe/stemmi/interni/ritratti, e salva in DIR un provino per zona (da guardare e scegliere a mano)
  python3 tools/build_media_zones.py pick zona "File:Nome.jpg" [zona "File:..." ...]
      scarica la foto scelta (normale e HD) in assets/zones e la registra in data/media-zones.json con autore e licenza
"""
import io, json, re, subprocess, sys, time, urllib.parse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
UA = "fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)"
BAD = re.compile(r"stemma|coat|logo|map|mappa|carta|svg|interno|interior|altare|altar|affresco|fresco|dipinto|painting|statua|statue|lapide|plaque|targa|ritratto|portrait|monumento|caduti|chiesa|church|santuario|eremo|abside|navata|portale|campanile|cartello|sign|bus|treno|auto|car\b|dettaglio|detail|museo|museum|insegna|madonna|santo|san [a-z]+ \(|crocifisso|organo|tomba", re.I)
GOOD = re.compile(r"monte|monti|panoram|vista|view|bosco|faggi|faggeta|valle|vallone|piana|pian|altopiano|cima|vetta|sentiero|lago|prati|pascol|neve|autunno|autumn|forest|wood|landscape|paesaggio|crinale|sella|colle", re.I)
LIC_OK = re.compile(r"^(cc[- ]by|cc[- ]by[- ]sa|cc0|public domain|pd)", re.I)


def get(params):
    params = {**params, "format": "json"}
    for k in range(4):
        r = subprocess.run(["curl", "-sS", "-m", "60", "-A", UA, API + "?" + urllib.parse.urlencode(params)], capture_output=True)
        try:
            return json.loads(r.stdout)
        except json.JSONDecodeError:
            time.sleep(2 * (k + 1))
    return {}


def fetch(url, tries=5):
    # upload.wikimedia.org risponde 429 se si va di fretta: si riprova con pazienza
    for k in range(tries):
        r = subprocess.run(["curl", "-sSL", "-m", "120", "-A", UA, "-w", "\n%{http_code}", url], capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if code == b"200" and body[:2] == b"\xff\xd8":
            return body
        time.sleep(5 * (k + 1))
    return b""


def info(titles, width=480):
    out = {}
    for i in range(0, len(titles), 40):
        d = get({"action": "query", "titles": "|".join(titles[i:i + 40]), "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": width})
        for p in (d.get("query", {}).get("pages") or {}).values():
            ii = (p.get("imageinfo") or [None])[0]
            if ii:
                out[p["title"]] = ii
    return out


def meta(ii):
    m = ii.get("extmetadata", {})
    val = lambda k: re.sub(r"<[^>]+>", "", (m.get(k) or {}).get("value", "")).strip()
    return {"license": val("LicenseShortName"), "author": val("Artist") or val("Credit"), "desc": val("ImageDescription")[:160]}


def candidates(outdir, zid, z, names):
    titles = {}
    for r in (z.get("radius_m", 3000) + 2500, z.get("radius_m", 3000) + 7000):
        d = get({"action": "query", "list": "geosearch", "gsnamespace": 6, "gscoord": f"{z['lat']}|{z['lon']}", "gsradius": min(10000, r), "gslimit": 200})
        for g in d.get("query", {}).get("geosearch", []):
            titles.setdefault(g["title"], g["dist"])
    for n in names:
        d = get({"action": "query", "list": "search", "srnamespace": 6, "srsearch": n, "srlimit": 50})
        for s in d.get("query", {}).get("search", []):
            titles.setdefault(s["title"], 99999)
    ii = info(list(titles))
    rows = []
    for t, i in ii.items():
        mt = meta(i)
        if i.get("mime") != "image/jpeg" or BAD.search(t) or BAD.search(mt["desc"]):
            continue
        if i["width"] < 1600 or i["width"] < i["height"] * 1.2 or not LIC_OK.search(mt["license"]):
            continue
        score = (2 if GOOD.search(t + " " + mt["desc"]) else 0) + (1 if titles[t] < 99999 else 0) + min(i["width"], 4000) / 4000
        rows.append((score, t, i, mt))
    rows.sort(key=lambda x: -x[0])
    rows = rows[:24]
    # provino: 4 colonne, numerate
    W, H = 360, 240
    sheet = Image.new("RGB", (W * 4, (H + 34) * ((len(rows) + 3) // 4 or 1)), "white")
    dr = ImageDraw.Draw(sheet)
    listing = []
    for k, (sc, t, i, mt) in enumerate(rows):
        try:
            im = Image.open(io.BytesIO(fetch(i["thumburl"]))).convert("RGB")
        except Exception:
            continue
        im.thumbnail((W, H))
        x, y = (k % 4) * W, (k // 4) * (H + 34)
        sheet.paste(im, (x + (W - im.width) // 2, y))
        dr.text((x + 6, y + H + 4), f"{k} {t[5:45]}", fill="black")
        dr.text((x + 6, y + H + 18), f"{mt['license'][:14]} {int(titles[t]) if titles[t] < 99999 else 'nome'}m", fill="gray")
        listing.append({"n": k, "title": t, "license": mt["license"], "author": mt["author"][:60], "dist": titles[t], "desc": mt["desc"]})
        time.sleep(0.2)
    sheet.save(Path(outdir) / f"{zid}.jpg", quality=80)
    (Path(outdir) / f"{zid}.json").write_text(json.dumps(listing, ensure_ascii=False, indent=1))
    print(zid, len(rows), "candidate")


def pick(zid, title):
    i = info([title], 2000)[title]
    mt = meta(i)
    raw = Image.open(io.BytesIO(fetch(i["thumburl"]))).convert("RGB")  # 2000 px: basta per l'HD
    out = ROOT / "assets/zones"
    def save(img, long, path):
        im = img.copy(); im.thumbnail((long, long), Image.LANCZOS); im.save(path, quality=82, optimize=True, progressive=True); return im.size
    hd = save(raw, 2000, out / f"{zid}-hd.jpg")
    save(raw, 900, out / f"{zid}.jpg")
    p = ROOT / "data/media-zones.json"
    d = json.loads(p.read_text())
    d["zones"][zid] = {"file": f"assets/zones/{zid}.jpg", "file_hd": f"assets/zones/{zid}-hd.jpg", "source": "Wikimedia Commons",
                       "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")), "author": mt["author"][:120], "license": mt["license"], "size": list(hd)}
    d["generated"] = time.strftime("%Y-%m-%d")
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1))
    print(zid, "<-", title, mt["license"], mt["author"][:40])


if __name__ == "__main__":
    zl = json.loads((ROOT / "data/zones.json").read_text())
    zl = zl["zones"] if isinstance(zl, dict) and "zones" in zl else zl
    Z = {z["id"]: z for z in zl}
    if sys.argv[1] == "candidates":
        for zid in sys.argv[3:]:
            z = Z[zid]
            names = [n.strip() for n in re.split(r"[/(),–]", z["name"]) if len(n.strip()) > 3]
            candidates(sys.argv[2], zid, z, names)
    elif sys.argv[1] == "pick":
        a = sys.argv[2:]
        for zid, title in zip(a[::2], a[1::2]):
            pick(zid, title)
