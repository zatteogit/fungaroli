# Revisione indipendente delle103 tessere di fase dei funghi

18 ottobre2026 · agente `illustration_corrections` · rapporto editoriale, non certificazione micologica.

## Esito

**98 tessere approvate per i caratteri di fase indicati;5 approvate con riserva di leggibilità del reticolo a64px;0 blocchi anatomici netti rilevati nei file finali selezionati.** L’approvazione riguarda le rappresentazioni e le fasi elencate sotto, non identificazione della specie, commestibilità o tutti i caratteri della scheda. Le5 riserve sono interi di aereus (tre fasi) ed edulis (due fasi): la rete esiste nel master ma ha contrasto ridotto a64px. Non diventano per questo gambo «senza reticolo». Il coordinatore deve verificare la resa nella UI prima dell’import, che questo agente non ha eseguito.

## Campione immutabile e controlli

- Consegna esaminata: worktree `/workspace/fronda-image-production`, commit `e1d4aa59f169e2f7d18a59483c80e212c506db2f`.
- Ricevuta: `incoming/produzione-fasi-2026-10-18/ricevuta-finale-103.json`, SHA-256 `98968ae7cc4bb98d842ba35d54471d3fd0d066c4c4cf29a80fd9b7da8f7f7daa`.
- Dataset confrontato: `/workspace/fungaroli/data/species-traits.json`, SHA-256 `a2149f75008184cb691c4935d6967706c36069392106f68d7fa20d4e6eee5d18`; coincide con il dataset della ricevuta.
- Verificati i103 hash delle sorgenti e dei103 WebP tecnici attesi: nessuna discordanza. Gli hash dimostrano identità dei file, non correttezza anatomica.
- Visionate tutte le18 tavole sorgente finali a piena risoluzione e tutte le103 rese64px in `finale-fit64-{1,2,3}.png`. Le celle scartate eventualmente visibili nella stessa tavola sono escluse dall’approvazione.
- Letti stages, traits e fonti già registrate per tutti i18taxa; confronto con fotografie reali locali in `assets/species/`, incluse le tavole di riferimenti recupero/porcini e un montaggio di controllo dei restanti nove taxa. Cibarius confrontato con `cibarius-inat3-hd.webp` per le pliche; Coprinus con `coprinus-comatus-inat1-hd.webp` per squame e bordo che annerisce; Pleurotus con `pleurotus-ostreatus-inat1-hd.webp` per inserzione laterale e lamelle decorrenti.
- Le foto locali non coprono ogni età: per le transizioni non fotografate si usa la descrizione di fase con la fonte già citata nel dataset. Non è stata effettuata una nuova verifica online di FirstNature/Wikipedia né una verifica micologica esterna. Nessuna fonte aggiunta o dato biologico modificato.
- Nessun asset, master, runtime o dato modificato. Nessun import o SVG prodotto; raster revisionato prima di qualsiasi eventuale vettore.

## Criteri e limiti comuni

Pori rappresentati da piccoli fori; lamelle da strutture radiali; pliche da rilievi spessi e biforcati. Controllate sagome del cappello nelle età, coerenza fra cappello isolato/intero, colori documentati del sotto, presenza degli anelli nei taxa che lo richiedono, reti nei boleti, assenza di sacchi/volve inventati e laterizzazione del gambo nel pleuroto. Il conteggio di lamelle, pori, squame e reticolazioni non costituisce misura biologica.

**Dischi lamellari:** approvati per tipo di imenoforo e colore di fase; il centro schematico non permette di verificare inserzione libera/adnata/smarginata. Non utilizzare questi dischi come illustrazione autonoma del campo `gill_attachment`. **Dati null:** non diventano conclusioni negative; in particolare anello del terreum, superficie del pleuroto, superficie/base del bisporus e superficie/base del pioppino restano sconosciuti nei rispettivi dati. Le leggere campiture pittoriche non autorizzano etichette di viscosità, pelosità o fibrillosità.

Le5 riserve non richiedono di rigenerare l’intero lotto. Se la UI richiede che la rete sia il particolare principale leggibile, servirà una successiva correzione raster mirata o una presentazione con dettaglio revisionato, prima di riusare queste tessere a tale scopo. Non aumentarne contrasto o colore programmaticamente trasformando la rete pallida in una rete bruna.

## Esito per specie e per gruppo di fase

### aereus · Boletus aereus · 9 tessere

Cappelli nero-bruni: emisferico giovane, convesso adulto, spianato maturo. I dischi sono pori, bianchi poi gialli e giallo sporco; il maturo NON richiede verde secondo la fase corrente. Interi senza anello o volva, gambo chiaro clavato con rete pallida superiore. La rete è effettivamente presente nel master ma poco contrastata a64px: riserva specifica per i tre interi, non omissione totale del disegno.

- Fase **adulto**: Cappello convesso. Pori giallastri. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aereus
- Fase **giovane**: Cappello emisferico. Tubuli e pori bianchi. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aereus
- Fase **maturo**: Cappello aperto e spianato; i pori formano una spugna giallo sporco. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aereus

### aestivalis · Boletus reticulatus · 7 tessere

Cappello bruno più arrotondato giovane e basso-convesso adulto, due interi coerenti con cappelli isolati. Rete chiara visibile sul gambo, senza anello/volva. Dischi con veri punti/fori, bianchi→gialli→giallo-verdastri. Il maturo è soltanto disco, nessun nuovo cappello/gambo non previsto.

- Fase **adulto**: Cappello quasi appiattito, raramente disteso del tutto. Pori giallini. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aestivalis
- Fase **giovane**: Cappello tondeggiante, poi emisferico. Pori bianchi. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aestivalis
- Fase **maturo**: Pori giallo-verdastri. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_aestivalis

### agaricus-arvensis · Agaricus arvensis · 3 tessere

