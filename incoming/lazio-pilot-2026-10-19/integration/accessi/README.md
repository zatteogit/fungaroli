# Accessi del pilota Lazio — 19 ottobre 2026

Integrate in `data/zones.json` 21 zone nuove, mantenendo i 15 oggetti esistenti. Centri e raggi servono a campionamento/meteo: non sono parcheggi, perimetri amministrativi o autorizzazioni all’accesso. La provenienza di ogni centro è nel record.

## Coordinate e confine

- 21/21 centri interrogati realmente con Nominatim: risposta Lazio. `region-check.json` conserva URL, punto, indirizzo e limite della verifica.
- I centri da traccia sono il punto medio del riquadro, dichiarato come scelta editoriale. Non ridistribuite le geometrie senza licenza verificata.
- Allumiere: punto del luogo dalla pagina comunale. Bassiano: centro della mappa Freemap incorporata dal CAI Latina; le coordinate UTM pubblicate dal datum ignoto non sono state convertite.
- San Vito: punto della mappa nella scheda comunale aggiornata 01/07/2025. Cerasella: località OpenStreetMap node768875089 (ODbL), non area sosta georeferenziata.
- Canneto: KMZ ufficiale O7 letto integralmente, 529 punti; centro derivato dal bbox. Controllo aggiuntivo degli estremi e quattro angoli in `canneto-region-check.json`. Non è un rilievo del confine legale.

## Cinque accessi con parcheggio documentato e percorso auto

`routes-integrated.json` e i cinque file `*-valhalla.json` conservano richieste e risposte reali. Origine: Rieti 42.404,12.8623, come nei dati correnti. Tempi di modello Valhalla/OpenStreetMap, senza traffico in tempo reale.

| Accesso | Minuti | km | Fonte del punto e della sosta |
| --- | ---: | ---: | --- |
| Diosilla — Monterano | 136 | 140,2 | Scheda ParchiLazio Bandita: punto partenza esplicito e ritorno al parcheggio |
| La Valle — Itri | 203 | 203,7 | Scheda ParchiLazio CAI951: punto partenza e parcheggio di fronte |
| Prato di Campoli | 147 | 151,7 | CAI Roma: punto WGS e termine strada asfaltata con parcheggio |
| Fonte Santa Serena | 160 | 187,5 | CAI Roma: punto WGS e parcheggio alla fonte |
| Roccagiovine — ingresso paese | 86 | 98,7 | Scheda ParchiLazio CAI305: punto partenza e parcheggio all’ingresso |

Per le altre 16 zone: parcheggi vuoti, minuti/km null, nessun tragitto al centro editoriale. Fondo, tratti asfaltati/sterrati e quota dei nuovi parcheggi restano null: la risposta di routing non dimostra questi dati. Anche la popolarità resta null.

## Raccolta e fruizione

- Circeo: `observation_only` per la proposta. La deroga 2026 riguarda solo autorizzati e aree A/B specifiche: non estesa a Cerasella-Verdesca. Fonte corrente del Parco, senza trasferire la disciplina regionale generale a quella nazionale.
- PNALM/Canneto: `restricted`, raccolta regolamentata secondo il Parco; zona e titolo personale non verificati. Nessun permesso implicito.
- Aurunci: FAQ ufficiale ammette raccolta secondo la normativa; `unknown` descrive la mancata verifica delle condizioni puntuali e personali, non un divieto. Testo esplicito e collegamento alla FAQ.
- Le altre zone: `unknown`, con referente/link locale e istruzione di verificare il regime puntuale. Nessun divieto generale dedotto da una lacuna.
- San Vito: superata la sola evidenza dell’evento2011 con scheda comunale2025 che pubblica indirizzo e visita sui sentieri segnalati. Non importato un itinerario storico né presunto parcheggio. La raccolta resta da verificare.
- Veio: escluso il207c segnalato chiuso. Bracciano: ricordate chiusure176M/132A/266C senza applicarle arbitrariamente al175C.
- Itri951 è EE; Prato di Campoli–Pizzo Deta EE con esposizione. Bassiano mantiene il Nardi–Orticello descritto, senza spacciare la variante senza sentiero per un giro semplice. Monterano richiede riscontro del guado Rafanello.

## Limiti residui

Regime locale e ordinanze possono cambiare; le schede non provano una verifica sul terreno. Le licenze delle tracce complete restano aperte: bbox ed estremi non sono un’autorizzazione a ridistribuire XML. Le fasce quota sono integrate dai campionamenti DEM reali dell’altro agente; assenza temporanea delle fasce non deve diventare un valore inventato. Nessuna suite, CI, test o dry-run avviati da questo agente.

Ulteriore risposta Valhalla acquisita per Piazza Di Vittorio (Faete), 127min/113,1km: conservata come evidenza ma non integrata in parking/access, perché la fonte documenta sosta «nelle vicinanze» e il punto pubblicato è la piazza, non lo stallo verificato.
