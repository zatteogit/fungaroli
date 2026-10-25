# Varianti dei luoghi · 25 ottobre 2026

Richiesta: completare tutti i luoghi con foto locale ancora privi di varianti e conservare un ritaglio riconoscibile nei diversi breakpoint.

## Copertura e formato

13 luoghi, 17 combinazioni ciascuno: quattro stagioni con sereno, nuvoloso, pioggia e nebbia; inverno anche con neve. 220 nuove elaborazioni illustrative; la foto reale di Faete, scattata il 5 aprile 2021 secondo Commons, copre primavera-sereno. Ogni elaborazione è esportata in WebP normale (lato massimo 640 px) e HD (massimo 1600 px): 440 file in `assets/zones/var/`.

Le immagini seguono il selettore esistente di stagione e meteo. Restano valide le priorità dei video locali compatibili. Sono elaborazioni illustrative da foto reali, non immagini dal vivo né prova di condizioni attuali o della presenza di animali. `generated: true`, crediti e descrizione della modifica accompagnano ogni asset; l’interfaccia conserva l’indicazione di elaborazione e l’accesso ai crediti.

## Generazione e revisione

Modalità: strumento imagegen integrato, modifica con una foto locale di riferimento per ogni chiamata. Nessun collage generativo, nessuna trasformazione meteo tramite codice. Pillow è usato soltanto per esportazione e ridimensionamento.

Ogni foto di riferimento e ogni immagine generata sono state esaminate visivamente. Vincoli: conservare inquadratura, rilievi, percorsi, costruzioni, alberi e riferimenti del luogo; cambiare soltanto stagione, luce e atmosfera. Sempreverdi verdi; niente neve nelle combinazioni che non la prevedono; neve leggera e discontinua alle basse quote, acqua non ghiacciata. A Prato di Campoli e Monte Gennaro restano gli animali presenti nell’originale, senza usarli come segnalazione attuale; a Livata restano strada e veicoli. La foto di Monterano non mostra una cascata visibile: nessuna cascata è stata aggiunta.

Una versione di Allumiere inverno-nebbia è stata scartata per neve impropria al suolo e rigenerata senza neve. Hash e motivo sono nel registro.

[Registro per immagine](varianti-luoghi-2026-10-25.json): sorgente, hash PNG, prompt e revisione. Per le prime generazioni il registro conserva il prompt base; i vincoli aggiuntivi comuni e specifici sono descritti qui, senza pretendere una trascrizione integrale di quelle prime chiamate. Le successive includono il prompt effettivo. Import: `tools/import_reviewed_zone_variants.py`, che richiede stato revisionato, prompt, revisione e crediti originali.

I ritagli usano punto e riquadro revisionati in [ritagli-luoghi-2026-10-25.json](ritagli-luoghi-2026-10-25.json), ricalcolati sulle dimensioni effettive di ogni file nei sei formati dell’app. L’area fotografica dell’uscita è separata dalle fasce di testo dalla versione v341.

## Fonti delle foto originali

Autore e licenza verificati sulle pagine Commons il 25 ottobre 2026. Le varianti conservano attribuzione, licenza e collegamento originali; la modifica è dichiarata.

| Luogo | Autore | Licenza | Fonte |
|---|---|---|---|
| faete-rocca-papa | NikonZ7II | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Monte_Cavo_Visto_da_castel_gandolfo.jpg) |
| vico-monte-venere | Albarubescens | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Monte_Venere,_Riserva_naturale_Lago_di_Vico.jpg) |
| oriolo-monte-raschio | Dino Michelini | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Fonte_Petrella.jpg) |
| allumiere-faggeto | Albarubescens | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Faggeta_e_Cava_di_Alunite.jpg) |
| monterano-bicione | Patafisik | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Cascate_di_Diosilla.JPG) |
| veio-monte-musino | Albarubescens | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Percorso_a_Monte_Musino.jpg) |
| cerquone-doganella | Albarubescens | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Pozzi_di_Doganella.jpg) |
| circeo-cerasella-verdesca | MasPro57 | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Parco_del_Circeo_foresta.jpg) |
| ernici-prato-campoli | Giuseppe Pinto | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Wild_Horses_(224754759).jpeg) |
| pnalm-settefrati-canneto | Spatuzzi Bruno | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:La_sorgente_del_Melfa.jpg) |
| nemi-fontan-tempesta | Emanuele Petriglia | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Castagni_con_radici_esposte.jpg) |
| livata-tufai | Filippo Bussi | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Osservatorio_Le_Vedute,_Monte_Livata_02.jpg) |
| gennaro-roccagiovine | V.lattanzi | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Parco_dei_Monti_Lucretili_il_Pratone_di_M._Gennaro.jpg) |

## Verifiche

- Rapporto asset: `luoghi-copertine` 374 richiesti, 0 mancanti (prima: 221 mancanti). Nessuna incoerenza, nessun asset mancante non elencato. Restano le pendenze preesistenti di altre categorie.
- Verifica completa dei metadati di tutte le 220 varianti, delle due esportazioni e dei sei ritagli; selezione esatta delle 221 combinazioni sui 13 luoghi.
- 555 test unitari superati; dry-run Wrangler superato.
- Browser Chrome con meteo sintetico: 52 copertine delle uscite (13 luoghi × 320/390/768/1280 px), tutte caricate, nessun overflow o errore JavaScript. Screenshot e quattro tavole di confronto esaminati visivamente.
- La suite browser completa non è stata eseguita: verifica mirata alle copertine modificate, come previsto da AGENTS.md.

Limiti: le elaborazioni preservano la riconoscibilità fotografica e sono state revisionate visivamente; non costituiscono un rilievo geografico o una documentazione delle condizioni sul posto. La neve è illustrativa, non una stima di frequenza meteorologica.
