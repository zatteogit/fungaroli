# Immagini Fungaroli — note di consegna

Base: `claude/brave-tesla-wu0a2b`, commit `834f650d5abc31eb04f2eae1e8368f008d0028a1`. Destinazione: `gpt/immagini`.
Sono aggiunti soltanto file nuovi in `incoming/`. Nessun file applicativo esistente modificato e nessuna PR.

## Icone

Il JSON del ramo di partenza contiene ora 88 taxa, non gli 83 del brief iniziale: sono compresi anche gyromitra-esculenta, amanita-pantherina, clitocybe-rivulosa, tricholoma-equestre e agaricus-xanthodermus.
30 tavole PNG con alpha trasparente, griglia 3×3: cappello, sotto, gambo. 264 tessere. Le ultime due righe della tavola 30 sono vuote; nessuna specie è stata duplicata per riempirle.
Al taglio e Sporata non sono state generate. Le tavole precedenti scartate non sono incluse.
Controllo visivo sui dati: apparato imenoforiale, colori, base, anello, volva e reticolo. Per le spugnole la sezione conserva una camera continua tra testa e gambo; Gyromitra è distinta con circonvoluzioni e più camere.
I valori null non autorizzano a disegnare un carattere come presente e non ne dimostrano l’assenza biologica.

### Campi booleani variabili o incompleti

| Taxon | Campi null omessi |
|---|---|
| `suillus` | stem_ring |
| `terreum` | stem_ring |
| `lepiota-brunneoincarnata` | stem_ring |
| `lepiota-subincarnata` | stem_ring |
| `inocybe` | stem_ring |
| `agaricus-campestris` | stem_ring |
| `coprinus-comatus` | stem_ring |
| `amanita-rubescens` | stem_volva |

### Taxa aggregati

`virescens` (Russula virescens; Russula cyanoxantha), `suillus` (Suillus luteus; Suillus granulatus; Suillus collinitus), `inocybe` (Inocybe spp.), `morchella-esculenta` (Morchella esculenta s.l.), `morchella-elata` (Morchella elata s.l.), `tricholoma-equestre` (Tricholoma equestre s.l.). Le icone mostrano una variante descritta nei dati, non tutte le varianti del gruppo.

### Lacune dei campi strutturati

Nessun taxon ha un campo stem_color. Il colore del gambo è ricavato dai check o dalle note quando esplicito; altrimenti è rappresentato in crema neutro e il limite è segnalato qui sotto.
Alveoli e cavità delle morchelle, gocce dell’idnello, testa e cavità della giromitra, verruche di alcune amanite e assenza di gambo vero della Fistulina sono descritti in check_before_picking e nelle note. Non si sostituisce un dato null con un carattere inventato.
Il modello tecnico non è esposto dal generatore integrato: nel manifest è registrato image_gen con identificatore non esposto, senza attribuirgli un nome di modello non verificato.

### Dubbi e semplificazioni per tavola

