"""Software guards on synthetic fixtures, not a field accuracy assessment.

Run: python3 -m unittest tools.fronda_model.test_learning
No fixture/model artifact is written or presented as a real fitted probability.
"""

from copy import deepcopy
from datetime import date, timedelta
import json
import unittest

from tools.fronda_model.learning import fit_encounter, predict_encounter


TAXON = "boletus-edulis"


def surveys():
    rows = []
    labels = (0, 0, 1, 0, 1, 1, 0, 1)
    for split, start in (("train", date(2024, 1, 1)),
                         ("calibration", date(2024, 4, 1)),
                         ("test", date(2024, 7, 1))):
        for index, label in enumerate(labels):
            day = (start + timedelta(days=index)).isoformat()
            rows.append({"survey_id": f"{split}-{index}", "site_id": f"site-{split}-{index // 2}",
                         "spatial_block": f"block-{split}", "observer_id": f"observer-{index}",
                         "date": day, "target_taxon": TAXON, "taxon_id": TAXON,
                         "searched": True, "research_consent": True,
                         "result": "detected" if label else "not_detected",
                         "identification_status": "expert_verified" if label else "unreviewed",
                         "verification_ref": f"synthetic-review-{split}-{index}" if label else None,
                         "duration_minutes": 30 + index, "effort_basis": "planned_protocol",
                         "search_completed": True, "observer_count": 2,
                         "protocol_version": "synthetic-search-v1", "split": split,
                         "features": {"rain": float(index), "soil": 0.1 + index / 100},
                         "features_as_of": f"{day}T06:00:00Z", "started_at": f"{day}T08:00:00Z",
                         "weather_provenance": "forecast_archive"})
    return rows


