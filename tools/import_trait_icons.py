#!/usr/bin/env python3
"""Icone dei caratteri (cappello, sotto, gambo) dalle tavole 3×3 del ramo gpt/immagini.

Uso:
  git archive origin/gpt/immagini incoming | tar -x -C /tmp/inc
  python3 tools/import_trait_icons.py /tmp/inc/incoming [--stato] [--stati "ok,pronta da integrare"]

Ogni riga «illustrazione» del manifest indica tavola, specie (chiave di data/species-traits.json),
tessera e cella. La cella è `cella` (0-8, da sinistra a destra e dall'alto in basso); se manca,
vale l'ordine delle righe della stessa tavola, come nelle prime 30 tavole.
Il ritaglio è per componenti (tools/sheet_cells.py), non a terzi fissi: nessun disegno tagliato.

--stato: si importano solo le tavole che incoming/bozze/STATO.md segna «pronta da integrare» (regola di
Matteo del 16/10); --stati cambia l'elenco degli stati accettati. Le icone già presenti restano.

Varianti (docs/handoff-immagini-varianti.md): le righe con `variante` = "colore:<valore>" o
"forma:<valore>" sono un altro colore o un'altra forma del cappello; `base` = {"colore", "forma"}
dice cosa mostra il disegno principale. Le tessere di una variante sono «cappello» e «gambo».
"colore:<c>+forma:<f>" è una combinazione (docs/handoff-immagini-mancanti.md, punto 2).
Dove la specie ha le fasi di crescita (`stages`), le fasi sostituiscono le varianti di forma (decisione del
15/10): quelle forme non vanno in assets/ né nell'indice, ma si conservano in archive/forme-con-fasi/ con la loro
provenienza (decisione del 16/10), salvo le forme della falloide già in produzione (KEEP_SHAPES).
Fasi di crescita: righe con `fase`, importate da tools/import_stage_icons.py (chiamato da qui).

Le righe che non tornano con i dati (specie, tessera, valore o fase che non esistono) sono rifiutate
una per una, con il motivo; le tavole con un disegno tagliato o una cella vuota fermano l'import.
Scrive assets/traits/<specie>-<tessera>[-<variante>].webp e data/trait-icons.json. L'indice si ricostruisce
dai file presenti: un file che i dati non giustificano più (valore o fase tolti) viene cancellato.
"""
import json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from sheet_cells import LICENSE, drawings, ready_sheets, STATE_OK  # noqa: E402

OUT = ROOT / "assets/traits"
PARTS = ("cappello", "sotto", "gambo")
SIZE = 128
KEEP_SHAPES = {"amanita-phalloides"}  # forme in produzione prima delle fasi (docs/handoff-immagini-varianti.md)


def bbox(tile):
    return tile.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()


