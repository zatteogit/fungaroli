# Istruzioni per gli agenti (Codex, Claude Code e altri)

Prima di modificare qualcosa leggi [docs/handoff-2026-10-14.md](docs/handoff-2026-10-14.md): contiene le decisioni di prodotto, i nomi definitivi, dove stanno dati e codice e i limiti noti. Questo file riassume solo le regole che si rompono più facilmente.

Per identità visiva e design system Fronda leggi anche [docs/handoff-fronda-2026-10-15.md](docs/handoff-fronda-2026-10-15.md). Il kit in `docs/fronda/` è uno studio approvato: la sua presenza non implica che il rebranding sia già integrato nell’app.

## Fondazione modulare (27/10/2026)

Leggere anche [docs/architecture/README.md](docs/architecture/README.md) e
[design-system/README.md](design-system/README.md). Il nucleo `src/js/core/` non dipende
da browser o server. I branch delle offerte condividono il nucleo e i contratti; non duplicarli.
Per le prove usare le configurazioni isolate, mai le risorse di produzione. I profili commerciali
sono composizioni previste, non permessi o funzioni già attive.

## Rami e pubblicazione

- Il ramo di produzione è **`claude/brave-tesla-wu0a2b`**, non `main` (che non esiste). Le PR vanno aperte verso quel ramo.
- Il merge nel ramo di produzione pubblica il sito su Cloudflare Workers (https://fungaroli.zatteo.workers.dev). Configurazione versionata in `wrangler.jsonc`: non aggiungere binding o variabili dalla dashboard.
- Prima di iniziare aggiorna il ramo da produzione; lavora su un ramo dedicato.
- `docs/handoff-cloudflare.md` descrive il bootstrap del 12/10: è storia, non la procedura attuale.
- Mai segreti in commit, documenti o log.
- **Anteprime Cloudflare spente (24/10/2026):** i rami delle PR non hanno più il controllo «Workers Builds» (Settings → Build → Branch control). Per riaccenderle servono risorse separate e un blocco `previews` in `wrangler.jsonc` (`npx wrangler preview`); mai i database di produzione.

## Verifiche

**TypeScript (migrazione graduale):** i moduli con intestazione «Generated from» in `js/`
sono generati da `src/js/*.ts` (dispositivo, meteo e modelli/archivi del taccuino). Modificare i sorgenti, eseguire `npm run build:typescript` e
includere nel commit anche il JavaScript generato. `npm test` controlla tipi e
coerenza degli output. Non aggiungere codice manuale nei file generati.
Perimetro e comandi in [docs/typescript.md](docs/typescript.md).

```bash
npm ci
npm test                                  # test unitari (Node ≥ 22)
npx wrangler deploy --dry-run             # configurazione del Worker
CHROMIUM_PATH=/percorso/chromium npx playwright test   # suite browser, Wrangler locale sulla porta 8788
git diff --check
```

Leggibilità: `node tools/visual-audit.mjs --base http://127.0.0.1:<porta> --out <cartella> --label <nome>` misura il contrasto di tutti i testi visibili (viste principali, 320/390/768/1280, chiaro e scuro; copertine provate con tutte le foto del catalogo) su un server già avviato. Dura circa 45 minuti; `--views`, `--widths`, `--themes`, `--sweep none` lo restringono. `tests/browser/legibility.spec.mjs` ne controlla le copertine con la foto più chiara.

La suite browser avvia un solo Wrangler sulla porta 8788: non lanciarne due insieme. Se occupata da altri lavori, usare `FRONDA_TEST_PORT` con una porta libera; non arrestare servizi altrui. La CI (`.github/workflows/ci.yml`) esegue test unitari e dry-run su ogni PR.

**Quando lanciare la suite browser** (dura circa 8–10 minuti):
- a ogni modifica, solo gli spec delle parti toccate (`npx playwright test tests/browser/<spec> -g "<titolo>"`);
- la suite completa è facoltativa e non è un requisito per pubblicare. Quando viene eseguita, usare una copia separata (git worktree), senza modificarne i file durante i test;
- un test noto per problemi di tempi (es. «vetrina varia») va rilanciato da solo prima di considerarlo instabile. Riportare gli errori e i limiti delle verifiche nella PR.

## Regole che non si vedono dal codice

- **Copertine delle uscite (decisione di Matteo, 20/10):** prima video associati alla località e coerenti con stagione/meteo, poi foto della località con le varianti meteo disponibili; stock solo senza alternative locali. Le animazioni e varianti generate da foto sono illustrative, non riprese dal vivo. Il video Gemini fornito da Matteo è associato al Tancia soltanto in autunno asciutto; niente uso con pioggia, neve, nebbia o temporali. Conservare lo still iniziale e un solo video attivo.

- **Schede integrate (decisione di Matteo, 20/10):** ogni scheda fa parte dell’ecosistema Fronda: azione di annotazione, collegamento al Taccuino, osservazioni personali e aggregati per zona quando effettivamente disponibili, rimandi pertinenti alle altre sezioni e glossario. Non trasformare habitat compatibili o fotografie di catalogo in segnalazioni locali. Conservare soglie e accesso della community, distinguendo dati personali, dichiarati e verificati.

- **Confronti fra funghi:** frecce e swipe scorrono soltanto i sosia documentati a destra con una breve dissolvenza locale; i menu su entrambi i nomi offrono prima i sosia e poi tutto il catalogo. Titolo unico «Confronta», conteggio dei sosia nel selettore e nome corrente dopo lo scroll, nessuna etichetta duplicata sotto le foto né avviso blu per le altre coppie; il fungo di riferimento a sinistra resta lo stesso elemento. Niente binario orizzontale o traslazione della coppia. Il confronto si avvia anche da `#/confronta` (Scopri → Funghi), scegliendo due specie distinte; si possono modificare entrambi i lati. Appena sono selezionate due specie si apre direttamente la stessa vista completa usata dalle schede: niente «Inverti» o passaggio di conferma «Confronta i caratteri». Le coppie libere restano distinte dai sosia documentati, senza creare relazioni nei dati. I selettori di forma e colore nel confronto modificano soltanto i disegni della rispettiva specie, offrendo tutti i valori documentati nelle rispettive righe (forma e colore del cappello, colore di lamelle/pori). Le forme archiviate approvate sono recuperate anche per le specie con fasi di crescita: nel confronto i due percorsi coesistono e l’import non deve archiviarle nuovamente. Usano le varianti e combinazioni disponibili in `data/trait-icons.json`, con i diagrammi SVG esistenti per quelle mancanti; non filtrano i valori né modificano le relazioni fra caratteri. Rispetta «riduci movimento» e conserva nomi, selezione e tabella sincronizzati.
- **Microicone delle forme (18/10):** nei selettori di forma della scheda e del confronto usare piccoli profili monocromatici neutri accanto alle etichette, riusando le geometrie didattiche esistenti. Solo contorno, senza colore, gambo o dettagli di specie: indicano una forma, non raffigurano il fungo. Il raster principale resta separato.
- **Richiami ai particolari (18/10):** nel confronto anello, volva e reticolo possono usare frecce esterne su livello UI separato; mai modificare, velare o ritagliare il raster. Usare soltanto ancoraggi revisionati per il file esatto in `data/trait-callouts.json` (hash e campo dati controllati dai test). Se il dato è ignoto, la zona non è rappresentata o il selettore passa a una variante non revisionata, nessun richiamo. La freccia indica la zona da osservare anche quando il carattere è assente.
- **Modali:** `js/modal-scroll.js` blocca lo scroll sottostante. Tutte le aperture passano da `openModal()` di `js/modal-flow.js`: un solo dialog modale aperto alla volta. Aprire un nuovo contenuto chiude temporaneamente il precedente senza eseguire il cleanup, conservandone DOM, valori e scroll. Freccia Indietro/Escape tornano al passaggio precedente; la X esce dal percorso. Navigare a un’altra rotta chiude i pannelli attivi. Le schede contestuali aperte da pagine o altre schede entrano nella cronologia browser senza cambiare URL: nota → scheda → luogo torna alla scheda e poi alla nota (decisione del 18/10). La freccia segue il percorso reale; il padre è solo il ripiego per link diretti. La X esce dall’intero percorso delle schede. Le ultime 16 visite conservano DOM e scroll in memoria, quelle più lontane si ricostruiscono; reload e cambio account non ripristinano il registro. Vedi `js/navigation-context.js` e docs/ux-navigazione.md. Niente pile di pannelli o backdrop visibili; nessun nuovo `showModal()` diretto fuori dal coordinatore. Mantieni lo scroll interno, il ritorno alla posizione precedente e il riferimento viewport di intestazione/navbar; non escludere Safari dal blocco né usare `position:fixed` sul body. I dialog non modali e i popover non bloccano la pagina. Con tastiera aperta usare altezza e offset del visual viewport per contenere i dialog, mantenere raggiungibili header/chiusura e scorrere soltanto il contenuto del dialog per il campo attivo. I suggerimenti devono rispettare il bordo inferiore visibile e l’header sticky, aggiornandosi anche sullo scroll del visual viewport.
- **Avviso obbligatorio (18/10):** prima della conferma, header/navbar/viste restano `inert` e `openModal` permette solo `#onboarding`. Privacy e cookie policy si leggono nello stesso dialog; non usare link che chiudano l’avviso e aprano l’app. `js/legal-access.js` registra versione, impronta e data locale e sincronizza la ricevuta al profilo quando disponibile. L’installazione facoltativa segue la conferma; non la sostituisce e non la revoca. Non inventare date per conferme storiche. Dettagli in docs/accettazione-condizioni.md.
- **Cache del service worker:** quando cambia un file dell'app pubblicata, incrementa `SHELL` in `sw.js` (`fungaroli-shell-vNN`), metti lo stesso valore in `<meta name="app-version">` di `index.html` (serve all'avviso «versione nuova»; lo controlla un test) e aggiorna `PRECACHE` se aggiungi moduli.
- **CMS:** i contenuti pubblici possono arrivare dallo snapshot del CMS (D1 `CMS_DB`). Cambiare solo un JSON in `data/` non sostituisce un contenuto già pubblicato da un autore. Per un campo nuovo aggiorna insieme schema, renderer, seed e snapshot (vedi `docs/cms.md`).
- **Nomi definitivi:** barra con **Uscite**, **Mappa**, **Scopri**, **Taccuino** e la ricerca sempre visibile (decisione di Matteo del 15/10: la mappa resta al primo livello; Impara sta dentro Scopri); titoli home «Dove andare», «Altre buone uscite», «Nei boschi in questi giorni». Nella storia Git compaiono nomi precedenti: non ripristinarli.
- **Ricerca:** un solo cerca globale, anche per il glossario. Cerca in tutta l’app e dà precedenza ai risultati della sezione da cui viene aperto, senza escludere gli altri. Nella ricerca delle specie hanno precedenza nome comune, scientifico e sinonimi; solo in assenza di questi risultati si suggeriscono corrispondenze con caratteri documentati, esplicitando il campo corrispondente. La regola vale anche nei selettori del confronto e nei campi specie. Il glossario si sfoglia per argomento e lettera; i filtri sui candidati restano parte del percorso per caratteri.
- **Interessi dell’uscita (decisione di Matteo, 16/10):** «Alla ricerca di…» apre i filtri; Funghi / Piante / Sentieri sono scelte indipendenti e combinabili, ricordate nel browser e condivise da home e mappa. Le preferenze pratiche sono Poca gente (testo fisso), Accesso comodo e Vicino a me. Solo Funghi mostra l’indice fungino: Piante aggiunge contesto botanico, mai presenza certa o punteggi sommati all’indice; Sentieri richiede un tratto mappato. Senza interessi attivi si esplorano proposte pratiche senza indice. Le selezioni delle specie restano separate e conservate per interesse. Le vecchie istruzioni sugli intenti esclusivi negli handoff sono superate. Vedi docs/ux-navigazione.md. Hero e card condividono struttura e stile.
- **Linguaggio:** l'app descrive caratteri, ambienti e rischi. Non identifica, non certifica commestibilità, non dice «tieni/scarta». L'indice è sperimentale (0–10), non una probabilità.
- **Segnalazioni esterne (decisione di Matteo, 21/10):** peso zero nell'ordine delle uscite (`EXTERNAL_RANKING_WEIGHT` in `js/external-signals-client.js`); servono a verificare l'indice, non a spingerlo. Vedi `tools/prova-lazio/README.md`.
- **Fonti e licenze:** ogni nuovo dato, foto o soglia deve avere fonte e licenza verificabili. Niente soglie inventate, niente bonus numerici da folklore («funghi spia»).
- **Immagini dai dati:** le immagini si disegnano dai dati, mai il contrario. Ogni carattere disegnato è un campo con valori chiusi in uno schema (`cap_color`, `cap_shape`, `stem_ring`, `stages`, chiavi di `recognize-trees.json`), con fonte verificabile. `null` = «non documentato»: non si disegna né in un senso né nell'altro. Due test lo controllano:
  - **coerenza** (`tests/asset-coherence.test.mjs`): ogni immagine e ogni voce degli indici (soggetto, tessera, variante, fase, chiave/valore degli alberi, stagione/meteo dei luoghi) corrisponde a un valore che esiste nei dati;
  - **completezza** (`tests/asset-completeness.test.mjs`): ogni dato ha tutti i suoi asset. Esempi: icone base, varianti di colore, fasi e sezione dell'uovo dei funghi; valori degli alberi; foto con miniatura, punto di ritaglio e crediti; copertine dei luoghi. Ciò che manca sta in `data/asset-pending.json` con il motivo. Le icone il cui dato è cambiato finiscono in «da rifare» (confronto con `data/asset-drawn-from.json`).

  **A ogni aggiunta di dati si verifica che ci siano tutti gli asset:** `node tools/asset-report.mjs` dà il rapporto, da mettere nella descrizione della PR. Gli script d'import rifiutano ciò che non torna con i dati. Prima di nuove immagini si controllano le matrici (es. `docs/controllo-matrici-2026-10-15.md`).
