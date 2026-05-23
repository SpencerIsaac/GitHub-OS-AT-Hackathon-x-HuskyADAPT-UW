import { AnalysisResult, SpecResponse } from "./types";

export function buildOnshapeExport(analysis: AnalysisResult, spec: SpecResponse) {
  return {
    schema_version: "1.0",
    cad_target: "onshape",
    feature_script_template: "dual_wing_extender",
    clip: {
      family: analysis.clip_family,
      capture_mode: analysis.mode,
      calibrated: analysis.confidence.calibrated,
      overall_confidence: analysis.confidence.overall,
      measurements_mm: {
        wing_width: analysis.measurements.wing_width_mm?.value ?? null,
        wing_length: analysis.measurements.wing_length_mm?.value ?? null,
        wing_spacing: analysis.measurements.wing_spacing_mm?.value ?? null,
        attachment_region_width: analysis.measurements.attachment_region_width_mm?.value ?? null,
        wing_thickness: analysis.measurements.wing_thickness_mm?.value ?? null,
      },
    },
    extender: {
      family: spec.extender_spec.family,
      attachment_opening_mm: spec.extender_spec.recommended_attachment_opening_mm,
      insertion_depth_mm: spec.extender_spec.insertion_depth_mm,
      lever_length_mm: spec.extender_spec.lever_length_mm,
      lever_length_class: spec.extender_spec.lever_length_class,
      tolerance_band_mm: spec.extender_spec.tolerance_band_mm,
      design_defaults_mm: {
        clamp_wall_thickness: 2.4,
        lever_width: 10,
        lever_thickness: 3.2,
        thumb_pad_length: 16,
        thumb_pad_width: 12,
        relief_radius: 1.5,
      },
      material_guidance: "Use a compliant inner grip and a stiffer outer lever. Prototype fit before final print.",
    },
    notes: [
      "This export is intended to drive the dual_wing_extender FeatureScript starter in Onshape.",
      "Treat all values as first-pass inputs and verify fit on the target clip.",
    ],
  };
}
