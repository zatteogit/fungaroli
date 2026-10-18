# Viste del taccuino · 18 ottobre 2026

Il taccuino offre tre letture degli stessi appunti, accessibili da un selettore che rimane sotto l'header mentre si scorre. Non cambiano contenuti, ordine cronologico, filtri, ricerca o stato di condivisione.

## Riferimenti verificati

- [Foto di Apple · sfogliare la libreria](https://support.apple.com/en-sg/guide/iphone/iph7d24753a5/27/ios/27): dimensione delle miniature regolabile nella griglia. Riprendiamo il controllo della densità; non aggiungiamo gesti che interferiscano con lo zoom accessibile del browser.
- [Day One · viste del diario su iOS](https://dayoneapp.com/guides/tips-and-tutorials/journal-views-in-day-one-for-ios/): viste distinte per elenco e media. Riprendiamo la possibilità di scegliere fra lettura e scansione visiva, mantenendo tutti i tipi di appunto.

Consultati il 18 ottobre 2026. Le scelte seguenti sono un adattamento al prototipo Fronda, non la riproduzione di queste app.

## Comportamento

- **Pagine**: impaginato esistente con testi, informazioni di campo e foto grandi.
- **Griglia**: anteprime quadrate, titolo e data. Le note senza foto hanno una tessera tipografica; non vengono escluse né ricevono foto inventate. Due densità: grandi/piccole, con 2/3 colonne sul telefono, 3/4 sul tablet e 4/6 su desktop.
- **Elenco**: miniatura o simbolo della categoria, titolo, data, luogo e breve testo. Le foto di repertorio restano indicate come provenienti dal catalogo.

Il selettore e i pulsanti di densità hanno aree di almeno 44 px e stato accessibile. La vista iniziale rimane Pagine; la scelta e la densità si ricordano sul dispositivo, anche tornando dal dettaglio. In assenza di localStorage funzionano in memoria. Il diario di prova condivide la preferenza di vista ma resta distinto dalle note personali.

Cambiare vista conserva filtri e ricerca. Se si sta sfogliando più in basso, il cambio cerca di mantenere nel viewport lo stesso appunto; lo spazio disponibile in fondo alla pagina può limitare la posizione esatta. Una breve dissolvenza accompagna il cambio e rispetta Riduci movimento. Nessuna modifica al taccuino salvato o alle condivisioni.

L'apertura di un appunto continua a usare la stessa rotta della pagina completa. La griglia non modifica la provenienza delle immagini: «Dal catalogo» non significa foto scattata dall'utente.

## Verifica

Controllare 320/390/768/1280 px, entrambi i temi, note fotografiche e solo testo, ordine identico, densità, filtri e ricerca, ritorno dal dettaglio, persistenza della preferenza, navigazione da tastiera, contrasto dei comandi e assenza di overflow. Le eventuali viste calendario o mappa non sono incluse in questa prima implementazione.
