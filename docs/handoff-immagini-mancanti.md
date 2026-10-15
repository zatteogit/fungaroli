# Immagini mancanti — ordine di lavoro per l'agente immagini (15/10/2026)

**Per chi:** l'agente immagini (ChatGPT Work, progetto Fungaroli) che lavora sul ramo `gpt/immagini`. Solo file nuovi in `incoming/`, niente PR, niente file dell'app. L'integrazione la fa poi una sessione Claude sul repository.

**Regole:** quelle di `AGENTS.md` e dei brief citati sotto. Stile delle icone già approvate (`assets/traits/*.webp`, `assets/tree-traits/*.webp`): pochi colori piatti, contorno bruno scuro, fondo trasparente, nessun testo nell'immagine. Niente immagini generate al posto delle foto delle specie.

## Già consegnato (non rifare)

- 30 tavole delle icone dei funghi e 286 varianti di colore e forma (`incoming/icone/`).
- Gambo del coprino con l'anello (`incoming/icone/tavola-10-anello.png`).
- 7 tavole delle icone dei caratteri degli alberi (`incoming/icone-alberi/`): in produzione dalla v64.
- Copertine dei luoghi per stagione e meteo (`incoming/luoghi/`).

## Da fare, in quest'ordine

### 1. Un'icona degli alberi: foglia composta palmata

- **Cosa:** `leaf_type` = `composta_palmata` («Composta, foglioline a ventaglio»), il carattere dell'ippocastano.
- **Disegno:** una foglia con 5–7 foglioline allungate che partono tutte dallo stesso punto, in cima a un lungo picciolo; nello stile e alla stessa scala della tavola `incoming/icone-alberi/tavola-alberi-02.png` (la foglia composta pennata è il riferimento più vicino).
- **File:** `incoming/icone-alberi/tavola-alberi-08.png`, 1254×1254 px, griglia 3×3 con fondo trasparente, icona nella cella 0 e le altre celle vuote. Ogni disegno deve restare dentro la sua cella con margine: l'import rifiuta le tavole con disegni tagliati o a cavallo di due celle.
- **Manifest:** una riga in `incoming/manifest.json` con `tipo: "illustrazione"`, `soggetto: "alberi"`, `chiave: "leaf_type"`, `valore: "composta_palmata"`, `cella: 0`, `modello`, `prompt`.

### 2. Timbri delle sfide

Tutto in `docs/handoff-immagini-timbri.md`: 9 timbri circolari, uno per sfida di `data/challenges.json`, leggibili a 64, 84 e 112 px su carta chiara e nel tema scuro.

### 3. Glossario, guide e infografiche

Tutto in `docs/handoff-immagini-glossario-guide.md`, in ordine A → B → C:
- A. 21 schemi del glossario;
- B. 3 aperture delle guide;
- C. 15 infografiche per specie.

Per ogni parte: prima un esempio da mostrare a Matteo, poi il resto nella stessa sessione, per avere uno stile uniforme.

## Consegna

- Aggiorna `incoming/bozze/STATO.md` con una riga per file (stato, dubbi).
- Scrivi in `incoming/NOTE.md` cosa è stato semplificato o lasciato fuori e perché.
- Le decisioni nuove si chiedono a Matteo con domande a scelta, con l'opzione consigliata per prima.
