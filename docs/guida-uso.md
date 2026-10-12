# Guida all'uso

Fungaroli Rieti ti aiuta a scegliere **dove**, **a che quota** e **quando** andare a cercare funghi commestibili nelle sette zone intorno a Rieti. Non ti dice dove sono i funghi e non serve a riconoscerli: ti dice dove le condizioni di bosco, pioggia e temperatura sono più favorevoli, giorno per giorno.

Il dettaglio di come si calcola l'indice è in [metodo-scientifico.md](metodo-scientifico.md). Qui c'è solo quello che serve per usarlo.

## L'indice in breve

Ogni zona riceve un numero da 0 a 100 per ogni giorno. È il risultato migliore tra le specie che stai cercando e le tre quote della zona. Il colore segue sei classi:

| Indice | Classe | Come leggerla |
|---|---|---|
| 75-100 | Eccellente | Condizioni molto vicine all'ottimo. Rare. |
| 60-74 | Ottimo | Vale l'uscita. |
| 45-59 | Buono | Condizioni favorevoli, uscita sensata. |
| 30-44 | Possibile | Qualcosa può esserci, soprattutto nei punti migliori. |
| 15-29 | Scarso | Poche probabilità. |
| 0-14 | Improbabile | Fuori stagione, bosco inadatto o troppo secco. |

Due cose da sapere subito:

- L'indice descrive le **condizioni**, non la quantità. Un 70 non promette il doppio dei funghi di un 35.
- I numeri sono tarati su ipotesi ragionevoli ma non ancora verificate nel Reatino. Il diario serve a capire quanto ci prende (vedi sotto). La lettura più utile, finché il diario non dice altro, è il confronto: tra zone, tra quote, tra giorni.

### L'affidabilità

Accanto a ogni proposta trovi un'affidabilità (alta, media, bassa). Per oggi e per i giorni passati è sempre piena. Per i giorni futuri scende quando una parte della pioggia che conta non è ancora caduta ma solo prevista, e scende un po' per ogni giorno in più.

Il motivo per cui l'indice dei prossimi giorni è più stabile di quanto sembri: i funghi nascono una o tre settimane dopo la pioggia, quindi per sapere se tra quattro giorni ci saranno porcini conta soprattutto la pioggia di due settimane fa, che è già caduta.

## Lo schermo, dall'alto in basso

### Cerco: i gruppi di specie

I pulsanti in alto scelgono quali specie considerare:

- **Porcini**: porcino, porcino rosso, porcino nero, porcino estivo;
- **Ovolo**: ovolo buono;
- **Finferli**: finferlo o gallinaccio;
- **Altre latifoglie**: trombetta dei morti, steccherino dorato, mazza di tamburo, chiodino, colombina e verdone;
- **Pineta / tardivi**: pinarolo, moretta, agarico violetto.

All'apertura sono attivi Porcini, Ovolo e Finferli. Almeno un gruppo resta sempre attivo. L'app ricorda la scelta nel browser.

### Preferisco: le tre preferenze

Non cambiano l'indice di fruttificazione: lo correggono per la classifica, la striscia dei giorni, la mappa e la scheda.

| Preferenza | Cosa fa | Quanto pesa al massimo |
|---|---|---|
| **Poca gente** | Penalizza i giorni e le zone dove si aspetta più affollamento (weekend e festivi, zone note, buttate in corso da giorni, accessi facili). | −45% |
| **Accesso comodo** | Favorisce le zone vicine, su asfalto e con il bosco adatto a pochi passi dalla strada. | circa −45% per l'accesso più scomodo |
| **Vicino a Rieti** | Penalizza le zone lontane in auto. | −30% oltre le due ore di viaggio |

Nelle prime versioni dell'interfaccia le stesse preferenze si chiamavano *Evita la folla*, *Preferisci accessi comodi* e *Pesa la distanza da Rieti*.

L'affollamento e la comodità sono stime costruite su regole di buon senso, non osservazioni: considerale un suggerimento.

### La striscia dei giorni

Otto caselle, da oggi a sette giorni avanti. Ogni casella mostra la zona migliore di quel giorno e il suo indice (con le preferenze attive). Tocca un giorno per vedere mappa, classifica evidenziata e scheda zona riferite a quel giorno.

### La mappa

Ogni zona è un cerchio colorato secondo l'indice del giorno scelto, con un'etichetta che riporta indice e nome. Tocca un cerchio per aprire la scheda della zona.

Sulla zona selezionata compaiono anche:

- i **punti di sosta** (pallini color accento);
- il **punto d'accesso più comodo** al bosco adatto (pallino scuro) con una linea tratteggiata verso il bosco;
- i **sentieri** della rete escursionistica: il primo consigliato è evidenziato, quelli che attraversano bosco adatto sono a tratto pieno, gli altri tratteggiati e più chiari.

