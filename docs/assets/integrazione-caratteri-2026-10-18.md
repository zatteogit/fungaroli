# Integrazione delle illustrazioni · 18 ottobre 2026

## Contenuto

- Piante: 51 valori in 9 domande, 6 tavole selezionate. Nuove icone in schede,
  percorso guidato e riepilogo delle risposte. Testi completi come fallback se
  l’indice non è disponibile. I disegni sono generici, non ritratti di specie.
- Funghi: 6 forme mancanti e 108 combinazioni colore/forma, 228 WebP. Le forme
  coesistono con le fasi già consegnate. Nessun valore scientifico modificato.
- SVG: prototipi non integrati; produzione ancora distinta dai raster approvati.

## Fonti

Snapshot piante `66959d7`, ramo `images/plant-traits-2026-10-18`.
Snapshot funghi `8720426`, ramo `images/missing-comparison-2026-10-18`.
I commit contengono raster originali, prompt, riferimenti e revisioni; l’import
usa soltanto le tavole «pronta da integrare». Hash e corrispondenze cella/valore
sono in [import-caratteri-2026-10-18.json](import-caratteri-2026-10-18.json).
CC BY-SA 4.0, Fronda/Fungaroli. Ritaglio per componenti e margini controllati;
nessuna ricolorazione raster automatica.

Le altezze delle piante sono diagrammi relativi: il bastone è un riferimento
visivo, non una scala in centimetri. Le soglie numeriche restano nelle etichette
originali. Vedi NOTE.md nel commit sorgente per revisioni e limiti.

## Esito dell’audit

Piante-valori: 51/51, nessun asset mancante. Forme dei funghi: nessuna mancante.
Restano 85 combinazioni alla data di questo snapshot, tutte elencate: 83 dalla
coda originaria e 2 rese esplicite dall’indice delle forme completato della
Morchella (bruno/crema + emisferico), aggiunte alla produzione successiva.
Zero incoerenze tra asset e dati, zero disegni da rifare per dati cambiati.
Gli altri lavori pendenti (fasi, citazioni, foto) restano distinti.

## Verifica

15 controlli mirati Node: coerenza, completezza, margini, combinazioni, piante e
compatibilità con alberi/fasi. Tre verifiche browser: schede e percorso botanico
a 320/390 px, riepilogo delle risposte, icone alberi invariate e fallback testuale.
Due ulteriori test browser delle sei forme e di una combinazione nel confronto.
Corretto anche il cambio di variante quando un altro carattere ha un unico
valore: il contenitore senza selettore non deve interrompere gli altri controlli.
Nessuna suite completa eseguita.
