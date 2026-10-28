# PixelProof — Product Requirements Document

**Status:** Final
**Owners:** Tanish Poddar & Krish Gohel (`krish-codess`)
**One-liner:** Multi-layer digital image forensics engine that detects splicing, copy-move cloning, resampling, and retouching via 7 classical Digital Image Processing (DIP) pipelines — zero black-box ML, results in under 1.5 seconds.

---

## 1. Problem

Modern image manipulation — from splicing foreign objects and cloning textures (copy-move) to airbrushing/inpainting and re-compressing crops — is ubiquitous, yet most verification tools fall into two broken extremes: either single-heuristic scripts (plain Error Level Analysis that fails on single-saved clones or smooth airbrushing) or opaque deep-learning classifiers that require heavy GPU servers and provide zero mathematical explainability during a forensic audit. Analysts, security engineers, and reviewers need a fast, deterministic, multi-layer Digital Image Processing workbench that exposes the exact spatial and frequency-domain evidence behind every flagged pixel.

---

## 2. Goals (v1 / MVP)

1. Execute 7 distinct classical Digital Image Processing (DIP) forensic layers on any uploaded JPEG, PNG, WebP, or BMP image in under 1.5 seconds on standard CPU hardware.
2. Provide an interactive forensic workbench with split-screen comparison, 5× synchronized pixel loupe, 8×8 DCT grid overlay, and real-time DIP parameter tuning ($Q$-factor, wavelet basis, block size, morphological kernel, colormap LUT).
3. Include 6 deterministic ground-truth benchmark cases (Splicing, Copy-Move, Gaussian Retouching, Resampling, Double JPEG Grid Misalignment, and Authentic Camera Control) that achieve 100% classification accuracy out of the box.
4. Provide a Live Tamper Sandbox where evaluators can forge an image directly in the browser (clone stamp, foreign splice, or healing blur) and immediately test detection.
5. Surface governing mathematical equations, convolution kernels, 8×8 quantization matrices, and 32-bin residual histograms for every layer.

---

## 3. Non-Goals (explicit scope cuts)

- **Deep-learning / CNN model weights (ManTra-Net, TruFor, etc.)** — deliberately excluded to keep the system 100% mathematically explainable, deterministic, and deployable on CPU without multi-gigabyte PyTorch weights.
- **Video deepfake temporal frame analysis** — v1 focuses strictly on still-image spatial and frequency forensics; video GOP/optical-flow forensics is deferred to v2.
- **Persistent cloud storage of uploaded user images** — all analysis is stateless and processed in memory (`io.BytesIO`) to eliminate privacy risk and storage costs.

---

## 4. Users

**Primary:** Digital forensics analysts, security engineers, and media verification teams who need an interactive, mathematically transparent Digital Image Processing workbench to inspect image authenticity and explore spatial/frequency filter responses.

**Secondary:** Technical recruiters and engineering interviewers evaluating system design, signal processing depth, and full-stack execution on live test cases.

---

## 5. User Stories

1. *As a forensic analyst,* I can upload a suspect image and inspect 7 independent DIP heatmaps side-by-side with the original so that I can verify whether an anomaly is corroborated across multiple signal domains.
2. *As a signal processing engineer,* I can switch between layers and inspect the live mathematical formulation, convolution kernel, and 32-bin residual histogram so that I can trace each visual heatmap to its governing operator.
3. *As an evaluator,* I can open the Live Tamper Sandbox, clone or splice a region on a clean image, and click "Analyze Forgery" so that I can verify the engine catches live edits in real time.
4. *As a researcher,* I can tune ELA quality $Q \in [55, 98]$, switch wavelet families (`haar`, `db2`, `db4`), and adjust morphological structuring element sizes to observe how filter parameters affect localization masks.
5. *As an auditor,* I can export a complete JSON forensic dossier or printable PDF report containing region bounding boxes, confidence scores, and EXIF/DQT tables.

---

## 6. Functional Requirements

### 6.1 7-Layer DIP Forensic Engine

