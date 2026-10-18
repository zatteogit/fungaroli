#!/usr/bin/env python3
"""Inventory sources; a ready raster sheet is NOT independent species approval."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
from sheet_cells import ready_sheets


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def family(taxon,part):
    traits=taxon['traits'];hym='-'.join(traits.get('hymenophore')or['unknown'])
    if part!='gambo':return part+'-'+hym
    flags=[name for field,name in [('stem_ring','ring'),('stem_volva','volva'),('stem_reticulum','reticulum')]if traits.get(field)is True]
    return 'whole-'+hym+('+'+'+'.join(flags)if flags else '')


def prepare(output,raster_root,plant_root):
    taxa=json.loads((ROOT/'data/species-traits.json').read_text())['taxa'];items=[];roots={}
    def add(source):
        stable=json.dumps([source['source_set'],source['file'],source.get('cell'),source['sha256']],sort_keys=True)
        source['id']=hashlib.sha256(stable.encode()).hexdigest()[:16];items.append(source)
    for file in sorted((ROOT/'assets/traits').glob('*.webp')):
        key=next(key for key in sorted(taxa,key=len,reverse=True)if file.stem.startswith(key+'-'))
        rest=file.stem[len(key)+1:];part=next(p for p in ['cappello','sotto','gambo','taglio']if rest==p or rest.startswith(p+'-'))
        add({'source_set':'published-fungi','file':str(file.relative_to(ROOT)),'sha256':digest(file),'taxon_key':key,'tile':part,'variant_slug':rest[len(part):].lstrip('-')or'base','family':family(taxa[key],part),'stage':'needs-high-resolution-master','anatomy_status':'not-independently-audited-for-svg'})
    for file in sorted((ROOT/'assets/tree-traits').glob('*.webp')):
        add({'source_set':'published-trees','file':str(file.relative_to(ROOT)),'sha256':digest(file),'family':'generic-botanical-trait','variant_slug':file.stem,'stage':'needs-high-resolution-master','anatomy_status':'not-independently-audited-for-svg'})
    for name,source_root,mode in [('incoming-fungi',raster_root,'fungi'),('incoming-plants',plant_root,'plants')]:
        if source_root is None:continue
        source_root=source_root.resolve();manifest=source_root/'incoming/manifest.json';states=source_root/'incoming/bozze/STATO.md';ready=ready_sheets(states)
        roots[name]={'local_root':str(source_root),'manifest_sha256':digest(manifest),'states_sha256':digest(states)};hashes={}
        for row in json.loads(manifest.read_text()):
            if row.get('tipo')!='illustrazione'or row['file'].removeprefix('incoming/')not in ready:continue
            if mode=='fungi'and row.get('soggetto')not in taxa:continue
            if mode=='plants'and row.get('soggetto')!='piante':continue
            path=source_root/row['file']
            if row['file']not in hashes:hashes[row['file']]=digest(path)
            entry={'source_set':name,'file':row['file'],'sha256':hashes[row['file']],'cell':row['cella'],'stage':'needs-independent-raster-review','anatomy_status':'unannotated','license':row.get('licenza'),'license_url':row.get('licenseUrl')}
            if mode=='fungi':entry.update(taxon_key=row['soggetto'],tile=row['tessera'],variant=row.get('variante','base'),family=family(taxa[row['soggetto']],row['tessera']))
            else:entry.update(trait_key=row['chiave'],trait_value=row['valore'],family='plant-'+row['chiave'])
            add(entry)
    # Only explicit reviews bound to the exact sheet/crop can promote a source.
    for folder in sorted((ROOT/'incoming/vettoriali').glob('*')):
        if not(folder.is_dir()and(folder/'regions.json').exists()):continue
        spec=json.loads((folder/'regions.json').read_text());source=spec['source'];gate=spec.get('raster_semantic_review')
        if not gate:continue # Historical prototype, not an audited production source.
        review_file=ROOT/gate['review_file'];review=json.loads(review_file.read_text())
        if digest(review_file)!=gate['review_sha256']or review['independent_review']['status']!='passed-independent-species-review':raise ValueError('Raster review must be renewed')
        if review['selected_sha256']!=source['sheet_sha256']or digest(ROOT/source['sheet'])!=source['sheet_sha256']:raise ValueError('Reviewed source changed')
        if digest(folder/'source.png')!=source['crop_sha256']:raise ValueError('Reviewed crop changed')
        matches=[x for x in items if x['sha256']==source['sheet_sha256']and x.get('cell')==source['cell']]
        if not matches:
            add({'source_set':'reviewed-local-master','file':source['sheet'],'sha256':source['sheet_sha256'],'cell':source['cell'],'taxon_key':spec['taxon_key'],'tile':source['tile'],'variant':spec['variant'],'family':family(taxa[spec['taxon_key']],source['tile'])});matches=[items[-1]]
        for item in matches:
            item.update(stage='audited-semantic-prototype',anatomy_status='independent-raster-and-svg-review-recorded',anatomy_folder=str(folder.relative_to(ROOT)),raster_species_review=gate)
    rejects=ROOT/'incoming/vettoriali/raster-rejections.json'
    for rejected in json.loads(rejects.read_text())if rejects.exists()else[]:
        for item in items:
            if item['sha256']==rejected['sha256']and item.get('cell')in rejected['cells']:
                item.update(stage='rejected-raster-needs-correction',rejection_reason=rejected['reason'])
    result={'schema_version':2,'scope':'Candidate inventory, not an SVG production completion claim. Never infer anatomical correctness from sheet ready status. Each drawing requires independent species/value review before trace.','roots':roots,'catalog_root':str(ROOT),'source_counts':dict(Counter(x['source_set']for x in items)),'total_sources':len(items),'stages':dict(Counter(x['stage']for x in items)),'stage_definitions':{'needs-high-resolution-master':'Recover original raster and review species/value before tracing.','needs-independent-raster-review':'Raster master exists; independent anatomical/species audit is not recorded here.','rejected-raster-needs-correction':'Known semantic mismatch: generate and audit corrected raster first.','audited-semantic-prototype':'Exact raster and SVG have independent reviews. No app integration or bulk approval implied.'},'items':items}
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:result[k]for k in ['total_sources','source_counts','stages']},ensure_ascii=False))


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--raster-root',type=Path,required=True);p.add_argument('--plant-root',type=Path);p.add_argument('--output',type=Path,default=ROOT/'incoming/vettoriali/coda.json');a=p.parse_args();prepare(a.output,a.raster_root,a.plant_root)
