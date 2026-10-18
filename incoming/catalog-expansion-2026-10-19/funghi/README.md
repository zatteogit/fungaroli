# Nuove schede funghi — proposta del 19 ottobre 2026

12 taxa aggiuntivi rispetto ai 88 censiti. Nessuna modifica ai cataloghi canonici, al modello o alla presenza regionale. Il conteggio delle schede non è un conteggio di specie biologiche: le aggregazioni esistenti sono state controllate.

- `catalog-proposal.json`: `taxa` compatibile con schede sintetiche, caratteri in `check_before_picking`, `traits:null`; 5 `edible_selector_candidates` con giudizio sostenuto dalla revisione Piemonte. Questi candidati richiedono comunque il controllo editoriale del coordinatore.
- `claim-evidence.json`: 104 collegamenti fra claim, fonte istituzionale e pagina/sezione; parafrasi italiane originali. I nomi comuni e i sinonimi hanno attestazioni separate. Per il genere Coprinopsis il passaggio da Coprinus è esplicito nella revisione Piemonte.
- `inventory-dedup.json`: fotografia dei taxa esistenti e delle aggregazioni controllate.
- `photo-plan.json`: pool di metadati Commons, NON lista di foto approvate.
- `download-plan.json`: shortlist 26, con limite di 2–3 per taxon e ruolo richiesto. `role_required` indica il particolare da cercare dopo la visione, non un carattere già osservato.
- `acquire_prepare.py`: download seriale autorizzato con intervallo minimo8s, SHA1 contro API e SHA256; stop su errore/403/429 senza retry. Conversione ICC→sRGB prima della rimozione dei profili. Derivati560/1200 e miniatura160; sei ritagli tramite `import_crop_points.positions`, senza scritture canoniche.

I PDF integrali, le estrazioni integrali e le tavole delle pagine consultate sono solo in `/tmp/fronda-catalog-funghi-20261019/`. Non sono redistribuiti nel repo. La guida Piemonte ha diritti riservati; il manuale Campania non ha una licenza aperta accertata. Si conservano URL, autori, localizzatori e hash. Nessuna foto dei volumi è riutilizzata. Le fotografie Commons hanno condizioni indipendenti.

## Limiti editoriali espliciti

I calendari stagionali sono testuali. `season_months:[]` evita di convertire arbitrariamente “estate” in un numero di mesi. Russula emetica e Fomes fomentarius non hanno periodo documentato nel profilo consultato. La persistenza pluriennale di Fomes non è tradotta in stagione di comparsa.

Clitocybe nebularis è “sconsigliato” nella fonte Piemonte: proposta `non commestibile` nell’app con significato esplicito in cautela, senza etichettarla tossica. Russula emetica è non commestibile secondo Piemonte, mentre Campania la definisce tossica: dissenso dichiarato, nessun assaggio suggerito. Fomes e Trametes sono privi di interesse alimentare: non se ne deduce tossicità.

Lycoperdon e Auricularia hanno condizioni/cautele esplicite dalla guida e sono proposti con cautela. Nessun trasferimento del giudizio ad altre specie, nessuna ricetta o finestra temporale di consumo sicuro. Nessun beneficio terapeutico proposto.

Trametes versicolor resta col binomio scientifico come etichetta: il nome comune italiano non è stato verificato con una fonte primaria. Per Paxillus e Russula emetica la guida alimentare discute anche il senso lato; le fotografie non delimitano segregati molecolari. Nessuna fase è attribuita dalla sola forma dell’immagine. Due candidature giovani hanno una dichiarazione esplicita nel testo della fonte; vanno ancora valutate per qualità.

La selezione fotografica finale richiede visione reale degli originali, confronto fra scatti e controllo dei sei formati. Non vanno importate righe con approvazione falsa. Nessuna suite o dry-run avviato.

## Lotto fotografico congelato

18 foto approvate su 12 schede, 54 WebP, 108 ritagli controllati. 26 originali acquisiti con SHA1 verificato; 8 scarti documentati. Manifest finale `manifest.json`; controlli file/hash in `checks.json`; originali26 nelle tre tavole `review-originals-*`, ritagli approvati `final-crops-01.jpg`…`final-crops-12.jpg`, miniature `final-thumbnails.jpg`. Le tre tavole `corrected-crops-*` documentano i quattro punti focali corretti dopo la prima revisione. Nessun processo di acquisizione attivo.
