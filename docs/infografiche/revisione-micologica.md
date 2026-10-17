# Infografiche: revisione micologica da chiedere

Le 13 infografiche pubblicate nella v80 (`assets/infografiche/`, `data/infografiche.json`) sono illustrazioni generate con AI dai brief di questa cartella e controllate dal progetto. Nessun micologo le ha ancora riviste. **Va chiesta una revisione micologica**, a partire dall'ovolo buono.

## Ordine

1. **Ovolo buono (`caesarea`)**, prima di tutte. Sosia mortali. È la tavola nata da una revisione (`caesarea-revisione.webp`). `incoming/bozze/STATO.md` la segna «verifica illustrativa superata; da rivedere con un micologo». Il segno «Da rivedere con un micologo» compare nella scheda, sotto il titolo «Infografica».
2. Le specie con un sosia mortale o tossico: `procera`, `mellea`, `virescens`, `edulis`, `pinophilus`, `aereus`, `aestivalis`, `cibarius`.
3. Le altre: `repandum`, `cornucopioides`, `suillus`, `nuda`.

## Cosa chiedere

- Caratteri anatomici e colori: confronto con la checklist del brief della specie (`docs/infografiche/<specie>.md`, §7) e con la checklist generale (`README.md`, §6).
- Sosia: il confronto non deve suggerire un carattere decisivo che non lo è.
- Esito per tavola: «approvata», «da correggere» (con cosa) o «da ritirare».

## Come segnare l'esito

- Il campo `review` di `data/infografiche.json` mostra il segno nella scheda. Si toglie quando il micologo approva la tavola. Se GPT ridisegna una tavola, il segno resta finché la nuova versione non è rivista.
- Si aggiunge qui il nome del revisore, la data e l'esito. Sono dati verificabili, non interpretazioni.

## Stato al 16/10/2026

| Specie | File pubblicato | Stato in STATO.md | Segno nella scheda |
|---|---|---|---|
| caesarea | caesarea-revisione.webp | verifica illustrativa superata; da rivedere con un micologo | sì |
| aereus | aereus-revisione.webp | verifica illustrativa superata | no |
| altre 11 | `<specie>.webp` | verifica illustrativa superata | no |
| terreum | non pubblicata | non approvata | — |
