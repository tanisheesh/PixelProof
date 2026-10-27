<div align="center">

<sub><b>PIXELPROOF IMPLEMENTATION PLAN</b> · Digital Image Processing (4th Year CSE) · <a href="https://tanisheesh.in">Tanish Poddar</a></sub>

</div>

# PixelProof — Master Engineering & Academic Plan (`plan.md`)

> **One-liner:** Multi-layer digital image forensics engine that detects splicing, copy-move cloning, resampling, and AI/retouching tampering using classical Digital Image Processing (DIP) pipelines — zero black-box ML, fully explainable pixel-level heatmaps, results in under 2 seconds.

---

## 1. Why This Approach Wins (Academic Viva + Recruiter Portfolio)

Most 4th-year CSE students submit a basic Jupyter notebook running a pre-trained CNN on the CASIA dataset or a single 30-line Error Level Analysis (ELA) script. That fails in two places:
1. **In a DIP Viva:** Professors ask *how* DCT quantization, wavelet decomposition, Wiener filtering, or morphological operations work at the pixel/frequency level — and a black-box neural network gives you nothing to explain mathematically.
2. **On a Resume / Portfolio:** A notebook isn't a product.

**PixelProof** solves both:
- **For the DIP Course & Viva:** It implements **7 distinct, classical Digital Image Processing pipelines** covering almost every module of a 4th-year DIP syllabus: **Color Space Transformations, Frequency Domain (2D-DCT, 2D-DFT, DWT), Spatial Filtering (Wiener, High-Pass, Sobel/Laplacian), Feature Descriptors & Block Matching, Histogram & Statistical Analysis, and Morphological Image Processing**.
- **For Your Portfolio (`setup-toolkit` standard):** It ships as a high-craft dark-mode forensic workbench (`pixelproof.tanisheesh.in`) with interactive multi-layer heatmaps, synchronized loupe/split-screen inspection, presets with ground-truth tampered regions, synthetic tampering generator (so evaluators can tamper with an image live in the browser and immediately test detection), and downloadable PDF/JSON forensic reports.

---

## 2. Core DIP Forensic Pipeline (The 7 Detection Layers)

Every uploaded image passes through a deterministic 7-stage DIP pipeline. Each layer targets a specific physical or mathematical artifact left behind by image manipulation:

```
[Input Image (RGB)]
        │
        ├──► Layer 1: Error Level Analysis (ELA) & Multi-Quality JPEG Ghosting
        │      └─ Color space RGB→YCbCr, 8×8 2D-DCT quantization residuals, gamma-enhanced difference map
        │
        ├──► Layer 2: Noise Variance & Wavelet Residual Inconsistency (PRNU Approximation)
        │      └─ 2D Discrete Wavelet Transform (Haar/db4) HH sub-band + Adaptive Wiener Filter residual
        │         + Local Mahalanobis / Z-score variance map across sliding 32×32 blocks
        │
        ├──► Layer 3: Copy-Move Forgery Detection (Clone Detection)
        │      └─ Keypoint pipeline (ORB/SIFT + RANSAC homography) + Dense overlapping block DCT/PCA
        │         lexicographical sorting + Euclidean offset clustering (catches uniform cloned regions)
        │
        ├──► Layer 4: Resampling & Interpolation Periodic Artifact Detection (2D-DFT Spectrum)
        │      └─ 2nd-order Laplacian derivative map → Radon / 2D Fast Fourier Transform (FFT) magnitude
        │         spectrum peak detection (identifies rotated/scaled spliced regions)
        │
        ├──► Layer 5: Double JPEG Quantization (Blocking Grid & Histogram Periodicity)
        │      └─ 8×8 DCT coefficient histogram comb-filter periodicity + misaligned 8×8 block artifact grid
        │         detection (flags when a cropped region was saved at Q1 then re-saved at Q2)
        │
        ├──► Layer 6: Chromatic Aberration & Lighting/Edge Gradient Consistency
        │      └─ Red-to-Blue / Green-to-Blue channel radial shift estimation + Sobel/Scharr gradient
        │         direction vector along object boundaries
        │
        └──► Layer 7: Metadata, Quantization Table & Hex Structure Forensics
               └─ EXIF/XMP tag verification, JPEG DQT (Quantization Table) fingerprinting against known
                  camera/Phone/Photoshop/GIMP tables, thumbnail vs. main image perceptual hash (pHash) diff
        │
        ▼
[Composite Fusion & Morphological Localization Engine]
        └─ Weighted pixel-wise heatmap fusion → Otsu adaptive thresholding → Morphological Opening/Closing
           (structuring element 5×5) → Connected Component Labeling → Bounding boxes + 0–100 Tamper Score
```

