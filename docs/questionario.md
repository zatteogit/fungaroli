# Questionario per i cercatori esperti del Reatino

Aggiornato al 21/10/2026. Versione dello schema: **2** (corta). La versione 1 (lunga) è archiviata: le sue risposte restano salvate e si leggono con lo schema congelato.

## Perché la versione 2 (decisione di Matteo, 21/10/2026)

Matteo ha fatto provare la versione 1 a un cercatore esperto, che si è «sentito preso in giro». Le domande chiedevano di ricordare **episodi** (giorni dopo la pioggia, buttate e stagioni di anni passati, uscite a vuoto, gelate o caldo, quantità, ore di ricerca) e di mettere in **classifica** dei fattori. Nessuno li ricorda con certezza: si risponde a caso, e un dato inventato che sembra vero è dannoso, perché nell'analisi non si distingue da uno vero.

La versione 2 è **corta (3–4 minuti)** e chiede solo **sapere abituale e ripetuto**: dove vai, che cosa cerchi, in che mesi, in che boschi e a che quota lo trovi *di solito*. Le osservazioni vere si raccolgono poi **dal bosco, con l'app** («Annota»: cosa hai trovato, o che non hai trovato niente, e quanto hai cercato). La ricevuta dopo l'invio lo dice.

Fatto verificato: la reazione del cercatore (riferita da Matteo). Interpretazione: la memoria episodica è inaffidabile per date, intervalli e quantità; il sapere abituale ripetuto ogni anno lo è molto di più.

## Scopo

Raccogliere il sapere abituale degli amici che vanno a funghi nel Reatino, anche occasionalmente: zone, specie cercate, mesi, boschi e quote abituali, zone che non danno mai nulla, errori e pericoli; e sapere chi segnalerebbe con l'app. Servono a confrontare il modello con l'esperienza sul campo e a capire da dove partire.

Tono semplice, «tu», nessun tono da esame. Titolo «Funghi nel Reatino: poche domande su quello che sai»; l'introduzione dice che sono poche domande su ciò che si sa per abitudine, che non si chiedono date, giorni dopo la pioggia, quantità o uscite di anni fa, e che **«Non so» va benissimo**. Si compila da soli, anche da telefono, senza login. Le risposte restano a noi, nel database D1 del sito.

Le risposte sono dichiarazioni, non misure: nell'analisi vanno tenute distinte da dati verificati. Il motivo per cui una zona «non dà mai nulla» è salvato a parte (`barrenZones.opinion`) ed è un **parere**.

## Risposte della versione 1: che cosa si usa e che cosa no

Le risposte v1 (raccolte fino al 21/10/2026) **restano archiviate così come sono**: non si riscrivono, si esportano a parte (`&version=1`) e si rivedono in redazione con lo schema v1. Nelle analisi si usano **solo i campi di sapere abituale**:

| Affidabili (si usano) | Campi v1 |
|---|---|
| anni di esperienza | `profile.years` (numero dichiarato; confrontabile con le classi v2 solo raggruppandolo) |
| zone | `profile.zones`, `profile.zonesOther` |
| specie cercate | `profile.speciesSought`, `species[].id` / `name` |
| mesi abituali | `species[].start`, `peak`, `end` (solo il mese: la parte del mese no) |
| boschi abituali | `species[].forests` (`forestsNever` solo come indicazione debole) |
| quote abituali | `species[].elevMin`, `elevMax`, `elevMode`, solo raggruppati nelle fasce della v2 |
| errori e pericoli | `risks.beginnerErrors`, `risks.mountainDangers` |

**Non si usano** (episodici o numerici, ricordati male): giorni dopo la pioggia (`lagMin`, `lagTyp`, `lagMax`), durata della buttata (`flushDays`), «la stagione è cambiata?» (`seasonChanged`, `changed`), uscite in un anno buono o scarso, tutta la parte «Pioggia» (`rain`), gli episodi di freddo, gelo, vento o caldo (`weatherRemembers`, `weatherEvents`), le buttate e le uscite a vuoto (`flushes`, `emptyTrips`, con anni, settimane, quantità e ore), la classifica dei fattori (`forest.ranking`), i segni creduti (`forest.indicators`), il grado di sicurezza (`confidence`). Restano nei file per completezza e per i diritti delle persone (accesso, copia, cancellazione), non per i risultati. Gli altri campi v1 (versanti, terreno, accessi, regole locali, scambi pericolosi, intossicazioni, specie evitate) sono pareri o racconti: si leggono come testimonianze, non come dati.

L'analisi confronta le due versioni solo sui campi con lo stesso significato (zone, specie, mesi, boschi, fasce di quota, errori e pericoli).

## Indirizzo e file

