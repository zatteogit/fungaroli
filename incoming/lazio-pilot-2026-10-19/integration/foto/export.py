from pathlib import Path
import json,hashlib,urllib.request
from PIL import Image,ImageOps,ImageDraw
P=Path(__file__).parent;ROOT=P.parents[3];UA='fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'
rows={r.get('pageid'):r for n in ['more-acquired.json','acquired.json','geo-selected-acquired.json'] for r in json.load(open(P/n)) if r.get('local')}
selections=[
('vico-monte-venere',133569188,'Monte Venere fotografato dalla riva del lago di Vico. Paesaggio della zona; non la partenza del percorso.',.50,.45),
('oriolo-monte-raschio',65284712,'Fonte Petrella nella faggeta di Monte Raschio. Il fontanile è visibile nel bosco; non indica un accesso carrabile.',.55,.56),
('allumiere-faggeto',119306695,'Faggeto di Allumiere, Cava del Silenzio. Rocce e faggi ben leggibili, luce naturale; nessuna città.',.52,.55),
('monterano-bicione',6798700,'Cascata della Diosilla, nel contesto della Riserva Monterano e del percorso proposto; non un punto del Bicione geolocalizzato.',.50,.50),
('veio-monte-musino',133405256,'Sentiero a Monte Musino, fonte esplicitamente Sacrofano/Parco di Veio. Bosco e tracciato leggibili.',.50,.57),
('faete-rocca-papa',103801473,'Monte Cavo visto da Castel Gandolfo. Copertina panoramica della montagna, non veduta dal sentiero Faete.',.50,.48),
('cerquone-doganella',194280661,'Pozzi di Doganella: prato e margine arboreo del sito nominato. Non si attribuisce questa radura al bosco interno del Cerquone.',.5,.50),
('circeo-cerasella-verdesca',120277474,'Foresta demaniale del Circeo. La fonte non specifica Cerasella/Verdesca: copertina del contesto forestale condiviso, non del singolo punto.',.50,.56),
('ernici-prato-campoli',73616749,'Prato di Campoli documentato dalla descrizione originale 500px; piana e faggete, cavalli sullo sfondo.',.50,.45),
('nemi-fontan-tempesta',120252877,'Castagni con radici esposte nel Parco dei Castelli Romani, fotografia georeferenziata a 751 m dal centro editoriale della traccia. Non attribuita al punto Fontan Tempesta.',.50,.55),
('livata-tufai',107524919,'Faggeta autunnale e strada presso Le Vedute, Monte Livata. Ripresa aerea locale, 3,6 km dal centro editoriale della traccia; non satellite, non veduta dal sentiero Tufai.',.50,.50),
('gennaro-roccagiovine',84167254,'Pratone e Pizzo di Monte Gennaro: piana carsica e margine boschivo, luogo esplicitato nella fonte. Non la partenza da Roccagiovine.',.50,.50),
('pnalm-settefrati-canneto',120441205,'Sorgente del Melfa nella Valle di Canneto. Acqua e vegetazione locali; struttura del ponticello parte del luogo reale.',.50,.55),
]
media=json.load(open(ROOT/'data/media-zones.json'));crop=json.load(open(ROOT/'data/crop-points.json'));report=[]
for zid,pid,note,cx,cy in selections:
 r=rows[pid];f=Path(r['local'])
 if (P/'originals'/f'{pid}-original.jpg').exists():f=P/'originals'/f'{pid}-original.jpg'
 # Upgrade a 960px preview to the original only through the ordinary published Commons URL.
 if max(Image.open(f).size)<1600:
  try:
   raw=urllib.request.urlopen(urllib.request.Request(r['originalUrl'].split('?')[0],headers={'User-Agent':UA}),timeout=40).read();Image.open(__import__('io').BytesIO(raw)).verify();f=P/'originals'/f'{pid}-original.jpg';f.write_bytes(raw)
  except Exception:pass
 im=ImageOps.exif_transpose(Image.open(f)).convert('RGB');outs={}
 if im.width/im.height < 1.1 or im.width/im.height > 2.2:
  target=1.5; cw=min(im.width,int(im.height*target));ch=min(im.height,int(im.width/target));left=round((im.width-cw)*cx);top=round((im.height-ch)*cy);im=im.crop((left,top,left+cw,top+ch))
 for suffix,width in [('',600),('-hd',1600),('-t',240)]:
  out=ROOT/'assets/zones'/f'{zid}{suffix}.webp';img=im.copy();img.thumbnail((width,width),Image.Resampling.LANCZOS);img.save(out,'WEBP',quality=85,method=6);outs[suffix]={'file':str(out.relative_to(ROOT)),'size':list(img.size),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
 entry=dict(file=outs['']['file'],file_hd=outs['-hd']['file'],thumb=outs['-t']['file'],source='Wikimedia Commons',page=r['page'],author=r['author'],license=r['license'],licenseUrl=r['licenseUrl'],size=outs['']['size'])
 assert zid not in media['zones'] or media['zones'][zid].get('page')==r['page'],zid
 media['zones'][zid]=entry
 for item in outs.values():crop['files'][item['file']]={**{ratio:[cx,cy] for ratio in ['5:4','3:4','4:5','16:7','4:3','1:1']},'dubbio':False}
 report.append(dict(zoneId=zid,pageid=pid,review='approved_by_photo_agent_pending_root_review',localization=note,source=r,originalAcquired=str(f),originalSha256=hashlib.sha256(f.read_bytes()).hexdigest(),outputs=outs,crop=[cx,cy],corrections='Rotazione EXIF applicata; ritaglio centrale 3:2 per originali verticali o panoramici estremi; ridimensionamento, nessuna ricostruzione o generazione. Punto CSS rivisto sul provino.'))
(ROOT/'data/media-zones.json').write_text(json.dumps(media,ensure_ascii=False,indent=1)+'\n')
(ROOT/'data/crop-points.json').write_text(json.dumps(crop,ensure_ascii=False,separators=(',',':'))+'\n')
(P/'approved.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
html=['<!doctype html><meta charset="utf-8"><title>Copertine Lazio — revisione</title><style>body{font:16px system-ui;background:#f7f4ea;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}img{width:100%;height:210px;object-fit:cover}article{background:white;padding:12px}small{display:block}</style><h1>Copertine reali Lazio: proposte per revisione indipendente</h1><p>La copertina descrive il contesto locale, non prova il punto di accesso o la percorribilità. Nessuna variante stagionale generata.</p><main>']
sheet=Image.new('RGB',(1200,260*((len(report)+2)//3)),'white');dr=ImageDraw.Draw(sheet)
for k,r in enumerate(report):
 z=r['zoneId'];file=r['outputs']['']['file'];im=Image.open(ROOT/file);im=ImageOps.fit(im,(390,210),centering=(r['crop'][0],r['crop'][1]));x=k%3*400;y=k//3*260;sheet.paste(im,(x,y));dr.text((x+4,y+214),z,fill='black');dr.text((x+4,y+230),str(r['pageid'])+' '+r['source']['license'],fill='black')
 html.append(f'<article><img src="../../../../{file}" style="object-position:{r["crop"][0]*100}% {r["crop"][1]*100}%"><h2>{z}</h2><p>{r["localization"]}</p><small>{r["source"]["author"]} — {r["source"]["license"]}</small><a href="{r["source"]["page"]}">Fonte e licenza</a></article>')
html.append('</main>');(P/'review.html').write_text('\n'.join(html));sheet.save(P/'approved-contact-sheet.jpg',quality=90)
print('EXPORTED',len(report))
