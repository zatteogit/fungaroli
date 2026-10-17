# Redazione di Fungaroli

Il CMS essenziale gestisce tutte le sezioni dei contenuti tramite moduli per le persone e API per gli agenti. La redazione è disponibile su `/redazione`, con lo stesso profilo e la stessa passkey dell’app. L’account indicato dal gestore ha il ruolo amministratore; la semplice registrazione di un profilo non dà accesso editoriale.

## Usare la redazione

Dalla home, il pulsante in alto mostra **Accedi** oppure il nome del profilo, per esempio **Matteo**. Il profilo mostra il ruolo verificato dal server; **Apri la redazione** compare per editor e amministratori. È possibile aprire direttamente [la redazione](https://fungaroli.zatteo.workers.dev/redazione).

| Ruolo | Permessi |
|---|---|
| Utente | Diario e osservazioni personali; nessun accesso alla redazione. |
| Editor | Consulta i contenuti, prepara e salva bozze, controlla anteprime e ripristina revisioni come nuove bozze. |
| Amministratore | Anche pubblicazione, conferma delle verifiche scientifiche e gestione delle credenziali degli agenti. |

La registrazione assegna un profilo ordinario. Gli editor sono autorizzati dal gestore tramite `CMS_EDITOR_IDS`, gli amministratori tramite `CMS_ADMIN_IDS`: liste di ID dei profili separati da virgola. Se un ID è presente in entrambe, prevale amministratore. Non si può scegliere il ruolo dal browser. `/api/cms/v1/me` restituisce il ruolo e le capacità correnti; tutte le operazioni verificano nuovamente i permessi sul server. La modifica delle liste richiede un aggiornamento della configurazione: questa versione non include ancora un pannello per assegnare ruoli alle persone.

Scegli una sezione, poi una voce. I campi descrivono nomi, testi, caratteri, immagini e fonti. Gli articoli hanno un editor con grassetto, corsivo, elenchi e sottotitoli. Per creare una voce, usa un ID stabile con minuscole, numeri e trattini: l’ID non va cambiato quando cambia il titolo. Le nuove schede partono da campi vuoti; non ereditano i caratteri o le fonti di un’altra specie.

**Salva bozza** registra una revisione privata. **Anteprima e controlli** mostra il risultato e le differenze rispetto al pubblicato. **Pubblica bozza** aggiorna il sito al prossimo caricamento. Ogni sezione è un documento: la pubblicazione include tutte le sue voci modificate. Una pubblicazione tramite API può includere più sezioni, aggiornandole insieme.

**Risposte al questionario (dal 16/10).** Gli amministratori hanno anche il pulsante **Risposte al questionario**: conteggio, download in «CSV per Excel» (punto e virgola, si apre con un doppio clic in Excel in italiano), CSV con la virgola e JSON, ricerca per codice ricevuta e cancellazione su richiesta. Le risposte non sono contenuti del CMS: stanno nel database della comunità e non entrano nello snapshot. Dettagli in [questionario.md](https://github.com/zatteogit/fungaroli/blob/claude/brave-tesla-wu0a2b/docs/questionario.md).

La cronologia recupera una revisione precedente come nuova bozza. Controlla il risultato e pubblicalo per ripristinare il sito: la cronologia rimane disponibile. Se una scheda è cambiata mentre lavoravi, il server rifiuta la sovrascrittura; rileggi e riconcilia le modifiche. I conflitti vengono controllati a livello di sezione in questa prima versione.

Le modifiche alla classificazione micologica, alle cautele o alle regole richiedono fonti e conferma della verifica quando indicato. I controlli automatici verificano struttura e riferimenti: non certificano la commestibilità di un esemplare o la correttezza scientifica di una fonte. Una nuova specie nel catalogo non acquisisce automaticamente parametri del modello.

## Sezioni disponibili

| Sezione | Contenuti |
|---|---|
| Specie e sosia | Nomi, caratteri, stagione, classificazione, cautele e fonti dei 61 taxa iniziali. |
| Catalogo dei commestibili | Le 22 voci aggiuntive, con possibilità di aggiungere altre schede verificate. |
| Schede delle specie modellate | Descrizioni, caratteri, sosia e fonti delle 14 voci con modello. |
| Alberi | Le 21 schede iniziali e i collegamenti agli habitat. |
| Glossario e legenda | Parole, sinonimi, definizioni, indicazioni di campo e fonti; legenda T/E/EE/EEA. Le modifiche richiedono verifica delle fonti prima di pubblicare. |
| Illustrazioni del glossario | Fino a sei immagini per voce, con testo alternativo, didascalia, autore, licenza e fonte. Foto e schemi sono distinti; gli schemi generati sono dichiarati. Anteprima e verifica delle fonti prima della pubblicazione. |
| Articoli e taccuini | Le tre guide iniziali, ora estratte dal codice, e nuovi articoli. |
| Testi della home | Introduzione, titoli delle sezioni, testo della community e spiegazione delle condizioni. |
| Luoghi e microzone | Le 15 zone iniziali, descrizioni, soste e informazioni geografiche. |
| Sentieri | Nomi, informazioni descrittive e note editoriali. Geometrie, campioni e lunghezze di fonte restano protetti. `total_km` è `null` quando la fonte non dà una lunghezza credibile: l'app mostra «Lunghezza n.d.». |
| Foto di funghi e sosia | Riferimenti alle immagini e metadati delle foto. |
| Foto dei luoghi | File, varianti, autore, licenza e pagina della fonte. |
| Foto degli alberi | Immagini e metadati delle schede degli alberi. |
| Infografiche | Riferimenti e crediti delle infografiche. |
| Preparazione e cucina | Indicazioni generali e schede specifiche con fonti. |
| Regole e avvisi | Testi legali, avvisi, fonti e versione. Una modifica richiede di aumentare la versione degli avvisi. |
| Imbocchi mappati | Consultazione dei dati generati. |
| Percorsi di accesso | Consultazione dei dati generati. |
| Campioni del bosco | Consultazione dei dati generati. |

**Fasi di crescita (dal 15/10).** In «Specie e sosia» una specie può avere il campo `stages`: le fasi in ordine, ognuna con `id`, `label`, `desc`, `tiles`, `source` e, se cambiano, `cap_shape` e `hymenophore_color`. Il salvataggio rifiuta:
- fasi fuori dall'elenco chiuso (`uovo`, `apertura`, `giovane`, `adulto`, `maturo`, `sciolto`) o fuori ordine;
- tessere diverse da `cappello`, `sotto`, `gambo`, `taglio` (la sezione solo nella fase `uovo`);
- forme e colori che la specie non ha nei caratteri;
- fonti che non sono tra le fonti della specie.

`species-traits` è tra i documenti che il repository aggiorna se nessun autore li ha toccati, quindi le fasi arrivano in produzione con il deploy. Una fase nuova ha bisogno delle sue icone: lo segnala `tests/asset-completeness.test.mjs`.

**Parole del glossario nei testi.** Il collegamento automatico al glossario non dipende dall’autore: lo decide il campo. Si collegano le parole nei campi descrittivi (caratteri, avvisi e cautele, sosia e differenze, ambiente, note di campo, descrizioni di zone e sentieri, testo degli articoli); mai in mesi, date, misure, fonti, crediti, didascalie e titoli. Ogni campo ha un ambito (Funghi, Piante, Alberi, Bosco, Sentiero o Generale per gli articoli) e si collegano solo le voci compatibili: «lamelle» non si collega in una scheda pianta, «ago» solo in piante e alberi. Una voce nuova del glossario segue la sua categoria; il campo `contexts` la rende valida anche in altri ambiti. Il criterio completo è in [handoff-2026-10-14.md](https://github.com/zatteogit/fungaroli/blob/claude/brave-tesla-wu0a2b/docs/handoff-2026-10-14.md#collegamenti-automatici-al-glossario-zone-e-ambiti-1510).

Le immagini si gestiscono tramite percorsi già presenti in `assets/` o URL, con crediti e licenza. L’upload diretto e la generazione automatica di varianti non fanno parte di questa prima versione. I dati geografici generati si aggiornano tramite i rispettivi script; meteo, coefficienti e formule restano nel processo scientifico e nel repository. Diari, credenziali personali e osservazioni private restano separati dal CMS.

## Accesso degli agenti

Da **Accesso degli agenti**, un amministratore crea una credenziale con nome, sezioni, permessi e scadenza da 1 a 90 giorni. I permessi distinguono lettura, bozze, pubblicazione e conferma delle verifiche micologiche o normative. La chiave viene mostrata una sola volta; si conserva nel sistema di credenziali dell’agente, senza inserirla nel repository. Può essere revocata dalla stessa schermata.

UI e agenti passano dalle stesse API. Il server verifica identità, permessi e sezioni a ogni richiesta. Nel database rimane solo l’hash della chiave. Le mutazioni con cookie verificano l’origine; una credenziale Bearer può essere usata da un client senza cookie. I corpi JSON hanno un limite di 1,5 MB per documento e le richieste autenticate hanno un limite di frequenza. HTML negli articoli e nelle regole viene filtrato; HTML attivo e URL pericolosi non sono pubblicabili.

La CLI in `tools/cms.mjs` usa `CMS_TOKEN` e, facoltativamente, `CMS_URL`. Il comando `get` salva un file con ID, revisione e dati: modifica il contenuto di `data` e conserva la revisione di partenza.

```sh
node tools/cms.mjs list
node tools/cms.mjs schemas
node tools/cms.mjs get guides /tmp/guides.json
node tools/cms.mjs validate guides /tmp/guides.json
node tools/cms.mjs save guides /tmp/guides.json
node tools/cms.mjs publish guides --version 3
node tools/cms.mjs revisions guides
node tools/cms.mjs export /tmp/fungaroli-content
```

La revisione da pubblicare è quella restituita da `save`. Aggiungi `--reviewed` soltanto dopo aver verificato le fonti, quando il contenuto lo richiede e la credenziale ha il permesso corrispondente. Un file con revisione superata produce `412`: rileggi il documento e riconcilia il cambiamento, senza sostituire la revisione per forzare il salvataggio.

Il contratto è in [cms.openapi.json](cms.openapi.json). Gli endpoint principali sono:

| Endpoint | Operazione |
|---|---|
| `GET /api/cms/v1/me` | Identità e capacità attuali. |
| `GET /api/cms/v1/schemas` | Tipi di documento, campi obbligatori e vincoli generali. |
| `GET /api/cms/v1/items` | Sezioni autorizzate, revisioni e release corrente. |
| `GET /api/cms/v1/items/{id}` | Bozza e revisione, con ETag. |
| `PATCH /api/cms/v1/items/{id}` | Salva una bozza con `If-Match`. |
| `POST /api/cms/v1/items/{id}/validate` | Controlla un documento senza salvarlo. |
| `GET /api/cms/v1/items/{id}/preview` | Dati della bozza o della revisione richiesta. |
| `GET /api/cms/v1/items/{id}/revisions` | Cronologia. |
| `POST /api/cms/v1/items/{id}/restore` | Recupera una revisione come nuova bozza con `If-Match`. |
| `POST /api/cms/v1/releases` | Pubblica revisioni precise di una o più sezioni. |
| `GET /api/cms/v1/releases` | Cronologia delle pubblicazioni. |
| `GET, POST /api/cms/v1/tokens` | Gestisce le credenziali degli agenti; solo amministratori. |
| `DELETE /api/cms/v1/tokens/{id}` | Revoca una credenziale; solo amministratori. |
| `GET /api/cms/v1/audit` | Log delle operazioni; solo amministratori. |
| `GET /api/cms/v1/metrics/weather?days=30` | Misure del servizio meteo per giorno (chiamate e quota stimata di Open-Meteo, errori, latenza, uso della cache); solo amministratori. Dettagli in [meteo-cache.md](meteo-cache.md#misure). |
| `GET /api/content/v1/snapshot` | Export pubblico e coerente dei soli contenuti pubblicati. L'ETag è l'ID della release: con `If-None-Match` uguale risponde 304, anche se l'ETag torna debole (`W/"…"`, come lo rimanda il browser dopo la compressione di Cloudflare). |

## Architettura e gestione

Il Worker usa il database D1 dedicato `fungaroli-content`, binding `CMS_DB`; il database della comunità conserva passkey e sessioni. `CMS_ADMIN_IDS` contiene gli amministratori e `CMS_EDITOR_IDS` gli editor autorizzati alle bozze. La migrazione `0002_cms.sql` viene applicata in modo idempotente al primo accesso. I JSON presenti nel deploy inizializzano una sola volta documenti e revisioni originali; il database diventa poi la fonte dei contenuti pubblicati. Un nuovo deploy non sovrascrive le modifiche della redazione.

**Aggiornamenti dal repository.** Alcuni documenti si aggiornano dal repository a ogni deploy, finché nessun autore li ha toccati. L'elenco è `REPOSITORY_REFRESHED` in `worker/cms.js`:
- testi della home, piante, alberi;
- foto di funghi, alberi, luoghi e glossario;
- schede delle specie, specie e sosia, catalogo dei commestibili;
- preparazione, glossario, articoli, regole;
- dal 16/10 anche **sentieri** (`trails`) e **luoghi e microzone** (`zones`).

Al primo avvio dopo il deploy il Worker confronta con il pubblicato il JSON in `data/` di ogni documento dell'elenco. Se è cambiato, pubblica una nuova revisione (autore `release:repository-seed:discover-v1`) e conserva l'originale in cronologia. Un documento salvato da un autore, o con una bozza non pubblicata, non si aggiorna più dal repository: da lì in poi si corregge dal CMS. Per i sentieri vuol dire che, dopo una nota editoriale salvata dal CMS, un nuovo `tools/build_trails.py` non arriva più al sito. Ogni documento dell'elenco deve passare `validateContent`: se fallisce, lo snapshot risponde 503 e l'app ripiega sull'ultima copia salvata o sui JSON statici. Lo controlla `tests/cms-content.test.mjs`.

Imbocchi, percorsi di accesso e campioni del bosco (`trailheads`, `access`, `habitat`) restano fuori dall'elenco e sono in sola lettura nel CMS. Limite noto: un loro JSON rigenerato non arriva allo snapshot pubblicato.

`cms_documents` conserva bozza e pubblicato; `cms_revisions` le revisioni immutabili; `cms_releases` gli ID e le revisioni di una pubblicazione; `cms_agent_tokens` gli hash delle credenziali e i permessi; `cms_audit` autore e operazione. I controlli di revisione e il cambio della release avvengono in batch transazionali D1.

L’app carica un singolo snapshot completo. Il backend delle segnalazioni legge il catalogo pubblicato dallo stesso database, così una nuova specie è coerente tra scheda, filtro, diario e API. La copia pubblica valida rimane disponibile offline; bozze, token e sessioni non entrano nella cache pubblica. La prima versione accetta lo schema 1.

Per un backup esportare D1 con gli strumenti Cloudflare: l’export pubblico conserva il sito pubblicato, ma non sostituisce il backup di bozze, revisioni e audit. D1 Time Travel dipende dal piano disponibile. Per aggiornare la versione Artifact, esportare i contenuti pubblici, sostituire i JSON della copia di build e rigenerarla; il build incorpora anche articoli e testi della home.

Il primo passo per aumentare il numero di redattori o importare cataloghi molto grandi è separare i documenti in record individuali, mantenendo gli stessi ID e le release coerenti. Seguono upload R2, ricerca editoriale più ricca e pubblicazioni programmate. Un eventuale server MCP può adattare le API esistenti: non serve un secondo percorso di scrittura.
