# Fasi di crescita delle icone dei funghi — brief per l'agente immagini (15/10/2026)

Seguito di `docs/handoff-immagini-varianti.md`. Stesso ramo `gpt/immagini`, stesse regole. Solo file nuovi in `incoming/`, niente PR, niente file dell'app. L'import lo fa poi una sessione Claude con `tools/import_stage_icons.py --stato` (solo le tavole «pronta da integrare» in `incoming/bozze/STATO.md`).

**Stato al 16/10:** integrate le amanite, le lepiote, le mazze di tamburo, i cortinari (14 specie, 79 disegni con le 4 sezioni dell'uovo) e la tavola fasi-30 (prataiolo; prataiolo maggiore giovane). Restano i prataioli e l'entoloma, i porcini e i boleti, le altre specie: `node tools/asset-report.mjs`, categoria `funghi-fasi`.

## Perché

Molti funghi cambiano aspetto mentre crescono. Questo conta per la sicurezza, per le regole di raccolta e per le confusioni.

Esempio, l'ovolo buono: uovo chiuso nella volva → uovo che si apre → giovane → adulto. Nel Lazio è vietato raccogliere gli ovoli chiusi. In quella fase si può confondere con le amanite mortali.

Oggi ogni icona mostra una sola età. Le fasi entrano ora nei dati: campo `stages` di `data/species-traits.json`, con una fonte per ogni fase. **Le immagini si disegnano dai dati**: si disegna solo ciò che è scritto nella fase, niente di più.

Nella scheda, sotto le tessere, comparirà una fila di etichette («Uovo», «Si apre», «Giovane», «Adulto»…). Toccandone una cambiano le tessere di quella fase.

## Cosa disegnare

Per ogni fase della tabella, un disegno per ogni tessera elencata dopo la freccia. Totale: **191 disegni per 33 specie e 79 fasi**: 187 tessere di fase più 4 sezioni dell'uovo.

| Tessera | Cosa mostra | Riferimento |
|---|---|---|
| `cappello` | il cappello visto di lato | come la tessera «cappello» base |
| `gambo` | il fungo intero | come la tessera «gambo» base |
| `sotto` | sotto il cappello: lamelle, pori o tubuli | come la tessera «sotto» base |
| `taglio` | la sezione verticale dell'uovo | nuova: vedi «Sezione dell'uovo» |

Regole per il disegno:

- **Colore del cappello:** quello del disegno base della specie (colonna «Base»). Le varianti di colore restano a parte e non si rifanno per fase.
- **Forma del cappello:** quella scritta nella fase («forma …»). Se la fase non dà una forma, il cappello resta come nella base.
- **Sotto il cappello:** i colori scritti nella fase («sotto …»), con i toni dei campioni di Riconosci (`docs/handoff-immagini-varianti.md`, «Colori»). Se una fase dà due colori, disegna il primo e una sfumatura verso il secondo.
- **Caratteri invariati:** anello, volva, reticolo, verruche, squame e base del gambo restano quelli della base, salvo ciò che la descrizione della fase cambia. Esempi: la volva che si vede solo da giovane nell'amanita arrossante; la cortina dei cortinari giovani; l'anello del coprino che scivola in basso.
- **Niente caratteri inventati:** se la descrizione non lo dice, non si disegna.
- **Stile:** identico alle tavole base. Icona piatta, pochi colori, contorno bruno scuro, fondo trasparente vero, nessun testo. Stessa scala e stesso centro del disegno base della stessa specie. Si confronta in sovrapposizione con la base.
- **Fase uguale alla base:** si disegna lo stesso, così le fasi di una specie sono una serie coerente.

## Sezione dell'uovo (tessera `taglio`)

Solo per le amanite con la fase `uovo` e la tessera `taglio`. Sono quattro:

| Specie | Cosa mostra la sezione, dalle fonti |
|---|---|
| Ovolo buono (`caesarea`) | abbozzo del fungo già arancio dentro il velo bianco (Wikipedia it: «embrione aranciato») |
| Tignosa verdognola (`amanita-phalloides`) | ovolo più stretto in alto; cappello in sezione con sfumature verdognole (Wikipedia it) |
| Tignosa bianca (`amanita-virosa`) | cappello e carne bianchi (Wikipedia it) |
| Ovolo malefico (`amanita-muscaria`) | sotto il velo bianco uno strato giallastro (Wikipedia en) |

Come disegnarla:

- sezione verticale: volva bianca tutto intorno e, dentro, cappello, lamelle e gambo già formati;
- colori come nella tabella, nient'altro;
- **una icona per specie**.

L'amanita crocea ha la fase a uovo ma **non** la sezione: le fonti lette non descrivono l'interno.

> **Avviso che l'app metterà accanto alla sezione** (dai `field_rules` dell'ovolo): aprire un ovolo chiuso resta vietato nel Lazio e non conferma la specie. La sezione serve a capire perché l'uovo è pericoloso, non a riconoscerlo.

