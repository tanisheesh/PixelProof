# Changelog

All notable changes to **PixelProof** are documented here.

---

## [1.0.0] — 2026-10-27

### ✨ Added
- 7-layer classical Digital Image Processing (DIP) forensic engine (`backend/app/dip/`):
  - Layer 1: Edge-normalized Error Level Analysis (ELA) in YCbCr color space + multi-quality JPEG Ghost sweeps
  - Layer 2: 2D Discrete Wavelet Transform (`haar`, `db2`, `db4`) $HH_1$ MAD noise variance estimator + $5\times5$ Adaptive Wiener residual
  - Layer 3: Hybrid Copy-Move clone detector combining $16\times16$ 2D-DCT lexicographical block sorting and ORB keypoint shift-vector clustering
  - Layer 4: 2nd-order isotropic Laplacian high-pass filtering + Hanning-windowed 2D-FFT log-magnitude spectrum periodicity detector
  - Layer 5: Double JPEG quantization AC histogram comb-periodicity & $8\times8$ Blocking Artifact Grid (BAG) phase alignment analyzer
  - Layer 6: $3\times3$ rotational-symmetric Scharr multi-channel chromatic aberration and boundary divergence detector
  - Layer 7: EXIF software tag inspector and $8\times8$ JPEG Luminance Quantization Table (DQT) fingerprinter
- Morphological fusion and connected-component localization engine (Otsu adaptive thresholding + elliptical Morphological Opening & Closing + 8-connectivity bounding boxes)
- Interactive Next.js 16 forensic workbench with split-screen slider, 5× synchronized dual magnifier loupe, $8\times8$ DCT grid overlay, DIP Math & Theory Drawer, and real-time parameter sliders
- Live Tamper Sandbox allowing evaluators to apply Copy-Move clone stamps, foreign splices, or Gaussian airbrushing directly in the browser and immediately test detection
- 6 deterministic ground-truth benchmark presets and CLI evaluation suite (`backend/scripts/evaluate_benchmark.py`)
- In-browser HTML5 Canvas DIP fallback engine for instant zero-downtime analysis during backend cold starts

---

[1.0.0]: https://github.com/tanisheesh/PixelProof/releases/tag/v1.0.0

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hey%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
