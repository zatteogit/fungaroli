# Valutazione del questionario esperti — 17 ottobre 2026

## Provenienza e mandato

Recuperati 25 file originali dalla sessione Claude «Analisi critica app Fronda», worktree `/home/user/fronda-q`, ramo `lavoro-questionario`, base `e5f9552`. La trascrizione riporta `efe03d0`; è stato recuperato il contenuto dei file, non l'oggetto commit. Matteo ha chiesto di recuperare e pubblicare il questionario e ha deciso in questa chat tutte e quattro le opzioni registrate in [questionario.md](../questionario.md#decisioni-di-matteo--17-ottobre-2026).

## Valutazione

- Fatto verificato: pagina autonoma senza login, bozza locale, riepilogo, contratto condiviso, invio D1, lettura/esportazione solo amministratori, test su API e browser. Prima delle quattro decisioni: 277 unitari e 17 browser superati sulla produzione v101.
- Adottato: raccolta di testimonianze esplicite, distinte dalle misure e senza modifica dell'indice fungino. Le opzioni di Matteo sono applicate con prove sui contenitori vuoti, conservazione e versanti per fase.
- Limiti: le risposte rapide restano dichiarazioni degli intervistati; non sono prova scientifica. La protezione CSV è verificata con lettori simulati, non Excel vero. Il tetto giornaliero può essere saturato da un attaccante distribuito anche con invii non vuoti. Il contatto va azzerato prima della scadenza se lo scopo è esaurito; il cron impone comunque il termine massimo.
- Nessun'altra proposta scientifica, soglia o modifica del modello di altri rami viene adottata.

## Rilascio

Verifiche definitive e collegamento alla PR sono nella descrizione del rilascio; Per questo rilascio Matteo ha chiesto esplicitamente di interrompere la suite generale dell’app e proseguire con le verifiche mirate del questionario e della redazione. La suite generale interrotta non si dichiara superata. Cache shell v102. Il questionario si distribuisce con `/questionario`, senza inserirlo nella navigazione generale dell'app.
