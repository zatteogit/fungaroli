"""Calendar, missingness and as-of tests for the research feature builder.

Run from the repository root: python3 -m unittest tools.fronda_model.test_features
These verify transformations and audit behavior, not ecological accuracy.
"""

from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
import math
import unittest

from tools.fronda_model.features import FEATURE_NAMES, build_features, feature_names


TARGET = date(2026, 10, 16)
CONTEXT = {"elevation_m": 950, "canopy_fraction": 0.8, "host_fraction": 0.6, "soil_ph": 5.5}


def weather(target=TARGET, days=60):
    result = []
    for lag in range(days, 0, -1):
        day = target - timedelta(days=lag)
        result.append({
            "date": day.isoformat(),
            "precipitation_mm": 1,
            "temperature_mean_c": 10,
            "temperature_min_c": 5,
            "temperature_max_c": 15,
            "et0_mm": 2,
            "soil_moisture": 0.4,
            "available_at": f"{(day + timedelta(days=1)).isoformat()}T00:00:00Z",
        })
    return result


class FeatureTests(unittest.TestCase):
    def test_contract_and_units_are_explicit(self):
        result = build_features(weather(), TARGET, CONTEXT)
        self.assertEqual(list(result["values"]), FEATURE_NAMES)
        self.assertEqual(feature_names, FEATURE_NAMES)
        self.assertEqual(len(FEATURE_NAMES), len(set(FEATURE_NAMES)))
        self.assertEqual(result["provenance"]["window_start_inclusive"], "2026-08-17")
        self.assertEqual(result["provenance"]["window_end_exclusive"], "2026-10-16")
        self.assertEqual(result["provenance"]["soil_moisture_units"], "m3/m3")
        self.assertEqual(result["quality"]["missing_features"], [])

    def test_lag_windows_partition_exactly_sixty_days(self):
        rows = weather()
        for row in rows:
            row["precipitation_mm"] = (TARGET - date.fromisoformat(row["date"])).days
        result = build_features(rows, TARGET, CONTEXT)
        for lower, upper in ((0, 7), (7, 14), (14, 30), (30, 60)):
            name = f"precipitation_sum_mm_lag_{lower}_{upper}d"
            self.assertEqual(result["values"][name], sum(range(lower + 1, upper + 1)))
            self.assertEqual(result["quality"]["coverage"][f"lag_{lower}_{upper}d"]["expected_days"], upper - lower)
        self.assertEqual(sum(result["values"][f"precipitation_sum_mm_lag_{a}_{b}d"] for a, b in ((0, 7), (7, 14), (14, 30), (30, 60))), sum(range(1, 61)))

    def test_climatic_balance_is_not_soil_moisture(self):
        values = build_features(weather(), TARGET, CONTEXT)["values"]
        self.assertEqual(values["precipitation_sum_mm_lag_0_7d"], 7)
        self.assertEqual(values["et0_sum_mm_lag_0_7d"], 14)
        self.assertEqual(values["climatic_balance_mm_lag_0_7d"], -7)
        self.assertAlmostEqual(values["soil_moisture_mean_last_7d"], 0.4)
        self.assertEqual(values["climatic_balance_x_temperature_last_7d"], -70)

    def test_target_and_future_rows_cannot_change_values(self):
        rows = weather()
        original = build_features(rows, TARGET, CONTEXT)["values"]
        for day in (TARGET, TARGET + timedelta(days=1), TARGET + timedelta(days=100)):
            rows.append({"date": day.isoformat(), "precipitation_mm": 99999})
        changed = build_features(rows, TARGET, CONTEXT)
        self.assertEqual(changed["values"], original)
        self.assertEqual(len(changed["provenance"]["excluded_on_or_after_target_dates"]), 3)

    def test_rows_older_than_window_cannot_change_values(self):
        rows = weather()
        original = build_features(rows, TARGET, CONTEXT)["values"]
        rows.append({"date": (TARGET - timedelta(days=61)).isoformat(), "precipitation_mm": 99999})
        changed = build_features(rows, TARGET, CONTEXT)
        self.assertEqual(changed["values"], original)
        self.assertEqual(len(changed["provenance"]["excluded_before_window_dates"]), 1)

    def test_calendar_gap_is_not_replaced_by_adjacent_observation(self):
        rows = weather()
        missing_day = rows.pop(-3)["date"]
        result = build_features(rows, TARGET, CONTEXT)
        values = result["values"]
        self.assertIsNone(values["precipitation_sum_mm_lag_0_7d"])
        self.assertIsNone(values["temperature_mean_c_last_7d"])
        self.assertIsNone(values["temperature_mean_c_last_60d"])
        self.assertEqual(values["precipitation_sum_mm_lag_7_14d"], 7)
        self.assertEqual(result["quality"]["coverage"]["lag_0_7d"]["missing_dates"], [missing_day])

    def test_observed_zero_and_missing_precipitation_differ(self):
        rows = weather()
        for row in rows:
            row["precipitation_mm"] = 0
        self.assertEqual(build_features(rows, TARGET, CONTEXT)["values"]["precipitation_sum_mm_lag_0_7d"], 0)
        rows[-1]["precipitation_mm"] = None
        values = build_features(rows, TARGET, CONTEXT)["values"]
        self.assertIsNone(values["precipitation_sum_mm_lag_0_7d"])
        self.assertIsNone(values["climatic_balance_mm_lag_0_7d"])
        self.assertEqual(values["et0_sum_mm_lag_0_7d"], 14)

    def test_partial_et0_does_not_destroy_independent_precipitation(self):
        rows = weather()
        del rows[-1]["et0_mm"]
        values = build_features(rows, TARGET, CONTEXT)["values"]
        self.assertEqual(values["precipitation_sum_mm_lag_0_7d"], 7)
        self.assertIsNone(values["et0_sum_mm_lag_0_7d"])
        self.assertIsNone(values["climatic_balance_x_temperature_last_7d"])

    def test_optional_soil_data_is_never_imputed_from_rain(self):
        rows = weather()
        for row in rows:
            del row["soil_moisture"]
        values = build_features(rows, TARGET, CONTEXT)["values"]
        self.assertIsNone(values["soil_moisture_mean_last_7d"])
        self.assertIsNone(values["soil_moisture_trend_per_day_last_7d"])
        self.assertIsNone(values["soil_moisture_x_temperature_last_7d"])
        self.assertEqual(values["precipitation_sum_mm_lag_0_7d"], 7)

    def test_temperature_curvature_has_no_imposed_optimum(self):
        rows = weather()
        for row in rows:
            row.update(temperature_mean_c=-10, temperature_min_c=-15, temperature_max_c=-5)
        values = build_features(rows, TARGET, CONTEXT)["values"]
        self.assertEqual(values["temperature_mean_c_last_20d"], -10)
        self.assertEqual(values["temperature_mean_c_squared_last_20d"], 100)
        self.assertEqual(values["temperature_variance_c2_last_7d"], 0)

    def test_recent_variance_and_trends_use_calendar_day_units(self):
        rows = weather()
        for index, row in enumerate(rows[-7:], start=1):
            row.update(temperature_mean_c=index, temperature_min_c=index - 1, temperature_max_c=index + 1, soil_moisture=index / 10)
        values = build_features(rows, TARGET, CONTEXT)["values"]
        self.assertEqual(values["temperature_mean_c_last_7d"], 4)
        self.assertEqual(values["temperature_variance_c2_last_7d"], 4)
        self.assertEqual(values["temperature_trend_c_per_day_last_7d"], 1)
        self.assertAlmostEqual(values["soil_moisture_trend_per_day_last_7d"], 0.1)
        self.assertAlmostEqual(values["soil_moisture_x_temperature_last_7d"], 1.6)

    def test_late_available_row_cannot_leak_into_as_of_forecast(self):
        rows = weather()
        rows[-1]["available_at"] = "2026-10-16T01:00:00Z"
        result = build_features(rows, TARGET, CONTEXT, issued_at="2026-10-16T00:00:00Z")
        self.assertIsNone(result["values"]["precipitation_sum_mm_lag_0_7d"])
        self.assertEqual(result["values"]["precipitation_sum_mm_lag_7_14d"], 7)
        self.assertEqual(result["provenance"]["excluded_after_issued_at_dates"], ["2026-10-15"])
        self.assertEqual(result["quality"]["weather_days_used"], 59)

    def test_timestamp_timezones_and_cutoff_boundary(self):
        rows = weather()
        rows[-1]["available_at"] = "2026-10-16T02:00:00+02:00"
        result = build_features(rows, TARGET, CONTEXT, issued_at=datetime(2026, 10, 16, tzinfo=timezone.utc))
        self.assertEqual(result["values"]["precipitation_sum_mm_lag_0_7d"], 7)
        self.assertEqual(result["provenance"]["issued_at"], "2026-10-16T00:00:00+00:00")
        self.assertEqual(result["provenance"]["availability_audit_status"], "verified_for_used_rows")
        self.assertFalse(result["provenance"]["prospective_validation_established"])

    def test_unknown_availability_is_declared_and_never_claimed_prospective(self):
        rows = weather()
        del rows[-1]["available_at"]
        result = build_features(rows, TARGET, CONTEXT, issued_at="2026-10-16T00:00:00Z")
        self.assertEqual(result["values"]["precipitation_sum_mm_lag_0_7d"], 7)
        self.assertEqual(result["provenance"]["availability_unknown_dates"], ["2026-10-15"])
        self.assertEqual(result["provenance"]["availability_audit_status"], "unknown")
        self.assertEqual(result["provenance"]["weather_source_kind"], "unknown")
        self.assertFalse(result["provenance"]["prospective_validation_established"])

    def test_no_as_of_instant_does_not_claim_an_audit(self):
        result = build_features(weather(), TARGET, CONTEXT)
        self.assertEqual(result["provenance"]["availability_audit_status"], "not_requested")
        self.assertIsNone(result["provenance"]["issued_at"])

    def test_empty_input_retains_missing_values_and_known_calendar_only(self):
        result = build_features([], TARGET, {}, issued_at="2026-10-16T00:00:00Z")
        self.assertEqual(result["quality"]["weather_days_used"], 0)
        self.assertEqual(result["quality"]["availability_audit_status"], "no_eligible_rows")
        for name, value in result["values"].items():
            if name in ("season_sin", "season_cos"):
                self.assertTrue(math.isfinite(value))
            else:
                self.assertIsNone(value, name)

    def test_missing_context_is_not_zero_and_below_sea_level_is_valid(self):
        result = build_features(weather(), TARGET, {"elevation_m": -20, "canopy_fraction": 0})
        self.assertEqual(result["values"]["elevation_m"], -20)
        self.assertEqual(result["values"]["canopy_fraction"], 0)
        self.assertIsNone(result["values"]["host_fraction"])
        self.assertIsNone(result["values"]["soil_ph"])
        self.assertEqual(result["quality"]["context_missing"], ["host_fraction", "soil_ph"])

    def test_leap_year_calendar_phase_and_february_history(self):
        target = date(2024, 7, 2)  # Day index 183 in a 366-day year.
        values = build_features(weather(target), target, CONTEXT)["values"]
        self.assertAlmostEqual(values["season_sin"], 0, places=12)
        self.assertAlmostEqual(values["season_cos"], -1, places=12)
        spring = build_features(weather(date(2024, 3, 2)), "2024-03-02", CONTEXT)
        self.assertIn("2024-02-29", spring["provenance"]["used_dates"])
        self.assertEqual(spring["quality"]["weather_days_used"], 60)

    def test_order_invariance_and_no_input_mutation(self):
        rows = weather()
        saved_rows, saved_context = deepcopy(rows), deepcopy(CONTEXT)
        original = build_features(rows, TARGET, CONTEXT)
        reversed_result = build_features(list(reversed(rows)), TARGET, CONTEXT)
        self.assertEqual(original, reversed_result)
        self.assertEqual(rows, saved_rows)
        self.assertEqual(CONTEXT, saved_context)

    def test_duplicate_and_invalid_dates_raise_even_outside_window(self):
        cases = [
            [{"date": "2026-02-30"}],
            [{"date": "20261015"}],
            [{"date": "2026-10-15T00:00:00Z"}],
            [{"date": "2026-10-17"}, {"date": "2026-10-17"}],
        ]
        for rows in cases:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                build_features(rows, TARGET, CONTEXT)

    def test_false_nonfinite_and_invalid_units_raise(self):
        cases = [
            ("precipitation_mm", False), ("precipitation_mm", -0.1),
            ("precipitation_mm", float("nan")), ("et0_mm", float("inf")),
            ("temperature_mean_c", "10"), ("temperature_min_c", -274),
            ("soil_moisture", 20), ("soil_moisture", -0.1),
            ("temperature_min_c", 11), ("temperature_max_c", 9),
        ]
        for field, value in cases:
            rows = weather()
            rows[-1][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                build_features(rows, TARGET, CONTEXT)

    def test_invalid_excluded_row_is_not_silently_accepted(self):
        rows = weather() + [{"date": "2027-01-01", "precipitation_mm": float("nan")}]
        with self.assertRaises(ValueError):
            build_features(rows, TARGET, CONTEXT)

    def test_context_physical_domains_and_numeric_types(self):
        for field, value in (("canopy_fraction", 1.1), ("host_fraction", -0.1), ("soil_ph", 15), ("elevation_m", True), ("soil_ph", float("nan"))):
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                build_features(weather(), TARGET, {field: value})

    def test_naive_and_date_only_timestamps_raise(self):
        for timestamp in ("2026-10-16", "2026-10-16T00:00:00", datetime(2026, 10, 16)):
            with self.subTest(timestamp=timestamp), self.assertRaises(ValueError):
                build_features(weather(), TARGET, CONTEXT, issued_at=timestamp)
        rows = weather()
        rows[-1]["available_at"] = "2026-10-16"
        with self.assertRaises(ValueError):
            build_features(rows, TARGET, CONTEXT)

    def test_missing_min_max_do_not_impute_or_invalidate_measured_mean(self):
        rows = weather()
        rows[-1]["temperature_min_c"] = None
        rows[-1]["temperature_max_c"] = None
        result = build_features(rows, TARGET, CONTEXT)
        self.assertEqual(result["values"]["temperature_mean_c_last_7d"], 10)
        self.assertEqual(result["quality"]["coverage"]["last_7d"]["missing_values"]["temperature_min_c"], 1)


if __name__ == "__main__":
    unittest.main()
