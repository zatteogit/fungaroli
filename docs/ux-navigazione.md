# Navigazione: quando si apre la scheda, quando il pannello

Regole valide in tutta l'app. Se aggiungi un punto in cui si apre un fungo, un albero o una zona, segui queste.

1. **Scheda completa (pagina)** quando stai *esplorando*: elenco specie e alberi, ricerca generale, home, piano dell'uscita, pagine degli alberi, link "Scheda di …". Ha un indirizzo, il tasto indietro ci torna, si può condividere.
2. **Pannello contestuale** quando sei *a metà di un compito* e non devi perdere il punto: risultati di Riconosci (guidata o filtri), confronto tra sosia, zona sulla mappa. Vale uguale per commestibili e velenosi. La scheda contestuale di specie, albero o pianta usa lo stesso contenuto della pagina completa in modale, conservando la navigazione; mantiene un accesso esplicito alla pagina completa. I riquadri di zona/campione sulla mappa sono invece riepiloghi contestuali.
3. **Confronto affiancato** ovunque si parli di "si confonde con" o "non confonderlo con": dalla scheda di una specie (i suoi sosia), dal pannello o dalla pagina di un velenoso (i commestibili con cui si scambia). Resta fisso il fungo da cui parti.
4. **Lente = foto grande**, sempre. Il resto della card segue le regole 1 e 2.

Ridondanze tenute di proposito:
- pannello: accesso esplicito alla pagina completa, chiusura e ritorno al punto di partenza;
- card: tutta la card cliccabile *e* il nome sottolineabile (chi usa tastiera o lettore di schermo trova un link vero);
- confronto raggiungibile sia dalla scheda della specie sia dal pannello del velenoso (sono due punti di partenza diversi).


## Interessi dell’uscita — decisione del 16 ottobre 2026

Nella home la barra espone **Alla ricerca di… › Funghi / Piante / Sentieri**: sono interessi indipendenti, combinabili e ricordati tra home e mappa. «Alla ricerca di…» apre i filtri avanzati. Sotto compaiono **Poca gente / Accesso comodo / Vicino a casa**, con icona sostituita dalla spunta quando selezionati. «Poca gente» mantiene un testo fisso, come richiesto nella revisione finale. La navigazione Uscite, Mappa, Scopri e Taccuino resta la stessa.

Con Funghi attivo l’indice e l’ordine biologico restano esclusivamente fungini. Piante aggiunge gli spunti botanici nella stessa proposta e nella fascia delle specie; una selezione esplicita di piante restringe i percorsi a quelli con ambienti compatibili. Sentieri richiede un tratto mappato e abilita la ricerca pratica insieme agli altri interessi. Senza interessi selezionati si esplorano le proposte pratiche, senza indice. Non si sommano punteggi biologici diversi.

| Interesse | Home | Mappa e dettagli |
| --- | --- | --- |
| Funghi | Proposta con indice, altre uscite, scoperte e specie | Indice e habitat potenziale fungino con i limiti esistenti |
| Piante | Stesso ordine dei funghi: proposta, alternative, scoperte e specie; hero e card fotografiche condivise, con nome e fase indicativa | Spunti botanici associati agli ambienti campionati; nessuna densità, probabilità o posizione di presenza attribuita alle piante |
| Sentieri | Sentiero, difficoltà, tratto mappato, accesso e meteo; scoperte dopo la proposta, poi alternative | Zone, tracciati e imbocchi senza indice fungino |

### Stato e filtri

`fungaroli:prefs:v2` mantiene le chiavi precedenti, aggiunge `interests` e i filtri sui sentieri, e ripristina le selezioni separate di funghi e piante. Le preferenze sono locali al browser; non viene introdotta una sincronizzazione account. Un cambio di interessi conserva giorno, preferenze pratiche e selezioni delle altre attività. Azzera opera sugli interessi attivi e sui filtri pratici; conserva le specie degli interessi disattivati. Le vecchie preferenze `target` migrano nella selezione corrispondente.

Il pannello avanzato mostra gli interessi combinabili, ricerca e gruppi delle specie attive (funghi, piante o entrambi), filtri pratici e scoperte secondarie. Passeggiata non propone specie fungine. I filtri «Solo difficoltà T» e «Tratto nella zona entro 5 km» sono scelte pratiche, non soglie scientifiche; con filtro attivo un dato mancante non viene trattato come compatibile. I km del tratto nella zona non sono la lunghezza dell’intera uscita.

Per le piante, la selezione diretta è limitata ai profili con fase e calendario strutturati già disponibili. Il catalogo più ampio resta accessibile in Scopri e come osservazioni di ambiente. Non si creano calendari di raccolta dalla fioritura. Campioni del tracciato mancanti non sono sostituiti con quelli di un altro luogo.

L’ordinamento pratico di piante e passeggiate considera prima il meteo, poi il contesto botanico nella modalità piante, le preferenze attivate e il giorno. L’ordine residuo è alfabetico e non costituisce una graduatoria scientifica. I punteggi botanici interni servono a ordinare, non sono presentati come indici fungini. Durante aggiornamenti meteo la home conserva l’ordine delle zone già lette; una scelta esplicita ricalcola l’ordine.

### Stagione e ripristino

