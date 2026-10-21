#!/usr/bin/env python3
"""Focused, reproducible prototype checks; renders in an isolated temp directory."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from edit_semantic_svg import edit, SVG


def render(svg, output, width):
    env = {**os.environ, 'XDG_CONFIG_HOME': '/tmp/fronda-svg-config', 'XDG_CACHE_HOME': '/tmp/fronda-svg-cache'}
    subprocess.run(['inkscape', str(svg), '--export-type=png', f'--export-filename={output}', f'--export-width={width}'], check=True, capture_output=True, env=env)
    return np.array(Image.open(output).convert('RGBA'))


def verify(folder):
    file = folder/'amanita-verna-semantic.svg'
    tree = ET.parse(file)
    root = tree.getroot()
    assert not root.findall(f'.//{{{SVG}}}image'), 'Embedded raster is forbidden'
    meta = json.loads(root.find(f'{{{SVG}}}metadata').text)
    expected = {'cap', 'hymenophore', 'stem', 'ring', 'volva'}
    groups = {node.get('data-part'): node for node in root if node.get('data-part')}
    assert set(groups) == expected
    assert all(group.findall(f'{{{SVG}}}path') for group in groups.values())
    assert len({node.get('id') for node in root.iter() if node.get('id')}) == len([node for node in root.iter() if node.get('id')])
    import hashlib
    assert hashlib.sha256((folder/'source.png').read_bytes()).hexdigest() == meta['source']['crop_sha256']
    for field, value in meta['variant'].items():
        assert value in meta['documented_traits'][field]
    report = {'vector_paths': sum(len(g.findall(f'{{{SVG}}}path')) for g in groups.values()), 'layers': sorted(groups), 'embedded_rasters': 0, 'renders': []}
    with tempfile.TemporaryDirectory(prefix='fronda-svg-check-') as tmp:
        tmp = Path(tmp)
        changed_file = tmp/'white.svg'
        edit(file, changed_file, color='bianco')
        edited = ET.parse(changed_file).getroot()
        for name in expected-{'cap'}:
            original_paths = [ET.tostring(p) for p in groups[name].findall(f'{{{SVG}}}path')]
            changed_paths = [ET.tostring(p) for p in edited.find(f'{{{SVG}}}g[@data-part="{name}"]').findall(f'{{{SVG}}}path')]
            assert original_paths == changed_paths, f'Recolor changed {name}'
        for invalid in ['verde', 'not-a-color']:
            try:
                edit(file, tmp/'invalid.svg', color=invalid)
                raise AssertionError('Undocumented color accepted')
            except ValueError:
                pass
        try:
            edit(file, tmp/'invalid.svg', hidden=['not-a-part'])
            raise AssertionError('Unknown layer accepted')
        except ValueError:
            pass
        for width in [128, 560]:
            image = render(file, tmp/'semantic.png', width)
            traced = render(folder/'trace-clean.svg', tmp/'trace.png', width)
            raster = np.array(Image.open(folder/'source.png').convert('RGBA').resize((image.shape[1],image.shape[0]),Image.Resampling.LANCZOS))
            shape = image[:,:,3] >= 128
            source_shape = raster[:,:,3] >= 128
            iou = (shape & source_shape).sum()/(shape | source_shape).sum()
            # Clipped groups introduce antialias differences at their shared boundaries.
            delta = np.abs(image.astype(int)-traced.astype(int))
            significant = np.any(delta > 12, axis=2).mean()
            assert iou > .98, f'Silhouette changed: {iou}'
            assert significant < .025, f'Partition seams too large: {significant}'
            changed = render(changed_file, tmp/'changed.png', width)
            assert np.any(image != changed), 'Color edit had no effect'
            cap_file = tmp/'cap-only.svg'
            edit(file, cap_file, hidden=sorted(expected-{'cap'}))
            cap = render(cap_file, tmp/'cap.png', width)
            outside = cap[:,:,3] == 0
            assert not np.any(image[outside] != changed[outside]), 'Recolor escaped cap layer'
            for name in sorted(expected):
                part_file = tmp/(name+'.svg')
                edit(file, part_file, hidden=sorted(expected-{name}))
                part = render(part_file, tmp/(name+'.png'), width)
                assert (part[:,:,3]>128).sum()>10, f'Layer {name} is empty'
            report['renders'].append({'width':width,'source_silhouette_iou':round(float(iou),5),'semantic_vs_trace_pixels_over_12_fraction':round(float(significant),5)})
    report['checks'] = ['source digest', 'documented traits', 'real paths and unique IDs', 'five non-empty anatomical groups', 'unsupported edits rejected', 'non-cap paths unchanged', 'cap recolor stays within cap']
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder',type=Path)
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    result = json.dumps(verify(args.folder),ensure_ascii=False,indent=2)+'\n'
    if args.output:
        args.output.write_text(result)
    print(result)
