#!/usr/bin/env python3
"""Checks fidelity and edit containment; species review is a separate input."""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from edit_semantic_svg import edit,SVG
from verify_semantic_svg import render
from scene_fingerprint import fingerprint


def verify(folder):
    folder=Path(folder);spec=json.loads((folder/'regions.json').read_text())
    file=folder/(spec['taxon_key']+'-semantic.svg');root=ET.parse(file).getroot()
    metadata=json.loads(root.find(f'{{{SVG}}}metadata').text)
    assert metadata['raster_semantic_review']['status']=='passed-independent-species-review'
    assert metadata['review_status']=='passed-independent-svg-fidelity-review'
    audit=json.loads((folder/'svg-review.json').read_text())
    assert audit['geometry_sha256']==fingerprint(root)
    assert audit['source_crop_sha256']==metadata['source']['crop_sha256']
    assert hashlib.sha256((folder/'source.png').read_bytes()).hexdigest()==metadata['source']['crop_sha256']
    repo=Path(__file__).resolve().parents[3]
    source=metadata['source'];sheet=repo/source['sheet']
    assert hashlib.sha256(sheet.read_bytes()).hexdigest()==source['sheet_sha256']
    crop=Image.open(sheet).convert('RGBA').crop(source['crop_box']);padding=source['padding']
    expected=Image.new('RGBA',(crop.width+2*padding,crop.height+2*padding),(0,0,0,0));expected.paste(crop,(padding,padding))
    assert np.array_equal(np.asarray(expected),np.asarray(Image.open(folder/'source.png').convert('RGBA')))
    review=metadata['raster_semantic_review'];assert hashlib.sha256((repo/review['review_file']).read_bytes()).hexdigest()==review['review_sha256']
    assert set(metadata['variant'])=={'cap_color','cap_shape','hymenophore_color'}
    for field,value in metadata['variant'].items():assert value in metadata['documented_traits'][field]
    for tag in ['image','clipPath','mask','use']:assert not root.findall(f'.//{{{SVG}}}{tag}')
    groups={g.get('data-part'):g for g in root if g.get('data-part')}
    assert set(groups)=={layer['id']for layer in spec['layers']}
    assert not({'ring','volva'}&groups.keys())
    ellipses=root.findall(f'.//{{{SVG}}}ellipse');assert len(ellipses)==len(metadata['paint_plan']['pore_ellipses']['centers'])
    assert metadata['paint_plan']['pore_ellipses']['review_status']=='manually-matched-one-to-one-to-raster-spots'
    report={'raster_independent_species_review':'passed-before-vector','parts':list(groups),'paths':len(root.findall(f'.//{{{SVG}}}path')),'editable_pore_ellipse_primitives':len(ellipses),'embedded_rasters':0,'clips':0,'renders':[]}
    with tempfile.TemporaryDirectory(prefix='fronda-scene-')as tmp:
        tmp=Path(tmp)
        for kwargs in [{'color':'verde'},{'hymenophore_color':'nero'},{'hidden':['volva']}]:
            try:edit(file,tmp/'invalid.svg',**kwargs)
            except ValueError:pass
            else:raise AssertionError('Unsupported edit accepted')
        for width in [64,128,804]:
            base=render(file,tmp/'base.png',width)
            source=np.array(Image.open(folder/'source.png').convert('RGBA').resize((base.shape[1],base.shape[0]),Image.Resampling.LANCZOS))
            a=base[:,:,3]>=128;b=source[:,:,3]>=128;iou=float((a&b).sum()/(a|b).sum())
            assert iou>(.95 if width==64 else .97),f'Silhouette changed at{width}px: {iou}'
            ba=base[:,:,3:4]/255;sa=source[:,:,3:4]/255
            mae=float(abs(base[:,:,:3]*ba+255*(1-ba)-(source[:,:,:3]*sa+255*(1-sa))).mean())
            assert mae<15,'Paint simplification too different'
            for part,value in [('cap','bruno'),('hymenophore','bianco')]:
                changed_file=tmp/(part+'-changed.svg');edit(file,changed_file,color=value if part=='cap'else None,hymenophore_color=value if part=='hymenophore'else None)
                isolated_file=tmp/(part+'-only.svg');edit(file,isolated_file,hidden=sorted(groups.keys()-{part}))
                changed=render(changed_file,tmp/'changed.png',width);isolated=render(isolated_file,tmp/'only.png',width)
                outside=isolated[:,:,3]==0
                assert np.array_equal(base[outside],changed[outside]),'Color escaped part'
                assert np.any(changed!=base)
                if part=='hymenophore':
                    changed_xml=ET.parse(changed_file).getroot()
                    assert all(p.get('fill')!=p.get('data-original-fill')for p in changed_xml.findall(f'.//{{{SVG}}}ellipse'))
            for part in groups:
                isolated_file=tmp/(part+'-isolated.svg');edit(file,isolated_file,hidden=sorted(groups.keys()-{part}))
                isolated=render(isolated_file,tmp/'isolate.png',width)
                assert (isolated[:,:,3]>128).sum()>3,f'Empty{part}'
            if'reticulum'in groups:
                hidden_file=tmp/'no-network.svg';edit(file,hidden_file,hidden=['reticulum']);hidden=render(hidden_file,tmp/'no-network.png',width)
                gap_pixels=int(np.sum((base[:,:,3]>=128)&(hidden[:,:,3]<128)))
                assert gap_pixels==0,'Hiding network exposes gaps'
            report['renders'].append({'width':width,'raster_silhouette_iou':round(iou,6),'raster_composited_rgb_mae_255':round(mae,6),'color_edits_confined_to_part':True})
    report['meaning']='Technical checks establish source fidelity and safe programmatic edit boundaries. Anatomical/species correctness relies on the recorded prior independent raster review and subsequent visual SVG review, not on these metrics.'
    return report


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);p.add_argument('--output',type=Path);args=p.parse_args();result=json.dumps(verify(args.folder),ensure_ascii=False,indent=2)+'\n'
    if args.output:args.output.write_text(result)
    print(result)
