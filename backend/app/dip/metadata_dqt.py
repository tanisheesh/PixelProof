r"""
Layer 7: EXIF Metadata, JPEG Quantization Table (DQT) Fingerprinting & Structure Forensics.

Mathematical Basis:
1. Standard IJG (Independent JPEG Group) encoders scale a base 8x8 luminance quantization matrix Q_base
   by a quality factor Q \in [1, 100]:
       S = 5000 / Q (if Q < 50) else 200 - 2Q
       Q_IJG(u,v) = clip(floor((S * Q_base(u,v) + 50) / 100), 1, 255)
2. Editing software (Adobe Photoshop "Save for Web", GIMP, Canva, social media re-encoders) either write
   explicit EXIF `Software` tags, strip camera MakerNotes, or use custom non-IJG quantization tables.
"""

import io
from typing import Dict, List, Literal, Optional, Tuple
import cv2
import numpy as np
from PIL import ExifTags, Image

from app.core.schemas import DipMathInfo, LayerResult, MetadataForensics
from app.utils.encoding import (
    apply_colormap_to_map,
    compute_compact_histogram,
    normalize_to_uint8,
    rgb_to_base64_data_url,
)

STD_LUMINANCE_DQT = np.array(
    [
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99],
    ],
    dtype=np.float32,
)

EDITING_SOFTWARE_KEYWORDS = (
    "photoshop",
    "gimp",
    "lightroom",
    "affinity",
    "canva",
    "paint",
    "pixelmator",
    "snapseed",
    "picsart",
    "stable diffusion",
    "midjourney",
    "dall-e",
    "comfyui",
    "automatic1111",
)


def _estimate_ijg_quality(luma_table_64: List[int]) -> Tuple[int, float]:
    """Find the closest IJG quality factor Q in [1, 100] and mean absolute deviation from standard IJG."""
    q_arr = np.array(luma_table_64, dtype=np.float32).reshape((8, 8))
    best_q = 90
    best_err = 1e9
    for q in range(30, 101):
        scale = (5000.0 / q) if q < 50 else (200.0 - 2.0 * q)
        cand = np.clip(np.floor((scale * STD_LUMINANCE_DQT + 50.0) / 100.0), 1.0, 255.0)
        err = float(np.mean(np.abs(q_arr - cand)))
        if err < best_err:
            best_err = err
            best_q = q
    return best_q, best_err


