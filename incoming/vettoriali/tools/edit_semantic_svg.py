#!/usr/bin/env python3
"""Edit reviewed SVG groups without altering biological source data."""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')
# Legacy Amanita sample; color profiles are illustrative, not measured colorimetry.
PALETTE = {'crema': (246, 235, 215), 'bianco': (250, 249, 244)}


def recolor(root, metadata, groups, part, value):
    fields = {'cap':'cap_color', 'hymenophore':'hymenophore_color'}
    field = fields[part]
    if value not in metadata['documented_traits'].get(field, []):
        raise ValueError(f'Undocumented {field}: {value}')
    profiles = metadata.get('recolor_profiles', {})
    if part in profiles:
        profile = profiles[part]
        if value not in profile['targets']:
            raise ValueError('No reviewed palette for this color; keep the source artwork')
        anchor = profile['anchor_rgb']
        target = profile['targets'][value]
    elif part == 'cap' and metadata['taxon_key'] == 'amanita-verna':
        original = metadata.get('vector_edits', {}).get('original_cap_color', metadata['variant'][field])
        if value not in PALETTE or original not in PALETTE:
            raise ValueError('No reviewed palette for this color; keep the source artwork')
        anchor, target = PALETTE[original], PALETTE[value]
    else:
        raise ValueError('This anatomical part has no reviewed color profile')
    delta = [new-old for old, new in zip(anchor, target)]
    changed = 0
    for path in groups[part].iter():
        if path.get('data-paint-role') != 'material':
            continue
        original_fill = path.get('data-original-fill')
        rgb = [int(original_fill[i:i+2], 16) for i in (1, 3, 5)]
        path.set('fill', '#'+''.join(f'{max(0,min(255,round(v+d))):02x}' for v, d in zip(rgb, delta)))
        changed += 1
    if not changed:
        raise ValueError('No editable material paths in this layer')
    edits = metadata.setdefault('vector_edits', {})
    edits.setdefault('original_'+field, metadata['variant'][field])
    metadata['variant'][field] = value
    edits.setdefault('recolored_parts', {})[part] = value
    edits['color_method'] = 'Illustrative RGB offset on named material paths only; no new raster generation'


def edit(source, target, color=None, hidden=(), hymenophore_color=None):
    tree = ET.parse(source)
    root = tree.getroot()
    metadata_node = root.find(f'{{{SVG}}}metadata')
    metadata = json.loads(metadata_node.text)
    groups = {node.get('data-part'): node for node in root if node.get('data-part')}
    unknown = set(hidden) - groups.keys()
    if unknown:
        raise ValueError(f'Unknown parts: {sorted(unknown)}')
    if color is not None:
        recolor(root, metadata, groups, 'cap', color)
    if hymenophore_color is not None:
        recolor(root, metadata, groups, 'hymenophore', hymenophore_color)
    for name, group in groups.items():
        group.set('display', 'none' if name in hidden else 'inline')
    metadata.setdefault('vector_edits', {})['hidden_layers'] = list(hidden)
    metadata['review_status'] = 'edited-prototype-needs-visual-approval'
    if color is not None or hymenophore_color is not None:
        root.find(f'{{{SVG}}}desc').text = 'Illustrazione schematica con modifiche cromatiche vettoriali: '+json.dumps(metadata['vector_edits']['recolored_parts'],ensure_ascii=False)+'. Non è una fotografia né un’identificazione.'
    metadata_node.text = json.dumps(metadata, ensure_ascii=False)
    ET.indent(tree)
    tree.write(target, encoding='utf-8', xml_declaration=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('target', type=Path)
    parser.add_argument('--cap-color')
    parser.add_argument('--hymenophore-color')
    parser.add_argument('--hide', action='append', default=[])
    args = parser.parse_args()
    edit(args.source, args.target, args.cap_color, args.hide, args.hymenophore_color)
