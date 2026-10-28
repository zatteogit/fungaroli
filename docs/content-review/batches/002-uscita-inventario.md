# Lotto 002 · Uscita: inventario degli stati

Stato: **in corso**, nessuna persona dichiarata verificata. Base esaminata:
`31c3cb48c0c51594f0e3ba60ec05d78dad1dc19e`. Questo lotto prosegue
`pagina:uscita`; il lotto 001 ha già corretto la testata, non ha chiuso
la revisione dell’intera pagina.

## Riscontro acquisito

Il 27 ottobre, in una sessione browser isolata senza profilo, la rotta
`#/zona/allumiere-faggeto/1` è stata aperta su server statico locale.
L’avviso iniziale è stato confermato solo nella sessione di prova. Le richieste
API non sono servite dal server statico: lo stato osservato è **meteo assente**,
non un risultato del servizio online. Nessuna osservazione è stata inviata.

Le istantanee dell’albero accessibile sono conservate in
[`evidence/002-uscita/`](../evidence/002-uscita/): nella prima i dettagli sono
chiusi, nella seconda sono aperti scelte, regole della raccolta e contenuti
naturalistici. Sono evidenze di rendering, non giudizi per persona.

Contenuti osservati, in ordine: luogo; scelte e loro modifica; giorni; raccolta
da verificare; motivo dell’indice non disponibile e collegamenti a mappa e metodo;
piano senza sentiero documentato; proposte naturalistiche; referente, descrizione
e fonti; strumenti offline; riepilogo sociale senza condivisione; approfondimenti
su accessi, sentieri e bosco. A un’apertura sono visibili il significato
sperimentale dell’indice e il numero di specie senza indice, il testo completo e
la fonte della raccolta, le specie e il limite sulla loro presenza.

Lo snapshot CMS pubblico acquisito nella stessa sessione dichiara release
`cb88450d-ee9d-4b7d-a5a4-f1b924f61ebd`, versione `zones` 5. Per il solo record
`allumiere-faggeto`, i 28 campi di primo livello e i rispettivi valori JSON
coincidono con `data/zones.json` alla base indicata. Questo confronto non copre
gli altri documenti CMS, i dati calcolati o tutte le varianti del DOM.

### Secondo passaggio: meteo simulato e filtri

Con la stessa base, in una nuova sessione isolata e senza profilo, il browser
ha ricevuto una previsione sintetica con lo stesso formato del generatore
`forecast` in `tools/visual-audit.mjs`. La fixture è una prova ripetibile, non
meteo reale. Preferenze simulate: Funghi e Piante, Porcino, difficoltà T;
giorno successivo. La conferma iniziale è stata registrata solo nella sessione.

Le nuove istantanee documentano lo stato chiuso, il percorso e l’osservazione
aperti, il dialogo dei filtri e il viewport 390 × 844 in tema scuro. Una sola
apertura mostra il dettaglio su sentiero e accesso mancanti, la frase sui limiti
del percorso e i contenuti del piano; «Modifica» apre i filtri, Escape li chiude.
Nel viewport provato non è stato rilevato overflow orizzontale. Questa verifica
non misura contrasto, accessibilità completa o comportamento sugli altri device.

Nel caso simulato l’intestazione «Cosa osservare» mostra il Porcino scelto e un
valore basso; nel dettaglio, «Funghi che cerchi» dice che le specie scelte non
rientrano nei suggerimenti principali e propone altre specie. **Da valutare:**
questa sequenza può confondere sul rapporto tra specie guida e suggerimenti.
Non è ancora una conclusione sull’algoritmo o una richiesta di modificare soglie.
Il testo sui sosia e il chiarimento che l’indice non è una probabilità restano
visibili nello stato aperto.

### Terzo passaggio: specie scelta e lista completa

