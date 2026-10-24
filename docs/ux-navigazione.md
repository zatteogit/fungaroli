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

Nella home la barra espone **Alla ricerca di… › Funghi / Piante / Sentieri**: sono interessi indipendenti, combinabili e ricordati tra home e mappa. «Alla ricerca di…» apre i filtri avanzati. Sotto compaiono **Poca gente / Accesso comodo / Vicino a me**, con icona sostituita dalla spunta quando selezionati. «Poca gente» mantiene un testo fisso, come richiesto nella revisione finale. La navigazione Uscite, Mappa, Scopri e Taccuino resta la stessa.

Con Funghi attivo l’indice e l’ordine biologico restano esclusivamente fungini. Piante aggiunge gli spunti botanici nella stessa proposta e nella fascia delle specie; una selezione esplicita di piante restringe i percorsi a quelli con ambienti compatibili. Sentieri richiede un tratto mappato e abilita la ricerca pratica insieme agli altri interessi. Senza interessi selezionati si esplorano le proposte pratiche, senza indice. Non si sommano punteggi biologici diversi.

| Interesse | Home | Mappa e dettagli |
| --- | --- | --- |
| Funghi | Proposta con indice, altre uscite, scoperte e specie | Indice e habitat potenziale fungino con i limiti esistenti |
| Piante | Stesso ordine dei funghi: proposta, alternative, scoperte e specie; hero e card fotografiche condivise, con nome e fase indicativa | Spunti botanici associati agli ambienti campionati; nessuna densità, probabilità o posizione di presenza attribuita alle piante |
| Sentieri | Sentiero, difficoltà, tratto mappato, accesso e meteo; scoperte dopo la proposta, poi alternative | Zone, tracciati e imbocchi senza indice fungino |

### Home a settimana, giorni senza copertina, pagina stabile — decisioni del 24 ottobre 2026

Supera, dove contrasta, la sezione del 21/10 qui sotto (passaggio automatico a domani).

- **Avvio su «Questa settimana».** La home si apre sulla settimana, con la copertina: la migliore uscita del periodo. Le proposte di oggi già fuori orario non entrano. Il giorno non passa più da solo a domani: il caso «tardi» resta su Oggi, quando l'utente lo sceglie. A mezzanotte un giorno scelto e ormai passato torna alla settimana.
- **Giorni singoli senza copertina.** Oggi, Domani e gli altri giorni mostrano un'intestazione compatta (giorno, numero di uscite, «Torna alla settimana») e la classifica completa a card. Se la prima è anche la copertina della settimana, la card lo dice: «La migliore della settimana». Così cambiare giorno non ripete la stessa foto grande.
- **Stabilità mentre arrivano i dati** (`js/view-stability.js`). Ogni dato ha una freschezza: fresco sotto 1 ora; datato ma valido fino a 3 ore per il meteo dell'uscita e 24 ore per l'indice di crescita; poi scaduto.
  - Dato fresco: card normale. Dato datato mentre arriva il nuovo: un segno discreto «in aggiornamento» sui soli valori che dipendono dal meteo (anello, meteo). Dato assente o scaduto: copertina e card in caricamento, con la stessa misura di quelle vere.
  - Dati nuovi che cambiano solo i numeri (stessa copertina, stesso ordine delle prime tre): si aggiornano al loro posto.
  - Dati nuovi che cambierebbero la proposta (copertina, ordine delle prime tre, o la proposta che sparisce): la pagina non si ridisegna. Compare «Meteo aggiornato: cambiano le proposte · Aggiorna». Eccezione di sicurezza: le card visibili che passano a «sconsigliata» o a temporali sono segnate subito («Meteo peggiorato»), senza spostarle.
  - Pagina appena aperta (meno di 2 secondi e nessuno scorrimento): i dati nuovi si applicano direttamente.
  - Mappa: con l'elenco aperto vale la stessa regola («Meteo aggiornato: cambia l'ordine · Aggiorna»); i segnaposto sulla carta si aggiornano al loro posto.