Tre tessere adulte: cappello chiaro aperto piano con piccole squame, lamelle brune e anello sul gambo. Nessuna volva e nessun reticolo aggiunti. Il disegno compatto e il gambo corto sono stilizzazioni, non proporzioni misurate. Il disco non viene approvato come dettaglio delle lamelle libere.

- Fase **adulto**: Cappello aperto fino a piano o quasi. Lamelle brune. Fonte registrata: https://www.first-nature.com/fungi/agaricus-arvensis.php

### agaricus-bisporus · Agaricus bisporus · 6 tessere

Giovane emisferico bruno con lamelle rosa, adulto piatto con lamelle cioccolato. Anello evidente in entrambi gli interi. Base arrotondata senza sacco; nessuna volva o rete. cap_surface e stem_base null non diventano nuovi caratteri: superficie neutra e sagoma stilizzata non autorizzano etichette di tessitura o tipo di base.

- Fase **adulto**: Cappello convesso, poi appiattito. Lamelle bruno cioccolato. Fonte registrata: https://www.first-nature.com/fungi/agaricus-bisporus.php
- Fase **giovane**: Cappello emisferico. Lamelle rosa. Fonte registrata: https://www.first-nature.com/fungi/agaricus-bisporus.php

### agaricus-sylvicola · Agaricus sylvicola · 9 tessere

Nove tessere in tre fasi: cupola giovane/lamelle bianche; convesso adulto/lamelle grigio-rosa; piatto maturo/lamelle brune. Anello e base ingrossata raffigurati, nessun sacco distinto. Cappello isolato e intero concordano nella fase pur con differenza di prospettiva. Nessuna approvazione dell’inserzione dal disco radiale.

- Fase **adulto**: Cappello convesso. Lamelle grigio-rosa. Fonte registrata: https://www.first-nature.com/fungi/agaricus-sylvicola.php
- Fase **giovane**: Cappello quasi sferico. Lamelle bianche. Fonte registrata: https://www.first-nature.com/fungi/agaricus-sylvicola.php
- Fase **maturo**: Cappello del tutto appiattito. Lamelle bruno cioccolato. Fonte registrata: https://www.first-nature.com/fungi/agaricus-sylvicola.php

### agaricus-xanthodermus · Agaricus xanthodermus · 6 tessere

Cupola giovane bianco-crema con sotto rosa molto pallido, adulto convesso con sotto grigio-bruno; anello e base ingrossata presenti, volva assente. La cima piatta è facoltativa («spesso») e la sua mancata enfatizzazione non invalida il giovane. Bande tonali sul cappello non sono prova di viraggio al giallo; nessuna reazione al tocco dedotta.

- Fase **adulto**: Cappello largamente convesso, senza margine arrotolato. Lamelle grigio-brune. Fonte registrata: https://www.first-nature.com/fungi/agaricus-xanthodermus.php
- Fase **giovane**: Cappello globoso, spesso con la cima piatta. Lamelle biancastre che presto diventano rosa. Fonte registrata: https://www.first-nature.com/fungi/agaricus-xanthodermus.php

### cibarius · Cantharellus cibarius · 4 tessere

Quattro finali: cappelli giovane convesso e adulto avvallato/ondulato; interi esclusivamente dal master cibarius-r02 celle0,1. Pliche spesse, irregolari, biforcate e decorrenti, non fasci di lamelle sottili regolari. Colore giallo/arancio e gambo continuo senza anello/volva/rete. Confronto diretto con foto inat3: differenza pliche/lamelle rimane percepibile anche a64px. Scarti delle tavole40/41 esclusi.

- Fase **adulto**: Cappello piano e avvallato, a imbuto. Fonte registrata: https://it.wikipedia.org/wiki/Cantharellus_cibarius
- Fase **giovane**: Cappello convesso. Fonte registrata: https://it.wikipedia.org/wiki/Cantharellus_cibarius

### coprinus-comatus · Coprinus comatus · 9 tessere

Nove tessere: giovane cilindrico bianco e squamoso che copre gran parte del gambo; maturo campanulato allungato con lamelle rosa; sciolto con bordo nero e gocce di liquido scuro. Anello visibile, nel finale annerito e più basso. Base senza sacco, nessun reticolo. Lamelle radiali sempre distinte da pori. Numero delle squame e gocce simbolico; il disco non certifica inserzione libera.

- Fase **giovane**: Esce dal terreno come un cilindro bianco: il cappello copre quasi tutto il gambo. Lamelle bianche. Fonte registrata: https://en.wikipedia.org/wiki/Coprinus_comatus
- Fase **maturo**: Il cappello si apre a campana allungata; le lamelle diventano rosa. Fonte registrata: https://www.first-nature.com/fungi/coprinus-comatus.php
- Fase **sciolto**: Le lamelle diventano nere e si sciolgono dal margine in un liquido scuro; l’anello si macchia di nero e scivola in basso. Fonte registrata: https://www.first-nature.com/fungi/coprinus-comatus.php

### cyclocybe-aegerita · Cyclocybe cylindracea (= Cyclocybe aegerita) · 6 tessere

Giovane emisferico bruno con lamelle crema; adulto aperto, ondulato e più scuro con lamelle grigio-brune. Anello presente in entrambi gli interi, nessuna volva/rete. Sottili variazioni pittoriche della campitura non autorizzano a trasformare cap_surface null in «peloso», «fibrilloso» o altra tessitura; non ho rilevato squame strutturali distinte nel finale. Inserzione non verificabile dal disco.

- Fase **adulto**: Cappello largamente convesso o piano, margine ondulato, più scuro con l’età. Lamelle grigio-brune, poi brune. Fonte registrata: https://www.first-nature.com/fungi/cyclocybe-cylindracea.php
- Fase **giovane**: Cappello emisferico. Lamelle crema. Fonte registrata: https://www.first-nature.com/fungi/cyclocybe-cylindracea.php

