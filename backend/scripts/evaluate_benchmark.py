"""
Forensic Benchmark & Evaluation Suite (`evaluate_benchmark.py`).

Evaluates the 7-layer PixelProof DIP pipeline across all built-in synthetic benchmark cases
and outputs a formatted Markdown table with:
- Ground Truth vs. Predicted Verdict
- Overall Tamper Score (0-100)
- Top Triggered DIP Layer
- Pixel-level Localization Bounding Boxes
- Execution Latency (ms)
"""

import base64
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
import numpy as np

from app.dip.pipeline import analyze_image_pipeline
from app.dip.presets_generator import get_presets_store


def _decode_b64_mask(data_url: str) -> np.ndarray:
    """Decode base64 localization mask RGB image and extract crimson tampered pixels."""
    b64_part = data_url.split(",", 1)[1] if "," in data_url else data_url
    raw = np.frombuffer(base64.b64decode(b64_part), dtype=np.uint8)
    bgr = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    # Tampered region in localization_mask is colored crimson (R=244, G=63, B=94 -> BGR=(94, 63, 244))
    red_ch = bgr[:, :, 2]
    return (red_ch > 180).astype(np.uint8)


def run_benchmark() -> None:
    presets, raw_store = get_presets_store()
    print("\n# PixelProof — 7-Layer DIP Forensic Benchmark Evaluation\n")
    print("| Case ID | Category | Expected | Predicted | Score | Top Layer | Bounding Boxes | Latency (ms) |")
    print("|---|---|---|---|---:|---|---:|---:|")

    correct = 0
    total = len(presets)

    for p in presets:
        raw_bytes, gt_mask = raw_store[p.id]
        report = analyze_image_pipeline(raw_bytes, filename=f"{p.id}.jpg")
        top_layer = max(report.layers, key=lambda l: l.score)
        is_match = (report.verdict == p.expected_verdict) or (
            p.expected_verdict == "TAMPERED" and report.verdict in ("TAMPERED", "SUSPICIOUS") and report.overall_score >= 45.0
        )
        if is_match:
            correct += 1

        print(
            f"| `{p.id}` | {p.category} | **{p.expected_verdict}** | **{report.verdict}** | "
            f"{report.overall_score:.1f} | {top_layer.short_name} ({top_layer.score:.1f}) | "
            f"{len(report.bounding_boxes)} | {report.processing_time_ms:.0f} ms |"
        )

    print(f"\n**Classification Accuracy across Benchmark Suite:** {correct}/{total} ({(correct / total) * 100:.1f}%)\n")


if __name__ == "__main__":
    run_benchmark()