- **Spiegazione dell'indice.** Dalle etichette «Condizioni … 0–10» la spiegazione si apre nel flusso, sotto l'etichetta, e sposta il contenuto invece di coprirlo. Gli anelli dei numeri usano ancora la bolla.
- **Fasce.** «Un bosco, tante esperienze» compatta diventa tre vignette in riga (Vedi, Racconta, Condividi) con «Come funziona la condivisione». La frase del giorno è una citazione editoriale: fondo calendula leggero, virgolette come decoro, serif più ampio, senza riquadro bianco.

### Home quando per oggi è tardi — decisione del 21 ottobre 2026

Decisione di Matteo: si applicano insieme le varianti A e B della revisione degli stati della home. **Supera** la regola precedente «il giorno della home resta oggi fino a una selezione esplicita» ([ux-home-condizioni.md](ux-home-condizioni.md), § Integrazione).

- **B · passaggio automatico.** Quando tutte le proposte di oggi hanno superato l’ultima partenza utile (con i funghi accade già dalle 9:30 circa), la home passa da sola al prossimo giorno utile, di solito domani, con gli stessi criteri della prossima occasione. In alto una riga breve: «Oggi è tardi per partire: l’ultima partenza utile era alle H:MM» e il comando «Torna a oggi». L’orario è il più tardo fra quelli di oggi (`practicalTiming(...).departure`). Senza un altro giorno utile la home resta su oggi e mostra la card A.
- **A · card unica su Oggi.** Se l’utente torna a «Oggi», il riquadro della home è una card sola: «Oggi è tardi per partire» con l’orario, poi la prossima occasione con foto del luogo, giorno («Domani · giovedì 22»), nome, Condizioni (solo Funghi), meteo, arrivo e «Vedi domani →». Senza giorno utile: «Nei prossimi 7 giorni non emerge un’altra data favorevole». Stessa struttura per condizioni basse, meteo sfavorevole e proposte da valutare. Il testo segue la regola d’orario effettiva: «per arrivare nel bosco in mattinata» oppure, per Piante e Sentieri con durata del cammino nota, «per completare il cammino prima del tramonto» (tramonto meno durata). Fatto verificato il 21/10: oggi `assessWalkingRoute` restituisce sempre `walkingMinutes: null` (`js/outing-route.js`), quindi anche Piante e Sentieri usano l’arrivo in mattinata e mostrano quel testo. Decisione di Matteo del 24/10: resta così finché il tratto dal parcheggio all’imbocco non è verificato (oggi nessuno dei 202 sentieri lo ha).
- **Scelta manuale.** Una data scelta dall’utente non viene sovrascritta. A mezzanotte la data scelta resta la stessa (domani diventa oggi); una data ormai passata torna alla scelta automatica.
- **Quando si ricalcola.** All’avvio, a mezzanotte, al ritorno da una sospensione e quando l’utente cambia interessi o filtri. Gli aggiornamenti del meteo e il timer non spostano il giorno sotto gli occhi di chi legge; finché il primo meteo è in arrivo la scelta resta aperta.
- **Accessibilità.** La riga è testo normale fuori dalla regione `aria-live` della proposta: niente annunci aggiuntivi. Il calendario porta in vista il giorno scelto anche dopo il passaggio automatico.
- **Calendario.** Il chip «Oggi» mostra «tardi» al posto del meteo quando non c’è più una partenza utile. Il chip «Settimana» mostra solo l’intervallo, senza raggio e senza troncamento.
- **Riga del meteo.** Una riga: «Meteo delle HH:MM · da aggiornare» e «Aggiorna». Zone mancanti e aggiornamento parziale sono in «Dettagli»; la copia scaduta resta in vista. Senza meteo e senza copia il riquadro dice tutto e offre un solo «Riprova».
- **Prossima occasione.** «Nessuna data favorevole» è distinta da «dati insufficienti»: «Senza meteo aggiornato non possiamo indicare un altro giorno». Se il riquadro dice già che mancano i dati, la riga si omette.
- **Stati senza proposta.** Dopo il riquadro: Luoghi del Lazio, la guida pertinente (per esempio la pioggia), un solo «Come funziona» compatto («Come funziona la condivisione»), la frase del giorno, poi il resto.

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

