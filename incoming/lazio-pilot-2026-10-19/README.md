# Fronda · raccolta per il pilota Lazio

Richiesta di Matteo del 19 ottobre 2026: estendere il pilota a tutta la regione e avviare agenti per i dati e i contenuti necessari. La raccolta iniziale è stata verificata e integrata nel rilascio v238, su mandato esplicito di pubblicazione. Sono disponibili 36 zone, 21 nuovi campionamenti completi, 17 nuove tracce OSM, cinque soste documentate e 13 copertine reali. [Rapporto, limiti e verifiche](integration/release-report.md). La tabella seguente conserva il perimetro della ricerca iniziale. Il focus rimane l’uscita con interesse prioritario ai funghi; piante, animali e paesaggio aggiungono contesto utile al giro.

## Copertura raccolta

| Pacchetto | Zone candidate | Itinerari | Fonti territoriali |
|---|---:|---:|---:|
| [Tuscia e Roma nord/ovest](nord/dossier.md) | 6 | 7 | 24 |
| [Roma e Appennino orientale](roma-est/dossier.md) | 7 | 7 | 24 |
| [Latina e Frosinone](sud/dossier.md) | 8 | 10 | 27 |
| Totale nuovo materiale | **21** | **24** | **75** |

Le fonti territoriali corrispondono a 74 URL distinti. Sono comprese le 4 nuove zone pontine e le 4 ciociare. Insieme alle 15 zone già presenti, questo primo insieme propone 36 zone nelle cinque province: rappresenta una selezione regionale, non ogni bosco o ogni comune. Il dettaglio di ID, lacune e controlli è in [collection-summary.json](collection-summary.json). Nessun ID duplicato rispetto alle zone esistenti; nessun riferimento a fonte mancante nei tre pacchetti.

Nord: Vico/Monte Venere, Monte Rufeno/Felceto, Oriolo/Monte Raschio, Faggeto di Allumiere, Monterano/Bicione, Veio/Monte Musino.

Roma: Tuscolo, Faete/Monte Cavo, Nemi/Fontan Tempesta, Cerquone/Doganella, Livata/Valle delle Mele, Cervara/Prataglia, Monte Gennaro da Roccagiovine.

Sud: Valle Sant’Angelo a Bassiano, Sughereta di San Vito, Itri/Campello, Cerasella/Verdesca, Prato di Campoli, Supino/Fonte Santa Serena, Filettino/Fiumata, Settefrati/Valle di Canneto.

## Cosa è stato acquisito

Ogni zona ha un testo originale proposto, ambiente documentato, itinerari, accessi noti, spunti di osservazione, fonti e campi ignoti espliciti. Le osservazioni non diventano avvistamenti e il bosco compatibile non garantisce ritrovamenti. Le indicazioni di accesso non trasformano una partenza o un centro parco in un parcheggio autorizzato.

Sono stati ispezionati in memoria 14 documenti geometrici: 13 nei due [audit nord](nord/geometry-audit.json) e [Roma](roma-est/geometry-audit.json), più il [GPX 693a a Fiumata](platform/sud-693a-geometry.json). Sono registrati hash, punti, estremi e ingombro geografico. Nessun file integrale è stato ridistribuito o importato. Licenza specifica delle geometrie ancora da accertare; i punti derivati non sono centri di zona o parcheggi. GPX e KML dello stesso percorso possono differire e non vengono unificati automaticamente.

La ricerca fotografica ha prodotto 32 risultati: 14 sono stati esclusi già dai metadati perché documenti, opere, riprese satellitari o soggetti inadatti alla copertina del bosco. Restano [18 foto candidate con autore e licenza](platform/photo-candidates.json), **nessuna approvata visivamente**. Prima dell’uso servono confronto con il luogo, qualità fotografica, scelta del taglio e verifica dei crediti. Nessuna immagine è stata scaricata o aggiunta al catalogo.

