# Catalogo Animali · istruttoria del primo rilascio

18 ottobre 2026 · dati in `data/animals.json`. Implementazione autorizzata da Matteo dopo lo studio iniziale; questa istruttoria non equivale a revisione specialistica clinica o zoologica.

## Esito

12 candidate; 8 schede con testo utilizzabile e 4 bozze escluse dal catalogo pubblico. Nessuna foto acquisita o licenza fotografica presunta. `ready` riguarda esclusivamente il contenuto testuale presente: non certifica identificazione, presenza sul percorso o completezza dei media.

Le bozze sono altre api selvatiche e vespe sociali (raggruppamenti da circoscrivere), processionaria del pino e vipera comune (informazione pratica da completare e validare prima di esporle come schede per la prudenza). Le altre schede non riproducono protocolli medici, trattamenti, farmaci, soglie temporali o chiavi diagnostiche.

Le indicazioni di prevenzione per zecche e imenotteri sono brevi parafrasi delle fonti ISS consultate. La rimozione della zecca è esclusa per la discrepanza documentata nello studio. Anche su cinghiale/lupo le indicazioni operative ulteriori restano da istruire: non ricavate dall’aspetto o dalla narrativa del rischio.

I campi non istruiti restano vuoti. Non sono stati creati calendari mensili, avvistamenti, relazioni di presenza, punteggi o mappa. Le `knownGaps` sono note editoriali interne: eventuale esposizione UI deve distinguere limite utile al visitatore da dettaglio della produzione.

## Granularità e ambito

Zecche: `rank: editorial_group` perché il vocabolario richiesto non contempla il rango tassonomico di ordine; `latin: Ixodida` è il riferimento del gruppo e non il nome di una specie. Farfalle diurne e gruppi di api/vespe non hanno un binomio inventato. Nessuna sottospecie del lupo assegnata, vista la discordanza delle fonti consultate.

Le fonti di Bologna descrivono osservazioni nell’Orto Botanico: si usa il fatto che i generi visitano i fiori, non i mesi o le associazioni con le piante nel Lazio. Le fonti britanniche dei bombi sostengono soltanto caratteri generali, non distribuzione o frequenza italiana. Fonti di altre regioni per morfologia e biologia non provano presenza nel Reatino.

## Fonti consultate e localizzatori

