# Preferiti nel Taccuino · studio del 21 ottobre 2026

Stato: proposta di interazione, da valutare. Non implementata nell’app pubblicata.
Richiesta di Matteo: salvataggio rapido per i diversi contenuti di Fronda; alla prima aggiunta una modale spiega dove ritrovarli.

## Un gesto, una destinazione

Un segnalibro vuoto significa «Aggiungi ai preferiti»; pieno significa «Nei preferiti». Il comando è un vero pulsante con stato premuto e nome accessibile. Lo stesso contenuto ha lo stesso stato ovunque: scheda, card, ricerca e mappa. L’aggiunta richiede un solo tocco, senza modulo, scelta di cartelle, data o accesso obbligatorio.

Il Taccuino ha due accessi stabili, **Pagine / Preferiti**. Pagine conserva appunti, osservazioni e racconti; Preferiti raccoglie ciò che vuoi ritrovare. La scelta si riflette nella rotta, proposta `#/diario/preferiti`, così il link nel feedback apre direttamente la raccolta. Le voci preferite non aumentano il numero delle pagine né quello delle uscite effettuate.

## Cosa si può salvare

| Contenuto | Oggetto conservato | Alla riapertura |
| --- | --- | --- |
| Fungo, pianta, albero, animale | Tipo e identificatore della scheda | Scheda corrente con le sue foto e fonti |
| Luogo o zona | Identificatore del luogo, senza giorno | Zona con condizioni aggiornate quando disponibili |
| Sentiero | Identificatore stabile del percorso e zona | Quel sentiero, senza sostituirlo con il primo disponibile |
| Uscita con giorno scelto | Zona + data assoluta + sentiero effettivamente selezionato, se presente | Piano per quella data; previsione aggiornata solo se ancora disponibile |
| Giro editoriale | Identificatore del giro | Giro originale; non una dichiarazione di averlo percorso |
| Guida | Identificatore della guida | Lettura |
| Voce di glossario | Identificatore e contesto del termine | Definizione corretta, anche per omonimi |
| Confronto | Coppia di specie distinte | Stessa coppia; il salvataggio non la rende una coppia di sosia documentati |

Esempi di etichette nei Preferiti: «Fungo», «Luogo», «Sentiero», «Uscita · 22 ottobre», «Guida», «Confronto». I filtri raggruppano **Tutti / Specie / Luoghi / Sentieri e giri / Uscite / Letture / Confronti**; si possono mostrare solo i gruppi presenti. Specie comprende anche piante, alberi e animali, con il tipo esplicitato sulla voce.

Per una sezione interna già dotata di collegamento stabile, per esempio una preparazione in una scheda, si può conservare quel collegamento con il suo contesto. Non inventare schede autonome o nomi di ricette non presenti. Quiz, risultati temporanei dei filtri, previsioni e singole fotografie non diventano oggetti separati: si salva la scheda o il contenuto a cui appartengono. Le foto restano disponibili dalle relative gallerie e con i propri crediti.

Le proprie pagine possono eventualmente essere messe in evidenza nello stesso spazio, tramite il loro identificatore, senza duplicarle. È un’estensione successiva, non necessaria al primo rilascio.

## Primo salvataggio

1. Scrittura riuscita e stato del segnalibro aggiornato.
2. Apertura di una modale compatta, una sola volta per il proprietario del Taccuino su quel dispositivo. Non mostrarla prima della riuscita.
3. Titolo **«Lo ritrovi nel Taccuino.»**
4. Testo **«Funghi, luoghi, sentieri e letture: tutto quello che salvi ti aspetta in Preferiti. Quando vuoi, puoi aggiungere un appunto o raccontare un’uscita.»**
5. Nota per ospite: **«Per ora i preferiti restano su questo dispositivo.»** Se il profilo è autenticato, descrivere lo stato reale della sincronizzazione, senza prometterla quando è in sospeso.
6. CTA principale **«Continua a esplorare»**. Accesso secondario **«Apri i Preferiti»**. Chiusura ed Escape mantengono il salvataggio e riportano al punto di partenza.

Le aggiunte successive producono un feedback discreto: **«Nei Preferiti del Taccuino · Apri»**. Rimozione immediata con **«Rimosso dai preferiti · Annulla»**. Nessuna nuova modale per la rimozione. Se la scrittura fallisce, nessun falso stato salvato: **«Non riesco a salvarlo. Riprova.»** Se il salvataggio locale riesce ma la sincronizzazione fallisce, distinguere **«Salvato su questo dispositivo · sincronizzazione da completare»**.

La spiegazione resta richiamabile nella raccolta («Come funzionano i Preferiti»). Svuotare la raccolta non la ripropone automaticamente. La prima aggiunta del dispositivo ospite non va attribuita a un altro account.

## Disegno e posizione del comando

Nella testata fotografica dell’uscita, segnalibro vicino al comando Mappa, senza coprire titolo o dati. Nelle schede, accanto alle altre azioni contestuali; nelle card, un comando fratello del link principale, mai un pulsante annidato in un link. Niente controlli aggiunti su ogni miniatura di galleria.

Sagoma e posizione restano uguali fra vuoto/pieno; l’icona piena e l’etichetta comunicano il salvataggio. Giallo e bordino esprimono la selezione, coerentemente con gli altri selettori; CTA della modale verdi in light e bianche in dark. Comando di almeno 44 px, visibile anche senza hover, focus evidente e nome completo per lettori di schermo. Nelle liste è sufficiente l’icona, nelle azioni della scheda si può mostrare «Salva / Salvato».

