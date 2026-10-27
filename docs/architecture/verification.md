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
| Suite browser locale dell’app | Avvio impedito da `spawn EBADF`; verifica mirata completata su GitHub |
| CI principale della PR | [Superata sul codice iniziale](https://github.com/zatteogit/fungaroli/actions/runs/40575478305) |
| Taccuino su GitHub, primo passaggio | [11 scenari superati, 2 aspettative dei test da riallineare](https://github.com/zatteogit/fungaroli/actions/runs/40575502684) |
| Taccuino su GitHub, passaggio finale | [Tutti i 13 scenari superati](https://github.com/zatteogit/fungaroli/actions/runs/40585047003), con ambiente isolato, foto private e sincronizzazione |
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
Il secondo passaggio remoto sul commit `dc10f84c` ha superato tutti i 13 scenari. Anche i test
unitari, i controlli del design e i quattro dry-run dello stesso passaggio sono superati.
Il collaudo mirato è quindi completato su GitHub; il limite del runtime locale resta documentato.
Non è stata eseguita l’intera suite browser del repository, facoltativa secondo AGENTS.

## Prima di integrare

Controllare la CI del commit candidato e ottenere la decisione di integrazione. Se cambia altro
codice, ripetere le verifiche pertinenti; i 13 scenari mirati risultano già completati. Non pubblicare
gli ambienti online da questi file locali e non considerare attive le funzioni previste dei profili.

## Rami predisposti

`codex/fronda-foundation`, `codex/fronda-consumer`, `codex/fronda-academy`,
`codex/fronda-territory` e `codex/fronda-partners` sono creati localmente e su GitHub.
I rami delle offerte sono allineati alla stessa fondazione, incluse le correzioni dei test.
La proposta di integrazione rimane in [PR #298 in bozza](https://github.com/zatteogit/fungaroli/pull/298).