**La Carta Forestale.** Puoi sovrapporre alla mappa la Carta Forestale della Regione Lazio, che colora i boschi per tipo (faggete, castagneti, cerrete e così via). Sul sito si attiva dal selettore dei livelli in alto a destra, dove puoi anche passare dalla base topografica a quella OpenStreetMap; nella versione Artifact c'è un pulsante **Carta Forestale**. Quando è attiva, sotto la mappa compare la legenda ufficiale della Regione.

### Migliori combinazioni

La classifica raccoglie le otto migliori combinazioni zona × giorno dei prossimi otto giorni, con al massimo due giorni per zona per dare varietà. Ogni riga dice zona, giorno, specie e quota consigliate, minuti da Rieti, i badge di affollamento e comodità e l'affidabilità. Tocca una riga per aprire la scheda di quella zona in quel giorno.

## La scheda zona

È la parte operativa. In alto trovi il giorno, il nome della zona e il punteggio con la sua classe.

### Il riepilogo

Subito sotto, quattro righe rispondono alle domande pratiche:

- **Cosa cercare**: la specie e la quota con l'indice più alto, e fino a due alternative se superano 20.
- **Quando**: l'orario di arrivo consigliato, con il livello di folla, l'alba e l'orario da cui la raccolta è consentita.
- **Come arrivare**: la strada da fare in auto e i metri a piedi fino al bosco adatto, con un link al navigatore. Il badge dice se l'accesso è comodo, medio o impegnativo.
- **Sentiero**: il sentiero segnato che passa più a lungo nel bosco adatto alla quota giusta.

Poi una fila di motivi in breve: millimetri di pioggia nella finestra che conta, pioggia degli ultimi 30 giorni, temperatura media, stato del suolo, eventuali gelate, caldo o shock termico, affidabilità. Se la zona ricade in un'area protetta compare un avviso.

### Le sezioni apribili

Sotto il riepilogo ci sono sezioni che si aprono e chiudono; l'app ricorda quali hai aperto.

