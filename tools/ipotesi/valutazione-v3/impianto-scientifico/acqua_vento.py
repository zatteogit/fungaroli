# Bilancio idrico del documento B (somma di max(0, P - ET0)) contro pioggia grezza e P - ET0 con segno,
# confrontati con l'umidità del suolo del modello; frequenza della penalità vento del documento B.
# Uso: python3 -I acqua_vento.py <dataset.json> <ids.json> <icon|era5> <from> <to>
import json, sys, math
from statistics import median
f, idsf, soil, a, b = sys.argv[1:6]
data = json.load(open(f)); ids = json.load(open(idsf))

def rank(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0]*len(v); i = 0
    while i < len(o):
        j = i
        while j+1 < len(o) and v[o[j+1]] == v[o[i]]: j += 1
        for k in range(i, j+1): r[o[k]] = (i+j)/2
        i = j+1
    return r
def pear(x, y):
    n = len(x); mx = sum(x)/n; my = sum(y)/n
    s = sum((p-mx)*(q-my) for p, q in zip(x, y)); dx = math.sqrt(sum((p-mx)**2 for p in x)); dy = math.sqrt(sum((q-my)**2 for q in y))
    return s/(dx*dy) if dx and dy else float('nan')
def spear(x, y): return pear(rank(x), rank(y))

def daily_soil(loc, key):
    if soil == 'era5':
        k = {'shallow': 'soil_moisture_0_to_7cm_mean', 'deep': 'soil_moisture_7_to_28cm_mean'}[key]
        return loc['daily'][k]
    k = {'shallow': 'soil_moisture_3_to_9cm', 'deep': 'soil_moisture_9_to_27cm'}[key]
    h = loc['hourly']; by = {}
    for t, v in zip(h['time'], h[k]):
        d = t[:10]; by.setdefault(d, []).append(v)
    return [(sum(x)/len(x)) if (x := [v for v in by.get(d, []) if v is not None]) and len(x) >= 24 else None for d in loc['daily']['time']]

res = {}
for W in (7, 14, 30):
    pooled = {'raw': [], 'trunc': [], 'bal': [], 'ys': [], 'yd': []}
    within = {m: {'s': [], 'd': []} for m in ('raw', 'trunc', 'bal')}
    corr_raw_trunc = []
    for k, loc in enumerate(data):
        d = loc['daily']; t = d['time']; P = d['precipitation_sum']; E = d['et0_fao_evapotranspiration']
        ys = daily_soil(loc, 'shallow'); yd = daily_soil(loc, 'deep')
        pts = {'raw': [], 'trunc': [], 'bal': [], 'ys': [], 'yd': []}
        for i in range(W, len(t)):
            if not (a <= t[i] <= b): continue
            win = range(i-W, i)
            if any(P[j] is None or E[j] is None for j in win) or ys[i] is None or yd[i] is None: continue
            pts['raw'].append(sum(P[j] for j in win))
            pts['trunc'].append(sum(max(0.0, P[j]-E[j]) for j in win))
            pts['bal'].append(sum(P[j]-E[j] for j in win))
            pts['ys'].append(ys[i]); pts['yd'].append(yd[i])
        if len(pts['raw']) < 10: continue
        for m in ('raw', 'trunc', 'bal'):
            within[m]['s'].append(spear(pts[m], pts['ys'])); within[m]['d'].append(spear(pts[m], pts['yd']))
        corr_raw_trunc.append(spear(pts['raw'], pts['trunc']))
        for kk in pooled: pooled[kk] += pts[kk]
    if not pooled['raw']: continue
    res[f'{W}d'] = {
        'n': len(pooled['raw']), 'points': len(corr_raw_trunc),
        'median_within_point_spearman_with_shallow_soil': {m: round(median([x for x in within[m]['s'] if x == x]), 2) for m in within},
        'median_within_point_spearman_with_deeper_soil': {m: round(median([x for x in within[m]['d'] if x == x]), 2) for m in within},
        'median_within_point_spearman_raw_vs_trunc': round(median([x for x in corr_raw_trunc if x == x]), 3),
        'median_share_of_rain_removed_by_trunc': round(median([1 - tr/r for r, tr in zip(pooled['raw'], pooled['trunc']) if r > 5]), 3),
    }

# Penalità vento del documento B: nei 3 giorni precedenti vento o raffica > 35 km/h e UR minima < 45 %
wind = {'days': 0, 'gust_rule': 0, 'mean_wind_rule': 0, 'penalty_values_gust': []}
for loc in data:
    d = loc['daily']; t = d['time']
    for i in range(3, len(t)):
        if not (a <= t[i] <= b): continue
        g = [d['wind_gusts_10m_max'][j] for j in range(i-3, i)]; w = [d['wind_speed_10m_max'][j] for j in range(i-3, i)]
        rh = [d['relative_humidity_2m_min'][j] for j in range(i-3, i)]
        if None in g or None in w or None in rh: continue
        wind['days'] += 1
        hitg = [x for x, h in zip(g, rh) if x > 35 and h < 45]; hitw = [x for x, h in zip(w, rh) if x > 35 and h < 45]
        if hitg:
            wind['gust_rule'] += 1; wind['penalty_values_gust'].append(min(0.4, max(0, (max(hitg)-30)/35)))
        if hitw: wind['mean_wind_rule'] += 1
pv = wind.pop('penalty_values_gust')
wind['share_gust_rule'] = round(wind['gust_rule']/max(1, wind['days']), 3)
wind['share_wind_max_rule'] = round(wind['mean_wind_rule']/max(1, wind['days']), 3)
wind['median_penalty_when_active'] = round(median(pv), 3) if pv else None
wind['share_penalty_at_cap_0_4'] = round(sum(1 for x in pv if x >= 0.4)/len(pv), 3) if pv else None
gusts = [x for loc in data for x, tt in zip(loc['daily']['wind_gusts_10m_max'], loc['daily']['time']) if x is not None and a <= tt <= b]
wind['median_daily_max_gust_kmh'] = median(gusts); wind['share_days_gust_gt_35'] = round(sum(1 for x in gusts if x > 35)/len(gusts), 3)
vpd = [x for loc in data for x, tt in zip(loc['daily']['vapour_pressure_deficit_max'], loc['daily']['time']) if x is not None and a <= tt <= b]
wind['vpd_max_kpa_quantiles'] = [round(sorted(vpd)[int(p*(len(vpd)-1))], 2) for p in (0.1, 0.5, 0.9)]
print(json.dumps({'file': f, 'soil': soil, 'from': a, 'to': b, 'water': res, 'wind_docB': wind}, indent=1))
