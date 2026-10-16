#!/usr/bin/env python3
"""Imbocchi dei sentieri: dove il sentiero incontra una strada che si percorre in auto.

Per ogni tratto di sentiero nella zona (data/trails.json) chiede a Valhalla (trace_attributes, profilo pedonale,
map matching sulla rete OSM) su quali archi passa il tracciato. Un imbocco e':
- il punto in cui il sentiero lascia una strada carrozzabile (o una sterrata) e diventa sentiero o mulattiera;
- un nodo del sentiero dove si innesta un arco percorribile in auto (driveability dell'arco che si incrocia):
  «strada» solo se l'arco non e' una pista (use diverso da track), «sterrata» se e' una pista.
  Fino al 16/10/2026 ogni arco percorribile in auto, piste comprese, faceva «strada» (--criterio vecchio).
  Limite: nel primo caso il tipo dipende dall'uso dell'arco lungo il tracciato (strada o pista), non dalla sua
  percorribilita' in auto. Con il criterio nuovo cambia anche la fusione degli imbocchi vicini (MERGE_M, la strada
  vince sulla sterrata): una build completa sposta o toglie alcuni punti, non solo il tipo.
Le quote vengono dal servizio /height dello stesso Valhalla (DEM).

Uso: python3 tools/build_trailheads.py [--out FILE] [--cache DIR] [--criterio nuovo|vecchio] [zona ...]  -> data/trailheads.json
     python3 tools/build_trailheads.py --correggi-tipo [--out FILE] [--cache DIR]
       corregge solo il campo «kind» degli imbocchi «strada» del file indicato, con lo stesso criterio (Valhalla
       /locate, profilo auto, al nodo dell'imbocco; dove non trova archi, il map matching del sentiero), senza
       rifare il resto, e aggiunge la voce in «corrections». Usata il 16/10/2026 sul file del 12/10.
Servizio pubblico: al massimo una richiesta al secondo, anche tra processi (file di blocco .cache/valhalla.lock,
lo stesso di tools/build_access_info.py).
"""
import argparse, fcntl, hashlib, json, math, os, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VALHALLA = "https://valhalla1.openstreetmap.de"
UA = "Fungaroli/0.1 (https://github.com/zatteogit/fungaroli; progetto personale non commerciale)"
LOCK = Path(os.environ.get("VALHALLA_LOCK", ROOT / ".cache" / "valhalla.lock"))
MIN_INTERVAL = 1.0  # secondi tra due richieste
DRIVE = ("forward", "backward", "both")
ROAD = {"road", "ramp", "turn_channel", "driveway", "alley", "parking_aisle", "living_street", "service_road", "culdesac"}
TRACK = {"track"}
MERGE_M = 300  # imbocchi piu' vicini di cosi' sullo stesso sentiero sono lo stesso posto


def throttle():
    """Al massimo una richiesta ogni MIN_INTERVAL secondi, anche tra processi (blocco su file)."""
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCK, "a+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.seek(0)
        try:
            last = float(f.read().strip() or 0)
        except ValueError:
            last = 0
        wait = last + MIN_INTERVAL - time.time()
        if wait > 0:
            time.sleep(wait)
        f.seek(0)
        f.truncate()
        f.write(f"{time.time():.3f}")
        f.flush()


CACHE = None  # cartella per le risposte (--cache): una seconda esecuzione non rifà le richieste


def post(path, body, tries=5):
    f = None
    if CACHE:
        raw = json.dumps(body, sort_keys=True, separators=(",", ":"))
        f = CACHE / path / (hashlib.sha1(raw.encode()).hexdigest() + ".json")
        if f.exists():
            d = json.loads(f.read_text())
            return None if isinstance(d, dict) and "error" in d else d
    for k in range(tries):
        throttle()
        r = subprocess.run(["curl", "-sS", "-m", "120", "-A", UA, f"{VALHALLA}/{path}", "-H", "Content-Type: application/json",
                            "-d", json.dumps(body)], capture_output=True, text=True)
        try:
            d = json.loads(r.stdout)
            if "error" not in d or d.get("error_code") in (442, 443, 444, 171):
                if f:
                    f.parent.mkdir(parents=True, exist_ok=True)
                    f.write_text(r.stdout)
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


def joining_kind(x, criterio):
    """Tipo di imbocco dato da un arco che si innesta sul tratto a piedi; None se non e' percorribile in auto."""
    if x.get("driveability") not in DRIVE:
        return None
    if criterio == "vecchio":
        return "strada"
    return "sterrata" if x.get("use") in TRACK else "strada"


def heads_for_line(line, criterio="nuovo"):
    if len(line) < 2:
        return []
    d = post("trace_attributes", {
        "shape": [{"lat": p[0], "lon": p[1]} for p in line], "costing": "pedestrian", "shape_match": "map_snap",
        "filters": {"attributes": ["edge.use", "edge.road_class", "edge.surface", "edge.names", "edge.begin_shape_index",
                                   "edge.end_shape_index", "node.intersecting_edge.driveability",
                                   "node.intersecting_edge.use", "shape"], "action": "include"}})
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
        # 2) strada (o pista) che si innesta su un tratto a piedi: conta la strada, se c'e'
        if k == "sentiero":
            kinds = {joining_kind(x, criterio) for x in (e.get("end_node") or {}).get("intersecting_edges", [])} - {None}
            if kinds:
                p = shp[e["end_shape_index"]]
                out.append({"lat": p[0], "lon": p[1], "kind": "strada" if "strada" in kinds else "sterrata", "road": None})
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