Calendario centrato quando non scorre; bordi delle righe sfumati sul contenuto; pannello livelli sopra i filtri della mappa. Il glossario riparte dall’inizio, salvo link a un termine preciso. La ricerca mostra Cmd+K su Mac e Ctrl+K sulle altre piattaforme. Senza scelta del tema si segue il dispositivo. Il ciclo del pulsante parte dal tema visibile all’avvio: chiaro → scuro → automatico → chiaro; partendo da scuro: scuro → chiaro → automatico → scuro. Anche con Automatico iniziale il primo tocco cambia aspetto. Se il sistema cambia mentre è attivo Automatico, il ciclo riparte dal nuovo tema visibile. Le icone dell’header hanno area tattile minima 44 × 44 px anche a 320 px, con nome accessibile che anticipa il prossimo tema.

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

### Barra mobile e transizioni iOS

Le quattro icone di navigazione sono SVG inline già presenti nell’HTML, con colore ereditato dal pulsante. Non vengono sostituite all’avvio e non usano maschere CSS esterne. Il cambio di selezione non anima scala o posizione delle icone; la snapshot della barra mantiene opacità piena e composizione normale durante le transizioni della pagina.

La barra mantiene il posizionamento fisso e un proprio livello di composizione. Su iPhone e iPad le transizioni di pagina tramite snapshot sono disabilitate come mitigazione del distacco segnalato dopo lo scroll; restano le microanimazioni CSS. Non vengono aggiunte correzioni manuali al bordo inferiore tramite VisualViewport. La tastiera continua a nascondere la barra durante l’inserimento e a ripristinarla alla chiusura.

I controlli automatici coprono scroll, ridimensionamento, cambio pagina e ciclo tastiera simulato in Chromium. La conferma su Safari reale resta necessaria: nell’ambiente di lavoro il download del motore WebKit è bloccato dal proxy.

### Lettura a colpo d’occhio

Mostrare prima il dato o l’indicazione sintetica; spiegazioni estese solo su richiesta. Sintesi informative distinte dai filtri selezionabili. Per le regole di raccolta, riquadri con valore e contesto breve aprono il testo integrale della singola regola; fonti e norme complete restano in Info. Evitare muri di testo e accordion annidati.

Le sezioni richiuse devono anticipare il contenuto con titolo specifico e dati o elementi principali. Evitare contenitori generici come «La zona»: paesaggio e alberi, accessi e soste, composizione dei boschi e crediti delle foto hanno destinazioni distinte.

**Transizione chiuso → aperto, 19 ottobre.** Progettare i due stati come lo sviluppo dello stesso contenuto: titolo, specie e dati essenziali restano nella testata, nello stesso ordine. L’apertura aggiunge il contesto sotto; non ripete il riepilogo. Gli avvisi con un titolo breve passano dalla sintesi al testo integrale nello stesso riquadro, conservando etichetta e gravità; quelli senza sintesi restano completi anche da chiusi. Il chevron comunica la chiusura senza aggiungere «Chiudi dettagli». In «Cosa osservare», piante e alberi sono una sezione leggibile nel corpo aperto, senza un secondo accordion. L’apertura conserva la posizione della testata, anche quando richiude una sezione precedente.

**Indice fungino, 19 ottobre.** Le raccolte di card con un numero fungino hanno una legenda comune subito sotto: simbolo del fungo, «Indice funghi · 0–10» e «Condizioni di crescita stimate». La spiegazione raggiungibile esplicita che è una scala sperimentale, non una probabilità di ritrovamento. La legenda segue anche elenco e riepilogo della mappa, piano dell’uscita e zone nella scheda del fungo. Non compare nelle raccolte prive di indici, comprese le proposte solo botaniche.

### Inquadratura della mappa

Al primo ingresso si inquadrano le zone compatibili con i filtri, comprese le loro aree; un link a una zona inquadra direttamente quella. Cerchi, etichette ed elenco usano lo stesso movimento breve e considerano testata, barra di navigazione e scheda aperta. Niente volo iniziale o ricentratura durante aggiornamenti meteo, filtri, cambio giorno e ritorno alla mappa. «Mostra tutte le zone» ripristina esplicitamente la panoramica. I campioni selezionano la zona di appartenenza; il dettaglio compare a movimento concluso.

### Taccuino: indice e pagine

