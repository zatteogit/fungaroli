# Illustrazioni Animali · primo lotto zoologico

18 ottobre 2026 · produzione autorizzata, **nessun soggetto ancora autorizzato
alla generazione**: manca il controllo visivo dei riferimenti fotografici reali.
Non cambia lo stato di alcuna scheda pubblica.

## Cosa è pronto

[prebrief.json](prebrief.json) fotografa le otto voci pubbliche del catalogo e
istruisce quattro soggetti candidati. Non è un manifest di immagini pronte e non
contiene prompt eseguibili spacciati per approvati.

| Ordine | Soggetto | Rango / perimetro | Base testuale | Gate restante |
|---|---|---|---|---|
| 1 | Cinghiale · *Sus scrofa* | Specie; adulto, sesso non assegnato | Corpo compatto, collo corto, mantello setoloso e grugno lungo conico: fonte primaria Parchi Lazio / Valle del Treja | Foto reale da esaminare, postura, arti e mantello; niente zanne maschili inventate |
| 2 | Calabrone europeo · *Vespa crabro* | Specie; adulto, sesso/casta non assegnati | Distribuzione dei colori descritta dalla Regione Valle d’Aosta; piano corporeo degli insetti adulti da AMNH | Foto specie-specifica, ali, bande e proporzioni; nessuna commistione con *V. velutina* |
| 3 | Farfalla diurna · schema anatomico | Gruppo editoriale; un esempio esplicitamente didattico | Due paia di ali, squame, antenne clavate e spirotromba: Ente Aree Protette Alpi Marittime | Scegliere e vedere una foto di esempio nominata; niente livrea fittizia presentata come specie reale |
| 4 | Ape da miele · *Apis mellifera* | Specie; operaia proposta ma non ancora convalidata | Taxon da Università di Bologna; piano corporeo adulto da AMNH | Foto e fonte anatomica per casta, ali, peluria, colori; non mescolare operaia/fuco/regina |

Le altre quattro voci pubbliche non sono state trasformate in prompt:

- **Bombi:** il genere comprende specie e caste diverse; la peluria non basta a
  definire una tavola del gruppo. Serve un esempio nominato e documentato.
- **Sirfidi:** la famiglia non ha un’unica livrea o sagoma; non usare un’ape con
  due ali in meno come scorciatoia. Serve un esempio esplicito e foto idonea.
- **Zecche:** specie, stadio e stato di alimentazione cambiano la figura; non
  estendere «otto zampe» a larve o sovrapporre una zecca adulta a un insetto.
- **Lupo:** nessuna immagine generica «cane grigio»: occorrono fotografie controllate,
  postura e limiti del confronto con cani/ibridi. Nessuna sottospecie attribuita.

## Riferimenti: cosa è stato realmente controllato

Le fonti testuali nel JSON sono state aperte e lette; i singoli file Commons
candidati di ape, calabrone e cinghiale hanno pagine con metadati leggibili.
**Non sono stati esaminati i loro pixel.** La presenza di didascalie o descrizioni
prodotte dal motore di ricerca non vale revisione fotografica.

L’agente photo_enrichment ha consegnato una coda di otto fotografie candidate,
ancora tutte non acquisite. Per calabrone e cinghiale sono state rilette anche le
pagine individuali, con autore/licenza. Nessun asset è copiato o pubblicato qui.
Le licenze della pagina o dei metadati non sostituiscono quelle del singolo file.

Tentativo ordinario sull’originale della foto dell’ape di Andreas Trepte:
HTTP **403**, nessun JPEG ottenuto. Nessun aggiramento del proxy. Il connettore
web ha restituito placeholder testuali «ImageDisplayed» anche per apertura di
immagini e screenshot PDF, senza blocchi immagine esaminabili in questa sessione.
È stato cercato anche il workspace: nessuna fotografia animale pertinente già
presente nelle cartelle assets/attachments/shared/library-files.

I riferimenti fotografici del JSON sono perciò **candidati**, con
`visualReview: false` e nessun `photosActuallyReviewed`. Non vanno passati al
modello come se fossero fotografie già controllate.

## Passaggio alla produzione

1. Ricevere fotografie reali come file effettivamente leggibili, con pagina e
   attribuzione. Esaminarle: soggetto, stadio, angolo, occlusioni e anatomia.
2. Completare i dettagli ancora ignoti e fissare l’esempio esatto, senza
   modificare i dati pubblici per giustificare il disegno. Registrare claim e
   fonti nella matrice di produzione; tratto ignoto resta non raffigurato.
3. Solo allora inviare il singolo brief valido a raster_production: raster
   trasparente, stile coerente con funghi/piante, chiaramente illustrato, non
   fotografia sintetica. Nome del taxon e disclaimer fuori dall’immagine.
4. Controllare severamente anatomia, attacchi di arti/ali, conteggi, bande,
   caste/stadi e caratteri non documentati. Correggere e rivedere la versione
   finale; mantenere prompt, versione, hash, riferimenti e difetti scartati.
5. Soltanto dopo approvazione raster passare al vettore multilivello, con parti
   nominate e collegate alle claim. Nessun bitmap inserito in un SVG e chiamato
   vettorializzazione semantica.

Nessuna scena di attacco, insetto con espressione minacciosa, pungiglione esposto,
goccia di veleno, badge rosso o ambiente che suggerisca presenza locale. Nessun
protocollo sanitario illustrato in questo lotto.

## Coordinamento e stato

Il blocco è stato comunicato al coordinatore e a raster_production; l’agente ha
confermato che non avvia generazioni zoologiche senza riferimenti realmente
visionati. Nessuna voce è `readyForRaster` o `readyForVector`. Per riprendere non
occorre rifare la ricerca testuale: si completa il gate fotografico e si rivede
ciascun brief.

Nessuna suite di test avviata, come richiesto dal proprietario. Solo controllo di
formato del documento/JSON, collegamento locale e diff prima del commit.
