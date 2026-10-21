# Segnalazioni, motore e API per agenti

Decisione di Matteo del 20 ottobre 2026: collegare le segnalazioni valide al motore, renderne consultabile l'effetto in dashboard e permettere l'uso tramite API da agenti.

## Effetto nelle uscite

`js/external-signal.js` è il calcolo condiviso da Worker, dashboard/API e client delle uscite. Le fonti esterne modificano soltanto la priorità pratica, non l'indice biologico 0–10. Non sono una calibrazione né una probabilità. Restano separati i contributi Fronda, le osservazioni esterne e le annotazioni botaniche.

Si riutilizza la politica sperimentale già presente in `js/community-signal.js` e `ranking_policy`: massimo 10%, riducibile a zero dall'amministratore. Per le fonti esterne l'unità è l'evento deduplicato, non il contributore con account. Adattamento operativo esplicito, non evidenza scientifica di indipendenza: 3 eventi su 2 giorni distinti nella finestra di 7 giorni, forza piena a 10 eventi. Un autore può avere più eventi: non si presentano come persone indipendenti. Il motivo di tale limite è evitare che un singolo ritrovamento decida l'ordine, conservando la prudenza della politica esistente. Non sono stati aggiunti coefficienti biologici o soglie micologiche.

Per ciascuna zona/specie con modello: `m = 1 + limite/100 × (presenze − ricerche_a_vuoto)/(presenze + ricerche_a_vuoto) × min(1,eventi/10)`, solo se le soglie sono soddisfatte. Una ricerca negativa richiede sforzo documentato. Nessun dato non significa assenza. Il dataset deduplica evento/taxon/giorno; il calcolo controlla nuovamente qualità, data e duplicati. La finestra termina al giorno valutato, senza osservazioni successive e senza date future rispetto alla consultazione. Le previsioni ammettono oggi + 7 giorni: un'osservazione può scadere durante questo orizzonte.

La specie deve avere un modello in `SPECIES`, non soltanto una scheda nel catalogo. Il luogo deve essere risolto a una zona pubblicata. Nessuna propagazione da provincia/regione a tutti i boschi. Voci pending, escluse, sentito dire, previsioni e date non risolte non entrano nella priorità.

Community ed esterno non si moltiplicano: prevale il moltiplicatore più distante da 1; in parità prevale la community. Questo conserva il tetto complessivo di ±10% ed evita doppio peso fra le due serie. Fra specie vale la stessa selezione del segnale più forte, senza somma dei bonus. App: `fieldRank` nelle graduatorie home e mappa; un cambio preferenze/giorno ricalcola. Gli aggiornamenti di rete preservano l'ordine delle proposte già lette come già previsto dal prodotto. Il dettaglio della zona mostra la componente esterna. Se il servizio manca o ha più di 10 minuti, il client torna a moltiplicatore esterno 1. Il refresh è ogni 2 minuti mentre l'app è visibile.

Il registro/API `/engine` resta il dataset di evidenze, senza punteggio incorporato (`rankingEffect:none`). È `/impact` a documentare l'applicazione della politica. `externalFieldEvidence` nel modello biologico resta informativa; l'integrazione numerica è nell'ordinamento pratico, non in `scoreSpecies`.

## Dashboard

Redazione → Dashboard → Registro delle segnalazioni → **Quali segnalazioni incidono?**

- Giorno della previsione, finestra, politica/revisione e ora di lettura.
- Usate nel segnale, evidenze senza effetto, escluse dal giorno.
- Per ogni coppia zona/specie: presenze, ricerche a vuoto, eventi, giorni, moltiplicatore e variazione della priorità relativa (100 come base normalizzata, non indice).
- Tutte le voci con motivo puntuale e apertura dell'editor; filtri per stato d'uso.
- Confronto di un calcolo: l'utente fornisce indice/priorità iniziali e componente community. Il risultato usa lo stesso calcolo dell'app. È dichiarato come confronto su input forniti: non ricostruisce una previsione meteo, un ordine completo o le preferenze personali.

Dati iniziali il 20 ottobre: nessun segnale esterno attivo. Le due presenze ammesse con zona/taxon sono del 29 settembre; una sola specie ha un modello. Le altre voci rimangono consultabili con i motivi. Non si creano osservazioni recenti fittizie per mostrare un effetto.

Una lettura retrospettiva usa il registro revisionato al momento della richiesta, non uno snapshot delle conoscenze disponibili alla vecchia data. Non è un backtest fuori campione.

