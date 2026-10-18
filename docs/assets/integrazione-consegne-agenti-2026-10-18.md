# Integrazione delle consegne degli agenti

Valutazione e autorizzazione: [registro delle ipotesi](../ipotesi/valutazione-consegne-agenti-2026-10-18.md). Shell v198, candidata alla PR #120; nessuna pubblicazione con questa integrazione.

## Nell’app

- **85 combinazioni nuove dei funghi**, 170 WebP. Il totale richiesto è ora 201 combinazioni: nessuna mancante. Le 193 combinazioni della produzione di questo agente comprendono quelle già importate; otto erano preesistenti.
- **Sei sostituzioni**: quattro varianti rosa/violetto del gruppo virescens senza mosaico improprio; due Tylopilus crema/piano, prima ancora ocra e convessi. Tutte le altre 226 immagini della consegna finale erano già identiche e non sono state riscritte.
- **Due raster botanici revisionati per specie**: ombrella composta del finocchietto e cinorrodo intero di rosa canina. Restano i campioni cromatici per i colori e il testo per le parti non ancora revisionate.

Import dal commit raster `beefdb824d8cccd381adbfd0d216f2eee7b3800e`, conservando manifest completo per il dimensionamento e filtrando soltanto le 176 righe del delta dopo `stato=True`. Verificati hash di manifest, stato e 31 tavole sorgente prima dell’import, poi tutti i 176 hash degli output. [Ricevuta](import-delta-funghi-2026-10-18.json), [piano iniziale](import-delta-funghi-piano-2026-10-18.json), [wrapper riproducibile](import-delta-funghi-2026-10-18.py). Per ripetere, estrarre `git archive beefdb8 incoming` in `/tmp/fronda-raster-final`, usare `--plan docs/assets/import-delta-funghi-piano-2026-10-18.json`: il preflight richiede lo stato precedente all’import e rifiuta destinazioni già cambiate. Il wrapper non altera manifest o importer.

Il commit sorgente conserva prompt, dati, scarti e revisione semantica. Il filtro esclude i primi Tylopilus errati e le tavole virescens scartate. Il coordinatore ha ispezionato tutte le sette tavole a 72 px e quella delle revisioni; per le due piante ha confrontato PNG sorgenti, foto attribuite già nel catalogo e resa mobile. Licenza delle illustrazioni CC BY-SA 4.0, Fronda/Fungaroli. Nessun carattere biologico modificato.

## Materiale tecnico e ricerca

- `incoming/vettoriali/`: due SVG Tylopilus con parti indipendenti, PNG di partenza, revisioni, inspector e strumenti. Dal commit `7578a2d`; il prototipo storico Amanita escluso e inspector adattato a 320/390 px. Nessuna sostituzione dei raster nell’app. [Istruzioni](../../incoming/vettoriali/README.md).
- [Studio Animali](../ipotesi/animali-2026-10-18/README.md), commit `7e580d2`: 18 voci, schema e 16 fonti. Conservato come proposta; non crea nuove schede pubbliche o procedure sanitarie.
- [Pipeline fotografica](photo-enrichment-2026-10-18/README.md), commit `81a2446`: inventario aggiornato sui file correnti, 12 candidature, acquisizione e preparazione con verifica di licenza/attribuzione/ritaglio. **Zero nuove foto acquisite**; blocco 403 documentato, nessun aggiramento. `prepare` conferma zero output.

`incoming/` è escluso dagli asset di produzione: sorgenti e prototipi sono consultabili nel repository o con un server locale, non inclusi nell’app o nel suo precache.

## Verifiche

17 controlli Node passati (inclusa la versione cache): coerenza, completezza, margini, combinazioni, piante e ancoraggi hash-bound. Quattro scenari browser botanici a 320/390 px e due sui raster dei funghi passati. Due controlli tecnici SVG ripetuti con Inkscape a 64/128/804 px: provenienza, geometria, livelli isolati, assenza di bitmap/clip e modifiche di colore confinate alla parte corretta. Inspector provato a 320/390: selezione dei due campioni, livelli, colore, metadati di modifica e download SVG. Schede botaniche, confronto virescens rosa/imbuto, Tylopilus crema/piano e SVG controllati visivamente a 390 px.

[Rapporto asset](rapporto-consegne-agenti-2026-10-18.txt): zero incoerenze, zero disegni da rifare per dati cambiati, zero combinazioni mancanti. Restano 103 immagini di fasi, 32 copertine e altre pendenze documentali/fotografiche già elencate: completare le combinazioni non equivale a completare tutto il catalogo. Suite completa e Safari fisico non eseguiti in questa integrazione.