Ripetendo lo stesso scenario in una nuova sessione isolata, il Porcino compare
nella lista completa con valore simulato 1,3 e «Condizioni meno favorevoli»:
si raggiunge con due aperture, prima «Cosa osservare» e poi «Vedi tutte le
specie compatibili». L’[istantanea](../evidence/002-uscita/allumiere-specie-complete.yml)
documenta il percorso. Il valore numerico accanto al titolo è già visibile a
zero aperture; l’habitat scarso e la descrizione delle condizioni meno
favorevoli sono invece nella lista completa.

Il codice `js/outing-mushrooms.js` mostra prima i funghi con indice almeno 6,
mettendo quelli scelti davanti agli altri; quelli sotto 6 riempiono solo fino a
tre risultati. Nel caso osservato ci sono già quattro specie sopra 6, quindi
il Porcino resta nella lista completa. È il comportamento della regola attuale,
non una verifica della bontà scientifica del numero. La riga è costruita da
`zoneSpecies` in `js/app.js`, che esclude i casi di habitat quasi assente prima
di costruire anche l’elenco completo: la frase «Consulta l’elenco completo per
i valori disponibili» richiede quindi una verifica nei casi con habitat quasi
assente o indice mancante, prima di suggerire una correzione.

Valutazione preliminare **limitata a questo blocco**, con personas simulate:

| Persona | Priorità e percorso | Aspetto ancora da verificare |
| --- | --- | --- |
| Neofita | Alta: cautela sosia e valore subito; significato e lista con una o due aperture | Comprensione del valore basso e del messaggio sulle specie scelte |
| Appassionato | Alta: specie cercata subito; alternative a una apertura | Se riesce a confrontare rapidamente la specie scelta con le alternative |
| Esperto | Utile: valore subito, metodo e habitat nei dettagli | Fonti, dati assenti e distinzione tra stima biologica e condizioni |
| Escursionista | Contestuale: il piano pratico resta separato | Che il blocco non ostacoli meteo, accesso e limiti del percorso |
| Naturalista | Utile: specie e piante nello stesso approfondimento | Che la compatibilità non sia letta come presenza confermata |

Queste sono ipotesi editoriali basate su un solo scenario, non revisioni
complete, né test con persone. Restano da provare altri stati, i percorsi da
tastiera e il caso in cui la specie scelta non compaia nell’elenco compatibile.

### Caso limite: specie scelta esclusa dall’elenco

Con meteo simulato e selezione del Porcino rosso ad Allumiere, l’habitat
calcolato per la specie risulta «quasi assente». La testata mostra 0,0; aperta
«Cosa osservare», il testo invita a cercare i valori nell’elenco completo, ma
il Porcino rosso non è tra le specie in quell’elenco. Il percorso è documentato
nell’[istantanea](../evidence/002-uscita/allumiere-porcino-rosso-quasi-assente.yml).
La frase è fuorviante in questo stato; la correzione deve descrivere soltanto
l’assenza dall’elenco, senza trasformarla in assenza certa nel bosco né cambiare
il modello o i criteri di selezione.

