# Revisione severa dei caratteri botanici · 18 ottobre 2026

## Perimetro e metodo

Revisione editoriale visiva, non certificazione botanica. Confrontati i due raster candidati della fragolina a piena risoluzione, le tre fotografie esistenti della specie, i testi `recognize` e le fonti registrate in catalogo. Ispezionate tutte le 51 icone nella tavola `/tmp/fronda-plants-review.png` e confrontati i riusi con le descrizioni del catalogo. Per rosa canina visionate tutte e tre le foto; per finocchietto le foto 1 e 2. Non è stata effettuata una revisione anatomica completa di tutte le 70 specie: gli altri casi elencati sono controesempi verificabili dai testi, sufficienti per bloccare il riuso automatico. Le pagine esterne non sono state nuovamente scaricate: fonti e licenze sono quelle già registrate nel catalogo.

Il brief originario `docs/handoff-immagini-piante.md` richiedeva **un esempio per valore, non per specie**. Un'icona valida nel percorso didattico non diventa per questo una rappresentazione valida di ogni specie che possiede quel valore. Il contesto della scheda cambia il significato percepito.

## Fragolina: due raster approvati per uso limitato

- `approvati/fragolina-frutto.webp`: ricettacolo rosso con numerosi acheni **sulla superficie esterna**, forma conica/allungata, calice e peduncolo verdi. Nessuna sezione, cavità o seme interno. Coerente con la foto 1 e con «Piccoli falsi frutti rossi, con acheni sulla superficie». A 64 px gli acheni rimangono riconoscibili. Limiti: numero/colore chiaro degli acheni e brillantezza sono semplificati; il disegno non definisce dimensioni reali, maturazione o commestibilità.
- `approvati/fragolina-foglia.webp`: esattamente **tre foglioline separate e dentate**, terminale e due laterali su picciolo comune; coerente con foto 2 e descrizione. A 64 px restano leggibili i tre elementi e i margini. Limiti: nervature ridotte, forma e dentatura idealizzate, nessuna affermazione su pelosità o scala.
- Entrambe: PNG originali conservati, esportazione meccanica WebP lossless con alpha, 128×128, massimo ingombro 112 px, margine minimo 8 px; bbox calcolato con alpha >16. Il foglio di controllo mostra **128 px e 64 px senza ingrandimento**. Solo raster; nessun vettore è stato prodotto prima della revisione.

### Altri caratteri visibili della fragolina

| Carattere | Esito circoscritto |
|---|---|
| Foglia composta generica a 7 foglioline | Scartata nella scheda: contraddice le tre foglioline documentate. Usare nuovo override. |
| Falso frutto generico sezionato | Scartato: mostra frutto cavo con elementi interni, non ricettacolo con acheni esterni. |
| Colore del frutto «rosso» con bacca tonda | Scartato nella scheda: il colore non giustifica una diversa anatomia. Usare campione cromatico. |
| Colore del fiore | Campione cromatico preferibile, evitando di aggiungere forma alla risposta cromatica. |
| Fiore/infiorescenza a cinque petali | Compatibile come schema del carattere: cinque petali chiari e centro giallo, confermati dalle foto 3 e dal testo. Non disegno completo della specie. |
| Margine dentato | Accettabile come dettaglio astratto della dentatura; non attribuire la foglia intera del pittogramma alla specie. |
| Portamento, altezza e rosetta | Soltanto schemi di categoria. Sagoma, numero e forma di foglie e colore del fusto non sono stati approvati come rappresentazione di Fragaria vesca. |

Fonte: Università di Trieste, Portale della Flora di Roma, https://dryades.units.it/Roma/index.php?id=2073&procedure=taxon_page. Riferimenti fotografici esistenti: `assets/plants/fragolina-{1,2,3}.webp`, Andrea Moro / Dipartimento di Scienze della Vita, Università di Trieste, CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. I prompt e i riferimenti passati al generatore sono conservati nei due file `prompt-*.txt`.

## Riusi problematici trovati e raccomandazione

Per la correzione immediata: nelle schede usare soltanto override revisionati per i casi che suggeriscono una precisa anatomia della specie; in assenza, mantenere etichette e valori completi senza disegno. Le icone generiche possono continuare a spiegare **categorie** nel percorso guidato se esplicitamente contestualizzate come esempi. Nessuna modifica dei dati per adattarli al disegno.

