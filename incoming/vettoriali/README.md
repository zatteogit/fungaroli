# SVG a livelli · consegna integrata

Due campioni revisionati di **Porcino di fiele, crema + piano**: cappello e fungo intero. Import selettivo dal commit `7578a2df78f4a0e3007118cc73d9b6644dd0c915` del ramo `images/semantic-svg-prototype`. Il prototipo storico Amanita con clip non fa parte di questa consegna.

La sequenza resta raster → correzione e revisione → vettore → revisione. Non sostituiscono i raster dell’app e non rappresentano una conversione completa del catalogo. Ogni campione conserva sorgente PNG, geometrie, descrizioni, hash, regioni annotate e revisioni. [Avanzamento e limiti](AVANZAMENTO.md).

## Ispezione

Dalla radice del repository avviare `python3 -m http.server 8796`, poi aprire <http://127.0.0.1:8796/incoming/vettoriali/inspector-v2.html>. Si possono isolare i livelli, provare i colori documentati e scaricare una copia SVG. Le modifiche sono marcate nei metadati come da revisionare: nascondere il reticolo non crea una variante senza reticolo. L’inspector integrato offre soltanto i due campioni revisionati ed è impaginato anche per schermi stretti.

## Riproduzione

Richiede Inkscape nel PATH e un ambiente Python con le dipendenze fissate in `requirements.txt`:

```bash
python3 -m venv /tmp/fronda-svg-venv
/tmp/fronda-svg-venv/bin/pip install -r incoming/vettoriali/requirements.txt
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_reviewed_scene.py incoming/vettoriali/campione-tylopilus-felleus
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_reviewed_scene.py incoming/vettoriali/campione-tylopilus-cappello
```

Gli strumenti conservano separatamente ricalco, annotazione e controllo. Non assegnano automaticamente un’anatomia a una sagoma. Il fondo sotto il reticolo è una ricostruzione illustrativa dichiarata; la densità dei pori è simbolica. Una nuova forma richiede un nuovo raster approvato. Licenza CC BY-SA 4.0, Fronda/Fungaroli; provenienza incorporata negli SVG.