### Syllabus Mapping Table (For Project Report & Viva Defense)

| DIP Syllabus Unit | Mathematical / Algorithmic Concept Used in PixelProof | Where It Appears |
|---|---|---|
| **1. Digital Image Fundamentals & Color Spaces** | RGB to $\text{YCbCr}$ conversion ($Y$ luminance vs $Cb, Cr$ chrominance subsampling 4:2:0 / 4:4:4), radial chromatic shift | Layer 1 (ELA), Layer 6 (Chromatic Aberration) |
| **2. Spatial Domain Filtering & Enhancement** | Sobel, Scharr, and 2nd-order Laplacian kernels ($\nabla^2 f$), Adaptive Wiener denoising filter, CLAHE / Gamma contrast stretching | Layer 2 (Noise extraction), Layer 4 (Resampling), Heatmap post-processing |
| **3. Frequency Domain Processing** | 2D Fast Fourier Transform ($\text{FFT2}$), Power Spectrum density, 2D Discrete Cosine Transform ($\text{DCT}$), Quantization matrices | Layer 1 (JPEG compression), Layer 4 (FFT periodic peaks), Layer 5 (DCT histograms) |
| **4. Wavelet & Multiresolution Processing** | 2D Discrete Wavelet Transform ($\text{DWT}$ — Haar / Daubechies `db4`), sub-band decomposition ($LL, LH, HL, HH$), MAD noise estimation $\hat{\sigma} = \frac{\text{median}(|HH_1|)}{0.6745}$ | Layer 2 (Local noise level map) |
| **5. Image Compression** | JPEG coding pipeline, Zig-Zag scanning, quantization table (DQT) fingerprinting, blocking artifacts, JPEG Ghosts | Layer 1, Layer 5, Layer 7 |
| **6. Morphological Image Processing** | Erosion ($\ominus$), Dilation ($\oplus$), Opening ($A \circ B$), Closing ($A \bullet B$) to eliminate isolated noise specks and bridge forged region masks | Post-processing & Localization Mask Generator |
| **7. Image Segmentation & Representation** | Otsu's global/local thresholding, Connected Component Analysis (8-connectivity), Contour extraction, Keypoint descriptors (ORB/SIFT) & RANSAC | Layer 3 (Copy-Move), Final Tamper Region Bounding Boxes |

---

## 3. Product Features (What Users & Evaluators Experience)

1. **Multi-Layer Forensic Workbench UI**
   - Upload any JPEG/PNG/WebP image or pick from **6 curated forensic benchmark cases** (Splicing, Copy-Move Cloning, Retouching/Inpainting, Rescaled Composite, Double-Compressed Crop, Authentic Unmodified Camera RAW/JPEG).
   - View modes: **Side-by-Side Split Slider**, **Overlay Heatmap (adjustable opacity + colormap: Inferno / Viridis / Jet)**, **Synchronized Magnifier Loupe (8× pixel grid inspection)**, and **3D Frequency Surface Plot**.

2. **Interactive Parameter Tuning (DIP Lab Mode)**
   - Live sliders for **ELA JPEG Quality ($Q \in [50, 99]$)**, **Multiplicative Gain ($\gamma$)**, **Wavelet Basis (`haar`, `db2`, `db4`)**, **Block Size ($8\times8$, $16\times16$, $32\times32$)**, **Copy-Move Similarity Threshold**, and **Morphological Kernel Size**.
   - Every slider shows the mathematical formula being applied in a collapsible **"DIP Math & Theory Inspector"** drawer — huge bonus during viva demonstrations.

