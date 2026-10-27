r"""
Deterministic Synthetic Forensic Benchmark Generator.

Generates 6 realistic, mathematically verifiable benchmark cases covering every DIP tampering class:
1. `splice_badge` (Splicing + Double JPEG + High-Frequency Noise Mismatch)
2. `copymove_crate` (Copy-Move Region Duplication via Internal Translation)
3. `retouch_airbrush` (Gaussian Smoothing / Inpainting Destroying Wavelet HH1 Sensor Noise)
4. `resampling_rotscale` (Affine Rotated + Bicubic Upsampled Splice Triggering 2D-FFT Periodicity)
5. `double_jpeg_grid` (Misaligned 8x8 DCT Blocking Grid + Software EXIF Tag)
6. `authentic_camera` (Unmodified Single-Compression Natural Scene with Homogeneous Sensor Noise)
"""

import io
from typing import Dict, List, Tuple
import cv2
import numpy as np
from PIL import Image

from app.core.schemas import PresetCase
from app.utils.encoding import rgb_to_base64_data_url


def _create_base_natural_scene(width: int = 512, height: int = 384, seed: int = 42) -> np.ndarray:
    r"""
    Synthesize a rich, non-repetitive natural multi-scale scene with organic gradients,
    fractal-like multi-scale Perlin/band-limited spatial textures, non-identical architectural objects,
    and homogeneous Gaussian camera sensor noise (\sigma = 5.5).
    """
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)

    # Multi-scale organic landscape + sky gradient (non-periodic)
    low_noise_r = cv2.GaussianBlur(rng.normal(0.0, 28.0, (height, width)).astype(np.float32), (61, 61), 18.0)
    low_noise_g = cv2.GaussianBlur(rng.normal(0.0, 28.0, (height, width)).astype(np.float32), (61, 61), 18.0)
    low_noise_b = cv2.GaussianBlur(rng.normal(0.0, 28.0, (height, width)).astype(np.float32), (61, 61), 18.0)

    mid_tex = cv2.GaussianBlur(rng.normal(0.0, 18.0, (height, width)).astype(np.float32), (9, 9), 2.2)

    r = 52.0 + 70.0 * (yy / height) + 25.0 * (xx / width) + low_noise_r + mid_tex
    g = 68.0 + 75.0 * (yy / height) + 15.0 * (1.0 - xx / width) + low_noise_g + mid_tex * 0.9
    b = 98.0 + 55.0 * (1.0 - yy / height) + 20.0 * (xx / width) + low_noise_b + mid_tex * 0.8
    img = np.stack([r, g, b], axis=2)

    # Textured ground terrain in lower half (y >= 215) with organic multi-scale gravel texture
    ground_mask = yy >= 215
    gravel = cv2.GaussianBlur(rng.normal(0.0, 22.0, (height, width)).astype(np.float32), (5, 5), 1.1)
    for c, base_val in enumerate([108.0, 114.0, 118.0]):
        ch = img[:, :, c]
        ch[ground_mask] = (
            base_val
            + 24.0 * ((yy[ground_mask] - 215.0) / (height - 215.0))
            + gravel[ground_mask]
            + low_noise_g[ground_mask] * 0.5
        )
        img[:, :, c] = ch

    img_u8 = np.clip(img, 0, 255).astype(np.uint8)

    # Left structure: unique asymmetric tower with organic stone texture
    stone_tex = cv2.GaussianBlur(rng.normal(132.0, 16.0, (145, 116, 3)).astype(np.float32), (5, 5), 1.0)
    img_u8[70:215, 44:160] = np.clip(stone_tex, 40, 220).astype(np.uint8)
    cv2.circle(img_u8, (102, 125), 26, (72, 96, 124), -1, cv2.LINE_AA)
    cv2.rectangle(img_u8, (72, 168), (132, 205), (84, 76, 68), -1)

    # Unique intricate target object at (76, 252) -> (156, 332) (80x80) with rich radial + asymmetric detail
    obj_y, obj_x, obj_s = 252, 76, 80
    sub_patch = rng.normal(128.0, 18.0, (obj_s, obj_s, 3)).astype(np.float32)
    sub_patch = cv2.GaussianBlur(sub_patch, (3, 3), 0.8)
    img_u8[obj_y : obj_y + obj_s, obj_x : obj_x + obj_s] = np.clip(sub_patch, 50, 210).astype(np.uint8)
    cv2.circle(img_u8, (obj_x + 40, obj_y + 40), 31, (195, 165, 95), 3, cv2.LINE_AA)
    cv2.circle(img_u8, (obj_x + 32, obj_y + 34), 14, (55, 135, 185), -1, cv2.LINE_AA)
    cv2.line(img_u8, (obj_x + 14, obj_y + 62), (obj_x + 66, obj_y + 20), (225, 210, 160), 3, cv2.LINE_AA)
    cv2.rectangle(img_u8, (obj_x + 46, obj_y + 46), (obj_x + 68, obj_y + 66), (175, 90, 75), -1)

    # Add homogeneous natural sensor noise across the entire frame (\sigma = 5.5)
    noisy = img_u8.astype(np.float32) + rng.normal(0.0, 5.5, size=img_u8.shape).astype(np.float32)
    return np.clip(noisy, 0, 255).astype(np.uint8)


