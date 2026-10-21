#!/usr/bin/env python3
"""Import selettivo dei manifest fotografici dopo valutazione scritta.

python3 tools/import-photo-expansion.py --assessment <valutazione.json> <manifest...>
La valutazione contiene approved_ids. I manifest e gli originali restano in incoming.
"""
import argparse
import hashlib
import json
import re
import shutil
import urllib.parse
from pathlib import Path
from PIL import Image
from import_crop_points import valid

ROOT = Path(__file__).resolve().parent.parent
FORMATS = {'5:4', '3:4', '4:5', '16:7', '4:3', '1:1'}
FILES = {'media': 'media.json', 'plants': 'plants.json', 'trees': 'media-trees.json', 'animals': 'animals.json'}
RESOLVED_ANIMAL_GAPS = {
    'Fotografie con licenza verificata ancora da acquisire.',
    'Fotografie reali con autore e licenza verificati ancora da acquisire.',
}


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def local(path):
    result = (ROOT / path).resolve()
    if not result.is_relative_to(ROOT) or not result.is_file():
        raise ValueError('File locale mancante o esterno: ' + path)
    return result


def url_key(value):
    parts = urllib.parse.urlsplit(value)
    query = urllib.parse.urlencode([(key, value) for key, value in urllib.parse.parse_qsl(parts.query) if not key.startswith('utm_')])
    return urllib.parse.unquote(urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path, query, ''))).replace('_', ' ')


def photo_page(value):
    # Una pagina tassonomica/una osservazione può documentare più fotografie.
    return '/wiki/File:' in urllib.parse.unquote(value) or '/photos/' in value


def all_photos(value):
    if isinstance(value, dict):
        if value.get('file'):
            yield value
        for child in value.values():
            yield from all_photos(child)
    elif isinstance(value, list):
        for child in value:
            yield from all_photos(child)


