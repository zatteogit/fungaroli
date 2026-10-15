"""QA delle tavole varianti. Dalla radice: python incoming/bozze/verifica_varianti.py.

Richiede Pillow e NumPy. Non modifica le immagini. Il controllo numerico
dei quattro estremi affianca la revisione visiva dei contorni e della morfologia.
"""
import hashlib
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image


def verifica(path, colonne_vuote=(2,)):
    im = Image.open(path)
    assert im.mode == 'RGBA' and im.size == (1254, 1254), str(path)
    a = np.asarray(im)
    problemi = []
    celle = []
    for r in range(3):
        for c in range(3):
            tile = a[r*418:(r+1)*418, c*418:(c+1)*418]
            alpha = tile[:, :, 3]
            bordo = np.ones((418, 418), dtype=bool)
            bordo[42:376, 42:376] = False
            if np.any(alpha[bordo]):
                problemi.append({'cella': r*3+c, 'errore': 'alpha nel margine di 42 px'})
            if c in colonne_vuote and np.any(alpha):
                problemi.append({'cella': r*3+c, 'errore': 'cella riservata non vuota'})
            yy, xx = np.where(alpha >= 128)
            if not len(xx):
                continue
            x0, x1, y0, y1 = int(xx.min()), int(xx.max()), int(yy.min()), int(yy.max())
            celle.append(r*3+c)
            lati = {'alto': tile[y0, x0:x1+1], 'basso': tile[y1, x0:x1+1],
                    'sinistra': tile[y0:y1+1, x0], 'destra': tile[y0:y1+1, x1]}
            for nome, px in lati.items():
                px = px[px[:, 3] >= 128]
                # Bruno scuro, incluse le lievi differenze di antialias;
                # rosso scuro per i contorni delle gocce di H. peckii.
                scuro = ((px[:, 0] <= 115) & (px[:, 1] <= 90) & (px[:, 2] <= 90)) | (
                    (px[:, 0] <= 180) & (px[:, 1] <= 45) & (px[:, 2] <= 45))
                if not scuro.all():
                    problemi.append({'cella': r*3+c, 'lato': nome, 'errore': 'riempimento esposto'})
    return {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'ok': not problemi, 'celle': celle, 'problemi': problemi}


def main():
    root = Path(__file__).resolve().parents[2]
    manifest = json.loads((root/'incoming/manifest.json').read_text())
    bases = {r['soggetto']: r['base'] for r in manifest if r.get('tipo') == 'illustrazione'
             and r.get('tessera') == 'cappello' and not r.get('variante')}
    assert len(bases) == 88, len(bases)
    for species, base in bases.items():
        assert set(base) == ({'colore'} if species == 'fistulina-hepatica' else {'colore', 'forma'}), species
    pairs = defaultdict(list)
    for row in manifest:
        if row.get('variante'):
            pairs[(row['soggetto'], row['variante'])].append(row)
    for key, rows in pairs.items():
        assert len(rows) == 2 and {r['tessera'] for r in rows} == {'cappello', 'gambo'}, key
        cap = next(r for r in rows if r['tessera'] == 'cappello')
        whole = next(r for r in rows if r['tessera'] == 'gambo')
        assert cap['file'] == whole['file'] and whole['cella'] == cap['cella']+1, key
        assert cap['cella'] in (0, 3, 6) and cap['base'] == whole['base'], key
        assert cap['base'] == bases[key[0]], key
        field, value = key[1].split(':', 1)
        assert value != bases[key[0]][field], key
    colors = sum(v.startswith('colore:') for _, v in pairs)
    shapes = {key for key in pairs if key[1].startswith('forma:')}
    assert colors == 141, colors
    assert shapes == {('amanita-phalloides', 'forma:emisferico'), ('amanita-phalloides', 'forma:piano')}, shapes
    files = [root/f'incoming/icone/varianti-{n:02}.png' for n in range(1, 49)]
    reports = [verifica(p) for p in files]
    reports.append(verifica(root/'incoming/icone/tavola-10-anello.png', ()))
    for report in reports:
        report['file'] = str(Path(report['file']).relative_to(root))
        expected = sorted(r['cella'] for r in manifest if r['file'] == report['file'])
        # The correction sheet contains eight unchanged reference icons as well.
        if report['file'].endswith('tavola-10-anello.png'):
            expected = list(range(9))
        assert report['celle'] == expected, (report['file'], report['celle'], expected)
    result = {'basi_dichiarate': len(bases), 'colori': colors, 'icone_colore': colors*2, 'forme_in_attesa_delle_fasi': len(shapes),
              'tavole_varianti': len(files), 'margine_px': 42, 'alpha_bordo': 0,
              'soglia_sagoma': 128, 'contorno_estremi': 'tutti i pixel, nessuna eccezione per punte',
              'ok': all(r['ok'] for r in reports), 'tavole': reports}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(not result['ok'])


if __name__ == '__main__':
    main()
