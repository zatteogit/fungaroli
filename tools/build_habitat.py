#!/usr/bin/env python3
"""Calcola la composizione forestale e l'altimetria di ogni zona.

Fonti:
- Carta Forestale su base tipologica, Regione Lazio (WFS geonode:tipi_forestali2)
- Open-Meteo Elevation API (DEM Copernicus 90 m)

Uso: python3 tools/build_habitat.py   -> scrive data/habitat.json
Richiede: shapely, pyproj
"""
import json, math, subprocess, sys, time, urllib.parse
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


def get_json(url, params, tries=5):
    """GET JSON via curl (piu' robusto di urllib dietro proxy)."""
    q = url + ("?" + urllib.parse.urlencode(params) if params else "")
    for i in range(tries):
        r = subprocess.run(["curl", "-sS", "-m", "120", "-A", "fungaroli/0.1", q], capture_output=True, text=True)
        if r.returncode == 0:
            try:
                return json.loads(r.stdout)
            except json.JSONDecodeError:
                pass
        print(f"  retry {i+1}: {r.stderr.strip()[:120]}", file=sys.stderr)
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
    return [(round(e), c, plat, plon) for e, c, (plat, plon) in zip(els, cats, pts)]


SURF = {"paved_smooth": 0, "paved": 0, "paved_rough": 0, "compacted": 1, "dirt": 1, "gravel": 1, "path": 2, "impassable": 2}


def nearest_roads(samples):
    """Strada carrozzabile piu' vicina a ogni punto (Valhalla /locate): distanza, fondo, nome."""
    out = []
    for k in range(0, len(samples), 40):
        chunk = samples[k:k + 40]
        body = {"locations": [{"lat": s[2], "lon": s[3]} for s in chunk], "costing": "auto", "verbose": True}
        for i in range(5):
            r = subprocess.run(["curl", "-sS", "-m", "120", "https://valhalla1.openstreetmap.de/locate",
                                "-H", "Content-Type: application/json", "-d", json.dumps(body)], capture_output=True, text=True)
            try:
                res = json.loads(r.stdout)
                if isinstance(res, list):
                    break
            except json.JSONDecodeError:
                pass
            time.sleep(2 ** (i + 1))
        else:
            raise RuntimeError("valhalla locate")
        for loc in res:
            edges = loc.get("edges") or []
            if not edges:
                out.append(None)
                continue
            e = min(edges, key=lambda x: x.get("distance", 1e9))
            cl = (e.get("edge") or {}).get("classification") or {}
            names = (e.get("edge_info") or {}).get("names") or []
            name = next((n for n in names if n[:2] in ("SS", "SR", "SP")), names[0] if names else None)
            out.append((round(e["distance"]), SURF.get(cl.get("surface"), 1), name, round(e["correlated_lat"], 5), round(e["correlated_lon"], 5)))
        time.sleep(1)
    return out


def elevation_stats(samples):
    els = sorted(s[0] for s in samples)
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
        cat_names = sorted({s[1] for s in samples if s[1]})
        roads = nearest_roads(samples)
        road_names = sorted({r[2] for r in roads if r and r[2]})
        out["zones"][z["id"]] = {
            "forest": composition(polys, z["lat"], z["lon"], z["radius_m"]),
            "elevation": elevation_stats(samples),
            # campioni [quota, categoria (-1 = non bosco), lat, lon,
            #           m dalla strada carrozzabile, fondo (0 asfalto, 1 bianca, 2 sentiero), strada, lat/lon sulla strada]
            "sample_categories": cat_names,
            "road_names": road_names,
            "samples": [[s[0], cat_names.index(s[1]) if s[1] else -1, round(s[2], 5), round(s[3], 5)]
                        + ([r[0], r[1], road_names.index(r[2]) if r[2] else -1, r[3], r[4]] if r else [None, None, -1, None, None])
                        for s, r in zip(samples, roads)],
        }
    (ROOT / "data" / "habitat.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
