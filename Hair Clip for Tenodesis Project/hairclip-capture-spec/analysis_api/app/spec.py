from .models import AnalysisResponse, SpecResponse


def _measurement_or_override(analysis: AnalysisResponse, key: str, overrides: dict) -> float | None:
    override = overrides.get(key)
    if override is not None:
        return float(override)
    measurement = analysis.measurements.get(key)
    if not measurement:
        return None
    return measurement.value


def generate_spec(analysis: AnalysisResponse, manual_overrides: dict) -> SpecResponse:
    opening = _measurement_or_override(analysis, "attachment_opening_mm", manual_overrides)
    if opening is None:
        wing_width = _measurement_or_override(analysis, "wing_width_mm", manual_overrides)
        wing_thickness = _measurement_or_override(analysis, "wing_thickness_mm", manual_overrides)
        if wing_width is not None and wing_thickness is not None:
            opening = round(max(wing_width + (0.7 if analysis.mode == "a4" else 1.2), wing_thickness + 0.5), 2)

    insertion_depth = _measurement_or_override(analysis, "insertion_depth_mm", manual_overrides)
    if insertion_depth is None:
        attachment_region = _measurement_or_override(analysis, "attachment_region_width_mm", manual_overrides)
        insertion_depth = round(max((attachment_region or 4.0) * 0.85, 3.0), 2)

    lever_length = _measurement_or_override(analysis, "suggested_lever_length_mm", manual_overrides)
    if lever_length is None:
        lever_length = 14.0

    lever_class = "short"
    if lever_length >= 24:
        lever_class = "long"
    elif lever_length >= 17:
        lever_class = "medium"

    finalized = analysis.mode == "a4" or manual_overrides.get("wing_thickness_mm") is not None
    summary = (
        "Finalized dual wing extender spec with calibrated measurements."
        if finalized
        else "Advisory dual wing extender spec. Confirm wing thickness and fit tolerance before fabrication."
    )

    warnings = list(analysis.warnings)
    if not finalized:
        warnings.append("Manual confirmation is still recommended before CAD generation or printing.")

    return SpecResponse(
        finalized=finalized,
        mode=analysis.mode,
        clip_family=analysis.clip_family,
        measurements=analysis.measurements,
        manual_overrides=manual_overrides,
        warnings=warnings,
        extender_spec={
            "family": "dual-wing-extenders",
            "recommended_attachment_opening_mm": opening,
            "insertion_depth_mm": insertion_depth,
            "tolerance_band_mm": 0.6 if analysis.mode == "a4" else 1.2,
            "lever_length_class": lever_class,
            "lever_length_mm": lever_length,
            "material_note": "Prototype with compliant inner grip and stiffer outer lever geometry."
        },
        summary=summary,
    )
