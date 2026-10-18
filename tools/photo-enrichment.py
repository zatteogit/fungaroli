#!/usr/bin/env python3
"""Inventario e acquisizione riprendibile. Nessuna scrittura ai cataloghi pubblici.

python3 tools/photo-enrichment.py inventory
python3 tools/photo-enrichment.py acquire --limit 12
python3 tools/photo-enrichment.py prepare

acquire verifica i metadati del singolo file Commons prima del download.
prepare richiede controllo visivo, attribuzione e riquadro del soggetto approvati.
"""
import argparse
import hashlib
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / 'docs/assets/photo-enrichment-2026-10-18'
WORK = ROOT / 'incoming/photo-enrichment-2026-10-18'
MANIFEST = DOC / 'candidates.json'
UA = 'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'


def read(path):
    return json.loads(path.read_text())


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def photos(record):
    out = ([record['ref']] if record.get('ref') else [])
    out += [p for key in ('inat', 'commons', 'photos') for p in record.get(key, [])]
    if record.get('file'):
        out.append(record)
    return [p for i, p in enumerate(out) if p.get('file') not in {q.get('file') for q in out[:i]}]


def inventory():
    rows = []
    for filename, groups in [('media.json', ['species', 'lookalikes']),
                             ('media-trees.json', ['trees']), ('plants.json', ['plants']),
                             ('media-zones.json', ['zones'])]:
        for group in groups:
            for key, record in read(ROOT / 'data' / filename)[group].items():
                pp = photos(record)
                # Seasonal/weather variants are adaptations of one photo, never extra real photos.
                rows.append({'catalog': filename, 'group': group, 'key': key,
                             'latin': record.get('latin', key if group == 'lookalikes' else None),
                             'photos': len(pp), 'existing_files': sum((ROOT / p['file']).is_file() for p in pp),
                             'missing_license_url': sum(not p.get('licenseUrl') for p in pp),
                             'files': [p['file'] for p in pp]})
    rows.append({'catalog': 'species-traits.json', 'group': 'unillustrated_taxa', 'key': 'inocybe',
                 'latin': 'Inocybe spp.', 'photos': 0, 'existing_files': 0, 'missing_license_url': 0,
                 'files': [], 'note': 'Eccezione documentata: genere intero; non sostituire con foto di una specie.'})
    known_zones = {r['key'] for r in rows if r['group'] == 'zones'}
    for zone in read(ROOT / 'data/zones.json')['zones']:
        if zone['id'] not in known_zones:
            rows.append({'catalog': 'media-zones.json', 'group': 'zones', 'key': zone['id'],
                         'latin': None, 'photos': 0, 'existing_files': 0,
                         'missing_license_url': 0, 'files': []})
    rows.sort(key=lambda x: (x['photos'], x['catalog'], x['key']))
    summary = {g: dict(sorted(Counter(r['photos'] for r in rows if r['group'] == g).items()))
               for g in ['species', 'lookalikes', 'unillustrated_taxa', 'plants', 'trees', 'zones']}
    write(DOC / 'coverage.json', {'date': '2026-10-18', 'summary': summary, 'records': rows})
    print(json.dumps(summary, ensure_ascii=False))


