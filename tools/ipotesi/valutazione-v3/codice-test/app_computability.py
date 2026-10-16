"""Quante delle 31 covariate sono calcolabili con le variabili che l'app chiede oggi (dati Open-Meteo reali, Rieti, 16/10/2026)."""
import sys, json
from collections import defaultdict
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.features import build_features
om92=json.load(open(sys.argv[2])); om62=json.load(open(sys.argv[3]))
d=om92["daily"]; h=om62["hourly"]
soil=defaultdict(list)
for t,v in zip(h["time"],h["soil_moisture_3_to_9cm"]):
    if v is not None: soil[t[:10]].append(v)
soil_day={k:sum(v)/len(v) for k,v in soil.items() if len(v)==24}
def rows(with_et0, with_soil):
    out=[]
    for i,day in enumerate(d["time"]):
        r={"date":day,"precipitation_mm":d["precipitation_sum"][i],"temperature_mean_c":d["temperature_2m_mean"][i]}
        if with_et0: r["et0_mm"]=d["et0_fao_evapotranspiration"][i]
        if with_soil: r["soil_moisture"]=soil_day.get(day)
        out.append(r)
    return out
ctx_app={"elevation_m":1450.0,"canopy_fraction":None,"host_fraction":None,"soil_ph":None}
for label,et0,sl in (("variabili attuali dell'app (P, Tmedia, suolo 3-9 cm), senza ET0",False,True),("piu' ET0 FAO",True,True)):
    res=build_features(rows(et0,sl),"2026-10-16",ctx_app)
    q=res["quality"]
    print(f"{label}: {len(q['complete_features'])}/31 calcolabili; mancanti: {q['missing_features']}")
print("primo giorno con P e T non nulli:", next(day for i,day in enumerate(d['time']) if d['precipitation_sum'][i] is not None))
