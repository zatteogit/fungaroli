#!/usr/bin/env python3
"""Informazioni sul bosco per ogni campione di data/habitat.json -> data/habitat-info.json.

Il file è statico (non passa dal CMS, come data/crop-points.json) e allineato per indice ai campioni
di habitat.json: il campione i della zona z qui descrive il campione i della stessa zona là.
Sono informazioni da mostrare: non entrano nell'indice biologico.

Per ogni campione:
- struttura (ceduo/fustaia) e copertura del poligono della Carta Forestale che lo contiene
  (Regione Lazio, WFS geonode:tipi_forestali2); null fuori bosco e fuori dal Lazio;
- pendenza ed esposizione dal DEM TINITALY 1.1 (INGV, 10 m, modello del terreno);
- anno e causa dell'ultimo disturbo visto da satellite (European Forest Disturbance Atlas v3.0);
- area protetta e zona del piano (Geoportale Lazio: perimetri PTPR Tav. B e zonazioni dei piani);
- se il punto è nel Lazio (fuori dal Lazio i dati regionali non arrivano: «non coperto»).

Uso:   python3 tools/build_habitat_info.py [--cache DIR] [--out FILE]
Serve: numpy, rasterio, shapely, pyproj e curl. I download restano in cache (default .cache/habitat-info):
4 tasselli TINITALY (circa 350 MB) e 3 file dell'archivio EFDA per l'Italia, letti a pezzi con
richieste Range (circa 135 MB) invece dei 2,9 GB dell'archivio intero.
"""
import argparse, hashlib, json, math, struct, subprocess, sys, time, urllib.parse, zlib
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer
from shapely import STRtree
from shapely.geometry import Point, shape
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parent.parent
UA = "Fungaroli/0.1 (https://github.com/zatteogit/fungaroli; progetto personale non commerciale)"
WFS = "https://geoportale.regione.lazio.it/geoserver/ows"
GEOPORTALE_API = "https://geoportale.regione.lazio.it/api/v2/datasets"
TINITALY = "https://tinitaly.pi.ingv.it/data_1.1/{t}_s10/{t}_s10.zip"
EFDA_RECORD = "https://zenodo.org/api/records/21722408"  # EFDA v3.0 (versione più recente al 16/10/2026)
EFDA_ZIP = "Italy.zip"

# Euristica: sotto questa pendenza il punto è «in piano» e l'esposizione non si scrive.
FLAT_DEG = 5
SECTORS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]

to_utm33 = Transformer.from_crs("EPSG:4326", "EPSG:32633", always_xy=True).transform  # come build_habitat.py
to_utm32 = Transformer.from_crs("EPSG:4326", "EPSG:32632", always_xy=True).transform  # griglia TINITALY
to_laea = Transformer.from_crs("EPSG:4326", "EPSG:3035", always_xy=True).transform    # griglia EFDA

# Aree protette: id brevi per codice EUAP; zonazioni dei piani pubblicate dal Geoportale Lazio.
AREA_IDS = {"EUAP0007": "pngsl", "EUAP0272": "navegna-cervia", "EUAP0267": "duchessa",
            "EUAP0266": "laghi-lungo-ripasottile", "EUAP0190": "lucretili", "EUAP0269": "tevere-farfa",
            "EUAP0001": "pnalm", "EUAP1034": "veio", "EUAP0186": "simbruini"}
ZONINGS = {  # area -> (strato WFS, campo del codice, campo della descrizione)
    "pngsl": ("geonode:zoning_pngsl", "zona_piano", "tipo_zona"),
    "duchessa": ("geonode:zoning_montagne_duchessa0", "Zona", "Descr_1"),
    "laghi-lungo-ripasottile": ("geonode:zoning_laghi_lungo_ripasottile", "zona_piano", "Descriz"),
    "lucretili": ("geonode:zone_lucretili", "Sottozona", "Denominaz"),
    "tevere-farfa": ("geonode:zoning_nazzano_tevere_farfa", "ZONA_", None),
    # Aggiunte il 21/10/2026 per le zone del pilota Lazio (ricerca «zon» nel catalogo del Geoportale): le altre aree
    # protette delle zone nuove non hanno una zonazione pubblicata sul Geoportale.
    "pnalm": ("geonode:zonizzazione_pnalm", "tipologia", None),
    "veio": ("geonode:zoning_veio1", "zona", "descrizion"),
    "simbruini": ("geonode:zoning_simbruini", "ZONA", "TIPOLOGIA"),
}
# Codice della zona quando il campo dello strato non è già un codice. PNALM: «Zona A» … «Zona D», con le sottozone
# D1-D3 in un campo a parte; le descrizioni dello strato (campo denominazi) sono brani lunghi delle norme: non si usano.
ZONE_CODE = {"pnalm": (("tipologia", "sottozona"),
                       lambda p: ((p.get("sottozona") or "").strip() or (p.get("tipologia") or "").strip().removeprefix("Zona ").strip()))}