| ID | Fonte | Passaggi utilizzati / esclusioni |
|---|---|---|
| ISS-Z | [Zecche](https://www.epicentro.iss.it/zecche/) · ISS · EpiCentro | Informazioni generali (morfologia, habitat, comportamento); Prevenzione; Malattie trasmesse dalle zecche |
| ISS-P | [Punture di vespe, api e calabroni](https://www.issalute.it/index.php/la-salute-dalla-a-alla-z-menu/p/punture-di-vespe-api-e-calabroni) · ISS · ISSalute | Prevenzione: mantenere la calma e muoversi lentamente |
| ISPRA-I | [Impollinatori](https://www.isprambiente.gov.it/it/attivita/biodiversita/ispra-e-la-biodiversita/impollinatori/impollinatori) · ISPRA | Impollinatori: Apis mellifera e ruolo degli apoidei |
| ISPRA-S | [I Sirfidi (Ditteri): biodiversità e conservazione. Manuale operativo](https://www.isprambiente.gov.it/it/pubblicazioni/manuali-e-linee-guida/i-sirfidi-ditteri-biodiversita-e-conservazione.-manuale-operativo) · ISPRA | Presentazione del manuale: famiglia dei Ditteri e ruolo di impollinatori; PDF non utilizzato |
| LAZ-C | [Il Cinghiale [Sus scrofa]](https://www.parchilazio.it/cammino_naturale_dei_parchi-schede-862-il_cinghiale_sus_scrofa) · Parchi Lazio · Cammino Naturale dei Parchi | Titolo/nome scientifico; corpo, habitat, alimentazione e scavi nel terreno; non importate stime/andamenti di popolazione |
| DUCH | [Montagne della Duchessa · Natura](https://www.parchilazio.it/duchessa-natura) · Parchi Lazio | Fauna: riferimento territoriale; non usato come presenza attuale o probabilità di incontro |
| ISPRA-L | [Le interazioni tra uomo e lupo](https://www.isprambiente.gov.it/it/attivita/biodiversita/monitoraggio-nazionale-del-lupo/notizie/le-interazioni-tra-uomo-e-lupo) · ISPRA / Life Wild Wolf | Presentazione del protocollo per gli enti; non trasferite scale, soglie o procedure agli utenti |
| UNIBO-A | [Le api dell’Orto · Apis](https://sma.unibo.it/it/il-sistema-museale/orto-botanico-ed-erbario/Guida-digitale-agli-apoidei-dell-Orto-Botanico/giugno/apis) · Università di Bologna · Sistema Museale di Ateneo | Specie di Apis presenti nell’Orto Botanico: Apis mellifera; nessun dato mensile importato |
| UNIBO-B | [Le api dell’Orto · Bombus](https://sma.unibo.it/it/il-sistema-museale/orto-botanico-ed-erbario/Guida-digitale-agli-apoidei-dell-Orto-Botanico/giugno/bombus) · Università di Bologna · Sistema Museale di Ateneo | Specie di Bombus osservate e visite ai fiori nell’Orto Botanico; nessun calendario o associazione locale importati |
| UNIBO-G | [Le api dell’Orto · Guida digitale](https://sma.unibo.it/it/il-sistema-museale/orto-botanico-ed-erbario/Guida-digitale-agli-apoidei-dell-Orto-Botanico) · Università di Bologna · Sistema Museale di Ateneo | Le api dell’Orto: diversità delle api; organizzazione delle api da miele; api selvatiche |
| RER-V | [Vespe e calabroni](https://agricoltura.regione.emilia-romagna.it/fitosanitario/difesa-sostenibile/protezione-del-verde/difesa-ecocompatibile/qualita-del-verde/manuale/ospiti-molesti/vespe-e-calabroni) · Regione Emilia-Romagna · Servizio fitosanitario | Vespe e calabroni: nidi; Attenzione! Non confondere le Vespe con i Sirfidi: ali, volo e visita ai fiori |
| LAZ-V | [Vipera comune](https://www.parchilazio.it/schede-92-vipera_comune) · Parchi Lazio | Nome scientifico; variabilità di colore/macchie; alimentazione per stadi; escluse chiavi visive e date riproduttive |
| LAZ-CR | [Calabroni asiatici a Grottaferrata, l’allarme rientra](https://www.parchilazio.it/schede-5262-calabroni_asiatici_a_grottaferrata_l_allarme_rientra) · Parchi Lazio · Parco dei Castelli Romani | 20/09/2018: identificazione Vespa crabro e raccomandazione di non avvicinarsi ai nidi; non importati allarmi/distribuzioni del 2018 |
| BCT-B | [Bumblebee species guide](https://www.bumblebeeconservation.org/learn-about-bumblebees/species-guide/) · Bumblebee Conservation Trust | How to identify bumblebees: peli e disegni variabili; tassonomia di genere, non distribuzione italiana |
| APAM-F | [Morfologia della farfalla](https://www.areeprotettealpimarittime.it/citizen-science/effetto-farfalla/morfologia-della-farfalla) · Ente Aree Protette Alpi Marittime | Aspetto: squame, antenne, spirotromba; fragilità delle ali; escluse generalizzazioni su colore e posizione a riposo |
| MAD-F | [Farfalle diurne](https://www.parcodellemadonie.it/farfalle-diurne/) · Ente Parco delle Madonie | Biologia: quattro stadi; Sistematica: raggruppamento editoriale, non trasferita classificazione storica |
| ERSA-P | [Thaumetopoea pityocampa · Processionaria del pino](https://www.ersa.fvg.it/cms/aziende/monitoraggi/organismi/schede/38_Thaumetopoea-pityocampa-Processionaria-del-pino.html) · ERSA · Agenzia regionale per lo sviluppo rurale del Friuli Venezia Giulia | Nome scientifico; Descrizione (adulti, larve e ospiti); Descrizione dei sintomi (dispersione dei peli); non importati calendario, soglie, norme, trattamenti |
| PNALM-L | [Lupo](https://www.parcoabruzzo.it/fauna.schede.dettaglio.php?id=21) · Parco Nazionale d’Abruzzo, Lazio e Molise | Scheda Lupo, righe Habitat, Cosa mangia, Curiosità; mantenuto nome di specie senza sottospecie |
| LAZ-L | [Il Lupo](https://www.parchilazio.it/cammino_naturale_dei_parchi-schede-863-il_lupo) · Parchi Lazio · Cammino Naturale dei Parchi | Nome Canis lupus; movimenti in coppia/famiglia; esclusi stime numeriche, aspetti normativi e sottospecie |

## Claim → fonte

Le righe individuano il percorso esatto del JSON, evitando duplicazioni dei testi. `sourceIds` della scheda copre anche nome e sintesi editoriale; ogni elemento delle cinque liste ha fonti proprie. Le sintesi sono titoli editoriali, non dati aggiuntivi.

| Voce | Stato | Percorso della claim | Fonte |
|---|---|---|---|
| ape-da-miele | ready | `behavior[0]` | UNIBO-G |
| ape-da-miele | ready | `ecology[0]` | ISPRA-I |
| ape-da-miele | ready | `cautions[0]` | ISS-P |
| bombi | ready | `observe[0]` | BCT-B |
| bombi | ready | `behavior[0]` | UNIBO-B |
| altre-api-selvatiche | draft | `ecology[0]` | UNIBO-G |
| sirfidi | ready | `observe[0]` | RER-V |
| sirfidi | ready | `observe[1]` | RER-V |
| sirfidi | ready | `behavior[0]` | RER-V |
| sirfidi | ready | `ecology[0]` | ISPRA-S |
| farfalle-diurne | ready | `observe[0]` | APAM-F |
| farfalle-diurne | ready | `observe[1]` | APAM-F |
| farfalle-diurne | ready | `observe[2]` | APAM-F |
| farfalle-diurne | ready | `behavior[0]` | MAD-F |
| farfalle-diurne | ready | `ecology[0]` | APAM-F |
| farfalle-diurne | ready | `cautions[0]` | APAM-F |
| vespe-sociali | draft | `behavior[0]` | RER-V |
| vespe-sociali | draft | `cautions[0]` | ISS-P |
| calabrone-europeo | ready | `habitat[0]` | RER-V |
| calabrone-europeo | ready | `behavior[0]` | RER-V |
| calabrone-europeo | ready | `cautions[0]` | LAZ-CR |
| calabrone-europeo | ready | `cautions[1]` | ISS-P |
| zecche | ready | `observe[0]` | ISS-Z |
| zecche | ready | `habitat[0]` | ISS-Z |
| zecche | ready | `behavior[0]` | ISS-Z |
| zecche | ready | `cautions[0]` | ISS-Z |
| zecche | ready | `cautions[1]` | ISS-Z |
| zecche | ready | `cautions[2]` | ISS-Z |
| processionaria-del-pino | draft | `observe[0]` | ERSA-P |
| processionaria-del-pino | draft | `habitat[0]` | ERSA-P |
| processionaria-del-pino | draft | `behavior[0]` | ERSA-P |
| processionaria-del-pino | draft | `cautions[0]` | ERSA-P |
| vipera-comune | draft | `observe[0]` | LAZ-V |
| vipera-comune | draft | `ecology[0]` | LAZ-V |
| cinghiale | ready | `observe[0]` | LAZ-C |
| cinghiale | ready | `observe[1]` | LAZ-C |
| cinghiale | ready | `habitat[0]` | LAZ-C |
| cinghiale | ready | `ecology[0]` | LAZ-C |
| lupo | ready | `habitat[0]` | PNALM-L |
| lupo | ready | `behavior[0]` | LAZ-L |
| lupo | ready | `behavior[1]` | PNALM-L |
| lupo | ready | `ecology[0]` | PNALM-L |

## Accessi limitati e fonti non usate

L’apertura diretta del PDF LIFE4Pollinators sulle api è stata rifiutata dallo strumento web (restricted URL); il PDF regionale «Andar per farfalle» ha restituito un errore interno. Non sono stati aggirati i blocchi né usati estratti di ricerca come base delle claim nel catalogo. L’opuscolo Alpi Cozie e le vecchie citazioni dello studio non sono stati promossi a evidenza delle nuove schede senza lettura pertinente.

La pagina RER contiene anche suggerimenti per distruzione di nidi e pronto soccorso: non importati. La pagina PNALM e quella Parchi Lazio differiscono sull’interpretazione della sottospecie: non si sceglie una sottospecie per convenienza del catalogo.

## Verifiche

JSON parsabile; 12 ID unici; 42 claim con fonti esistenti incluse nei riferimenti della scheda; ranghi e percorsi nel vocabolario concordato; nessuna foto o URL immagine privo di licenza; 8 ready e 4 draft. `git diff --check` eseguito. Nessun file dell’interfaccia modificato in questo ramo.


## Integrazione app · shell 213

Catalogo `#/animali` in Scopri e schede `#/animale/<id>`. Otto voci pubblicabili,
quattro bozze non ricercabili e non apribili direttamente. Percorsi editoriali,
fonti numerate per frase, cautele aperte e navigazione indietro condivisa. Non ci
sono CTA Taccuino perché il relativo backend non supporta ancora animali.
I termini zoologici non vengono collegati automaticamente al glossario micologico.

Risorsa CMS `animals`: schema, validazione delle claim/fonti, seed e snapshot,
aggiornamento del repository che protegge bozze e contenuti degli autori. Ogni
modifica richiede revisione. Risorse/module/CSS precache e versione app allineate.

Rapporto asset: `animali-foto` **8 richiesti, 8 mancanti, 8 elencati, 0 non
elencati**. Nessuna immagine sostitutiva generata. Le pendenze di immagini
preesistenti restano invariate, nessuna nuova incoerenza.

Verifiche mirate: 25 test Node su contenuti, CMS e asset; 7 scenari browser su
catalogo, rail di cinque sezioni, filtri, dettaglio/fonti/back, bozze escluse e
ricerca per nomi/caratteri a 320/390/768 px nei temi chiaro e scuro. Dry-run
Wrangler completato con configurazione locale in `/tmp`. Nessun deploy o merge
eseguito da questo ramo. Safari reale non disponibile per verifica fisica.
