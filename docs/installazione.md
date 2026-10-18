# Installare Fungaroli come app: istruzioni per piattaforma

Verificato il 12/10/2026. Il codice è in `js/install.js` (`platform()` e `guide()`).

## Come si riconosce il caso
- **Safari su iPhone/iPad 26 e successivi congela la versione di iOS nel user agent a `18_x`** (WebKit bug 298473). La versione vera si legge da `Version/NN`: 27 → iOS 27, 26 → iOS 26, ≤18 → vecchio flusso.
- Chrome (`CriOS`), Firefox (`FxiOS`) ed Edge (`EdgiOS`) su iOS riportano la versione vera.
- iPad con Safari si presenta come Mac: `Macintosh` + `maxTouchPoints > 1`.
- Browser interni alle app (Instagram, Facebook, TikTok, LinkedIn, WebView Android `; wv)`, o iOS senza `Safari/`): da lì non si installa, si apre nel browser.
- Già installata: `navigator.standalone` (iOS) o `display-mode` standalone/fullscreen/minimal-ui.

## Passi (etichette italiane)
| Caso | Passi | Fonte |
|---|---|---|
| iOS 27 Safari | Menu della pagina (a sinistra della barra; o tieni premuta la barra) → Condividi → Aggiungi alla schermata Home (o Modifica azioni) → Apri come app web → Aggiungi | support.apple.com/it-it/guide/iphone/iphea86e5236/27/ios/27 |
| iOS 26 Safari | Altro (•••, a destra della barra) → Condividi → Aggiungi alla schermata Home → Apri come app web → Aggiungi | support.apple.com/it-it/guide/iphone/iphea86e5236/26/ios/26 |
| iOS ≤18 Safari | Condividi → Aggiungi alla schermata Home → Aggiungi | support.apple.com/it-it/guide/iphone/iph42ab2f3a7/18.0/ios/18.0 |
| iOS Chrome | Condividi (a destra della barra) → Aggiungi alla schermata Home → Aggiungi | support.google.com/chrome/answer/15085120 (iOS) |
| Android Chrome | prompt nativo; a mano: ⋮ → Installa e crea scorciatoia (Chrome 150+, prima "Installa app"/"Aggiungi a schermata Home") → Installa | support.google.com/chrome/answer/9658361 (Android); stringhe Chromium |
| Samsung Internet | ≡ → Aggiungi pagina a → Schermata Home → Aggiungi | community Samsung (confidenza media) |
| Firefox Android | menu → Aggiungi app alla schermata principale (forse sotto "Altro") | stringhe Firefox `values-it` (confidenza media) |
| Edge Android | … → Aggiungi al telefono → Installa | confidenza bassa |
| Chrome desktop | icona Installa nella barra, o ⋮ → Trasmetti, salva e condividi → Installa pagina come app… | support.google.com/chrome/answer/9658361 (desktop) |
| Edge desktop | App disponibile nella barra, o … → Applicazioni → Installa questo sito come app | support.microsoft.com (confidenza media) |
| Safari macOS 14+ | File → Aggiungi al Dock → Aggiungi | support.apple.com/it-it/104996 |
| Firefox Windows | Aggiungi scheda alla barra delle applicazioni (143+) | firefox-source-docs taskbartabs |

## Quando compare l'invito
A tutto schermo sul telefono (finestra su desktop) dopo l'avviso iniziale, a ogni nuova sessione finché l'app non è installata, al massimo una volta ogni 20 ore dopo "Lo faccio dopo". Il banner in home e la sezione in Info restano.

## Da ricontrollare a ogni nuova versione di iOS/Chrome
Posizione del primo bottone (la freccia nell'invito), nomi delle voci di menu, default di "Apri come app web".


## Barra di stato iOS e sfocatura dell’header (18 ottobre 2026)

La PWA usa `apple-mobile-web-app-status-bar-style=default`. Il precedente
`black-translucent` consentiva al contenuto di estendersi dietro la barra di stato:
la testata opaca e l’assenza di `backdrop-filter` CSS non bastano a escludere
un effetto applicato dal sistema sopra la pagina.

La [documentazione Apple sui meta tag](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)
distingue esplicitamente i due comportamenti: `default` colloca il contenuto sotto
la barra di stato, `black-translucent` lo estende sotto di essa. Manteniamo i colori
`theme-color` già gestiti dal tema e gli inset CSS forniti dal browser, senza
aggiungere distanze fisse basate su un modello di iPhone.

Verifica necessaria su dispositivo: aprire la versione aggiornata dall’icona Home,
controllare la nitidezza della testata sia all’avvio sia dopo scroll e navigazione,
in tema chiaro e scuro. Se la sessione installata conserva la configurazione vecchia,
chiuderla completamente e riaprirla. Non rimuovere l’app o cancellare i dati locali
per questa verifica. L’eliminazione del filtro nativo non è verificabile con Chromium
né con la sola emulazione del viewport iPhone.