- **Revisione visiva severa delle illustrazioni (18/10):** controllare ogni immagine contro dati, fonti e foto della specie, a grandezza piena e nella UI. Verificare anatomia, forma, colore e caratteri involontari; schema, margini e nome del file non dimostrano correttezza botanica/micologica. Distinguere esempio di una categoria e rappresentazione della specie: un cinorrodo non può illustrare la fragolina solo perché entrambi sono falsi frutti. Nelle schede i colori sono campioni cromatici; forme di fiori, tipi di frutti e foglie composte richiedono una scelta revisionata per specie. Per tutti gli agenti la sequenza è vincolante: generazione raster → revisione severa e correzione raster → vettorializzazione del raster approvato. Non correggere direttamente in SVG saltando la sorgente raster. Registrare prompt, riferimento, limiti e motivi di scarto; bloccare le immagini fuorvianti senza cambiare i dati per adattarli al disegno.
- **Licenze delle foto:** le foto con licenza non commerciale (CC BY-NC, soprattutto da iNaturalist) restano ammesse finché l'app è gratuita e senza pubblicità. Per le foto nuove preferisci CC0, CC BY o CC BY-SA e registra sempre autore, licenza, link alla licenza e pagina della fonte. Niente immagini generate al posto delle foto delle specie.

## Lavori di altri agenti

