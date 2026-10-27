# Verifica della fondazione · 27 ottobre 2026

Base: produzione `3fcbc7ec80b62c52dd7ce290168f7573ff9f5f95`. Copia dedicata;
le modifiche presenti negli altri checkout e i file sincronizzati del progetto non sono stati toccati.

| Verifica | Esito |
|---|---|
| Installazione ripetibile `npm ci` | Superata |
| `npm run typecheck` | Superata: app, contratti e nucleo senza DOM |
| `npm test` | **622 test superati**, inclusi 7 nuovi casi della fondazione e sonde negative |
| Architettura | Import, tipi espliciti e nucleo eseguito in un contesto JS privo di API di piattaforma |
| Design corrente | Due temi, 105 primitive consumate, 114 token pubblici, 61 coppie di contrasto; nessuna regressione sul debito legacy |
| Fondazioni nuove | Generazione coerente, livelli, riferimenti, primitive orfane e consumer senza valori visuali locali |
| Studio storico Fronda | `check.mjs` e sonde `guard-test.mjs` superati |
| `npm run build:core` | Moduli ES e dichiarazioni emessi |
| Dry-run local, test, staging, demo | Superati; risorse separate, nessuna pubblicazione |
| Dry-run configurazione produzione | Superato; configurazione produttiva non modificata |
| Demo nel browser Chrome | Caricamento, dati sintetici e selezione Academy verificati; temi chiaro/scuro e nessun overflow a 320/390 px |
| Suite browser dell’app completa | **Non completata**: il runtime locale termina con `spawn EBADF` prima dei test |
| CI principale della PR | [Superata sul codice iniziale](https://github.com/zatteogit/fungaroli/actions/runs/40575478305) |
| Taccuino su GitHub, primo passaggio | [11 scenari superati, 2 aspettative dei test da riallineare](https://github.com/zatteogit/fungaroli/actions/runs/40575502684) |
| `git diff --check` | Superato |

## Limiti osservati

L’avvio del Worker completo è stato riprovato con runtime Node diversi e una porta libera;
il problema locale di creazione del processo workerd persiste. La porta predefinita 8788 era
occupata da un servizio di un altro lavoro: non è stato arrestato. È disponibile e validata
l’alternativa `FRONDA_TEST_PORT=18788`, con origine coerente fra server e browser.
Questa alternativa non viene presentata come correzione dell’errore `EBADF`.
La demo minima è stata eseguita tramite Wrangler locale e browser reale; questo non prova
passkey, CMS, sincronizzazione, notifiche o l’intero prodotto dopo il refactoring.

Il dry-run riporta gli avvisi già presenti di chiavi duplicate `caution`, `checkedOn` e `status`
in `js/content-schema.js`. Non modificati in questa fetta. L’installazione segnala anche cinque
avvisi di dipendenza (uno alto, tre moderati, uno basso); non è stato applicato un aggiornamento
forzato dei pacchetti durante il refactoring.

Non sono stati verificati Safari/WebKit, dispositivi fisici, lettori di schermo, piattaforme
native o accessi remoti. I valori di contrasto controllati staticamente non equivalgono a una
certificazione di accessibilità. Non è stata rieseguita una validazione scientifica dei contenuti.

## Riallineamento delle verifiche browser

Il primo passaggio su GitHub ha avviato correttamente il nuovo ambiente isolato. Undici scenari
sono passati; due si fermavano su aspettative già presenti nella base: accesso al profilo dalla
home, mentre il CSS corrente lo mostra nel Taccuino, e presenza di una copertina meteo in un
controllo dedicato a ricerca/annotazione. Le schermate mostravano invece correttamente lo stato
senza meteo. I test ora usano i comandi del Taccuino e verificano i controlli anche senza previsione.
Non sono stati modificati visibilità del profilo, comportamento del meteo o UI per farli passare.
Il secondo passaggio remoto viene registrato con il relativo esito prima di considerare completato
il collaudo mirato.

## Prima di integrare

Completare le verifiche browser pertinenti in un ambiente dove workerd si avvia correttamente,
controllare la CI del commit candidato e ottenere la decisione di integrazione. Non pubblicare
gli ambienti online da questi file locali e non considerare attive le funzioni previste dei profili.