ZONING_GEOM = {"pnalm": "geom"}  # campo della geometria quando non è the_geom
# Se un punto cade in più aree (riserva e area contigua, monumento dentro una riserva) vince la prima categoria.
AREA_PRIORITY = ["Parco nazionale", "Riserva", "Parco naturale regionale", "Monumento naturale", "Area contigua"]
# Decisione del proprietario (16/10/2026): niente consigli d'accesso e di raccolta nelle zone a e b del PNGSL.
EXCLUSIONS = [{
    "area": "pngsl", "zone": ["A", "B"],
    "effetto": "Esclusi dai consigli di accesso e di raccolta, con avviso. Restano nell'indice biologico.",
    "motivo": "Il Piano del Parco esclude il prelievo delle risorse naturali biotiche nelle zone a (riserva integrale) e b (riserva generale orientata), salvi diritti reali e usi civici.",
    "fonti": [
        {"titolo": "Ente PNGSL, Piano per il Parco, Normativa di attuazione, art. 7, c. 7 (zone a) e art. 8, c. 7 (zone b)",
         "url": "https://www.gransassolagapark.it/pdf/Piano-Parco/Normativa-Attuazione.pdf"},
        {"titolo": "Piano approvato con DCR Lazio 7 agosto 2019, n. 7 (BURL 17 ottobre 2019, n. 84, S.O. n. 4); vincolante per i privati (L. 394/1991, art. 12, c. 8)",
         "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1991-12-06;394~art12"},
    ],
    "eccezioni": "Diritti reali e usi civici (per esempio residenti titolari): l'app non li conosce.",
}]
# Decisione del proprietario (21/10/2026), dopo la lettura dei testi primari: escluse come la Laga anche le zone di
# riserva del PNALM (versante laziale), dei Monti Simbruini e dei Monti Lucretili; solo avviso per le zone B dei
# Lucretili e di Veio. Dubbio comune: se i funghi siano «flora» o «specie vegetali». La L.R. 29/1997, art. 8, c. 3,
# lett. a (misure di salvaguardia) fa salvi «la raccolta di funghi, tartufi ed altri prodotti del bosco»: indizio che
# il legislatore li distingua dalla flora. Interpretazione non verificata in giurisprudenza. Dettagli in docs/legale.md.
LR = "https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id={}&sv=vigente"
FLORA_DUBBIO = ("Se i funghi rientrino nella «flora» o nelle «specie vegetali» non è deciso: la L.R. 29/1997, art. 8, c. 3, "
                "lett. a, fa salvi «la raccolta di funghi, tartufi ed altri prodotti del bosco», indizio che il legislatore li "
                "distingua. Interpretazione non verificata in giurisprudenza.")
USI_CIVICI = "Usi civici e diritti reali: l'app non li conosce."
EXCLUSIONS += [{
    "area": "pnalm", "zone": ["A", "B"],
    "effetto": "Esclusi dai consigli di accesso e di raccolta, con avviso. Restano nell'indice biologico.",
    "motivo": ("Zona A (riserva integrale): le Norme del Piano vietano «qualsiasi manomissione o prelievo di specie vegetali» e "
               "«qualsiasi utilizzazione delle risorse a scopo economico» (art. 8, c. 2, lett. b e d). Zona B (riserva generale "
               "orientata): raccolta solo «nei limiti previsti dal Regolamento», che non è approvato, e visitatori lungo i "
               "sentieri (art. 9, c. 2, lett. f e h); fuori sentiero vietato in A e B per disposizione del Direttore. Nei parchi "
               "nazionali la legge regionale vieta la raccolta salvo diverse disposizioni dell'ente. " + FLORA_DUBBIO),
    "fonti": [
        {"titolo": "Ente PNALM, Piano del Parco, Norme tecniche di attuazione, art. 8, c. 2, lett. b e d (zona A) e art. 9, c. 2, lett. f e h (zona B); versione 2023, testo finale approvato non verificato",
         "url": "https://static.parcoabruzzo.it/pdf/NORME-TECNICHE-ATTUAZIONE-PIANOPARCO.pdf"},
        {"titolo": "Piano approvato per il Lazio con DGR 30 luglio 2026, n. 661 (BURL 4 agosto 2026, n. 62); avviso nella G.U. parte II n. 100 dell'1 settembre 2026",
         "url": "https://www.gazzettaufficiale.it/eli/id/2026/09/01/TX26ADM8217/P2"},
        {"titolo": "Ente PNALM, disposizione del Direttore prot. 8838 del 13 agosto 2020: divieto di uscire dai sentieri nelle zone A e B",
         "url": "https://www.parcoabruzzo.it/pdfuff/PNALMdocumento-618-3.pdf"},
        {"titolo": "L.R. Lazio 5 agosto 1998, n. 32, art. 10, c. 1, lett. d (parchi nazionali: raccolta vietata salvo diverse disposizioni dell'ente)",
         "url": LR.format(8275)},
    ],
    "certezza": {"A": "alta", "B": "medio-alta"},
    "eccezioni": USI_CIVICI,
}, {
    "area": "simbruini", "zone": ["R1", "R2", "R4"],
    "effetto": "Esclusi dai consigli di accesso e di raccolta, con avviso. Restano nell'indice biologico.",
    "motivo": ("Nelle zone di riserva «gli usi ammessi sono esclusivamente quelli ritenuti compatibili» (Norme del Piano di "
               "assetto, art. 27) e nessuna zona R elenca la raccolta (artt. 28, 29 e 31), che compare invece tra gli usi della "
               "zona L («raccolta dei prodotti del sottobosco», art. 32). Interpretazione a contrario. " + FLORA_DUBBIO),
    "fonti": [
        {"titolo": "Parco naturale regionale dei Monti Simbruini, Piano di assetto approvato con DCR 27 ottobre 1999, n. 587, Norme tecniche di attuazione, artt. 27, 28, 29, 31 e 32",
         "url": "https://www.parcomontisimbruini.it/pdf/Piano.Assetto.pdf"},
    ],
    "certezza": {"R1": "medio-alta", "R2": "medio-alta", "R4": "media"},
    "eccezioni": USI_CIVICI,
}, {
    "area": "lucretili", "zone": ["A", "A1"],
    "effetto": "Esclusi dai consigli di accesso e di raccolta, con avviso. Restano nell'indice biologico.",
    "motivo": ("Nelle zone A e A1 le Norme del Piano dispongono che «è vietata la raccolta o manomissione della flora e "
               "vegetazione» (art. 46, c. 5 e art. 47, c. 4). Che la «flora» comprenda i funghi è un'interpretazione. " + FLORA_DUBBIO),
    "fonti": [
        {"titolo": "Parco naturale regionale dei Monti Lucretili, aggiornamento del Piano approvato con DCR 28 ottobre 2022, n. 10 (BURL 27 dicembre 2022, n. 106, S.O. n. 1), Norme tecniche di attuazione, art. 46, c. 5 e art. 47, c. 4",
         "url": "https://parcolucretili.it/wp-content/uploads/2025/05/NORME-TECNICHE-ATTUAZIONE-BURL-2022.pdf"},
    ],
    "certezza": {"A": "media", "A1": "media"},
    "eccezioni": USI_CIVICI,
}]
# Stessa forma delle esclusioni: i campioni restano proponibili, la scheda avvisa (testo: js/site-info.js, WARNING_TEXT).
WARNINGS = [{
    "area": "lucretili", "zone": ["B", "B1"],
    "effetto": "Solo avviso: «Zona di riserva del Parco: verifica il regolamento dell'ente prima di raccogliere.» Restano proponibili e nell'indice biologico.",
    "motivo": ("Le Norme del Piano non pongono un divieto di zona (artt. 48 e 49); la legge istitutiva vieta la raccolta di "
               "specie vegetali spontanee salvo quanto previsto dal regolamento (L.R. 41/1989, art. 11, lett. h), che non è "
               "stato trovato. " + FLORA_DUBBIO),
    "fonti": [
        {"titolo": "Parco naturale regionale dei Monti Lucretili, Norme tecniche di attuazione del Piano (DCR 28 ottobre 2022, n. 10), artt. 48 e 49",
         "url": "https://parcolucretili.it/wp-content/uploads/2025/05/NORME-TECNICHE-ATTUAZIONE-BURL-2022.pdf"},
        {"titolo": "L.R. Lazio 26 giugno 1989, n. 41, istitutiva del Parco, art. 11, lett. h", "url": LR.format(8468)},
    ],
    "certezza": {"B": "media", "B1": "media"},
    "eccezioni": USI_CIVICI,
}, {
    "area": "veio", "zone": ["B1", "B2"],
    "effetto": "Solo avviso: «Zona di riserva del Parco: verifica il regolamento dell'ente prima di raccogliere.» Restano proponibili e nell'indice biologico.",
    "motivo": ("Nelle zone B sono consentite «unicamente» le attività compatibili «secondo le specifiche indicazioni e "
               "prescrizioni dettate dal Regolamento» (Norme del Piano, art. 22, c. 12), che non è approvato; la raccolta dei "
               "prodotti naturali è permessa esplicitamente solo in zona C (art. 25, c. 5, lett. c). " + FLORA_DUBBIO),
    "fonti": [
        {"titolo": "Parco naturale regionale di Veio, Piano del Parco approvato con DCR 19 febbraio 2025, n. 2, Norme tecniche attuative, art. 22, c. 12 e art. 25, c. 5, lett. c (BURL 20 marzo 2025, n. 23, S.O. n. 1; indirizzo web della copia letta non registrato)",
         "url": None},
        {"titolo": "Zonazione del Parco di Veio sul Geoportale della Regione Lazio (strato geonode:zoning_veio1)",
         "url": "https://geoportale.regione.lazio.it/catalogue/#/dataset/1385"},
    ],
    "certezza": {"B1": "media", "B2": "media"},
    "eccezioni": USI_CIVICI,
}]

