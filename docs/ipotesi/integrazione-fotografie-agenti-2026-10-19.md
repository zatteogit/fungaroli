# Valutazione dell’ampliamento fotografico tramite agenti

Lavoro iniziato il 18 e proseguito il 19 ottobre 2026 dalla produzione `0a35ed2` (v227). Matteo ha richiesto di proseguire, raccogliere quanto più materiale utile possibile tramite agenti e usare anche altre fonti autorevoli. Rimane il vincolo di non avviare suite automatiche o dry-run. Il mandato riguarda fotografie reali e loro integrazione; non modifica modello, tassonomia o schede scientifiche.

## Fonti e metodo

Tre agenti lavorano su bundle distinti: funghi principali, sosia e natura (animali/piante/alberi). Il coordinatore cura selezione, import, resa nell’app e rilascio. Commons serve fotografie di autori diversi: la categoria o il nome del file non bastano a stabilire il soggetto. Descrizione, fonte e incongruenze del singolo file sono state lette e confrontate con i byte acquisiti.

L’estensione alle fonti comprende Dryades, Dipartimento di Scienze della Vita dell’Università di Trieste, con pagina tassonomica e credito/licenza della singola fotografia; e nuove osservazioni iNaturalist di qualità research con taxon e licenza individuale verificati tramite API ufficiale. Il grado research indica identificazione comunitaria, non certificazione micologica. Non sono state recuperate le medesime foto Commons da altri domini per superarne i limiti. Le pagine HTML iNaturalist non accessibili sono distinte dai metadati API effettivamente letti e dai file effettivamente acquisiti.

Dopo risposte 429 Commons, tutti i download concorrenti sono stati fermati. La ripresa usa un’unica coda ordinaria con almeno 8 secondi fra gli originali, hash SHA-1 quando fornito da Commons, SHA-256 locale, stop su 403/429 e ricevute. I download iNaturalist sono stati assegnati a un agente per volta; Dryades usa richieste seriali indipendenti. Non sono stati modificati proxy, host, User-Agent o percorsi per aggirare dinieghi.

## Criteri editoriali

Si adottano fotografie distinte e complementari, con licenza di riuso verificata, autore o sua assenza dichiarata senza attribuire il ruolo di fotografo al caricatore, credito richiesto dalla fonte, originali conservati e WebP privi di EXIF/XMP. Gli agenti osservano originali e sei ritagli; il coordinatore controlla le tavole e la resa nell’app. Duplicati, fotografie poco leggibili, taxa ambigui, disegni, collage e modelli non aumentano la copertura.

I gruppi animali dichiarano la specie fotografata come esempio, nelle card, nella scheda e nel visore. Le foto di una fase vengono descritte soltanto se sostenute dalla fonte; una foto non modifica i dati sui caratteri o le fasi. Le fotografie botaniche devono corrispondere anche alla sottospecie quando la scheda la specifica. Per le nuove combinazioni tassonomiche serve una fonte esplicita della sinonimia; non si sostituisce un taxon con una specie simile.

Le decisioni per foto e i conteggi finali vengono registrati nell’assessment JSON e nella ricevuta d’importazione. Le proposte non acquisite o respinte restano separate e non sono foto integrate. Le pendenze Animali si rimuovono soltanto per schede realmente collegate a fotografie pronte. Il CMS protegge i documenti modificati da autori; lo snapshot pubblico viene controllato dopo il deploy.

## Esito

Adottate 274 fotografie nuove: 47 per 24 funghi principali, 125 per 43 sosia, 44 per le 18 schede animali pubblicate, 38 per dieci piante e 20 per sei alberi. Le fonti sono 159 Commons, 76 iNaturalist e 39 Dryades. I tre manifest sono congelati con SHA-256 nell’[assessment](../assets/photo-expansion-2026-10-18/assessment.json).

Il coordinatore ha visto tutte le immagini proposte nelle tavole; gli agenti hanno revisionato anche sei formati e miniature reali. Sono state ricontrollate le conversioni colore prima della copia definitiva. Il mandato esplicito di Matteo autorizza questa integrazione selettiva; non si adottano proposte scientifiche o modelli esterni.

Restano senza nuova foto Inocybe lilacina (fonte di rango complex) e Chlorophyllum venenatum (nessun nuovo file idoneo). Morchella elata resta dichiaratamente sensu lato, come nel catalogo. Per Sarcodon scabrosus le foto usano Hydnellum scabrosum: sinonimia attestata da Index Fungorum, record 222119; nome fonte e limite rimangono nelle didascalie. Due Commons di Agrocybe cylindrica sono escluse per mancanza di una nuova attestazione esplicita; per il pioppino si mantiene la fonte iNaturalist con nome esatto Cyclocybe cylindracea, già nel catalogo.

La galleria Animali mostra fotografie e crediti nelle schede e nel visore; i gruppi dichiarano la specie dell’esempio. Il visore dei funghi e degli alberi mostra anche le didascalie delle nuove fotografie e rispetta i crediti aggiuntivi richiesti. L’export Artifact raccoglie foto animali e ritagli; il pacchetto Artifact non è stato costruito in questa consegna.

Importazione, rapporto degli asset e verifica della pubblicazione vengono registrati nella ricevuta e nel riepilogo del lotto.


## Verifica locale conclusa

Importate 274 foto distinte e 822 WebP (normale, HD, miniatura) con originali e SHA-256 conservati. Il confronto strutturale con la produzione iniziale conferma che testi scientifici, caratteri, stagioni, modello e fotografie precedenti restano invariati. Validazione diretta dei quattro documenti CMS completata; rapporto degli asset senza incoerenze, elementi da ridisegnare o mancanze non elencate. La pendenza fotografica delle 18 schede Animali è risolta; le altre 66 mancanze fotografiche di dettaglio preesistenti restano dichiarate.

Controllate nell’app reale le gallerie di Bombi, Porcino rosso, Giglio rosso e Sarcodon scabroso, apertura e scorrimento del visore, didascalie e collegamenti delle licenze. Screenshot e conteggi in [riepilogo del lotto](../assets/photo-expansion-2026-10-18/README.md). Nessuna suite, dry-run o build Artifact avviata. Shell aggiornata a v228.
