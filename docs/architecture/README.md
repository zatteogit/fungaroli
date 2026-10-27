# Fondazione comune di Fronda

Avviata il **27 ottobre 2026**, su richiesta di Matteo: base modulare, branch delle offerte,
portabilità, ambienti separati, documentazione ed experience/design/language system condiviso.
Base verificata: produzione `3fcbc7ec80b62c52dd7ce290168f7573ff9f5f95`.

## Da dove partire

| Documento | Contenuto |
|---|---|
| [Architettura e portabilità](modularity.md) | Livelli, prima estrazione reale, confini e migrazione |
| [Ambienti e collaudo](environments.md) | Locale, test, staging, demo, produzione e attivazione online |
| [Experience, design e language system](../../design-system/README.md) | Contratti comuni, varianti, componenti e governance |
| [Branch e sviluppo](branches.md) | Base condivisa, ambiti e integrazione |
| [Decisioni](decisions.md) | Motivazioni, alternative e conseguenze |
| [Verifica della consegna](verification.md) | Cosa è stato effettivamente esercitato e cosa resta da fare |

## Stato concreto

- Le regole delle osservazioni sono estratte in `src/js/core/`, consumate dall’app attraverso
  gli ingressi precedenti. Gli URL pubblici restano compatibili e i nuovi moduli sono nel precache.
- I profili Free, Plus, Academy, Territorio e Partners descrivono composizioni **previste**.
  Non attivano abbonamenti, permessi, prezzi o schermate nuove nell’app.
- Locale e test usano configurazioni indipendenti; staging è predisposto per prove locali.
  La demo esegue il nucleo con dati sintetici, senza account o database.
- Experience, linguaggio e token hanno contratti versionati. L’intera interfaccia esistente
  non è stata migrata a questi contratti in un solo passaggio.
- Nessuna pubblicazione o migrazione dei database reali fa parte di questa consegna.

## Comandi

```sh
npm ci
npm test
npm run build:core              # JS e dichiarazioni, esportabili da dist/core
npm run dev:local              # app completa, risorse simulate sulla porta 8787
npm run dev:staging            # candidato di collaudo locale, porta 8789
npm run dev:demo               # demo della base, porta 8790
npm run env:dry-run -- test
npm run env:dry-run -- staging
npm run env:dry-run -- demo
```

Per le verifiche browser usare i comandi del repository con `CHROMIUM_PATH` quando necessario.
La suite prepara automaticamente l’ambiente `test` e mantiene la porta 8788 e lo stato temporaneo.

Il testo commerciale fornito da Matteo è il brief iniziale, non una fonte di dati, una verifica
legale o un listino approvato. Prezzi, partner, ricavi, licenze commerciali, pagamenti e revisioni
scientifiche richiedono lavoro dedicato. MycoTrace rimane un progetto separato.