- Le proposte di altri agenti o di altre IA (rami `codex/*`, `gpt/*`, documenti di ricerca, PR aperte da altre sessioni) sono **ipotesi**. Non si uniscono e non cambiano app, dati o indice senza una valutazione scritta e una decisione del proprietario.
- Il registro e le valutazioni stanno in [docs/ipotesi/](docs/ipotesi/README.md). Prima di riprendere un lavoro trovato in un altro ramo controlla lì il suo stato.
- Fanno fede il ramo di produzione e i documenti in `docs/`. Ciò che sta solo in un altro ramo non è una decisione presa.

## Decisioni

Quando per proseguire serve una decisione del proprietario del progetto, chiedila sempre con domande a scelta (alternative chiare, quella consigliata per prima). Non decidere al suo posto e non fermarti senza chiedere.

## Testi

Italiano, frasi brevi, senza gergo. Decimale con la virgola (7,2). Distinguere sempre fatto verificato, interpretazione e dato non verificato.

**Presentazione dei contenuti (decisione di Matteo):** Fronda è un’app, non una voce enciclopedica. Mostra prima i dati consultabili a colpo d’occhio: schede con etichette, valori e icone; calendari mensili o «Tutto l’anno» quando tutti i mesi sono documentati. Evita colonne strette con lunghi paragrafi e liste di mesi testuali. Usa `js/content-ui.js` e `css/content-ui.css` per mantenere lo stesso linguaggio nelle schede, nelle guide e nelle informazioni. Separa le spiegazioni dai dati principali senza inventare categorie o riassunti scientifici; conserva testi, link e fonti. Cautele, condizioni e istruzioni di sicurezza restano leggibili integralmente. Tipografia: corpo descrittivo di norma 16 px, note secondarie 13–14 px, interlinea 1,6–1,7 e misura di lettura entro 65 caratteri circa. Usa titoletti brevi e grassetti selettivi su concetti già documentati; non mettere in grassetto interi paragrafi. Gli elenchi narrativi seguono un ordine unico, senza una card per ogni frase. Colore dosato e semantico: superfici neutre per i dati; calendula per piccoli segnali informativi, fiordaliso per contesto e osservazione, ambra per cautele, rosso per i rischi dichiarati critici. Non dedurre la gravità dal testo. Etichette e simboli accompagnano sempre il colore. Gli approfondimenti principali delle schede usano `js/entity-accordions.js`: intestazione riconoscibile e una sola sezione aperta alla volta.