- Tavola 02: morchella-elata: stem_base null, nessuna base particolare; gambo crema neutro perché colore non esplicitato.
- Tavola 02: gyromitra-esculenta: cap_surface e stem_base null; cerebriforme/multicamera da check_before_picking e field_rules.
- Tavola 02: Tessera sotto Urnula rappresenta la superficie fertile interna della coppa, non un imenoforo inferiore inesistente.
- Tavola 03: Pseudocraterellus undulatus: cap_surface null, superficie resa senza texture inventata.
- Tavola 03: Colorazione neutra dei gambi e dei nubi non specificata nei campi strutturati.
- Tavola 04: Craterellus lutescens: cap_surface, cap_veil, stem_base null; niente superficie o base specifica aggiunta.
- Tavola 04: Hydnum rufescens: stem_base normale nei dati, ma traits_notes segnalano documentazione meno solida.
- Tavola 05: Sarcodon imbricatus: dati stem_base includono normale/assottigliata/bulbosa; adottata forma robusta non con bulbo netto.
- Tavola 05: Le squame di Sarcodon sono della cuticola, non velo; cap_veil false rispettato.
- Tavola 06: cap_veil null nelle tre specie: adottati caratteri esplicitati da check_before_picking (muscaria con verruche; caesarea e crocea senza). Le verruche di muscaria possono anche mancare.
- Tavola 06: Amanita crocea: base normale/bulbosa nei dati; illustrata volva a sacco con base non marcatamente bulbosa.
- Tavola 07: cap_veil null in tutte tre: rappresentato cappello liscio senza resti di velo, variante esplicitata nei check_before_picking.
- Tavola 07: Amanita virosa: gambo fioccoso semplificato a questa scala; nessuna texture realistica.
- Tavola 08: Amanita rubescens stem_volva null: omessa; cap_surface e cap_veil null, verruche grigiastre/rosate esplicitate in check_before_picking.
- Tavola 08: Amanita pantherina cap_veil null: verruche tipiche mostrate secondo check_before_picking, possono mancare dopo pioggia.
- Tavola 08: Chlorophyllum rhacodes cap_veil null: squame della cuticola esplicitate in traits_notes, non volva o resti di velo aggiuntivi.
- Tavola 09: lepiota-brunneoincarnata: stem_ring=null; anello omesso secondo regola true-only.
- Tavola 09: lepiota-subincarnata: stem_ring=null; anello omesso secondo regola true-only.
- Tavola 10: coprinus-comatus: stem_ring=null contrasta con check_before_picking che descrive anello mobile; anello omesso per regola true-only.
- Tavola 10: lepiota-cristata e chlorophyllum-venenatum: colore del gambo non specificato nei dati; usato crema neutro senza pattern.
- Tavola 11: edulis, pinophilus, aereus: colore del gambo non esplicitato; crema neutro sotto il reticolo descritto.
- Tavola 12: aestivalis e tylopilus-felleus: colore del gambo non esplicitato; crema neutro sotto il reticolo descritto.
- Tavola 13: rubroboletus-satanas e neoboletus-luridiformis: colore di fondo del gambo non esplicito; crema neutro sotto reticolo rosso o punti rossi descritti.
- Tavola 14: suillus: voce aggregata di S. luteus, S. granulatus e S. collinitus, stem_ring=null; anello omesso per regola true-only, non rappresenta tutte le specie del gruppo.
- Tavola 14: suillus, suillus-bovinus, imleria-badia: colore del gambo non esplicitato; crema neutro senza pattern.
- Tavola 15: virescens: voce aggregata R. virescens + R. cyanoxantha; la tavola rappresenta il carattere a placche verdi descritto per R. virescens, non tutte le varianti cromatiche del gruppo.
- Tavola 15: russula-heterophylla e russula-aeruginea: colore del gambo non esplicitato; crema neutro senza pattern.
- Tavola 16: nuda: colore del gambo non esplicitato nei traits/check/notes; crema neutro per non inventare caratteri, da verifica con dati più precisi prima di integrazione.
- Tavola 16: russula-aurea: cap_surface e stem_base null; non aggiunte texture o basi specializzate.
- Tavola 17: lactarius-deliciosus e lactarius-deterrimus: stem_base null, base resa semplice senza caratteri ulteriori; cap_surface di deterrimus null, resa senza trama inventata.
- Tavola 17: Colore esterno dei gambi dei Lactarius non presente come campo dedicato; l'arancio è ricavato dagli scrobicoli/fascia nei check. Laccaria rappresentata viola coerentemente con 'Piccola, viola intenso'; campo dedicato al colore del gambo assente.
- Tavola 17: Lactarius deterrimus: la fascia chiara descritta nei check non è resa perché, alla scala di icona, produceva un falso indizio di anello; anello assente come stem_ring=false.
- Tavola 18: terreum: stem_ring null, anello omesso secondo la regola solo true; una cortina effimera descritta nei traits_notes non è resa nell'icona.
- Tavola 18: tricholoma-pardinum: cap_veil null; disegnate squame della cuticola richieste, non verruche di velo.
- Tavola 18: Colore del gambo di terreum/pardinum non documentato esplicitamente nei dati: resa crema neutra; portentosum bianco come check.
- Tavola 19: Tutte e tre: colore esterno del gambo non indicato esplicitamente nei dati; resa crema neutra, senza aggiungere pattern.
- Tavola 19: Tricholoma virgatum: traits_notes dice bulbosa solo per prudenza, senza bulbo netto; resa solo lieve espansione basale.
- Tavola 19: Inocybe lilacina: note tassonomiche del dato distinguono potenziale taxon europeo/nordamericano; icona è sintesi dei soli caratteri del dataset, non una determinazione.
- Tavola 20: Tutte e tre: cap_veil=null, non aggiunti resti di velo sul cappello. Cortina ragnatelosa menzionata nei check omessa alla piccola scala per evitare segni che sembrassero anelli; stem_ring=false rispettato.
- Tavola 20: Colore esterno del gambo non specificato: crema neutra. Per traganus il giallo-zafferano è descritto per la carne interna e non trasferito arbitrariamente all'esterno.
- Tavola 20: Cortinarius rubellus: basi normali/bulbose/assottigliate tutte elencate; disegnata una sola variante ammessa.
- Tavola 21: Inocybe è un genere, non una specie: l'icona rappresenta una variante dei caratteri volutamente ampi del dataset e non può essere dedicata a un singolo taxon. stem_ring=null e cap_veil=null: anello e resti di velo omessi.
- Tavola 21: Cortinarius violaceus: viola scuro esteso al corpo e al gambo in base al check generale 'Viola scurissimo e vellutato'; campo separato del colore del gambo assente. Cortina fugace omessa per evitare un falso anello.
- Tavola 21: Mycena pura e Inocybe spp.: colore esterno del gambo non esplicito, crema neutra senza pattern inventati.
- Tavola 22: Limitazione di trasparenza: un angolo mantiene alpha1/255 (circa0,4% di opacità); non è stato corretto via codice. L'edit locale successivo è scartato perché cancellava il cappello di campestris.
- Tavola 22: Agaricus campestris: stem_ring=null non dimostra assenza anatomica dell'anello; omesso dal disegno per rispettare la regola di rappresentare un anello solo quando true.
- Tavola 22: Agaricus bisporus: cap_surface=null e stem_base=null, resa senza trama o caratteri basali aggiunti.
- Tavola 22: Colore esterno dei gambi non indicato con campo separato: crema neutra senza pattern inventati.
- Tavola 23: Clitocybe rivulosa: stem_base=null, resa base semplice senza caratteri basali ulteriori.
- Tavola 23: Il dataset non contiene un campo colore esterno del gambo; per Marasmius/Calocybe resa neutra crema, Clitocybe bianco come check.
- Tavola 23: Marasmius: l'elasticità del gambo è un carattere tattile e non viene certificata dall'icona; reso solo il gambo sottile completo.
- Tavola 25: galerina-marginata: cap_veil=null; non disegnati resti di velo. Il colore del gambo non è esplicito nei dati: neutro crema senza pattern aggiuntivi.
- Tavola 25: mellea e armillaria-tabescens: colore del gambo non esplicito nei dati; resa neutra crema.
- Tavola 26: pholiota-squarrosa e gymnopilus-junonius: cap_veil=null; non disegnati resti di velo, solo squame della cuticola documentate.
- Tavola 26: cyclocybe-aegerita: cap_surface=null e stem_base=null; superficie semplificata senza pattern e base neutra non specializzata.
- Tavola 26: pholiota-squarrosa, cyclocybe-aegerita e gymnopilus-junonius: colore del gambo non esplicito nei dati; neutro crema senza pattern, salvo squame Pholiota descritte.
- Tavola 27: hypholoma-fasciculare: cap_veil=null, non disegnati resti di cortina.
- Tavola 27: hypholoma-fasciculare, omphalotus-olearius e hygrophoropsis-aurantiaca: dati privi di colore esplicito del gambo, resa neutra crema; da validare micologicamente.
- Tavola 27: omphalotus-olearius: cap_surface include squamosa per prudenza, ma traits_notes precisa fibrille innate, non vere squame: resa liscia senza squame inventate.
- Tavola 28: agaricus-sylvicola: cap_surface=null: cappello semplificato senza pattern inventati.
- Tavola 28: entoloma-sinuatum: squamosa presente per prudenza, ma traits_notes descrive fibrille innate: superficie semplificata senza vere squame.
- Tavola 28: Colore del gambo non codificato esplicitamente: resa neutra crema senza pattern aggiuntivi.
- Tavola 29: pleurotus-ostreatus e pleurotus-cornucopiae: cap_surface=null, superficie semplificata senza pattern; cornucopiae stem_base=null, base non specializzata.
- Tavola 29: Colori dei gambi non espliciti nei dati: neutro crema coerente con parti chiare, da validare.
- Tavola 30: fistulina-hepatica: cap_shape e stem_base null; forma a lingua e assenza di gambo ricavate testualmente da check_before_picking.
- Tavola 30: Righe inutilizzate prive di soggetti; file nativo contiene qualche pixel quasi trasparente con alpha=1/255 anche nelle aree vuote, non visibile a schermo. Nessuna soglia o ritocco applicati.
- estate/sereno: Foto originale600x450: il ridimensionamento richiesto a1600px non aggiunge dettaglio fotografico.

