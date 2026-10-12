#!/usr/bin/env python3
"""Genera la base cartografica incorporata nella versione Artifact (che non puo' caricare tile online).

- Topografica: mosaico di tile OpenTopoMap (zoom 12) -> assets/basemap-topo.webp
- Carta Forestale Regione Lazio (WMS) sulla stessa area -> assets/basemap-forest.webp
- Limiti geografici -> assets/basemap.json

Da lanciare solo quando cambia l'area delle zone (le tile non vanno riscaricate ogni giorno).
Uso: python3 tools/build_basemap.py   (richiede Pillow)
"""
import io, json, math, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
Z = 12
BBOX = (12.62, 42.10, 13.46, 42.72)  # lon_min, lat_min, lon_max, lat_max
UA = {"User-Agent": "fungaroli/0.1 (uso personale, mosaico una tantum)"}
R = 6378137.0


def tile_x(lon): return (lon + 180) / 360 * 2 ** Z
def tile_y(lat):
    t = math.radians(lat)
    return (1 - math.log(math.tan(t) + 1 / math.cos(t)) / math.pi) / 2 * 2 ** Z
def lon_of(x): return x / 2 ** Z * 360 - 180
def lat_of(y): return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / 2 ** Z))))
def merc(lon, lat): return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print("  retry", i + 1, e)
            time.sleep(2 ** (i + 1))
    raise RuntimeError(url)


def main():
    x0, x1 = int(tile_x(BBOX[0])), int(tile_x(BBOX[2]))
    y0, y1 = int(tile_y(BBOX[3])), int(tile_y(BBOX[1]))
    W, H = (x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256
    print(f"{(x1-x0+1)*(y1-y0+1)} tile, {W}x{H}px")
    img = Image.new("RGB", (W, H))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            t = Image.open(io.BytesIO(get(f"https://{'abc'[(x + y) % 3]}.tile.opentopomap.org/{Z}/{x}/{y}.png"))).convert("RGB")
            img.paste(t, ((x - x0) * 256, (y - y0) * 256))
            time.sleep(0.25)
    img.save(ROOT / "assets/basemap-topo.webp", quality=72, method=6)

    west, east = lon_of(x0), lon_of(x1 + 1)
    north, south = lat_of(y0), lat_of(y1 + 1)
    mx0, my0 = merc(west, south)
    mx1, my1 = merc(east, north)
    q = urllib.parse.urlencode({
        "service": "WMS", "version": "1.1.1", "request": "GetMap", "layers": "geonode:tipi_forestali2",
        "styles": "", "format": "image/png", "transparent": "true", "srs": "EPSG:3857",
        "bbox": f"{mx0},{my0},{mx1},{my1}", "width": W, "height": H,
    })
    forest = Image.open(io.BytesIO(get("https://geoportale.regione.lazio.it/geoserver/ows?" + q))).convert("RGBA")
    forest.save(ROOT / "assets/basemap-forest.webp", quality=70, method=6)
    legend = get("https://geoportale.regione.lazio.it/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image/png&layer=geonode:tipi_forestali2")
    (ROOT / "assets/forest-legend.png").write_bytes(legend)

    (ROOT / "assets/basemap.json").write_text(json.dumps({
        "bounds": [[south, west], [north, east]], "zoom": Z, "size": [W, H],
        "attribution": "© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA) | Carta Forestale © Regione Lazio",
    }, indent=1))
    for f in ["basemap-topo.webp", "basemap-forest.webp", "forest-legend.png"]:
        print(f, (ROOT / "assets" / f).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
