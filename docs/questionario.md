# Questionario per i cercatori esperti del Reatino

Aggiornato al 16/10/2026. Versione dello schema: **1**.

## Scopo

Raccogliere le esperienze degli amici che vanno a funghi nel Reatino, anche occasionalmente: quando e a che quota escono le specie, che cosa fanno pioggia, freddo, vento e secco, quali boschi e versanti contano, accessi, regole locali e rischi. Servono a confrontare il modello con l'esperienza sul campo.

Tono personale, da Matteo agli amici: titolo «La tua esperienza a funghi nel Reatino», apertura «Mi dai una mano?», nessun requisito di essere esperti. L’esperienza si descrive con le risposte, non si presume. Decisione di Matteo del 17/10/2026.

L’introduzione spiega lo scopo richiesto da Matteo il 17/10/2026: stiamo preparando un’app che speriamo possa aiutare nelle uscite e nella conoscenza del bosco. Le domande raccolgono l’esperienza personale; non chiedono di provare l’app. Si compila da soli, anche da telefono, senza login. Il nome è facoltativo. Le risposte restano a noi, nel database D1 del sito.

Le risposte sono dichiarazioni di persone esperte, non misure. Nell'analisi vanno tenute distinte da dati verificati. Ogni scheda specie ha un grado di sicurezza (1–5); episodi e buttate dicono se la data viene da foto o appunti o dalla memoria, e se un episodio è stato visto di persona o sentito dire.

## Indirizzo e file

- Pagina: https://fungaroli.zatteo.workers.dev/questionario. È il file statico `questionario.html`, servito da Workers Assets (gestione HTML predefinita: `/questionario.html` porta a `/questionario`). Non serve una regola in `wrangler.jsonc`. La pagina ha `noindex` e non è collegata dall'app: si diffonde con il link.
- `_headers` (nella cartella degli asset, cioè la radice del repository): per `/questionario` e `/questionario.html` aggiunge `Content-Security-Policy: frame-ancestors 'none'` e `X-Frame-Options: DENY`, così nessun altro sito può mostrare la pagina in un riquadro (clickjacking). `frame-ancestors` nel meta CSP della pagina non vale: serve l'intestazione. Vedi «Intestazioni» più sotto.
- `js/questionario.js` e `css/questionario.css`: compilazione a parti, bozza nel browser, riepilogo e invio.
- `js/survey-schema.js`: **unica fonte dello schema**, importata dalla pagina, dal Worker e dalla redazione.
- `js/survey-species-names.js`: nomi italiani e latini per l'autocomplete delle specie, generato da `node tools/build_survey_lists.mjs` (con `--check` controlla che sia aggiornato; lo controlla anche un test).
- `worker/survey.js`: API. `migrations/0004_survey.sql`: tabelle.
- Test: `tests/survey-schema.test.mjs`, `tests/survey-api.test.mjs`, `tests/survey-privacy.test.mjs`, `tests/survey-page.test.mjs` (in `npm test`), `tests/browser/questionario.spec.mjs` e il pannello della redazione in `tests/browser/cms.spec.mjs` (suite browser). Nel browser, sul Worker e sul D1 locali: invio e ricevuta, bozza, consenso, nessuna risposta preimpostata, versanti e cancelli (rischi, stagione delle specie, episodi della parte D) fino al dato salvato, bozza con un cancello cancellato e bozza di prima dei cancelli, indirizzo del titolare uguale a `data/legal.json` (informativa e pagina Info), campo trappola, tetto del giorno, intestazioni, 320 px, rete giù; in redazione il conteggio leggero, i due CSV (stesse colonne, apostrofo contro le formule), ricerca e cancellazione per ricevuta. Le prove leggono e scrivono il D1 locale con `sqlite3` (cartella `FUNGAROLI_BROWSER_PERSIST`).
- Service worker: le navigazioni verso `/questionario` escono dalla gestione di `sw.js`. Senza rete la pagina non deve aprire l'app al suo posto.

## Come si compila

