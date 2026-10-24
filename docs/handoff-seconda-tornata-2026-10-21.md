# Handoff della seconda tornata · 21 ottobre 2026

La seconda tornata è finita e unita alla produzione v319. Va in una sola PR verso `claude/brave-tesla-wu0a2b`, insieme alla prova offline sui porcini. Questo documento dice cosa c'è, cosa ha deciso Matteo e cosa resta aperto.

## Stato

- Ramo locale `lavoro-fase-b`, commit `a23cea0` («Unisce la produzione v319 nella seconda tornata»). Prima: `e8543fa` (costruzione), `d727b07` (unione con la v82), `f2e7083` (integrazione).
- Produzione di riferimento: `71608ba` (v319). Cache `fungaroli-shell-v320`, uguale in `sw.js` e `index.html`.
- Prova offline: ramo locale `lavoro-benchmark`, commit `ff52daf`, cartella `tools/benchmark-bielefeld/`. Entra nella stessa PR.
- **In corso** mentre scrivo (altro agente, file non ancora nel commit): salvataggio automatico delle previsioni (`js/forecast-autosave.js`), estensione di `tools/build_habitat_info.py` e `tools/build_access_info.py` alle zone del pilota Lazio, testo della privacy in `data/legal.json`. Va ricontrollato prima della PR.
- Documentazione aggiornata: [metodo-scientifico.md](metodo-scientifico.md), [dati-e-architettura.md](dati-e-architettura.md), [meteo-cache.md](meteo-cache.md), [legale.md](legale.md), [cms.md](cms.md), [ipotesi/README.md](ipotesi/README.md), [ipotesi/valutazione-modello-v3.md](ipotesi/valutazione-modello-v3.md) (sezione 10).

## Cosa è stato fatto