3. **Live "Tamper Sandbox" (Self-Attack & Verify Mode)**
   - Built-in canvas tool where the professor/recruiter can take a clean image, **clone a region (copy-move)**, **paste an object from another image (splice)**, or **apply Gaussian blur / healing brush**, re-compress it, and immediately run PixelProof to watch the algorithms catch their exact edit in real time.

4. **Explainable Verdict & Audit Trail**
   - Produces a **0–100 Tamper Probability Score** broken down by individual layer weights, a binary/segmented **Tamper Localization Mask** with bounding boxes, and plain-English forensic findings (e.g., *"Region [x: 412, y: 180, w: 140, h: 115] exhibits a 3.4σ noise variance deviation in the DWT HH1 sub-band and misaligned 8×8 DCT blocking grid"*).
   - One-click **Export Forensic Dossier (JSON / Printable PDF Report)** containing all 7 intermediate filter outputs, histograms, and metadata tables.

5. **Academic Benchmark & Evaluation Suite (`scripts/evaluate_benchmark.py`)**
   - CLI benchmark script that evaluates the pipeline on a subset of standard datasets (**CASIA v2.0 / CoMoFoD / Columbia Uncompressed Image Splicing**) and computes **Precision, Recall, Pixel-level $F_1$-Score, IoU (Intersection over Union), and ROC-AUC curves** — ready to paste directly into your 4th-year B.Tech project report and IEEE-format paper.

---

## 4. System Architecture & Tech Stack

Aligned with your portfolio ecosystem (`Next.js 16` + `FastAPI` on `Vercel` + `Render`):

| Layer | Technology | Why It Fits |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS 4, Framer Motion | Fast, responsive forensic UI, HTML5 Canvas pixel loupe, split-slider, interactive histograms |
| **Backend API** | Python 3.12, FastAPI, Uvicorn, Pydantic v2 | Native access to scientific DIP libraries with automatic OpenAPI/Swagger docs (`/docs`) |
| **DIP & Math Engine** | `opencv-python-headless`, `numpy`, `scipy` (2D-DCT, 2D-FFT, Wiener filter, spatial distance), `PyWavelets` (`pywt`), `scikit-image` (Otsu, morphology, RANSAC, SSIM), `Pillow` / `exifread` | Pure, deterministic mathematical image processing — fast on CPU (< 1.5s per 1080p image), zero GPU required |
| **Storage / State** | Stateless in-memory processing (`io.BytesIO` + Base64/WebP buffers) + optional client `IndexedDB` history | Zero database cost, zero privacy risk, instant horizontal scaling (same philosophy as `Verity`) |
| **Hosting** | **Vercel** (`pixelproof.tanisheesh.in`) + **Render** (`pixelproof-api.onrender.com`) | Matches `setup-toolkit` subdomain & deployment automation |

---

## 5. Repository Structure (Compliant with `setup-toolkit`)