- All'inizio si sceglie la **versione breve** (circa 10 minuti) o la **completa** (circa 30–40 minuti). Si passa dall'una all'altra in qualsiasi momento senza perdere niente. La breve chiede: chi sei (essenziale), calendario e quote di al massimo 3 specie, al massimo 3 buttate e 1 uscita a vuoto, la parte finale.
- Ogni parte ha «Salta questa parte». L'avanzamento conta solo le parti attive. Le domande di approfondimento compaiono dopo un «sì».
- Mentre si compila, la bozza resta nel browser (`localStorage`, chiave `fronda:questionario:esperti-reatino:v1`). Al server arriva qualcosa solo con «Invia», dopo il riepilogo. Si invia solo ciò che è visibile nella versione scelta e non saltato.
- **Nessuna risposta suggerita che condizioni una stima.** I numeri (quote, giorni, ore, anni) restano vuoti finché la persona non scrive, e hanno sempre «Non so». Nessuna opzione preselezionata, nessun esempio numerico, nessuna scala con un valore già marcato. L'ordine dei 7 fattori della classifica cambia da una bozza all'altra. Le risposte rapide (`QUICK_ANSWERS`) sono categorie neutre che coprono le due direzioni, sempre con «Non so» e «Altro…» con testo libero. Scambi pericolosi, intossicazioni e specie evitate restano solo testo: un elenco di nomi suggerirebbe la risposta. Intossicazioni e specie evitate hanno prima un cancello «Sì / No / Preferisco non dirlo» (`RISK_GATE`): il campo di testo compare solo dopo «Sì». Il cancello dice se c'è qualcosa da raccontare, non che cosa. Allo stesso modo «La stagione è cambiata negli anni?» (`SEASON_GATE`: Sì / No / Non so) apre «Come è cambiata?» e «Ricordi un episodio…?» della parte D (`WEATHER_GATE`: Sì / No) apre gli episodi. Tutti i cancelli si inviano, anche con «No»: il riepilogo mostra il cancello e, solo dopo «Sì», il dettaglio.
- L'indicazione della domanda sulle intossicazioni chiede specie, anno e zona, e di non dare dettagli sulla salute di persone riconoscibili, nemmeno propria. «Altri esperti» chiede di non scrivere nomi o contatti di altre persone e di girare loro il link.
- Autocomplete con `datalist` nativi, sempre con testo libero ammesso: per le zone le 8 macro-zone, le località principali e i 73 comuni della provincia di Rieti; per le specie i nomi del catalogo.
- La pagina chiede solo zona e quota indicativa, mai posti precisi.

## Schema v1

Corpo dell'invio:

```json
{"survey":"esperti-reatino","version":1,"startedAt":"<ISO>","website":"",
 "respondent":{"name":"…","contact":"…"},
 "consent":{"anonymousUse":true,"recontact":false,"diary":false},
 "answers":{…}}
```

- `website` è un campo trappola: deve restare vuoto. Nella pagina l'input ha un nome neutro (`id="q-lascia-vuoto"`, `name="lascia_vuoto"`), con `autocomplete="off"`, `tabindex="-1"`, il contenitore `aria-hidden` e gli attributi con cui 1Password, LastPass e Bitwarden ignorano un campo: con «website» o «url» il browser o il gestore di password potrebbe riempirlo, e il server risponderebbe con un 201 finto (risposta persa in silenzio). La chiave nel corpo resta `website`. La pagina non controlla il campo trappola prima dell'invio (lo toglie dal controllo con `validateSurvey`): lo giudica solo il server, con il 201 finto. Un errore su un campo invisibile bloccherebbe la persona senza rimedio e mostrerebbe la trappola a chi esegue la pagina.
- `startedAt` serve solo a calcolare la durata. Se non è valido si ignora.
- `consent.anonymousUse` deve essere `true`. Il nome della chiave resta per contratto, ma i testi non dicono «anonimo»: le risposte restano legate alla ricevuta e, se dati, a nome e contatto, quindi sono dati personali. La casella dice «Acconsento all’uso delle mie risposte per studiare stagioni e condizioni dei funghi nel Reatino, come spiegato nell’informativa. Nei risultati non compariranno il mio nome né il mio contatto.» Nome e contatto sono facoltativi (al massimo 80 e 120 caratteri, `RESPONDENT_LIMITS`). Il contatto si salva solo se `recontact` o `diary` è `true`: senza uno dei due «sì» `validateSurvey` lo porta a `null` (serve solo a ricontattare; la pagina lo chiede solo dopo un «sì»).
- Ogni campo di `answers` è facoltativo, ma per inviare serve almeno una risposta non vuota. Le chiavi sconosciute vengono rifiutate a ogni livello.

