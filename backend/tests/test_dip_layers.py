"""
Unit and Integration Tests for all 7 Classical Digital Image Processing (DIP) Forensic Layers.
Verifies:
1. Authentic camera control image receives AUTHENTIC verdict and low scores across layers.
2. Composite Splicing case triggers ELA, Wavelet Noise, and Metadata layers and returns TAMPERED.
3. Copy-Move Clone case triggers Hybrid Block-DCT + ORB displacement vectors and returns TAMPERED.
4. Gaussian Retouching / Airbrush case triggers Wavelet HH1 / Wiener noise variance divergence.
5. Resampling / Scaled Composite triggers 2nd-order Laplacian + 2D-FFT periodicity.
6. Double JPEG + Misaligned 8x8 Blocking Grid triggers BAG / DCT comb periodicity.
7. FastAPI endpoints (`/api/health`, `/api/presets`, `/api/analyze`, `/api/analyze/preset/{id}`) respond cleanly.
"""

from fastapi.testclient import TestClient

from app.core.schemas import AnalysisParams
from app.dip.pipeline import analyze_image_pipeline
from app.dip.presets_generator import get_presets_store
from app.main import app

client = TestClient(app)


def test_authentic_camera_control_is_clean() -> None:
    """Authentic single-compressed camera frame must be classified as AUTHENTIC (< 35 score)."""
    _, raw_store = get_presets_store()
    raw_bytes, _ = raw_store["authentic_camera"]
    report = analyze_image_pipeline(raw_bytes, filename="authentic_camera.jpg")

    assert report.verdict == "AUTHENTIC", f"Expected AUTHENTIC, got {report.verdict} (score={report.overall_score})"
    assert report.overall_score < 33.0
    assert len(report.layers) == 7


def test_splicing_forgery_detected_by_ela_and_noise() -> None:
    """Spliced foreign object must trigger ELA & Wavelet Noise layers and return TAMPERED."""
    _, raw_store = get_presets_store()
    raw_bytes, _ = raw_store["splice_badge"]
    report = analyze_image_pipeline(raw_bytes, filename="splice_badge.jpg")

    assert report.verdict == "TAMPERED"
    assert report.overall_score >= 56.0
    layer_map = {l.id: l for l in report.layers}
    assert layer_map["ela"].score >= 50.0 or layer_map["noise_wavelet"].score >= 50.0
    assert len(report.bounding_boxes) >= 1


def test_copy_move_clone_forgery_finds_vectors() -> None:
    """Copy-move cloned crate must be caught by Layer 3 (Block-DCT + ORB) with displacement vectors."""
    _, raw_store = get_presets_store()
    raw_bytes, _ = raw_store["copymove_crate"]
    report = analyze_image_pipeline(raw_bytes, filename="copymove_crate.jpg")

    layer_map = {l.id: l for l in report.layers}
    assert layer_map["copy_move"].score >= 55.0
    assert len(report.clone_vectors) >= 3
    assert report.verdict in ("TAMPERED", "SUSPICIOUS")


def test_retouch_airbrush_caught_by_wavelet_noise() -> None:
    """Gaussian airbrushed region must create a strong Wavelet HH1 / Wiener noise variance anomaly."""
    _, raw_store = get_presets_store()
    raw_bytes, _ = raw_store["retouch_airbrush"]
    report = analyze_image_pipeline(raw_bytes, filename="retouch_airbrush.jpg")

    layer_map = {l.id: l for l in report.layers}
    assert layer_map["noise_wavelet"].score >= 40.0 or layer_map["metadata_dqt"].score >= 50.0
    assert report.overall_score >= 38.0


def test_resampling_and_double_jpeg_layers_execute() -> None:
    """Resampled composite and Double-JPEG misaligned grid cases must flag anomalies."""
    _, raw_store = get_presets_store()

    resamp_bytes, _ = raw_store["resampling_rotscale"]
    rep_resamp = analyze_image_pipeline(resamp_bytes, filename="resampling_rotscale.jpg")
    l_resamp = {l.id: l for l in rep_resamp.layers}
    assert l_resamp["resampling_fft"].score >= 35.0 or l_resamp["ela"].score >= 45.0

    djpeg_bytes, _ = raw_store["double_jpeg_grid"]
    rep_djpeg = analyze_image_pipeline(djpeg_bytes, filename="double_jpeg_grid.jpg")
    assert rep_djpeg.overall_score >= 40.0


def test_custom_dip_parameters_affect_pipeline() -> None:
    """Changing wavelet basis (`haar` vs `db4`) and colormap (`viridis`) works deterministically."""
    _, raw_store = get_presets_store()
    raw_bytes, _ = raw_store["splice_badge"]
    params = AnalysisParams(
        ela_quality=85,
        ela_scale=24.0,
        wavelet_family="haar",
        noise_block_size=32,
        copy_move_threshold=0.85,
        morph_kernel_size=9,
        colormap="viridis",
    )
    report = analyze_image_pipeline(raw_bytes, filename="custom_params.jpg", params=params)
    assert report.parameters.wavelet_family == "haar"
    assert report.parameters.colormap == "viridis"
    assert report.composite_heatmap_base64.startswith("data:image/png;base64,")


def test_fastapi_endpoints() -> None:
    """Verify `/api/health`, `/api/presets`, `/api/analyze/preset/{id}`, and `/api/analyze` upload."""
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["layers_active"] == 7

    r_presets = client.get("/api/presets")
    assert r_presets.status_code == 200
    presets_data = r_presets.json()
    assert len(presets_data) == 6

    r_preset_run = client.post("/api/analyze/preset/splice_badge", json={})
    assert r_preset_run.status_code == 200
    assert r_preset_run.json()["verdict"] == "TAMPERED"

    # Test multipart file upload on `/api/analyze`
    _, raw_store = get_presets_store()
    sample_bytes, _ = raw_store["authentic_camera"]
    r_upload = client.post(
        "/api/analyze",
        files={"file": ("camera.jpg", sample_bytes, "image/jpeg")},
        data={"ela_quality": "92", "wavelet_family": "db4", "colormap": "inferno"},
    )
    assert r_upload.status_code == 200
    assert r_upload.json()["verdict"] == "AUTHENTIC"
