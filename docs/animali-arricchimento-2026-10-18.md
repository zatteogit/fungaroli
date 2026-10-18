# Animali: ampliamento documentato del 18 ottobre 2026

## Ambito e decisione editoriale proposta

Richiesta del proprietario: aggiungere quanto più materiale possibile per ogni categoria. Questa consegna amplia il testo consultabile di Animali, senza immagini sostitutive o dati di presenza previsti. Non è una revisione zoologica specialistica. La valutazione finale e l’integrazione spettano al coordinatore.

Prima: 12 voci, 8 `ready`, 4 `draft`, 19 fonti, 42 frasi con fonte. Dopo: 22 voci, 18 `ready`, 4 `draft`, 29 fonti, 99 frasi con fonte. Dieci nuove schede e dieci frasi aggiunte a sei schede esistenti. Il campo `version: 1` identifica lo schema del documento, che non cambia.

La sezione resta «in costruzione». Nessuna fotografia acquisita o dichiarata controllata. Nessun calendario, indice, frequenza, coordinata di rinvenimento o collegamento a un sentiero. I riferimenti PNALM sono fonti di biologia e ambienti: **non attestano presenza nel Reatino né nel percorso dell’utente**. Le descrizioni di aspetto non sono chiavi diagnostiche.

## Nuove schede: motivazione, fonte effettivamente letta e localizzatori

Ogni URL è stato aperto con lo strumento web il 18/10/2026; lettura dei passaggi pertinenti della pagina, non della sola anteprima di ricerca. I testi sono parafrasi brevi e selettive; nessuna immagine né intero articolo copiato. Non si presume una licenza delle fotografie perché una pagina istituzionale è consultabile.

| Scheda | Perché aggiungerla | Fonte primaria e passaggi utilizzati |
|---|---|---|
| Capriolo, *Capreolus capreolus* | Già nello studio; ambienti e cambiamento del mantello | [PNALM, Capriolo](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=18): Habitat, Cosa mangia, Note. Escluse dimensioni, quote e frequenza nel Parco. |
| Cervo, *Cervus elaphus* | Confrontare maschio, femmina, piccoli e ciclo dei palchi | [PNALM, Cervo](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=313): Dimensioni, Habitat, Cosa mangia, Riproduzione, Piccoli, Curiosità. Esclusi numeri, calendario locale e norme; scheda compilata giugno 2018. |
| Cetonia dorata, *Cetonia aurata* | Coprire un coleottero sui fiori con una specie delimitata, anziché inventare un gruppo omogeneo | [PNALM, Cetonia dorata](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=29): Habitat, Cosa mangia, Note. Non è dedotto un ruolo impollinatore dal semplice fatto che frequenti fiori. |
| Rosalia alpina, *Rosalia alpina* | Legame documentato con faggete, alberi maturi e legno | [PNALM, Rosalia delle Alpi](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=42): Habitat, Curiosità, Note. Nessuna posizione di alberi o invito a cercare nei tronchi, nessuna classificazione di conservazione importata. |
| Tritone crestato italiano, *Triturus carnifex* | Già nello studio; ambienti acquatici, sviluppo, differenze tra sessi | [PNALM, Tritone crestato italiano](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=251): Riconoscimento; Biologia ed ecologia. Esclusi minimi di profondità, misure, consistenze, quote, legge e stato di conservazione. Nessuna manipolazione suggerita. |
| Salamandra pezzata, *Salamandra salamandra* | Rendere leggibile la distinzione adulto terrestre / larva acquatica | [PNALM, Salamandra pezzata](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=250): Riconoscimento; Biologia ed ecologia. Nessuna qualificazione «inconfondibile» ripresa dalla fonte né protocollo per contatto. |
| Riccio europeo, *Erinaceus europaeus* | Sottobosco, ripari, attività notturna e dieta | [PNALM, Riccio europeo](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=291): Dimensioni (solo rivestimento corporeo), Habitat, Cosa mangia. Esclusi pesi, calendari, trattamenti e soccorso. |
| Volpe, *Vulpes vulpes* | Adattabilità degli ambienti e della dieta | [PNALM, Volpe](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=314): Dimensioni (solo aspetto), Habitat, Cosa mangia, Curiosità. Il limite sull’attribuzione delle tracce è una cautela editoriale: non una chiave di riconoscimento. |
| Istrice, *Hystrix cristata* | Roditore con dieta vegetale, attività e struttura degli aculei | [PNALM, Istrice](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=316): Vita, Habitat, Cosa mangia, Curiosità. Esclusi dati numerici, norme e valutazione IUCN del 2007; scheda compilata maggio 2018. |
| Tasso, *Meles meles* | Dieta varia e dispersione dei semi collegano mammiferi e piante | [PNALM, Tasso](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=308): Dimensioni (solo mantello), Vita, Habitat, Cosa mangia, Curiosità. I valori di dimensione/peso e le generalizzazioni sanitarie della pagina non sono utilizzati. |

