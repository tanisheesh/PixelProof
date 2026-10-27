r"""
Layer 5: Double JPEG Compression & 8x8 Blocking Artifact Grid Alignment (BAG).

Mathematical Basis (Bianchi & Piva / Farid):
1. JPEG compresses non-overlapping 8x8 pixel blocks independently using 2D-DCT, introducing blocky
   discontinuities along coordinates x \equiv 0 (mod 8) and y \equiv 0 (mod 8).
2. When an image region is cropped or spliced at coordinates not aligned to the 8x8 grid and re-saved,
   its internal 8x8 blocking grid is out of phase with the background (Grid Misalignment).
3. Furthermore, double quantization Q_1 -> Q_2 creates periodic zero-bins or double peaks ("comb effect")
   in the histogram of 8x8 AC DCT coefficients.
"""

from typing import Literal, Tuple
import cv2
import numpy as np

from app.core.schemas import DipMathInfo, LayerResult
from app.dip.preprocessing import rgb_to_luminance_float
from app.utils.encoding import (
    apply_colormap_to_map,
    compute_compact_histogram,
    normalize_to_uint8,
    rgb_to_base64_data_url,
)


def run_double_jpeg_layer(
    rgb: np.ndarray,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Analyze 8x8 Blocking Artifact Grid (BAG) discontinuities and DCT AC coefficient histogram periodicity.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    lum = rgb_to_luminance_float(rgb)
    h, w = lum.shape

    diff_h = np.zeros_like(lum)
    diff_v = np.zeros_like(lum)
    diff_h[:, 1:-1] = np.abs(2.0 * lum[:, 1:-1] - lum[:, :-2] - lum[:, 2:])
    diff_v[1:-1, :] = np.abs(2.0 * lum[1:-1, :] - lum[:-2, :] - lum[2:, :])

    bsize = 32
    stride = 16
    gh = max(1, (h - bsize) // stride + 1)
    gw = max(1, (w - bsize) // stride + 1)

    bag_anomaly_grid = np.zeros((gh, gw), dtype=np.float32)
    phase_mismatch_count = 0

    for gy_i in range(gh):
        y0 = gy_i * stride
        for gx_i in range(gw):
            x0 = gx_i * stride
            patch_h = diff_h[y0 : y0 + bsize, x0 : x0 + bsize]
            patch_v = diff_v[y0 : y0 + bsize, x0 : x0 + bsize]

            col_phases = np.array([np.mean(patch_h[:, p::8]) for p in range(8)], dtype=np.float32)
            row_phases = np.array([np.mean(patch_v[p::8, :]) for p in range(8)], dtype=np.float32)

            expected_px = (8 - (x0 % 8)) % 8
            expected_py = (8 - (y0 % 8)) % 8

            actual_px = int(np.argmax(col_phases))
            actual_py = int(np.argmax(row_phases))

            max_off_phase_x = float(np.max(np.delete(col_phases, expected_px)))
            med_phase_x = float(np.median(col_phases)) + 1.5
            max_off_phase_y = float(np.max(np.delete(row_phases, expected_py)))
            med_phase_y = float(np.median(row_phases)) + 1.5

            mismatch_ratio = 0.5 * (max_off_phase_x / med_phase_x + max_off_phase_y / med_phase_y)
            bag_anomaly_grid[gy_i, gx_i] = mismatch_ratio

            if (actual_px != expected_px or actual_py != expected_py) and mismatch_ratio > 1.38:
                phase_mismatch_count += 1

    # 8x8 DCT AC Coefficient Histogram Comb Periodicity Check
    h8 = (h // 8) * 8
    w8 = (w // 8) * 8
    ac_10_vals = []
    ac_01_vals = []
    for y in range(0, h8, 8):
        for x in range(0, w8, 8):
            blk = lum[y : y + 8, x : x + 8] - 128.0
            dct_blk = cv2.dct(blk)
            ac_01_vals.append(dct_blk[0, 1])
            ac_10_vals.append(dct_blk[1, 0])

    ac_all = np.array(ac_01_vals + ac_10_vals, dtype=np.float32)
    hist_ac, _ = np.histogram(ac_all, bins=81, range=(-40.5, 40.5))
    hist_f = hist_ac.astype(np.float32)
    # Remove smooth envelope via 5-tap moving average
    kernel_smooth = np.ones(5, dtype=np.float32) / 5.0
    smooth_env = np.convolve(hist_f, kernel_smooth, mode="same")
    high_freq_hist = hist_f - smooth_env
    hist_fft = np.abs(np.fft.rfft(high_freq_hist))
    comb_periodicity = float(np.max(hist_fft[4:]) / (np.mean(hist_fft[1:]) + 1e-4)) if hist_fft.size > 5 else 1.0

    med_bag = float(np.median(bag_anomaly_grid))
    mad_bag = float(np.median(np.abs(bag_anomaly_grid - med_bag))) + 0.10 * med_bag + 1e-4
    z_bag = np.abs(bag_anomaly_grid - med_bag) / (1.4826 * mad_bag)

    spatial_bag = cv2.resize(z_bag, (w, h), interpolation=cv2.INTER_CUBIC)
    spatial_bag = cv2.GaussianBlur(spatial_bag, (15, 15), 3.0)

    norm_u8 = normalize_to_uint8(spatial_bag, clip_percentile=99.0)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)
    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    total_blocks = max(1, gh * gw)
    mismatch_pct = (phase_mismatch_count / float(total_blocks)) * 100.0
    p98_z = float(np.percentile(z_bag, 98.0))

    raw_score = (
        min(45.0, max(0.0, (p98_z - 3.1) * 11.0))
        + min(30.0, max(0.0, (comb_periodicity - 2.6) * 14.0))
        + min(25.0, max(0.0, (mismatch_pct - 24.0) * 1.8))
    )
    score = round(float(np.clip(raw_score + 5.0, 5.0, 96.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Double JPEG quantization & 8x8 blocking grid misalignment detected "
            f"(comb index = {comb_periodicity:.2f}, block Z = {p98_z:.2f}\u03c3)."
        )
    elif score >= 32.0:
        status = "suspicious"
        summary = (
            f"Localized 8x8 DCT blocking grid phase shifts across {mismatch_pct:.1f}% of blocks "
            f"(comb index = {comb_periodicity:.2f})."
        )
    else:
        status = "clean"
        summary = (
            f"Single coherent 8x8 DCT quantization grid with smooth Laplacian AC coefficient distribution "
            f"(comb index = {comb_periodicity:.2f})."
        )

    findings = [
        f"Analyzed {len(ac_01_vals)} non-overlapping 8\u00d78 2D-DCT blocks for AC(0,1) & AC(1,0) comb periodicity (index = {comb_periodicity:.2f}).",
        f"8\u00d78 Blocking Artifact Grid (BAG) phase misalignment observed in {mismatch_pct:.1f}% of local windows.",
        f"98th-percentile blocking discontinuity Z-score = {p98_z:.2f}\u03c3.",
    ]

    dip_math = DipMathInfo(
        signal_domain="8x8 2D-DCT Coefficient Histograms & Blocking Artifact Grid (BAG)",
        algorithm_name="Double Quantization DCT Comb-Periodicity & 8x8 Block Phase Alignment",
        latex_formula=r"Q_{12}(c) = \left\lfloor \frac{\lfloor c / q_1 \rceil \cdot q_1}{q_2} \right\rceil, \quad \Delta_x(x,y) = |2I(x,y) - I(x-1,y) - I(x+1,y)|",
        parameters_used={
            "dct_grid_size": "8x8 pixels",
            "monitored_ac_subbands": "AC(0,1) and AC(1,0)",
            "phase_window_size": "32x32 pixels (stride 16)",
        },
        interpretation_guide=(
            "When a region from one JPEG is pasted into another at coordinates not divisible by 8, or saved twice "
            "at different qualities (Q1 -> Q2), its 8x8 block boundaries shift out of phase with the background."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="double_jpeg",
        name="Layer 5: Double JPEG Quantization & 8x8 Blocking Grid",
        short_name="Double JPEG & Grid",
        score=score,
        weight=0.10,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "dct_comb_periodicity": round(comb_periodicity, 2),
            "grid_mismatch_pct": round(mismatch_pct, 2),
            "bag_p98_z": round(p98_z, 2),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
