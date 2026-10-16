#!/usr/bin/env python3
"""Sentieri escursionistici (OSM, via Waymarked Trails) e percorso auto da Rieti per ogni zona.

Per ogni sentiero che attraversa la zona: tratto interno al cerchio, campioni ogni 100 m con
quota (DEM Open-Meteo) e categoria della Carta Forestale, per stimare quanti km passano in
bosco adatto a ciascuna specie. Per il percorso auto: OSRM da Rieti al primo punto di sosta.

Uso: python3 tools/build_trails.py   -> data/trails.json
Richiede: shapely, pyproj (come build_habitat.py)
"""
import json, math, sys, time, urllib.parse
from pathlib import Path

from pyproj import Transformer
from shapely import STRtree
from shapely.geometry import LineString, MultiLineString, Point, shape
from shapely.ops import linemerge, transform

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_habitat import ELEV, fetch_forest, get_json  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
WMT = "https://hiking.waymarkedtrails.org/api/v1"
OSRM = "https://router.project-osrm.org/route/v1/driving"
STEP_M = 100
SKIP_GROUPS = set()  # i lunghi percorsi (E1, Sentiero Italia) restano: si usa solo il tratto nella zona

m2utm = Transformer.from_crs("EPSG:3857", "EPSG:32633", always_xy=True).transform
utm2ll = Transformer.from_crs("EPSG:32633", "EPSG:4326", always_xy=True).transform
ll2m = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform
ll2utm = Transformer.from_crs("EPSG:4326", "EPSG:32633", always_xy=True).transform


def collect_ways(node, out):
    if isinstance(node, dict):
        if node.get("route_type") == "base" and node.get("geometry"):
            g = node["geometry"]
            out.append(shape(json.loads(g.replace("'", '"')) if isinstance(g, str) else g))
        for v in node.values():
            collect_ways(v, out)
    elif isinstance(node, list):
        for v in node:
            collect_ways(v, out)


CACHE = ROOT / ".cache" / "wmt"
def details(rid):
    f = CACHE / f"{rid}.json"
    if f.exists():
        return json.loads(f.read_text())
    d = get_json(f"{WMT}/details/relation/{rid}", {})
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(d))
    time.sleep(0.3)
    return d


def elevations(pts):
    out = []
    for k in range(0, len(pts), 100):
        chunk = pts[k:k + 100]
        d = get_json(ELEV, {"latitude": ",".join(f"{p[1]:.5f}" for p in chunk),
                            "longitude": ",".join(f"{p[0]:.5f}" for p in chunk)})
        out += d["elevation"]
        time.sleep(0.4)
    return out


def drive(origin, dest):
    url = f"{OSRM}/{origin['lon']},{origin['lat']};{dest['lon']},{dest['lat']}"
    d = get_json(url, {"overview": "simplified", "geometries": "geojson", "steps": "true"})
    r = d["routes"][0]
    roads = []
    for st in r["legs"][0]["steps"]:
        name = st.get("ref") or st.get("name")
        if name and st["distance"] > 1500 and (not roads or roads[-1] != name):
            roads.append(name)
    coords = [[round(lat, 5), round(lon, 5)] for lon, lat in r["geometry"]["coordinates"]]
    return {"minutes": round(r["duration"] / 60), "km": round(r["distance"] / 1000), "roads": roads[:8], "line": coords}


def full_length_m(official, mapped, superroute, longest_inside):
    """Lunghezza dell'itinerario completo in metri, oppure None (n.d.).

    Il tag «distance» di OSM (official_length di Waymarked Trails) vale solo se non è più corto
    del tratto più lungo che il sentiero ha dentro una zona: un intero non è più corto di una sua
    parte (es. CAP 21004687: distance=1 con 6,9 km nella zona). Altrimenti si usa la geometria
    mappata (route.length), tranne per le superroute con un «distance» incoerente: la loro
    geometria può comprendere le varianti (CAP: 664 km mappati per un cammino di circa 530),
    quindi restano n.d. Una superroute senza «distance» usa la geometria (es. Cammino del Salto,
    91,5 km in 6 tappe). La geometria mappata e il tratto nella zona
    sono misurati in modi diversi (WMT e UTM 33N): se differiscono di pochi metri vale il tratto,
    che è comunque parte dell'intero.
    """
    if official and official >= longest_inside:
        return official
    if not mapped or (superroute and official):
        return None
    return max(mapped, longest_inside)


