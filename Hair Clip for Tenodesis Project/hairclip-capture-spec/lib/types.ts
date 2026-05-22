export type CaptureMode = "a4" | "no-card";
export type CaptureStep = "top" | "side";

export type QualityCheck = {
  key: string;
  label: string;
  status: "good" | "warning";
  detail: string;
};

export type CapturePayload = {
  mode: CaptureMode;
  topImage: string;
  sideImage: string;
};

export type Measurement = {
  value: number | null;
  units: string;
  confidence: number;
  advisory?: boolean;
};

export type AnalysisResult = {
  mode: CaptureMode;
  clip_family: string;
  warnings: string[];
  quality_checks: QualityCheck[];
  measurements: Record<string, Measurement>;
  confidence: {
    overall: number;
    calibrated: boolean;
  };
  notes: string[];
};

export type SpecResponse = {
  finalized: boolean;
  mode: CaptureMode;
  clip_family: string;
  measurements: AnalysisResult["measurements"];
  manual_overrides: Record<string, number | null>;
  warnings: string[];
  extender_spec: {
    family: "dual-wing-extenders";
    recommended_attachment_opening_mm: number | null;
    insertion_depth_mm: number | null;
    tolerance_band_mm: number | null;
    lever_length_class: "short" | "medium" | "long";
    lever_length_mm: number | null;
    material_note: string;
  };
  summary: string;
};

export type SaveCaptureResponse = {
  capture_id: string;
  status: "saved";
};
