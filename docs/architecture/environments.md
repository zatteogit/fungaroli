# Ambienti, test e collaudo

Una versione di codice è un commit. Un ambiente è un insieme separato di risorse e configurazioni.
Un branch non è un ambiente e una diversa offerta non richiede una copia del database di produzione.

## Matrice

| Ambiente | Scopo | Stato e dati | Accesso e servizi |
|---|---|---|---|
| Local | Sviluppo quotidiano, porta 8787 | Predisposto ed eseguibile con D1/KV simulati | Ruoli vuoti; nessun cron o segreto ereditato |
| Test | Test automatici, porta 8788 | Dati sintetici, stato temporaneo per esecuzione browser | Identità di fixture solo nel database locale |
| Staging / collaudo | Prova del candidato, porta 8789 | Configurazione locale pronta; online da attivare | Identità e risorse dedicate; accesso online riservato da configurare |
| Demo | Presentazione delle fondazioni, porta 8790 | Eseguibile; solo dati sintetici in lettura | Nessun account, DB, passkey, invio, provider o cron |
| Produzione | App in uso | Configurazione corrente `wrangler.jsonc` | Invariata; rilascio attraverso il ramo storico |

`infra/environments.json` è la matrice autorevole degli ambienti non produttivi.
`tools/foundation/environments.mjs` genera configurazioni da un elenco esplicito di proprietà:
**non copia binding, ruoli, route, cron o segreti dalla produzione**. Le directory generate
`.fronda/config/`, `.fronda/state/`, `.fronda/build/` sono ignorate da Git ed escluse dagli asset.
Lo stato browser della suite resta in una directory temporanea per esecuzione.

I database hanno nomi e identificatori locali distinti. Gli identificatori sono placeholder di
simulazione, non risorse cloud. `remote: false`, `workers_dev: false` e `preview_urls: false`
eviteranno collegamenti involontari. I file generati **non sono configurazioni di deploy remoto**.
Il comando fornito espone solo preparazione, sviluppo e dry-run; `deploy` non è implementato.
L’esecuzione manuale di Wrangler al di fuori dei comandi rimane responsabilità dell’operatore.

## Uso e pulizia

```sh
npm run env:prepare -- local
npm run dev:local
npm run dev:staging
npm run dev:demo
npm run env:dry-run -- local
npm run env:dry-run -- test
npm run env:dry-run -- staging
npm run env:dry-run -- demo
```

I server sono processi persistenti: arrestarli con Ctrl+C. Non sovrapporre due processi sulla
stessa porta. Il debugger locale usa una porta assegnata dal sistema per evitare collisioni.
Se 8788 è già occupata da altri lavori, usare `FRONDA_TEST_PORT=18788` per la suite browser;
la porta viene validata e la stessa origine è applicata a server, test e passkey. Non arrestare
servizi altrui per liberarla. Per ripartire da uno stato vuoto, arrestare il server e rimuovere esclusivamente
`.fronda/state/<ambiente>/`. I test browser usano il percorso temporaneo stampato o passato in
`FUNGAROLI_BROWSER_PERSIST`; non riutilizzare uno stato di sviluppo per account o fixture di test.
Per confrontare ambienti usare profili browser separati: le passkey, i service worker e i salvataggi
dipendono dall’origine. Il solo cambio del nome del branch non li separa.

Gli ambienti completi conservano l’accesso agli asset pubblici dell’app e possono usare servizi
esterni attraverso flussi espliciti. I test di UI simulano le risposte necessarie. Soltanto la demo
della fondazione evita del tutto i provider: il suo CSP ammette connessioni alla stessa origine,
e il Worker non importa il backend applicativo. Non è ancora la demo completa delle offerte.
L’anteprima locale su HTTP non prova il funzionamento delle passkey su domini HTTPS definitivi.

## Attivare il collaudo online, in una consegna successiva

1. Concordare dominio, account Cloudflare e persone abilitate; configurare accesso riservato
   e identità di test. Il file locale non contiene questa protezione già attiva.
2. Creare Worker, due D1 e KV dedicati. Registrare i veri ID in una configurazione versionata
   separata. Verificare gli ID contro l’inventario Cloudflare di produzione: i soli nomi non bastano.
3. Impostare l’origine HTTPS esatta per passkey, cookie e CORS, ruoli con identità di collaudo
   e segreti diversi. Non copiare sessioni, foto, GPS o appunti reali.
4. Eseguire migrazioni **sui database di collaudo**, importare fixture sintetiche documentate,
   verificare lo stato vuoto e l’isolamento con due account.
5. Verificare l’accesso dal browser e il blocco dei non autorizzati. Gli header `noindex`
   e `x-fronda-environment` sono segnali informativi, non autenticazione.
6. Abilitare a parte le prove di meteo, notifiche e pianificazioni con destinatari e risorse di test.
   Il wrapper locale disabilita i cron anche quando invocati esplicitamente.
7. Eseguire il collaudo del commit candidato; registrare dati, build, revisore ed esito.
   Solo allora definire e autorizzare un flusso di pubblicazione verso l’ambiente.

Nessuna anteprima remota di PR viene riaccesa da questa consegna.

## Test, promozione e ripristino

- Ogni PR: tipi, output generati coerenti, guard di architettura/design/ambienti, unitari,
  guard dello studio storico, dry-run produzione e configurazioni isolate.
- Per ogni fetta: browser sulle aree coinvolte; larghezze/temi e offline pertinenti;
  errori, cache scadute, dati assenti e cambio account quando applicabile.
- Prima del rilascio: stesso commit collaudato, verifica contenuti/licenze e consenso dove
  coinvolti, esito CI, nota di rilascio e piano di ripristino. La suite browser completa
  segue le regole correnti di AGENTS, non diventa obbligatoria per ogni correzione.
- Il merge verso `claude/brave-tesla-wu0a2b` pubblica l’app: richiede una decisione esplicita.
  Registrare SHA rilasciato e versione dello shell; verificare il sito dopo il rilascio.
- Ripristino codice: ritorno a una versione verificata e controllo delle cache. Per migrazioni
  persistenti serve un piano dedicato, backup verificato e compatibilità avanti/indietro:
  il rollback del Worker non annulla una migrazione D1.
