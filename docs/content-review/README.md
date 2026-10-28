# Pipeline di revisione dei contenuti

Mandato di Matteo, 27 ottobre 2026: arrivare subito alle informazioni utili.
Per **ogni contenuto**, su ogni pagina e singola scheda, chiedersi:

1. Quanto conta per neofita, appassionato, esperto, escursionista e naturalista?
2. Quante azioni servono per raggiungerlo? Si capisce dove cercarlo?
3. Deve essere subito visibile, contestuale o su richiesta?
4. Formato, ordine e gruppo aiutano il compito o aggiungono ingombro?
5. L’intervento è stato provato sul contenuto reale, nei casi limite e sui device?

La pipeline è consultabile in [index.html](index.html); il registro autorevole è
[pipeline.json](pipeline.json). L’inventario viene dai dati versionati attuali:
non è una conferma di identità fra JSON e contenuto pubblicato dal CMS.

## Esecuzione, una unità alla volta

```sh
node tools/content-review.mjs init    # censisce/aggiorna, conserva revisioni non obsolete
node tools/content-review.mjs next    # prossima pagina/scheda ancora da revisionare
node tools/content-review.mjs record docs/content-review/reviews/<unità-persona>.json
```

Ordine: uscite e casi con dati mancanti → home → tutti i funghi e confronti →
mappa → piante e alberi → animali → taccuino → letture, glossario, sfide e accessi.
Le cinque personas sono profili di verifica simulati, non persone intervistate.
Sessioni e preferenze sono isolate. Una prova automatica di rendering non vale
come giudizio editoriale concluso o validazione scientifica.

Per ogni campo censito la revisione registra importanza (`core`, `useful`,
`reference`), numero di azioni, disclosure (`now`, `on-demand`, `inline`), formato
e motivazione. Include impronta dei dati, commit testato ed evidenze riproducibili.
Un file incompleto o riferito a dati cambiati non può chiudere la revisione.
I campi di servizio vanno motivati come tali, non trasformati in nuovi contenuti UI.

## Priorità visiva, non cancellazione

- La prima schermata presenta il soggetto e la decisione utile; nessuna pila di
  introduzioni, spiegazioni del metodo, inviti e dati mancanti ripetuti.
- Le informazioni che cambiano una decisione restano riconoscibili: cautele,
  divieti, limiti pratici, dato assente e significato dell’indice.
- Contatti non acquisiti, metodo dettagliato, conteggi diagnostici, fonti, crediti,
  azioni occasionali e spiegazioni estese sono nel contesto, a una azione.
- Nessuna fonte o cautela viene eliminata per fare spazio. Un divieto esplicito
  non viene nascosto nello stesso modo di una richiesta di verifica del gestore.
- Prima confronto e caratteri, poi eventuale cucina; le prescrizioni di
  preparazione obbligatorie restano leggibili e collegate al relativo badge.
- Nei resoconti si distinguono inventariato, proposta, corretto, verificato e
  pubblicato. Una correzione al template non chiude automaticamente 100 funghi.

## Budget del primo intervento: uscita

Il riepilogo chiuso mira a una riga/due righe (massimo 104 px a 320 px), i giorni
sono controlli secondari compatti (massimo 76 px), meteo e condizioni condividono
una riga leggibile (massimo 116 px con le fixture). Sono guardrail di interfaccia,
non nuove soglie del modello. I dettagli completi restano espandibili.

Il controllo trasversale delle altre pagine, delle singole specie e degli stati
non ancora provati resta in coda: nessun completamento per semplice censimento.

## Modello ed effort per fase

Prima di una fase che trarrebbe beneficio da un cambio di modello o effort,
comunicare a Matteo la combinazione consigliata e il motivo, prima di eseguirla.
Dichiarare separatamente una raccomandazione e un cambio effettivamente applicato.
La preferenza vale anche per i lotti automatici.

Le righe `route-seed` censiscono una destinazione, non i contenuti della pagina.
Prima di chiuderle, raccogliere i blocchi effettivamente renderizzati (testi, azioni,
metodo, cautele, stati e contenuti espansi), salvarli in `renderedFields` con ID
univoci, ruolo, dimensione e riferimento all’evidenza, e impostare
`inventoryKind: rendered-fields`. `init` li conserva a parità di fonte.
Anche sulle schede, confrontare l’inventario dei dati con i contenuti effettivi del
CMS e del DOM: il solo controllo del JSON non chiude la revisione editoriale.
