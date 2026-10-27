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