class LearningTests(unittest.TestCase):
    def setUp(self):
        self.rows = surveys()

    def fit(self, rows=None, names=None, **kwargs):
        return fit_encounter(self.rows if rows is None else rows, names or ["rain", "soil"], TAXON, **kwargs)

    def test_artifact_is_json_and_probability_always_research_only(self):
        artifact, report = self.fit()
        artifact = json.loads(json.dumps(artifact, allow_nan=False))
        query = deepcopy(self.rows[-1])
        for key in ("result", "identification_status", "research_consent", "searched", "split"):
            query.pop(key)
        prediction = predict_encounter(artifact, query)
        self.assertEqual(prediction["status"], "research_only")
        self.assertIsNone(prediction["public_probability"])
        self.assertTrue(0 < prediction["internal_encounter_probability"] < 1)
        self.assertEqual(prediction["reasons"], [])
        self.assertEqual(report["training_climatology"], 0.5)
        self.assertEqual(report["split_counts"]["test"], {"n": 8, "positives": 4})
        for variant in ("raw", "calibrated", "climatology"):
            metric = report["test"][variant]
            self.assertEqual(metric["n"], 8)
            self.assertEqual(sum(item["n"] for item in metric["reliability_bins"]), 8)
            self.assertTrue(0 <= metric["brier"] <= 1)

    def test_test_labels_and_values_never_change_fitted_parameters(self):
        original, report = self.fit()
        for row in self.rows:
            if row["split"] == "test":
                row["result"] = "not_detected" if row["result"] == "detected" else "detected"
                row["identification_status"] = "self_reported_checked"
                row["features"]["rain"] = 7 - row["features"]["rain"]
        changed, changed_report = self.fit()
        for key in ("model", "calibrator", "domain", "min_observed_features"):
            self.assertEqual(original[key], changed[key])
        self.assertNotEqual(report["test"], changed_report["test"])
        self.assertNotEqual(original["dataset_sha256"], changed["dataset_sha256"])

    def test_only_calibration_changes_platt_and_not_base_model(self):
        original, _ = self.fit()
        for row in self.rows:
            if row["split"] == "calibration":
                row["result"] = "not_detected" if row["result"] == "detected" else "detected"
                row["identification_status"] = "self_reported_checked"
        changed, _ = self.fit()
        self.assertEqual(original["model"], changed["model"])
        self.assertEqual(original["model"]["medians"][:2], [3.5, 0.135])
        self.assertNotEqual(original["calibrator"], changed["calibrator"])

    def test_unknown_and_unreviewed_positives_are_excluded_not_negative(self):
        for result, review in (("unknown", "unreviewed"), ("detected", "unreviewed")):
            extra = deepcopy(self.rows[0])
            extra.update(survey_id=f"extra-{result}", result=result, identification_status=review)
            self.rows.append(extra)
        _, report = self.fit()
        self.assertEqual(report["exclusions"], {"unknown_outcome": 1, "unreviewed_positive": 1})
        self.assertEqual(report["split_counts"]["train"], {"n": 8, "positives": 4})

    def test_self_reported_checked_is_counted_and_can_be_excluded(self):
        extra = deepcopy(self.rows[2])
        extra.update(survey_id="self-report", identification_status="self_reported_checked")
        self.rows.append(extra)
        _, included = self.fit()
        _, excluded = self.fit(allow_self_reported_checked=False)
        self.assertEqual(included["identification_counts"]["self_reported_checked"], 1)
        self.assertEqual(excluded["exclusions"]["unreviewed_positive"], 1)

    def test_no_consent_or_no_explicit_search_cannot_enter_training(self):
        for key in ("research_consent", "searched"):
            for value in (False, None, 1):
                with self.subTest(key=key, value=value):
                    rows = surveys()
                    rows[0][key] = value
                    with self.assertRaisesRegex(ValueError, key):
                        self.fit(rows)

    def test_incomplete_or_undeclared_search_cannot_be_a_negative(self):
        for value in (False, None, 1, "true"):
            rows = surveys()
            rows[0]["search_completed"] = value
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, "search_completed"):
                self.fit(rows)
        self.rows[0].pop("search_completed")
        with self.assertRaisesRegex(ValueError, "search_completed"):
            self.fit()

    def test_incomplete_detected_is_positive_and_incomplete_unknown_is_excluded(self):
        self.rows[2]["search_completed"] = False
        self.rows[0].update(result="unknown", search_completed=False)
        _, report = self.fit()
        self.assertEqual(report["exclusions"], {"unknown_outcome": 1})
        self.assertEqual(report["split_counts"]["train"], {"n": 7, "positives": 4})

    def test_observed_or_undeclared_effort_is_rejected_in_fit_and_predict(self):
        artifact, _ = self.fit()
        for value in ("observed", "until_first_success", None):
            rows = surveys()
            rows[0]["effort_basis"] = value
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "effort_basis"):
                    self.fit(rows)
                query = {**self.rows[-1], "effort_basis": value}
                prediction = predict_encounter(artifact, query)
                self.assertIsNone(prediction["internal_encounter_probability"])
                self.assertTrue(any("effort_basis" in reason for reason in prediction["reasons"]))
        self.rows[0].pop("effort_basis")
        with self.assertRaisesRegex(ValueError, "effort_basis"):
            self.fit()
        artifact.pop("effort_basis")
        self.assertIsNone(predict_encounter(artifact, self.rows[-1])["internal_encounter_probability"])

    def test_booleans_nonfinite_features_and_invalid_effort_are_rejected(self):
        for value in (True, "4", float("nan"), float("inf"), 10 ** 1000):
            rows = surveys()
            rows[0]["features"]["rain"] = value
            with self.subTest(value=type(value)), self.assertRaises(ValueError):
                self.fit(rows)
        for key, value in (("duration_minutes", 0), ("duration_minutes", 1441),
                           ("observer_count", 1.5), ("observer_count", True), ("observer_count", 101)):
            rows = surveys()
            rows[0][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                self.fit(rows)

    def test_target_identity_review_reference_and_protocol_are_strict(self):
        for key, value in (("target_taxon", "other"), ("survey_id", ""),
                           ("protocol_version", "different-v2"), ("verification_ref", None)):
            rows = surveys()
            rows[2][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.fit(rows)

    def test_leaking_name_and_future_features_are_rejected(self):
        for name in ("detected_count", "future_result", "harvest_quantity", "mushroom_count", "community_presence"):
            rows = surveys()
            rows[0]["features"][name] = 3
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.fit(rows)
        self.rows[0]["features_as_of"] = "2024-01-01T09:00:00Z"
        with self.assertRaisesRegex(ValueError, "leakage"):
            self.fit()

    def test_split_is_explicit_blocked_by_site_and_survey(self):
        for key in ("spatial_block", "site_id", "survey_id"):
            rows = surveys()
            rows[-1][key] = rows[0][key]
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, key):
                self.fit(rows)
        self.rows[0].pop("split")
        with self.assertRaisesRegex(ValueError, "explicit"):
            self.fit()

    def test_no_duplicate_visit_and_no_embargo_bypass(self):
        rows = surveys()
        rows.append(deepcopy(rows[0]))
        with self.assertRaisesRegex(ValueError, "duplicate survey_id"):
            self.fit(rows)
        with self.assertRaisesRegex(ValueError, ">=60"):
            self.fit(embargo_days=0)
        for row in self.rows:
            if row["split"] == "calibration":
                row["date"] = "2024-02-01"
                row["started_at"] = "2024-02-01T08:00:00Z"
                row["features_as_of"] = "2024-02-01T06:00:00Z"
        with self.assertRaisesRegex(ValueError, "embargo"):
            self.fit()

    def test_both_classes_are_required_in_each_independent_set(self):
        for split in ("train", "calibration", "test"):
            rows = surveys()
            for row in rows:
                if row["split"] == split:
                    row["result"] = "not_detected"
            with self.subTest(split=split), self.assertRaisesRegex(ValueError, "both outcome classes"):
                self.fit(rows)

    def test_out_of_domain_has_no_internal_probability(self):
        artifact, _ = self.fit()
        mutations = (("features", {"rain": 999, "soil": 0.12}),
                     ("features", {"rain": None, "soil": 0.12}),
                     ("protocol_version", "unseen"), ("weather_provenance", "reanalysis"))
        for key, value in mutations:
            query = {**self.rows[-1], key: value}
            with self.subTest(key=key, value=value):
                output = predict_encounter(artifact, query)
                self.assertIsNone(output["internal_encounter_probability"])
                self.assertTrue(output["reasons"])
                self.assertIsNone(output["public_probability"])
        query = {**self.rows[-1], "taxon_id": "other", "target_taxon": "other"}
        self.assertIn("unseen_taxon_id", predict_encounter(artifact, query)["reasons"])
        self.assertIsNone(predict_encounter({}, query)["internal_encounter_probability"])

    def test_new_location_needs_no_local_history_but_requires_feature_support(self):
        artifact, _ = self.fit()
        query = {**self.rows[-1], "site_id": "new-italian-site", "spatial_block": "new-block",
                 "observer_id": "new-observer", "features": {"rain": 3, "soil": 0.13}}
        self.assertIsNotNone(predict_encounter(artifact, query)["internal_encounter_probability"])
        for key in ("site_id", "spatial_block", "observer_id", "survey_id"):
            query.pop(key)
        self.assertIsNotNone(predict_encounter(artifact, query)["internal_encounter_probability"])

    def test_heldout_weather_source_never_expands_training_domain(self):
        self.rows[-1]["weather_provenance"] = "reanalysis"
        artifact, report = self.fit()
        self.assertEqual(artifact["weather_provenance"], ["forecast_archive"])
        self.assertEqual(report["support_coverage"]["test"]["eligible"], 7)
        prediction = predict_encounter(artifact, self.rows[-1])
        self.assertIn("unseen_weather_provenance", prediction["reasons"])
        self.assertIsNone(prediction["internal_encounter_probability"])

    def test_train_missingness_is_imputed_only_when_supported(self):
        self.rows[0]["features"]["soil"] = None
        artifact, _ = self.fit()
        self.assertTrue(artifact["domain"][1]["missing_seen"])
        query = {**self.rows[-1], "features": {"rain": 2, "soil": None}}
        self.assertIsNotNone(predict_encounter(artifact, query)["internal_encounter_probability"])
        for row in self.rows:
            if row["split"] == "train":
                row["features"]["soil"] = None
        with self.assertRaisesRegex(ValueError, "no finite training data"):
            self.fit()

    def test_supported_test_coverage_is_reported(self):
        self.rows[-1]["features"]["rain"] = 999
        _, report = self.fit()
        self.assertEqual(report["support_coverage"]["test"], {"eligible": 7, "total": 8})
        self.assertEqual(report["test"]["calibrated"]["n"], 7)

    def test_reanalysis_never_claims_prospective_skill(self):
        for row in self.rows:
            row["weather_provenance"] = "reanalysis"
        artifact, report = self.fit()
        prediction = predict_encounter(artifact, self.rows[-1])
        for result in (artifact, report, prediction):
            self.assertEqual(result["evaluation_scope"], "retrospective_reanalysis")
            self.assertFalse(result["prospective_skill_established"])
            self.assertIsNone(result["public_probability"])


if __name__ == "__main__":
    unittest.main()
