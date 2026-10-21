import json,sys,io,hashlib,html,re,urllib.parse
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;ROOT=B.parents[2];sys.path.insert(0,str(ROOT/'tools'))
from import_crop_points import positions,FORMATS
cand=json.load(open(B/'candidates.json'))['photos'];m=json.load(open(ROOT/'data/media.json'))
reject={'pe2-main-agaricus-campestris-02':'Fonte localizzata in Nepal; esclusa per prudenza tassonomica rispetto al contesto europeo.', 'pe2-main-pinophilus-02':'Stessa fotografia di pe2-main-pinophilus-01, diversa resa e taglio; esclusa come duplicato visivo.'}
notes={
'agaricus-arvensis':('Cappello e lamelle osservati di lato.','Vista ravvicinata del cappello chiaro e delle lamelle scure; base fuori campo.'),
'agaricus-campestris':('Cappello, lamelle e gambo in una fotografia reale.','Vista del gruppo o del singolo esemplare; nessuna fase biologica attribuita.'),
'calocybe-gambosa':('Esemplari disposti sull’erba, con cappelli e lamelle visibili.','Gruppo ripreso da vicino; mostra anche gambi e basi dei due esemplari laterali.'),
'craterellus-lutescens':('Gruppo nel bosco con cappelli e gambi visibili.','Veduta ravvicinata del gruppo, con superfici inferiori visibili su alcuni esemplari.'),
'hygrophorus-marzuolus':('Cappelli e lamelle osservati sul terreno del bosco.','Un esemplare rovesciato mostra le lamelle; gli altri sono parzialmente coperti dalle foglie.'),
'pinophilus':('Cappello e gambo osservati da vicino.','Veduta dell’esemplare o gruppo; nessuna fase biologica attribuita.'),
'suillus':('Cappello o superficie poroide in una fotografia reale.','Vista complementare di cappello o pori; nessun carattere non visibile attribuito.')}
reviews={
'pe2-main-agaricus-arvensis-01':([.5,.48],[.01,.18,.99,.97]),
'pe2-main-agaricus-campestris-01':([.5,.5],[.04,.05,.97,.97]),
'pe2-main-agaricus-campestris-02':([.48,.53],[.09,.01,.85,.99]),
'pe2-main-agaricus-campestris-03':([.5,.52],[.1,.05,.95,.93]),
'pe2-main-calocybe-gambosa-04':([.5,.54],[.02,.18,.99,.93]),
'pe2-main-craterellus-lutescens-03':([.5,.53],[.02,.08,.96,.95]),
'pe2-main-hygrophorus-marzuolus-01':([.52,.55],[.08,.13,.91,.99]),
'pe2-main-pinophilus-01':([.51,.58],[.12,.11,.91,.98]),
'pe2-main-pinophilus-03':([.5,.51],[.1,.07,.89,.94]),
'pe2-main-pinophilus-04':([.53,.55],[.04,.1,.99,.98]),
'pe2-main-suillus-01':([.52,.51],[.04,.11,.98,.92]),
'pe2-main-suillus-02':([.5,.5],[.01,.01,.99,.99]),
'pe2-main-suillus-03':([.51,.52],[.01,.01,.99,.99]),
'pe2-main-suillus-04':([.49,.5],[.11,.08,.95,.99]),
}
(B/'webp').mkdir(exist_ok=True);out=[]
def save(im,p,side,cap):
 q=84
 while True:
  target=im.copy();target.thumbnail((side,side),Image.Resampling.LANCZOS);buf=io.BytesIO();target.save(buf,'WEBP',quality=q,method=6)
  if len(buf.getvalue())<=cap: p.write_bytes(buf.getvalue());return target.size
  if q>58:q-=5
  else:side=int(side*.9);q=78
for r in cand:
 if r['id'] in reject:continue
 im=ImageOps.exif_transpose(Image.open(ROOT/r['original'])).convert('RGB');im=Image.frombytes('RGB',im.size,im.tobytes());id=r['id'];k=r['target_key'];point,box=reviews[id];rv=dict(approved=True,attribution_approved=True,punto=point,riquadro=box,nota=notes[k][1]+' I ritagli stretti possono escludere parti; la foto intera resta nel visore. Confrontata con tutte le foto già collegate alla scheda.')
 fn=B/'webp'/f'{id}.webp';hd=B/'webp'/f'{id}-hd.webp';t=B/'webp'/f'{id}-t.webp';save(im,fn,560,80000);save(im,hd,1200,220000)
 side=min(im.size);x=(im.width-side)//2;y=(im.height-side)//2;im.crop((x,y,x+side,y+side)).resize((160,160),Image.Resampling.LANCZOS).save(t,'WEBP',quality=72,method=6)
 r['source_attribution']=r['author']
 if r['author'].startswith('Ian Sutton from '):r['author']='Ian Sutton'
 if r['author'].startswith('User:'):r['author']=r['author'][5:]
 r.update(attribution=f"{r['author']} / Wikimedia Commons / {r['license']}",alt=f"{r['latin']}. {notes[k][0]}",caption=notes[k][0],changes='Orientamento EXIF applicato, ridimensionamento, compressione WebP; miniatura quadrata centrale. Nessuna modifica cromatica o generazione. EXIF/XMP rimossi.',visual_review=rv,crop_points=positions(im.size,rv),files=dict(file=str(fn.relative_to(ROOT)),file_hd=str(hd.relative_to(ROOT)),thumb=str(t.relative_to(ROOT))))
 out.append(r)