- Pagina: https://fungaroli.zatteo.workers.dev/questionario. È il file statico `questionario.html`, servito da Workers Assets (gestione HTML predefinita: `/questionario.html` porta a `/questionario`). Non serve una regola in `wrangler.jsonc`. La pagina ha `noindex` e non è collegata dall'app: si diffonde con il link.
- `_headers` (nella cartella degli asset, cioè la radice del repository): per `/questionario` e `/questionario.html` aggiunge `Content-Security-Policy: frame-ancestors 'none'` e `X-Frame-Options: DENY`, così nessun altro sito può mostrare la pagina in un riquadro (clickjacking). `frame-ancestors` nel meta CSP della pagina non vale: serve l'intestazione. Vedi «Intestazioni» più sotto.
- `js/questionario.js` e `css/questionario.css`: compilazione a parti, bozza nel browser, riepilogo e invio.
- `js/survey-schema.js`: **unica fonte dello schema corrente (v2)**, importata dalla pagina, dal Worker e dalla redazione.
- `js/survey-schema-v1.js`: schema della versione 1, **congelato il 21/10/2026**: non si modifica. Serve a leggere, rivedere ed esportare le risposte v1; da qui la v2 importa gli elenchi condivisi (specie, boschi, mesi, comuni, località).
- `js/survey-species-names.js`: nomi italiani e latini per l'autocomplete delle specie, generato da `node tools/build_survey_lists.mjs` (con `--check` controlla che sia aggiornato; lo controlla anche un test).
- `worker/survey.js`: API. `migrations/0004_survey.sql`: tabelle.
- Test: `tests/survey-schema.test.mjs` (v2), `tests/survey-schema-v1.test.mjs` (v1 congelata), `tests/survey-api.test.mjs` (anche invio v1 rifiutato, esportazione per versione, revisione v1 in redazione), `tests/survey-privacy.test.mjs`, `tests/survey-page.test.mjs` (in `npm test`), `tests/browser/questionario.spec.mjs` e il pannello della redazione in `tests/browser/cms.spec.mjs` (suite browser). Nel browser, sul Worker e sul D1 locali: invio e ricevuta con l'invito ad «Annota», bozza e ripresa, consenso, nessuna risposta preimpostata né domanda da ricordare, «Non so» esclusivo, scelta delle schede oltre 5 specie, nome e contatto solo dopo «Sì/Forse» e ricontatto, zone senza funghi con il parere, bozza e ricevute della v1, corpo v1 rifiutato con «ricarica la pagina», indirizzo del titolare uguale a `data/legal.json`, campo trappola, tetto del giorno, intestazioni, 320 px, rete giù, invio vuoto. Le prove leggono e scrivono il D1 locale con `sqlite3` (cartella `FUNGAROLI_BROWSER_PERSIST`).
- Service worker: le navigazioni verso `/questionario` escono dalla gestione di `sw.js`. Senza rete la pagina non deve aprire l'app al suo posto.

## Come si compila (versione 2)

- Quattro parti brevi, poi il riepilogo: **Tu e i funghi** (anni, zone, specie cercate), **Le tue specie** (una scheda per specie), **Quello che hai notato** (zone che non danno nulla, errori e pericoli), **Con l'app** (segnaleresti? ricontatto, nome e contatto). Niente versione breve o completa, niente «Salta questa parte» né «Non pertinente»: ogni domanda si lascia vuota.
- Bozza nel browser (`localStorage`, chiave `fronda:questionario:esperti-reatino:v2`). Al server arriva qualcosa solo con «Invia», dopo il riepilogo, che mostra esattamente ciò che parte. Le bozze della versione 1 (`…:v1`) restano nel browser ma **non si riaprono**: l'inizio lo dice e offre «Cancella la vecchia bozza». Le ricevute stanno in `fronda:questionario:esperti-reatino:ricevute`; si mostrano anche quelle salvate dalla v1 (`…:v1:ricevute`).
- **Nessun valore preimpostato**: nessuna scelta già fatta, nessun numero, nessun esempio. «Non so» è una scelta esplicita per mesi, boschi e quote, e non si combina con le altre; per gli anni c'è «Preferisco non dirlo».
- Oltre 5 specie scelte, la pagina chiede per quali compilare la scheda (fino a 5): nessuna scheda è scelta al posto della persona.
- Autocomplete con `datalist` nativi, sempre con testo libero: per le zone le 8 macro-zone, le località principali e i 73 comuni della provincia; per le altre specie i nomi del catalogo. Si chiede solo la zona a grandi linee, mai posti precisi.
- Dopo l'invio: codice ricevuta e un riquadro «E adesso, nel bosco» che invita ad aprire Fronda (link alla home) e a usare «Annota» sul momento, anche quando non si trova niente, con quanto si è cercato.

## Schema v2

Corpo dell'invio:

