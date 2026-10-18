#!/usr/bin/env python3
"""Raster-first botanical scenes. Anatomy is manually annotated, never inferred."""
import argparse,hashlib,json
from pathlib import Path
import xml.etree.ElementTree as ET
import pathops
from path_geometry import parse,intersect,subtract,svg_path,visible_paints
from build_semantic_svg import element,SVG,INK

def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def build(folder):
    folder=Path(folder).resolve();record=json.loads((folder/'source-record.json').read_text());ann=json.loads((folder/'anatomy.json').read_text())
    assert digest(folder/'master.png')==record['source']['master_sha256']==record['raster_review']['master_sha256']
    assert digest(folder/'source.png')==record['source']['crop_sha256']
    assert digest(folder/'trace-clean.svg')==record['trace_sha256']==ann['trace_sha256']
    assert digest(folder/'raster-review.md')==ann['raster_review_sha256']
    assert ann['status']=='manually-annotated-from-reviewed-raster'
    assert record['raster_review']['status']=='passed-independent-species-raster-review'
    if (folder/'detail-candidates.json').exists():
        assert json.loads((folder/'detail-candidates.json').read_text())['review_status']=='manually-reviewed-candidate-overlay'
    if record.get('domain')=='fungal':
        traits=record['provenance']['documented_traits']['traits']
        assert record['value']in traits['cap_color']and 'convesso'in traits['cap_shape']
        assert traits['stem_ring']is False and traits['stem_volva']is False and traits['stem_reticulum']is False
    trace=ET.parse(folder/'trace-clean.svg').getroot();w,h=ann['canvas'];root=element('svg',{'viewBox':f'0 0 {w} {h}','width':str(w),'height':str(h),'role':'img','aria-labelledby':'title description'})
    root.append(element('title',{'id':'title'},record['name']))
    root.append(element('desc',{'id':'description'},ann['description']))
    meta={'schema_version':'fungal-semantic-1'if record.get('domain')=='fungal'else'botanical-semantic-1','id':record['id'],'species':record['species'],'field':record['field'],'value':record['value'],'source':record['source'],'raster_review':record['raster_review'],'trace_sha256':record['trace_sha256'],'anatomy':ann,'license':'CC BY-SA 4.0','license_url':'https://creativecommons.org/licenses/by-sa/4.0/','author':'Fronda/Fungaroli','geometry':'Source paint stacks intersected into actual anatomical part geometries; no raster, masks, clips or complete-object copies. Graphic underpaint retained inside each part to preserve antialiasing, not reconstructed hidden tissue.','operations':['inspect-part','toggle-part','technical-material-tint-within-part'],'unsupported':['anatomical morphing','new biological color variants','automatic anatomy recognition','quantitative organ counts from illustrative marks'],'review_status':'svg-awaiting-coordinator-review'}
    root.append(element('metadata',text=json.dumps(meta,ensure_ascii=False)))
    full=parse(f'M-2-2H{w+2}V{h+2}H-2Z');regions={};covered=pathops.Path();visible_extras=None
    for part in ann['parts']:
        if part.get('region_svg'):
            detail=folder/part['region_svg'];assert digest(detail)==part['region_sha256'];shape=pathops.Path()
            for node in ET.parse(detail).getroot():shape.addPath(parse(node.get('d'),node.get('transform')))
            shape=pathops.simplify(shape)
        else:shape=subtract(full,covered)if part.get('remainder')else parse(part['region'])
        for source_index in part.get('region_plus_source_paths',[]):
            if part.get('extra_source_paths_visible_only'):
                if visible_extras is None:visible_extras={i:g for i,c,g in visible_paints(trace)}
                shape.addPath(visible_extras[source_index])
            else:
                node=trace[source_index];shape.addPath(parse(node.get('d'),node.get('transform')))
        if part.get('region_plus_source_paths'):shape=pathops.simplify(shape)
        # Annotated regions are disjoint partitions: overlap follows explicit order.
        shape=subtract(shape,covered);regions[part['id']]=shape
        covered.addPath(shape);covered=pathops.simplify(covered)
    paints=[(i,p.get('fill'),parse(p.get('d'),p.get('transform')))for i,p in enumerate(trace)]
    for part in ann['parts']:
        key=part['id'];g=element('g',{'id':key,'data-part':key,f'{{{INK}}}groupmode':'layer',f'{{{INK}}}label':part['label']});g.append(element('title',text=part['label']));g.append(element('desc',text=part['meaning']));root.append(g)
        for index,color,paint in paints:
            clipped=intersect(paint,regions[key])
            if abs(clipped.area)<.015:continue
            r,bg,b=[int(color[i:i+2],16)for i in [1,3,5]]
            role='outline'if max(r,bg,b)<100 else 'material'
            if record['id']=='fragolina-foglia'and r>135:role='vein-detail'
            g.append(element('path',{'id':f'{key}-paint-{index:03}','d':svg_path(clipped,ann.get('coordinate_precision')),'fill':color,'fill-rule':'nonzero','data-original-fill':color,'data-paint-role':role,'data-source-path':str(index)}))
    ET.indent(root);ET.ElementTree(root).write(folder/'semantic.svg',encoding='utf-8',xml_declaration=True);(folder/'semantic.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
    print('Built',record['id'],len(root.findall(f'.//{{{SVG}}}path')),'paths')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();build(a.folder)
