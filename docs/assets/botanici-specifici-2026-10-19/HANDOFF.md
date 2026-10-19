# Handoff del dossier botanico, produzione ferma

19 ottobre 2026. Tutti gli agenti hanno confermato il fermo. Nessuna nuova generazione prevista prima della revisione indipendente del coordinatore. Nessun test, suite, dry-run, commit o pubblicazione eseguito dagli specialisti. Il primo blocco è stato pubblicato e verificato dal coordinatore come v237; i successivi lotti non sono integrati.

## Stati del nucleo anatomico

La matrice comprende 272 mapping specie / carattere / valore, su 70 specie. Le 8 ulteriori schede senza matrice non ricevono anatomie inventate.

| Stato | Mapping |
|---|---:|
| Asset già revisionati prima del lavoro, preservati | 9 |
| Nuovi mapping anatomici pubblicati nel primo blocco v237 | 35 |
| Candidati specialistici in attesa di revisione indipendente | 128 |
| Candidati sospesi dopo confronto del coordinatore | 4 |
| Raster scartati, correzione ancora da avviare | 3 |
| Conflitti tra dato e fonti, da chiarire | 3 |
| Documentazione fotografica ancora insufficiente nel set esaminato | 20 |
| Nuova prova fotografica individuata, generazione ferma | 9 |
| Non avviati per fermo della produzione | 61 |

Questi conteggi riguardano solo i quattro caratteri anatomici. I registri includono anche alcune figure di disposizione delle foglie. Per lo stato di ogni combinazione usare `inventory.json`; `candidate-summary.json` separa mapping, file fisici e raster con contenuto distinto.

## Pacchetti per la revisione

| Lotto | Proposte non integrate | Sospesi/non avviati | Tavola e registro |
|---|---:|---|---|
| Anatomie prioritarie, 25 specie | 63 mapping / 61 raster | 22 inizialmente sospesi: 9 ora hanno nuova prova fotografica senza generazione; 3 conflitti dati rimangono | `lotti/anatomie-prioritarie/contact-sheet-final.png`, `registry-proposal.json`, `blocked.json`, `fruit-research-findings.json` |
| Foglie dentate gap15 | 43 mapping / 42 raster distinti | **4 non pronti**: capsule iperico/silene/viola e foglia intera cicuta; 7 ulteriori blocchi documentali | `lotti/foglie-dentate/gap15/contact-sheet-final.png`, `registry-proposal.json`, `blocked.json`, `proofs/LEAF-EVIDENCE.md` |
| Foglie del bosco, 6 specie | 17 mapping / 17 raster | 10 ulteriori mapping non avviati per lo stop; nessun blocco scientifico presunto | `lotti/foglie-bosco/contact-sheet.png`, `piantaggine-contact-sheet.png`, `mente-origano-contact-sheet.png`, `registry-proposal.json` |
| Arbusti e cladodi, 17 specie | 12 mapping / 12 raster | 3 scarti visivi + 51 mapping non avviati | `lotti/arbusti-cladodi/contact-sheet.png`, `registry-proposal.json`, `states.json`, `blocked.json` |

I tre pacchetti di contatto foglie-bosco sono separati per renderli ispezionabili: alliaria/borragine 4, piantaggine 4, mente/origano 9. Caption visibili distinguono foglia basale, variante dentata, cladodi e fasi immature dove necessario.

## Sospensioni da rispettare

- Capsule iperico, silene e viola: il riempimento crema accanto a organi verdi suggerisce un colore naturale non documentato. Non approvare dal solo testo della caption: serve raster coerentemente monocromatico oppure prova della fase/colore, senza alterare i dati.
- Cicuta, foglia completa: il candidato semplifica eccessivamente i 3–4 ordini di divisione documentati. Riferimenti e foto in `gap15/proofs/LEAF-EVIDENCE.md`; stato sospeso nell'inventario, anche se il vecchio registro del produttore conserva la proposta originaria.
- Achillea: resta candidata con limiti dichiarati e macro TSB53900; non attribuire al testo universitario un conteggio dei livelli di divisione che non contiene.
- Ginepro, aghi: un nodo del raster mostra più di tre aghi; non esportato.
- Corniolo, foglia: troppe nervature forti nel master; non esportato.
- Pungitopo, fiore: tepali corretti a sei, ma centro ancora ambiguo; non esportato.
- Aristolochia: il margine dipende da scala/variabilità e fonti discordanti; non generare denti grandi per adattarsi al valore chiuso. Elleboro: il dato capsula confligge con follicoli descritti dalla fonte. Dettagli nel blocked delle anatomie prioritarie.

## Custodia e salvataggio

Salvare il dossier nuovo/modificato sotto `docs/assets/botanici-specifici-2026-10-19/`, inclusi prompt, registri, review, source-record/generation-log, inventario e prove fotografiche licenziate. I raster destinati alla UI restano nei rispettivi `candidates/`; `src` indica solo il path canonico proposto e `candidatePath` la collocazione reale. Alcuni bordi condividono contenuto identico per più valori: numero di file e numero di figure non coincidono sempre.

I PNG di master/tavole sono ignorati dalle regole generali Git: per conservarli nel ramo di revisione serve aggiunta esplicita. I master sono copie dei risultati image_gen; `source-record.json` e `masters-manifest.json` ne conservano hash e provenienza. La sola presenza del file non prova approvazione botanica.

Non salvare nel repository i download privi di licenza di ridistribuzione verificata, custoditi in `/Users/matteo/Documents/ChatGPT/fronda/output/botanical-references/`. Il dossier conserva URL, autore/licenza quando verificati, fase osservata e hash. Foto originali licenziate incluse nelle prove di gap15 hanno manifest separato.

Il coordinatore integra solo dopo confronto indipendente tra dato, fonte, foto e raster a grandezza piena e nella UI. Non rigenerare i 9 precedenti o il primo blocco approvato; non confondere candidati, revisionati e pubblicati.
