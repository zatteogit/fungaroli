# TypeScript in Fronda

La migrazione è incrementale. I sorgenti migrati stanno in `src/js/`, con JavaScript generato negli stessi
percorsi pubblici `js/`. Sono coperti:

- dispositivo, copie offline e avvisi;
- acquisizione, cache per zona, aggregazione, scadenza, stato e aggiornamenti DOM del meteo;
- meteo delle uscite e ordinamento con i pesi esistenti;
- modello degli appunti, osservazioni condivise, foto e archivio locale del taccuino.

I moduli UI dei composer e delle pagine del taccuino, `community.js`, il resto
di `app.js` e il Worker rimangono JavaScript. La dichiarazione `human.d.ts`
descrive solo la porta dei due helper astronomici usati dal meteo; la loro
implementazione non è ancora migrata.

## Sorgenti e compilazione

Modificare i `.ts`, poi eseguire:

```sh
npm run build:typescript
npm test
npx wrangler deploy --dry-run
```

Il compilatore TypeScript è fissato nel lockfile. `strict`,
`noUncheckedIndexedAccess` e `noImplicitReturns` sono attivi: nessun `any`
esplicito o esclusione del controllo nei moduli migrati. Le aspettative di errore
in `tests/types/` sono prove negative dei contratti, compilate senza emettere JS:
coordinate testuali, meteo senza data, GPS nel payload condiviso e consenso
implicito devono essere rifiutati dal compilatore.

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

Proseguire con i composer e le pagine del taccuino, la sincronizzazione di
`community.js` e la separazione progressiva di `app.js`. Le cache meteo v3, le
migrazioni dalle v2, gli archivi fotografici per profilo e i protocolli delle
osservazioni v1/v2 mantengono nomi e semantica. Le date restano quelle di
acquisizione: rileggere una cache non la rende nuova e `null` non diventa zero.
Il Worker avrà una configurazione TypeScript distinta con i tipi Cloudflare,
senza mescolare le API DOM del browser con quelle del server.

Riferimenti: [migrazione ufficiale](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html),
[controlli strict](https://www.typescriptlang.org/tsconfig/strict.html).
