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

119 combinazioni locali complete: 7 zone × 17 combinazioni (quattro stagioni × sereno/nuvoloso/nebbia/pioggia, più inverno-neve). 113 derivate generate e 6 foto reali riutilizzate. Nevicata in corso soltanto in inverno-neve. Le otto zone senza foto non ricevono immagini generate da zero; i 18 candidati Commons restano nel capitolo dedicato.

| Zona | Combinazioni | Generate | Foto reale riusata | Dimensioni finali |
|---|---:|---:|---|---|
| vallonina | 17 | 16 | estate-sereno | 1600×1200 |
| poggio-cantalice | 17 | 16 | primavera-nuvoloso | 1600×1200 |
| antrodoco | 17 | 17 | nessuna: stagione della fonte non certa | 1600×1198; 1600×1199; 1600×1200 |
| cicolano | 17 | 16 | estate-sereno | 1600×480; 1600×481; 1600×482; 1600×483 |
| laga | 17 | 16 | estate-sereno | 1600×1200 |
| rascino | 17 | 16 | estate-sereno | 1200×1600 |
| tancia | 17 | 16 | primavera-sereno | 1600×900 |

Ogni derivata parte dalla fotografia originale della propria zona. La camera, il campo inquadrato, la scala e i riferimenti fissi sono stati confrontati nelle verifiche registrate nei sidecar. Le immagini generate sono trasformazioni della fonte e non fotografie reali delle condizioni mostrate. Vallonina è stata approvata da Matteo; primavera-sereno è stata rigenerata dalla foto originale, sostituendo la versione troppo larga, e verificata prima del caricamento con overlay al 50% e bordi rosso/ciano: scala, crinale e rupi allineati.

### Stato del caricamento

119 foto e relative bozze sono contrassegnate ok/caricate nel manifest e in STATO. La lista di consegna include tutte le 301 risorse in incoming.

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

Antrodoco: la pagina Commons identifica Iacopo.rossini e il rilascio in pubblico dominio PD-self. Il manifest corregge i crediti senza modificare data/media-zones.json, che riportava DVX/CC0. La stagione non è stabilita dalla sola data EXIF: nessuna variante Antrodoco è etichettata reale=true. Cicolano e relative derivate mantengono CC BY 2.0, con autore Alessandro Blasi from Rieti, Italy e indicazione delle modifiche. Le altre derivate CC BY-SA mantengono la corrispondente licenza; per Vallonina, tra le opzioni della fonte, è scelta CC BY-SA 3.0. Attribuzione completa e modifiche sono ripetute in ogni record luogo.

### Recupero dei prompt e limiti delle verifiche

62 prompt generativi integrali non sono stati recuperati dopo il reset. Per quelle righe prompt_originale_recuperato=false e il testo inizia con “Prompt originale non recuperato dopo il reset. Specifica di riferimento ricostruita dal brief:”. Si tratta di specifiche ricostruite e dichiarate, non di trascrizioni del prompt originario. Gli altri prompt generativi recuperati sono conservati esattamente; quello corretto di Vallonina primavera-sereno proviene dal transcript della rigenerazione. Per le 6 fotografie reali il modello è null e il prompt descrive soltanto riuso, resize o conversione/copia, senza prompt generativo applicabile.

Le QA recuperate descrivono i controlli svolti prima della pubblicazione, documentati in NOTE e nei transcript; il recupero dei metadati non costituisce una nuova sovrapposizione. Le 25 nuove invernali di Poggio-Cantalice, Antrodoco, Cicolano, Laga e Tancia riportano le verifiche della regola neve corretta nei rispettivi sidecar. Il builder esegue soltanto decodifica, verifica delle dimensioni e confronto byte per byte tra finale e bozza.

I confronti controllano inquadratura, scala e riferimenti visibili; non certificano identità pixel per pixel di foglie, rami minuti, tetti o strutture lontane ricostruiti dal generatore. La nebbia può velare crinali e rupi: il confronto riguarda le parti visibili. La fonte Vallonina è 600×450 e il resize a 1600×1200 non aggiunge dettaglio fotografico. La fonte Tancia disponibile è effettivamente 1600×900.