```json
{"survey":"esperti-reatino","version":2,"startedAt":"<ISO>","website":"",
 "respondent":{"name":"…","contact":"…"},
 "consent":{"anonymousUse":true,"recontact":false},
 "answers":{…}}
```

- `version` deve essere 2. Un'altra versione (una pagina vecchia rimasta aperta) riceve **400 con un solo errore** sul campo `version`: «Il questionario è cambiato: ricarica la pagina. Le risposte già scritte restano su questo dispositivo.» Le risposte non si giudicano con lo schema di un'altra versione; la pagina mostra il messaggio così com'è e conserva la bozza.
- `website` è un campo trappola: deve restare vuoto. Nella pagina l'input ha un nome neutro (`id="q-lascia-vuoto"`, `name="lascia_vuoto"`), con `autocomplete="off"`, `tabindex="-1"`, il contenitore `aria-hidden` e gli attributi con cui 1Password, LastPass e Bitwarden ignorano un campo: con «website» o «url» il browser o il gestore di password potrebbe riempirlo, e il server risponderebbe con un 201 finto (risposta persa in silenzio). La chiave nel corpo resta `website`. La pagina non controlla il campo trappola prima dell'invio: lo giudica solo il server, con il 201 finto.
- `startedAt` serve solo a calcolare la durata. Se non è valido si ignora.
- `consent.anonymousUse` deve essere `true` (nome della chiave per contratto; i testi non dicono «anonimo»). `consent.recontact` è facoltativo. `consent.diary` (il taccuino della v1) si accetta solo assente o `false`; nelle righe salvate resta 0.
- **Nome e contatto** (al massimo 80 e 120 caratteri, `RESPONDENT_LIMITS`) si salvano solo se `willReport` è «sì» o «forse» **e** `recontact` è `true`. Altrimenti `validateSurvey` li porta a `null`, **nome compreso**, e `recontact` a `false` (decisione di Matteo, 21/10/2026; la v1 salvava sempre il nome). La pagina chiede ricontatto, nome e contatto solo dopo «Sì» o «Forse».
- Ogni campo di `answers` è facoltativo, ma per inviare serve almeno una risposta non vuota. Le chiavi sconosciute vengono rifiutate a ogni livello (anche quelle della v1).

| Domanda | Chiave | Contenuto |
|---|---|---|
| 1. Esperienza e zone | `profile.years`, `profile.zones` | classe di anni (`EXPERIENCE_YEARS`: meno di 5, 5–14, 15–29, 30 o più, preferisco non dirlo); fino a 5 zone a grandi linee, testo libero (≤ 80) con suggerimenti, senza doppioni |
| 2. Specie cercate | `profile.speciesSought`, `profile.speciesOther` | specie dell'elenco (`SPECIES`) e fino a 5 altre per nome (≤ 60) |
| 3. Schede | `species` (≤ 5) | per specie scelta: `id` (o `altra` + `name`, uguale a un nome di `speciesOther`), `months` (mesi di `MONTHS` o «non so»), `forests` (`FORESTS` o «non so»), `elevation` (`ELEVATION_BANDS`: sotto i 600 m, 600–1000, 1000–1400, sopra i 1400, più fasce o «non so») |
| 4. Zone che non danno nulla | `barrenZones.where`, `barrenZones.opinion` | testo libero (≤ 600); `opinion` è il motivo, **un parere**, chiesto solo dopo la zona |
| 5. Errore o pericolo | `warning` | un errore da principiante o un pericolo in montagna, testo libero (≤ 800) |
| 6. Segnalazioni con l'app | `willReport` | «sì», «forse», «no» (`REPORT_INTENT`) |

Regole: «non so» non si combina con altre scelte; i mesi tornano in ordine di calendario; una scheda solo per una specie scelta alla domanda 2 (400 altrimenti), una per specie, «altra» con il nome. Nessun campo numerico, nessuna data, nessun episodio, quantità o classifica. Testi in forma NFC senza caratteri di controllo; l'HTML resta testo (`textContent`, mai `innerHTML`).

## Schema v1 (archiviato)

Lo schema v1 è in `js/survey-schema-v1.js`, congelato. In sintesi: parti A–I (chi sei, schede specie con mesi di inizio/picco/fine e parte del mese, quote in metri, giorni dopo la pioggia e sicurezza 1–5; pioggia; episodi di temperatura, vento e secco; buttate e uscite a vuoto con anno, settimana, quantità e ore; bosco con versanti e classifica dei 7 fattori; accessi; rischi con cancelli; per finire con taccuino e ricontatto), risposte rapide (`QUICK_ANSWERS`) con «Altro…», precisazioni `clarifications` e parti `notApplicableParts` (aggiunte del 16–17/10/2026). Il dettaglio storico è nella cronologia di questo documento (versione del 17/10/2026) e nei test `tests/survey-schema-v1.test.mjs`.

