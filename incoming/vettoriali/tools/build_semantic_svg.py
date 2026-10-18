#!/usr/bin/env python3
"""Approved raster -> traced paths -> manually annotated anatomical partitions.

This builder deliberately targets the reviewed Amanita prototype. It is not an
anatomy detector, and its region annotations must not be copied to other shapes.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image
import vtracer

SVG = 'http://www.w3.org/2000/svg'
INK = 'http://www.inkscape.org/namespaces/inkscape'
ET.register_namespace('', SVG)
ET.register_namespace('inkscape', INK)
LAYERS = [
    ('cap', 'Cappello', ['cap_color', 'cap_shape', 'cap_surface']),
    ('hymenophore', 'Lamelle', ['hymenophore', 'hymenophore_color']),
    ('stem', 'Gambo', ['stem_base']),
    ('ring', 'Anello', ['stem_ring']),
    ('volva', 'Volva', ['stem_volva']),
]


def element(tag, attributes=None, text=None):
    node = ET.Element(f'{{{SVG}}}{tag}', attributes or {})
    node.text = text
    return node


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def build(folder, data):
    folder = Path(folder)
    spec = json.loads((folder/'regions.json').read_text())
    taxa = json.loads(Path(data).read_text())['taxa']
    taxon = taxa[spec['taxon_key']]
    traits = taxon['traits']
    variant = spec['variant']
    if spec['taxon_key'] != 'amanita-verna' or variant != {'cap_color': 'crema', 'cap_shape': 'emisferico'}:
        raise ValueError('This prototype requires its own reviewed Amanita regions')
    for field, value in variant.items():
        if value not in (traits.get(field) or []):
            raise ValueError(f'Undocumented {field}={value}')
    if traits.get('stem_ring') is not True or traits.get('stem_volva') is not True:
        raise ValueError('Ring and volva layers require documented presence')

    image = Image.open(folder/'source.png').convert('RGBA')
    if list(image.size) != spec['canvas']:
        raise ValueError('Source dimensions differ from region annotations')
    rgba = np.asarray(image)
    solid = rgba[:, :, 3] >= 220
    if not solid.any():
        raise ValueError('Source has no solid pixels')
    # Ignore translucent edge colors when building the limited trace palette.
    samples = Image.fromarray(rgba[:, :, :3][solid].reshape(1, -1, 3))
    palette = samples.quantize(colors=16, method=Image.Quantize.MEDIANCUT)
    normalized = image.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    normalized.putalpha(Image.fromarray((solid*255).astype('uint8')))
    normalized.save(folder/'trace-input.png')
    vtracer.convert_image_to_svg_py(
        str(folder/'trace-input.png'), str(folder/'trace-clean.svg'),
        colormode='color', hierarchical='stacked', mode='spline',
        filter_speckle=8, color_precision=6, layer_difference=16,
        corner_threshold=80, length_threshold=3, max_iterations=10,
        splice_threshold=45, path_precision=3,
    )
    traced = ET.parse(folder/'trace-clean.svg').getroot()
    width, height = image.size
    root = element('svg', {
        'version': '1.1', 'width': str(width), 'height': str(height),
        'viewBox': f'0 0 {width} {height}', 'role': 'img',
        'aria-labelledby': 'art-title art-desc', 'data-schema-version': '1',
        'data-taxon': spec['taxon_key'],
    })
    root.append(element('title', {'id': 'art-title'}, taxon['name']+' — illustrazione schematica a livelli'))
    root.append(element('desc', {'id': 'art-desc'},
        'Derivata da un raster generato e revisionato. Cappello crema emisferico, '
        'lamelle, gambo, anello e volva separati in livelli vettoriali. '
        'Non è una fotografia né un’identificazione.'))
    metadata = {
        'schema_version': 1, 'type': 'schematic-illustration',
        'taxon_key': spec['taxon_key'], 'variant': variant,
        'documented_traits': traits,
        'source': {**spec['source'], 'crop_sha256': digest(folder/'source.png'), 'traits_sha256': digest(data)},
        'license': 'CC BY-SA 4.0', 'license_url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'author': 'Fronda/Fungaroli', 'raster_first': True,
        'vectorizer': {'package': 'vtracer', 'version': '0.6.15', 'palette_colors': 16, 'alpha_threshold': 220},
        'semantic_segmentation': {
            'method': 'reviewed anatomical clip regions', 'annotation': spec['review'],
            'not_automatic_anatomy_recognition': True,
        },
        'layers': [{'id': key, 'label': label, 'trait_fields': fields} for key, label, fields in LAYERS],
        'geometry_model': 'Traced paths duplicated under non-overlapping anatomical clips; '
            'editable parts are groups with their clip regions, not independently redrawn silhouettes.',
        'not_drawn': {'stem_reticulum': traits.get('stem_reticulum')},
        'editable_operations': ['recolor-cap-with-documented-value', 'toggle-layer', 'inspect-paths'],
        'review_status': 'prototype-needs-visual-approval',
    }
    root.append(element('metadata', {'id': 'semantic-metadata'}, json.dumps(metadata, ensure_ascii=False)))
    definitions = element('defs')
    root.append(definitions)
    boundaries = spec['boundaries']
    full = f'M-10 -10H{width+10}V{height+10}H-10Z'
    # Even-odd complements partition the source. The neck is a hole in the
    # cap zone and is assigned to the stem. Ring and volva are below that zone.
    clips = {
        'cap': boundaries['cap_zone']+boundaries['gills']+boundaries['neck'],
        'hymenophore': boundaries['gills'],
        'ring': boundaries['ring'], 'volva': boundaries['volva'],
        'stem': full+boundaries['cap_zone']+boundaries['neck']+boundaries['ring']+boundaries['volva'],
    }
    for key, geometry in clips.items():
        clip = element('clipPath', {'id': 'clip-'+key, 'clipPathUnits': 'userSpaceOnUse'})
        clip.append(element('path', {'d': geometry, 'clip-rule': 'evenodd', 'fill-rule': 'evenodd'}))
        definitions.append(clip)
    for key, label, fields in LAYERS:
        group = element('g', {
            'id': key, 'data-part': key, 'data-trait-fields': ' '.join(fields),
            f'{{{INK}}}groupmode': 'layer', f'{{{INK}}}label': label,
            'clip-path': f'url(#clip-{key})',
        })
        group.append(element('title', text=label))
        group.append(element('desc', text='Caratteri documentati: '+', '.join(fields)))
        for index, path in enumerate(traced):
            if path.tag.rsplit('}', 1)[-1] != 'path':
                continue
            copied = copy.deepcopy(path)
            copied.set('id', f'{key}-path-{index:03}')
            color = copied.get('fill', '#000000')
            luminance = sum(int(color[j:j+2], 16) for j in (1, 3, 5))/765
            copied.set('data-paint-role', 'outline' if luminance < .42 else 'material')
            copied.set('data-original-fill', color)
            group.append(copied)
        root.append(group)
    ET.indent(root)
    ET.ElementTree(root).write(folder/'amanita-verna-semantic.svg', encoding='utf-8', xml_declaration=True)
    (folder/'semantic.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n')
    return root


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder')
    parser.add_argument('--data', default='data/species-traits.json')
    args = parser.parse_args()
    build(args.folder, args.data)
    print('Built semantic SVG:', args.folder)
