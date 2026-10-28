# Navbar durante lo scroll · 26 ottobre 2026

Revisione richiesta da Matteo prendendo come riferimento Vulcan. Esaminati il codice locale di `use-liquid-nav.ts`, `recipe-section-tabs.tsx`, `app-shell.tsx`, il preset `motionSpring.navigation` e lo studio `navbar-ricetta-mobile-2026-10-25.md`. Il comportamento è adattato alle quattro destinazioni di Fronda e all’azione separata Annota, senza introdurre React o dipendenze di animazione.

## Comportamento

- Scendendo oltre 140 px, dopo 28 px di movimento nella stessa direzione, la barra si compatta. Risalendo di oltre 20 px si riallarga. Sotto 96 px torna sempre estesa. Piccole inversioni non la fanno lampeggiare.
- Un’unica molla guida larghezza, altezza, spazi e dissolvenza delle etichette; un’inversione conserva posizione e velocità. Fisica del preset Vulcan: rigidità 360, smorzamento 31, massa 0,72. Nessuna scala o deformazione delle icone.
- Altezza mobile 64 → 56 px; larghezza compatta fino a 304 px, sempre limitata allo spazio disponibile. In orizzontale basso l’altezza resta 56 px. Area tattile minima osservata: 46 px su mobile, 44 px su desktop.
- Tutte le destinazioni e Annota restano presenti, con nomi accessibili completi. La geometria si ferma durante pointerdown e riprende dopo rilascio/cancel. Il focus da tastiera riallarga la barra. Con movimento ridotto il cambio è immediato.
- Scroll oltre i bordi limitato all’intervallo reale della pagina; rimbalzo e cambi del viewport non creano una falsa inversione. Cambi di contenuto, ritorni e navigazione risincronizzano lo stato. La mappa mantiene la barra estesa. La gestione esistente della tastiera resta attiva.
- La ricerca resta visibile nelle intestazioni compatte di home, schede e confronto. La pagina conserva lo spazio della barra estesa: il movimento non cambia altezza del contenuto né posizione di lettura.

## Costo durante lo scroll

L’header usa geometrie memorizzate e invalidate da ResizeObserver/cambio del contenuto. L’indicatore attivo mobile segue la griglia CSS senza misurare offset a ogni frame del morph. Gli aggiornamenti della molla scrivono una sola custom property sul dock; il layout è confinato alla barra e il ciclo si ferma a riposo.

Confronto sullo stesso percorso sintetico di 30 scroll, Chrome a 390×844, prima (`bc82f3c8`) e dopo:

| Letture sugli elementi dell’header | Prima | Dopo |
|---|---:|---:|
| getBoundingClientRect | 30 | 0 |
| offsetHeight | 30 | 0 |
| getComputedStyle | 30 | 0 |

Questi numeri riguardano gli elementi strumentati dell’header a geometria stabile, non tutto il layout interno del browser. Il morph modifica le dimensioni della piccola barra, senza promettere un’animazione composta soltanto dalla GPU.

## Verifiche

- 574 test unitari; dry-run Wrangler e `git diff --check`.
- 34 prove browser mirate: sticky header/home, ancoraggio e ripristino dopo tastiera, persistenza icone, titoli senza sovrapposizioni in entrambi i temi, confronto e aggiornamento della scheda con accordion/pannello aperto.
- Audit tramite Playwright CLI su Chrome e WebKit con emulazione iPhone 15: 12 scenari ciascuno (320×844, 390×844, 430×932, 768×1024, 844×390, 1280×900; chiaro/scuro). Controllati estensione/compattazione, ritorno, nomi, aree tattili, hit target, indicatore, overflow, ricerca, tap durante l’animazione, focus e movimento ridotto.
- Traccia sintetica Chrome delle inversioni: nessun Long Task osservato. WebKit non espone la stessa misura: non è usato per questa conclusione. Campionamento e geometrie sono registrati in `navbar-scroll-2026-10-26.json`.

Le API meteo sono simulate nelle verifiche locali. I test della tastiera usano geometria simulata; emulazione WebKit e tracce sintetiche non equivalgono a un collaudo su iPhone fisico o a una garanzia di frame rate. Suite browser completa non eseguita, secondo la regola di verifiche mirate del repository. Due selettori obsoleti dei test sono stati aggiornati: filtri della home al posto del vecchio titolo, ricerca nell’header al posto del pulsante già rimosso dal dock.
