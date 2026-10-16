"""Offline research baseline for an encounter during a declared search.

Never estimates occupancy, latent growth, edibility or a public probability.
Fit one canonical taxon and protocol from consented, explicit searches with
known binary outcomes. Caller supplies train/calibration/test assignments;
calendar order, a >=60-day embargo, distinct spatial blocks and sites are
mandatory. No random split or automatically promoted production artifact.

Environmental features must be causal, numeric candidates; effort is appended
automatically. Names/timestamps catch common mistakes, not undocumented source
leakage. Reanalysis remains retrospective. Marginal training ranges are only a
conservative support check, not evidence of geographic transportability.

API: fit_encounter(rows, feature_names, taxon_id) -> (JSON artifact, report).
predict_encounter(artifact, row) accepts planned effort, taxon, protocol,
started_at, features_as_of, weather_provenance and features (no result needed).
Effort must declare effort_basis=planned_protocol. Negative outcomes require
search_completed=True; unfinished searches without detections are unknown.
All outputs remain research_only; public_probability is always None.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime
import hashlib
import json
import math
from numbers import Real
import re

import numpy as np
from scipy.optimize import minimize
from scipy.special import expit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss


SPLITS = ("train", "calibration", "test")
WEATHER = {"forecast_archive", "reanalysis"}
REVIEWED = {"expert_verified", "self_reported_checked"}
EFFORT = ("effort_duration_minutes", "effort_observer_count")
FORBIDDEN = {"result", "label", "detected", "detection", "identification",
             "harvest", "encounter", "probability", "yield", "outcome",
             "quantity", "abundance", "report", "reports", "survey", "taxon",
             "count", "counts", "found", "observation", "observations", "community",
             "collected", "sighting", "sightings", "positive", "negative", "occupancy",
             "growth", "presence", "absence", "fruiting"}


def _name(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be a nonempty string")
    return value


def _instant(value, label):
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if "T" not in value or result.tzinfo is None:
            raise ValueError()
        return result
    except (AttributeError, TypeError, ValueError) as exc:
        raise ValueError(f"{label} must be an ISO timestamp with timezone") from exc


def _number(value, label, nullable=True):
    if value is None and nullable:
        return math.nan
    try:
        valid = not isinstance(value, bool) and isinstance(value, Real) and math.isfinite(float(value))
    except (ValueError, OverflowError):
        valid = False
    if not valid:
        raise ValueError(f"{label} must be finite numeric data; bool is not a number")
    return float(value)


def _context(row, names):
    if row.get("effort_basis") != "planned_protocol":
        raise ValueError("effort_basis must be planned_protocol; outcome-dependent duration is not a predictor")
    for key in ("taxon_id", "target_taxon", "protocol_version"):
        _name(row.get(key), key)
    if row["target_taxon"] != row["taxon_id"]:
        raise ValueError("target_taxon must be the canonical taxon_id explicitly searched")
    started = _instant(row.get("started_at"), "started_at")
    if _instant(row.get("features_as_of"), "features_as_of") > started:
        raise ValueError("features_as_of is after started_at: target leakage")
    if row.get("weather_provenance") not in WEATHER:
        raise ValueError("weather_provenance must be forecast_archive or reanalysis")
    values = row.get("features")
    if not isinstance(values, dict):
        raise ValueError("features must be a numeric/null mapping")
    for key, value in values.items():
        if not isinstance(key, str) or FORBIDDEN.intersection(key.lower().split("_")):
            raise ValueError(f"forbidden outcome feature: {key}")
        _number(value, f"features.{key}")
    effort = [_number(row.get(key), key, False)
              for key in ("duration_minutes", "observer_count")]
    if not 0 < effort[0] <= 1440 or not 1 <= effort[1] <= 100 or not effort[1].is_integer():
        raise ValueError("duration_minutes must be in (0,1440]; observer_count integer in [1,100]")
    return [_number(values.get(key), key) for key in names] + effort


def _split_checks(rows, embargo_days):
    for key in ("survey_id", "site_id", "spatial_block"):
        groups = [{row[key] for row in rows if row["split"] == split} for split in SPLITS]
        if any(groups[i] & groups[j] for i in range(3) for j in range(i + 1, 3)):
            raise ValueError(f"{key} overlaps across splits")
    if len({row["survey_id"] for row in rows}) != len(rows):
        raise ValueError("duplicate survey_id for selected taxon")
    dates = [[date.fromisoformat(row["date"]) for row in rows if row["split"] == split]
             for split in SPLITS]
    if not all(dates):
        raise ValueError("explicit nonempty train, calibration and test splits are required")
    for earlier, later in zip(dates, dates[1:]):
        if (min(later) - max(earlier)).days < embargo_days:
            raise ValueError("splits must be chronological with the configured embargo")


def _domain(artifact, values):
    reasons = []
    if sum(math.isfinite(x) for x in values[:-2]) < artifact["min_observed_features"]:
        reasons.append("insufficient_observed_features")
    for name, value, support in zip(artifact["model_feature_names"], values, artifact["domain"]):
        if math.isnan(value):
            if not support["missing_seen"]:
                reasons.append(f"unseen_missingness:{name}")
        elif not support["min"] <= value <= support["max"]:
            reasons.append(f"outside_training_range:{name}")
    return reasons


def _transform(values, medians, mean, scale):
    values = np.asarray(values, dtype=float)
    missing = np.isnan(values)
    filled = np.where(missing, medians, values)
    return (np.concatenate((filled, missing.astype(float)), axis=1) - mean) / scale


def _logits(artifact, values):
    state = artifact["model"]
    transformed = _transform(values, np.array(state["medians"]),
                             np.array(state["mean"]), np.array(state["scale"]))
    return transformed @ np.array(state["coefficients"]) + state["intercept"]


def _metrics(y, probabilities):
    bins = []
    for index in range(10):
        mask = (probabilities >= index / 10) & ((probabilities < (index + 1) / 10)
                                              if index < 9 else probabilities <= 1)
        bins.append({"lower": index / 10, "upper": (index + 1) / 10,
                     "n": int(mask.sum()),
                     "mean_probability": float(probabilities[mask].mean()) if mask.any() else None,
                     "observed_rate": float(y[mask].mean()) if mask.any() else None})
    return {"n": len(y), "positives": int(y.sum()),
            "brier": float(brier_score_loss(y, probabilities)),
            "log_loss": float(log_loss(y, probabilities, labels=[0, 1])),
            "pr_auc_average_precision": float(average_precision_score(y, probabilities)),
            "reliability_bins": bins}


def fit_encounter(rows, feature_names, taxon_id, *, embargo_days=60,
                  allow_self_reported_checked=True):
    """Fit training-only imputation/scaling/ridge and calibration-only Platt.

    Each row needs split, survey/site/block/observer IDs, date, taxon_id,
    target_taxon equal to that canonical ID, searched=True, research_consent=True,
    result in detected/not_detected/unknown, identification_status for positives,
    planned duration_minutes, effort_basis=planned_protocol, observer_count,
    search_completed=True for negatives, protocol_version, features, features_as_of,
    started_at, weather_provenance. Unknown and unreviewed positives are counted
    as exclusions, never negative labels. Invalid records fail closed.
    """
    _name(taxon_id, "taxon_id")
    if isinstance(embargo_days, bool) or not isinstance(embargo_days, int) or embargo_days < 60:
        raise ValueError("embargo_days must be an integer >=60 for the 60-day candidate lags")
    if not isinstance(feature_names, (list, tuple)) or not all(isinstance(name, str) for name in feature_names):
        raise ValueError("feature_names must be a list/tuple of strings")
    names = list(feature_names)
    if not names or len(set(names)) != len(names):
        raise ValueError("feature_names must be a nonempty sequence of unique names")
    for name in names:
        if not isinstance(name, str) or not re.fullmatch(r"[a-z][a-z0-9_]*", name):
            raise ValueError("feature names must use lowercase snake_case")
        if name in EFFORT or FORBIDDEN.intersection(name.split("_")):
            raise ValueError(f"forbidden outcome/reserved feature: {name}")
    accepted, exclusions = [], Counter()
    for source in rows:
        if not isinstance(source, dict):
            raise ValueError("each row must be a mapping")
        if source.get("research_consent") is not True:
            raise ValueError("research_consent must be explicitly True")
        if source.get("searched") is not True:
            raise ValueError("searched must be explicitly True; omissions are not absences")
        for key in ("survey_id", "site_id", "spatial_block", "observer_id"):
            _name(source.get(key), key)
        values = _context(source, names)
        try:
            day = date.fromisoformat(source["date"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError("date must be an ISO calendar date") from exc
        if day.isoformat() != source["date"] or _instant(source["started_at"], "started_at").date() != day:
            raise ValueError("date must match the local started_at calendar date")
        if source.get("split") not in SPLITS:
            raise ValueError("each row needs explicit train/calibration/test split")
        result = source.get("result")
        if result not in {"detected", "not_detected", "unknown"}:
            raise ValueError("result must be detected, not_detected or unknown")
        if "search_completed" in source and not isinstance(source["search_completed"], bool):
            raise ValueError("search_completed must be boolean when provided")
        if result == "not_detected" and source.get("search_completed") is not True:
            raise ValueError("not_detected requires search_completed=True; interrupted searches are unknown")
        if source.get("identification_status") not in REVIEWED | {"unreviewed"}:
            raise ValueError("identification_status must be unreviewed, self_reported_checked or expert_verified")
        if source["identification_status"] == "expert_verified":
            _name(source.get("verification_ref"), "verification_ref for expert_verified")
        reason = None
        if source["taxon_id"] != taxon_id:
            reason = "other_taxon"
        elif result == "unknown":
            reason = "unknown_outcome"
        elif result == "detected" and (source.get("identification_status") not in REVIEWED
               or (not allow_self_reported_checked and source.get("identification_status") != "expert_verified")):
            reason = "unreviewed_positive"
        if reason:
            exclusions[reason] += 1
            continue
        if not any(math.isfinite(value) for value in values[:-2]):
            raise ValueError("each included row needs at least one observed environmental feature")
        accepted.append({**source, "_values": values, "_y": int(result == "detected")})
    _split_checks(accepted, embargo_days)
    protocols = {row["protocol_version"] for row in accepted}
    if len(protocols) != 1:
        raise ValueError("fit one protocol_version at a time")
    partitions = {split: [row for row in accepted if row["split"] == split] for split in SPLITS}
    for split, part in partitions.items():
        if {row["_y"] for row in part} != {0, 1}:
            raise ValueError(f"{split} requires both outcome classes")
    train = np.array([row["_values"] for row in partitions["train"]])
    if np.isnan(train).all(axis=0).any():
        raise ValueError("selected feature has no finite training data; select available features")
    medians = np.nanmedian(train, axis=0)
    filled = np.concatenate((np.where(np.isnan(train), medians, train), np.isnan(train)), axis=1)
    mean, scale = filled.mean(axis=0), filled.std(axis=0)
    scale[scale == 0] = 1
    estimator = LogisticRegression(C=1.0, solver="lbfgs", max_iter=2000)
    estimator.fit((filled - mean) / scale, [row["_y"] for row in partitions["train"]])
    if estimator.n_iter_[0] >= 2000:
        raise ValueError("ridge fit did not converge")
    sources = sorted({row["weather_provenance"] for row in partitions["train"]})
    artifact = {"schema_version": 1, "status": "research_only", "fitted": True,
                "public_probability": None, "target": "encounter_given_declared_search",
                "effort_basis": "planned_protocol",
                "taxon_id": taxon_id, "protocol_version": next(iter(protocols)),
                "feature_names": names, "model_feature_names": names + list(EFFORT),
                "weather_provenance": sources, "embargo_days": embargo_days,
                "evaluation_scope": "retrospective_reanalysis" if "reanalysis" in sources else "retrospective_forecast_archive",
                "prospective_skill_established": False,
                "min_observed_features": int(np.isfinite(train[:, :-2]).sum(axis=1).min()),
                "domain": [{"min": float(np.nanmin(train[:, i])), "max": float(np.nanmax(train[:, i])),
                            "missing_seen": bool(np.isnan(train[:, i]).any())} for i in range(train.shape[1])],
                "domain_limit": "marginal_ranges_do_not_establish_joint_or_geographic_support",
                "model": {"kind": "logistic_ridge", "C": 1.0, "medians": medians.tolist(),
                          "mean": mean.tolist(), "scale": scale.tolist(),
                          "coefficients": estimator.coef_[0].tolist(), "intercept": float(estimator.intercept_[0])}}
    supported = {split: [row for row in part if row["weather_provenance"] in sources
                         and not _domain(artifact, row["_values"])]
                 for split, part in partitions.items()}
    for split in ("calibration", "test"):
        if {row["_y"] for row in supported[split]} != {0, 1}:
            raise ValueError(f"{split} requires both classes inside training support")
    calibration = supported["calibration"]
    logits = _logits(artifact, [row["_values"] for row in calibration])
    labels = np.array([row["_y"] for row in calibration])
    # Platt's smoothed targets prevent infinite slopes under complete separation.
    positives, negatives = labels.sum(), len(labels) - labels.sum()
    targets = np.where(labels == 1, (positives + 1) / (positives + 2), 1 / (negatives + 2))
    def objective(parameters):
        scores = parameters[0] * logits + parameters[1]
        residual = expit(scores) - targets
        return np.sum(np.logaddexp(0, scores) - targets * scores), np.array([residual @ logits, residual.sum()])
    optimum = minimize(objective, [1.0, 0.0], jac=True, method="L-BFGS-B")
    if not optimum.success:
        raise ValueError("Platt calibration did not converge")
    artifact["calibrator"] = {"kind": "platt_smoothed", "slope": float(optimum.x[0]), "intercept": float(optimum.x[1])}
    canonical = [{key: value for key, value in row.items() if key not in {"_values", "_y"}} for row in accepted]
    encoded = json.dumps(sorted(canonical, key=lambda row: row["survey_id"]), sort_keys=True, allow_nan=False).encode()
    artifact["dataset_sha256"] = hashlib.sha256(encoded).hexdigest()
    artifact["split_counts"] = {split: {"n": len(part), "positives": sum(row["_y"] for row in part)} for split, part in partitions.items()}
    test = supported["test"]
    y = np.array([row["_y"] for row in test])
    test_logits = _logits(artifact, [row["_values"] for row in test])
    probability = expit(optimum.x[0] * test_logits + optimum.x[1])
    prevalence = float(np.mean([row["_y"] for row in partitions["train"]]))
    report = {"status": "research_only", "public_probability": None,
              "dataset_sha256": artifact["dataset_sha256"], "exclusions": dict(exclusions),
              "split_counts": artifact["split_counts"], "training_climatology": prevalence,
              "identification_counts": dict(Counter(row.get("identification_status", "not_applicable") for row in accepted if row["_y"])),
              "support_coverage": {split: {"eligible": len(supported[split]), "total": len(part)} for split, part in partitions.items()},
              "evaluation_scope": artifact["evaluation_scope"], "prospective_skill_established": False,
              "test": {"raw": _metrics(y, expit(test_logits)), "calibrated": _metrics(y, probability),
                       "climatology": _metrics(y, np.full(len(y), prevalence))},
              "uncertainty": "no_cluster_bootstrap_computed; independent_field_validation_required"}
    json.dumps(artifact, allow_nan=False)
    return artifact, report


def predict_encounter(artifact, row):
    """Return an internal research value only for a supported, fitted query."""
    output = {"status": "research_only", "public_probability": None,
              "internal_encounter_probability": None, "reasons": []}
    if (not isinstance(artifact, dict) or artifact.get("fitted") is not True
            or artifact.get("schema_version") != 1 or artifact.get("effort_basis") != "planned_protocol"):
        output["reasons"] = ["unfitted_or_unsupported_artifact"]
        return output
    try:
        values = _context(row, artifact["feature_names"])
        reasons = _domain(artifact, values)
        for key in ("taxon_id", "protocol_version"):
            if row[key] != artifact[key]:
                reasons.append(f"unseen_{key}")
        if row["weather_provenance"] not in artifact["weather_provenance"]:
            reasons.append("unseen_weather_provenance")
        output["evaluation_scope"] = artifact["evaluation_scope"]
        output["prospective_skill_established"] = False
        if not reasons:
            logit = _logits(artifact, [values])[0]
            calibration = artifact["calibrator"]
            probability = float(expit(calibration["slope"] * logit + calibration["intercept"]))
            if not math.isfinite(probability):
                raise ValueError("nonfinite fitted probability")
            output["internal_encounter_probability"] = probability
        output["reasons"] = reasons
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        output["reasons"] = [f"invalid_query_or_artifact:{exc}"]
    return output
