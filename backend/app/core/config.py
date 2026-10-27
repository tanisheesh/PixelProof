"""Configuration constants and defaults for PixelProof DIP Engine."""

from dataclasses import dataclass


@dataclass(frozen=True)
class DipConfig:
    """Default parameters for the 7-layer Digital Image Processing pipeline."""

    max_image_dimension: int = 1024
    max_upload_bytes: int = 15 * 1024 * 1024  # 15 MB
    ela_quality: int = 90
    ela_scale: float = 18.0
    ela_gamma: float = 1.15
    wavelet_family: str = "db4"
    noise_block_size: int = 32
    noise_stride: int = 16
    copy_move_block_size: int = 16
    copy_move_min_distance: float = 28.0
    copy_move_similarity: float = 0.88
    morph_open_kernel: int = 5
    morph_close_kernel: int = 11


DEFAULT_CONFIG = DipConfig()
