# Catalogo dei commestibili

Verifica del 13 ottobre 2026: la versione precedente conteneva 61 taxa nel catalogo dei caratteri, di cui 18 commestibili e 6 commestibili con cautela; 12 non commestibili, 17 tossici e 8 mortali. Solo 14 voci, incluse alcune aggregazioni di specie, avevano parametri di crescita ed erano rappresentate negli 11 filtri.

Il selettore ora include **46 voci commestibili**: le 24 già documentate e 22 ulteriori voci in `data/edible-catalog.json`. La somma delle voci tassonomiche nei due cataloghi è 83. Le 22 aggiunte hanno schede sintetiche con fonti; non hanno una scheda completa dei caratteri di riconoscimento. I 61 taxa del riconoscimento restano separati dalla selezione dei commestibili.

## Copertura e fonti

Non è un catalogo esaustivo dei funghi italiani e non si confondono nomi, specie aggregate, sinonimi e specie biologiche distinte. Il dato “oltre mille specie” non prova che esistano altrettanti commestibili pertinenti all’app. Un volume ISPRA del 2020 riporta in un contesto divulgativo circa 5000 specie fungine conosciute e 200–300 commestibili: è una stima di riferimento, non un censimento completo aggiornato o un elenco di specie presenti nel Reatino.

- [ISPRA, Memorie del Progetto Speciale Funghi, volume I](https://www.isprambiente.gov.it/files2020/pubblicazioni/quaderni/quaderni-15-20-memorie-del-psf-i-volume-rev22-01-21/%40%40download/file/Quaderni%2015-20%20Memorie_del_PSF_I_Volume_rev22-01-21.pdf).
- [Regione Piemonte, Guida ragionata alla commestibilità dei funghi (2021)](https://www.regione.piemonte.it/web/media/24510/download), revisione micotossicologica utilizzata nella formazione dei micologi. Distingue commestibili, commestibili dopo trattamenti e categorie escluse dal selettore. Le indicazioni sono riassunte, non riprodotte come ricette.
- Fonti di stagione e habitat per ogni voce aggiuntiva: manualistica First Nature e pagine enciclopediche italiane, linkate in `sources`. I calendari europei, compresi periodi mediterranei quando documentati, non sono una validazione fenologica locale.

## Regole del selettore

`js/edible-catalog.js` riunisce i cataloghi ed esclude i taxa non classificati esattamente come `commestibile` o `commestibile con cautela`. Non deduce la commestibilità dal nome, da un riconoscimento automatico o dalla presenza su GBIF.

La ricerca con autocomplete usa nome comune, nome scientifico e sinonimi. Consente singole specie, compresi i singoli porcini. I gruppi restano scorciatoie; “Tutti i commestibili” include il catalogo completo. Le preferenze precedenti per gruppi vengono migrate senza perdere la selezione. Tastiera, touch, rimozione e persistenza sono supportati.

“Fuori stagione” si riferisce al calendario indicativo della specie e alla data scelta, non a una certezza di assenza. Un calendario mancante è mostrato come “Stagione n.d.”; non viene sostituito da un intervallo inventato. Clima, quota e coltivazione possono cambiare i periodi reali.

## Modello, diario e segnalazioni

L’indice rimane calcolabile soltanto per le **14 voci con modello**: aggiungere una specie al catalogo non le attribuisce coefficienti biologici per analogia. Se sono selezionate soltanto altre specie, l’app mostra “Indice non disponibile”, le schede, il taccuino e i sentieri consultabili senza suggerire idoneità per quei funghi.

Tutte le 46 voci possono essere annotate nel diario e segnalate alla comunità. Il server applica lo stesso catalogo dei commestibili e rifiuta i taxa tossici. Una nuova specie non entra nei confronti prospettici finché non esiste un valore previsto valido. La commestibilità di una specie non conferma l’identità di un esemplare: restano controllo micologico e preparazioni specifiche.

Per ampliare il catalogo si aggiungono record con ID stabile, nome scientifico, nomi comuni/sinonimi, classificazione verificata, fonti, cautele ed eventuale calendario. Non si aggiungono automaticamente tutti i nomi di una banca dati tassonomica: questa non fornisce necessariamente un giudizio di commestibilità.
