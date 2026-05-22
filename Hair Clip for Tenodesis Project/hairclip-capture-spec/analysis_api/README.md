# Local Analysis API

This FastAPI service runs on the lab machine and performs:

- A4 calibration-card detection and scale recovery
- hair clip segmentation
- top/side measurement extraction
- dual-wing-extender spec generation
- local dataset persistence for captured clips

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `POST /analyze`
- `POST /spec`
- `POST /captures`

## Local Dataset Storage

Saved records are written to:

- `analysis_api/data/captures.db`
- `analysis_api/data/captures/`

Each record includes the uploaded top and side images plus the analysis and generated spec. This is meant to help the lab accumulate many hair clip examples for later modeling and universal-design work.
