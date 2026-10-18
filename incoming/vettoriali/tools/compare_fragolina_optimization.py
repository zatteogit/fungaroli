#!/usr/bin/env python3
"""Focused asset comparison, not an application test suite."""
import argparse,hashlib,json,gzip,re,subprocess,os
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image,ImageDraw
def render(svg, output, max_side):
    env={**os.environ,'XDG_CONFIG_HOME':'/tmp/fronda-svg-config','XDG_CACHE_HOME':'/tmp/fronda-svg-cache'}
    subprocess.run(['inkscape',str(svg),'--export-type=png',f'--export-filename={output}',f'--export-height={max_side}'],check=True,capture_output=True,env=env)
    return np.array(Image.open(output).convert('RGBA'))
from build_semantic_svg import SVG

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def composite(a):
    alpha=a[:,:,3:4]/255
    return a[:,:,:3]*alpha+255*(1-alpha)
def compare(base):
    base=Path(base);source=base/'optimized/source.png';old=base/'original-v1.svg';new=base/'optimized/semantic.svg';control=base/'control-rounding-only.svg';out=base/'comparison';out.mkdir(exist_ok=True)
    a=ET.parse(old).getroot();b=ET.parse(new).getroot();paths=lambda root:root.findall(f'.//{{{SVG}}}path');before=paths(a);after=paths(b);assert len(before)==len(after)==885
    assert[dict((k,v)for k,v in x.attrib.items()if k!='d')for x in before]==[dict((k,v)for k,v in x.attrib.items()if k!='d')for x in after]
    for tag in ['image','clipPath','mask','use']:assert not b.findall(f'.//{{{SVG}}}{tag}')
    number=r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?';maximum=0;count=0
    for x,y in zip(before,after):
        xx=list(map(float,re.findall(number,x.get('d'))));yy=list(map(float,re.findall(number,y.get('d'))));assert len(xx)==len(yy);maximum=max(maximum,max(abs(v-w)for v,w in zip(xx,yy)));count+=len(xx)
    assert maximum<=.050001
    record=json.loads((base/'optimized/source-record.json').read_text());assert sha(base/'optimized/master.png')==record['source']['master_sha256'];assert sha(source)==record['source']['crop_sha256']
    report={'status':'proposed-awaiting-coordinator-review','source_master_sha256':sha(base/'optimized/master.png'),'source_crop_sha256':sha(source),'trace_sha256':sha(base/'optimized/trace-clean.svg'),'original_svg_sha256':sha(old),'proposed_svg_sha256':sha(new),'paths_before':len(before),'paths_after':len(after),'all_paint_ids_colors_roles_and_source_references_identical':True,'coordinate_components':count,'maximum_component_rounding_error_source_px':maximum,'bytes_before':old.stat().st_size,'bytes_after':new.stat().st_size,'reduction_percent':100*(1-new.stat().st_size/old.stat().st_size),'gzip9_bytes_before':len(gzip.compress(old.read_bytes(),mtime=0)),'gzip9_bytes_after':len(gzip.compress(new.read_bytes(),mtime=0)),'gzip_note':'Controlled compression comparison, not a claim about deployed server settings.','size_convention':'Portrait asset: max side is export height, not width; 64/128/656px compare actual icon sizes.','renders':[]}
    frames=[]
    for width in [64,128,656]:
        previous=render(old,out/f'before-{width}.png',width);current=render(new,out/f'after-{width}.png',width);rounded=render(control,out/f'control-{width}.png',width);raster=np.array(Image.open(source).convert('RGBA').resize((current.shape[1],current.shape[0]),Image.Resampling.LANCZOS));alpha=raster[:,:,3]>=128
        def metric(x):
            opaque=x[:,:,3]>=128
            return {'silhouette_iou':float((opaque&alpha).sum()/(opaque|alpha).sum()),'raster_rgb_mae_255':float(abs(composite(x)-composite(raster)).mean())}
        diff=abs(composite(previous)-composite(current));control_diff=abs(composite(previous)-composite(rounded));row={'max_side':width,'render_size':[current.shape[1],current.shape[0]],'before':metric(previous),'after':metric(current),'before_after_rgb_mae_255':float(diff.mean()),'before_after_pixels_over12_rgb_fraction':float((diff.max(axis=2)>12).mean()),'rounding_only_0_01px_rgb_mae_255':float(control_diff.mean())};report['renders'].append(row)
        assert row['before_after_rgb_mae_255']<.15
        assert abs(row['after']['silhouette_iou']-row['before']['silhouette_iou'])<.001
        images=[]
        for label,img in [('Raster',raster),('Originale',previous),('Proposto',current)]:
            p=Image.fromarray(img);tile=Image.new('RGBA',(p.width+24,p.height+44),'#f7f4e9');tile.alpha_composite(p,(12,32));ImageDraw.Draw(tile).text((8,8),label,fill='#193c2f');images.append(tile)
        frame=Image.new('RGBA',(sum(i.width for i in images),images[0].height),'#f7f4e9');x=0
        for im in images:frame.alpha_composite(im,(x,0));x+=im.width
        frame.convert('RGB').save(out/f'raster-before-after-{width}.png')
    (base/'comparison-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    verification=json.loads((base/'optimized/verification.json').read_text());verification['svg_sha256']=sha(new);verification['note']='Metadata changed to describe conservative proposal; visible geometry unchanged since focused part tint/isolation checks.';(base/'optimized/verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();compare(a.folder)
