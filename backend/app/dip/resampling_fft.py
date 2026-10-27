r"""
Layer 4: Resampling & Interpolation Periodic Artifact Detection (2nd-Order Laplacian + 2D-FFT Spectrum).

Mathematical Basis (Popescu & Farid):
- When a spliced object is scaled, rotated, or skewed before pasting, bilinear or bicubic interpolation
  introduces periodic linear correlations between neighboring pixels.
- Applying an isotropic 2nd-order Laplacian high-pass operator:
      \nabla^2 I(x,y) = I(x+1,y) + I(x-1,y) + I(x,y+1) + I(x,y-1) - 4I(x,y)
  suppresses scene content and exposes the underlying interpolation residual.
- In the frequency domain via the 2D Fast Fourier Transform (2D-FFT):
      \mathcal{F}(u,v) = \sum_{x}\sum_{y} |\nabla^2 I(x,y)| \cdot w(x,y) e^{-j2\pi(ux/M + vy/N)}
  resampled regions produce distinct secondary high-frequency spectral peaks and localized high-pass energy drops.
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


def run_resampling_fft_layer(
    rgb: np.ndarray,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray]:
    """
    Execute 2nd-Order Laplacian residual filtering + 2D-FFT spectral periodicity analysis.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1).
    """
    lum = rgb_to_luminance_float(rgb)
    h, w = lum.shape

    laplacian_kernel = np.array(
        [
            [0.0, -1.0, 0.0],
            [-1.0, 4.0, -1.0],
            [0.0, -1.0, 0.0],
        ],
        dtype=np.float32,
    )
    lap_residual = cv2.filter2D(lum, cv2.CV_32F, laplacian_kernel)
    abs_lap = np.abs(lap_residual)

    win_y = np.hanning(h).astype(np.float32)
    win_x = np.hanning(w).astype(np.float32)
    window_2d = np.outer(win_y, win_x)

    fft_complex = np.fft.fftshift(np.fft.fft2(abs_lap * window_2d))
    fft_mag = np.abs(fft_complex)
    log_spectrum = np.log1p(fft_mag)

    cy, cx = h // 2, w // 2
    yy, xx = np.ogrid[:h, :w]
    norm_radius = np.sqrt(((yy - cy) / float(max(1, cy))) ** 2 + ((xx - cx) / float(max(1, cx))) ** 2)
    # Exclude axial u=0 and v=0 lines (where natural 8x8 JPEG block harmonics live) to isolate resampling peaks
    off_axis = (np.abs(yy - cy) > 6) & (np.abs(xx - cx) > 6)
    hf_ring_mask = (norm_radius >= 0.30) & (norm_radius <= 0.85) & off_axis

    ring_vals = log_spectrum[hf_ring_mask]
    ring_med = float(np.median(ring_vals)) if ring_vals.size > 0 else 1.0
    ring_std = float(np.std(ring_vals)) + 1e-4
    spectral_peak_z = float((np.max(ring_vals) - ring_med) / ring_std) if ring_vals.size > 0 else 0.0

    # Sliding 32x32 local 2D-FFT spectral peak ratio
    bsize = 32
    stride = 16
    gh = max(1, (h - bsize) // stride + 1)
    gw = max(1, (w - bsize) // stride + 1)
    resamp_grid = np.zeros((gh, gw), dtype=np.float32)

    win_patch = np.outer(np.hanning(bsize), np.hanning(bsize)).astype(np.float32)
    for gy_i in range(gh):
        y0 = gy_i * stride
        for gx_i in range(gw):
            x0 = gx_i * stride
            patch = abs_lap[y0 : y0 + bsize, x0 : x0 + bsize]
            p_fft = np.abs(np.fft.fftshift(np.fft.fft2((patch - np.mean(patch)) * win_patch)))
            # Zero out DC center
            p_fft[bsize // 2 - 3 : bsize // 2 + 4, bsize // 2 - 3 : bsize // 2 + 4] = 0.0
            p_max = float(np.max(p_fft))
            p_mean = float(np.mean(p_fft)) + 1.0
            resamp_grid[gy_i, gx_i] = p_max / p_mean

    med_grid = float(np.median(resamp_grid))
    mad_grid = float(np.median(np.abs(resamp_grid - med_grid))) + 0.12 * med_grid + 1e-4
    z_grid = np.abs(resamp_grid - med_grid) / (1.4826 * mad_grid)

    spatial_resamp = cv2.resize(z_grid, (w, h), interpolation=cv2.INTER_CUBIC)
    spatial_resamp = cv2.GaussianBlur(spatial_resamp, (15, 15), 3.0)

    norm_u8 = normalize_to_uint8(spatial_resamp, clip_percentile=99.0)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)

    inset_size = min(140, h // 3, w // 3)
    if inset_size >= 48:
        spec_u8 = normalize_to_uint8(log_spectrum, clip_percentile=99.8)
        spec_rgb = apply_colormap_to_map(spec_u8, colormap="viridis")
        spec_resized = cv2.resize(spec_rgb, (inset_size, inset_size), interpolation=cv2.INTER_AREA)
        pad = 8
        y_start = h - inset_size - pad
        x_start = w - inset_size - pad
        cv2.rectangle(
            heatmap_rgb,
            (x_start - 2, y_start - 2),
            (x_start + inset_size + 1, y_start + inset_size + 1),
            (6, 182, 212),
            2,
        )
        heatmap_rgb[y_start : y_start + inset_size, x_start : x_start + inset_size] = spec_resized

    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    p98_z = float(np.percentile(z_grid, 98.0))
    anom_pct = float(np.mean(z_grid > 3.2)) * 100.0
    raw_score = (
        min(45.0, max(0.0, (p98_z - 2.6) * 14.0))
        + min(30.0, max(0.0, (spectral_peak_z - 4.3) * 16.0))
        + min(25.0, max(0.0, (anom_pct - 2.5) * 3.0))
    )
    score = round(float(np.clip(raw_score + 5.0, 5.0, 96.0)), 1)

    if score >= 58.0:
        status = "tampered"
        summary = (
            f"Periodic resampling harmonics detected in 2D-FFT spectrum (peak Z = {spectral_peak_z:.2f}\u03c3, "
            f"local block Z = {p98_z:.2f}\u03c3)."
        )
    elif score >= 32.0:
        status = "suspicious"
        summary = (
            f"Mild high-frequency interpolation periodicity across {anom_pct:.1f}% of blocks "
            f"(2D-FFT peak Z = {spectral_peak_z:.2f}\u03c3)."
        )
    else:
        status = "clean"
        summary = (
            f"Isotropic 2D-FFT power spectrum with no abnormal resampling or affine-warping harmonics "
            f"(peak Z = {spectral_peak_z:.2f}\u03c3)."
        )

    findings = [
        f"2nd-order Laplacian high-pass filter isolated mean derivative energy of {float(np.mean(abs_lap)):.2f}.",
        f"Global 2D-FFT high-frequency annular ring peak-to-median Z-score = {spectral_peak_z:.2f}\u03c3 (inset shown at bottom-right).",
        f"{anom_pct:.1f}% of 32\u00d732 blocks exhibit localized spectral periodicity > 3.2\u03c3.",
    ]

    dip_math = DipMathInfo(
        syllabus_unit="Unit 2 & 3: 2nd-Order Laplacian Derivative & 2D Fast Fourier Transform (2D-FFT)",
        algorithm_name="Laplacian Residual Periodic Correlation & 2D-DFT Log-Magnitude Spectrum Analysis",
        latex_formula=r"\nabla^2 f(x,y) = f(x+1,y)+f(x-1,y)+f(x,y+1)+f(x,y-1)-4f(x,y), \quad M(u,v) = \log\left(1 + \left|\mathcal{F}\{\nabla^2 f \cdot w\}\right|\right)",
        kernel_or_matrix=[
            [0.0, -1.0, 0.0],
            [-1.0, 4.0, -1.0],
            [0.0, -1.0, 0.0],
        ],
        parameters_used={
            "high_pass_operator": "3x3 Isotropic Laplacian Kernel",
            "spectral_window": "2D Separable Hanning Window",
            "annular_frequency_band": "0.30 <= r/r_max <= 0.85",
        },
        interpretation_guide=(
            "Scaling or rotating a spliced object uses bilinear/bicubic interpolation, which creates periodic pixel "
            "correlations visible as bright secondary peaks in the 2D-FFT spectrum (bottom-right inset) and block map."
        ),
    )

    spatial_01 = (norm_u8.astype(np.float32)) / 255.0
    result = LayerResult(
        id="resampling_fft",
        name="Layer 4: Resampling & 2D-FFT Spectral Periodicity",
        short_name="2D-FFT Spectrum",
        score=score,
        weight=0.14,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "fft_spectral_peak_z": round(spectral_peak_z, 2),
            "block_p98_z": round(p98_z, 2),
            "anomalous_blocks_pct": round(anom_pct, 2),
        },
        dip_math=dip_math,
    )
    return result, spatial_01
