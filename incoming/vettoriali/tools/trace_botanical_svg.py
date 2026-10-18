#!/usr/bin/env python3
"""Trace only a raster with recorded species review; no anatomical inference."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
import vtracer

def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def trace(folder):
    folder=Path(folder);rec=json.loads((folder/'source-record.json').read_text())
    assert rec['raster_review']['status']=='passed-independent-species-raster-review'
    assert digest(folder/'master.png')==rec['source']['master_sha256']==rec['raster_review']['master_sha256']
    assert digest(folder/'source.png')==rec['source']['crop_sha256']
    assert digest(folder/'raster-review.md')==rec['raster_review']['record_sha256']
    im=Image.open(folder/'source.png').convert('RGBA');a=np.array(im);settings=rec.get('trace_settings',{});colors=settings.get('palette_colors');layer_difference=12;filter_speckle=4
    if isinstance(colors,int):
        mask=a[:,:,3]>=220;pal=Image.fromarray(a[:,:,:3][mask].reshape(1,-1,3)).quantize(colors=colors,method=Image.Quantize.MEDIANCUT);normalized=im.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA');a=np.array(normalized);a[:,:,3]=(mask*255).astype('uint8');layer_difference=16;filter_speckle=3
    else:a[:,:,3]=(a[:,:,3]>=220)*255
    Image.fromarray(a).save(folder/'trace-input.png')
    vtracer.convert_image_to_svg_py(str(folder/'trace-input.png'),str(folder/'trace-clean.svg'),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=filter_speckle,color_precision=6,layer_difference=layer_difference,corner_threshold=80,length_threshold=3,max_iterations=10,splice_threshold=45,path_precision=3)
    rec['trace_sha256']=digest(folder/'trace-clean.svg');rec['trace_settings']={'palette_colors':colors if isinstance(colors,int)else 'source RGB; no prequantization','alpha_threshold':220,'vtracer':'0.6.15','filter_speckle':filter_speckle,'color_precision':6,'layer_difference':layer_difference};(folder/'source-record.json').write_text(json.dumps(rec,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();trace(a.folder)