L’indice `#/diario` mostra card sintetiche con data, luogo, due righe di testo e pochi dati strutturati. Ogni card apre una pagina `#/diario/pagina/<id>`: testo completo, scheda collegata, dati di campo e azioni. Modifica, copia, eliminazione e condivisione stanno nel dettaglio. Il ritorno conserva ricerca e filtro. Le fotografie di catalogo sono dichiarate come tali e rimandano alla scheda con i crediti.

“Diario di prova” apre `#/diario/esempio`, con 14 pagine fittizie e dettagli navigabili. Gli esempi restano esclusivamente nel renderer: non vengono scritti nello storage, esportati, passati alla personalizzazione o inviati alla community. Nel dettaglio reale, quando l’osservazione è condivisibile, uno switch mostra il consenso alla condivisione con community Fronda; il testo resta privato.

### Testata della home durante lo scroll

Su telefono e tablet, quando «Dove andare» supera la barra superiore, il titolo
compatto e il comando Filtri sostituiscono logo e azioni generali. La barra resta
visibile in entrambe le direzioni di scroll, come nelle viste operative; non si
aggiunge un secondo blocco sticky con calendario e preferenze. Tornando sopra il
titolo riappare la testata iniziale. Il conteggio e il pannello dei filtri sono
condivisi e la chiusura restituisce il focus al comando visibile senza spostare la
pagina. Sul desktop restano navigazione e testata estese.

Scopri usa un libro aperto come icona: rappresenta cataloghi, caratteri e guide di
funghi, piante e alberi. La foglia è riservata ai contenuti botanici; il Taccuino
usa una penna d’oca per richiamare la scrittura, la Mappa una carta ripiegata.

### Tavola illustrata dei caratteri dei funghi

La panoramica usa una griglia di sette unità: cappello largo quattro, dettagli
larghi tre. Il cappello si incastra con sotto-cappello e gambo impilati; al taglio
e sporata completano una coppia di larghezze differenti. Le altezze dipendono dai
contenuti, senza tagliare testi o varianti, né cambiare l’ordine di lettura del DOM.
Bordi leggeri, illustrazione principale più grande e selettori distinti; il colore
pieno segnala la variante selezionata. Anello, volva e reticolo si leggono in righe
presente/assente esclusivamente quando il relativo dato è booleano documentato.
Le fasi di crescita mantengono la propria galleria. Benchmark e motivazioni in
[griglia-caratteri-2026-10-18.md](griglia-caratteri-2026-10-18.md).

Il diario di prova viene proposto nel Taccuino soltanto agli amministratori e agli editor: sia il collegamento nell’intestazione sia l’invito in fondo all’elenco. Il ruolo arriva dalla sessione verificata dal server, non da preferenze locali; in assenza di ruolo verificato le proposte restano nascoste, anche durante il caricamento. Il logout le rimuove. Il collegamento diretto alla dimostrazione rimane consultabile: i contenuti sono inventati e pubblici, non dati riservati.

Nelle viste con titolo, la barra superiore resta ancorata anche scendendo: il vecchio nascondimento direzionale non deve annullare il titolo sticky. Il passaggio al titolo compatto usa una dissolvenza di 240 ms, senza traslazioni delle lettere; chi preferisce movimento ridotto non ha animazione. La soglia usa l’altezza di layout della barra (compresa la safe area), con 16 px di margine per il rientro del titolo grande: piccoli movimenti inversi non cambiano subito lo stato. Scroll e resize aggiornano insieme lo stato, una volta per frame; il cambio pagina sceglie subito quello corretto senza spegnimenti intermedi.

Il focus non rappresenta una selezione o un errore. Nel tema chiaro il colore del focus è bosco, nel tema scuro resta polline; il fiordaliso rimane un colore informativo. Il puntatore/tocco non disegna l’outline sui comandi, anche se una modale ne riceve automaticamente il focus. Il focus DOM resta attivo, e la navigazione da tastiera ripristina subito l’indicatore visibile. I campi di testo conservano il segnale di editing anche al tocco. La distinzione è condivisa fra app e redazione (`js/focus.js`).