Tutte le dieci schede sono a rango `species`. La scelta riguarda una copertura biologica testuale sufficiente per l’esplorazione; non dichiara media completi, disponibilità su ogni percorso o una guida esaustiva agli incontri. Le nuove voci di bosco usano `trail`; Cetonia usa `flowers`. Non sono aggiunte al percorso della prudenza senza un’istruttoria apposita.

## Approfondimenti di sei schede esistenti

| Voce | Percorsi JSON nuovi | Evidenza riletta |
|---|---|---|
| Ape da miele | `habitat[0]` | [UNIBO-G, Le api dell’Orto](https://sma.unibo.it/it/il-sistema-museale/orto-botanico-ed-erbario/Guida-digitale-agli-apoidei-dell-Orto-Botanico), paragrafo che distingue l’ape da miele: nidi di cera, caste e colonie. Nessun dettaglio sui favi non presente nel testo. |
| Sirfidi | `ecology[1]` | [RER-V, Vespe e calabroni](https://agricoltura.regione.emilia-romagna.it/fitosanitario/difesa-sostenibile/protezione-del-verde/difesa-ecocompatibile/qualita-del-verde/manuale/ospiti-molesti/vespe-e-calabroni), riquadro Sirfide: visita ai fiori e alimentazione. |
| Calabrone europeo | `behavior[1]`, `ecology[0]` | RER-V, descrizione delle colonie annuali e svernamento delle giovani regine; predazione sulle api. Escluse procedure di distruzione dei nidi, giudizi sull’aggressività e farmacologia della fonte. |
| Zecche | `behavior[1]`, `habitat[1]` | [ISS-Z, Zecche](https://www.epicentro.iss.it/zecche/), Ciclo biologico, attività e differenze locali. Nessuna soglia sanitaria né procedura di rimozione. |
| Cinghiale | `ecology[1]`, `ecology[2]` | [LAZ-C, Il Cinghiale](https://www.parchilazio.it/cammino_naturale_dei_parchi-schede-862-il_cinghiale_sus_scrofa), alimentazione e ricerca del cibo nel terreno. Escluse affermazioni datate su consistenze e predatori. |
| Lupo | `behavior[2]`, `ecology[1]` | [PNALM-L, Lupo](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=21), Cosa mangia e Note. Nessuna scelta di sottospecie dalla discussione storica della fonte. |

Bombi e farfalle restano invariati: le pagine generiche non giustificano nuovi dettagli di singole specie o calendari locali. Le quattro bozze restano tali: gruppi api/vespe da circoscrivere; processionaria e vipera richiedono ancora revisione delle indicazioni pratiche per il pubblico. La richiesta di quantità non risolve le lacune.

## CMS, disponibilità effettiva e pendenze

Non occorre cambiare schema, renderer, seed o snapshot: `animals` è già in `CONTENT_RESOURCES` e `REPOSITORY_REFRESHED`. All’inizializzazione del Worker, `worker/cms.js` aggiorna il documento se proviene dal seed o da una release, bozza e pubblicato sono identici e le versioni coincidono. Valida il JSON e passa da `repositorySeedUpdate`, che registra la nuova revisione. Il fallback statico carica lo stesso file.

Un documento modificato da un autore resta intenzionalmente protetto: **non si può dichiarare che queste 18 voci sono già pubblicate sul sito senza leggere lo snapshot effettivo dopo il deploy**. Se lo snapshot conserva le otto precedenti, il redattore deve riconciliare il nuovo contenuto nella risorsa Animali e pubblicarlo con il normale flusso di revisione; non sovrascrivere il documento intero o cambiare la condizione di protezione. Nessuna scrittura su D1 o pubblicazione remota eseguita in questa consegna.

Il coordinatore aggiorna selettivamente la categoria `animali-foto` di `data/asset-pending.json`, in parallelo agli altri lotti. Dieci nuove voci mancanti: `capriolo (nessuna foto)`, `cervo (nessuna foto)`, `cetonia-dorata (nessuna foto)`, `rosalia-alpina (nessuna foto)`, `tritone-crestato-italiano (nessuna foto)`, `salamandra-pezzata (nessuna foto)`, `riccio-europeo (nessuna foto)`, `volpe (nessuna foto)`, `istrice (nessuna foto)`, `tasso (nessuna foto)`. Totale atteso: 18 schede pubblicabili prive di foto, tutte elencate una volta. Non si aggiungono asset teorici di caratteri che lo schema Animali non richiede.

## Verifiche della consegna

Lettura delle fonti e rilettura selettiva delle frasi. Controlli puntuali del documento: JSON parsabile, ID unici, riferimenti delle 99 frasi esistenti e inclusi nelle rispettive schede, vocabolario di ranghi e percorsi, 18 `ready` / 4 `draft`, foto vuote e nessun nuovo campo. `git diff --check`. Nessun test automatico o suite, come richiesto dal proprietario. Non sono modificati `sw.js`, `index.html`, interfaccia o regole dell’indice.
