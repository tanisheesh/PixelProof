"""Image encoding, colormap LUT mapping, and histogram utilities."""

import base64
from typing import List, Literal
import cv2
import numpy as np

COLORMAP_TABLE = {
    "inferno": cv2.COLORMAP_INFERNO,
    "viridis": cv2.COLORMAP_VIRIDIS,
    "jet": cv2.COLORMAP_JET,
    "hot": cv2.COLORMAP_HOT,
}


def normalize_to_uint8(arr: np.ndarray, clip_percentile: float = 99.5) -> np.ndarray:
    """Normalize a 2D float array to [0, 255] uint8 with robust upper-percentile clipping."""
    arr_f = np.nan_to_num(arr.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
    min_val = float(np.min(arr_f))
    arr_shifted = arr_f - min_val
    upper = float(np.percentile(arr_shifted, clip_percentile)) if arr_shifted.size > 0 else 1.0
    if upper <= 1e-6:
        upper = float(np.max(arr_shifted))
    if upper <= 1e-6:
        return np.zeros(arr_f.shape, dtype=np.uint8)
    scaled = np.clip(arr_shifted / upper, 0.0, 1.0)
    return (scaled * 255.0).astype(np.uint8)


def apply_colormap_to_map(
    norm_uint8: np.ndarray,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> np.ndarray:
    """Apply an OpenCV false-color LUT and return an RGB uint8 image."""
    if norm_uint8.ndim == 3:
        norm_uint8 = cv2.cvtColor(norm_uint8, cv2.COLOR_RGB2GRAY)
    cv_cmap = COLORMAP_TABLE.get(colormap, cv2.COLORMAP_INFERNO)
    bgr = cv2.applyColorMap(norm_uint8, cv_cmap)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def rgb_to_base64_data_url(rgb_img: np.ndarray, fmt: str = "png", quality: int = 90) -> str:
    """Encode an RGB uint8 NumPy array into a `data:image/...;base64,...` string."""
    if rgb_img.ndim == 2:
        bgr = rgb_img
    else:
        bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)

    ext = ".webp" if fmt == "webp" else ".png"
    params = [cv2.IMWRITE_WEBP_QUALITY, quality] if fmt == "webp" else []
    ok, buf = cv2.imencode(ext, bgr, params)
    if not ok:
        ok, buf = cv2.imencode(".png", bgr)
        fmt = "png"
    b64 = base64.b64encode(buf.tobytes()).decode("ascii")
    return f"data:image/{fmt};base64,{b64}"


def compute_compact_histogram(arr_uint8: np.ndarray, bins: int = 32) -> List[float]:
    """Compute a normalized 32-bin histogram for the UI DIP Math Drawer."""
    hist, _ = np.histogram(arr_uint8.ravel(), bins=bins, range=(0, 256))
    total = float(np.sum(hist)) or 1.0
    return [round(float(v) / total, 4) for v in hist]
