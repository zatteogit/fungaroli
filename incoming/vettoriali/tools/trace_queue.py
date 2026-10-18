#!/usr/bin/env python3
"""Trace approved master crops; never label these as anatomically complete SVGs."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
import vtracer

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
from sheet_cells import drawings
from build_semantic_svg import element,SVG


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def trace(input_raster,output_svg):
    rgba=np.asarray(input_raster.convert('RGBA'))
    mask=rgba[:,:,3]>=220
    if not mask.any():raise ValueError('Empty source')
    palette=Image.fromarray(rgba[:,:,:3][mask].reshape(1,-1,3)).quantize(colors=16,method=Image.Quantize.MEDIANCUT)
    normalized=input_raster.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
    normalized.putalpha(Image.fromarray((mask*255).astype('uint8')))
    with tempfile.TemporaryDirectory(prefix='fronda-trace-')as tmp:
        input_file=Path(tmp)/'input.png';normalized.save(input_file)
        vtracer.convert_image_to_svg_py(str(input_file),str(output_svg),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=8,color_precision=6,layer_difference=16,corner_threshold=80,length_threshold=3,max_iterations=10,splice_threshold=45,path_precision=3)


def run(queue_path,families,limit):
    queue=json.loads(queue_path.read_text())
    taxa=json.loads((ROOT/'data/species-traits.json').read_text())['taxa']
    cache={}
    converted=[]
    output=ROOT/'incoming/vettoriali/ricalchi'
    output.mkdir(exist_ok=True)
    for item in queue['items']:
        if len(converted)>=limit:break
        if item['stage']!='ready-for-geometric-trace'or item['family']not in families:continue
        review=item.get('raster_species_review',{})
        if review.get('status')!='passed-independent-species-review':
            raise ValueError('Independent species/value raster review required before trace')
        review_path=ROOT/review['review_file']
        if digest(review_path)!=review['review_sha256']:
            raise ValueError('Raster review changed')
        approval=json.loads(review_path.read_text())
        if approval['independent_review']['status']!='passed-independent-species-review'or approval['selected_sha256']!=item['sha256']:
            raise ValueError('Raster approval does not cover source')
        source_root=ROOT if item['source_set']=='reviewed-local-master'else Path(queue['roots'][item['source_set']]['local_root'])
        source=source_root/item['file']
        if digest(source)!=item['sha256']:raise ValueError('Source changed: '+str(source))
        cache_key=str(source)
        if cache_key not in cache:
            image=Image.open(source).convert('RGBA')
            cache[cache_key]=(image,drawings(image,source.name))
        image,boxes=cache[cache_key]
        box=boxes[item['cell']]
        crop=image.crop(box)
        raster=Image.new('RGBA',(crop.width+16,crop.height+16),(0,0,0,0))
        raster.paste(crop,(8,8))
        crop_bytes=io.BytesIO();raster.save(crop_bytes,format='PNG')
        filename=item['id']+'.svg';target=output/filename
        trace(raster,target)
        tree=ET.parse(target);root=tree.getroot()
        assert not root.findall(f'.//{{{SVG}}}image')
        paths=root.findall(f'{{{SVG}}}path')
        if not paths:raise ValueError('Empty trace: '+item['id'])
        for index,path in enumerate(paths):path.set('id',f'paint-{index:03}')
        metadata={
            'schema_version':1,'conversion_stage':'geometric-trace-needs-anatomy',
            'item_id':item['id'],'family':item['family'],'taxon_key':item.get('taxon_key'),
            'documented_traits':taxa[item['taxon_key']]['traits']if item.get('taxon_key')else None,
            'source':{'set':item['source_set'],'file':item['file'],'sha256':item['sha256'],'cell':item['cell'],'crop_box':list(box),'padding':8,'crop_png_sha256':hashlib.sha256(crop_bytes.getvalue()).hexdigest()},
            'source_variant':item.get('variant'),'source_base':item.get('base'),
            'vectorizer':{'package':'vtracer','version':'0.6.15','palette_colors':16,'alpha_threshold':220},
            'license':item['license'],'license_url':item['license_url'],
            'anatomical_annotations':None,'editable_operations':['inspect-geometric-paths'],
            'not_supported':['anatomical recoloring','cap-shape morphing','biological part recognition'],
            'review_status':'trace-needs-visual-and-anatomical-review','path_count':len(paths),
        }
        root.set('viewBox',f'0 0 {raster.width} {raster.height}')
        root.set('role','img');root.set('aria-labelledby','trace-title trace-desc')
        root.insert(0,element('title',{'id':'trace-title'},'Ricalco geometrico da annotare — '+item.get('taxon_key',item['family'])))
        root.insert(1,element('desc',{'id':'trace-desc'},'Tracciati ottenuti dal raster revisionato. Le parti anatomiche non sono ancora annotate; questo file non è un’illustrazione semantica pronta per l’app.'))
        root.insert(2,element('metadata',text=json.dumps(metadata,ensure_ascii=False)))
        ET.indent(root);tree.write(target,encoding='utf-8',xml_declaration=True)
        metadata['svg_sha256']=digest(target)
        sidecar=target.with_suffix('.json');sidecar.write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
        item.update(stage='geometric-trace-needs-anatomy',trace_file=str(target.relative_to(ROOT)),trace_metadata=str(sidecar.relative_to(ROOT)),trace_sha256=metadata['svg_sha256'])
        converted.append({'id':item['id'],'family':item['family'],'paths':len(paths)})
        queue['stages']={stage:sum(i['stage']==stage for i in queue['items'])for stage in sorted({i['stage']for i in queue['items']})}
        queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'converted':len(converted),'items':converted,'stages':queue['stages']},ensure_ascii=False,indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--queue',type=Path,default=ROOT/'incoming/vettoriali/coda.json')
    parser.add_argument('--family',action='append',required=True)
    parser.add_argument('--limit',type=int,default=10)
    args=parser.parse_args();run(args.queue,set(args.family),args.limit)
