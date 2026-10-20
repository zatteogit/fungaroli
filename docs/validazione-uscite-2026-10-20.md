# Validazione delle uscite · 20 ottobre 2026

La verifica riguarda quattro oggetti distinti: arrivo auto, sosta, raccordo pedonale e percorso con ritorno. Un’intersezione fra sentiero e strada non dimostra un accesso automobilistico. Una geometria OSM connessa non dimostra un parcheggio, un diritto di transito o l’apertura attuale.

## Esito del lotto

- Audit di tutte le 202 voci del catalogo e delle 24 rotte auto. Ricevuta completa in `incoming/outing-validation-2026-10-20/audit.json`.
- Acquisite 32 relazioni OSM complete, candidate perché dotate di durata, lunghezze locale/intera coincidenti entro l’arrotondamento di 50 m e singola polilinea. Non è una soglia per creare raccordi o certificare tempi.
- 33 occorrenze hanno catena semplice connessa e corrispondenza geometrica controllata. La stessa relazione può essere presente in più zone. Un’ulteriore occorrenza, 401B in Terminillo Ovest, è un frammento e rimane da rivedere. Altre 168 voci non hanno questa verifica di geometria completa.
- Confronto bidirezionale dei vertici con i segmenti, estremi entro la tolleranza di semplificazione del catalogo: 15 m più 1 m di arrotondamento. Controllati anche restrizioni pedonali esplicite, condizioni/direzionalità, membri ripetuti o relazioni annidate. I casi non supportati rimangono da rivedere; l’assenza di tag restrittivi non è un’autorizzazione.
- Nessuna uscita completa parcheggio → raccordo → sentiero → parcheggio viene promossa a verificata. I 33 controlli positivi riguardano la rete del sentiero, non l’intera uscita.
- Le coordinate nominali e gli endpoint auto divergono di circa 203 m ad Antrodoco e 848 m a Rascino. Sono scarti in linea d’aria, non distanze pedonali. La destinazione utilizzata dal renderer resta l’endpoint effettivo della rotta, senza interpolare un raccordo.

## Pilota CAI 324, Ascrea → Fonte le Forche

[Parchi Lazio](https://www.parchilazio.it/montinavegnacervia-schede-18437-334_ascrea_mirandella_f_te_le_forche_cai) conferma identità attuale 324, 3,5 km, due ore di andata e partenza dalla scalinata presso il cimitero. Il 334 nel vecchio slug non è il segnavia corrente.

[OSM 11098449](https://www.openstreetmap.org/relation/11098449), relazione v8 del 18/07/2024 e quattro membri con proprie versioni/date, forma la catena completa. La geometria del catalogo corrisponde entro 14,89 m nella direzione fonte→catalogo e 0,59 m nella direzione opposta. Fonte e membri sono conservati senza attributi identificativi dei mapper; hash SHA-256 nella prova pubblica. L’inizio documentato, 42.1960641/12.996808, prevale sulle intersezioni in quota nella scelta dell’accesso auto.

Il ritorno proposto ripercorre **lo stesso sentiero al contrario**. `duration:backward=01:30` è una stima OSM, distinta dalle due ore istituzionali di andata. Subtotale del solo sentiero: **3 h 30 min e circa 7 km A/R**, senza soste e senza raccordo. Il totale dall’auto rimane `null`.

[CAI Roma, articolo del 25/03/2022](https://www.cairoma.it/?p=19638), descrive una sosta presso il cimitero per una gita diversa, con vecchia numerazione 334. Conferma solo una zona di sosta usata storicamente; non fornisce una posizione puntuale né disponibilità attuale. Le cinque ore dell’anello al Navegna **non** sono trasferite al 324.

Due letture OSM circoscritte, presso la partenza e nel paese di Ascrea, non hanno fornito un oggetto parcheggio utilizzabile per fissare la sosta. Non è prova che i parcheggi non esistano. Mancano la posizione effettiva del posto auto e il suo raccordo: nessun segmento di 23 m in linea d’aria viene pubblicato come percorso a piedi.

## App e agenti

La scheda espone quattro blocchi compatti: auto andata, sentiero andata, sentiero ritorno, sosta↔imbocco. Il subtotale A/R reca esplicitamente raccordo e soste esclusi. I dettagli espongono limiti e fonti. Le card usano A/R solo quando c’è la prova del ritorno; indicano «solo sentiero». Gli imbocchi generati aprono un punto OSM e non un navigatore auto.

Lo snapshot GET `/api/content/v1/snapshot`, in `resources.trails.zones[zoneId].trails[]`, espone:

- `routeValidation`: firma della geometria, identità/versioni delle fonti e membri, scarti di confronto, stato rete, sosta, raccordo e ritorno. `status=network_correspondence_checked` non significa uscita completa o sopralluogo.
- `outingAssessment`: `outboundMinutes`, `returnMinutes`, `trailRoundTripMinutes`, `trailRoundTripKm`, `walkingMinutes`, `parkingConnector`, `fieldValidation`. Nel lotto `walkingMinutes` è sempre `null` e `fieldValidation=false`.
- `return.geometryMethod=reverse_verified_trail` indica l’inversione della stessa unica polilinea controllata, non un anello distinto. La fonte del tempo è `duration:backward`. Una firma cambiata invalida ritorno e subtotale; il tempo deve corrispondere al tag fonte.

`routeValidation` è generato e protetto da PATCH CMS, come geometrie e valutazioni. Il contratto rifiuta stati completi non supportati. Gli agenti non devono utilizzare un subtotale del sentiero come durata dell’uscita, scalare le durate per chilometri, né raddoppiare automaticamente il tempo auto. I tempi auto sono dalla base selezionata e da una sola direzione; il ritorno auto resta da calcolare separatamente.

## Ripassare le fonti

`tools/fetch_outing_candidates.py` acquisisce le relazioni candidate con due richieste concorrenti e pausa; non pubblica né convalida accessi. `tools/validate_outing_network.py` analizza le acquisizioni locali e scrive dati/ricevuta; `node tools/audit_outing_routes.mjs` ricalcola la valutazione usata dalla UI. Prima della pubblicazione controllare i conflitti, le nuove versioni e la corrispondenza della geometria. Le prove del 324 sono legate alla firma già revisionata e non si trasferiscono a geometrie nuove.

## Verifiche del rilascio

15 test unitari mirati superati. Suite generale: 357 test, 346 superati, stessi 11 errori della produzione v250, confrontati per nome. Rapporti asset: nessuna incoerenza, nessun disegno da rifare; pendenze del catalogo invariate. Guardia design system e dry-run Wrangler superati. Verifica visiva della nuova scheda su mobile e desktop, con correzione dello stroke delle icone.

La suite browser Workerd resta distinta dai test supplementari sul Worker originale con SQLite Node; questi non dimostrano un esito verde dell’ambiente Cloudflare. Si applica l’autorizzazione già espressa da Matteo alla pubblicazione con i limiti preesistenti documentati. Esito della pubblicazione e verifica live registrati successivamente.

Verifica supplementare finale: **24 test browser superati**, mappa a 320/390/768/1280 px in chiaro/scuro e nuova scheda 324 a 320/390/1280 px. La suite Workerd completa è stata tentata nuovamente e si è fermata prima dei test con `spawn EBADF` di esbuild. Nel CMS online, prima del rilascio, `trails`, `zones` e `access` hanno bozza uguale al pubblicato e autore `release:repository-seed:discover-v1`: sono aggiornabili dal seed senza sovrascrivere bozze umane.
