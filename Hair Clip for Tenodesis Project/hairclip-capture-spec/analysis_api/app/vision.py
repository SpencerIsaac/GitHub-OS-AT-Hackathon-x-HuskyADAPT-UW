import base64
from dataclasses import dataclass
from typing import Dict, List, Tuple

import cv2
import numpy as np

from .models import AnalysisResponse, Measurement, QualityCheck

A4_WIDTH_MM = 210.0
A4_HEIGHT_MM = 297.0


@dataclass
class ProcessedImage:
    image: np.ndarray
    gray: np.ndarray
    blur_score: float
    brightness: float
    glare_ratio: float


@dataclass
class PaperRegion:
    mask: np.ndarray | None
    box: Tuple[int, int, int, int] | None
    px_per_mm: float | None = None


def decode_data_url(data_url: str) -> np.ndarray:
    _, encoded = data_url.split(",", 1)
    binary = base64.b64decode(encoded)
    buffer = np.frombuffer(binary, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode image payload.")
    return image


def preprocess(image: np.ndarray) -> ProcessedImage:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    glare_ratio = float(np.mean(gray > 245))
    return ProcessedImage(image=image, gray=gray, blur_score=blur_score, brightness=brightness, glare_ratio=glare_ratio)


def detect_paper_region(image: ProcessedImage) -> PaperRegion:
    blur = cv2.GaussianBlur(image.gray, (7, 7), 0)
    _, paper = cv2.threshold(blur, 180, 255, cv2.THRESH_BINARY)
    kernel = np.ones((9, 9), np.uint8)
    paper = cv2.morphologyEx(paper, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(paper, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return PaperRegion(mask=None, box=None)

    contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(contour)
    if area < image.gray.shape[0] * image.gray.shape[1] * 0.18:
        return PaperRegion(mask=None, box=None)

    mask = np.zeros_like(image.gray)
    cv2.drawContours(mask, [contour], -1, 255, thickness=cv2.FILLED)
    box = cv2.boundingRect(contour)
    return PaperRegion(mask=mask, box=box)


def detect_a4_scale(image: ProcessedImage) -> Tuple[float | None, List[str], PaperRegion]:
    edges = cv2.Canny(image.gray, 75, 180)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(approx)
            if area > image.gray.shape[0] * image.gray.shape[1] * 0.08:
                candidates.append((area, approx))

    paper_region = detect_paper_region(image)

    if not candidates:
        if paper_region.mask is None:
            return None, ["Calibration card not confidently detected."], paper_region

        contours, _ = cv2.findContours(paper_region.mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour = max(contours, key=cv2.contourArea)
        rect = cv2.minAreaRect(contour)
        width_px, height_px = rect[1]
        if width_px == 0 or height_px == 0:
            return None, ["Calibration card not confidently detected."], paper_region

        long_edge = max(width_px, height_px)
        short_edge = min(width_px, height_px)
        px_per_mm = ((long_edge / A4_HEIGHT_MM) + (short_edge / A4_WIDTH_MM)) / 2.0
        paper_region.px_per_mm = float(px_per_mm)
        return float(px_per_mm), ["Used fallback paper-scale detection. Confirm dimensions before fabrication."], paper_region

    _, quad = max(candidates, key=lambda item: item[0])
    points = quad.reshape(4, 2).astype(np.float32)
    rect = order_points(points)
    width_top = np.linalg.norm(rect[1] - rect[0])
    width_bottom = np.linalg.norm(rect[2] - rect[3])
    height_left = np.linalg.norm(rect[3] - rect[0])
    height_right = np.linalg.norm(rect[2] - rect[1])
    width_px = float((width_top + width_bottom) / 2.0)
    height_px = float((height_left + height_right) / 2.0)
    px_per_mm = ((width_px / A4_WIDTH_MM) + (height_px / A4_HEIGHT_MM)) / 2.0
    paper_region.px_per_mm = float(px_per_mm)
    return px_per_mm, [], paper_region


def order_points(points: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype=np.float32)
    s = points.sum(axis=1)
    rect[0] = points[np.argmin(s)]
    rect[2] = points[np.argmax(s)]
    diff = np.diff(points, axis=1)
    rect[1] = points[np.argmin(diff)]
    rect[3] = points[np.argmax(diff)]
    return rect


def segment_clip(image: ProcessedImage, paper_region: PaperRegion | None = None) -> Tuple[np.ndarray, Tuple[int, int, int, int] | None]:
    blur = cv2.GaussianBlur(image.gray, (5, 5), 0)
    background = cv2.GaussianBlur(image.gray, (31, 31), 0)
    difference = cv2.absdiff(background, blur)
    _, thresh = cv2.threshold(difference, 12, 255, cv2.THRESH_BINARY)

    if paper_region and paper_region.mask is not None:
        inset_mask = np.zeros_like(thresh)
        x, y, w, h = paper_region.box if paper_region.box is not None else (0, 0, image.gray.shape[1], image.gray.shape[0])
        inset = max(int(min(w, h) * 0.02), 10)
        x1 = max(x + inset, 0)
        y1 = max(y + inset, 0)
        x2 = min(x + w - inset, image.gray.shape[1])
        y2 = min(y + h - inset, image.gray.shape[0])
        inset_mask[y1:y2, x1:x2] = 255
        thresh = cv2.bitwise_and(thresh, inset_mask)

    edges = cv2.Canny(blur, 40, 140)
    cleaned = cv2.bitwise_or(thresh, edges)
    kernel = np.ones((5, 5), np.uint8)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
    cleaned = cv2.dilate(cleaned, np.ones((3, 3), np.uint8), iterations=1)
    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return cleaned, None
    ranked = sorted(contours, key=cv2.contourArea, reverse=True)
    contour = None
    total_area = image.gray.shape[0] * image.gray.shape[1]
    for candidate in ranked:
        area = cv2.contourArea(candidate)
        if area < total_area * 0.0015:
            continue
        x, y, w, h = cv2.boundingRect(candidate)
        if paper_region and paper_region.box is not None:
            px, py, pw, ph = paper_region.box
            if x <= px + 4 or y <= py + 4 or x + w >= px + pw - 4 or y + h >= py + ph - 4:
                continue
        contour = candidate
        break
    if contour is None:
        return cleaned, None
    x, y, w, h = cv2.boundingRect(contour)
    return cleaned, (x, y, w, h)


def build_quality_checks(top: ProcessedImage, side: ProcessedImage, mode: str, calibrated: bool) -> List[QualityCheck]:
    checks: List[QualityCheck] = []
    for label, processed in (("Top image blur", top), ("Side image blur", side)):
        checks.append(
            QualityCheck(
                key=label.lower().replace(" ", "_"),
                label=label,
                status="good" if processed.blur_score > 120.0 else "warning",
                detail="Sharp enough for first-pass segmentation." if processed.blur_score > 120.0 else "Retake with steadier framing for better edge definition.",
            )
        )
    for label, processed in (("Top image lighting", top), ("Side image lighting", side)):
        checks.append(
            QualityCheck(
                key=label.lower().replace(" ", "_"),
                label=label,
                status="good" if 70.0 < processed.brightness < 210.0 else "warning",
                detail="Lighting is within a usable range." if 70.0 < processed.brightness < 210.0 else "Adjust lighting to reduce shadows or overexposure.",
            )
        )
    if mode == "a4":
        checks.append(
            QualityCheck(
                key="calibration_card",
                label="Calibration card visibility",
                status="good" if calibrated else "warning",
                detail="A4 scale recovered for millimeter estimates." if calibrated else "Full A4 card was not confidently detected.",
            )
        )
    return checks


def analyze_capture(mode: str, top_image: str, side_image: str) -> AnalysisResponse:
    top = preprocess(decode_data_url(top_image))
    side = preprocess(decode_data_url(side_image))

    warnings: List[str] = []
    px_per_mm, calibration_warnings = (None, [])
    calibrated = False
    paper_region = None
    if mode == "a4":
        px_per_mm, calibration_warnings, paper_region = detect_a4_scale(top)
        calibrated = px_per_mm is not None
        warnings.extend(calibration_warnings)
    else:
        paper_region = detect_paper_region(top)

    _, top_box = segment_clip(top, paper_region)
    _, side_box = segment_clip(side)

    if top_box is None:
        warnings.append("Top view clip segmentation was weak; measurements are low confidence.")
    if side_box is None:
        warnings.append("Side view clip segmentation was weak; thickness estimates are low confidence.")

    _, _, w, th = top_box if top_box is not None else (0, 0, top.image.shape[1] // 3, top.image.shape[0] // 8)
    _, _, sw, sh = side_box if side_box is not None else (0, 0, side.image.shape[1] // 5, side.image.shape[0] // 6)
    divisor = px_per_mm if calibrated and px_per_mm else 12.0

    wing_width = round(max(min(w, th) * 0.22 / divisor, 1.0), 2)
    wing_length = round(max(max(w, th) * 0.72 / divisor, 1.5), 2)
    wing_spacing = round(max(max(w, th) * 0.38 / divisor, 2.5), 2)
    attachment_region = round(max(min(w, th) * 0.35 / divisor, 1.5), 2)
    thickness = round(max(min(sw, sh) * 0.3 / divisor, 0.8), 2)
    lever_length = round(max(wing_length * 1.8, 12.0), 2)

    advisory = mode != "a4" or not calibrated
    base_conf = 0.82 if calibrated else 0.56
    segmentation_penalty = 0.12 if top_box is None or side_box is None else 0.0
    overall = max(0.3, base_conf - segmentation_penalty)

    measurements: Dict[str, Measurement] = {
        "wing_width_mm": Measurement(value=wing_width, confidence=max(0.35, overall - 0.05), advisory=advisory),
        "wing_length_mm": Measurement(value=wing_length, confidence=overall, advisory=advisory),
        "wing_spacing_mm": Measurement(value=wing_spacing, confidence=max(0.35, overall - 0.03), advisory=advisory),
        "attachment_region_width_mm": Measurement(value=attachment_region, confidence=max(0.3, overall - 0.08), advisory=advisory),
        "wing_thickness_mm": Measurement(value=thickness, confidence=max(0.28, overall - 0.14), advisory=advisory),
        "suggested_lever_length_mm": Measurement(value=lever_length, confidence=max(0.42, overall - 0.06), advisory=advisory),
    }

    if advisory:
        warnings.append("No-card mode is advisory only. Confirm sensitive dimensions before fabrication.")

    notes = [
        "Spec generator is tuned for detachable dual wing extenders only.",
        "Use manual overrides if clip thickness or insertion depth is known from calipers."
    ]

    return AnalysisResponse(
        mode=mode,
        clip_family="spring-hair-clip / dual-wing candidate",
        warnings=warnings,
        quality_checks=build_quality_checks(top, side, mode, calibrated),
        measurements=measurements,
        confidence={"overall": round(overall, 2), "calibrated": calibrated},
        notes=notes,
    )
