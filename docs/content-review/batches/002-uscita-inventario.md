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
