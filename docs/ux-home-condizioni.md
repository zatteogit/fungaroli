# Home composta secondo il contesto · demo del 21 ottobre 2026

Stato: **regole approvate da Matteo e integrate nella home, shell v317**. La demo resta disponibile come studio delle casistiche. [Demo interattiva](../dev/home-stati.html).

## Richieste di Matteo

Quando non esistono condizioni favorevoli, nessuna card con indice basso promossa solo perché è la prima della graduatoria. Un empty state piccolo è sufficiente; il resto della home deve continuare a offrire contenuti utili indipendenti dall’indice odierno. Studiare tutte le casistiche.

Il box «Come funziona» è utile, ma non deve separare il calendario dai contenuti che cambiano con la data. Studiare posizione e chiusura automatica, distinguendo anche utenti registrati e non registrati.

## Struttura proposta

1. Intestazione, interessi, filtri e calendario.
2. **Contenuti del giorno scelto:** proposta principale e altre proposte effettivamente idonee, oppure piccolo stato vuoto. Nessuna spiegazione introduttiva fra selettore e risultati.
3. Eventuale occasione futura, compatta e con data diversa dichiarata. «Valuta domani» cambia il giorno solo dopo il tocco; non sostituisce in silenzio il giorno scelto.
4. «Come funziona», completo o compatto secondo lo stato della visita. È una spiegazione del prodotto, non un risultato del calendario.
5. **Luoghi da conoscere**, presentazione editoriale senza indice del giorno: foto, luogo, accesso alla scheda. Non è una proposta per partire oggi.
6. **Guide e schede da leggere**. Ordine e soggetto possono essere pertinenti al contesto (per esempio pioggia), ma non spariscono se l’indice è basso.
7. **Taccuino**: accesso stabile per annotare o ritrovare ricordi reali. Non aggiungere ricordi o preferiti dimostrativi allo spazio personale.

Le intestazioni indipendenti non dicono «in questi boschi oggi», «si trova» o «buone uscite»: non devono trasformare catalogo, calendario stagionale e habitat in osservazioni locali. Le foto conservano i crediti nelle schede collegate. Nessuna grande hero sostitutiva che riscriva l’empty state in tre paragrafi.

## Criteri di proposta: ipotesi da validare

Nel modello attuale le classi iniziano a 7,5 (molto buone), 6 (buone), 4,5 (discrete), 3 (limitate), 1,5 (scarse), 0 (sfavorevoli). La demo riusa queste classi: **rilievo principale solo da «Buone» in su**, meteo della mattina verificabile senza criticità e vincoli pratici rispettati. È una soglia di presentazione proposta, non un cambiamento del modello scientifico né una promessa di ritrovamento.

Il numero delle condizioni include già il meteo con `conditionsScore`: non applicarlo una seconda volta. La valutazione è relativa agli interessi e filtri attivi. Con Sentieri/Piante senza Funghi non si applica la soglia fungina e non si mostra un numero fungino. Restano necessari percorso, accesso e meteo utilizzabili. La demo preserva l’ordine pratico ricevuto per queste modalità, senza ordinarle per indice fungino.

Con condizioni discrete o meteo incerto si propone un accesso esplicito **«Mostra le proposte da valutare»**, che apre righe compatte, senza hero. Con condizioni basse niente lista di ripiego. La valutazione del rischio resta leggibile nella scheda. «Meteo senza criticità segnalate» non equivale a certificazione di sicurezza.

Per interessi misti che includono Funghi, le proposte presentate come uscita fungina rispettano la soglia fungina. Se non ce ne sono, si può offrire «Valuta un giro per osservare piante e sentieri», con cambio di interesse esplicito; non trasformare una card bassa in raccomandazione cambiandone soltanto il titolo. La demo ha modalità distinte per rendere verificabile la separazione; il filtro misto va controllato nell’integrazione.

## Matrice delle casistiche

