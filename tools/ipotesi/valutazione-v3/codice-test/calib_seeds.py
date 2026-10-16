"""Platt su calibrazione piccola: aiuta o peggiora? Più semi, scenario senza e con spostamento di prevalenza."""
import sys, math
from datetime import date, timedelta
import numpy as np
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.learning import fit_encounter, predict_encounter
TAX="t"
def row(split,i,day,site,block,y,feats,dur):
    return {"survey_id":f"{split}-{i}","site_id":site,"spatial_block":block,"observer_id":"o","date":day.isoformat(),
      "target_taxon":TAX,"taxon_id":TAX,"searched":True,"research_consent":True,"result":"detected" if y else "not_detected",
      "identification_status":"expert_verified" if y else "unreviewed","verification_ref":"r","duration_minutes":dur,
      "effort_basis":"planned_protocol","search_completed":True,"observer_count":1,"protocol_version":"p","split":split,
      "features":feats,"features_as_of":day.isoformat()+"T06:00:00+02:00","started_at":day.isoformat()+"T08:00:00+02:00","weather_provenance":"reanalysis"}
def sim(seed,n,shift):
    rng=np.random.default_rng(seed); rows=[]
    st={"train":date(2021,8,1),"calibration":date(2023,8,1),"test":date(2025,8,1)}
    for s in st:
        off= shift if s!="train" else 0.0   # spostamento di intercetta (anno/luoghi diversi)
        for i in range(n):
            x=rng.normal(0,1); z=rng.normal(0,1)
            p=1/(1+math.exp(-(-2.2+off+1.2*x-0.6*z))); y=int(rng.random()<p)
            rows.append(row(s,i,st[s]+timedelta(days=int(rng.integers(0,90))),f"{s}{i%40}",f"{s}{i%6}",y,{"x":float(x),"z":float(z)},120))
    return rows
for n in (150,400,1500):
  for shift in (0.0,1.0):
    d=[]
    for seed in range(20):
        try:
            a,r=fit_encounter(sim(seed,n,shift),["x","z"],TAX)
            d.append((r["test"]["raw"]["brier"],r["test"]["calibrated"]["brier"],r["test"]["climatology"]["brier"],a["calibrator"]["slope"]))
        except ValueError as e: pass
    d=np.array(d)
    print(f"n/split={n:5d} shift={shift}: semi validi {len(d)}, Brier raw {d[:,0].mean():.4f} cal {d[:,1].mean():.4f} clim {d[:,2].mean():.4f}; cal peggiore di raw in {int((d[:,1]>d[:,0]).sum())}/{len(d)}; pendenza Platt media {d[:,3].mean():.2f} (min {d[:,3].min():.2f})")
