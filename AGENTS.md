# Istruzioni per gli agenti (Codex, Claude Code e altri)

Prima di modificare qualcosa leggi [docs/handoff-2026-10-14.md](docs/handoff-2026-10-14.md): contiene le decisioni di prodotto, i nomi definitivi, dove stanno dati e codice e i limiti noti. Questo file riassume solo le regole che si rompono più facilmente.

Per identità visiva e design system Fronda leggi anche [docs/handoff-fronda-2026-10-15.md](docs/handoff-fronda-2026-10-15.md). Il kit in `docs/fronda/` è uno studio approvato: la sua presenza non implica che il rebranding sia già integrato nell’app.

## Rami e pubblicazione

- Il ramo di produzione è **`claude/brave-tesla-wu0a2b`**, non `main` (che non esiste). Le PR vanno aperte verso quel ramo.
- Il merge nel ramo di produzione pubblica il sito su Cloudflare Workers (https://fungaroli.zatteo.workers.dev). Configurazione versionata in `wrangler.jsonc`: non aggiungere binding o variabili dalla dashboard.
- Prima di iniziare aggiorna il ramo da produzione; lavora su un ramo dedicato.
- `docs/handoff-cloudflare.md` descrive il bootstrap del 12/10: è storia, non la procedura attuale.
- Mai segreti in commit, documenti o log.

## Verifiche

```bash
npm ci
npm test                                  # test unitari (Node ≥ 22)
npx wrangler deploy --dry-run             # configurazione del Worker
CHROMIUM_PATH=/percorso/chromium npx playwright test   # suite browser, Wrangler locale sulla porta 8788
git diff --check
```

Leggibilità: `node tools/visual-audit.mjs --base http://127.0.0.1:<porta> --out <cartella> --label <nome>` misura il contrasto di tutti i testi visibili (viste principali, 320/390/768/1280, chiaro e scuro; copertine provate con tutte le foto del catalogo) su un server già avviato. Dura circa 45 minuti; `--views`, `--widths`, `--themes`, `--sweep none` lo restringono. `tests/browser/legibility.spec.mjs` ne controlla le copertine con la foto più chiara.

La suite browser avvia un solo Wrangler sulla porta 8788: non lanciarne due insieme. La CI (`.github/workflows/ci.yml`) esegue test unitari e dry-run su ogni PR.

**Quando lanciare la suite browser** (dura circa 8–10 minuti):
- a ogni modifica, solo gli spec delle parti toccate (`npx playwright test tests/browser/<spec> -g "<titolo>"`);
- la suite completa una volta per rilascio, in background, quando più modifiche sono pronte; nel frattempo si lavora in una copia separata (git worktree), mai sui file del repository mentre la suite gira;
- si pubblica solo con la suite completa verde. Un test noto per problemi di tempi (es. «vetrina varia») va rilanciato da solo prima di considerarlo instabile.

## Regole che non si vedono dal codice

- **Cache del service worker:** quando cambia un file dell'app pubblicata, incrementa `SHELL` in `sw.js` (`fungaroli-shell-vNN`), metti lo stesso valore in `<meta name="app-version">` di `index.html` (serve all'avviso «versione nuova»; lo controlla un test) e aggiorna `PRECACHE` se aggiungi moduli.
- **CMS:** i contenuti pubblici possono arrivare dallo snapshot del CMS (D1 `CMS_DB`). Cambiare solo un JSON in `data/` non sostituisce un contenuto già pubblicato da un autore. Per un campo nuovo aggiorna insieme schema, renderer, seed e snapshot (vedi `docs/cms.md`).
- **Nomi definitivi:** barra con **Uscite**, **Mappa**, **Scopri**, **Taccuino** e la ricerca sempre visibile (decisione di Matteo del 15/10: la mappa resta al primo livello; Impara sta dentro Scopri); titoli home «Dove andare», «Altre buone uscite», «Nei boschi in questi giorni». Nella storia Git compaiono nomi precedenti: non ripristinarli.
- **Ricerca:** un solo cerca globale, anche per il glossario. Cerca in tutta l’app e dà precedenza ai risultati della sezione da cui viene aperto, senza escludere gli altri. Il glossario si sfoglia per argomento e lettera; i filtri sui candidati restano parte del percorso per caratteri.
- **Interessi dell’uscita (decisione di Matteo, 16/10):** «Alla ricerca di…» apre i filtri; Funghi / Piante / Sentieri sono scelte indipendenti e combinabili, ricordate nel browser e condivise da home e mappa. Le preferenze pratiche sono Poca gente (testo fisso), Accesso comodo e Vicino a casa. Solo Funghi mostra l’indice fungino: Piante aggiunge contesto botanico, mai presenza certa o punteggi sommati all’indice; Sentieri richiede un tratto mappato. Senza interessi attivi si esplorano proposte pratiche senza indice. Le selezioni delle specie restano separate e conservate per interesse. Le vecchie istruzioni sugli intenti esclusivi negli handoff sono superate. Vedi docs/ux-navigazione.md. Hero e card condividono struttura e stile.
- **Linguaggio:** l'app descrive caratteri, ambienti e rischi. Non identifica, non certifica commestibilità, non dice «tieni/scarta». L'indice è sperimentale (0–10), non una probabilità.
- **Fonti e licenze:** ogni nuovo dato, foto o soglia deve avere fonte e licenza verificabili. Niente soglie inventate, niente bonus numerici da folklore («funghi spia»).
- **Immagini dai dati:** le immagini si disegnano dai dati, mai il contrario. Ogni carattere disegnato è un campo con valori chiusi in uno schema (`cap_color`, `cap_shape`, `stem_ring`, `stages`, chiavi di `recognize-trees.json`), con fonte verificabile. `null` = «non documentato»: non si disegna né in un senso né nell'altro. Due test lo controllano:
  - **coerenza** (`tests/asset-coherence.test.mjs`): ogni immagine e ogni voce degli indici (soggetto, tessera, variante, fase, chiave/valore degli alberi, stagione/meteo dei luoghi) corrisponde a un valore che esiste nei dati;
  - **completezza** (`tests/asset-completeness.test.mjs`): ogni dato ha tutti i suoi asset. Esempi: icone base, varianti di colore, fasi e sezione dell'uovo dei funghi; valori degli alberi; foto con miniatura, punto di ritaglio e crediti; copertine dei luoghi. Ciò che manca sta in `data/asset-pending.json` con il motivo. Le icone il cui dato è cambiato finiscono in «da rifare» (confronto con `data/asset-drawn-from.json`).

  **A ogni aggiunta di dati si verifica che ci siano tutti gli asset:** `node tools/asset-report.mjs` dà il rapporto, da mettere nella descrizione della PR. Gli script d'import rifiutano ciò che non torna con i dati. Prima di nuove immagini si controllano le matrici (es. `docs/controllo-matrici-2026-10-15.md`).
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
