#!/usr/bin/env python3
"""Conservative raster-first rebuild; preserve trace, paints and semantic parts."""
import argparse,hashlib,json,shutil
from pathlib import Path
from trace_botanical_svg import trace
from build_botanical_svg import build

def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def optimize(source,base):
    source=Path(source);base=Path(base);base.mkdir(parents=True,exist_ok=True);target=base/'optimized';target.mkdir(exist_ok=True)
    original=base/'original-v1.svg'
    if original.exists():assert digest(original)==digest(source/'semantic.svg'),'Original differs: preserve version before proceeding'
    else:shutil.copyfile(source/'semantic.svg',original)
    for name in ['master.png','source.png','trace-input.png','source-record.json','raster-review.md','raster-prompt.txt','anatomy.json','achenes-region.svg','achenes-mask.png','detail-candidates.json']:
        shutil.copyfile(source/name,target/name)
    trace(target)
    rec=json.loads((target/'source-record.json').read_text());assert rec['trace_sha256']==digest(source/'trace-clean.svg'),'A changed trace requires new semantic annotations and review'
    ann=json.loads((target/'anatomy.json').read_text());ann['coordinate_precision']=1
    ann['optimization']={'source_svg_sha256':digest(original),'source_folder':str(source),'status':'proposed-awaiting-coordinator-review','method':'Reproduce the identical trace from the same approved RGB raster (same SHA256), retain all paint paths/colors/roles and serialize boolean-intersection coordinates to 0.1 source pixel. No redraw, recoloring, anatomy change or organ deletion.'}
    (target/'anatomy.json').write_text(json.dumps(ann,ensure_ascii=False,indent=2)+'\n');build(target)
    print(json.dumps({'original_bytes':original.stat().st_size,'proposed_bytes':(target/'semantic.svg').stat().st_size,'review_status':'awaiting-coordinator-review'}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',type=Path,default=Path('incoming/vettoriali/botanici-lotto-01/fragolina-frutto'));p.add_argument('--output',type=Path,default=Path('incoming/vettoriali/ottimizzazione-fragolina-frutto'));a=p.parse_args();optimize(a.source,a.output)
