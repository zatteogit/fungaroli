# Handoff: completare la pubblicazione di Fungaroli Rieti su Cloudflare

Istruzioni per un agente che opera nel browser dell'utente (Claude in Chrome), con la dashboard Cloudflare aperta e l'utente autenticato. L'agente agisce nell'account dell'utente: chiede conferma prima di ogni passaggio che crea o modifica risorse, e non legge, non scrive e non ripete mai segreti in chat.

## Situazione attuale

- Esiste già un progetto **Workers** chiamato `fungaroli`, collegato al repository GitHub `zatteogit/fungaroli`, branch `claude/brave-tesla-wu0a2b`. Ogni push sul branch avvia un build che esegue `npx wrangler deploy`.
- Il primo build era fallito perché mancava la configurazione. Ora il repository contiene `wrangler.jsonc` (Worker `worker/index.js` + file statici) e `.assetsignore`.
- Il diario sincronizzato richiede un namespace **Workers KV** e un segreto `DIARIO_TOKEN`. Senza, l'app funziona lo stesso, con il diario salvato nel browser.

## Obiettivo

1. Build di produzione verde e sito raggiungibile.
2. Namespace KV `fungaroli-diario` creato e il suo **ID** consegnato all'utente, che lo passerà alla sessione di sviluppo: sarà lei a inserirlo in `wrangler.jsonc` e a pushare. I collegamenti aggiunti a mano dal pannello verrebbero cancellati dal deploy successivo, quindi l'agente **non** aggiunge il binding KV dal pannello.
3. Segreto `DIARIO_TOKEN` impostato nel Worker, con il valore digitato dall'utente.

## Dati del progetto

| Voce | Valore |
|---|---|
| Progetto Cloudflare | Worker `fungaroli` |
| Repository / branch | `zatteogit/fungaroli` / `claude/brave-tesla-wu0a2b` |
| Build command | nessuno |
| Deploy command | `npx wrangler deploy` (già impostato) |
| Root directory | `/` |
| KV namespace da creare | `fungaroli-diario` |
| Nome binding (lo mette la sessione di sviluppo in `wrangler.jsonc`) | `DIARIO` |
| Segreto da creare | `DIARIO_TOKEN` (valore scelto e digitato dall'utente) |

## Passaggi

1. **Controlla il build.**
   *Workers & Pages → fungaroli → Deployments.* Il build più recente, quello del commit "Configurazione Cloudflare Workers con file statici e API del diario", deve essere verde. Se l'ultimo è ancora rosso e più vecchio di quel commit, premi **Retry build**. Se fallisce di nuovo, copia le ultime 30 righe del log (*Copy build log*) e consegnale all'utente, senza modificare impostazioni.

2. **Verifica il sito.**
   Apri l'indirizzo `*.workers.dev` del progetto, che trovi in *Overview* o in *Domains*.
   - La home deve mostrare l'app "Fungaroli Rieti" con mappa, classifica e scheda zona; in alto "Meteo delle HH:MM".
   - `…/api/diario` deve rispondere `{"error":"not_configured"}`. È corretto in questa fase: manca ancora il KV.
   - `…/package.json` deve rispondere 404: i file di sviluppo non vengono pubblicati.

3. **Crea il namespace KV.**
   *Storage & Databases → Workers KV → Create namespace* (in alcune versioni: *Workers & Pages → KV*). Nome: `fungaroli-diario`. Poi copia il suo **Namespace ID**, una stringa esadecimale di 32 caratteri, e mostralo all'utente. Non è un segreto.
   **Non** collegarlo al Worker dal pannello: lo farà la sessione di sviluppo in `wrangler.jsonc`.

4. **Imposta il codice diario come segreto.**
   *Workers & Pages → fungaroli → Settings → Variables and Secrets → Add.* Tipo **Secret**, nome `DIARIO_TOKEN`. **Il valore lo digita l'utente**: fermati e chiedigli di scrivere nel campo un codice di almeno 12 caratteri che ricorderà. È lo stesso codice che inserirà nell'app su ogni dispositivo, e chi lo condivide (per esempio in famiglia) condivide il diario. Riprendi solo dopo che l'utente ha salvato. Non leggere il valore e non riportarlo.
   Se il pannello chiede di ripubblicare per applicare il segreto, accetta (*Deploy*).

5. **Riporta all'utente:**
   - l'indirizzo pubblico del sito;
   - l'esito delle verifiche del passo 2;
   - il Namespace ID del KV, da incollare alla sessione di sviluppo con un messaggio tipo: "ID KV del diario: <ID>";
   - la conferma che il segreto `DIARIO_TOKEN` è stato salvato dall'utente. Il codice non va mai riportato.

## Dopo il passo della sessione di sviluppo (verifica finale)

Quando la sessione di sviluppo ha inserito l'ID in `wrangler.jsonc` e pushato, Cloudflare ripubblica da solo. Allora:
- `…/api/diario` deve rispondere `{"error":"unauthorized"}`: funzione, KV e segreto sono a posto. Se risponde ancora `not_configured`, controlla che il build più recente sia verde e che il segreto esista.
- Nella pagina, sezione **Il mio diario**, compare il campo "Codice diario". L'utente inserisce il codice e preme *Collega*: il messaggio diventa "Diario sincronizzato".

## Facoltativo (solo se l'utente lo chiede)

- **Dominio personalizzato**: *fungaroli → Domains → Add custom domain*.
- **Accesso riservato** all'intero sito: *Zero Trust → Access → Applications*. Il diario è già protetto dal codice.

## Cosa NON fare

- Non modificare il codice del repository e non fare commit: lo fa la sessione di sviluppo.
- Non aggiungere binding dal pannello: verrebbero cancellati al deploy successivo.
- Non creare token API e non toccare account, fatturazione o altri progetti (per esempio `nutree`, `vulcan-annotations`).
- Non inserire, leggere o copiare il valore di `DIARIO_TOKEN`.
- Non eliminare progetti, namespace o deploy.

## Dopo la pubblicazione (per la sessione di sviluppo)

Con il sito online e il diario collegato, la sessione di sviluppo:
1. inserisce l'ID KV in `wrangler.jsonc`: `"kv_namespaces": [{ "binding": "DIARIO", "id": "<ID>" }]`, poi testa e pusha;
2. elimina l'Artifact su claude.ai e la routine "Aggiorna meteo Fungaroli", dopo aver controllato che il diario dell'Artifact non contenga uscite da copiare.
