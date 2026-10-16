"""Casi limite per learning.py (copia in scratch). Dati sintetici: verificano il software, non l'ecologia."""
import sys, json, math
from copy import deepcopy
from datetime import date, timedelta
import numpy as np
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.learning import fit_encounter, predict_encounter

TAX="boletus-edulis"
rng=np.random.default_rng(7)

def row(split, i, day, site, block, y, feats, dur=120, obs=1):
    return {"survey_id":f"{split}-{i}","site_id":site,"spatial_block":block,"observer_id":f"o{i%7}",
            "date":day.isoformat(),"target_taxon":TAX,"taxon_id":TAX,"searched":True,"research_consent":True,
            "result":"detected" if y else "not_detected","identification_status":"expert_verified" if y else "unreviewed",
            "verification_ref":"ref" if y else None,"duration_minutes":dur,"effort_basis":"planned_protocol",
            "search_completed":True,"observer_count":obs,"protocol_version":"p1","split":split,"features":feats,
            "features_as_of":f"{day.isoformat()}T06:00:00+02:00","started_at":f"{day.isoformat()}T08:00:00+02:00",
            "weather_provenance":"reanalysis"}

def simulate(n_per_split=400, prev_shift=0.0, beta=(1.2,-0.8), b0=-2.2, shift_test=0.0):
    rows=[]; truth={}
    starts={"train":date(2021,8,1),"calibration":date(2023,8,1),"test":date(2025,8,1)}
    for split in ("train","calibration","test"):
        for i in range(n_per_split):
            day=starts[split]+timedelta(days=int(rng.integers(0,90)))
            block=f"{split}-b{i%6}"; site=f"{split}-s{i%40}"
            rain=rng.normal(0,1)+(shift_test if split=="test" else 0); temp=rng.normal(0,1)
            dur=float(rng.choice([60,120,180]))
            eta=b0+beta[0]*rain+beta[1]*temp**2+0.004*(dur-120)
            p=1/(1+math.exp(-eta)); y=int(rng.random()<p)
            r=row(split,i,day,site,block,y,{"rain_index":float(rain),"temp_anom":float(temp),"temp_anom_sq":float(temp**2)},dur)
            truth[r["survey_id"]]=p; rows.append(r)
    return rows, truth

# A) recupero su dati generati da un modello logistico noto
rows,truth=simulate()
art,rep=fit_encounter(rows,["rain_index","temp_anom","temp_anom_sq"],TAX)
t=rep["test"]
print("A) prevalenza train", round(rep["training_climatology"],3), "| test n", t["calibrated"]["n"], "pos", t["calibrated"]["positives"])
for k in ("raw","calibrated","climatology"): print("   ", k, "brier", round(t[k]["brier"],4), "logloss", round(t[k]["log_loss"],4), "AP", round(t[k]["pr_auc_average_precision"],3))
print("   Platt", art["calibrator"], "| copertura", rep["support_coverage"])
# confronto con probabilità vere sui test supportati
P=[];Q=[]
for r in rows:
    if r["split"]!="test": continue
    q={k:v for k,v in r.items() if k not in("result","split")}
    o=predict_encounter(art,q)
    if o["internal_encounter_probability"] is not None: P.append(truth[r["survey_id"]]); Q.append(o["internal_encounter_probability"])
P=np.array(P);Q=np.array(Q)
print("   MAE prob. vera vs stimata", round(float(np.abs(P-Q).mean()),4), "| astensioni test", 400-len(P))

# B) un solo sito / un solo blocco
rows1=deepcopy(rows)
for r in rows1: r["site_id"]="unico"; r["spatial_block"]="unico"
try: fit_encounter(rows1,["rain_index"],TAX)
except ValueError as e: print("B) un solo sito:", e)

# C) classi sbilanciate: ~1-2% positivi, pochi positivi in calibrazione
rows2,_=simulate(b0=-5.5)
for s in ("train","calibration","test"): print("C) positivi", s, sum(r["result"]=="detected" for r in rows2 if r["split"]==s), "/", sum(r["split"]==s for r in rows2))
try:
    art2,rep2=fit_encounter(rows2,["rain_index","temp_anom","temp_anom_sq"],TAX)
    print("   addestrato: Platt", {k:round(v,3) if isinstance(v,float) else v for k,v in art2["calibrator"].items()}, "| test cal. brier", round(rep2["test"]["calibrated"]["brier"],4), "clim.", round(rep2["test"]["climatology"]["brier"],4))
