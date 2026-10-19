# Illustrazioni botaniche specifiche · produzione del 19 ottobre

Richiesta di Matteo: sostituire le figure generiche delle schede con rappresentazioni coerenti con la specie. Esempio guida: nel corbezzolo la foglia intera deve essere dentata anche nella tessera «Semplice», mentre la tessera del margine deve mostrare il bordo ingrandito.

## Fabbisogno e prima consegna

L’inventario completo è in [docs/assets/botanici-specifici-2026-10-19/README.md](assets/botanici-specifici-2026-10-19/README.md), con dettaglio macchina in `inventory.json`. Sono 272 combinazioni specie/carattere/valore anatomiche in 70 schede strutturate. Le 9 anatomie precedentemente revisionate sono conservate. Le 8 ulteriori piante senza matrice non ricevono caratteri inventati.

Il primo blocco integra **38 nuovi collegamenti specie/carattere/valore**, corrispondenti a **37 file** su 10 specie: corbezzolo, ortica, melissa, malva, rovo, biancospino, prugnolo, genziana maggiore, veratro, aglio orsino. Sono 35 collegamenti anatomici e 3 per la disposizione delle foglie. Il medesimo dettaglio della malva mostra sia lobi sia denti: viene riusato per i due valori senza duplicare la figura nella tessera.

Il catalogo non è dichiarato completo: altri 228 collegamenti anatomici restano fuori da questo blocco, fra lavorazione, revisione e lacune documentali. Un candidato generato e una figura pubblicata sono stati distinti. Lo stato corrente e le successive assegnazioni sono nell’inventario del dossier.

## Risultato nelle schede

- Corbezzolo: foglia intera semplice e dentata, ingrandimento parziale del margine, corolle a orcio pendule e bacca esterna tubercolata. Foglia, margine e frutto derivano dal master v2; il fiore dal v3 corretto dopo due scarti.
- Ortica, melissa, malva, rovo, biancospino e prugnolo: anatomie proprie per foglia e bordo; primi fiori e frutti laddove foto e fonti permettono la verifica.
- Genziana e veratro: nervature, fiori e disposizione delle foglie distinti; non viene usata la stessa figura generica per spiegare specie diverse.
- Aglio orsino: foglia con picciolo, foglie basali, ombrella di fiori a sei tepali e capsula in formazione. La fase immatura è dichiarata accanto alla figura; non viene inventato il colore del frutto maturo, che resta `null` nei dati.

Il renderer richiede ora una revisione specifica anche per foglie semplici e margini, oltre a fiori, frutti e foglie composte. In attesa della figura corretta rimangono i valori testuali; il disegno generico della chiave guidata non diventa automaticamente un ritratto della specie. I campioni cromatici e i simboli di altezza restano distinti dalle anatomie.

## Produzione, dati e revisioni

Generazione con il tool integrato `image_gen`, senza testi rasterizzati. Master, prompt e correzioni conservati nel dossier. Separazione e ridimensionamento neutri con alpha preservato; nessuna anatomia ridisegnata da codice. Nessun vettore introdotto saltando la revisione raster.

Ogni collegamento nuovo è controllato contro i valori esistenti in `recognize-plants.json`, una fonte botanica e il riferimento fotografico dell’organo rappresentato. Fonte, riferimento, hash e revisione sono registrati in `data/plant-trait-icons.json` e nei manifest dei lotti. Le fotografie di riferimento conservano i crediti del catalogo; nessuna immagine generata sostituisce una foto reale.

Per il corbezzolo sono state lette indipendentemente [Regione Sardegna / SardegnaForeste, pagina 2](https://www.sardegnaforeste.it/sites/default/files/3_68_20130916114432.pdf) e [Comune di Poggio a Caiano](https://www.comune.poggio-a-caiano.po.it/pagina2453_ericaceae.html), confrontando le tre fotografie Dryades locali. Per la capsula dell’aglio orsino sono stati confrontati il dettaglio della foto catalogo 4 e la [descrizione morfologica dell’Università di Udine](https://flora.uniud.it/scheda.php?id=148). Le fonti effettivamente consultate dagli specialisti per gli altri organi sono registrate nei rispettivi lotti, con eventuali errori di accesso esplicitati.

## Verifiche del primo blocco

Controllo visivo indipendente dei raster e delle fotografie, poi delle 10 schede nel browser. Controllati caricamento delle figure, foglia e macro del corbezzolo, deduplicazione del bordo della malva e didascalia della capsula. Verificati 1280, 390 e 320 px e temi chiaro/scuro sul caso guida. Il rapporto asset non segnala incoerenze o nuove mancanze non elencate; conserva le pendenze storiche del catalogo.

Nessuna suite di test, test unitario, dry-run o suite CI avviata, come richiesto. Il test esistente che pretendeva la foglia generica non revisionata è stato aggiornato alla nuova regola, senza eseguirlo. Controllate sintassi e differenze Git. Dati morfologici e matrici non modificati per adattarli ai disegni. Shell e HTML aggiornati insieme a v237.
