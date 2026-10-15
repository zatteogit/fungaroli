"""Verifica i PNG consegnati, senza modificarli. Dipendenze: Pillow, numpy."""
import json, hashlib, subprocess
from pathlib import Path
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parents[2]
program = json.loads((root / 'incoming/bozze/programma-forme.json').read_text())
manifest = json.loads((root / 'incoming/manifest.json').read_text())
results = []
for sheet in program['sheets']:
    number = sheet['numero']
    relative = f'incoming/icone/forme-{number:02}.png'
    path = root / relative
    report = json.loads((root / f'incoming/bozze/verifiche/forme-{number:02}.json').read_text())
    assert hashlib.sha256(path.read_bytes()).hexdigest() == report['sha256'], relative
    assert path.stat().st_size < 400000, relative
    subprocess.run(['git', 'ls-files', '--error-unmatch', relative], cwd=root, check=True, stdout=subprocess.DEVNULL)
    im = Image.open(path).convert('RGBA')
    assert im.size == (1254, 1254), relative
    cells = []
    for index in range(9):
        cell = im.crop((index % 3 * 418, index // 3 * 418, (index % 3 + 1) * 418, (index // 3 + 1) * 418))
        a = np.asarray(cell)
        ys, xs = np.where(a[:, :, 3] > 0)
        expected = index % 3 < 2 and index // 3 < len(sheet['varianti'])
        assert bool(len(xs)) == expected, (relative, index, 'occupazione')
        if not expected:
            cells.append({'cella': index, 'vuota': True})
            continue
        margins = [int(xs.min()), int(ys.min()), int(417-xs.max()), int(417-ys.max())]
        assert min(margins) >= 42, (relative, index, margins)
        solid = a[:, :, 3] > 200
        sy, sx = np.where(solid)
        edges = [a[sy.min(), :, :], a[sy.max(), :, :], a[:, sx.min(), :], a[:, sx.max(), :]]
        dark = []
        for edge in edges:
            pixels = edge[edge[:, 3] > 200]
            dark.append(bool(np.mean((pixels[:, :3].max(axis=1) < 170) & (pixels[:, :3].mean(axis=1) < 110)) > .5))
        assert all(dark), (relative, index, 'contorno', dark)
        variant = sheet['varianti'][index // 3]
        entries = [e for e in manifest if e.get('file') == relative and e.get('cella') == index]
        assert len(entries) == 1, (relative, index, 'manifest')
        entry = entries[0]
        assert entry['soggetto'] == variant['soggetto'] and entry['variante'] == 'forma:' + variant['forma']
        assert entry['tessera'] == ['cappello', 'gambo'][index % 3]
        cells.append({'cella': index, 'margini_px_alpha_nonzero': margins, 'contorno_scuro_estremi': dark})
    results.append({'file': relative, 'bytes': path.stat().st_size, 'sha256': report['sha256'], 'celle': cells})
output = {'tavole': len(results), 'varianti': sum(len(s['varianti']) for s in program['sheets']), 'icone': sum(2*len(s['varianti']) for s in program['sheets']), 'esito': 'superato', 'risultati': results}
(root / 'incoming/bozze/VERIFICA-LOTTO-FORME.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print({k: v for k, v in output.items() if k != 'risultati'})