Il [repertorio micologico](platform/micological-services.json) comprende riferimenti per le 10 ASL del Lazio. È stato letto visivamente l’[elenco pubblicato da ASL Roma 5 come 2026](https://www.aslroma5.it/wp-content/uploads/2026/04/elenco-ufficiale-Ispettorati-micologici-Lazio-2026.pdf), confrontandolo con le pagine dei servizi. Sono emerse divergenze di orari e recapiti: gli orari per l’app restano non compilati finché non chiariti. Una data nel percorso del PDF non prova che ogni riga sia aggiornata.

## Riscontri che condizionano l’integrazione

- Il [CAI 207c Valli del Sorbo–Formello](https://www.parchilazio.it/veio-schede-18273-207c_strada_del_sordo_formello_cai) è indicato chiuso: escluso dalle proposte percorribili.
- Il [Circeo per il 2026](https://www.parcocirceo.it/dettaglio.php?id=85389) limita la raccolta ad aree e categorie autorizzate: Cerasella/Verdesca non è proposta come raccolta libera al pubblico generale. La visita osservativa resta distinta.
- Il percorso 672c presenta valori discordanti tra ParchiLazio e [scheda dell’ente Simbruini](https://www.parcomontisimbruini.it/itinerari-dettaglio.php?id_iti=370); analogo conflitto per il 661. Le versioni sono conservate separatamente.
- Per Fiumata è registrato un errore del campo Comune («Filattiera»), senza trasferirlo al candidato Filettino. San Vito ha un riferimento di itinerario storico del 2011, insufficiente a dimostrare l’accesso attuale. Per Canneto servono controllo spaziale del confine e disciplina puntuale.
- La [pagina corrente della Regione sui funghi](https://www.regione.lazio.it/cittadini/agricoltura/Funghi) supera vecchie pagine che limitavano i giorni settimanali. Restano da verificare deroghe e autorizzazioni del singolo luogo; il titolo regionale non è un diritto di accesso a qualunque fondo.

Il coordinatore ha verificato indipendentemente i tre casi Circeo, chiusura 207c e scheda ente 672c. Gli altri fatti restano tracciati alle fonti lette dagli specialisti e alle rispettive lacune, senza un’approvazione automatica del pacchetto.

## Dati regionali e lavoro per l’attivazione

La [ricognizione tecnica](platform/integration-audit.json) inventaria i dati e i punti ancora legati a Rieti: partenza, ricerca luoghi, inquadratura/base cartografica, affollamento e riferimenti locali, meteo, CMS, testi e contatti.

I [controlli di raggiungibilità](platform/endpoint-probes.json) hanno ottenuto HTTP 200 dalla Carta Forestale in tre finestre tecniche a nord, centro e sud, dall’API Commons e dal dominio upload. Le finestre non sono confini approvati delle nuove zone. La [Regione documenta WMS/WFS e riuso dei dati pubblici](https://www.regione.lazio.it/cittadini/urbanistica/sistema-informativo-territoriale-regionale/geoportale-regionale); va conservato anche il metadato del singolo strato. La carta forestale resta una base storica, non una fotografia attuale della presenza fungina.

L’attivazione richiede: delimitare le zone, acquisire geometrie riutilizzabili, campionare bosco e quote, verificare accessi/chiusure/regole, completare foto e crediti, poi integrare dati e snapshot CMS. La scelta della partenza deve funzionare per tutta la regione; non si copiano tempi d’auto da Rieti. Il meteo va dimensionato usando cache e chiamate per zona, rispettando i [termini del fornitore](https://open-meteo.com/en/terms). L’etichetta prevista è «Pilota Lazio · zone selezionate» quando la copertura è effettivamente disponibile.

Nessun dato applicativo, soglia, punteggio o risorsa pubblicata modificato. Nessuna suite, test, dry-run o CI avviata. I candidati e il piano sono salvati sul ramo `codex/lazio-pilot-research`, separati dalla produzione e dai dossier botanici precedenti.
