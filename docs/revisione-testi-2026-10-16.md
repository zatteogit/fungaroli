# Revisione dei testi dell’app — 16 ottobre 2026

## Criterio editoriale

La prima schermata serve ad agire: nome, dati essenziali, caratteri principali, rischi specifici e azione.
Le spiegazioni si aprono con una domanda o un titolo concreto. Nessun taglio automatico dei testi scientifici o delle avvertenze; niente ellissi per nascondere informazioni di sicurezza.

- Un messaggio per blocco. Evitare di spiegare di nuovo quello che dice il pulsante o il titolo.
- Un solo avviso generale per scheda. Cautele specifiche, specie mortali, preparazioni obbligatorie e tutela rimangono evidenti.
- Etichette brevi e verbi d’azione. Il taccuino cerca anche giri e uscite.
- Approfondimenti, glossario, regole, metodo e fonti possono essere lunghi: l’utente li apre espressamente.
- Le aperture native `details/summary` funzionano da tastiera e senza JavaScript aggiuntivo.

## Provenienza e limite della verifica

Non tutti i testi sono nel CMS. `js/app.js` usa lo snapshot pubblico `/api/content/v1/snapshot`, poi la copia locale, poi i JSON del repository. I renderer in `index.html` e `js/` contengono ancora titoli, inviti, messaggi di stato, errori e avvisi generali.

In questa sessione lo snapshot remoto non è raggiungibile (proxy CONNECT 403) e `CMS_TOKEN` non è disponibile. Non è stato modificato né pubblicato alcun documento nel CMS. Sono stati controllati i contenuti distribuiti con il repository e la loro presentazione nei renderer. Una revisione del testo eventualmente modificato da autori sul CMS richiede il suo export; non si può dichiararla eseguita su dati remoti non letti.

Il deploy aggiorna `ui-copy` solo se il documento è ancora un seed non modificato da un autore (`worker/cms.js`, `REPOSITORY_REFRESHED`). Le modifiche ai renderer valgono anche per le versioni CMS già pubblicate: spostano i testi nei dettagli senza sostituirne il contenuto.

## Percorsi controllati e interventi

| Area | Prima vista | Dettagli su richiesta / decisione |
| --- | --- | --- |
| Uscite e zona | Proposta, tempo, accesso, meteo, azioni | Metodo, motivazioni, regole e informazioni della zona già in sezioni. Le note di tutela restano visibili. |
| Invito della community | Stato sintetico, segnalazione, profilo | Introduzione CMS e limiti delle osservazioni in “Perché condividere un’osservazione”. Rimossa l’introduzione ripetuta dell’app. |
| Cataloghi | Titolo e descrizione breve, gruppi e filtri | Ricerca guidata in pannello; regole botaniche già chiuse. La nota sui fiori diventa sintetica con la norma apribile. |
| Funghi modellati | Cautele specifiche, tessere dei caratteri, cucina obbligatoria, sosia, ambiente | Elenco analitico in “Cosa controllare da vicino”; consigli ambientali in “Indizi nell’ambiente”. Avviso ASL unico e apribile; introduzione cucina accorciata. |
| Altri funghi e catalogo commestibili | Cautele, caratteri, sosia, ambiente, stato dell’indice e condivisione | Eliminati titolo promozionale e doppio avviso ASL. Stagione e utilità delle osservazioni in un dettaglio. |
| Piante | Rischi, tessere, parti documentate, preparazione, tutela, sosia e ambiente | Elenco analitico apribile; note sulla stagione e presenza raccolte in un dettaglio. La nota del modello non ripete la collocazione nell’interfaccia. |
| Alberi | Tessere, specie simili, legami con funghi | Elenco analitico apribile; descrizioni estese, zone, fonti già chiuse. |
| Impara a riconoscere | Domanda e risposte, candidati, limiti sintetici | Avvisi generali e regole già chiusi; si mantengono le cautele sui candidati mortali. |
| Glossario | Elenco di termini | Definizioni e immagini si aprono per voce; nessun taglio delle definizioni. |
| Guide e approfondimenti | Scelta dell’argomento, titolo ed estratto | Articoli lunghi conservati: sono contenuti richiesti esplicitamente. |
| Taccuino | Azioni e pagine, invito breve alla condivisione | Rimossa la seconda spiegazione di Condividi; ricerca rinominata; sincronizzazione e confronto già chiusi. Gli appunti personali lunghi hanno già “Leggi tutto”. |
| Profilo e accesso | Passkey, nome facoltativo, azioni, privacy della condivisione | Recupero del profilo e limiti della passkey raccolti in un dettaglio. |
| Moduli di appunti e osservazioni | Campi necessari, conferma, consenso | Controllo dell’identità e note già facoltativi/apribili. Le condizioni della condivisione rimangono accanto all’azione. |
| Regole e sicurezza | Emergenza e contatti | Rimossa la seconda descrizione del metodo: resta il collegamento alla pagina completa. Crediti e spiegazioni delle illustrazioni raccolti in un dettaglio. Norme e consenso iniziale conservati. |
| Metodo | Introduzione breve | La pagina è già una richiesta di approfondimento; formule, fonti e limiti conservati. |
| Installazione, connessione, errori | Stato e azione di recupero | Già messaggi operativi brevi; nessun cambiamento di comportamento. |

