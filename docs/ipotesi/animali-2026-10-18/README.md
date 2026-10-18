# Animali · prima proposta per Fronda

18 ottobre 2026 · **Ipotesi da valutare, non decisione di prodotto**.
Ramo `research/animals-section`, base produzione `bcd1488` (v175).
Nessuna modifica all’app, ai cataloghi pubblici, all’indice o alla mappa.

## La direzione proposta

**Conoscere chi vive lungo il sentiero e sapere come comportarsi quando lo si incontra.** Una sezione da consultare durante la passeggiata: fotografie, particolari osservabili, brevi indicazioni pratiche. La sicurezza è un percorso importante dentro la sezione, non la definizione di tutti gli animali.

Prima versione: 12 schede di gruppi/specie, poi 6 approfondimenti. Il [catalogo ragionato](catalogo.md) distingue ciò che è già sostenuto da fonti consultate da ciò che richiede ancora verifica territoriale o tassonomica. Non è un elenco di avvistamenti nel Reatino.

## Ingressi e navigazione

Proposta principale: **Scopri → Animali**, tra Alberi e Guide. Si mantengono le quattro destinazioni della navbar e la ricerca. Cinque sezioni non devono diventare cinque pillole minuscole: riga scorrevole con parte della successiva visibile, nome della sezione corrente sempre nell’header e accesso alternativo dall’indice di Scopri. Prima dell’implementazione confrontare questa soluzione a 320 px con un selettore compatto «Scopri: Animali». Non aggiungere un interesse Animali ai filtri di Uscite in questa fase.

L’indice Animali apre subito il catalogo. Una riga breve propone tre percorsi editoriali, combinabili e non tassonomici:

- **Sui fiori**: impollinatori e altri visitatori. Un animale sul fiore non prova che abbia impollinato quella pianta.
- **Nel bosco e sul sentiero**: animali, tracce e ambienti, senza promessa di incontro.
- **Passeggiare con prudenza**: punture, zecche, contatti e convivenza. Non «Animali pericolosi».

Le categorie zoologiche restano filtri secondari: insetti, aracnidi, rettili, mammiferi, anfibi. «Impollinatore» e «puntura possibile» possono coesistere nella stessa scheda; non sono categorie opposte. Nessun badge «innocuo».

Altri ingressi proposti: ricerca globale, link da una pianta a «Visitatori dei fiori», guide «Prima di partire / Durante / Al ritorno». In seguito un richiamo negli ambienti del percorso, solo con evidenza di habitat e senza «Qui trovi…». Il Taccuino può registrare «Animale non determinato», foto e comportamento; nessuna identificazione automatica, invio o posizione pubblica implicita. Dati sensibili di nidi, tane e specie vulnerabili restano privati; nessuna mappa di punti precisi.

## Benchmark consultato

Confronto di strutture e contenuti pubblicamente leggibili, **non test di usabilità né audit grafico su dispositivi reali**. I siti sono stati aperti il 18/10/2026; link e limiti nel [registro fonti](fonti.json).

