# Dashboard di amministrazione · 18 ottobre 2026

Dal 20 ottobre la stessa Dashboard comprende anche il registro modificabile delle segnalazioni esterne, separato dai contributi volontari. Schema, fonti, API, revisione ed evidenze per il motore: [Registro delle segnalazioni esterne](registro-segnalazioni-esterne-2026-10-20.md).

La redazione `/redazione` apre la Dashboard per gli amministratori; gli editor mantengono l’editor Contenuti. Il cambio di sezione conserva il documento e le bozze locali aperte. La dashboard usa le sessioni e i ruoli già verificati dal server, non introduce credenziali o binding.

## Cosa influenza oggi i consigli

| Raccolta | Uso attuale | Controllo |
|---|---|---|
| Questionari degli esperti | Nessun collegamento automatico al modello | Numero risposte, ultima data, esportazioni e ricerca per ricevuta già presenti |
| Segnalazioni fungine (`reports`) | Moltiplicatore dell’ordine delle uscite, separato dall’indice biologico | Limite amministrativo intero fra 0 e 10%, motivo obbligatorio, storico |
| Altre annotazioni condivise (`shared_observations`, anche fungine) | Conteggi informativi | Copertura per zona, categoria e taxon, senza testo privato |

Il tetto del 10% è quello già implementato in `js/community-signal.js`: è una scelta prudenziale sperimentale, non una soglia biologica validata. La dashboard consente soltanto di ridurlo o ripristinarlo, non amplia l’influenza né introduce nuovi coefficienti. Le soglie restano almeno 3 contributori con account creato da oltre un giorno, almeno 2 giorni distinti nella finestra corrente di 7 giorni. Il segnale cresce fino a 10 contributori. Fra taxa conta il segnale di maggiore valore assoluto: non si sommano bonus. Non si cambia il calcolo dell’indice biologico.

Le percentuali accanto alle coppie zona/specie sono il contributo calcolato per quella coppia, non la variazione finale di posizione. Filtri e segnale più forte possono cambiare l’effetto sulla specifica uscita. Le presenze sono dichiarate, non certificate.

La dashboard mostra conteggi totali delle righe ancora condivise e dettaglio aggregato negli ultimi 7 giorni. Non legge `diary_entries.payload`, `shared_observations.payload`, nomi o contatti dei partecipanti. Le etichette di zona e taxon arrivano dai contenuti pubblicati del CMS; se assenti resta l’ID. Una stessa nota può produrre più segnalazioni: i totali dei due flussi non sono un numero di persone o di uscite uniche.

## Salvataggio e applicazione

`GET /api/cms/v1/dashboard`: solo amministratori, `no-store`, conteggi, copertura, politica corrente e ultime 20 modifiche.

`PATCH /api/cms/v1/dashboard`: solo amministratori, controllo origine esistente. Corpo JSON esatto:

```json
{"version":0,"maxPercent":4,"reason":"Riduzione prudente durante la verifica dei dati"}
```

La migrazione `0008_ranking_policy.sql` è inizializzata automaticamente e idempotente in `COMMUNITY_DB`. Politica e audit vengono scritti nella stessa transazione D1, con confronto della versione e nonce per attribuire l’audit soltanto alla scrittura riuscita. Un conflitto restituisce 412 e non sovrascrive: aggiornare la dashboard e riesaminare la modifica. Per ripristinare, salvare il valore precedente con nuovo motivo. Storico con autore, data, prima/dopo; non cancellabile dalla UI.

Il riepilogo pubblico `/api/community/summary` espone solo `policy.maxPercent` e `policy.version`, mai autore o motivo amministrativo. L’app usa il tetto salvato; i client aggiornati ricevono il limite al prossimo refresh della community (normalmente ogni 2 minuti quando visibili). Senza riepilogo valido il segnale è neutro, come prima. Le vecchie versioni dell’app già aperte non comprendono il nuovo campo: devono aggiornarsi alla shell v185 per applicarlo. Non è un interruttore istantaneo per client offline o obsoleti. Il valore iniziale 10 preserva il comportamento attuale.

Nessun dato reale viene modificato durante i test; si usano SQLite in memoria e D1 locale isolato.

## Taratura da questionari: passo successivo

Prima di aggiungere un peso serve una specifica che distingua calendario, habitat, quota e racconti delle buttate; controlli campioni piccoli, discordanze, duplicati e sforzo di ricerca; confronti versioni del modello su un insieme indipendente. La dashboard non traduce automaticamente dichiarazioni in evidenza scientifica. Non esiste ancora una funzione di approvazione/moderazione delle singole annotazioni o di taratura dai questionari: non viene simulata con controlli senza effetto.

## Verifiche

Test API con SQLite: ruoli e origine, valori fuori intervallo, campi aggiuntivi rifiutati, conflitti, storico atomico, ripristino, propagazione pubblica e assenza dei dati privati. Browser: 320/390/1280, salvataggio e lettura reali sul Worker locale, anteprima, consultazione questionari, ritorno ai contenuti, errori/riprova. Il controllo non costituisce validazione scientifica del modello.
