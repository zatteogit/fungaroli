# Arbusti e cladodi — chiusura dopo lo stop del coordinatore

Sono state terminate soltanto le quattro generazioni già in corso quando il coordinatore ha chiesto lo stop per revisionare il backlog. Nessun'altra generazione o specie è stata avviata dopo quel messaggio. I master completi sono conservati, inclusi i quadranti scartati, ma il registro propone soltanto i 12 export ritenuti utilizzabili dal worker e ancora **candidati alla revisione indipendente**.

Inventario assegnato: 17 taxa, 66 mapping. Stato finale del lotto: **12 mapping candidati da 12 raster; 3 richiedono correzione visiva; 51 assigned_not_started**. Questi ultimi non sono falsamente classificati come blocchi documentali: la generazione non è iniziata prima dello stop. Tutti gli stati sono in `states.json`, gli scarti motivati in `blocked.json`. Nessun asset canonico, dato del catalogo, indice, codice, test o pubblicazione modificato.

## Candidati

- Asparago selvatico: cladodi aghiformi in fascetti; fiore ingrandito con perianzio a sei tepali. La caption del primo chiarisce «rametti modificati, non foglie vere». Gli organi centrali del fiore sono semplificati e non vanno usati per indicare sesso o anatomia riproduttiva.
- Pungitopo: cladodio appiattito spinuloso; bacca rossa inserita sulla superficie del cladodio. Caption esplicite chiariscono che il supporto è un rametto modificato, non una foglia. Le nervature non sono quelle pennate di una foglia dicotiledone.
- Cisto di Montpellier: foglia intera stretta a tre nervature longitudinali e dettaglio del bordo intero revoluto.
- Cisto a foglie di salvia: foglia ovale rugosa-reticolata e dettaglio del bordo intero pubescente. I peli non sono denti o spine; la caption lo chiarisce.
- Ginepro: galbuli maturi scuri e pruinosi. Caption «coni carnosi, non vere bacche». La superficie grigiastra rappresenta la pruina, non l'aggiunta di un valore blu al colore del frutto.
- Sanguinello: foglia intera con nervature arcuate e dettaglio del margine intero. Le cinque coppie del campione illustrato sono nel limite 3–4(–5) della descrizione InfoFlora.
- Dafne laureola: foglia semplice lanceolata, nella variabilità lanceolata-obovale documentata.

Le foto esatte e i crediti universitari estratti sono allegati a ogni voce di `registry-proposal.json` / `exports.json`. Le descrizioni provengono da InfoFlora/Flora Helvetica, dalle fotografie dell'Università di Trieste e dall'Herbario Virtual dell'Università di Alicante per Cistus monspeliensis. Nessuna nuova foto è distribuita nel catalogo. `sources/description-references.json` conserva i riferimenti alle descrizioni reperite; le copie delle pagine consultate sono archiviate fuori dal repository in `output/botanical-references/arbusti-cladodi-pages/` nella cartella di progetto; gli errori 404 o le descrizioni assenti sono espliciti, non fonti confermate. Le fotografie locali temporanee non sono nuovi asset del catalogo.

## Quadranti scartati

1. Fiore del pungitopo: il master m01 non rende correttamente i sei tepali. Il master m03 migliora il perianzio, ma quattro puntini al centro potrebbero suggerire un'anatomia staminale scorretta. Nessun export di questo carattere; serve una correzione raster quando il lavoro riprenderà.
2. Aghi del ginepro: nel master m03 il nodo superiore ha più di tre aghi. Juniperus communis presenta verticilli a tre aghi; il quadrante non è stato esportato come carattere fogliare.
3. Foglia del corniolo: il master m04 evidenzia troppe coppie di nervature forti rispetto alle quattro tipiche della fonte e della fotografia anatomica. Non è stata esportata.

`contact-sheet.png` mostra soltanto i 12 export candidati. I prompt completi sono in `prompts.json`; impronte e dimensioni dei master in `masters-manifest.json`. Strumento utilizzato: image_gen integrato, raster con alpha vero. Gli export sono crop/centratura/ridimensionamento neutri su 512 px e WebP lossless `exact=True`; nessuna modifica dell'anatomia tramite codice.
