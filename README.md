<p align="center">
  <img src="docs/logo.svg" width="64" height="64" alt="PixelProof logo">
</p>

<h1 align="center">PixelProof</h1>

<p align="center">
  <strong>Multi-layer digital image forensics engine that detects splicing, copy-move cloning, resampling, and retouching via 7 classical Digital Image Processing (DIP) pipelines — zero black-box ML, results in under 1.5 seconds.</strong>
</p>

<p align="center">
  <a href="https://pixelproof.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-06B6D4-06B6D4?style=flat-square" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white" alt="OpenCV">
  <img src="https://img.shields.io/badge/SciPy-8CAAE6?style=flat-square&logo=scipy&logoColor=white" alt="SciPy">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/license-GPL--3.0-06B6D4?style=flat-square" alt="License">
</p>

---

## What is PixelProof?

PixelProof exposes image manipulation by analyzing physical and mathematical signal artifacts at the pixel, spatial, and frequency levels rather than relying on opaque deep-learning classifiers. Every uploaded image runs through seven classical Digital Image Processing (DIP) pipelines — Error Level Analysis (ELA) with JPEG Ghost sweeps, 2D Discrete Wavelet Transform (`db4`/`haar`) noise variance mapping, hybrid 2D-DCT + ORB copy-move clone detection, 2nd-order Laplacian + 2D-FFT resampling spectrum analysis, 8×8 DCT blocking grid alignment, Scharr chromatic aberration divergence, and EXIF/DQT quantization matrix fingerprinting. A morphological fusion engine combines these spatial maps via Otsu adaptive thresholding, elliptical opening/closing, and 8-connected component labeling to isolate exact tamper bounding boxes and an auditable 0–100 verdict score.

> **Live demo →** [https://pixelproof.tanisheesh.in](https://pixelproof.tanisheesh.in)

---

## What you get

- **7-layer classical DIP forensic pipeline** — ELA & JPEG Ghosts, Wavelet (`HH1`) + Wiener noise residuals, Block-DCT + ORB copy-move vectors, Laplacian + 2D-FFT spectral periodicity, Double-JPEG 8×8 grid phase, Scharr chromatic edges, and JPEG DQT matrix fingerprinting.
- **Interactive forensic workbench & DIP lab controls** — split-screen comparison slider, synchronized 5× pixel magnifier loupe, 8×8 DCT block grid overlay, real-time parameter tuning ($Q$-factor, wavelet basis, morphological kernel), and a live math/histogram drawer showing governing equations and kernels.
- **Built-in Live Tamper Sandbox** — forge an image directly in the browser using Copy-Move Clone Stamp, Foreign Object Splice, or Gaussian Healing Brush, then immediately run the 7 DIP layers to watch the engine localize your exact edit.
- **Dual-engine resilience (FastAPI + Client Canvas DIP)** — runs full NumPy/SciPy/OpenCV/PyWavelets processing on the backend with an automatic in-browser HTML5 Canvas DIP fallback so the live workbench never breaks during cold starts.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Lucide Icons |
| Backend API | Python 3.12+ · FastAPI · Uvicorn · Pydantic v2 · OpenAPI / Swagger UI |
| DIP & Signal Processing | OpenCV (`opencv-python-headless`) · NumPy · SciPy · PyWavelets (`pywt`) · Pillow |
| Hosting | Vercel (frontend) · Render / Docker (backend API) |

---

## Engineering Decisions

**Why classical Digital Image Processing (DCT, DWT, 2D-FFT, Wiener, Morphology) over a CNN classifier?**
Black-box neural networks fail silently when an image is re-compressed at an unseen quality factor and cannot explain *why* a pixel was flagged. Every verdict in PixelProof traces directly to a deterministic mathematical property — such as a $3.8\sigma$ MAD noise deviation in the Daubechies `db4` $HH_1$ wavelet sub-band, a misaligned $8\times8$ DCT blocking grid, or coherent shift vectors in lexicographically sorted DCT blocks — running on CPU in under 1.5 seconds with zero GPU cost.

**Why hybrid Copy-Move detection (16×16 Block 2D-DCT + ORB Keypoints)?**
Keypoint matchers (ORB/SIFT) handle rotation and scaling well but fail when a forger clones a low-texture region (such as sky, foliage, or wall) to conceal an object. Combining ORB keypoint matching with dense overlapping $16\times16$ 2D-DCT lexicographical block sorting and shift-vector histogram clustering catches both geometric and smooth internal clones.

**Why edge-masked Wavelet ($HH_1$) + Adaptive Wiener residuals for noise estimation?**
Natural images exhibit high spatial variance along structural edges, causing naive sliding-window variance detectors to false-positive on sharp object boundaries. Decomposing the luminance channel via 2D-DWT to isolate the diagonal high-frequency sub-band ($HH_1$) and masking out top-15% Sobel gradient magnitudes isolates true camera sensor noise from scene structure.

**What would you do differently in v2?**
Move the client-side fallback DIP computations into a dedicated Web Worker using WebAssembly SIMD so 4K/RAW images can be analyzed at full native resolution without downsampling to 768 px on the main thread.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component breakdown |
| [Decisions](docs/DECISIONS.md) | Every major technical decision and why |
| [Setup](docs/SETUP.md) | Local dev setup and env vars |
| [Deploy](docs/DEPLOY.md) | Production deployment, domains, rollback |
| [Contributing](CONTRIBUTING.md) | How to propose changes |
| [Changelog](CHANGELOG.md) | What changed in each release |
| [Security](SECURITY.md) | How to report a vulnerability |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hey%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
