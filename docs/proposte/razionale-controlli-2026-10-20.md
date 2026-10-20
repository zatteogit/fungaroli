# Controlli Fronda: ruoli, gerarchia e temi

Stato: direzione approvata da Matteo con «ok proviamo» il 20 ottobre 2026. Prima applicazione nella versione 297: Annota globale, strumenti del catalogo, selezioni condivise e navigazione. Le sezioni di analisi sottostanti descrivono il punto di partenza, prima dell’intervento. Esempi interattivi: [linguaggio-controlli.html](linguaggio-controlli.html).

## Il problema osservato

La palette non richiede una sostituzione. Il problema è che il medesimo giallo pieno segnala un’azione da compiere, una sezione corrente e una scelta persistente. Inoltre alcune azioni hanno acquisito stili locali senza una gerarchia dichiarata.

Evidenze attuali:

- `css/tokens.css`: `--action` e `--select` puntano entrambi al polline. Il tema dark modifica testo, fondi, bordi e focus, ma conserva il polline per entrambe le funzioni.
- `css/fronda.css`: tab, giorni e numerosi filtri selezionati sono gialli; alcuni interessi della home usano germoglio, altre preferenze un contorno.
- `index.html` e `css/fronda.css`: «Annota» è un comando nella barra globale, distinto dalle destinazioni; il suo fondo è `--text` e il testo `--bg`, quindi verde scuro su chiaro e avorio su scuro. La posizione separata ha un significato; l’inversione cromatica non rappresenta una gerarchia condivisa con gli altri pulsanti.
- Gli accessi «Impara a riconoscere» e «Confronta» nel catalogo consumano invece `--action` e `--action-ink`, con una classe locale. Sono due strumenti equivalenti; assegnare a entrambi il massimo rilievo rende meno evidente la differenza rispetto a una selezione.
- Anche l’annotazione contestuale è attualmente presentata come `btn ghost` in diverse schede e `btn primary` in quella animale. Occorre assegnare il ruolo per contesto, non per specie o file di provenienza.

Il controllo esistente `tools/ds-guard.mjs --report` è stato eseguito in sola lettura: 131 file censiti, quattro fogli nel perimetro, 106 token pubblici, 95 primitivi usati, 55 coppie di contrasto dichiarate. Le occorrenze di colori letterali non aumentano (283 esadecimali, 154 funzioni colore rispetto a 156). Questo inventario non prova la coerenza dei ruoli o l’accessibilità completa; non verifica che «Annota» e «Confronta» appartengano alla famiglia corretta. Nessuna nuova guardia né baseline modificata in questa proposta.

## Regola proposta

Il colore comunica il rilievo; forma, etichetta e stato comunicano il comportamento. La differenza tra link e bottone resta anche semantica nel markup, non viene affidata al colore.

| Ruolo | Aspetto | Esempio |
| --- | --- | --- |
| Azione principale nel contesto | Polline pieno, testo bosco notte, icona pertinente facoltativa | Annota; Salva nel compositore; Avvia confronto quando le specie sono scelte |
| Azione o accesso secondario | Fondo neutro/trasparente, bordo leggibile, testo ad alto contrasto; stessa forma del primario | Confronta e Impara a riconoscere nell’indice del catalogo |
| Scelta persistente | Fondo verde tenue, bordo marcato e spunta; chip nel gruppo | Interesse Funghi, Piante o Sentieri |
| Posizione corrente | Indicatore persistente nel gruppo di navigazione, testo e fondo tenue | Sezione Funghi; tab attiva |
| Approfondimento | Link testuale esplicito e sottolineato | Dimmi di più |
| Rischio e stato del sistema | Ruoli di rischio/stato esistenti con testo e simbolo | Temporali, errore, avvertenza; non gerarchia delle CTA |

Non esiste una categoria visiva «qualsiasi cosa cliccabile = giallo». Un accesso a una funzionalità può essere secondario ed essere comunque chiaramente un pulsante grazie a contorno, etichetta e interazione. Una scelta selezionata è uno stato, non un invito da completare.

### Annota rispetto a Confronta

