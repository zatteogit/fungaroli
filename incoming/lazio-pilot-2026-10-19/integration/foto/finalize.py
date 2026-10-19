import json
from pathlib import Path
P=Path(__file__).parent
approved=json.load(open(P/'approved.json'));ids={r['pageid'] for r in approved};zones=json.load(open(P.parent/'zone-seeds.json'))['zones'];done={r['zoneId'] for r in approved}
reasons={
'monte-rufeno-felceto':'Panorama Monte Rufeno ripreso dal lontano Amiata; georicerca riporta prevalentemente centro abitato/museo Acquapendente. Cerro trovato in un giardino attrezzato. Nessuna copertina del bosco Felceto sufficientemente rappresentativa.',
'tuscolo-nord':'Candidato locale Tuscolo/Unsplash mostra sagoma di fotografo al tramonto, cielo dominante: non rappresenta il bosco. Altri risultati ville, danni storici e centro abitato.',
'cervara-prataglia':'Risultati Cervara: borgo/monumenti, non il bosco Prataglia. Ricerca Prataglia produce anche Foreste Casentinesi, luogo sbagliato, escluso.',
'lepini-bassiano-santangelo':'Risultati: cavallo in primo piano, documentazione geologica o vista aerea di Latina. Nessuna copertina del bosco Sant’Angelo/Semprevisa convincente.',
'ausoni-san-vito':'Nessuna fotografia della Sughereta di San Vito con licenza individuale e corrispondenza locale verificabili trovata nelle ricerche eseguite.',
'aurunci-itri-campello':'Foto vicina (4,8 km) mostra un pendio/strada in nebbia, fonte dice soltanto Monti Aurunci. Il legame con Valle di Itri/Campello resta troppo debole. Altri risultati villa o neve in quota.',
'lepini-supino-santaserena':'Panorama reale Santa Serena troppo sottile: ritaglio per copertina rivela tende e auto e risoluzione utile soltanto 585×390. Geopanorama contiene annotazioni geologiche. Entrambi scartati.',
'simbruini-filettino-fiumata':'Paesaggi/pascoli Simbruini entro 4,5 km non localizzati con sufficiente precisione a Fiumata/Fosso Acqua Corore; niente uso di foto dei vicini Campo Staffi senza corrispondenza provata. Fiumata nelle ricerche nominali spesso è il Lago del Salto, escluso.'}
pending=[dict(zoneId=z['id'],status='photo_pending',reason=reasons.get(z['id'],'Nessuna fotografia approvata.'),fallback='Copertina neutra proposta; nessuna fotografia di altro luogo.') for z in zones if z['id'] not in done]
(P/'pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2))
allrows=[]
for name in ['acquired.json','more-acquired.json','geo-selected-acquired.json']:
 for r in json.load(open(P/name)):
  if r.get('pageid') in ids:continue
  row={k:r.get(k) for k in ['pageid','title','page','query','zoneId','license','licenseUrl','local','error'] if r.get(k) is not None}
  if r.get('local'):
   row['status']='not_selected_after_contact_sheet_review'
   text=(r.get('title','')+' '+r.get('description','')).lower()
   if any(t in text for t in ['badia prat','casentin','lago del salto','petrella salto']):reason='Luogo diverso dalla zona candidata: esclusa.'
   elif any(t in text for t in ['museo','palazzo vescovile','palmatorie','algardi','calzari']):reason='Oggetto, museo o opera: esclusa dalla copertina naturale.'
   elif r.get('pageid')==85146480:reason='Mappa/cartografia, non fotografia del bosco.'
   elif r.get('pageid') in [39247465,79422208]:reason=reasons['lepini-supino-santaserena']
   elif r.get('pageid')==61876711:reason=reasons['tuscolo-nord']
   elif r.get('pageid')==90892238:reason='Monte Rufeno fotografato dalla cima del Monte Amiata: punto di ripresa molto lontano, paesaggio poco leggibile come bosco locale.'
   elif any(t in text for t in ['ragnatela','chrysomela','mixomicete','cavallo rosello']):reason='Soggetto specialistico o animale in primo piano: non rappresentativo del bosco.'
   else:reason='Non scelta rispetto alla copertina approvata della stessa area, oppure soggetto/composizione/localizzazione insufficienti; nessuna integrazione.'
   row['reason']=reason
  else:row['status']='not_acquired_or_metadata_filtered';row['reason']=r.get('screen',r.get('error','Formato, dimensione o licenza fuori filtro; nessuna approvazione visiva.'))
  allrows.append(row)
(P/'rejected-and-not-selected.json').write_text(json.dumps(allrows,ensure_ascii=False,indent=2))
(P/'README.md').write_text(f'''# Copertine Lazio — 19 ottobre 2026

{len(approved)} copertine reali selezionate dall’agente foto, in attesa di revisione indipendente del coordinatore. {len(pending)} zone senza foto: `pending.json`. Nessuna fotografia condivisa fra zone, nessuna immagine generata o variante stagionale/meteo.

- `approved-contact-sheet.jpg`: tutte le copertine effettivamente esportate, viste dopo ritaglio.
- `review.html`: etichette, localizzazione e crediti. Aprire dalla cartella del repository per i percorsi relativi.
- `approved.json`: autore, pagina, licenza, originale, hash SHA-256 acquisito, file esportati e hash, motivazioni locali e crop.
- `rejected-and-not-selected.json`: scarti e risultati non adottati, distinti da mancata acquisizione o filtri metadati.
- `geo-review.jpg`, `partial.jpg` e `candidates-*.jpg`: provini reali, non tutti approvati. Le foto Casentinesi/Fiumata al Salto sono escluse, non materiali per queste zone.

Esportazione WebP: lato lungo massimo 600, HD 1600, miniatura 240, qualità 85; nessun upscaling. EXIF orientamento corretto. Originali verticali o panoramici estremi ritagliati 3:2 prima dell’esportazione. Punti CSS per i sei formati registrati per ciascun asset; nessun ritocco creativo. Dimensioni utili effettive nel manifest.

Fonti: metadati Wikimedia Commons per singolo file con licenza CC BY/CC BY-SA o pubblico dominio con dichiarazione di copyright assente conservata negli extmetadata; originali scaricati soltanto dopo lettura della licenza. Gli originali conservati in `originals/` servono alla verifica locale; pubblicare soltanto gli asset derivati e i crediti. HTTP 429 affrontati riducendo frequenza delle richieste; nessun proxy o aggiramento.

Le fotografie rappresentano boschi, paesaggi o dettagli locali: non certificano un accesso, lo stato attuale di sentieri o il diritto di raccolta. I limiti specifici (panorama Monte Cavo, foresta condivisa Circeo, Vedute Livata) sono dichiarati per ogni voce. Non ho avviato suite, test, CI, dry-run o pubblicazione.
''')
print('approved',len(approved),'pending',len(pending))
