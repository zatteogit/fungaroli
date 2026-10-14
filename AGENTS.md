# Istruzioni per gli agenti (Codex, Claude Code e altri)

Prima di modificare qualcosa leggi [docs/handoff-2026-10-14.md](docs/handoff-2026-10-14.md): contiene le decisioni di prodotto, i nomi definitivi, dove stanno dati e codice e i limiti noti. Questo file riassume solo le regole che si rompono più facilmente.

## Rami e pubblicazione

- Il ramo di produzione è **`claude/brave-tesla-wu0a2b`**, non `main` (che non esiste). Le PR vanno aperte verso quel ramo.
- Il merge nel ramo di produzione pubblica il sito su Cloudflare Workers (https://fungaroli.zatteo.workers.dev). Configurazione versionata in `wrangler.jsonc`: non aggiungere binding o variabili dalla dashboard.
- Prima di iniziare aggiorna il ramo da produzione; lavora su un ramo dedicato.
- `docs/handoff-cloudflare.md` descrive il bootstrap del 12/10: è storia, non la procedura attuale.
- Mai segreti in commit, documenti o log.

## Verifiche

```bash
npm ci
npm test                                  # test unitari (Node ≥ 22)
npx wrangler deploy --dry-run             # configurazione del Worker
CHROMIUM_PATH=/percorso/chromium npx playwright test   # suite browser, Wrangler locale sulla porta 8788
git diff --check
```

La suite browser avvia un solo Wrangler sulla porta 8788: non lanciarne due insieme. La CI (`.github/workflows/ci.yml`) esegue test unitari e dry-run su ogni PR.

## Regole che non si vedono dal codice

- **Cache del service worker:** quando cambia un file dell'app pubblicata, incrementa `SHELL` in `sw.js` (`fungaroli-shell-vNN`) e aggiorna `PRECACHE` se aggiungi moduli.
- **CMS:** i contenuti pubblici possono arrivare dallo snapshot del CMS (D1 `CMS_DB`). Cambiare solo un JSON in `data/` non sostituisce un contenuto già pubblicato da un autore. Per un campo nuovo aggiorna insieme schema, renderer, seed e snapshot (vedi `docs/cms.md`).
- **Nomi definitivi:** sezioni **Uscite**, **Scopri**, **Taccuino**; titoli home «Dove andare», «Altre buone uscite», «Nei boschi in questi giorni». Nella storia Git compaiono nomi precedenti: non ripristinarli.
- **Gerarchia:** funghi → giro → scoperte. Piante e alberi non cambiano zona, giorno, sentiero o indice.
- **Linguaggio:** l'app descrive caratteri, ambienti e rischi. Non identifica, non certifica commestibilità, non dice «tieni/scarta». L'indice è sperimentale (0–10), non una probabilità.
- **Fonti e licenze:** ogni nuovo dato, foto o soglia deve avere fonte e licenza verificabili. Niente soglie inventate, niente bonus numerici da folklore («funghi spia»).

## Testi

Italiano, frasi brevi, senza gergo. Decimale con la virgola (7,2). Distinguere sempre fatto verificato, interpretazione e dato non verificato.
