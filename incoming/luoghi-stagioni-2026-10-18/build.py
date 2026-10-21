#!/usr/bin/env python3
"""Import selettivo dei raster revisionati. Non modifica pending/SW/index."""
import hashlib, importlib.util, json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
BUNDLE=Path(__file__).resolve().parent

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 data=json.loads((ROOT/'data/media-zones.json').read_text())
 crops=json.loads((ROOT/'data/crop-points.json').read_text())
 spec=importlib.util.spec_from_file_location('crop_import',ROOT/'tools/import_crop_points.py')
 mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 anchors={
 'terminillo-ovest':{'punto':[0.52,0.53],'riquadro':[0.28,0.35,0.8,0.81],'dubbio':False,'nota':'Cono del Terminilletto e tracce sul pendio; camera invariata. In16:7prioritàcrinale e sentieri, rinuncia al cielo.'},
 'cittareale':{'punto':[0.68,0.46],'riquadro':[0.44,0.28,0.91,0.72],'dubbio':False,'nota':'Crinali rocciosi e ghiaione del Monte Pozzoni; priorità parete centrale, versante e bosco sottostante.'}}
 records=[]
 for z in anchors:
  base=data['zones'][z]
  for master in sorted((BUNDLE/'masters').glob(z+'-*.png')):
   suffix=master.stem[len(z)+1:];s,w=suffix.split('-')
   if s not in ('primavera','estate','autunno','inverno') or w not in ('sereno','nuvoloso','nebbia','pioggia','neve'):raise ValueError(master)
   im=Image.open(master).convert('RGB')
   dest=ROOT/'assets/zones/var'/f'{master.stem}.webp';big=dest.with_stem(dest.stem+'-hd')
   large=im.copy();large.thumbnail((1600,1600),Image.Resampling.LANCZOS);large.save(big,'WEBP',quality=72,method=6)
   normal=im.copy();normal.thumbnail((640,640),Image.Resampling.LANCZOS);normal.save(dest,'WEBP',quality=70,method=6)
   item={k:base[k] for k in ('source','author','license','licenseUrl','page')}
   item.update(season=s,weather=w,file=str(dest.relative_to(ROOT)),file_hd=str(big.relative_to(ROOT)),size=list(large.size),generated=True)
   variants=base.setdefault('variants',[]);variants[:]=[v for v in variants if (v['season'],v['weather'])!=(s,w)];variants.append(item)
   for p in (dest,big):
    with Image.open(p) as cm:crops['files'][str(p.relative_to(ROOT))]={**mod.positions(cm.size,anchors[z]),'dubbio':False}
   records.append(dict(zone=z,season=s,weather=w,source=base['file_hd'],source_sha256=digest(ROOT/base['file_hd']),master=str(master.relative_to(ROOT)),master_sha256=digest(master),file=item['file'],sha256=digest(dest),file_hd=item['file_hd'],hd_sha256=digest(big),generated=True,sourceAuthor=base['author'],license=base['license'],licenseUrl=base['licenseUrl'],sourcePage=base['page'],model='image_gen.imagegen',provenance='Derivazione illustrativa stagionale e meteo AI della foto locale, non nuova fotografia né osservazione delle condizioni attuali',review='Revisione interna su master e tavole; revisione indipendente separata con hash. Nessun nuovo oggetto o modifica significativa ai crinali ammessa.'))
   if w!='sereno' and s!='estate':
    ref=BUNDLE/'masters'/f'{z}-{s}-sereno.png'
    records[-1].update(referenceMaster=str(ref.relative_to(ROOT)),referenceMasterSha256=digest(ref))
  # Foto reali: aggiungere soltanto coordinate UI, senza mutare attribuzione o stato generated.
  for f in (base['file'],base['file_hd']):
   with Image.open(ROOT/f) as im:crops['files'][f]={**mod.positions(im.size,anchors[z]),'dubbio':False}
  mod.regen_thumb(base['file_hd'],base['thumb'],anchors[z])
 (ROOT/'data/media-zones.json').write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n')
 crops['files']=dict(sorted(crops['files'].items()))
 (ROOT/'data/crop-points.json').write_text(json.dumps(crops,ensure_ascii=False,separators=(',',':'))+'\n')
 (BUNDLE/'crop-anchors.json').write_text(json.dumps(anchors,ensure_ascii=False,indent=2)+'\n')
 (BUNDLE/'manifest.json').write_text(json.dumps({'date':'2026-10-18','base':'8f8b6db','records':records},ensure_ascii=False,indent=2)+'\n')
 print('Imported',len(records),'distinct covers; source photographs unchanged; 2 thumbnails recropped')
if __name__=='__main__':main()
