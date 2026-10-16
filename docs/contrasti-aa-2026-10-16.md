# Contrasti dell’interfaccia — 16 ottobre 2026

Verifica della versione locale di Fronda. Comprende tema chiaro e scuro, testi su superfici piene, fotografie, controlli e grafici. I risultati quantitativi definitivi sono riportati nella sezione Esito.

## Criteri e metodo

- Testo normale: almeno **4,5:1**; testo grande: **3:1** (24 px, oppure 18,66 px in grassetto).
- Icone funzionali, bordi necessari a riconoscere i campi, indicatori e dati grafici: **3:1**. Per il focus sulla foto si usa un doppio contorno chiaro/scuro.
- Stati: normale, hover con puntatore, focus da tastiera, pressione e selezione. I controlli disabilitati sono registrati ma esclusi dalle soglie, come previsto da WCAG; marchio e illustrazioni didattiche non sono trattati come icone funzionali. Le loro etichette restano nel controllo dei testi.
- I fondi pieni sono calcolati dai colori CSS effettivi, comprese le trasparenze degli antenati. Foto, sfumature e superfici traslucide sono misurate su screenshot: il metodo usa il decimo percentile del contrasto nel riquadro del testo e registra anche la misura senza ombra. È un campionamento dei fondi, non una certificazione di ogni pixel di ogni immagine.
- Le viste sono misurate a 320, 390, 768 e 1280 px; gli stati interattivi a 390 e 1280 px. Un rappresentante per combinazione di stile, classe e stato ARIA evita di ripetere centinaia di controlli identici.
- Le sezioni della scheda luogo vengono aperte anche quando normalmente sono esclusive, per includere gli approfondimenti e i dati scientifici. I grafici vengono effettivamente renderizzati.

## Correzioni

| Caso | Intervento |
|---|---|
| Imbocco selezionato, testo «su strada» | Colore del testo secondario allineato al testo della selezione; supera 10:1 sul giallo. |
| Filtri e navigazione selezionati in hover | Corrette precedenza e specificità: l’hover generico non sovrascrive più le coppie di colore dei componenti. |
| Cambio di selezione | Testo e fondo cambiano insieme, evitando combinazioni intermedie poco leggibili durante le transizioni. |
| Pulsante flottante | Coppia testo/fondo esplicita anche in hover. |
| Campi e interruttori | Contorni visibili prima del focus e sul pomello degli interruttori. |
| Fonti durante la pressione | Rimossa l’attenuazione del testo. |
| Ricerca | Evidenziazioni leggibili e contorno del risultato attivo. |
| Emergenza 112 in hover | Mantiene la coppia di colori dell’azione d’emergenza. |
| Attribuzioni della mappa | Fondo opaco, indipendente dalle tessere sottostanti. |
| Grafici e legende | Linee più contrastate; barre con contorno; previsioni con contorno tratteggiato, senza attenuare il dato. |
| Etichetta «Dato ufficiale» | Usa la coppia semantica fiordaliso, verificata nei due temi. |
| Testi critici, eliminazione ed errori | Usano il ruolo `crit-ink`, verificato sulle quattro superfici neutre oltre al pannello critico. |

## Riproduzione

Avviare un Worker locale e usare:

```bash
node tools/visual-audit.mjs --base http://127.0.0.1:8802 --out /tmp/contrasti --label audit --sweep none --shots none
node tools/contrast-states.mjs --base http://127.0.0.1:8802 --out /tmp/contrasti-stati
node tools/visual-audit.mjs --base http://127.0.0.1:8802 --out /tmp/contrasti-foto --label foto --views uscite,zona --widths 390,1280 --sweep all
CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/browser/legibility.spec.mjs
```

I controlli usano dati locali e previsioni deterministiche. Il profilo viene provato sia prima sia dopo l’accesso con risposte API simulate, senza creare account o modificare dati reali. La sessione CMS aperta in Safari non è accessibile da questo ambiente: il pannello redazionale autenticato e i contenuti pubblicati diversi dal repository non sono inclusi. Le scritte incorporate nelle tessere cartografiche di terzi non sono controllate; lo sono i controlli e le attribuzioni dell’app.

Questa verifica riguarda il contrasto: non equivale a una certificazione WCAG completa.

## Esito

- **31 viste e pannelli × 4 larghezze × 2 temi: 248 contesti, 37.948 misure testuali.**
- **124 contesti interattivi, 13.013 misure** di testi, icone, campi, focus e interruttori.
- **136 varianti fotografiche × 3 copertine × 2 larghezze × 2 temi: 1.632 combinazioni.**
- **Nessun caso sotto soglia e nessun errore di visita nei risultati consolidati.** Le visite interrotte dal server locale sono state ripetute; i risultati della ripetizione sostituiscono quelli precedenti per la stessa vista, larghezza e tema.
- La guardia del design system verifica **48 coppie** nei temi disponibili, comprese le nuove coppie per testi critici e contorni dei campi sulle quattro superfici neutre. Quest’ultima verifica copre anche i testi degli stati d’errore e le azioni di eliminazione non presenti nelle viste vuote.
- **217 test unitari**, dry-run del Worker e guardia del design system superati. **12 casi browser mirati** superati: copertine (4), stati interattivi (4), grafici (2), interruttori accesi/spenti (2). Un’attesa iniziale della copertina è scaduta durante il carico delle verifiche parallele; la ripetizione isolata è passata.

[Riepilogo quantitativo per contesto](contrasti-aa-2026-10-16.json). I report analitici della sessione sono conservati in `/tmp/fronda-aa-final/report.json`; le singole misure includono selettore, testo, stato, tema e rapporto. La misura delle 248 viste precede l’ultima uniformazione dei testi critici al ruolo `crit-ink`: le relative coppie finali sono verificate dalla guardia del design system.
