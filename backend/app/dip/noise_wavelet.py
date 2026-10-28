r"""
Layer 2: Wavelet Domain Noise Variance, Adaptive Wiener Residual & LBP / GLCM Texture Consistency.

Mathematical Basis:
1. Wavelet HH_1 & Donoho's MAD Noise Estimator:
   Using a 2D Discrete Wavelet Transform (DWT with Daubechies `db4`, `db2`, or `haar` basis), the diagonal
   detail sub-band HH_1 isolates high-frequency sensor fluctuations:
       \hat{\sigma}_b = \frac{\text{median}(|HH_{1,b} - \text{median}(HH_{1,b})|)}{0.6745}
2. Spatial Adaptive Wiener Filter (Lee/Lim Restoration Filter):
   Extracts denoising residual R_W(x,y) = |I(x,y) - \text{Wiener}_{5\times5}(I(x,y))|.
3. Local Binary Patterns (LBP) & Grey Level Co-occurrence Matrix (GLCM) Texture Descriptors:
   - 8-neighbor circular Local Binary Pattern:
         \text{LBP}_{P=8,R=1}(x,y) = \sum_{p=0}^{7} s(g_p - g_c) 2^p
   - 16-level quantized Grey Level Co-occurrence Matrix P(i,j | \Delta x=1, \Delta y=0) computing
     Haralick Contrast \sum_{i,j} (i-j)^2 P(i,j) and Homogeneity \sum_{i,j} \frac{P(i,j)}{1 + |i-j|}.
   Spliced patches or Gaussian-retouched/inpainted regions exhibit sharp local deviations in both
   wavelet noise floor and LBP/GLCM micro-texture entropy.
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


def _compute_lbp_map(lum: np.ndarray) -> np.ndarray:
    r"""
    Vectorized 8-neighbor Local Binary Pattern (LBP_{8,1}) operator:
      LBP(x,y) = \sum_{p=0}^{7} s(I_p - I_c) 2^p
    Returns float32 array in [0, 255].
    """
    h, w = lum.shape
    lbp = np.zeros((h, w), dtype=np.uint8)
    center = lum[1:-1, 1:-1]
    offsets = [
        (-1, -1, 1),
        (-1, 0, 2),
        (-1, 1, 4),
        (0, 1, 8),
        (1, 1, 16),
        (1, 0, 32),
        (1, -1, 64),
        (0, -1, 128),
    ]
    core = np.zeros((h - 2, w - 2), dtype=np.uint8)
    for dy, dx, weight in offsets:
        neighbor = lum[1 + dy : h - 1 + dy, 1 + dx : w - 1 + dx]
        core |= ((neighbor >= center).astype(np.uint8)) * weight
    lbp[1:-1, 1:-1] = core
    return lbp.astype(np.float32)


def _compute_glcm_features(lum: np.ndarray, levels: int = 16) -> Tuple[float, float]:
    r"""
    Compute Grey Level Co-occurrence Matrix (GLCM) Haralick Contrast and Homogeneity
    at displacement (\Delta x = 1, \Delta y = 0) across quantized gray levels [0..levels-1].
    """
    q = np.clip((lum / 256.0 * levels).astype(np.int32), 0, levels - 1)
    left = q[:, :-1].ravel()
    right = q[:, 1:].ravel()
    idx = left * levels + right
    counts = np.bincount(idx, minlength=levels * levels).astype(np.float64)
    glcm = counts.reshape((levels, levels))
    total = float(np.sum(glcm)) or 1.0
    P = glcm / total

    ii, jj = np.mgrid[0:levels, 0:levels]
    contrast = float(np.sum(((ii - jj) ** 2) * P))
    homogeneity = float(np.sum(P / (1.0 + np.abs(ii - jj))))
    return contrast, homogeneity


def run_noise_wavelet_layer(
    rgb: np.ndarray,
    wavelet_family: Literal["haar", "db2", "db4"] = "db4",
    block_size: int = 32,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Execute 2D-DWT HH1 sub-band MAD noise estimation + Adaptive Wiener residual + LBP/GLCM texture analysis.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    lum = rgb_to_luminance_float(rgb)
    h, w = lum.shape

    # 1. 2D Discrete Wavelet Transform (1st-level decomposition: LL, (LH, HL, HH))
    coeffs2 = pywt.dwt2(lum, wavelet_family)
    _, (_, _, hh1) = coeffs2
    hh1_full = cv2.resize(np.abs(hh1).astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)

    # 2. Spatial Adaptive Wiener Filter Residual (5x5 local neighborhood)
    wiener_res = _adaptive_wiener_residual(lum, ksize=5)

    # 3. Local Binary Patterns (LBP) & Grey Level Co-occurrence Matrix (GLCM) Texture Descriptors
    lbp_map = _compute_lbp_map(lum)
    glcm_contrast, glcm_homogeneity = _compute_glcm_features(lum, levels=16)

    # 4. Edge Masking: prevent strong structural object edges from skewing noise estimation
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
    grad_mag = np.sqrt(gx * gx + gy * gy)
    edge_threshold = float(np.percentile(grad_mag, 85.0)) + 1e-3

    combined_noise_signal = 0.65 * hh1_full + 0.35 * wiener_res

    # 5. Sliding block MAD noise level + LBP micro-texture entropy estimation
    bsize = max(16, int(block_size))
    stride = max(8, bsize // 2)
    grid_h = max(1, (h - bsize) // stride + 1)
    grid_w = max(1, (w - bsize) // stride + 1)

    sigma_grid = np.zeros((grid_h, grid_w), dtype=np.float32)
    lbp_var_grid = np.zeros((grid_h, grid_w), dtype=np.float32)
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
            patch_lbp = lbp_map[y0:y1, x0:x1]

            non_edge = (patch_grad < edge_threshold) & (patch_lum > 8.0) & (patch_lum < 247.0)
            if np.count_nonzero(non_edge) >= (bsize * bsize) // 6:
                samples = patch_noise[non_edge]
                lbp_samples = patch_lbp[non_edge]
                valid_mask[gy_idx, gx_idx] = True
            else:
                samples = patch_noise.ravel()
                lbp_samples = patch_lbp.ravel()

            med_val = np.median(samples)
            sigma_hat = float(np.median(np.abs(samples - med_val))) / 0.6745
            sigma_grid[gy_idx, gx_idx] = sigma_hat
            lbp_var_grid[gy_idx, gx_idx] = float(np.std(lbp_samples))

    valid_sigmas = sigma_grid[valid_mask] if np.any(valid_mask) else sigma_grid.ravel()
    global_median_sigma = float(np.median(valid_sigmas))
    global_mad_sigma = float(np.median(np.abs(valid_sigmas - global_median_sigma))) + 1e-4

    deviation_grid = np.abs(sigma_grid - global_median_sigma) / (
        1.4826 * global_mad_sigma + 0.12 * global_median_sigma
    )

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
    mean_lbp_std = float(np.mean(lbp_var_grid))

    raw_score = (
        min(45.0, max(0.0, (p98_dev - 2.3) * 14.0))
        + min(35.0, max(0.0, (anomalous_blocks_pct - 2.0) * 3.0))
        + min(20.0, max(0.0, (sigma_ratio - 2.8) * 4.5))
    )
    score = round(float(np.clip(raw_score + 5.0, 5.0, 98.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Severe wavelet noise & LBP/GLCM texture inconsistency ({p98_dev:.2f}\u03c3 deviation across "
            f"{anomalous_blocks_pct:.1f}% of {bsize}\u00d7{bsize} blocks)."
        )
    elif score >= 34.0:
        status = "suspicious"
        summary = (
            f"Localized noise/texture variance shift detected in {wavelet_family.upper()} HH1 & LBP sub-bands "
            f"(peak Z = {p98_dev:.2f}\u03c3)."
        )
    else:
        status = "clean"
        summary = (
            f"Homogeneous sensor noise (\u03c3_med = {global_median_sigma:.2f}) and GLCM homogeneity "
            f"({glcm_homogeneity:.3f}) across {wavelet_family.upper()} wavelet sub-band."
        )

    findings = [
        f"Global sensor noise floor via {wavelet_family.upper()} HH1 MAD: \u03c3 = {global_median_sigma:.3f} (spread ratio = {sigma_ratio:.2f}\u00d7).",
        f"Texture Descriptors — LBP (8,1) block dispersion = {mean_lbp_std:.2f}; GLCM Contrast = {glcm_contrast:.3f}, GLCM Homogeneity = {glcm_homogeneity:.3f}.",
        f"{anomalous_blocks_pct:.1f}% of sliding {bsize}\u00d7{bsize} blocks exceed 2.8\u03c3 noise/texture variance divergence.",
    ]

    dip_math = DipMathInfo(
        signal_domain="2D-DWT Wavelets, Adaptive Wiener Filter & LBP / GLCM Texture Descriptors",
        algorithm_name=f"2D-DWT ({wavelet_family.upper()}) HH1 MAD + Wiener Residual + LBP & GLCM Texture Analysis",
        latex_formula=r"\hat{\sigma}_b = \frac{\text{median}(|HH_{1,b}|)}{0.6745}, \quad \text{LBP}_{8,1} = \sum_{p=0}^{7} s(g_p - g_c)2^p, \quad C_{\text{GLCM}} = \sum_{i,j}(i-j)^2 P(i,j)",
        parameters_used={
            "wavelet_basis": wavelet_family,
            "wiener_window": "5x5 Adaptive Restoration",
            "texture_descriptors": "LBP(8,1) + 16-level GLCM (Contrast & Homogeneity)",
            "sliding_block_size": f"{bsize}x{bsize} (stride {stride})",
        },
        interpretation_guide=(
            "Combines 2D-DWT HH1 noise estimation and Adaptive Wiener filtering with Local Binary Patterns (LBP) "
            "and Grey Level Co-occurrence Matrix (GLCM) descriptors to catch smoothing, airbrushing, and spliced textures."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="noise_wavelet",
        name="Layer 2: Wavelet (DWT), Wiener & LBP/GLCM Texture Consistency",
        short_name="Wavelet & LBP/GLCM",
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
            "glcm_contrast": round(glcm_contrast, 3),
            "glcm_homogeneity": round(glcm_homogeneity, 3),
            "lbp_dispersion": round(mean_lbp_std, 2),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
