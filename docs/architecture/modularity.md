# Architettura modulare e portabilità

## Direzione delle dipendenze

1. **Nucleo**: regole, tipi, validazione di dati sconosciuti e composizione dei moduli.
2. **Casi d’uso**: coordinano regole, identità e persistenza attraverso porte esplicite.
3. **Adattatori**: browser, GPS, IndexedDB, HTTP, passkey, Cloudflare D1/KV e fornitori.
4. **Presentazione**: componenti, schermate, navigazione, contenuti e profili delle offerte.

Gli adattatori dipendono dal nucleo. Il nucleo non importa UI, database, file, rete o framework.
Non aggiungere un’interfaccia generica per ogni funzione: una porta nasce quando viene estratta
una vera operazione con effetti. Identità e autorizzazione restano responsabilità del server.

## Prima fetta implementata

| Responsabilità | Sorgente |
|---|---|
| API pubblica del nucleo | `src/js/core/index.ts` |
| Presenza, quantità e sforzo | `src/js/core/field-record.ts` |
| Tipi delle osservazioni | `src/js/core/field-record-types.ts` |
| Guardie di dati sconosciuti | `src/js/core/guards.ts` |
| Moduli e offerte previste | `src/js/core/modules.ts` |
| Ingresso compatibile dell’app | `src/js/community-observation.ts`, `src/js/data-guards.ts` |

L’estrazione conserva le regole precedenti: sconosciuto diverso da zero, ricerca a vuoto diversa
da assenza accertata, classi di sforzo, durata richiesta nel protocollo v2, identificazione non
revisionata. Il payload pubblico viene ancora costruito esplicitamente fuori dal modello privato.
Non si cambia il modello biologico, il protocollo dati o il consenso alla ricerca.

`tsconfig.core.json` compila con **solo ES2022**, senza tipi DOM, Node o Cloudflare. Un controllo
lessicale degli import, basato sullo scanner della versione TypeScript fissata nel lockfile,
rifiuta dipendenze esterne anche di soli tipi, import dinamici non statici, `any` e disattivazioni
dei controlli. Il test esegue un bundle in un contesto JS privo di API di piattaforma.
Questo è un confine verificato del nucleo, non una certificazione del resto del repository.

## Distribuzione e piattaforme

`npm run build:core` emette moduli ES e dichiarazioni in `dist/core/`; copiare l’intera cartella,
il manifesto `package.json` generato dichiara il contesto ESM e gli ingressi JS/tipi. L’app usa invece JS generato e versionato in
`js/core/`, verificato insieme agli altri moduli da `npm run check:typescript`.

Browser, Node, Worker e wrapper mobile con runtime JS possono consumare gli stessi moduli.
Swift, Kotlin o altri ambienti senza runtime JS richiedono un bridge o un’implementazione
conforme agli stessi contratti e fixture. GPS, storage, passkey, notifiche, mappe e UI vanno
implementati e verificati sulla piattaforma di destinazione. L’app completa oggi dipende ancora
da DOM, service worker e Cloudflare: **non è già portabile integralmente**.

Non cambiare le chiavi di archivio, i protocolli, la semantica di `null`, gli URL pubblici o i
limiti della cache per rendere più semplice il refactoring. Le date di acquisizione sono dati,
non indicatori da aggiornare durante una lettura.

## Migrazione successiva

| Passo | Criterio di completamento |
|---|---|
| Condivisione osservazioni | DTO indipendente dalle rotte `#/…`; esclusione provata di GPS, testo e foto private |
| Taccuino | Casi d’uso con archivio e clock iniettati; fixture dei protocolli precedenti |
| Apprendimento | Quiz e progressi separati dal renderer; stessi risultati nei runtime supportati |
| Contenuti | Provenienza, revisione, licenza e territorio versionati; compatibilità CMS |
| Meteo e uscite | Modello puro separato da provider, cache e clock; numeri invariati sulle fixture |
| Backend | Porte per archivi e account, adattatori D1/KV correnti e un secondo adattatore verificato |
| UI | Componenti condivisi e adattatori di piattaforma conformi ai contratti di esperienza |

Ogni fetta deve rimuovere una dipendenza reale, avere test di compatibilità e mantenere utilizzabile
l’app. Evitare una riscrittura completa, un framework imposto o servizi remoti separati senza necessità.