## Dentro Preferiti

Raccolta compatta: miniatura dal catalogo quando esiste, tipo, titolo, eventuale data dell’uscita e segnalibro per rimuovere. Ordine iniziale ultimo aggiunto; ricerca per nome e luogo. I filtri lavorano solo sulla raccolta, senza cambiare gli interessi della home. Stato vuoto: **«Qualcosa da ritrovare.» / «Tocca il segnalibro su una scheda, un luogo o un sentiero. Lo ritroverai qui.»**

Aprire la voce porta al contenuto originale, conservando filtro e posizione al ritorno. «Aggiungi un appunto» apre il compositore precompilato con il riferimento, ma crea una pagina soltanto dopo il salvataggio della nota. Per un giro «Racconta l’uscita» crea un ricordo collegato. Il preferito resta disponibile, perché si può tornare nello stesso posto: nessuna conversione distruttiva e nessuna nota duplicata a ogni tocco.

## Date e duplicati

- Non conservare l’offset «domani» come identità: domani deve diventare una data assoluta nel fuso Europe/Rome. Il titolo non può slittare dopo mezzanotte.
- Luogo e uscita datata sono oggetti diversi, etichettati come tali. Nella home e nella proposta giornaliera si salva l’uscita scelta; nel contesto del luogo il comando salva il luogo.
- La stessa specie o lo stesso sentiero non crea due preferiti. La stessa uscita nello stesso giorno e percorso aggiorna la voce esistente; la stessa zona in due giorni distinti può avere due piani distinti.
- Confronto A/B e B/A sono un solo preferito; si conserva l’orientamento scelto quando aggiunto, senza invertirlo a ogni apertura.
- Dopo il giorno previsto si mostra «Data trascorsa» e si offre «Racconta l’uscita» o «Valuta un altro giorno». Non si cancella né si dichiara compiuta l’uscita.
- Quando manca il contenuto originale, la voce resta riconoscibile con «Contenuto non più disponibile» e possibilità di rimozione. Non si sostituisce con altro contenuto.
- Un tocco rapido ripetuto non genera scritture concorrenti né duplicati; un aggiornamento del meteo non ricrea il comando e non ne perde il focus.

## Persistenza e compatibilità da realizzare

Il codice attuale conserva note (`kind: note`), piani (`plan`) e racconti (`outing`). I giri editoriali e sentieri salvati da `data-save-trip` creano oggi una nota di categoria `percorso` e aprono la sua pagina. I validatori server ammettono solo questi tipi; una nuova raccolta richiede un contratto condiviso, non solo un filtro grafico o una chiave locale separata.

Proposta: record dedicato `kind: bookmark` nello stesso archivio personale del Taccuino, normalizzato da client e server. Campi: id, tipo di riferimento, identificatore canonico, titolo di ripiego, salvatoIl, riferimento navigabile e, soltanto per le uscite, data assoluta/zona/percorso. Dati di catalogo e foto si risolvono dal riferimento; nessuna copia di intere schede, immagini raster o condizioni dichiarate attuali.

I preferiti restano privati e non hanno `record`, ritrovamenti, previsioni prospettiche, consenso o segnalazioni community. Vanno esclusi da personalizzazione, indici, confronti previsione/osservazione e conteggi delle uscite. Non richiedono un giorno fittizio di osservazione. Il server rifiuta riferimenti esterni o tipi non consentiti e deriva la chiave canonica dai campi convalidati, non da una stringa arbitraria del client.

Aggiornare insieme archivio locale, archivio autenticato, validazione API corrente e compatibilità API diario, export/import, risoluzione rotte, cancellazione account e controllo di capienza. Separazione account e protezione dalle risposte asincrone obsolete restano obbligatorie. Le modifiche offline richiedono coda di sincronizzazione con rimozioni ricordate: una risposta remota vecchia non deve far ricomparire un preferito cancellato. L’accesso al profilo non importa né invia automaticamente il Taccuino ospite; l’eventuale unione è esplicita e deduplicata.

Le vecchie note «percorso» e i vecchi piani restano leggibili nelle Pagine; non convertirli tutti automaticamente. Un piano può custodire una previsione storica e una nota può già avere testo, foto o un ricordo collegato. Valutare una migrazione soltanto per i salvataggi puri distinguibili senza ambiguità, mantenendo id e riferimenti.

## Verifiche necessarie all’implementazione

Primo salvataggio riuscito/fallito, modale una sola volta e riapertura manuale; tastiera/Escape/focus dal dettaglio in modale; salvataggio senza navigazione; doppio tocco; rimozione e annullamento; coerenza tra card/scheda/mappa/ricerca; data assoluta oltre mezzanotte e fuori orizzonte meteo; distinzione luogo/uscita/sentiero; coppia di confronto senza falsa relazione di sosia; offline e conflitti; cambio account in volo; export/import; contenuto rimosso; vecchie note; nessun effetto sui modelli o sulla community; 320/390 px, chiaro/scuro, zoom e movimento ridotto.

## Prova cliccabile

[Apri lo studio](prototipi/preferiti.html). Il prototipo dimostra salvataggio, prima modale, feedback, rimozione/annullamento, raccolta, ricerca e filtri. Usa solo stato temporaneo della pagina: ricaricare azzera la prova. Non scrive nel Taccuino personale, non effettua accessi e non simula una sincronizzazione riuscita. Le foto sono quelle già disponibili nel catalogo; i collegamenti alle schede aprono l’app pubblica con i suoi crediti. Le parti di composizione, persistenza e integrazione elencate sopra sono ancora da implementare.
