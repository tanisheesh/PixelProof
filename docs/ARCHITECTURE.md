# PixelProof — Architecture

---

## 1. Stack

| Layer | Tech |
|---|---|
| Frontend Framework | Next.js 16.2 (App Router, TypeScript 5, React 19) |
| Styling & Icons | Tailwind CSS 4 · Lucide React |
| Backend Framework | Python 3.12+ · FastAPI · Uvicorn · Pydantic v2 |
| DIP & Scientific Compute | OpenCV (`opencv-python-headless`) · NumPy · SciPy · PyWavelets (`pywt`) · Pillow |
| Client Resilience Layer | HTML5 Canvas 2D `ImageData` DIP Fallback Engine |
| Hosting | Vercel (frontend) · Render / Docker (backend API) |

---

## 2. Components

```text
PixelProof/
  backend/
    app/
      api/routes.py             FastAPI endpoints (/api/analyze, /api/presets, /api/health)
      core/schemas.py           Pydantic v2 contracts for reports, layers, boxes, and math metadata
      dip/
        preprocessing.py        Image decoding, aspect-ratio capping, ITU-R BT.601 YCbCr conversion
        ela.py                  Layer 1: Edge-normalized ELA + Multi-quality JPEG Ghost sweep
        noise_wavelet.py        Layer 2: 2D-DWT (Haar/db2/db4) HH1 MAD noise + Adaptive Wiener filter
        copy_move.py            Layer 3: 16x16 2D-DCT lexicographical sorting + ORB keypoint matching
        resampling_fft.py       Layer 4: 3x3 Laplacian high-pass residual + 2D-FFT log-spectrum peaks
        double_jpeg.py          Layer 5: 8x8 Blocking Artifact Grid (BAG) phase + AC DCT comb FFT
        edge_chromatic.py       Layer 6: 3x3 Scharr R/G/B gradient divergence + vector collinearity
        metadata_dqt.py         Layer 7: EXIF software inspection + 8x8 Luminance DQT fingerprinting
        fusion_morphology.py    Weighted spatial fusion, Otsu threshold, Opening/Closing, 8-connectivity
        pipeline.py             Master orchestrator combining all 7 layers into a ForensicReport
        presets_generator.py    Deterministic synthetic benchmark generator (6 ground-truth cases)
      utils/encoding.py         Percentile normalization, OpenCV colormaps, 32-bin histograms, Base64 PNG
  frontend/
    src/
      app/page.tsx              Main Forensic Workbench, Syllabus Drawer, and Sandbox controller
      components/workbench/     ImageStage, LayerSelector, DipMathDrawer, ParameterPanel, VerdictCard
      components/sandbox/       TamperCanvas (interactive browser forgery generator)
      lib/api.ts                Typed FastAPI client with automatic browser DIP fallback
      lib/client-dip-fallback.ts In-browser HTML5 Canvas DIP implementation
```

### FastAPI DIP Engine (`backend/app/dip/`)

Receives raw image bytes and user-tunable DIP parameters, decodes the image into an RGB NumPy array capped at `768 px` on the longest edge, and executes all seven signal-processing modules sequentially in memory. Each module returns a structured `LayerResult` (containing its 0–100 anomaly score, Base64 false-color heatmap, 32-bin histogram, quantitative telemetry, and governing LaTeX formula) plus a normalized `[0, 1]` floating-point spatial anomaly array for the fusion stage.

### Morphological Fusion & Localization (`backend/app/dip/fusion_morphology.py`)

Combines the six spatial anomaly maps using dynamic layer boosting, applies Gaussian smoothing ($\sigma = 3.0$), computes Otsu's global threshold bounded by an 88th-percentile floor, and cleans the binary mask with elliptical Morphological Opening ($A \circ B_1$) and Closing ($A \bullet B_2$). Finally, it runs 8-connected component labeling (`cv2.connectedComponentsWithStats`) to extract bounding boxes and attributes each box to the DIP layer with the highest regional activation.

### Next.js Forensic Workbench (`frontend/src/`)

Renders the interactive inspection stage (split-screen comparison, alpha blend, 8×8 DCT grid overlay, SVG bounding boxes, copy-move displacement vectors, and synchronized 5× dual magnifier loupe), the 7-layer switcher, the DIP Math & Theory Drawer, and the Live Tamper Sandbox.

---

## 3. Data Flow