def request(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as resp:
        # A bounded request; no proxy changes, alternate gateways, retry loops or hidden uploads.
        data = resp.read(50_000_001)
    if len(data) > 50_000_000:
        raise ValueError('File oltre il limite di acquisizione di 50 MB')
    return data


def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()


def acquire(limit):
    candidates = read(MANIFEST)['candidates']
    state_path = WORK / 'acquisition.json'
    previous = read(state_path)['results'] if state_path.exists() else []
    results = {item['id']: item for item in previous}
    for c in candidates[:limit]:
        item = {'id': c['id'], 'status': 'not_downloaded'}
        try:
            api = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
                'action': 'query', 'titles': 'File:' + c['commons_title'], 'prop': 'imageinfo',
                'iiprop': 'url|extmetadata|sha1|size', 'format': 'json'})
            d = json.loads(request(api))
            info = next(iter(d['query']['pages'].values()))['imageinfo'][0]
            meta = info['extmetadata']
            license_name = plain(meta.get('LicenseShortName', {}).get('value'))
            author = plain(meta.get('Artist', {}).get('value'))
            license_url = plain(meta.get('LicenseUrl', {}).get('value'))
            if license_name != c['license'] or c['author'] not in author or not license_url:
                raise ValueError('Metadati della fonte cambiati/incompleti: revisione necessaria')
            url = info['url']
            if urllib.parse.urlparse(url).hostname != 'upload.wikimedia.org':
                raise ValueError('Host originale inatteso: revisione necessaria')
            target = WORK / 'originals' / (c['id'] + Path(urllib.parse.urlparse(url).path).suffix.lower())
            blob = target.read_bytes() if target.exists() else request(url)
            if hashlib.sha1(blob).hexdigest() != info['sha1']:
                raise ValueError('Hash originale diverso dalla fonte')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(blob)
            item.update(status='downloaded_pending_visual_review', original=str(target.relative_to(ROOT)),
                        sha256=hashlib.sha256(blob).hexdigest(), original_url=url,
                        author=author, license=license_name, licenseUrl=license_url,
                        page=info['descriptionurl'], source_size=[info['width'], info['height']])
        except Exception as error:
            # Do not log complete URLs, EXIF, coordinates, proxy credentials or response bodies.
            item['error'] = type(error).__name__ + ': ' + str(error).split('?')[0][:200]
        results[item['id']] = item
        write(state_path, {'date': '2026-10-18', 'results': list(results.values())})
        print(c['id'], item['status'], item.get('error', ''))
        if '403 Forbidden' in item.get('error', ''):
            print('Accesso negato dalla rete: lotto interrotto, nessun tentativo di aggiramento.')
            return False
    return all(item['status'] == 'downloaded_pending_visual_review' for item in results.values())


def encode(im, dest, side, quality, cap):
    from PIL import Image
    im = im.copy()
    im.thumbnail((side, side), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    while True:
        im.save(dest, 'WEBP', quality=quality, method=6)
        if dest.stat().st_size <= cap or quality <= 58:
            return
        quality -= 6


def prepare():
    from PIL import Image, ImageOps
    sys.path.insert(0, str(ROOT / 'tools'))
    from import_crop_points import positions, valid
    candidates = {c['id']: c for c in read(MANIFEST)['candidates']}
    acquisition = read(WORK / 'acquisition.json')['results']
    prepared = []
    for item in acquisition:
        if item['status'] != 'downloaded_pending_visual_review':
            continue
        if item['id'] not in candidates:
            continue
        c = candidates[item['id']]
        review = c.get('visual_review', {})
        if not review.get('approved') or valid(review) or not review.get('attribution_approved'):
            print(item['id'], 'in attesa di controllo visivo/ritagli/attribuzione')
            continue
        original = ROOT / item['original']
        if hashlib.sha256(original.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Originale cambiato dopo acquisizione')
        im = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
        # Copy pixel data only. Sensitive EXIF/GPS never enters output WebP.
        clean = Image.new('RGB', im.size)
        clean.paste(im)
        stem = WORK / 'prepared' / item['id']
        main, hd, thumb = (Path(str(stem) + suffix) for suffix in ['.webp', '-hd.webp', '-t.webp'])
        encode(clean, main, 560, 76, 70_000)
        encode(clean, hd, 1600, 78, 220_000)
        w, h = clean.size
        px, py = positions(clean.size, review)['1:1']
        side = min(w, h)
        x, y = round(px * (w - side)), round(py * (h - side))
        clean.crop((x, y, x + side, y + side)).resize((160, 160), Image.Resampling.LANCZOS).save(thumb, 'WEBP', quality=72, method=6)
        prepared.append({**item, 'file': str(main.relative_to(ROOT)), 'file_hd': str(hd.relative_to(ROOT)),
                         'thumb': str(thumb.relative_to(ROOT)), 'crop_points': positions(clean.size, review),
                         'attribution': c['attribution'], 'changes': 'Orientamento EXIF, ridimensionamento, compressione WebP; miniatura ritagliata.',
                         'status': 'prepared_for_integration_review'})
    write(WORK / 'prepared.json', {'photos': prepared})
    print('Preparate per revisione:', len(prepared))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['inventory', 'acquire', 'prepare'])
    parser.add_argument('--limit', type=int, default=12)
    parser.add_argument('--manifest', type=Path, default=MANIFEST)
    args = parser.parse_args()
    MANIFEST = args.manifest
    if args.command == 'inventory':
        inventory()
    elif args.command == 'acquire':
        if not acquire(args.limit):
            sys.exit(1)
    else:
        prepare()