Cicolano conserva il panorama integrale: dove necessario il paesaggio è stato generato in un contenitore con fasce esterne, poi sono state rimosse soltanto le fasce, senza tagliare paesaggio, seguito da resize proporzionale. Gli arrotondamenti del lato corto possono differire fino a 2 px; il rapporto non è identico al singolo pixel. Non è stata applicata deformazione per nascondere derive. Anche Antrodoco presenta arrotondamenti proporzionali del lato corto; le dimensioni effettive sono riportate nel manifest.

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

La quota massima nei bands autorizza inverno-neve, ma non il manto uniforme nel paesaggio. Dove la foto comprende valle o fondovalle (paesi, piana, campi e versanti bassi), la neve al suolo resta solo sulle cime e sui versanti alti. Fondovalle, paesi, piana e primo piano basso restano senza manto: alberi decidui spogli, prati secchi, terra visibile o brina e cielo invernale. In inverno-neve la precipitazione cade anche davanti alla camera, ma in basso resta al massimo un velo non coprente, con erba e terreno ancora visibili. Nevicata in corso solo nella condizione inverno-neve; inverno-pioggia richiede precipitazione liquida leggibile.

Sono state rigenerate e verificate tutte le cinque condizioni invernali di Poggio-Cantalice, Antrodoco, Cicolano, Laga e Tancia: 25 immagini. In Tancia il bosco in primo piano è trattato come versante basso con lettiera, rocce e terreno visibili, eventuale brina e senza inventare cime innevate fuori inquadratura. Vallonina e Rascino restano come approvate, perché il primo piano è già in quota e può essere innevato. Questa regola sostituisce la precedente interpretazione basata sul solo bands massimo.

## Varianti colore — completamento 15/10/2026

Tutte le 88 basi sono dichiarate nel manifest con i valori del brief. Per `fistulina-hepatica`, base colore `rosso`: la colonna forme del brief è «—», quindi il campo `base.forma` è omesso senza inventare un valore. Le varianti rosa e bruno conservano la sagoma approvata.

Completati tutti i 141 colori (282 icone). Le due forme di phalloides già caricate restano **in attesa delle fasi**; nessuna nuova forma. Le celle segnalate di varianti-03 (1) e varianti-05 (0, 3, 6) sono state rigenerate con contorni completi. Coprinus comatus: gambo con anello basso in `icone/tavola-10-anello.png`, cella 5; le altre otto icone della tavola base hanno indici espliciti nel manifest.

QA ripetibile e hash delle tavole in `bozze/verifica_varianti.py` e `bozze/VERIFICHE-varianti.json`. Nessun pixel con alpha>0 nelle fasce esterne di 42 px di ogni cella delle tavole varianti; contorno scuro su tutti i pixel estremi della sagoma alpha≥128, più verifica visiva.


## Integrazione 15/10 — foglia composta palmata

- `icone-alberi/tavola-alberi-08.png`: sette foglioline allungate disposte a ventaglio, unite nello stesso punto in cima al picciolo lungo. Nervature secondarie omesse, dentatura semplificata per la scala d'icona.
- Generazione integrata image_gen; identificatore del modello non esposto. Riferimento di stile: tavola-alberi-02. Usata la prima correzione generata; i successivi tentativi di riposizionamento sono scartati.
- Esportazione tecnica: sagoma completa prelevata con 2px oltre il riquadro alpha>=8 e traslata senza ridimensionamento nella cella0; residui quasi trasparenti del fondo esterni a quel riquadro esclusi. Non sono stati ridisegnati contorni, foglioline o picciolo.
- QA codice: RGBA1254×1254; 9celle418px, fasce42px completamente alpha0; celle1–8 completamente alpha0. Sagoma alpha>=128: x102–313,y86–331; contorno bruno scuro su prima/ultima riga/colonna. Rapporto in `incoming/qa/2026-10-15-alberi-08.json`.


## Timbri — primo esempio da verificare

