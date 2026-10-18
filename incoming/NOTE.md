# Produzione confronto — 18 ottobre 2026

Autorizzazione: avviare gli asset mancanti del confronto usando metodologia, prompt e controlli precedenti. Perimetro: 6 forme e 191 combinazioni colore–forma, non gli altri asset mancanti dell’app.

## Primo lotto

- Forme: sei varianti, dodici disegni, nelle due tavole `confronto-forme-2026-10-18-01-r01.png` e `-02-r01.png`.
- Combinazioni: tre varianti, sei disegni, nella tavola `confronto-combinazioni-2026-10-18-01-r01.png`.
- Totale pronto da integrare: tre tavole, diciotto disegni. Nessun file dell’app modificato in questo ramo di produzione immagini.
- Aggiornamento: pronti anche i lotti combo-02–26 (75 combinazioni, 150 disegni). Restano **113 combinazioni da generare** in **38 tavole**. Produzione supervisionata in corso, con controllo visivo per tavola e ritagli tecnici conservati in `produzione-2026-10-18/ritagli/`.

## Metodo

Brief ripresi: `docs/handoff-immagini-varianti.md`, `docs/handoff-immagini-mancanti.md`, `tools/sheet_cells.py`. Riferimenti: icone già approvate in `assets/traits/`; fonti dei caratteri: `data/species-traits.json`; basi e varianti: `data/trait-icons.json`. Nessuna foto di specie sostituita e nessun nuovo carattere dedotto dalle immagini.

Tavole 1254×1254 RGBA, griglia 3×3: ogni riga è una variante con cappello nella prima cella e fungo intero nella seconda; terza colonna trasparente. I file originali delle generazioni sono conservati insieme alle revisioni. Il ritaglio usa le componenti connesse, non terzi fissi.

Correzioni eseguite prima di segnare le revisioni pronte:

1. Lamelle brune del cortinario rubello: nella prima generazione erano crema, non corrispondenti all’alternativa documentata scelta.
2. Spugnola: cappello accorciato e arrotondato in una vera forma emisferica; alveoli a nido d’ape conservati, senza aspetto cerebriforme.
3. Cortinario orellano: variante bruna distinta dal colore arancio della base.

Controllo visivo su forme, colori, anello/volva/reticolo e caratteristiche da non aggiungere; validazione strutturale di tutte le celle e dei valori del manifest contro i dati. `load_rows(..., stato=True)` seleziona 18 disegni pronti e scarta le tre tavole originali superate. `Sheets.crop` completa tutti i ritagli selezionati senza celle vuote, bordi tagliati o sovrapposizioni.

## Provenienza e ripresa

- `manifest.json`: righe per disegno, variante, cella, base dichiarata, modello e prompt effettivo.
- `bozze/STATO.md`: pronti e bozze da non importare.
- `produzione-2026-10-18/controlli.json`: SHA-256 delle tavole, celle e note di revisione.
- `produzione-2026-10-18/prompt-forme.json` e `prompt-revisioni.json`: cronologia dei prompt.
- `produzione-2026-10-18/coda-combinazioni.json`: 64 lotti con caratteri documentati, riferimenti e prompt; primo lotto pronto, 63 da produrre. Prima di ogni generazione leggere i riferimenti, poi usare `image_gen` con sfondo trasparente. Salvare il risultato, controllarlo e aggiornare manifest/stato; non ricolorare automaticamente le icone.

Licenza delle illustrazioni: CC BY-SA 4.0, stesso regime delle icone approvate. Il modello è registrato come image_gen integrato: l’identificatore specifico non è esposto.

L’import nell’app resta un passaggio separato, usando `python3 tools/import_trait_icons.py <cartella incoming> --stato`, poi rapporto degli asset e controlli mirati. Le tavole marcate «da rivedere» non vanno importate.
