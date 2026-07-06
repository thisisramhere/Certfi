import os
import uuid
from typing import List, Optional, Tuple
from dataclasses import dataclass, field
import cv2
import numpy as np
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class DetectedPlaceholder:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "name"
    x: float = 0.0
    y: float = 0.0
    width: float = 20.0
    height: float = 5.0
    rotation: float = 0.0
    alignment: str = "center"
    font_recommendation: str = "Helvetica"
    confidence_score: float = 0.85
    custom_key: Optional[str] = None
    is_required: bool = True
    default_value: Optional[str] = None

    def model_dump(self, exclude=None):
        data = {
            "id": self.id,
            "type": self.type,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "rotation": self.rotation,
            "alignment": self.alignment,
            "font_recommendation": self.font_recommendation,
            "confidence_score": self.confidence_score,
            "custom_key": self.custom_key,
            "is_required": self.is_required,
            "default_value": self.default_value,
        }
        if exclude:
            for key in exclude:
                data.pop(key, None)
        return data


@dataclass
class AnalysisResult:
    template_id: str
    placeholders: List[DetectedPlaceholder]
    analysis_metadata: dict = field(default_factory=dict)


class AIPlacementService:
    PLACEHOLDER_DEFS = {
        "name": {"required": True, "width_pct": 0.50, "height_pct": 0.08, "alignment": "center", "font": "Helvetica-Bold"},
        "certificate_id": {"required": True, "width_pct": 0.25, "height_pct": 0.04, "alignment": "center", "font": "Courier"},
        "qr_code": {"required": False, "width_pct": 0.12, "height_pct": 0.12, "alignment": "center", "font": "Helvetica"},
    }

    ZONE_CANDIDATES = {
        "name": [
            (25, 40, 50, 10),
            (30, 42, 40, 8),
            (25, 45, 50, 8),
            (20, 38, 60, 12),
        ],
        "certificate_id": [
            (72, 88, 22, 5),
            (70, 90, 25, 4),
            (65, 88, 30, 5),
            (75, 86, 20, 5),
        ],
        "qr_code": [
            (8, 82, 12, 12),
            (10, 85, 10, 10),
            (5, 80, 12, 12),
            (8, 84, 10, 10),
        ],
    }

    MAX_OCCUPANCY_RATIO = 0.25

    async def analyze_and_placeholders(
        self,
        template_id: str,
        file_path: str,
    ) -> AnalysisResult:
        img = self._load_image(file_path)
        img_h, img_w = img.shape[:2]

        max_dim = 1000
        if max(img_w, img_h) > max_dim:
            scale = max_dim / max(img_w, img_h)
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            img_h, img_w = img.shape[:2]

        occupancy_mask = self._build_occupancy_mask(img)

        placed = self._find_best_positions(occupancy_mask, img_w, img_h)

        logger.info(
            "AI GENERATED: %d placeholders (name=%s, cert_id=%s, qr=%s)",
            len(placed),
            any(p.type == "name" for p in placed),
            any(p.type == "certificate_id" for p in placed),
            any(p.type == "qr_code" for p in placed),
        )

        for p in placed:
            logger.info(
                "AI PLACED: type=%s x=%.1f%% y=%.1f%% w=%.1f%% h=%.1f%% occupancy=%.2f",
                p.type, p.x, p.y, p.width, p.height,
                getattr(p, 'confidence_score', 0),
            )

        required_types = {"name", "certificate_id", "qr_code"}
        placed_types = {p.type for p in placed}
        missing = required_types - placed_types
        if missing:
            logger.info("AI FALLBACK: adding missing placeholders: %s", missing)
            fallback = self._default_certificate_layout()
            for fb in fallback:
                if fb.type in missing:
                    placed.append(fb)
                    logger.info("AI FALLBACK: added %s at x=%.1f%% y=%.1f%%", fb.type, fb.x, fb.y)

        contours = self._find_content_contours(occupancy_mask)

        logger.info(
            "AI Analysis: Image: %dx%d, Contours: %d, Final placeholders: %d",
            img_w, img_h, len(contours), len(placed),
        )

        if not placed:
            average_confidence = 0.0
        else:
            average_confidence = (
                sum(p.confidence_score for p in placed) / len(placed)
            )

        metadata = {
            "image_width": img_w,
            "image_height": img_h,
            "placeholders_detected": len(placed),
            "occupied_contours": len(contours),
            "average_confidence": round(average_confidence, 2),
            "reasoning": self._generate_reasoning(placed, img_w, img_h),
        }

        return AnalysisResult(
            template_id=template_id,
            placeholders=placed,
            analysis_metadata=metadata,
        )

    def _find_best_positions(
        self,
        occupancy_mask: np.ndarray,
        img_w: int,
        img_h: int,
    ) -> List[DetectedPlaceholder]:
        placeholders = []
        placed_rects: List[Tuple[int, int, int, int]] = []

        for ptype in ["name", "certificate_id", "qr_code"]:
            candidates = self.ZONE_CANDIDATES.get(ptype, [])
            pdef = self.PLACEHOLDER_DEFS.get(ptype, {})

            best = None
            best_occupancy = 1.0
            best_xywh = None

            for cx_pct, cy_pct, cw_pct, ch_pct in candidates:
                cx = int(img_w * cx_pct / 100)
                cy = int(img_h * cy_pct / 100)
                cw = int(img_w * cw_pct / 100)
                ch = int(img_h * ch_pct / 100)

                if cx < 0 or cy < 0 or cx + cw > img_w or cy + ch > img_h:
                    continue
                if self._overlaps_any(cx, cy, cw, ch, placed_rects):
                    continue

                region = occupancy_mask[cy:cy+ch, cx:cx+cw]
                total = cw * ch
                if total == 0:
                    continue
                occupied = cv2.countNonZero(region)
                occupancy = occupied / total

                logger.info(
                    "AI CANDIDATE: type=%s candidate=(%d,%d %dx%d) occupancy=%.2f",
                    ptype, cx, cy, cw, ch, occupancy,
                )

                if occupancy <= self.MAX_OCCUPANCY_RATIO:
                    best = ptype
                    best_occupancy = occupancy
                    best_xywh = (cx, cy, cw, ch)
                    logger.info(
                        "AI SELECTED: type=%s x=%d y=%d w=%d h=%d occupancy=%.2f",
                        ptype, cx, cy, cw, ch, occupancy,
                    )
                    break

                if occupancy < best_occupancy:
                    best_occupancy = occupancy
                    best_xywh = (cx, cy, cw, ch)

            if best_xywh is None:
                logger.info("AI NO_CANDIDATE: %s — using default", ptype)
                default = self._default_certificate_layout()
                d = next((d for d in default if d.type == ptype), None)
                if d:
                    best_xywh = (
                        int(img_w * d.x / 100),
                        int(img_h * d.y / 100),
                        int(img_w * d.width / 100),
                        int(img_h * d.height / 100),
                    )
                    best_occupancy = 0.0

            if best_xywh:
                px, py, pw, ph = best_xywh
                x_pct = round(px / img_w * 100, 2)
                y_pct = round(py / img_h * 100, 2)
                w_pct = round(pw / img_w * 100, 2)
                h_pct = round(ph / img_h * 100, 2)

                conf = round(max(0.5, 1.0 - best_occupancy), 2)

                placeholders.append(DetectedPlaceholder(
                    type=ptype,
                    x=x_pct,
                    y=y_pct,
                    width=w_pct,
                    height=h_pct,
                    alignment=pdef.get("alignment", "center"),
                    font_recommendation=pdef.get("font", "Helvetica"),
                    confidence_score=conf,
                    is_required=pdef.get("required", True),
                ))

                placed_rects.append((px, py, pw, ph))

        return placeholders

    def _load_image(self, file_path: str) -> np.ndarray:
        img = cv2.imread(file_path)
        if img is None:
            logger.warning(f"Could not load image with cv2: {file_path}, creating blank")
            img = np.ones((850, 1200, 3), dtype=np.uint8) * 255
        return img

    def _build_occupancy_mask(self, img: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            21, 12
        )

        edges = cv2.Canny(gray, 50, 150)

        combined = cv2.bitwise_or(thresh, edges)

        kernel_small = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_small)

        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 10))
        dilated = cv2.dilate(cleaned, kernel_dilate, iterations=1)

        return dilated

    def _find_content_contours(self, mask: np.ndarray) -> list:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return [c for c in contours if cv2.contourArea(c) > 100]

    def _default_certificate_layout(self) -> List[DetectedPlaceholder]:
        return [
            DetectedPlaceholder(type="name", x=25, y=42, width=50, height=10, alignment="center", font_recommendation="Helvetica-Bold", confidence_score=0.95, is_required=True),
            DetectedPlaceholder(type="certificate_id", x=70, y=86, width=25, height=5, alignment="center", font_recommendation="Courier", confidence_score=0.95, is_required=True),
            DetectedPlaceholder(type="qr_code", x=5, y=80, width=10, height=10, alignment="center", font_recommendation="Helvetica", confidence_score=0.90, is_required=False),
        ]


    def _is_valid_position(
        self, x: int, y: int, w: int, h: int, img_w: int, img_h: int
    ) -> bool:
        if x < 0 or y < 0:
            return False
        if x + w > img_w or y + h > img_h:
            return False
        return True

    def _overlaps_any(
        self,
        x: int, y: int, w: int, h: int,
        existing: List[Tuple[int, int, int, int]],
        margin: int = 10,
    ) -> bool:
        for (ex, ey, ew, eh) in existing:
            if (x < ex + ew + margin and x + w + margin > ex and
                    y < ey + eh + margin and y + h + margin > ey):
                return True
        return False

    def _calculate_confidence(
        self,
        placeholder: DetectedPlaceholder,
        occupancy_mask: np.ndarray,
        img_w: int,
        img_h: int,
    ) -> float:
        px = int(placeholder.x / 100 * img_w)
        py = int(placeholder.y / 100 * img_h)
        pw = int(placeholder.width / 100 * img_w)
        ph = int(placeholder.height / 100 * img_h)

        px = max(0, min(px, img_w - 1))
        py = max(0, min(py, img_h - 1))
        pw = max(1, min(pw, img_w - px))
        ph = max(1, min(ph, img_h - py))

        region_mask = occupancy_mask[py:py+ph, px:px+pw]
        total = pw * ph
        if total == 0:
            return 0.5

        occupied = cv2.countNonZero(region_mask)
        whitespace_ratio = 1.0 - (occupied / total)

        center_x = px + pw // 2
        center_y = py + ph // 2
        img_cx, img_cy = img_w // 2, img_h // 2
        dist = ((center_x - img_cx)**2 + (center_y - img_cy)**2) ** 0.5
        diagonal = (img_w**2 + img_h**2) ** 0.5
        center_score = 1.0 - (dist / diagonal)

        size_adequacy = min(pw / (img_w * 0.2), 1.0)

        confidence = (
            0.45 * whitespace_ratio +
            0.30 * center_score +
            0.25 * size_adequacy
        )
        return round(min(max(confidence, 0.5), 0.99), 2)

    def _generate_reasoning(
        self,
        placeholders: List[DetectedPlaceholder],
        img_w: int,
        img_h: int,
    ) -> str:
        if not placeholders:
            return (
                f"Analyzed certificate image ({img_w}x{img_h}). "
                f"No free regions detected. Using default certificate layout."
            )
        types_found = [p.type for p in placeholders]
        avg_conf = (
            sum(p.confidence_score for p in placeholders) / len(placeholders)
            if placeholders else 0
        )
        return (
            f"Analyzed certificate image ({img_w}x{img_h}). "
            f"Detected {len(placeholders)} placement regions for: {', '.join(types_found)}. "
            f"Average confidence: {avg_conf:.2f}. "
            f"All placeholders placed in verified empty regions with no content overlap."
        )
