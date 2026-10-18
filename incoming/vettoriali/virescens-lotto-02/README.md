# Russule lisce · secondo lotto SVG

**Quattro SVG prodotti, in attesa della revisione indipendente del coordinatore.** Due colori (rosa, violetto), ciascuno con cappello isolato e fungo intero. Fonte esclusiva: tavola raster corretta `virescens-colore-liscio-2026-10-18-r03.png`, celle 0, 1, 3, 4, già revisionata indipendentemente prima della conversione. Nessuna nuova generazione raster e nessuna sostituzione runtime.

Gli SVG hanno geometrie vere: cappello liscio e lamelle, più gambo nei due interi. Nessun bitmap, clip o maschera. Il file condiviso `build_botanical_svg.py` gestisce anche questo dominio con schema `fungal-semantic-1`, controlli sui caratteri e annotazioni specifiche: non trasferisce l’anatomia delle piante ai funghi.

I dati `virescens` descrivono un aggregato: la cuticola liscia rosa/violetta segue le note di **cyanoxantha**, mentre il mosaico appartiene alle alternative appropriate di virescens. Non è stato trasferito il mosaico. Lamelle chiare, gambi chiari, niente anello/volva/reticolo. Non si afferma che ogni proprietà dell’aggregato coesista in un singolo esemplare; nessuna identificazione di organismo.

Le regioni sono annotate separatamente sui quattro crop. Per il bordo del cappello si aggiungono solo le superfici cromatiche **visibili** del ricalco, escludendo le campiture occluse che VTracer può estendere sotto il resto del disegno: non sono anatomia del cappello. I contorni condivisi si dividono graficamente. I livelli isolati e i cambi di tinta sono stati verificati. Nessun tessuto nascosto ricostruito; nascondere una parte può lasciare un vuoto.

Aprire `inspector.html` tramite lo stesso server locale del lotto botanico. `review-128-64.png` mostra raster e SVG alle dimensioni reali; ogni cartella conserva anche master, prompt, revisione raster, hash, crop, ricalco, anatomia, SVG, render, parti isolate, confronto e verifica automatica. `manifest.json` lega questi file e mantiene lo stato SVG distinto dall’approvazione raster.

Per ciascun soggetto:

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/prepare_botanical_crop.py incoming/vettoriali/virescens-lotto-02/virescens-rosa-gambo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/trace_botanical_svg.py incoming/vettoriali/virescens-lotto-02/virescens-rosa-gambo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/build_botanical_svg.py incoming/vettoriali/virescens-lotto-02/virescens-rosa-gambo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_botanical_svg.py incoming/vettoriali/virescens-lotto-02/virescens-rosa-gambo
```

Le dipendenze restano fissate nel `requirements.txt` del dossier SVG. I test di fedeltà non sostituiscono la revisione indipendente dei nuovi SVG; le prove di tinta non approvano nuove varianti biologiche e non deformano la forma.
