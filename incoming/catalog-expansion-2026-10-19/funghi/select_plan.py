import json,pathlib,urllib.parse
B=pathlib.Path(__file__).resolve().parent
p=json.load(open(B/'photo-plan.json')); by={x['id'].rsplit('-',1)[-1]:x for x in p['photos']}
selection={
'amanita-citrina':['1144171','35484839','63054929'],
'paxillus-involutus':['16097960','4558768'],
'coprinopsis-atramentaria':['35546872','22502531'],
'clitocybe-nebularis':['99481471','84242752','53537315'],
'russula-emetica':['404973','63737437'],
'lycoperdon-perlatum':['84478911','372210'],
'auricularia-auricula-judae':['145517351','124675179'],
'fomes-fomentarius':['79262934','129874400'],
 'trametes-versicolor':['132597918','3891548'],
'hygrophorus-russula':['84179972','93766111'],
'lactarius-sanguifluus':['95428903','95428891'],
'russula-vesca':['121831228','156995528']}
roles={
'amanita-citrina':['Intero con base bulbosa e anello: verificare che entrambi restino leggibili.','Vista complementare lamelle/anello/base: mantenere solo se mostra un particolare aggiuntivo.','Sviluppo giovane esplicitamente dichiarato dalla descrizione; verificare visibilità e differenza dalle altre.'],
'paxillus-involutus':['Intero con margine involuto; verificare dettaglio e fedeltà cromatica.','Vista inferiore con lamelle decorrenti; scartare se ripete solo il cappello.'],
'coprinopsis-atramentaria':['Cespo e forma del cappello; verificare sfondo e integrità.','Dettaglio lamelle scure/deliquescenti se visibile; nessuna fase aggiunta in assenza di attestazione.'],
'clitocybe-nebularis':['Focus stack dichiarato: verificare intero, gambo/base e possibili artefatti.','Habitat fra foglie di faggio documentato; tenere solo se soggetto e lamelle sono leggibili e complementari.','Sviluppo giovane dichiarato nella descrizione; non dedotto dalla sola forma.'],
'russula-emetica':['Intero europeo con cappello e gambo; controllare bene esposizione del rosso.','Particolare lamelle/base se presente; altrimenti non tenere due scatti uguali.'],
'lycoperdon-perlatum':['Focus stack dichiarato: privilegiare aculei conici leggibili a scala UI.','Intero con restringimento basale; mantenere solo se aggiunge una vista diversa.'],
'auricularia-auricula-judae':['Focus stack su Sambucus: verificare venature e superficie del corpo fruttifero.','Vista complementare della superficie opposta/attacco al legno, se realmente visibile.'],
'fomes-fomentarius':['Portamento sul tronco; non accettare gruppi troppo lontani.','Pori o stratificazioni in dettaglio se presenti; altrimenti cercare sostituzione.'],
 'trametes-versicolor':['Cappelli a fasce concentriche, contorni nitidi e colore fedele.','Superficie inferiore poroide se presente; non approvare seconda foto soltanto per risoluzione.'],
'hygrophorus-russula':['Cappello vinoso e gambo intero: evitare esemplari molto deteriorati.','Lamelle macchiate di vinoso se presenti; non mantenere un altro cappello simile.'],
'lactarius-sanguifluus':['Intero e lamelle; stesso evento francese documentato.','Dettaglio di latice o lamelle se presente, verificando che non sia quasi duplicato della prima.'],
'russula-vesca':['Intero e margine della cuticola; controllare nitidezza del carattere.','Margine e lamelle in dettaglio se visibili; scartare seconda vista ridondante.']}
short=[]
for k,ids in selection.items():
 for n,id in enumerate(ids):
  x=by[id].copy();x['role_required']=roles[k][n];x['role_observed']=None;x['selection_reason']='Provenienza europea attestata nel testo/categorie, nome esatto attestato in descrizione o categoria tassonomica; immagine ancora da vedere.'
  x['taxon_attestation']={'expected':x['latin'],'description':x['source_description'],'categories':[c for c in x['source_categories'] if x['latin'].lower() in c.lower()]}
  x['original']=str((B/'originals'/(x['id']+pathlib.Path(urllib.parse.urlparse(x['sourceImage']).path).suffix.lower())).relative_to(B.parents[2]))
  if id in ['63054929','53537315']:x['growth_stage']='giovane';x['stage_reason']='Descrizione del singolo file: '+x['source_description']
  short.append(x)
# Round-robin, first one per new card, then complementary views, finally explicitly documented young views.
short.sort(key=lambda x:selection[x['target_key']].index(x['id'].rsplit('-',1)[-1]))
json.dump({'status':'shortlist metadata, non approvata visivamente','photos':short,'max_per_taxon':3,'maximum_downloads':len(short),'note':'Ruoli richiesti sono obiettivi di revisione, non parti già osservate. Dopo la visione scartare ridondanze e scatti deboli senza quota da riempire.'},open(B/'download-plan.json','w'),ensure_ascii=False,indent=2)
print(len(short),'shortlisted')