def run_metadata_dqt_layer(
    raw_bytes: bytes,
    rgb: np.ndarray,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, MetadataForensics]:
    """
    Inspect EXIF tags, JPEG Quantization Tables (DQT), and 8x8 DCT energy distribution.
    Returns (LayerResult, MetadataForensics).
    """
    pil_img = Image.open(io.BytesIO(raw_bytes))
    img_format = pil_img.format or "UNKNOWN"
    orig_w, orig_h = pil_img.size
    color_mode = pil_img.mode

    exif_tags_dict: Dict[str, str] = {}
    anomalies: List[str] = []
    software_sig: Optional[str] = None
    camera_make_model: Optional[str] = None

    raw_exif = pil_img.getexif()
    exif_present = bool(raw_exif and len(raw_exif) > 0)

    if exif_present:
        make_str = ""
        model_str = ""
        for tag_id, val in raw_exif.items():
            tag_name = str(ExifTags.TAGS.get(tag_id, tag_id))
            val_str = str(val).strip()
            if len(val_str) > 120:
                val_str = val_str[:117] + "..."
            exif_tags_dict[tag_name] = val_str

            if tag_name.lower() == "software":
                software_sig = val_str
            elif tag_name.lower() == "make":
                make_str = val_str
            elif tag_name.lower() == "model":
                model_str = val_str

        if make_str or model_str:
            camera_make_model = f"{make_str} {model_str}".strip()

    if software_sig:
        low_sw = software_sig.lower()
        if any(k in low_sw for k in EDITING_SOFTWARE_KEYWORDS):
            anomalies.append(f"EXIF Software tag explicitly identifies image editor: '{software_sig}'.")

    if not exif_present:
        anomalies.append("EXIF camera metadata is completely stripped (common after editing or re-exporting).")

    quant_tables = getattr(pil_img, "quantization", None)
    luma_dqt_2d: Optional[List[List[int]]] = None
    est_quality = 90
    dqt_source = "Uncompressed / Non-JPEG Container"

    if quant_tables and 0 in quant_tables:
        t0 = list(quant_tables[0])
        if len(t0) == 64:
            est_quality, ijg_err = _estimate_ijg_quality(t0)
            luma_dqt_2d = np.array(t0, dtype=int).reshape((8, 8)).tolist()
            if ijg_err < 0.5:
                dqt_source = f"Standard IJG Library Table (Estimated Q = {est_quality})"
            else:
                dqt_source = f"Custom / Non-Standard Quantization Matrix (Closest Q \u2248 {est_quality}, \u0394={ijg_err:.2f})"
                anomalies.append(
                    f"Non-standard JPEG Quantization Table (DQT) deviates from camera/IJG baseline (\u0394={ijg_err:.2f})."
                )
    else:
        luma_dqt_2d = STD_LUMINANCE_DQT.astype(int).tolist()

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    h, w = gray.shape
    h8, w8 = max(8, (h // 8) * 8), max(8, (w // 8) * 8)
    hf_energy_grid = np.zeros((h8 // 8, w8 // 8), dtype=np.float32)

    for by in range(h8 // 8):
        for bx in range(w8 // 8):
            blk = gray[by * 8 : (by + 1) * 8, bx * 8 : (bx + 1) * 8] - 128.0
            dct_b = cv2.dct(blk)
            hf_energy_grid[by, bx] = float(np.mean(np.abs(dct_b[3:, 3:])))

    hf_map = cv2.resize(hf_energy_grid, (w, h), interpolation=cv2.INTER_NEAREST)
    norm_u8 = normalize_to_uint8(hf_map, clip_percentile=99.0)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)
    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    meta_score = 10.0
    if software_sig and any(k in software_sig.lower() for k in EDITING_SOFTWARE_KEYWORDS):
        meta_score += 62.0
    if not exif_present:
        meta_score += 18.0
    if "Non-Standard" in dqt_source:
        meta_score += 22.0
    if est_quality < 78:
        meta_score += 12.0
        anomalies.append(f"Heavy JPEG quantization detected (Estimated Quality Q = {est_quality} < 78).")

    score = round(float(np.clip(meta_score, 5.0, 95.0)), 1)
    if score >= 60.0:
        status = "tampered"
        summary = anomalies[0] if anomalies else "Metadata and DQT tables indicate post-processing software."
    elif score >= 26.0:
        status = "suspicious"
        summary = anomalies[0] if anomalies else "Missing camera EXIF tags or re-compressed DQT profile."
    else:
        status = "clean"
        summary = "Intact container structure with standard quantization matrix and no editing software signature."

    if not anomalies:
        anomalies.append("No editing software signatures found in EXIF/DQT headers.")

    dip_math = DipMathInfo(
        syllabus_unit="Unit 5: Image Compression Standards (JPEG DQT Quantization Matrices & Container Forensics)",
        algorithm_name="JPEG Annex-K Quantization Matrix Fingerprinting & 8x8 High-Frequency DCT Map",
        latex_formula=r"Q_{\text{IJG}}(u,v) = \text{clip}\left(\left\lfloor \frac{S(Q)\cdot Q_{\text{base}}(u,v) + 50}{100} \right\rfloor, 1, 255\right), \quad F^Q(u,v) = \text{round}\left(\frac{F(u,v)}{Q(u,v)}\right)",
        kernel_or_matrix=[[float(v) for v in row] for row in (luma_dqt_2d or STD_LUMINANCE_DQT.tolist())[:4]],
        parameters_used={
            "container_format": img_format,
            "estimated_jpeg_quality": est_quality,
            "dqt_classification": dqt_source,
            "exif_tag_count": len(exif_tags_dict),
        },
        interpretation_guide=(
            "Every JPEG stores two 8x8 Quantization Tables (Luminance & Chrominance) in its DQT header. "
            "Comparing these 64 divisors against standard camera and Photoshop tables reveals re-compression history."
        ),
    )

    metadata_model = MetadataForensics(
        format=img_format,
        dimensions=f"{orig_w} \u00d7 {orig_h} px",
        file_size_bytes=len(raw_bytes),
        color_mode=color_mode,
        exif_present=exif_present,
        software_signature=software_sig,
        camera_make_model=camera_make_model,
        quantization_table_source=dqt_source,
        estimated_original_quality=est_quality,
        thumbnail_present=False,
        thumbnail_ssim=None,
        anomalies=anomalies,
        exif_tags=exif_tags_dict,
        luminance_dqt=luma_dqt_2d,
    )

    layer_result = LayerResult(
        id="metadata_dqt",
        name="Layer 7: EXIF, Quantization Table (DQT) & 8x8 DCT Energy",
        short_name="EXIF & DQT",
        score=score,
        weight=0.08,
        status=status,
        summary=summary,
        finding_details=anomalies
        + [
            f"Container format: {img_format} ({orig_w}\u00d7{orig_h}, {len(raw_bytes):,} bytes).",
            f"DQT Profile: {dqt_source}.",
        ],
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "estimated_quality_q": est_quality,
            "exif_tags_found": len(exif_tags_dict),
            "anomaly_count": len(anomalies),
        },
        dip_math=dip_math,
    )

    return layer_result, metadata_model
