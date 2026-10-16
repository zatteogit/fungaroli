# Pioggia 20/8-10/10/2026: past_days della Forecast API (come in produzione) contro archivio Open-Meteo (best_match).
import json, statistics as st, sys
cur = json.load(open(sys.argv[1])); arc = json.load(open(sys.argv[2])); ids = json.load(open(sys.argv[3]))
a, b = '2026-08-20', '2026-10-10'
def win(loc, v): return [x for d, x in zip(loc['daily']['time'], loc['daily'][v]) if a <= d <= b]
rows = []
for k, (c, r) in enumerate(zip(cur, arc)):
    pc, pa = win(c, 'precipitation_sum'), win(r, 'precipitation_sum')
    if None in pc: continue
    rows.append((ids[k], round(sum(pc)), round(sum(pa)), sum(x >= 1 for x in pc), sum(x >= 1 for x in pa), round(sum(win(c, 'et0_fao_evapotranspiration'))), round(sum(win(r, 'et0_fao_evapotranspiration')))))
print('punti', len(rows))
print('mediana pioggia forecast-API', st.median(x[1] for x in rows), 'archivio', st.median(x[2] for x in rows), 'rapporto mediano', round(st.median(x[2]/max(x[1], 1) for x in rows), 2))
print('mediana giorni >=1 mm', st.median(x[3] for x in rows), st.median(x[4] for x in rows), '| ET0 mediana', st.median(x[5] for x in rows), st.median(x[6] for x in rows))
print('min/max rapporto', min(round(x[2]/max(x[1],1),2) for x in rows), max(round(x[2]/max(x[1],1),2) for x in rows))
for x in rows[::3]: print(x)