## Luoghi — stagione × meteo

Vallonina approvata da Matteo; primavera-sereno rigenerata dalla foto reale e verificata in sovrapposizione 50% e con bordi rosso/ciano, senza registrazione/deformazione, prima del caricamento. La versione precedente con inquadratura troppo larga è sostituita. Autorizzata la prosecuzione delle altre sei zone senza ulteriori approvazioni.

Ogni zona ha 17 combinazioni: quattro stagioni × sereno/nuvoloso/nebbia/pioggia, più inverno-neve. La quota massima nei bands autorizza inverno-neve ma non il manto uniforme nel paesaggio: si applica la correzione di Matteo descritta sotto. Nevicata in corso solo in inverno-neve. Nessuna generazione da zero per le otto zone prive di foto.

| Zona | Combinazioni | Generate | Foto reale riusata | Dimensioni |
|---|---:|---:|---|---|
| vallonina | 17 | 16 | estate-sereno | 1600×1200 |
| poggio-cantalice | 17 | 16 | primavera-nuvoloso | 1600×1200 |
| antrodoco | 17 | 17 | nessuna: stagione non riconoscibile con certezza | 1600×1198, 1600×1199, 1600×1200 |
| cicolano | 17 | 16 | estate-sereno | 1600×481, 1600×482, 1600×483 |
| laga | 17 | 16 | estate-sereno | 1600×1200 |
| rascino | 17 | 16 | estate-sereno | 1200×1600 |

