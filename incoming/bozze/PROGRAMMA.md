# Programma immagini ripreso — 15 ottobre 2026

## Consegna

- Infografiche: completati i 14 brief disponibili (la documentazione ne annuncia 15 ma ne specifica 14). Caesarea è consegnata come `caesarea-revisione.webp`; l'originale non approvato è conservato.
- Forme: completate tutte le 107 varianti mancanti, con due icone per variante, in 36 tavole `forme-04.png`–`forme-39.png`. Le ultime due varianti occupano quattro celle della tavola 39.
- Le consegne precedenti (forme 01–03, timbri, glossario e aperture delle guide) sono conservate.
- Nessuna integrazione nell'app e nessuna modifica alla produzione.

## Verifica

`VERIFICA-LOTTO-FORME.json` registra la verifica dei PNG finali, dopo la compressione: 36 tavole, 107 varianti, 214 icone; esito superato. Controllati dimensioni 1254×1254, peso inferiore a 400 kB, margini trasparenti almeno 10% su tutti i lati di ogni cella usata, celle inutilizzate completamente trasparenti, contorno scuro ai quattro estremi, hash, presenza in Git e corrispondenza del manifest.

Per ripetere il controllo: `python3 incoming/bozze/verifica_lotto_forme.py` (Pillow e NumPy).

Le infografiche sono WebP 1600×2000, ciascuna inferiore a 400 kB. Le verifiche illustrative sono preliminari e vanno riviste con un micologo. Aereus resta da rivedere per la tinta del reticolo inferiore e la leggibilità della puntinatura del sosia; terreum per l'attacco delle lamelle. I relativi report distinguono i controlli superati dai dettagli ancora aperti.

## Normalizzazione autorizzata

Python è stato usato per scala e centratura delle componenti integre su fondo trasparente, senza ridisegno o modifica anatomica; le trasformazioni sono nei report delle singole tavole. Le correzioni del disegno sono state eseguite con il generatore di immagini e sono registrate in `edits`.

## Stato del caricamento

Ramo autorizzato: `gpt/immagini`, senza PR. Il remoto è stato verificato al commit `e4bb29f01656c82c61cfc6dd319c182beffb64c5`: contiene le infografiche e le forme fino alla 34.

Le forme 35–39, la correzione finale della 31 e i report conclusivi sono stati caricati con il commit `24fed74`. L'errore temporaneo di autenticazione si è risolto al nuovo tentativo. L'intero lotto è quindi disponibile sul ramo autorizzato; questo riepilogo è aggiornato con un successivo commit documentale.
