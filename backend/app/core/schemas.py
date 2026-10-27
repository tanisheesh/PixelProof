"""Pydantic v2 schemas for PixelProof API requests and responses."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class AnalysisParams(BaseModel):
    """User-tunable Digital Image Processing parameters for real-time lab exploration."""

    ela_quality: int = Field(default=90, ge=50, le=99, description="JPEG re-compression quality factor Q")
    ela_scale: float = Field(default=18.0, ge=1.0, le=50.0, description="Multiplicative gain for ELA residual")
    wavelet_family: Literal["haar", "db2", "db4"] = Field(default="db4", description="Discrete Wavelet Transform basis")
    noise_block_size: int = Field(default=32, ge=16, le=64, description="Sliding window block size for MAD noise estimation")
    copy_move_threshold: float = Field(default=0.88, ge=0.5, le=0.99, description="Cosine/Euclidean similarity threshold for block DCT matching")
    morph_kernel_size: int = Field(default=7, ge=3, le=21, description="Structuring element size for morphological opening/closing")
    colormap: Literal["inferno", "viridis", "jet", "hot"] = Field(default="inferno", description="False-color LUT for heatmaps")


class BoundingBox(BaseModel):
    """Detected anomalous region after Otsu thresholding and Connected Component Labeling."""

    id: int
    x: int
    y: int
    width: int
    height: int
    area_ratio: float
    confidence: float
    primary_cause: str
    label: str


class CloneVector(BaseModel):
    """Source-to-target displacement vector for Copy-Move (clone) forgery detection."""

    src_x: int
    src_y: int
    dst_x: int
    dst_y: int
    shift_dx: int
    shift_dy: int
    score: float
    method: Literal["keypoint_orb", "block_dct"]


class DipMathInfo(BaseModel):
    """Signal processing mathematical telemetry and operator details for the active layer."""

    signal_domain: str
    algorithm_name: str
    latex_formula: str
    kernel_or_matrix: Optional[List[List[float]]] = None
    parameters_used: Dict[str, Any]
    interpretation_guide: str


class LayerResult(BaseModel):
    """Output from a single classical DIP forensic layer."""

    id: str
    name: str
    short_name: str
    score: float = Field(ge=0.0, le=100.0, description="0-100 anomaly severity score for this layer")
    weight: float = Field(ge=0.0, le=1.0, description="Weight in composite fusion")
    status: Literal["clean", "suspicious", "tampered"]
    summary: str
    finding_details: List[str]
    heatmap_base64: str
    histogram_data: List[float] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    dip_math: DipMathInfo


class MetadataForensics(BaseModel):
    """EXIF, JPEG Quantization Table (DQT), and file structure inspection results."""

    format: str
    dimensions: str
    file_size_bytes: int
    color_mode: str
    exif_present: bool
    software_signature: Optional[str] = None
    camera_make_model: Optional[str] = None
    quantization_table_source: str
    estimated_original_quality: int
    thumbnail_present: bool
    thumbnail_ssim: Optional[float] = None
    anomalies: List[str]
    exif_tags: Dict[str, str]
    luminance_dqt: Optional[List[List[int]]] = None


class ForensicReport(BaseModel):
    """Complete multi-layer forensic analysis dossier."""

    report_id: str
    filename: str
    processing_time_ms: float
    image_width: int
    image_height: int
    overall_score: float = Field(ge=0.0, le=100.0)
    verdict: Literal["AUTHENTIC", "SUSPICIOUS", "TAMPERED"]
    confidence: float = Field(ge=0.0, le=100.0)
    executive_summary: str
    original_preview_base64: str
    composite_heatmap_base64: str
    localization_mask_base64: str
    annotated_overlay_base64: str
    bounding_boxes: List[BoundingBox]
    clone_vectors: List[CloneVector]
    layers: List[LayerResult]
    metadata: MetadataForensics
    parameters: AnalysisParams


class PresetCase(BaseModel):
    """Built-in forensic benchmark test case with ground-truth description."""

    id: str
    title: str
    category: Literal["splicing", "copy_move", "retouching", "resampling", "double_jpeg", "authentic"]
    difficulty: Literal["Easy", "Medium", "Hard"]
    description: str
    expected_verdict: Literal["AUTHENTIC", "SUSPICIOUS", "TAMPERED"]
    dip_concepts_highlighted: List[str]
    preview_base64: str
    ground_truth_mask_base64: Optional[str] = None