**Indice (modello 2.1.0).** Lo shock termico vale solo per porcino e porcino rosso. Conta un calo di almeno 5 °C della temperatura del suolo a 6 cm (Open-Meteo, dato di modello); il bonus ×1,15 vale da 6 a 15 giorni dopo e non si somma mai. Fonte: Olivier et al. 1997, Revue forestière française XLIX, doi:10.4267/2042/5671, osservazioni preliminari nella Francia sud-occidentale. Le altre 12 specie non hanno più il bonus (prima: calo di 4 °C dell'aria per tutte, ×1,225 per il chiodino). Codice: `soilDrop()` e `soilTemperatureShock()` in `js/model.js`, flag `soilShock` in `js/species.js`.

L'evidenza è debole e la documentazione lo dice: una sola osservazione preliminare; rischio di doppio conteggio con la pioggia; sovrapposizione con la curva sulla media dei 20 giorni; metà della fonte non implementata (un nuovo calo durante la buttata la ferma); temperatura del suolo da modello a 6 cm, non misurata a −10 cm.

**Effetto misurato** (Fatto verificato, 21/10/2026). Meteo reale delle 36 zone dalla copia del servizio meteo dell'app, dall'11 al 28 ottobre (10 giorni passati e 8 di previsione), confronto con la 2.0.0 della produzione:

| Misura | Valore |
|---|---|
| Combinazioni zona × giorno × specie calcolabili | 9.072 |
| Con indice diverso | 635 (7,0%): 632 scendono, 3 salgono |
| Con classe diversa | 160 (1,8%) |
| Porcino e porcino rosso con il bonus nuovo | 5 su 1.296 (Domo e Cittareale, calo di circa 5,8 °C il 27/09) |
| Porcino e porcino rosso con il bonus vecchio | 118 su 1.296 |
| Indice della zona (il migliore) diverso | 63 zone-giorno su 648 (9,7%); classe diversa in 24 |
| Differenza dove cambia | media 0,4 punti su 10, massima 1,6 (chiodino, Poggio Bustone / Cantalice, 27/10) |
| Cambi nei giorni da oggi in avanti | 565 su 635 |

Interpretazione: su questa serie quasi tutto il cambiamento viene dal bonus tolto, non dal nuovo. Sono 18 giorni di un solo autunno. Script nello scratchpad della sessione, non nel repository.

**Dati registrati, non usati.** Umidità del suolo tra 9 e 27 cm ed ET₀ FAO-56 entrano nel profilo meteo e nelle previsioni datate, non nell'indice. Il Worker accetta anche la query della v319 (`growthLegacy`), così le pagine già aperte non ricevono errori. Umidità giornaliera fuori da 0–1 = dato mancante anche nelle medie compatte.

**Previsioni datate.** Indice con e senza shock (`scoresNoShock`), fattori dello shock, 31 giorni di ingressi per fascia (`js/forecast-capture.js`). **In corso**: salvataggio automatico una volta per zona e giorno, all'apertura dell'uscita o alla creazione di un ricordo; senza account solo in locale.

**Bosco e aree protette.** `data/habitat-info.json` (struttura, pendenza, esposizione, ultimo disturbo da satellite, area protetta e zona del piano) e `data/access-info.json` (strada che non sia una pista, percorso a piedi, dislivello), con script in `tools/` e licenze nelle intestazioni. Si mostrano con la fonte e non pesano. Oggi descrivono le 15 zone del Reatino.

**Parco Gran Sasso-Laga.** I punti in zona A e B non si propongono come accesso o destinazione, per tutti gli interessi (Piano del Parco, Normativa di attuazione, art. 7, c. 7 e art. 8, c. 7). L'indice biologico non cambia. Nella Laga, alla fascia dei 1.600 m, tutto il bosco adatto è in zona B: la scheda lo scrive. Livello «Aree protette» della mappa dal WMS del Geoportale Lazio, indicativo: fa fede la cartografia dell'ente.

**Accessi.** Punto su una strada che non sia una pista; percorso a piedi su OSM con salita e discesa (TINITALY); tempo a piedi secondo il riferimento DIN 33466, convertito in metri equivalenti per la comodità. Fonti usate dal codice (`js/walks.js`, `dinHours`): DAV Sektion München & Oberland, *alpinwelt* 3/2024, «Grundwissen Beschilderung», e Bergwelten, «Wegzeitberechnung beim Wandern» (2021); il testo della norma non è stato letto. Frase «ultimo tratto fuori sentiero, da verificare» per 1.973 punti di bosco su 3.276. Imbocchi: 85 su 216 passati da «strada» a «sterrata».

**Uscite.** Fascia del sentiero ±150 m come il modello (OUT-11). Tempo della fonte non plausibile: «tempo della fonte da verificare» (OUT-02). OUT-03 (orari dopo le 14) resta alla logica della produzione (`js/planning-time.js`, `syncAutomaticDates`): la seconda tornata non lo cambia.

**Community.** La segnalazione condivisa si ritira anche quando cambia lo sforzo (minuti, cercatori, inizio).

**Prova offline sui porcini di Bielefeld.** Indice contro climatologia: +0,101 di AP stratificata, B [0,013; 0,226], J [−0,044; 0,245], «non distinguibile». σ 2,0 contro 3,5: −0,047, B [−0,127; 0,012], J [−0,135; 0,042], «non distinguibile». Nessun parametro cambiato.

## Decisioni di Matteo

- **16/10/2026.** Shock solo per porcino e porcino rosso, al massimo ×1,15, mai cumulato, etichetta Euristica e ultimo tra i fattori. Le informazioni sul bosco si mostrano e non pesano. Zone A e B del Gran Sasso-Laga escluse da accessi e consigli, con la frase per la fascia tutta esclusa. Tempo a piedi DIN come euristica dichiarata. Tempi della fonte sotto la metà del riferimento DIN non si mostrano (OUT-02). D1 archivio in `COMMUNITY_DB`; D2 ET₀ e 9–27 cm registrati; D3 sforzo in classi; D4 consenso separato.
- **21/10/2026.** D5 chiusa: `tsd` del porcino resta 3,5 dopo la prova offline. Previsioni datate salvate in automatico (in corso).
- **Punto di decisione per lo shock.** A fine della prossima stagione, con uscite del Taccuino che abbiano zeri espliciti, si confronta l'indice con e senza shock. Se la versione con shock non fa meglio, si toglie.

## Punti aperti

**OUT-03, lacune della v319 viste leggendo il codice** (non provate nel browser):

1. Dopo la fine della raccolta consentita (un'ora dopo il tramonto) la scheda dice solo «Orario consigliato superato» (in copertina «Orario superato»): non distingue «tardi» da «raccolta chiusa».
2. Il meteo dell'uscita è sempre la finestra della mattina (dall'apertura della raccolta alle 13, `outingFor` in `js/outing.js`): la sera si vede ancora il meteo della mattina di oggi.
3. `syncAutomaticDates()` riporta la home su oggi a ogni controllo dell'orologio, se il giorno non è stato scelto a mano; solo la mappa passa a domani quando l'orario consigliato è superato.
4. `walkTimeText()` in `js/app.js` mostra il tempo a piedi dei sentieri (da `assessWalkingRoute`) senza passare da `sourceTimeIssue()`: un tempo della fonte giudicato non plausibile nei dettagli può comparire come numero nella copertina e nelle card.
5. In `js/human.js` restano gli aiuti OUT-03 della seconda tornata (`todayGone`, `timingState`, `departureAdvice` e altri) con i loro test in `tests/human.test.mjs`, ma l'app non li usa. Da decidere: toglierli o usarli per i punti 1–3.

**Altro.**

6. **Altri parchi con zone di riserva non verificati.** L'esclusione vale solo per Gran Sasso-Laga. Navegna-Cervia ha zone A e B non digitalizzate. Le aree protette delle 21 zone del pilota Lazio (Castelli Romani, Simbruini, Veio, Circeo, Abruzzo-Lazio-Molise e altre) non sono state incrociate punto per punto. L'estensione degli script è in corso: le regole di esclusione nuove richiedono una lettura dei piani e una decisione di Matteo.
7. **Licenza delle zonazioni** sul Geoportale non indicata (`not_specified`): si pubblica solo il codice della zona per punto ([legale.md](legale.md), §8, punto 15).
8. **Prova offline e 2.1.0.** `valuta.py` controlla l'impronta di `js/model.js` 2.0.0 e con la 2.1.0 si ferma. La parte misurata non cambia; il controllo va aggiornato come deviazione dichiarata, se si vuole ripetere la prova dopo l'unione.
9. **Meteo storico vuoto.** Il 21/10/2026 la copia del servizio meteo aveva i primi 22 dei 62 giorni passati vuoti in tutte le 36 zone (il 15/10 erano 4). L'indice è calcolabile solo dall'11/10; le previsioni salvate hanno comunque 31 giorni. Da capire se è un limite di Open-Meteo o un problema temporaneo.
   **Aggiornamento del 24/10 (fatto verificato).** Era un buco di Open-Meteo, non della cache: la copia del Worker è la risposta di Open-Meteo così com'è. La copia della Tancia salvata il 23/10 alle 21:07 UTC aveva vuoti i giorni fino al 10/09, come quella del 21/10 (22 giorni a partire dal 20/08). Il 24/10 una copia nuova, dalla produzione e chiedendo direttamente a Open-Meteo, ha tutti i 62 giorni. *Interpretazione:* Open-Meteo ha colmato il buco; le copie vecchie si rinnovano entro un'ora dalla visita. L'indice non ne risentiva: usa al massimo 30 giorni passati.
10. **Quota di Open-Meteo.** Con 36 zone il tetto teorico con visite continue è circa 13.800 chiamate stimate al giorno, sopra il limite gratuito di 10.000 ([meteo-cache.md](meteo-cache.md#misure)). Durante il passaggio dalla v319 lo stesso luogo può essere rinnovato con due query.
    **24/10:** ancora aperto. Le misure vere sono nella dashboard admin (`weatherMetrics`, dietro login): servono chiamate pesate e picco orario di almeno due settimane, letti da Matteo.
11. **Da costruire:** archivio quotidiano delle previsioni (D1), consenso alla ricerca (D4). Lo sforzo (D3) è costruito dal 24/10 nell'appunto sul fungo ([ux-taccuino.md](ux-taccuino.md)).
12. ~~Il `README.md` del repository descrive ancora lo shock come «pratica micologica, non verificata»~~: allineato alla 2.1.0 il 24/10.
13. **Sentieri e tramonto (24/10, decisione di Matteo).** Piante e Sentieri restano sulla regola della mattina finché il tratto dal parcheggio all'imbocco non è verificato. Fatto verificato: su 202 sentieri solo uno ha andata e ritorno verificati e nessuno ha il raccordo dal parcheggio (`parkingStatus` mai `verified`). Una stima DIN 33466 senza raccordo sottostimerebbe il tempo e farebbe sembrare possibile una partenza tarda.

## Verifiche

Per questo documento: lettura di `git diff 71608ba HEAD` e dei file citati; DOI verificati su Crossref (Olivier 1997, Viana-Soto e Senf 2025, Cornes et al. 2018) e DataCite (TINITALY 1.1, EFDA v3.0.0, deposito Zenodo di Brejon); conteggi su `data/habitat-info.json` e `data/access-info.json` con le funzioni dell'app. Nessuna suite di test lanciata da chi ha scritto la documentazione.
