# Copertine Lazio — 19 ottobre 2026

13 copertine reali selezionate dall’agente foto, in attesa di revisione indipendente del coordinatore. 8 zone senza foto: `pending.json`. Nessuna fotografia condivisa fra zone, nessuna immagine generata o variante stagionale/meteo.

- `approved-contact-sheet.jpg`: tutte le copertine effettivamente esportate, viste dopo ritaglio.
- `review.html`: etichette, localizzazione e crediti. Aprire dalla cartella del repository per i percorsi relativi.
- `approved.json`: autore, pagina, licenza, originale, hash SHA-256 acquisito, file esportati e hash, motivazioni locali e crop.
- `rejected-and-not-selected.json`: scarti e risultati non adottati, distinti da mancata acquisizione o filtri metadati.
- `geo-review.jpg`, `partial.jpg` e `candidates-*.jpg`: provini reali, non tutti approvati. Le foto Casentinesi/Fiumata al Salto sono escluse, non materiali per queste zone.

Esportazione WebP: lato lungo massimo 600, HD 1600, miniatura 240, qualità 85; nessun upscaling. EXIF orientamento corretto. Originali verticali o panoramici estremi ritagliati 3:2 prima dell’esportazione. Punti CSS per i sei formati registrati per ciascun asset; nessun ritocco creativo. Dimensioni utili effettive nel manifest.

Fonti: metadati Wikimedia Commons per singolo file con licenza CC BY/CC BY-SA o pubblico dominio con dichiarazione di copyright assente conservata negli extmetadata; originali scaricati soltanto dopo lettura della licenza. Gli originali conservati in `originals/` servono alla verifica locale; pubblicare soltanto gli asset derivati e i crediti. HTTP 429 affrontati riducendo frequenza delle richieste; nessun proxy o aggiramento.

Le fotografie rappresentano boschi, paesaggi o dettagli locali: non certificano un accesso, lo stato attuale di sentieri o il diritto di raccolta. I limiti specifici (panorama Monte Cavo, foresta condivisa Circeo, Vedute Livata) sono dichiarati per ogni voce. Non ho avviato suite, test, CI, dry-run o pubblicazione.