Aprendo o chiudendo un approfondimento principale di una scheda si mantiene la posizione visiva del summary scelto, anche quando il gruppo chiude un pannello precedente molto lungo. La compensazione riguarda il contenitore effettivo (pagina o modale), senza spostare lo sfondo del dialog e senza scorrimenti animati. Tiene conto dell’header e del visual viewport e rispetta i limiti di scroll disponibili. I dettagli annidati mantengono il comportamento indipendente.

Le CTA per annotare, salvare o aprire il Taccuino usano `notebookGlyph` di `js/ui-icons.js`: la stessa geometria della penna d’oca della navbar, decorativa (`aria-hidden`), con testo esplicito e colore ereditato. Vale per schede, piante, alberi, letture, uscite, sfide e ritorni al taccuino. Il simbolo “+” o il vecchio quaderno non sostituiscono più questa icona nelle CTA.

Il riquadro Attenzione conserva una sola cornice esterna. Titolo, comando di apertura/chiusura e singoli avvisi si distinguono con tipografia e spaziatura, senza separatori sovrapposti. Le regole generiche degli accordion non aggiungono un secondo sfondo, bordo o chevron a questo componente. Testi, severità, fonti e comportamento restano completi.

Nelle tessere dei funghi il titolo tecnico apre il glossario tramite un link senza sottolineatura, accompagnato da un piccolo «?» decorativo: è cliccabile l’intero titolo, con altezza minima 44 px. I termini nei contenuti restano collegamenti con sottolineatura puntinata; il titolo non consuma l’unica occorrenza automatica collegabile del termine nel testo. Il primo esempio comprende Cappello, imenoforo, Gambo, Viraggio e Sporata e le voci Anello/Volva/Reticolo nei dati del gambo.

La tessera Sporata mostra tutti i colori documentati del deposito come campioni cromatici etichettati, senza selezione, senza inventare una forma dell’impronta e senza mostrare soltanto il primo valore. Anche nel confronto ogni colore usa un campione, accanto al testo esistente. Si riusa la tavolozza UI preesistente; i campioni sono indicativi. Il diagramma del foglio resta nel percorso didattico per caratteri, dove il metodo è spiegato. Il glossario Sporata conserva la definizione e la precisazione sulla distinzione dal colore di lamelle/pori e sulla commestibilità, con la fonte esistente.


### Ritorno lungo il percorso effettivo (decisione del 18/10)

Nel percorso nota del Taccuino → scheda contestuale → luogo, Indietro torna alla
scheda modale e poi alla nota. Vale sia per la freccia dell’app sia per Indietro
del browser; Avanti ripercorre gli stessi passaggi. La gerarchia (per esempio
luogo → Uscite) rimane il ripiego per una pagina aperta direttamente. Il nome
accanto alla freccia descrive la destinazione reale, anche attraversando sezioni.
La direzione visiva della transizione non determina più la cronologia.

Le schede contestuali aperte da una pagina o da un’altra scheda aggiungono un
passo alla cronologia senza cambiare URL. Indietro/Escape risalgono di un passo;
la X chiude l’intero percorso delle schede e torna alla pagina di partenza.
Aprire un luogo chiude la scheda; tornare dal luogo riattiva il suo DOM originale,
con dettagli aperti, selettori e scroll conservati. Rientrando nella nota il focus
torna al collegamento di origine, distinguendo eventuali link con lo stesso URL.
«Apri come pagina» crea una destinazione esplicita: Indietro torna alla scheda.

Il registro `js/navigation-context.js` tiene DOM e titoli soltanto in memoria;
`history.state` contiene riferimenti casuali di sessione, senza note o dati di
profilo. Si conservano i DOM delle 16 visite contestuali più recenti; più indietro
la scheda viene ricostruita dai renderer correnti, senza garanzia dei controlli
precedenti. Reload e cambio account non ripristinano questi contenuti privati.
Moduli di annotazione, glossario e visori continuano a usare il coordinatore
modale: conservano il proprio ritorno interno, ma non diventano tutti nuove
voci della cronologia browser. Una scheda aperta da una modale generica resta
nel suo percorso interno. Un solo dialog modale rimane visibile.

