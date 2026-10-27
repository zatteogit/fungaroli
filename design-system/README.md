# Fronda · Experience, Design & Language System

Versione iniziale della fondazione comune, **27 ottobre 2026**. Destinata a Consumer Free/Plus,
Academy, Territorio e Partners. Parte dalle decisioni Fronda già approvate e non ridisegna l’app
corrente. I contratti nuovi sono la direzione di sviluppo; la migrazione resta esplicita e graduale.

## Un sistema in quattro livelli

| Livello | Responsabilità | Fonte |
|---|---|---|
| Esperienza | Compiti, continuità, navigazione, stati e accessibilità | [experience.json](experience.json) |
| Linguaggio | Vocabolario, tono, formati, messaggi e regole editoriali | [language.it.json](language.it.json) |
| Fondazioni visuali | Colori correnti, temi, scale, ruoli e token dei componenti | `css/tokens.css`, [foundation.json](foundation.json) |
| Declinazioni | Etichetta, compito e accento editoriale per offerta | [editions.json](editions.json) |

Il sistema non è una raccolta di colori. Un componente è condiviso quando conserva semantica,
comportamento, stati, testo accessibile e relazione con i dati. La sola somiglianza visiva non basta.

## Esperienza comune

Fronda accompagna **osservare → capire → preparare → annotare → approfondire**. La posizione
del compito nel percorso può cambiare per offerta, mantenendo chiari contesto e conseguenze.

- **Osservare:** descrivere ciò che è documentato, distinguere confronto, ipotesi e verifica esperta.
- **Capire:** presentare prima dati leggibili, poi spiegazione, fonti e limiti. Glossario contestuale.
- **Preparare:** separare condizioni pratiche, potenziale biologico e osservazioni dichiarate.
- **Annotare:** appunti privati come impostazione ordinaria; la condivisione è un atto esplicito.
- **Approfondire:** progressi e quiz insegnano un metodo, senza certificare identificazione o raccolto.

La navigazione consumer conserva **Uscite, Mappa, Scopri, Taccuino** e ricerca globale. Academy
potrà aggiungere il contesto del gruppo e del corso; Territorio quello del pacchetto locale;
Partners la provenienza del contributo. Sono contesti e percorsi aggiuntivi, non nuove definizioni
degli stessi comandi. Una navigazione alternativa completa richiede una decisione comune.

Le schede contestuali e le pagine complete condividono contenuti. Ritorno reale, selezione, scroll
ed elemento a fuoco si conservano. Un solo dialog modale coordinato, nessuna pila di pannelli.
Con tastiera aperta, header e chiusura devono restare raggiungibili nel viewport visibile.

## Linguaggio

Italiano semplice, tono calmo e concreto, verbi che descrivono l’azione. Parlare dell’attività della
persona, evitando nomi di servizi, implementazioni o procedure interne. Non trasformare dati incerti
in promesse. Il testo commerciale può invitare ad approfondire, senza sostituire le informazioni
essenziali su sicurezza, privacy o limiti scientifici.

| Caso | Regola | Esempio |
|---|---|---|
| Dato assente | Esplicitare l’assenza; non usare zero | «Dato non disponibile» |
| Ricerca a vuoto | Dire cosa è stato fatto | «Cercato, non osservato» |
| Cache | Conservare data e limite d’uso | «Questi dati non sono aggiornati» |
| Errore | Situazione, effetto concreto, azione possibile | «Non siamo riusciti a caricare i dati. Riprova» |
| Permesso | Motivo legato al compito, alternativa | «Usa la posizione per trovare le zone vicine. Puoi indicare la base a mano» |
| Condivisione | Dire quali dati escono dallo spazio privato | «Condividi zona, giorno e osservazione» |
| Contenuto revisionato | Nominare revisore, versione e perimetro reale | Nessun badge «approvato» senza un processo documentato |
| Sponsorizzazione | Dichiararla dove si incontra il contenuto | «Sponsorizzato da …» |