| Parte | Chiave | Contenuto |
|---|---|---|
| A. Chi sei | `profile` | anni di esperienza, chi ti ha insegnato, zone in ordine di frequenza (`ZONES`) e altre zone, uscite in un anno buono e in uno scarso, specie cercate (`SPECIES`), attestato, controllo ASL, se e da che anno annoti le uscite |
| B. Specie | `species` (≤ 15) | per specie (`SPECIES` o «altra» con nome): inizio, picco e fine (mese + inizio/metà/fine), `seasonChanged` (sì, no, non so) e, solo dopo «sì», come è cambiata (`changed`), quota minima, massima e più frequente, boschi dove la trovi e dove mai (`FORESTS`), giorni dopo la pioggia (minimo, di solito, massimo), durata della buttata, sicurezza 1–5 |
| C. Pioggia | `rain` | pioggia buona, estate secca, cosa fa finire una buttata, specie con poca pioggia |
| D. Temperatura, vento e secco | `weatherRemembers`, `weatherEvents` (≤ 10) | se ricordi un episodio (sì, no) e, solo dopo «sì», gli episodi: anno, mese, zona, tipo, effetto, dopo quanti giorni, visto o sentito dire |
| E. Ultimi anni | `flushes`, `emptyTrips` (≤ 10 ciascuno) | buttate e uscite a vuoto: anno, mese, settimana, zona, quota, bosco, specie, quantità, ore di ricerca, tempo prima o motivo, data da foto o memoria |
| F. Bosco | `forest` | versante (nord, sud, est e ovest, a inizio e a fine stagione), età del bosco, dove guardi prima, terreno, posti che rendono ogni anno, segni creduti (con quante volte hanno funzionato), classifica dei 7 fattori (posti 1–7 distinti, anche solo i primi) |
| G. Accessi | `access` | sbarre e divieti, navigatori, regole locali, parchi e riserve, affollamento, parcheggio |
| H. Rischi | `risks` | scambi pericolosi; `knowsPoisonings` (sì, no, non dico) e, solo dopo «sì», `poisonings`; errori dei principianti; `avoidsSpecies` (sì, no, non dico) e, solo dopo «sì», `avoided`; pericoli in montagna |
| I. Dopo | `followUp` + `consent` + `respondent` | altri esperti, taccuino delle uscite, ricontatto, nome e contatto |

Regole comuni:

