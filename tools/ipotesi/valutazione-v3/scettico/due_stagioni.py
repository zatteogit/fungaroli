"""Verifica: gli split di learning.py stanno in 2 stagioni (train e calibrazione nella stessa, test nella successiva)?"""
import sys, math
from datetime import date, timedelta
import numpy as np
sys.path.insert(0, sys.argv[1])
from tools.fronda_model.learning import fit_encounter
rng = np.random.default_rng(11); TAX = "t"; rows = []
plan = {"train": (date(2027, 8, 1), 31), "calibration": (date(2027, 10, 31), 31), "test": (date(2028, 8, 1), 61)}
for split, (start, span) in plan.items():
    for i in range(300):
        d = start + timedelta(days=int(rng.integers(0, span)))
        x = rng.normal(); y = int(rng.random() < 1 / (1 + math.exp(-(-1 + 1.2 * x))))
        rows.append({"survey_id": f"{split}{i}", "site_id": f"{split}-s{i%30}", "spatial_block": f"{split}-b{i%5}", "observer_id": f"o{i%7}",
                     "date": d.isoformat(), "target_taxon": TAX, "taxon_id": TAX, "searched": True, "research_consent": True,
                     "result": "detected" if y else "not_detected", "identification_status": "expert_verified" if y else "unreviewed",
                     "verification_ref": "r", "duration_minutes": 120, "effort_basis": "planned_protocol", "search_completed": True,
                     "observer_count": 1, "protocol_version": "p", "split": split, "features": {"rain_index": float(x)},
                     "features_as_of": d.isoformat() + "T06:00:00+02:00", "started_at": d.isoformat() + "T08:00:00+02:00",
                     "weather_provenance": "reanalysis"})
mx = {s: max(r["date"] for r in rows if r["split"] == s) for s in plan}; mn = {s: min(r["date"] for r in rows if r["split"] == s) for s in plan}
print("intervalli", {s: (mn[s], mx[s]) for s in plan})
try:
    a, r = fit_encounter(rows, ["rain_index"], TAX)
    print("ACCETTATO con 2 stagioni:", r["split_counts"])
except ValueError as e:
    print("RIFIUTATO:", e)
