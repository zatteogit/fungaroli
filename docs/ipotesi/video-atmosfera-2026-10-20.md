# Video di atmosfera — valutazione e pubblicazione

## Decisione e perimetro

Matteo ha chiesto nella chat «Imposta il video come sfondo hero» di cercare clip riutilizzabili per licenza, acquisirle e preparare still nitidi prima del caricamento sufficiente, preferendo loop. Dopo la raccolta e la prova locale del 20 ottobre ha autorizzato: **«Ok, pubblichiamole nei punti giusti»**.

Questa valutazione adotta il materiale della prova di questa stessa chat, ramo locale `codex/home-hero-video`, selezionando solo le clip licenziate e il comportamento di caricamento. La prova del 15 ottobre era basata su una versione superata dell'app: non viene unita integralmente. L'integrazione riparte dalla produzione aggiornata `3131e2f` (che include la PR #162), ramo `claude/brave-tesla-wu0a2b`, conservando layout Fronda, interessi combinabili, stato del taccuino, foto delle schede e navigazione attuali.

## Collocazioni

- **Copertina della home:** video di atmosfera variabile in base alla zona e al giorno della proposta: Luce tra le foglie, Bosco e sentiero, Gocce sulla felce, con Autunno disponibile solo nei mesi settembre–novembre. La scelta è stabile durante gli aggiornamenti meteo. Il mese è una scelta editoriale, non un'inferenza su luogo o meteo. Dicitura visibile «Video di atmosfera». Testi, data, indice, avvisi e azione restano sul pannello pieno.
- **Home Piante:** riprese orizzontali alternate, dando a Gocce sulla felce una posizione diversa nella sequenza come dettaglio decorativo; nessuna previsione di presenza botanica.
- **Home senza interesse fungino o botanico:** riprese alternate nella stessa raccolta, con una sequenza distinta come invito alla passeggiata; foto e dati delle località rimangono nelle schede.
- **Inviti alle guide, in home e cataloghi:** Luce tra le foglie o Gocce sulla felce nell'area visiva esistente. Non sono più immagini cliccabili della ginestra: l'azione testuale resta «Scopri le nostre guide», coerente con il contenuto.
- **Taccuino vuoto:** Ombre di foglie come illustrazione introduttiva, prima del testo dello stato vuoto. Non compare dietro appunti, fotografie o pagine già salvate.

Nessun video dentro foto di specie, caratteri, confronti, mappe, schede dei luoghi o pagine personali. Nessun cambiamento ai dati scientifici, all'indice, agli account o ai binding.

## Fonti e riutilizzo

Cinque download ufficiali Pexels, verificati il 20 ottobre. File, URL di origine, autori, licenza indicata nella scheda, hash SHA-256 degli originali e dimensioni dei derivati sono in `assets/video/nature/manifest.json`. Le attribuzioni sono anche leggibili in Regole e sicurezza → Fotografie e illustrazioni.

La Pexels License consente uso gratuito personale/commerciale, adattamento e inserimento in siti/app; l'attribuzione non è obbligatoria ed è comunque mantenuta. Restano i divieti della licenza, inclusi rivendita del contenuto inalterato e redistribuzione come stock. Non si presenta la raccolta come un archivio stock pubblico.

La scheda di Bosco e sentiero (autore Pixabay su Pexels) indica «Free» e rimanda alla pagina Creative Commons Pexels, che descrive usi gratuiti commerciali e adattamento per Pexels/CC0. Il manifest conserva questo riferimento senza inferire un marcatore CC0 non comparso nella scheda letta. Le altre quattro schede rimandano alla Pexels License.

Originali completi e acquisizione delle fonti restano nella raccolta locale della chat; non vengono pubblicati come asset. Il video Gemini della prima prova non entra nel rilascio.

## Performance e accessibilità

Loop H.264 di 8 secondi, 24 fps, senza audio, `faststart`; raccordo in dissolvenza incorporato, senza due decoder attivi. Still autentici WebP con due risoluzioni. Un solo video di atmosfera è attivo alla volta, tra quelli nella vista visibile; il video viene richiesto dopo lo still decodificato, solo in vista, dopo l'avviso obbligatorio e senza pannelli modali aperti.

La dissolvenza iniziale avviene solo con un frame decodificato e almeno due secondi di buffer (o il resto completo del loop). In attesa di rete torna lo still. Con risparmio dati o riduzione movimento resta lo still senza richiesta MP4. Pausa esplicita, pausa fuori vista, cambiando rotta e con scheda nascosta. Le dimensioni sono riservate prima del caricamento; nessun testo informativo è sovrapposto al movimento.

La PWA non precache i video e non intercetta i loro Range; conserva i piccoli still per l'uso senza rete. I file grandi vengono richiesti solo per la superficie attiva. Versione shell e meta app-version avanzano insieme.

## Verifiche

Esiti finali, commit e pubblicazione sono riportati nella PR del rilascio. La PR #162 è entrata in produzione durante questo lavoro; il ramo ne recepisce il merge canonico, senza pubblicarla da questa chat. La suite completa viene eseguita sul candidato aggiornato. Il successo di una prova locale o di un controllo statico non vale pubblicazione.

## Correzione del 20 ottobre: luogo e meteo prima dello stock

Matteo ha precisato: «i video stock usali quando non hai alternative di foto/video reali» e che le copertine devono illustrare anche il meteo. Le copertine delle uscite ora scelgono prima un video assegnato alla località con stagione e meteo compatibili, poi `pickCover` dalla foto della zona e relative varianti. Queste elaborazioni illustrano condizioni previste: non sono fotografie del meteo osservato. Lo stock rimane un ripiego senza foto locale; la pioggia usa la felce bagnata. Per nebbia, neve o temporali senza alternative locali si mostra una previsione illustrata, senza spacciare una ripresa serena per quel meteo.

Il file utente `gemini_generated_video_0654230b.mp4` è stato approvato esplicitamente per «il tancia d’autunno quando non piove». È l’animazione della scena autunnale della faggeta già nel catalogo; vengono mantenuti i crediti della foto di Christoph Strässler, CC BY-SA 2.0, e indicata l’elaborazione Gemini fornita da Matteo. Derivato web: loop 8 s a 1280×720, 24 fps, senza audio, raccordo e faststart, still WebP autentici del filmato. Associazione e hash sono in `assets/video/places/manifest.json`. Non è una nuova ripresa documentaria del Tancia, né una rilevazione meteo.

Il pacchetto di lavoro richiesto da Matteo è salvato negli output della chat: 19 fotografie reali orizzontali del catalogo e 8 varianti meteo/stagionali illustrative, con numeri, fonti, licenze e indicazioni per restituire i video mantenendo l’associazione.