## Ricognizione dei contenuti lunghi

Conteggio dei valori testuali oltre 320 caratteri nei principali documenti editoriali locali, dopo la rimozione dei tag HTML. È un indicatore per trovare blocchi da valutare, non un limite editoriale né un conteggio di paragrafi effettivamente visibili. Esclusi riferimenti a file, URL, fonti, citazioni e metadati di provenienza. I dati geografici e gli asset non sono testi dell’interfaccia.

| Documento | Valori oltre 320 caratteri |
| --- | ---: |
| `ui-copy` | 0 |
| `zones` | 3 |
| `trails` | 0 |
| `species-id` | 1 |
| `species-traits` | 67 |
| `edible-catalog` | 0 |
| `plants` | 1 |
| `trees` | 4 |
| `glossary` | 0 |
| `guides` | 3 |
| `preparation` | 17 |
| `recognize-plants` | 0 |
| `recognize-trees` | 1 |
| `challenges` | 0 |
| `legal` | 5 |

I testi più lunghi si concentrano nelle note scientifiche, negli articoli, nelle norme e nelle spiegazioni della preparazione. Molte note (`traits_notes`, note di validazione e di provenienza) non sono mostrate come paragrafi iniziali. Le cautele botaniche, le restrizioni di accesso e di tutela possono restare più lunghe: non si elimina una condizione necessaria per rispettare un limite di lunghezza.

## Verifica

Test dedicato a 320 e 1280 px: una sola nota ASL nella scheda del catalogo, CTA sintetica, tessere visibili, descrizioni inizialmente chiuse e apribili con Invio, nessun overflow. I test del glossario aprono ora esplicitamente il dettaglio dei caratteri prima di controllarne i link. Restano da verificare separatamente gli eventuali testi redazionali remoti modificati rispetto al repository.

Esito locale: 217 test unitari, dry-run del Worker e diff check superati. Verificati 58 casi browser distinti negli spec learning, botanical-notebook e community; le prove che cercavano testi rimossi o link nei dettagli inizialmente chiusi sono state aggiornate e rieseguite. Nessuna pubblicazione eseguita.

## Ricerca e glossario

Il glossario usa un indice A–Z persistente durante lo scorrimento; le lettere senza voci sono disabilitate in base all’argomento. Eliminati i campi di ricerca locali dal glossario e dal catalogo Piante. Il cerca globale, anche da scorciatoia, cerca sempre in tutta l’app; i gruppi pertinenti alla sezione corrente vengono prima degli altri. Le pagine dei funghi e i pannelli contestuali usano lo stesso criterio. Regola registrata anche in AGENTS.md. Safari aperto sul Mac non è raggiungibile dagli strumenti di questa sessione.
