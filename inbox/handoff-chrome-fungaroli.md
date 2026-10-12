# Handoff: sessione Chrome → agente principale (Fungaroli Rieti)

Data: 12/10/2026 · Repo: `zatteogit/fungaroli` · Branch: `claude/brave-tesla-wu0a2b`

## 1. Stato del branch

| Commit | Autore | Cosa |
|---|---|---|
| `153f436` | sessione Chrome (upload web, con conferma di Matteo) | `inbox/README.md` + 5 foto dei sosia. Solo `inbox/`, nessun altro file. |
| `e131e90` | agente principale | testi legali, `docs/legale.md`, `data/legal.json`, note sulle aree protette |
| `7a0575e` | agente principale | ha integrato `inbox/`: orari ASL, foto in `assets/species/`, tossicità, preprint v2, nota sulla licenza della Carta Forestale |

**Non committato:** la patch `fix-fonti-7a0575e.patch` (sezione 2). L'upload web di un secondo commit è stato bloccato dal sistema di sicurezza. Inoltre l'agente principale sta scrivendo sullo stesso branch, quindi è meglio che la applichi lui.

## 2. Patch da applicare: `fix-fonti-7a0575e.patch`

- **Base:** `7a0575e`. Applicare con `git apply fix-fonti-7a0575e.patch` (verificato con `git apply --check`).
- **Test:** `npm test` passa 24 su 24.
- **Contenuto:** solo testi e fonti, nessuna modifica alla logica.
- **File toccati:** `README.md`, `docs/guida-uso.md`, `docs/metodo-scientifico.md`, `docs/dati-e-architettura.md`, `docs/legale.md`, `data/species-traits.json`.

| # | Modifica | File |
|---|---|---|
| 1 | Le citazioni "AMER 2025" sostituite con gli articoli della L.R. 32/98, testo vigente: art. 3 c.1 (3 kg), art. 3 c.2 (taglie, verdone compreso; il c.2 bis esclude alcune specie), art. 4 c.1 lett. b (contributo), art. 9 cc.1-4 (orari, contenitori, attrezzi, pulizia), art. 10 cc.1-3 (divieti di luogo). | README, guida-uso, metodo-scientifico |
| 2 | Preprint: tolto il link alla v1 e la nota "verificato sull'abstract". Ora c'è un'unica citazione della **v2 dell'8/6/2026**, con la nota che la v1 usava finestre di 5 giorni e un ottimo di 13,2 °C. | README |
| 3 | ASL, tabella 3.2: orari **lun–ven 8:30–9:30**, sportello di Antrodoco "non più elencato", prenotazione "non citata". Prima la tabella riportava ancora i dati del Ministero del 2024 e contraddiceva la nota "Aggiornamento" sotto. | legale.md |
| 4 | ASL: il paragrafo con i dati del 2018 è sostituito dai dati della pagina 2026. | guida-uso.md |
| 5 | `general_rules[0]`: tolto "sede anche ad Antrodoco"; la fonte passa dal mirror `aslrieti.dev.laserromae.it` alla pagina ufficiale ASL. "Gratuito per i privati" resta, con la fonte del Ministero della Salute già citata in legale.md. | species-traits.json |
| 6 | Duchessa: il punto "Non verificato" diventa un dato verificato (vedi sezione 3). | legale.md 2.2 |
| 7 | Carta Forestale: aggiunta la nota sul conflitto di licenza (vedi sezione 3). Nella sezione licenze di legale.md non ho toccato nulla, perché il tuo paragrafo "Aggiornamento" la copre già. | dati-e-architettura.md, README |

## 3. Fatti verificati in questa sessione (12/10/2026)

**ASL Rieti, Ispettorato Micologico** — https://www.asl.rieti.it/organizzazione-aziendale/dipartimenti-aree-e-staff/dipartimento-della-prevenzione/uosd-igiene-degli-alimenti-e-della-nutrizione/ispettorato-micologico/
- Pagina modificata il 24/09/2026 (`article:modified_time`).
- Contenuto: Blocco 4, Via del Terminillo 42; lun–ven 08:30–09:30; tel. 0746 279801; ispettoratomicologico@asl.rieti.it.
- Non dice nulla su prenotazione, periodo stagionale o sede di Antrodoco.
- Corso per l'attestato gratuito: 12–23 ottobre 2026, iscrizioni chiuse.
- Il vecchio URL `.../dipartimenti/dipartimento-di-prevenzione/...` restituisce 404.
- Da Chrome il sito si legge; da fetch automatico no.

**Carta Forestale, scheda metadati PDF** — https://dati.lazio.it/dataset/91a9cd67-1a41-4584-b611-960c65d82724/resource/5d8c5060-1242-4422-9e3a-52703cad54ce/download/metadaticartaforestalesubasetipologica.pdf
- Data di aggiornamento: dicembre 2012.
- Voce "Restrizioni d'uso": «La banca dati può essere utilizzata solo per fini non commerciali, previa citazione della fonte. E' vietata la distribuzione, la riproduzione, la traduzione, l'adattamento e ogni altra modifica».
- Conflitto: la risorsa SHP è dichiarata CC BY 4.0; dati.gov.it riporta `cc-by4`; la pagina del dataset dice "Nessuna licenza trovata".
- **Parere:** l'argomento dell'art. 52 c.2 del CAD usato in legale.md ("dati senza licenza espressa = aperti") è debole, perché qui una licenza espressa e restrittiva c'è. Serve una conferma scritta della Regione prima di ridistribuire `habitat.json`, `trails.json` e `assets/`.