| Stato | Blocco sotto il calendario | Altri giorni | Contenuti indipendenti |
| --- | --- | --- | --- |
| Più uscite favorevoli | Hero + sole alternative con gli stessi requisiti | Non serve un altro richiamo concorrente | Visibili |
| Una sola uscita favorevole | Una hero, nessun titolo «Altre» vuoto | Come sopra | Visibili |
| Condizioni basse ovunque nel perimetro scelto | «Oggi, nessuna uscita da consigliare.» Nessun numero basso in una grande card | Solo se davvero idonei | Visibili |
| Meteo sconsigliato in tutte le zone selezionate | «Con questo meteo, meglio aspettare.» Anche se il potenziale fungino è alto | Solo finestra favorevole verificabile | Visibili, guida pioggia pertinente se serve |
| Solo proposte discrete/incerte | Messaggio + accesso facoltativo alle righe «Da valutare» | Se disponibile | Visibili |
| Meteo/indice assente, incompleto o scaduto | «Le condizioni sono da verificare.» Nessun numero di ripiego | Soltanto con dati sufficienti | Visibili |
| Alcune zone valutabili e altre no | Proposte valide + nota di copertura parziale | Non necessaria | Visibili |
| Nessun risultato per i filtri | «Nessuna uscita con questi filtri.» Azione Rivedi, mai reset automatico | Stessi filtri; niente evasione implicita | Visibili e chiaramente editoriali |
| Accessi/attività non proponibili | Messaggio sul vincolo, nessuna proposta nonostante indice alto | Stessi vincoli | Schede conoscitive, senza invito a violare vincoli |
| Partenza troppo tarda per il giro | Messaggio sui tempi di oggi, non sul meteo | Primo giorno successivo idoneo | Visibili |
| Specie selezionata senza modello | Spiegazione breve; consultazione schede o cambio interesse esplicito | Nessuna previsione fungina inventata | Visibili |
| Solo Sentieri | Percorsi valutabili senza indice fungino | Valutazione pratica/meteo | Visibili |
| Solo Piante | Proposte di osservazione senza indice fungino e senza presenza certa | Valutazione pratica/meteo | Visibili |
| Nessun interesse attivo | Esplorazione pratica; nessun indice fungino ereditato | Se pertinente | Visibili |
| Caricamento iniziale | Indicatore leggero; non dichiarare già «nessuna uscita» | In attesa | Già accessibili quando i dati editoriali sono caricati |
| Riepiloghi community non raggiungibili con filtro attivo | Errore del filtro, Riprova / Togli filtro | Non aggirare il filtro di nascosto | Visibili; niente falsa assenza di segnalazioni |
| Giorno futuro scelto manualmente | Stesse regole, testo riferito alla data scelta | Solo giorni successivi al selezionato | Visibili |

Se coesistono cause, non dichiarare «ovunque sfavorevole» quando alcune zone non sono valutabili. Mostrare le proposte valide, se esistono, e dichiarare la copertura incompleta. Se non esistono, distinguere dati mancanti da risultati negativi. Vincoli documentati precedono meteo e punteggio; meteo verificabile precede la promozione di una proposta. Nessun livello basso di una zona supera l’assenza di dati in un’altra per dimostrare un’affermazione globale.

## Prossima occasione

Il richiamo futuro usa la stessa idoneità del blocco principale e gli stessi filtri, all’interno dell’orizzonte previsionale disponibile. La data più vicina precede un punteggio migliore ma più lontano. Una tregua meteo con indice basso non viene chiamata «prossimo giorno utile» e non riceve una card sostitutiva. Se non esiste una data valida: «Per ora non abbiamo un’altra data favorevole da proporre nei prossimi sette giorni.» Non significa che non ci saranno occasioni oltre l’orizzonte o nelle zone senza dati.

Date assolute nel modello e fuso Europe/Rome; «domani» solo come etichetta derivata. Quando l’utente seleziona un giorno futuro, non tornare automaticamente a oggi durante un aggiornamento. Quando passa mezzanotte, ricalcolare correttamente offset e testo senza riciclare il giorno sbagliato.

## «Come funziona»: posizione e ciclo di vita

**Posizione consigliata:** dopo tutto il blocco relativo al giorno (alternative incluse) e l’eventuale prossima occasione, prima dell’esplorazione editoriale. Nella demo il calendario tocca sempre direttamente il risultato. Un link discreto e stabile «Come funziona» resta accanto al contesto della selezione: occupa una riga, non una grande superficie che interrompa i risultati.

| Stato della persona | Presentazione iniziale proposta |
| --- | --- |
| Prima visita senza segnali di uso | Box completo dopo le proposte, se ci sono risultati da capire |
| Prima visita ma nessuna proposta odierna | Richiamo compatto; il risultato vuoto e l’esplorazione mantengono priorità |
| Ospite che ritorna | Richiamo compatto, riapribile |
| Profilo appena registrato | Stessa regola della prima visita: la registrazione da sola non prova che conosca il prodotto |
| Ha già salvato una prima annotazione o raccontato un’uscita | Richiamo compatto nelle visite successive |
| Ha condiviso un’osservazione valida | Compatto; regole di accesso e privacy sempre raggiungibili |
| Ha premuto la X | Box nascosto; rimane il link di aiuto |
| Ha riaperto volontariamente il box | Rimane aperto finché lo chiude o lascia la pagina |