Decimali con virgola; date comprensibili e fuso dichiarato dove necessario; `null` distinto da zero.
Non si usano «fungo sicuro», «commestibilità certificata dall’app», «probabilità di ritrovamento»
senza un modello e una validazione appropriati. Anche una specie con usi alimentari documentati
non autorizza una conclusione sull’esemplare. Etichette dei protocolli e testi rivolti alla persona
restano separati: gli ID tecnici non diventano etichette finali delle schermate.

`language.it.json` è un contratto iniziale e un catalogo consumato dalla demo. Non è ancora la
traduzione centralizzata di ogni testo dell’app; prima di sostituire un testo, controllare il
contesto e le varianti già presenti nel CMS. L’i18n successiva userà chiavi stabili, plurali e
formati locali; non concatenare frammenti per costruire frasi.

## Fondazioni e identità

`css/tokens.css` conserva i valori correnti e le revisioni successive al kit storico in
`docs/fronda/`. Fraunces per i titoli e Manrope per il corpo restano i font dell’app.
La demo locale usa i fallback della stessa pila, senza scaricare font o immagini esterne.

Tre livelli: **primitive private → ruoli semantici → token dei componenti**. I colori correnti
mantengono l’API pubblica già adottata; le nuove scale in `foundation.json` applicano il passaggio
fra i tre livelli senza salti. Si può estendere una scala quando un caso concreto lo richiede;
non aggiungere valori per compensare localmente un componente incoerente.

- CTA verdi nel tema chiaro, bianche nel tema scuro; selezioni in polline.
- Forme dei componenti conservate secondo le revisioni del 21/10; nessuna forma globale nuova.
- Informazioni, rischi, dati di grafico e accenti decorativi usano famiglie distinte.
- Rischio sempre con testo e simbolo. Un accento corallo non eredita il significato di «Mortale».
- Corpo di lettura 16 px, note 14 px, interlinea 1,65 nella nuova scala; titoli e densità vanno
  adattati al componente. Misura dei paragrafi intorno ai 65 caratteri, verificata nel contesto.
- La scala nuova propone controlli da almeno 44 px e focus visibile; non certifica che tutti i
  controlli legacy abbiano già quella misura. Le esigenze ottiche restano documentate e testate.
- Le durate nuove sono intenzioni riutilizzabili; con reduced motion evitare movimento superfluo.
  L’app mantiene i propri comportamenti esistenti finché non vengono migrati e verificati.

## Componenti: contratto minimo prima di costruirli

| Famiglia | Contratto comune | Adattamento consentito |
|---|---|---|
| Pulsanti, campi, selezioni | Verbo, label, focus, errore, disabled, busy | Contenuto e disposizione; niente semantica locale dei colori |
| Schede di entità | Identità, dati, media con crediti, rischio e azioni pertinenti | Campi disciplinari e riferimenti territoriali |
| Avvisi | Gravità dai dati, testo integrale quando necessario, icona ed etichetta | Contesto del compito |
| Dialog e pannelli | Coordinatore unico, ritorno reale, scroll e focus | Contenuto del caso d’uso |
| Dati ambientali | Provenienza, timestamp, completezza e limiti | Copertura locale verificata |
| Quiz e progressi | Domanda chiara, feedback utile, nessun verdetto sull’esemplare | Percorso individuale o assegnato |
| Taccuino | Privato per default, salvataggio chiaro, condivisione esplicita | Riferimenti a corso o territorio senza accesso implicito alle note |

Ogni scheda di componente futuro deve indicare: scopo; anatomia; contenuti; input/output;
comportamento da tastiera e touch; stati; temi; responsive; riduzione del movimento; contratto
dei dati; testi; test; offerte che lo consumano. I componenti dell’app già esistenti rimangono la
base di implementazione: questi documenti non ne dichiarano una riscrittura già completata.

## Stati: disegnare anche l’assenza