### edulis · Boletus edulis · 7 tessere

Sette tessere: giovane emisferico e adulto piano-convesso bruni, interi con gambo chiaro clavato; sotto bianco→giallo→verde. Il giovane intero mostra un sottocappello crema quasi uniforme alla scala piccola, ma il disco dedicato ha pori leggibili: non si trasferisce una conclusione di imenoforo liscio all’immagine intera. La rete pallida superiore è presente nel master dei due interi ma poco leggibile a64px: riserva specifica, non anello o volva aggiunti.

- Fase **adulto**: Cappello piano-convesso. Tubuli giallastri. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_edulis
- Fase **giovane**: Cappello emisferico, a volte piccolo rispetto al gambo. Tubuli bianchi. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_edulis
- Fase **maturo**: Tubuli verdastri. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_edulis

### entoloma-sinuatum · Entoloma sinuatum · 6 tessere

Giovane conico con lamelle giallastre e adulto piano con basso umbone e lamelle rosa. Cappelli grigio-crema, interi privi di anello, volva o rete. Il rosa è una campitura illustrativa, non soglia cromatica. L’inserzione lamellare non viene attestata dal semplice disco.

- Fase **adulto**: Cappello da convesso a piano, con un umbone ottuso. Lamelle rosate. Fonte registrata: https://www.first-nature.com/fungi/entoloma-sinuatum.php
- Fase **giovane**: Cappello conico. Lamelle bianco-giallastre. Fonte registrata: https://www.first-nature.com/fungi/entoloma-sinuatum.php

### hypholoma-fasciculare · Hypholoma fasciculare · 3 tessere

Tre soli dischi sotto: giallo-zolfo giovane, verde-oliva adulto, grigio-nero maturo; lamelle radiali, mai pori. Questa sequenza è quella delle fasi documentate; non ho esteso l’approvazione a colori o organi dell’intero, non consegnati. Le foto locali non mostrano in modo leggibile tutte e tre le età.

- Fase **adulto**: Lamelle verde oliva. Fonte registrata: https://www.first-nature.com/fungi/hypholoma-fasciculare.php
- Fase **giovane**: Lamelle giallo zolfo. Fonte registrata: https://www.first-nature.com/fungi/hypholoma-fasciculare.php
- Fase **maturo**: Lamelle che anneriscono man mano che le spore maturano. Fonte registrata: https://www.first-nature.com/fungi/hypholoma-fasciculare.php

### mellea · Armillaria mellea · 4 tessere

Quattro tessere: giovane convesso con squamette soprattutto centrali, adulto appiattito e ondulato/striato con squame poco evidenti; anello chiaro presente in entrambi gli interi, nessuna volva/rete. Sotto chiaro lamellare. La perdita delle squame nel disegno adulto è ammessa esplicitamente dalla descrizione di fase.

- Fase **adulto**: Cappello appiattito, spesso con il margine ondulato e striato; le squamette possono non vedersi più. Fonte registrata: https://www.first-nature.com/fungi/armillaria-mellea.php
- Fase **giovane**: Cappello molto convesso, coperto di squamette fini, soprattutto al centro. Fonte registrata: https://www.first-nature.com/fungi/armillaria-mellea.php

### pinophilus · Boletus pinophilus · 2 tessere

Due soli dischi: bianco giovane e giallo-olivastro adulto, punteggiatura poroide. Non sono state consegnate nuove sagome di cappello/gambo e non vengono approvate implicitamente.

- Fase **adulto**: Pori gialli od olivastri. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_pinophilus
- Fase **giovane**: Pori bianchi. Fonte registrata: https://it.wikipedia.org/wiki/Boletus_pinophilus

### pleurotus-ostreatus · Pleurotus ostreatus · 4 tessere

Quattro finali: giovane convesso grigio e adulto depresso con margine ondulato; interi a ventaglio con gambo corto laterale/eccentrico e lamelle chiare decorrenti. Adulto soltanto da pleurotus-r02 celle0,1, superficie neutra senza trama pilosa della vecchia tavola. Nessun anello, volva o reticolo. cap_surface null resta sconosciuta, non diventa etichetta «liscio».

- Fase **adulto**: Cappello depresso al centro, con il margine ondulato. Fonte registrata: https://www.first-nature.com/fungi/pleurotus-ostreatus.php
- Fase **giovane**: Cappello convesso. Fonte registrata: https://www.first-nature.com/fungi/pleurotus-ostreatus.php

### rubroboletus-satanas · Rubroboletus satanas · 6 tessere

Sei tessere: giovane a cupola pallido crema con pori gialli, adulto più basso/irregolare pallido con pori arancio-rossi. Interi con gambo bulboso e rete rossa, non lamelle; nessun anello/volva. Transizione giovane→adulto esplicita e coerente fra dettaglio sotto e intero. Non vengono aggiunti viraggio blu o colori di lesione non richiesti.

- Fase **adulto**: Cappello che può diventare irregolare e lobato. Pori arancio, poi rossi. Fonte registrata: https://www.first-nature.com/fungi/rubroboletus-satanas.php
- Fase **giovane**: Cappello arrotondato, a cupola. Pori giallastri negli esemplari molto giovani. Fonte registrata: https://www.first-nature.com/fungi/rubroboletus-satanas.php

### terreum · Tricholoma terreum · 6 tessere

Sei tessere: giovane conico e adulto quasi piatto con piccolo umbone, cappelli grigio-bruni con trama documentata; dischi e interi con lamelle bianco-crema poi grigie. Il gambo non ha rete o volva; stem_ring è NULL e NON viene approvata una conclusione di anello assente. Nessun nuovo ancoraggio/etichetta di assenza può derivare dalla neutralità del disegno.

