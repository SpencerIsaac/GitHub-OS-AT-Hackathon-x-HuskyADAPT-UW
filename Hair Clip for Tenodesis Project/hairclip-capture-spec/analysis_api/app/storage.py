import base64
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .models import AnalysisResponse, SpecResponse

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
IMAGE_DIR = DATA_DIR / "captures"
DB_PATH = DATA_DIR / "captures.db"


def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS captures (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                mode TEXT NOT NULL,
                clip_family TEXT NOT NULL,
                top_image_path TEXT NOT NULL,
                side_image_path TEXT NOT NULL,
                analysis_json TEXT NOT NULL,
                spec_json TEXT NOT NULL
            )
            """
        )
        connection.commit()


def _decode_data_url(data_url: str) -> bytes:
    _, encoded = data_url.split(",", 1)
    return base64.b64decode(encoded)


def _write_image(capture_id: str, suffix: str, data_url: str) -> str:
    binary = _decode_data_url(data_url)
    path = IMAGE_DIR / f"{capture_id}-{suffix}.jpg"
    path.write_bytes(binary)
    return str(path)


def save_capture(top_image: str, side_image: str, analysis: AnalysisResponse, spec: SpecResponse) -> str:
    ensure_storage()
    capture_id = str(uuid.uuid4())
    top_path = _write_image(capture_id, "top", top_image)
    side_path = _write_image(capture_id, "side", side_image)

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT INTO captures (
                id,
                created_at,
                mode,
                clip_family,
                top_image_path,
                side_image_path,
                analysis_json,
                spec_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                capture_id,
                datetime.now(timezone.utc).isoformat(),
                analysis.mode,
                analysis.clip_family,
                top_path,
                side_path,
                json.dumps(analysis.model_dump(), ensure_ascii=True),
                json.dumps(spec.model_dump(), ensure_ascii=True),
            ),
        )
        connection.commit()

    return capture_id
