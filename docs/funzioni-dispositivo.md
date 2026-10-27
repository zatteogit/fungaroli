# Nel bosco: funzioni del dispositivo

Decisione di Matteo, 27 ottobre 2026: sfruttare le capacità della web app con permessi contestuali e registrazione facoltativa. Implementazione per capacità disponibili, senza derivare i permessi dal nome del sistema operativo.

## Preparazione offline

Dalla pagina dell’uscita, **Salva offline** nel pannello compatto «Per il bosco» conserva sul dispositivo una copia pubblica del luogo, della traccia selezionata, delle regole regionali e dei vincoli del luogo, delle schede selezionate con foto, cautele, sosia e crediti, e del meteo disponibile con acquisizione originale. L’archivio usa IndexedDB; ogni copia ha una cache dedicata, esclusa dalla pulizia delle nuove shell. Non include note private o dati della community.

La copia diventa pronta solo dopo aver conservato tutti i file necessari. Un download fallito elimina la cache temporanea e mantiene la copia precedente. La protezione dalla liberazione automatica dello spazio è richiesta al browser; un diniego non diventa una falsa conferma. La pagina `offline.html` ha un lettore indipendente, raggiungibile anche dal Taccuino, senza avviare meteo e community. Le copie si eliminano dall’elenco offline.

La traccia è schematica, con nord in alto, segmenti separati e attribuzione OSM. Non si scaricano tessere dei fornitori in blocco. Non dimostra accessibilità, raccordi, ritorno o apertura del sentiero. Il GPX contiene soltanto le geometrie pubbliche, senza il punto dell’utente; si può condividere tramite il sistema se supportato, altrimenti si scarica.

## Foto e posizione privata

Nel compositore rapido, la raccolta fotografica resta distinta dalla cattura con fotocamera posteriore sui dispositivi touch. Preparazione e rimozione dei metadati delle fotografie mantengono il percorso esistente.

**Usa la mia posizione** registra un punto facoltativo nell’appunto, con precisione e acquisizione. È privato nel taccuino, sincronizzato nel proprio archivio se si usa un profilo; i payload della community e della ricerca non lo contengono. Si può rimuovere modificando la nota. Le richieste tardive non si applicano a una nota nuova o già chiusa. Il comando nel lettore offline usa il punto soltanto nella vista e non lo salva.

## Schermo acceso

Il comando compare sotto «Altri strumenti» nell’uscita, nella mappa e nel lettore offline. Il wake lock viene richiesto al clic, rilasciato al cambio di rotta o uscita dalla pagina, e richiesto nuovamente al ritorno in primo piano solo se l’utente lo aveva attivato. Il sistema può negarlo o revocarlo. Stato, messaggi e controlli restano sincronizzati anche dopo i ridisegni del meteo. Non è un GPS in background.

## Avvisi per l’uscita

Il comando si trova sotto «Altri strumenti» nell’uscita. Opt-in indipendente per zona e giorno: nessun profilo, consenso alla ricerca o richiesta automatica del permesso. iPhone richiede l’apertura dalla schermata Home. Gli avvisi seguono l’aumento del livello meteo esistente in `outingFor`, solo con dati freschi e disponibili; non introducono soglie scientifiche e non sono allerte ufficiali o un servizio di sicurezza.

Il server conserva la sottoscrizione tecnica del dispositivo, il token di gestione in forma hash, la zona e il giorno, senza GPS, profilo o testo delle note. Dieci uscite al massimo per dispositivo; limitazione delle richieste senza conservare l’IP in chiaro. Revoca protetta dal token del dispositivo. I giorni trascorsi vengono eliminati; le iscrizioni tecniche scadono entro 30 giorni, anche prima se non hanno più uscite.

Invii Web Push cifrati `aes128gcm` con VAPID e un claim D1 contro cron sovrapposti. Endpoint limitati ai servizi push noti, niente redirect e timeout. Risposte 404/410 eliminano la sottoscrizione. Ogni push ricevuto produce una notifica visibile e il clic apre soltanto una rotta Fronda consentita. Il cron riusa la cache meteo acquisita dal server, senza chiamate aggiuntive al provider.

Segreti necessari: `PUSH_PUBLIC_KEY` e `PUSH_PRIVATE_KEY`, configurati con Wrangler e mai nel repository. Nessun binding nuovo.

## Verifiche e limiti

Test unitari su coordinate, esclusione dai dati condivisi, risorse offline, escaping, GPX e protocollo push con D1 SQLite e crittografia reale. Prove browser con service worker reale, rete disattivata, dati meteo sintetici, GPS e permessi simulati; nessuna richiesta di permessi personali o invio a destinatari reali durante il collaudo. La consegna effettiva delle notifiche su iPhone/Android e il comportamento dello schermo con risparmio energetico richiedono anche un collaudo fisico.

Fonti: [MDN Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [MDN geolocalizzazione](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition), [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [archivi offline](https://web.dev/learn/pwa/offline-data), [regole delle tessere OSM](https://operations.osmfoundation.org/policies/tiles/), [libreria Web Push e protocolli](https://github.com/block65/webcrypto-web-push).
