---
name: steward
description: Come portare una PR di Fronda fino al merge — verifiche da lanciare per i file toccati, lettura della CI, versione della shell, regole su test e decisioni. Usala prima di aprire una PR, quando arriva un evento di CI o di revisione, e prima di proporre un merge.
---

# Steward di Fronda

Le regole complete sono in `AGENTS.md` e in `docs/handoff-2026-10-14.md`. Qui c'è solo il percorso operativo di una PR.

## Prima di aprire la PR

1. Parti dal ramo di produzione `claude/brave-tesla-wu0a2b` aggiornato. Le PR vanno verso quel ramo: `main` non esiste.
2. Lancia le verifiche rapide, le stesse della CI:
   - `npm test`
   - `node docs/fronda/scripts/check.mjs`
   - `node docs/fronda/scripts/guard-test.mjs`
   - `npx wrangler deploy --dry-run`
   - `git diff --check`
3. Se tocchi un file dell'app pubblicata, aumenta `SHELL` in `sw.js` e `<meta name="app-version">` in `index.html` con lo stesso valore. Se aggiungi moduli, aggiorna `PRECACHE`.
4. Se aggiungi dati, lancia `node tools/asset-report.mjs` e metti il rapporto nella descrizione.
5. Suite browser: lancia solo gli spec delle parti toccate, con `npx playwright test tests/browser/<spec> -g "<titolo>"`. `CHROMIUM_PATH` è impostato dall'hook di avvio.
   - Un solo Wrangler alla volta sulla porta 8788.
   - Output fuori dal repository, con `--output` nella cartella temporanea.
6. Nella PR elenca gli spec eseguiti e i limiti delle verifiche.

## Leggere la CI

| Check | Significato |
|---|---|
| `test` | Fa fede. Deve essere verde prima del merge. |
| `browser (n/8)`, `Taccuino fotografico` | Saltati sulle PR: partono solo a mano con `workflow_dispatch`. Saltati non vuol dire rossi. |
| `Workers Builds: fungaroli` | Dal 24/10/2026 non gira più sui rami delle PR (anteprime spente). Per riaccenderle servono risorse separate e un blocco `previews` in `wrangler.jsonc`, mai i database di produzione: vedi `AGENTS.md`. |

## Test browser instabili o vecchi

- Un test che fallisce va confrontato con il ramo di produzione alla stessa ora, su una copia separata (git worktree). Se fallisce anche lì, è debito preesistente e non blocca la PR.
- Molti test di `community.spec.mjs` dipendono dall'ora del giorno: la proposta in copertina cambia quando passa l'orario consigliato. Se ne correggi uno, rendilo indipendente dall'orario. Per esempio leggi l'indice dalla scheda della zona invece che dalla copertina.
- Un test si aggiorna quando ha torto rispetto a una decisione documentata, mai per far passare un difetto dell'app. Se il test ha ragione, correggi l'app.
- Mai saltare, disattivare o mettere in quarantena un test.

## Decisioni

- Quando serve una decisione di Matteo, chiedila con domande a scelta, l'opzione consigliata per prima.
- Proposte di altri agenti o altre IA (rami `codex/*`, `gpt/*`, PR di altre sessioni) sono ipotesi: vedi `docs/ipotesi/`.
- Il merge nel ramo di produzione pubblica il sito. Si unisce solo con il via di Matteo e con `test` verde.
- Dopo il merge, controlla che `https://fungaroli.zatteo.workers.dev/` risponda con la nuova `fungaroli-shell-vNN`.
