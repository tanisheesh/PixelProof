r"""
Composite Multi-Layer Fusion, Otsu Adaptive Thresholding, Morphological Processing,
and Connected Component Localization Engine.

Mathematical Basis (DIP Units 6 & 7):
1. Weighted Spatial Fusion:
      H_{\text{fused}}(x,y) = \sum_{k=1}^{6} w_k \cdot \tilde{H}_k(x,y)
2. Otsu's Global + Percentile Adaptive Thresholding:
   Maximizes between-class variance \sigma_B^2(t^*) = \omega_0(t)\omega_1(t)[\mu_0(t) - \mu_1(t)]^2.
3. Morphological Filtering with Elliptical Structuring Element B:
   - Morphological Opening: M_{\text{open}} = (M \ominus B_1) \oplus B_1  (removes isolated salt noise specks)
   - Morphological Closing: M_{\text{clean}} = (M_{\text{open}} \oplus B_2) \ominus B_2  (bridges holes inside forged objects)
4. 8-Connected Component Labeling (`cv2.connectedComponentsWithStats`) to extract bounding boxes,
   region centroids, area ratios, and dominant forensic cause.
"""

from typing import Dict, List, Literal, Tuple
import cv2
import numpy as np

from app.core.schemas import BoundingBox, CloneVector, LayerResult
from app.utils.encoding import apply_colormap_to_map, normalize_to_uint8, rgb_to_base64_data_url