def import_photos(manifests, assessment_path, receipt_path=None):
    assessment = read(assessment_path)
    assessment_reference = str(assessment_path.relative_to(ROOT)) if assessment_path.is_relative_to(ROOT) else str(assessment_path)
    approved = set(assessment['approved_ids'])
    data = {key: read(ROOT / 'data' / filename) for key, filename in FILES.items()}
    crops = read(ROOT / 'data/crop-points.json')
    seen_sources, seen_hashes, seen_ids = set(), set(), set()
    for document in data.values():
        for photo in all_photos(document):
            for field in ['page', 'sourceImage']:
                if photo.get(field) and (field == 'sourceImage' or photo_page(photo[field])):
                    seen_sources.add(url_key(photo[field]))
            if photo.get('sha256Original'):
                seen_hashes.add(photo['sha256Original'])
    plans = []
    for manifest in manifests:
        for row in read(manifest)['photos']:
            if row['id'] not in approved:
                continue
            row = dict(row)
            if row.get('licenseUrl', '').startswith('http://creativecommons.org/'):
                row['licenseUrlOriginal'] = row['licenseUrl']
                row['licenseUrl'] = 'https://' + row['licenseUrl'][7:]
            if not re.fullmatch(r'(?:pe2|ce[0-9]*)-[a-z0-9-]{1,100}', row['id']):
                raise ValueError('ID non valido: ' + row['id'])
            if row['id'] in seen_ids:
                raise ValueError('ID ripetuto nei manifest: ' + row['id'])
            seen_ids.add(row['id'])
            review = row.get('visual_review', {})
            if not review.get('approved') or not review.get('attribution_approved') or valid(review):
                raise ValueError('Revisione incompleta: ' + row['id'])
            for field in ['author', 'page', 'license', 'licenseUrl', 'sourceImage', 'caption', 'alt', 'attribution', 'changes']:
                if not isinstance(row.get(field), str) or not row[field].strip():
                    raise ValueError('Metadato mancante ' + field + ': ' + row['id'])
            for field in ['licenseUrl', 'page', 'sourceImage']:
                if not re.fullmatch(r'https://[^\s\"\'<>]+', row[field]):
                    raise ValueError('URL non verificabile ' + field + ': ' + row['id'])
            if (photo_page(row['page']) and url_key(row['page']) in seen_sources) or url_key(row['sourceImage']) in seen_sources or row['sha256_original'] in seen_hashes:
                raise ValueError('Fonte o contenuto già integrati: ' + row['id'])
            original = local(row['original'])
            if digest(original) != row['sha256_original']:
                raise ValueError('Originale cambiato: ' + row['id'])
            if row.get('commons_sha1') and hashlib.sha1(original.read_bytes()).hexdigest() != row['commons_sha1']:
                raise ValueError('SHA1 Commons inatteso: ' + row['id'])
            if set(row['crop_points']) != FORMATS or any(len(pair) != 2 or any(not 0 <= x <= 1 for x in pair) for pair in row['crop_points'].values()):
                raise ValueError('Punti di ritaglio incompleti: ' + row['id'])
            group, key = row['target_group'], row['target_key']
            if group in ['species', 'lookalikes']:
                record, field, folder = data['media'][group][key], 'inat', 'species'
            elif group == 'plants':
                record, field, folder = data['plants']['plants'][key], 'photos', 'plants'
                if len(record['photos']) + sum(r['target_key'] == key and r['target_group'] == group for r, *_ in plans) >= 6:
                    raise ValueError('La scheda pianta supererebbe sei foto: ' + key)
            elif group == 'trees':
                record, field, folder = data['trees']['trees'][key], 'commons', 'trees'
            elif group == 'animals':
                record = next(animal for animal in data['animals']['items'] if animal['id'] == key)
                field, folder = 'photos', 'animals'
                if record['publicationStatus'] != 'ready' or not row.get('photo_taxon'):
                    raise ValueError('Scheda o taxon fotografato non validi: ' + key)
            else:
                raise ValueError('Gruppo non supportato: ' + group)
            exports = {}
            for name, suffix in [('file', '.webp'), ('file_hd', '-hd.webp'), ('thumb', '-t.webp')]:
                source = local(row['files'][name])
                with Image.open(source) as image:
                    if image.format != 'WEBP' or image.getexif() or image.info.get('exif') or image.info.get('xmp'):
                        raise ValueError('Export non pulito: ' + str(source))
                    if name == 'thumb' and image.size != (160, 160):
                        raise ValueError('Miniatura non 160×160: ' + row['id'])
                if source.stat().st_size > {'file': 80_000, 'file_hd': 220_000, 'thumb': 25_000}[name]:
                    raise ValueError('Export oltre il limite di peso: ' + row['id'] + '/' + name)
                target = ROOT / 'assets' / folder / (row['id'] + suffix)
                if target.exists():
                    raise ValueError('Destinazione già presente: ' + str(target))
                exports[name] = (source, target)
            plans.append((row, record, field, exports))
            seen_sources.add(url_key(row['sourceImage']))
            if photo_page(row['page']):
                seen_sources.add(url_key(row['page']))
            seen_hashes.add(row['sha256_original'])
    if seen_ids != approved:
        raise ValueError('Valutazione e manifest non coincidono: ' + str(sorted(approved - seen_ids)))
    receipt = []
    changed = set()
    for row, record, field, exports in plans:
        photo = {name: str(target.relative_to(ROOT)) for name, (_, target) in exports.items()}
        photo.update({key: row[key] for key in ['page', 'author', 'license', 'licenseUrl', 'attribution', 'alt', 'caption', 'changes']})
        photo.update(source=row.get('source', 'Wikimedia Commons'), sourceImage=row['sourceImage'], sha256Original=row['sha256_original'])
        if row.get('photo_taxon'):
            photo['photo_taxon'] = row['photo_taxon']
        for key in ['attribution_required_text', 'sourceCaption', 'source_taxon_name', 'source_taxon_id', 'observation_id', 'photo_id', 'quality_grade', 'taxon_crosswalk_source']:
            if row.get(key):
                photo[key] = row[key]
        for source_key, target_key in [('observationID', 'observation_id'), ('photoID', 'photo_id'), ('source_taxon', 'source_taxon_name'), ('taxon_id', 'source_taxon_id')]:
            if row.get(source_key) and not photo.get(target_key):
                photo[target_key] = row[source_key]
        if row.get('observation_taxon'):
            photo.setdefault('source_taxon_name', row['observation_taxon']['name'])
            photo.setdefault('source_taxon_id', row['observation_taxon']['id'])
        for name, (source, target) in exports.items():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            crops['files'][photo[name]] = {**(row['crop_points'] if name != 'thumb' else {fmt: [.5, .5] for fmt in FORMATS}), 'dubbio': False}
        record.setdefault(field, []).append(photo)
        if row['target_group'] == 'animals':
            record['knownGaps'] = [gap for gap in record['knownGaps'] if gap not in RESOLVED_ANIMAL_GAPS]
        changed.add('media' if row['target_group'] in ['species', 'lookalikes'] else row['target_group'])
        receipt.append({**row, 'integrated': photo, 'export_hashes': {name: digest(target) for name, (_, target) in exports.items()}})
    for key in changed:
        if key == 'media':
            data[key]['generated'] = '2026-10-19'
        path = ROOT / 'data' / FILES[key]
        path.write_text(json.dumps(data[key], ensure_ascii=False, indent=1 if key == 'media' else 2) + '\n')
    (ROOT / 'data/crop-points.json').write_text(json.dumps(crops, ensure_ascii=False, separators=(',', ':')) + '\n')
    animals_with_photos = {animal['id'] for animal in data['animals']['items'] if animal['photos']}
    pending_path = ROOT / 'data/asset-pending.json'
    pending = read(pending_path)
    for entry in pending['pendenze']:
        if entry['categoria'] == 'animali-foto':
            entry['voci'] = [value for value in entry['voci'] if value.removesuffix(' (nessuna foto)') not in animals_with_photos]
    pending['pendenze'] = [entry for entry in pending['pendenze'] if entry['voci']]
    pending_path.write_text(json.dumps(pending, ensure_ascii=False, indent=1) + '\n')
    out = receipt_path or ROOT / 'incoming/photo-expansion-2026-10-18/integration.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({'assessment': assessment_reference, 'photos': receipt}, ensure_ascii=False, indent=2) + '\n')
    print('Integrate', len(receipt), 'fotografie distinte')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assessment', required=True, type=Path)
    parser.add_argument('--receipt', type=Path, help='Ricevuta separata per il lotto corrente; non sovrascrivere lotti già integrati.')
    parser.add_argument('manifests', nargs='+', type=Path)
    args = parser.parse_args()
    import_photos(args.manifests, args.assessment.resolve(), args.receipt.resolve() if args.receipt else None)
