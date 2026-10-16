#!/usr/bin/env python3
"""Accesso in auto e ultimo tratto a piedi per ogni campione di bosco di data/habitat.json -> data/access-info.json.

Il file è statico (non passa dal CMS, come data/habitat-info.json) ed è allineato per indice ai campioni di
habitat.json: il campione i di zones.<id>.samples descrive il campione i della stessa zona là. I campioni
fuori bosco (categoria -1 in habitat.json) valgono null. Sono informazioni da mostrare: non entrano
nell'indice biologico e non cambiano la comodità calcolata dall'app.

Per ogni campione di bosco:
1. il punto più vicino su una strada percorribile in auto che NON sia una pista (Valhalla /locate, profilo auto,
   verbose). Attributi di Valhalla usati per arco: classification.use, classification.classification,
   classification.surface, destination_only, access.car. Vale come strada un arco con uso in ROAD_USE; si scartano
   quindi track (highway=track di OpenStreetMap), driveway (service=driveway, accesso a una proprietà) e gli usi da
   sentiero; si scarta anche l'arco riservato (destination_only: in Valhalla 3.9.1, lua/graph.lua, access,
   motor_vehicle, motorcar o vehicle = private, destination, customers, delivery, permit, residents) e l'autostrada
   (in autostrada non ci si ferma). Gli archi con access o motor_vehicle = no, agricultural, forestry, discouraged non
   arrivano nemmeno: il profilo auto li esclude già nella ricerca.
   Ricerca in tre passi: l'arco più vicino di qualunque tipo; se va scartato, l'arco più vicino tra le classi da
   trunk a residential (search_filter), che non comprendono né le piste né le strade di servizio; infine le strade
   di servizio valide (highway=service non riservate) più vicine di quella, tra gli archi entro quella distanza
   (al massimo RADIUS_MAX: oltre, il server non cerca).
2. la distanza dalla pista più vicina, se è più vicina della strada scelta;
3. il percorso a piedi su OpenStreetMap da quel punto al campione (Valhalla /route, profilo pedestrian, sentieri
   fino a sac_scale=mountain_hiking): lunghezza sulla rete e tratti fuori rete in linea d'aria (dal punto dove la
   rete finisce al campione, più l'eventuale tratto iniziale); salita e discesa dal DEM lungo la traccia, letto ogni
   10 m; oppure nessun percorso;
4. quota del punto strada e dislivello verso il campione, dal DEM TINITALY 1.1 (INGV, 10 m, modello del terreno).

Nessuna soglia nel dato: se il percorso manca o è molto più lungo della linea d'aria, lo decide l'interfaccia
mostrando i numeri («ultimo tratto da verificare»).

Uso:   python3 tools/build_access_info.py [--cache DIR] [--dem-dir DIR] [--out FILE] [--zones a,b] [--solo-strade]
Serve: numpy, rasterio, pyproj e curl. Le risposte di Valhalla restano in cache (default .cache/access-info) e una
nuova esecuzione riparte da lì. I tasselli TINITALY (4, circa 350 MB) si condividono con tools/build_habitat_info.py
(default .cache/habitat-info/tinitaly) e si scaricano solo se mancano.
Servizio pubblico (Valhalla FOSSGIS): al massimo una richiesta al secondo, anche tra processi diversi
(file di blocco .cache/valhalla.lock, lo usa anche tools/build_trailheads.py).
"""
import argparse, fcntl, hashlib, json, math, os, subprocess, sys, time
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
UA = "Fungaroli/0.1 (https://github.com/zatteogit/fungaroli; progetto personale non commerciale)"
VALHALLA = "https://valhalla1.openstreetmap.de"
TINITALY = "https://tinitaly.pi.ingv.it/data_1.1/{t}_s10/{t}_s10.zip"
LOCK = Path(os.environ.get("VALHALLA_LOCK", ROOT / ".cache" / "valhalla.lock"))
MIN_INTERVAL = 1.0   # secondi tra due richieste al servizio pubblico
BATCH = 40           # punti per richiesta /locate, come tools/build_habitat.py
STEP = 10            # passo di campionamento del DEM lungo la traccia: la cella di TINITALY