- Fase **adulto**: Cappello quasi piatto con un piccolo umbone. Lamelle grigie, spesso con toni gialli. Fonte registrata: https://www.first-nature.com/fungi/tricholoma-terreum.php
- Fase **giovane**: Cappello conico. Lamelle bianche. Fonte registrata: https://www.first-nature.com/fungi/tricholoma-terreum.php

### tylopilus-felleus · Tylopilus felleus · 6 tessere

Sei tessere: giovane emisferico e adulto piatto bruno-crema; pori bianchi→rosa, non lamelle. Gambo con rete bruna grossolana chiaramente distinta dalla rete chiara dei porcini e dalla rossa del satana, nessun anello/volva. I dettagli sotto finali sono solo dischi36-r02 celle0,6, senza gambo intero nei dischi. Restanti quattro tessere selezionate da36-r01; escluse celle1,4 superate.

- Fase **adulto**: Cappello spianato. Pori rosati. Fonte registrata: https://it.wikipedia.org/wiki/Tylopilus_felleus
- Fase **giovane**: Cappello emisferico. Tubuli e pori bianchi. Fonte registrata: https://it.wikipedia.org/wiki/Tylopilus_felleus

## Registro puntuale dei103 target

A = approvata per la fase con i limiti sopra; R = approvata con riserva di leggibilità del reticolo a64px. Numerazione coincide con le tavole `finale-fit64`. Ogni decisione si applica soltanto alla cella selezionata e al WebP con hash indicato; gli scarti non sono approvati per vicinanza nella tavola.

