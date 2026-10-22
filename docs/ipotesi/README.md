# Registro delle ipotesi

Qui stanno i lavori proposti da altri agenti o da altre IA (Codex, GPT, altre sessioni) e le proposte di ricerca. Finché non c'è una valutazione scritta e una decisione di Matteo sono **ipotesi**: non si uniscono al ramo di produzione e non cambiano l'app, i dati o l'indice.

Come si usa:

1. Un lavoro nuovo entra qui con ramo, commit e data.
2. La valutazione distingue fatto verificato, ipotesi, da costruire e parere, e sta in un file di questa cartella.
3. Le decisioni di Matteo si registrano nella valutazione e nella colonna «Stato».
4. Ciò che viene adottato entra con una PR verso produzione che cita la valutazione. Il resto resta qui, anche se scartato, così non si rifà lo stesso lavoro.

Il ramo di produzione e i documenti in `docs/` fanno fede. Ciò che sta solo in un altro ramo non è una decisione presa.

## Registro

Report editoriale esterno del 22/10 su Fronda e sui mercati dei funghi: [versione pubblica](report-editoriale-2026-10-22.md), senza le parti economiche e commerciali (il PDF completo sta nel repository privato `basecamp`). Ne sono uscite due revisioni decise da Matteo il 22/10: linguaggio sulla commestibilità e privacy (esportazione dei dati, informativa, posizione approssimata, diario KV dismesso, soglia degli aggregati). Il resto resta ipotesi: MycoTrace e MycoGrow sono concept separati da Fronda, non lavori in corso.

Seconda tornata e prova offline sui porcini, in PR il 21/10: [handoff](../handoff-seconda-tornata-2026-10-21.md). Modello 2.1.0 (shock solo sui porcini, con la temperatura del suolo), dati registrati e non usati, informazioni sul bosco, Parco Gran Sasso-Laga, accessi e sentieri. La prova offline chiude la decisione D5.

Video di atmosfera richiesti e autorizzati alla pubblicazione da Matteo il 20/10: [valutazione e collocazioni](video-atmosfera-2026-10-20.md). Ramo `codex/nature-video-release`, porting selettivo della prova locale sulla produzione corrente; nessuna sostituzione delle foto informative.

Estensione del pilota a tutto il Lazio richiesta da Matteo il 19/10: [valutazione della raccolta](estensione-lazio-2026-10-19.md). Tre agenti territoriali, 21 nuove zone candidate e 24 itinerari; documentazione e lacune salvate, integrazione applicativa ancora da eseguire.

Ampliamento fotografico tramite tre agenti, richiesto il 18 e proseguito il 19/10: [valutazione, fonti e integrazione](integrazione-fotografie-agenti-2026-10-19.md). Commons, osservazioni iNaturalist e fotografie istituzionali Dryades; selezione per singolo file, senza ripetere il lotto già pubblicato.

Ampliamento autorizzato il 18/10: [integrazione dei materiali](integrazione-materiali-2026-10-18.md), con [fasi fungine](integrazione-fasi-funghi-2026-10-18.md), [raster botanici](integrazione-raster-botanici-2026-10-18.md), [sorgenti vettoriali](revisione-svg-2026-10-18.md) e [schede animali](../animali-arricchimento-2026-10-18.md). I conteggi distinguono copertura visibile e sorgenti editabili; scarti e pendenze restano documentati.

Consegne dei cinque agenti del 18/10: [valutazione e integrazione selettiva](valutazione-consegne-agenti-2026-10-18.md). Raster e correzioni botaniche adottati dopo controllo; SVG come prototipo tecnico; animali come studio e fotografie come pipeline senza nuovi file acquisiti.

Rilascio delle parti verificate su richiesta di Matteo del 17/10: [valutazione dei rami sospesi](valutazione-rilascio-2026-10-17.md). Include le PR #93, #60 e #98 nel candidato di rilascio; non adotta i due modelli micologici di ricerca né i pacchetti grezzi delle immagini.