- **Domande aperte**: `{quick: [...], text: "..."}`. `quick` contiene valori di `QUICK_ANSWERS[percorso].options` oppure `"non so"`, che non si combina con altre scelte (come i valori in `exclusive`; con `single` se ne sceglie uno solo). Il server accetta anche una semplice stringa e la normalizza.
- **Numeri**: `null` o assenti vogliono dire «non so». Limiti in `ANSWERS_SPEC`; `fieldSpec('species.elevMin')` li dà alla pagina (maxlength, minimo, massimo). Le ore ammettono i decimali.
- **Coerenza** nelle schede specie: quota minima ≤ più frequente ≤ massima; giorni minimo ≤ di solito ≤ massimo; un bosco non sta sia tra «la trovi» sia tra «mai»; una sola scheda per specie dell'elenco. Nei rischi, con `knowsPoisonings` o `avoidsSpecies` a «no» o «non dico» il testo corrispondente deve mancare (400 altrimenti). Lo stesso per `changed` con `seasonChanged` a «no» o «non so», e per `weatherEvents` con `weatherRemembers` a «no».
- **Aggiunte del 16/10/2026 nella stessa versione 1**: i cancelli `risks.knowsPoisonings`, `risks.avoidsSpecies`, `species[].seasonChanged` e `weatherRemembers` (tutti facoltativi), i versanti est e ovest in `forest.aspect` e «i funghi escono prima» in `rain.drySummer` (accanto a «più tardi»). Tutte le risposte già valide restano valide: una risposta con il solo testo, senza cancello, si accetta come prima; «non è cambiata» resta ammesso in `species.changed` (la pagina non lo mostra più: lo dice il «No» del cancello).
- **Bozze di prima dei cancelli**: la pagina le converte una volta sola, guardando la bozza com'era salvata (`upgradeDraft`). Un racconto dei rischi scritto in una bozza senza la chiave del cancello riceve «Sì», così non si perde. Una bozza nuova ha sempre la chiave, anche vuota dopo «Cancella la scelta»: in quel caso il cancello resta vuoto e il testo non parte. Il vecchio cancello della stagione delle schede (`changedYes`, che non si inviava) diventa `seasonChanged`.
- **Testi**: forma NFC, senza caratteri di controllo. L'HTML resta testo: chi mostra le risposte usa `textContent`, mai `innerHTML`.
- **Anni**: dal 2000 al 2026 (`YEAR_MIN`, `YEAR_MAX`). Dal 2027 serve una versione nuova dello schema.

Fonti degli elenchi per l'autocomplete: comuni da ISTAT, «Elenco dei comuni italiani» (file del 26/01/2024, consultato il 16/10/2026, 73 comuni con codice 057, licenza CC BY 4.0); località con il comune verificato su OpenStreetMap/Nominatim (ODbL). Fonte, data e licenza sono anche in `js/survey-schema.js`.

## API

| Richiesta | Chi | Risposte |
|---|---|---|
| `POST /api/survey/v1/responses` (JSON, ≤ 64 KB) | chiunque, dalla pagina del sito | `201 {id, receipt}`; `400 {error, fields, errors}`; `403` origine diversa dal sito; `413` troppo grande; `415` tipo sbagliato; `429 {error, code}` troppi invii, con `Retry-After` fino alla mezzanotte UTC: `code` è `connection-limit` (limite per connessione) o `daily-limit` (tetto complessivo del giorno) |
| `GET /api/survey/v1/responses?survey=esperti-reatino&format=json\|csv\|count` | amministratori | elenco completo (`json`, `csv`) o solo `{survey, count, lastAt}` (`count`, per la redazione: non legge né manda le risposte); `&receipt=XXXXXXXX` cerca un codice ricevuta (maiuscole o minuscole, con o senza trattino); con `format=csv`, `&sep=semicolon` dà il «CSV per Excel» (punto e virgola), `&sep=comma` o niente la versione con la virgola; altri valori: 400 |
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
- Nella parte «Rischi» l'informativa chiede di non scrivere dati sulla salute, propri o di altri: bastano specie, periodo e zona. Il consenso chiesto non è un consenso esplicito per dati sanitari (art. 9).
- Dopo l'invio la persona riceve un **codice ricevuta** di 8 caratteri (senza 0/O e 1/I). Il dispositivo ricorda le ultime 5 ricevute; la bozza si cancella.
- **Richiesta di cancellazione:** redazione → «Risposte al questionario» → codice ricevuta → «Cerca la risposta» → «Cancella questa risposta» e conferma. In alternativa `DELETE /api/survey/v1/responses/<codice>` con la sessione di un amministratore. Le copie di recupero di D1 (Time Travel) seguono i tempi del piano Cloudflare.
- **Altri diritti (art. 15–20), procedura breve.** Prima di tutto si verifica chi chiede: il codice ricevuta resta visibile nella pagina iniziale del dispositivo da cui si è inviato, quindi da solo non basta se la risposta contiene nome o contatto.
  - *Accesso e copia (anche portabilità, art. 20, perché la base è il consenso):* con la sessione di un amministratore `GET /api/survey/v1/responses?survey=esperti-reatino&format=json&receipt=XXXXXXXX`, e si manda il JSON (formato leggibile da computer). Se la risposta contiene nome o contatto, si risponde solo al contatto salvato, oppure si chiede una conferma (per esempio un dettaglio delle risposte).
  - *Rettifica:* cancellazione e nuovo invio dalla pagina, oppure una correzione puntuale con `npx wrangler d1 execute fungaroli-community --remote --command "UPDATE survey_responses SET name='Nome corretto' WHERE receipt='XXXXXXXX'"` (lo stesso per `contact`; le risposte in `answers` vanno corrette solo con un JSON che passa `validateSurvey`).
  - *Limitazione:* oggi non c'è un campo per escludere una risposta dall'analisi. Si annota la ricevuta in un elenco tenuto fuori dal repository e la si esclude a mano; oppure, se la persona preferisce, si cancella.