Zone ancora in lavorazione: tancia.

Ogni variante deriva dalla foto originale della propria zona, mai da una variante generata. I confronti in sovrapposizione controllano inquadratura, scala e riferimenti fissi; i casi rigenerati e gli eventuali limiti sono registrati sotto. Le immagini restano trasformazioni generate, non fotografie reali della stagione/meteo mostrati. La sorgente di Vallonina misura600×450: singoli alberi, foglie e dettagli fini ricostruiti non possono essere certificati identici alla fonte. Nessun ritaglio o deformazione è usato per mascherare derive di inquadratura.

### Attribuzioni e licenze

| Zona | Autore originale | Licenza applicata | Pagina della foto |
|---|---|---|---|
| vallonina | Idéfix | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Commons](https://commons.wikimedia.org/wiki/File:SelladiLeonessa001.jpg) |
| poggio-cantalice | Li vioandronico2013 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Terminillo.JPG) |
| antrodoco | Iacopo.rossini | [Pubblico dominio (PD-self)](https://commons.wikimedia.org/wiki/Template:PD-self) | [Commons](https://commons.wikimedia.org/wiki/File:Monte_Giano_DVX.JPG) |
| cicolano | Alessandro Blasi from Rieti, Italy | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Lago_del_Salto%21%21_%287447648144%29.jpg) |
| laga | Mario1952 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Pizzo_di_Sevo.jpg) |
| rascino | Sabina Trekking ASD | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Rascino.jpg) |
| tancia | Christoph Strässler | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [Commons](https://commons.wikimedia.org/wiki/File%3ABeech_Forest_in_the_Sabina_Hills%2C_Latium%2C_Italy_-_52993979506.jpg) |

Antrodoco: Commons identifica Iacopo.rossini e il rilascio in pubblico dominio PD-self; data/media-zones.json riporta invece DVX (Wikimedia Commons) e CC0. Nel manifest si applicano i crediti verificati sulla pagina originale, senza modificare quel JSON. Verifica: https://commons.wikimedia.org/w/index.php?title=File:Monte_Giano_DVX.JPG&oldid=1119478106 . La data EXIF non basta a rendere riconoscibile la stagione: nessuna combinazione è etichettata reale=true arbitrariamente.

Cicolano: autore Alessandro Blasi from Rieti, Italy, CC BY2.0; anche le derivate sono CC BY2.0 con attribuzione e indicazione delle modifiche, senza trasformare la licenza in BY-SA. Verifica: https://commons.wikimedia.org/w/index.php?title=File:Lago_del_Salto!!_(7447648144).jpg&oldid=988400961 .

Le derivate delle foto CC BY-SA restano sotto la corrispondente CC BY-SA; per Vallonina, tra le opzioni della fonte, è scelta CC BY-SA3.0. Attribuzione, pagina originale, link di licenza e modifiche sono ripetuti nelle righe del manifest. Antrodoco conserva il riferimento al pubblico dominio della fonte.

### Dubbi, confronti e limiti delle copertine

- vallonina/estate-sereno: Foto originale600x450: il ridimensionamento richiesto a1600px non aggiunge dettaglio fotografico.
- antrodoco/primavera-nebbia: La nebbia vela parti del crinale e delle rupi, quindi la verifica di corrispondenza riguarda le parti visibili.
- antrodoco/estate-nebbia: La nebbia vela parti del crinale e delle rupi, quindi la verifica di corrispondenza riguarda le parti visibili.
- antrodoco/autunno-nebbia: La nebbia vela parti del crinale e delle rupi, quindi la verifica di corrispondenza riguarda le parti visibili.
- cicolano/inverno-sereno: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/inverno-sereno: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/inverno-nuvoloso: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/inverno-nuvoloso: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/inverno-nebbia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/inverno-nebbia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/inverno-pioggia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/inverno-pioggia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/inverno-neve: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/inverno-neve: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/primavera-sereno: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/primavera-sereno: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/primavera-nuvoloso: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/primavera-nuvoloso: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/primavera-nebbia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/primavera-nebbia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/primavera-pioggia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/primavera-pioggia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/estate-nuvoloso: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/estate-nuvoloso: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/estate-nebbia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/estate-nebbia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/estate-pioggia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/estate-pioggia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/autunno-sereno: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/autunno-sereno: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/autunno-nuvoloso: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/autunno-nuvoloso: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/autunno-nebbia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/autunno-nebbia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.
- cicolano/autunno-pioggia: Il generatore limita il rapporto della tela a circa 3:1. Il panorama integrale è stato generato dentro la tela con fasce bianche esterne, poi estratto rimuovendo solo tali fasce. Il lato corto può differire di un pixel per gli arrotondamenti; nessuna deformazione applicata.
- cicolano/autunno-pioggia: La QA visiva conferma inquadratura e punti di riferimento alla scala del panorama; non certifica identità pixel per pixel dei dettagli fini generati di foglie, tetti o strutture lontane.

Controllo incrociato indipendente: Poggio-Cantalice/Tancia (34 immagini) e Laga/Rascino/Antrodoco (51 immagini), incluse le piogge a scala1:1; nessun problema materiale rilevato dopo le correzioni. Rascino: nebbia e nevicata invernali rigenerate per uno spostamento di cima/riva. Tancia: tre prime piogge scartate e rigenerate con precipitazione più leggibile.

Arrotondamenti senza deformazione: Antrodoco ha lato corto1198–1200px rispetto ai1199px della fonte. Cicolano mantiene il panorama intero con lato corto481–483px rispetto ai482px della fonte: il generatore usa un contenitore con fasce neutre sopra/sotto, che vengono estratte senza tagliare paesaggio; segue il solo ridimensionamento proporzionale. Le prove con proporzioni più lontane sono scartate. Quindi il rapporto non è identico al singolo pixel, mentre inquadratura e riferimenti fissi sono confrontati per sovrapposizione.

Tancia: il WebP effettivo della fonte è1600×900; eventuali dimensioni maggiori riportate nei metadati non aggiungono dettaglio alla copia disponibile.

Il controllo finale decodifica ogni WebP completo e confronta byte per byte la sua bozza. Alcuni file locali erano risultati vuoti dopo un salvataggio precedente: sono stati ripristinati dalle bozze integre o dai PNG selezionati e ricontrollati prima della pubblicazione.

Cicolano: controllo indipendente dei17 finali e delle16 sovrapposizioni generate. Primavera-pioggia rigenerata dalla foto originale dopo il riscontro di precipitazione troppo poco leggibile; la nuova versione passa anche il controllo a600px e nei ritagli a scala nativa. Otto tentativi scartati in totale: sette per proporzioni/fasce del panorama e uno per la leggibilità della pioggia. Nessuna variante mancante.

# Foto candidate da Wikimedia Commons per le otto zone senza foto

Ricerca del 14 ottobre 2026. Nessuna immagine generata per queste zone.

Autori, licenze, date e descrizioni sono stati verificati sulle pagine file di Wikimedia Commons. **La stagione della data non è una verifica della stagione visibile.** Le anteprime remote non hanno consentito una verifica visiva diretta in questa sessione: dove non esplicitata da titolo/descrizione, la stagione visibile è lasciata non verificata. I candidati sono da selezionare e controllare, non copertine pronte.

## terminillo-ovest

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Via Terminillese a Pian de' Rosce 01.jpg](https://commons.wikimedia.org/wiki/File:Via_Terminillese_a_Pian_de'_Rosce_01.jpg) | Alessandro Antonelli | [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/) | 2011-07-27 | Non verificata visivamente; data estiva | Località Pian de' Rosce confermata dalla descrizione; contiene strada. Verificare assenza di veicoli/persone e qualità del ritaglio. |
| [Monte Terminillo 1696m (6225656835).jpg](https://commons.wikimedia.org/wiki/File:Monte_Terminillo_1696m_(6225656835).jpg) | albularider | [CC BY 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) | 2008-04-03T10:03:00 | Non verificata visivamente; data primaverile | Panorama dei Monti Reatini dall'anello di Campoforogna, dentro il raggio indicativo di entrambe le zone Terminillo; vista più alta delle quote sintetiche bands. |
| [Monte Terminillo in autunno (1917394363).jpg](https://commons.wikimedia.org/wiki/File:Monte_Terminillo_in_autunno_(1917394363).jpg) | Alessandro Blasi | [CC BY 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) | 2007-10-28T16:28:00 | Autunno dichiarato nel titolo e nella descrizione 'Autumn's colors'; visione diretta non completata | Terminillo certo, versante/Pian de' Rosce non precisati: candidato di riserva, geografia da confermare. |

## terminillo-est

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Terminillo, Cinque Confini (8106430443).jpg](https://commons.wikimedia.org/wiki/File:Terminillo,_Cinque_Confini_(8106430443).jpg) | Simone Tagliaferri | [CC BY 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) | 2012-10-20T16:52:00 | Non verificata visivamente; data autunnale | Cinque Confini confermato: campo d'altura Enrico Leoncini con pista di atletica. Panorama molto largo: adatto se edifici/impianti sono accettabili. |
| [Monte Terminillo 1696m (6225656835).jpg](https://commons.wikimedia.org/wiki/File:Monte_Terminillo_1696m_(6225656835).jpg) | albularider | [CC BY 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) | 2008-04-03T10:03:00 | Non verificata visivamente; data primaverile | Condivide il candidato con Terminillo ovest perché la posizione di scatto ricade nei raggi di entrambe le zone; panorama dall'anello vicino a Cinque Confini, non bosco sul Monte Bove. |

## cittareale

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Monte Pozzoni (Cittareale-Rieti).jpg](https://commons.wikimedia.org/wiki/File:Monte_Pozzoni_(Cittareale-Rieti).jpg) | Skylimitless | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2016-08-12 | Non verificata visivamente; data estiva | Vista della vetta dalla Valle Falacrina di Cittareale. Usare solo versione corrente: la cronologia specifica che una precedente mostrava Monte Prato. Qualità limitata. |
| [Monte Pozzoni.jpg](https://commons.wikimedia.org/wiki/File:Monte_Pozzoni.jpg) | Sentruper | Pubblico dominio (PD-user) | 2010-04-03T18:18:00 | Non verificata visivamente; data primaverile | Vetta del Monte Pozzoni; data di scatto da descrizione ed EXIF. Il campo Date è la data di upload, non di scatto. Punto di vista non georeferenziato. |

## pescorocchiano

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Leofreni RIETI.JPG](https://commons.wikimedia.org/wiki/File:Leofreni_RIETI.JPG) | Pescorocchiano | [CC BY-SA 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/) | 2011-04-19T17:56:30 | Non verificata visivamente; data primaverile | Leofreni esplicitamente incluso nella zona; panorama del paese, da controllare quanto bosco resti visibile. |
| [Grotte di Val de' Varri.jpg](https://commons.wikimedia.org/wiki/File:Grotte_di_Val_de'_Varri.jpg) | Marica Massaro | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2019-10-13T10:55:56 | Non verificata visivamente; data autunnale | Accesso alle grotte nel comune di Pescorocchiano; località distinta da Leofreni/Pace e corrispondenza al raggio da verificare. Candidato di riserva. |

## malito

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Corvaro.jpg](https://commons.wikimedia.org/wiki/File:Corvaro.jpg) | Marica Massaro | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2018-10-26T15:07:51 | Non verificata visivamente; data autunnale | Veduta del borgo vecchio di Corvaro, paese d'accesso della zona. NON conferma la Valle di Malito e NON è una foto di bosco: candidato debole, solo contesto territoriale. |
| [Corvaro di Borgorose.jpg](https://commons.wikimedia.org/wiki/File:Corvaro_di_Borgorose.jpg) | Marica Massaro | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2018-10-26T15:11:03 | Non verificata visivamente; data autunnale | Scorcio urbano verticale del borgo vecchio di Corvaro: NON conferma Valle di Malito, NON bosco e poco adatto a copertina orizzontale. Nessun secondo candidato forestale verificato trovato. |

## sangiovanni

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Monte San Giovanni .jpg](https://commons.wikimedia.org/wiki/File:Monte_San_Giovanni_.jpg) | Fabrizio Mei | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2018-12-02T16:17:00 | Non verificata visivamente; data invernale meteorologica / autunnale astronomica | Panorama aereo di Monte San Giovanni in Sabina; punto di ripresa circa al limite meridionale del raggio 3 km, più urbano della zona Cerchiara-Piediserre. |
| [Cerchiara, Rieti (8611592358).jpg](https://commons.wikimedia.org/wiki/File:Cerchiara,_Rieti_(8611592358).jpg) | Simone Tagliaferri | [CC BY 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) | 2013-04-01T11:28:00 | Non verificata visivamente; data primaverile | Cerchiara, frazione di Rieti, esplicitamente nominata nei dati della zona. Verificare paesaggio e ritaglio. |

## leonessa

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Leonessa panorama alto.jpg](https://commons.wikimedia.org/wiki/File:Leonessa_panorama_alto.jpg) | Jonny231089 | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2020-12-13T10:28:58 | Non verificata visivamente; data invernale | Panorama alto di Leonessa, territorio corretto ma copertura delle faggete a sud del paese non documentata. Contiene abitato. |
| [Panoramica bassa ponte leonessa.jpg](https://commons.wikimedia.org/wiki/File:Panoramica_bassa_ponte_leonessa.jpg) | Jonny231089 | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2020-12-13T10:27:23 | Non verificata visivamente; data invernale | Secondo panorama di Leonessa, distinto dal panorama alto ma stessa uscita. Verificare faggete e assenza di persone/veicoli nel crop. |
| [SelladiLeonessa001.jpg](https://commons.wikimedia.org/wiki/File:SelladiLeonessa001.jpg) | Idéfix | [CC BY-SA 3.0 Unported (opzione scelta; disponibili anche CC BY-SA 2.5/2.0/1.0 e GFDL)](https://creativecommons.org/licenses/by-sa/3.0/) | 2006-07 | Non verificata visivamente; data estiva | Versante leonessano del Terminillo visto da est: paesaggio montano pertinente ma Sella di Leonessa è distinta dalla zona di faggete nord e risoluzione insufficiente per 1600 px. Candidato di riserva, sconsigliato. |

## domo

| Foto | Autore | Licenza | Data di scatto | Stagione visibile / evidenza | Idoneità e geografia |
|---|---|---|---|---|---|
| [Panorama della Conca di Amatrice vista dal Lago di Scandarello.jpg](https://commons.wikimedia.org/wiki/File:Panorama_della_Conca_di_Amatrice_vista_dal_Lago_di_Scandarello.jpg) | Silvio sorcini | [CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) | 2012-02-26T12:32:28 | Non verificata visivamente; data invernale | Scandarello/Conca di Amatrice sono vicini a Domo ma la foto NON documenta Domo né i suoi castagneti. Solo candidato territoriale di riserva, geografia da confermare. |
| [SS4 innevata 19 - svincolo di Amatrice.png](https://commons.wikimedia.org/wiki/File:SS4_innevata_19_-_svincolo_di_Amatrice.png) | Maria Serena Peterlin | [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/) | 2004-01 | Inverno con neve dichiarata nel titolo e nella fonte video; visione diretta non completata | Fotogramma reale estratto da video sulla Salaria, non fotografia autonoma. Svincolo Amatrice e area Domo da verificare; contiene strada e possibile segnaletica. NON copertina pronta. Nessuna foto esatta di Domo verificata. |

## Lacune da riportare in NOTE.md

- Valle di Malito: non trovate 2 foto forestali certe; i due candidati di Corvaro sono urbani e deboli.
- Domo: non trovate foto esatte; due candidati di area Amatrice/Scandarello solo territoriali, da confermare.
- Leonessa: panorami urbani corretti ma faggete e raggio specifico non confermati.
- Tutte le stagioni visibili prive di dichiarazione nel titolo/descrizione restano da verificare visivamente.



## Correzione neve decisa da Matteo

Dove la foto comprende valle o fondovalle (paesi, piana, campi, versanti bassi), il manto nevoso sta solo sulle cime e sui versanti alti. Fondovalle, paesi, piana e primo piano basso restano senza manto: alberi spogli, prati secchi o brina e cielo invernale. In inverno-neve la precipitazione cade anche davanti alla camera, ma in basso resta al massimo un velo non coprente, con terreno/erba ancora visibili.

La regola sostituisce la precedente interpretazione del solo bands massimo. Si rigenerano tutte e cinque le condizioni invernali di Poggio-Cantalice, Antrodoco, Cicolano e Laga; per Tancia il bosco in primo piano viene trattato come versante basso con lettiera/rocce visibili e brina, senza inventare cime innevate fuori inquadratura. Vallonina e Rascino restano come approvate, poiché il primo piano è già in quota.

Inverni ancora da correggere: cicolano, laga, tancia. Le versioni precedenti sono segnate da rifare in STATO fino alla sostituzione. I controlli della prima consegna si riferiscono alla regola precedente; ogni nuova invernale viene ricontrollata su inquadratura e limite della neve prima della pubblicazione.