| N | Target | Tavola/cella | Esito | SHA-256 output |
|---:|---|---|---|---|
| 1 | `aereus-cappello-fase-adulto.webp` | `fasi-37-r01.png` / 3 | A | `6736bcb70e1a8e51c3653ad20eb968c38916eb9648ec3164c1eb5096a6ef49bf` |
| 2 | `aereus-gambo-fase-adulto.webp` | `fasi-37-r01.png` / 5 | R | `4e0ea330d611ea3eab8144158d3b806561d02abf81b35ee0c3b1a2f7c00a7a95` |
| 3 | `aereus-sotto-fase-adulto.webp` | `fasi-37-r01.png` / 4 | A | `5b051c8648dfdb7a1fcc19c57ae38489be1f52225aa73b8621b3e460218270be` |
| 4 | `aereus-cappello-fase-giovane.webp` | `fasi-37-r01.png` / 0 | A | `5afb29169edabae9574ea325dfe5e559b9eebdd199647bb1e5357bf115e08ef4` |
| 5 | `aereus-gambo-fase-giovane.webp` | `fasi-37-r01.png` / 2 | R | `ef5abf3035ec67af2a0ad99de23e18e541e9ce99966bb81ae2a7be8a5b50430a` |
| 6 | `aereus-sotto-fase-giovane.webp` | `fasi-37-r01.png` / 1 | A | `f7e11233125d83267f5fd56c9c261cdc92b811f7b578a8032c54f7a8cbe743cc` |
| 7 | `aereus-cappello-fase-maturo.webp` | `fasi-37-r01.png` / 6 | A | `00c2cf4b0e9ce5c21b57335f6a36b5070c1d9e1bbb4c243be494674e2e7c3d48` |
| 8 | `aereus-gambo-fase-maturo.webp` | `fasi-37-r01.png` / 8 | R | `6a096eb332d9c29d5e480132b1d507b24b573f4629d7caceea7d744fb3b0dceb` |
| 9 | `aereus-sotto-fase-maturo.webp` | `fasi-37-r01.png` / 7 | A | `34c1a7cd50e34a0fd7b5581361cc8ba5953f4ceca8708196b36eac5fa37b5602` |
| 10 | `aestivalis-cappello-fase-adulto.webp` | `fasi-38-r01.png` / 3 | A | `957e78a8c9f465001ae5c29bc78ca1c76e545ad46184f99055e4d1648352c08d` |
| 11 | `aestivalis-gambo-fase-adulto.webp` | `fasi-38-r01.png` / 5 | A | `8ae53826a402b0b7e1c796ae22ec02ae64d7e084e401aee4a250944ebf570ee3` |
| 12 | `aestivalis-sotto-fase-adulto.webp` | `fasi-38-r01.png` / 4 | A | `700dbdd807edac62a3da54bd393ee57b56603348ea92ea6d378a38c26dc8d3a3` |
| 13 | `aestivalis-cappello-fase-giovane.webp` | `fasi-38-r01.png` / 0 | A | `8fee7491c5630512530e20904322aa393fe1cbd0ecc0e9e2cad0954c7943bfc5` |
| 14 | `aestivalis-gambo-fase-giovane.webp` | `fasi-38-r01.png` / 2 | A | `216f1d9a5b281716f8ca71e57570768d3b4a4c52c514e0e17c2fb399f26f976c` |
| 15 | `aestivalis-sotto-fase-giovane.webp` | `fasi-38-r01.png` / 1 | A | `ab9d69f6ff8f6c4f4d908a735f8b142e2e820e693df66e7d5fee661f93dabc2d` |
| 16 | `aestivalis-sotto-fase-maturo.webp` | `fasi-38-r01.png` / 6 | A | `4bec8f67dc4a867d9a1d40a1c62f68f83edf17b07c86a02dc40cf524b2440453` |
| 17 | `agaricus-arvensis-cappello-fase-adulto.webp` | `fasi-31.png` / 0 | A | `812bab036b3b0e78b927ab24249e79d6e2122f995b1859ab9ccffe0b8fc1022f` |
| 18 | `agaricus-arvensis-gambo-fase-adulto.webp` | `fasi-31.png` / 2 | A | `694a291490273546e244773540fc4dcdf3cbd6a19363f6d853ae20d864202b8c` |
| 19 | `agaricus-arvensis-sotto-fase-adulto.webp` | `fasi-31.png` / 1 | A | `214d7cc1e70a44b81b03f3a24667ee72bca85ebd4d0c9fadb9813712f1322587` |
| 20 | `agaricus-bisporus-cappello-fase-adulto.webp` | `fasi-31.png` / 6 | A | `ddc1df84d4d93c66e4e80d2bc7f8517724cc15e4e828212726daa903518691a8` |
| 21 | `agaricus-bisporus-gambo-fase-adulto.webp` | `fasi-31.png` / 8 | A | `86542f9817550868a24a02f1428d8cd64583e069d85b4453fdbf1bb99015a984` |
| 22 | `agaricus-bisporus-sotto-fase-adulto.webp` | `fasi-31.png` / 7 | A | `c0ce2728fb81c83d79472c3cf9a4925a505151cc3a880bcaf3b10c519436aeea` |
| 23 | `agaricus-bisporus-cappello-fase-giovane.webp` | `fasi-31.png` / 3 | A | `bbd856c0e9ef7ecc366f3cf05064f93b4bcdad3f8d92ab79481970c5c08c3f08` |
| 24 | `agaricus-bisporus-gambo-fase-giovane.webp` | `fasi-31.png` / 5 | A | `b7bccc63481fd6154b1e579cdaa48b8289821c29900646da7012c384d383c08a` |
| 25 | `agaricus-bisporus-sotto-fase-giovane.webp` | `fasi-31.png` / 4 | A | `93a428d2b7d8b26334bb2591badb94b92321510b929266fc04479f8bda8ba681` |
| 26 | `agaricus-sylvicola-cappello-fase-adulto.webp` | `fasi-32.png` / 3 | A | `5415a7ee3c81cb1f6f0e1f69384422cd92841582211ec5b9e9bd1f95db3619c4` |
| 27 | `agaricus-sylvicola-gambo-fase-adulto.webp` | `fasi-32.png` / 5 | A | `b2280072c04538819514319666741daebeca35cec57f6da8c0698c2db5549c47` |
| 28 | `agaricus-sylvicola-sotto-fase-adulto.webp` | `fasi-32.png` / 4 | A | `c47f58a53e70cc61d7a594d36dfc989d66ccd1c4f212d3a9acc2cb5c86f25a4c` |
| 29 | `agaricus-sylvicola-cappello-fase-giovane.webp` | `fasi-32.png` / 0 | A | `99d8e91afc532f96c7a038585d8535a40fb69055b0488657d08bc1010aae1e60` |
| 30 | `agaricus-sylvicola-gambo-fase-giovane.webp` | `fasi-32.png` / 2 | A | `ecb6e943d782a21e1492a8f3ef9db14e978572ef936276a50889a573595bb009` |
| 31 | `agaricus-sylvicola-sotto-fase-giovane.webp` | `fasi-32.png` / 1 | A | `0b2a9b780e186db7d5d58c695e383e3788d1bf67839536460765b826aa07961d` |
| 32 | `agaricus-sylvicola-cappello-fase-maturo.webp` | `fasi-32.png` / 6 | A | `dac26069fc3e423d47d27fb701db894d936d847c697e41ef1415909e45e2a35b` |
| 33 | `agaricus-sylvicola-gambo-fase-maturo.webp` | `fasi-32.png` / 8 | A | `c039e54ecef63758a2159e25bb875d1890e7ce1c6f9c68d1514e4b894d1bcbf8` |
| 34 | `agaricus-sylvicola-sotto-fase-maturo.webp` | `fasi-32.png` / 7 | A | `1d56a4a56d02d11c4edaa752c8c9b092e52891cd7dc811c71e948c374cacfd71` |
| 35 | `agaricus-xanthodermus-cappello-fase-adulto.webp` | `fasi-33.png` / 3 | A | `6a7c7ab64fa1bde2fee6cc5f14e4b90837a3f071d6e7d11d63e93fd88d1cbed6` |
| 36 | `agaricus-xanthodermus-gambo-fase-adulto.webp` | `fasi-33.png` / 5 | A | `0e1e7b5f1cb02ac78526f3e007509e66e3e2ae64803e2e12b165270759bba2d5` |
| 37 | `agaricus-xanthodermus-sotto-fase-adulto.webp` | `fasi-33.png` / 4 | A | `5aa398d8acd76cc5318f8b5ffc5ba6929ea0893fa6b14ce13624f72164e5fdcd` |
| 38 | `agaricus-xanthodermus-cappello-fase-giovane.webp` | `fasi-33.png` / 0 | A | `b2bd6923c0fe7ba621dff151cca698286c4c02fa74b9bd2cd861faa5216cd386` |
| 39 | `agaricus-xanthodermus-gambo-fase-giovane.webp` | `fasi-33.png` / 2 | A | `0201b44793ccab3ff6aaa9bf67a3e2300881512ec25b49c33935b36ccd308368` |
| 40 | `agaricus-xanthodermus-sotto-fase-giovane.webp` | `fasi-33.png` / 1 | A | `3989467179392069a1afca97c430001841a2b2eaddeccc46640ce09f57a2e439` |
| 41 | `cibarius-cappello-fase-adulto.webp` | `fasi-41-r01.png` / 0 | A | `4e7f11ca05b7395460f7dc957d3dbb6b2343b364941538331e1960c80c12e833` |
| 42 | `cibarius-gambo-fase-adulto.webp` | `fasi-cibarius-r02.png` / 1 | A | `96f6acba5d37b52189d5e69786c59fbf6f28726ebbda3d3f3584f708161c0f28` |
| 43 | `cibarius-cappello-fase-giovane.webp` | `fasi-40-r01.png` / 6 | A | `8de4a3144a4ad1d9725f3a378f1cbfca9a2d2586b964d03b0738ac0251fd1286` |
| 44 | `cibarius-gambo-fase-giovane.webp` | `fasi-cibarius-r02.png` / 0 | A | `93c4304ab51f55f18ff76c285f78e9ba7d441c5ab6d4c955aa3e7961aabd294c` |
| 45 | `coprinus-comatus-cappello-fase-giovane.webp` | `fasi-41-r01.png` / 3 | A | `eb485f612d1749f17e5fa46a02b05e289c01c8a9f565856a613d3efba4b89945` |
| 46 | `coprinus-comatus-gambo-fase-giovane.webp` | `fasi-41-r01.png` / 5 | A | `f72b4fb3608c2ba00c12c311ae613647666963a5480bd763390caf0b3022dfed` |
| 47 | `coprinus-comatus-sotto-fase-giovane.webp` | `fasi-41-r01.png` / 4 | A | `04b76d87cda473cc134043406c8c41aa4e01dbc393d428a4032f980ab0d663ea` |
| 48 | `coprinus-comatus-cappello-fase-maturo.webp` | `fasi-41-r01.png` / 6 | A | `8f066413a8dd3a3014cd31eb05a7eb9fa49eb28d625f8149cbc70c7c951fd49f` |
| 49 | `coprinus-comatus-gambo-fase-maturo.webp` | `fasi-41-r01.png` / 8 | A | `eba6e2736bb50e17d98cfa8db4d1e9866637fa6d6b4d0cd4db8da09ccf616194` |
| 50 | `coprinus-comatus-sotto-fase-maturo.webp` | `fasi-41-r01.png` / 7 | A | `1f2053b69a1f6e7580f881d1d109e101430707473951b1b8257cf963ebc1c59c` |
| 51 | `coprinus-comatus-cappello-fase-sciolto.webp` | `fasi-42-r01.png` / 0 | A | `ba7dea0d085b5ae146e88f556f63da778c75fde22d9f651aff8a5dfd6351f1bc` |
| 52 | `coprinus-comatus-gambo-fase-sciolto.webp` | `fasi-42-r01.png` / 2 | A | `3f3fce53def8d90e584cb315393826c83f66ae9261f3bf8cc61004a17fc996dc` |
| 53 | `coprinus-comatus-sotto-fase-sciolto.webp` | `fasi-42-r01.png` / 1 | A | `7ae8d5aeb28feb7c19d3e887231d4bd71c1a2c4106ea2a6bfcbeea8d5d53a0cf` |
| 54 | `cyclocybe-aegerita-cappello-fase-adulto.webp` | `fasi-42-r01.png` / 6 | A | `1fd6c65b643030511d1e8d7172db675b0d6f9b770e8aa422c0b862a3be3d0eb3` |
| 55 | `cyclocybe-aegerita-gambo-fase-adulto.webp` | `fasi-42-r01.png` / 8 | A | `4c979527daf12b8a0f2eaea751ec418af33e78f25da7ffbc1a6fe168e6e93d3e` |
| 56 | `cyclocybe-aegerita-sotto-fase-adulto.webp` | `fasi-42-r01.png` / 7 | A | `5a22e3f612157d96d5de23efd835c9670cf41b1dad2df842ea9ac2028429942b` |
| 57 | `cyclocybe-aegerita-cappello-fase-giovane.webp` | `fasi-42-r01.png` / 3 | A | `36a3e6cbce51fb242aa56ccef0abc25d76b04c745c32f36c7deb504bcf739cc8` |
| 58 | `cyclocybe-aegerita-gambo-fase-giovane.webp` | `fasi-42-r01.png` / 5 | A | `52b56f2eef3268609825a6ee2c922f9a66e7506fccc1ba4fb356f1acc4a94ebf` |
| 59 | `cyclocybe-aegerita-sotto-fase-giovane.webp` | `fasi-42-r01.png` / 4 | A | `cf4c23b1e3950860756430adad60da676a493d43d42f1843563ee03567bd5bf5` |
| 60 | `edulis-cappello-fase-adulto.webp` | `fasi-39-r01.png` / 3 | A | `ad2b79bebdd477b97ee3b5b47f690c125028999645ce5fbf91230b4886e31663` |
| 61 | `edulis-gambo-fase-adulto.webp` | `fasi-39-r01.png` / 5 | R | `27f9394ef23e65d4cc09bb3faa123d9553ea40d3566d3f7e186ba428e473091f` |
| 62 | `edulis-sotto-fase-adulto.webp` | `fasi-39-r01.png` / 4 | A | `51edfb55b2de42a7b0308d455836dd7ec798dfd1e7f8209f6f29d4056fc478de` |
| 63 | `edulis-cappello-fase-giovane.webp` | `fasi-39-r01.png` / 0 | A | `4946bc570ae4ea88bf3ac3a3afb0f8097ddf02d819147913056a129e0af21144` |
| 64 | `edulis-gambo-fase-giovane.webp` | `fasi-39-r01.png` / 2 | R | `bb449c1836d368bd96d44d795497fa1bbe596aa535c9fe3fbbe557409e5e6e5d` |
| 65 | `edulis-sotto-fase-giovane.webp` | `fasi-39-r01.png` / 1 | A | `4197a267d34763c339812e32425ee4e16e089c0f0e21bb97777b3a559e48d76b` |
| 66 | `edulis-sotto-fase-maturo.webp` | `fasi-39-r01.png` / 6 | A | `00e50ccc0759598401af1c793d73999d17bbab3868353592bf3326736d3d34bc` |
| 67 | `entoloma-sinuatum-cappello-fase-adulto.webp` | `fasi-34.png` / 0 | A | `713c0c88a89fcf53f2e412eaef380f978b591368a2e49f5e8391854f1e3ca19a` |
| 68 | `entoloma-sinuatum-gambo-fase-adulto.webp` | `fasi-34.png` / 2 | A | `83060e1f66a8adb90383f238770da0a9e3d74aaab41da8a77fd2dcd77b075b37` |
| 69 | `entoloma-sinuatum-sotto-fase-adulto.webp` | `fasi-34.png` / 1 | A | `01b8329a3a46e0564a0613e8bc6b99217b533c976cbde76e484acc1ca92662f2` |
| 70 | `entoloma-sinuatum-cappello-fase-giovane.webp` | `fasi-33.png` / 6 | A | `c2534a1440bbff084158436da41cee100685615b8aaa49d1caf02748c0bb0e1d` |
| 71 | `entoloma-sinuatum-gambo-fase-giovane.webp` | `fasi-33.png` / 8 | A | `bbc2fbc4585f9ccfdcdbff4a9a843e689543dacb529c6f42ead2a88de97722e2` |
| 72 | `entoloma-sinuatum-sotto-fase-giovane.webp` | `fasi-33.png` / 7 | A | `52f946a0637366ee76b2e04c81771b93ecd98fe88adf72bcf3aef0fbd8751344` |
| 73 | `hypholoma-fasciculare-sotto-fase-adulto.webp` | `fasi-43-r01.png` / 3 | A | `defac891a70ab1f7b955181fef8bc70e101ac8bf9956a5230f1fd9c50ff338d3` |
| 74 | `hypholoma-fasciculare-sotto-fase-giovane.webp` | `fasi-43-r01.png` / 0 | A | `fb2158de02b82a8dff8f8bdfdb03bbbb4d805eb0994794575629d7133b728aae` |
| 75 | `hypholoma-fasciculare-sotto-fase-maturo.webp` | `fasi-43-r01.png` / 6 | A | `cd0f32714ab477532c19c399d4648ea9d33106fb4a63f05d35f05c8533d6b41d` |
| 76 | `mellea-cappello-fase-adulto.webp` | `fasi-44-r01.png` / 3 | A | `d178a953924fb05ccce927d82282c8de9b798f263c0bed4538c81da40dde04dc` |
| 77 | `mellea-gambo-fase-adulto.webp` | `fasi-44-r01.png` / 4 | A | `5ff19138f5f45d7d25bb7f6a06c05b02a6d4cfbf26ec78e637a58cdf0582d47a` |
| 78 | `mellea-cappello-fase-giovane.webp` | `fasi-44-r01.png` / 0 | A | `5615040baa26ffb8be382cabed0319b212b48d4575aac8053f6a9ddc7e7b14d0` |
| 79 | `mellea-gambo-fase-giovane.webp` | `fasi-44-r01.png` / 1 | A | `0a3d3378cf91ae682cd61f25d65d54a890b19aab2873f2d43f8f2949cf4ebdc8` |
| 80 | `pinophilus-sotto-fase-adulto.webp` | `fasi-40-r01.png` / 3 | A | `dba9baf6496fdfbfb938aa8ff5a36f3ec46cf3f868e82833113a7c8fb0204a87` |
| 81 | `pinophilus-sotto-fase-giovane.webp` | `fasi-40-r01.png` / 0 | A | `f37a096fa57bf144a28c29134f9381b017fb1f98001d3c531d6cd6cc4d128930` |
| 82 | `pleurotus-ostreatus-cappello-fase-adulto.webp` | `fasi-pleurotus-r02.png` / 0 | A | `42c562b6296cedc3bb867f4565dfc7c5dc83758573409b010c0ae88b857772b9` |
| 83 | `pleurotus-ostreatus-gambo-fase-adulto.webp` | `fasi-pleurotus-r02.png` / 1 | A | `76762e5d2bb48227cc0dc540f4f7ffd0480e40e2c4ba4beb8de356c95e024978` |
| 84 | `pleurotus-ostreatus-cappello-fase-giovane.webp` | `fasi-44-r01.png` / 6 | A | `65b14218e12b64ee6c2147846eb4e73572bd1ea17d75bf4e8e0abbdb75b2aa49` |
| 85 | `pleurotus-ostreatus-gambo-fase-giovane.webp` | `fasi-44-r01.png` / 7 | A | `7d786f7c13785ded5e5ef81a79f49a578e7fed80c47d3ecae826c4e2c67c0d09` |
| 86 | `rubroboletus-satanas-cappello-fase-adulto.webp` | `fasi-35-r01.png` / 3 | A | `31d161f765b86fb11677ecaa2f984724789d57e5d041bbc1bb20c583835ea131` |
| 87 | `rubroboletus-satanas-gambo-fase-adulto.webp` | `fasi-35-r01.png` / 5 | A | `c724be32591b42c11567f7ebf6d480d0d1b44d69d0c131fc7b5fde2cb8720eda` |
| 88 | `rubroboletus-satanas-sotto-fase-adulto.webp` | `fasi-35-r01.png` / 4 | A | `35dac6b263a0e78662de08d7917eec4dd560b064dd30ab5c4fad7a1b42e3965a` |
| 89 | `rubroboletus-satanas-cappello-fase-giovane.webp` | `fasi-35-r01.png` / 0 | A | `4d0dcc5d1f359114f102b1acac4026f9623c4998b0224a42f8e187138d358785` |
| 90 | `rubroboletus-satanas-gambo-fase-giovane.webp` | `fasi-35-r01.png` / 2 | A | `02565b7581496f70cb8598631b0c55c3323e873c233a1dffed2d1ca82cad28f5` |
| 91 | `rubroboletus-satanas-sotto-fase-giovane.webp` | `fasi-35-r01.png` / 1 | A | `d6096b9796a3c075b0b318e3f68f88da2632d3bf25e2dd1c678d5159d63ba1a4` |
| 92 | `terreum-cappello-fase-adulto.webp` | `fasi-45-r01.png` / 6 | A | `0aee1d25d369969dfedbc5259355ce66d0e5902d8b92d249b36e86239f914dd2` |
| 93 | `terreum-gambo-fase-adulto.webp` | `fasi-45-r01.png` / 8 | A | `73b86b7eb03b63222660d082964d9db89cf4ae9c508ec1cda09d1b311f938d47` |
| 94 | `terreum-sotto-fase-adulto.webp` | `fasi-45-r01.png` / 7 | A | `67daa2e1425a9a78500e88c083d843d0f4b9614b229475806bc204b7eca17cca` |
| 95 | `terreum-cappello-fase-giovane.webp` | `fasi-45-r01.png` / 3 | A | `f9dd461b3e682cf74fd532c3d1c0476631dc8eae4f25ee6c512de356d420dac9` |
| 96 | `terreum-gambo-fase-giovane.webp` | `fasi-45-r01.png` / 5 | A | `636c00661b52a4cdb2a6facabe279f8487ccabfe9b789c8ab57a4a57557cc457` |
| 97 | `terreum-sotto-fase-giovane.webp` | `fasi-45-r01.png` / 4 | A | `ac86b3e13fd5179e9278bb62a7194f8d401697efb4fd574cec9f48b5fce4a446` |
| 98 | `tylopilus-felleus-cappello-fase-adulto.webp` | `fasi-36-r01.png` / 3 | A | `d7b6fe3737a4da246a2819671d6c8dff46b0e4f41b2be67ce6360440621cd7d4` |
| 99 | `tylopilus-felleus-gambo-fase-adulto.webp` | `fasi-36-r01.png` / 5 | A | `d6de4c0ef4a795198084080bcfe2c90ca4b247e1da4451b68b3da351b43297ef` |
| 100 | `tylopilus-felleus-sotto-fase-adulto.webp` | `fasi-36-r02.png` / 6 | A | `b19562e6bf57cdb1822b8860d16759fa3316efc770cd778d9a294bee0f419180` |
| 101 | `tylopilus-felleus-cappello-fase-giovane.webp` | `fasi-36-r01.png` / 0 | A | `6f86b2183afcc71ecce62a21ef859ef4f0f94793d9dd12cb00a10a3956b74f2c` |
| 102 | `tylopilus-felleus-gambo-fase-giovane.webp` | `fasi-36-r01.png` / 2 | A | `82426ee5120ddbc2edc5ea66887213656ad7eaeabe6c691401cf8db8f063b890` |
| 103 | `tylopilus-felleus-sotto-fase-giovane.webp` | `fasi-36-r02.png` / 0 | A | `0b56ecf09e68f189daedc48816f6c47fb353def6fa4529d97fbee2b54ad21f98` |

