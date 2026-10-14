# Timbri delle sfide — brief per l'agente immagini

Seguito di `docs/handoff-immagini-chrome.md` e `docs/handoff-immagini-varianti.md`. Stesso ramo: `gpt/immagini`. Solo file nuovi in `incoming/`. Niente PR.

## Cosa sono

In Impara → Sfide ci sono 9 sfide (`data/challenges.json`). Quando una sfida è completata compare un **timbro**. Oggi è un segnaposto SVG con la scritta ad arco. L'app mostra un'immagine al suo posto se la sfida ha il campo `stamp` (percorso in `assets/`). Il timbro si vede a 64, 84 e 112 px, su carta chiara e nel tema scuro.

## Stile

- Un timbro circolare, come un timbro d'inchiostro su un quaderno da campo:
  - un anello esterno;
  - un anello interno sottile;
  - al centro un disegno semplice.
- Segno coerente con le icone dei caratteri già approvate: pochi colori, contorno bruno scuro, forme piatte. Niente realismo.
- Un solo colore d'inchiostro per timbro, su toni naturali (verde bosco, ruggine, ocra, blu ardesia, bruno). Le 9 tinte devono restare distinguibili tra loro.
- Leggera irregolarità da timbro, senza esagerare: deve restare pulito a 64 px.
- **Nessun testo, lettera o numero.** Il nome della sfida lo scrive l'app.
- Sfondo trasparente vero, PNG con alpha, 512×512 px, timbro centrato con margine uniforme.

## I 9 timbri

| `id` della sfida | Nome | Cosa disegnare al centro |
|---|---|---|
| `alberi-faggeta` | Faggeta | foglia di faggio con una faggiola (riccio aperto a quattro valve) |
| `bosco-querce` | Querce | foglia di quercia lobata con una ghianda |
| `bosco-carpino-nero` | Ostrieto | foglia di carpino nero con l'infruttescenza a cono pendente |
| `margini-radure` | Radure | rametto di biancospino o prugnolo con fiori o frutti, al margine di un prato |
| `funghi-sosia` | Sosia | due funghi affiancati simili ma non uguali, come in uno specchio |
| `querce-faggio-carpini` | Alberi simili | due foglie a confronto: faggio e carpino bianco |
| `erbe-fiori-simili` | Fiori simili | un'ombrella di fiori bianchi (ombrellifera) |
| `fioriture-primavera` | Primavera | un fiore di primavera, es. primula o anemone, con un germoglio |
| `colori-autunno` | Autunno | due o tre foglie autunnali che cadono, in toni ruggine |

Le specie disegnate devono avere caratteri corretti: forma delle foglie, frutti, numero di valve. Se un dettaglio non è certo, semplifica invece di inventare.

## Dove salvare e manifest

- `incoming/timbri/<id>.png`, per esempio `incoming/timbri/alberi-faggeta.png`.
- Una riga per timbro in `incoming/manifest.json`, con `"tipo": "timbro"`, `"soggetto": "<id>"` e gli stessi campi delle altre illustrazioni (`modello`, `prompt`).
- Stato in `incoming/bozze/STATO.md`.

Ordine di lavoro: prima un timbro, da mostrare a Matteo; poi gli altri 8 nella stessa sessione di generazione, per avere uno stile uniforme.