- **Contatto del titolare (deciso da Matteo il 16/10/2026):** la sua email personale, zatteo@gmail.com, scelta da lui. Sta in `data/legal.json` (sezione «Privacy e dati» della pagina Info: «scrivi a zatteo@gmail.com», link `mailto:`) e nell'informativa del questionario («Chi tratta i dati» e «I tuoi diritti»). La ricevuta dopo l'invio prende il link dall'informativa: nella pagina l'indirizzo è scritto una volta sola. `tests/survey-privacy.test.mjs` controlla che l'indirizzo dell'informativa sia quello di `data/legal.json` e che il sanificatore del CMS tenga il link `mailto:`. `version` e `verified_on` di `legal.json` non cambiano (le regole sono le stesse): l'avviso iniziale dell'app non ricompare. Il testo nuovo arriva in produzione con il deploy solo se `legal` non è stato modificato da un autore nella redazione (vedi [legale.md](legale.md)).

## Esportazione

- Dalla redazione, pulsante **Risposte al questionario** (solo amministratori): conteggio (con `format=count`: numero e data dell'ultima, senza scaricare le risposte), «CSV per Excel», «CSV con la virgola», «Scarica il JSON», ricerca per ricevuta e cancellazione.
- Le esportazioni si leggono a pagine di 100 righe (`EXPORT_PAGE`, cursore su `created_at` e `id`) e si scrivono mentre si leggono: il Worker non tiene in memoria tutte le risposte e non c'è un numero massimo di righe. Se il database non risponde alla prima pagina: 503. Se si ferma a metà, il download finisce con un errore, non con un file troncato in silenzio.
- In alternativa, con la sessione di un amministratore nello stesso browser: `/api/survey/v1/responses?survey=esperti-reatino&format=csv&sep=semicolon` (CSV per Excel), `…&format=csv` (virgola) o `…&format=json`.
- **JSON**: `{survey, exportedAt, responses: [{id, survey, version, receipt, createdAt, durationS, name, contact, consent, answers}], count}`. Contiene sempre tutto; `count` sta in fondo ed è il numero delle risposte nel file.
- **CSV per Excel** (`&sep=semicolon`, file `…-excel.csv`): come il CSV con la virgola ma con il punto e virgola, il separatore di Excel in italiano: si apre con un doppio clic, con accenti e colonne al posto giusto. Stesse colonne, stesse celle. I numeri con decimali avrebbero la virgola (oggi le colonne piatte hanno solo numeri interi; i decimali stanno dentro il JSON delle liste). L'apostrofo contro le formule si mette anche dopo ogni virgola: Excel con impostazioni inglesi separerebbe lì le colonne.
- **CSV con la virgola**: UTF-8 con BOM, separatore virgola, righe CRLF (RFC 4180). Una riga per risposta: prima i campi fissi, poi una colonna per campo semplice ricavata dallo schema. Le domande aperte hanno due colonne (`….quick` in JSON e `….text`); le liste (specie, episodi, buttate, uscite a vuoto) sono in JSON. Le celle che inizierebbero con `=`, `+`, `-`, `@`, tabulazione o a capo ricevono un apostrofo davanti, per non diventare formule. Lo stesso vale dopo ogni `;` e ogni a capo dentro una cella: Excel in italiano, aperto con un doppio clic, separa le colonne con il punto e virgola e lì farebbe cominciare una cella nuova. Dopo un separatore o un a capo l'apostrofo va anche davanti alle virgolette: lì le virgolette aprono un campo, e un lettore tollerante attacca al campo chiuso il testo che segue («""=1+1» diventa «=1+1»). Per questo nel CSV una riga di testo che inizia con «- » diventa «'- »: i dati esatti sono nel JSON. Per Excel in italiano conviene il «CSV per Excel»; questo si apre con Dati › Da testo/CSV.
- **Cosa provano i test (e cosa no).** `tests/survey-privacy.test.mjs` legge i due file con i due separatori in due modi: un lettore tollerante del file intero, come Python `csv` con `strict=False` (le virgolette aprono un campo solo come primo carattere, il testo dopo la chiusura si attacca), e un controllo prudente che taglia a ogni separatore e a ogni a capo, anche tra virgolette, e legge come campo tra virgolette i pezzi che cominciano con le virgolette. Con i testi ostili dei revisori nessuna cella comincia con una formula; con la regola di prima sì (la prova non è vuota). Non è verificato con Excel vero: che Excel attacchi il testo dopo le virgolette di chiusura e lo valuti come formula è un'interpretazione dei revisori. LibreOffice 7 lascia «""=1+1» come testo.

## Decisioni di Matteo — 17 ottobre 2026

1. **Nome sempre facoltativo**, anche senza ricontatto. Serve a collegare le risposte alla testimonianza durante il confronto e la revisione delle conoscenze raccolte; non compare nei risultati. Scopo esplicito nell'informativa e accanto al campo. Non autorizza a ricontattare.
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

## Verifiche

```bash
npm test                                    # schema e API su D1 finto
node tools/build_survey_lists.mjs --check   # elenco dei nomi delle specie aggiornato
npx wrangler deploy --dry-run
npx playwright test tests/browser/questionario.spec.mjs
npx playwright test tests/browser/cms.spec.mjs -g "redazione"
```


## Chiarezza, risposte diverse e non pertinenza — 17 ottobre 2026

- Nessuna durata di compilazione né domanda sul tempo disponibile. Restano versione breve e completa come livelli di approfondimento.
- Ogni domanda ha indicazioni per rispondere; sono spiegati quota, picco, attesa dopo la pioggia, buttata, versante e provenienza dei ricordi.
- Le domande con risposte aperte mantengono il testo libero e «Altro…». Le altre domande di ricerca hanno «Altro / specifica», salvo i campi che consentono già una specifica libera. Nome, recapito e consensi mantengono il proprio significato.
- «Non pertinente per me» esclude la risposta ordinaria di quella domanda; l’eventuale spiegazione è facoltativa. La scelta si conserva in bozza e compare nel riepilogo. Una parte A–H può essere esplicitamente dichiarata non pertinente, distinta da una parte saltata senza risposta.
- **Contratto compatibile con v1:** ciascun gruppo di risposte o record di specie/episodio/uscita può avere `clarifications: [{field, kind: "other"|"not_applicable", text}]`. Campi ammessi ricavati dallo schema del gruppo; niente doppioni, massimo una nota per domanda, testo massimo 600 caratteri, «other» richiede una spiegazione. Non si accetta «not_applicable» insieme a un valore per la stessa domanda. Le parti non pertinenti sono in `answers.notApplicableParts` (A–H), senza risposte della parte esclusa. Il cancello degli episodi usa `answers.clarifications` con `field: "weatherRemembers"`.
- Il JSON conserva queste informazioni e il CSV le esporta come colonne `clarifications`/`notApplicableParts` in JSON. Le vecchie risposte restano valide; non sono reinterpretate.
- Informativa completa in `<details>` nel footer, chiusa inizialmente. I link «Leggi l’informativa» la aprono prima di raggiungerla, anche con tastiera; il testo è già presente nella pagina. Finalità e consenso includono la preparazione dell’app.
- Le verifiche restano mirate al questionario, come richiesto da Matteo. Shell v104.
