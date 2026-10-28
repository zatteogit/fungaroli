# Ambienti ed edizioni

Decisione di Matteo del 28/10/2026: un solo codice su `main`, da cui derivano la
versione generalista e quelle dedicate (associazioni, parchi, demo). Le varianti sono
**configurazioni**, non rami. Tre ambienti con dati separati: locale, staging e produzione.

## Rami

| Ramo | Uso | Pubblicazione |
|---|---|---|
| `main` | Codice comune. Le PR si aprono verso `main`. | Ogni merge pubblica la **produzione** (Worker `fungaroli`). |
| `staging` | Copia della PR da provare prima del merge. Si sovrascrive senza problemi. | Ogni push pubblica lo **staging** (Worker `fungaroli-staging`). |
| `claude/…`, `codex/…` | Lavoro su una modifica. | Nessuna. |

`claude/brave-tesla-wu0a2b` era il ramo di produzione fino al 28/10. Resta come storia:
non va più usato come base né come destinazione delle PR.

Per provare una PR in staging:

```bash
git push --force origin <ramo-della-pr>:staging
```

Lo staging mostra «staging · …» nella testata, così non si confonde con l’app pubblica.

## Ambienti

| | Locale | Staging | Produzione |
|---|---|---|---|
| Comando | `npm run dev` | push sul ramo `staging` | merge su `main` |
| Indirizzo | http://localhost:8787 | https://fungaroli-staging.zatteo.workers.dev | https://fungaroli.zatteo.workers.dev |
| Configurazione | `wrangler.jsonc` + `--var ENVIRONMENT:local` | `env.staging` in `wrangler.jsonc` | configurazione principale di `wrangler.jsonc` |
| Community (D1) | simulata in `~/.fronda-dev/<edizione>` | `fungaroli-staging-community` (UE) | `fungaroli-community-eu` |
| Contenuti CMS (D1) | simulato in `~/.fronda-dev/<edizione>` | `fungaroli-staging-content` | `fungaroli-content` |
| Diario (KV) | simulato in `~/.fronda-dev/<edizione>` | `fungaroli-staging-diario` | `fungaroli-diario` |
| Cron meteo | no (si avviano a mano) | sì, stessi orari | sì |

Regole:

- In locale lo stato di D1 e KV sta in `~/.fronda-dev/<edizione>` (o in `FRONDA_DEV_STATE`), fuori dal
  repository: dentro, Wrangler lo vedrebbe come file statici modificati e ricaricherebbe il server
  all’infinito. Per ripartire da zero basta cancellare quella cartella.
- **Mai i database di produzione fuori dalla produzione.** Un test controlla che lo
  staging non condivida D1 o KV con la produzione (`tests/editions.test.mjs`).
- Le tabelle si creano da sole: il Worker applica gli schemi di `migrations/` al primo
  uso, e i contenuti del CMS arrivano dai JSON di `data/`. Un database nuovo non
  richiede passaggi manuali.
- Lo staging parte vuoto: niente account, osservazioni o diari copiati dalla produzione.
  Per i dati personali è una garanzia, non un limite.
- Gli amministratori del CMS sono diversi per ambiente: gli id sono quelli del database
  di quell’ambiente. In staging, dopo aver creato il profilo, si aggiunge il proprio id a
  `CMS_ADMIN_IDS` in `env.staging`.
- I segreti (es. `PUSH_PRIVATE_KEY`, `DIARIO_TOKEN`) sono per ambiente e si impostano
  dalla dashboard o con `wrangler secret put --env staging`, mai nel repository.
- Lo staging chiama Open-Meteo con gli stessi cron della produzione: le chiamate
  raddoppiano (circa 4.000 al giorno, sotto il limite gratuito di 10.000). Il piano gratuito
  vale solo per uso non commerciale: con abbonamenti o pubblicità serve un piano a pagamento.

## Edizioni

Un’edizione è un file `editions/<id>.json`, scelto dal Worker con la variabile `EDITION`.
Il Worker la espone in `/edition.json` insieme all’ambiente; l’app la legge all’avvio.

```json
{
  "id": "demo-esempio",
  "kind": "demo",
  "name": "Fronda",
  "place": { "pre": "demo", "label": "Reatino", "title": "…", "srText": "…" },
  "zones": { "provinces": ["RI"], "ids": null },
  "demo": { "partner": "Ente di esempio", "note": "…" }
}
```

| Campo | Significato |
|---|---|
| `kind` | `generalista`, `dedicata` (partner con contratto) o `demo` (trattativa in corso) |
| `place` | Etichetta accanto al marchio, con la descrizione per i lettori di schermo |
| `zones.provinces` / `zones.ids` | Zone dell’edizione; `null` per entrambi = tutte. Si applicano anche al meteo aggiornato dal Worker |
| `demo.partner` | Obbligatorio per le demo: compare nella descrizione della testata |

`fronda` è la generalista e coincide con l’app pubblicata prima del 28/10 (un test lo
controlla contro `index.html`). `demo-esempio` è un modello da copiare.

### Nuova edizione dedicata o demo

1. Copia `editions/demo-esempio.json` in `editions/<id>.json` e compila i campi.
2. Registrala in `worker/editions.js`.
3. Provala in locale: `npm run dev:edition -- <id>`.
4. Aggiungi in `wrangler.jsonc` un ambiente `env.<id>` con `EDITION` e risorse proprie
   (D1 community nell’UE, D1 contenuti, KV), come `env.staging`.
5. Crea un Worker con build collegata al ramo `main` e comando di pubblicazione
   `npx wrangler deploy --env <id>`.
6. I file in `editions/` non sono pubblicati come file statici (`.assetsignore`): il nome di un
   partner in trattativa non finisce nell’app generalista.

Cosa può cambiare un’edizione oggi: etichetta, descrizione e titolo, insieme delle zone.
Moduli attivabili, marchio del partner e contenuti iniziali dedicati sono il passo
successivo: si aggiungono come campi dell’edizione, con validazione e test, mai come
copie del codice. I contenuti del CMS restano per ambiente: una demo ha un proprio
database e quindi una redazione propria.

## Comandi

```bash
npm ci
npm run dev                         # generalista in locale (http://localhost:8787)
npm run dev:edition -- demo-esempio # un'edizione in locale
npm test
npx wrangler deploy --dry-run --env=""      # produzione
npx wrangler deploy --dry-run --env staging # staging
```
