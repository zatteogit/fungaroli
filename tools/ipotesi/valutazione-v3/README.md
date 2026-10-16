# Script della valutazione «v3»

Script usati il 16/10/2026 per [docs/ipotesi/valutazione-modello-v3.md](../../../docs/ipotesi/valutazione-modello-v3.md). Servono a ripetere le verifiche, non fanno parte dell'app e non vengono pubblicati (`tools` è in `.assetsignore`).

I dati scaricati (Open-Meteo, Crossref, DataCite, Zenodo, CSV dei porcini tedeschi) e gli esiti intermedi non sono nel repository: gli script li ricevono come argomenti. Il CSV di Brejon Lamartinière & Hoffman non va copiato qui finché non sono verificati i termini E-OBS.

| Cartella | Cosa verifica |
|---|---|
| `codice-test/` | Pacchetto Codex (commit `4465d2f`): dominio congiunto (`joint_domain.py`), casi limite di `learning.py` e `features.py`, Platt su semi simulati (`calib_seeds.py`), covariate calcolabili con i dati dell'app, inferenza portata in JS (`predict.mjs`). |
| `fonti/` | Metadati delle citazioni su Crossref e DataCite, audit dei dati dei porcini tedeschi. |
| `impianto-scientifico/` | «Falesia moltiplicativa» e deficit dell'indice su serie meteo reali (`falesia.mjs`, `deficit.mjs`), scarto fra prodotti meteo, curva termica di edulis (`sigma_brejon.py`), regola del vento di B. |
| `scettico/` | Ricontrolli: celle meteo delle fasce, split con due stagioni, giorni calcolabili con ICON. |
| `crossref.py` | Verifica dei DOI citati nella sintesi. |

Gli script `.mjs` importano il codice dell'app: si lanciano dalla radice del repository, oppure con `FRONDA_DIR=/percorso/del/repository`. Gli script Python che leggono file scaricati vanno eseguiti con `python3 -I`.
