# Ricognizione dell’integrazione dei cataloghi · 20 ottobre 2026

Richiesta di Matteo: ricognizione fungo per fungo, albero per albero, pianta per pianta e sezione per sezione, partendo dal confronto assente del «corpino», inteso qui come **Coprino chiomato / Coprinus comatus**. Nessuna correzione tassonomica dedotta dal refuso.

Inventario sullo stato locale della produzione `23cf5154` (PR #166, shell v266). Il coordinatore sta correggendo separatamente l’accesso al confronto libero con shell v267; questa ricognizione documenta la causa prima della correzione e non dichiara il rilascio della patch. Nessuna modifica a codice, dati, immagini o produzione da parte dell’agente di ricognizione. Nessuna suite avviata. Gli URL delle fonti sono quelli registrati: non sono stati riletti online. Non sono state consultate osservazioni private, D1 o snapshot del CMS live. I contenuti autoriali del CMS possono differire dai JSON.

## Risultato e cause

| Copertura | Esito |
|---|---|
| funghi | 100 |
| commestibili | 51 |
| funghi_con_modello | 14 |
| funghi_senza_traits | 12 |
| funghi_senza_relazioni | 22 |
| funghi_senza_tessere_base | 12 |
| alberi | 39 |
| alberi_con_sosia | 35 |
| piante | 78 |
| piante_con_sosia_scheda | 26 |
| piante_con_relazioni_nella_matrice | 30 |
| piante_anatomie_senza_revisione | 235 |
| animali | 31 |
| animali_con_foto | 27 |
| file_foto_mancanti | 0 |
| crediti_foto_incompleti | 0 |

Il numero dei taxa non è il numero di specie biologiche distinte: restano aggregazioni e sinonimi già dichiarati. Le 22 schede di `edible-catalog.json` sono già incluse nei 100 taxa, quindi non vanno sommate. Il catalogo commestibili effettivo contiene 51 voci; `docs/catalogo-commestibili.md` riporta ancora la fotografia storica di 46 e deve essere aggiornato, senza riscrivere la storia delle fonti.

Tre lacune diverse causavano la sensazione di funzionalità distribuite a caso:

1. **Dato presente, accesso assente.** Il confronto libero fungino accetta tutti i taxa, ma `js/identify.js::compareCta()` restituiva stringa vuota senza sosia documentati. Non significa che manchino i caratteri. La correzione separata del coordinatore rende visibile l’accesso libero senza inventare sosia.
2. **Relazione o dato scientifico assente.** Dodici nuovi funghi hanno descrizioni e fonti, ma `traits:null`: la tabella a due non può convertirle automaticamente in valori chiusi. La relazione di somiglianza richiede evidenza distinta dal fatto che due taxa abbiano nomi vicini.
3. **Modulo esistente, integrazione non uniforme.** Piante e alberi hanno matrici complete come presenza di record; non tutti i campi sono documentati. Le piante hanno confronto a due. Gli alberi hanno schede di specie simili e chiave guidata, ma nessuna route a due. Il blocco completo di osservazioni personali e segnalazioni per zona è realizzato per gli animali, non come componente comune di tutte le schede.

### Coprino: cosa si recupera davvero

`data/species-traits.json#/taxa/coprinus-comatus` contiene caratteri, controlli testuali, fonti, tre fasi e nessuna relazione in `dangerous_lookalikes`; `edible_id:null` indica assenza di modello dell’indice, non assenza di scheda. `data/trait-icons.json#/taxa/coprinus-comatus` e i file in `assets/traits/coprinus-comatus-*` coprono già le tre parti e le fasi. Le foto sono in `data/media.json#/species/coprinus-comatus`. Il sinonimo comune è registrato in `data/edible-catalog.json#/species`: «coprino chiomato».

`data/species-traits.json#/taxa/coprinopsis-atramentaria` esiste e ha quattro controlli morfologici testuali, habitat, stagione letterale e due fonti puntuali, ma non ha caratteri chiusi né relazioni. Le tre tessere attese sono già registrate fra le pendenze. Il confronto libero può mostrarlo, dichiarando il dato non documentato; **non equivale a un confronto scientifico completato**.

Materiale locale recuperabile: `incoming/catalog-expansion-2026-10-19/funghi/claim-evidence.json` e le fonti istituzionali già collegate al record per strutturare, dopo verifica puntuale, le sole affermazioni sostenute. Non è stata trovata una relazione locale esplicita e già approvata Coprinus/Coprinopsis da trasferire. I manifest delle fasi e i prompt illustrativi non sono fonti della relazione. `docs/handoff-immagini-mancanti.md` e `docs/ipotesi/revisione-indipendente-fasi-funghi-2026-10-18.md` documentano invece anatomie/fasi già adottate: non serve rifarle per riaprire il confronto.

## Come leggere l’inventario voce per voce

- **Caratteri N/T:** campi non nulli e non vuoti su campi registrati; non misura correttezza, precisione o completezza tassonomica. `false` è un dato presente. Il JSON allegato elenca tutti i campi ignoti per ogni voce.
- **Foto:** file effettivamente risolti secondo il renderer; controllata esistenza dei percorsi normale/HD/miniatura e presenza dei campi di credito. Nessuna nuova revisione visiva di centinaia di foto e nessuna verifica online delle licenze.
- **Base/fasi funghi:** conteggio dei file presenti, non approvazione anatomica. Le tre parti sono cappello, sotto, gambo.
- **Relazioni:** ID realmente presenti nelle relazioni lette dall’app; un trattino significa assenza di relazione documentata in quel percorso, non assenza biologica di sosia.
- **Glossario e Taccuino:** tutti i renderer dichiarano il proprio ambito e dispongono dell’azione per annotare; non significa che ogni nome abbia una voce di glossario o che tutti i termini siano collegati. Il glossario contiene 131 termini (21 Funghi, 65 Piante, 21 Alberi, 8 Animali, 7 Bosco, 9 Sentiero). Le annotazioni esistenti non sono state lette.
- **Osservazioni:** nessuna riga trasforma una fotografia di catalogo, un ambiente compatibile o un ettaro di bosco in un avvistamento. Per funghi/piante/alberi resta da uniformare l’elenco personale e il riepilogo per zona. L’azione di annotazione da sola non assolve questa integrazione.
- Il file [JSON completo](ricognizione-integrazione-cataloghi-2026-10-20.json) conserva route, ID, fonti puntuali, percorsi foto, campi ignoti, relazioni, opportunità e priorità per ciascuna voce.

## Funghi: inventario completo

Fonti dei dati: `data/species-traits.json#/taxa/<id>`, `data/edible-catalog.json#/species`, `data/species-id.json#/species`, `data/media.json`, `data/trait-icons.json`; renderer `js/identify.js`, `js/speciescard.js`, `js/app.js::renderEdiblePage`. La route mostrata è quella del catalogo commestibili, quando applicabile; gli altri passano da `#/fungo/<id>`. Il confronto libero usa `#/confronta/<id>` per preselezionare il riferimento.

La colonna CTA fotografa la **base v266**: «sosia» ha già accesso, «libero da esporre» è la lacuna UI corretta separatamente. Fonti e contesto glossario sono presenti per tutte le 100 voci; `data/species-id.json` è un approfondimento di 14 voci, non un secondo catalogo da sommare.

| Fungo · ID | Caratteri / controlli | Foto | Base / fasi | Sosia documentati · ID | CTA base | Recupero |
|---|---|---|---|---|---|---|
| Agarico involuto (`paxillus-involutus`) | 0/0 · 4 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Agarico tigrino (`tricholoma-pardinum`) | 19/20 · 3 testi | 3 | 3/3 · 0 | terreum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Agarico violetto (`nuda`) | 20/20 · 4 testi | 3 | 3/3 · 0 | cortinarius-traganus, cortinarius-violaceus, inocybe-lilacina, mycena-pura, laccaria-amethystina | sosia | Riutilizzare collegamenti alberi documentati.  |
| Amanita arrossante (`amanita-rubescens`) | 16/20 · 4 testi | 4 | 3/3 · 2 | amanita-muscaria, amanita-pantherina | sosia | Conservare; uniformare connessioni Fronda. |
| Amanita crocea (`amanita-crocea`) | 18/20 · 3 testi | 4 | 3/3 · 3 | caesarea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto a piede rosso (`neoboletus-luridiformis`) | 19/20 · 3 testi | 1 | 3/3 · 0 | pinophilus, aereus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto baio (`imleria-badia`) | 19/20 · 3 testi | 3 | 3/3 · 0 | aereus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto bovino (`suillus-bovinus`) | 19/20 · 3 testi | 2 | 3/3 · 0 | suillus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto dal bel piede (`caloboletus-calopus`) | 19/20 · 2 testi | 3 | 3/3 · 0 | edulis, pinophilus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto pepato (`chalciporus-piperatus`) | 19/20 · 2 testi | 5 | 3/3 · 0 | suillus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto radicante (`caloboletus-radicans`) | 19/20 · 2 testi | 4 | 3/3 · 0 | edulis, aestivalis | sosia | Riutilizzare collegamenti alberi documentati.  |
| Boleto satana (`rubroboletus-satanas`) | 19/20 · 3 testi | 1 | 3/3 · 2 | edulis, aestivalis | sosia | Riutilizzare collegamenti alberi documentati.  |
| Cardoncello (`pleurotus-eryngii`) | 19/20 · 4 testi | 3 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Champignon (`agaricus-bisporus`) | 16/20 · 4 testi | 3 | 3/3 · 2 | amanita-phalloides, amanita-verna, amanita-virosa, agaricus-xanthodermus | sosia | Conservare; uniformare connessioni Fronda. |
| Chiodino (`mellea`) | 20/20 · 4 testi | 2 | 3/3 · 2 | galerina-marginata, hypholoma-fasciculare, cortinarius-rubellus, gymnopilus-junonius, pholiota-squarrosa, armillaria-tabescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Chiodino senza anello (`armillaria-tabescens`) | 20/20 · 2 testi | 2 | 3/3 · 0 | mellea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Clitocibe rivulosa (`clitocybe-rivulosa`) | 18/20 · 5 testi | 2 | 3/3 · 0 | calocybe-gambosa, marasmius-oreades | sosia | Conservare; uniformare connessioni Fronda. |
| Colombina (`russula-vesca`) | 0/0 · 5 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Colombina dorata (`russula-aurea`) | 17/20 · 4 testi | 5 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Colombina rossa (`russula-emetica`) | 0/0 · 4 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Colombina verde (`virescens`) | 20/20 · 5 testi | 5 | 3/3 · 0 | amanita-phalloides, russula-heterophylla, russula-olivacea, russula-aeruginea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Coprino atramentario (`coprinopsis-atramentaria`) | 0/0 · 4 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Coprinus comatus (`coprinus-comatus`) | 17/20 · 4 testi | 4 | 3/3 · 3 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Cornucopia (`pleurotus-cornucopiae`) | 16/20 · 4 testi | 4 | 3/3 · 0 | omphalotus-olearius | sosia | Riutilizzare collegamenti alberi documentati.  |
| Cortinario orellano (`cortinarius-orellanus`) | 19/20 · 3 testi | 1 | 3/3 · 2 | cibarius | sosia | Riutilizzare collegamenti alberi documentati.  |
| Cortinario rubello (`cortinarius-rubellus`) | 19/20 · 3 testi | 2 | 3/3 · 2 | mellea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Cortinario tragano (`cortinarius-traganus`) | 19/20 · 3 testi | 5 | 3/3 · 0 | nuda | sosia | Riutilizzare collegamenti alberi documentati.  |
| Cortinario violaceo (`cortinarius-violaceus`) | 20/20 · 3 testi | 5 | 3/3 · 0 | nuda | sosia | Riutilizzare collegamenti alberi documentati.  |
| Craterello cenerino (`craterellus-cinereus`) | 20/20 · 3 testi | 2 | 3/3 · 0 | cornucopioides | sosia | Riutilizzare collegamenti alberi documentati.  |
| Craterello sinuoso (`pseudocraterellus-undulatus`) | 19/20 · 3 testi | 3 | 3/3 · 0 | cornucopioides | sosia | Riutilizzare collegamenti alberi documentati.  |
| Entoloma livido (`entoloma-sinuatum`) | 20/20 · 3 testi | 4 | 3/3 · 2 | terreum, calocybe-gambosa | sosia | Riutilizzare collegamenti alberi documentati.  |
| Falsa spugnola (`gyromitra-esculenta`) | 13/20 · 5 testi | 3 | 3/3 · 0 | morchella-esculenta, morchella-elata | sosia | Riutilizzare collegamenti alberi documentati.  |
| Falso chiodino (`hypholoma-fasciculare`) | 19/20 · 2 testi | 2 | 3/3 · 3 | mellea, cyclocybe-aegerita | sosia | Riutilizzare collegamenti alberi documentati.  |
| Falso gallinaccio (`hygrophoropsis-aurantiaca`) | 20/20 · 3 testi | 3 | 3/3 · 0 | cibarius | sosia | Riutilizzare collegamenti alberi documentati.  |
| Finferla (`craterellus-lutescens`) | 15/20 · 4 testi | 2 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Finferlo (`cibarius`) | 20/20 · 5 testi | 3 | 3/3 · 2 | omphalotus-olearius, hygrophoropsis-aurantiaca, cortinarius-orellanus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Folliota spettabile (`gymnopilus-junonius`) | 19/20 · 2 testi | 3 | 3/3 · 0 | mellea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Folliota squarrosa (`pholiota-squarrosa`) | 19/20 · 3 testi | 5 | 3/3 · 0 | mellea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Fungo dell'olivo (`omphalotus-olearius`) | 20/20 · 3 testi | 2 | 3/3 · 0 | cibarius, pleurotus-cornucopiae | sosia | Riutilizzare collegamenti alberi documentati.  |
| Fungo dell’esca (`fomes-fomentarius`) | 0/0 · 4 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Galerina marginata (`galerina-marginata`) | 19/20 · 3 testi | 3 | 3/3 · 0 | mellea, cyclocybe-aegerita, marasmius-oreades | sosia | Riutilizzare collegamenti alberi documentati.  |
| Gambesecche (`marasmius-oreades`) | 20/20 · 4 testi | 3 | 3/3 · 0 | lepiota-brunneoincarnata, galerina-marginata, inocybe, clitocybe-rivulosa | sosia | Conservare; uniformare connessioni Fronda. |
| Gelone (`pleurotus-ostreatus`) | 17/20 · 4 testi | 4 | 3/3 · 2 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Idnello di Peck (`hydnellum-peckii`) | 19/20 · 3 testi | 3 | 3/3 · 0 | repandum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Inocibe lilla (`inocybe-lilacina`) | 20/20 · 3 testi | 1 | 3/3 · 0 | nuda | sosia | Riutilizzare collegamenti alberi documentati.  |
| Inocibi (genere) (`inocybe`) | 18/20 · 3 testi | 0 | 3/3 · 0 | terreum, cyclocybe-aegerita, calocybe-gambosa, marasmius-oreades | sosia | Riutilizzare collegamenti alberi documentati.  |
| Laccaria ametistina (`laccaria-amethystina`) | 20/20 · 3 testi | 3 | 3/3 · 0 | nuda | sosia | Riutilizzare collegamenti alberi documentati.  |
| Lardaiolo (`hygrophorus-latitabundus`) | 19/20 · 4 testi | 3 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Lardaiolo rosso (`hygrophorus-russula`) | 0/0 · 4 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Lattario degli abeti (`lactarius-deterrimus`) | 17/20 · 4 testi | 4 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`) | 18/20 · 3 testi | 3 | 3/3 · 2 | procera, marasmius-oreades | sosia | Riutilizzare collegamenti alberi documentati.  |
| Lepiota crestata (`lepiota-cristata`) | 19/20 · 3 testi | 2 | 3/3 · 2 | procera | sosia | Riutilizzare collegamenti alberi documentati.  |
| Lepiota subincarnata (`lepiota-subincarnata`) | 18/20 · 3 testi | 4 | 3/3 · 0 | procera | sosia | Conservare; uniformare connessioni Fronda. |
| Lingua di bue (`fistulina-hepatica`) | 14/20 · 4 testi | 4 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Marzuolo (`hygrophorus-marzuolus`) | 20/20 · 4 testi | 3 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Mazza di tamburo (`procera`) | 20/20 · 5 testi | 3 | 3/3 · 2 | lepiota-brunneoincarnata, lepiota-subincarnata, lepiota-cristata, chlorophyllum-rhacodes, chlorophyllum-venenatum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Mazza di tamburo arrossante (`chlorophyllum-rhacodes`) | 19/20 · 3 testi | 4 | 3/3 · 2 | procera | sosia | Riutilizzare collegamenti alberi documentati.  |
| Mazza di tamburo velenosa (`chlorophyllum-venenatum`) | 19/20 · 3 testi | 1 | 3/3 · 0 | procera | sosia | Conservare; uniformare connessioni Fronda. |
| Micena pura (`mycena-pura`) | 20/20 · 3 testi | 3 | 3/3 · 0 | nuda | sosia | Riutilizzare collegamenti alberi documentati.  |
| Moretta (`terreum`) | 19/20 · 4 testi | 3 | 3/3 · 2 | tricholoma-pardinum, tricholoma-virgatum, tricholoma-sciodes, entoloma-sinuatum, inocybe | sosia | Riutilizzare collegamenti alberi documentati.  |
| Nebbione (`clitocybe-nebularis`) | 0/0 · 4 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Orecchio di Giuda (`auricularia-auricula-judae`) | 0/0 · 4 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Ovolo buono (`caesarea`) | 19/20 · 5 testi | 3 | 3/3 · 4 | amanita-phalloides, amanita-verna, amanita-virosa, amanita-muscaria, amanita-crocea | sosia | Riutilizzare collegamenti alberi documentati.  |
| Ovolo malefico (`amanita-muscaria`) | 19/20 · 4 testi | 4 | 3/3 · 3 | caesarea, amanita-rubescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Pinarolo (`suillus`) | 17/20 · 4 testi | 5 | 3/3 · 0 | chalciporus-piperatus, suillus-bovinus | sosia | Riutilizzare collegamenti alberi documentati.  |
| Pioppino (`cyclocybe-aegerita`) | 18/20 · 4 testi | 3 | 3/3 · 2 | galerina-marginata, hypholoma-fasciculare, inocybe | sosia | Riutilizzare collegamenti alberi documentati.  |
| Porcino (`edulis`) | 19/20 · 4 testi | 2 | 3/3 · 3 | tylopilus-felleus, rubroboletus-satanas, caloboletus-calopus, caloboletus-radicans | sosia | Riutilizzare collegamenti alberi documentati.  |
| Porcino di fiele (`tylopilus-felleus`) | 19/20 · 2 testi | 3 | 3/3 · 2 | edulis, pinophilus, aereus, aestivalis | sosia | Riutilizzare collegamenti alberi documentati.  |
| Porcino estivo (`aestivalis`) | 19/20 · 3 testi | 4 | 3/3 · 3 | tylopilus-felleus, rubroboletus-satanas, caloboletus-radicans | sosia | Riutilizzare collegamenti alberi documentati.  |
| Porcino nero (`aereus`) | 19/20 · 4 testi | 2 | 3/3 · 3 | tylopilus-felleus, neoboletus-luridiformis, imleria-badia | sosia | Riutilizzare collegamenti alberi documentati.  |
| Porcino rosso (`pinophilus`) | 19/20 · 4 testi | 5 | 3/3 · 2 | tylopilus-felleus, caloboletus-calopus, neoboletus-luridiformis | sosia | Riutilizzare collegamenti alberi documentati.  |
| Portentoso (`tricholoma-portentosum`) | 19/20 · 4 testi | 4 | 3/3 · 0 | tricholoma-equestre | sosia | Riutilizzare collegamenti alberi documentati.  |
| Prataiolo (`agaricus-campestris`) | 18/20 · 5 testi | 4 | 3/3 · 2 | amanita-phalloides, amanita-verna, amanita-virosa, agaricus-xanthodermus | sosia | Conservare; uniformare connessioni Fronda. |
| Prataiolo dei boschi (`agaricus-sylvicola`) | 17/20 · 5 testi | 4 | 3/3 · 3 | amanita-phalloides, amanita-verna, amanita-virosa, agaricus-xanthodermus | sosia | Conservare; uniformare connessioni Fronda. |
| Prataiolo ingiallente (`agaricus-xanthodermus`) | 19/20 · 4 testi | 4 | 3/3 · 2 | agaricus-campestris, agaricus-arvensis, agaricus-bisporus, agaricus-sylvicola | sosia | Conservare; uniformare connessioni Fronda. |
| Prataiolo maggiore (`agaricus-arvensis`) | 20/20 · 5 testi | 1 | 3/3 · 2 | amanita-phalloides, amanita-verna, amanita-virosa, agaricus-xanthodermus | sosia | Conservare; uniformare connessioni Fronda. |
| Prugnolo (`calocybe-gambosa`) | 20/20 · 4 testi | 2 | 3/3 · 0 | entoloma-sinuatum, inocybe, clitocybe-rivulosa | sosia | Riutilizzare collegamenti alberi documentati.  |
| Russula eterofilla (`russula-heterophylla`) | 20/20 · 3 testi | 2 | 3/3 · 0 | virescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Russula olivacea (`russula-olivacea`) | 20/20 · 3 testi | 3 | 3/3 · 0 | virescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Russula verderame (`russula-aeruginea`) | 20/20 · 3 testi | 2 | 3/3 · 0 | virescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Sanguinello (`lactarius-deliciosus`) | 18/20 · 4 testi | 4 | 3/3 · 0 | — | libero da esporre | Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti. Riutilizzare collegamenti alberi documentati.  |
| Sanguinello (`lactarius-sanguifluus`) | 0/0 · 5 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Sarcodon imbricato (`sarcodon-imbricatus`) | 19/20 · 3 testi | 2 | 3/3 · 0 | repandum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Sarcodon scabroso (`sarcodon-scabrosus`) | 19/20 · 2 testi | 3 | 3/3 · 0 | repandum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Spugnola gialla (`morchella-esculenta`) | 16/20 · 4 testi | 2 | 3/3 · 0 | gyromitra-esculenta | sosia | Riutilizzare collegamenti alberi documentati.  |
| Spugnola nera (`morchella-elata`) | 15/20 · 4 testi | 3 | 3/3 · 0 | gyromitra-esculenta | sosia | Conservare; uniformare connessioni Fronda. |
| Steccherino dorato (`repandum`) | 19/20 · 4 testi | 3 | 3/3 · 0 | hydnum-rufescens, sarcodon-imbricatus, sarcodon-scabrosus, hydnellum-peckii | sosia | Riutilizzare collegamenti alberi documentati.  |
| Steccherino rossiccio (`hydnum-rufescens`) | 19/20 · 3 testi | 4 | 3/3 · 0 | repandum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tignosa bianca (`amanita-virosa`) | 19/20 · 3 testi | 2 | 3/3 · 4 | caesarea, agaricus-campestris, agaricus-arvensis, agaricus-bisporus, agaricus-sylvicola | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tignosa di primavera (`amanita-verna`) | 19/20 · 3 testi | 1 | 3/3 · 2 | caesarea, agaricus-campestris, agaricus-arvensis, agaricus-bisporus, agaricus-sylvicola | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tignosa paglierina (`amanita-citrina`) | 0/0 · 4 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Tignosa panterina (`amanita-pantherina`) | 18/20 · 4 testi | 5 | 3/3 · 2 | amanita-rubescens | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tignosa verdognola (`amanita-phalloides`) | 19/20 · 4 testi | 3 | 3/3 · 3 | caesarea, virescens, agaricus-campestris, agaricus-arvensis, agaricus-bisporus, agaricus-sylvicola | sosia | Riutilizzare collegamenti alberi documentati.  |
| Trametes versicolor (`trametes-versicolor`) | 0/0 · 5 testi | 2 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |
| Tricoloma equestre (`tricholoma-equestre`) | 17/20 · 5 testi | 4 | 3/3 · 0 | tricholoma-portentosum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tricoloma sciodes (`tricholoma-sciodes`) | 20/20 · 2 testi | 3 | 3/3 · 0 | terreum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Tricoloma vergato (`tricholoma-virgatum`) | 20/20 · 2 testi | 2 | 3/3 · 0 | terreum | sosia | Riutilizzare collegamenti alberi documentati.  |
| Trombetta dei morti (`cornucopioides`) | 20/20 · 4 testi | 2 | 3/3 · 0 | craterellus-cinereus, pseudocraterellus-undulatus, urnula-craterium | sosia | Riutilizzare collegamenti alberi documentati.  |
| Urnula (`urnula-craterium`) | 19/20 · 3 testi | 2 | 3/3 · 0 | cornucopioides | sosia | Riutilizzare collegamenti alberi documentati.  |
| Vescia (`lycoperdon-perlatum`) | 0/0 · 5 testi | 1 | 0/3 · 0 | — | libero da esporre | Strutturare dalle fonti già registrate i caratteri descritti; mancano le tre tessere. Rendere accessibile confronto libero; valutare relazioni soltanto dalle fonti.  |

## Alberi: inventario completo

Dati: `data/trees.json#/trees/<id>`, `data/recognize-trees.json#/items/<id>`, `data/media-trees.json#/trees/<id>`, `data/tree-trait-icons.json`. Tutti i 39 record hanno fonti, descrizioni e foto; i campi ignoti restano nel JSON allegato. La relazione di somiglianza viene già presentata con differenze in `js/trees.js::confusableCard` e nella chiave guidata. **Manca per tutti il confronto affiancato**: nessuna route `#/confronta/alberi` e nessun modulo analogo a `plant-comparison.js`.

Le icone sono schemi di categoria, non anatomie revisionate per ognuno dei 39 alberi: i 49 valori disponibili non sono 49 ritratti botanici. La ricognizione delle illustrazioni resta il riferimento specifico. I collegamenti fungini usano soltanto gli ID effettivi di `js/species.js`; le categorie forestali alimentano la sezione «Nelle zone», senza provare presenza locale.

| Albero · ID | Caratteri / controlli | Foto | Specie simili · ID | Funghi / categorie forestali | Recupero |
|---|---|---|---|---|---|
| Abete bianco (`abete bianco`) | 8/13 · 5 testi | 3 | abete rosso, tasso | 5 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Abete rosso (`abete rosso`) | 8/13 · 5 testi | 5 | abete bianco, tasso | 1 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Acero campestre (`acero campestre`) | 10/13 · 5 testi | 3 | acero opalo, acero di montpellier | 1 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Acero di Montpellier (`acero di montpellier`) | 10/13 · 3 testi | 3 | acero campestre | 0 / 3 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Acero opalo (`acero opalo`) | 9/13 · 5 testi | 4 | acero campestre, acero di montpellier | 0 / 4 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Agrifoglio (`agrifoglio`) | 10/13 · 3 testi | 4 | leccio | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Betulla (`betulla`) | 9/13 · 5 testi | 3 | pioppo, pioppo | 2 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Carpinella (`carpinella`) | 10/13 · 5 testi | 5 | carpino bianco, carpino nero | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Carpino bianco (`carpino bianco`) | 10/13 · 5 testi | 3 | faggio, carpino nero, carpinella | 4 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Carpino nero (`carpino nero`) | 11/13 · 5 testi | 3 | carpino bianco, nocciolo, carpinella | 1 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Castagno (`castagno`) | 10/13 · 5 testi | 4 | ippocastano, cerro | 10 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Cerro (`cerro`) | 10/13 · 5 testi | 4 | roverella, farnetto | 10 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Ciliegio (`ciliegio`) | 10/13 · 3 testi | 7 | — | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Faggio (`faggio`) | 10/13 · 5 testi | 4 | carpino bianco, carpino nero | 9 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Farnetto (`farnetto`) | 8/13 · 5 testi | 3 | cerro, roverella | 5 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Frassino maggiore (`frassino maggiore`) | 9/13 · 5 testi | 5 | orniello, sorbo degli uccellatori | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Ippocastano (`ippocastano`) | 10/13 · 5 testi | 7 | castagno | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Leccio (`leccio`) | 9/13 · 5 testi | 3 | agrifoglio, olivo | 3 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Nocciolo (`nocciolo`) | 9/13 · 5 testi | 3 | ontano, tiglio nostrano | 2 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Noce (`noce`) | 9/13 · 3 testi | 7 | — | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Olivo (`olivo`) | 10/13 · 4 testi | 3 | leccio, salice | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Olmo campestre (`olmo campestre`) | 11/13 · 3 testi | 3 | olmo montano | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Olmo montano (`olmo montano`) | 11/13 · 3 testi | 7 | olmo campestre | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Ontano napoletano (`ontano napoletano`) | 9/13 · 5 testi | 5 | ontano | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Ontano nero (`ontano`) | 9/13 · 5 testi | 4 | ontano napoletano, nocciolo | 0 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Orniello (`orniello`) | 9/13 · 5 testi | 4 | frassino maggiore, sorbo domestico | 1 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pino d'Aleppo (`pino d'aleppo`) | 7/13 · 5 testi | 4 | pino domestico, pino marittimo | 3 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pino domestico (`pino domestico`) | 8/13 · 5 testi | 3 | pino d'aleppo, pino nero | 3 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pino marittimo (`pino marittimo`) | 8/13 · 5 testi | 5 | pino d'aleppo, pino domestico, pino nero | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pino nero (`pino nero`) | 8/13 · 5 testi | 3 | pino silvestre, pino domestico | 5 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pino silvestre (`pino silvestre`) | 8/13 · 4 testi | 4 | pino nero | 5 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Pioppo (`pioppo`) | 10/13 · 5 testi | 4 | salice, betulla | 1 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Robinia (`robinia`) | 9/13 · 3 testi | 6 | — | 0 / 0 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Roverella (`roverella`) | 10/13 · 5 testi | 4 | cerro, leccio | 9 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Salice (`salice`) | 10/13 · 5 testi | 3 | pioppo, olivo | 1 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Sorbo degli uccellatori (`sorbo degli uccellatori`) | 10/13 · 5 testi | 5 | sorbo domestico, frassino maggiore | 0 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Sorbo domestico (`sorbo domestico`) | 7/13 · 3 testi | 6 | sorbo degli uccellatori | 0 / 3 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Tasso (`tasso`) | 8/13 · 5 testi | 5 | abete bianco, abete rosso | 0 / 1 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |
| Tiglio nostrano (`tiglio nostrano`) | 8/13 · 3 testi | 4 | — | 0 / 2 | Confronto a due; riusare relazioni e matrice. Osservazioni collegate. |

## Piante: inventario completo

Dati: `data/plants.json#/plants/<id>`, `data/recognize-plants.json#/items/<id>`, `data/plant-trait-icons.json`; renderer `js/plants.js`, `js/plant-comparison.js`. Tutte le 78 piante hanno accesso al confronto libero da scheda e catalogo, foto e fonti, glossario contestuale e azione Taccuino. Le 15 schede di confronto curate in `recognize-plants.json#/confusables` contengono anche differenze testuali che non vanno disperse o ricostruite dai soli valori della matrice.

«Sosia scheda» segue `plants.json.lookalikes`; «relazioni matrice» segue i gruppi curati del riconoscimento. Le differenze fra queste colonne sono recuperi concreti da valutare: ad esempio ortica/alliaria, anemone/erba trinità, salsapariglia/asparago e giglio martagone/giglio rosso non hanno accesso reciproco uniforme nelle singole liste e nei suggerimenti prioritari. Non sono nuovi sosia proposti: sono relazioni già presenti in un altro percorso.

«Anatomie R/M» conta collegamenti revisionati / ancora senza autorizzazione per specie nei quattro campi protetti (fiore, frutto, foglia, margine). Le 235 associazioni senza revisione non sono 235 file da disegnare. Questo inventario non ripete la revisione raster del report [illustrazioni](ricognizione-illustrazioni-caratteri-2026-10-20.md).

| Pianta · ID | Caratteri / controlli | Foto | Sosia scheda · ID | Relazioni matrice · ID | Anatomie R/M | Modello / habitat | Recupero |
|---|---|---|---|---|---|---|---|
| Acetosella dei boschi (`acetosella`) | 4/10 · 4 testi | 2 | — | — | 0/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Achillea ligure (`achillea-ligure`) | 7/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Aglio orsino (`aglio-orsino`) | 8/10 · 4 testi | 5 | colchico, veratro | colchico, croco, veratro | 3/0 | no / 2 | Allineare accessi/relazioni dalla matrice esistente: croco. riusare osservazioni e collegamenti contestuali. |
| Alliaria (`alliaria`) | 9/10 · 3 testi | 3 | ortica | ortica | 0/4 | no / 2 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Anemone degli Appennini (`anemone-appennini`) | 8/10 · 3 testi | 3 | — | erba-trinita | 0/5 | no / 4 | Allineare accessi/relazioni dalla matrice esistente: erba-trinita. Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Aristolochia clematide (`aristolochia`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Asfodelo ramificato (`asfodelo`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Asparago selvatico (`asparago-selvatico`) | 8/10 · 3 testi | 3 | pungitopo, salsapariglia | pungitopo, salsapariglia | 0/3 | no / 3 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Biancospino (`biancospino`) | 10/10 · 3 testi | 3 | — | — | 4/0 | no / 3 | riusare osservazioni e collegamenti contestuali. |
| Borragine (`borragine`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Bucaneve (`bucaneve`) | 5/10 · 3 testi | 3 | — | — | 0/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Bugola strisciante (`bugola`) | 3/10 · 4 testi | 3 | — | — | 0/0 | no / 0 | riusare osservazioni e collegamenti contestuali. |
| Campanula raponzolo (`raponzolo`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cariofillata comune (`cariofillata`) | 4/10 · 4 testi | 2 | — | — | 0/2 | no / 0 | Revisionare 2 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cefalantera maggiore (`cefalantera-maggiore`) | 7/10 · 3 testi | 6 | — | — | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ciclamino autunnale (`ciclamino-autunnale`) | 9/10 · 3 testi | 3 | ciclamino-primaverile | ciclamino-primaverile | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ciclamino primaverile (`ciclamino-primaverile`) | 9/10 · 3 testi | 3 | ciclamino-autunnale | ciclamino-autunnale | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cicoria selvatica (`cicoria`) | 9/10 · 3 testi | 3 | — | — | 0/5 | sì / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cicuta maggiore (`cicuta`) | 8/10 · 3 testi | 3 | finocchietto | finocchietto | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cisto a foglie di salvia (`cisto-salvia`) | 9/10 · 3 testi | 3 | cisto-montpellier | cisto-montpellier | 0/4 | no / 2 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Cisto di Montpellier (`cisto-montpellier`) | 9/10 · 3 testi | 3 | cisto-salvia | cisto-salvia | 0/4 | no / 2 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Colchico lusitano (`colchico`) | 8/10 · 3 testi | 3 | croco, aglio-orsino | aglio-orsino, croco | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Corbezzolo (`corbezzolo`) | 10/10 · 3 testi | 3 | — | — | 4/0 | sì / 2 | riusare osservazioni e collegamenti contestuali. |
| Corniolo (`corniolo`) | 9/10 · 3 testi | 3 | sanguinello | sanguinello | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Dafne laureola (`dafne-laureola`) | 8/10 · 3 testi | 3 | — | — | 0/3 | no / 2 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Digitale gialla meridionale (`digitale-gialla`) | 8/10 · 3 testi | 6 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ebbio (`ebbio`) | 10/10 · 3 testi | 3 | sambuco | sambuco | 1/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Edera (`edera`) | 10/10 · 3 testi | 3 | — | — | 0/5 | no / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Elleboro fetido (`elleboro`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Erba trinità (`erba-trinita`) | 8/10 · 3 testi | 3 | anemone-appennini | anemone-appennini | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Erica arborea (`erica-arborea`) | 8/10 · 3 testi | 3 | — | — | 0/3 | no / 3 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Finocchietto selvatico (`finocchietto`) | 7/10 · 3 testi | 3 | cicuta | cicuta | 1/2 | sì / 2 | Revisionare 2 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Fragolina di bosco (`fragolina`) | 10/10 · 3 testi | 3 | — | — | 3/1 | sì / 3 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Fusaggine (`fusaggine`) | 9/10 · 3 testi | 3 | — | — | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Genziana maggiore (`genziana-maggiore`) | 9/10 · 4 testi | 4 | veratro | veratro | 3/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Genziana primaticcia (`genziana-primaticcia`) | 8/10 · 3 testi | 6 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Geranio di San Roberto (`geranio-robertiano`) | 3/10 · 4 testi | 3 | — | — | 0/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Gigaro italiano (`gigaro`) | 10/10 · 3 testi | 3 | — | — | 0/4 | no / 4 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Giglio martagone (`giglio-martagone`) | 7/10 · 3 testi | 6 | — | giglio-rosso | 0/3 | no / 0 | Allineare accessi/relazioni dalla matrice esistente: giglio-rosso. Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Giglio rosso (`giglio-rosso`) | 7/10 · 3 testi | 4 | giglio-martagone | giglio-martagone | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ginepro comune (`ginepro`) | 8/10 · 3 testi | 3 | — | — | 0/3 | no / 1 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ginestra dei carbonai (`ginestra-carbonai`) | 8/10 · 3 testi | 3 | ginestra-odorosa | ginestra-odorosa | 0/4 | no / 1 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ginestra odorosa (`ginestra-odorosa`) | 9/10 · 3 testi | 3 | ginestra-carbonai | ginestra-carbonai | 0/4 | no / 2 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Iperico perforato (`iperico`) | 9/10 · 3 testi | 3 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Lentaggine (`lentaggine`) | 10/10 · 3 testi | 3 | — | — | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ligustro comune (`ligustro`) | 9/10 · 3 testi | 3 | — | — | 0/4 | no / 3 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Malva selvatica (`malva`) | 8/10 · 3 testi | 3 | — | — | 4/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Margherita comune (`margherita`) | 8/10 · 3 testi | 3 | — | — | 0/5 | no / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Melissa (`melissa`) | 9/10 · 3 testi | 3 | — | — | 3/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Menta a foglie lunghe (`menta-longifolia`) | 9/10 · 3 testi | 3 | menta-acquatica | menta-acquatica | 0/4 | no / 1 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Menta acquatica (`menta-acquatica`) | 9/10 · 3 testi | 3 | menta-longifolia | menta-longifolia | 0/4 | no / 1 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Narciso dei poeti (`narciso-dei-poeti`) | 8/10 · 3 testi | 6 | — | — | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Orchide maschia (`orchide-maschia`) | 9/10 · 3 testi | 6 | orchide-purpurea | orchide-purpurea | 0/4 | no / 0 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Orchide purpurea (`orchide-purpurea`) | 8/10 · 3 testi | 6 | orchide-maschia | orchide-maschia | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Orchide sambucina (`orchide-sambucina`) | 7/10 · 3 testi | 6 | — | — | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Origano comune (`origano`) | 9/10 · 3 testi | 3 | — | — | 0/6 | no / 3 | Revisionare 6 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Ortica (`ortica`) | 9/10 · 3 testi | 3 | — | alliaria | 3/1 | sì / 2 | Allineare accessi/relazioni dalla matrice esistente: alliaria. Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Pervinca minore (`pervinca-minore`) | 1/10 · 4 testi | 2 | — | — | 0/0 | no / 0 | riusare osservazioni e collegamenti contestuali. |
| Piantaggine lanceolata (`piantaggine`) | 9/10 · 3 testi | 3 | — | — | 0/5 | no / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Primula comune (`primula`) | 8/10 · 3 testi | 3 | — | — | 0/4 | no / 4 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Prugnolo (`prugnolo`) | 10/10 · 3 testi | 3 | — | — | 4/0 | sì / 1 | riusare osservazioni e collegamenti contestuali. |
| Pungitopo (`pungitopo`) | 8/10 · 3 testi | 3 | asparago-selvatico | asparago-selvatico, salsapariglia | 0/3 | no / 3 | Allineare accessi/relazioni dalla matrice esistente: salsapariglia. Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Rosa canina (`rosa-canina`) | 9/10 · 3 testi | 3 | — | — | 3/1 | sì / 1 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Rovo e more (`rovo`) | 10/10 · 3 testi | 3 | — | — | 4/0 | sì / 1 | riusare osservazioni e collegamenti contestuali. |
| Salsapariglia (`salsapariglia`) | 10/10 · 3 testi | 3 | — | asparago-selvatico, pungitopo | 0/4 | no / 2 | Allineare accessi/relazioni dalla matrice esistente: pungitopo, asparago-selvatico. Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Sambuco nero (`sambuco`) | 10/10 · 3 testi | 3 | ebbio | ebbio | 1/3 | sì / 2 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Sanguinello (`sanguinello`) | 10/10 · 3 testi | 3 | corniolo | corniolo | 0/5 | no / 3 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Sanicola (`sanicola`) | 4/10 · 4 testi | 2 | — | — | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Scilla silvestre (`scilla-silvestre`) | 7/10 · 3 testi | 6 | — | — | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Silene rigonfia (`silene`) | 8/10 · 3 testi | 3 | — | — | 0/3 | no / 0 | Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Stellina odorosa (`stellina-odorosa`) | 3/10 · 4 testi | 3 | — | — | 0/0 | no / 0 | riusare osservazioni e collegamenti contestuali. |
| Stramonio (`stramonio`) | 9/10 · 3 testi | 3 | — | — | 0/5 | no / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Tarassaco (`tarassaco`) | 9/10 · 3 testi | 3 | — | — | 0/5 | sì / 0 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Veratro (`veratro`) | 9/10 · 4 testi | 5 | genziana-maggiore, aglio-orsino | aglio-orsino, genziana-maggiore | 3/1 | no / 0 | Revisionare 1 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Viola mammola (`viola-mammola`) | 9/10 · 3 testi | 3 | — | — | 0/4 | no / 1 | Revisionare 4 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Viola silvestre (`viola-silvestre`) | 3/10 · 4 testi | 3 | — | — | 0/0 | no / 0 | riusare osservazioni e collegamenti contestuali. |
| Vitalba (`vitalba`) | 8/10 · 3 testi | 3 | — | — | 0/5 | no / 3 | Revisionare 5 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |
| Zafferano napoletano (`croco`) | 8/10 · 3 testi | 4 | colchico | aglio-orsino, colchico | 0/3 | no / 0 | Allineare accessi/relazioni dalla matrice esistente: aglio-orsino. Revisionare 3 associazioni anatomiche già censite; riusare osservazioni e collegamenti contestuali. |

## Animali: controllo complementare dell’integrazione

Le schede animali sono il percorso da cui recuperare il blocco di connessioni, non una fonte tassonomica per gli altri cataloghi. `js/app.js::renderAnimalConnections` filtra le annotazioni personali per riferimento, presenta aggregati per zona quando pubblicabili e collega Taccuino, mappa, glossario e piante quando pertinenti. I 31 record comprendono 27 pubblicabili con foto e 4 bozze; i gruppi restano gruppi. Non c’è matrice chiusa dei caratteri né confronto a due da recuperare già pronto.

| Animale · ID | Rango | Foto | Osservare / habitat / abitudini / ecosistema / cautele | Stato |
|---|---|---|---|---|
| Ape da miele (`ape-da-miele`) | species | 3 | 0 / 1 / 1 / 1 / 1 | pubblicabile |
| Bombi (`bombi`) | genus | 2 | 1 / 0 / 1 / 0 / 0 | pubblicabile |
| Altre api selvatiche (`altre-api-selvatiche`) | editorial_group | 0 | 0 / 0 / 0 / 1 / 0 | bozza senza foto |
| Sirfidi (`sirfidi`) | family | 4 | 2 / 0 / 1 / 2 / 0 | pubblicabile |
| Farfalle diurne (`farfalle-diurne`) | editorial_group | 3 | 3 / 0 / 1 / 1 / 1 | pubblicabile |
| Vespe sociali (`vespe-sociali`) | editorial_group | 0 | 0 / 0 / 1 / 0 / 1 | bozza senza foto |
| Calabrone europeo (`calabrone-europeo`) | species | 1 | 0 / 1 / 2 / 1 / 2 | pubblicabile |
| Zecche (`zecche`) | editorial_group | 3 | 1 / 2 / 2 / 0 / 3 | pubblicabile |
| Processionaria del pino (`processionaria-del-pino`) | species | 0 | 1 / 1 / 1 / 0 / 1 | bozza senza foto |
| Vipera comune (`vipera-comune`) | species | 0 | 1 / 0 / 0 / 1 / 0 | bozza senza foto |
| Cinghiale (`cinghiale`) | species | 2 | 2 / 1 / 0 / 3 / 0 | pubblicabile |
| Lupo (`lupo`) | species | 3 | 0 / 1 / 3 / 2 / 0 | pubblicabile |
| Capriolo (`capriolo`) | species | 1 | 2 / 1 / 1 / 1 / 0 | pubblicabile |
| Cervo (`cervo`) | species | 3 | 2 / 1 / 2 / 1 / 0 | pubblicabile |
| Cetonia dorata (`cetonia-dorata`) | species | 2 | 1 / 2 / 0 / 1 / 0 | pubblicabile |
| Rosalia alpina (`rosalia-alpina`) | species | 3 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Tritone crestato italiano (`tritone-crestato-italiano`) | species | 3 | 2 / 1 / 1 / 1 / 0 | pubblicabile |
| Salamandra pezzata (`salamandra-pezzata`) | species | 2 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Riccio europeo (`riccio-europeo`) | species | 3 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Volpe (`volpe`) | species | 3 | 1 / 1 / 1 / 2 / 0 | pubblicabile |
| Istrice (`istrice`) | species | 1 | 1 / 1 / 2 / 1 / 0 | pubblicabile |
| Tasso (`tasso`) | species | 2 | 1 / 1 / 1 / 2 / 0 | pubblicabile |
| Martora (`martora`) | species | 1 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Faina (`faina`) | species | 2 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Donnola (`donnola`) | species | 1 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Quercino (`quercino`) | species | 1 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Gatto selvatico (`gatto-selvatico`) | species | 2 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Lepre italica (`lepre-italica`) | species | 1 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Aquila reale (`aquila-reale`) | species | 2 | 1 / 1 / 0 / 1 / 0 | pubblicabile |
| Ape legnaiola (`ape-legnaiola`) | species | 2 | 1 / 1 / 1 / 1 / 0 | pubblicabile |
| Macaone (`macaone`) | species | 2 | 1 / 1 / 1 / 1 / 0 | pubblicabile |

## Sezione per sezione: copertura e recuperi

Censite tutte le 23 viste dichiarate in `index.html`, con ricerca e servizi trasversali separati. Le rotte a due e il glossario sul campo condividono la vista `riconosci`; non sono contati come nuovi cataloghi. Questa è una ricognizione statica di renderer/route/dati, non una sessione di verifica di ogni flusso online.

| Sezione / vista / accesso | Percorsi precisi | Disponibile | Da recuperare / limite |
|---|---|---|---|
| Uscite · uscite / #/ | js/app.js; js/outing-discoveries.js; js/daily-thought.js | Filtri comuni, proposte, scoperte botaniche e frase del giorno; 14 modelli fungini e 10 botanici, senza estenderli ai cataloghi interi. | Rimandare dal suggerimento alla scheda e da questa al giro; riusare i riferimenti esistenti. La card non prova presenza. |
| I giri di Matteo · giri / #/giri | js/editorial-outings.js; data/editorial-outings.json | 3 racconti dichiarati simulati, itinerari e letture correlate. | Recuperare schema di schede pertinenti e salvataggio nel Taccuino; un racconto simulato non alimenta segnalazioni reali. |
| Zona · zona / #/zona/<id>/<giorno> | js/app.js::renderDetail; js/outing-discoveries.js; data/zones.json | 36 zone canoniche; meteo, sentieri, habitat, specie contestuali e annotazione. | Connessione inversa dalle schede a zone pertinenti con tipo di evidenza; la foresta compatibile non è un avvistamento. |
| Mappa · mappa / #/mappa | js/map-experience.js; js/app.js | Filtri condivisi, schede luogo, geometrie, scoperte secondarie. | Riusare apertura contestuale di scheda e ritorno alla mappa; un nuovo link generico alla mappa non filtra automaticamente per specie. |
| Glossario · glossario / #/glossario[/<id>] | js/learning.js; js/glossary-context.js; data/glossary.json | 131 voci, ambiti, rimandi a termini correlati, ricerca comune. | Controllare copertura dei termini effettivamente usati nelle nuove matrici; non creare una voce per ogni specie. Le parole corte e ambigue hanno protezioni. |
| Funghi · specie / #/specie | js/app.js; js/edible-catalog.js; data/species-traits.json | Catalogo commestibili 51 voci, riconoscimento e confronto separati. | Mantenere un resolver unico di route: #/specie solo per i 14 modelli; #/commestibile o #/fungo per gli altri. |
| Alberi · alberi / #/alberi | js/trees.js; data/trees.json | 39 schede e gruppi, chiave guidata disponibile. | Aggiungere ingresso Confronta usando i 39 record già strutturati; nessun nuovo dato richiesto per il selettore libero. |
| Piante e fiori · piante / #/piante | js/plants.js; js/plant-catalog.js | 78 piante, filtri, schede, riconoscimento e confronto a due. | Allineare i suggerimenti reciproci dalle relazioni già curate. I filtri di ambiente coprono solo i record con habitatCategories documentato. |
| Animali · animali / #/animali | js/animals.js; data/animals.json | 27 schede con foto su 31 record, ricerca e glossario animali. | Conservare le 4 bozze fuori pubblicazione; un confronto a due richiederebbe un nuovo schema, non solo riuso grafico. |
| Scheda animale · animale / #/animale/<id> | js/animals.js; js/app.js::renderAnimalConnections | Fonti per affermazione, foto, osservazioni personali, aggregati per zona e navigazione Fronda. | Estrarre il blocco connessioni come componente comune; mantenere accesso community e soglie 3 contributori/2 giorni su7 giorni. |
| Scheda pianta · pianta / #/pianta/<id> | js/plants.js::renderPlantPage | Foto, tratti, confronto, cautele, tutela quando registrata, fonte e annotazione. | Mancano elenco personale e aggregati contestuali uniformi; recuperare pattern animali. Mostrare zone solo con evidenza definita. |
| Riconoscimento e confronto · riconosci / #/riconosci, #/confronta | js/identify.js; js/guided-key.js; js/plant-comparison.js; js/compare-picker.js | Chiavi funghi/piante/alberi/bosco; coppie libere funghi/piante; sosia prioritari solo documentati. | P1 CTA dei 22 funghi senza relazioni; poi confronto alberi, propagando null e valori parziali. Il bosco è glossario sul campo, non identificazione. |
| Guide · impara / #/impara | js/app.js::renderLearnHub; js/learning.js | Hub di lettura con accessi a glossario, approfondimenti e sfide. | Riprendere ingressi pertinenti dal contesto specie; evitare una lista uguale di link generici in ogni scheda. |
| Elenco approfondimenti · guide-list / #/guide | js/guides.js; data/guides.json | 3 guide strutturate con foto/illustrazioni, fonti e link. | Riutilizzare le guide esistenti dalle schede quando trattano quel carattere; l’assenza di una guida specifica non si risolve inventando contenuti. |
| Sfide · sfide / #/sfide[/<id>] | js/challenges.js; data/challenges.json | 9 sfide collegate a caratteri e timbri. | Recuperare domande e collegamenti già verificati per alberi/funghi/piante; non estendere automaticamente a taxa privi di dati. |
| Scheda albero · albero / #/albero/<id> | js/trees.js::renderTreePage | 39 matrici, foto, 35 liste di sosia, funghi associati e categorie forestali. | Confronto affiancato assente; connessioni personali/community da uniformare. Le foto di un genere non vanno trasferite ai sosia specifici. |
| Scheda fungo · fungo / #/fungo/<id> | js/identify.js::renderTaxonView | Caratteri/fasi dove disponibili, controlli testuali, sosia e fonti, annotazione aggiunta da app.js. | La route funziona anche fuori catalogo commestibili; fallback confronto libero e blocco osservazioni da rendere uniformi. |
| Scheda fungo con indice · specie-dettaglio / #/specie/<id> | js/speciescard.js::renderSpeciesDetail | 14 approfondimenti completi: controlli, preparazione, sosia, zone, periodo e 3D quando registrato. | Riusare componenti e fonti, non coefficienti del modello per analogia. Non applicare questa route ai taxa fuori SPECIES. |
| Taccuino · diario / #/diario | js/journal.js; js/notebook-composer.js; js/notebook-entry.js | Note, riferimenti ai cataloghi, osservazioni, giri e ricerche senza ritrovamento; condivisione facoltativa. | Costruire indice dei riferimenti per mostrare le note nella scheda di origine; pattern già presente negli animali. Preservare vecchi ID/route. |
| Scheda commestibile · commestibile / #/commestibile/<id> | js/app.js::renderEdiblePage; js/species-context.js | Riuso del taxon completo se presente; avviso indice non disponibile e azione osservazione. | Non mostrare solo una scheda sintetica se il taxon ha dati; oggi Coprinus già li recupera. Mancano elenco personale e aggregati come componente comune. |
| Approfondimento · guide / #/guide/<id> | js/guides.js; js/app.js::addNotebookReference | Testo/fonti leggibili, parole contestuali e salvataggio nel Taccuino. | Rimandi inversi alle specie già citate, con resolver e pertinenza verificati. |
| Metodo · metodo / #/metodo | js/science.js; docs/metodo-scientifico.md | Distingue dati, letteratura, euristiche e fattori dell’indice. | Link dal modello nelle schede pertinenti; nessun nuovo modello scientifico da recuperare da bozze senza valutazione. |
| Regole e informazioni · info / #/info | js/app.js; data/legal.json; index.html | Sicurezza, controllo micologico, privacy, crediti foto/video e limiti. | Conservare link contestuali dalle cautele; fonti normative da aggiornare separatamente dopo nuova verifica ufficiale. |
| Ricerca globale · dialog comune | js/search.js; js/app.js::buildSearch | Entità di tutti i cataloghi, glossario, guide e sezioni; priorità al contesto. | La ricerca è comune, non basta il catalogo locale. Validare route e nomi comuni; nessun link letterale #/specie/<id> invalido rilevato nei JSON canonici. |
| Profilo, community, redazione e CMS · dialog/servizi | js/community.js; js/admin-dashboard.js; js/cms.js; worker/ | Dati personali e collettivi distinti; documenti pubblicati/draft, seed e snapshot. | Riusare API/contratti osservazioni esistenti; ogni modifica al seed va accompagnata da schema e snapshot quando necessario. Il repository non prova contenuto CMS attuale. |
| Copertine e inviti di atmosfera · componente | js/atmosphere-video.js; assets/video/nature; index.html | Video introdotti in produzione #166; foto delle specie restano i riferimenti. | Riusare solo come atmosfera, non come ritratto scientifico o prova della località. Conservare poster, pausa, reduced motion e crediti Pexels. |

## Backlog ordinato dei recuperi

«Riuso» indica che il materiale o il comportamento è già nel prodotto/documentazione adottata. **Non significa che l’integrazione sia già realizzata**. «Candidato» richiede verifica e decisione prima di pubblicare: nessuna conclusione scientifica, illustrazione respinta o proposta di altro ramo viene adottata da questo documento.

| Priorità | Intervento | Stato del materiale | Copertura concreta | Provenienza | Passo utile |
|---|---|---|---|---|---|
| P1 | Accesso ai confronti fungini | Riuso di funzione già pubblicata | 22 CTA assenti pur avendo accesso libero dal catalogo | js/identify.js::compareCta; js/compare-picker.js; #/confronta/<id> | Correzione separata del coordinatore, senza creare relazioni. Non richiede nuovi dati scientifici. |
| P1 | 12 funghi: matrice incompleta | Candidati da validare sulle fonti già raccolte | 12 record traits:null; 36 tessere base attese | data/species-traits.json; incoming/catalog-expansion-2026-10-19/funghi/claim-evidence.json; catalog-proposal.json; data/asset-pending.json | Leggere evidenza puntuale e convertire solo tratti documentati nel vocabolario; poi revisione raster. Non dedurre dai prompt o dal nome. |
| P1 | Confronto alberi | Riuso di dati/moduli già approvati; UI da costruire | 39 matrici e35 liste di sosia già disponibili | data/recognize-trees.json; data/trees.json; js/guided-key.js; js/compare-picker.js; js/plant-comparison.js | Adattare schema e lessico, selezione libera e relazioni prioritarie. Nessuna relazione nuova e nessuna anatomia specifica presunta. |
| P1 | Relazioni botaniche reciproche | Riuso di relazioni già curate, allineamento da valutare | 4 liste unidirezionali: alliaria→ortica, asparago→salsapariglia, erba trinità→anemone, giglio rosso→martagone | data/plants.json#/plants/*/lookalikes; data/recognize-plants.json#/confusables; js/plant-comparison.js::related | Unificare lettura delle relazioni in entrambi i versi e fra matrice/scheda; non introdurre specie estranee ai gruppi documentati. |
| P1 | Connessioni delle schede | Riuso di pattern già approvato; adattamento contratti | Azione Taccuino presente; elenco personale/aggregati non comune a funghi, alberi e piante | js/app.js::renderAnimalConnections; js/species-context.js; js/journal.js; js/community-observation.js | Componente condiviso con riferimenti stabili, stato vuoto veritiero, zone ampie, soglie e accesso invariati. Nessuna migrazione automatica dei nomi. |
| P1 | Illustrazioni botaniche dei confronti | Revisione richiesta; asset generico non autorizzato automaticamente | 235 assegnazioni senza revisione nei4 campi protetti;97 prioritarie nel report precedente | docs/ricognizione-illustrazioni-caratteri-2026-10-20.md; data/plant-trait-icons.json; docs/ipotesi/integrazione-raster-botanici-2026-10-18.md | Prima foto/fonti e possibili riusi; poi raster specifici dove necessari. Gli scarti restano scarti finché corretti e revisionati. |
| P2 | Resolver dei link delle specie | Riuso di mapping esistente | 14 route modello,51 catalogo commestibili,100 taxa riconoscimento | js/edible-catalog.js::buildEdibleCatalog; js/species-link.js; js/app.js::noteCatalogs; js/editorial-outings.js | Centralizzare href anziché concatenare #/specie/<id>. Nessun link letterale invalido trovato nei dati; specieLink resta vincolato a input modello e va preservato o generalizzato esplicitamente. |
| P2 | Zone e scoperte secondarie | Riuso di ambienti documentati | 10 modelli botanici;37 piante con habitatCategories; categorie forestali degli alberi | data/botanical-models.json; data/plants.json; data/trees.json; js/outing-discoveries.js | Riutilizzare solo dove esiste mapping; l’assenza non autorizza estrazione automatica dai testi. Collegare scheda, contesto e ritorno al sentiero. |
| P2 | Guide, glossario e sfide | Riuso editoriale già pubblicato | 3 guide,131 termini,9 sfide | data/guides.json; data/glossary.json; data/challenges.json; js/learning.js | Aggiungere rimandi pertinenti già supportati; verificare termini nuovi delle matrici e mantenere disambiguazione contestuale. |
| P2 | Fotografie e sorgenti editabili | Archivio in gran parte già adottato; candidati residui separati | 274 foto nel lotto precedente;8 SVG sorgenti non equivalgono a8nuovi disegni | docs/assets/photo-expansion-2026-10-18/assessment.json; incoming/photo-expansion-2026-10-18/*/manifest.json; docs/assets/vettoriali-revisionati-2026-10-18; docs/ipotesi/revisione-svg-2026-10-18.md | Confrontare hash e manifest prima di recuperare; non reimportare duplicati o respinti e non sostituire foto con disegni. |
| P2 | Documentazione e conteggi | Aggiornamento editoriale con fonti locali | docs/catalogo-commestibili.md ancora46; attuale catalogo51. Kit storico ha15zone/70piante/88taxa, ora36/78/100 | docs/catalogo-commestibili.md; docs/fronda/content-source.json; docs/handoff-fronda-2026-10-15.md | Aggiornare documenti operativi; conservare esplicitamente gli snapshot storici, senza usarli per ripristinare dati più vecchi. |
| P3 | Animali senza foto | Candidati da completare | 4 bozze escluse dalla galleria | data/animals.json; incoming/catalog-expansion-2026-10-19/animali | Nuova foto reale con fonte/licenza e revisione; nessuna pubblicazione automatica da questa ricognizione. |

### Elenchi operativi immediati

**Funghi senza relazioni lette dal CTA nella base:** `paxillus-involutus`, `pleurotus-eryngii`, `russula-vesca`, `russula-aurea`, `russula-emetica`, `coprinopsis-atramentaria`, `coprinus-comatus`, `craterellus-lutescens`, `fomes-fomentarius`, `pleurotus-ostreatus`, `hygrophorus-latitabundus`, `hygrophorus-russula`, `lactarius-deterrimus`, `fistulina-hepatica`, `hygrophorus-marzuolus`, `clitocybe-nebularis`, `auricularia-auricula-judae`, `lactarius-deliciosus`, `lactarius-sanguifluus`, `amanita-citrina`, `trametes-versicolor`, `lycoperdon-perlatum`. Il pulsante libero li rende confrontabili: non assegna loro sosia.

**Funghi con matrice assente:** `paxillus-involutus`, `russula-vesca`, `russula-emetica`, `coprinopsis-atramentaria`, `fomes-fomentarius`, `hygrophorus-russula`, `clitocybe-nebularis`, `auricularia-auricula-judae`, `lactarius-sanguifluus`, `amanita-citrina`, `trametes-versicolor`, `lycoperdon-perlatum`. Le descrizioni e le fonti sono presenti per tutti; non basta disegnare le36 tessere mancanti per riempire la matrice.

**Alberi senza lista di specie simili:** `ciliegio`, `noce`, `tiglio nostrano`, `robinia`. La mancanza di lista non dovrebbe bloccare il confronto libero dopo la realizzazione del modulo.

## Archivi e rami: ciò che è recuperabile senza confondere gli stati

- `docs/ipotesi/README.md` è il registro delle valutazioni. Lotti fotografici, fasi e raster botanici hanno valutazioni separate; le immagini scartate non vengono riabilitate dalla loro presenza nel repository.
- `incoming/catalog-expansion-2026-10-19/funghi/claim-evidence.json`, `catalog-proposal.json`, `sources/`, `README.md`: provenienza puntuale delle12 aggiunte e fatti riformulati; utile per completare i valori chiusi. Il PDF originario è documentato con percorso temporaneo e hash: la sua citazione nel manifest non dimostra che il file temporaneo sia ancora disponibile. Non redistribuire il testo integrale senza licenza.
- `docs/assets/fasi-funghi-2026-10-18/manifest-import.json` e `docs/ipotesi/revisione-indipendente-fasi-funghi-2026-10-18.md`: provenienza delle fasi già adottate, non nuova copertura. Per Coprinus sono documentate9 tessere di fase.
- `archive/forme-con-fasi/`, richiamato da `tools/import_trait_icons.py`, conserva copie storiche di forme. Le forme approvate sono già recuperate dal renderer anche con fasi: verificare hash/indice prima di proporre di nuovo lo stesso recupero.
- `docs/assets/botanici-integrati-2026-10-18/` e `docs/ipotesi/integrazione-raster-botanici-2026-10-18.md`:5 file adottati con7 collegamenti; sambuco portamento r02 rimane respinto. La ricognizione delle235 associazioni non autorizza a usare quel candidato.
- `docs/assets/vettoriali-revisionati-2026-10-18/` conserva8 SVG editabili e raster già mostrati nell’app; utili come sorgenti. Non sono8 illustrazioni nuove da aggiungere alla copertura visibile.
- Rami letti in sola consultazione: `gpt/immagini` a `e7f26852` contiene ancora consegne non antenate della produzione (forme/lotti grezzi in `incoming/bozze`); nessun merge proposto. Prima di recuperare confrontare gli asset effettivi con i manifest adottati per evitare duplicazione. `codex/botanical-species-illustrations` a `003bf612` e `codex/flower-by-flower-review` a `28181b41` non mostrano commit esclusivi rispetto alla produzione attuale: non sono una riserva automaticamente nuova di funzionalità. Non è stato eseguito un esame completo di tutti i115 riferimenti locali/remoti: l’audit dei cataloghi è completo, quello dei rami è mirato ai materiali pertinenti.
- Le proposte dei modelli micologici nei rami di ricerca restano nella valutazione `docs/ipotesi/valutazione-modello-v3.md`; non sono coefficienti da recuperare nelle specie prive di modello.
- Materiali non versionati presenti da lavori concorrenti (`assets/flower-plates/`, `docs/assets/fiori-revisione-2026-10-19/`) esclusi dalla valutazione e da qualunque adozione. La loro presenza non è una consegna approvata.

## Provenienza, limiti e consegna

Inventario completo di248 record:100 funghi,39 alberi,78 piante e31 animali. Tutti i record hanno riga nominativa; il JSON conserva i dettagli ripetibili. La tabella delle sezioni copre le23 viste dichiarate e i servizi trasversali. Controllati i riferimenti foto dei renderer: nessun file normale/HD/miniatura indicato risulta assente e nessun credito strutturalmente incompleto secondo i campi autore/licenza/pagina. È un controllo di esistenza e metadati, non un’approvazione visiva o legale nuova.

Non sono stati eseguiti test unitari, suite browser, deploy, download, ricerche esterne o modifiche ai documenti CMS. Le fonti già registrate sono riportate come provenienza, non come nuova verifica scientifica. Nessun avvistamento personale o collettivo è stato letto o creato. La correzione UI del coordinatore resta distinta da queste raccomandazioni e dalla loro futura pubblicazione.

Consegne: questo documento; [inventario JSON](ricognizione-integrazione-cataloghi-2026-10-20.json) con fonti/campi/asset/route per voce; [tabella CSV](ricognizione-integrazione-cataloghi-2026-10-20.csv) per ordinare il backlog. Nessun materiale scientifico in sospeso è stato integrato.