## Formato delle tavole

- PNG con alpha, griglia 3×3, stessa misura delle tavole base (1254×1254 px): `incoming/icone/fasi-NN.png`.
- **Una riga per fase.** Le colonne seguono l'ordine delle tessere della fase. Una fase con una sola tessera lascia vuote le altre due celle. Tre fasi per tavola, anche di specie diverse.
- Ogni disegno sta nella sua cella con margine. L'import rifiuta disegni tagliati o a cavallo di due celle.

## Manifest

Aggiungi una riga in `incoming/manifest.json` per ogni disegno, con gli stessi campi delle righe base più:

- `"cella"`: 0–8, da sinistra a destra e dall'alto in basso;
- `"fase"`: l'`id` della fase, come in tabella (`uovo`, `apertura`, `giovane`, `adulto`, `maturo`, `sciolto`);
- `"tessera"`: una delle tessere della fase.

Niente `variante` nelle righe di fase.

```json
{"file": "incoming/icone/fasi-01.png", "tipo": "illustrazione", "soggetto": "caesarea", "tessera": "taglio", "cella": 2, "fase": "uovo", "modello": "image_gen (…)", "prompt": "…"}
```

L'import (`tools/import_stage_icons.py`, chiamato anche da `tools/import_trait_icons.py`) rifiuta, riga per riga e con il motivo:
- una fase che non è tra gli `stages` della specie;
- una tessera che non è nelle `tiles` di quella fase;
- una riga con sia `fase` sia `variante`.

I file diventano `assets/traits/<specie>-<tessera>-fase-<id>.webp`. Lo stato di ogni tavola va in `incoming/bozze/STATO.md`.

## Priorità

Prima le amanite, poi i loro sosia e le altre specie mortali, poi gli altri:

1. amanite;
2. lepiote, mazze di tamburo e cortinari mortali;
3. prataioli e i loro sosia;
4. porcini e boleti;
5. altre specie.

## Specie, fasi e fonti

«Base» = colore e forma del disegno base già approvato (`data/trait-icons.json`, `base`). Le descrizioni sono quelle dei dati: descrivono caratteri, non servono a identificare.

### 1. Amanite