| Esperienza | Soluzione osservata | Cosa prendere per Fronda | Cosa non trasferire |
|---|---|---|---|
| [UK PoMS / FIT Count](https://ukpoms.org.uk/node/23), schema di monitoraggio UK | Compito concreto, guida rapida distinta dagli approfondimenti; gruppi ampi e opzione per insetti non riconosciuti | Un osservatore può descrivere un gruppo senza arrivare alla specie; scheda pratica con dettagli facoltativi | Calendario, soglie meteo e protocollo britannici non diventano regole del Lazio; nessun conteggio scientifico senza protocollo italiano |
| [Bumblebee Conservation Trust](https://www.bumblebeeconservation.org/learn-about-bumblebees/species-guide/) | Ingresso per caratteri visivi, schede e illustrazioni che mostrano anche sesso/casta e varianti | Accostare esempi e nominare esplicitamente la variabilità; scegliere il particolare da guardare | Il colore non basta a determinare una specie; lista delle specie UK e loro frequenza non trasferibili |
| [ISS · EpiCentro Zecche](https://www.epicentro.iss.it/zecche/) e [ISSalute · Punture](https://www.issalute.it/index.php/la-salute-dalla-a-alla-z-menu/p/punture-di-vespe-api-e-calabroni) | Separazione fra prevenzione, evento avvenuto e assistenza sanitaria | Portare «prima / durante / dopo» al livello delle azioni; fonte e data vicine alle indicazioni | Non replicare il lungo articolo nella schermata; non trasformare un catalogo in un triage o inventare sintesi cliniche |

## Composizione: una tavola, non una lista di avvisi

Indice con foto reali e titoli brevi. Le schede su mobile hanno un’immagine principale e un sommario di tre dati al massimo; la griglia del catalogo non deve produrre colonne di testo strette. Nella scheda completa, illustrazione dei particolari a sinistra e valori a destra quando lo spazio lo permette; a 320 px i controlli vanno sotto l’immagine. Niente altezze fisse sul testo.

Ordine della scheda:

1. Nome comune, nome scientifico o nome del gruppo, granularità esplicita («Gruppo · Bombus spp.»), fotografia con zoom e crediti.
2. **Da guardare**: tre o quattro particolari documentati, con miniature. La variabilità resta visibile; il selettore mostra esempi, non un verdetto.
3. **Come comportarsi**: poche azioni verificabili. Le indicazioni urgenti pertinenti non sono nascoste in un accordion.
4. **Dove osservarlo** e **Quando è attivo**: ambiente e stadio biologico; calendario soltanto con mesi documentati e ambito geografico. Un mese non evidenziato non significa assenza o assenza di rischio.
5. **Nell’ecosistema**, **Da non confondere**, **Fonti e fotografie**: approfondimenti con testate riconoscibili, uno aperto alla volta. Confronti zoologici solo per coppie documentate e senza riutilizzare le relazioni «sosia» dei funghi.

Corpo 16 px, interlinea circa 1,6, note 13–14 px; titoli serif con scala contenuta e valori in sans. Etichetta breve sopra il dato, grassetto selettivo. I dati principali restano neutri; fiordaliso per osservazione, ambra per la specifica cautela, rosso esclusivamente per l’azione urgente. Calendula per la selezione attiva. Testo e simbolo accompagnano sempre il colore. Nessuna scala «sicuro → pericoloso» attribuita alla specie.

Accessibilità: target almeno 44 px, focus visibile, ordine DOM uguale alla lettura, niente swipe necessario, riduzione del movimento rispettata. Header con back e titolo, azione contestuale discreta; menu e zoom con blocco dello scroll sottostante già condiviso nell’app. Spazio inferiore per navbar e safe area; layout con viewport dinamico, controllato con barre browser aperte/chiuse, zoom testo 200% e orientamento orizzontale.

## Esempio strutturato: Zecche

**Zecche** · Gruppo di aracnidi · foto reale da selezionare e autorizzare.

| Blocco | Dato sintetico proposto | Evidenza / limite |
|---|---|---|
| Da guardare | Corpo compatto; aspetto e dimensioni cambiano con specie e stadio | ISS-Z; nessuna determinazione da questa miniatura |
| Ambiente | Vegetazione erbosa e arbustiva; preferenze diverse tra specie | ISS-Z; non attribuisce presenza al sentiero |
| Attività | Periodo variabile con condizioni locali | ISS-Z; nessuna serie mensile inventata |
| Prima | Copri le gambe; evita lo sfregamento contro l’erba alta | ISS-Z, sezione Prevenzione |
| Al ritorno | Controlla pelle e indumenti | ISS-Z, sezione Prevenzione |
| Dopo una puntura | Una zecca può trasmettere agenti infettivi se infetta; consulta le indicazioni ISS e il medico se compaiono disturbi | ISS-Z; non diagnosticare infezioni e non stimare tempi di sicurezza |

La procedura di rimozione non viene riscritta in questo studio: link diretto alla sezione ISS, da validare clinicamente prima di un’eventuale versione offline nell’app. Non usare otto zampe come regola universale illustrata: gli stadi differiscono. L’eventuale calendario della singola specie richiede una fonte aggiuntiva. Questo esempio è una struttura di contenuto, non una scheda già approvata per pubblicazione.

**Punto da riconciliare:** ISS-Z e ISS-M descrivono in modo diverso il movimento di estrazione; ISS-M mostra inoltre una data prevista di aggiornamento già trascorsa. La presenza di fonti istituzionali non elimina il bisogno di revisione clinica del contenuto operativo. Non combinare frammenti delle due procedure in una terza procedura originale.

## Prudenza, fastidio ed emergenza sono situazioni

Il modello separa **meccanismo**, **condizione** e **azione**. «Puntura possibile» non equivale a «emergenza»; il rischio infettivo non è il colore di una zecca. La gravità non viene calcolata dall’aspetto o dalle dimensioni dell’animale.

- **Prevenzione / convivenza:** comportamento durante l’incontro. Per api/vespe ISSalute consiglia calma e movimenti lenti; le differenze fra gruppi vanno documentate e non ridotte a giallo/nero.
- **Evento o disturbo:** dopo un contatto o una puntura, indicazioni ufficiali e riferimenti sanitari. Il catalogo non assegna diagnosi e non suggerisce farmaci o dosi.
- **Emergenza:** dopo una puntura, difficoltà respiratoria o gonfiore di viso/bocca/gola richiedono assistenza urgente secondo ISSalute. Nel Lazio il riferimento è [112](https://comunicazione.regione.lazio.it/112/). Per sospetto morso di vipera l’AOU Meyer indica di attivare i soccorsi; la fonte è pediatrica e non va generalizzata in un protocollo adulto senza revisione. Non attendere l’identificazione dell’animale per accedere all’aiuto.

Questi sono esempi fondati, **non un elenco completo di sintomi né un algoritmo di triage**. L’accesso «Emergenza · 112» deve essere disponibile senza compilare risposte; non promettere una chiamata in assenza di rete. Eventuali numeri dei Centri antiveleni vanno verificati con area di servizio e disponibilità prima del rilascio, senza scegliere un numero a memoria. Procedure per cani/animali domestici restano un ambito veterinario separato.

Lupo e cinghiale richiedono contesto e convivenza: non etichettarli automaticamente come emergenze. Il documento ISPRA sui lupi confidenti è supporto per enti e gestori, non una scala automatica da mettere in mano al visitatore. Per ora nessuna trascrizione di protocolli operativi o allerta geolocalizzata. Cani da guardiania e bestiame meritano una guida pratica separata, con fonti competenti da reperire: non confonderli con la fauna selvatica.

## Dati, immagini e produzione

Lo [schema proposto](schema-proposto.md) resta in questa cartella: nessun nuovo schema CMS pubblico. Provenienza per singolo campo e revisione obbligatoria; `null` significa non documentato. Periodo di volo, presenza di adulti, larve e attività non sono intercambiabili.

Fotografie: due o tre per scheda, viste pertinenti e stadi diversi solo se nominati. Fonte primaria o osservazione validata, autore, pagina originale, licenza/link, punto di ritaglio e livello tassonomico effettivo. Preferire CC0/BY/BY-SA; non presumere che l’immagine di un ente sia riutilizzabile perché il testo è pubblico. Nessuna immagine generata come foto della specie.

Illustrazioni: applicare il metodo già avviato per funghi e piante **dopo** la matrice dei dati. Prima raster con riferimenti verificati, sfondo trasparente, stile coerente, prompt e revisioni registrati. Poi SVG con livelli nominati e collegati ai campi; non semplice raster incorporato nell’SVG. Per iniziare: ali, antenne, segmenti e apparato boccale, soltanto nei valori che servono alle prime schede. Numero di ali visibili non equivalente a numero di ali anatomiche; non inventare un pungiglione visibile in ogni disegno. Controllo di un esperto entomologo/erpetologo sulle parti pertinenti, revisione sanitaria sulle azioni. Nessuna produzione in massa prima di questi controlli.

## Sequenza proposta e decisioni aperte

1. Valutare ingresso Animali e prime 12 voci; definire revisori e responsabilità editoriale.
2. Completare matrice di evidenza, distribuzione locale e licenze; prototipare indice, una scheda osservativa e una pratica con contenuti approvati. Nessun motore meteo o presenza in questa fase.
3. Implementare catalogo/ricerca/scheda/Taccuino riusando i componenti; aggiornare CMS, cache e test solo dopo la decisione. Fonte mancante esclude quel campo o quella scheda dal rilascio, non viene riempita da prosa generica.
4. Ampliare le sei voci successive con riscontri locali; valutare guide contestuali ai percorsi separatamente.

Scelta consigliata: **primo catalogo compatto dentro Scopri**, senza cambiare gli interessi dell’uscita. Alternativa: partire da due sole guide in Guide e rinviare il catalogo. La scelta rimane a Matteo; nessuna delle due è già applicata.

## Verifica dello studio

Fonti aperte tramite ricerca web, con pagine e limiti registrati. Nessun contenuto copiato integralmente; testi di proposta originali. Alcuni PDF e procedure restano da leggere/validare e sono contrassegnati. JSON parsabile, link locali controllati e `git diff --check`; nessun test dell’app necessario perché non è stata modificata.
