# Redazione: verifica del 20 ottobre 2026

## Dati salvati online

- Database D1 `fungaroli-community`: 149 voci, 103 accettate, 39 da verificare, 7 escluse. Ricevuta `research-verified-2026-10-20-v2`: 40 nuove osservazioni.
- 20 proposte Gemini controllate/corrette, storico preservato. Un'intervento umano precedente su una fonte non è stato riscritto.
- 34 fonti con query e punti di ripresa. Il post Facebook citato racconta un ritrovamento in Grecia: escluso dalla ricerca Lazio.
- Verificato il conteggio di 149 voci nella redazione pubblicata, dopo ricaricamento della scheda autenticata. Il nuovo layout non è ancora pubblicato.

## Nuovo spazio di lavoro

Schema di consultazione ispirato alla [revisione dei record di Airtable](https://support.airtable.com/articles/4384405105-airtable-interface-layout-record-review) e alla distinzione tra ricerca e risposte individuali di [Typeform](https://help.typeform.com/hc/en-us/articles/360029253732-Working-with-your-responses), adattato ai token e all'identità Fronda.

Verificate in un browser reale, con Worker originale e SQLite locale tramite adattatore HTTP: panoramica, segnalazioni, fonti, uso nel motore, questionari. Nessun superamento della larghezza della pagina a 320, 390, 768, 1280 px per panoramica, registro, fonti e questionari. I tavoli hanno scorrimento interno. Ispezionata la panoramica desktop e la scheda di compilazione.

Un questionario sintetico è stato inserito **solo nel database locale**: consenso inizialmente non selezionato, salvataggio riuscito, rilettura e presenza nello storico. Nessuna risposta inventata inserita in produzione.

## Verifiche automatiche

- 22 test mirati passati: registro/engine/fonti/agenti, questionario CRUD e privacy, export, controllo revisioni, consensi, pulizia dello storico alle scadenze, contratti della pagina.
- Ultima suite generale: 339 test, 327 passati, stessi 12 errori preesistenti della produzione. Il successivo test della pulizia alle scadenze passa nella suite mirata.
- Dry-run Wrangler riuscito; `git diff --check` riuscito.
- Suite browser completa tentata: il server Wrangler locale fallisce all'avvio con `spawn EBADF`. La verifica tramite adattatore HTTP non equivale a una suite Workerd completa verde.

## Stato della pubblicazione

I dati verificati sono online. La nuova interfaccia e le nuove API dei questionari sono sul ramo `codex/research-admin-workspace`, in attesa della deroga alla regola di pubblicazione di `AGENTS.md` (suite completa verde), oppure della risoluzione dei blocchi di test.