Fonti degli elenchi per l'autocomplete: comuni da ISTAT, «Elenco dei comuni italiani» (file del 26/01/2024, consultato il 16/10/2026, 73 comuni con codice 057, licenza CC BY 4.0); località con il comune verificato su OpenStreetMap/Nominatim (ODbL). Fonte, data e licenza sono anche in `js/survey-schema.js`.

## API

| Richiesta | Chi | Risposte |
|---|---|---|
| `POST /api/survey/v1/responses` (JSON, ≤ 64 KB) | chiunque, dalla pagina del sito | `201 {id, receipt}`; `400 {error, fields, errors}` (anche per una versione diversa dalla corrente: solo `version`, «ricarica la pagina»); `403` origine diversa dal sito; `413` troppo grande; `415` tipo sbagliato; `429 {error, code}` troppi invii, con `Retry-After` fino alla mezzanotte UTC: `code` è `connection-limit` (limite per connessione) o `daily-limit` (tetto complessivo del giorno) |
| `GET /api/survey/v1/responses?survey=esperti-reatino&format=json\|csv\|count[&version=1\|2]` | amministratori | elenco completo (`json`, `csv`) o solo `{survey, count, lastAt, byVersion}` (`count`, per la redazione: non legge né manda le risposte). **Versione:** il CSV ne contiene sempre una sola (predefinita la 2, colonne della sua versione); JSON e conteggio comprendono tutte le versioni se `version` manca; altri valori: 400; `&receipt=XXXXXXXX` cerca un codice ricevuta (maiuscole o minuscole, con o senza trattino); con `format=csv`, `&sep=semicolon` dà il «CSV per Excel» (punto e virgola), `&sep=comma` o niente la versione con la virgola; altri valori: 400 |
| `DELETE /api/survey/v1/responses/<id o ricevuta>` | amministratori | `200 {ok, id, receipt}`; `404` se non c'è |

Gli amministratori sono gli stessi del CMS: sessione con passkey e ID in `CMS_ADMIN_IDS`. Senza sessione la risposta è 401, con un altro ruolo 403. Le credenziali degli agenti del CMS non danno accesso alle risposte. POST e DELETE controllano l'origine come la community. Gli errori 503 non mostrano dettagli interni.

## Archivio

Database `COMMUNITY_DB` (lo stesso di profili e diario). La migrazione idempotente `migrations/0004_survey.sql` si applica al primo accesso all'API, come 0001 e 0003.

- `survey_responses`: `id`, `survey`, `version`, `receipt` (unico), `created_at`, `duration_s`, `name`, `contact`, `consent_recontact`, `consent_diary`, `answers` (JSON normalizzato da `validateSurvey`).
- `survey_rate`: `key` (hash), `day`, `count`. Una riga in più al giorno, con la chiave `total:esperti-reatino:<giorno>`, conta gli invii accettati per il tetto complessivo: non contiene dati della connessione.
- `community_meta`, chiave `survey_ip_salt`: il sale privato dell'hash.

## Limiti contro gli abusi

- Corpo fino a 64 KB, controllato anche durante la lettura.
- **Tetto complessivo: al massimo 200 invii accettati al giorno (UTC)**, da tutte le connessioni insieme (`SURVEY_DAILY_TOTAL`, decisione di Matteo del 16/10/2026). Oltre: 429 con `Retry-After` fino alla mezzanotte UTC e `code: "daily-limit"`. La pagina dice «Per oggi il questionario ha ricevuto tutte le risposte che può accettare», quante ore aspettare e che le risposte restano salvate sul dispositivo. Non consumano il tetto gli invii rifiutati dalla validazione, quelli rifiutati dal limite per connessione e il campo trappola compilato. Con il tetto pieno un tentativo non consuma nemmeno il limite della connessione: chi riprova non riceve poi, per errore, il messaggio della connessione. Le conte stanno nella stessa transazione D1: il tetto non supera mai 200. Cancellare una risposta non libera un posto.
- **Limite noto del tetto (verificato dai revisori il 16/10/2026):** il tetto è anche un interruttore. Una sola persona con un blocco IPv6 /56 (256 connessioni /64) o /48, o con 20 indirizzi IPv4, lo riempie in pochi secondi con invii validi non vuoti. Gli invii vuoti sono rifiutati prima dei contatori (decisione del 17/10/2026). Da lì le persone vere ricevono 429 fino alla mezzanotte UTC, e le righe spazzatura vanno tolte a mano, una ricevuta alla volta. Questo rischio residuo resta anche dopo il rifiuto degli invii vuoti: la misura ferma solo gli abusi più semplici.
- Al massimo 10 invii al giorno (UTC) per connessione (`SURVEY_DAILY_LIMIT`, `code: "connection-limit"`). La chiave è SHA-256 di sale privato + connessione + giorno + questionario. La connessione è l'IPv4 di `CF-Connecting-IP`; per IPv6 è il blocco /64 (`rateSubject`), perché chi ha un /64 può cambiare indirizzo a ogni invio. Una rete domestica IPv6 condivide il limite come una rete IPv4 dietro un solo indirizzo. Senza sale un hash di IP e data si potrebbe invertire in pochi secondi; con il sale nello stesso database resta un dato pseudonimo, per questo si cancella entro il terzo giorno (vedi sotto).
- Si conta un invio solo dopo la validazione: un errore di compilazione non consuma il limite. Il 400 riporta al massimo 50 errori (`MAX_ERRORS`).
- Campo trappola compilato: risposta `201` finta, nessuna scrittura (nemmeno il contatore).
- Restano solo i contatori di oggi e di ieri (UTC). Gli altri si cancellano al primo invio e con il cron quotidiano delle 03:17 UTC (`cleanupSurvey` in `worker/index.js`). La riga di un giorno resta quindi da 24 a circa 51 ore: l'informativa dice «circa 2 giorni». Le copie di recupero di D1 (Time Travel) la tengono, con il sale, per il periodo del piano Cloudflare.
- Non protegge da chi cambia connessione. Le risposte vanno lette con questo limite in mente.