| Stato | Cosa mostrare | Comportamento |
|---|---|---|
| Loading | Struttura stabile e attesa comprensibile | Non spostare controlli già usati |
| Ready | Dati e azioni pertinenti | Conservare il contesto |
| Empty | Cosa può fare la persona | Non inventare valori o contenuti |
| Partial | Dati disponibili e lacune | Consenti i compiti ancora validi |
| Stale | Data di acquisizione e limite | Non trattare la rilettura come un aggiornamento |
| Offline | Copia disponibile e limiti | Non promettere invii completati |
| Error | Errore concreto e ritenta | Conservare input e ultimo stato valido quando previsto |
| Forbidden | Motivo dell’accesso richiesto | Nessuna fuga di dati nella UI o nel payload |

Il successo di un’operazione dipende dalla risposta valida e dall’effetto verificato, non dal
solo codice HTTP. Gli aggiornamenti asincroni devono distinguere account e operazioni obsolete.
Queste regole valgono anche nelle demo future delle offerte, con errori e attese rappresentabili.

## Declinazioni iniziali

| Offerta | Compito prevalente | Differenze previste |
|---|---|---|
| Free | Imparare e annotare | Base accessibile e sicurezza essenziale |
| Plus | Approfondire con continuità | Percorsi avanzati e progressi; proposta da validare |
| Academy | Studiare insieme | Gruppi, contenuti revisionati e assegnazioni; nessun attestato ufficiale implicito |
| Territorio | Esplorare un luogo | Pacchetto locale, fonti e percorsi educativi |
| Partners | Consultare iniziative sostenute | Credito dello sponsor e autonomia editoriale visibile |

Gli accenti in `editions.json` sono declinazioni editoriali iniziali della demo, non nuovi temi
di rischio o interazione. Nessuna offerta può sovrascrivere sicurezza, incertezza, consenso,
accessibilità o attribuzioni. Nella demo corrente non sono applicati colori locali delle offerte:
si può valutare prima la struttura condivisa senza scambiarla per una veste commerciale definitiva.

## Codice, esportazione e verifiche

```sh
npm run design:build        # genera CSS delle scale e JSON dei token correnti nei due temi
npm run design:check        # coerenza degli output, livelli e guard visuale esistente
npm run dev:demo            # prima superficie che consuma i contratti
```

[tokens.resolved.json](tokens.resolved.json) è generato da `css/tokens.css`. È un’esportazione,
non una seconda fonte modificabile. Ogni valore dichiara se richiede un adattatore di piattaforma:
colori esadecimali si traducono direttamente; font, ombre, misure ed espressioni CSS richiedono
una scelta conforme alla piattaforma. `foundation.json` conserva misure e durate strutturate.
Non è ancora disponibile un generatore SwiftUI/Compose, né una libreria Figma aggiornata.

## Guard e governance

Il censimento iniziale ha misurato **273 colori esadecimali e 154 funzioni colore** nel perimetro
legacy controllato: i conteggi sono invariati da questa consegna. Il guard esistente protegge
quattro fogli di stile senza valori colore scritti a mano e verifica 61 coppie di contrasto nei
modi chiaro e scuro. Le nuove scale e il consumer demo hanno controlli propri: riferimenti tra
livelli, primitive orfane, token esposti e assenza di valori visuali locali.
I test includono sonde negative che devono essere respinte. Non si estende questo dato alla
conformità dell’intera app, ai contenuti scientifici o all’accessibilità con tecnologie assistive.

Il rapporto JSON del guard fornisce i conteggi aggiornati; il baseline rimane la fonte numerica.
Ogni aumento del debito o eccezione deve avere una ragione durevole nel cambiamento. Non si
registra un nuovo baseline per far passare una regressione delle fondazioni. Prima di ampliare
il perimetro si misura e si prova una sostituzione corretta; migrare per famiglie di componenti.

Il gancio locale è versionato in `.githooks/pre-commit`; per usarlo in un clone dedicato:
`git config core.hooksPath .githooks`. Non è stato imposto alla configurazione condivisa degli
altri checkout. Gli stessi controlli fanno parte dei test CI.

Una modifica comune include motivo, impatto sulle offerte, stati, testi e verifica. La versione
del contratto cambia quando cambia il suo significato. Una variante non può essere una copia
silenziosa; se è utile a più offerte, entra nella base. Pubblicare una libreria Figma, un sito o
una nuova UI di produzione richiede il relativo lavoro e la decisione di rilascio.
