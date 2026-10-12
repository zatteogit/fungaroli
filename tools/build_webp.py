#!/usr/bin/env python3
"""Foto in WebP (piu' leggere) e miniature vere per i tondini.

Per ogni JPG in assets/species e assets/zones crea accanto un .webp (stesse dimensioni; le HD delle zone
ridotte a 1600 px), e per le foto piccole una miniatura quadrata da 160 px (-t.webp).
Poi aggiorna data/media*.json: file e file_hd puntano ai .webp, e "thumb" alla miniatura.
I JPG restano dove sono (servono alla copia di revisione e come originali).

Uso: python3 tools/build_webp.py
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
Q_SMALL, Q_HD, Q_THUMB, THUMB = 76, 78, 72, 160
CAP_SMALL, CAP_HD = 70_000, 220_000  # byte


def webp(src: Path, maxside=None, q=Q_SMALL):
    out = src.with_suffix('.webp')
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime and out.stat().st_size <= (CAP_HD if q == Q_HD else CAP_SMALL):
        return out
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if maxside and max(im.size) > maxside:
        im.thumbnail((maxside, maxside), Image.LANCZOS)
    # tetto di peso: le foto "difficili" (erba, aghi) scendono di qualita' finche' non ci stanno, fino a 58
    cap = CAP_HD if q == Q_HD else CAP_SMALL
    while True:
        im.save(out, 'WEBP', quality=q, method=6)
        if out.stat().st_size <= cap or q <= 58:
            return out
        q -= 6


def thumb(src: Path):
    out = src.with_name(src.stem + '-t.webp')
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
        return out
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    im = ImageOps.fit(im, (THUMB, THUMB), Image.LANCZOS, centering=(0.5, 0.45))
    im.save(out, 'WEBP', quality=Q_THUMB, method=6)
    return out


def main():
    before = after = 0
    for d in ('assets/species', 'assets/zones'):
        for src in sorted((ROOT / d).glob('*.jpg')):
            hd = src.stem.endswith('-hd')
            out = webp(src, 1600 if (hd and 'zones' in d) else None, Q_HD if hd else Q_SMALL)
            before += src.stat().st_size; after += out.stat().st_size
            if not hd:
                thumb(src)
    print(f'JPG {before / 1e6:.1f} MB -> WebP {after / 1e6:.1f} MB')

    def fix(m):
        if not isinstance(m, dict):
            return
        for k in ('file', 'file_hd'):
            v = m.get(k)
            if isinstance(v, str) and v.endswith('.jpg') and (ROOT / v[:-4]).with_suffix('.webp').exists():
                m[k] = v[:-4] + '.webp'
        f = m.get('file')
        if isinstance(f, str) and f.endswith('.webp'):
            t = f[:-5] + '-t.webp'
            if (ROOT / t).exists():
                m['thumb'] = t
        for v in list(m.values()):
            if isinstance(v, dict):
                fix(v)
            elif isinstance(v, list):
                for x in v:
                    fix(x)

    for f in ('data/media.json', 'data/media-trees.json', 'data/media-zones.json'):
        p = ROOT / f
        d = json.loads(p.read_text())
        fix(d)
        p.write_text(json.dumps(d, ensure_ascii=False, indent=1))
        print('aggiornato', f)


if __name__ == '__main__':
    main()
