#!/usr/bin/env python3
"""Cerca nuove zone candidate su tutta l'area raggiungibile da Rieti.

Reticolo di punti ogni ~1 km entro RADIUS_KM da Rieti: per ciascuno tipo di bosco
(Carta Forestale Regione Lazio, WFS geonode:tipi_forestali2) e quota (Open-Meteo Elevation, DEM Copernicus).
Idoneita' di un punto per una specie = affinita' bosco x adattamento alla quota (stesse tabelle di js/species.js).
Un nucleo vale la somma delle idoneita' nel raggio di 2,5 km, pesata per l'interesse della specie.

Uso: python3 tools/scan_province.py <species.json> <uscita.json>
"""
import json, math, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_habitat import get_json, WFS, ELEV, to_utm  # noqa: E402
from shapely import STRtree
from shapely.geometry import Point, shape
from shapely.validation import make_valid

RIETI = (42.4040, 12.8625)
RADIUS_KM = 55
STEP_KM = 1.0
WEIGHT = {'porcini': 1.0, 'ovolo': 1.0, 'finferli': 0.8, 'altri': 0.6, 'pineta': 0.5}

def tiles():
    lat0, lat1 = RIETI[0] - RADIUS_KM / 111, RIETI[0] + RADIUS_KM / 111
    k = 111 * math.cos(math.radians(RIETI[0]))
    lon0, lon1 = RIETI[1] - RADIUS_KM / k, RIETI[1] + RADIUS_KM / k
    t = 0.1
    la = lat0
    while la < lat1:
        lo = lon0
        while lo < lon1:
            yield (lo, la, min(lo + t, lon1), min(la + t, lat1))
            lo += t
        la += t
    return

def main():
    species = json.load(open(sys.argv[1]))
    polys = []
    for i, (a, b, c, d) in enumerate(tiles()):
        fc = get_json(WFS, {"service": "WFS", "version": "1.0.0", "request": "GetFeature",
                            "typeName": "geonode:tipi_forestali2", "outputFormat": "application/json",
                            "bbox": f"{a:.4f},{b:.4f},{c:.4f},{d:.4f},EPSG:4326", "maxFeatures": 20000, "srsName": "EPSG:32633"})
        for f in fc["features"]:
            g = shape(f["geometry"])
            if not g.is_valid:
                g = make_valid(g)
            polys.append((g, f["properties"].get("categoria") or "?"))
        print(f"tile {i} poligoni {len(polys)}", file=sys.stderr)
    tree = STRtree([p[0] for p in polys])
    k = 111 * math.cos(math.radians(RIETI[0]))
    pts = []
    n = int(RADIUS_KM / STEP_KM)
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            if (i * i + j * j) * STEP_KM ** 2 > RADIUS_KM ** 2:
                continue
            pts.append((RIETI[0] + j * STEP_KM / 111, RIETI[1] + i * STEP_KM / k))
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
    # quota solo dove c'e' bosco (risparmia richieste)
    need = [q for q, c in enumerate(cats) if c]
    els = {}
    for s in range(0, len(need), 100):
        chunk = need[s:s + 100]
        d = get_json(ELEV, {"latitude": ",".join(f"{pts[q][0]:.4f}" for q in chunk),
                            "longitude": ",".join(f"{pts[q][1]:.4f}" for q in chunk)})
        for q, e in zip(chunk, d["elevation"]):
            els[q] = e
        time.sleep(0.4)
    def fit(e, lo, hi):
        if lo <= e <= hi: return 1.0
        dd = lo - e if e < lo else e - hi
        return max(0.0, 1 - dd / 200)
    out = []
    for q, (plat, plon) in enumerate(pts):
        c = cats[q]
        if not c: continue
        e = els[q]
        suit = {}
        for sp in species:
            v = sp["forest"].get(c, 0) * fit(e, *sp["elev"])
            if v > 0: suit[sp["id"]] = round(v, 2)
        out.append({"lat": round(plat, 4), "lon": round(plon, 4), "e": round(e), "cat": c, "suit": suit})
    json.dump({"step_km": STEP_KM, "radius_km": RADIUS_KM, "points": out, "weight": WEIGHT}, open(sys.argv[2], "w"))
    print(f"{len(pts)} punti, {len(out)} in bosco", file=sys.stderr)

if __name__ == "__main__":
    main()
