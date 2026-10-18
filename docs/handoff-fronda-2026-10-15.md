# Handoff Fronda — identità e design system

> Aggiornamento del 16/10: la nuova scelta A funghi / Piante spontanee / Passeggiata supera la gerarchia fissa funghi → giro → scoperte descritta in questo handoff storico. Riferimento corrente: [Intento dell’uscita](ux-navigazione.md#intento-delluscita--decisione-del-16-ottobre-2026).

15 ottobre 2026. Studio approvato da Matteo in questa chat; trasferimento nel repository, non integrazione del rebranding nell’app.

Leggere insieme a [handoff di prodotto](handoff-2026-10-14.md) e [AGENTS.md](../AGENTS.md). Per iniziare l’implementazione usare il [prompt operativo](prompt-agente-fronda.md).

## Decisioni approvate

- Nome **Fronda**. Il progetto resta un compagno per scegliere dove/quando andare a funghi nel Reatino e conoscere il bosco durante il giro.
- Marchio **C / Lobata**: foglia con pochi lobi larghi, sentiero in negativo e richiamo a un pennino. Il riferimento alla scrittura è voluto. Il contorno deve essere naturale e leggibile, senza dentellature o effetto strappato.
- Conservare la geometria di `fronda/assets/master-geometry.json` e dei master SVG. Non ripartire da un nuovo logo né ricalcare le tavole raster.
- Verde bosco più luminoso **#24513D**, avorio **#F7F4EA**, verde profondo **#163D2D** per dettaglio.
- Tutti e quattro gli accenti convivono: polline **#F5D21F**, calendula **#F5822A**, fiordaliso **#7AA5EF**, germoglio **#A7C957**. Uno domina la singola composizione, gli altri sostengono. Non ridurre il sistema a un solo accento e non assegnare automaticamente un colore diverso a ogni sezione.
- Tipografia: Manrope per interfaccia; Fraunces per titoli editoriali e racconto. Font e licenze inclusi. Logotipo già in tracciati.
- Tono: curioso, concreto, vicino alla natura; frasi brevi. Nessuna promessa di ritrovamento o identificazione certa.

## Dove trovare il lavoro

Tutto il kit è in `docs/fronda/`, comprese tavole storiche e prompt di generazione, da distinguere dalla direzione adottata.

| Risorsa | Uso |
|---|---|
| [Manuale PDF, 26 pagine](fronda/Fronda-Identita-Design-System.pdf) | Studio completo: strategia, marchio, coordinato, sistema e piano di integrazione |
| [Guida HTML](fronda/index.html) | Specifiche e componenti interattivi |
| [Prototipo](fronda/product.html) | Applicazione esemplificativa desktop/mobile; non sostituisce il prodotto |
| [README del kit](fronda/README.md) | Inventario e istruzioni |
| [Token JSON](fronda/tokens.json) / [CSS generato](fronda/styles/tokens.css) | Primitive → ruoli semantici → componenti; temi chiaro/scuro |
| [Master](fronda/assets/master-geometry.json) / [SVG orizzontale](fronda/assets/fronda-logo-horizontal-forest.svg) | Geometrie di produzione |
| [Direzione adottata](fronda/fronda-natura-a-colori.png) | Atmosfera, non valori o geometrie da estrarre dal raster |
| [Palette esatta e applicazioni](fronda/assets/fronda-palette-applicazioni.svg) | Riferimento vettoriale dei quattro accenti |
| [Fonti dei contenuti](fronda/FONTI-PROGETTO.md) / [Snapshot](fronda/content-source.json) | Commit, conteggi, hash e attribuzioni |
| [Verifiche](fronda/VERIFICA.md) | Esiti e limiti del kit prima del trasferimento |

Template SVG: carta intestata A4, biglietti fronte/retro, taccuino A5, social, story, adesivi e tote. Dimensioni nominali, prova di stampa e abbondanze da concordare con lo stampatore. Nome e marchio non sottoposti a verifica legale di registrabilità.

## Provenienza e stato attuale

I contenuti dello studio derivano dal commit `44f1420e5bc08474428e1049cc9ce550799e9bf0`, ramo `claude/brave-tesla-wu0a2b`. Il trasferimento parte dalla produzione aggiornata `98ea52a`. Lo snapshot del kit rimane dichiarato: non è una nuova fonte canonica per il prodotto e non va riversato sui dataset attuali.

Nello snapshot: 15 zone, 70 piante, 39 alberi, 88 record tassonomici fungini, 14 specie con modello, 46 voci del selettore, 47 termini e 3 guide. Nel prototipo: 12 schede selezionate, le 15 zone, 3 guide e glossario ricercabile. I contenuti CMS possono differire da Git.

Il prototipo non si collega a meteo, account, community o servizi privati. Il taccuino salva solo nel browser con chiave separata `fronda:studio:v11:notes`. Nessun dato reale dell’utente va migrato da questo prototipo. I valori meteo assenti rimangono «—»; il 7,2 del manuale è un esempio tipografico dichiarato.

## Come tradurre lo studio nell’app

1. **Inventario sulla produzione corrente.** Aggiornare il ramo e leggere i moduli effettivi: `index.html`, `css/style.css`, JS, CMS, Worker e test. Confrontare i flussi esistenti con il manuale. Il prototipo semplifica: non usarlo come riscrittura funzionale.
2. **Fondazioni.** Mappare i ruoli dei token sulle superfici dell’app; importare master e font; mantenere temi, focus, contrasto, responsive e reduced motion. La guardia del kit copre il kit: non dichiarare che protegge già tutto il codice legacy. Estenderla al prodotto con perimetro esplicito e senza deroghe silenziose.
3. **Componenti.** Testata/navigazione, filtri, pulsanti, campi, messaggi, schede, dialoghi, dati e stati. Rendere i componenti condivisi prima delle singole schermate; mantenere tutti i caratteri diagnostici, avvisi e attribuzioni.
4. **Flussi.** Uscite e zona/mappa; Scopri e confronti/schede/glossario/guide; Taccuino e profilo. Verificare su contenuti reali lunghi e stati vuoto/caricamento/errore/cache/rete lenta.
5. **Consegna.** Aggiornare handoff e documentazione, presentare PR verso produzione con verifiche. Il merge avvia il deploy; il trasferimento dello studio non è un ordine di deploy o di modifica dei servizi.

## Semantica dei colori nell’app (decisioni di Matteo, 15/10)

Ogni colore ha un compito. I valori stanno solo in `css/tokens.css` (ruoli pubblici sopra primitive `--_ref-*`); `css/fronda.css` usa solo i ruoli e la guardia `tools/ds-guard.mjs` controlla i contrasti delle coppie.

| Compito | Ruolo | Chiaro | Scuro | Dove |
|---|---|---|---|---|
| Interazione | `--link` | bosco #24513D | bosco chiaro #B7D0A6 | link, «indietro», link di sezione e nel testo, righe «vai a…» |
| Selezione («scelto») | `--select` / `--select-ink` / `--select-edge` | polline, testo bosco notte, filo ocra #957A00 | polline, testo bosco notte, filo polline | filtri e chip attivi, giorno scelto (home, zona, mappa), segmenti di Scopri, sotto-schede (sottolineatura), voce attiva della barra in basso e della barra desktop |
| Azione principale | `--action` / `--action-ink` | polline | polline | bottone pieno dell’azione principale (Vedi l’uscita, Nuovo appunto) |
| Informazione | `--accent` | calendula scura | calendula chiara | occhielli ed etichette non cliccabili («GIOVEDÌ 15 OTTOBRE», «121 VOCI») |
| Indice | `--s0…--s5`, `--viz-index` | neutri → ambra → verdi | neutri → ambra → verdi | anello, pallini, scala e grafici. Verde da 6, ambra da 3 a meno di 6, neutri sotto 3 (decisione del 18/10); classi e calcolo invariati |

- **Selezione e azione** hanno lo stesso giallo ma forme diverse: lo «scelto» sta dentro un gruppo (fila, vassoio, barra), ha il filo `--select-edge` e, nei filtri, la spunta; l’azione è un bottone pieno senza filo, con il segno dell’azione (＋, →). Il polline su avorio ha poco contrasto di forma (1,35:1): per questo il filo ocra (≥3:1 su bg, surface, surface-2, surface-3).
- **Giorno scelto:** polline con testo bosco notte; il pallino resta nel colore del suo indice, con un anello sottile scuro. Niente più verde pieno né doppio bordo nero.
- **Tema scuro:** superfici più chiare del fondo (carta 1,37:1 sul fondo, era 1,19; surface-2 1,60:1) e filetti più visibili; il taccuino usa le superfici dei token.
- La calendula resta per le icone informative (riquadri delle schede, segnalibro del taccuino).
- **Bottoni tenui** («Confronta», pillole d’azione, righe-invito come «Come funziona l’indice», filtri rimovibili): bosco su fondo neutro (`--link` su `--surface-2`).
- **Interruttori accesi** (preferenze, livelli della mappa): polline con il filo, come la selezione.
- **Alone delle pagine di dettaglio** (`js/ambilight.js`): dietro la testata di zona, fungo, pianta e albero una copia della foto (versione normale, mai l’HD) sfocata e più satura; tenue e luminosa in chiaro, ben visibile in scuro. Mai in home. Spenta con «riduci trasparenza».

## Navigazione di Scopri e Impara

- Scopri ha quattro sezioni: Funghi, Piante e fiori, Alberi, Impara (riga delle sezioni, segmento scelto in polline). Nei cataloghi sotto c’è la riga delle sotto-schede (Sfoglia | Impara a riconoscere).
- **Impara senza triplo livello:** la pagina indice di Impara mostra la riga delle sezioni; le pagine interne (Glossario, Guide, Bosco e sentiero, Sfide) mostrano **solo** la riga delle sotto-schede. Si torna a Scopri con «indietro» (porta all’indice di Impara) o dalla barra.
- Testata della home: titolo «Dove andare» su una riga e mappa sulla stessa riga del titolo (tondo da 40 px sotto i 600 px, pillola «Mappa delle zone» da 600 px); riga del meteo e nota a tutta larghezza sotto.
- Accanto al marchio un’etichetta discreta «Rieti» («pilota · Rieti» da 480 px) porta a Regole e metodo, dove in cima c’è la frase dell’avviso iniziale sulla versione pilota.

## Vincoli di prodotto da preservare

- Gerarchia funghi → giro → scoperte. Nomi Uscite, Scopri, Taccuino; titoli home come handoff. Guide/glossario in Scopri. La Mappa è una voce della barra al primo livello (decisione di Matteo, 15/10, dopo la prova con la mappa dentro Uscite); la ricerca generale resta visibile in ogni pagina, anche nei cataloghi. La shell osservata nello snapshot aveva ancora Mappa/Impara: il manuale propone la riconciliazione con l’handoff, non attesta che sia già stata rilasciata.
- Il confronto descrive e restringe candidati, non identifica o certifica commestibilità. I sosia e gli avvisi di rischio restano visibili. Nessuna sostituzione di foto scientifiche con immagini generate.
- Indice sperimentale 0–10, virgola decimale; dato assente diverso da zero; indice biologico distinto da ordinamento pratico. Nessun nuovo parametro del modello per esigenze estetiche.
- Pagina per esplorazione e pannello contestuale per compiti interni, con stesso contenuto, contesto e focus di ritorno. Lente per la foto.
- Note private; condivisione solo esplicita. Passkey, permessi editoriali, cache e API conservati. Proteggere i dati del taccuino e le chiavi esistenti.
- Copie del CMS, licenze, crediti, punti di ritaglio e immagini stagionali attuali restano autorevoli. Non copiare i 12 record del prototipo sul catalogo completo.

## Verifiche e pubblicazione

Kit: `node docs/fronda/scripts/check.mjs` e `node docs/fronda/scripts/guard-test.mjs`. In CI sono controlli aggiuntivi; non impongono ancora i token Fronda ai file legacy dell’app.

Per modifiche al prodotto seguire AGENTS: unitari, dry-run, browser mirati per ogni area e suite completa verde prima del rilascio. Uno solo dei server di test su 8788. Verificare temi, larghezze 320/390/768/1280+, tastiera e contenuti lunghi. Incrementare SHELL e meta app-version insieme quando si modificano file dell’app pubblicata, aggiornando PRECACHE secondo necessità.

`docs/fronda/` è escluso dagli asset Cloudflare tramite `.assetsignore`: il kit è consultabile dal repository o con server locale, non viene pubblicato con il sito. Nessuna modifica allo shell o ai servizi applicativi in questo trasferimento. I PNG del kit sono ammessi dal `.gitignore` locale della cartella; non cambiare la regola globale delle immagini.

Le verifiche del trasferimento e il collegamento alla PR sono riportati nella descrizione della PR. Il resoconto `fronda/VERIFICA.md` descrive il kit e i test del prototipo, non certifica il prodotto dopo una futura integrazione.
