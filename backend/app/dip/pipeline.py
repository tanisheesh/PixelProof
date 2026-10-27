"""
Master Orchestrator for the 7-Layer Digital Image Processing Forensic Pipeline.
"""

import time
import uuid
from typing import Optional

from app.core.schemas import AnalysisParams, ForensicReport
from app.dip.copy_move import run_copy_move_layer
from app.dip.double_jpeg import run_double_jpeg_layer
from app.dip.edge_chromatic import run_edge_chromatic_layer
from app.dip.ela import run_ela_layer
from app.dip.fusion_morphology import fuse_and_localize
from app.dip.metadata_dqt import run_metadata_dqt_layer
from app.dip.noise_wavelet import run_noise_wavelet_layer
from app.dip.preprocessing import decode_image_bytes
from app.dip.resampling_fft import run_resampling_fft_layer
from app.utils.encoding import rgb_to_base64_data_url


def analyze_image_pipeline(
    raw_bytes: bytes,
    filename: str = "uploaded_image.jpg",
    params: Optional[AnalysisParams] = None,
) -> ForensicReport:
    """
    Execute all 7 classical DIP layers + Morphological Localization Fusion on `raw_bytes`.
    Returns a complete `ForensicReport`.
    """
    t0 = time.perf_counter()
    active_params = params or AnalysisParams()

    rgb, orig_w, orig_h = decode_image_bytes(raw_bytes, max_dim=768)

    # Layer 1: Error Level Analysis & Multi-Quality JPEG Ghosting
    l1_res, map_ela = run_ela_layer(
        rgb,
        quality=active_params.ela_quality,
        scale_gain=active_params.ela_scale,
        colormap=active_params.colormap,
    )

    # Layer 2: Wavelet (DWT HH1) & Adaptive Wiener Noise Variance Consistency
    l2_res, map_noise = run_noise_wavelet_layer(
        rgb,
        wavelet_family=active_params.wavelet_family,
        block_size=active_params.noise_block_size,
        colormap=active_params.colormap,
    )

    # Layer 3: Hybrid Copy-Move Clone Detection (Block-DCT + ORB Keypoints)
    l3_res, map_copymove, clone_vectors = run_copy_move_layer(
        rgb,
        similarity_threshold=active_params.copy_move_threshold,
        colormap=active_params.colormap,
    )

    # Layer 4: Resampling & 2D-FFT Spectral Periodicity
    l4_res, map_fft = run_resampling_fft_layer(
        rgb,
        colormap=active_params.colormap,
    )

    # Layer 5: Double JPEG Compression & 8x8 Blocking Grid Alignment
    l5_res, map_djpeg = run_double_jpeg_layer(
        rgb,
        colormap=active_params.colormap,
    )

    # Layer 6: Chromatic Aberration & Scharr Edge Boundary Consistency
    l6_res, map_edge = run_edge_chromatic_layer(
        rgb,
        colormap=active_params.colormap,
    )

    # Layer 7: EXIF, JPEG Quantization Table (DQT) & 8x8 High-Frequency DCT Map
    l7_res, metadata_info = run_metadata_dqt_layer(
        raw_bytes,
        rgb,
        colormap=active_params.colormap,
    )

    layers = [l1_res, l2_res, l3_res, l4_res, l5_res, l6_res, l7_res]
    spatial_maps = {
        "ela": map_ela,
        "noise_wavelet": map_noise,
        "copy_move": map_copymove,
        "resampling_fft": map_fft,
        "double_jpeg": map_djpeg,
        "edge_chromatic": map_edge,
    }

    (
        overall_score,
        verdict,
        confidence,
        exec_summary,
        composite_b64,
        mask_b64,
        annotated_b64,
        bboxes,
    ) = fuse_and_localize(
        rgb=rgb,
        layers=layers,
        spatial_maps=spatial_maps,
        clone_vectors=clone_vectors,
        morph_kernel_size=active_params.morph_kernel_size,
        colormap=active_params.colormap,
    )

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
    orig_b64 = rgb_to_base64_data_url(rgb)

    return ForensicReport(
        report_id=f"PP-{uuid.uuid4().hex[:8].upper()}",
        filename=filename,
        processing_time_ms=elapsed_ms,
        image_width= int(rgb.shape[1]),
        image_height=int(rgb.shape[0]),
        overall_score=overall_score,
        verdict=verdict,
        confidence=confidence,
        executive_summary=exec_summary,
        original_preview_base64=orig_b64,
        composite_heatmap_base64=composite_b64,
        localization_mask_base64=mask_b64,
        annotated_overlay_base64=annotated_b64,
        bounding_boxes=bboxes,
        clone_vectors=clone_vectors,
        layers=layers,
        metadata=metadata_info,
        parameters=active_params,
    )