```text
[User Uploads Image or Picks Preset / Sandbox Forgery]
        │
        ▼
[Next.js Frontend (lib/api.ts)]
        │  POST /api/analyze (multipart/form-data: image + AnalysisParams)
        ▼
[FastAPI Router (app/api/routes.py)]
        │  Validates size (<= 15 MB) & Pydantic AnalysisParams
        ▼
[DIP Preprocessing (dip/preprocessing.py)]
        │  cv2.imdecode -> RGB uint8 + ITU-R BT.601 Luminance Y
        ├──► Layer 1 (ela.py)            -> YCbCr JPEG re-compression + Ghost sweep
        ├──► Layer 2 (noise_wavelet.py)  -> pywt.dwt2 HH1 MAD + Adaptive Wiener residual
        ├──► Layer 3 (copy_move.py)      -> 16x16 2D-DCT lexsort + ORB shift clustering
        ├──► Layer 4 (resampling_fft.py) -> 3x3 Laplacian + 2D-FFT annular ring peak Z
        ├──► Layer 5 (double_jpeg.py)    -> 8x8 BAG phase mismatch + AC DCT comb FFT
        ├──► Layer 6 (edge_chromatic.py) -> 3x3 Scharr R/G/B gradient divergence
        └──► Layer 7 (metadata_dqt.py)   -> EXIF Software + 8x8 Luminance DQT match
        │
        ▼
[Morphological Fusion Engine (dip/fusion_morphology.py)]
        │  Weighted spatial sum -> Otsu threshold -> Morph Open/Close -> Connected Components
        ▼
[ForensicReport JSON Response]
        │  Base64 PNG heatmaps, 32-bin histograms, bounding boxes, clone vectors, math formulas
        ▼
[Interactive Workbench UI]
```

1. **Trigger:** The user selects one of the 6 benchmark presets, uploads an image file, or clicks "Analyze Forgery" inside the Live Tamper Sandbox.
2. **Preprocessing:** The backend decodes the image buffer into an RGB matrix and extracts the floating-point luminance channel $Y = 0.299R + 0.587G + 0.114B$.
3. **7-Layer Execution:** Each DIP module computes its mathematical transform, normalizes its spatial residual map to `[0, 255]` with 99th-percentile clipping, applies the selected false-color LUT (`inferno`, `viridis`, `jet`, `hot`), and encodes the heatmap as a Base64 PNG data URL.
4. **Fusion & Segmentation:** Spatial maps are fused, thresholded via Otsu, cleaned via morphological opening/closing, and segmented into connected-component bounding boxes.
5. **Render:** The Next.js UI renders the split-screen stage, bounding boxes, clone displacement vectors, and mathematical telemetry.

---

## 4. Stateless Processing Design

PixelProof is intentionally **stateless** and uses no database:

- Uploaded images are processed strictly in RAM (`io.BytesIO` and NumPy arrays) and garbage-collected immediately after the HTTP response is returned.
- The 6 built-in benchmark cases are deterministically synthesized in memory on startup (`presets_generator.py`) and cached in a process singleton, requiring zero external object storage or database migrations.

---

## 5. API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service health status, version, and active layer count (`7`) |
| `GET` | `/api/presets` | Returns the 6 built-in forensic benchmark cases with ground-truth metadata and previews |
| `POST` | `/api/analyze/preset/{preset_id}` | Runs the 7-layer DIP pipeline on a built-in preset with custom `AnalysisParams` |
| `POST` | `/api/analyze` | Accepts a `multipart/form-data` image upload and DIP tuning parameters, returning a `ForensicReport` |

---

## 6. Security

- **Stateless zero-retention processing:** Uploaded files are never written to disk or external storage, eliminating data-breach exposure for sensitive images.
- **Upload size enforcement:** `routes.py` enforces a strict `15 MB` cap (`max_upload_bytes`) before decoding.
- **Safe buffer decoding:** Images are decoded via `cv2.imdecode` on bounded memory buffers and aspect-scaled to `max_dim = 768` px to prevent decompression-bomb (zip-bomb/pixel-flood) memory exhaustion.
- **Strict schema validation:** All tuning parameters (`ela_quality`, `ela_scale`, `wavelet_family`, `noise_block_size`, `copy_move_threshold`, `morph_kernel_size`, `colormap`) are validated with Pydantic v2 range and literal constraints.

---

## 7. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| FastAPI backend unreachable or cold-starting | Frontend (`lib/api.ts`) catches the timeout and seamlessly executes the in-browser HTML5 Canvas DIP pipeline (`client-dip-fallback.ts`) |
| Corrupted or non-image file uploaded | `decode_image_bytes` raises `ValueError`, returning a clean `400 Bad Request` JSON message |
| Image exceeds 15 MB | API immediately returns `413 Payload Too Large` before allocating NumPy buffers |
| Zero-variance flat image patch in Wiener filter | `_adaptive_wiener_residual` clamps local variance denominator to `1e-4`, preventing division-by-zero NaNs |

---

## 8. Deployment

1. **Frontend (Vercel):** Connected to `tanisheesh/PixelProof` with Root Directory set to `frontend`. Auto-deploys on every push to `main` and serves `https://pixelproof.tanisheesh.in`.
2. **Backend (Render / Docker):** Connected to `tanisheesh/PixelProof` with Root Directory set to `backend` (or built via `backend/Dockerfile`), running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. **Environment Variables:** `NEXT_PUBLIC_API_URL` on Vercel points to the Render FastAPI URL; `CORS_ORIGINS` on Render allows requests from `https://pixelproof.tanisheesh.in`.

---

## 9. Explicit Scope Cuts

- **Deep neural network weights:** Omitted to guarantee 100% mathematical explainability, sub-1.5s CPU execution, and zero GPU hosting cost.
- **User accounts & database history:** Omitted so anyone can test images or use the Tamper Sandbox immediately with zero login friction.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hey%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
