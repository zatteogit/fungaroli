# Nuove schede animali · 19 ottobre 2026

Ownership esclusiva di questo bundle. Nessun file canonico, Git, PR o deploy modificato dall’agente. Baseline ricevuta: `1ae354f`, shell v228.

`proposals.json` contiene dieci nuove specie assenti dalle ventidue voci del catalogo iniziale: martora, faina, donnola, moscardino, quercino, gatto selvatico, lepre italica, aquila reale, ape legnaiola e macaone. I quattro draft esistenti non vengono promossi. `publicationStatus: ready` indica contenuto della proposta, non una pubblicazione avvenuta. L’integrazione resta del coordinatore.

`claims.json` collega ogni affermazione al record, campo, fonte, sezione e breve evidenza parafrasata. Sono utilizzati soltanto caratteri e relazioni espliciti nelle fonti primarie; nessuna proprietà scientifica deriva dal riconoscimento visivo delle foto. Nessuna presenza sul sentiero, frequenza locale, calendario di avvistamento, indicazione medica od operativa viene inventata. I calendari locali delle fonti non sono trasferiti al Reatino. Le pagine HTML originali in `evidence/` e il PDF permettono di ritrovare i passi. Per il macaone sono state viste le pagine stampate14–15, PDF15–16: i render conservano il localizzatore preciso.

Otto fonti sono del PNALM. Ape legnaiola: scheda Regione Sardegna/Agenzia Forestas, limitata a biologia generale. Macaone: guida del Parco Naturale Regionale Bosco delle Querce, limitata a morfologia e relazioni ecologiche esplicite; non si trasferiscono stato locale o abbondanza.

## Piano e qualità fotografica

`download-plan.json` conserva solo diciannove candidature selezionate, con taxon esatto nei metadati del singolo file, autore, licenza, pagina, URL originale e SHA1. Prima una vista per taxon, poi viste complementari. Le liste più ampie in `metadata/` e `photo-candidates.json` sono ricerca non acquisita e non approvata; contengono anche materiale da escludere, mai da importare automaticamente.

Il coordinatore ha assegnato lo slot esclusivo Commons. `acquire.py` scarica serialmente, almeno8 secondi tra richieste, ferma al primo errore senza retry né workaround e conserva ricevute. Solo foto acquisite, viste e approvate confluiscono nel manifest.

Sono riutilizzate, senza creare altri asset, due fotografie nitide di **Papilio machaon** già integrate sotto farfalle-diurne: vista laterale e ali parzialmente aperte. Le ho osservate effettivamente. File, fonte, autore e licenza rimangono gli stessi; alt e caption sono specifiche della nuova scheda. Il riuso è distinto dalle nuove acquisizioni in `reuse-photos.json`. La nuova foto prevista per questa specie è soltanto un bruco, fase attestata sia dalla fonte primaria sia dalla descrizione Commons.

Gli originali acquisiti vengono controllati con SHA1 remoto e SHA256 locale. `prepare.py` lavora offline: orientamento EXIF, conversione ICC in sRGB quando necessaria, normale lato560/80kB, HD1200/220kB e thumb160 centrata, EXIF/XMP assenti. `finalize.py` importa soltanto la funzione `positions` di `tools/import_crop_points.py`, senza eseguire `main` né modificare il file canonico. Le sei forme di crop sono controllate sulle tavole effettive insieme alle miniature.

Cattività e contesto estero si dichiarano nelle didascalie quando attestati. Una buona licenza o una categoria Quality Images non costituisce approvazione fotografica: le foto lontane, occluse, mosse o ridondanti vengono scartate.

Nessuna suite, dry-run o installazione eseguita.

## Consegna congelata

**9 nuove schede ready +1 draft (moscardino)**. Le due foto del moscardino sono state scartate: una occlusa, l’altra morbida/occlusa. Il contenuto rimane disponibile senza promuovere la scheda.

**19 originali acquisiti,12 nuove fotografie approvate per8taxa,7scarti**. Il macaone usa due fotografie già integrate, distinguendole dal nuovo materiale. Il bruco Keila è nitido e la fase è attestata ma è stato scartato dai crop orizzontali: anteprima e thumb ne tagliavano la testa.72ritagli e12miniature reali approvati. Le miniature sono centrate sul soggetto tramite il punto revisionato, evitando la testa tagliata del gatto.

`freeze.json` conserva conteggi, hash, audit dimensioni/metadati e scarti. Nessuna revisione pendente, nessun downloader o conversione attiva. Il coordinatore integra i percorsi del manifest nei cataloghi.
