r"""
Layer 6: Lateral Chromatic Aberration & Sobel/Scharr Edge Boundary Consistency.

Mathematical Basis (Johnson & Farid):
1. Physical camera lenses exhibit wavelength-dependent refraction (Lateral Chromatic Aberration),
   causing the Red and Blue channels to radially expand/contract slightly relative to the Green channel
   away from the optical center.
2. Furthermore, spliced objects introduce either unnaturally sharp step edges (hard masking) or
   abrupt chroma-gradient mismatches where the foreground boundary meets the background.
3. By computing Scharr directional derivatives (G_x, G_y) across R, G, and B channels, we detect
   localized inter-channel gradient decorrelation and unnatural splice boundary transitions.
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


def run_edge_chromatic_layer(
    rgb: np.ndarray,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Analyze inter-channel Scharr gradient divergence (Chromatic Aberration) and splice boundary anomalies.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    r_ch = rgb[:, :, 0].astype(np.float32)
    g_ch = rgb[:, :, 1].astype(np.float32)
    b_ch = rgb[:, :, 2].astype(np.float32)

    def scharr_mag(ch: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        gx = cv2.Scharr(ch, cv2.CV_32F, 1, 0)
        gy = cv2.Scharr(ch, cv2.CV_32F, 0, 1)
        mag = np.sqrt(gx * gx + gy * gy)
        return gx, gy, mag

    rx, ry, r_mag = scharr_mag(r_ch)
    gx, gy, g_mag = scharr_mag(g_ch)
    bx, by, b_mag = scharr_mag(b_ch)

    rg_diff = np.abs(r_mag - g_mag)
    bg_diff = np.abs(b_mag - g_mag)
    chroma_edge_divergence = 0.5 * (rg_diff + bg_diff)

    # Use collinearity |cos(theta)| so natural anti-correlated color boundaries don't false-trigger
    dot_rb = np.abs(rx * bx + ry * by)
    norm_rb = (r_mag * b_mag) + 1e-4
    abs_cos_sim = np.clip(dot_rb / norm_rb, 0.0, 1.0)
    strong_edge_mask = (g_mag > np.percentile(g_mag, 88.0)).astype(np.float32)
    angular_inconsistency = (1.0 - abs_cos_sim) * strong_edge_mask

    combined_edge_anom = (
        0.65 * (chroma_edge_divergence / (np.percentile(chroma_edge_divergence, 98.0) + 12.0))
        + 0.35 * angular_inconsistency
    )
    smooth_anom = cv2.GaussianBlur(combined_edge_anom.astype(np.float32), (25, 25), 5.0)

    med_val = float(np.median(smooth_anom))
    mad_val = float(np.median(np.abs(smooth_anom - med_val))) + 0.15 * med_val + 1e-4
    z_edge = np.abs(smooth_anom - med_val) / (1.4826 * mad_val)

    norm_u8 = normalize_to_uint8(z_edge, clip_percentile=99.2)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)
    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    p99_z = float(np.percentile(z_edge, 99.0))
    anom_edge_pct = float(np.mean(z_edge > 3.6)) * 100.0
    mean_ang_err = float(np.mean(angular_inconsistency[strong_edge_mask > 0])) if np.any(strong_edge_mask > 0) else 0.0

    raw_score = (
        min(45.0, max(0.0, (p99_z - 3.2) * 10.0))
        + min(35.0, max(0.0, (anom_edge_pct - 2.0) * 4.5))
        + min(20.0, max(0.0, (mean_ang_err - 0.16) * 80.0))
    )
    score = round(float(np.clip(raw_score + 5.0, 5.0, 96.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Abnormal inter-channel Scharr gradient divergence and splice boundary transition "
            f"(99th-percentile Z = {p99_z:.2f}\u03c3)."
        )
    elif score >= 32.0:
        status = "suspicious"
        summary = (
            f"Localized chromatic edge inconsistency along object boundaries "
            f"(Z = {p99_z:.2f}\u03c3, {anom_edge_pct:.1f}% area)."
        )
    else:
        status = "clean"
        summary = (
            f"Consistent R/G/B optical edge alignment and natural boundary transitions "
            f"(max Z = {p99_z:.2f}\u03c3)."
        )

    findings = [
        f"Computed 3\u00d73 Scharr directional operators (Gx, Gy) across R, G, and B spectral channels.",
        f"99th-percentile inter-channel gradient Z-score = {p99_z:.2f}\u03c3 ({anom_edge_pct:.2f}% area exceeds 3.6\u03c3).",
        f"Mean Red-vs-Blue gradient vector angular decorrelation on dominant edges = {mean_ang_err:.4f}.",
    ]

    dip_math = DipMathInfo(
        syllabus_unit="Unit 1 & 2: First-Order Spatial Gradient Operators (Sobel / Scharr) & Optical Aberration",
        algorithm_name="Multi-Channel Scharr Gradient Vector Alignment & Boundary Discontinuity Analysis",
        latex_formula=r"\mathbf{G}_c = \left[K_x * I_c, \; K_y * I_c\right]^T, \quad D_{\text{chroma}}(x,y) = \frac{1}{2}\left(\|\mathbf{G}_R\| - \|\mathbf{G}_G\|\right) + \left(1 - \frac{|\mathbf{G}_R \cdot \mathbf{G}_B|}{\|\mathbf{G}_R\|\|\mathbf{G}_B\|}\right)",
        kernel_or_matrix=[
            [-3.0, 0.0, 3.0],
            [-10.0, 0.0, 10.0],
            [-3.0, 0.0, 3.0],
        ],
        parameters_used={
            "gradient_operator": "3x3 Rotational-Symmetric Scharr Kernel",
            "channels_compared": "R-G Magnitude Divergence + R-B Cosine Vector Alignment",
            "strong_edge_percentile": "Top 12% gradient magnitudes",
        },
        interpretation_guide=(
            "Spliced objects pasted from another source or edited with selection masks create sharp chromatic "
            "gradient transitions and R/B vector misalignments along the composite seam."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="edge_chromatic",
        name="Layer 6: Chromatic Aberration & Scharr Edge Consistency",
        short_name="Edge & Chroma",
        score=score,
        weight=0.12,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "edge_p99_z": round(p99_z, 2),
            "anomalous_edge_pct": round(anom_edge_pct, 2),
            "rb_angular_decorrelation": round(mean_ang_err, 4),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