## Knowledge base · Kipi

Per `kipi init`, `scan`, `process`, `update` o `status`, usa la [skill locale](.agents/skills/kipi/SKILL.md), adattata all’intero repository Fungaroli. Leggi prima indice e stato in `knowledge/`. Il riepilogo di ingresso è in [agents/kipi.md](agents/kipi.md).

- **Condizioni dell’uscita (decisione di Matteo, 20/10):** il numero generale mostrato in home, mappa e testata della zona include il fattore meteo già usato nell’ordine (`OUTING_RANK`), una sola volta. Etichetta «Condizioni», cerchio, nessun «/10» visibile nel badge. Il potenziale biologico resta distinto negli approfondimenti e nel modello. Senza meteo verificabile, nessun numero complessivo. Con alternative meno critiche non raccomandare uscite sconsigliate; se il meteo è sfavorevole ovunque, dirlo nelle intestazioni invece di chiamarle «buone uscite». Questa regola supera le vecchie indicazioni sul numero generale rimasto esclusivamente biologico. Vedi [docs/condizioni-uscita.md](docs/condizioni-uscita.md).

- **Gerarchia dei controlli (prova approvata da Matteo, 20/10):** azioni principali polline; accessi secondari a contorno; selezione persistente verde tenue con bordo e spunta quando prevista; navigazione con indicatore nel gruppo. Stessa semantica in light/dark. Annota globale è primario, Confronta e Impara nell’indice sono secondari equivalenti. La regola supera le indicazioni precedenti che assegnavano polline sia all’azione sia alla selezione. Usare i ruoli pubblici `--action*` e `--select*`, senza colori locali; dettagli in docs/fronda/README.md.

- **Revisione dei controlli di Matteo, 21/10 (supera la prima prova del 20/10):** CTA verdi e tondeggianti in light; lo stesso verde diventa bianco in dark, con testo bosco notte. Selezioni gialle in entrambi i temi, rettangoli smussati con bordino e spunta quando prevista. Giallo, ciclamino e corallo sono accenti editoriali; il corallo riprende il tono indicato da Matteo nel badge «Mortale», ma i token di rischio restano separati da quelli decorativi. La distinzione usa insieme ruolo, forma e colore. Non ripristinare la prima prova con CTA gialle e selezioni verdi.

- **Forme e bordi, successiva correzione di Matteo il 21/10:** conservare i colori della revisione (CTA verdi light/bianche dark e selezioni gialle), ripristinando forme e bordi precedenti: chip e destinazioni della barra tornano alle proprie geometrie, senza una nuova regola globale che li renda tutti rettangolari. I pulsanti degli strumenti conservano il raggio precedente e i contorni secondari non vanno rinforzati indiscriminatamente. La frase del giorno mantiene la cornice discreta e migliora attraverso disposizione e tipografia.
