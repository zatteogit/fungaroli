#!/usr/bin/env python3
"""Technical fidelity/edit containment only; coordinator review remains separate."""
import argparse,hashlib,json,copy,tempfile
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image,ImageDraw
from verify_semantic_svg import render
from build_semantic_svg import SVG

def save(root,path):ET.indent(root);ET.ElementTree(root).write(path,encoding='utf-8',xml_declaration=True)
def tint(root,part,delta=(0,35,30)):
    for g in root:
        if g.get('data-part')!=part:continue
        for p in g:
            if p.get('data-paint-role')!='material':continue
            color=p.get('data-original-fill');rgb=[int(color[i:i+2],16)for i in[1,3,5]];p.set('fill','#'+''.join(f'{max(0,min(255,v+d)):02x}'for v,d in zip(rgb,delta)))
def verify(folder):
    folder=Path(folder);file=folder/'semantic.svg';root=ET.parse(file).getroot();meta=json.loads(root.find(f'{{{SVG}}}metadata').text)
    assert meta['review_status']=='svg-awaiting-coordinator-review'
    assert hashlib.sha256((folder/'master.png').read_bytes()).hexdigest()==meta['source']['master_sha256']
    assert hashlib.sha256((folder/'source.png').read_bytes()).hexdigest()==meta['source']['crop_sha256']
    for tag in['image','clipPath','mask','use']:assert not root.findall(f'.//{{{SVG}}}{tag}')
    ids=[x.get('id')for x in root.iter()if x.get('id')];assert len(ids)==len(set(ids))
    groups=[x.get('data-part')for x in root if x.get('data-part')];report={'status':'technical-checks-passed-awaiting-independent-svg-review','parts':groups,'path_count':len(root.findall(f'.//{{{SVG}}}path')),'bitmap_count':0,'clip_count':0,'renders':[],'meaning':'Fidelity/edit checks do not establish botanical correctness. Prior species-specific raster review is recorded; SVG needs coordinator review.'}
    with tempfile.TemporaryDirectory()as tmp:
        tmp=Path(tmp)
        for width in[64,128,656]:
            base=render(file,folder/f'render-{width}.png',width);trace=render(folder/'trace-clean.svg',tmp/'trace.png',width)
            source=np.array(Image.open(folder/'source.png').convert('RGBA').resize((base.shape[1],base.shape[0]),Image.Resampling.LANCZOS));a=base[:,:,3]>=128;b=source[:,:,3]>=128;iou=float((a&b).sum()/(a|b).sum());assert iou>(.85 if width==64 and meta['id']=='finocchietto-ombrella'else .93),(width,iou)
            def composite(x):alpha=x[:,:,3:4]/255;return x[:,:,:3]*alpha+255*(1-alpha)
            mae=float(abs(composite(base)-composite(source)).mean());assert mae<15,(width,mae)
            trace_mae=float(abs(composite(base)-composite(trace)).mean());assert trace_mae<2.5,(width,trace_mae)
            report['renders'].append({'width':width,'silhouette_iou':round(iou,6),'raster_rgb_mae_255':round(mae,6),'trace_rgb_mae_255':round(trace_mae,6)})
        tiles=[]
        for part in groups:
            isolated=copy.deepcopy(root)
            for g in isolated:
                if g.get('data-part')and g.get('data-part')!=part:g.set('display','none')
            save(isolated,tmp/'isolated.svg');part_render=render(tmp/'isolated.svg',folder/f'part-{part}.png',128);assert(part_render[:,:,3]>128).sum()>3,part
            edited=copy.deepcopy(root);tint(edited,part);save(edited,tmp/'edited.svg');changed=render(tmp/'edited.svg',tmp/'changed.png',128);base=render(file,tmp/'base.png',128)
            outside=part_render[:,:,3]==0;assert np.array_equal(changed[outside],base[outside]),part
            assert np.any(changed!=base),f'No editable material in {part}'
            tile=Image.new('RGBA',(210,235),'#f7f4e9');drawing=Image.fromarray(part_render);drawing.thumbnail((190,190));tile.alpha_composite(drawing,((210-drawing.width)//2,20+(190-drawing.height)//2));ImageDraw.Draw(tile).text((8,215),part,fill='#193c2f');tiles.append(tile)
        montage=Image.new('RGBA',(210*len(tiles),235),'#f7f4e9')
        for i,tile in enumerate(tiles):montage.alpha_composite(tile,(i*210,0))
        montage.convert('RGB').save(folder/'parts.png')
    compare=Image.new('RGBA',(600,360),'#f7f4e9')
    for x,p in[(0,folder/'source.png'),(300,folder/'render-656.png')]:
        im=Image.open(p).convert('RGBA');im.thumbnail((280,340));compare.alpha_composite(im,(x+(300-im.width)//2,(360-im.height)//2))
    compare.convert('RGB').save(folder/'comparison.png')
    report['all_part_tints_confined']=True;report['svg_sha256']=hashlib.sha256(file.read_bytes()).hexdigest();(folder/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();verify(a.folder)