- `timbri/alberi-faggeta.png`: primo esempio, non approvato. PNG512×512 con due anelli, foglia di faggio e cupola aperta a4valve con2semi angolari. Un inchiostro verde, con lievi variazioni tonali del generatore; nessun secondo colore per il contorno. È una sintesi didattica, non una foto o una chiave di identificazione.
- Nervature ridotte a pochi segni; spine minute della cupola omesse per leggibilità. Quattro valve mantenute; semi semplificati. Al64px il frutto è piccolo: valutare la leggibilità con Matteo prima degli altri8timbri.
- Esportazione proporzionale dell'intero timbro a400px, centrato nel PNG512px, senza ridisegnare la morfologia. Rimossi solo residui di fondo esterni al riquadro del soggetto. Fasce52px alpha0, nessun taglio; primo/ultimo pixel opaco dei4estremi nello stesso inchiostro verde.
- Anteprima alle dimensioni reali64,84,112px su carta chiara e sfondo scuro in `incoming/bozze/timbri/alberi-faggeta-verifica.png`; rapporto QA in `incoming/qa/2026-10-15-timbro-faggeta.json`.
- STOP richiesto dall'ordine di lavoro e dal brief timbri: caricato l'esempio, si attende la verifica di Matteo. Altri8timbri e parti A/B/C del glossario/guide/infografiche non avviati.
\n\n## Continuazione — approvazioni e correzioni di Matteo\n\nFoglia composta palmata approvata. Per i timbri è approvato lo stile del primo Faggeta (inchiostro unico, doppio anello,64–112px), non il soggetto originale: foglia/frutto corretti sotto. Superato lo STOP della prima consegna: gli altri8timbri sono autorizzati senza ulteriori soste; prossima verifica al primo esempio del glossario. Le righe precedenti descrivono la prima consegna e vanno lette con questo aggiornamento.\n

### alberi-faggeta — 15/10, continuazione

Soggetto corretto: foglia ovale-ellittica a margine intero, nervature laterali quasi rettilinee e parallele, picciolo corto dentro l'anello; cupola aperta con4valve a brevi aculei e una faggiola triangolare. Fonti interne: data/trees.json: faggio.leaf,fruit,recognize; correzioni di Matteo del15/10. Aculei ridotti a pochi segni esterni, volume delle valve sintetizzato; non è una chiave botanica. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/alberi-faggeta-verifica.png.


### bosco-querce — 15/10, continuazione

Foglia lobata arrotondata e ghianda con cupola continua a squame appressate, riferimento roverella. Fonti interne: data/trees.json: roverella.leaf,fruit,recognize; data/challenges.json: bosco-querce. Peluria omessa, squame della cupola sintetizzate; non rappresenta tutte le querce della sfida. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/bosco-querce-verifica.png.


### bosco-carpino-nero — 15/10, continuazione

Foglia ovato-lanceolata acuminata dentata e infruttescenza pendula di sacche membranose simili al luppolo; peduncolo staccato dall'anello. Fonti interne: data/trees.json: carpino nero.leaf,fruit,recognize; data/challenges.json: bosco-carpino-nero. Numero di nervature e denti secondari ridotto per la scala; nucule interne non visibili nelle sacche chiuse. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/bosco-carpino-nero-verifica.png.


### margini-radure — 15/10, continuazione

Rametto di biancospino con due foglie lobate, spine e tre piccoli pomi, accenno di prato alla base. Fonti interne: data/plants.json: biancospino.recognize; data/challenges.json: margini-radure. Nervature e particolari del seme omessi; nessun fiore mescolato ai frutti. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/margini-radure-verifica.png.


### funghi-sosia — 15/10, continuazione

Due funghi generici affiancati simili ma diversi per profilo e segni sul cappello, sagome intere. Fonti interne: docs/handoff-immagini-timbri.md: funghi-sosia; data/challenges.json: funghi-sosia.intro,questions. Pittogrammi non attribuiti a specie, nessun verdetto di commestibilità; dettagli tassonomici omessi perché il brief richiede un simbolo generico. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/funghi-sosia-verifica.png.


### querce-faggio-carpini — 15/10, continuazione

Confronto di due foglie intere: faggio a bordo intero a sinistra e carpino bianco dentato a destra, nervature parallele e piccioli corti. Fonti interne: data/trees.json: faggio.leaf,fruit,recognize; carpino bianco.leaf,fruit,recognize; data/challenges.json: querce-faggio-carpini. Frutti omessi come previsto dal brief; denti secondari del carpino e pieghe della lamina minuti alla scala64px, confronto concentrato sul bordo intero rispetto a quello dentato. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/querce-faggio-carpini-verifica.png.


### erbe-fiori-simili — 15/10, continuazione