except ValueError as e: print("   rifiutato:", e)

# C2) minimo assoluto: 1 positivo per split, 3 righe per split
mini=[]
for split,start in (("train",date(2024,1,1)),("calibration",date(2024,4,1)),("test",date(2024,7,1))):
    for i,y in enumerate((1,0,0)):
        mini.append(row(split,i,start+timedelta(days=i),f"{split}-s{i}",f"{split}-b",y,{"rain_index":float(i)}))
try:
    a3,r3=fit_encounter(mini,["rain_index"],TAX); print("C2) addestramento accettato con 3 righe per split e 1 positivo: n train", r3["split_counts"]["train"])
except ValueError as e: print("C2) rifiutato:", e)

# D) Platt con pendenza negativa: il calibratore inverte l'ordinamento senza avviso?
rows3=deepcopy(rows)
for r in rows3:
    if r["split"]=="calibration":
        r["features"]["rain_index"]*=-1
art3,rep3=fit_encounter(rows3,["rain_index","temp_anom","temp_anom_sq"],TAX)
print("D) Platt con relazione invertita in calibrazione:", {k:round(v,3) if isinstance(v,float) else v for k,v in art3["calibrator"].items()}, "| AP test raw", round(rep3["test"]["raw"]["pr_auc_average_precision"],3), "cal", round(rep3["test"]["calibrated"]["pr_auc_average_precision"],3))

# E) sito nuovo fuori dominio marginale e dentro i marginali ma fuori dal supporto congiunto
q={k:v for k,v in rows[-1].items() if k not in("result","split")}
q["site_id"]="nuovo"; q["features"]={"rain_index":50.0,"temp_anom":0.0,"temp_anom_sq":0.0}
print("E) fuori range:", predict_encounter(art,q)["reasons"])
q["features"]={"rain_index":0.0,"temp_anom":2.5,"temp_anom_sq":0.0}  # combinazione impossibile (sq != anom^2)
print("E2) dentro i marginali ma combinazione mai vista: p =", predict_encounter(art,q)["internal_encounter_probability"], predict_encounter(art,q)["reasons"])

# F) previsione operativa con meteo corrente (non archivio)
q=dict(q); q["features"]={"rain_index":0.1,"temp_anom":0.2,"temp_anom_sq":0.04}
for prov in ("current_forecast","forecast_archive","reanalysis"):
    o=predict_encounter(art,{**q,"weather_provenance":prov}); print("F) provenienza", prov, "->", o["internal_encounter_probability"] is not None, o["reasons"][:1])

# G) sforzo fuori range e effetto lineare dello sforzo
for dur in (30,60,180,240):
    o=predict_encounter(art,{**q,"weather_provenance":"reanalysis","duration_minutes":dur}); print("G) durata", dur, "->", None if o["internal_encounter_probability"] is None else round(o["internal_encounter_probability"],3), o["reasons"])

# H) osservatore condiviso tra split: consentito?
rows4=deepcopy(rows)
print("H) osservatori condivisi tra split:", len({r['observer_id'] for r in rows4 if r['split']=='train'} & {r['observer_id'] for r in rows4 if r['split']=='test'}), "- fit accettato:", bool(fit_encounter(rows4,["rain_index"],TAX)))

# I) started_at in UTC che cade nel giorno successivo in ora locale
r=deepcopy(rows[0]); r["started_at"]=r["date"]+"T23:30:00Z"; r["features_as_of"]=r["date"]+"T06:00:00Z"
rows5=deepcopy(rows); rows5[0]=r
try: fit_encounter(rows5,["rain_index"],TAX); print("I) started_at 23:30Z (01:30 ora italiana del giorno dopo) accettato con date = giorno UTC")
except ValueError as e: print("I)", e)

# J) min_observed_features: una sola riga di training con una sola covariata osservata abbassa la soglia per tutti
rows6=deepcopy(rows)
rows6[0]["features"]={"rain_index":0.1,"temp_anom":None,"temp_anom_sq":None}
art6,_=fit_encounter(rows6,["rain_index","temp_anom","temp_anom_sq"],TAX)
print("J) min_observed_features =", art6["min_observed_features"], "; missing_seen", [d["missing_seen"] for d in art6["domain"]])

# K) C fisso, nessuna selezione: righe di training per covariata (EPV)
print("K) C =", art["model"]["C"], "| colonne nel modello (con indicatori di mancanza):", len(art["model"]["coefficients"]))
