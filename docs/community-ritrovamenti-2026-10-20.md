# Dati dal bosco: condivisione reciproca e stima secondaria

Decisione di Matteo del 20 ottobre 2026: raccogliere osservazioni reali, anche ricerche a vuoto, senza rivelare le fungaie. Chi condivide può consultare i dati collettivi. Conservare l’indice come stima sperimentale secondaria, chiarendo che può non corrispondere alla situazione reale.

## Comportamento

- Il taccuino resta privato agli altri utenti. La condivisione si sceglie per ciascuna voce, separatamente dalla conferma iniziale delle condizioni.
- `/api/community/summary` richiede una sessione valida. Senza almeno un report o un’osservazione strutturata condivisa attiva restituisce solo lo stato `contribution_required`, senza conteggi. Un contributo negativo vale quanto uno positivo. Non è richiesta una condivisione recente: una voce ancora condivisa concede accesso finché non viene ritirata. Il resto dell’app resta utilizzabile senza contribuire.
- Il controllo avviene sul server a ogni richiesta. Ritirare tutte le condivisioni revoca l’accesso alle successive letture. Logout/cambio profilo svuotano lo stato client; le risposte obsolete non possono ripristinare i dati dopo un cambio account. API e service worker non conservano questi aggregati in cache.
- Aggregati per zona del catalogo e specie, su 7 giorni. Le zone attuali hanno raggio di riferimento 1,5–5 km: non sono punti di ritrovamento. Nessun GPS, sentiero, autore, identificativo della nota, testo libero o giorno preciso viene proiettato nell’API collettiva. I dati originali restano associati al profilo sul server per gestione e revoca.
- Pubblicazione solo con almeno 3 contributori distinti e 2 giorni diversi, per ciascun gruppo. Si riusa la guardia già presente in `js/community-signal.js`, estendendola dalla sola influenza sull’ordine alla pubblicazione. È una scelta di minimizzazione del prototipo, NON una soglia scientifica o garanzia di anonimato. Il requisito di anzianità dell’account resta nella preesistente influenza sull’ordine, non nella pubblicazione. **Superato il 22/10/2026** (decisione di Matteo): alla soglia di pubblicazione, per zona e per provincia, contano solo i profili attivi da almeno 24 ore, e l’uscita pubblica non riporta più `contributors` e `days` (vedi [community.md](community.md)).
- Il totale restituito somma solo i gruppi pubblicabili della finestra, non rivela più il numero storico completo o gruppi soppressi. Non viene restituito l’ultimo giorno di osservazione. Nessun dato/numero insufficiente non significa assenza di funghi.
- Ritrovamenti e ricerche a vuoto restano entrambi visibili. Uno zero richiede una ricerca dichiarata esplicitamente; nessuna segnalazione non diventa uno zero. Le note strutturate restano una serie separata dai report delle uscite: potrebbero descrivere la stessa uscita e non sono presentate come campioni indipendenti.
- La sezione compatta «Dati dal bosco» precede la proposta principale. Il calendario mostra data e meteo, senza indice. Le card e la scheda luogo conservano una piccola «Stima non validata», senza gli anelli di merito; rimossa la duplicazione numerica accanto alla specie principale. Il popover spiega esplicitamente il limite.
- Formula biologica e ordinamento preesistenti non sono stati ritarati: la revisione declassa la presentazione, non pretende di aver validato o migliorato il modello. Le osservazioni non sono un campione rappresentativo. La taratura necessita un protocollo e dati prospettici; non basta contare post o ritrovamenti.
- Avviso minimo versione 6 e fingerprint aggiornato, compreso con snapshot CMS precedenti. Resta una sola conferma per condizioni/privacy/cookie; condividere resta facoltativo e distinto.

## Limiti da tenere presenti

La soppressione dei piccoli gruppi non impedisce ogni deduzione da informazioni esterne, confronti nel tempo o account collusivi. Non viene promessa anonimizzazione assoluta. Revocare l’accesso non può cancellare schermate o copie già ottenute da altri. L’accesso è reciproco, non una verifica della veridicità del contributo. Per diffusione ampia andranno valutati pubblicazione a finestre fisse, ulteriore generalizzazione e controlli antiabuso.

## Facebook: raccolta ancora da effettuare

Matteo ha autorizzato la consultazione nel proprio browser dei gruppi di ritrovamento funghi di Rieti e Lazio. In questa chat manca lo strumento per controllare quel browser; è stata richiesta la connessione. Nessun gruppo o post è stato letto e nessun dato Facebook è stato inserito.

Quando il browser sarà disponibile, conservare soltanto fonte, data dell’osservazione (distinta da quella del post), zona ampia, specie dichiarata, esito positivo/ricerca esplicitamente a vuoto e incertezze. Niente nomi, screenshot identificativi o coordinate. Un post senza ritrovamenti non prova una ricerca a vuoto. Deduplicare repost ed evitare di trattare il silenzio del gruppo come assenza. Mantenere il campione esterno separato dai contributi Fronda e dalla taratura automatica; l’accessibilità di un gruppo non conferisce automaticamente diritti di ripubblicazione.

## Verifica

Controlli mirati di sintassi JavaScript, diff e compilazione delle query della nuova proiezione su schema SQLite locale. Nessuna suite unitaria/browser, nessun dry-run o consultazione della D1 di produzione. Versione shell v244. La verifica sul dispositivo iOS e la raccolta Facebook restano da effettuare.

## Aggiornamento del 22/10/2026: partenza della reciprocità

Decisioni di Matteo del 22/10, per evitare che chi condivide per primo veda solo «dati insufficienti».

- **Confronto personale nel Taccuino.** Per ogni uscita con la previsione salvata prima di partire, la pagina
  dell'uscita mostra il valore dell'indice di quel giorno e l'esito dichiarato («cercato, zero» o «trovato ·
  Discreti»). Il Taccuino mostra in testa «Le tue uscite e l'indice» con gli ultimi confronti. **Nessun verdetto**:
  tolti «concordante», «indice alto, zero osservato» e «trovata con indice basso», perché dipendevano dalla soglia
  esplorativa 3,0 (`FOUND_THRESHOLD`), mai tarata. Le funzioni `agreement` e `summary` restano per le analisi.
- **Aggregato per provincia.** `/api/community/summary` restituisce anche `provinceReports` e
  `provinceObservations`: provincia, taxon e totali (segnalazioni, ritrovamenti, zeri) negli stessi 7 giorni, con la
  stessa guardia (3 contributori distinti, 2 giorni diversi). **Protezione per sottrazione:** un gruppo di provincia
  si pubblica solo se anche la parte non già pubblicata per zona supera la guardia; altrimenti «provincia meno zone
  mostrate» rivelerebbe un gruppo piccolo. Le zone senza provincia nei dati contano come Reatino, come nell'app.
  Codice e prove: `js/community-aggregate.js`, `tests/community-aggregate.test.mjs`. Gli aggregati di provincia **non**
  entrano nell'ordine delle uscite (`communityRank` usa solo i gruppi per zona) e nel badge della card si leggono come
  «In provincia: …», mai come dato della zona.
- **Gruppo pilota.** Solo inviti e guida, senza codice: [pilota-esperti.md](pilota-esperti.md).

Limite che resta: la soppressione dei piccoli gruppi riduce le deduzioni, non le esclude (confronti fra finestre di
giorni diversi, account collusivi). Non è una garanzia di anonimato.