## Identità delle18 sorgenti selezionate

| Tavola | SHA-256 |
|---|---|
| `incoming/icone/fasi-31.png` | `ea357178648388b5e6fcb2cfdad10058cb7a4a07747d4f24e5848b2401c4f4de` |
| `incoming/icone/fasi-32.png` | `514a218f46ffdac9287425861c019d8139aad69e2ff539435c25b1a6025036f8` |
| `incoming/icone/fasi-33.png` | `885c6c170d3245c88144f5f9a465f7ceaa15963215b6fee36aafa35c8aa9ee1b` |
| `incoming/icone/fasi-34.png` | `335d76d45f68891cdfb1403403623f5832d15ee6055514501f3f011903a9bfe4` |
| `incoming/icone/fasi-35-r01.png` | `9b8454f2b22e1895fca1a3cc88f790a2796295b75ccbc0f485133d0a704c6a4f` |
| `incoming/icone/fasi-36-r01.png` | `310bea48d2ac28f040007f16cf462f18c3cf1b4f9de10ff9a75315e0c44ca180` |
| `incoming/icone/fasi-36-r02.png` | `ce3fd387d4fd14c36c0a28102afabc41458ff386a49c4f434947215b28d1c3d7` |
| `incoming/icone/fasi-37-r01.png` | `9fc5d8d57a36c38301f692ba2571acb4e4b91ca5c9d855399fa690b88232ae07` |
| `incoming/icone/fasi-38-r01.png` | `4c29ff9a9c175dc67abf4c63dfeef11ec715e1ed3902a579fbed55a6ee30bb35` |
| `incoming/icone/fasi-39-r01.png` | `5fa37fe906bacc46e62657e31e7bea28cb0cf4136abab4aa05fae9aeb8251375` |
| `incoming/icone/fasi-40-r01.png` | `9c7e97a9b880a2adfcdc8b173db4b2d36a6e23716499e978d62ba3b1d5e35528` |
| `incoming/icone/fasi-41-r01.png` | `57c0e7a76a35f727913e31de5c70e64422c006f8485f40ea446306fa76e6f210` |
| `incoming/icone/fasi-42-r01.png` | `7822cc588c81a351435683dfbbce068e836c29262851d653bb287e4ea666e8ce` |
| `incoming/icone/fasi-43-r01.png` | `8c09da12568d4f23cf9f76f20b2666437c1fd4263d8c3f4af97f95a755f62321` |
| `incoming/icone/fasi-44-r01.png` | `9ac6c6e248f6f2338603ca36aeb92d89ce317054fbd77a43dbd959013304db60` |
| `incoming/icone/fasi-45-r01.png` | `e339aac6ca47541572b7b5975b6573dd16bed328e9acbf13945370311b809baf` |
| `incoming/icone/fasi-cibarius-r02.png` | `8ed27af0febd017ad5e7238eed12e23d8d59c0cf4f07d1db26f3cd0955469f84` |
| `incoming/icone/fasi-pleurotus-r02.png` | `5fbfb23ff3bece9bb1fa545582410f418d575c6a77a7d2bb1f33e491ed4d7b82` |

## Indicazione al coordinatore

È possibile procedere all’import selettivo dopo la verifica UI del coordinatore; mantenere le riserve registrate e non approvare implicitamente altre varianti o età. Il controllo non può essere trasferito a raster rigenerati o modificati dopo questi hash. Nessun file da scartare deve entrare nell’indice per la sola presenza fisica nella cartella.