Per una ricerca con un solo interesse, all’apertura e al cambio giorno, se **tutta** la selezione ricordata è fuori dai calendari documentati in tutti i giorni mostrati, il filtro sulle specie viene tolto. Se l’intera attività non ha specie nel calendario, si passa a Passeggiata. La dialog spiega il cambiamento e permette di ripristinare la scelta; finché non cambia attività resta anche il comando nella home. La scelta sospesa è conservata separatamente.

Un calendario sconosciuto, un indice basso, meteo mancante o dati incompleti non bastano per sospendere. Il periodo è indicativo: clima e quota possono spostarlo. La scelta esplicita, anche fuori calendario, viene rispettata; il ripristino è ricordato per quel mese e quella selezione. Non si riattiva silenziosamente un filtro alla stagione successiva. Passeggiata non viene sospesa per stagione. Senza meteo, piante e passeggiate restano esplorabili con disponibilità meteo dichiarata, senza valori inventati.

### Verifica

Test unitari dedicati a calendari parziali/sconosciuti e finestre tra mesi, filtri con dati mancanti, separazione dell’ordinamento pratico dall’indice. Test browser per persistenza, dialog/ripristino, tre intenti, ordine delle fasce, nessun indice fungino in piante/passeggiata, assenza di meteo, larghezze 320/390/768/1280 e temi chiaro/scuro, mappa schematica e Leaflet. La pubblicazione richiede comunque la suite completa prevista in AGENTS.md.

### Rifiniture del 16 ottobre

Funghi, Piante e Passeggiata usano `homeCover` per la stessa struttura della hero. Quando Funghi è selezionato compare l’anello dell’indice; Piante mostra lo spunto e il periodo indicativo, senza attribuire presenza certa. Le card delle alternative riportano giorno, luogo, difficoltà e km del tratto mappato; i dettagli sono nella scheda. Le eventuali allerte meteo restano visibili. Le etichette degli interessi restano Funghi/Piante/Sentieri anche su schermi stretti.

Calendario centrato quando non scorre; bordi delle righe sfumati sul contenuto; pannello livelli sopra i filtri della mappa. Il glossario riparte dall’inizio, salvo link a un termine preciso. La ricerca mostra Cmd+K su Mac e Ctrl+K sulle altre piattaforme. Senza scelta del tema si segue il dispositivo.

Se manca una foto del luogo, Piante e Passeggiata usano come ripiego la foto di una specie associata al percorso (prima una pianta o un albero, secondo l’intento). La foto non è attribuita al luogo. Un segnaposto neutro copre anche l’assenza di immagini e gli errori di caricamento, senza spostare testi o controlli.

### Spunti botanici sulla mappa

La foglia indica spunti botanici disponibili per gli ambienti del percorso; il pannello mostra specie e fase, anche insieme ai funghi. Non si mostrano conteggi «0 spunti» o un indice delle piante. Una sola nota richiusa in legenda spiega copertura parziale, calendari indicativi e differenza dagli avvistamenti confermati. L’assenza di uno spunto non è presentata come assenza della specie. I percorsi rispettano gli stessi interessi e filtri della home.

### Mappa: scegliere, confrontare, approfondire — 17 ottobre

La carta occupa tutto lo spazio disponibile. In alto restano due comandi: riepilogo degli interessi/filtri e giorno. La dialog conserva gli stessi interessi combinabili della home; specie e caratteristiche dei sentieri sono sezioni richiuse. Le preferenze pratiche spiegano che modificano l’ordine dell’elenco, non l’indice fungino.

L’elenco richiudibile mostra solo le zone il cui centro è nell’area inquadrata. Una riga contiene luogo, eventuale indice fungino, tempo in auto e difficoltà/km del tratto locale quando documentati. Spostando la carta si aggiorna l’elenco; cambiando filtri si conserva l’inquadratura. «Mostra tutte le zone» cambia esplicitamente l’inquadratura. Si distinguono un’area senza zone e filtri senza corrispondenze.

Il calendario seleziona la data: non mostra un indice o meteo unico per tutta la mappa. Giorno e mese sono nell’etichetta accessibile; Oggi, Domani e i nomi dei giorni sono distinti. Meteo e indice restano dati del singolo luogo. Senza previsioni si possono comunque aprire zone e sentieri, senza un valore numerico inventato. Lo stato del meteo è compatto, con spiegazione su richiesta.

Etichette e righe aprono lo stesso riepilogo della zona; il riepilogo nasconde l’elenco. Avvicinandosi restano disponibili campioni di habitat, tracciati e imbocchi. La legenda è dentro Livelli. I vincoli «Solo difficoltà T» e «entro 5 km nel tratto locale» escludono anche dati mancanti e valgono indipendentemente dall’interesse Sentieri.

Analisi, misure e procedura di cattura: [audit della mappa](ux-mappa-2026-10-17.md).

L’accordion «Quando» ha una sola testata: arrivo consigliato, affollamento e sintesi meteo, con le condizioni avverse visibili anche da chiuso. L’apertura aggiunge partenza, luce e orari di raccolta, ambito delle previsioni ed eventuale alternativa. Metodo e motivi delle stime restano in una nota richiusa; arrivo e badge non vengono ripetuti nel corpo.
