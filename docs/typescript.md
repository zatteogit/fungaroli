# TypeScript in Fronda

La migrazione è incrementale. La prima parte comprende i moduli dispositivo,
copie offline e avvisi: sorgenti in `src/field/`, tipi condivisi in
`src/field/types.d.ts`. Il resto del frontend e il Worker restano JavaScript;
non sono coperti dal controllo dei tipi in questa fase.

## Sorgenti e compilazione

Modificare i `.ts`, poi eseguire:

```sh
npm run build:typescript
npm test
npx wrangler deploy --dry-run
```

Il compilatore TypeScript è fissato nel lockfile. `strict`,
`noUncheckedIndexedAccess` e `noImplicitReturns` sono attivi: nessun `any`
esplicito o esclusione del controllo nei moduli migrati.

I `.js` generati in `js/` sono versionati e contrassegnati da un commento:
non modificarli a mano. Gli import conservano l’estensione `.js`, risolta dal
compilatore sul corrispondente `.ts`. Non servono un framework o un nuovo
bundle. Anche un server statico e un archivio Git pulito funzionano senza
compilazione al momento della visita.

`npm run typecheck` verifica solo i tipi. `npm run check:typescript` compila in
una cartella temporanea e confronta tutti i moduli emessi con quelli pubblicati;
fallisce se il JavaScript manca o non corrisponde. Viene eseguito prima dei test.
`npm ci`/`npm install` compilano con `prepare`; la CI controlla anche che questa
compilazione non modifichi i file versionati, impedendo commit con output vecchi.
`npm start` ricompila prima di avviare il server locale. Sorgenti e configurazione
del compilatore sono esclusi dagli asset Cloudflare.

## Contratti e compatibilità

Il modello della copia pubblica è distinto dalle coordinate private del taccuino.
Le coordinate vengono normalizzate; il pacchetto viene ricostruito con soli
campi pubblici, senza trasferire campi inattesi da JavaScript o IndexedDB.
Le copie esistenti con schema 1 restano supportate. Versioni ignote e dati
malformati mostrano un errore, senza indovinare valori mancanti.

Le risposte JSON degli avvisi e le credenziali locali entrano come `unknown` e
sono controllate a runtime. TypeScript non sostituisce la validazione delle API
né i controlli di consenso, autorizzazione e sicurezza del Worker.

Per ogni modulo nuovo aggiornare il precache del service worker e l’elenco degli
asset offline se serve al lettore. A ogni cambiamento pubblicato incrementare
la versione della shell e la meta `app-version` insieme.

## Prossime parti

Estendere prima ai moduli meteo e ai modelli del taccuino, con contratti per
disponibilità, provenienza e consenso; poi separare progressivamente `app.js`.
Il Worker avrà una configurazione TypeScript distinta con i tipi Cloudflare,
senza mescolare le API DOM del browser con quelle del server.

Riferimenti: [migrazione ufficiale](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html),
[controlli strict](https://www.typescriptlang.org/tsconfig/strict.html).
