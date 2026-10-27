"""FastAPI routes for PixelProof Digital Image Processing Forensic Engine."""

from typing import List, Literal
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import DEFAULT_CONFIG
from app.core.schemas import AnalysisParams, ForensicReport, PresetCase
from app.dip.pipeline import analyze_image_pipeline
from app.dip.presets_generator import get_presets_store

router = APIRouter(prefix="/api", tags=["Forensic DIP Pipeline"])


@router.get("/health")
def health_check() -> dict:
    """Health check endpoint for Render deployment & uptime monitoring."""
    return {
        "status": "ok",
        "service": "PixelProof DIP Forensic Engine",
        "layers_active": 7,
        "version": "1.0.0",
    }


@router.get("/presets", response_model=List[PresetCase])
def list_presets() -> List[PresetCase]:
    """Return all 6 built-in forensic benchmark cases with ground-truth masks."""
    presets, _ = get_presets_store()
    return presets


@router.post("/analyze/preset/{preset_id}", response_model=ForensicReport)
def analyze_preset_case(
    preset_id: str,
    params: AnalysisParams = AnalysisParams(),
) -> ForensicReport:
    """Run the 7-layer DIP pipeline on one of the built-in benchmark cases with custom DIP parameters."""
    _, raw_store = get_presets_store()
    if preset_id not in raw_store:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found.")
    raw_bytes, _ = raw_store[preset_id]
    return analyze_image_pipeline(raw_bytes=raw_bytes, filename=f"{preset_id}.jpg", params=params)


@router.post("/analyze", response_model=ForensicReport)
async def analyze_uploaded_image(
    file: UploadFile = File(...),
    ela_quality: int = Form(90),
    ela_scale: float = Form(18.0),
    wavelet_family: Literal["haar", "db2", "db4"] = Form("db4"),
    noise_block_size: int = Form(32),
    copy_move_threshold: float = Form(0.88),
    morph_kernel_size: int = Form(7),
    colormap: Literal["inferno", "viridis", "jet", "hot"] = Form("inferno"),
) -> ForensicReport:
    """
    Upload any image (JPEG, PNG, WebP, BMP) and run the 7-layer Digital Image Processing forensic pipeline.
    Accepts optional real-time DIP tuning parameters via multipart form fields.
    """
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(raw_bytes) > DEFAULT_CONFIG.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds 15 MB maximum upload size.")

    params = AnalysisParams(
        ela_quality=max(50, min(99, ela_quality)),
        ela_scale=max(1.0, min(50.0, ela_scale)),
        wavelet_family=wavelet_family,
        noise_block_size=max(16, min(64, noise_block_size)),
        copy_move_threshold=max(0.5, min(0.99, copy_move_threshold)),
        morph_kernel_size=max(3, min(21, morph_kernel_size)),
        colormap=colormap,
    )

    try:
        return analyze_image_pipeline(
            raw_bytes=raw_bytes,
            filename=file.filename or "uploaded_image.jpg",
            params=params,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