**Pioggia e indice degli ultimi 30 giorni** (aperta all'inizio). Due grafici sullo stesso asse dei giorni. Sopra, la pioggia giornaliera: blu pieno per quella osservata, blu chiaro per quella prevista. Sotto, l'indice della zona: linea continua fino a oggi, tratteggiata per i giorni con previsioni; il punto indica il giorno scelto. Passando con il dito o il mouse leggi pioggia e indice di ogni giorno. Il grafico è il modo più rapido per capire il ritardo tra pioggia e nascite: di solito la curva dell'indice sale una o due settimane dopo le barre alte.

**Quando andare e affollamento.** Livello di folla previsto e giorno (con l'eventuale festività), alba, finestra di raccolta legale (da un'ora prima dell'alba a un'ora dopo il tramonto), arrivo consigliato e ora di partenza da Rieti. La regola sull'arrivo è semplice: con folla alta arriva all'apertura, con folla media all'alba, con folla bassa puoi arrivare due ore dopo. Possono comparire suggerimenti, per esempio che la buttata è appena partita, che il bosco adatto lontano dalle strade è meno battuto, o un giorno alternativo con meno gente e indice simile.

**Accesso in auto e a piedi.** Tempo e chilometri da Rieti al punto di sosta principale, strade principali, eventuali tratti finali su strada bianca. Poi il punto più comodo per la specie consigliata: fin dove arrivi in auto e quanti metri a piedi ti separano dal bosco adatto. Attenzione: la distanza a piedi è **in linea d'aria** e non tiene conto del dislivello. Se la zona ha altre soste, sono elencate con il loro tempo.

**Sentieri della zona.** Fino a quattro sentieri della rete escursionistica (CAI e altri, da OpenStreetMap), ordinati per chilometri in bosco adatto alla specie e alla quota. Per ognuno: chilometri adatti e quote, chilometri dentro la zona, difficoltà CAI e durata se note, link a tracciato e profilo su Waymarked Trails. Se nessun sentiero segnato attraversa bosco adatto, l'app lo dice: in quel caso conviene partire dal punto d'accesso.

**Tutte le specie.** Tabella con l'indice di ogni specie dei gruppi scelti, alla sua quota migliore. Le specie con rischi di confusione o di tossicità hanno un avviso (ovolo, finferlo, mazza di tamburo, chiodino, russule verdi, pinarolo, moretta, agarico violetto).

**Bosco a ... m (Carta Forestale).** Una barra con la composizione del bosco nella fascia di ±150 m attorno alla quota consigliata, calcolata su circa 300 punti campione per zona. È il dato che più di tutti spiega perché una quota funziona e un'altra no.

**La zona.** Descrizione, accesso stradale, soste con link alle indicazioni stradali, quote minime, massime e mediane dell'area.

## Il diario

Il diario serve a una cosa sola: capire se il modello funziona qui. Ogni uscita registrata, **anche quelle in cui non trovi niente**, diventa un confronto tra previsto e trovato.

### Registrare un'uscita in 5 passi

Il pulsante **＋ Registra uscita** (in alto e nella sezione del diario) apre una procedura guidata.

1. **Dove sei stato?** Tocca la zona. È preselezionata quella che stai guardando.
2. **Quando?** Oggi, ieri o un altro giorno (con il calendario, al massimo fino a oggi).
3. **A che quota, più o meno?** Una delle tre fasce della zona, oppure "Non lo so".
4. **Cosa hai trovato?** Per ogni specie scegli Pochi, Discreti o Tanti, solo per quello che hai raccolto. Le prime sei specie mostrate sono quelle che il modello riteneva più probabili quel giorno; "Mostra altre specie" apre l'elenco completo. Se non hai trovato niente vai avanti.
5. **Vuoi aggiungere una nota?** Facoltativa: esposizione, tipo di bosco, stato del terreno. Poi **Salva uscita**.

Al salvataggio l'app memorizza anche l'indice che prevedeva per ogni specie quel giorno, alla quota che hai indicato (o alla migliore della zona). Per farlo deve avere i dati meteo di quel giorno: registra le uscite entro circa un mese, altrimenti la voce viene salvata senza previsione e compare come "fuori dal periodo meteo".

### Leggere il confronto

In cima al diario c'è il riepilogo: quante uscite, quante volte il modello ci ha preso, quante volte ha promesso troppo (ottimista) e quante è stato troppo pessimista. Ogni voce ha la sua etichetta:

- **previsione giusta**: il modello diceva di andare (indice massimo previsto almeno 30) e hai trovato qualcosa, oppure diceva di no e non hai trovato niente;
- **previsione ottimista**: diceva di andare e non hai trovato niente;
- **previsione pessimista**: diceva di no e hai trovato qualcosa.

Il confronto è volutamente semplice: considera la specie con l'indice più alto e il fatto di aver trovato qualcosa, qualunque cosa. I dati per singola specie restano comunque salvati e servono per una taratura più fine.

Per eliminare una voce tocca **Elimina** e poi di nuovo entro quattro secondi.

### Esporta e importa

- **Esporta** scarica un file `diario-funghi-AAAA-MM-GG.json` con tutte le uscite.
- **Importa** legge un file esportato e aggiunge le uscite che non ci sono già (riconosciute dal loro identificativo), senza sovrascrivere quelle esistenti.

Sul sito il diario vive solo nel browser che usi: esportalo ogni tanto, e usa l'esportazione per spostarlo su un altro dispositivo.

## Sito e versione Artifact: le differenze

L'app esiste in due forme con lo stesso codice.

| | Sito (GitHub Pages o Cloudflare Pages) | Artifact su claude.ai |
|---|---|---|
| **Meteo** | Scaricato in diretta da Open-Meteo all'apertura, tenuto in memoria per un'ora. Il pulsante **Aggiorna meteo** forza un nuovo download. In alto: "Meteo delle HH:MM". | Una fotografia del meteo incorporata nella pagina al momento della pubblicazione. Una routine programmata la rigenera e ripubblica ogni mattina alle 6:52. Non c'è il pulsante di aggiornamento; in alto: "Meteo del <giorno, ora>". |
| **Dati non aggiornati** | Non succede, salvo errori di rete. | Se la fotografia non copre più la data di oggi (per esempio la routine non è girata) compare un avviso: l'indice si riferisce al giorno di pubblicazione. |
| **Mappa** | Tile online OpenTopoMap o OpenStreetMap, Carta Forestale dal servizio WMS della Regione, zoom libero. | Base topografica e Carta Forestale incorporate come immagini, area fissa intorno alle zone, zoom da 9 a 14. |
| **Diario** | Nel browser (memoria locale). Va esportato per non perderlo. | Nel database privato della pagina, legato al tuo account: lo ritrovi da qualsiasi dispositivo, e Claude può leggerlo per proporre una taratura. |
| **Esporta** | Download diretto del file. | Il browser ti chiede conferma per salvare il file. |

In entrambe le versioni, se la libreria della mappa non si carica, compare una mappa schematica con le zone e gli anelli di distanza da Rieti.

## Sicurezza e regole

L'app è uno strumento di pianificazione, **non di identificazione**. Nessun fungo va consumato senza certezza assoluta.

### Le regole nel Lazio

La raccolta è regolata dalla L.R. Lazio 5 agosto 1998, n. 32 e dalle sue modifiche. I punti principali:

| Regola | Contenuto | Verifica |
|---|---|---|
| Titolo | Attestato di un corso di formazione micologica di almeno 14 ore (dal 2020, L.R. 1/2020, sostituisce il tesserino; chi ha il vecchio tesserino può continuare a usarlo). | Confermato sul sito della Regione Lazio (pagina aggiornata l'8 ottobre 2026) |
| Contributo annuale | 25 € residenti nel Lazio, 40 € non residenti, valido un anno dal versamento. Causale "L.R. n. 32/98 - raccolta funghi anno...". | Confermato (Regione Lazio, AMER 2025) |
| Esenzione | Residenti nel Lazio con più di 65 anni non pagano il contributo; attestato e documento restano obbligatori. | Confermato (Regione Lazio) |
| Documenti da portare | Attestato (o tesserino), ricevuta del versamento, documento d'identità. | Confermato (AMER 2025) |
| Giorni | Tutti i giorni della settimana: l'art. 21 della L.R. 20/2024 ha abrogato il limite dei quattro giorni. | Confermato (Regione Lazio) |
| Orari | Vietata la raccolta da un'ora dopo il tramonto a un'ora prima dell'alba. | Confermato (AMER 2025, art. 9 L.R. 32/98) |
| Quantità | 3 kg a persona al giorno, salvo un unico esemplare o un unico cespo concresciuto. | Confermato (AMER 2025) |
| Contenitori e attrezzi | Contenitori rigidi e aerati; vietati rastrelli, uncini e mezzi che danneggiano humus e micelio; vietato distruggere funghi, anche non commestibili. | Confermato (AMER 2025) |
| Pulizia | Pulizia sommaria sul posto, conservando i caratteri utili al riconoscimento. | Confermato (AMER 2025) |
| Taglie minime del cappello | 4 cm: porcini (gruppo *B. edulis*), ovolo buono, verdone (*Russula virescens*), agarico geotropo, prataiolo. 5 cm: mazza di tamburo. 3 cm: tutte le altre. | Confermato (AMER 2025). Il documento di partenza e l'interfaccia non citano il verdone, l'agarico geotropo e il prataiolo a 4 cm. |
| Dove è vietato | Entro 10 m dal margine delle strade pubbliche; terreni di pertinenza di abitazioni per almeno 100 m; giardini e parchi privati; verde pubblico urbano; ex discariche e aree industriali; riserve integrali. | Confermato (AMER 2025) |
| Minori e accompagnati | Sotto i 14 anni solo accompagnati da chi ha i titoli. Chi non ha l'attestato può avere fino a cinque autorizzazioni giornaliere gratuite all'anno, solo se accompagnato. | Riportato sul sito della Regione Lazio |

### Aree protette

- **Riserva Monte Navegna e Monte Cervia** (nel Cicolano) e **Riserva Montagne della Duchessa**: per Navegna-Cervia la legge istitutiva consente la raccolta secondo la L.R. 32/98 finché la riserva non ha un regolamento; per la Duchessa vale il piano della riserva (DCR 16/2021). In ogni riserva integrale la raccolta è vietata. Verifica sempre con l'ente gestore. Dettagli in `docs/legale.md`.
- **Parco Nazionale del Gran Sasso e Monti della Laga** (zona Laga): valgono le regole dell'Ente Parco, che possono limitare zone, periodi e chi può raccogliere. Controllale prima di uscire.

Questi due punti vengono dal documento di partenza e da AMER (che conferma il principio generale: in un parco si legge prima il suo regolamento). Non ho verificato i singoli regolamenti delle riserve e del parco.

### Il controllo dell'ASL

L'**Ispettorato Micologico della ASL di Rieti** (Servizio Igiene degli Alimenti e della Nutrizione, Dipartimento di Prevenzione) controlla gratuitamente i funghi raccolti e rilascia la certificazione di commestibilità. Porta i funghi interi, con la base del gambo, puliti solo sommariamente, freschi e non bagnati.

Un comunicato della ASL del 2018 indicava la sede di via del Terminillo 42 a Rieti, dal lunedì al venerdì dalle 8 alle 9:30, e un punto ad Antrodoco il lunedì. Sono informazioni vecchie: verifica sede e orari sul sito della ASL prima di andare.

Le app di riconoscimento fotografico non hanno valore diagnostico. Lo ricorda anche il Ministero della Salute in una nota dell'ottobre 2025.

### Fonti delle regole

- Regione Lazio, *Funghi* (pagina aggiornata l'8 ottobre 2026). https://regione.lazio.it/cittadini/agricoltura/Funghi
- AMER (2025). *Raccolta funghi nel Lazio: le regole in vigore nel 2025*. https://www.ameronlus.it/blog/2025/01/14/raccolta-funghi-nel-lazio-le-regole-in-vigore/
- ASL Rieti, comunicato del 30 agosto 2018 sul servizio gratuito di certificazione dei funghi.
- Ministero della Salute, *Ispettorati micologici*. https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/ispettorati-micologici/

La norma cambia: prima della stagione controlla il testo vigente sul sito del Consiglio regionale del Lazio.