```text
PixelProof/
├── frontend/                          # Next.js 16 App Router (TypeScript + Tailwind CSS 4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Main Forensic Workbench + Landing
│   │   │   └── sandbox/page.tsx       # Live Tamper Sandbox (create forgery & test)
│   │   ├── components/
│   │   │   ├── workbench/
│   │   │   │   ├── ImageStage.tsx     # Split-view, Loupe 8x zoom, Bounding Box overlay
│   │   │   │   ├── LayerSelector.tsx  # Switch between the 7 DIP layers
│   │   │   │   ├── DipMathDrawer.tsx  # Viva/Educational panel: formulas, kernels, histograms
│   │   │   │   ├── ParameterPanel.tsx # Real-time sliders for Q-factor, wavelet, morphology
│   │   │   │   ├── VerdictCard.tsx    # 0-100 score, confidence, plain-English evidence list
│   │   │   │   └── MetadataTable.tsx  # EXIF, DQT quantization matrix diff, pHash diff
│   │   │   ├── sandbox/
│   │   │   │   └── TamperCanvas.tsx   # Interactive Copy-Move / Splice / Blur generator
│   │   │   └── PresetGallery.tsx      # 6 built-in benchmark cases with ground-truth masks
│   │   └── lib/
│   │       ├── api.ts                 # Typed FastAPI client + fallback client-side ELA
│   │       └── types.ts               # ForensicReport, LayerResult, BoundingBox schemas
│   ├── public/
│   │   └── presets/                   # Authentic + Tampered + Ground Truth Masks
│   └── package.json
│
├── backend/                           # Python 3.12 + FastAPI DIP Engine
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, rate-limiting, Swagger UI
│   │   ├── api/
│   │   │   └── routes.py              # POST /api/analyze, POST /api/analyze/layer, GET /api/presets
│   │   ├── core/
│   │   │   ├── config.py              # Image size caps, default thresholds
│   │   │   └── schemas.py             # Pydantic v2 response models
│   │   ├── dip/                       # <--- THE CORE DIP ENGINE (7 MODULES)
│   │   │   ├── preprocessing.py       # Color space conversions (RGB, YCbCr, Grayscale), resizing
│   │   │   ├── ela.py                 # Layer 1: Multi-Q Error Level Analysis & JPEG Ghosting
│   │   │   ├── noise_wavelet.py       # Layer 2: DWT (Haar/db4) HH sub-band + Wiener filter local variance
│   │   │   ├── copy_move.py           # Layer 3: ORB/SIFT + RANSAC & Block-DCT lexicographic matching
│   │   │   ├── resampling_fft.py      # Layer 4: 2nd-order Laplacian + 2D-FFT spectrum periodicity
│   │   │   ├── double_jpeg.py         # Layer 5: 8x8 DCT coefficient histogram + blocking grid shift
│   │   │   ├── edge_chromatic.py      # Layer 6: Lateral chromatic aberration + Sobel/Scharr edge consistency
│   │   │   ├── metadata_dqt.py        # Layer 7: EXIF, JPEG Quantization Table (DQT) & Thumbnail pHash
│   │   │   └── fusion_morphology.py   # Multi-layer weighted fusion, Otsu, Opening/Closing, Connected Components
│   │   └── utils/
│   │       └── encoding.py            # NumPy array → Base64 WebP/PNG heatmap colormaps
│   ├── scripts/
│   │   ├── generate_samples.py        # Deterministically generates tampered test cases + ground truth masks
│   │   └── evaluate_benchmark.py      # Computes Precision, Recall, F1, IoU for academic report
│   ├── tests/
│   │   ├── test_dip_layers.py         # Unit tests for all 7 DIP algorithms (synthetic tampered arrays)
│   │   └── test_api.py                # FastAPI endpoint integration tests
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                              # From ../setup-toolkit/repo-template/docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── SETUP.md
│   └── DEPLOY.md
│
├── .github/                           # From ../setup-toolkit/repo-template/.github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml                 # Configured for both npm (/frontend) and pip (/backend)
│   └── workflows/
│       ├── ci.yml                     # Runs frontend lint/typecheck/build + backend pytest
│       ├── dependabot-auto-merge.yml
│       └── maintenance-report.yml
│
├── .editorconfig
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── README.md
├── SECURITY.md
└── plan.md                            # This master plan
```

---

## 6. Deep-Dive: How Each DIP Algorithm Will Be Implemented

### 6.1 Layer 1 — Error Level Analysis (ELA) & JPEG Ghost Detection (`dip/ela.py`)
1. Convert input image $I(x,y)$ to RGB and re-encode into memory via JPEG at quality levels $Q \in \{75, 85, 90, 95\}$ using `cv2.imencode`.
2. Compute absolute pixel-wise residual in $\text{YCbCr}$ space (separating luminance $Y$ from chrominance $Cb, Cr$, since JPEG applies 4:2:0 chroma subsampling):
   $$E_Q(x,y) = |I(x,y) - \text{JPEG}_Q(I(x,y))|$$
3. Normalize and apply non-linear gamma enhancement ($E_{\text{vis}} = 255 \cdot (E_Q / \max(E_Q))^{1/\gamma}$) and false-color mapping (`cv2.COLORMAP_INFERNO`).
4. **JPEG Ghost Detection:** Sweep $Q$ from $60 \to 98$ in steps of $5$; compute local block variance difference to find local minima ("ghosts") where a spliced region was previously compressed at a lower quality $Q_1 < Q_2$.

