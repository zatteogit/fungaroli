import sys, json, math
from datetime import date, timedelta
import numpy as np
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.learning import fit_encounter, predict_encounter
from tools.fronda_model.features import build_features, FEATURE_NAMES
# artefatto sintetico addestrato su covariate reali di features.py
rng=np.random.default_rng(11); rows=[]; T0={"train":date(2021,9,1),"calibration":date(2023,9,1),"test":date(2025,9,1)}
names=["precipitation_sum_mm_lag_0_7d","climatic_balance_mm_lag_7_14d","temperature_mean_c_last_20d","temperature_mean_c_squared_last_20d","elevation_m","season_sin","season_cos"]
for s,t0 in T0.items():
    for i in range(300):
        d=t0+timedelta(days=int(rng.integers(0,80)))
        wx=[{"date":(d-timedelta(days=k)).isoformat(),"precipitation_mm":float(max(0,rng.gamma(0.6,6)-2)),"temperature_mean_c":float(14+rng.normal(0,3)),"et0_mm":float(abs(rng.normal(2,0.5)))} for k in range(1,61)]
        f=build_features(wx,d,{"elevation_m":float(rng.uniform(400,1600))})["values"]
        eta=-2+0.05*(f["precipitation_sum_mm_lag_0_7d"]-10)-0.1*(f["temperature_mean_c_last_20d"]-13)**2
        y=int(rng.random()<1/(1+math.exp(-eta)))
        rows.append({"survey_id":f"{s}{i}","site_id":f"{s}{i%30}","spatial_block":f"{s}{i%5}","observer_id":"o","date":d.isoformat(),"target_taxon":"t","taxon_id":"t","searched":True,"research_consent":True,"result":"detected" if y else "not_detected","identification_status":"expert_verified" if y else "unreviewed","verification_ref":"r","duration_minutes":120,"effort_basis":"planned_protocol","search_completed":True,"observer_count":1,"protocol_version":"p","split":s,"features":{n:f[n] for n in names},"features_as_of":d.isoformat()+"T06:00:00+02:00","started_at":d.isoformat()+"T08:00:00+02:00","weather_provenance":"reanalysis"})
art,rep=fit_encounter(rows,names,"t")
queries=[{k:v for k,v in r.items() if k not in("result","split")} for r in rows if r["split"]=="test"][:50]
preds=[predict_encounter(art,q)["internal_encounter_probability"] for q in queries]
json.dump({"artifact":art,"queries":queries,"python":preds},open(sys.argv[2],"w"),allow_nan=False)
print("artefatto", len(json.dumps(art)), "byte; test brier cal", round(rep["test"]["calibrated"]["brier"],4), "clim", round(rep["test"]["climatology"]["brier"],4))
