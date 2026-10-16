"""Auditable candidate predictors for a research model of fungal encounters.

This module does not predict fruiting or assign biological optima. All windows
are *engineering candidates to compare in blocked validation*, not thresholds
established for all fungal taxa. Daily precipitation and FAO-style reference
evapotranspiration (ET0) are in mm, air temperatures in degrees C, and optional
soil moisture is a volumetric fraction (m3/m3). P - ET0 is a climatic balance,
not measured soil water, a calibrated water bucket, or fungal availability.

For a target calendar date D, lag windows are [D-7,D), [D-14,D-7),
[D-30,D-14), and [D-60,D-30). Their lengths are 7, 7, 16, and 30 days.
They do not overlap and never include D. Longer temperature windows are
[D-n,D). Every calendar day and every input required by an aggregate must be
present; otherwise that aggregate is None. An observed zero stays zero.

``available_at`` is the instant at which the supplied daily value was available
to a forecast consumer; it is not the observation date or download time of a
later reanalysis. If ``issued_at`` is supplied, later-available rows are excluded.
Missing availability timestamps remain usable but are explicitly unaudited.
Timestamps alone do not establish archived forecasts, prospective validation,
data-source quality, or the provenance of retrospective revisions. Context is
assumed to have been separately checked by the caller for temporal validity.

Uses only the Python standard library. No network access or production imports.
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import date, datetime, timedelta, timezone
import math
from numbers import Real
import re


LAG_WINDOWS = ((0, 7), (7, 14), (14, 30), (30, 60))
DAILY_FIELDS = (
    "precipitation_mm",
    "temperature_mean_c",
    "temperature_min_c",
    "temperature_max_c",
    "et0_mm",
    "soil_moisture",
)
CONTEXT_FIELDS = ("elevation_m", "canopy_fraction", "host_fraction", "soil_ph")

# Order is part of the public contract. Models must save their selected names
# and training-only transformations rather than relying on dict iteration.
FEATURE_NAMES = [
    f"{prefix}_lag_{start}_{end}d"
    for start, end in LAG_WINDOWS
    for prefix in (
        "precipitation_sum_mm",
        "et0_sum_mm",
        "climatic_balance_mm",
    )
] + [
    "temperature_mean_c_last_7d",
    "temperature_mean_c_last_20d",
    "temperature_mean_c_last_60d",
    "temperature_mean_c_squared_last_20d",
    "temperature_variance_c2_last_7d",
    "temperature_trend_c_per_day_last_7d",
    "soil_moisture_mean_last_7d",
    "soil_moisture_mean_last_20d",
    "soil_moisture_trend_per_day_last_7d",
    *CONTEXT_FIELDS,
    "season_sin",
    "season_cos",
    "climatic_balance_x_temperature_last_7d",
    "soil_moisture_x_temperature_last_7d",
    "season_sin_x_temperature_last_20d",
    "season_cos_x_temperature_last_20d",
]
# Lowercase spelling retained for callers using the API name in the brief.
feature_names = FEATURE_NAMES


def _calendar_date(value, label):
    if isinstance(value, datetime):
        raise ValueError(f"{label} must be a calendar date, not a datetime")
    if isinstance(value, date):
        return value
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError(f"{label} must be an ISO date YYYY-MM-DD")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{label} is not a valid calendar date") from exc


def _instant(value, label):
    if isinstance(value, datetime):
        result = value
    elif isinstance(value, str) and re.match(r"^\d{4}-\d{2}-\d{2}T", value):
        try:
            result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError(f"{label} must be an ISO timestamp with timezone") from exc
    else:
        raise ValueError(f"{label} must be an ISO timestamp with timezone")
    if result.tzinfo is None or result.utcoffset() is None:
        raise ValueError(f"{label} must include a timezone")
    return result.astimezone(timezone.utc)


def _number(value, label):
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{label} must be a finite number or None")
    try:
        result = float(value)
    except (OverflowError, ValueError) as exc:
        raise ValueError(f"{label} must be a finite number or None") from exc
    if not math.isfinite(result):
        raise ValueError(f"{label} must be a finite number or None")
    return result


def _validated_weather(weather_rows):
    if not isinstance(weather_rows, list):
        raise ValueError("weather_rows must be a list of daily mappings")
    rows = {}
    for index, row in enumerate(weather_rows):
        if not isinstance(row, Mapping):
            raise ValueError(f"weather_rows[{index}] must be a mapping")
        day = _calendar_date(row.get("date"), f"weather_rows[{index}].date")
        if day in rows:
            raise ValueError(f"duplicate weather date: {day.isoformat()}")
        values = {name: _number(row.get(name), f"{day}.{name}") for name in DAILY_FIELDS}
        for name in ("precipitation_mm", "et0_mm"):
            if values[name] is not None and values[name] < 0:
                raise ValueError(f"{day}.{name} cannot be negative")
        if values["soil_moisture"] is not None and not 0 <= values["soil_moisture"] <= 1:
            raise ValueError(f"{day}.soil_moisture must be a volumetric fraction in [0,1]")
        for name in ("temperature_min_c", "temperature_mean_c", "temperature_max_c"):
            if values[name] is not None and values[name] < -273.15:
                raise ValueError(f"{day}.{name} is below absolute zero")
        for low, high in (
            ("temperature_min_c", "temperature_mean_c"),
            ("temperature_mean_c", "temperature_max_c"),
            ("temperature_min_c", "temperature_max_c"),
        ):
            if values[low] is not None and values[high] is not None and values[low] > values[high]:
                raise ValueError(f"{day}.{low} cannot exceed {high}")
        available = row.get("available_at")
        values["available_at"] = None if available is None else _instant(available, f"{day}.available_at")
        rows[day] = values
    return rows


def _validated_context(context):
    if not isinstance(context, Mapping):
        raise ValueError("context must be a mapping; missing fields may be None")
    values = {name: _number(context.get(name), f"context.{name}") for name in CONTEXT_FIELDS}
    for name in ("canopy_fraction", "host_fraction"):
        if values[name] is not None and not 0 <= values[name] <= 1:
            raise ValueError(f"context.{name} must be in [0,1]")
    if values["soil_ph"] is not None and not 0 <= values["soil_ph"] <= 14:
        raise ValueError("context.soil_ph must be in [0,14]")
    return values


def _days_between(start, end):
    return [start + timedelta(days=offset) for offset in range((end - start).days)]


def _series(rows, days, field):
    series = [rows.get(day, {}).get(field) for day in days]
    return None if any(value is None for value in series) else series


def _sum(series):
    return None if series is None else math.fsum(series)


def _mean(series):
    return None if series is None else math.fsum(series) / len(series)


def _trend(series):
    """Ordinary least squares slope per calendar day; requires a complete series."""
    if series is None:
        return None
    centre = (len(series) - 1) / 2
    mean = _mean(series)
    return math.fsum((i - centre) * (value - mean) for i, value in enumerate(series)) / math.fsum(
        (i - centre) ** 2 for i in range(len(series))
    )


def _product(a, b):
    return None if a is None or b is None else a * b


def _coverage(rows, days):
    return {
        "expected_days": len(days),
        "provided_days": sum(day in rows for day in days),
        "missing_dates": [day.isoformat() for day in days if day not in rows],
        "missing_values": {
            field: sum(rows.get(day, {}).get(field) is None for day in days)
            for field in DAILY_FIELDS
        },
    }


def build_features(weather_rows, target_date, context, *, issued_at=None):
    """Return ``{values, quality, provenance}`` without inferring missing data.

    ``weather_rows`` is a list of mappings with ``date`` (ISO calendar date),
    daily fields in the module's declared units, and optional timezone-aware
    ``available_at``. Missing numeric fields and explicit None are equivalent.
    All supplied rows are validated, including rows outside the usable window:
    duplicate/invalid dates, booleans, nonfinite values and impossible basic
    units raise ValueError. Input order is irrelevant; input objects are not
    modified. Context accepts elevation_m, canopy_fraction, host_fraction and
    soil_ph, with absent values represented by None.

    ``target_date`` is a date or YYYY-MM-DD. ``issued_at`` is None, a timezone-
    aware datetime, or an ISO timestamp including timezone. Only dates strictly
    before target_date and at most 60 calendar days earlier can contribute.
    With issued_at, rows published after that instant cannot contribute.

    Temperature variance is population variance of seven daily *means*; trend
    is an OLS slope on their calendar-day indices. The quadratic term squares
    the 20-day mean and lets a fitted model learn curvature without an imposed
    optimum. Season uses the target date's fraction through its calendar year,
    including leap years. Interaction terms impose no biological coefficients.

    No encounter effort, detection assumption, species prior or calibration is
    encoded here. The output is a feature record, never a fungal probability.
    """
    target = _calendar_date(target_date, "target_date")
    try:
        start = target - timedelta(days=60)
    except OverflowError as exc:
        raise ValueError("target_date must allow 60 days of preceding history") from exc
    cutoff = None if issued_at is None else _instant(issued_at, "issued_at")
    raw_rows = _validated_weather(weather_rows)
    values = _validated_context(context)
    rows = {}
    after_target, before_window, after_cutoff = [], [], []
    for day, row in sorted(raw_rows.items()):
        if day >= target:
            after_target.append(day.isoformat())
        elif day < start:
            before_window.append(day.isoformat())
        elif cutoff is not None and row["available_at"] is not None and row["available_at"] > cutoff:
            after_cutoff.append(day.isoformat())
        else:
            rows[day] = row

    coverage = {}
    try:
        for lower, upper in LAG_WINDOWS:
            window = f"lag_{lower}_{upper}d"
            days = _days_between(target - timedelta(days=upper), target - timedelta(days=lower))
            coverage[window] = _coverage(rows, days)
            rain = _sum(_series(rows, days, "precipitation_mm"))
            et0 = _sum(_series(rows, days, "et0_mm"))
            values[f"precipitation_sum_mm_{window}"] = rain
            values[f"et0_sum_mm_{window}"] = et0
            values[f"climatic_balance_mm_{window}"] = None if rain is None or et0 is None else rain - et0

        temperature = {}
        moisture = {}
        for length in (7, 20, 60):
            days = _days_between(target - timedelta(days=length), target)
            coverage[f"last_{length}d"] = _coverage(rows, days)
            temperature[length] = _series(rows, days, "temperature_mean_c")
            values[f"temperature_mean_c_last_{length}d"] = _mean(temperature[length])
            if length in (7, 20):
                moisture[length] = _series(rows, days, "soil_moisture")
                values[f"soil_moisture_mean_last_{length}d"] = _mean(moisture[length])

        mean7 = values["temperature_mean_c_last_7d"]
        mean20 = values["temperature_mean_c_last_20d"]
        values["temperature_mean_c_squared_last_20d"] = _product(mean20, mean20)
        values["temperature_variance_c2_last_7d"] = (
            None if temperature[7] is None else math.fsum((item - mean7) ** 2 for item in temperature[7]) / 7
        )
        values["temperature_trend_c_per_day_last_7d"] = _trend(temperature[7])
        values["soil_moisture_trend_per_day_last_7d"] = _trend(moisture[7])
        year_start = date(target.year, 1, 1)
        year_length = 366 if target.year % 4 == 0 and (target.year % 100 != 0 or target.year % 400 == 0) else 365
        angle = 2 * math.pi * (target - year_start).days / year_length
        values["season_sin"] = math.sin(angle)
        values["season_cos"] = math.cos(angle)
        values["climatic_balance_x_temperature_last_7d"] = _product(
            values["climatic_balance_mm_lag_0_7d"], mean7
        )
        values["soil_moisture_x_temperature_last_7d"] = _product(values["soil_moisture_mean_last_7d"], mean7)
        values["season_sin_x_temperature_last_20d"] = _product(values["season_sin"], mean20)
        values["season_cos_x_temperature_last_20d"] = _product(values["season_cos"], mean20)
        values = {name: values[name] for name in FEATURE_NAMES}
        if any(value is not None and not math.isfinite(value) for value in values.values()):
            raise ValueError("input magnitudes exceed finite feature calculation")
    except OverflowError as exc:
        raise ValueError("input magnitudes exceed finite feature calculation") from exc

    unknown = [day.isoformat() for day, row in rows.items() if row["available_at"] is None]
    if cutoff is None:
        availability_status = "not_requested"
    elif not rows:
        availability_status = "no_eligible_rows"
    elif unknown:
        availability_status = "unknown"
    else:
        availability_status = "verified_for_used_rows"
    return {
        "values": values,
        "quality": {
            "complete_features": [name for name, value in values.items() if value is not None],
            "missing_features": [name for name, value in values.items() if value is None],
            "coverage": coverage,
            "weather_days_used": len(rows),
            "context_missing": [name for name in CONTEXT_FIELDS if values[name] is None],
            "availability_audit_status": availability_status,
        },
        "provenance": {
            "feature_schema_version": "fronda-research-features-v1",
            "target_date": target.isoformat(),
            "issued_at": cutoff.isoformat() if cutoff is not None else None,
            "window_start_inclusive": start.isoformat(),
            "window_end_exclusive": target.isoformat(),
            "used_dates": [day.isoformat() for day in rows],
            "availability_audit_status": availability_status,
            "availability_unknown_dates": unknown,
            "excluded_after_issued_at_dates": after_cutoff,
            "excluded_on_or_after_target_dates": after_target,
            "excluded_before_window_dates": before_window,
            "prospective_validation_established": False,
            "weather_source_kind": "unknown",
            "context_temporal_validity": "caller_responsibility",
            "window_basis": "engineering_candidates_require_blocked_validation",
            "climatic_balance_definition": "precipitation_mm - et0_mm; not measured soil water",
            "soil_moisture_units": "m3/m3",
            "geographic_validation": "not_performed",
        },
    }