## API degli agenti

Autenticazione esistente: `Authorization: Bearer <credenziale CMS>`. Nessuna chiave condivisa in repository. L'amministratore crea chiavi con scadenza e revoca da **Accesso degli agenti**, selezionando la sezione **Segnalazioni esterne e analisi del motore** (`external-observations`). Non servono scope `admin` né accesso agli altri contenuti.

| Operazione | Metodo e percorso dopo `/api/cms/v1/` | Permessi della credenziale |
|---|---|---|
| Ricerca/pagine | GET `external-observations?q=&source=&status=&page=0` | read + risorsa |
| Scheda e storico | GET `external-observations/:id` | read + risorsa |
| Schema/campi e enum | GET `external-observations/schema` | read + risorsa |
| Dataset deduplicato | GET `external-observations/engine` | read + risorsa |
| Uso/motivi/moltiplicatori | GET `external-observations/impact?day=2026-10-20` | read + risorsa |
| Confronto numerico | POST `external-observations/evaluate` | read + risorsa |
| Inserimento | POST `external-observations` | write + risorsa; review per stato diverso da pending |
| Revisione | PATCH `external-observations/:id` | write + risorsa; review per accettare/escludere o modificare una voce già accettata/esclusa |

Il confronto POST è in sola lettura, quindi disponibile anche alle credenziali read. Le mutazioni conservano `{data,reason,version}` e lo storico atomico, attore `agent:<id>`, conflitto 412 e fonte duplicata 409. Le chiavi revocate/scadute danno 401; permessi insufficienti 403; input errato 422. Origine browser estranea respinta. Nessuna concessione automatica di credenziali agli agenti. GET schemas scopre anche questi percorsi. API private `no-store`; limite richieste CMS esistente.

Esempio in Python, token fornito dall'ambiente, mai stampato:

```python
import os, requests
base = 'https://fungaroli.zatteo.workers.dev/api/cms/v1/external-observations'
session = requests.Session()
session.headers['Authorization'] = 'Bearer ' + os.environ['FRONDA_AGENT_TOKEN']
r = session.get(base + '/impact', params={'day':'2026-10-20'}, timeout=30)
r.raise_for_status()
impact = r.json()  # records[].used/status/reasons; groups[].multiplier
r = session.post(base + '/evaluate', json={
    'day':'2026-10-20', 'zoneId':'vallonina', 'taxonIds':['edulis'],
    'baseIndex':7.2, 'basePriority':72, 'communityMultiplier':1
}, timeout=30)
r.raise_for_status()
comparison = r.json()  # inputOrigin: caller_supplied_baseline
```

Esempio di scrittura dopo aver letto scheda e schema:

```python
r = session.get(base + '/' + observation_id, timeout=30)
r.raise_for_status()
row = r.json()
row['data']['summary'] = verified_summary
r = session.patch(base + '/' + row['id'], json={
    'data':row['data'], 'version':row['version'],
    'reason':'Chiarimento verificato nella fonte originale'
}, timeout=30)
r.raise_for_status()  # su 412 rileggere e confrontare, senza retry cieco
```

Il client pubblico riceve GET `/api/forecast/v1/external-signals`: aggregati idonei per oggi e i prossimi 7 giorni, politica e timestamp. Nessun testo, fonte, identificatore di record/evento o dato account. Non aggira la reciprocità dei contributi Fronda: contiene soltanto il segnale esterno separato. Un altro agente può usare questa lettura pubblica per il moltiplicatore; per fonti, motivi, modifiche e storico usa le API autenticate.

## Verifica

Test mirati con SQLite: ruoli umani, scope/risorsa agenti, accettazione, modifica di voci accettate, revoca, audit, conflitti, schema, calcolo e input, deduplicazione, soglie, bilanciamento, scadenza anche nel futuro, scala, specie senza modello, tetto combinato, stato reale senza effetti e payload pubblico senza identificatori. Gli esempi numerici nei test sono fixture, mai inserite nel DB online.

## Registro delle fonti per i passaggi futuri

Otto fonti iniziali in D1: quattro gruppi Facebook effettivamente consultati (anche i due senza osservazioni importate), tre query iNaturalist e FungoCenter. La migrazione `0011_external_sources.sql` conserva registro e storico. Il seed deriva dalla raccolta del 20 ottobre, con query originali e conteggi letti/totali: non è una nuova scansione. Le modifiche non sono sovrascritte dai deploy.

