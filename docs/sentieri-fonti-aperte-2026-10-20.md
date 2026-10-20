# Sentieri aperti e riferimenti esterni · 20 ottobre 2026

## Rilascio

L’indice fungino si presenta come **Condizioni di crescita** in copertine, schede, mappa, suggerimenti, grafici e testi accessibili. Formula, scala 0–10 e pesi restano invariati. Nel dettaglio si mantiene la natura sperimentale e l’assenza di misure dell’accuratezza sui ritrovamenti locali. Non è una probabilità né una conferma della presenza di funghi. Il contesto botanico resta una misura distinta.

## Primo lotto, circoscritto

Tre relazioni OSM, quattro occorrenze nel catalogo: [404](https://www.openstreetmap.org/relation/10645640), [405](https://www.openstreetmap.org/relation/10645560), [403](https://www.openstreetmap.org/relation/10645472). Sono stati controllati identità, segnavia, operatore, difficoltà, durata e salita dove disponibili. Le geometrie già presenti sono conservate: `geometryReacquired:false`. La data di consultazione (20 ottobre) è distinta dalle date/versioni degli oggetti OSM. Non è una verifica sul terreno né un aggiornamento integrale del catalogo.

Tre punti in Vallonina/Sella di Leonessa, con identità, posizione di riferimento, tipo, versione/data OSM e consultazione:

- [Parcheggio mappato presso Sella di Leonessa](https://www.openstreetmap.org/way/132609641), ultimo aggiornamento OSM 8 ottobre 2011; accesso, tariffe e apertura attuale sconosciuti.
- [Rifugio Angelo Sebastiani](https://www.openstreetmap.org/way/441925375), ultimo aggiornamento OSM 9 maggio 2026.
- [Rifugio Maiolica](https://www.openstreetmap.org/way/501081019), ultimo aggiornamento OSM 16 giugno 2017.

I punti degli edifici/aree sono posizioni rappresentative, non ingressi automobilistici verificati. Lo stato `mapped` e `liveAvailability:null` non attestano disponibilità. Nessun bonus all’indice. Il renderer mostra OSM e licenza [ODbL](https://www.openstreetmap.org/copyright).

I due vecchi punti chiamati parcheggi coincidevano con i rifugi. Sono stati rimossi dai parcheggi, conservati nella ricevuta e sostituiti con l’area OSM classificata come parcheggio. Tempi/distanze fissi e percorsi automobilistici derivati dai vecchi obiettivi sono stati ritirati, non trasferiti automaticamente al nuovo punto. Gli imbocchi dei sentieri restano separati dalle soste; la rete stradale mappata non autorizza il transito.

## Collegamento non significa fonte dei dati

Per il 404 sono presenti due riferimenti editoriali:

- [CAI, SI O15](https://sentieroitalia.cai.it/track/si-o15/): tappa distinta che utilizza il 404; non si trasferiscono distanze o tempi.
- [Altro itinerario su Wikiloc](https://it.wikiloc.com/percorsi-escursionismo/sella-jacci-e-selletta-di-pratorecchia-da-rifugio-sebastiani-211730293), autore pubblico fb1947: sovrapposizione parziale e passaggi fuori sentiero esplicitati. Si conserva URL, autore e nota originale della redazione. Nessuna geometria, foto, descrizione o statistica copiata da Wikiloc.

Il riferimento Komoot smarttour/28487608 rispondeva 410: escluso. Nessun collegamento inventato a una scheda equivalente.

I collegamenti rimandano a pagine pubbliche consultate; nessun aggiramento di accessi, embed, logo o implicazione di partnership/verifica del servizio. L’attribuzione non concede diritti di copia. Contesto giuridico: [Svensson](https://curia.europa.eu/jcms/upload/docs/application/pdf/2014-02/cp140020en.pdf), per contenuti liberamente accessibili autorizzati, e [GS Media](https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf), sull’origine illecita e la conoscenza. Si mantengono separati diritti sui dati e link editoriale; [termini Wikiloc](https://www.wikiloc.com/wikiloc/terms_en.html), [termini Komoot](https://www.komoot.com/terms-of-service).

## Consultazione, modifica e agenti

La redazione modifica `relatedLinks` e note editoriali del documento `trails`. Ogni link richiede provider, URL HTTPS specifico, etichetta, relazione (`official_context`/`partly_overlapping`), nota, consultazione e stato (`pending`/`reviewed`); autore facoltativo. Solo i riferimenti revisionati sono resi pubblici. Un cambiamento ai link richiede la conferma di revisione prima della pubblicazione. Provenienza, punti e geometrie generati rimangono protetti dal CMS.

Gli agenti usano lo stesso contratto: GET/PATCH `/api/cms/v1/items/trails`, validazione POST `/api/cms/v1/items/trails/validate`, revisioni, pubblicazione POST `/api/cms/v1/releases` con permessi dedicati e `reviewed:true` quando richiesto. PATCH richiede `If-Match` della revisione letta. Lo snapshot pubblico `/api/content/v1/snapshot` espone `resources.trails`, `resources.zones` e `resources.access`, inclusi punti, fonti e collegamenti: nessun dato geografico utente.

`tools/import_trail_pilot.py` usa solo acquisizioni locali, verifica i conflitti e produce una ricevuta; `--apply` aggiorna i tre dataset, in modo idempotente. Le fonti da ripassare sono gli URL/ID versionati; hash e vecchi obiettivi ritirati sono in `incoming/trails-open-2026-10-20/receipt.json`. Incoming è escluso dagli asset web. Le due query Overpass fallite sono documentate: nessuna conclusione di assenza di servizi. Le due piccole aree OSM API sostitutive sono delimitate e prive di attributi identificativi dei mapper nel materiale locale.

## Verifiche e limiti del rilascio

- Nove test mirati passano: identità/provenienza, separazione date, correzione parcheggi, link/HTML/HTTPS, riservatezza dei punti, blocchi CMS e revisione, coerenza delle lunghezze e versione shell.
- Suite generale: 345 test, 333 superati e 12 errori preesistenti, stessi casi della produzione f287dcb. Nessuna nuova regressione rilevata.
- Dry-run Wrangler, guardia design system, controlli del kit e diff: superati.
- Rapporto asset: nessuna incoerenza immagini/dati né asset da rifare; questo lotto non richiede nuove illustrazioni. Le pendenze del catalogo restano quelle del rapporto generale.
- La suite browser con Wrangler locale non parte: `spawn EBADF` nel servizio esbuild/Workerd. Verifica UI supplementare su Worker originale con SQLite locale, distinta dalla suite completa Cloudflare.
- Pubblicazione richiesta da Matteo con i limiti già documentati nella conversazione. La verifica live viene registrata separatamente dall’esito dei test locali.

## Revisione visiva richiesta durante la verifica

Fonti in una riga, riferimenti esterni come azioni distinte e note/date in «Fonti e dettagli»; avvertenza fuori sentiero sempre visibile. I punti utili hanno icona e apertura diretta della fonte. «Come arrivare» ha minimappa OSM del punto pubblico d’arrivo e CTA per navigatore/mappa; avvertenze estese apribili. Il taccuino separa le CTA dalla spiegazione illustrata della condivisione; l’effetto delle fonti sta nel dettaglio del metodo.

Un solo caricamento globale fino al primo contenuto utilizzabile, con suggerimento sul valore delle ricerche a vuoto. Il blocco obbligatorio prima dell’accettazione resta attivo. La settimana espone il raggio dichiarato della zona della proposta migliore (non un nuovo filtro né copertura continua del territorio). La copertina usa una filigrana del tracciato reale e le schede senza foto hanno un’anteprima della geometria disponibile. Giorno e meteo occupano spazi separati anche nelle card senza immagine.

## Tempo auto, cammino e percorso dell’uscita

Audit documentale: 202 voci/162 relazioni; 154 durate importate dalla relazione intera, di cui119 con lunghezza locale diversa. 35 lunghezze arrotondate coincidenti,33 con una polilinea: candidati, non uscite complete certificate. 32 voci hanno più polilinee; in23 la connessione tramite vertici condivisi non è dimostrata. 89 voci non hanno imbocco catalogato. 24 rotte auto in19/36zone. Nessuna catena completa parcheggio → raccordo → sentiero → ritorno è stata verificata.

Il tempo auto viene ora associato alla rotta di accesso più vicina all’imbocco selezionato e al suo endpoint effettivo, distinto dal nome del parcheggio: non al primo accesso indistinto o a un’intersezione stradale promossa automaticamente a parcheggio. In assenza di rotta non si riusano minuti riferiti a un altro punto. «A piedi —» indica durata dell’uscita non definita. Non si scala il tempo dell’intero per rapporto di chilometri e non si usa più la durata dell’intero per sottrarre ore al tramonto del tratto locale.

Primo tempo fonte controllato: [CAI324 Ascrea–Mirandella–Fonte le Forche](https://www.openstreetmap.org/relation/11098449), OSMv8 del18luglio2024; [fonte istituzionale](https://www.parchilazio.it/montinavegnacervia-schede-18437-334_ascrea_mirandella_f_te_le_forche_cai):3,5km,2ore di andata, dalla scalinata presso il cimitero di Ascrea. Quattro membri OSM ricomposti in una catena di221nodi; estremi locali entro0,48m/0,17m, scarto dei vertici fino14,9m coerente con la semplificazione15m del catalogo. L’evidenza è fissata alla firma della geometria revisionata: una modifica la invalida. Parcheggio a22,8m ma raccordo non verificato; imbocco catalogato più vicino a171m. Le1h30 del ritorno sono solo un tag OSM, non un ritorno verificato: non si pubblica un totale dell’uscita.

`wholeTrailEvidence` e `outingAssessment` sono dati generati protetti nel CMS e pubblici nello snapshot `resources.trails`. Separano durata dell’intero, geometria, raccordo, ritorno e verifica sul terreno. `tools/audit_outing_routes.mjs` aggiorna gli stati senza promuovere automaticamente le uscite o rinnovare la verifica della geometria del324. `js/outing-route.js` fornisce la stessa valutazione al renderer. Fonte CAI sul calcolo dei tempi: [manuale Luoghi](https://luoghi.cai.it/manuale/scr/lettura_file_gpx.htm); non applicata a campioni altimetrici concatenati senza coordinate/segmenti.

Verifiche aggiuntive:16test unitari mirati superati (inclusi ricevute e associazione del percorso auto);7controlli browser sulle UI effettive con Worker originale e SQLite locale superati (320/390/1280, chiaro/scuro, tooltip, avvio/consenso, accessi, fonti, privacy). Sono supplementari: non sostituiscono la suite completa Workerd bloccata dall’ambiente.

Esito finale prima della pubblicazione: 349test unitari,337superati,12errori già presenti;16test mirati superati. Gli8test browser supplementari passano. Anche le CTA dei sentieri distinguono ora arrivo in auto da punto sulla traccia; il badge «comodo» non viene attribuito al raccordo non verificato.
