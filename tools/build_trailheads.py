#!/usr/bin/env python3
"""Imbocchi dei sentieri: dove il sentiero incontra una strada che si percorre in auto.

Per ogni tratto di sentiero nella zona (data/trails.json) chiede a Valhalla (trace_attributes, profilo pedonale,
map matching sulla rete OSM) su quali archi passa il tracciato. Un imbocco e':
- il punto in cui il sentiero lascia una strada carrozzabile (o una sterrata) e diventa sentiero o mulattiera;
- un nodo del sentiero dove si innesta una strada percorribile in auto (driveability dell'arco che si incrocia).
Le quote vengono dal servizio /height dello stesso Valhalla (DEM).

Uso: python3 tools/build_trailheads.py [zona ...]  -> data/trailheads.json
"""
import json, math, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VALHALLA = "https://valhalla1.openstreetmap.de"
ROAD = {"road", "ramp", "turn_channel", "driveway", "alley", "parking_aisle", "living_street", "service_road", "culdesac"}
TRACK = {"track"}
MERGE_M = 300  # imbocchi piu' vicini di cosi' sullo stesso sentiero sono lo stesso posto


def post(path, body, tries=5):
    for k in range(tries):
        r = subprocess.run(["curl", "-sS", "-m", "120", f"{VALHALLA}/{path}", "-H", "Content-Type: application/json",
                            "-d", json.dumps(body)], capture_output=True, text=True)
        try:
            d = json.loads(r.stdout)
            if "error" not in d:
                return d
            print("  valhalla:", d.get("error"), file=sys.stderr)
            if d.get("error_code") in (442, 443, 444, 171):  # nessun percorso/match: inutile riprovare
                return None
        except json.JSONDecodeError:
            pass
        time.sleep(2 * (k + 1))
    return None


def decode(s, prec=6):
    pts, i, lat, lon, f = [], 0, 0, 0, 10 ** prec
    while i < len(s):
        for which in (0, 1):
            shift = res = 0
            while True:
                b = ord(s[i]) - 63; i += 1
                res |= (b & 0x1F) << shift; shift += 5
                if b < 0x20:
                    break
            d = ~(res >> 1) if res & 1 else res >> 1
            if which == 0: lat += d
            else: lon += d
        pts.append((lat / f, lon / f))
    return pts


def dist(a, b):
    k = math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * k)


def kind(e):
    u = e.get("use")
    return "strada" if u in ROAD else "sterrata" if u in TRACK else "sentiero"


def heads_for_line(line):
    if len(line) < 2:
        return []
    d = post("trace_attributes", {
        "shape": [{"lat": p[0], "lon": p[1]} for p in line], "costing": "pedestrian", "shape_match": "map_snap",
        "filters": {"attributes": ["edge.use", "edge.road_class", "edge.surface", "edge.names", "edge.begin_shape_index",
                                   "edge.end_shape_index", "node.intersecting_edge.driveability", "shape"], "action": "include"}})
    if not d or not d.get("edges"):
        return []
    shp = decode(d["shape"])
    edges = d["edges"]
    out = []
    for i, e in enumerate(edges):
        k = kind(e)
        # 1) passaggio strada/sterrata -> sentiero (o il contrario) lungo il tracciato
        if i > 0:
            pk = kind(edges[i - 1])
            if pk != "sentiero" and k == "sentiero":
                p = shp[e["begin_shape_index"]]
                out.append({"lat": p[0], "lon": p[1], "kind": pk, "road": (edges[i - 1].get("names") or [None])[0]})
            elif pk == "sentiero" and k != "sentiero":
                p = shp[e["begin_shape_index"]]
                out.append({"lat": p[0], "lon": p[1], "kind": k, "road": (e.get("names") or [None])[0]})
        # 2) strada che si innesta su un tratto a piedi
        if k == "sentiero":
            for x in (e.get("end_node") or {}).get("intersecting_edges", []):
                if x.get("driveability") in ("forward", "backward", "both"):
                    p = shp[e["end_shape_index"]]
                    out.append({"lat": p[0], "lon": p[1], "kind": "strada", "road": None})
                    break
    # il tracciato comincia o finisce gia' su strada: anche quello e' un imbocco
    if edges and kind(edges[0]) != "sentiero" and any(kind(e) == "sentiero" for e in edges):
        p = shp[0]; out.append({"lat": p[0], "lon": p[1], "kind": kind(edges[0]), "road": (edges[0].get("names") or [None])[0]})
    return out


def merge(points):
    rank = {"strada": 0, "sterrata": 1}
    keep = []
    for p in sorted(points, key=lambda x: rank.get(x["kind"], 2)):
        if all(dist((p["lat"], p["lon"]), (q["lat"], q["lon"])) > MERGE_M for q in keep):
            keep.append(p)
    return keep


def main():
    trails = json.loads((ROOT / "data/trails.json").read_text())["zones"]
    out_path = ROOT / "data/trailheads.json"
    prev = json.loads(out_path.read_text())["zones"] if out_path.exists() else {}
    only = set(sys.argv[1:])
    res = {}
    for zid, z in trails.items():
        if only and zid not in only:
            res[zid] = prev.get(zid, {}); continue
        print(zid, file=sys.stderr)
        zt = {}
        for t in z["trails"]:
            pts = []
            for line in t.get("lines", []):
                pts += heads_for_line(line)
                time.sleep(0.4)
            pts = merge(pts)
            if pts:
                h = post("height", {"shape": [{"lat": p["lat"], "lon": p["lon"]} for p in pts]})
                for p, e in zip(pts, (h or {}).get("height", [None] * len(pts))):
                    p["ele"] = round(e) if isinstance(e, (int, float)) else None
                    p["lat"], p["lon"] = round(p["lat"], 5), round(p["lon"], 5)
                zt[str(t["id"])] = pts
            print(f"  {t.get('ref') or t.get('name')}: {len(pts)} imbocchi", file=sys.stderr)
        res[zid] = zt
    out_path.write_text(json.dumps({
        "generated": time.strftime("%Y-%m-%d"),
        "source": "OpenStreetMap via Valhalla (trace_attributes, height): punti dove il sentiero incontra una strada carrozzabile o una sterrata",
        "zones": res,
    }, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