«Annota» nella barra è un comando globale di creazione e può avere il rilievo principale. Non va confuso con una quinta destinazione della barra e non deve avere uno stato di navigazione selezionato. Una geometria dedicata alla posizione globale è ammissibile, purché consumi i colori della famiglia primaria.

«Confronta» nell’indice è un accesso a uno strumento, equivalente a «Impara a riconoscere»: stessa famiglia secondaria, stessa altezza, stesso raggio. Nel percorso di confronto l’azione conclusiva che avvia il confronto può essere primaria. Il ruolo segue il passo dell’utente; non è fissato una volta per tutte dalla parola «Confronta».

Se l’annotazione è un accessorio nella scheda di una specie, è secondaria. Se l’interfaccia invita principalmente a registrare un ritrovamento, è primaria. Stesso criterio per tutte le specie.

### Light e dark

- Light: avorio/carta per il contesto; verde bosco per testo, contorni e indicatori; polline per la priorità d’azione.
- Dark: bosco notte per il contesto; avorio e verde chiaro per testo e contorni; polline con testo bosco notte per la stessa priorità d’azione.
- Non invertire arbitrariamente il significato: un primario giallo in light rimane giallo in dark; una selezione non diventa un primario nel cambio tema.
- Il focus da tastiera è un contorno distinto dallo stato selezionato, con distanza dal componente. Il giallo del focus su dark è un’indicazione transitoria d’interazione, non una selezione persistente.
- Il contrasto di testo, contorno e indicatore va verificato per entrambe le modalità; non basta invertire i valori. Il prototipo usa i ruoli esistenti, non introduce nuovi pigmenti.

### Forma e interazione

- Famiglia di azioni: stessa altezza minima di 44 px, raggio e tipografia per primario e secondario. Nei campioni raggio 12 px, icona a sinistra con etichetta, senza freccia decorativa aggiunta.
- Chip selezionabili: forma a capsula e spunta quando attivi, dentro il gruppo; non imitano il bottone primario isolato.
- Navigazione: stato corrente appartenente al gruppo, con indicatore; non una fila di CTA.
- Hover: risponde il controllo effettivo, senza evidenziatore su tutta una riga che contiene già un pulsante. Focus visibile anche senza mouse.
- Stato disabilitato: neutro e non azionabile; un comando in attesa mantiene il contesto e dichiara l’attesa. Questi casi vanno completati nella migrazione, non sono dichiarati implementati dal prototipo.

## Adozione se la direzione viene scelta

1. Allineare la guida di brand e la fonte canonica `docs/fronda/tokens.json`, senza duplicare valori in CSS locale.
2. Distinguere i token di azione, selezione e navigazione nei due temi; scegliere quali componenti esistenti riusare e quali varianti pubbliche servono.
3. Prima applicazione circoscritta: barra globale/Annota, strumenti del catalogo, navigazione Scopri, filtri interessi. Poi azioni contestuali nelle schede, moduli e pannelli.
4. Proteggere i componenti migrati con un controllo circoscritto; verificare varianti/stati reali prima di irrigidire il controllo sul codice storico.
5. Controllare visivamente light/dark e mouse/touch/tastiera, con contrasto e assenza di regressioni per gli stati selezionati.

Il prototipo resta una tavola dimostrativa locale; non dimostra da solo la migrazione dell’intera app. La direzione è approvata per la prima applicazione descritta sopra. Le interazioni sono dimostrative e non scrivono dati dell’account.

## Verifica dei campioni

Prototipo aperto nel browser, filtri e tab azionati in entrambi i temi, nessuna scrittura di account. Alla larghezza 390 px non si rileva scorrimento orizzontale.

Rapporti misurati dai colori effettivamente risolti nel browser (non certificazione dell’intera app):

| Coppia | Light | Dark |
| --- | --- | --- |
| Testo dell’azione primaria / giallo | 10,60 | 10,60 |
| Testo dell’azione secondaria / fondo | 11,63 | 14,15 |
| Bordo dell’azione secondaria / fondo | 5,28 | 7,29 |
| Testo della scelta attiva / fondo tenue | 10,90 | 8,83 |

Immagine di confronto: [Light e dark](linguaggio-controlli-light-dark.png). La tavola utilizza i token e i font locali del progetto; per provarne le interazioni aprire il file HTML dal server locale del progetto.