def correct_kinds(data, trails, today):
    """Correzione mirata del solo campo «kind» degli imbocchi «strada», con il criterio nuovo.
    1. Valhalla /locate (profilo auto, verbose, anche archi di reti isolate) nel punto dell'imbocco: se l'imbocco e' su
       un nodo (entro la tolleranza di aggancio di Valhalla, 5 m) /locate restituisce tutti gli archi percorribili in
       auto del nodo. Resta «strada» se almeno uno non e' una pista; diventa «sterrata» se sono tutte piste.
    2. Se /locate non trova archi entro 5 m, decide il map matching del sentiero (trace_attributes, come nella build):
       gli archi che si innestano in quel punto, con il criterio nuovo. Se nemmeno cosi' il punto si ritrova, resta
       com'e' e si conta."""
    where = [(zid, tid, h) for zid, z in data["zones"].items() for tid, hs in z.items() for h in hs if h["kind"] == "strada"]
    stats = {"strada_prima": len(where), "sterrata_ora": 0, "deciso_dal_map_matching": 0, "non_deciso": 0,
             "su_strada_riservata": 0}
    unresolved = []
    for k in range(0, len(where), 40):
        chunk = where[k:k + 40]
        # minimum_reachability 0: anche gli archi di piccole reti isolate (di norma /locate li salta)
        res = post("locate", {"locations": [{"lat": h["lat"], "lon": h["lon"], "minimum_reachability": 0} for _, _, h in chunk],
                              "costing": "auto", "verbose": True})
        if not isinstance(res, list) or len(res) != len(chunk):
            raise RuntimeError("/locate: risposta inattesa")
        for (zid, tid, h), loc in zip(chunk, res):
            near = [e for e in loc.get("edges") or [] if e.get("distance", 1e9) <= SNAP_M]
            uses = {((e.get("edge") or {}).get("classification") or {}).get("use") for e in near}
            if not near:
                unresolved.append((zid, tid, h))
            elif uses <= TRACK:
                h["kind"] = "sterrata"
                stats["sterrata_ora"] += 1
            elif all((e.get("edge") or {}).get("destination_only") for e in near
                     if ((e.get("edge") or {}).get("classification") or {}).get("use") not in TRACK):
                stats["su_strada_riservata"] += 1
    for zid, tid, h in unresolved:
        t = next(t for t in trails[zid]["trails"] if str(t["id"]) == tid)
        kinds = {p["kind"] for line in t.get("lines", []) for p in heads_for_line(line, "nuovo")
                 if (round(p["lat"], 5), round(p["lon"], 5)) == (h["lat"], h["lon"])}
        if not kinds:
            stats["non_deciso"] += 1
            continue
        stats["deciso_dal_map_matching"] += 1
        if "strada" not in kinds:
            h["kind"] = "sterrata"
            stats["sterrata_ora"] += 1
    data.setdefault("corrections", []).append({
        "date": today, "field": "kind",
        "rule": "«strada» solo dove si innesta un arco percorribile in auto che non è una pista (highway=track); "
                "dove ci sono solo piste l'imbocco diventa «sterrata». Posizioni, quote e nomi non cambiano.",
        "method": "Valhalla /locate (profilo auto, verbose, minimum_reachability 0) nel punto dell'imbocco, archi entro 5 m "
                  "(aggancio al nodo); dove non ne trova, gli archi che si innestano nel punto secondo il map matching del "
                  "sentiero (trace_attributes, profilo pedestrian). Server valhalla1.openstreetmap.de, dati OpenStreetMap (ODbL)",
        "stats": stats,
    })
    return stats


SNAP_M = 5  # tolleranza di aggancio al nodo di Valhalla (node_snap_tolerance, valore predefinito)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("zones", nargs="*", help="solo queste zone (le altre restano come nel file)")
    ap.add_argument("--out", type=Path, default=ROOT / "data/trailheads.json")
    ap.add_argument("--criterio", choices=["nuovo", "vecchio"], default="nuovo")
    ap.add_argument("--correggi-tipo", action="store_true")
    ap.add_argument("--cache", type=Path, help="cartella per le risposte di Valhalla")
    a = ap.parse_args()
    global CACHE
    CACHE = a.cache
    out_path = a.out
    if a.correggi_tipo:
        data = json.loads(out_path.read_text())
        trails = json.loads((ROOT / "data/trails.json").read_text())["zones"]
        print(correct_kinds(data, trails, time.strftime("%Y-%m-%d")), file=sys.stderr)
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
        return
    trails = json.loads((ROOT / "data/trails.json").read_text())["zones"]
    src = ROOT / "data/trailheads.json"
    prev = json.loads(src.read_text())["zones"] if src.exists() else {}
    only = set(a.zones)
    res = {}
    for zid, z in trails.items():
        if only and zid not in only:
            res[zid] = prev.get(zid, {}); continue
        print(zid, file=sys.stderr)
        zt = {}
        for t in z["trails"]:
            pts = []
            for line in t.get("lines", []):
                pts += heads_for_line(line, a.criterio)
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
