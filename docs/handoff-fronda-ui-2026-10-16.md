# Fronda · template reali

Direzione approvata: [Più luce, più vita](https://www.figma.com/design/FCjz72xhVX39GdpJI5v0JN/Fronda?node-id=61-2062). Il manuale resta un riferimento per identità e geometria del marchio.

## Template

- Uscite: foto luminosa e pannello polline, condiviso da interessi combinabili; titolo e azione crescono con il contenuto. Alternative con dati sintetici su superficie neutra.
- Dettaglio uscita: testata comune anche per piante e sentieri; meteo e funghi compatti, soltanto quando disponibili. Il meteo mostra la massima della mattina e il range minimo/massimo. L’anello termico usa un asse grafico −10…40 °C; gli estremi esterni sono limitati solo nel disegno, senza cambiare i dati. L’indice conserva scala e classi esistenti.
- Calendario: bersagli da almeno 80 × 132 px, giorni completi, Domani distinto da Domenica, nessuna spunta. Icona fungo piena e riga meteo legata alla proposta del giorno; la settimana non ha un meteo unico.
- Scopri: invito editoriale blu con foto e collegamento ai crediti; caratteri e avvisi scientifici conservati. Durante il giro usa fotografie reali e mantiene la compatibilità come ipotesi.
- Guide: campiture vive con testo bosco, intestazioni ripetute rimosse.
- Taccuino: invito arancio, compatto quando ci sono pagine; stato vuoto senza azione duplicata. Appunti, riferimenti, fasi e condivisione privata conservati.
- Riconoscimento, sfide, sentieri e mappe: superfici e gerarchie condivise, senza nuovi punteggi botanici o riscritture dei dati.

## Implementazione

Ruoli cromatici in css/tokens.css, componenti in css/fronda.css. Tabler Icons (MIT) per meteo e fungo pieno; licenza in assets/tabler-LICENSE.txt. Shell v100 e precache aggiornati insieme. La home sposta le righe scorrevoli insieme ai loro contenitori, evitando frecce orfane.

Fonti: dataset e contenuti CMS correnti; nessuna nuova foto o dato scientifico. Le immagini editoriali provengono dal catalogo esistente e rimandano ai crediti della specie. Nuove frasi di interfaccia nei template; nessuna modifica ai record pubblicati del CMS.

## Verifiche

221 test unitari, dry-run Wrangler e guardia token (55 coppie AA/grafiche) verdi. Audit dei cinque template aggiornati, light/dark e 320/390/1280 px: 6996 misure, 0 sotto soglia, 0 errori. Report completo locale: /tmp/fronda-vivid-audit/real-templates/report.json. Questo è un audit dei template modificati, non una certificazione di accessibilità dell’intera app.

Test browser specifici: contenuti lunghi, hover/focus, contrasto del contorno, temperatura negativa centrata sui numeri, meteo solo e assenza di entrambi gli indicatori, cambio giorno senza ricreare foto/anello né spostare la lettura. I selettori dei test precedenti seguono il nuovo indice compatto e la fascia condivisa; lo scroll viene confrontato dalla posizione di lettura del calendario.

Suite completa eseguita: 162 casi, 146 superati al primo giro. I 16 casi con asserzioni legate alla UI precedente sono stati riallineati: etichetta Funghi (prima A funghi), pannelli pieni al posto del testo sulla foto, intestazione unica degli approfondimenti e separazione dell’anello meteo da quello fungino. Il controllo finale mirato dei template è verde (14/14); anche la suite dei pannelli mappa è verde (9/9). Tutti i casi inizialmente falliti sono risolti nei rerun mirati: 23/23 controlli finali verdi.

Gli anelli usano un fondo bosco all’88% e blur interno; con riduzione della trasparenza sia i dischi sia la fascia usano fondo pieno. Il segnaposto delle alternative resta visibile anche se una foto fallisce, senza variazioni di altezza.

### Verifica di rilascio del 17 ottobre

Il controllo della home Piante ha evidenziato due problemi degli strumenti di verifica: l’audit campionava le frecce sovrapposte alle card parzialmente visibili e il confronto dell’ordine delle sezioni dipendeva dal momento in cui veniva creato il contenitore delle righe scorrevoli. L’audit ora centra ogni card con scorrimento istantaneo; il confronto considera le sezioni anche dentro quel contenitore. Soglie di contrasto e verifiche dell’ordine restano invariate. Nessuna modifica al codice dell’app per queste correzioni.
