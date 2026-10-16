# Verifica della ricerca e del prototipo Fronda

16 ottobre 2026. Base esaminata `68e2b1c`; ramo `codex/fronda-modello-micologico-v3`.

- 46 test Python superati: finestre e calendario, mancanze, causalità degli input,
  split e calibrazione, sforzo pianificato, ricerche incomplete, nuovo sito senza
  storico, astensione fuori dominio e serializzazione JSON.
- 196 test dell'app superati; installazione con cache temporanea scrivibile.
- `wrangler deploy --dry-run` superato, usando una cartella di configurazione
  temporanea scrivibile. Nessun deploy o cambiamento a servizi esterni.
- Notebook eseguito dall'inizio alla fine: quattro celle di codice, due grafici,
  nessun errore e nessun output di warning conservato. Render HTML ispezionato
  a 1280 px; assenza di overflow orizzontale, figure e tabella leggibili.
- Fonte meteo reale con checksum e attribuzione: 82 righe, valori mancanti preservati,
  19 covariate su 31 calcolabili per il bersaglio dichiarato. Nessuna prestazione
  micologica stimata da questi dati meteorologici.
- Audit indipendente del nucleo di learning: corretto un ampliamento del dominio
  delle sorgenti meteo attraverso dati di test; ora deriva soltanto dal training.
- Nessuna modifica a interfaccia, CMS o service worker. I file sono in `tools/`,
  escluso dagli asset pubblicati; non è richiesta una suite browser dell'app per
  questo cambiamento. Il notebook è stato comunque verificato nel browser locale.

Non è stato addestrato un modello nazionale italiano con esiti sul campo.
Le fixture dei test software non sono dati scientifici e non sono distribuite
come un artefatto fitted utilizzabile per previsioni reali. Gli intervalli per
cluster e la verifica prospettica richiedono dati osservati idonei.
