# Percorsi auto e tempi a piedi · 20 ottobre 2026

All’apertura e al cambio della base, Fronda prepara i tempi auto verso gli accessi documentati delle zone e dei sentieri. Richieste in lotti di dieci destinazioni, origine privata ricavata dal profilo. La partenza predefinita Rieti conserva i percorsi già documentati nel catalogo.

Il client conserva i risultati nello spazio locale privato, con account, coordinate della base e destinazione. Cambio account, logout o cambio base eliminano la copia precedente. La cache Cloudflare usa una chiave hash per account/origine/destinazione: ordinare diversamente le card non invalida i singoli percorsi. Aggiornamento dopo sei ore; conservazione massima trenta giorni come ripiego con data originale e indicazione «da aggiornare». La Cache API può perdere le copie prima della scadenza; il client costituisce un secondo livello, non una garanzia di disponibilità.

Fonte stradale: OSRM/OpenStreetMap, senza traffico. Un risultato mancante non diventa una stima ricavata dalla distanza in linea d’aria. Nelle card la distanza aerea lascia posto a «Calcolo auto…», «Tempo auto non disponibile» o «Accesso da definire».

I tempi a piedi già documentati restano separati: andata, ritorno quando documentato e raccordo dalla sosta. Non sommiamo il tempo dell’intero sentiero a un percorso locale, né un raccordo non verificato. Il totale auto + piedi completo richiede ancora la verifica degli accessi e dei raccordi mancanti.

Caso Canneto: la coordinata della zona è il centro editoriale del riquadro della traccia O7, non una sosta. Nel catalogo non ci sono parcheggi o arrivi stradali documentati. Finché manca questo dato mostriamo «Accesso da definire»; non instradiamo verso il centro dell’area meteo.

Verifiche mirate: cache per destinazione indipendente dal lotto, ripiego con età originale, isolamento fra account, risposta tardiva dopo cambio base; servizio OSRM reale con due coordinate pubbliche di prova. Nessuna modifica alle osservazioni degli utenti.
