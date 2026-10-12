#!/usr/bin/env python3
"""Calcola la composizione forestale e l'altimetria di ogni zona.

Fonti:
- Carta Forestale su base tipologica, Regione Lazio (WFS geonode:tipi_forestali2)
- Open-Meteo Elevation API (DEM Copernicus 90 m)

Uso: python3 tools/build_habitat.py   -> scrive data/habitat.json
Richiede: shapely, pyproj
"""
import json, math, sys, time, urllib.parse, urllib.request
from collections import defaultdict
from pathlib import Path

from pyproj import Transformer
from shapely import STRtree
from shapely.geometry import Point, shape
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parent.parent
WFS = "https://geoportale.regione.lazio.it/geoserver/ows"
ELEV = "https://api.open-meteo.com/v1/elevation"
GRID = 21  # punti per lato della griglia di campionamento

to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32633", always_xy=True).transform


def get_json(url, params, tries=4):
    q = url + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(q, headers={"User-Agent": "fungaroli/0.1"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            print(f"  retry {i+1}: {e}", file=sys.stderr)
            time.sleep(2 ** (i + 1))
    raise RuntimeError(q)


def fetch_forest(lat, lon, radius_m):
    dlat = radius_m / 111_320
    dlon = radius_m / (111_320 * math.cos(math.radians(lat)))
    bbox = f"{lon-dlon},{lat-dlat},{lon+dlon},{lat+dlat},EPSG:4326"
    fc = get_json(WFS, {
        "service": "WFS", "version": "1.0.0", "request": "GetFeature",
        "typeName": "geonode:tipi_forestali2", "outputFormat": "application/json",
        "bbox": bbox, "maxFeatures": 20000, "srsName": "EPSG:32633",
    })
    polys = []
    for f in fc["features"]:
        g = shape(f["geometry"])  # gia' in UTM 33N (srsName)
        if not g.is_valid:
            g = make_valid(g)
        p = f["properties"]
        polys.append((g, p.get("categoria") or "?", p.get("tipologia") or "?"))
    return polys


def composition(polys, lat, lon, radius_m):
    cx, cy = to_utm(lon, lat)
    circle = Point(cx, cy).buffer(radius_m, 64)
    cat, tip = defaultdict(float), defaultdict(float)
    for g, c, t in polys:
        a = g.intersection(circle).area / 10_000
        if a > 0:
            cat[c] += a
            tip[t] += a
    r = lambda d: {k: round(v, 1) for k, v in sorted(d.items(), key=lambda x: -x[1])}
    return {"area_ha": round(circle.area / 10_000, 1), "categorie_ha": r(cat), "tipologie_ha": r(tip)}


def sample_points(polys, lat, lon, radius_m, n=GRID):
    """Campiona una griglia regolare nel cerchio: quota (DEM) + categoria forestale."""
    tree = STRtree([p[0] for p in polys])
    pts = []
    for i in range(n):
        for j in range(n):
            dx = (i / (n - 1) * 2 - 1) * radius_m
            dy = (j / (n - 1) * 2 - 1) * radius_m
            if dx * dx + dy * dy > radius_m ** 2:
                continue
            plat = lat + dy / 111_320
            plon = lon + dx / (111_320 * math.cos(math.radians(lat)))
            pts.append((plat, plon))
    els = []
    for k in range(0, len(pts), 100):
        chunk = pts[k:k + 100]
        d = get_json(ELEV, {"latitude": ",".join(f"{p[0]:.5f}" for p in chunk),
                            "longitude": ",".join(f"{p[1]:.5f}" for p in chunk)})
        els += d["elevation"]
        time.sleep(0.5)
    cats = []
    for plat, plon in pts:
        x, y = to_utm(plon, plat)
        pt = Point(x, y)
        c = None
        for idx in tree.query(pt):
            if polys[idx][0].contains(pt):
                c = polys[idx][1]
                break
        cats.append(c)
    return [(round(e), c) for e, c in zip(els, cats)]


def elevation_stats(samples):
    els = sorted(e for e, _ in samples)
    q = lambda f: els[int(f * (len(els) - 1))]
    return {"min": q(0), "p25": q(.25), "median": q(.5), "p75": q(.75), "max": q(1)}


def main():
    zones = json.loads((ROOT / "data" / "zones.json").read_text())["zones"]
    out = {"generated": time.strftime("%Y-%m-%d"),
           "source": "Carta Forestale su base tipologica - Regione Lazio (WFS geonode:tipi_forestali2); Open-Meteo Elevation API",
           "zones": {}}
    for z in zones:
        print(z["id"], file=sys.stderr)
        polys = fetch_forest(z["lat"], z["lon"], z["radius_m"])
        samples = sample_points(polys, z["lat"], z["lon"], z["radius_m"])
        cat_names = sorted({c for _, c in samples if c})
        out["zones"][z["id"]] = {
            "forest": composition(polys, z["lat"], z["lon"], z["radius_m"]),
            "elevation": elevation_stats(samples),
            # campioni [quota, indice categoria | -1 = non bosco]
            "sample_categories": cat_names,
            "samples": [[e, cat_names.index(c) if c else -1] for e, c in samples],
        }
    (ROOT / "data" / "habitat.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