Ombrella composta generica con cinque raggi principali e ombrellette terminali, nessuna attribuzione a una specie. Fonti interne: data/plants.json: cicuta.recognize; finocchietto.recognize; data/challenges.json: erbe-fiori-simili; docs/handoff-immagini-timbri.md: erbe-fiori-simili. Fiori ridotti a gruppi di punti; bianco dei fiori non riprodotto perché il timbro usa un unico inchiostro; foglia di contesto fortemente semplificata, non diagnostica. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/erbe-fiori-simili-verifica.png.


### fioriture-primavera — 15/10, continuazione

Primula con rosetta basale di foglie oblunghe dentellate, fiore a cinque lobi su peduncolo nudo; germoglio separato. Fonti interne: data/plants.json: primula.recognize; data/challenges.json: fioriture-primavera. Rugosità ridotta a poche incisioni, un solo fiore; gradazione gialla del fiore omessa per rispettare l'inchiostro unico. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/fioriture-primavera-verifica.png.


### colori-autunno — 15/10, continuazione

Due foglie separate in caduta: faggio ovale a bordo intero e acero campestre con lobi palmati arrotondati; inchiostro ruggine arancio. Fonti interne: data/trees.json: faggio.leaf,fruit; acero campestre.leaf,fruit,recognize; data/challenges.json: colori-autunno. Scelte due foglie invece di tre per leggibilità; frutti e nervature minute omessi, nessun gradiente di colore per rispettare l'inchiostro unico. PNG e QA verificati prima del caricamento; anteprima64/84/112px sui due temi in incoming/bozze/timbri/colori-autunno-verifica.png.


## Glossario — esempio Cappello

Fungo generico senza attribuzione a specie, cappello evidenziato e gambo spento. Dettagli diagnostici omessi per isolare il concetto. Esempio in attesa di approvazione; altri schemi, guide e infografiche non avviati. Prosegue l’ordine aggiornato 07c27ee: combinazioni della falloide e forme del cappello.


Combinazioni-01: 4 colori × emisferico; gambo bianco, anello e volva a sacco conservati. Export proporzionale del soggetto completo, senza ricolore automatico. Otto celle usate, cella8 vuota per rispettare le due tavole previste.


Combinazioni-02: piano maturo con profilo molto basso; invariati gambo bianco, anello e volva a sacco. Rigenerata una bozza troppo convessa; nessuna modifica automatica della forma.


Forme-01: colori base e caratteri del gambo conservati; varianti di forma e proporzioni di età.


Forme-02: confrontate alle basi; verna/virosa con volva a sacco aperta, pantherina con anello liscio e base bordata; corretti i trasferimenti di caratteri tra righe nelle bozze.


Tavola porcini forme03 completata e controllata: aereus emisferico/piano, aestivalis emisferico. Autorizzazione esplicita di Matteo a caricare su gpt/immagini. Restano approvate e intatte forme01/02. Cappello approvato; priorità corrente glossario e poi esempio guide.


Glossario gruppo1: forme generiche senza attribuzione a specie; gambo arancio su cappello spento, umbone centrale evidenziato, imenoforo lamellare evidenziato in vista inferiore/sezione. Margini103px alpha0 e contorno scuro ai4estremi verificati; nessun testo.


Glossario: anello, volva, micelio. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


Glossario: ifa, spora, sporata. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


Glossario: micorriza, cespitoso, lobi. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


Glossario: seghettato, gemme, aghi. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


Glossario: ceppaia, pollone, segnavia. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


Glossario: dislivello, esposizione. Schemi didattici generici conformi alle definizioni; dettagli non pertinenti omessi, nessuna etichetta o identificazione di specie. Margini103px alpha0, contorno scuro ai4estremi e verifica visiva; nessun testo.


ParteA completata: tutti21schemi (Cappello già approvato) in incoming/glossario, controllati e caricati in gruppi di2–3. Esempio parteB leggere-il-bosco1600x900 su carta: tronchi grigi lisci, lettiera, piccoli funghi generici, luce laterale; chiome e vegetazione semplificate per un’apertura editoriale, non per identificazione botanica. Soggetti interi, contorni e margini verificati. In attesa dell’approvazione di Matteo: non avviate le altre2guide né le infografiche. Forme del cappello rimanenti in coda; forme01/02 intatte, forme03porcini consegnata.