**Riduzione automatica, non cancellazione della spiegazione:** avviene all’ingresso successivo nella home dopo un’azione riuscita o un ritorno effettivo. Nessun timer e nessuna riduzione al solo scroll: leggere metà box non prova comprensione. La scelta del giorno, i filtri, un aggiornamento meteo, il login e la registrazione non devono chiudere un contenuto già aperto mentre l’utente lo legge. Se il box inizialmente compatto viene aperto, rimane aperto anche cambiando data.

Per «ritorno» non basta un nuovo render, cambio rotta interno o reload di un errore: va definita una visita reale (sessione distinta) e il fatto che il box sia stato effettivamente presentato. I segnali di uso sono registrati dopo il salvataggio riuscito, non dopo un click su Annota. Non richiedere una condivisione community per considerare l’utente esperto.

La chiusura esplicita va ricordata in modo separato dalla prima visita e dai segnali di uso, per proprietario del Taccuino/browser. Ospite e profili distinti non devono ereditare la scelta di un altro account. Non resuscitare il box dopo logout o pulizia di un filtro. Con storage bloccato, usare lo stato della sessione senza impedire l’uso. Una spiegazione sostanzialmente aggiornata può ricevere un richiamo discreto versionato; non riaprire automaticamente il pannello completo a ogni aggiornamento dell’app.

Il box illustrato della demo mantiene i tre concetti; testo dei riepiloghi, soglie community e privacy rimangono accessibili in «Dimmi di più». La demo non aggiunge contributi dimostrativi e non promette che il servizio di condivisione sia già attivo per chiunque.

## Integrazione nella home · shell v317

La home usa `js/home-composition.js` per distinguere proposte consigliabili, proposte da valutare e assenza di proposte. Il punteggio arriva già corretto per il meteo: la composizione non lo moltiplica nuovamente. Le proposte favorevoli passano insieme i filtri esistenti, il controllo dell’orario e il meteo verificabile; la prossima occasione applica gli stessi criteri. Il giorno della home resta oggi fino a una selezione esplicita, anche quando non ci sono proposte; la mappa conserva la propria gestione della data.

Le proposte discrete sono righe compatte aperte su richiesta; le card in evidenza e le alternative contengono solo proposte favorevoli. Nei casi vuoti non si popolano le scoperte «Durante il giro» con una località arbitraria. La sezione conoscitiva delle specie usa il catalogo e i periodi documentati, senza indici del giorno o dichiarazioni locali; la guida può contestualizzare la pioggia. Esplorazione regionale, giri editoriali, Taccuino e regole restano accessibili. Vincoli di accesso e raccolta restano quelli effettivamente documentati nei dati e nelle schede: non si inventa uno stato di chiusura da un punteggio basso.

`js/home-intro.js` gestisce presentazione, sessione, chiusura esplicita e uso effettivo del Taccuino per proprietario del browser. La chiusura precedente `fronda:community-card-dismissed:v1` viene rispettata per l’ospite, senza attribuirla a un nuovo profilo. Il box è dopo i risultati; il suo link di aiuto è sempre raggiungibile. Un’annotazione o un ricordo salvato riduce la spiegazione all’ingresso successivo, non mentre la si sta leggendo. Un cambio di account aggiorna il contenuto e non riutilizza riepiloghi del precedente proprietario.

La pubblicazione della home non implementa i Preferiti: quel prototipo rimane separato, con la sua specifica di persistenza e sincronizzazione.

## Limiti e verifica della demo

I 18 scenari sono sintetici, con data di esempio 21 ottobre 2026. La demo riusa classi e combinazione del meteo esistenti; non chiama le API di previsioni, account o Taccuino. I selettori Casistica e Visita sono strumenti di revisione, non controlli proposti per l’app. I pulsanti Riprova/Rivedi simulano un esito diverso dichiarato dal selettore, senza modificare preferenze reali. I contenuti statici sono esempi editoriali, non suggerimenti geolocalizzati né segnalazioni.

Il box completo su mobile usa una disposizione di studio: l’impaginazione definitiva delle tile va confrontata con quella già approvata; qui si valutano soprattutto posizione e ciclo di vita. L’integrazione finale deve usare i controlli e le geometrie effettivi dell’app, non sostituirli automaticamente con quelli del prototipo.

Verificare: nessuna hero con indice basso; nessuna proposta vietata/non verificabile; una sola proposta senza alternative vuote; discreti solo su richiesta; separazione fra dati mancanti e sfavorevoli; prossimo giorno con stessi filtri e criteri; nessun indice fungino in Sentieri/Piante; contenuti indipendenti costanti; primo uso/ritorno/profilo/chiusura/riapertura; calendario senza salto di scroll e senza riduzione del box aperto; 320/390/1280 px, light/dark, focus e assenza di overflow.
