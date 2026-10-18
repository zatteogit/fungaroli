# Registro delle ipotesi

Qui stanno i lavori proposti da altri agenti o da altre IA (Codex, GPT, altre sessioni) e le proposte di ricerca. Finché non c'è una valutazione scritta e una decisione di Matteo sono **ipotesi**: non si uniscono al ramo di produzione e non cambiano l'app, i dati o l'indice.

Come si usa:

1. Un lavoro nuovo entra qui con ramo, commit e data.
2. La valutazione distingue fatto verificato, ipotesi, da costruire e parere, e sta in un file di questa cartella.
3. Le decisioni di Matteo si registrano nella valutazione e nella colonna «Stato».
4. Ciò che viene adottato entra con una PR verso produzione che cita la valutazione. Il resto resta qui, anche se scartato, così non si rifà lo stesso lavoro.

Il ramo di produzione e i documenti in `docs/` fanno fede. Ciò che sta solo in un altro ramo non è una decisione presa.

## Registro

| Lavoro nuovo · 18/10/2026 | Dove | Stato |
|---|---|---|
| Sezione Animali: impollinatori, osservazione e prudenza durante le passeggiate | ramo `research/animals-section`; [studio e fonti](animali-2026-10-18/README.md) | **Ipotesi iniziale su richiesta di Matteo**, non integrata. Catalogo ragionato di 18 voci, benchmark, schema e lacune; da valutare prima di implementazione o produzione immagini. |

Consegne dei cinque agenti del 18/10: [valutazione e integrazione selettiva](valutazione-consegne-agenti-2026-10-18.md). Raster e correzioni botaniche adottati dopo controllo; SVG come prototipo tecnico; animali come studio e fotografie come pipeline senza nuovi file acquisiti.

Rilascio delle parti verificate su richiesta di Matteo del 17/10: [valutazione dei rami sospesi](valutazione-rilascio-2026-10-17.md). Include le PR #93, #60 e #98 nel candidato di rilascio; non adotta i due modelli micologici di ricerca né i pacchetti grezzi delle immagini.

| Lavoro | Dove | Stato (17/10/2026) |
|---|---|
| Questionario per cercatori esperti del Reatino | Recupero dalla sessione Claude, ramo `codex/questionario-esperti` | **Valutato e approvato** da Matteo il 17/10; quattro scelte applicate. [Valutazione](valutazione-questionario-esperti.md) |
| Pacchetto di ricerca «modello micologico v3» (Codex): covariate, logistica con calibrazione, schema delle uscite, audit delle fonti e dei porcini tedeschi | ramo `codex/fronda-modello-micologico-v3`, commit `4465d2f` | **Valutato**: banco di prova ben costruito, senza modello addestrato né dati. Non si unisce così com'è. Da correggere prima dell'uso (dominio congiunto, meteo previsto, minimi di dati, licenze). [Valutazione](valutazione-modello-v3.md) |
| Documento «Fronda 3.0»: modello a due stadi, trovabilità in percentuale, penalità del vento, tabella delle specie | ramo `claude/ricerca-modello-micologico`, commit `8c0ba55`, `docs/ricerca-modello-micologico-italia.md` | **Valutato, non adottabile**: citazioni inesistenti o sbagliate, soglie senza fonte, percentuali senza coefficienti. Restano idee da misurare: P−ET₀, pioggia massima, fine stagione guidata dalla temperatura. [Valutazione](valutazione-modello-v3.md), sezione 3.2 |
| Prima integrazione proposta dalla valutazione: archivio delle previsioni, piano con 60 giorni di ingressi, protocollo d'uscita, etichette separate, prova offline sui porcini tedeschi | — | **Decisa** il 16/10 (D1–D4, sezione 9 della valutazione). Da costruire. L'indice non cambia. |
| Misure del servizio meteo: chiamate, quota Open-Meteo stimata, latenza, cache | PR #60, ramo `claude/practical-thompson-izrvq4` | **Da valutare** insieme all'archivio delle previsioni. La migrazione `0004_weather_metrics.sql` va rinumerata. |
| Titoli e testi senza parola sola in fondo (`text-wrap`) | PR #93, ramo `claude/titoli-senza-orfane` | **Approvato** per il prossimo rilascio, con verifica visiva. |
| Immagini dei funghi (fasi, varianti) e ritagli delle foto | rami `gpt/immagini`, `gpt/ritagli` | **Lavoro esterno in corso**, da valutare prima dell'unione: regole «immagini dai dati», test di coerenza e completezza, licenze. Niente immagini generate al posto delle foto delle specie. |
| Infografica di *Amanita caesarea* | PR #1, ramo `infografiche/caesarea` | **Bozza** del 12/10, molto indietro rispetto a produzione. Non toccata. |

## Rami già uniti

Il 16/10/2026 58 rami `codex/*` risultavano interamente contenuti nel ramo di produzione. Matteo ha deciso di eliminarli; i commit restano nella storia. Comando, da lanciare da un clone con permessi di scrittura:

```bash
git fetch --prune origin
git branch -r --merged origin/claude/brave-tesla-wu0a2b \
  | sed 's#^ *origin/##' | grep '^codex/' \
  | xargs -n 10 git push origin --delete
```

Il filtro `--merged` esclude da solo `codex/fronda-modello-micologico-v3`, che non è unito.