Ripresa del programma: recuperate le chat “Genera due immagini”, “Completa immagini GitHub” e “Infografica Caesarea GitHub”. Le guide sono già consegnate. Caesarea corretta con un nuovo edit mirato: carne interna bianca, senza cambiare lamelle gialle. L’originale resta conservato. Verifica visiva illustrativa, non validazione micologica.

mellea: Cespo su legno, cappelli miele con squamette centrali, sporata bianca sulle superfici superiori dei cappelli bassi, anelli membranosi, gambi fibrosi e rizomorfe nere. Sezione bianca; lamelle crema leggermente decorrenti. Galerina più piccola, liscia, bruno-ocra con parti ruggine. Corretti margini e scaglie troppo evidenti sui gambi. Nessun testo; blocco inferiore destro libero. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

procera: Procera con zigrinature trasversali, anello doppio spesso, umbone centrale bruno liscio, squame concentriche, base arrotondata senza volva; sezione bianca e gambo cavo, lamelle libere con collarino. Lepiota piccola con gambo corto, senza anello scorrevole, proporzione circa 1:5. Corretto umbone inizialmente squamoso e aumentati i margini, circa 6% o più. Nessun testo, blocco inferiore destro libero. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

edulis: Pori piccoli chiari, bianchi nel giovane e crema/giallo-oliva nell’adulto; reticolo bianco nella parte alta del gambo robusto, cappello castano con orlo chiaro. Sezione bianca senza viraggio. Boleto satana distinto: cappello biancastro, pori e reticolo rossi, gambo bulboso, carne azzurrata. Anello e volva assenti, margini liberi, nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

pinophilus: Cappello mogano opaco, gambo robusto con reticolo chiaro, pori chiari e bianchi nel giovane; carne bianca con fascia vinosa sotto cuticola. Piede rosso con pori rossi, puntinatura senza reticolo e carne gialla/azzurrata. Nessun anello/volva, margini conservati, nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

aereus: Cappello bruno-nerastro opaco, pori chiari, sezione bianca uniforme senza fascia vinosa. Reticolo fine chiaro in alto che sfuma sul gambo ocra; la tinta brunita della rete in basso resta poco distinta e viene segnalata per revisione. Piede rosso distinto per pori rossi, puntini rossi senza maglie e carne gialla/blu. Margini liberi e nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

aestivalis: Reticolo bruno esteso fino alla base, corretto dopo due edit; cappello nocciola opaco con screpolature e senza orlo bianco. Pori chiari e bianchi nel giovane; sezione bianca. Satana con cappello biancastro, pori e rete rossi e carne azzurrata. Nessun anello/volva, margini conservati e nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

repandum: Aculei corti, fitti e separati, anche nel dettaglio, senza pori o lamelle; cappello crema-ocra irregolare e gambo corto leggermente eccentrico. Sezione bianca con lievi macchie arancio al taglio. Sarcodon bruno a grosse squame sollevate con aculei grigio-bruni. Nessuna goccia rossa, margini circa 6% e nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

cibarius: Finferli giallo uovo su terra/muschio, pliche basse spesse forcate e anastomizzate, carne bianca. Omphalotus arancio a cespi su legno con vere lamelle fitte e carne arancio; confronto intero più grande del finferlo, dettagli ingranditi separatamente. Margini ampi dopo edit, nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

cornucopioides: Trombe nere/brune opache con esterno grigio cenere quasi liscio; sezione cava continua fino alla base aperta, corretta dopo edit. Crescita tra foglie su terra. Cenerino simile ma con pliche venose forcate evidenti all’esterno. Nessun anello/volva, nessun testo, margini liberi. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

virescens: Russula con placche verdi opache su fondo bianco, gambo bianco intero senza bulbo/anello/volva; sezione bianca e frattura granulosa netta come gesso. Lamelle bianche/crema. Falloide con cappello olivastro liscio fibrilloso, anello e volva bianchi visibili. Margini ampi dopo edit, nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

suillus: Pineta con aghi/pigna, cappelli lucidi e cuticola sollevata. Luteus con anello membranoso bianco-violaceo; sezione bianca/giallina immutabile. Granulatus senza anello, pori gialli con goccioline lattiginose. Base collinitus con feltro rosa senza volva. Pepato piccolo con pori ramati e micelio giallo vivo. Nessun blu; dettagli spostati per liberare la riserva di testo, nessun testo generato. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