- **Layer 1 (ELA & JPEG Ghosts):** Convert RGB to ITU-R BT.601 YCbCr, compute re-compression residual at quality $Q$, normalize against local Sobel edge energy, and sweep $Q \in \{75, 85, 95\}$ for JPEG ghost variance.
- **Layer 2 (Wavelet & Wiener Noise):** Decompose luminance via 2D-DWT (`haar`, `db2`, `db4`) to extract the $HH_1$ diagonal high-frequency sub-band, combine with a $5\times5$ Adaptive Wiener filter residual, and compute Donoho's MAD noise $\hat{\sigma}_b$ across sliding blocks.
- **Layer 3 (Hybrid Copy-Move Detection):** Run overlapping $16\times16$ 2D-DCT lexicographical block sorting alongside ORB keypoint matching and shift-vector histogram clustering to isolate duplicated regions.
- **Layer 4 (Resampling & 2D-FFT Spectrum):** Convolve luminance with a $3\times3$ isotropic 2nd-order Laplacian kernel and compute the 2D Hanning-windowed Fast Fourier Transform ($\text{FFT2}$) log-magnitude spectrum to detect periodic interpolation peaks.
- **Layer 5 (Double JPEG & 8×8 Blocking Grid):** Measure $(x \bmod 8, y \bmod 8)$ block boundary phase alignment and AC $(0,1)/(1,0)$ DCT histogram comb periodicity.
- **Layer 6 (Chromatic Aberration & Scharr Edges):** Compute $3\times3$ rotational-symmetric Scharr gradients across $R, G, B$ channels and measure magnitude divergence and vector collinearity.
- **Layer 7 (EXIF & JPEG DQT Fingerprinting):** Parse EXIF tags for editing software signatures and compare the 64-element Luminance Quantization Table (DQT) against standard IJG quality curves.

### 6.2 Morphological Fusion & Localization

- Fuse normalized spatial anomaly maps using dynamic top-layer boosting.
- Segment suspect zones using Otsu's adaptive thresholding with an upper-percentile floor.
- Apply elliptical Morphological Opening ($A \circ B$) to remove isolated salt noise and Morphological Closing ($A \bullet B$) to bridge fragmented tamper regions.
- Extract 8-connected components (`cv2.connectedComponentsWithStats`) and output bounding boxes with primary DIP cause attribution.

### 6.3 Interactive Workbench & Sandbox

- Support Split-Screen slider, Heatmap-only, Alpha Blend, and Original Source views.
- Provide a synchronized 5× dual magnifier loupe displaying pixelated RGB vs. active DIP heatmap under the cursor alongside live $(x,y)$ and $8\times8$ DCT block coordinates.
- Provide a client-side Canvas DIP fallback so the workbench remains functional even if the Python API is unreachable.

---

## 7. Non-Functional Requirements

- **Latency:** End-to-end 7-layer analysis completes in `< 1.5s` for standard images (automatically aspect-scaled to `max_dim = 768` px).
- **Security:** Stateless in-memory image decoding with a strict 15 MB upload cap and validated image buffer parsing.
- **Reliability:** Automatic fallback from FastAPI backend to in-browser Canvas DIP execution on network timeout.
- **Determinism:** Identical image inputs and DIP parameters always produce identical scores, heatmaps, and bounding boxes.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Benchmark suite classification accuracy | 6 / 6 (100%) across all built-in tampering categories |
| End-to-end 7-layer pipeline latency | `< 1500 ms` on standard CPU |
| Unit & integration test pass rate | 100% (`pytest` + `next build` + `tsc`) |

---

## 9. Risks & Open Questions

- **Heavy social-media re-compression (WhatsApp/Instagram)** — Aggressive downscaling and re-encoding at $Q < 70$ can attenuate original splicing boundaries. Mitigated by combining compression-based layers (ELA, BAG) with structural/geometric layers (Copy-Move, Chromatic Edge, Resampling FFT).
- **Render free-tier cold starts** — Mitigated by the built-in client-side Canvas DIP fallback engine that executes immediately in the browser if the backend takes longer than 12 seconds to wake up.

---

## 10. v2 Candidates

- **WebAssembly SIMD Full-Resolution Mode** — Run 4K/RAW wavelet and FFT transforms directly in a browser Web Worker without downsampling.
- **Camera PRNU Sensor FingerprintEnrollment** — Allow users to upload 10+ flat-field frames from a known camera to match Photo-Response Non-Uniformity (PRNU) sensor patterns.
- **Batch Folder & CLI Forensic Scanner** — Analyze entire directories of evidence images and output a consolidated CSV/HTML audit matrix.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

<h3>Krish Gohel</h3>

<a href="https://github.com/krish-codess"><img src="https://img.shields.io/badge/GitHub-krish--codess-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:krishnakulgohel544@gmail.com"><img src="https://img.shields.io/badge/Email-krishnakulgohel544%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