CACHE = ROOT / ".cache" / "habitat-info"


# ---------------------------------------------------------------- download con cache

def curl(url, dest=None, rng=None, tries=8):
    """Scarica con curl (robusto dietro proxy), riprova con pause crescenti. Ritorna i byte se dest è None."""
    cmd = ["curl", "-sS", "-L", "-f", "-m", "900", "-A", UA]
    if rng:
        cmd += ["-r", f"{rng[0]}-{rng[1]}"]
    tmp = None
    if dest:
        tmp = Path(str(dest) + ".part")
        tmp.parent.mkdir(parents=True, exist_ok=True)
        cmd += ["-o", str(tmp)]
    cmd.append(url)
    for i in range(tries):
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode == 0:
            if dest:
                tmp.replace(dest)
                return None
            return r.stdout
        print(f"  riprovo ({i + 1}): {url[:90]} {r.stderr.decode(errors='replace').strip()[:120]}", file=sys.stderr)
        time.sleep(min(120, 3 * 2 ** i))
    raise RuntimeError(f"download non riuscito: {url}")


def cached_json(url, params=None):
    q = url + ("?" + urllib.parse.urlencode(params) if params else "")
    f = CACHE / "http" / (hashlib.sha1(q.encode()).hexdigest() + ".json")
    if not f.exists():
        data = curl(q)
        try:
            d = json.loads(data)
        except json.JSONDecodeError:
            raise RuntimeError(f"risposta non JSON da {q[:120]}: {data[:300]!r}")
        if isinstance(d, dict) and d.get("error"):
            raise RuntimeError(f"{q[:120]}: {d['error']}")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(data)
        time.sleep(0.5)  # una richiesta per volta, con pausa: servizio pubblico
    return json.loads(f.read_text())


def zone_bbox(z):
    """Stesso riquadro di build_habitat.py: il quadrato che contiene il cerchio della zona."""
    dlat = z["radius_m"] / 111_320
    dlon = z["radius_m"] / (111_320 * math.cos(math.radians(z["lat"])))
    return f"{z['lon'] - dlon},{z['lat'] - dlat},{z['lon'] + dlon},{z['lat'] + dlat},EPSG:4326"