**Corretto e pubblicato:** [PR 301](https://github.com/zatteogit/fungaroli/pull/301),
versione `fungaroli-shell-v380`. Se la specie non compare nell’elenco, il testo
lo dice esplicitamente; se è presente nei dettagli, resta l’invito a consultarli.
Le [prove](../evidence/002-uscita/) usano una fixture meteo: Porcino rosso
assente dalla lista e Porcino presente sono stati verificati separatamente. Il
messaggio è stato misurato a 320, 390, 768 e 1280 px, con entrambi i temi, senza
overflow orizzontale nel caso provato. Superati 622 test e dry-run Worker;
versione e testo sono stati controllati sul sito pubblicato. Questo non verifica
il primo caricamento online a cache vuota, né conclude la revisione della pagina.

Durante la verifica, due test preesistenti dei segnali esterni fallivano anche
sulla base di produzione perché il giorno predefinito usava l’orologio reale
anziché quello passato al calcolo. La stessa PR allinea il giorno all’orologio
fornito; la suite completa passa. Soglie, indice e criteri restano invariati.

### Confronto delle fonti e stato della pubblicazione

Il 28 ottobre lo snapshot CMS pubblico dichiara ancora release
`cb88450d-ee9d-4b7d-a5a4-f1b924f61ebd`. Nel confronto JSON con la base
`7c1d2eb6`, `zones`, `trails`, `trailheads`, `access`, `habitat`,
`species-traits`, `ui-copy`, `plants`, `trees` e `media-zones` coincidono
integralmente. Il documento `legal` differisce in `info_sections`: per le
quattro sezioni diverse, testo visibile e destinazioni dei link coincidono,
mentre l’HTML non è identico. `zone_legal`, `protected_area_note`, onboarding
e versione coincidono. Questa è una verifica delle sole risorse elencate,
non un confronto di tutti i contenuti renderizzati o delle loro fonti esterne.

Al controllo del 28 ottobre la versione online di `index.html` e `sw.js` è
`v381`, mentre il ramo GitHub di produzione consultato è al commit `7c1d2eb6`
con `v380`. La causa non è stata accertata. Prima di pubblicare un nuovo lotto
occorre riconciliare il contenuto effettivo online con il ramo di produzione,
per evitare di sovrascrivere modifiche già distribuite. L’analisi della pagina
può continuare localmente.

Un confronto mirato ha inoltre mostrato che `js/app.js` online importa e applica
`edition.js` nella selezione delle zone, mentre il file del ramo di produzione
non contiene queste modifiche. Non è soltanto una differenza nel numero della
cache. L’origine e l’eventuale presenza del lavoro in un altro checkout non sono
state stabilite; non distribuire una copia precedente mentre si chiarisce.

**Chiarimento successivo:** dal 28 ottobre, per decisione di Matteo riportata
in `AGENTS.md`, la produzione è sul ramo `main`; il ramo `claude/brave-tesla-wu0a2b`
è storico. Il confronto precedente usava una base superata. Al commit
`a78198efd69f381ec0020745d8a4aff43df8dd44`, `main` e il sito servono entrambi
`v381` e hanno `js/app.js` identico (SHA-256 `640df5842b0f…`). Il worktree di
questa revisione è stato riallineato a `main`. I controlli non confrontano ogni
singolo file pubblicato, ma la discrepanza segnalata è spiegata dal cambio ramo.

### Quarto passaggio: meteo, accessi e regole

Con il codice di `main` al commit `a78198efd69f381ec0020745d8a4aff43df8dd44`,
sessione isolata e meteo simulato, sono stati aperti «Quando», «Come arrivare»
e «Regole di raccolta». Le [istantanee](../evidence/002-uscita/) documentano
anche il dettaglio «Accesso e avvertenze» e la scheda «Area protetta».

Nel caso Allumiere la sintesi meteo è visibile nel piano; a una apertura
compaiono fascia oraria, quota e invito a verificare il rientro. Il piano dice
subito che l’accesso auto va verificato; una apertura offre la mappa e una
seconda mostra il riferimento a Via del Faggeto. Questo riferimento è presente
in `zones.access`: non prova disponibilità del parcheggio o transitabilità.
L’avviso locale di raccolta è visibile sopra il piano; a un’apertura contiene
testo e fonte del gestore. Le regole regionali si raggiungono in fondo con una
apertura e il testo completo della singola regola con una seconda. Escape ha
chiuso il dettaglio «Area protetta» restituendo il focus al suo pulsante.

Valutazione preliminare dei tre blocchi, limitata allo scenario simulato:

| Persona | Meteo e accesso | Regole e approfondimenti |
| --- | --- | --- |
| Neofita | Meteo e necessità di verifica subito; dettaglio pratico in due aperture | Avviso locale subito, quadro regionale a una apertura |
| Appassionato | Meteo subito e fascia a una apertura; arrivo specifico a due | Regola completa a due aperture; verificare se è facile ritrovarla prima della raccolta |
| Esperto | Limiti subito, dettaglio su richiesta | Testo completo e fonti raggiungibili; confronto normativo indipendente ancora da svolgere |
| Escursionista | Informazioni essenziali subito; l’indicazione concreta richiede due aperture | Accessibilità del dettaglio pratico da verificare anche per percorsi documentati |
| Naturalista | Meteo e cautele pratiche subito | Area protetta e fonti rilevanti anche senza raccolta; verificare visibilità nei filtri solo piante |

Le priorità sono giudizi simulati, non test con utenti. Non sono state
confermate sul terreno le informazioni sull’accesso né la normativa. Restano da
valutare altri luoghi, meteo avverso, filtri, tastiera per l’intero percorso e
stati di condivisione. Nessuna modifica di contenuto o disposizione è stata
apportata in questo passaggio.

### Quinto passaggio: filtri senza sentiero compatibile

Con meteo simulato, Porcino e filtro di difficoltà T, a Vallonina il piano
mostra «Nessun sentiero corrisponde alle scelte attive», mentre «Percorso e
accessi» dice «Tratto mappato · giro da verificare». Nel dettaglio appaiono
20 tratti e un punto d’arrivo documentato, seguiti da raccordo, ritorno e
tempo da completare. La [prova](../evidence/002-uscita/vallonina-filtri-nessun-tratto.yml)
mostra entrambe le informazioni nello stesso stato.

Il codice di `outingDocumentation` usa il primo tratto mappato come ripiego
quando il piano non ha un sentiero selezionato. Il conteggio riguarda quindi
la zona, ma la formulazione può farlo attribuire al piano filtrato. Da correggere
la distinzione comunicativa; restano invariati selezione, dati e cautele.

La correzione è proposta nella [PR 309](https://github.com/zatteogit/fungaroli/pull/309)
verso `main`, commit `9b436ae51f231047f0e0586b88c7fe777793d1f6`.
Il riepilogo distingue il sentiero non selezionato dai tratti nella zona;
non attribuisce a un percorso inesistente i dettagli del primo tratto di
ripiego. Con meteo simulato sono stati provati il caso senza sentieri coerenti
con i filtri, il caso con sentiero selezionato e una zona senza tratti; 627
test unitari e dry-run sono passati. Su Chrome la sintesi è stata controllata
a 320, 390, 768 e 1280 px nei due temi e con apertura/chiusura da tastiera.
Il controllo obbligatorio GitHub `test` è passato e la PR è stata fusa in
`main` al commit `134ea06d97732c86c13b256141585a6aa8140b48`. La v382 è stata
verificata online tramite versione di pagina e service worker e testo del
riepilogo. Il primo avvio online e le condizioni reali non sono stati provati.

### Sesto passaggio: riepilogo condiviso del luogo

Con codice di `main` al commit `4c9021cb`, una sessione browser isolata e
risposte sintetiche per meteo, profilo e community, sono stati osservati tre
stati del Tancia: dati locali disponibili, dati locali insufficienti con
riepilogo provinciale, accesso non ancora sbloccato. Le richieste community
diverse da GET erano bloccate: nessuna osservazione o modifica è stata inviata.
Le [istantanee](../evidence/002-uscita/) sono dati di prova, non contributi reali.

Nel primo stato i riepiloghi per uscite e appunti sono separati e i numeri sono
qualificati come dichiarati; il record fittizio di un’altra zona non compare.
Nel secondo, l’assenza di dati sufficienti per la zona è esplicita e il dato
provinciale è distinto; il record di un’altra provincia non compare. Nel terzo
non viene mostrato il conteggio fittizio presente nella risposta bloccata.
«Dati e privacy» a una apertura spiega ambito, soglie e limiti; l’indicazione
che le osservazioni non confermano la presenza attuale resta visibile subito.
Questa prova riguarda il rendering della fixture, non verifica il controllo
d’accesso del server o l’effettiva anonimizzazione di dati reali.

| Persona simulata | Valutazione preliminare del blocco |
| --- | --- |
| Neofita | Utile l’avvertenza subito; da verificare la comprensione delle differenze tra dati locali e provinciali |
| Appassionato | Riepilogo e specie accessibili senza aperture; le ricerche a vuoto accompagnano le presenze |
| Esperto | Ambito, soglie e limiti a una apertura; servono ulteriori prove sull’interpretazione delle evidenze |
| Escursionista | Blocco secondario rispetto a percorso e meteo, non un’indicazione di sicurezza |
| Naturalista | Le osservazioni botaniche sono separate dalle uscite fungine; da provare gli altri gruppi |

Non è stato valutato l’intero Taccuino né testato il percorso con persone reali.

### Settimo passaggio: uscita con sole piante

Con il codice `main` al commit `4c9021cb`, meteo simulato e solo interesse
Piante, la [prova](../evidence/002-uscita/allumiere-piante-meteo-fixture.yml)
mostra correttamente il meteo senza indice fungino. Ad Allumiere il piano dice
«Nessun sentiero corrisponde ai filtri attivi», sebbene la zona non abbia
tratti documentati e non sia stato attivato un filtro sul sentiero. Il messaggio
non permette di distinguere dati assenti e selezione troppo restrittiva.
Il renderer per i soli interessi non fungini usa una frase fissa; quello fungino
distingue già i due casi. Correzione proposta: riutilizzare tale distinzione,
senza cambiare il catalogo dei sentieri, le scelte o l’ordinamento.

In questo stato non compaiono suggerimenti botanici, perché il renderer li
calcola quando è disponibile un sentiero. È un punto da valutare separatamente:
non si è dedotta presenza di piante né modificato l’algoritmo.

La correzione è nella [PR 315](https://github.com/zatteogit/fungaroli/pull/315)
verso `main`: riutilizza il messaggio contestuale dell’uscita per funghi. Sono
stati provati Allumiere senza tratti con meteo simulato e senza meteo, e
Vallonina con tratti esistenti esclusi dal filtro T; il primo caso è stato
controllato a 320, 390, 768 e 1280 px nei due temi. Dopo l’integrazione con
`main`, la suite locale ha superato 633 test e il dry-run Worker; la prova senza
meteo è stata ripetuta sul codice integrato. Il controllo GitHub è passato e
la PR è stata fusa in `main` al commit `d5c0541b2a3a5385d4e6707bb6bfea54615e4de0`.
La v389 e il renderer corretto sono stati verificati online. Il primo avvio
online e le condizioni reali non sono stati provati.

### Ottavo passaggio: temporale simulato

Con codice `main` al commit `8f47fb19`, sessione isolata e previsione sintetica
con temporale, pioggia e vento forte, la testata mostra «Temporali» e «Vento
forte». Nel piano, però, il riepilogo «Quando» apre con «Arriva entro le 6:30»;
solo aprendo compare «Uscita sconsigliata con temporali», insieme a orari di
partenza e a un suggerimento per trovare meno gente. Le [prove](../evidence/002-uscita/)
documentano i due stati. La home, nella stessa fixture in cui tutte le zone
sono temporalesche, mostra che il meteo sconsiglia l’uscita.

Il messaggio di cautela esiste già: la gerarchia nel dettaglio rischia però di
presentare un invito a partire prima della cautela stessa. Va corretta la
presentazione facendo emergere l’avviso e sospendendo i suggerimenti di partenza
quando è già attiva la condizione `thunder`, senza cambiare classificazione,
soglie o dati meteo. Alba e orari legali devono restare consultabili come dati,
senza presentare un orario di partenza consigliato per quel caso.

La [PR 316](https://github.com/zatteogit/fungaroli/pull/316) propone la
correzione: la cautela è nel riepilogo, la partenza consigliata e l’alternativa
per l’affollamento non sono proposte durante il temporale; alba e finestra
legale restano nel dettaglio. Con fixture di temporale e sereno si sono provati
i due comportamenti; nel temporale anche quattro larghezze, entrambi i temi e
tastiera. Superati localmente 643 test e dry-run Worker; il controllo GitHub è
passato e la PR è stata fusa in `main` al commit
`26852083037eddd9621183e9b006bede0d43c963`. La v397 e il renderer corretto
sono stati verificati online. Le prove non usano meteo reale e non certificano
il primo avvio online.

### Nono passaggio: neve e classificazioni meteo sfavorevoli

Con meteo interamente sintetico, il codice di produzione `26852083` classifica
la neve come «uscita sconsigliata», ma nella scheda di Vallonina mostra comunque
«Arriva entro le 6:30». La [prova](../evidence/002-uscita/vallonina-neve-fixture.yml)
è una simulazione tecnica, non una previsione reale. Lo stesso modello classifica
come sconsigliate anche le proprie condizioni di pioggia e raffiche più intense.

| Persona simulata | Giudizio preliminare |
| --- | --- |
| Neofita | La cautela è essenziale prima di ogni suggerimento di partenza |
| Appassionato | Un orario suggerito può contraddire il giudizio meteo |
| Esperto | Serve mantenere visibili ragioni e dati, senza alterare soglie |
| Escursionista | Priorità alla condizione sfavorevole per decidere se partire |
| Naturalista | Stessa cautela meteo, indipendentemente dall’interesse di raccolta |

La correzione locale è nel worktree `/tmp/fronda-outing-severe-weather`, commit
`ac5cbc6e`: riusa il livello già calcolato e mostra la cautela nel riepilogo,
lasciando alba e orari consultabili. Le istantanee della prova su neve
[chiusa](../evidence/002-uscita/vallonina-neve-proposta-chiusa.yml) e
[aperta](../evidence/002-uscita/vallonina-neve-proposta-aperta.yml) documentano
il risultato locale; 643 test unitari e dry-run Worker superati. Il test browser
con Wrangler locale non è partito (`spawn EBADF`); va riprovato e vanno ancora
verificati gli altri stati, i breakpoint e la tastiera. Nessuna PR o pubblicazione
per questa correzione. Non sono stati effettuati test con utenti o validazioni
scientifiche; il primo avvio online a cache vuota resta non certificato.

La correzione è ora nella [PR 317](https://github.com/zatteogit/fungaroli/pull/317),
fusa in `main` al commit `72a19a031e655ce5bc9227613f1089da2491ae02` dopo il controllo GitHub. Il deploy è ancora da verificare. Una matrice di sessioni
isolate con [fixture riproducibile](../evidence/002-uscita/meteo-sconsigliato-matrice.cjs)
e [risultati](../evidence/002-uscita/meteo-sconsigliato-risultati.json) ha
provato neve, pioggia intensa, raffiche forti, temporale, sereno e vento
moderato, quattro larghezze (320–1280), temi chiaro/scuro e apertura da
tastiera. I casi severi presentano prima la cautela e non suggeriscono la
partenza; negli altri il suggerimento rimane. Non è meteo reale. La regressione
browser aggiunta alla suite resta non eseguita perché il Wrangler locale non
parte (`spawn EBADF`); le prove sopra usano un server statico.

## Ancora da fare prima di chiudere la pagina

- Completare l’inventario delle sezioni espanse, dei filtri, degli stati del
  taccuino e delle varianti di meteo, interessi e zone.
- Confrontare i blocchi con tutti i documenti CMS e JSON che li alimentano;
  identificare differenze, fonti, azioni e contenuti mancanti.
- Verificare l’ordine e l’accesso per le cinque personas, con tastiera, temi,
  contenuti lunghi e breakpoint. Registrare ogni campo e le prove per persona.
- Mantenere `route-seed` e le cinque personas in coda fino a inventario e
  revisioni completi. Nessuna validazione con utenti reali o scientifica è stata
  svolta. Il caricamento a cache vuota del sito online non è certificato.