## Privacy e cancellazione

- L'informativa (art. 13 GDPR) sta in fondo alla pagina, prima dell'invio. Testi del 16/10/2026 dopo la revisione: niente «anonimo» nella casella del consenso; niente dati sulla salute nei rischi; copia «anche in un formato leggibile da computer»; impronta dell'IP «circa 2 giorni». Titolare Matteo Sgambato, progetto personale e gratuito; finalità (studio delle stagioni; contatto solo per ricontatto o taccuino; nei risultati niente nome né contatto; nessuna decisione automatica); domande facoltative; base il consenso, revocabile; nessuna cessione a terzi; dati su Cloudflare D1 senza garanzia di sola collocazione europea (come in [community.md](community.md)); conservazione fino alla fine del progetto o alla richiesta di cancellazione (da decidere, più sotto); diritti di accesso, copia (anche leggibile da computer), rettifica, limitazione e cancellazione; reclamo al Garante.
- Trasferimenti fuori dall'UE: secondo l'informativa di Cloudflare (in vigore dal 4/11/2025, letta il 16/10/2026, sezione 7) i trasferimenti verso gli Stati Uniti si basano sulla certificazione EU-U.S. Data Privacy Framework e, se viene meno, sulle clausole contrattuali standard. Da ricontrollare se l'informativa di Cloudflare cambia.
- L'IP non viene salvato. Resta solo l'hash giornaliero con sale, cancellato entro il terzo giorno (circa 2 giorni, come dice l'informativa).
- **Aggiornamento del 21/10/2026 (v2):** la finalità del nome e del contatto ora dice che si chiedono solo a chi segnalerebbe con l'app e vuole essere ricontattato (il contatto serve solo a ricontattare, il nome a riconoscere la persona quando le si scrive); la conservazione del contatto non nomina più il taccuino; l'avviso sui dati sanitari riguarda la domanda su errori e pericoli. Le persone che hanno risposto alla v1 lo hanno fatto con l'informativa di allora (nome sempre facoltativo, taccuino).
- La domanda su errori e pericoli (e, per la v1, la parte «Rischi») chiede di non scrivere dati sulla salute, propri o di altri, né nomi di persone. Il consenso chiesto non è un consenso esplicito per dati sanitari (art. 9).
- Dopo l'invio la persona riceve un **codice ricevuta** di 8 caratteri (senza 0/O e 1/I). Il dispositivo ricorda le ultime 5 ricevute; la bozza si cancella.
- **Richiesta di cancellazione** (risposte di tutte le versioni): redazione → «Questionari» → «CSV per Excel» → codice ricevuta → «Cerca la risposta» → «Cancella questa risposta» e conferma. In alternativa `DELETE /api/survey/v1/responses/<codice>` con la sessione di un amministratore. Le copie di recupero di D1 (Time Travel) seguono i tempi del piano Cloudflare.
- **Altri diritti (art. 15–20), procedura breve.** Prima di tutto si verifica chi chiede: il codice ricevuta resta visibile nella pagina iniziale del dispositivo da cui si è inviato, quindi da solo non basta se la risposta contiene nome o contatto.
  - *Accesso e copia (anche portabilità, art. 20, perché la base è il consenso):* con la sessione di un amministratore `GET /api/survey/v1/responses?survey=esperti-reatino&format=json&receipt=XXXXXXXX`, e si manda il JSON (formato leggibile da computer). Se la risposta contiene nome o contatto, si risponde solo al contatto salvato, oppure si chiede una conferma (per esempio un dettaglio delle risposte).
  - *Rettifica:* cancellazione e nuovo invio dalla pagina, oppure una correzione puntuale con `npx wrangler d1 execute fungaroli-community --remote --command "UPDATE survey_responses SET name='Nome corretto' WHERE receipt='XXXXXXXX'"` (lo stesso per `contact`; le risposte in `answers` vanno corrette solo con un JSON che passa `validateSurvey`).
  - *Limitazione:* oggi non c'è un campo per escludere una risposta dall'analisi. Si annota la ricevuta in un elenco tenuto fuori dal repository e la si esclude a mano; oppure, se la persona preferisce, si cancella.
- **Contatto del titolare (deciso da Matteo il 16/10/2026):** la sua email personale, zatteo@gmail.com, scelta da lui. Sta in `data/legal.json` (sezione «Privacy e dati» della pagina Info: «scrivi a zatteo@gmail.com», link `mailto:`) e nell'informativa del questionario («Chi tratta i dati» e «I tuoi diritti»). La ricevuta dopo l'invio prende il link dall'informativa: nella pagina l'indirizzo è scritto una volta sola. `tests/survey-privacy.test.mjs` controlla che l'indirizzo dell'informativa sia quello di `data/legal.json` e che il sanificatore del CMS tenga il link `mailto:`. `version` e `verified_on` di `legal.json` non cambiano (le regole sono le stesse): l'avviso iniziale dell'app non ricompare. Il testo nuovo arriva in produzione con il deploy solo se `legal` non è stato modificato da un autore nella redazione (vedi [legale.md](legale.md)).

## Esportazione

- Dalla redazione, sezione **Questionari** → «CSV per Excel» (solo amministratori): conteggio per versione (con `format=count`), scelta della **versione** (2 corta, predefinita; 1 lunga, archiviata), «CSV per Excel», «CSV con la virgola», «Scarica il JSON» della versione scelta, ricerca per ricevuta (tutte le versioni) e cancellazione. Nomi dei file: `questionario-esperti-reatino-v2-AAAA-MM-GG[-excel].csv`.
- **Una versione per file, la versione in ogni riga** (colonna `version`). Le colonne vengono dallo schema di quella versione (`answerColumns(1|2)`); `toCsv` rifiuta righe di versioni miste.
- Nella sezione **Questionari** della redazione ogni risposta mostra la versione. Una nuova compilazione (intervista o trascrizione) usa sempre la v2; una risposta già salvata si rivede **con lo schema della sua versione** (`worker/survey-admin.js`, `js/survey-admin-form.js`): le risposte v1 si correggono ma non si convertono.
- Le esportazioni si leggono a pagine di 100 righe (`EXPORT_PAGE`, cursore su `created_at` e `id`) e si scrivono mentre si leggono: il Worker non tiene in memoria tutte le risposte e non c'è un numero massimo di righe. Se il database non risponde alla prima pagina: 503. Se si ferma a metà, il download finisce con un errore, non con un file troncato in silenzio.
- In alternativa, con la sessione di un amministratore nello stesso browser: `/api/survey/v1/responses?survey=esperti-reatino&format=csv&version=2&sep=semicolon` (CSV per Excel), `…&format=csv&version=1` (virgola, risposte v1) o `…&format=json`.
- **JSON**: `{survey, [version,] exportedAt, responses: [{id, survey, version, receipt, createdAt, durationS, name, contact, consent, answers}], count}` (`version` in testa solo se richiesta con `&version`). Contiene sempre tutto; `count` sta in fondo ed è il numero delle risposte nel file.
- **CSV per Excel** (`&sep=semicolon`, file `…-excel.csv`): come il CSV con la virgola ma con il punto e virgola, il separatore di Excel in italiano: si apre con un doppio clic, con accenti e colonne al posto giusto. Stesse colonne, stesse celle. I numeri con decimali avrebbero la virgola (oggi le colonne piatte hanno solo numeri interi; i decimali stanno dentro il JSON delle liste). L'apostrofo contro le formule si mette anche dopo ogni virgola: Excel con impostazioni inglesi separerebbe lì le colonne.
- **CSV con la virgola**: UTF-8 con BOM, separatore virgola, righe CRLF (RFC 4180). Una riga per risposta: prima i campi fissi, poi una colonna per campo semplice ricavata dallo schema. Le domande aperte hanno due colonne (`….quick` in JSON e `….text`); le liste (specie, episodi, buttate, uscite a vuoto) sono in JSON. Le celle che inizierebbero con `=`, `+`, `-`, `@`, tabulazione o a capo ricevono un apostrofo davanti, per non diventare formule. Lo stesso vale dopo ogni `;` e ogni a capo dentro una cella: Excel in italiano, aperto con un doppio clic, separa le colonne con il punto e virgola e lì farebbe cominciare una cella nuova. Dopo un separatore o un a capo l'apostrofo va anche davanti alle virgolette: lì le virgolette aprono un campo, e un lettore tollerante attacca al campo chiuso il testo che segue («""=1+1» diventa «=1+1»). Per questo nel CSV una riga di testo che inizia con «- » diventa «'- »: i dati esatti sono nel JSON. Per Excel in italiano conviene il «CSV per Excel»; questo si apre con Dati › Da testo/CSV.
- **Cosa provano i test (e cosa no).** `tests/survey-privacy.test.mjs` legge i due file con i due separatori in due modi: un lettore tollerante del file intero, come Python `csv` con `strict=False` (le virgolette aprono un campo solo come primo carattere, il testo dopo la chiusura si attacca), e un controllo prudente che taglia a ogni separatore e a ogni a capo, anche tra virgolette, e legge come campo tra virgolette i pezzi che cominciano con le virgolette. Con i testi ostili dei revisori nessuna cella comincia con una formula; con la regola di prima sì (la prova non è vuota). Non è verificato con Excel vero: che Excel attacchi il testo dopo le virgolette di chiusura e lo valuti come formula è un'interpretazione dei revisori. LibreOffice 7 lascia «""=1+1» come testo.

## Decisioni di Matteo — 21 ottobre 2026

1. **Versione corta (v2)** con solo sapere abituale; nessuna domanda su episodi, numeri, stagioni passate, uscite a vuoto, quantità, classifiche, «la stagione è cambiata?». Le risposte v1 restano archiviate e i loro campi non affidabili non si usano (vedi sopra).
2. **Nome e contatto** solo con «sì» o «forse» alle segnalazioni con l'app e la richiesta di ricontatto; altrimenti non si salvano, nemmeno il nome. Supera il punto 1 del 17/10 per gli invii nuovi.
3. Dopo l'invio, invito a usare l'app sul campo («Annota», anche quando non si trova niente, con la durata) e link alla home.

## Decisioni di Matteo — 17 ottobre 2026 (versione 1)

1. **Nome sempre facoltativo**, anche senza ricontatto (superato per la v2 dal punto 2 del 21/10). Serve a collegare le risposte alla testimonianza durante il confronto e la revisione delle conoscenze raccolte; non compare nei risultati. Scopo esplicito nell'informativa e accanto al campo. Non autorizza a ricontattare.
2. **Conservazione:** risposte e nome fino al **31/12/2028**; contatto finché serve per il ricontatto/taccuino, comunque entro il **31/12/2027**. Il cron già presente azzera recapiti e consensi relativi dal 1/1/2028 ed elimina le risposte dal 1/1/2029; la raccolta si chiude allora con 410. Il titolare azzera il recapito anche prima se lo scopo si esaurisce: `UPDATE survey_responses SET contact=NULL,consent_recontact=0,consent_diary=0 WHERE receipt='XXXXXXXX'`. Restano i limiti dichiarati delle copie di sicurezza del fornitore.
3. **Invii vuoti:** 400 prima dei contatori; anche contenitori, elenchi e testi vuoti normalizzati sono vuoti. Zero, «No», «Non so» e una specie conosciuta sono risposte valide. Nome e consenso da soli non bastano. La pagina spiega come proseguire e conserva la bozza.
4. **Versante per fase:** «inizio stagione: il versante non conta» e «fine stagione: il versante non conta», esclusive solo con le direzioni della propria fase. Pagina e server condividono la regola. L'opzione globale resta ammessa per compatibilità.

## Intestazioni (clickjacking)

Verificato il 16/10/2026 sulla documentazione ufficiale (https://developers.cloudflare.com/workers/static-assets/headers/): Workers Static Assets legge un file `_headers` nella cartella degli asset e non lo serve come asset; le regole non valgono per le risposte generate dal Worker (`run_worker_first`). Wrangler 4.149.0 lo esclude dagli asset anche nel codice (`createAssetsIgnoreFunction`) e lo carica a parte con il deploy. `.assetsignore` non lo esclude. `/questionario` non è in `run_worker_first`: è servito direttamente dagli asset, quindi riceve le intestazioni. Provato con `wrangler dev` locale: `/questionario` risponde con le due intestazioni, `/questionario.html` con il 307 verso `/questionario` (anche lui con le intestazioni), `/_headers` dà 404. `wrangler.jsonc` non cambia. Il test statico è in `tests/survey-page.test.mjs`, quello sul server locale in `tests/browser/questionario.spec.mjs`.

Limiti: al massimo 100 regole e 2.000 caratteri per riga. La redazione passa dal Worker: per lei un `_headers` non basterebbe.

## Cambiare versione dello schema senza perdere le risposte vecchie

Le risposte salvate non si riscrivono mai: ogni riga conserva `version` e il JSON validato con lo schema di quella versione.

- **Serve una versione nuova** quando un campo cambia significato, unità o valori ammessi, quando si toglie un campo o un'opzione, e dal 2027 per gli anni. Un'aggiunta facoltativa può restare nella stessa versione solo se tutte le risposte già salvate restano valide con lo schema nuovo.
- Procedura:
  1. Copiare lo schema attuale come versione 1 (per esempio `ANSWERS_SPEC_V1`, o un modulo `js/survey-schema-v1.js`), senza toccarlo.
  2. Scrivere lo schema nuovo e alzare `SURVEY_VERSION`. `validateSurvey` accetta solo la versione corrente: una pagina vecchia rimasta aperta riceve 400 «ricarica la pagina» e la bozza resta salvata.
  3. La chiave della bozza contiene la versione (`…:v2`): le bozze v1 restano nel browser ma non si riaprono. Se serve, aggiungere nella pagina una conversione esplicita da v1.
  4. Esportazione: il JSON non cambia. Il CSV oggi ricava le colonne dallo schema corrente: prima di avere righe di due versioni, generare le colonne per versione (per esempio con `&version=1`) o l'unione delle colonne, con la versione in ogni riga.
  5. Aggiungere test con un corpo v1 salvato, che deve restare leggibile ed esportabile.
- L'analisi confronta le versioni solo sui campi con lo stesso significato.
- **Applicata il 21/10/2026 per la v2**: schema v1 congelato in `js/survey-schema-v1.js`; `validateSurvey` accetta solo la v2 (una pagina vecchia riceve 400 «ricarica la pagina»); bozza `…:v2` (le bozze v1 non si riaprono, la pagina offre di cancellarle); esportazione CSV per versione (`&version=1|2`, predefinita la 2) con la versione in ogni riga; test con un corpo v1 salvato, leggibile ed esportabile (`tests/survey-api.test.mjs`) e con la v1 congelata (`tests/survey-schema-v1.test.mjs`).

## Verifiche

```bash
npm test                                    # schema e API su D1 finto
node tools/build_survey_lists.mjs --check   # elenco dei nomi delle specie aggiornato
node tools/ds-guard.mjs                     # nessuna regressione del design system
npx wrangler deploy --dry-run
npx playwright test tests/browser/questionario.spec.mjs
npx playwright test tests/browser/cms.spec.mjs -g "redazione"
```


## Chiarezza, risposte diverse e non pertinenza — 17 ottobre 2026 (solo versione 1)

Le regole di questa sezione riguardano la versione 1 e le sue risposte archiviate; la versione 2 non ha «Altro / specifica», «Non pertinente», versione breve o completa.


- Nessuna durata di compilazione né domanda sul tempo disponibile. Restano versione breve e completa come livelli di approfondimento.
- Ogni domanda ha indicazioni per rispondere; sono spiegati quota, picco, attesa dopo la pioggia, buttata, versante e provenienza dei ricordi.
- Le domande con risposte aperte mantengono il testo libero e «Altro…». Le altre domande di ricerca hanno «Altro / specifica», salvo i campi che consentono già una specifica libera. Nome, recapito e consensi mantengono il proprio significato.
- «Non pertinente per me» esclude la risposta ordinaria di quella domanda; l’eventuale spiegazione è facoltativa. La scelta si conserva in bozza e compare nel riepilogo. Una parte A–H può essere esplicitamente dichiarata non pertinente, distinta da una parte saltata senza risposta.
- **Contratto compatibile con v1:** ciascun gruppo di risposte o record di specie/episodio/uscita può avere `clarifications: [{field, kind: "other"|"not_applicable", text}]`. Campi ammessi ricavati dallo schema del gruppo; niente doppioni, massimo una nota per domanda, testo massimo 600 caratteri, «other» richiede una spiegazione. Non si accetta «not_applicable» insieme a un valore per la stessa domanda. Le parti non pertinenti sono in `answers.notApplicableParts` (A–H), senza risposte della parte esclusa. Il cancello degli episodi usa `answers.clarifications` con `field: "weatherRemembers"`.
- Il JSON conserva queste informazioni e il CSV le esporta come colonne `clarifications`/`notApplicableParts` in JSON. Le vecchie risposte restano valide; non sono reinterpretate.
- Informativa completa in `<details>` nel footer, chiusa inizialmente. I link «Leggi l’informativa» la aprono prima di raggiungerla, anche con tastiera; il testo è già presente nella pagina. Finalità e consenso includono la preparazione dell’app.
- Le verifiche restano mirate al questionario, come richiesto da Matteo. Shell v104.
