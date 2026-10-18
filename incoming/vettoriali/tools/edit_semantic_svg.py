#!/usr/bin/env python3
"""Edit reviewed SVG groups without altering biological source data."""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')
# An illustrative palette, not measured species colorimetry.
PALETTE = {'crema': (246, 235, 215), 'bianco': (250, 249, 244)}


def edit(source, target, color=None, hidden=()):
    tree = ET.parse(source)
    root = tree.getroot()
    metadata_node = root.find(f'{{{SVG}}}metadata')
    metadata = json.loads(metadata_node.text)
    groups = {node.get('data-part'): node for node in root if node.get('data-part')}
    unknown = set(hidden) - groups.keys()
    if unknown:
        raise ValueError(f'Unknown parts: {sorted(unknown)}')
    if color is not None:
        if color not in metadata['documented_traits'].get('cap_color', []):
            raise ValueError(f'Undocumented cap_color: {color}')
        original = metadata.get('vector_edits', {}).get('original_cap_color', metadata['variant']['cap_color'])
        if color not in PALETTE or original not in PALETTE:
            raise ValueError('No reviewed palette for this color; keep the source artwork')
        delta = [new-old for old, new in zip(PALETTE[original], PALETTE[color])]
        for path in groups['cap'].findall(f'{{{SVG}}}path'):
            original_fill = path.get('data-original-fill')
            if path.get('data-paint-role') != 'material':
                continue
            rgb = [int(original_fill[i:i+2], 16) for i in (1, 3, 5)]
            path.set('fill', '#'+''.join(f'{max(0,min(255,round(v+d))):02x}' for v, d in zip(rgb, delta)))
        metadata.setdefault('vector_edits', {})['original_cap_color'] = original
        metadata['variant']['cap_color'] = color
        metadata['vector_edits']['color_method'] = 'Illustrative RGB offset on cap material paths only; no new raster generation'
        root.find(f'{{{SVG}}}desc').text = 'Illustrazione schematica derivata dal raster revisionato; colore del cappello: '+color+'. Non è una fotografia né un’identificazione.'
    for name, group in groups.items():
        group.set('display', 'none' if name in hidden else 'inline')
    metadata.setdefault('vector_edits', {})['hidden_layers'] = list(hidden)
    metadata['review_status'] = 'edited-prototype-needs-visual-approval'
    metadata_node.text = json.dumps(metadata, ensure_ascii=False)
    ET.indent(tree)
    tree.write(target, encoding='utf-8', xml_declaration=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('target', type=Path)
    parser.add_argument('--cap-color')
    parser.add_argument('--hide', action='append', default=[])
    args = parser.parse_args()
    edit(args.source, args.target, args.cap_color, args.hide)
