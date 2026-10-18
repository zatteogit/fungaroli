# Fasi fungine integrate

103 WebP da 19 tavole raster approvate. I master selezionati sono conservati in `masters/`, fuori dagli asset del sito; nome e hash corrispondono ai percorsi originali `incoming/icone/` registrati nel manifest e nelle ricevute.

Per ricostruire l’import in una copia di lavoro: creare una directory temporanea con `incoming/manifest.json` dal presente `manifest-import.json`, copiare i19master in `incoming/icone/` e usare `tools/import_stage_icons.py` con quella directory. Il manifest contiene soltanto le103righe revisionate, incluse le5correzioni del reticolo. Non usare un manifest completo del ramo produttore per importare anche varianti estranee al lotto.

Il rapporto del coordinatore e la revisione indipendente sono in `docs/ipotesi/integrazione-fasi-funghi-2026-10-18.md` e `docs/ipotesi/revisione-indipendente-fasi-funghi-2026-10-18.md`. Gli hash dei103output sono verificati e conservati nella ricevuta; i test dell’app non sono stati eseguiti.