### 6.2 Layer 2 — Wavelet Noise Residual & Wiener Variance Consistency (`dip/noise_wavelet.py`)
1. Different cameras, sensors, or AI inpainting tools leave distinct high-frequency noise signatures.
2. Apply 1-level 2D Discrete Wavelet Transform (`pywt.dwt2(gray, 'db4')`) to extract the diagonal high-frequency sub-band $HH_1$.
3. Also compute spatial noise residual via an **Adaptive Wiener Filter** (`scipy.signal.wiener(gray, (5, 5))`):
   $$R(x,y) = I_{\text{gray}}(x,y) - \text{Wiener}(I_{\text{gray}}(x,y))$$
4. Partition $HH_1$ and $R(x,y)$ into overlapping $32 \times 32$ blocks (stride $16$). Skip saturated/flat blocks using gradient magnitude thresholds.
5. Estimate local noise standard deviation per block using the robust Median Absolute Deviation (MAD) estimator:
   $$\hat{\sigma}_{b} = \frac{\text{median}(|HH_{1,b} - \text{median}(HH_{1,b})|)}{0.6745}$$
6. Compute the Z-score anomaly map of $\hat{\sigma}_b$ relative to the global median noise profile. Spliced or blurred/airbrushed regions light up with $|Z| > 2.5$.

### 6.3 Layer 3 — Copy-Move (Clone) Forgery Detection (`dip/copy_move.py`)
Combines **two classic DIP approaches** so both textured and smooth cloned regions are caught:
1. **Keypoint-based (Geometric Invariant):**
   - Extract ORB + SIFT features across the image.
   - Perform k-NN descriptor matching ($k=2$) with Lowe's ratio test ($< 0.75$) and a minimum spatial distance constraint $\|p_i - p_j\|_2 > 24\text{ px}$ (ignoring self-matches).
   - Apply **DBSCAN / Agglomerative Spatial Clustering** and **RANSAC Affine/Homography estimation** to filter false matches and draw vector arrows connecting source regions to cloned target regions.
2. **Dense Block-DCT Matching (Catches smooth clones like sky/walls covering an object):**
   - Slide a $16 \times 16$ window over the luminance channel, compute the 2D-DCT of each block, keep the top-left $4 \times 4$ low-frequency zig-zag coefficients, and **lexicographically sort** the rows.
   - Compare adjacent rows in sorted order; find pairs with identical shift vectors $(\Delta x, \Delta y)$ occurring above a frequency threshold.

### 6.4 Layer 4 — Resampling & Interpolation Spectrum Analysis (`dip/resampling_fft.py`)
1. When a spliced object is resized or rotated (bicubic/bilinear interpolation), periodic correlations are introduced between neighboring pixels.
2. Convolve the image with a 2nd-order isotropic **Laplacian high-pass kernel**:
   $$K = \begin{bmatrix} 0 & -1 & 0 \\ -1 & 4 & -1 \\ 0 & -1 & 0 \end{bmatrix}$$
3. Compute the local variance of the residual and take the **2D Fast Fourier Transform ($\text{FFT2}$)** with Hanning windowing and zero-frequency shift (`np.fft.fftshift`).
4. Detect abnormal secondary spectral peaks in the high-frequency ring of the log-magnitude spectrum $M(u,v) = \log(1 + |\mathcal{F}(u,v)|)$, which indicate resampling periodicity.

### 6.5 Layer 5 — Double JPEG Compression & 8×8 Blocking Grid (`dip/double_jpeg.py`)
1. Divide the luminance channel into non-overlapping $8 \times 8$ blocks and compute the 2D-DCT.
2. Build histograms of selected AC coefficients (e.g., $(0,1), (1,0), (1,1)$). Single-compressed images follow a smooth Generalized Gaussian / Laplacian distribution; double-compressed images exhibit periodic zero-bins or double peaks (comb effect), detected via FFT of the histogram itself.
3. **Block Grid Alignment Map:** Measure horizontal and vertical pixel discontinuities at $(x \bmod 8, y \bmod 8)$ offsets. If a spliced patch was pasted at coordinates not divisible by 8, its local $8 \times 8$ blocking grid is out of phase with the background grid.

