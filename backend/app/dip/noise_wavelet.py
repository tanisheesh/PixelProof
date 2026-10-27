r"""
Layer 2: Wavelet Domain Noise Variance & Adaptive Wiener Filter Residual.

Mathematical Basis:
- Every imaging sensor and post-processing pipeline leaves an additive high-frequency noise signature:
      I(x, y) = S(x, y) + \eta(x, y)
- Using a 2D Discrete Wavelet Transform (DWT with Daubechies `db4` or `haar` basis), the diagonal detail
  sub-band HH_1 isolates high-frequency horizontal+vertical fluctuations while rejecting low-frequency illumination.
- Donoho's robust Median Absolute Deviation (MAD) estimator computes local noise standard deviation \hat{\sigma}_b
  within sliding B x B blocks:
      \hat{\sigma}_b = \frac{\text{median}(|HH_{1,b}|)}{0.6745}
- Simultaneously, a spatial Adaptive Wiener Filter estimates local mean \mu and variance \sigma^2 to extract
  the denoising residual R(x,y) = I(x,y) - Wiener(I(x,y)).
- Spliced objects (higher/lower ISO noise) or retouched/blurred regions (near-zero noise) deviate sharply
  from the global camera noise floor.
"""

from typing import Literal, Tuple
import cv2
import numpy as np
import pywt

from app.core.schemas import DipMathInfo, LayerResult
from app.dip.preprocessing import rgb_to_luminance_float
from app.utils.encoding import (
    apply_colormap_to_map,
    compute_compact_histogram,
    normalize_to_uint8,
    rgb_to_base64_data_url,
)


def _adaptive_wiener_residual(lum: np.ndarray, ksize: int = 5) -> np.ndarray:
    """
    Vectorized spatial Adaptive Wiener Filter (Lee/Lim formulation) with safe zero-variance handling:
      mu_L = E[I],  sigma_L^2 = E[I^2] - mu_L^2
      I_wiener = mu_L + max(0, sigma_L^2 - nu^2) / max(sigma_L^2, 1e-4) * (I - mu_L)
    Returns absolute noise residual |I - I_wiener|.
    """
    mu = cv2.blur(lum, (ksize, ksize))
    mu_sq = cv2.blur(lum * lum, (ksize, ksize))
    var_local = np.maximum(0.0, mu_sq - mu * mu)
    noise_var = float(np.median(var_local))
    gain = np.maximum(0.0, var_local - noise_var) / np.maximum(var_local, 1e-4)
    wiener_est = mu + gain * (lum - mu)
    return np.abs(lum - wiener_est)


