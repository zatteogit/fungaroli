#!/usr/bin/env python3
"""Reviewed raster first, then an explicitly annotated editable SVG scene."""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import pathops
from path_geometry import parse,intersect,subtract,svg_path
from build_semantic_svg import element,SVG,INK
from scene_fingerprint import fingerprint

ROOT=Path(__file__).resolve().parents[3]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def build(folder):
    folder=Path(folder).resolve()
    spec=json.loads((folder/'regions.json').read_text())
    review=spec['raster_semantic_review']
    if review['status']!='passed-independent-species-review':
        raise ValueError('Correct raster and independent species review must precede SVG')
    if digest(ROOT/review['review_file'])!=review['review_sha256']:
        raise ValueError('Raster review changed: revalidate before generating SVG')
    approval_raster=json.loads((ROOT/review['review_file']).read_text())
    if approval_raster['independent_review']['status']!='passed-independent-species-review'or approval_raster['selected_sha256']!=spec['source']['sheet_sha256']:
        raise ValueError('Independent review does not cover this raster')
    if digest(ROOT/spec['source']['sheet'])!=spec['source']['sheet_sha256']:
        raise ValueError('Original raster master changed')
    if digest(folder/'source.png')!=spec['source']['crop_sha256']:
        raise ValueError('Source crop changed')
    if digest(folder/'trace-clean.svg')!=spec['trace_sha256']:
        raise ValueError('Trace changed: annotation must be reviewed again')
    taxon=json.loads((ROOT/'data/species-traits.json').read_text())['taxa'][spec['taxon_key']]
    for key,value in spec['variant'].items():
        if value not in(taxon['traits'].get(key)or[]):
            raise ValueError(f'Undocumented {key}={value}')
    for key,value in spec['required_traits'].items():
        if taxon['traits'].get(key)is not value:raise ValueError('Anatomy/data mismatch')
    trace=ET.parse(folder/'trace-clean.svg').getroot()
    plan=json.loads((folder/'scene-plan.json').read_text())
    if plan['trace_sha256']!=spec['trace_sha256']:
        raise ValueError('Paint plan belongs to a different trace')
    defs=spec['region_definitions'];resolved={}
    def region(name):
        if name in resolved:return resolved[name]
        d=defs[name]
        if'd'in d:result=parse(d['d'],evenodd=d.get('evenodd',False))
        else:
            head,*tail=d['difference'];result=region(head)
            for other in tail:result=subtract(result,region(other))
        resolved[name]=result;return result
    width,height=spec['canvas']
    root=element('svg',{'version':'1.1','width':str(width),'height':str(height),'viewBox':f'0 0 {width} {height}','role':'img','aria-labelledby':'art-title art-desc','data-taxon':spec['taxon_key'],'data-schema-version':'3'})
    root.append(element('title',{'id':'art-title'},taxon['name']+' — parti vettoriali da raster revisionato'))
    root.append(element('desc',{'id':'art-desc'},'Schema da raster corretto e revisionato prima della conversione. Cappello crema spianato e pori rosa; il fungo intero mostra gambo clavato e reticolo bruno. Non è una fotografia o un’identificazione.'))
    whole='stem'in spec['part_regions']
    metadata={'schema_version':3,'taxon_key':spec['taxon_key'],'variant':spec['variant'],'documented_traits':taxon['traits'],'documented_traits_sha256':digest(ROOT/'data/species-traits.json'),'source':spec['source'],'raster_first':True,'raster_semantic_review':review,'trace_sha256':spec['trace_sha256'],'license':'CC BY-SA4.0','license_url':'https://creativecommons.org/licenses/by-sa/4.0/','author':'Fronda/Fungaroli','layers':spec['layers'],'recolor_profiles':spec['recolor_profiles'],'geometry_model':'Independent traced path intersections and reviewed ellipse fits for depicted pore marks; no clips, bitmap embeds or hidden whole-mushroom copies.','anatomical_annotations':spec['review'],'paint_plan':plan,'occluded_tissue_reconstruction':plan.get('occluded_tissue_reconstruction'),'layer_hiding_caveat':'The stem underpaint is an explicitly declared illustration reconstruction from visible stem material; hiding the network does not create a scientific no-reticulum variant.'if whole else'Layer visibility is for inspection only; no new biological variants are created.','editable_operations':['recolor-documented-cap-material','recolor-documented-pore-surface','inspect-layer','inspect-individual-depicted-pore-ellipse'],'unsupported_operations':['automatic cap-shape morphing','automatic anatomical recognition','creating undocumented variants'],'review_status':'svg-awaiting-independent-fidelity-review'}
    root.append(element('metadata',{'id':'semantic-metadata'},json.dumps(metadata,ensure_ascii=False)))
    groups={}
    for layer in spec['layers']:
        key=layer['id'];group=element('g',{'id':key,'data-part':key,'data-trait-fields':' '.join(layer['trait_fields']),f'{{{INK}}}groupmode':'layer',f'{{{INK}}}label':layer['label']});group.append(element('title',text=layer['label']));groups[key]=group;root.append(group)
    for part,entries in plan['parts'].items():
        for index,entry in enumerate(entries):
            shape=pathops.Path()
            for source_id in entry['source_paths']:
                source=trace[source_id]
                if source.get('fill')!=entry['expected_fills'][str(source_id)]:
                    raise ValueError('Reviewed paint source changed')
                shape.addPath(parse(source.get('d'),source.get('transform')))
            shape=pathops.simplify(shape)
            shape=intersect(shape,region(part))
            attrs={'id':f'{part}-paint-{index:03}','d':svg_path(shape),'fill':entry['fill'],'fill-rule':'nonzero','data-paint-role':entry['role'],'data-original-fill':entry['fill'],'data-source-paths':' '.join(map(str,entry['source_paths']))}
            if entry.get('reconstructed_underpaint'):attrs['data-reconstructed-underpaint']='true'
            groups[part].append(element('path',attrs))
    ellipses=plan['pore_ellipses']
    if ellipses['review_status']!='manually-matched-one-to-one-to-raster-spots':
        raise ValueError('Pore fit candidates require visual matching first')
    for index,point in enumerate(ellipses['centers']):
        x,y=point
        rx,ry=ellipses['radii']
        circle=parse(f'M{x+rx} {y}A{rx} {ry} 0 1 0 {x-rx} {y}A{rx} {ry} 0 1 0 {x+rx} {y}Z')
        if abs(subtract(circle,region('hymenophore')).area)>.02:
            raise ValueError('Ellipse escaped reviewed pore surface')
        groups['hymenophore'].append(element('ellipse',{'id':f'porous-mark-{index:02}','cx':str(x),'cy':str(y),'rx':str(rx),'ry':str(ry),'fill':ellipses['fill'],'data-original-fill':ellipses['fill'],'data-paint-role':'material','data-detail':'depicted-pore-mark'}))
    if whole:
        details=json.loads((folder/'detail-masks.json').read_text())['reticulum']
        if details['review_status']!='visually-matched-to-raster-network':
            raise ValueError('Network extraction needs isolated visual review')
        file=folder/'detail-reticulum.svg'
        if digest(file)!=details['svg_sha256']:raise ValueError('Network geometry changed')
        for index,source in enumerate(ET.parse(file).getroot()):
            geometry=intersect(parse(source.get('d'),source.get('transform')),region('stem'))
            color=source.get('fill')
            groups['reticulum'].append(element('path',{'id':f'reticulum-network-{index:02}','d':svg_path(geometry),'fill':color,'fill-rule':'nonzero','data-paint-role':'reticulum','data-original-fill':color}))
    final_review=folder/'svg-review.json'
    if final_review.exists():
        approval=json.loads(final_review.read_text())
        if approval['status']=='passed-independent-svg-fidelity-review' and approval['geometry_sha256']==fingerprint(root) and approval['source_crop_sha256']==spec['source']['crop_sha256']:
            metadata['review_status']='passed-independent-svg-fidelity-review'
            metadata['svg_fidelity_review']={'file':str(final_review.relative_to(ROOT)),'sha256':digest(final_review),'reviewer':approval['reviewer']}
            root.find(f'{{{SVG}}}metadata').text=json.dumps(metadata,ensure_ascii=False)
    ET.indent(root)
    output=folder/(spec['taxon_key']+'-semantic.svg')
    ET.ElementTree(root).write(output,encoding='utf-8',xml_declaration=True)
    (folder/'semantic.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    print('Built reviewed scene',output)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);args=p.parse_args();build(args.folder)