| Lavoro | Dove | Stato (21/10/2026) |
|---|---|---|
| Report editoriale esterno «Fronda e le opportunità digitali nel mondo dei funghi» (35 pagine) | [report-editoriale-2026-10-22.md](report-editoriale-2026-10-22.md), PDF in `basecamp/ricerca/report-2026/` | **Valutato in parte il 22/10.** Adottate le correzioni su commestibilità e privacy, in PR. Non adottate: sessioni protette e conservazione a 24 mesi. Mercati, MycoTrace e MycoGrow restano ipotesi. |
| Seconda tornata: modello 2.1.0, umidità 9–27 cm ed ET₀ registrate, informazioni sul bosco, zone A e B del Gran Sasso-Laga, accessi a piedi, fascia e tempi dei sentieri, ritiro della segnalazione quando cambia lo sforzo | ramo locale `lavoro-fase-b`, commit `a23cea0` (unito alla produzione v319, cache v320) | **In PR.** Decisioni di Matteo del 16/10. Salvataggio automatico delle previsioni in corso. [Handoff](../handoff-seconda-tornata-2026-10-21.md) |
| Prova offline dell'indice sui porcini di Bielefeld | ramo locale `lavoro-benchmark`, commit `ff52daf`, `tools/benchmark-bielefeld/` | **In PR**, nella stessa della seconda tornata. Esiti preregistrati: «non distinguibile» sia per indice contro calendario sia per σ 2,0 contro 3,5. [Sintesi](../metodo-scientifico.md#una-prova-offline-i-porcini-di-bielefeld) |
| Pacchetto di ricerca «modello micologico v3» (Codex): covariate, logistica con calibrazione, schema delle uscite, audit delle fonti e dei porcini tedeschi | ramo `codex/fronda-modello-micologico-v3`, commit `4465d2f` | **Valutato**: banco di prova ben costruito, senza modello addestrato né dati. Non si unisce così com'è. [Valutazione](valutazione-modello-v3.md), decisioni D1–D5 nella sezione 9 |
| Decisioni D1–D5 della valutazione v3 | — | D1 (archivio delle previsioni in `COMMUNITY_DB`): **decisa, non costruita**. D2 (ET₀ e 9–27 cm registrati): **costruita** nella seconda tornata, in PR. D3 (sforzo) e D4 (consenso alla ricerca): **decise, da costruire**. D5 (`tsd` del porcino): **chiusa**, resta 3,5 dopo la prova offline. Stato in [valutazione-modello-v3.md](valutazione-modello-v3.md), sezione 10 |
| Documento «Fronda 3.0»: modello a due stadi, trovabilità in percentuale, penalità del vento, tabella delle specie | ramo `claude/ricerca-modello-micologico`, commit `8c0ba55`, `docs/ricerca-modello-micologico-italia.md` | **Valutato, non adottabile**: citazioni inesistenti o sbagliate, soglie senza fonte, percentuali senza coefficienti. Restano idee da misurare: P−ET₀, pioggia massima, fine stagione guidata dalla temperatura. [Valutazione](valutazione-modello-v3.md), sezione 3.2 |
| Questionario per cercatori esperti del Reatino | ramo `codex/questionario-esperti` e seguenti | **Pubblicato** (PR #104, #105, #106). [Valutazione](valutazione-questionario-esperti.md) |
| Misure del servizio meteo: chiamate, quota Open-Meteo stimata, latenza, cache | PR #60, ramo `claude/practical-thompson-izrvq4` | **Unita in produzione** (commit `e70f815`, migrazione `0006_weather_metrics.sql`). [meteo-cache.md](../meteo-cache.md#misure) |
| Titoli e testi senza parola sola in fondo (`text-wrap`) | PR #93, ramo `claude/titoli-senza-orfane` | **Unita in produzione** (commit `70586df`). |
| Candidati botanici conservati per la revisione scientifica: raster, prompt, riferimenti e decisioni anatomiche aperte | ramo `codex/botanical-candidates-review`, commit `fb7726e` (19/10), `docs/assets/botanici-specifici-2026-10-19/` | **Non valutato.** Archivio non unito: il commit dice di non integrare i candidati nell'app. Da valutare con la regola «raster → revisione severa → vettoriale» di AGENTS.md. |
| Immagini dei funghi (fasi, varianti) e ritagli delle foto | rami `gpt/immagini`, `gpt/ritagli` | **Lavoro esterno, fermo al 15–16/10.** Integrato in modo selettivo da altre sessioni; `gpt/immagini` contiene ancora consegne non unite ([ricognizione del 20/10](../ricognizione-integrazione-cataloghi-2026-10-20.md)). Niente immagini generate al posto delle foto delle specie. |
| Infografica di *Amanita caesarea* | PR #1, ramo `infografiche/caesarea` | **Bozza** del 12/10, molto indietro rispetto a produzione. Non toccata. |

**Rami non uniti ma già trattati** (controllo del 21/10/2026 con `git branch -r --no-merged`, senza `fetch`): `codex/external-engine-api`, `codex/external-observations`, `codex/growth-index-icons`, `codex/trails-open-sources`, `codex/lazio-pilot-research`, `assets/enrich-places-photos-2026-10-18` e `content/animals-enrichment` hanno i loro file già in produzione (unione per squash o porting); `images/missing-comparison-2026-10-18`, `images/plant-species-corrections-2026-10-18`, `images/plant-traits-2026-10-18`, `images/semantic-svg-prototype`, `assets/photo-enrichment-2026-10-18` e `research/animals-section` sono registrati nelle valutazioni del 18/10 citate sopra. Non sono proposte nuove.

## Rami già uniti

Il 16/10/2026 58 rami `codex/*` risultavano interamente contenuti nel ramo di produzione. Matteo ha deciso di eliminarli; i commit restano nella storia. Comando, da lanciare da un clone con permessi di scrittura:

```bash
git fetch --prune origin
git branch -r --merged origin/claude/brave-tesla-wu0a2b \
  | sed 's#^ *origin/##' | grep '^codex/' \
  | xargs -n 10 git push origin --delete
```

Il filtro `--merged` esclude da solo `codex/fronda-modello-micologico-v3`, che non è unito.