### 6.6 Layer 6 — Chromatic Aberration & Edge Gradient Forensics (`dip/edge_chromatic.py`)
1. Real camera lenses refract Red, Green, and Blue wavelengths slightly differently toward image edges (Lateral Chromatic Aberration).
2. Compute Sobel/Scharr edge gradients $(\nabla_x, \nabla_y)$ separately on $R, G, B$ channels.
3. Measure sub-pixel cross-correlation alignment between $|\nabla R|$ and $|\nabla B|$ in radial patches, plus abnormal high-frequency step edges along suspected splice boundaries where feathering or hard masking occurred.

### 6.7 Layer 7 — EXIF, JPEG Quantization Table (DQT) & Thumbnail Forensics (`dip/metadata_dqt.py`)
1. Parse EXIF/XMP metadata for software tags (`Adobe Photoshop`, `GIMP`, `Lightroom`, `Canva`, `Stable Diffusion`, `C2PA`).
2. Extract raw JPEG **Luminance ($Y$) and Chrominance ($CbCr$) $8\times8$ Quantization Tables (DQT)** and compare against standard IJG quality curves and editing software signatures.
3. Extract embedded EXIF thumbnail (if present), resize the main image to match, and compute **Structural Similarity Index (SSIM)** and **Perceptual Hash (pHash)** distance — immediately catching edits where the main image was altered but the original camera thumbnail remained embedded.

### 6.8 Morphological Fusion & Region Localization (`dip/fusion_morphology.py`)
1. Combine normalized spatial maps from Layers 1, 2, 3, 5, and 6:
   $$H_{\text{fused}}(x,y) = \sum_{k} w_k \cdot \tilde{H}_k(x,y)$$
2. Apply Gaussian smoothing ($\sigma = 2.0$) followed by **Otsu's Adaptive Thresholding** to binarize high-suspicion zones.
3. Apply **Morphological Opening** ($\text{erode} \to \text{dilate}$ with $5\times5$ elliptical structuring element) to eliminate isolated salt noise, followed by **Morphological Closing** ($\text{dilate} \to \text{erode}$ with $9\times9$ kernel) to merge fragmented regions.
4. Run `cv2.connectedComponentsWithStats` to extract bounding boxes $(x, y, w, h)$, area percentages, and per-region anomaly confidence scores.

---

## 7. Execution Phases (Step-by-Step Build Roadmap)

### Phase 1 — Backend DIP Engine & Synthetic Benchmark Generator
1. Scaffold `backend/` with FastAPI, `opencv-python-headless`, `numpy`, `scipy`, `PyWavelets`, `scikit-image`, `Pillow`, and `pytest`.
2. Implement all 7 DIP modules inside `backend/app/dip/` with clean docstrings, mathematical formulas, and type hints.
3. Build `backend/scripts/generate_samples.py` to programmatically generate 6 realistic test pairs (Authentic + Forged + Ground Truth Mask) covering Copy-Move, Splicing, Airbrushing/Blur, Resampling, and Double JPEG compression.
4. Write `backend/scripts/evaluate_benchmark.py` and `backend/tests/test_dip_layers.py` to verify accuracy (IoU, $F_1$, Precision/Recall) and ensure every algorithm runs in `< 1.5s`.

### Phase 2 — Frontend Forensic Workbench & Interactive DIP Lab
1. Scaffold `frontend/` with Next.js 16 (App Router, TypeScript, Tailwind CSS 4, Lucide icons).
2. Design a dark, industrial forensic analyst interface (`#090A0F` obsidian background, `#10B981` emerald authentic / `#F43F5E` crimson tamper alert / `#06B6D4` cyan frequency inspection).
3. Build the **Interactive Image Stage**:
   - Original vs. Heatmap Split-Screen Slider
   - 8× Pixel Loupe Magnifier (inspects raw RGB & DCT block boundaries under cursor)
   - Toggleable Bounding Boxes & Copy-Move Clone Vectors
