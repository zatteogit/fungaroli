#!/usr/bin/env python3
"""Extract source-pixel detail masks within manually annotated anatomy.

Thresholds are per-raster annotations, not universal biological detectors.
Every generated isolated detail still needs visual review against the raster.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
import vtracer

from path_geometry import parse,subtract,svg_path
from build_semantic_svg import element,SVG
from verify_semantic_svg import render
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
from sheet_cells import components


def extract(folder):
    folder=Path(folder);spec=json.loads((folder/'regions.json').read_text())
    if spec['raster_semantic_review']['status']!='passed-independent-species-review':
        raise ValueError('Independent raster review must precede vector detail extraction')
    review=spec['raster_semantic_review'];review_file=ROOT/review['review_file']
    if hashlib.sha256(review_file.read_bytes()).hexdigest()!=review['review_sha256']:
        raise ValueError('Raster review changed')
    approval=json.loads(review_file.read_text())
    if approval['selected_sha256']!=spec['source']['sheet_sha256']or approval['independent_review']['status']!='passed-independent-species-review':
        raise ValueError('Independent approval does not cover source')
    if hashlib.sha256((folder/'source.png').read_bytes()).hexdigest()!=spec['source']['crop_sha256']:
        raise ValueError('Source crop changed')
    im=Image.open(folder/'source.png').convert('RGBA');pixels=np.asarray(im).astype(int);w,h=im.size
    defs=spec['region_definitions'];resolved={};trace=ET.parse(folder/'trace-clean.svg').getroot()
    def region(name):
        if name in resolved:return resolved[name]
        definition=defs[name]
        if 'd'in definition:result=parse(definition['d'],evenodd=definition.get('evenodd',False))
        else:
            head,*tail=definition['difference'];result=region(head)
            for other in tail:result=subtract(result,region(other))
        resolved[name]=result;return result
    records={}
    with tempfile.TemporaryDirectory(prefix='fronda-detail-')as tmp:
        tmp=Path(tmp)
        for name,config in spec['detail_masks'].items():
            if 'source_region_path'in config:
                p=trace[config['source_region_path']];shape=parse(p.get('d'),p.get('transform'))
            else:shape=region(config['region'])
            root=element('svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'})
            root.append(element('path',{'d':svg_path(shape),'fill':'#ffffff'}));ET.ElementTree(root).write(tmp/'region.svg')
            inside=render(tmp/'region.svg',tmp/'region.png',w)[:,:,3]>=128
            mask=inside&(pixels[:,:,3]>=220)
            channels={'r':pixels[:,:,0],'g':pixels[:,:,1],'b':pixels[:,:,2],'rg':pixels[:,:,0]-pixels[:,:,1],'rb':pixels[:,:,0]-pixels[:,:,2]}
            for condition,value in config['thresholds'].items():
                key,op=condition.rsplit('_',1)
                mask&=channels[key]>=value if op=='min'else channels[key]<=value
            labels,count=components(mask);sizes=np.bincount(labels.ravel());valid=[i for i in range(1,count+1)if sizes[i]>=config['min_component_area']]
            if config['selection']=='largest':valid=[max(valid,key=lambda i:sizes[i])]
            chosen=np.isin(labels,valid);rgb=np.median(pixels[:,:,:3][chosen],axis=0).astype(int);color='#'+''.join(f'{v:02x}'for v in rgb)
            raster=np.zeros((h,w,4),dtype='uint8');raster[chosen,:3]=rgb;raster[chosen,3]=255
            mask_file=folder/('detail-'+name+'-mask.png');Image.fromarray(raster).save(mask_file)
            out=folder/('detail-'+name+'.svg')
            vtracer.convert_image_to_svg_py(str(mask_file),str(out),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=1,color_precision=8,layer_difference=0,corner_threshold=80,length_threshold=2,max_iterations=10,splice_threshold=45,path_precision=3)
            record={'source_sha256':spec['source']['crop_sha256'],'config':config,'component_count':len(valid),'selected_area_pixels':int(chosen.sum()),'color_from_source_median':color,'components':[{'label':i,'area':int(sizes[i]),'centroid_xy':[round(float(np.where(labels==i)[1].mean()),2),round(float(np.where(labels==i)[0].mean()),2)]}for i in valid],'mask_sha256':hashlib.sha256(mask_file.read_bytes()).hexdigest(),'svg_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'review_status':'awaiting-visual-detail-review'}
            records[name]=record
            print(name,len(valid),'connected components',color)
    (folder/'detail-masks.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);args=p.parse_args();extract(args.folder)
