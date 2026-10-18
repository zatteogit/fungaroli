import json,re,html,hashlib
from pathlib import Path
O=Path(__file__).parent
cs=json.load(open(O/'photo-candidates.json'))
chosen={
'martora':[('6e3edfc8','Figura intera: postura e mantello; confrontare la leggibilità della pettorina.'),('47e8a403','Seconda postura: adottare soltanto se mostra gola/petto meglio della prima vista.')],
'faina':[('d1817718','Figura intera per corpo, coda e pettorina bianca.'),('8adf7b53','Vista complementare della gola; non adottare se quasi identica alla prima.')],
'donnola':[('07bd1f0b','Figura intera in ambiente naturale; verificare che la neve e il contrasto non nascondano il corpo.')],
'moscardino':[('81ca37a0','Figura intera da fonte italiana, per corpo e coda; scartare se manipolato o troppo occluso.'),('d1d4335d','Seconda osservazione indipendente; mantenere solo con coda o postura chiaramente complementare.')],
'quercino':[('d68a0b4b','Figura intera; verificare nitidezza e soggetto visibile.'),('3f400567','Nel cavo del tronco: contesto complementare soltanto se occhi e muso leggibili.')],
'gatto-selvatico':[('86de54cd','Soggetto intero: mantello e coda; fotografia in cattività da dichiarare se attestata nella pagina.'),('6ada9d16','Altra vista in parco faunistico: coda e postura, non prova di presenza spontanea.')],
'lepre-italica':[('ff74b397','Specie esatta fotografata in Italia: figura intera, da sottoporre a selezione severa.'),('6787d92c','Osservazione indipendente francese/Corsica: verifica soggetto intero e leggibilità; non spacciarla per Appennino.')],
'aquila-reale':[('54b5f76e','Volo: sagoma e ali leggibili su sfondo uniforme, se i byte confermano sufficiente dettaglio.'),('a297774a','Posata in parco faunistico: dettaglio complementare alla sagoma in volo; dichiarare cattività.')],
'ape-legnaiola':[('42a9dee1','Su fiore: corpo, ali e visita floreale, con luce/colore fedeli.'),('6d48b8d6','Secondo angolo su lavanda: ali e apparato boccale solo se aggiungono un dettaglio netto.')],
'macaone':[('4145dd98','Bruco documentato nella descrizione del file, vista dorsale: fase complementare all’adulto già integrato.')]
}
plan=[]
for key,selected in chosen.items():
 for suffix,role in selected:
  row=next(x.copy() for x in cs if x['id'].endswith(suffix))
  row['role']=role;row['selection_status']='metadata-verified; original visual review pending'
  row['attribution']=row['attribution_requested'] or row['author']+' · Wikimedia Commons · '+row['license']
  row['alt']=row['latin']+', fotografia della specie; descrizione visiva da finalizzare dopo revisione.'
  row['caption']=row['latin']+'. Didascalia da finalizzare dopo revisione dell’originale.'
  row['changes']='Nessuna trasformazione: originale non ancora acquisito.'
  row['original']=str(O/'originals'/(row['id']+'.jpg'))
  plan.append(row)
# one per taxon before complementary views
plan=sorted(plan,key=lambda x:(next(n for n,(sid,_) in enumerate(chosen[x['target_key']]) if x['id'].endswith(sid)),list(chosen).index(x['target_key'])))
(O/'download-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
print('plan',len(plan),'taxa',len(set(x['target_key'] for x in plan)))
# source receipt / explicit PDF locator, no transfer of local calendars
p=json.load(open(O/'proposals.json'))
for source in p['sources']:
 if source['id']=='CE26-BDQ-MACAONE':
  source['receiptSha256']=hashlib.sha256((O/'evidence/CE26-BDQ-MACAONE.pdf').read_bytes()).hexdigest()
  source['locator']='Macaone: pagine stampate 14–15, pagine PDF15–16 (indici14–15), rese viste.'
(O/'proposals.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
