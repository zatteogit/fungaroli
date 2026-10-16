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


## Intento dell’uscita — decisione del 16 ottobre 2026

La richiesta di Matteo sostituisce la priorità fissa funghi → giro → scoperte. La barra principale espone **A funghi / Piante spontanee / Passeggiata** e **Filtri avanzati**, in home e mappa. La navigazione Uscite, Mappa, Scopri e Taccuino resta la stessa.

| Intento | Home | Mappa e dettagli |
| --- | --- | --- |
| A funghi | Proposta con indice, altre uscite, scoperte e specie | Indice e habitat potenziale fungino con i limiti esistenti |
| Piante spontanee | Fascia botanica prima della proposta, fase indicativa e ambiente nelle card, altri sentieri | Spunti botanici associati agli ambienti campionati; nessuna densità, probabilità o posizione di presenza attribuita alle piante |
| Passeggiata | Sentiero, difficoltà, tratto mappato, accesso e meteo; scoperte dopo la proposta, poi alternative | Zone, tracciati e imbocchi senza indice fungino |

### Stato e filtri

`fungaroli:prefs:v2` mantiene le chiavi precedenti, aggiunge l’intento e i filtri sui sentieri, e ripristina le selezioni separate di funghi e piante. Le preferenze sono locali al browser; non viene introdotta una sincronizzazione account. Un cambio di intento conserva giorno, preferenze pratiche e selezioni delle altre attività. Azzera opera sull’attività corrente e sui filtri pratici; non cancella le specie dell’altra attività.

Il pannello avanzato mostra scelta dell’intento, ricerca e gruppi pertinenti (solo per funghi e piante), filtri pratici e scoperte secondarie. Passeggiata non propone specie fungine. I filtri «Solo difficoltà T» e «Tratto nella zona entro 5 km» sono scelte pratiche, non soglie scientifiche; con filtro attivo un dato mancante non viene trattato come compatibile. I km del tratto nella zona non sono la lunghezza dell’intera uscita.

Per le piante, la selezione diretta è limitata ai profili con fase e calendario strutturati già disponibili. Il catalogo più ampio resta accessibile in Scopri e come osservazioni di ambiente. Non si creano calendari di raccolta dalla fioritura. Campioni del tracciato mancanti non sono sostituiti con quelli di un altro luogo.

L’ordinamento pratico di piante e passeggiate considera prima il meteo, poi il contesto botanico nella modalità piante, le preferenze attivate e il giorno. L’ordine residuo è alfabetico e non costituisce una graduatoria scientifica. I punteggi botanici interni servono a ordinare, non sono presentati come indici fungini. Durante aggiornamenti meteo la home conserva l’ordine delle zone già lette; una scelta esplicita ricalcola l’ordine.

### Stagione e ripristino

All’apertura e al cambio giorno, se **tutta** la selezione ricordata è fuori dai calendari documentati in tutti i giorni mostrati, il filtro sulle specie viene tolto. Se l’intera attività non ha specie nel calendario, si passa a Passeggiata. La dialog spiega il cambiamento e permette di ripristinare la scelta; finché non cambia attività resta anche il comando nella home. La scelta sospesa è conservata separatamente.

Un calendario sconosciuto, un indice basso, meteo mancante o dati incompleti non bastano per sospendere. Il periodo è indicativo: clima e quota possono spostarlo. La scelta esplicita, anche fuori calendario, viene rispettata; il ripristino è ricordato per quel mese e quella selezione. Non si riattiva silenziosamente un filtro alla stagione successiva. Passeggiata non viene sospesa per stagione. Senza meteo, piante e passeggiate restano esplorabili con disponibilità meteo dichiarata, senza valori inventati.

### Verifica

Test unitari dedicati a calendari parziali/sconosciuti e finestre tra mesi, filtri con dati mancanti, separazione dell’ordinamento pratico dall’indice. Test browser per persistenza, dialog/ripristino, tre intenti, ordine delle fasce, nessun indice fungino in piante/passeggiata, assenza di meteo, larghezze 320/390/768/1280 e temi chiaro/scuro, mappa schematica e Leaflet. La pubblicazione richiede comunque la suite completa prevista in AGENTS.md.
