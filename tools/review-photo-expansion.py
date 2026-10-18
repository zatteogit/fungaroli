#!/usr/bin/env python3
"""Tavole del coordinatore dai soli file proposti per l'import, senza modificarli."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent


def build(manifests, output):
    output.mkdir(parents=True, exist_ok=True)
    photos = [row for manifest in manifests for row in json.loads(manifest.read_text())['photos']]
    index = []
    for start in range(0, len(photos), 6):
        sheet = Image.new('RGB', (1800, 1320), '#f2f0e9')
        draw = ImageDraw.Draw(sheet)
        for number, row in enumerate(photos[start:start + 6]):
            x, y = (number % 3) * 600, (number // 3) * 660
            source = ROOT / row['files']['file_hd']
            image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
            image.thumbnail((580, 510), Image.Resampling.LANCZOS)
            sheet.paste(image, (x + (600 - image.width) // 2, y + 92))
            lines = [row['id'], row.get('photo_taxon') or row['latin'], row.get('source', 'Wikimedia Commons') + ' / ' + row['license']]
            for line_number, line in enumerate(lines):
                draw.text((x + 12, y + 12 + 22 * line_number), line[:85], fill='#141414')
            caption = row['caption']
            for line_number in range(2):
                draw.text((x + 12, y + 610 + line_number * 20), caption[line_number * 80:(line_number + 1) * 80], fill='#141414')
        path = output / ('coordinator-%02d.jpg' % (start // 6 + 1))
        sheet.save(path, quality=92)
        index.append({'file': str(path.relative_to(ROOT)), 'ids': [row['id'] for row in photos[start:start + 6]]})
    (output / 'index.json').write_text(json.dumps({'sheets': index}, ensure_ascii=False, indent=2) + '\n')
    print(len(photos), 'foto in', len(index), 'tavole')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('manifests', nargs='+', type=Path)
    args = parser.parse_args()
    build(args.manifests, args.out.resolve())