(B/'manifest.json').write_text(json.dumps({'photos':out,'rejected':[{'id':k,'reason':v} for k,v in reject.items()],'network':{'commons_api_status':200,'upload_status':200,'upload_probe_bytes':385301,'subsequent_status':429,'downloads_paused':True},'limits':['Metadati della pagina del singolo file letti tramite imageinfo/extmetadata e categorie Commons; non equivale a certificazione micologica.','Nessuna fase di crescita attribuita.','Nessuna suite avviata.']},ensure_ascii=False,indent=2))
# six actual UI crops plus centred thumbnail, 2 photos per sheet
for start in range(0,len(out),2):
 chunk=out[start:start+2];sh=Image.new('RGB',(1680,len(chunk)*350),'#eeeeee');d=ImageDraw.Draw(sh)
 for j,r in enumerate(chunk):
  im=Image.open(ROOT/r['files']['file_hd']).convert('RGB');y=j*350;d.text((8,y+3),r['id'],fill='black')
  for n,(name,ratio) in enumerate(FORMATS.items()):
   cw,ch=min(im.width,im.height*ratio),min(im.height,im.width/ratio);px,py=r['crop_points'][name];ox=px*(im.width-cw);oy=py*(im.height-ch);c=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)));c.thumbnail((230,285));x=n*240;sh.paste(c,(x,y+25));d.text((x+2,y+320),name,fill='black')
  sh.paste(Image.open(ROOT/r['files']['thumb']),(1450,y+25));d.text((1450,y+200),'thumb centro',fill='black')
 sh.save(B/f'crop-review-{start//2+1:02}.jpg',quality=92)
# candidate plan from cached individual-file API metadata, no new network
plain=lambda x:html.unescape(re.sub('<[^>]+>',' ',str(x))).strip()
usedtitles={r['source_title'] for r in cand};alltext=urllib.parse.unquote((ROOT/'data/media.json').read_text()).replace('_',' ');bykey={}
for mf in sorted((B/'metadata').glob('*api.json')):
 if '-inat-api' in mf.name:continue
 k=re.sub(r'-\d+-api$','',mf.stem);taxon=re.split(r' \(| s\.l\.',m['species'][k]['latin'])[0];aliases=[taxon]
 if k=='cyclocybe-aegerita':aliases+=['Cyclocybe aegerita','Agrocybe aegerita']
 for p in json.load(open(mf)).get('query',{}).get('pages',{}).values():
  i=p.get('imageinfo',[{}])[0];e=i.get('extmetadata',{});v=lambda n:plain(e.get(n,{}).get('value',''));title=p['title'];desc=v('ImageDescription');cats=v('Categories').split('|');lic=v('LicenseShortName')
  if title in usedtitles or title.replace('_',' ') in alltext or 'abruptibulbus' in (title+' '+desc+' '+' '.join(cats)).lower():continue
  if not re.match(r'^(CC0|CC BY(?:-SA)?(?: |$))',lic) or not v('LicenseUrl') or not v('Artist'):continue
  if not urllib.parse.urlparse(i.get('url','')).path.lower().endswith(('.jpg','.jpeg','.png')) or i.get('size',1e9)>25000000 or min(i.get('width',0),i.get('height',0))<500:continue
  if re.search('spore|microscop|illustrat|drawing|stamp|icon|plate|distribution|crop|California|Australia|Nepal|North America',title+' '+desc+' '+' '.join(cats),re.I):continue
  if not any(a.lower() in (desc+' '+' '.join(cats)).lower() for a in aliases):continue
  rows=bykey.setdefault(k,[])
  if any(z['source_title']==title for z in rows):continue
  id=f'pe2-main-{k}-q{len(rows)+1:02}';suffix=Path(urllib.parse.urlparse(i['url']).path).suffix.lower()
  rows.append(dict(id=id,target_group='species',target_key=k,latin=m['species'][k]['latin'],original=str((B/'originals'/(id+suffix)).relative_to(ROOT)),sourceImage=i['url'],commons_sha1=i['sha1'],source_title=title,source_description=desc,source_categories=cats,page=i['descriptionurl'],author=v('Artist'),license=lic,licenseUrl=v('LicenseUrl')))
# 2 per unrepresented target, round robin; acquisition not approval
represented={r['target_key'] for r in out};queue=[]
for rnd in range(2):
 for k,rows in bykey.items():
  if k in represented:continue
  if len(rows)>rnd:queue.append(rows[rnd])
(B/'download-plan.json').write_text(json.dumps({'status':'Candidature non acquisite e non approvate visivamente','photos':queue},ensure_ascii=False,indent=2))
print('accepted',len(out),'queued',len(queue))