4. Build the **7-Layer Switcher**, **Real-time DIP Parameter Sliders**, and the **"DIP Theory & Math Inspector"** panel (shows the exact equations, convolution kernels, and histograms for the active layer).
5. Build the **Live Tamper Sandbox** (`/sandbox`) so anyone testing the app can clone/splice/blur a photo right in the browser and immediately run the detector on their own forgery.
6. Build the **Printable Forensic Report Export** (clean PDF/print view + JSON download).

### Phase 3 — `setup-toolkit` Standardization, Docs & CI/CD
Follow `../setup-toolkit/AGENTS.md` strictly:
1. Generate and populate all standard repository files from `../setup-toolkit/repo-template/`:
   - `README.md` (recruiter-first, SVG logo, badges, Engineering Decisions, Docs table, Tanish Poddar footer)
   - `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SETUP.md`, `docs/DEPLOY.md`
   - `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.editorconfig`, `.gitignore`
   - `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*`, `.github/dependabot.yml` (npm + pip), and `.github/workflows/ci.yml`, `dependabot-auto-merge.yml`, `maintenance-report.yml`
2. Run all CI checks locally (`pytest`, `npm run lint`, `npm run build`) to ensure 100% pass rate.
3. Make atomic commits using `../setup-toolkit/guidelines/commit-style.md` (`✨`, `📚`, `🔨`, `👷`, `🧪`).
4. Configure GitHub repo metadata and `pixelproof.tanisheesh.in` subdomain once you confirm deployment details.

---

## 8. Key Engineering Decisions (For `DECISIONS.md` & Interviews)

1. **Why classical Digital Image Processing (DCT, DWT, FFT, Wiener, Morphology) over a Deep Learning CNN (e.g., ManTra-Net / CAT-Net)?**
   - **Explainability & Auditability:** Every flagged region in PixelProof traces directly to a physical signal anomaly (e.g., $3.4\sigma$ wavelet HH1 noise deviation, misaligned $8\times8$ DCT grid, or RANSAC keypoint homography). Black-box CNNs hallucinate on out-of-distribution compression levels and cannot explain *why* a pixel was flagged.
   - **Zero GPU Cost & Sub-2s Latency:** Runs entirely on standard CPU using vectorized NumPy/SciPy operations in `< 1.5s`, deployable on free/low-cost serverless or container instances without 4GB PyTorch weights.
   - **Academic Alignment:** Directly demonstrates mastery of core 4th-year DIP syllabus concepts rather than calling `model.predict()`.

2. **Why Hybrid Copy-Move Detection (Keypoint ORB/SIFT + Dense Block-DCT)?**
   - Keypoint detectors (SIFT/ORB) are invariant to rotation and scaling but fail completely when a forger clones a smooth, low-texture region (like grass, water, or a wall) to hide an object. Dense $16\times16$ Block-DCT lexicographical sorting catches uniform/smooth clones, while ORB+RANSAC catches rotated/scaled clones. Combining both eliminates each method's blind spot.

3. **Why Wavelet ($HH_1$) + Adaptive Wiener Residual over simple global variance for Noise Analysis?**
   - Natural images have high spatial variance along object edges, which causes naive sliding-window variance detectors to false-positive on every sharp edge. Extracting the $HH_1$ diagonal wavelet sub-band and suppressing high-gradient edge pixels isolates sensor/compression noise from structural scene content.

---

## 9. Confirmation Checklist Before We Start Building

Before I begin scaffolding the project and applying `../setup-toolkit/AGENTS.md`, let me know if you want to tweak anything or confirm these values for the toolkit setup:

1. **Project Name:** `PixelProof` (confirmed from folder name)
2. **Subdomain (for later deployment):** `pixelproof.tanisheesh.in`?
3. **Brand Color:** `#06B6D4` (Forensic Cyan) or `#10B981` (Signal Emerald)?
4. **Scope Check:** Should I start building **Phase 1 (Backend DIP Engine + Tests + Sample Presets)** and **Phase 2 (Next.js Forensic Workbench + Tamper Sandbox)** right away as soon as you approve this plan?

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
