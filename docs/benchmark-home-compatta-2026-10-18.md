# Home compatta · 18 ottobre 2026

Richiesta: ridurre la testata, eliminare data e titolo visibili e portare le proposte più in alto. Le dimensioni seguenti sono scelte di Fronda, non misure attribuite alle app di riferimento.

## Benchmark delle interazioni documentate

| Riferimento ufficiale consultato | Spunto | Applicazione a Fronda |
| --- | --- | --- |
| [Google Maps: categorie vicine](https://support.google.com/maps/answer/4610185?co=GENIE.Platform%3DAndroid&hl=en) | Categorie subito sotto la ricerca, altre categorie su richiesta. | Funghi, Piante e Sentieri restano sempre accessibili, nella stessa riga del comando Filtri. Restano scelte indipendenti. |
| [AllTrails: filtri](https://support.alltrails.com/hc/en-gb/articles/37227964040852-How-to-use-filters-to-find-trails) | Accessi rapidi e un pannello che raccoglie tutti i filtri; stato selezionato distinguibile. | Le preferenze pratiche si impostano in Filtri. Nella home appaiono solo quelle attive, rimovibili con un tocco; il conteggio resta sul pulsante. |
| [Apple Meteo: consultare le previsioni](https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26) | Previsioni scorrevoli e approfondimenti su richiesta. | Binario dei giorni a due righe, senza separare giorno e data in due grandi blocchi. Indice e meteo restano leggibili. |

Confronto dei percorsi descritti nelle guide ufficiali, non una misurazione comparativa di screenshot o una classifica di usabilità.

## Modifiche

- Titolo H1 e data conservati per accessibilità, senza spazio visivo dedicato.
- Una riga operativa da almeno 44 px: tre interessi e Filtri. Sotto 360 px il comando Filtri conserva icona e nome accessibile e nasconde solo la parola visibile.
- Preferenze inattive nel pannello esistente; nessuna seconda riga vuota. Le preferenze attive restano visibili.
- Giorni da almeno 64 px invece di 88: prima riga giorno/data, seconda indice/meteo. Settimana mantiene intervallo e indice.
- Stato di acquisizione e aggiornamento manuale del meteo sotto la prima proposta, ancora raggiungibili. L’avviso di dati scaduti non viene rimosso.
- Marchio mobile ridotto a 24 px, barra home a 52 px più safe area. Profilo, tema e informazioni mantengono i propri controlli.
- Dopo lo scroll è la riga dei filtri, non l’H1 invisibile, a far entrare la barra compatta con il comando Filtri.
- Cache dell’app aggiornata a v220.

Non sono stati eseguiti test automatici, come richiesto dal proprietario. Revisione del diff e dei selettori; resa Safari su dispositivo non verificata. Nessun dato, soglia dell’indice o algoritmo modificato.