# Classi stradali di Valhalla (dall'autostrada alle strade di servizio); search_filter usa questi nomi.
CLASSES = ["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service_other"]
# Usi di Valhalla che valgono come strada su cui lasciare l'auto. Restano fuori, tra gli altri: track (highway=track),
# driveway (service=driveway, accesso a una proprietà), emergency_access, e i sentieri percorribili in auto per i tag.
ROAD_USE = {"road", "living_street", "service_road", "parking_aisle", "alley", "culdesac", "turn_channel", "ramp"}
USES = sorted(ROAD_USE)  # valori del campo «uso» (indice)
# Fondo: stessi codici di habitat.json (tools/build_habitat.py).
SURF = {"paved_smooth": 0, "paved": 0, "paved_rough": 0, "compacted": 1, "dirt": 1, "gravel": 1, "path": 2, "impassable": 2}
PEDESTRIAN = {"max_hiking_difficulty": 2}  # sac_scale fino a mountain_hiking (T2); il valore predefinito (1) esclude i T2
NO_ROUTE = {442, 171, 170}  # nessun percorso, nessun arco adatto vicino, regioni non collegate: risposta definitiva

to_utm32 = Transformer.from_crs("EPSG:4326", "EPSG:32632", always_xy=True).transform  # griglia TINITALY
CACHE = ROOT / ".cache" / "access-info"
DEM_DIR = ROOT / ".cache" / "habitat-info" / "tinitaly"


# ---------------------------------------------------------------- rete: una richiesta al secondo, con cache

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


STATS = Counter()


def valhalla(path, body, tries=8):
    """POST JSON a Valhalla con cache su disco. Ritorna la risposta, o il dizionario d'errore se è definitivo."""
    raw = json.dumps(body, sort_keys=True, separators=(",", ":"))
    f = CACHE / "valhalla" / path / (hashlib.sha1(raw.encode()).hexdigest() + ".json")
    if f.exists():
        STATS["cache"] += 1
        return json.loads(f.read_text())
    for i in range(tries):
        throttle()
        STATS["rete"] += 1
        r = subprocess.run(["curl", "-sS", "-m", "120", "-A", UA, "-H", "Content-Type: application/json",
                            "-w", "\n%{http_code}", "-d", raw, f"{VALHALLA}/{path}"], capture_output=True, text=True)
        text, _, code = r.stdout.rpartition("\n")
        try:
            d = json.loads(text)
        except json.JSONDecodeError:
            d = None
        if d is not None and (code == "200" or (isinstance(d, dict) and d.get("error_code") in NO_ROUTE)):
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text)
            return d
        print(f"  riprovo ({i + 1}): {path} HTTP {code} {(text or r.stderr).strip()[:160]}", file=sys.stderr)
        time.sleep(min(300, 5 * 2 ** i))
    raise RuntimeError(f"Valhalla {path} non risponde")


