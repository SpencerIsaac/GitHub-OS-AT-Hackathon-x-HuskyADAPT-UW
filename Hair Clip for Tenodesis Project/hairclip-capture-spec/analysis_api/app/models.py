from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


CaptureMode = Literal["a4", "no-card"]


class AnalyzeRequest(BaseModel):
    mode: CaptureMode
    top_image: str
    side_image: str


class Measurement(BaseModel):
    value: Optional[float]
    units: str = "mm"
    confidence: float
    advisory: bool = False


class QualityCheck(BaseModel):
    key: str
    label: str
    status: Literal["good", "warning"]
    detail: str


class AnalysisResponse(BaseModel):
    mode: CaptureMode
    clip_family: str
    warnings: List[str]
    quality_checks: List[QualityCheck]
    measurements: Dict[str, Measurement]
    confidence: Dict[str, float | bool]
    notes: List[str]


class SpecRequest(BaseModel):
    analysis: AnalysisResponse
    manual_overrides: Dict[str, Optional[float]] = Field(default_factory=dict)


class SpecResponse(BaseModel):
    finalized: bool
    mode: CaptureMode
    clip_family: str
    measurements: Dict[str, Measurement]
    manual_overrides: Dict[str, Optional[float]]
    warnings: List[str]
    extender_spec: Dict[str, object]
    summary: str


class SaveCaptureRequest(BaseModel):
    top_image: str
    side_image: str
    analysis: AnalysisResponse
    spec: SpecResponse


class SaveCaptureResponse(BaseModel):
    capture_id: str
    status: str = "saved"
