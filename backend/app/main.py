"""Main FastAPI entry point for PixelProof."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as forensic_router

app = FastAPI(
    title="PixelProof — DIP Image Forgery & Tampering Detection API",
    description=(
        "Multi-layer classical Digital Image Processing (DIP) forensic engine: "
        "Error Level Analysis (ELA), 2D-DWT Wavelet Noise Variance, Hybrid Block-DCT + ORB Copy-Move Detection, "
        "2nd-Order Laplacian + 2D-FFT Resampling Spectrum, Double JPEG 8x8 Blocking Grid, "
        "Scharr Chromatic Aberration, and EXIF/DQT Quantization Matrix Fingerprinting."
    ),
    version="1.0.0",
    docs_url="/api-docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forensic_router)


@app.get("/")
def root() -> dict:
    """Root status endpoint."""
    return {
        "name": "PixelProof DIP Forensic Engine",
        "status": "operational",
        "docs": "/api-docs",
        "health": "/api/health",
    }