Dashboard: **Fonti da ricontrollare e punti di ripresa**. Ogni fonte ha link principale, tipo, territorio, modalità d'accesso, query, ultima data dichiarata, link di ripresa, cursore/punto raggiunto, copertura letta, note e stato active/paused/unavailable. Si possono aggiungere fonti, registrare il passaggio successivo e rileggere lo storico con motivo/versione/attore. Il cursore iniziale resta vuoto dove non esiste un punto incrementale verificabile. Per iNaturalist si conserva la query esatta; il prossimo giro richiede aggiornare d2 e sovrapporre le ricerche per intercettare modifiche e identificazioni tardive. I gruppi Facebook conservano anche l'esito senza nuovi dati, senza trasformarlo in assenza biologica.

Stesse credenziali e risorsa `external-observations`:

- GET `/api/cms/v1/external-observations/sources` → elenco e campi con lunghezze.
- GET `/api/cms/v1/external-observations/sources/:id` → scheda e storico.
- POST `/api/cms/v1/external-observations/sources` → `{data,reason}`.
- PATCH `/api/cms/v1/external-observations/sources/:id` → `{data,version,reason}`.

Lettura richiede read, inserimento/modifica write. Registrare la consultazione non accetta automaticamente osservazioni e non modifica l'indice o la politica. Non viene configurata un'automazione né una nuova raccolta periodica. Il registro documenta quanto dichiarato dall'operatore; non prova che sia stata visitata una fonte solo perché è stata aggiornata la data.

## Ricerca Gemini ricevuta durante il lavoro

Link condiviso: https://share.gemini.google/z4ReGN7GiwP2. Lette entrambe le tabelle: 24 proposte, consolidate in 20 voci da revisionare raggruppando fonti ripetute e le due versioni dello stesso paper. Un secondo seed con ricevuta separata conserva lo stato pending e non sovrascrive le correzioni. Con la discussione aggiuntiva di Tolfa il registro passa a 109 voci; l'export idoneo resta 32. Il registro delle fonti comprende anche i riferimenti di queste proposte e il link alla ricerca, distinguendo una fonte segnalata da una realmente consultata.

Verifiche primarie del 20 ottobre:

- Paper IMA Fungus, https://pmc.ncbi.nlm.nih.gov/articles/PMC12179652/: Gemini attribuisce GS10842 a Roma e GS10226 a Manziana. Nel testo GS10842 è invece la raccolta di Agordo che precede la voce Lazio; GS10226 precede a sua volta la voce Manziana. Non importare quelle combinazioni codice/località come fatti. Le date e i veri codici delle raccolte laziali sono nel paragrafo successivo e richiedono estrazione puntuale, distinta dalla pubblicazione del paper nel 2025.
- AMINT, https://www.funghiitaliani.it/topic/30336-asterophora-lycoperdoides-bull-ditmar-1809/page/2/: verificata una raccolta a Fondi di novembre 2020, pubblicata il 15 marzo 2022; il giorno dell'osservazione non è risolto.
- Funghimagazine, https://funghimagazine.it/aggiornamento-nascite-funghi-16-10-2026/: verificato il contesto previsionale. Il riferimento alle piogge attese nel Lazio è anche nella risposta editoriale del 18 ottobre; non è un ritrovamento. Il commento sulla media/bassa Sabina descrive l'attesa di pioggia, senza uscita strutturata.
- Una ricerca aggiuntiva trova Natura Mediterraneo TOPIC_ID=354732: post del 17 ottobre 2026, Tolfa, ma titolo «2121 Ottobre vecchio ritrovamento» e determinazione solo proposta. Pubblicazione recente non equivale a osservazione recente. Nessuna data dell'uscita ricostruita.

La dichiarazione di Gemini di non avere trovato presenze nel 2026 non annulla i record iNaturalist della raccolta precedente: coperture e metodi di ricerca sono diversi. Non è dimostrata un'assenza di osservazioni né un'assenza biologica nel Lazio.

Verifiche di consegna: 25 test mirati passano; unitari completi 322/334 prima dell’aggiunta dei seed successivi, con gli stessi 12 errori della produzione di partenza e nessun errore nuovo. UI locale sul Worker sorgente e SQLite: confronto indice/priorità, giorno storico, salvataggio e rilettura di una fonte con cursore; nessun overflow a 320/390/1280. Il registro finale delle fonti comprende 32 voci.
