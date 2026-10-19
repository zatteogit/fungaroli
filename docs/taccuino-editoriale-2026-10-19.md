# Taccuino editoriale

19 ottobre 2026. Implementazione della richiesta di Matteo: il Taccuino deve avere il carattere di un diario e un’impaginazione editoriale, anche nelle pagine scarne dei giri salvati.

## Impaginazione

- Testata della pagina con data a margine, titolo Fraunces, tipo di nota e numero di pagina reale nell’ordinamento del taccuino.
- Fotografia del catalogo trattata come stampa e sempre accompagnata dalla provenienza e dal collegamento ai crediti. Nessuna immagine generata o associata a luoghi privi di foto documentata.
- Testo personale integralmente leggibile, capoversi e capolettera. I dati di campo diventano annotazioni laterali; su mobile seguono il racconto. Le note senza dati di contesto usano la larghezza di lettura senza una colonna vuota.
- Pagine senza testo: le uscite mostrano un riepilogo composto dai dettagli dichiarati. Nei giri salvati il comando “Ci sono stato” apre il ricordo guidato. Gli appunti liberi rimangono facoltativi.
- Condizioni storiche e cautele conservate; azioni e indicazione di riservatezza in un piè di pagina compatto.
- Indice a pagine con stampe, rigature leggere e foliazione. La pagina fotografica viene valorizzata senza cambiare l’ordine cronologico. Griglia, elenco, ricerca e filtri mantengono i flussi esistenti.

## Verifica

Verifica manuale con Playwright CLI su server statico locale e dati dimostrativi in un profilo browser separato: giro salvato senza immagine, nota con foto e testo, indice, 1280 px, mobile 390 e 320 px, tema scuro. Apertura del compositore dal nuovo comando con luogo e riferimento corretti, senza salvarlo. Testo e didascalia riscontrati nel DOM, nessun overflow orizzontale nelle viste controllate.

Il server statico non espone le API: le risposte 404 a snapshot, community e meteo sono attese in questa verifica locale. Nessuna suite di test o dry-run eseguiti, per istruzione dell’utente. Controlli di sintassi JavaScript e `git diff --check`.

La verifica della pubblicazione usa il numero shell e la pagina effettiva sul sito pubblico. Nessuna segnalazione reale o contenuto personale viene pubblicato dalla verifica grafica.

## Indirizzo prodotto collegato

[Direzione e opportunità economiche di Fronda](strategia-fronda-2026-10-19.md): i funghi restano il punto d’ingresso; flora, fauna e diario accompagnano l’uscita. Integrazioni Meta, nuovi flussi faunistici e ipotesi commerciali in quel documento sono proposte, non funzioni rilasciate.

## Ricordo guidato · v234

- “Salva il giro nel taccuino” nella passeggiata salva subito luogo, percorso e giorno previsto; un secondo salvataggio dello stesso riferimento e giorno apre la voce esistente.
- “Ci sono stato” propone luogo e giorno (il giorno del giro salvato se già trascorso, altrimenti oggi). Si possono correggere prima di proseguire. Il ricordo rimane collegato alla pagina del percorso salvato.
- Due schermate: luogo/giorno; osservazioni/fatica. Il secondo passaggio può essere salvato vuoto, senza dedurre assenze. Dopo “Ho osservato funghi” si possono selezionare più nomi dal catalogo. Durata e testo personale sono facoltativi sotto “Un dettaglio in più”.
- L’uscita produce il testo da `experience`, con vocabolario chiuso, senza chiamate AI. Il testo personale rimane in `note`; durata del giro, fatica e nomi proposti non modificano quantità, sforzo di ricerca o calibrazione scientifica.
- L’eventuale spunta “Ho seguito questo percorso” è una dichiarazione, esplicitamente distinta dalla registrazione GPS. Cambiando zona si rimuove il percorso di riferimento precedente.
- Riepilogo e metadati compaiono nella pagina editoriale e nella ricerca del taccuino. “Modifica il ricordo” conserva gli appunti e i dati precedenti; i ritrovamenti e le ricerche delle uscite storiche non vengono reinterpretati dal compositore semplificato.
- “Invia una copia” usa la condivisione del dispositivo; in alternativa offre un testo copiabile. Il riepilogo privato non viene trasformato in un URL pubblico accessibile agli altri. Il solo link eventualmente incluso è alla scheda pubblica del percorso. La copia non viene inviata automaticamente.
- `experience` è parte del payload privato dell’uscita già persistito dalle API; nessuna migrazione del database. Le osservazioni nominative senza quantità non vengono pubblicate automaticamente nei conteggi community.
- Punti di ritrovamento precisi, foto personali, importazione e registrazione GPS restano sviluppi successivi, descritti nella strategia.

### Verifica manuale del ricordo guidato

Profilo browser isolato, server statico locale. Solo per caricare la scheda dell’uscita, richieste meteo inoltrate in lettura alla cache pubblica di produzione; salvataggi di prova esclusivamente nel browser locale. Percorso provato: Monte Tancia → salva Cresta di Monte Tancia → Ci sono stato → luogo/giorno → Porcino, fatica, percorso dichiarato → salva → ricarica. Riepilogo e collegamento al percorso persistono.

Provati anche: uscita senza dettagli (stato sconosciuto, nessuna quantità o assenza inventata); due specie, durata e nota personale; modifica e ricarica; ricerca di una specie fuori dai modelli previsionali; anteprima della copia simulando nel solo browser l’assenza di condivisione nativa, senza inviare messaggi. Una vecchia uscita con quantità e ricerca mantiene invariati `finds`, `searched`, `effort`, `band`, `forecast`, `predicted` e nota quando si aggiunge la fatica. Viste a 1280, 390 e 320 px; pulsante di salvataggio raggiungibile e nessun overflow orizzontale nei casi controllati. Il tasto Invio nel campo di ricerca non salva accidentalmente l’uscita.

Non verificata una scrittura autenticata sulle API in produzione: il payload aggiuntivo usa la persistenza privata già esistente. Nessuna suite, dry-run o CI di test avviati. Solo controllo sintattico dei moduli modificati, diff e interazioni manuali nel browser.
