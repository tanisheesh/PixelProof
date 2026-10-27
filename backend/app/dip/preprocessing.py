"""Color space conversions, aspect-preserving resizing, and gradient helpers."""

from typing import Tuple
import cv2
import numpy as np


def decode_image_bytes(raw_bytes: bytes, max_dim: int = 800) -> Tuple[np.ndarray, int, int]:
    """
    Decode raw image bytes into an RGB uint8 NumPy array.
    Resizes if either dimension exceeds `max_dim` to guarantee sub-1.5s DIP execution.
    Returns (rgb_resized, orig_width, orig_height).
    """
    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Unable to decode image buffer. Unsupported or corrupted image format.")
    orig_h, orig_w = bgr.shape[:2]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    if max(orig_h, orig_w) > max_dim:
        scale = max_dim / float(max(orig_h, orig_w))
        new_w = max(64, int(round(orig_w * scale)))
        new_h = max(64, int(round(orig_h * scale)))
        rgb = cv2.resize(rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return rgb, orig_w, orig_h


def rgb_to_ycbcr(rgb: np.ndarray) -> np.ndarray:
    """
    Convert RGB uint8 image to YCbCr color space (ITU-R BT.601).
    Y = 0.299 R + 0.587 G + 0.114 B
    """
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb)  # Note: OpenCV stores Y, Cr, Cb


def rgb_to_luminance_float(rgb: np.ndarray) -> np.ndarray:
    """Return float32 luminance Y in [0, 255]."""
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    return 0.299 * r + 0.587 * g + 0.114 * b
