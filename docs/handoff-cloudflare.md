# Handoff: pubblicare Fungaroli Rieti su Cloudflare Pages

Istruzioni per un agente che opera nel browser dell'utente (Claude in Chrome), con la dashboard Cloudflare già aperta e l'utente già autenticato. L'agente agisce nell'account dell'utente: chiede conferma prima di ogni passaggio che crea o modifica risorse, e non legge, non scrive e non ripete mai segreti in chat.

## Obiettivo

Mettere online il sito statico del repository GitHub `zatteogit/fungaroli` su Cloudflare Pages, con la sincronizzazione del diario attiva (Pages Function in `functions/api/diario/[[path]].js` + Workers KV).

Risultato atteso: un indirizzo `https://<progetto>.pages.dev` dove:
- la home mostra l'app (mappa, classifica, scheda zona);
- `https://<progetto>.pages.dev/api/diario` risponde **401** con corpo JSON `{"error":"unauthorized"}` (vuol dire che funzione, KV e codice sono configurati). Se risponde **503** `not_configured`, manca il binding KV o il segreto.

## Dati del progetto

| Voce | Valore |
|---|---|
| Repository | `zatteogit/fungaroli` |
| Branch di produzione | `main` se esiste, altrimenti `claude/brave-tesla-wu0a2b` |
| Nome progetto suggerito | `fungaroli` (se occupato: `fungaroli-rieti`) |
| Framework preset | None |
| Build command | vuoto |
| Build output directory | `/` |
| Root directory | vuoto (radice del repo) |
| KV namespace | `fungaroli-diario` |
| Binding KV (nome variabile) | `DIARIO` |
| Segreto | `DIARIO_TOKEN` = codice diario scelto dall'utente |

## Passaggi

1. **Crea il progetto Pages collegato a GitHub.**
   *Workers & Pages → Create → Pages → Connect to Git.* Se GitHub non è collegato, l'utente autorizza l'app Cloudflare su GitHub (almeno sul repo `zatteogit/fungaroli`). Scegli il repository, imposta nome progetto, branch di produzione e le impostazioni di build della tabella. *Save and Deploy* e attendi la fine del primo deploy.
   Nota: il repo contiene `package.json`. Se Cloudflare propone di eseguire `npm install` o un framework, lascia il build command **vuoto**: il sito non va compilato.

2. **Crea il namespace KV.**
   *Storage & Databases → Workers KV → Create namespace* (in alcune versioni: *Workers & Pages → KV*). Nome: `fungaroli-diario`.

3. **Collega il KV al progetto.**
   Progetto `fungaroli` → *Settings → Bindings* (in alcune versioni *Settings → Functions → KV namespace bindings*) → *Add* → *KV namespace*. Variable name: `DIARIO`. Namespace: `fungaroli-diario`. Fallo per l'ambiente **Production** (e anche *Preview*, se l'interfaccia li separa).

4. **Imposta il codice diario come segreto.**
   Progetto → *Settings → Variables and Secrets* → *Add* → tipo **Secret**, nome `DIARIO_TOKEN`. **Il valore lo digita l'utente**: l'agente si ferma, chiede all'utente di scrivere nel campo un codice di almeno 12 caratteri che ricorderà (è lo stesso che inserirà nell'app su ogni dispositivo), e riprende solo dopo che l'utente ha salvato. L'agente non deve leggere il valore né riportarlo.
   Ambiente: Production (e Preview se separato).

5. **Ripubblica perché binding e segreto abbiano effetto.**
   Progetto → *Deployments* → sull'ultimo deploy di produzione *Retry deployment* (oppure un nuovo push sul branch).

6. **Verifica.**
   - Apri `https://<progetto>.pages.dev/`: deve comparire l'app con la mappa e la classifica; in alto "Meteo delle HH:MM".
   - Apri `https://<progetto>.pages.dev/api/diario`: deve rispondere `{"error":"unauthorized"}`. Con `{"error":"not_configured"}` ricontrolla i passaggi 3-4 e ripubblica.
   - Nella pagina, sezione **Il mio diario**: deve comparire il campo "Codice diario". Chiedi all'utente di inserire il codice e premere *Collega*: il messaggio diventa "Diario sincronizzato".

7. **Riporta all'utente** l'indirizzo pubblico e l'esito delle tre verifiche. Non riportare il codice.

## Facoltativo

- **Dominio personalizzato**: progetto → *Custom domains* → *Set up a domain* (solo se l'utente lo chiede).
- **Accesso riservato** all'intero sito: *Zero Trust → Access → Applications* (solo se l'utente lo chiede; il diario è già protetto dal codice).

## Cosa NON fare

- Non modificare il codice del repository e non fare commit.
- Non creare token API, non cambiare impostazioni dell'account o della fatturazione.
- Non inserire, leggere o copiare il valore di `DIARIO_TOKEN`.
- Non eliminare progetti o namespace esistenti.

## Dopo la pubblicazione (per la sessione di sviluppo)

Quando il sito è online e il diario è collegato, la sessione di sviluppo elimina l'Artifact su claude.ai e la routine "Aggiorna meteo Fungaroli" che lo ripubblica ogni mattina, dopo aver copiato nel diario del sito eventuali uscite registrate nell'Artifact.
