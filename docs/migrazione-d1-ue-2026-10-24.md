# Database della community nell'Unione europea · 24/10/2026

Decisione di Matteo del 24/10/2026: spostare i dati personali della community in un database D1 con giurisdizione UE.

## Situazione di partenza [Fatto, API Cloudflare, 24/10/2026]

| Database | Contenuto | Dove gira | Giurisdizione |
|---|---|---|---|
| `fungaroli-community` | profili, passkey, sessioni, taccuino, foto, base di partenza, conferme degli avvisi, questionario, osservazioni esterne | ENAM, Nord America orientale | nessuna |
| `fungaroli-content` | contenuti CMS pubblici | WNAM, Nord America occidentale | nessuna |

L'informativa lo dichiarava già: il database non era legato all'Europa e i trasferimenti verso gli Stati Uniti si basavano sul Data Privacy Framework UE-USA.

## Cosa cambia

- Nuovo database `fungaroli-community-eu`, con giurisdizione `eu` (regione EEUR) e replica di lettura disattivata.
- `wrangler.jsonc`: il binding `COMMUNITY_DB` punta a `fungaroli-community-eu`. Il codice non cambia.
- `fungaroli-content` resta dov'è: contiene solo contenuti pubblici. Si potrà spostare insieme agli ambienti di test.

## Prova generale del 24/10/2026

La copia è stata eseguita con l'API di Cloudflare, dal database di origine a quello UE:

1. tabelle, nell'ordine delle chiavi esterne;
2. dati;
3. indici e trigger.

Agli agenti sono arrivati solo conteggi e impronte, mai i contenuti.

Esito:
- 23 tabelle, 9 indici, 1 trigger;
- 435 righe;
- per ogni tabella, stesso numero di righe e stessa impronta (somma delle lunghezze dei valori `quote()` di tutte le colonne);
- `PRAGMA foreign_key_check` senza violazioni.

## Procedura del passaggio

Fuori dalle finestre dei cron: 03:17 UTC e ogni 5 minuti fra le 04:00 e le 05:59 UTC.

1. **Confronto prima del merge.** Righe e impronte di ogni tabella, origine contro UE.
   - Se qualcosa differisce, il database UE va cancellato, ricreato con giurisdizione `eu` e ricopiato con la stessa procedura.
2. **Merge della PR** nel ramo di produzione. Workers Builds pubblica il Worker con il nuovo binding.
3. **Verifica della produzione:**
   - `/api/community/status` risponde 200;
   - accesso con passkey, lettura e salvataggio di una nota di prova, poi cancellata;
   - controllo che `fungaroli-community-eu` riceva la scrittura.
4. **Confronto dopo il merge.** Righe e impronte del database di origine contro quelle registrate al punto 1.
   - Se l'origine è cambiata fra la copia e la pubblicazione, le righe nuove si copiano nel database UE con la stessa procedura, solo per le tabelle interessate.
5. **Informativa.** È una decisione a parte di Matteo, perché un testo nuovo cambia l'impronta dell'avviso. Con il nuovo database la frase «il database non è vincolato a una collocazione europea» non è più vera per i dati della community: va aggiornata.

## Esito del passaggio (24/10/2026)

- 08:20 UTC: confronto prima del merge, righe e impronte identiche in tutte le 23 tabelle. Merge di #245.
- 08:21:28 UTC: Workers Builds pubblica il Worker. L'API Cloudflare conferma `COMMUNITY_DB → fungaroli-community-eu`.
- Produzione: `/api/community/status` risponde `enabled: true`.
- Confronto dopo il merge:
  - il database di origine è identico alla copia, quindi nessuna scrittura è andata persa nel passaggio;
  - il database UE ha una riga in più in `rate_limits`, scritta dal Worker dopo il passaggio.
- La prova con passkey e nota non è stata fatta da un agente, perché richiede il dispositivo di Matteo. La scrittura in `rate_limits` mostra comunque che il Worker scrive nel database UE.
- Informativa aggiornata nella versione editoriale 10 di `data/legal.json` (vedi `docs/legale.md`, §6.8).

## Ritorno indietro

- Fino alla cancellazione del vecchio database basta ripristinare `"database_name": "fungaroli-community"` in `wrangler.jsonc` e pubblicare.
- Le scritture fatte nel frattempo sul database UE vanno ricopiate all'indietro, con la stessa procedura.

## Dopo

- Il vecchio `fungaroli-community` resta come copia di sicurezza per 30 giorni, fino al 23/11/2026.
- Poi si cancella, su decisione di Matteo. Si potrà recuperare entro i termini di D1 per i database eliminati, e con Time Travel se serve un punto preciso.
- Il namespace KV `DIARIO` contiene ancora il vecchio diario dismesso. Va esportato e cancellato a parte: vedi `AGENTS.md` e `docs/community.md`.