def run_noise_wavelet_layer(
    rgb: np.ndarray,
    wavelet_family: Literal["haar", "db2", "db4"] = "db4",
    block_size: int = 32,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Execute 2D-DWT HH1 sub-band MAD noise estimation + Adaptive Wiener residual variance mapping.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    lum = rgb_to_luminance_float(rgb)
    h, w = lum.shape

    # 1. 2D Discrete Wavelet Transform (1st-level decomposition: LL, (LH, HL, HH))
    coeffs2 = pywt.dwt2(lum, wavelet_family)
    _, (_, _, hh1) = coeffs2
    hh1_full = cv2.resize(np.abs(hh1).astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)

    # 2. Spatial Adaptive Wiener Filter Residual (5x5 local neighborhood, warning-free)
    wiener_res = _adaptive_wiener_residual(lum, ksize=5)

    # 3. Edge Masking: prevent strong structural object edges from skewing noise estimation
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
    grad_mag = np.sqrt(gx * gx + gy * gy)
    edge_threshold = float(np.percentile(grad_mag, 85.0)) + 1e-3

    combined_noise_signal = 0.65 * hh1_full + 0.35 * wiener_res

    # 4. Sliding block MAD noise level estimation
    bsize = max(16, int(block_size))
    stride = max(8, bsize // 2)
    grid_h = max(1, (h - bsize) // stride + 1)
    grid_w = max(1, (w - bsize) // stride + 1)

    sigma_grid = np.zeros((grid_h, grid_w), dtype=np.float32)
    valid_mask = np.zeros((grid_h, grid_w), dtype=bool)

    for gy_idx in range(grid_h):
        y0 = gy_idx * stride
        y1 = min(h, y0 + bsize)
        for gx_idx in range(grid_w):
            x0 = gx_idx * stride
            x1 = min(w, x0 + bsize)

            patch_noise = combined_noise_signal[y0:y1, x0:x1]
            patch_grad = grad_mag[y0:y1, x0:x1]
            patch_lum = lum[y0:y1, x0:x1]

            non_edge = (patch_grad < edge_threshold) & (patch_lum > 8.0) & (patch_lum < 247.0)
            if np.count_nonzero(non_edge) >= (bsize * bsize) // 6:
                samples = patch_noise[non_edge]
                valid_mask[gy_idx, gx_idx] = True
            else:
                samples = patch_noise.ravel()

            med_val = np.median(samples)
            sigma_hat = float(np.median(np.abs(samples - med_val))) / 0.6745
            sigma_grid[gy_idx, gx_idx] = sigma_hat

    valid_sigmas = sigma_grid[valid_mask] if np.any(valid_mask) else sigma_grid.ravel()
    global_median_sigma = float(np.median(valid_sigmas))
    global_mad_sigma = float(np.median(np.abs(valid_sigmas - global_median_sigma))) + 1e-4

    deviation_grid = np.abs(sigma_grid - global_median_sigma) / (1.4826 * global_mad_sigma + 0.12 * global_median_sigma)

    deviation_map = cv2.resize(deviation_grid, (w, h), interpolation=cv2.INTER_CUBIC)
    deviation_map = cv2.GaussianBlur(deviation_map, (15, 15), 3.0)

    norm_u8 = normalize_to_uint8(deviation_map, clip_percentile=99.0)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)
    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    p98_dev = float(np.percentile(deviation_grid, 98.0))
    min_sigma = float(np.min(valid_sigmas)) if valid_sigmas.size > 0 else 0.0
    max_sigma = float(np.max(valid_sigmas)) if valid_sigmas.size > 0 else 0.0
    sigma_ratio = max_sigma / (min_sigma + 0.15)
    anomalous_blocks_pct = float(np.mean(deviation_grid > 2.8)) * 100.0

    raw_score = (
        min(45.0, max(0.0, (p98_dev - 2.3) * 14.0))
        + min(35.0, max(0.0, (anomalous_blocks_pct - 2.0) * 3.0))
        + min(20.0, max(0.0, (sigma_ratio - 2.8) * 4.5))
    )
    score = round(float(np.clip(raw_score + 5.0, 5.0, 98.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Severe wavelet noise floor inconsistency ({p98_dev:.2f}\u03c3 deviation across "
            f"{anomalous_blocks_pct:.1f}% of {bsize}\u00d7{bsize} blocks)."
        )
    elif score >= 34.0:
        status = "suspicious"
        summary = (
            f"Localized noise variance shift detected in {wavelet_family.upper()} HH1 sub-band "
            f"(peak Z = {p98_dev:.2f}\u03c3)."
        )
    else:
        status = "clean"
        summary = (
            f"Homogeneous sensor noise profile (\u03c3_med = {global_median_sigma:.2f}) across "
            f"{wavelet_family.upper()} wavelet detail sub-band."
        )

    findings = [
        f"Global camera sensor noise floor estimated via {wavelet_family.upper()} HH1 MAD: \u03c3 = {global_median_sigma:.3f}.",
        f"Local block noise spans [\u03c3_min = {min_sigma:.3f}, \u03c3_max = {max_sigma:.3f}] (spread ratio = {sigma_ratio:.2f}\u00d7).",
        f"{anomalous_blocks_pct:.1f}% of sliding {bsize}\u00d7{bsize} blocks exceed 2.8\u03c3 noise variance divergence (catches both spliced noise and smoothing/airbrushing).",
    ]

    dip_math = DipMathInfo(
        syllabus_unit="Unit 2 & 4: Adaptive Wiener Filtering & 2D Discrete Wavelet Transform (DWT)",
        algorithm_name=f"2D-DWT ({wavelet_family.upper()}) HH1 Sub-Band MAD Noise Estimator + Wiener Residual",
        latex_formula=r"\hat{\sigma}_b = \frac{\text{median}(|HH_{1,b} - \text{median}(HH_{1,b})|)}{0.6745}, \quad R_W(x,y) = I(x,y) - \left(\mu_L + \frac{\sigma_L^2 - \nu^2}{\sigma_L^2}(I(x,y) - \mu_L)\right)",
        parameters_used={
            "wavelet_basis": wavelet_family,
            "decomposition_subband": "HH1 (Diagonal High-Frequency Detail)",
            "wiener_window": "5x5",
            "sliding_block_size": f"{bsize}x{bsize} (stride {stride})",
        },
        interpretation_guide=(
            "Highlights regions where sensor noise was either destroyed (Gaussian blur, healing brush, AI inpainting) "
            "or introduced from a second image captured at a different ISO/sensor level (splicing)."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="noise_wavelet",
        name="Layer 2: Wavelet (DWT) & Wiener Noise Variance Consistency",
        short_name="Wavelet Noise",
        score=score,
        weight=0.22,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "global_noise_sigma": round(global_median_sigma, 3),
            "p98_z_deviation": round(p98_dev, 2),
            "anomalous_blocks_pct": round(anomalous_blocks_pct, 2),
            "sigma_spread_ratio": round(sigma_ratio, 2),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
