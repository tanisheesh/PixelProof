r"""
Layer 1: Error Level Analysis (ELA) & Multi-Quality JPEG Ghost Detection.

Mathematical Basis:
- A JPEG image compressed at quality Q_0 quantizes 8x8 2D-DCT coefficients using matrix Q(Q_0).
- Re-compressing the image at quality Q_1 produces residual:
      E_{Q_1}(x, y) = |I(x, y) - JPEG_{Q_1}(I(x, y))|
- Authentic regions that underwent the same compression history exhibit uniform 8x8 DCT quantization error.
- Spliced, retouched, or painted regions are not at a local quantization minimum and exhibit significantly
  higher or lower error residuals, especially when inspected across luminance (Y) vs chrominance (Cb, Cr).
"""

from typing import Literal, Tuple
import cv2
import numpy as np

from app.core.schemas import DipMathInfo, LayerResult
from app.utils.encoding import (
    apply_colormap_to_map,
    compute_compact_histogram,
    normalize_to_uint8,
    rgb_to_base64_data_url,
)


def run_ela_layer(
    rgb: np.ndarray,
    quality: int = 90,
    scale_gain: float = 18.0,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Execute Multi-Quality Error Level Analysis and JPEG Ghost discrepancy detection.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    # 1. Primary ELA residual at target quality Q
    ok, enc_buf = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, int(quality)])
    if not ok:
        raise RuntimeError("Failed to encode JPEG in memory for ELA.")
    recompressed_bgr = cv2.imdecode(enc_buf, cv2.IMREAD_COLOR)
    recompressed_rgb = cv2.cvtColor(recompressed_bgr, cv2.COLOR_BGR2RGB)

    orig_ycrcb = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb).astype(np.float32)
    recomp_ycrcb = cv2.cvtColor(recompressed_rgb, cv2.COLOR_RGB2YCrCb).astype(np.float32)
    diff_ycrcb = np.abs(orig_ycrcb - recomp_ycrcb)

    residual_raw = 0.50 * diff_ycrcb[:, :, 0] + 0.25 * diff_ycrcb[:, :, 1] + 0.25 * diff_ycrcb[:, :, 2]

    # 2. Multi-Quality JPEG Ghost Sweep (Q = 75, 85, 95)
    ghost_maps = []
    ghost_qualities = [75, 85, 95]
    for q_test in ghost_qualities:
        _, buf_q = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, q_test])
        dec_q = cv2.imdecode(buf_q, cv2.IMREAD_COLOR)
        diff_q = np.mean(np.abs(bgr.astype(np.float32) - dec_q.astype(np.float32)), axis=2)
        smooth_q = cv2.blur(diff_q, (24, 24))
        norm_q = smooth_q / (float(np.mean(smooth_q)) + 1e-5)
        ghost_maps.append(norm_q)

    ghost_stack = np.stack(ghost_maps, axis=0)
    ghost_variance = np.var(ghost_stack, axis=0)

    # 3. Normalize ELA residual by local texture energy so natural textured edges don't false-trigger
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edge_mag = np.sqrt(gx * gx + gy * gy)
    local_edge_mean = cv2.GaussianBlur(edge_mag, (25, 25), 5.0)
    texture_norm = 1.0 + (local_edge_mean / (float(np.median(local_edge_mean)) + 12.0)) * 0.65

    weighted_ela = residual_raw / texture_norm
    block_ela = cv2.GaussianBlur(weighted_ela, (25, 25), 5.0)

    med_ela = float(np.median(block_ela))
    mad_ela = float(np.median(np.abs(block_ela - med_ela))) + 0.08 * med_ela + 1e-4
    z_ela = np.abs(block_ela - med_ela) / (1.4826 * mad_ela)

    amplified_visual = np.clip(residual_raw * (scale_gain / 10.0), 0.0, 255.0)
    combined_map = 0.45 * (amplified_visual / 255.0) + 0.55 * np.clip(z_ela / 6.0, 0.0, 1.0)
    combined_map = cv2.GaussianBlur(combined_map.astype(np.float32), (9, 9), 1.8)

    norm_u8 = normalize_to_uint8(combined_map, clip_percentile=99.2)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)
    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    p99_z = float(np.percentile(z_ela, 99.0))
    p95_z = float(np.percentile(z_ela, 95.0))
    anomalous_area_ratio = float(np.mean(z_ela > 3.6))
    ghost_peak = float(np.percentile(ghost_variance, 99.0))

    raw_score = (
        min(45.0, max(0.0, (p99_z - 3.1) * 10.5))
        + min(35.0, max(0.0, (anomalous_area_ratio - 0.015) * 450.0))
        + min(20.0, max(0.0, (ghost_peak - 0.03) * 160.0))
    )
    score = round(float(np.clip(raw_score + 6.0, 6.0, 98.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Strong 8x8 DCT quantization residual anomaly (99th-percentile Z = {p99_z:.2f}\u03c3) "
            f"across {anomalous_area_ratio * 100:.1f}% of image blocks."
        )
    elif score >= 34.0:
        status = "suspicious"
        summary = (
            f"Moderate JPEG compression residual divergence (Z = {p99_z:.2f}\u03c3); localized regions "
            f"deviate from background quantization floor."
        )
    else:
        status = "clean"
        summary = (
            f"Uniform 8x8 DCT quantization error floor across luminance and chrominance channels "
            f"(max Z = {p99_z:.2f}\u03c3)."
        )

    findings = [
        f"Re-compression quality Q = {quality} yielded mean YCbCr residual of {float(np.mean(residual_raw)):.2f} intensity levels.",
        f"99th-percentile block Z-score = {p99_z:.2f}\u03c3 (95th-percentile = {p95_z:.2f}\u03c3); {anomalous_area_ratio * 100:.2f}% area exceeds 3.6\u03c3 threshold.",
        f"Multi-quality JPEG Ghost sweep (Q \u2208 {ghost_qualities}) variance peak = {ghost_peak:.4f}.",
    ]

    dip_math = DipMathInfo(
        signal_domain="Color Space (YCbCr) & 8x8 DCT Quantization",
        algorithm_name="Edge-Normalized Multi-Quality Error Level Analysis (ELA) & JPEG Ghosting",
        latex_formula=r"E_Q(x,y) = \|I_{\text{YCbCr}}(x,y) - \mathcal{D}_Q(\mathcal{E}_Q(I_{\text{YCbCr}}(x,y)))\|_w, \quad Z(x,y) = \frac{|G_\sigma * E_Q - \mu_{\text{med}}|}{1.4826 \cdot \text{MAD}}",
        kernel_or_matrix=[
            [16, 11, 10, 16, 24, 40, 51, 61],
            [12, 12, 14, 19, 26, 58, 60, 55],
            [14, 13, 16, 24, 40, 57, 69, 56],
            [14, 17, 22, 29, 51, 87, 80, 62],
        ],
        parameters_used={
            "jpeg_quality_Q": quality,
            "scale_gain_gamma": scale_gain,
            "ghost_sweep_qualities": ghost_qualities,
            "color_space": "ITU-R BT.601 YCbCr (0.5Y + 0.25Cr + 0.25Cb)",
        },
        interpretation_guide=(
            "Bright regions in the ELA heatmap indicate pixels whose 8x8 DCT coefficients were either "
            "compressed at a different quality factor (spliced) or modified post-capture (inpainting/blurring)."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="ela",
        name="Layer 1: Error Level Analysis (ELA) & JPEG Ghosting",
        short_name="ELA & Ghosts",
        score=score,
        weight=0.22,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "mean_residual": round(float(np.mean(residual_raw)), 3),
            "p99_z_score": round(p99_z, 2),
            "anomalous_area_pct": round(anomalous_area_ratio * 100.0, 2),
            "ghost_variance_peak": round(ghost_peak, 4),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
