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

298 test unitari superati dopo l'integrazione e l'abilitazione delle fasi, inclusi coerenza e completezza degli asset e contatori meteo. Contratti dello studio Fronda e guard dei token senza regressioni; nessuna incoerenza nel rapporto asset. Suite browser completa, dry-run del Worker e controlli visivi sul candidato congelato richiesti prima di pubblicare. Gli esiti finali sono riportati nella PR di rilascio.

## Riscontro della sessione Claude «Analisi critica app Fronda»

Matteo ha indicato la [sessione originale](https://claude.ai/code/session_01XvBBn6SyTY3bWGT1pFDXNu). Il collegamento non è leggibile da questo ambiente; non si dichiara di aver letto l'intera trascrizione. L'identificativo è però nel trailer `Claude-Session` di otto commit: tutti risultano antenati di `2e2215c`, già in produzione prima di questo rilascio.

| Commit | Correzioni entrate |
| --- | --- |
| `7e230df` | Regole di raccolta, parchi, accessi e privacy |
| `5fcfe88` | Piante, alberi e glossario: BOT-01…13, GLO-01/02 |
| `35a4c28` | Funghi: M01…M08, provenienza 3D, classi tossiche, dimensioni e avvisi |
| `bfb9725` | Lunghezze dei sentieri, aggiornamento CMS, ETag debole, arrivo entro orari legali |
| `dc8b053` | Descrizione del metodo e dei limiti, senza modificare parametri |
| `dce0e66` | Titoli, età del meteo, avvio fallito/senza JS, accessi su pista |
| `e5f9552` | Verifica di leggibilità compatibile con l'avviso legale aggiornato |
| `2da612f` | Registro e valutazione scientifica, decisioni D1–D4 e script di verifica |

Questo prova la presenza delle correzioni committate, non il completamento di tutte le decisioni discusse. Risultano ancora assenti nel codice: archivio quotidiano, snapshot con 60 giorni (oggi sono 31), ET₀/umidità 9–27 cm nel profilo, protocollo delle uscite e consenso alla ricerca. La valutazione 4.0 elenca inoltre tre difetti ancora riscontrabili: indice grezzo nella lista «dove trovarlo», controllo dell'intervallo dell'umidità compatta e ritiro della segnalazione se cambia solo lo sforzo. Sono attività da implementare e verificare, non rami pronti da unire. Ulteriori messaggi della sessione non possono essere ricostruiti dai soli commit.

## Stadi di crescita: dati, immagini, interfaccia

Conteggio ricavato dai dati e dai file, non dalle dichiarazioni dei rami:

| Livello | Stato del 17 ottobre |
| --- | --- |
| Dati `species-traits.json` | 33 specie, 79 fasi, 191 tessere richieste: 187 di fase + 4 sezioni dell'uovo |
| Produzione `2e2215c` | Nessuna icona `*-fase-*` ancora pubblicata |
| Candidato di questo rilascio | 88 icone, incluse le 4 sezioni: 16 specie, 38 fasi; 15 specie hanno tutte le tessere richieste |
| Consegne `origin/gpt/immagini` | 118 tessere corrispondono a chiavi valide dei dati; 30 ulteriori tessere per 5 specie/10 fasi sono ancora da verificare e importare |
| Ancora senza consegna | 73 tessere per 13 specie/31 fasi |
| UI del candidato | Su richiesta di Matteo, selettore abilitato nelle schede complete e contestuali delle 15 specie con serie interamente importata. Panoramica iniziale e fasi documentate; nessun selettore per serie parziali o assenti |

Le 30 tessere aggiuntive sono nelle tavole fasi-31…34 (prataioli ed entoloma). La verifica delle chiavi del manifest non sostituisce quella delle immagini e dell'import. Fra le specie ancora senza consegna ci sono porcini, gallinaccio, coprino, chiodino e alcuni boleti. Il brief resta [handoff-immagini-fasi.md](../handoff-immagini-fasi.md).

Il selettore del candidato mostra la descrizione e la fonte della fase e solo i disegni documentati per quella fase. Non mescola forme/colori della panoramica con immagini di età diverse, non modifica le foto né attribuisce una fase dal calendario. Le cautele della specie restano sopra i caratteri; la fase a uovo mostra anche il divieto di raccolta e il limite della sezione. Se il catalogo delle icone arriva tardi la pagina resta utilizzabile e viene arricchita quando disponibile. Shell v107, modulo incluso nel precache.
