"""Casi limite per features.py (copia in scratch)."""
import sys, json
from datetime import date, timedelta
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.features import build_features, FEATURE_NAMES
from tools.fronda_model.learning import FORBIDDEN

T = date(2026, 10, 16)
CTX = {"elevation_m": 950, "canopy_fraction": 0.8, "host_fraction": 0.6, "soil_ph": 5.5}
def wx(days=60, soil=True):
    out=[]
    for lag in range(days,0,-1):
        d=T-timedelta(days=lag)
        r={"date":d.isoformat(),"precipitation_mm":1,"temperature_mean_c":10,"temperature_min_c":5,"temperature_max_c":15,"et0_mm":2}
        if soil: r["soil_moisture"]=0.3
        out.append(r)
    return out

# 0) nomi delle covariate contro la lista FORBIDDEN di learning.py
bad=[n for n in FEATURE_NAMES if FORBIDDEN.intersection(n.lower().split("_"))]
print("0) FEATURE_NAMES con token vietati in learning:", bad, "| totale covariate:", len(FEATURE_NAMES))

# 1) un solo giorno mancante a diverse distanze: quante covariate si perdono
for lag in (1, 8, 20, 45, 60):
    rows=[r for r in wx() if r["date"]!=(T-timedelta(days=lag)).isoformat()]
    res=build_features(rows,T,CTX)
    print(f"1) buco a D-{lag}: covariate mancanti {len(res['quality']['missing_features'])}/31")

# 2) solo 58 giorni (come Open-Meteo forecast oggi): cosa manca
res=build_features(wx(58),T,CTX)
print("2) storico di 58 giorni:", res["quality"]["missing_features"])

# 3) giorno D incluso o escluso? valore anomalo il giorno D e D-1
rows=wx(); rows.append({"date":T.isoformat(),"precipitation_mm":500,"temperature_mean_c":10,"et0_mm":2})
a=build_features(rows,T,CTX)["values"]["precipitation_sum_mm_lag_0_7d"]
rows=wx(); rows[-1]["precipitation_mm"]=500
b=build_features(rows,T,CTX)["values"]["precipitation_sum_mm_lag_0_7d"]
print("3) pioggia 500 mm il giorno D ->", a, "| il giorno D-1 ->", b)

# 4) unità: input in pollici o Kelvin non viene intercettato
rows=wx()
for r in rows: r["temperature_mean_c"]=283.15; r["temperature_min_c"]=278.15; r["temperature_max_c"]=288.15
print("4) temperatura in Kelvin accettata? T7 =", build_features(rows,T,CTX)["values"]["temperature_mean_c_last_7d"])
rows=wx()
for r in rows: r["soil_moisture"]=0.9
print("4b) umidità suolo 0,9 m3/m3 (fisicamente oltre la porosità) accettata:", build_features(rows,T,CTX)["values"]["soil_moisture_mean_last_7d"])
try:
    print("4c) quota 99999 m accettata:", build_features(wx(),T,{"elevation_m":99999})["values"]["elevation_m"])
except ValueError as e: print("4c) rifiutata", e)

# 5) temperature min/max: usate da qualche covariata?
rows=wx()
for r in rows: r["temperature_min_c"]=-20; r["temperature_max_c"]=40
base=build_features(wx(),T,CTX)["values"]; alt=build_features(rows,T,CTX)["values"]
print("5) cambiano le covariate se Tmin=-20 e Tmax=40 ogni giorno?", base!=alt)

# 6) collinearità T20 e T20^2 nell'intervallo tipico 5-20 °C
import statistics
xs=[5+0.1*i for i in range(151)]; ys=[x*x for x in xs]
print("6) correlazione T20 vs T20^2 in 5-20 °C:", round(statistics.correlation(xs,ys),4))

# 7) stagionalità al cambio d'anno e anno bisestile
for d in ("2025-12-31","2026-01-01","2024-12-31"):
    v=build_features([],d,{})["values"]; print("7)", d, round(v["season_sin"],4), round(v["season_cos"],4))
