# Contenuti e fotografie del progetto Fungaroli

Fonte: https://github.com/zatteogit/fungaroli

Ramo: `claude/brave-tesla-wu0a2b` · Commit: `44f1420e5bc08474428e1049cc9ce550799e9bf0` · Consultato il 15 ottobre 2026.

## Ambito

Il prototipo usa una selezione di 12 schede reali (4 funghi, 4 piante, 4 alberi), le 15 zone del dataset e i 3 articoli del repository. I contenuti CMS pubblicati possono differire dallo snapshot Git. Il meteo non è collegato; non sono state inventate previsioni o osservazioni della comunità. Le descrizioni sono riprese dal progetto, non una nuova validazione scientifica.

## Inventario verificato

- zones: 15
- plants: 70
- trees: 39
- fungalTaxaRecords: 88
- modeledSpecies: 14
- edibleSelector: 46
- glossaryTerms: 47
- guides: 3

I 46 elementi del selettore sono calcolati con `buildEdibleCatalog(traits, extra, identification)` del repo; 14 hanno modello. I numeri indicano record presenti nello snapshot, non un censimento completo o una certificazione.

## Fotografie

I file copiati sono originali già presenti nel repo, senza ritocco. La visualizzazione può ritagliare il riquadro tramite CSS, senza alterare il file. Le fotografie delle specie non sono generate. Attribuzioni e licenze sono conservate anche accanto alla foto nel prototipo.

- `assets/content/edulis.webp` — Holger Krisp · CC BY 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:(Gemeine_Steinpilz)_Boletus_edulis.jpg).
- `assets/content/cibarius.webp` — autore su Commons · CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Chanterelle_Cantharellus_cibarius.jpg).
- `assets/content/caesarea.webp` — Yaqui · CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Oronges.jpg).
- `assets/content/procera.webp` — Chrumps · CC BY-SA 4.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Macrolepiota-procera.jpg).
- `assets/content/ortica.webp` — Andrea Moro · Dipartimento di Scienze della Vita, Università di Trieste · CC BY-SA 4.0 · [Fonte](https://dryades.units.it/Roma/index.php?id=298&procedure=taxon_page). [Licenza](https://creativecommons.org/licenses/by-sa/4.0/).
- `assets/content/cicoria.webp` — Andrea Moro · Dipartimento di Scienze della Vita, Università di Trieste · CC BY-SA 4.0 · [Fonte](https://dryades.units.it/Roma/index.php?id=6152&procedure=taxon_page). [Licenza](https://creativecommons.org/licenses/by-sa/4.0/).
- `assets/content/rosa-canina.webp` — Andrea Moro · Dipartimento di Scienze della Vita, Università di Trieste · CC BY-SA 4.0 · [Fonte](https://dryades.units.it/Roma/index.php?id=1972&procedure=taxon_page). [Licenza](https://creativecommons.org/licenses/by-sa/4.0/).
- `assets/content/corbezzolo.webp` — Andrea Moro · Dipartimento di Scienze della Vita, Università di Trieste · CC BY-SA 4.0 · [Fonte](https://dryades.units.it/Roma/index.php?id=3730&procedure=taxon_page). [Licenza](https://creativecommons.org/licenses/by-sa/4.0/).
- `assets/content/faggio.webp` — Marco Mussita · CC BY 4.0 · [Fonte](https://www.inaturalist.org/observations/307003862). [Licenza](https://creativecommons.org/licenses/by/4.0/).
- `assets/content/roverella.webp` — Gilles San Martin · CC BY-SA 4.0 · [Fonte](https://www.inaturalist.org/observations/177041374). [Licenza](https://creativecommons.org/licenses/by-sa/4.0/).
- `assets/content/cerro.webp` — etrusko25 · CC BY 4.0 · [Fonte](https://www.inaturalist.org/observations/137439329). [Licenza](https://creativecommons.org/licenses/by/4.0/).
- `assets/content/castagno.webp` — Wolfgang Ahlmer · CC BY 4.0 · [Fonte](https://www.inaturalist.org/observations/190508845). [Licenza](https://creativecommons.org/licenses/by/4.0/).
- `assets/content/zona-vallonina.webp` — Idéfix · CC BY-SA 2.5 / CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:SelladiLeonessa001.jpg).
- `assets/content/zona-poggio-cantalice.webp` — Li vioandronico2013 · CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Terminillo.JPG).
- `assets/content/zona-antrodoco.webp` — Iacopo.rossini · Pubblico dominio (PD-self) · [Fonte](https://commons.wikimedia.org/wiki/File:Monte_Giano_DVX.JPG).
- `assets/content/zona-cicolano.webp` — Alessandro Blasi from Rieti, Italy · CC BY 2.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Lago_del_Salto%21%21_%287447648144%29.jpg).
- `assets/content/zona-rascino.webp` — Sabina Trekking ASD · CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Rascino.jpg).
- `assets/content/zona-tancia.webp` — Christoph Strässler · CC BY-SA 2.0 · [Fonte](https://commons.wikimedia.org/wiki/File%3ABeech_Forest_in_the_Sabina_Hills%2C_Latium%2C_Italy_-_52993979506.jpg).
- `assets/content/zona-laga.webp` — Mario1952 · CC BY-SA 3.0 · [Fonte](https://commons.wikimedia.org/wiki/File:Pizzo_di_Sevo.jpg).

## Nomi e gerarchia

Dal handoff: Uscite, Scopri, Taccuino; home “Dove andare”, “Altre buone uscite”, “Nei boschi in questi giorni”. Funghi → giro → scoperte. Mappa come vista delle uscite; guide e glossario dentro Scopri. La shell HTML dello snapshot contiene ancora Mappa e Impara come accessi autonomi: lo studio segue la gerarchia descritta nel handoff, rendendo questa riconciliazione una proposta da approvare prima dell’integrazione.

## Provenienza puntuale

- [README.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/README.md)
- [AGENTS.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/AGENTS.md)
- [docs/handoff-2026-10-14.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/docs/handoff-2026-10-14.md)
- [docs/ux-navigazione.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/docs/ux-navigazione.md)
- [docs/guida-uso.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/docs/guida-uso.md)
- [docs/community.md](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/docs/community.md)
- [data/ui-copy.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/ui-copy.json)
- [data/zones.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/zones.json)
- [data/species-id.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/species-id.json)
- [data/species-traits.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/species-traits.json)
- [data/plants.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/plants.json)
- [data/trees.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/trees.json)
- [data/media.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/media.json)
- [data/media-zones.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/media-zones.json)
- [data/media-trees.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/media-trees.json)
- [data/guides.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/guides.json)
- [data/glossary.json](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/data/glossary.json)
- [js/species.js](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/js/species.js)
- [js/edible-catalog.js](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/js/edible-catalog.js)
- [js/journal.js](https://github.com/zatteogit/fungaroli/blob/44f1420e5bc08474428e1049cc9ce550799e9bf0/js/journal.js)


## Cartografia

`assets/content/basemap-topo.webp` e `basemap.json` sono copiati dal repository. Base: © OpenStreetMap contributors, SRTM; rappresentazione © OpenTopoMap, CC BY-SA. Attribuzione visibile nella mappa. I 15 punti sono proiettati dalle coordinate del dataset sui limiti geografici conservati nel file di metadati; non indicano avvistamenti o percorsi autorizzati.

Fonti: https://www.openstreetmap.org/copyright · https://opentopomap.org/about