Verifiche browser dedicate: nota/scheda/Valle di Malito a 320 e 390 px, Indietro
app e browser, Avanti, identità del DOM, accordion e posizione, focus, schede
concatenate, X, link diretto e ricostruzione dopo l’evizione del DOM. Restano da
verificare sul dispositivo fisico i gesti di navigazione di Safari.


### Quote quando manca il profilo (decisione del 18/10)

La prima tab del tratto si chiama «Profilo» soltanto quando il renderer può
mostrare un profilo continuo. Per segmenti separati o campioni insufficienti
diventa «Quote»: quota minima e massima dei campioni validi del tratto locale,
con una breve spiegazione del limite. Nessuna linea unisce segmenti separati,
nessun dislivello viene dedotto dall’intervallo di quote. Senza campioni resta
un messaggio compatto. La tab «Tracciato» e gli imbocchi rimangono disponibili.
Il riepilogo Quote ha altezza naturale, anche nelle anteprime; il grafico e il
tracciato conservano il proprio spazio. Selezione e tastiera restano condivise
fra le viste dello stesso tratto.

L’auto delle indicazioni stradali e degli imbocchi usa un unico glyph frontale
in `js/ui-icons.js`, con parabrezza, fari e ruote riconoscibili a 18 px. È
decorativo, eredita il colore e conserva testo, destinazione e area del comando.


Nella sezione «Taccuino e mappa» della zona compare una sola CTA per annotare,
con la penna d’oca. Un testo breve spiega specie cercate, ritrovamenti e ricerche
a vuoto (oppure fasi della pianta), luogo e giorno. «Apri la mappa» rimane
un’azione distinta. Rimosso «Salva condizioni», che richiedeva una previsione
completa e aggiornata: non si promette una cattura automatica delle previsioni
attraverso il comando di annotazione. Le condizioni già salvate nei taccuini
restano leggibili. Il percorso esistente di annotazione non viene modificato.

L’avviso iniziale presenta Fronda come esperimento personale, usato esclusivamente per provare e migliorare il prototipo. Cookie policy e privacy si consultano nello stesso pannello; un solo pulsante conferma la lettura. Prima della conferma l’interfaccia resta inerte, anche cambiando hash o chiudendo il dialog. Versione, impronta e data vengono conservate sul dispositivo e, con un profilo, registrate sul server; le vecchie date sconosciute non vengono inventate. Il tutorial di installazione è successivo e facoltativo; la sua chiusura non revoca la conferma. Nella PWA si riusa la ricevuta solo se disponibile. Dettagli, limiti e migrazione in [accettazione-condizioni.md](accettazione-condizioni.md).

### Animali · 18 ottobre 2026

Matteo ha autorizzato l’implementazione del primo catalogo dopo lo studio dedicato.
Scopri aggiunge Animali tra Alberi e Guide; la riga di cinque sezioni scorre
orizzontalmente, senza restringere i nomi a 320 px. La navbar resta invariata.
Il catalogo distingue tre percorsi editoriali: Sui fiori, Bosco e sentiero,
Convivere con prudenza. Quest’ultimo non è una classe di pericolosità dell’animale.

Le otto schede iniziali espongono dati brevi e fonti per frase. Le cautele presenti
sono aperte, le sezioni prive di dati non vengono create. Una scheda di gruppo si
distingue da quella di una specie. Nessuna identificazione, previsione di presenza,
indice o nuova osservazione nel Taccuino: il backend non gestisce ancora animali.
Le quattro bozze restano escluse anche dalla ricerca globale e dall’URL diretto.
Nella ricerca precedono i nomi; in assenza di risultati per nome si suggeriscono
caratteri documentati con il relativo motivo.


### Ricerca a tutta superficie (18 ottobre 2026)

La ricerca globale si apre come layer opaco a tutta superficie, anche nel browser.
Campo, Annulla e filtri restano sopra i risultati, che scorrono nel proprio spazio.
Altezza e posizione seguono il visual viewport con tastiera, barre del browser e zoom;
il fondo copre la pagina sottostante anche fuori dall’area del dialog. Su desktop
il layer occupa lo schermo e i contenuti mantengono una misura di lettura limitata.
L’apertura da una scheda usa lo stesso coordinatore: Indietro torna alla scheda.