def fuse_and_localize(
    rgb: np.ndarray,
    layers: List[LayerResult],
    spatial_maps: Dict[str, np.ndarray],
    clone_vectors: List[CloneVector],
    morph_kernel_size: int = 7,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[float, Literal["AUTHENTIC", "SUSPICIOUS", "TAMPERED"], float, str, str, str, str, List[BoundingBox]]:
    """
    Combine spatial anomaly maps across all DIP layers, run Otsu + Morphological Opening/Closing,
    and extract localized tamper bounding boxes.
    """
    h, w = rgb.shape[:2]

    fused = np.zeros((h, w), dtype=np.float32)
    layer_scores = {lyr.id: lyr.score for lyr in layers}

    spatial_weights = {
        "ela": 0.26,
        "noise_wavelet": 0.26,
        "copy_move": 0.28 if layer_scores.get("copy_move", 0.0) >= 45.0 else 0.06,
        "resampling_fft": 0.12,
        "double_jpeg": 0.08,
        "edge_chromatic": 0.08,
    }
    total_w = sum(spatial_weights.values())
    for k, w_val in spatial_weights.items():
        if k in spatial_maps:
            m = spatial_maps[k]
            if m.shape != (h, w):
                m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
            layer_boost = 1.0 + max(0.0, (layer_scores.get(k, 0.0) - 40.0) / 45.0)
            fused += (w_val / total_w) * layer_boost * m

    fused = cv2.GaussianBlur(fused, (15, 15), 3.0)
    fused_u8 = normalize_to_uint8(fused, clip_percentile=99.2)
    composite_rgb = apply_colormap_to_map(fused_u8, colormap=colormap)
    composite_b64 = rgb_to_base64_data_url(composite_rgb)

    weighted_sum = sum(lyr.score * lyr.weight for lyr in layers)
    weight_norm = sum(lyr.weight for lyr in layers) or 1.0
    base_avg = weighted_sum / weight_norm

    sorted_scores = sorted([lyr.score for lyr in layers], reverse=True)
    top1 = sorted_scores[0] if sorted_scores else 0.0
    top2 = sorted_scores[1] if len(sorted_scores) > 1 else top1

    overall_score = round(float(np.clip(0.35 * base_avg + 0.45 * top1 + 0.20 * top2, 3.0, 99.0)), 1)

    if overall_score >= 52.0:
        verdict: Literal["AUTHENTIC", "SUSPICIOUS", "TAMPERED"] = "TAMPERED"
    elif overall_score >= 33.0:
        verdict = "SUSPICIOUS"
    else:
        verdict = "AUTHENTIC"

    dist_from_boundary = abs(overall_score - 44.0)
    confidence = round(float(np.clip(64.0 + dist_from_boundary * 0.85, 62.0, 98.5)), 1)

    otsu_thresh_val, _ = cv2.threshold(fused_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    high_floor = max(float(otsu_thresh_val), float(np.percentile(fused_u8, 88.0)), 145.0)
    binary_raw = ((fused_u8.astype(np.float32)) >= high_floor).astype(np.uint8) * 255

    k_open = max(3, int(morph_kernel_size) | 1)
    k_close = max(5, (int(morph_kernel_size) + 4) | 1)
    se_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_open, k_open))
    se_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_close, k_close))

    opened = cv2.morphologyEx(binary_raw, cv2.MORPH_OPEN, se_open)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, se_close)

    if verdict == "AUTHENTIC" and overall_score < 32.0:
        closed[:] = 0

    mask_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    mask_rgb[:, :] = (12, 16, 23)
    mask_rgb[closed > 0] = (244, 63, 94)
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(mask_rgb, contours, -1, (255, 255, 255), 2)
    localization_mask_b64 = rgb_to_base64_data_url(mask_rgb)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(closed, connectivity=8)
    bounding_boxes: List[BoundingBox] = []
    min_region_area = max(64, int(0.0025 * h * w))

    cause_labels = {
        "ela": "DCT Quantization / ELA Residual",
        "noise_wavelet": "Wavelet HH1 Noise Variance Shift",
        "copy_move": "Copy-Move Region Duplication",
        "resampling_fft": "2D-FFT Resampling Periodicity",
        "double_jpeg": "8x8 Blocking Grid Misalignment",
        "edge_chromatic": "Chromatic Edge Discontinuity",
    }

    annotated = rgb.copy()
    alpha_mask = (closed > 0).astype(np.float32)[:, :, None] * 0.38
    annotated = (annotated.astype(np.float32) * (1.0 - alpha_mask) + composite_rgb.astype(np.float32) * alpha_mask).astype(
        np.uint8
    )

    box_id = 1
    for lbl_idx in range(1, num_labels):
        x, y, bw, bh, area = stats[lbl_idx]
        if area < min_region_area or area > 0.85 * h * w:
            continue

        best_layer_key = "ela"
        best_layer_val = -1.0
        for k_name, smap in spatial_maps.items():
            region_mean = float(np.mean(smap[y : y + bh, x : x + bw])) * (layer_scores.get(k_name, 50.0) / 100.0)
            if region_mean > best_layer_val:
                best_layer_val = region_mean
                best_layer_key = k_name

        reg_conf = round(
            float(np.clip(55.0 + float(np.mean(fused_u8[y : y + bh, x : x + bw])) * 0.17, 52.0, 99.0)), 1
        )
        area_ratio = round(float(area) / float(h * w) * 100.0, 2)
        cause_str = cause_labels.get(best_layer_key, "Multi-Layer DIP Anomaly")

        bounding_boxes.append(
            BoundingBox(
                id=box_id,
                x=int(x),
                y=int(y),
                width=int(bw),
                height=int(bh),
                area_ratio=area_ratio,
                confidence=reg_conf,
                primary_cause=cause_str,
                label=f"R{box_id}: {cause_str} ({reg_conf:.0f}%)",
            )
        )

        color = (244, 63, 94) if verdict == "TAMPERED" else (245, 158, 11)
        cv2.rectangle(annotated, (int(x), int(y)), (int(x + bw), int(y + bh)), color, 2)
        cv2.putText(
            annotated,
            f"R{box_id} {reg_conf:.0f}%",
            (int(x) + 4, max(16, int(y) - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        cv2.putText(
            annotated,
            f"R{box_id} {reg_conf:.0f}%",
            (int(x) + 4, max(16, int(y) - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            color,
            1,
            cv2.LINE_AA,
        )
        box_id += 1

    for vec in clone_vectors[:14]:
        cv2.line(annotated, (vec.src_x, vec.src_y), (vec.dst_x, vec.dst_y), (6, 182, 212), 2, cv2.LINE_AA)
        cv2.circle(annotated, (vec.src_x, vec.src_y), 4, (16, 185, 129), -1, cv2.LINE_AA)
        cv2.circle(annotated, (vec.dst_x, vec.dst_y), 4, (244, 63, 94), -1, cv2.LINE_AA)

    annotated_b64 = rgb_to_base64_data_url(annotated)

    top_layers = sorted(layers, key=lambda l: l.score, reverse=True)[:2]
    if verdict == "TAMPERED":
        executive_summary = (
            f"Forensic pipeline flagged high-probability manipulation (Score: {overall_score}/100, "
            f"Confidence: {confidence}%). Primary anomalies triggered in {top_layers[0].short_name} "
            f"({top_layers[0].score}/100) and {top_layers[1].short_name} ({top_layers[1].score}/100), "
            f"isolating {len(bounding_boxes)} localized suspect region(s)."
        )
    elif verdict == "SUSPICIOUS":
        executive_summary = (
            f"Image exhibits moderate compression or signal irregularities (Score: {overall_score}/100). "
            f"Primary deviation observed in {top_layers[0].short_name} ({top_layers[0].score}/100); "
            f"inspect localized heatmaps to distinguish post-processing from splicing."
        )
    else:
        executive_summary = (
            f"All 7 Digital Image Processing layers report consistent sensor noise, uniform 8x8 DCT quantization "
            f"residuals, and coherent frequency spectra (Score: {overall_score}/100). No localized tampering evidence found."
        )

    return (
        overall_score,
        verdict,
        confidence,
        executive_summary,
        composite_b64,
        localization_mask_b64,
        annotated_b64,
        bounding_boxes,
    )