def wfs(layer, z, props, geom="the_geom"):
    """Un GetFeature per zona e per strato, in UTM 33N; controlla che il servizio non abbia troncato."""
    fc = cached_json(WFS, {
        "service": "WFS", "version": "1.0.0", "request": "GetFeature", "typeName": layer,
        "outputFormat": "application/json", "bbox": zone_bbox(z), "maxFeatures": 20000,
        "srsName": "EPSG:32633", "propertyName": ",".join([geom, *props]),
    })
    n = fc.get("numberMatched", fc.get("totalFeatures"))
    if isinstance(n, int) and n != len(fc["features"]):
        raise RuntimeError(f"{layer} {z['id']}: {len(fc['features'])} oggetti su {n}")
    out = []
    for f in fc["features"]:
        if not f.get("geometry"):
            continue
        g = shape(f["geometry"])
        out.append((g if g.is_valid else make_valid(g), f["properties"]))
    return out


def containing(index, pt):
    """Oggetti (geometria, proprietà) che contengono il punto, nell'ordine del servizio."""
    tree, items = index
    return [items[i] for i in sorted(tree.query(pt)) if items[i][0].contains(pt)]


def build_index(items):
    return STRtree([g for g, _ in items]), items


# ---------------------------------------------------------------- EFDA: membri dello zip letti a pezzi

def zip_member(url, size, name, dest):
    """Estrae un file da uno zip remoto con richieste Range: legge la directory centrale in coda, poi solo quel membro."""
    if dest.exists():
        return dest
    tail = curl(url, rng=(max(0, size - 65536), size - 1))
    base = size - len(tail)
    i = tail.rfind(b"PK\x05\x06")
    n, cd_off = struct.unpack("<H", tail[i + 10:i + 12])[0], struct.unpack("<I", tail[i + 16:i + 20])[0]
    j = tail.rfind(b"PK\x06\x06")
    if j >= 0:  # Zip64
        n, _, cd_off = struct.unpack("<QQQ", tail[j + 32:j + 56])
    p = cd_off - base
    for _ in range(n):
        h = struct.unpack("<IHHHHHHIIIHHHHHII", tail[p:p + 46])
        method, crc, csize, usize, nl, el, cl, loff = h[4], h[7], h[8], h[9], h[10], h[11], h[12], h[16]
        fname = tail[p + 46:p + 46 + nl].decode()
        extra = tail[p + 46 + nl:p + 46 + nl + el]
        k = 0
        while k < len(extra):  # campo Zip64: dimensioni e offset a 64 bit
            tag, sz = struct.unpack("<HH", extra[k:k + 4])
            if tag == 1:
                vals, q = [], k + 4
                for v in (usize, csize, loff):
                    if v == 0xFFFFFFFF:
                        vals.append(struct.unpack("<Q", extra[q:q + 8])[0]); q += 8
                    else:
                        vals.append(v)
                usize, csize, loff = vals
            k += 4 + sz
        p += 46 + nl + el + cl
        if fname != name:
            continue
        head = curl(url, rng=(loff, loff + 29))
        lnl, lel = struct.unpack("<HH", head[26:30])
        start = loff + 30 + lnl + lel
        raw = dest.with_suffix(".raw")
        curl(url, raw, rng=(start, start + csize - 1))
        data = raw.read_bytes()
        if method == 8:
            data = zlib.decompress(data, -15)
        elif method != 0:
            raise RuntimeError(f"compressione zip {method} non gestita")
        if len(data) != usize or zlib.crc32(data) != crc:
            raise RuntimeError(f"{name}: dimensione o CRC diversi da quelli dell'archivio")
        dest.write_bytes(data)
        raw.unlink()
        return dest
    raise RuntimeError(f"{name} non trovato in {url}")


# ---------------------------------------------------------------- pendenza ed esposizione

def horn(win, cell):
    """Metodo di Horn su una finestra 3x3 (riga 0 = nord). Ritorna pendenza in gradi e azimut di griglia
    della direzione in cui il versante scende (0 = nord di griglia, in senso orario)."""
    a, b, c = win[0]
    d, _, f = win[1]
    g, h, i = win[2]
    dzdx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * cell)   # cresce verso est
    dzdy = ((a + 2 * b + c) - (g + 2 * h + i)) / (8 * cell)   # cresce verso nord
    slope = math.degrees(math.atan(math.hypot(dzdx, dzdy)))
    aspect = math.degrees(math.atan2(-dzdx, -dzdy)) % 360
    return slope, aspect