def set_full_lengths(zones, raw, longest):
    """Scrive total_km per ogni sentiero, deciso una volta per relazione e uguale in tutte le zone."""
    warned = set()
    for zone in zones.values():
        for tr in zone["trails"]:
            official, mapped, superroute = raw[tr["id"]]
            length_m = full_length_m(official, mapped, superroute, longest[tr["id"]])
            if official and length_m != official and tr["id"] not in warned:
                warned.add(tr["id"])
                print(f"  {tr['id']} {tr.get('ref')}: distance {official / 1000:.2f} km < tratto locale "
                      f"{longest[tr['id']] / 1000:.2f} km -> {'n.d.' if length_m is None else f'{length_m / 1000:.2f} km'}",
                      file=sys.stderr)
            total = round(length_m / 1000, 1) if length_m else None
            tr["total_km"] = total if total is None or total >= tr["in_zone_km"] else None


def main():
    zj = json.loads((ROOT / "data" / "zones.json").read_text())
    out = {"generated": time.strftime("%Y-%m-%d"),
           "source": "OpenStreetMap (ODbL) via Waymarked Trails; Carta Forestale Regione Lazio; Open-Meteo Elevation; OSRM",
           "zones": {}}
    raw, longest = {}, {}  # per relazione: (official_length, route.length, superroute) e tratto più lungo in una zona
    for z in zj["zones"]:
        print(z["id"], file=sys.stderr)
        R = z["radius_m"]
        dlat = R / 111_320
        dlon = R / (111_320 * math.cos(math.radians(z["lat"])))
        x0, y0 = ll2m(z["lon"] - dlon, z["lat"] - dlat)
        x1, y1 = ll2m(z["lon"] + dlon, z["lat"] + dlat)
        lst = get_json(f"{WMT}/list/by_area", {"bbox": f"{x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}", "limit": 100})["results"]
        polys = fetch_forest(z["lat"], z["lon"], R)
        tree = STRtree([p[0] for p in polys])
        cats = sorted({p[1] for p in polys})
        cx, cy = ll2utm(z["lon"], z["lat"])
        circle = Point(cx, cy).buffer(R, 64)
        trails = []
        for it in lst:
            d = details(it["id"])
            ways = []
            collect_ways(d.get("route"), ways)
            if not ways:
                continue
            geom = transform(m2utm, linemerge(MultiLineString([w for w in ways if isinstance(w, LineString)])))
            inside = geom.intersection(circle)
            if inside.is_empty or inside.length < 500:
                continue
            parts = list(inside.geoms) if hasattr(inside, "geoms") else [inside]
            parts = [p for p in parts if isinstance(p, LineString) and p.length >= 150]
            samples_xy = []
            for p in parts:
                n = max(1, int(p.length // STEP_M))
                samples_xy += [p.interpolate((k + 0.5) * p.length / n) for k in range(n)]
            ll = [utm2ll(pt.x, pt.y) for pt in samples_xy]
            els = elevations(ll)
            samp = []
            for pt, e in zip(samples_xy, els):
                c = -1
                for idx in tree.query(pt):
                    if polys[idx][0].contains(pt):
                        c = cats.index(polys[idx][1])
                        break
                samp.append([round(e), c])
            lines = []
            for p in parts:
                s = p.simplify(15)
                lines.append([[round(lat, 5), round(lon, 5)] for lon, lat in (utm2ll(x, y) for x, y in s.coords)])
            t = d.get("tags", {})
            raw[it["id"]] = (d.get("official_length"), d["route"].get("length") or 0, t.get("type") == "superroute")
            longest[it["id"]] = max(longest.get(it["id"], 0), inside.length)
            trails.append({
                "id": it["id"], "ref": it.get("ref") or t.get("ref"), "name": it.get("name") or t.get("name"),
                "itinerary": it.get("itinerary") or [], "group": it.get("group"),
                "operator": d.get("operator") or t.get("operator"), "difficulty": t.get("cai_scale"),
                "total_km": None,  # scritto da set_full_lengths, quando tutte le zone sono note
                "duration": t.get("duration:forward") or t.get("duration"),
                "ascent": t.get("ascent"),
                "in_zone_km": round(inside.length / 1000, 1),
                "samples": samp, "lines": lines,
            })
        trails.sort(key=lambda x: -x["in_zone_km"])
        dest = z["parking"][0]
        out["zones"][z["id"]] = {"sample_categories": cats, "trails": trails, "drive": drive(zj["origin"], dest)}
        print(f"  {len(trails)} sentieri", file=sys.stderr)
    set_full_lengths(out["zones"], raw, longest)
    (ROOT / "data" / "trails.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
