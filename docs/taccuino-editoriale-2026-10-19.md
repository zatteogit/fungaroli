# Taccuino editoriale

19 ottobre 2026. Implementazione della richiesta di Matteo: il Taccuino deve avere il carattere di un diario e un’impaginazione editoriale, anche nelle pagine scarne dei giri salvati.

## Impaginazione

- Testata della pagina con data a margine, titolo Fraunces, tipo di nota e numero di pagina reale nell’ordinamento del taccuino.
- Fotografia del catalogo trattata come stampa e sempre accompagnata dalla provenienza e dal collegamento ai crediti. Nessuna immagine generata o associata a luoghi privi di foto documentata.
- Testo personale integralmente leggibile, capoversi e capolettera. I dati di campo diventano annotazioni laterali; su mobile seguono il racconto. Le note senza dati di contesto usano la larghezza di lettura senza una colonna vuota.
- Pagine senza testo: invito a scrivere e comando che apre il compositore esistente con il luogo già collegato. Crea un nuovo appunto privato: non modifica il giro salvato né attiva la condivisione.
- Condizioni storiche e cautele conservate; azioni e indicazione di riservatezza in un piè di pagina compatto.
- Indice a pagine con stampe, rigature leggere e foliazione. La pagina fotografica viene valorizzata senza cambiare l’ordine cronologico. Griglia, elenco, ricerca e filtri mantengono i flussi esistenti.

## Verifica

Verifica manuale con Playwright CLI su server statico locale e dati dimostrativi in un profilo browser separato: giro salvato senza immagine, nota con foto e testo, indice, 1280 px, mobile 390 e 320 px, tema scuro. Apertura del compositore dal nuovo comando con luogo e riferimento corretti, senza salvarlo. Testo e didascalia riscontrati nel DOM, nessun overflow orizzontale nelle viste controllate.

Il server statico non espone le API: le risposte 404 a snapshot, community e meteo sono attese in questa verifica locale. Nessuna suite di test o dry-run eseguiti, per istruzione dell’utente. Controlli di sintassi JavaScript e `git diff --check`.

La verifica della pubblicazione usa il numero shell e la pagina effettiva sul sito pubblico. Nessuna segnalazione reale o contenuto personale viene pubblicato dalla verifica grafica.

## Indirizzo prodotto collegato

[Direzione e opportunità economiche di Fronda](strategia-fronda-2026-10-19.md): i funghi restano il punto d’ingresso; flora, fauna e diario accompagnano l’uscita. Integrazioni Meta, nuovi flussi faunistici e ipotesi commerciali in quel documento sono proposte, non funzioni rilasciate.
