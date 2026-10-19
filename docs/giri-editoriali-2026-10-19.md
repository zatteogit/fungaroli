# I giri di Matteo · primo esperimento pubblico

Richiesta di Matteo del 19 ottobre 2026: provare giri sociali ispirati al passaggio percorso salvato → uscita → ricordo di Komoot, iniziando con esempi simulati firmati «Matteo · Redattore Fronda».

## Comportamento introdotto

Tre proposte nella home e nell’elenco pubblico `#/giri`, trovabili anche dalla ricerca. Ogni giro ha un URL stabile, firma, copertina, racconto, momenti dell’uscita, schede di funghi da consultare e dati pratici del sentiero.

«Giro simulato» è visibile su card e pagina e compare nel messaggio condiviso. I testi non documentano attività svolte, meteo, avvistamenti o raccolti. Non alimentano segnalazioni, indice, statistiche community o presenze. Le schede suggerite sono materiale da leggere, non specie segnalate sul percorso.

«Salva questo giro» crea nel taccuino privato un solo segnalibro per proposta, anche se salvato in giorni diversi. «Ci sono stato» apre il compositore guidato: luogo e riferimento al sentiero sono disponibili, mentre funghi, fatica, durata e nota restano da compilare. L’aver seguito il sentiero non è preselezionato. Cambiando luogo si rimuovono percorso e provenienza editoriale. Il giro personale conserva il collegamento alla proposta, distinto dall’eventuale percorso seguito.

«Passalo in chat» usa la condivisione del dispositivo e, se indisponibile, un messaggio copiabile. Il link punta alla pagina pubblica, senza ID di pagine private o parametri della pagina corrente. Nessun messaggio è inviato automaticamente. Nessuna API Meta è stata attivata. Gli URL con hash non offrono ancora anteprime fotografiche specifiche per ciascun giro nelle chat: resta uno sviluppo distinto, lato server.

## Percorsi e fonti

Fonte numerica: [CAI Lazio, riepilogo rete sentieristica, stampato il 13 luglio 2022](https://cailazio.org/wp-content/uploads/2019/06/Riepilogo-generale-pubblicazione-AREE.pdf). I numeri delle pagine sono quelli del PDF, a partire da 1.

| Proposta | Sentiero CAI | Dati riportati | Pagina | Relazione OSM già nel catalogo |
| --- | --- | --- | --- | --- |
| Il Tancia, a passo lento | 355A, Cresta di Monte Tancia | 4,9 km · 2 h 20 min · E | 27 | 12252649 |
| Rascino, fra bosco e spazi aperti | 489, Ollanette–Monte Vignole–Uscertu | 7,5 km · 3 h · E | 10 | 12460968 |
| Sulla Laga, un giro per imparare | 363, Villa San Cipriano–Serreripa | 3 km · 1 h 30 min · T | 2 | 12315286 |

Le geometrie sono i tratti OpenStreetMap già presenti in `data/trails.json`: non tracce GPS registrate da Matteo e non necessariamente l’intero itinerario. Lo schema conserva le proporzioni ma non ha fondo cartografico. Copyright OSM e licenza ODbL collegati nella pagina.

Quando CAI e catalogo OSM differiscono, questi esempi riportano esplicitamente i numeri CAI senza modificare il catalogo esistente. In particolare, per il 489 OSM riporta un tempo di 2 h 10 min, diverso dalle 3 h CAI. Non sono presentati come anelli; il rientro va organizzato. La fonte del 2022 non attesta accessibilità o condizioni attuali. «Prepara questa uscita» apre il vero sentiero nella relativa zona con giorno modificabile.

## Fotografie

Riutilizzate le foto originali del catalogo luoghi, con autore, licenza e fonte. Nessuna nuova immagine generata; nessuna copertina stagionale artificiale attribuita al giro.

- Tancia: [faggeta dei Monti Sabini](https://commons.wikimedia.org/wiki/File:Beech_Forest_in_the_Sabina_Hills,_Latium,_Italy_-_52993979506.jpg), Christoph Strässler, CC BY-SA 2.0.
- Rascino: [Rascino](https://commons.wikimedia.org/wiki/File:Rascino.jpg), Sabina Trekking ASD, CC BY-SA 3.0.
- Laga: [Pizzo di Sevo](https://commons.wikimedia.org/wiki/File:Pizzo_di_Sevo.jpg), Mario1952, CC BY-SA 3.0. È un paesaggio dell’area, non una fotografia attestata del tratto Villa San Cipriano–Serreripa.

Ogni copertina è dichiarata foto di contesto; i crediti indicano anche l’adattamento per il catalogo.

## Gestione e limiti

La raccolta è versionata in `data/editorial-outings.json`, distinta da utenti, taccuini e dati di campo. Non è ancora una collezione modificabile dal CMS. Nessun profilo sociale, follower, like o commento è stato simulato.

Componenti: `js/editorial-outings.js`, `css/editorial-outings.css`; collegamenti in home, router e ricerca di `js/app.js`. Il normalizzatore condiviso del taccuino ammette anche riferimenti `#/giri/<id>`; nessuna migrazione del database. Shell e versione HTML aggiornate insieme a v236.

## Riscontri manuali

Nessuna suite, test unitario, dry-run o suite CI avviata, come richiesto da Matteo. Controllati sintassi JavaScript e differenze Git.

Nel browser isolato locale: tre card in home ed elenco, apertura delle tre pagine, dati CAI, crediti, schemi OSM e destinazioni «Prepara questa uscita». Ricerca «Matteo» restituisce le tre proposte. Verificati salvataggio privato, persistenza dopo ricarica e assenza di duplicati; completamento guidato senza dettagli immaginari ereditati. La verifica con dati personali di esempio è rimasta nel browser locale, senza scritture autenticate al servizio pubblico.

Controllato il messaggio copiabile: titolo, autore, simulazione e URL pubblico, senza parametri della pagina corrente. Nessun invio a chat eseguito. Condivisione nativa predisposta ma non verificata con un invio a un’app esterna.

Ispezionate schermate desktop, telefono 390 px e variante 320 px, temi chiaro e scuro. Il rapporto asset non rileva incoerenze o mancanze non elencate; restano le pendenze preesistenti del catalogo. Il server statico locale non serve le API meteo/autenticazione: la verifica della pagina pubblica pubblicata va registrata dopo il rilascio.
