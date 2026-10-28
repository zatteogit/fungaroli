# PR #298 · Fondazione modulare, ambienti isolati e sistema di esperienza (Codex)

Valutazione del 28/10/2026. PR in bozza, ramo `codex/fronda-foundation`, ultimo commit `e4669847` (27/10). Tre commit, 59 file, circa 2.900 righe aggiunte. Matteo aveva chiesto il lavoro il 27/10: preparare fondazione, rami, ambienti e sistema di design e linguaggio, senza merge, pubblicazione o attivazione commerciale.

Il 28/10 la base della PR è passata da `claude/brave-tesla-wu0a2b` a `main`. Nel frattempo su `main` è entrata la [#302](https://github.com/zatteogit/fungaroli/pull/302), «ambienti ed edizioni» ([docs/ambienti-ed-edizioni.md](../ambienti-ed-edizioni.md)). Le due PR rispondono in parte alla stessa domanda in modi diversi.

## Fatti verificati

- **Conflitti con `main`** (`git merge-tree`, 28/10): `.assetsignore`, `.github/workflows/ci.yml`, `index.html`, `package.json`, `sw.js`. La PR è indietro di 13 commit.
- **Ambienti.** #298 genera configurazioni locali per quattro ambienti (`local`, `test`, `staging`, `demo`, porte 8787–8790) da `infra/environments.json`, con risorse simulate e senza deploy remoto. Lo staging online è descritto come «da attivare in una consegna successiva». Su `main` lo staging online esiste già (Worker `fungaroli-staging`, database UE propri, ramo `staging`).
- **Rami.** `docs/architecture/branches.md` prevede quattro rami di offerta (`codex/fronda-consumer`, `-academy`, `-territory`, `-partners`) nati dalla fondazione, e indica `claude/brave-tesla-wu0a2b` come produzione. La decisione del 28/10 dice il contrario: un solo codice su `main`, le varianti sono configurazioni (`editions/*.json`), non rami.
- **Profili.** `design-system/editions.json` definisce cinque profili commerciali (Free, Plus, Academy, Territorio, Partners) con un accento ciascuno. Le edizioni di `main` sono un'altra cosa: un'edizione è un pubblico (generalista, dedicata, demo), non un livello di abbonamento.
- **Nucleo.** `src/js/core/field-record.ts` estrae le regole di normalizzazione delle osservazioni da `community-observation`. L'app usa la stessa funzione, con un test che lo controlla (`tests/foundation.test.mjs`). Guard di architettura sugli import del nucleo, con lo scanner di TypeScript.
- **Design.** `design-system/` contiene contratti JSON (fondazione, esperienza, linguaggio italiano, token risolti) e `css/foundation-tokens.css`. `css/tokens.css` resta la fonte dei colori.
- **Demo.** `infra/demo/` è un Worker separato con dati sintetici, solo locale, senza cron.

## Parere

- **Da non riprendere:** rami per offerta, matrice degli ambienti locali e documenti che indicano il vecchio ramo come produzione. Sono superati dalla #302 e dalla decisione del 28/10. Unirli creerebbe due descrizioni concorrenti di ambienti e varianti.
- **Profili Free/Plus/Academy/…:** restano un'ipotesi commerciale. Se servono, vanno espressi come campi delle edizioni di `main`, non come file paralleli.
- **Recuperabili con una PR piccola verso `main`, se Matteo vuole:**
  1. l'estrazione di `normalizeFieldRecord` nel nucleo con il suo test: è la parte più concreta e non tocca ambienti né rami;
  2. il guard sugli import del nucleo;
  3. eventualmente i contratti di linguaggio (`design-system/language.it.json`), dopo un confronto con le regole dei testi di AGENTS.md.
- **Demo della fondazione:** utile solo come prova locale. Una demo per un partner oggi si fa con un'edizione `kind: "demo"`.

## Decisione

Matteo, 28/10/2026: chiudere la #298 senza unirla e recuperare in una PR piccola da `main` l'estrazione di `normalizeFieldRecord` nel nucleo, con il suo test e il guard sugli import (punti 1–2): PR #314. Il resto resta qui come ipotesi.
