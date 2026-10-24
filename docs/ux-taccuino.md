# Taccuino: note e dati community Fronda

Un solo ingresso «Aggiungi una nota». Il primo passo distingue funghi, piante, alberi, uscita, luogo/sentiero, lettura e appunto libero. Le CTA sulle schede precompilano tipo e riferimento; se conoscono anche la zona passano direttamente all’osservazione. «Rimuovi collegamento», «Modifica» e «Cambia tipo» rendono reversibili le scelte. L’uscita mantiene la procedura per più specie, con ritorno alla scelta del tipo dal primo passo.

Le osservazioni sulle specie raccolgono campi chiusi: osservato / cercato ma non osservato / non indicato, quantità, ambiente, minuti, persone, quota. Quantità non indicata e ricerca a vuoto sono dati distinti.

**Appunto sul fungo: la ricerca (D3, decisioni di Matteo del 16 e del 24/10/2026).** Quando l'osservazione è «Osservato» o «Cercato, non osservato» compare il riquadro «La tua ricerca»:

- **Per quanto hai cercato?** Meno di 30 minuti / Da 30 a 60 minuti / Da 1 a 2 ore / Più di 2 ore. Obbligatoria solo con «Cercato, non osservato»: senza durata uno zero non si può confrontare con l'indice. Al posto dei minuti esatti, solo per i funghi.
- **Hai finito di cercare questa specie?** Sì / No, ho smesso prima. Distingue «cercato e non trovato» da «ricerca interrotta».
- **Perché hai smesso?** Tempo previsto finito / Ho trovato quello che cercavo / Meteo / Altro. Con una ricerca a vuoto «Ho trovato quello che cercavo» non si può scegliere.

Gli appunti salvati così hanno `protocolVersion` `fronda-field-note-v2` (`js/community-observation.js`). Gli appunti v1 restano validi come sono: i loro minuti si leggono nella classe corrispondente e la durata diventa obbligatoria solo se li modifichi. Classe, ricerca conclusa e motivo di fine entrano nella fotografia condivisa, se scegli di condividere. Il ricordo d'uscita non cambia (decisione del 24/10). Per le piante rimangono le fasi simultanee e la disponibilità dei frutti. Il nome della specie è dichiarato dall’utente, non verificato.

## Consenso e conservazione

«Condividi con Fronda» è uno switch visibile, spento nelle nuove note. Richiede profilo, specie di catalogo, zona, giorno passato o corrente e osservazione esplicita. Note libere e contesti incompleti restano privati. In locale si può annotare senza profilo.

Il server convalida i dati e ricava la fotografia strutturata dalla nota dell’utente autenticato, senza fidarsi di una fotografia inviata dal client. La migrazione `0007_shared_observations.sql` conserva contributi, versione del protocollo, consenso `fronda-community-v1` e data server. Testo libero, titolo, nomi privati dei luoghi e coordinate non fanno parte di questa fotografia. I vecchi appunti botanici non acquistano consenso tramite importazione.

Il riepilogo pubblico contiene soltanto conteggi per zona, categoria e specie e l’ultimo giorno, negli ultimi sette giorni. Le fotografie strutturate restano disponibili sul server per lo studio futuro dei modelli; sono dichiarazioni non verificate e non modificano automaticamente l’algoritmo. I report fungini preesistenti mantengono il proprio trattamento.

«Ritira dai conteggi» elimina il contributo conservando la nota privata. Ogni modifica ritira la fotografia precedente; lo switch consente di condividerne esplicitamente una aggiornata. Eliminare nota o profilo elimina anche i contributi collegati. «Invia una copia» è l’invio del testo tramite il dispositivo, distinto dalla condivisione strutturata.

## Home e mappa

Il filtro condiviso «Dati community Fronda» restringe alle zone con contributi recenti, anche botanici. È ricordato nel browser e contrassegnato «In sviluppo»: copertura limitata, nessun contributo dimostrativo. L’assenza di dati e l’indisponibilità del servizio hanno messaggi distinti, con «Mostra tutte le zone» per uscire dal filtro. Il filtro non aggiunge punti all’indice fungino.