def sector(azimuth):
    return SECTORS[int(((azimuth + 22.5) % 360) // 45)]


def grid_north_offset(lat, lon):
    """Azimut, nella griglia UTM 32, del nord geografico: serve a riportare l'esposizione al nord vero."""
    x1, y1 = to_utm32(lon, lat)
    x2, y2 = to_utm32(lon, lat + 0.001)
    return math.degrees(math.atan2(x2 - x1, y2 - y1))


class Dem:
    """Tasselli TINITALY 1.1 da 50 km (UTM 32N, celle di 10 m), nominati dall'angolo sud-ovest in decine di km."""

    def __init__(self, points):
        need = set()
        for lat, lon in points:
            x, y = to_utm32(lon, lat)
            need.add(f"w{int(y // 50_000) * 5:03d}{int(x // 50_000) * 5:02d}")
        self.tiles = []
        for t in sorted(need):
            z = CACHE / "tinitaly" / f"{t}_s10.zip"
            if not z.exists():
                print(f"  TINITALY {t}", file=sys.stderr)
                curl(TINITALY.format(t=t), z)
            with rasterio.open(f"zip://{z}!{t}_s10/{t}_s10.tif") as src:
                assert src.crs.to_epsg() == 32632 and src.res == (10.0, 10.0), (t, src.crs, src.res)
                self.tiles.append((t, src.bounds, src.transform, src.nodata, src.read(1)))
        self.names = sorted(need)

    def window(self, lat, lon):
        x, y = to_utm32(lon, lat)
        for _, b, tr, nodata, arr in self.tiles:
            if b.left + 20 <= x <= b.right - 20 and b.bottom + 20 <= y <= b.top - 20:
                col, row = ~tr * (x, y)
                r, c = int(row), int(col)
                w = arr[r - 1:r + 2, c - 1:c + 2].astype(float)
                if w.shape != (3, 3) or (w == nodata).any():
                    return None
                return w
        return None

    def slope_aspect(self, lat, lon):
        """Pendenza (gradi interi) ed esposizione (settore) rispetto al nord geografico; None in piano."""
        w = self.window(lat, lon)
        if w is None:
            return None, None
        s, a = horn(w, 10.0)
        a = (a - grid_north_offset(lat, lon)) % 360
        s = round(s)  # la soglia vale sul valore scritto nel file
        return s, (sector(a) if s >= FLAT_DEG else None)


def check_aspect(dem):
    """Prova del segno. Su piani sintetici; poi sul Terminillo: a 300 m dalla vetta, nelle otto direzioni,
    il versante deve guardare verso l'esterno (settore uguale o adiacente: creste e canaloni deviano un po').
    Una formula con il segno sbagliato ribalterebbe tutto (nord al posto di sud)."""
    assert sector(horn([[0, 0, 0], [10, 10, 10], [20, 20, 20]], 10.0)[1]) == "N"   # sale verso sud: guarda a nord
    assert sector(horn([[0, 10, 20], [0, 10, 20], [0, 10, 20]], 10.0)[1]) == "O"   # sale verso est: guarda a ovest
    # vetta: il punto più alto del DEM entro 1 km dal Monte Terminillo (2.217 m)
    best = None
    for dy in range(-1000, 1001, 10):
        for dx in range(-1000, 1001, 10):
            lat = 42.4707 + dy / 111_320
            lon = 12.9930 + dx / (111_320 * math.cos(math.radians(42.47)))
            w = dem.window(lat, lon)
            if w is not None and (best is None or w[1][1] > best[0]):
                best = (w[1][1], lat, lon)
    top, lat0, lon0 = best
    assert 2150 < top < 2230, f"vetta del Terminillo a {top} m?"
    ok = 0
    for k in range(8):
        az = math.radians(k * 45)
        lat = lat0 + 300 * math.cos(az) / 111_320
        lon = lon0 + 300 * math.sin(az) / (111_320 * math.cos(math.radians(lat0)))
        _, s = dem.slope_aspect(lat, lon)
        if s is not None and min((SECTORS.index(s) - k) % 8, (k - SECTORS.index(s)) % 8) <= 1:
            ok += 1
    if ok < 7:
        raise RuntimeError(f"esposizione: solo {ok} direzioni su 8 coerenti attorno al Terminillo")
    _, north = dem.slope_aspect(lat0 + 300 / 111_320, lon0)
    if north not in ("NO", "N", "NE"):
        raise RuntimeError(f"versante nord del Terminillo esposto a {north}")
    return ok


# ---------------------------------------------------------------- principale

def main():
    global CACHE
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cache", type=Path, default=CACHE)
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "habitat-info.json")
    args = ap.parse_args()
    CACHE = args.cache
    today = time.strftime("%Y-%m-%d")

    habitat = json.loads((ROOT / "data" / "habitat.json").read_text())
    zones = {z["id"]: z for z in json.loads((ROOT / "data" / "zones.json").read_text())["zones"]}
    missing = set(habitat["zones"]) - set(zones)
    if missing:
        raise SystemExit(f"zone senza centro in zones.json: {missing}")

    # --- DEM
    allpts = [(s[2], s[3]) for h in habitat["zones"].values() for s in h["samples"]]
    dem = Dem(allpts)
    print(f"TINITALY: {dem.names}; prova del Terminillo {check_aspect(dem)}/8", file=sys.stderr)

    # --- EFDA
    rec = cached_json(EFDA_RECORD)
    files = rec["files"] if isinstance(rec["files"], list) else list(rec["files"]["entries"].values())
    zf = next(f for f in files if f["key"] == EFDA_ZIP)
    zurl = f"{EFDA_RECORD}/files/{EFDA_ZIP}/content"
    efda = {}
    for key in ("latest_disturbance", "disturbance_agent", "forestlanduse_mask"):
        member = f"{key}_italy_v30.tif"
        efda[key] = rasterio.open(zip_member(zurl, zf["size"], member, CACHE / "efda" / member))
    assert efda["disturbance_agent"].count == 40, "EFDA v3.0: attese 40 bande annuali (1985-2024)"

    # --- schede delle aree e dei dataset del Geoportale
    meta = {lay: cached_json(GEOPORTALE_API, {"filter{alternate}": lay})["datasets"][0]
            for lay in ["geonode:tipi_forestali2", "geonode:aree_naturali_protette1", "geonode:limiti_comunali",
                        *[v[0] for v in ZONINGS.values()]]}

    out_zones, areas, zone_desc = {}, {}, defaultdict(dict)
    stats = {"bordo_entro_2m": 0, "senza_poligono": 0, "lazio_per_carta": 0, "zona_senza_area": 0,
             "area_senza_zona": Counter()}

    for zid, h in habitat["zones"].items():
        z = zones[zid]
        print(zid, file=sys.stderr)
        forest = build_index(wfs("geonode:tipi_forestali2", z, ["categoria", "strutt", "copertura"]))
        parks = build_index(wfs("geonode:aree_naturali_protette1", z,
                                ["nome", "categoria", "vincolo", "ente_gest", "cod_euap"], geom="geom"))
        comuni = build_index(wfs("geonode:limiti_comunali", z, ["comune_nom"]))
        zonings = {a: build_index(wfs(lay, z, list(ZONE_CODE[a][0]) if a in ZONE_CODE else [f for f in (code, desc) if f],
                                      geom=ZONING_GEOM.get(a, "the_geom")))
                   for a, (lay, code, desc) in ZONINGS.items()}
        cats = h["sample_categories"]
        rows, outside = [], 0
        lat_sum = lon_sum = 0
        for s in h["samples"]:
            lat, lon = s[2], s[3]
            lat_sum += round(lat * 1e5); lon_sum += round(lon * 1e5)
            pt = Point(*to_utm33(lon, lat))
            # Nel Lazio: dentro un comune del Lazio (DBGT) o dentro un poligono della Carta Forestale. I due strati
            # non tracciano il confine allo stesso modo: qualche punto di bosco sta a poche decine di metri oltre.
            in_lazio = bool(containing(comuni, pt)) or bool(containing(forest, pt))
            if in_lazio and not containing(comuni, pt):
                stats["lazio_per_carta"] += 1
            outside += not in_lazio

            # Carta Forestale: il poligono della stessa categoria di habitat.json. habitat.json ha le coordinate
            # arrotondate a 1e-5 gradi (circa 1 m): un punto sul bordo tra due poligoni può cadere in quello
            # accanto. In quel caso vale il poligono della stessa categoria entro 2 m.
            strutt = cop = None
            cat = cats[s[1]] if s[1] >= 0 else None
            if cat:
                same = [p for _, p in containing(forest, pt) if p.get("categoria") == cat]
                if not same:
                    near = sorted((g.distance(pt), k) for k, (g, p) in enumerate(forest[1])
                                  if p.get("categoria") == cat and g.distance(pt) <= 2)
                    same = [forest[1][near[0][1]][1]] if near else []
                    stats["bordo_entro_2m" if same else "senza_poligono"] += 1
                if same:
                    strutt = same[0].get("strutt") if same[0].get("strutt") in (1, 2, 3) else None
                    cop = same[0].get("copertura") if same[0].get("copertura") in (1, 2, 3, 4) else None

            # Pendenza ed esposizione
            slope, aspect = dem.slope_aspect(lat, lon)

            # Ultimo disturbo (EFDA): 0 = nessun disturbo nella maschera forestale; None = fuori maschera
            x, y = to_laea(lon, lat)
            mask = next(efda["forestlanduse_mask"].sample([(x, y)]))[0]
            year = cause = None
            if mask == 1:
                v = int(next(efda["latest_disturbance"].sample([(x, y)]))[0])
                year = v if 1985 <= v <= 2024 else 0
                if year:
                    ag = int(next(efda["disturbance_agent"].sample([(x, y)], indexes=[year - 1984]))[0])
                    cause = ag if ag in (1, 2, 3) else None

            # Area protetta e zona del piano
            area = zone = None
            found = []
            for _, p in containing(parks, pt):
                aid = AREA_IDS.get(p.get("cod_euap")) or slug(p["nome"])
                found.append((priority(p.get("categoria") or ""), aid))
                areas.setdefault(aid, {"nome": p["nome"].strip(), "categoria": p.get("categoria"),
                                       "ente": (p.get("ente_gest") or "").strip() or None,
                                       "euap": p.get("cod_euap"), "zonazione": None})
            if found:
                area = min(found)[1]
            for aid, idx in zonings.items():
                hit = containing(idx, pt)
                if not hit:
                    continue
                lay, code_f, desc_f = ZONINGS[aid]
                code = (ZONE_CODE[aid][1](hit[0][1]) if aid in ZONE_CODE else (hit[0][1].get(code_f) or "").strip()) or None
                if area is None:
                    stats["zona_senza_area"] += 1
                    continue
                if aid == area:
                    zone = code
                    if code:
                        zone_desc[aid][code] = ((hit[0][1].get(desc_f) or "").strip() or None) if desc_f else None
            if area in ZONINGS and zone is None:
                stats["area_senza_zona"][area] += 1

            rows.append([strutt, cop, slope, aspect, year, cause, area, zone, int(in_lazio)])
        out_zones[zid] = {"n": len(rows), "fuori_lazio": outside, "check": [lat_sum, lon_sum], "samples": rows}

    for aid, a in areas.items():
        if aid in ZONINGS:
            lay = ZONINGS[aid][0]
            a["zonazione"] = {"strato": lay, "dataset": f"https://geoportale.regione.lazio.it/catalogue/#/dataset/{meta[lay]['pk']}",
                              "piano": meta[lay].get("raw_abstract", "").strip(),
                              "zone": dict(sorted(zone_desc.get(aid, {}).items()))}
        elif aid == "navegna-cervia":
            a["zonazione_nota"] = ("La legge istitutiva (L.R. 56/1988, art. 10) divide la riserva in zone A e B, ma la "
                                   "zonazione non è digitalizzata sul Geoportale e non c'è un piano approvato: zona sempre null.")

    out = header(today, habitat, rec, meta, dem.names)
    out["aree"] = dict(sorted(areas.items()))
    out["zones"] = out_zones
    text = dump(out)
    assert json.loads(text) == out
    args.out.write_text(text)
    print(f"scritto {args.out} ({len(text.encode()) / 1024:.0f} KB); controlli: {dict(stats)}", file=sys.stderr)


def slug(name):
    import unicodedata
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return "-".join("".join(ch if ch.isalnum() else " " for ch in s).split())


def priority(cat):
    for k, p in enumerate(AREA_PRIORITY):
        if p.lower() in cat.lower():
            return k
    return len(AREA_PRIORITY)


def header(today, habitat, rec, meta, tiles):
    m = rec["metadata"]
    gp = lambda lay: f"https://geoportale.regione.lazio.it/catalogue/#/dataset/{meta[lay]['pk']}"
    lic = lambda lay: (meta[lay].get("license") or {}).get("identifier")
    return {
        "generated": today,
        "about": ("Informazioni sul bosco dei campioni di data/habitat.json, da mostrare: non entrano nell'indice "
                  "biologico e non dicono dove crescono funghi. Il campione i di zones.<id>.samples descrive il "
                  "campione i della stessa zona in habitat.json. Generato da tools/build_habitat_info.py."),
        "habitat": {"file": "data/habitat.json", "generated": habitat.get("generated"),
                    "check": "per zona: n campioni e somma di round(lat*1e5) e round(lon*1e5) dei campioni di habitat.json"},
        "fields": ["strutt", "copertura", "pendenza", "esposizione", "disturbo_anno", "disturbo_causa", "area", "zona", "lazio"],
        "legend": {
            "strutt": {"fonte": "carta-forestale", "valori": {"1": "ceduo", "2": "fustaia (alto fusto)", "3": "altro: soprassuolo a struttura composita"},
                       "null": "punto fuori bosco in habitat.json, fuori dal Lazio, o poligono senza struttura (arbusteti: valore 0 nel servizio, non documentato)"},
            "copertura": {"fonte": "carta-forestale", "valori": {"1": "non bosco (copertura arborea sotto il 10%)", "2": "bosco con chiome tra il 10 e il 50%", "3": "bosco con chiome oltre il 50%", "4": "arbusteti oltre il 50% (o arbusteti e bosco radi insieme)"},
                          "null": "come strutt"},
            "pendenza": {"fonte": "tinitaly", "unita": "gradi sessagesimali, interi (45 gradi = 100%)",
                         "metodo": "metodo di Horn sulla finestra 3x3 del DEM a 10 m, cioè su un quadrato di 30 m attorno al punto"},
            "esposizione": {"fonte": "tinitaly", "valori": SECTORS,
                            "metodo": "direzione verso cui scende il versante, riferita al nord geografico (corretta la convergenza della griglia UTM 32), in otto settori da 45 gradi centrati su N, NE, E, SE, S, SO, O, NO",
                            "null": f"in piano: pendenza sotto {FLAT_DEG} gradi",
                            "euristica": f"La soglia di {FLAT_DEG} gradi per il piano è una scelta, non viene da una fonte."},
            "disturbo_anno": {"fonte": "efda", "valori": "anno (1985-2024) dell'ultimo disturbo rilevato nel pixel di 30 m che contiene il punto; 0 = nessun disturbo rilevato dal 1985 al 2024",
                              "null": "pixel fuori dalla maschera forestale dell'EFDA: non valutato"},
            "disturbo_causa": {"fonte": "efda", "valori": {"1": "vento o insetti (bostrico)", "2": "incendio", "3": "taglio"},
                               "null": "nessun disturbo, o causa non attribuita nell'anno del disturbo"},
            "area": {"fonte": "aree-protette", "valori": "id in «aree»",
                     "null": "fuori da parchi, riserve, monumenti naturali e aree contigue del Lazio (o fuori dal Lazio: vedi lazio)",
                     "priorita": "se il punto è in più aree vale l'ordine " + ", ".join(AREA_PRIORITY)},
            "zona": {"fonte": "zonazioni", "valori": "codice della zona del piano, come nello strato della Regione (es. A, B, C, D1, C1); descrizioni in aree.<id>.zonazione.zone",
                     "null": "area senza zonazione digitalizzata, punto fuori da ogni zona del piano, o fuori da aree protette"},
            "lazio": {"fonte": "limiti-comunali", "valori": {"1": "nel Lazio: dentro un comune del Lazio, o dentro un poligono della Carta Forestale a ridosso del confine (i due strati non tracciano il confine allo stesso modo)", "0": "fuori dal Lazio, non coperto: Carta Forestale, perimetri e zonazioni regionali non arrivano. strutt, copertura, area e zona sono null anche se il punto fosse in un bosco o in un parco; in habitat.json il punto risulta non bosco per costruzione"}},
        },
        "esclusioni": EXCLUSIONS,
        "avvisi": WARNINGS,
        "sources": [
            {"id": "carta-forestale", "nome": "Carta forestale su base tipologica", "editore": "Regione Lazio",
             "url": WFS + " (WFS geonode:tipi_forestali2)", "scheda": gp("geonode:tipi_forestali2"),
             "licenza": f"{lic('geonode:tipi_forestali2')} sul Geoportale; risorsa SHP su dati.lazio.it dichiarata CC BY 4.0; metadati PDF del 2012 con restrizioni discordanti (vedi docs/legale.md)",
             "versione": "fotointerpretazione ADS40 2005-2007 e SPOT5 2005-2006, collaudo febbraio 2011; scala 1:10.000, unità minima 0,5 ha",
             "estratto": today, "attribuzione": "Carta Forestale su base tipologica © Regione Lazio",
             "limiti": "Descrive il bosco di circa vent'anni fa: tagli, incendi, conversioni e abbandono successivi non si vedono. La struttura è un attributo del poligono, non del punto."},
            {"id": "tinitaly", "nome": "TINITALY 1.1, modello digitale del terreno a 10 m", "editore": "INGV",
             "url": "https://tinitaly.pi.ingv.it/Download_Area1_1.html", "doi": "https://doi.org/10.13127/tinitaly/1.1",
             "licenza": "CC BY 4.0", "licenza_url": "https://creativecommons.org/licenses/by/4.0/",
             "versione": "1.1 (2023); tasselli " + ", ".join(tiles), "estratto": today,
             "attribuzione": "Tarquini S., Isola I., Favalli M., Battistini A., Dotta G. (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). INGV. https://doi.org/10.13127/tinitaly/1.1",
             "limiti": "Modello del terreno (suolo nudo), non della superficie: la chioma non entra. Su 30 m l'esposizione descrive il punto, non per forza tutto il versante."},
            {"id": "efda", "nome": "European Forest Disturbance Atlas", "editore": "; ".join(c["name"] for c in m.get("creators", [])),
             "url": f"https://doi.org/{rec.get('doi')}", "licenza": "CC BY 4.0", "licenza_url": "https://creativecommons.org/licenses/by/4.0/",
             "versione": f"{m.get('version')} ({m.get('publication_date')}), periodo 1985-2024, pixel di 30 m; file {EFDA_ZIP}: latest_disturbance, disturbance_agent, forestlanduse_mask",
             "estratto": today,
             "attribuzione": ("European Forest Disturbance Atlas v3.0 (CC BY 4.0). Viana-Soto A., Senf C. (2025). The European Forest Disturbance Atlas: "
                              "a forest disturbance monitoring system using the Landsat archive. Earth System Science Data 17: 2373-2404. "
                              "https://doi.org/10.5194/essd-17-2373-2025. Viana-Soto A., Mense J.A., Kowalski K., Pauls J., Gieseke F., Senf C. (2026). "
                              "Deep learning-based forest disturbance detection for Europe using Landsat time series. Remote Sensing of Environment, in stampa."),
             "limiti": "Rilevamento da Landsat: i tagli a raso e gli incendi si vedono meglio dei tagli parziali; un ceduo matricinato o un diradamento possono sfuggire e ci sono falsi positivi. La causa è una stima del modello. Un pixel di 30 m descrive il punto, non il bosco intorno. Sui campioni delle zone il 1985 e il 1986 contano molti più disturbi degli altri anni: da leggere con cautela."},
            {"id": "aree-protette", "nome": "PTPR Tavola B, aree naturali protette", "editore": "Regione Lazio",
             "url": WFS + " (WFS geonode:aree_naturali_protette1)", "scheda": gp("geonode:aree_naturali_protette1"),
             "licenza": f"{lic('geonode:aree_naturali_protette1')} (senza versione) sul Geoportale",
             "versione": f"revisione {str(meta['geonode:aree_naturali_protette1'].get('date'))[:10]}, aggiornata il {str(meta['geonode:aree_naturali_protette1'].get('last_updated'))[:10]}",
             "estratto": today, "attribuzione": "© Regione Lazio",
             "limiti": "I perimetri non hanno valenza giuridica o probatoria: fa fede la cartografia dell'ente. Si fermano al confine del Lazio."},
            {"id": "zonazioni", "nome": "Zonazioni dei piani delle aree protette", "editore": "Regione Lazio",
             "url": WFS + " (WFS " + ", ".join(v[0] for v in ZONINGS.values()) + ")",
             "scheda": [gp(v[0]) for v in ZONINGS.values()],
             "licenza": f"{lic('geonode:zoning_pngsl')} sul Geoportale (licenza non indicata): si pubblica solo il codice della zona per punto, non le geometrie",
             "versione": "; ".join(f"{v[0].split(':')[1]} pubblicata il {str(meta[v[0]].get('date'))[:10]}" for v in ZONINGS.values()),
             "estratto": today, "attribuzione": "© Regione Lazio",
             "limiti": ("Zonazioni del Gran Sasso-Laga e del Parco d'Abruzzo, Lazio e Molise solo per il versante laziale. "
                        "Digitalizzazione regionale: può differire di poco dalla tavola del piano. Le altre aree protette delle zone "
                        "(per esempio Castelli Romani, Monti Aurunci, Monti Ausoni, Circeo, Bracciano-Martignano) non hanno una "
                        "zonazione sul Geoportale: zona sempre null, «zone del piano non disponibili».")},
            {"id": "limiti-comunali", "nome": "DBGT 2014, classe Comune", "editore": "Regione Lazio",
             "url": WFS + " (WFS geonode:limiti_comunali)", "scheda": gp("geonode:limiti_comunali"),
             "licenza": f"{lic('geonode:limiti_comunali')} (senza versione) sul Geoportale", "estratto": today,
             "attribuzione": "© Regione Lazio", "limiti": "Serve solo a sapere se il punto è nel Lazio."},
        ],
    }


def dump(out):
    """Testata leggibile, un campione per riga."""
    head = {k: v for k, v in out.items() if k != "zones"}
    s = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    parts = []
    for zid, z in out["zones"].items():
        meta = json.dumps({k: v for k, v in z.items() if k != "samples"}, ensure_ascii=False, separators=(",", ":"))[1:-1]
        rows = ",\n   ".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in z["samples"])
        parts.append(f'  "{zid}": {{{meta},"samples": [\n   {rows}\n  ]}}')
    return s + ',\n "zones": {\n' + ",\n".join(parts) + "\n }\n}\n"


if __name__ == "__main__":
    main()
