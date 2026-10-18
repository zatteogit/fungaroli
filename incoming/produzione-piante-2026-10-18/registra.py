"""Registra solo una tavola dopo revisione visiva esplicita; non approva anatomia automaticamente."""
import argparse,hashlib,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from sheet_cells import drawings
from import_tree_icons import fit
p=argparse.ArgumentParser();p.add_argument('batch',type=int);p.add_argument('--review',required=True);p.add_argument('--revision');a=p.parse_args()
folder=ROOT/'incoming/produzione-piante-2026-10-18';qp=folder/'coda.json';q=json.loads(qp.read_text());batch=q['batches'][a.batch-1];path=ROOT/(a.revision or batch['file']);im=Image.open(path)
assert im.mode=='RGBA' and im.size==(1254,1254)
boxes=drawings(im,path.name);assert set(boxes)=={r['cella']for r in batch['values']}
references=batch.get('references',[])
if a.revision:
 prompt_initial=(folder/f'prompt-{a.batch:02}.txt').read_text();revision_num=int(Path(a.revision).stem.rsplit('-r',1)[1]);history=[(folder/f'prompt-{a.batch:02}-r{n:02}.txt').read_text()for n in range(1,revision_num+1)];prompt_revision='\n\nREVISIONE SUCCESSIVA:\n'.join(history);batch['original_prompt']=prompt_initial;batch['revision_prompt']=history;references=[batch['file']if revision_num==1 else str(Path(batch['file']).with_name(Path(batch['file']).stem+f'-r{revision_num-1:02}.png'))]
source=json.loads((ROOT/'data/recognize-plants.json').read_text())['schema'];prompt=(prompt_initial+'\n\nREVISIONE:\n'+prompt_revision) if a.revision else (folder/f'prompt-{a.batch:02}.txt').read_text()
manifest=json.loads((ROOT/'incoming/manifest.json').read_text());manifest=[r for r in manifest if r['file']!=str(path.relative_to(ROOT))]
for row in batch['values']:
 assert row['valore']in{v['id']for v in source[row['chiave']]['values']}
 manifest.append({'file':str(path.relative_to(ROOT)),'tipo':'illustrazione','soggetto':'piante','chiave':row['chiave'],'valore':row['valore'],'cella':row['cella'],'modello':'image_gen integrato (identificatore specifico non esposto)','prompt':prompt,'riferimenti':references,'autore':'Fronda/Fungaroli, rivista dal progetto','licenza':'CC BY-SA 4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/deed.it'})
 tile=fit(im.crop(boxes[row['cella']]))
 tile.save(folder/'ritagli'/f"{row['chiave']}-{row['valore']}.png")
checksfile=folder/'controlli.json';checks=json.loads(checksfile.read_text())if checksfile.exists()else[]
checks=[c for c in checks if c['file']!=str(path.relative_to(ROOT))];checks.append({'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'dimensions':list(im.size),'mode':im.mode,'cells':{str(k):v for k,v in boxes.items()},'review':a.review,'references':references,'crop_check':'component boxes complete, no border contact, no box overlap, no extra/empty cells; 128px crops saved'})
batch.update(status='pronta da integrare',generated_file=str(path.relative_to(ROOT)),review=a.review,prompt=prompt)
qp.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n');(ROOT/'incoming/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');checksfile.write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
with(ROOT/'incoming/bozze/STATO.md').open('a')as f:f.write(f"| {path.relative_to(ROOT)} | pronta da integrare | {a.review} |\n")
print('Recorded',batch['id'],len(batch['values']),'icons')
