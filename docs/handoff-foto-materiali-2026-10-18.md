# Handoff · fotografie e materiali · 18 ottobre 2026

## Ripartenza

Repository `/workspace/fungaroli`. Produzione: `claude/brave-tesla-wu0a2b` (non main). Ultimo merge applicativo: PR [133](https://github.com/zatteogit/fungaroli/pull/133), commit `9c488a3c84487724fdac96c2f0ec6f8972e01f24`, shell **v225**. Aggiornare produzione e creare un ramo dedicato prima di nuove modifiche.

Leggere `AGENTS.md`, `docs/handoff-2026-10-14.md`, `docs/handoff-fronda-2026-10-15.md` e `docs/ipotesi/integrazione-materiali-2026-10-18.md`. Quest’ultimo distingue consegne adottate, scarti e limiti.

## Richiesta aperta del proprietario

«Aggiungi quanto più materiale possibile per ogni categoria», poi precisazione: **più fotografie reali, anche dei funghi**, che sembrano poche. Il prossimo lavoro prioritario è acquisire e integrare foto utili, non produrre altri simboli o aumentare i conteggi con duplicati e ritagli della stessa fotografia.

Inventario corrente verificato il 18 ottobre:

- 36 record fungini principali: 2 hanno una foto (`aestivalis`, `nuda`), 23 ne hanno due, 1 ne ha tre, 10 ne hanno quattro.
- 51 record di sosia: una foto ciascuno.
- 18 schede Animali pubblicabili: nessuna foto; tutte le mancanze sono elencate in `data/asset-pending.json`.
- Piante: tutte le 70 hanno foto, ma 13 schede ne hanno solo due secondo l’audit precedente, da aggiornare prima dell’acquisizione.
- Alberi: 39 record fotografici e 49 valori grafici previsti già coperti. Non confondere la copertura minima con una galleria ricca.

Per i funghi cercare viste complementari: esemplare intero, cappello, imenoforo, gambo e base, esemplari giovani/adulti. Non attribuire una fase o un particolare se la foto e la fonte non lo sostengono. Priorità alle due schede con una sola foto e ai sosia, poi alle 23 con due foto. Un obiettivo editoriale possibile è 4–6 foto utili quando reperibili, non una soglia scientifica o una promessa di completezza.

## Blocco reale da risolvere prima dei download

Il runtime è stato ricontrollato con `cloud_environment.environment_status`: `observations_current:true`, rete `restricted`, stato `enforced`. I domini fotografici **non sono consentiti**. I precedenti CONNECT403 sono dinieghi della rete del container, non una prova che Commons abbia rifiutato i file.

È stato chiesto al proprietario di abilitare almeno:

- `commons.wikimedia.org` — pagine e API dei metadati;
- `upload.wikimedia.org` — originali e miniature.

Al momento dell’handoff non è arrivata conferma della modifica. Quando arriva, ricontrollare lo stato effettivo prima di scaricare. La sola configurazione desiderata non dimostra che la rete sia aggiornata.

Per estendere a iNaturalist potranno servire `api.inaturalist.org`, `www.inaturalist.org`, `static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`; per Dryades, `dryades.units.it`. Richiedere solo i domini realmente necessari.

Leggere la skill **cloud-environment-runtime** e il riferimento networking. Non modificare `/etc/codex/network-policy.json` per tentare di concedersi accesso, non cambiare proxy/route/hostname e non usare relay o servizi esterni per aggirare il blocco. Le modifiche passano dalla configurazione supportata dell’ambiente. Nella sessione era disponibile il tool di stato, ma nessun tool per modificare tale configurazione.

Il tool web permette di leggere fonti e metadati; i tentativi degli agenti di aprire immagini restituivano un segnaposto senza byte effettivamente ispezionabili. Non dichiarare una fotografia vista o acquisita sulla base di quel solo risultato.

## Materiale fotografico preparato

- `tools/photo-enrichment.py`: inventario, acquisizione riprendibile, preparazione; leggere CLI/help prima dell’uso. Non pubblica automaticamente nei cataloghi.
- `docs/assets/photo-enrichment-2026-10-18/`: audit, candidature e fonti iniziali.
- `incoming/photo-enrichment-2026-10-18/`: registri iniziali; zero nuove foto acquisite nelle sessioni precedenti.
- `/workspace/fronda-photo-enrichment`, ramo `assets/photo-enrichment-2026-10-18`, checkpoint `932d81a`: otto candidature fotografiche Animali individuali, licenze e ranghi; file `docs/assets/photo-enrichment-2026-10-18/animals-candidates.json`. Restano candidature non acquisite.
- `incoming/luoghi-stagioni-2026-10-18/photo-network-audit.json`: riepiloga gli otto candidati Animali e il diniego di rete; non è una galleria fotografica.

Rileggere i metadati del singolo file prima dell’acquisizione. Due candidature storiche erano state scartate per ambiguità: `Lepista nuda 60878.jpg` e `Boletus aestivalis 8.jpg`. Il nome del file non dimostra il taxon. Non reintrodurle senza risolvere le incongruenze documentate.

## Procedura di integrazione delle foto

1. Verificare pagina fonte, autore, licenza e identificazione del soggetto. Preferire CC0, CC BY e CC BY-SA. CC BY-NC resta ammessa dal proprietario finché l’app è gratuita e senza pubblicità. Mai foto generate al posto di quelle delle specie.
2. Scaricare l’originale attraverso la rete consentita; conservare hash e provenienza, eliminare metadati privati negli export. Non contare file mancanti o URL remoti come foto integrate.
3. Esaminare davvero ogni foto, anche nei ritagli della UI. Per gruppi come bombi e sirfidi esplicitare che si mostra un esempio di specie, senza fingere che rappresenti tutto il gruppo.
4. Produrre formati e miniature compatibili con i renderer esistenti, indicare autore, pagina, licenza e `licenseUrl`, aggiornare i punti di ritaglio. Evitare duplicati per contenuto oltre che per URL.
5. Collegare realmente la foto ai dati letti dalla scheda: `data/media.json` per funghi/sosia, `data/plants.json`, `data/media-trees.json`, `data/animals.json`. Controllare il percorso CMS/seed/snapshot per la risorsa interessata.
6. Aggiornare soltanto le pendenze effettivamente risolte e il rapporto asset. La presenza di un file in una worktree non equivale a integrazione nell’app.

Il CMS protegge i documenti modificati dagli autori. Il seed da repository si aggiorna per le risorse previste dal sistema, ma non sovrascrivere revisioni editoriali remote o dichiarare contenuti live senza leggere lo snapshot effettivo. Il precedente accesso shell al sito di produzione era bloccato dalla rete: nessuna verifica live post-deploy dichiarata.

## Già integrato: non rifare

PR133 ha unito selettivamente tutte le consegne approvate:

- **103 nuovi WebP delle fasi fungine per 18 specie**: copertura prevista 187/187, nessuna fase mancante. Incluse cinque correzioni del reticolo pallido. Ricevute, 19 master, manifest e revisione in `docs/assets/fasi-funghi-2026-10-18/` e `docs/ipotesi/revisione-indipendente-fasi-funghi-2026-10-18.md`.
- **5 raster botanici, 7 collegamenti**: fragolina portamento/rosetta; sambuco infiorescenza; ebbio foglia e portamento; rosa canina foglia; riuso dello schema a cinque petali per rosa. Il portamento del sambuco r02 è stato respinto per foglie periferiche ambigue. Finocchietto: dettagli ancora bloccati dai riferimenti insufficienti.
- **32 copertine** per Cittareale e Terminillo ovest, con 64 WebP normale/HD e 32 master: 6 serene, 8 nuvolose, 8 nebbiose, 8 piovose, 2 nevose. Copertura prevista 153/153. Sono elaborazioni AI delle foto originali, con `generated:true` e licenza/attribuzione conservate, non nuove fotografie delle condizioni attuali. Ritagli e miniature dei due originali rivisti. Master e ricevute in `incoming/luoghi-stagioni-2026-10-18/`; revisione indipendente in `docs/ipotesi/revisione-copertine-luoghi-2026-10-18.{md,json}`.
- **8 SVG editabili archiviati** in `docs/assets/vettoriali-revisionati-2026-10-18/`. Nessun aumento della copertura: la UI mantiene WebP da3–13KB invece di SVG da100–597KB. Fragolina frutto ottimizzata del60%, ma ancora troppo pesante per sostituire il WebP.
- **10 nuove schede Animali**: capriolo, cervo, cetonia dorata, rosalia alpina, tritone crestato italiano, salamandra pezzata, riccio, volpe, istrice e tasso. Totale18ready,4draft;99frasi con fonte e29fonti. Rilette fonti primarie PNALM; nessuna presenza prevista nel Reatino o sul sentiero. La sezione resta in costruzione. Istruttoria in `docs/animali-arricchimento-2026-10-18.md`.

Rapporto finale: `docs/assets/arricchimento-2026-10-18/asset-report.json`: zero incoerenze, zero asset da rifare per dati cambiati, zero mancanze non elencate. Le pendenze fotografiche e le citazioni puntuali pregresse restano aperte; questo non è un catalogo scientifico completo.

## Preferenze persistenti e verifiche

Il proprietario ha detto **«Basta con tutti sti test, mergia»**. Non avviare suite unit/browser o dry-run senza nuova autorizzazione. Non dichiarare test verdi. Restano necessari i controlli mirati delle immagini: provenienza, licenze, hash, import, revisione visiva e rapporto asset. Nella PR133 sono stati fatti questi controlli e due ispezioni visive locali Chromium (porcino/fragolina), senza suite o asserzioni; screenshot conservati. Safari reale non verificato.

L’utente vuole che si proceda senza continue richieste di conferma. L’autorizzazione ad aggiungere materiale e integrare/mergiare lavoro finito è già stata data. Il solo blocco attuale che richiede un’azione esterna è l’abilitazione dei domini fotografici.

Ogni file applicativo pubblicato richiede bump coerente di `SHELL` in `sw.js` e meta `app-version` in `index.html`; prossimo numero dopo v225. I soli documenti esclusi da `.assetsignore` non richiedono bump. PR verso produzione e merge attivano il deploy; non dichiararlo verificato senza evidenza. Tentare sempre `codex_app.attach_artifact` dopo creazione PR (talvolta restituisce «No handler registered»).

## Altri fix recenti già uniti

PR128: home compatta; PR129: nota meteo discreta e feedback locale del cambio giorno; PR130: Animali in costruzione, griglia comune e binario Scopri con sfumature; PR131: popover dell’indice anche nella scheda del luogo; PR132: conferma prima di aprire Google Maps da qualsiasi indicazione stradale, inclusi imbocchi/accessi/mappa. Questi cambi non vanno rifatti.

Tutti gli agenti dell’ultimo lotto hanno concluso; nessuna acquisizione fotografica sta lavorando in background. Worktree residue sono consegne storiche, non attività ancora aperte. Per il nuovo lavoro ripartire dalla produzione e dai file integrati.