**Duchessa, DCR 16/2021** (BURL 93/2021, S.O. 1) — https://www.parchilazio.it/documenti/schede/dc_2021_16.pdf
- Il dispositivo (pp. 8-9) approva Relazione, NTA, Schede interventi e 7 tavole. **Il Regolamento non è tra gli elaborati approvati.**
- Il testo del PDF ha caratteri sfasati di +29 code point. Dopo la decodifica, "funghi" compare una sola volta e in senso descrittivo ("produzioni non legnose (es. funghi)").
- **Interpretazione:** valgono le salvaguardie della L.R. 70/1990, art. 12 lett. m (raccolta solo con autorizzazione dell'ente). La decodifica potrebbe non essere completa: le NTA vanno controllate a mano.

**Gran Sasso-Laga, bozza di Regolamento 2019** (Delibera CD 50/2019, 13/12/2019) — https://www.gransassolagapark.it/albOnline/2019/PNGSLdocumento50629-allegato1.pdf
- Art. 16: vietata in zona a; nelle zone b, c e d riservata agli "aventi titolo rilasciato dagli enti competenti".
- Non è in vigore: non compare nella pagina "Regolamenti in vigore" (`pagina.php?id=17`).
- Tutto questo è coerente con legale.md 2.3; per la Laga fa fede legale.md.

**Preprint bioRxiv** (CC BY-NC 4.0, non revisionato)
- v1, 14/12/2025: finestra di 5 giorni; ottimo a 13,2 °C; nessuna fruttificazione sopra 17,5 °C con pioggia sotto 1 mm al giorno.
- v2, 8/6/2026 (https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2.full):
  - finestra di 20 giorni per la temperatura;
  - finestra di 26 giorni per la pioggia (26–32 nei due siti più produttivi);
  - ottimo "circa 13 °C" nel testo, 13,7 °C nella didascalia della Fig. 4;
  - fruttificazioni concentrate tra 10 e 15 °C e tra 2 e 4 mm al giorno;
  - nessuna soglia superiore di pioggia;
  - umidità del suolo non misurata;
  - **shock termico non trattato** (rilevante per il bonus "shock" del modello, che resta un'euristica).

## 4. Foto (`inbox/`, già integrate in `7a0575e`)

Tutte da Wikimedia Commons, 640 px. Autore, licenza e URL di ciascuna sono in `inbox/README.md` §1.
- **Neoboletus:** Grandmont, CC BY 3.0.
- **Pseudocraterellus:** Opioła, CC BY-SA 4.0.
- **Sarcodon:** caspar s, CC BY 2.0.
- **Chlorophyllum venenatum:** MM1994, CC BY-SA 3.0. È l'unica foto disponibile e non mostra la sezione; su iNaturalist il taxon non esiste.
- **Armillaria tabescens:** 00Amanita00, ritaglio di Ak ccm, CC BY-SA 3.0. Nell'attribuzione vanno citati entrambi.

**Da controllare:** *N. luridiformis* è commestibile se cotto, *P. undulatus* è commestibile, *A. tabescens* è commestibile se cotta. Il commit `7a0575e` dice "tossicità corrette": verificare che la scheda "Non confonderlo con" non le presenti come velenose.

## 5. Questioni aperte

1. Conferma scritta della Regione Lazio sulla licenza della Carta Forestale (Area Servizi Informativi Ambientali / Direzione Capitale Naturale).
2. Navegna-Cervia: contenuto della L.R. 28/1999 (PDF scansionato) ed eventuali aree vietate dall'ente; contatti info@navegnacervia.it, 0765 790002.
3. Duchessa: verifica manuale delle NTA e modalità dell'autorizzazione dell'ente; contatti riservaduchessa@regione.lazio.it, 0746 306493.
4. Gran Sasso-Laga: chiedere all'Ente Parco (0862 6052201) se esiste una disciplina sui funghi in vigore.
5. Delibere della Giunta Lazio sui giorni di raccolta (art. 11 c.2 bis L.R. 32/98): non trovate.
6. L.R. 32/98 art. 4 c.3 (5 autorizzazioni gratuite): l'art. 7 risulta abrogato dalla L.R. 1/2020, ma il comma 3 compare ancora nel testo coordinato. Verificare se è in vigore.
7. Endpoint WMS e WFS del geoportale: non verificati (risposte in errore).

## 6. Avvertenze operative

- La sessione Chrome non scrive più sul branch: tutte le modifiche successive spettano all'agente principale.
- `inbox/README.md` §2b, dove dice che le zone A del Gran Sasso-Laga non sono verificate, è superato da legale.md 2.3. Si può aggiornare o lasciare com'è, trattandolo come materiale grezzo.
- Il PDF dei metadati della Carta Forestale è finito per errore nella cartella Download di Matteo. Non serve al repo.