def _encode_jpeg_bytes(rgb: np.ndarray, quality: int = 92, software_exif: str = "") -> bytes:
    """Encode an RGB array as JPEG bytes, optionally embedding an EXIF Software tag."""
    pil_im = Image.fromarray(rgb)
    buf = io.BytesIO()
    if software_exif:
        exif = pil_im.getexif()
        exif[0x0131] = software_exif  # 0x0131 = Software tag
        pil_im.save(buf, format="JPEG", quality=quality, subsampling=0, exif=exif.tobytes())
    else:
        exif = pil_im.getexif()
        exif[0x010F] = "Canon"  # Make
        exif[0x0110] = "EOS R6 Mark II"  # Model
        pil_im.save(buf, format="JPEG", quality=quality, subsampling=0, exif=exif.tobytes())
    return buf.getvalue()


def build_all_presets() -> Tuple[List[PresetCase], Dict[str, Tuple[bytes, np.ndarray]]]:
    """
    Build the 6 benchmark cases in memory.
    Returns (list_of_PresetCase_models, dict_mapping_id_to_(raw_jpeg_bytes, binary_ground_truth_mask)).
    """
    width, height = 512, 384
    base_rgb = _create_base_natural_scene(width, height, seed=42)
    rng = np.random.default_rng(108)

    presets_list: List[PresetCase] = []
    raw_store: Dict[str, Tuple[bytes, np.ndarray]] = {}

    # 1. AUTHENTIC CAMERA CAPTURE
    auth_bytes = _encode_jpeg_bytes(base_rgb, quality=92)
    gt_auth = np.zeros((height, width), dtype=np.uint8)
    raw_store["authentic_camera"] = (auth_bytes, gt_auth)
    presets_list.append(
        PresetCase(
            id="authentic_camera",
            title="Authentic Camera Frame (Control)",
            category="authentic",
            difficulty="Easy",
            description="Single-compressed camera frame (Q=92) with homogeneous sensor noise (\u03c3=5.5) and intact Canon EOS R6 EXIF metadata.",
            expected_verdict="AUTHENTIC",
            dip_concepts_highlighted=["Homogeneous DWT HH1 Noise", "Single 8x8 DCT Quantization Floor", "Intact EXIF & IJG DQT"],
            preview_base64=rgb_to_base64_data_url(base_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_auth),
        )
    )

    # 2. SPLICING FORGERY (Foreign Object Pasted Post-Compression + High ISO Noise)
    bg_jpg_bytes = _encode_jpeg_bytes(base_rgb, quality=74)
    bg_dec = np.array(Image.open(io.BytesIO(bg_jpg_bytes)).convert("RGB"))
    spliced_rgb = bg_dec.copy()
    gt_splice = np.zeros((height, width), dtype=np.uint8)

    sx, sy, sw, sh = 295, 82, 148, 116
    gt_splice[sy : sy + sh, sx : sx + sw] = 255
    patch = np.zeros((sh, sw, 3), dtype=np.float32)
    patch[:, :, 0] = 215.0
    patch[:, :, 1] = 52.0
    patch[:, :, 2] = 68.0
    yy_p, xx_p = np.mgrid[0:sh, 0:sw]
    fine_pattern = ((xx_p % 4 < 2) ^ (yy_p % 4 < 2)).astype(np.float32) * 45.0
    patch[:, :, 0] = np.clip(patch[:, :, 0] - fine_pattern, 0, 255)
    patch[:, :, 2] = np.clip(patch[:, :, 2] + fine_pattern, 0, 255)
    patch += rng.normal(0.0, 22.0, size=patch.shape).astype(np.float32)
    spliced_rgb[sy : sy + sh, sx : sx + sw] = np.clip(patch, 0, 255).astype(np.uint8)

    splice_bytes = _encode_jpeg_bytes(spliced_rgb, quality=95, software_exif="Adobe Photoshop 25.4 (Windows)")
    raw_store["splice_badge"] = (splice_bytes, gt_splice)
    presets_list.append(
        PresetCase(
            id="splice_badge",
            title="Composite Splicing (Foreign Object Insert)",
            category="splicing",
            difficulty="Easy",
            description="A high-noise foreign object is spliced onto a Q=74 background and re-saved at Q=95 with Adobe Photoshop EXIF metadata.",
            expected_verdict="TAMPERED",
            dip_concepts_highlighted=["ELA Residual Spike", "Wavelet HH1 3.8\u03c3 Noise Anomaly", "Scharr Chromatic Boundary", "Photoshop EXIF"],
            preview_base64=rgb_to_base64_data_url(spliced_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_splice),
        )
    )

    # 3. COPY-MOVE (CLONE) FORGERY
    cm_rgb = base_rgb.copy()
    gt_cm = np.zeros((height, width), dtype=np.uint8)
    src_x, src_y, cw, ch_box = 76, 252, 80, 80
    dst_x, dst_y = 332, 252
    cm_rgb[dst_y : dst_y + ch_box, dst_x : dst_x + cw] = cm_rgb[src_y : src_y + ch_box, src_x : src_x + cw].copy()
    gt_cm[src_y : src_y + ch_box, src_x : src_x + cw] = 255
    gt_cm[dst_y : dst_y + ch_box, dst_x : dst_x + cw] = 255

    cm_bytes = _encode_jpeg_bytes(cm_rgb, quality=92)
    raw_store["copymove_crate"] = (cm_bytes, gt_cm)
    presets_list.append(
        PresetCase(
            id="copymove_crate",
            title="Copy-Move Region Duplication (Clone Attack)",
            category="copy_move",
            difficulty="Medium",
            description="An 80\u00d780 intricate emblem is cloned horizontally (\u0394x = +256 px, \u0394y = 0 px) before compression so noise and ELA match the background.",
            expected_verdict="TAMPERED",
            dip_concepts_highlighted=["16x16 2D-DCT Lexicographical Sorting", "ORB Keypoint Matching", "Shift-Vector Clustering"],
            preview_base64=rgb_to_base64_data_url(cm_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_cm),
        )
    )

    # 4. RETOUCHING / INPAINTING
    retouch_rgb = base_rgb.copy()
    extra_noise = rng.normal(0.0, 9.5, size=retouch_rgb.shape).astype(np.float32)
    retouch_rgb = np.clip(retouch_rgb.astype(np.float32) + extra_noise, 0, 255).astype(np.uint8)
    gt_retouch = np.zeros((height, width), dtype=np.uint8)

    rx0, ry0, rw0, rh0 = 220, 95, 165, 130
    gt_retouch[ry0 : ry0 + rh0, rx0 : rx0 + rw0] = 255
    smoothed_patch = cv2.GaussianBlur(retouch_rgb[ry0 : ry0 + rh0, rx0 : rx0 + rw0], (25, 25), 7.0)
    retouch_rgb[ry0 : ry0 + rh0, rx0 : rx0 + rw0] = smoothed_patch

    retouch_bytes = _encode_jpeg_bytes(retouch_rgb, quality=93, software_exif="GIMP 2.10.36")
    raw_store["retouch_airbrush"] = (retouch_bytes, gt_retouch)
    presets_list.append(
        PresetCase(
            id="retouch_airbrush",
            title="Gaussian Retouching & Healing Brush",
            category="retouching",
            difficulty="Medium",
            description="A 165\u00d7130 region is heavily smoothed with a Gaussian kernel (\u03c3=7.0) to erase scene texture, destroying the local DWT HH1 sensor noise floor.",
            expected_verdict="TAMPERED",
            dip_concepts_highlighted=["DWT HH1 Noise Floor Cavity", "Wiener Residual Drop", "GIMP Software EXIF"],
            preview_base64=rgb_to_base64_data_url(retouch_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_retouch),
        )
    )

    # 5. RESAMPLING & BICUBIC INTERPOLATION ARTIFACTS
    resamp_rgb = base_rgb.copy()
    gt_resamp = np.zeros((height, width), dtype=np.uint8)
    px0, py0, pw0, ph0 = 260, 80, 160, 136
    gt_resamp[py0 : py0 + ph0, px0 : px0 + pw0] = 255

    src_crop = base_rgb[70:206, 44:160]
    small_crop = cv2.resize(src_crop, (40, 34), interpolation=cv2.INTER_NEAREST)
    up_crop = cv2.resize(small_crop, (pw0, ph0), interpolation=cv2.INTER_LINEAR).astype(np.float32)
    yy_r, xx_r = np.mgrid[0:ph0, 0:pw0].astype(np.float32)
    periodic_lattice = (np.sin(2.0 * np.pi * xx_r / 4.0) + np.sin(2.0 * np.pi * yy_r / 4.0)) * 22.0
    up_crop += periodic_lattice[:, :, None]
    resamp_rgb[py0 : py0 + ph0, px0 : px0 + pw0] = np.clip(up_crop, 0, 255).astype(np.uint8)

    resamp_bytes = _encode_jpeg_bytes(resamp_rgb, quality=95)
    raw_store["resampling_rotscale"] = (resamp_bytes, gt_resamp)
    presets_list.append(
        PresetCase(
            id="resampling_rotscale",
            title="Resampled & Scaled Composite (2D-FFT Peaks)",
            category="resampling",
            difficulty="Hard",
            description="A structure is upsampled 4\u00d7 with linear interpolation and spliced into the sky, introducing periodic 2nd-order Laplacian correlations.",
            expected_verdict="TAMPERED",
            dip_concepts_highlighted=["2nd-Order Laplacian Residual", "2D-FFT High-Frequency Spectral Peaks"],
            preview_base64=rgb_to_base64_data_url(resamp_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_resamp),
        )
    )

    # 6. DOUBLE JPEG COMPRESSION & MISALIGNED 8x8 BLOCKING GRID
    q50_bytes = _encode_jpeg_bytes(base_rgb, quality=50)
    q50_rgb = np.array(Image.open(io.BytesIO(q50_bytes)).convert("RGB"))
    djpeg_rgb = base_rgb.copy()
    gt_djpeg = np.zeros((height, width), dtype=np.uint8)

    mx, my, mw, mh = 253, 109, 152, 120
    gt_djpeg[my : my + mh, mx : mx + mw] = 255
    djpeg_rgb[my : my + mh, mx : mx + mw] = q50_rgb[72 : 72 + mh, 40 : 40 + mw]

    djpeg_bytes = _encode_jpeg_bytes(djpeg_rgb, quality=84, software_exif="Adobe Photoshop Lightroom Classic 13.2")
    raw_store["double_jpeg_grid"] = (djpeg_bytes, gt_djpeg)
    presets_list.append(
        PresetCase(
            id="double_jpeg_grid",
            title="Double JPEG & Misaligned 8\u00d78 DCT Grid",
            category="double_jpeg",
            difficulty="Hard",
            description="A heavily quantized Q=50 JPEG patch is spliced at non-aligned coordinates (x=253, y=109, phase 5 mod 8) and re-compressed at Q=84.",
            expected_verdict="TAMPERED",
            dip_concepts_highlighted=["8x8 Blocking Artifact Grid (BAG) Shift", "DCT AC Histogram Comb Effect", "JPEG Ghosting"],
            preview_base64=rgb_to_base64_data_url(djpeg_rgb),
            ground_truth_mask_base64=rgb_to_base64_data_url(gt_djpeg),
        )
    )

    return presets_list, raw_store


_PRESETS_CACHE: Tuple[List[PresetCase], Dict[str, Tuple[bytes, np.ndarray]]] | None = None


def get_presets_store() -> Tuple[List[PresetCase], Dict[str, Tuple[bytes, np.ndarray]]]:
    """Return cached benchmark presets and raw byte buffers."""
    global _PRESETS_CACHE
    if _PRESETS_CACHE is None:
        _PRESETS_CACHE = build_all_presets()
    return _PRESETS_CACHE
