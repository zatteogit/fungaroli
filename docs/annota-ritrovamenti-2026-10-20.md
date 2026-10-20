# Annota e ritrovamenti fotografici — 20 ottobre 2026

Decisione di Matteo: la CTA in fondo alla navigazione diventa **Annota**, con la penna d’oca Fronda. Il Taccuino resta una destinazione con icona di quaderno; la ricerca globale rimane in testata, in Scopri e con Ctrl/Cmd+K.

## Inserimento

Foto per prima, scelta fra fungo/pianta/albero/animale/altro, specie facoltativa. Basta una foto o un appunto o un riferimento alla specie; il nome può restare da riconoscere. Giorno di oggi già proposto, luogo facoltativo proposto soltanto da una zona esplicitamente aperta. Dalle schede si propone il riferimento corrente. Titolo, parole proprie, luogo e giorno restano accessibili fra i dettagli.

Salvando si apre la pagina personale, con foto completa e didascalia esplicita. La fotografia personale precede sempre le immagini di catalogo. La griglia del taccuino la distingue come propria e la mette in evidenza. Modifica e rimozione restano disponibili. Il percorso precedente per appunti strutturati e il racconto dell’uscita restano accessibili.

## Fotografie e dati

Una fotografia per pagina. Copia JPEG fino a 1280 px e 120 kB, ricampionata nel browser senza metadati EXIF; nessun riconoscimento automatico. Gli originali non vengono modificati. Validazione condivisa fra browser e API: JPEG incorporato, dimensioni e lunghezza limitate. Il payload rientra nel limite esistente di 250 kB delle API.

Le fotografie sono private, incluse nella voce personale sincronizzata col proprio profilo; non entrano negli aggregati community. In locale vengono conservate in IndexedDB, con riferimenti nel precedente archivio localStorage; le vecchie note restano leggibili. Le chiavi sono separate per archivio/profilo. Una mancata scrittura non viene confermata come salvataggio. I salvataggi dello stesso archivio vengono eseguiti in sequenza, così due inserimenti simultanei non si sovrascrivono.

Se si indica una zona e il giorno è oggi, si conserva la previsione della mattina solo quando disponibile e aggiornata. Viene etichettata come previsione, non meteo osservato nel punto del ritrovamento. Cambiare giorno o luogo rimuove il riferimento incompatibile; nessun meteo ricostruito per giornate passate.

## Verifiche

Unità: validazione foto, nota senza nome/luogo, priorità foto personale, vincolo del meteo al contesto. Browser: 320/390/768/1280, due temi, inserimento, riapertura dopo reload, modifica, separazione degli archivi, errore di spazio, inserimento senza fotografia e ricerca.

Il server Worker locale incontra un errore di avvio esbuild EBADF sul Mac: le verifiche browser locali usano il server statico; la suite completa e le API si verificano nella CI su Linux. La deroga concessa per i video non si estende automaticamente a questo rilascio.