terreum: Moretta piccola, grigia opaca e feltrata, gambo bianco senza anello/volva, contesto di pineta e sezione chiara con cavità nel gambo. Tigrino più grande e carnoso, squame marcate, gambo tozzo, scala circa 2:1. Corretto collarino libero iniziale, ma la tacca delle lamelle resta schematica e poco netta: richiede revisione prima dell’approvazione. Nessuna tinta rosa/bruna sulle lamelle. Margini liberi, nessun testo. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

nuda: Agarico violetto con cappello/lamelle/gambo lilla, centro schiarito; nessuna cortina o anello. Carne lilla-grigia immutabile e sporata rosa pallido, senza polvere ruggine. Tragano distinto per cortina ragnatelosa, lamelle ruggine e carne giallo-zafferano nel gambo sezionato. Nessuna volva, margini liberi e nessun testo. Attacco lamellare reso schematicamente. Riferimenti e prompt nel manifest; verifica illustrativa, da rivedere con un micologo.

forme-04: amanita-virosa emisferico, amanita-virosa convesso, amanita-pantherina conico. Virosa bianca emisferica/convessa con anello e volva a sacco; panterina bruna con verruche bianche conica, anello e cercini alla base. Corrette scala e centratura. Nessun testo; terza colonna vuota. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-05: amanita-pantherina emisferico, amanita-pantherina piano, amanita-rubescens emisferico. Panterina emisferica/piana con verruche bianche e cercini; arrossante emisferica rosa con anello e senza aggiunta di volva. Anatomia e forme controllate, esito dei margini nel report. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-05: amanita-pantherina emisferico, amanita-pantherina piano, amanita-rubescens emisferico. Panterina emisferica/piana con verruche bianche e cercini; arrossante emisferica rosa con anello e senza aggiunta di volva. Anatomia e forme controllate, esito dei margini nel report. Normalizzata solo scala e posizione con Python, su autorizzazione di Matteo. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-06: amanita-rubescens piano, amanita-crocea emisferico, amanita-crocea piano. Arrossante piana rosa con anello; crocea arancio emisferica e piana, gambo zebrato con volva bianca e senza anello. Forme e caratteri confrontati con le icone base. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-07: lepiota-brunneoincarnata piano, lepiota-brunneoincarnata ombrellato, lepiota-subincarnata piano. Lepiote rosa a squame, bruno-incarnata piana/umbonata e subincarnata piana; gambo corto senza anello scorrevole o volva, caratteri della base conservati. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-08: lepiota-subincarnata ombrellato, procera emisferico, chlorophyllum-rhacodes emisferico. Subincarnata umbonata; procera e rhacodes emisferiche dopo correzione del profilo troppo appuntito. Procera con gambo zigrinato e doppio anello; rhacodes con gambo liscio, nessuna volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-09: chlorophyllum-rhacodes convesso, chlorophyllum-venenatum convesso, galerina-marginata piano. Rhacodes e venenatum convessi, gambo liscio e basi distinte: arrotondata e squadrata; galerina piana arancio-bruna con lamelle ruggine e anello sottile. Squame assenti sulla galerina. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-10: mellea piano, entoloma-sinuatum piano, cortinarius-orellanus piano. Chiodino piano con squamette e anello, lamelle crema; entoloma piano grigio con lamelle rosa e senza anello; orellano piano arancio con lamelle bruno-ruggine corrette dopo edit. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-11: cortinarius-orellanus conico, cortinarius-rubellus convesso, edulis emisferico. Orellano conico e rubello convesso con lamelle ocra-ruggine corrette; porcino emisferico bruno, pori chiari e reticolo bianco in alto, senza anello/volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-12: pinophilus emisferico, neoboletus-luridiformis emisferico, rubroboletus-satanas emisferico. Tre boleti emisferici: pinophilus rosso-bruno con reticolo chiaro; piede rosso bruno con pori rossi e puntini senza rete; satana crema-grigiastro con pori e reticolo rossi. Nessun anello/volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-13: tylopilus-felleus emisferico, caloboletus-calopus emisferico, caloboletus-radicans emisferico. Forme emisferiche dei tre boleti: fiele con pori rosa e reticolo bruno; bel piede con pori gialli e gambo rosso a reticolo chiaro; radicante con pori/gambo gialli e base appuntita. Nessun anello o volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-14: agaricus-arvensis emisferico, agaricus-arvensis piano, agaricus-bisporus emisferico. Arvensis crema emisferico/piano con squamette della base; bisporus bruno emisferico. Lamelle brune e anelli conservati, senza volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-15: agaricus-bisporus piano, agaricus-campestris emisferico, agaricus-campestris piano. Bisporus piano bruno e campestris bianco emisferico/piano; lamelle brune. Ripristinato nel campestris solo il piccolo residuo fragile d’anello della base, senza renderlo persistente o voluminoso. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-16: agaricus-sylvicola emisferico, agaricus-sylvicola piano, agaricus-xanthodermus emisferico. Sylvicola crema emisferico/piano e xanthodermus bianco emisferico; cappelli lisci, anello e lamelle rosato-brune. Rimosse macchie e linee basali non presenti nelle icone base; nessuna volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-17: agaricus-xanthodermus piano, armillaria-tabescens piano, calocybe-gambosa emisferico. Xanthodermus piano con anello e lamelle rosate; tabescens piano giallo a squamette senza anello; prugnolo emisferico bianco con lamelle chiare e gambo tozzo. Nessuna volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-18: calocybe-gambosa piano, chalciporus-piperatus piano, cibarius convesso. Prugnolo piano bianco con lamelle chiare, pepato piano arancio con pori ramati e base gialla; finferlo convesso giallo con pliche spesse decorrenti e senza anello/volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-19: clitocybe-rivulosa convesso, clitocybe-rivulosa piano, cortinarius-traganus emisferico. Rivulosa convessa/piana bianca con lamelle decorrenti corrette. Tragano emisferico violetto con lamelle ocra-ruggine che si arrestano in alto, gambo liscio ringless; rimosso il trasferimento erroneo della decorrenza. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-20: cortinarius-violaceus piano, craterellus-cinereus imbuto, craterellus-lutescens trombetta. Violaceus piano tutto violetto con lamelle viola; cenerino grigio a imbuto con pliche; finferla a trombetta bruna/gialla con cavità centrale resa evidente dopo edit. Nessun anello/volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-21: cyclocybe-aegerita emisferico, cyclocybe-aegerita piano, gymnopilus-junonius piano. Pioppino bruno emisferico/piano con anello e lamelle chiare; Gymnopilus piano arancio a squame con anello e lamelle gialle. Rimossi aloni esterni e appiattita la forma adulta. Oggetti estratti interi per componenti connesse, senza taglio dei contorni. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-22: hydnellum-peckii convesso, hydnellum-peckii imbuto, hydnum-rufescens piano. Peckii convesso/a imbuto bianco con gocce rosse della base ripristinate dopo edit, gambo bruno-rosato; rufescens piano arancio con aculei corti e senza gocce. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-23: hydnum-rufescens imbuto, hygrophoropsis-aurantiaca convesso, hygrophorus-latitabundus piano. Rufescens a imbuto arancio con aculei, falso gallinaccio convesso arancio con lamelle decorrenti, lardaiolo piano scuro con lamelle chiare e fiocchi sul gambo della base. Nessun anello/volva. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-24: hygrophorus-latitabundus ombrellato, hygrophorus-marzuolus piano, hypholoma-fasciculare piano. Lardaiolo umbonato scuro con fiocchi al gambo; marzuolo piano grigio con lamelle chiare; falso chiodino piano giallo con lamelle verdi e senza anello vero. Caratteri base conservati. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-25: imleria-badia piano, inocybe convesso, laccaria-amethystina convesso. Imleria piano a pori gialli; Inocybe convessa fibrillosa; Laccaria convessa violetta. Conservati colori e strutture delle basi. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.

forme-26: laccaria-amethystina piano, lactarius-deliciosus convesso, lactarius-deterrimus convesso. Laccaria appianata; lattari convessi aranciati con macchie verdi. Scrobicoli del deliciosus e gambo liscio del deterrimus conservati. Scala e centratura normalizzate con Python su autorizzazione di Matteo; disegno invariato. Base colore/forma e prompt nel manifest, controlli in bozze/verifiche.
