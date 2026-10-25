#!/usr/bin/env python3
"""Importa solo varianti locali revisionate, con crediti e ritagli responsive.

Uso: python3 tools/import_reviewed_zone_variants.py manifest.json
Il manifest è una lista di job imagegen: zone, season, weather, path, status,
review e prompt. Le foto originali e le varianti già presenti restano intatte.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image
from import_crop_points import positions

ROOT = Path(__file__).resolve().parent.parent
SEASONS = {"primavera", "estate", "autunno", "inverno"}
WEATHERS = {"sereno", "nuvoloso", "pioggia", "nebbia", "neve"}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data, compact=False):
    options = {"separators": (",", ":")} if compact else {"indent": 1}
    path.write_text(json.dumps(data, ensure_ascii=False, **options) + "\n", encoding="utf-8")


def main(manifest):
    jobs = [j for j in read(Path(manifest)) if j.get("status") == "reviewed"]
    media = read(ROOT / "data/media-zones.json")
    crops = read(ROOT / "data/crop-points.json")
    focals = read(ROOT / "docs/ritagli-luoghi-2026-10-25.json")["zones"]
    pending = read(ROOT / "data/asset-pending.json")
    receipt = []
    seen = set()
    for job in jobs:
        zid, season, weather = job["zone"], job["season"], job["weather"]
        key = (zid, season, weather)
        assert key not in seen, f"Combinazione duplicata: {key}"
        seen.add(key)
        assert season in SEASONS and weather in WEATHERS
        assert weather != "neve" or season == "inverno"
        assert job.get("review") and job.get("prompt"), f"Revisione mancante: {key}"
        original = media["zones"][zid]
        assert all(original.get(k) for k in ("author", "license", "licenseUrl", "page"))
        src = Path(job["path"])
        im = Image.open(src).convert("RGB")
        assert min(im.size) >= 600, f"Risoluzione insufficiente: {src}"
        variant = {"season": season, "weather": weather, "generated": True,
                   **{k: original[k] for k in ("source", "author", "license", "licenseUrl", "page")},
                   "modified": "Variante illustrativa di stagione e meteo elaborata con IA dalla foto originale; conversione WebP"}
        focal = focals[zid]
        geometry = {"punto": focal["point"], "riquadro": focal["bounds"]}
        for field, suffix, side, quality in (("file", "", 640, 70), ("file_hd", "-hd", 1600, 72)):
            dest = f"assets/zones/var/{zid}-{season}-{weather}{suffix}.webp"
            target = ROOT / dest
            target.parent.mkdir(parents=True, exist_ok=True)
            scaled = im.copy()
            scaled.thumbnail((side, side), Image.Resampling.LANCZOS)
            scaled.save(target, "WEBP", quality=quality, method=6)
            variant[field] = dest
            crops["files"][dest] = {**positions(scaled.size, geometry), "dubbio": False}
            if field == "file_hd":
                variant["size"] = list(scaled.size)
        existing = original.setdefault("variants", [])
        existing[:] = [v for v in existing if (v["season"], v["weather"]) != (season, weather)]
        existing.append(variant)
        existing.sort(key=lambda v: (v["season"], v["weather"]))
        receipt.append({"zone": zid, "season": season, "weather": weather,
                        "file": variant["file"], "source": original["page"],
                        "sourcePngSha256": hashlib.sha256(src.read_bytes()).hexdigest(),
                        "prompt": job.get("effectivePrompt", job["prompt"]), "review": job["review"],
                        "rejected": [{"sourcePngSha256": hashlib.sha256(Path(r["path"]).read_bytes()).hexdigest(),
                                      "reason": r["reason"]} for r in job.get("rejected", [])]})
    # La data di scatto della foto originale di Faete è il 5 aprile 2021.
    if any(j["zone"] == "faete-rocca-papa" for j in jobs):
        media["zones"]["faete-rocca-papa"].update(season="primavera", weather="sereno")
    resolved = {f"{z}:{s}-{w}" for z, s, w in seen}
    if jobs and any(j["zone"] == "faete-rocca-papa" for j in jobs):
        resolved.add("faete-rocca-papa:primavera-sereno")
    for section in ("pendenze", "eccezioni"):
        for group in pending[section]:
            if group["categoria"] == "luoghi-copertine":
                group["voci"] = [v for v in group["voci"] if v not in resolved]
        pending[section] = [g for g in pending[section] if g["voci"]]
    write(ROOT / "data/media-zones.json", media)
    write(ROOT / "data/crop-points.json", crops, compact=True)
    write(ROOT / "data/asset-pending.json", pending)
    write(ROOT / "docs/varianti-luoghi-2026-10-25.json", receipt)
    print(f"Importate {len(jobs)} varianti revisionate in {len({j['zone'] for j in jobs})} luoghi")


if __name__ == "__main__":
    main(sys.argv[1])
