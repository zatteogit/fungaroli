# Lotto 001 · Uscita: arrivare al piano

Stato: corretto e verificato localmente; pubblicazione in preparazione. Questa è una revisione dei componenti
iniziali dell’uscita, non il completamento di tutte le 447 unità della pipeline.

## Decisioni sui contenuti

| Contenuto | Per chi conta prima | Prima | Intervento | Accesso al testo completo |
| --- | --- | --- | --- | --- |
| Luogo, data, copertina | Tutti; identità del luogo | Foto alta | Copertina di contesto più breve; niente area vuota senza foto | Foto invariata, nessuna variante scientifica modificata |
| Interessi scelti | Appassionato, naturalista | Titolo, chip, elenco e nota | Un riepilogo con Modifica; selezione specifica e vincoli pratici in riga | Modifica apre gli stessi filtri; info nel riepilogo |
| Elenco completo delle specie scelte | Appassionato, esperto | Blocco sempre visibile | Dettaglio nel riepilogo | Una apertura |
| Come è calcolato l’indice | Neofita, esperto | Spiegazione e fungo guida prima del piano | Info nel contesto delle scelte | Una apertura; stesso testo e modello |
| Conteggio delle specie senza indice | Esperto; chi ha selezionato specie precise | Diagnostica numerica sempre in primo piano | Dettaglio esplicito nel riepilogo | Una apertura; l’indice assente resta assente |
| Scegliere il giorno | Appassionato, escursionista | Grandi tessere da calendario | Tessere più brevi con giorno/data e confronto meteo/indice | Sempre disponibile, stessa selezione |
| Meteo e cautela del giorno | Tutti; soprattutto escursionista | Cerchi e didascalie su più righe | Temperatura e testo affiancati; vento forte resta visibile | Sempre leggibile; nessun numero fittizio |
| Condizioni dell’uscita | Appassionato | Indicatore da 84 px | Indicatore da 60 px nella stessa riga | Significato ancora raggiungibile dal valore |
| Raccolta locale da verificare | Raccoglitore | Titolo, referente e recapito mancante in grande card | Avviso breve visibile; note e fonte espandibili | Una apertura |
| Limitazione o sola osservazione | Tutti | Avviso completo | Resta completo e visibile | Nessuna cautela nascosta |
| Stato della documentazione pratica | Escursionista | Griglia e disclaimer sempre aperti | «Percorso e accessi» con stato significativo da chiuso | Una apertura: sentieri, arrivo, raccordo, ritorno, tempo e limiti |
| Sentiero, cosa osservare, quando e come arrivare | Obiettivo primario | Dopo vari blocchi introduttivi | Il piano viene raggiunto prima | Riepiloghi utili e dettagli nel contesto |
| Offline, schermo, notifiche | Uso sul campo | Già progressivi | Nessun nuovo invito iniziale | Strumenti dopo il piano |
| Community e taccuino | Osservazione e contributo | Dopo il piano | Resta dopo il compito principale | Dati/azioni e privacy conservati |
| Fonti, regole, tabelle e metodo esteso | Esperto e verifiche | Approfondimenti | Restano raggiungibili con etichette esplicite | Non eliminati per ridurre l’altezza |

Il neofita deve riconoscere soggetto e cautele; l’appassionato scelte, condizioni e
specie; l’esperto fonti e incertezze senza dover leggere inviti; l’escursionista
limiti del percorso prima di scambiarlo per itinerario; il naturalista conserva
accesso a piante e osservazioni senza un indice fungino improprio.

## Prove

`tests/browser/outing-layout.spec.mjs` misura riepilogo, calendario e indicatori a
320/390/768/1280, nei due temi, con interessi combinati e meteo assente. La prova
specifica di Allumiere verifica che il contenuto completo sia ancora raggiungibile
mentre il primo piano non è preceduto da una pila di spiegazioni. Gli avvisi di
limitazione esplicita vengono provati separatamente dalla sola incertezza locale.

Le fixture rendono le prove ripetibili; non sono una validazione sul terreno o
con utenti reali. Le misure e lo stato del rilascio saranno aggiunti a collaudo finito.

Collaudo locale: 8 casi Chrome e 8 WebKit superati, compreso Allumiere e il caso
con limitazioni esplicite. Budget rispettati nei quattro breakpoint e due temi.
Nel caso Allumiere a 390 px: riepilogo 61 px, selettore giorni 68 px (52 px per
controllo), indicatori 84 px e documentazione chiusa 61 px. Metodo, diagnostica e
referente locale si raggiungono con una apertura nel contesto. Il simbolo del
fungo ripetuto nel numero generale è omesso visivamente per lasciar leggibile
anche il limite 10,0 nel cerchio; etichetta e descrizione accessibile restano.
