import json,urllib.parse
from pathlib import Path
B=Path(__file__).resolve().parent;R=B.parents[2]
cs=json.load(open(B/'candidates.json'))
# Reject prepared specimens, composite imagery, feeding scene and conflicting range/taxon before acquisition.
reject={0:'Predazione: ape catturata da ragno, non prioritario per scheda ape',12:'Preparato isolato',14:'Preparato Beauchene',25:'Composito: due animali avvicinati digitalmente',39:'Immagine annotata museale',49:'Dubbio tassonomico: didascalia Cape Town, fuori areale nominale Hystrix cristata',50:'Preparato museale',51:'Animale nutrito con dolci presso casa: vista alternativa disponibile',79:'Località Jombang e soggetto da verificare rispetto al taxon'}
already={c['target_key'] for c in json.load(open(B/'manifest.json'))['photos']};seen=set(already);first=[];plant=[];second=[];trees=[]
for c in cs:
 i=cs.index(c)
 if i in reject:continue
 if list((B/'originals').glob('*'+c['commons_sha1'][:8]+'.*')):continue
 ext=Path(urllib.parse.urlparse(c['sourceImage']).path).suffix
 c.update(index=i,id='pe2-natura-'+c['target_key'].replace(' ','-')+'-'+c['commons_sha1'][:8])
 c['original']=str((B/'originals'/(c['id']+ext)).relative_to(R))
 if c['target_group']=='animals':
  if c['target_key'] not in seen:first.append(c);seen.add(c['target_key'])
  else:second.append(c)
 elif c['target_group']=='plants':plant.append(c)
 else:trees.append(c)
(B/'download-plan.json').write_text(json.dumps(first+plant+second+trees,ensure_ascii=False,indent=2))
(B/'source-rejections.json').write_text(json.dumps([dict(index=i,source_title=cs[i]['source_title'],reason=r)for i,r in reject.items()],ensure_ascii=False,indent=2))
print(len(first),len(plant),len(second),len(trees))