def fit(tile):
    """Ritaglia il disegno (i fogli hanno margini ampi e diversi) e lo centra in un quadrato con margine uguale."""
    box = bbox(tile)
    if box:
        tile = tile.crop(box)
    side = round(max(tile.size) * 1.08)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def fit_like(tile, size):
    """Variante di colore: stessa inquadratura del disegno base (stessa altezza e stesso centro nel quadrato),
    così cambiando colore il fungo non si sposta né cambia scala. size = (larghezza, altezza) del disegno base."""
    box = bbox(tile)
    if box:
        tile = tile.crop(box)
    bw, bh = size
    w = round(tile.size[0] * bh / tile.size[1])
    side = round(max(bw, bh, w) * 1.08)  # se la variante è più larga, il quadrato si allarga: mai disegni tagliati
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(tile.resize((w, bh), Image.LANCZOS), ((side - w) // 2, (side - bh) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def margin(path):
    """Margine vuoto attorno al disegno nell'icona finale: il test lo usa per dire che l'icona è intera."""
    x0, y0, x1, y1 = bbox(Image.open(path).convert("RGBA"))
    return min(x0, y0, SIZE - x1, SIZE - y1)


class Sheets:
    """Tavole aperte una volta sola, con i riquadri dei disegni per cella."""
    def __init__(self, inc):
        self.inc, self.cache = Path(inc), {}

    def crop(self, r, rows):
        if r["file"] not in self.cache:
            im = Image.open(self.inc.parent / r["file"]).convert("RGBA")
            self.cache[r["file"]] = (im, drawings(im, r["file"]))
        im, boxes = self.cache[r["file"]]
        cell = r.get("cella", [x for x in rows if x["file"] == r["file"]].index(r))
        if cell not in boxes:
            sys.exit(f"{r['file']}: la cella {cell} è vuota")
        return im.crop(boxes[cell]), boxes[cell]


def load_rows(inc, stato=False, stati=(STATE_OK,)):
    """Righe «illustrazione» dei funghi; con stato, solo quelle delle tavole accettate.
    Restituisce (righe da importare, tavole saltate con il loro stato, tutte le righe)."""
    inc = Path(inc)
    manifest = json.loads((inc / "manifest.json").read_text(encoding="utf-8"))
    rows = [r for r in manifest if r["tipo"] == "illustrazione" and r.get("soggetto") != "alberi"]
    if not stato:
        return rows, {}, rows
    from sheet_cells import sheet_states
    states = sheet_states(inc / "bozze/STATO.md")
    ok = ready_sheets(inc / "bozze/STATO.md", stati)
    keep = [r for r in rows if r["file"].removeprefix("incoming/") in ok]
    skipped = {r["file"]: states.get(r["file"].removeprefix("incoming/"), "senza stato") for r in rows if r not in keep}
    return keep, skipped, rows


def valid_name(taxa, name):
    """Il nome di un file delle icone corrisponde ancora a un valore dei dati?"""
    import re
    m = re.match(r"^(.+?)-(cappello|sotto|gambo|taglio)(?:-(.+))?$", name)
    t = m and taxa.get(m.group(1))
    if not t:
        return False
    key, tile, rest = m.groups()
    tr = t.get("traits") or {}
    if not rest:
        return tile in PARTS
    if rest.startswith("fase-"):
        s = next((x for x in t.get("stages") or [] if x["id"] == rest[5:]), None)
        return bool(s and tile in s["tiles"])
    vals = rest.split("-")
    if tile not in ("cappello", "gambo"):
        return False
    if len(vals) == 1:
        return vals[0] in (tr.get("cap_color") or []) or vals[0] in (tr.get("cap_shape") or [])
    return len(vals) == 2 and vals[0] in (tr.get("cap_color") or []) and vals[1] in (tr.get("cap_shape") or [])


ARCHIVE = ROOT / "archive/forme-con-fasi"


def archive_shape(r, key, shape, tile, archived):
    """Forma di una specie con le fasi: fuori da assets/ e dall'indice dell'app, conservata come alternativa
    in archive/forme-con-fasi/ (escluso dal deploy da .assetsignore), con la provenienza nel suo indice."""
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    name = f"{key}-{r['tessera']}-{shape}"
    tile.save(ARCHIVE / f"{name}.webp", "WEBP", quality=90, method=6)
    path = ARCHIVE / "index.json"
    idx = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    items = idx.get("items", {})
    items[name] = {"specie": key, "tessera": r["tessera"], "forma": shape, "tavola": r["file"], "cella": r.get("cella"),
                   "base": r.get("base"), "modello": r.get("modello"), "prompt": r.get("prompt")}
    idx = {"note": "Forme del cappello disegnate per specie che hanno le fasi di crescita: fuori dall'app (le fasi sostituiscono le forme, decisione del 15/10), conservate come alternativa (decisione di Matteo, 16/10). Cartella esclusa dal deploy (.assetsignore); non entrano in data/trait-icons.json né nel rapporto degli asset.",
           **LICENSE, "items": dict(sorted(items.items()))}
    path.write_text(json.dumps(idx, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    archived.append(name)


def write_index(taxa, base_rows=None):
    """Ricostruisce data/trait-icons.json dai file presenti in assets/traits.
    base_rows: {specie: {"colore", "forma"}} dichiarate dal manifest; altrimenti resta quella dell'indice."""
    path = ROOT / "data/trait-icons.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"taxa": {}}
    files = {f.stem for f in OUT.glob("*.webp")}
    removed = sorted(n for n in files if not valid_name(taxa, n))
    for n in removed:
        (OUT / f"{n}.webp").unlink()
    files -= set(removed)
    has = lambda n: n in files  # noqa: E731
    index = {}
    for key in sorted(taxa):
        if not all(has(f"{key}-{p}") for p in PARTS):
            continue
        tr = taxa[key].get("traits") or {}
        declared = {**(old["taxa"].get(key, {}).get("base") or {}), **((base_rows or {}).get(key) or {})}
        b = {k: v for k, v in declared.items() if k in ("colore", "forma")}
        for kind, field in (("colore", "cap_color"), ("forma", "cap_shape")):
            vals = tr.get(field) or []
            if kind not in b and len(vals) == 1:
                b[kind] = vals[0]
        entry = {}
        for kind, field, trait in (("colore", "colors", "cap_color"), ("forma", "shapes", "cap_shape")):
            order = tr.get(trait) or []
            done = [v for v in order if has(f"{key}-cappello-{v}") and has(f"{key}-gambo-{v}")]
            if done and b.get(kind):
                entry[field] = {"drawn": b[kind], "values": [v for v in order if v == b[kind] or v in done]}
        combos = sorted(f"{c}|{f}" for c in tr.get("cap_color") or [] for f in tr.get("cap_shape") or []
                        if has(f"{key}-cappello-{c}-{f}") and has(f"{key}-gambo-{c}-{f}"))
        if combos:
            entry["combos"] = combos
        # fasi complete: tutte le tessere che cambiano in quella fase, nell'ordine dei dati
        stages = [s["id"] for s in taxa[key].get("stages") or [] if all(has(f"{key}-{t}-fase-{s['id']}") for t in s["tiles"])]
        if stages:
            entry["stages"] = stages
        # cosa mostra il disegno base: serve al test di completezza per sapere quali varianti mancano
        if b:
            entry["base"] = b
        index[key] = entry
    out = {
        "note": "Icone dei caratteri disegnate con AI (image_gen) a partire dai caratteri strutturati di data/species-traits.json, riviste dal proprietario del progetto, senza opere di terzi. Mostrano varianti descritte nelle fonti; non sono foto e non servono a identificare.",
        **LICENSE,
        "parts": list(PARTS),
        "taxa": index,
        "margins": {n: margin(OUT / f"{n}.webp") for n in sorted(files)},
    }
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return index, removed


def main(inc, stato=False, stati=(STATE_OK,)):
    import import_stage_icons
    taxa = json.loads((ROOT / "data/species-traits.json").read_text(encoding="utf-8"))["taxa"]
    rows, skipped, all_rows = load_rows(inc, stato, stati)
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = Sheets(inc)
    rejected, written, base, archived = [], [], {}, []
    def base_size(key, tile):
        """Dimensioni del disegno base (anche da una tavola non importata ora), per allineare le varianti di colore.
        Vale l'ultima riga del manifest (es. il gambo del coprino ridisegnato con l'anello)."""
        r = next((x for x in reversed(all_rows) if x["soggetto"] == key and x["tessera"] == tile and not x.get("variante") and not x.get("fase")), None)
        if not r:
            return None
        cb = bbox(sheets.crop(r, all_rows)[0])
        return (cb[2] - cb[0], cb[3] - cb[1])
    plain = [r for r in rows if not r.get("fase")]
    for r in plain:
        key, var = r["soggetto"], r.get("variante")
        where = f"{r['file'].removeprefix('incoming/')} cella {r.get('cella', '?')} {key} {var or r['tessera']}"
        if key not in taxa:
            rejected.append(f"{where}: la specie non è in species-traits.json"); continue
        tr = taxa[key].get("traits") or {}
        if r["tessera"] not in (("cappello", "gambo") if var else PARTS):
            rejected.append(f"{where}: tessera «{r['tessera']}» non prevista"); continue
        if var:
            parts = dict(x.split(":", 1) for x in var.split("+"))
            bad = [f"{k}:{v}" for k, v in parts.items() if k not in ("colore", "forma") or v not in (tr.get("cap_color" if k == "colore" else "cap_shape") or [])]
            if bad:
                rejected.append(f"{where}: {', '.join(bad)} non è tra i valori delle fonti"); continue
            if "forma" in parts and "colore" not in parts and taxa[key].get("stages") and key not in KEEP_SHAPES:
                # fuori dall'app (le fasi sostituiscono le forme, 15/10), ma conservate come alternativa (16/10)
                archive_shape(r, key, parts["forma"], fit(sheets.crop(r, all_rows)[0]), archived); continue
        crop, _ = sheets.crop(r, all_rows)
        if not var:
            name = f"{key}-{r['tessera']}"
        elif "+" in var:
            name = f"{key}-{r['tessera']}-{parts['colore']}-{parts['forma']}"
        else:
            name = f"{key}-{r['tessera']}-{var.split(':', 1)[1]}"
        size = var and var.startswith("colore:") and "+" not in var and base_size(key, r["tessera"])
        tile = fit_like(crop, size) if size else fit(crop)
        if r.get("base"):
            base[key] = r["base"]
        tile.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
        written.append(name)
    st_written, st_rejected = import_stage_icons.import_rows([r for r in rows if r.get("fase")], all_rows, taxa, sheets)
    index, removed = write_index(taxa, base)
    print(f"{len(written)} icone di base e varianti, {len(st_written)} di fase; {len(index)} specie; "
          f"varianti di colore per {sum('colors' in e for e in index.values())}, di forma per {sum('shapes' in e for e in index.values())}, "
          f"combinazioni per {sum('combos' in e for e in index.values())}, fasi per {sum('stages' in e for e in index.values())}")
    report(skipped, rejected + st_rejected, removed)
    if archived:
        print(f"\nForme di specie con le fasi, conservate in {ARCHIVE.relative_to(ROOT)}/ (non pubblicate): {len(archived)}")


def report(skipped, rejected, removed):
    if skipped:
        print(f"\nTavole saltate (stato in STATO.md non accettato): {len(skipped)}")
        for f, s in sorted(skipped.items()):
            print(f"  {f}: {s}")
    if rejected:
        print(f"\nRighe rifiutate: {len(rejected)}")
        for x in rejected:
            print(f"  {x}")
    if removed:
        print(f"\nFile cancellati perché i dati non li giustificano più: {', '.join(removed)}")


def cli(fn):
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    stati = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--stati" and i + 1 < len(sys.argv)), None)
    if stati:
        args.remove(stati)
    fn(args[0] if args else "incoming", "--stato" in sys.argv or bool(stati),
       tuple(s.strip() for s in stati.split(",")) if stati else (STATE_OK,))


if __name__ == "__main__":
    cli(main)
