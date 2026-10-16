import json, sys, statistics as st
cur = json.load(open(sys.argv[1])); ids = json.load(open(sys.argv[2]))
arc = json.load(open(sys.argv[3])); ida = json.load(open(sys.argv[4]))
cells = {}
for loc, i in zip(cur, ids):
    cells.setdefault((loc['latitude'], loc['longitude']), []).append(i)
print('punti', len(cur), 'celle forecast', len(cells))
for k, v in cells.items():
    if any(x.startswith('vallonina') for x in v): print(' vallonina', k, v)
# pioggia 20/08-10/10/2026 (giorni passati) forecast vs archivio
def tot(loc, a, b):
    d = loc['daily']; s = 0; n = 0
    for t, p in zip(d['time'], d['precipitation_sum']):
        if a <= t <= b:
            if p is None: return None
            s += p; n += 1
    return s, n
ra = dict(zip(ida, arc))
rat = []; fc = []; ac = []
for loc, i in zip(cur, ids):
    f = tot(loc, '2026-08-20', '2026-10-10'); g = tot(ra[i], '2026-08-20', '2026-10-10')
    if f and g:
        fc.append(f[0]); ac.append(g[0]); rat.append(g[0] / f[0] if f[0] else float('inf'))
print('n', len(rat), 'giorni', f[1], g[1], 'mediana forecast', round(st.median(fc)), 'archivio', round(st.median(ac)), 'rapporto mediano', round(st.median(rat), 2), 'min', round(min(rat), 2), 'max', round(max(rat), 2))
print('quota celle archivio:', len({(l['latitude'], l['longitude']) for l in arc}))