| Gruppo | Controesempio concreto | Raccomandazione |
|---|---|---|
| `fruit_type` (tutti) | `carnoso` è rosso e liscio anche per prugnolo blu scuro, sambuco nero e corbezzolo granuloso; `capsula` a 3 valve anche per fusaggine a 4 lobi e stramonio spinoso; `secco_piccolo` allungato anche per malva con frutto a disco | Evitare riuso automatico in scheda; override per specie. |
| `leaf_type:composta` | 7 foglioline pennate per fragolina trifogliata, ginestra dei carbonai trifogliata, elleboro con segmenti stretti | Override revisionato, altrimenti testo. |
| `flower_shape:molti_petali` | Disegno tipo margherita/capolino per anemone degli Appennini con segmenti semplici aperti | Override; non confondere fiore e capolino. |
| `flower_shape:ombrella` | Icona piatta bianca per aglio orsino con ombrella quasi sferica; fiori bianchi per finocchietto giallo | Serve raster coerente con specie, anche quando lo schema di ramificazione è valido. |
| `flower_shape:tubo_labbra` | Bilabiata viola tipo salvia per aristolochia con tubo giallastro e apertura obliqua | Non confondere categorie ampie con morfologia uniforme. |
| `flower_shape:sei_tepali` | Stella aperta per bucaneve con 3 tepali esterni e 3 interni corti, oppure narciso con corona centrale | Override per specie; il numero da solo non basta. |
| Colori del fiore/frutto | Tutti i fiori a 5 petali e tutti i frutti tondi | Campioni cromatici nelle schede. |

### Rosa canina: scarto del vecchio falso frutto

Non approvato come raffigurazione della specie. La foto 1 mostra residuo calicino scuro all'apice opposto al peduncolo; l'icona ha semplici appendici brune senza esplicitare tale struttura. La sezione espone acheni ma omette del tutto i **peli interni**, carattere esplicito e rilevante nei campi `foodUse.parts` e `foodUse.caution`. Le foto disponibili non mostrano una sezione con cui validare l'interno. Preferire futuro raster **esterno intero** da foto, evitando anatomia interna non verificata. Fonte catalogo https://dryades.units.it/Roma/index.php?id=1972&procedure=taxon_page; tre foto Andrea Moro / Università di Trieste CC BY-SA 4.0.

### Finocchietto: scarto dell'ombrella generica nella scheda

La foto 1 conferma fiori gialli piccolissimi, non i fiori bianchi aperti dell'icona. La ramificazione a ombrella spiega la categoria ma non basta ad approvare la raffigurazione della specie. Serve nuovo raster, fondato sulla foto e senza fiori bianchi. Fonte catalogo https://dryades.units.it/Roma/index.php?id=3527&procedure=taxon_page; foto 1 e 2 Andrea Moro / Università di Trieste CC BY-SA 4.0.

## Ordine di produzione successiva

Prima raster, controllo dati/foto e leggibilità, poi eventualmente vettore multilivello. Priorità proposte: cinorrodo esterno della rosa canina; ombrella gialla del finocchietto; morfologie già documentate ma molto diverse nelle categorie sopra. La presente consegna include soltanto i due asset della fragolina approvati: le altre specie non ricevono un'approvazione implicita.

## Seconda consegna: raster corretti dopo controllo indipendente

- `approvati/rosa-canina-cinorrodo.webp`: approvato come **esterno schematico intero**, non sezione. Forma ovale rossa/aranciata, residuo calicino secco scuro all'apice, peduncolo verde all'estremo opposto, superficie senza acheni esterni. Confrontato con foto1. La diversa dimensione degli organi è semplificata: non diagramma in scala, non descrizione dei peli interni. Lieve cicatrice sul breve tratto di fusto coerente con riferimento, non carattere diagnostico aggiunto al testo.
- `approvati/finocchietto-ombrella.webp`: approvato **r02** come schema dell'ombrella composta gialla: raggi principali da un punto e raggi secondari in ogni ombrelletta; fiori gialli ridotti a punti alla scala dell'icona. Non raffigura singoli organi fiorali né ne afferma il numero. Confrontato con foto1 e dati catalogo. Non copre frutti, foglie o portamento intero.
- Finocchietto **r00 scartato**: corolle gialle con quattro petali grandi, incongrue rispetto ai piccoli petali ripiegati della foto; staminali rappresentati come terminazioni separate.
- Finocchietto **r01 scartato**: migliore colore ma mantiene corolle troppo grandi e schema ambiguo di filamenti separati dai fiori. Non basta correggere il colore.
- Finocchietto **r02** semplifica il dettaglio al livello realmente leggibile e documentato: ombrella composta e fiori gialli minuti, senza inventare anatomia fiorale. Questo è un nuovo raster generato, non un disegno manuale né un SVG.
- Entrambi i definitivi controllati a128 e64px nel foglio `controllo-successivi-128-64.png`. WebP lossless128alpha con margini>=8px. Originali e scarti conservati; prompt e riferimenti nei file `prompt-successivi.json`, `prompt-finocchietto-r01.txt`, `prompt-finocchietto-r02.txt`.
