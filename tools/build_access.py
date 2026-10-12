#!/usr/bin/env python3
"""Accesso in auto da Rieti a ogni punto di sosta: tempi, strade principali e fondo stradale.

Usa Valhalla (router su dati OpenStreetMap) con trace_attributes per sapere, tratto per tratto,
se la strada e' asfaltata o bianca. Aggiunge la quota dei punti di sosta (Open-Meteo Elevation).

Uso: python3 tools/build_access.py   -> data/access.json
"""
import json, subprocess, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_habitat import ELEV, get_json  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
VALHALLA = "https://valhalla1.openstreetmap.de"
UNPAVED_SURF = {"gravel", "dirt", "compacted", "unpaved", "path", "impassable", "fine_gravel", "ground", "grass"}


def post(path, body, tries=5):
    for i in range(tries):
        r = subprocess.run(["curl", "-sS", "-m", "120", f"{VALHALLA}/{path}", "-H", "Content-Type: application/json",
                            "-d", json.dumps(body)], capture_output=True, text=True)
        if r.returncode == 0:
            try:
                d = json.loads(r.stdout)
                if "error" not in d:
                    return d
                print("  valhalla:", d.get("error"), file=sys.stderr)
            except json.JSONDecodeError:
                pass
        time.sleep(2 ** (i + 1))
    raise RuntimeError(path)


def decode(enc, precision=6):
    coords, idx, lat, lon, f = [], 0, 0, 0, 10 ** precision
    while idx < len(enc):
        for which in (0, 1):
            shift = res = 0
            while True:
                b = ord(enc[idx]) - 63
                idx += 1
                res |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            v = ~(res >> 1) if res & 1 else res >> 1
            if which == 0:
                lat += v
            else:
                lon += v
        coords.append((lat / f, lon / f))
    return coords


def access(origin, p):
    route = post("route", {"locations": [{"lat": origin["lat"], "lon": origin["lon"]}, {"lat": p["lat"], "lon": p["lon"]}],
                           "costing": "auto", "directions_options": {"language": "it-IT", "units": "km"}})
    leg = route["trip"]["legs"][0]
    shape = decode(leg["shape"])
    roads = []
    for m in leg["maneuvers"]:
        names = m.get("street_names") or []
        name = next((n for n in names if n[:2] in ("SS", "SR", "SP", "A2", "E8")), names[0] if names else None)
        if name and m["length"] >= 1.5 and (not roads or roads[-1] != name):
            roads.append(name)
    tr = post("trace_attributes", {"encoded_polyline": leg["shape"], "shape_match": "edge_walk", "costing": "auto",
                                   "filters": {"attributes": ["edge.surface", "edge.unpaved", "edge.length", "edge.use",
                                                              "edge.names", "edge.road_class", "edge.begin_shape_index"],
                                               "action": "include"}})
    edges = tr["edges"]
    unpaved = lambda e: bool(e.get("unpaved")) or e.get("surface") in UNPAVED_SURF or e.get("use") == "track"
    total = sum(e["length"] for e in edges)
    # tratto finale continuo su strada bianca
    tail, k = 0.0, len(edges) - 1
    while k >= 0 and unpaved(edges[k]):
        tail += edges[k]["length"]
        k -= 1
    surfaces = sorted({edges[j].get("surface") for j in range(k + 1, len(edges)) if edges[j].get("surface")})
    last_paved = next((n for j in range(k, -1, -1) for n in (edges[j].get("names") or [])), None)
    tp = shape[min(edges[k + 1]["begin_shape_index"], len(shape) - 1)] if tail > 0 and k + 1 < len(edges) else None
    other_unpaved = sum(e["length"] for e in edges[:k + 1] if unpaved(e))
    step = max(1, len(shape) // 300)
    return {
        "parking": p["name"], "lat": p["lat"], "lon": p["lon"],
        "minutes": round(leg["summary"]["time"] / 60), "km": round(leg["summary"]["length"], 1),
        "roads": roads[:8],
        "paved_km": round(total - tail - other_unpaved, 1), "unpaved_tail_km": round(tail, 1),
        "unpaved_other_km": round(other_unpaved, 1), "unpaved_surfaces": surfaces,
        "transition": {"lat": round(tp[0], 5), "lon": round(tp[1], 5), "after": last_paved} if tp else None,
        "line": [[round(a, 5), round(b, 5)] for a, b in shape[::step]] + [[round(shape[-1][0], 5), round(shape[-1][1], 5)]],
    }


def main():
    zj = json.loads((ROOT / "data" / "zones.json").read_text())
    out = {"generated": time.strftime("%Y-%m-%d"), "source": "Valhalla / OpenStreetMap (ODbL); Open-Meteo Elevation", "zones": {}}
    for z in zj["zones"]:
        print(z["id"], file=sys.stderr)
        acc = []
        for p in z["parking"]:
            a = access(zj["origin"], p)
            acc.append(a)
            print(f"  {p['name']}: {a['minutes']} min, asfalto {a['paved_km']} km, bianca finale {a['unpaved_tail_km']} km {a['unpaved_surfaces']}", file=sys.stderr)
            time.sleep(1)
        els = get_json(ELEV, {"latitude": ",".join(str(a["lat"]) for a in acc), "longitude": ",".join(str(a["lon"]) for a in acc)})["elevation"]
        for a, e in zip(acc, els):
            a["elevation"] = round(e)
        out["zones"][z["id"]] = acc
    (ROOT / "data" / "access.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
