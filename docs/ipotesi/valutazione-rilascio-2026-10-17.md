# Parti adottabili dei rami sospesi — 17 ottobre 2026

Richiesta di Matteo in questa chat: «portiamo in main tutto ciò che è lecito portare, in particolare le ottimizzazioni dell'algoritmo funghi». La destinazione è il ramo di produzione `claude/brave-tesla-wu0a2b`; `main` non esiste. La richiesta autorizza l'integrazione delle parti verificate e il relativo rilascio. Questa valutazione distingue ciò che può entrare dalle ipotesi che restano fuori.

Base aggiornata: `2e2215c` (PR #106). Ramo di integrazione: `release/validated-pending-work`.

| Lavoro | Valutazione e scelta |
| --- | --- |
| Mappa utile, schede e confronto da Figma (`4d2867f`, `d91cfc3`, `96c1175`) | Adottati: richiesti e rivisti in questa chat. La mappa mantiene il modello fungino e introduce elenco dell'area, preferenze leggibili, filtri coerenti e disponibilità senza meteo. |
| PR #93, `70586df`, titoli senza orfane | Adottata: già approvata nel registro. Solo le regole di impaginazione; si conservano i colori accessibili attuali e la versione della shell del rilascio. |
| PR #60, metriche meteo | Adottata dopo verifica del diff e dei test su SQLite. Contatori orari senza IP, account o posizione dell'utente; accesso amministratore; conservazione 180 giorni; scritture in `waitUntil`, buffer delle risposte e errori facoltativi. La tabella si crea al primo uso. Migrazione rinumerata `0006_weather_metrics.sql`: `0004` è del questionario e `0005` resta riservata all'archivio deciso in D1. Il cron conserva tutte le pulizie attuali. Nessun nuovo binding o servizio. |
| PR #98, illustrazioni curate, ramo `claude/awesome-lamport-jcuzmo` | Adottata nella forma selezionata dalla PR: immagini coerenti coi dati, licenze del progetto esplicite, foto reali conservate. Nessuna incoerenza o immagine da rifare nel rapporto asset. Le mancanze rimangono censite. Forme archiviate escluse dal sito; tavola terreum non approvata esclusa. La nota di revisione micologica dell'ovolo resta visibile. Si conservano le nuove schede, i contesti omonimi del glossario e la terminologia Approfondimenti. Il CMS aggiorna anche infografiche senza sovrascrivere il lavoro redazionale. |
| Rami `gpt/immagini`, `gpt/ritagli` | I pacchetti grezzi sono materiali di lavoro: non si importano direttamente né si pubblica `incoming/`. Entra solo la selezione controllata della PR #98. Le consegne successive richiedono un nuovo import con verifiche su dati, ritagli e asset. |
| `codex/fronda-modello-micologico-v3`, `4465d2f` | Escluso dal rilascio: banco di ricerca senza modello addestrato; dominio congiunto, uso delle previsioni e minimi di dati ancora da correggere. Fa fede la [valutazione scientifica](valutazione-modello-v3.md). Nessuna nuova probabilità o formula nell'app. |
| `claude/ricerca-modello-micologico`, `8c0ba55` | Escluso: fonti e soglie non affidabili, percentuali non validate. Non è un'ottimizzazione pronta dell'indice. |
| PR #1, infografica caesarea originaria | Esclusa: bozza esplicitamente non approvata e superata dalla revisione selezionata nella PR #98. |

## Algoritmo dei funghi: cosa è già in produzione

Le ottimizzazioni operative sono già antenate di `2e2215c`: cache condivisa per zona (`c6ac3b0`), serie del suolo compatte e download limitati (`0c04f7c`), cache datata e attesa limitata (`42e5c62`), aggiornamento progressivo con dati salvati (`ca99df4`) e correzioni delle date/cache (`6d88545`). Vengono conservate insieme alle metriche: queste ultime servono a misurare l'effetto e scegliere interventi successivi.

Il diff del rilascio rispetto a produzione non modifica `js/model.js`, `js/species.js` o `js/weather-data.js`. L'indice, le soglie e la curva termica dei porcini restano quindi identici. Le scelte D1–D4 sull'archivio e sul protocollo di ricerca sono già documentate ma ancora da costruire: non vengono dichiarate implementate da questo rilascio.

## Verifiche prima del merge

296 test unitari superati dopo l'integrazione, inclusi coerenza e completezza degli asset e contatori meteo. Contratti dello studio Fronda e guard dei token senza regressioni; nessuna incoerenza nel rapporto asset. Suite browser completa, dry-run del Worker e controlli visivi sul candidato congelato richiesti prima di pubblicare. Gli esiti finali sono riportati nella PR di rilascio.
