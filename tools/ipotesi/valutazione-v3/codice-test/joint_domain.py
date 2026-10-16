"""Supporto congiunto: quota e temperatura correlate nel training; query con combinazione mai vista."""
import sys, math
from datetime import date, timedelta
import numpy as np
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.learning import fit_encounter, predict_encounter
TAX="t"; rng=np.random.default_rng(3); rows=[]
st={"train":date(2021,8,1),"calibration":date(2023,8,1),"test":date(2025,8,1)}
for s in st:
    for i in range(400):
        elev=rng.uniform(300,1800); temp=22-0.0065*elev+rng.normal(0,1)   # gradiente termico
        p=1/(1+math.exp(-(-2+0.002*(elev-1000)-0.3*(temp-15)**2/4))); y=int(rng.random()<p); d=st[s]+timedelta(days=int(rng.integers(0,90)))
        rows.append({"survey_id":f"{s}{i}","site_id":f"{s}{i%40}","spatial_block":f"{s}{i%6}","observer_id":"o","date":d.isoformat(),
          "target_taxon":TAX,"taxon_id":TAX,"searched":True,"research_consent":True,"result":"detected" if y else "not_detected",
          "identification_status":"expert_verified" if y else "unreviewed","verification_ref":"r","duration_minutes":120,
          "effort_basis":"planned_protocol","search_completed":True,"observer_count":1,"protocol_version":"p","split":s,
          "features":{"elevation_m":elev,"temperature_mean_c_last_20d":temp},"features_as_of":d.isoformat()+"T06:00:00+02:00",
          "started_at":d.isoformat()+"T08:00:00+02:00","weather_provenance":"reanalysis"})
a,r=fit_encounter(rows,["elevation_m","temperature_mean_c_last_20d"],TAX)
print("domini marginali:", [(round(x["min"]),round(x["max"])) for x in a["domain"][:2]])
q={k:v for k,v in rows[-1].items() if k not in ("result","split")}
for elev,temp in ((1700,11),(1700,19),(350,8)):
    q["features"]={"elevation_m":elev,"temperature_mean_c_last_20d":temp}
    o=predict_encounter(a,q); print(f"quota {elev} m, T20 {temp} °C -> p={o['internal_encounter_probability']:.3f} motivi={o['reasons']}")
