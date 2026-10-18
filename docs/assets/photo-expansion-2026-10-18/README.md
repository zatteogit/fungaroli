# Ampliamento fotografico · 18–19 ottobre 2026

Il lotto prosegue le fotografie già integrate con le PR #135 e #136, senza ripeterle. La selezione e il mandato sono descritti in [valutazione](../../ipotesi/integrazione-fotografie-agenti-2026-10-19.md).

- `assessment.json`: decisioni del coordinatore, ID approvati e hash dei manifest congelati.
- `coverage.json`: conteggi prima/dopo per ogni scheda, ricavati dai dati effettivi.
- `asset-report.json`: rapporto mirato degli asset, senza avviare suite.
- `review-preview/`, `review-delta*/`: checkpoint delle immagini viste dal coordinatore, con indice degli ID. Includono anche proposte poi escluse; fanno fede assessment e ricevuta, non il solo numero delle tavole.
- `ui-*.png`: verifica puntuale nell’app locale dopo l’importazione.

I bundle dei tre agenti, le risposte delle fonti, gli originali approvati e le revisioni stanno in `incoming/photo-expansion-2026-10-18/`. La ricevuta `integration.json` collega ogni originale ai tre WebP pubblicati e ai loro SHA-256. Originali e documentazione sono esclusi dagli asset del sito tramite `.assetsignore`.

Le fotografie sono pubblicate con autore, licenza e pagina della fonte. I nomi fotografici e le eventuali sinonimie restano distinti dai dati scientifici del catalogo. La gestione colore converte i profili non sRGB prima dell’esportazione; gli originali sono conservati identici. Le nuove fotografie non attestano la presenza su un sentiero né una determinazione ufficiale.
