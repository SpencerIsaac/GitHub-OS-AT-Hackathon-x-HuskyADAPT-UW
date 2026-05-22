from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import AnalyzeRequest, AnalysisResponse, SaveCaptureRequest, SaveCaptureResponse, SpecRequest, SpecResponse
from .spec import generate_spec
from .storage import ensure_storage, save_capture
from .vision import analyze_capture

app = FastAPI(title="Hair Clip Analysis API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_storage()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResponse)
def analyze(payload: AnalyzeRequest) -> AnalysisResponse:
    return analyze_capture(payload.mode, payload.top_image, payload.side_image)


@app.post("/spec", response_model=SpecResponse)
def spec(payload: SpecRequest) -> SpecResponse:
    return generate_spec(payload.analysis, payload.manual_overrides)


@app.post("/captures", response_model=SaveCaptureResponse)
def capture(payload: SaveCaptureRequest) -> SaveCaptureResponse:
    capture_id = save_capture(payload.top_image, payload.side_image, payload.analysis, payload.spec)
    return SaveCaptureResponse(capture_id=capture_id)
