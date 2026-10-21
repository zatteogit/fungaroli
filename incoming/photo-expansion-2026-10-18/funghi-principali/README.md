# Fotografie dei funghi principali · secondo lotto · 18–19 ottobre 2026

Bundle di acquisizione e preparazione. Non modifica cataloghi canonici, Git, PR o pubblicazione. Il conteggio aggiornato e autorevole e in `manifest.json` (`summary`): contare solo i record `photos`, mai tutti i file presenti in `originals` o le candidature.

## Consegna

Congelato: **47 fotografie approvate per 24 schede**,31 Commons e16 iNaturalist; **141 WebP e20 tavole finali**, piu 3 tavole cromatiche. Di 69 file originali acquisiti,47 sono approvati e22 esclusi; altre 6 candidature escluse prima del download. Tutte le 24 schede ricevono almeno una foto nuova;16 raggiungono 4–6 foto totali,8 restano a 3. Porcino estivo e nuda gia arricchiti non sono toccati.

`manifest.json` contiene solo fotografie distinte approvate, con fonte effettiva, autore o credito disponibile, licenza della singola foto, link fonte/licenza, descrizione e categorie originarie, hash originale, didascalia, alt, punti di ritaglio e tre derivati. L'attribuzione esplicita Commons, quando presente, e conservata in `attribution_required_text` e usata in `attribution`.

Tavole finali: `approved-originals-*.jpg` e `approved-crops-*.jpg`; l'elenco preciso e nel campo `review_tables` del manifest. Originali interi osservati, confrontati con le fotografie gia collegate alle schede (`existing-review.jpg`, `other-existing-review-*.jpg`); sei ritagli UI e miniatura centrale realmente osservati. I formati stretti possono escludere parti dei gruppi o dell'esemplare; la fotografia completa resta nel visore. Nessuna fase di crescita dedotta, nessun verdetto di identificazione o commestibilita.

Originali conservati senza alterazioni. Normale lato massimo560 e80KB, HD lato massimo1200 e220KB, miniatura160quadrata centrata. Orientamento applicato, ridimensionamento e compressione WebP; nessuna modifica cromatica o generazione. Tutti i WebP approvati sono senza EXIF/XMP. `checks.json` conserva hash e dimensioni dei singoli derivati, verifiche SHA256 dell'originale e SHA1 contro Commons quando disponibile. SHA1 non fornito da iNaturalist: dichiarato `null`, non inventato.

## Fonti e rete

Commons API e upload hanno risposto200 con byte immagine reali. Il primo tentativo di acquisizione ha poi ricevuto429: processo fermato. La ripresa avviene solo nella coda seriale globale coordinata dalla chat, senza downloader Commons concorrenti. Nessun host, proxy, route, User-Agent o URL Commons alterato per aggirare limiti. Il vecchio `acquire.py` parallelo e disabilitato.

Per iNaturalist: endpoint ufficiale osservazioni accessibile e host originale `inaturalist-open-data.s3.amazonaws.com` accessibile. Acquisizione seriale, almeno4secondi fra foto. Solo osservazioni research in Italia (place6973, verificato via API), taxon esatto al rango species, singola foto CC0/CC BY/CC BY-SA. Non si eredita la licenza dall'osservazione o dal default_photo del taxon. Le due Morchella s.l. non sono state cercate su iNaturalist. La pagina HTML `www.inaturalist.org/photos` ha risposto403 e non e stata ritentata; provenienza e licenze sono documentate tramite API ufficiale salvata. Il grado research non e una certificazione micologica.

Nelle foto CC0 in cui l'API dichiara soltanto `no rights reserved`, l'autore resta esplicitamente non indicato; il caricatore e dichiarato come tale, senza inventare il fotografo. I valori originali sono conservati.

## Scarti e limiti

Tutti gli scarti sono registrati in `rejected` nel manifest. I file originali degli scarti restano per audit; nessun loro derivato e presente nel bundle finale. Fra i casi rilevanti: Pinophilus02 duplicato di01; Bisporusq02 quasi identica alla q01; Campestris02 da Nepal; Suillus02 descritto dalla fonte come sporata, quindi escluso come presunto dettaglio dei pori; file Marasmius q01/q02 con categoria Marasmius ma descrizione Tricholoma pardinum, esclusi per conflitto; Morchella elata group da Argentina esclusa. Fotografie deteriorate, troppo lontane, notturne o ridondanti non sono state contate. Le sostituzioni Marasmius r01/r02 hanno fonte, taxon e luogo francesi coerenti e sono fotografie distinte.

`download-plan.json` e `replacement-plan.json` sono candidature, non foto approvate; alcune sono state escluse prima dell'acquisizione. Non aumentano il conteggio. Le matrici scientifiche, fasi, nomi canonici e relazioni non sono stati modificati.

Nessuna suite, dry-run, installazione o azione di autenticazione avviata. L'integrazione nei cataloghi e la verifica online competono al coordinatore.


## Conversione ICC e decisione tassonomica finale

Sei originali DisplayP3 e uno AdobeRGB1998 convertiti esplicitamente a sRGB prima di rimuovere i profili. Elaborati anche sei profili sRGB; 34 originali privi di ICC trattati come sRGB. Ricevuta `colour-review.json`, confronti `colour-review-P3-*.jpg` e `colour-review-AdobeRGB.jpg` realmente osservati insieme ai ritagli aggiornati. Originali invariati.

Esclusi i due Commons Cyclocybe q01/q02, descritti Agrocybe cylindrica, per mancata verifica accessibile della sinonimia nel registro autorevole. Resta la foto iNaturalist con taxon esatto Cyclocybe cylindracea. Morchella elata q02 conservata su decisione del coordinatore nella scheda gia esplicitamente s.l.; didascalia dichiara riferimento al gruppo, non delimitazione molecolare. Nessun nome canonico modificato.