| Specie | Base (colore, forma) | Fase → tessere | Cosa mostra | Fonte |
|---|---|---|---|---|
| Ovolo buono (`caesarea`, commestibile) | arancio, convesso | **Uovo** (`uovo`) → cappello, gambo, taglio | Tutto chiuso nel velo bianco, come un uovo. In sezione si vede l’abbozzo del fungo già arancio. | [Wikipedia it](https://it.wikipedia.org/wiki/Amanita_caesarea) |
|  |  | **Si apre** (`apertura`) → cappello, gambo | Il velo si lacera e il cappello emisferico esce dalla volva bianca. — forma emisferico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_caesarea) |
|  |  | **Giovane** (`giovane`) → cappello, gambo | Cappello convesso, la volva bianca a sacco resta alla base. — forma convesso | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_caesarea) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello aperto fino a piano. — forma piano | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_caesarea) |
| Tignosa verdognola (`amanita-phalloides`, mortale) | verde, convesso | **Uovo** (`uovo`) → cappello, gambo, taglio | Ancora chiusa nell’ovolo, più stretto in alto che in basso. In sezione il cappello ha sfumature verdognole. | [Wikipedia it](https://it.wikipedia.org/wiki/Amanita_phalloides) |
|  |  | **Si apre** (`apertura`) → cappello, gambo | Il velo bianco si rompe e resta alla base come volva; cappello arrotondato, emisferico. — forma emisferico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_phalloides) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello appiattito con l’età. — forma piano | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_phalloides) |
| Tignosa bianca (`amanita-virosa`, mortale) | bianco, conico | **Uovo** (`uovo`) → cappello, gambo, taglio | Ancora chiusa ad uovo. Cappello bianco candido e carne bianca: in sezione tutto bianco. | [Wikipedia it](https://it.wikipedia.org/wiki/Amanita_virosa) |
|  |  | **Si apre** (`apertura`) → cappello, gambo | Il fungo esce dal velo allungandosi; a volte restano lembi di velo al margine. Cappello conico con il margine piegato in dentro. — forma conico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_virosa) |
|  |  | **Giovane** (`giovane`) → cappello, gambo | Cappello emisferico. — forma emisferico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_virosa) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello che si appiattisce. — forma piano | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_virosa) |
| Tignosa di primavera (`amanita-verna`, mortale) | bianco, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello emisferico, bianco o crema pallido. — forma emisferico | [SSSA Pisa](https://iris.santannapisa.it/retrieve/dd9e0b31-bbf8-709e-e053-3705fe0a83fd/92_vqr_Funghi.pdf) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello da convesso a quasi piatto. — forma piano | [SSSA Pisa](https://iris.santannapisa.it/retrieve/dd9e0b31-bbf8-709e-e053-3705fe0a83fd/92_vqr_Funghi.pdf) |
| Ovolo malefico (`amanita-muscaria`, tossico) | rosso, convesso | **Uovo** (`uovo`) → cappello, gambo, taglio | Esce dal terreno come un uovo bianco coperto dal velo. In sezione, sotto il velo, uno strato giallastro. | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_muscaria) |
|  |  | **Si apre** (`apertura`) → cappello, gambo | Il rosso compare dove il velo si rompe; il cappello è emisferico, con verruche fitte. — forma emisferico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_muscaria) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello aperto, quasi piatto; le verruche sembrano più rade. Età e pioggia possono sbiadire il rosso e togliere le verruche. — forma piano | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_muscaria) |
| Amanita crocea (`amanita-crocea`, tossico) | arancio, convesso | **Uovo** (`uovo`) → cappello, gambo | All’inizio a forma di uovo, liscio. | [First Nature](https://www.first-nature.com/fungi/amanita-crocea.php) |
|  |  | **Si apre** (`apertura`) → cappello, gambo | Il gambo si allunga e spinge il cappello fuori dalla volva, il velo generale rotto. | [First Nature](https://www.first-nature.com/fungi/amanita-crocea.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello convesso o anche piano, con un piccolo umbone più scuro. — forma convesso | [First Nature](https://www.first-nature.com/fungi/amanita-crocea.php) |
| Tignosa panterina (`amanita-pantherina`, tossico) | bruno, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello emisferico. — forma emisferico | [Wikipedia en](https://en.wikipedia.org/wiki/Amanita_pantherina) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello che tende ad appiattirsi. — forma piano | [First Nature](https://www.first-nature.com/fungi/amanita-pantherina.php) |
| Amanita arrossante (`amanita-rubescens`, commestibile con cautela) | rosa, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello a cupola. La volva si vede solo negli esemplari molto giovani. — forma emisferico | [First Nature](https://www.first-nature.com/fungi/amanita-rubescens.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello appiattito; restano solo la base ingrossata e, spesso, macchie rosa o rosso ruggine sulle lamelle. — forma piano | [First Nature](https://www.first-nature.com/fungi/amanita-rubescens.php) |

### 2. Lepiote, mazze di tamburo e cortinari mortali

| Specie | Base (colore, forma) | Fase → tessere | Cosa mostra | Fonte |
|---|---|---|---|---|
| Mazza di tamburo (`procera`, commestibile) | crema, ombrellato | **Giovane** (`giovane`) → cappello, gambo | Cappello quasi sferico, chiuso «a mazza di tamburo», bruno chiaro con il centro più scuro. — forma emisferico | [First Nature](https://www.first-nature.com/fungi/macrolepiota-procera.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello aperto fino a piano, con un piccolo umbone al centro: «a ombrello». L’anello diventa mobile. — forma ombrellato | [First Nature](https://www.first-nature.com/fungi/macrolepiota-procera.php) |
| Mazza di tamburo arrossante (`chlorophyllum-rhacodes`, tossico) | crema, ombrellato | **Giovane** (`giovane`) → cappello, gambo | Cappello a panino, arrotondato. — forma emisferico | [First Nature](https://www.first-nature.com/fungi/chlorophyllum-rhacodes.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello espanso e convesso; di rado si apre del tutto piatto. — forma convesso | [First Nature](https://www.first-nature.com/fungi/chlorophyllum-rhacodes.php) |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`, mortale) | rosa, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello emisferico, con superficie feltrata bruno-rosata. — forma emisferico | [First Nature](https://www.first-nature.com/fungi/lepiota-brunneoincarnata.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello largamente convesso, a volte quasi piatto; la superficie si rompe in squamette lanose in cerchi irregolari. — forma convesso | [First Nature](https://www.first-nature.com/fungi/lepiota-brunneoincarnata.php) |
| Lepiota crestata (`lepiota-cristata`, tossico) | bianco, ombrellato | **Giovane** (`giovane`) → cappello, gambo | Cappello da campanulato a convesso. — forma convesso | [Wikipedia en](https://en.wikipedia.org/wiki/Lepiota_cristata) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello appiattito con un umbone, squame bruno-rossastre in cerchi concentrici. — forma ombrellato | [Wikipedia en](https://en.wikipedia.org/wiki/Lepiota_cristata) |
| Cortinario orellano (`cortinarius-orellanus`, mortale) | arancio, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello convesso. Lamelle giallo pallido, coperte da una cortina debole. — forma convesso; sotto giallo | [First Nature](https://www.first-nature.com/fungi/cortinarius-orellanus.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello appiattito con un leggero umbone. Lamelle rosse. — forma piano; sotto rosso | [First Nature](https://www.first-nature.com/fungi/cortinarius-orellanus.php) |
| Cortinario rubello (`cortinarius-rubellus`, mortale) | arancio, conico | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello convesso. Lamelle giallo pallido, coperte da una cortina simile a una ragnatela. — forma convesso; sotto giallo | [First Nature](https://www.first-nature.com/fungi/cortinarius-rubellus.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello appiattito. Lamelle bruno ruggine. — forma piano; sotto bruno | [First Nature](https://www.first-nature.com/fungi/cortinarius-rubellus.php) |

### 3. Prataioli e loro sosia

| Specie | Base (colore, forma) | Fase → tessere | Cosa mostra | Fonte |
|---|---|---|---|---|
| Prataiolo (`agaricus-campestris`, commestibile) | bianco, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello globoso con il margine unito al gambo, poi emisferico. Lamelle rosa. — forma emisferico; sotto rosa | [Wikipedia it](https://it.wikipedia.org/wiki/Agaricus_campestris) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello piano-convesso. Lamelle bruno scure, quasi nere; l’anello quasi scompare. — forma convesso; sotto bruno/nero | [First Nature](https://www.first-nature.com/fungi/agaricus-campestris.php) |
| Prataiolo maggiore (`agaricus-arvensis`, commestibile) | crema, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello quasi sferico. Lamelle rosa pallido. — forma emisferico; sotto rosa | [First Nature](https://www.first-nature.com/fungi/agaricus-arvensis.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello aperto fino a piano o quasi. Lamelle brune. — forma piano; sotto bruno | [First Nature](https://www.first-nature.com/fungi/agaricus-arvensis.php) |
| Champignon (`agaricus-bisporus`, commestibile) | bruno, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello emisferico. Lamelle rosa. — forma emisferico; sotto rosa | [First Nature](https://www.first-nature.com/fungi/agaricus-bisporus.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello convesso, poi appiattito. Lamelle bruno cioccolato. — forma piano; sotto bruno | [First Nature](https://www.first-nature.com/fungi/agaricus-bisporus.php) |
| Prataiolo dei boschi (`agaricus-sylvicola`, commestibile) | crema, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello quasi sferico. Lamelle bianche. — forma emisferico; sotto bianco | [First Nature](https://www.first-nature.com/fungi/agaricus-sylvicola.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello convesso. Lamelle grigio-rosa. — forma convesso; sotto grigio/rosa | [First Nature](https://www.first-nature.com/fungi/agaricus-sylvicola.php) |
|  |  | **Maturo** (`maturo`) → cappello, sotto, gambo | Cappello del tutto appiattito. Lamelle bruno cioccolato. — forma piano; sotto bruno | [First Nature](https://www.first-nature.com/fungi/agaricus-sylvicola.php) |
| Prataiolo ingiallente (`agaricus-xanthodermus`, tossico) | bianco, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello globoso, spesso con la cima piatta. Lamelle biancastre che presto diventano rosa. — forma emisferico; sotto bianco/rosa | [First Nature](https://www.first-nature.com/fungi/agaricus-xanthodermus.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello largamente convesso, senza margine arrotolato. Lamelle grigio-brune. — forma convesso; sotto grigio/bruno | [First Nature](https://www.first-nature.com/fungi/agaricus-xanthodermus.php) |
| Entoloma livido (`entoloma-sinuatum`, tossico) | grigio, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello conico. Lamelle bianco-giallastre. — forma conico; sotto giallo | [First Nature](https://www.first-nature.com/fungi/entoloma-sinuatum.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello da convesso a piano, con un umbone ottuso. Lamelle rosate. — forma piano; sotto rosa | [First Nature](https://www.first-nature.com/fungi/entoloma-sinuatum.php) |

### 4. Porcini e boleti

| Specie | Base (colore, forma) | Fase → tessere | Cosa mostra | Fonte |
|---|---|---|---|---|
| Porcino (`edulis`, commestibile) | bruno, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello emisferico, a volte piccolo rispetto al gambo. Tubuli bianchi. — forma emisferico; sotto bianco | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_edulis) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello piano-convesso. Tubuli giallastri. — forma convesso; sotto giallo | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_edulis) |
|  |  | **Maturo** (`maturo`) → sotto | Tubuli verdastri. — sotto verde | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_edulis) |
| Porcino rosso (`pinophilus`, commestibile) | rosso, convesso | **Giovane** (`giovane`) → sotto | Pori bianchi. — sotto bianco | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_pinophilus) |
|  |  | **Adulto** (`adulto`) → sotto | Pori gialli od olivastri. — sotto giallo/verde | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_pinophilus) |
| Porcino nero (`aereus`, commestibile) | nero, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello emisferico. Tubuli e pori bianchi. — forma emisferico; sotto bianco | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aereus) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello convesso. Pori giallastri. — forma convesso; sotto giallo | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aereus) |
|  |  | **Maturo** (`maturo`) → cappello, sotto, gambo | Cappello aperto e spianato; i pori formano una spugna giallo sporco. — forma piano; sotto giallo | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aereus) |
| Porcino estivo (`aestivalis`, commestibile) | bruno, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello tondeggiante, poi emisferico. Pori bianchi. — forma emisferico; sotto bianco | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aestivalis) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello quasi appiattito, raramente disteso del tutto. Pori giallini. — forma convesso; sotto giallo | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aestivalis) |
|  |  | **Maturo** (`maturo`) → sotto | Pori giallo-verdastri. — sotto giallo/verde | [Wikipedia it](https://it.wikipedia.org/wiki/Boletus_aestivalis) |
| Porcino di fiele (`tylopilus-felleus`, non commestibile) | crema, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello emisferico. Tubuli e pori bianchi. — forma emisferico; sotto bianco | [Wikipedia it](https://it.wikipedia.org/wiki/Tylopilus_felleus) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello spianato. Pori rosati. — forma piano; sotto rosa | [Wikipedia it](https://it.wikipedia.org/wiki/Tylopilus_felleus) |
| Boleto satana (`rubroboletus-satanas`, tossico) | crema, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello arrotondato, a cupola. Pori giallastri negli esemplari molto giovani. — forma emisferico; sotto giallo | [First Nature](https://www.first-nature.com/fungi/rubroboletus-satanas.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello che può diventare irregolare e lobato. Pori arancio, poi rossi. — forma convesso; sotto arancio/rosso | [First Nature](https://www.first-nature.com/fungi/rubroboletus-satanas.php) |

### 5. Altre specie

| Specie | Base (colore, forma) | Fase → tessere | Cosa mostra | Fonte |
|---|---|---|---|---|
| Coprinus comatus (`coprinus-comatus`, commestibile con cautela) | bianco, conico | **Giovane** (`giovane`) → cappello, sotto, gambo | Esce dal terreno come un cilindro bianco: il cappello copre quasi tutto il gambo. Lamelle bianche. — forma conico; sotto bianco | [Wikipedia en](https://en.wikipedia.org/wiki/Coprinus_comatus) |
|  |  | **Maturo** (`maturo`) → cappello, sotto, gambo | Il cappello si apre a campana allungata; le lamelle diventano rosa. — forma conico; sotto rosa | [First Nature](https://www.first-nature.com/fungi/coprinus-comatus.php) |
|  |  | **Si scioglie** (`sciolto`) → cappello, sotto, gambo | Le lamelle diventano nere e si sciolgono dal margine in un liquido scuro; l’anello si macchia di nero e scivola in basso. — forma conico; sotto nero | [First Nature](https://www.first-nature.com/fungi/coprinus-comatus.php) |
| Finferlo (`cibarius`, commestibile) | giallo, imbuto | **Giovane** (`giovane`) → cappello, gambo | Cappello convesso. — forma convesso | [Wikipedia it](https://it.wikipedia.org/wiki/Cantharellus_cibarius) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello piano e avvallato, a imbuto. — forma imbuto | [Wikipedia it](https://it.wikipedia.org/wiki/Cantharellus_cibarius) |
| Gelone (`pleurotus-ostreatus`, commestibile) | grigio, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello convesso. — forma convesso | [First Nature](https://www.first-nature.com/fungi/pleurotus-ostreatus.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello depresso al centro, con il margine ondulato. — forma imbuto | [First Nature](https://www.first-nature.com/fungi/pleurotus-ostreatus.php) |
| Chiodino (`mellea`, commestibile con cautela) | giallo, convesso | **Giovane** (`giovane`) → cappello, gambo | Cappello molto convesso, coperto di squamette fini, soprattutto al centro. — forma convesso | [First Nature](https://www.first-nature.com/fungi/armillaria-mellea.php) |
|  |  | **Adulto** (`adulto`) → cappello, gambo | Cappello appiattito, spesso con il margine ondulato e striato; le squamette possono non vedersi più. — forma piano | [First Nature](https://www.first-nature.com/fungi/armillaria-mellea.php) |
| Falso chiodino (`hypholoma-fasciculare`, tossico) | giallo, convesso | **Giovane** (`giovane`) → sotto | Lamelle giallo zolfo. — sotto giallo | [First Nature](https://www.first-nature.com/fungi/hypholoma-fasciculare.php) |
|  |  | **Adulto** (`adulto`) → sotto | Lamelle verde oliva. — sotto verde | [First Nature](https://www.first-nature.com/fungi/hypholoma-fasciculare.php) |
|  |  | **Maturo** (`maturo`) → sotto | Lamelle che anneriscono man mano che le spore maturano. — sotto nero | [First Nature](https://www.first-nature.com/fungi/hypholoma-fasciculare.php) |
| Pioppino (`cyclocybe-aegerita`, commestibile con cautela) | bruno, convesso | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello emisferico. Lamelle crema. — forma emisferico; sotto crema | [First Nature](https://www.first-nature.com/fungi/cyclocybe-cylindracea.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello largamente convesso o piano, margine ondulato, più scuro con l’età. Lamelle grigio-brune, poi brune. — forma piano; sotto grigio/bruno | [First Nature](https://www.first-nature.com/fungi/cyclocybe-cylindracea.php) |
| Moretta (`terreum`, commestibile) | grigio, conico | **Giovane** (`giovane`) → cappello, sotto, gambo | Cappello conico. Lamelle bianche. — forma conico; sotto bianco | [First Nature](https://www.first-nature.com/fungi/tricholoma-terreum.php) |
|  |  | **Adulto** (`adulto`) → cappello, sotto, gambo | Cappello quasi piatto con un piccolo umbone. Lamelle grigie, spesso con toni gialli. — forma piano; sotto grigio | [First Nature](https://www.first-nature.com/fungi/tricholoma-terreum.php) |

## Specie senza fasi

- **Fasi quasi identiche**, quindi niente fasi: specie a una sola forma (trombetta dei morti, craterelli, urnula, spugnole, falsa spugnola, inocibe lilla, lingua di bue). Lo stesso per le specie dove le fonti descrivono solo un appiattimento del cappello: sono già coperte dalle varianti di forma (russule, lattari, tricolomi, chiodino senza anello, galerina, folliote, idni, Sarcodon, pinaroli e altri, `docs/handoff-immagini-mancanti.md`, punto 3).
- **Fuori per mancanza di fonte** (senza fonte la fase non entra):
  - la fase a uovo della tignosa di primavera (`amanita-verna`): nessuna fonte letta la descrive;
  - la sezione dell'uovo dell'amanita crocea;
  - le fasi della lepiota subincarnata (First Nature non leggibile, Wikipedia en senza età);
  - le fasi della mazza di tamburo velenosa: Wikipedia it dice «semiovale, poi campanulato», forme che non sono nei dati, e non si è trovata una seconda fonte (D6, `docs/controllo-matrici-2026-10-15.md`);
  - le fasi di colombina verde, cardoncello e cornucopia (non verificate in questo giro).

## Consegna e controllo

- Aggiorna `incoming/bozze/STATO.md` e `incoming/NOTE.md` (cosa è semplificato e perché).
- Dopo l'import, le voci arrivate vanno tolte da `data/asset-pending.json`. Il test `tests/asset-completeness.test.mjs` lo chiede.
- Dopo aver importato icone ridisegnate: `node tools/asset-report.mjs --snapshot`.
- Le decisioni nuove si chiedono a Matteo con domande a scelta, con l'opzione consigliata per prima.