def status():
    r = subprocess.run(["curl", "-sS", "-m", "60", "-A", UA, f"{VALHALLA}/status"], capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        return {"versione": d.get("version"),
                "dati_osm": time.strftime("%Y-%m-%d", time.gmtime(d["tileset_last_modified"])) if d.get("tileset_last_modified") else None}
    except (json.JSONDecodeError, KeyError, TypeError):
        return {"versione": None, "dati_osm": None}


# ---------------------------------------------------------------- geometria

def haversine(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6_371_008.8 * math.asin(math.sqrt(h))


def decode(s, prec=6):
    """Polilinea codificata di Valhalla (precisione 6) -> [(lat, lon)]."""
    pts, i, lat, lon, f = [], 0, 0, 0, 10 ** prec
    while i < len(s):
        for which in (0, 1):
            shift = res = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                res |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            d = ~(res >> 1) if res & 1 else res >> 1
            if which == 0:
                lat += d
            else:
                lon += d
        pts.append((lat / f, lon / f))
    return pts


def densify(pts, step=STEP):
    """Punti lungo la spezzata ogni `step` metri (più i vertici), per leggere il DEM."""
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        d = haversine(a, b)
        n = max(1, math.ceil(d / step))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out


# ---------------------------------------------------------------- DEM TINITALY

class Dem:
    """Tasselli TINITALY 1.1 da 50 km (UTM 32N, celle di 10 m), nominati dall'angolo sud-ovest in decine di km.
    Stessa lettura di tools/build_habitat_info.py; qui la quota è interpolata (bilineare) tra i centri delle celle."""

    def __init__(self, points, folder):
        need = set()
        for lat, lon in points:
            x, y = to_utm32(lon, lat)
            need.add(f"w{int(y // 50_000) * 5:03d}{int(x // 50_000) * 5:02d}")
        self.tiles = []
        for t in sorted(need):
            z = folder / f"{t}_s10.zip"
            if not z.exists():
                print(f"  scarico TINITALY {t}", file=sys.stderr)
                z.parent.mkdir(parents=True, exist_ok=True)
                part = Path(str(z) + ".part")
                subprocess.run(["curl", "-sS", "-L", "-f", "-m", "1800", "-A", UA, "-o", str(part), TINITALY.format(t=t)], check=True)
                part.replace(z)
            with rasterio.open(f"zip://{z}!{t}_s10/{t}_s10.tif") as src:
                assert src.crs.to_epsg() == 32632 and src.res == (10.0, 10.0), (t, src.crs, src.res)
                self.tiles.append((src.bounds, src.transform, src.nodata, src.read(1)))
        self.names = sorted(need)

    def height(self, lat, lon):
        x, y = to_utm32(lon, lat)
        for b, tr, nodata, arr in self.tiles:
            if b.left + 20 <= x <= b.right - 20 and b.bottom + 20 <= y <= b.top - 20:
                col, row = ~tr * (x, y)
                c, r = col - 0.5, row - 0.5  # coordinate rispetto ai centri delle celle
                c0, r0 = int(math.floor(c)), int(math.floor(r))
                w = arr[r0:r0 + 2, c0:c0 + 2].astype(float)
                if w.shape != (2, 2) or (w == nodata).any():
                    return None
                fc, fr = c - c0, r - r0
                return float(w[0, 0] * (1 - fc) * (1 - fr) + w[0, 1] * fc * (1 - fr) + w[1, 0] * (1 - fc) * fr + w[1, 1] * fc * fr)
        return None

    def profile(self, pts):
        """Salita e discesa cumulate (m) lungo i punti, nell'ordine dato; None se manca una quota."""
        hs = [self.height(*p) for p in pts]
        if any(h is None for h in hs):
            return None, None
        d = np.diff(np.array(hs))
        return float(d[d > 0].sum()), float(-d[d < 0].sum())


# ---------------------------------------------------------------- strada e pista più vicine

def edge_of(e):
    ed = e.get("edge") or {}
    cl = ed.get("classification") or {}
    info = e.get("edge_info") or {}
    return {"dist": e.get("distance"), "lat": e.get("correlated_lat"), "lon": e.get("correlated_lon"),
            "cls": cl.get("classification"), "use": cl.get("use"), "surface": cl.get("surface"),
            "dest": bool(ed.get("destination_only")), "car": (ed.get("access") or {}).get("car"),
            "way": info.get("way_id"), "names": info.get("names") or []}


def why_not_road(e):
    """None se l'arco vale come strada su cui lasciare l'auto, altrimenti il motivo."""
    if e["use"] not in ROAD_USE:
        return e["use"] or "uso_ignoto"
    if e["dest"]:
        return "destination_only"
    if e["cls"] == "motorway":
        return "motorway"
    if e["car"] is False:
        return "no_car"
    return None


def nearest(loc):
    """Arco più vicino di una risposta /locate. A pari distanza (un nodo dove si incontrano più archi) preferisce
    una strada valida: se una strada e una pista partono dallo stesso punto, il punto è su strada."""
    edges = [edge_of(e) for e in (loc.get("edges") or []) if e.get("distance") is not None]
    if not edges:
        return None
    dmin = min(e["dist"] for e in edges)
    tied = [e for e in edges if e["dist"] <= dmin + 0.5]
    return min(tied, key=lambda e: (why_not_road(e) is not None, e["dist"]))


def locate(points, search_filter=None, radius=None, verbose=True):
    """Una risposta /locate (profilo auto) per punto, a gruppi di BATCH punti per richiesta."""
    out = []
    for k in range(0, len(points), BATCH):
        locs = [{"lat": lat, "lon": lon} for lat, lon in points[k:k + BATCH]]
        for j, l in enumerate(locs):
            if search_filter:
                l["search_filter"] = search_filter
            if radius:
                l["radius"] = radius[k + j]
        res = valhalla("locate", {"locations": locs, "costing": "auto", "verbose": verbose})
        if not isinstance(res, list) or len(res) != len(locs):
            raise RuntimeError(f"/locate: risposta inattesa {str(res)[:200]}")
        out += res
    return out


ROAD_FILTER = {"min_road_class": "residential", "max_road_class": "trunk"}
RADIUS_MAX = 1000  # raggio massimo di /locate sul server pubblico: raggi più grandi restituiscono gli stessi archi (prova del 16/10/2026)


class Ways:
    """Attributi di ogni via OSM (way_id) visti nelle risposte verbose; quelle mai viste si chiedono a Valhalla
    con un /locate verbose in un punto della via (a un nodo /locate restituisce tutti gli archi del nodo)."""

    def __init__(self):
        self.attr = {}

    def learn(self, loc):
        for e in loc.get("edges") or []:
            if "edge" in e:
                r = edge_of(e)
                self.attr.setdefault(r["way"], r)

    def classify(self, wanted):
        """wanted: {way_id: (lat, lon)}"""
        todo = [(w, p) for w, p in wanted.items() if w not in self.attr]
        res = locate([p for _, p in todo])
        for (w, _), loc in zip(todo, res):
            for e in loc.get("edges") or []:
                r = edge_of(e)
                if r["way"] == w:
                    self.attr[w] = r
                    break


def access_points(points, info):
    """Per ogni punto: (strada, pista se più vicina della strada). Tre passi:
    1. l'arco più vicino di qualunque tipo (verbose): se è una strada valida, è il punto strada;
    2. altrimenti l'arco più vicino tra le classi da trunk a residential (search_filter, verbose);
    3. tra il punto e quella strada possono esserci strade di servizio valide (highway=service non riservate):
       si chiedono gli archi entro quel raggio (non verbose; il server non va oltre RADIUS_MAX) e si classificano
       le vie con il loro way_id. Lo stesso elenco dà la pista più vicina."""
    ways = Ways()
    first_raw = locate(points)
    for loc in first_raw:
        ways.learn(loc)
    first = [nearest(l) for l in first_raw]
    redo = [i for i, e in enumerate(first) if e is None or why_not_road(e)]
    second_raw = locate([points[i] for i in redo], ROAD_FILTER)
    for loc in second_raw:
        ways.learn(loc)
    second = dict(zip(redo, (nearest(l) for l in second_raw)))
    ring = [i for i in redo if second[i] is not None]
    cand_raw = dict(zip(ring, locate([points[i] for i in ring], radius=[min(RADIUS_MAX, math.ceil(second[i]["dist"]) + 1) for i in ring], verbose=False)))
    wanted = {}
    for loc in cand_raw.values():
        for c in loc.get("edges") or []:
            wanted.setdefault(c["way_id"], (c["correlated_lat"], c["correlated_lon"]))
    ways.classify(wanted)

    def at(e, i):
        """Stessa misura per tutti i passi: distanza geodetica dal campione al punto sull'arco."""
        return None if e is None else dict(e, dist=haversine(points[i], (e["lat"], e["lon"])))

    out = []
    for i, e in enumerate(first):
        e = at(e, i)
        if e is not None and not why_not_road(e):
            out.append((e, None))
            continue
        info["primo_scartato_" + (why_not_road(e) if e else "nessun_arco")] += 1
        road = at(second.get(i), i)
        q2 = road
        if road is not None and why_not_road(road):
            info["secondo_scartato_" + why_not_road(road)] += 1
            road = None
        track = e if e is not None and e["use"] == "track" else None
        cands = (cand_raw.get(i) or {}).get("edges") or []
        if q2 is not None and q2["dist"] > RADIUS_MAX:
            info["terzo_passo_solo_entro_raggio_max"] += 1
        for c in cands:
            a = ways.attr.get(c["way_id"])
            if a is None:
                info["candidato_non_classificato"] += 1
                continue
            d = haversine(points[i], (c["correlated_lat"], c["correlated_lon"]))
            r = dict(a, dist=d, lat=c["correlated_lat"], lon=c["correlated_lon"])
            if not why_not_road(a) and (road is None or d < road["dist"] - 0.5):
                road = r
            if a["use"] == "track" and (track is None or d < track["dist"]):
                track = r
        if road is not None and road is not q2:
            info["strada_dal_terzo_passo_" + road["cls"]] += 1
        if track is not None and road is not None and track["dist"] >= road["dist"]:
            track = None
        out.append((road, track))
    return out


def road_name(names):
    return next((n for n in names if n[:2] in ("SS", "SR", "SP")), names[0] if names else None)


# ---------------------------------------------------------------- percorso a piedi

def walk(road, sample, dem):
    """Percorso a piedi dal punto strada al campione: metri sulla rete, metri fuori rete (tratto iniziale, di norma 0,
    più tratto finale fino al campione), salita e discesa dal DEM; None se Valhalla non trova un percorso."""
    body = {"locations": [{"lat": road[0], "lon": road[1]}, {"lat": sample[0], "lon": sample[1]}],
            "costing": "pedestrian", "costing_options": {"pedestrian": PEDESTRIAN},
            "directions_type": "none", "units": "kilometers"}
    d = valhalla("route", body)
    if "trip" not in d:
        return None
    pts = []
    for leg in d["trip"]["legs"]:
        pts += decode(leg["shape"])
    if not pts:
        return None
    net = d["trip"]["summary"]["length"] * 1000
    # inizio: dal punto strada al punto dove parte il percorso (di norma 0: il punto strada è già sulla rete)
    head = haversine(road, pts[0])
    tail = haversine(pts[-1], sample)
    line = densify(([road] if head > 0.5 else []) + pts + [sample])
    up, down = dem.profile(line)
    return {"rete": net, "inizio": head, "fuori": head + tail, "salita": up, "discesa": down}


# ---------------------------------------------------------------- uscita

def rnd(x):
    return None if x is None else int(round(x))


def zone_rows(zid, z, dem, solo_strade):
    samples = z["samples"]
    forest = [i for i, s in enumerate(samples) if s[1] >= 0]
    pts = [(samples[i][2], samples[i][3]) for i in forest]
    info = Counter()
    acc = access_points(pts, info)
    names = sorted({road_name(r["names"]) for r, _ in acc if r and road_name(r["names"])})
    rows = [None] * len(samples)
    t0 = time.time()
    for n, (i, p, (road, track)) in enumerate(zip(forest, pts, acc)):
        info["bosco"] += 1
        if track:
            info["pista_piu_vicina"] += 1
        if road is None:
            info["senza_strada"] += 1
            rows[i] = [None] * len(FIELDS)
            if track:
                rows[i][FIELDS.index("pista_m")] = rnd(track["dist"])
            continue
        rp = (road["lat"], road["lon"])
        h_road, h_sample = dem.height(*rp), dem.height(*p)
        w = None if solo_strade else walk(rp, p, dem)
        if not solo_strade and w is None:
            info["senza_percorso"] += 1
        rows[i] = [rnd(road["dist"]), round(road["lat"], 5), round(road["lon"], 5), SURF.get(road["surface"]),
                   CLASSES.index(road["cls"]) if road["cls"] in CLASSES else None, USES.index(road["use"]),
                   names.index(road_name(road["names"])) if road_name(road["names"]) else -1,
                   rnd(track["dist"]) if track else None,
                   rnd(h_road), rnd(h_sample - h_road) if h_road is not None and h_sample is not None else None,
                   rnd(w["rete"]) if w else None, rnd(w["fuori"]) if w else None,
                   rnd(w["salita"]) if w else None, rnd(w["discesa"]) if w else None]
        if w and w["inizio"] > 5:
            info["inizio_oltre_5_m"] += 1
        if not solo_strade and (n + 1) % 50 == 0:
            el = time.time() - t0
            print(f"  {zid}: {n + 1}/{len(forest)} percorsi, {el / 60:.1f} min, ancora circa {el / (n + 1) * (len(forest) - n - 1) / 60:.0f} min",
                  file=sys.stderr)
    return {"n": len(samples), "check": [sum(round(s[2] * 1e5) for s in samples), sum(round(s[3] * 1e5) for s in samples)],
            "strade": names, "samples": rows}, info


FIELDS = ["strada_m", "strada_lat", "strada_lon", "fondo", "classe", "uso", "strada", "pista_m",
          "quota_strada", "dislivello", "piedi_m", "fuori_rete_m", "salita_m", "discesa_m"]


def header(today, habitat, srv, tiles):
    return {
        "generated": today,
        "about": ("Accesso in auto e ultimo tratto a piedi per i campioni di bosco di data/habitat.json, da mostrare: "
                  "non entrano nell'indice biologico e non dicono dove crescono funghi. Il campione i di zones.<id>.samples "
                  "descrive il campione i della stessa zona in habitat.json; null = campione fuori bosco. "
                  "Generato da tools/build_access_info.py."),
        "habitat": {"file": "data/habitat.json", "generated": habitat.get("generated"),
                    "check": "per zona: n campioni e somma di round(lat*1e5) e round(lon*1e5) dei campioni di habitat.json"},
        "fields": FIELDS,
        "legend": {
            "strada_m": {"fonte": "valhalla", "unita": "metri, interi, in linea d'aria",
                         "metodo": ("dal campione al punto più vicino di una strada percorribile in auto che non sia una pista. "
                                    "Vale come strada un arco con uso " + ", ".join(sorted(ROAD_USE)) + "; restano fuori track "
                                    "(highway=track), driveway (service=driveway), gli altri usi e le autostrade. Restano fuori anche gli archi "
                                    "riservati (destination_only: access, motor_vehicle, motorcar o vehicle = private, destination, customers, "
                                    "delivery, permit, residents); quelli vietati alle auto (access o motor_vehicle = no, agricultural, forestry, "
                                    "discouraged) li esclude già il profilo auto. Tre passi: l'arco più vicino di qualunque tipo; se va scartato, "
                                    "l'arco più vicino tra le classi da trunk a residential (search_filter); poi le strade di servizio valide "
                                    f"più vicine di quella, cercate entro {RADIUS_MAX} m (limite del server)."),
                         "null": "nessuna strada valida trovata (riga tutta null tranne, se c'è, pista_m)",
                         "limiti": (f"OpenStreetMap non dice se una strada è aperta, né dove si può sostare: transito e sosta vanno verificati "
                                    f"sul posto. Una strada di servizio a più di {RADIUS_MAX} m, più vicina della strada di classe trunk-residential "
                                    "scelta, non viene vista. /locate salta le piccole reti stradali isolate (impostazione predefinita "
                                    "minimum_reachability di Valhalla): una strada che non si collega al resto della rete non conta.")},
            "strada_lat": {"fonte": "valhalla", "unita": "gradi WGS84, 5 decimali", "metodo": "punto sull'arco più vicino al campione"},
            "strada_lon": {"fonte": "valhalla", "unita": "gradi WGS84, 5 decimali"},
            "fondo": {"fonte": "valhalla", "valori": {"0": "asfalto", "1": "strada bianca (compacted, dirt, gravel)",
                                                     "2": "fondo naturale o sconnesso (path, impassable)"},
                      "null": "fondo non indicato", "nota": "stessi codici di habitat.json (tools/build_habitat.py)"},
            "classe": {"fonte": "valhalla", "valori": CLASSES,
                       "metodo": "indice nell'elenco: classe stradale di Valhalla (da highway di OSM: trunk, primary, … residential; "
                                 "service_other comprende highway=service e simili)"},
            "uso": {"fonte": "valhalla", "valori": USES,
                    "metodo": "indice nell'elenco: uso dell'arco secondo Valhalla (road = strada ordinaria; service_road, parking_aisle, "
                              "alley = strade di servizio, parcheggi, vicoli); mai track né driveway"},
            "strada": {"fonte": "valhalla", "valori": "indice in zones.<id>.strade (nome o numero della strada, preferendo SS, SR, SP); -1 = senza nome"},
            "pista_m": {"fonte": "valhalla", "unita": "metri, interi, in linea d'aria",
                        "metodo": "distanza dalla pista (highway=track) più vicina, solo se è più vicina della strada",
                        "null": ("nessuna pista più vicina della strada tra gli archi esaminati (l'arco più vicino al campione e, "
                                 f"se andava scartato, quelli entro la distanza della strada, al massimo {RADIUS_MAX} m)"),
                        "norma": ("Una pista sulla mappa non è per questo aperta alle auto. L.R. Lazio 29/1987, art. 1: nelle aree che "
                                  "elenca (tra cui le zone della L. 431/1985, che comprendono i boschi, e i parchi e le riserve regionali) "
                                  "è vietato circolare fuoristrada con veicoli a motore; il divieto comprende sentieri, mulattiere, piste "
                                  "di esbosco con segnaletica e viali tagliafuoco che non hanno le caratteristiche di strada carrozzabile.")},
            "quota_strada": {"fonte": "tinitaly", "unita": "metri sul mare, interi",
                             "metodo": "interpolazione bilineare tra i centri delle celle di 10 m"},
            "dislivello": {"fonte": "tinitaly", "unita": "metri, interi, con segno",
                           "metodo": "quota del campione meno quota del punto strada, entrambe da TINITALY: positivo = il bosco è più in alto",
                           "nota": "la quota del campione in habitat.json viene da un altro DEM (Copernicus 90 m) e può differire"},
            "piedi_m": {"fonte": "valhalla", "unita": "metri, interi",
                        "metodo": ("lunghezza del percorso a piedi sulla rete di OpenStreetMap (strade, piste, sentieri) dal punto strada al "
                                   "punto della rete più vicino al campione; profilo pedestrian, sentieri fino a sac_scale=mountain_hiking (T2)"),
                        "null": "nessun percorso a piedi: ultimo tratto da verificare"},
            "fuori_rete_m": {"fonte": "valhalla", "unita": "metri, interi, in linea d'aria",
                             "metodo": ("tratti senza strade né sentieri mappati: dal punto dove il percorso lascia la rete al campione, "
                                        "più l'eventuale tratto iniziale dal punto strada al punto dove il percorso entra nella rete (di norma 0)"),
                             "null": "come piedi_m"},
            "salita_m": {"fonte": "tinitaly", "unita": "metri, interi",
                         "metodo": (f"somma dei tratti in salita lungo il percorso (rete più tratto finale), con il DEM letto ogni {STEP} m, "
                                    "nel verso strada → campione; senza filtri"),
                         "null": "come piedi_m"},
            "discesa_m": {"fonte": "tinitaly", "unita": "metri, interi", "metodo": "come salita_m, per i tratti in discesa",
                          "null": "come piedi_m"},
        },
        "uso": ("Nessuna soglia è scritta nel dato. Il rapporto (piedi_m + fuori_rete_m) / strada_m e il tratto fuori rete li valuta "
                "l'interfaccia, mostrando i numeri. pista_m serve per l'avvertenza: «a X m da una pista forestale: transito in auto "
                "da verificare sul posto (L.R. Lazio 29/1987)»."),
        "sources": [
            {"id": "valhalla", "nome": "Valhalla (servizi /locate e /route) sui dati di OpenStreetMap",
             "editore": "server pubblico FOSSGIS; dati © contributori di OpenStreetMap",
             "url": VALHALLA, "codice": "https://github.com/valhalla/valhalla",
             "licenza": "dati OpenStreetMap ODbL 1.0", "licenza_url": "https://opendatacommons.org/licenses/odbl/1-0/",
             "versione": f"Valhalla {srv.get('versione')}; grafo del server costruito dai dati OSM il {srv.get('dati_osm')} (tileset_last_modified)", "estratto": today,
             "attribuzione": "© contributori di OpenStreetMap (ODbL); percorsi e archi calcolati con Valhalla",
             "limiti": ("La rete dei sentieri di OpenStreetMap nei boschi è incompleta. L'assenza di divieti mappati non vuol dire "
                        "accesso libero. Le richieste usano il profilo auto per la strada e il profilo pedestrian per il percorso.")},
            {"id": "tinitaly", "nome": "TINITALY 1.1, modello digitale del terreno a 10 m", "editore": "INGV",
             "url": "https://tinitaly.pi.ingv.it/Download_Area1_1.html", "doi": "https://doi.org/10.13127/tinitaly/1.1",
             "licenza": "CC BY 4.0", "licenza_url": "https://creativecommons.org/licenses/by/4.0/",
             "versione": "1.1 (2023); tasselli " + ", ".join(tiles), "estratto": today,
             "attribuzione": ("Tarquini S., Isola I., Favalli M., Battistini A., Dotta G. (2023). TINITALY, a digital elevation model "
                              "of Italy with a 10 meters cell size (Version 1.1). INGV. https://doi.org/10.13127/tinitaly/1.1"),
             "limiti": ("Modello del terreno (suolo nudo): la chioma non entra, a differenza del Copernicus DEM. Su tratti brevi e "
                        "ripidi la cella di 10 m smussa scarpate e tornanti.")},
            {"id": "lr-lazio-29-1987", "nome": "L.R. Lazio 30 marzo 1987, n. 29, art. 1 (testo vigente)", "editore": "Consiglio regionale del Lazio",
             "url": "https://www.consiglio.regione.lazio.it/?vw=leggiregionalidettaglio&id=8794&sv=vigente",
             "licenza": "atto ufficiale, escluso dal diritto d'autore (L. 633/1941, art. 5)",
             "licenza_url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1941-04-22;633~art5", "estratto": "2026-10-15",
             "nota": "citata nella legenda di pista_m; art. 1 letto nella pagina del Consiglio regionale scaricata il 15/10/2026"},
        ],
        "valhalla": {"locate": {"costing": "auto", "verbose": True, "search_filter_secondo_passo": ROAD_FILTER,
                                "terzo_passo": {"verbose": False, "radius": f"distanza della strada del secondo passo, al massimo {RADIUS_MAX} m"}},
                     "route": {"costing": "pedestrian", "costing_options": {"pedestrian": PEDESTRIAN}}},
    }


def dump(out):
    """Testata leggibile, un campione per riga."""
    head = {k: v for k, v in out.items() if k != "zones"}
    s = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    parts = []
    for zid, z in out["zones"].items():
        meta = json.dumps({k: v for k, v in z.items() if k != "samples"}, ensure_ascii=False, separators=(",", ":"))[1:-1]
        if z.get("samples") is None:
            parts.append(f'  "{zid}": {{{meta},"samples": null}}')
            continue
        rows = ",\n   ".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in z["samples"])
        parts.append(f'  "{zid}": {{{meta},"samples": [\n   {rows}\n  ]}}')
    return s + ',\n "zones": {\n' + ",\n".join(parts) + "\n }\n}\n"


def main():
    global CACHE
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", type=Path, default=CACHE)
    ap.add_argument("--dem-dir", type=Path, default=DEM_DIR)
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "access-info.json")
    ap.add_argument("--zones", default="", help="solo queste zone (le altre restano come nel file, se c'è)")
    ap.add_argument("--solo-strade", action="store_true", help="solo /locate e statistiche, senza percorsi e senza scrivere")
    a = ap.parse_args()
    CACHE = a.cache
    habitat = json.loads((ROOT / "data" / "habitat.json").read_text())
    order = [z["id"] for z in json.loads((ROOT / "data" / "zones.json").read_text())["zones"] if z["id"] in habitat["zones"]]
    only = [z for z in a.zones.split(",") if z]
    todo = [z for z in order if not only or z in only]
    prev = json.loads(a.out.read_text())["zones"] if a.out.exists() and not a.solo_strade else {}
    pts = [(s[2], s[3]) for z in todo for s in habitat["zones"][z]["samples"] if s[1] >= 0]
    dem = Dem(pts, a.dem_dir)
    srv = status()
    today = time.strftime("%Y-%m-%d")
    out = header(today, habitat, srv, dem.names)
    out["zones"] = {}
    total = Counter()
    for zid in order:
        if zid not in todo:
            out["zones"][zid] = prev.get(zid) or {"n": len(habitat["zones"][zid]["samples"]), "samples": None}
            continue
        print(zid, file=sys.stderr)
        z, info = zone_rows(zid, habitat["zones"][zid], dem, a.solo_strade)
        total.update(info)
        print(f"  {dict(info)}; richieste: {dict(STATS)}", file=sys.stderr)
        out["zones"][zid] = z
        if not a.solo_strade:
            missing = [k for k, v in out["zones"].items() if v.get("samples") is None] + [k for k in order if k not in out["zones"]]
            out["mancanti"] = missing
            a.out.write_text(dump(out))  # dopo ogni zona: un'interruzione lascia le zone già complete
    if not a.solo_strade and not out["mancanti"]:
        del out["mancanti"]
        a.out.write_text(dump(out))
    print(f"totale: {dict(total)}; richieste: {dict(STATS)}", file=sys.stderr)


if __name__ == "__main__":
    main()
