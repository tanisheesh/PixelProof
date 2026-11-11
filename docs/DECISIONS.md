# Engineering Decisions — PixelProof

---

## Decision 1 — Classical Digital Image Processing (DCT, DWT, 2D-FFT, Wiener, Morphology) over Deep Learning CNNs

**Context:** Image forgery detection can be approached either via pre-trained deep neural networks (e.g., ManTra-Net, CAT-Net) or via classical signal and frequency-domain Digital Image Processing algorithms.

**Decision:** Build a 7-layer deterministic Digital Image Processing pipeline combining YCbCr Error Level Analysis, 2D Discrete Wavelet Transform (`db4`/`haar`) MAD noise estimation, Adaptive Wiener filtering, 2D-DCT lexicographical block matching, 2nd-order Laplacian + 2D-FFT spectral analysis, 8×8 blocking grid alignment, Scharr chromatic gradient divergence, and Otsu + Morphological localization.

**Reason:** Black-box CNNs cannot explain *why* a pixel was flagged, generalize poorly when an image is re-compressed at an unseen quality factor, and require multi-gigabyte GPU containers. Classical DIP makes every verdict 100% mathematically auditable (tracing directly to a $\sigma$ noise deviation, DCT comb harmonic, or shift vector) and executes in `< 1.2s` on a single CPU core.

**Tradeoff:** Classical DIP requires careful normalization against natural scene edges (such as Sobel gradient suppression in ELA and wavelet noise estimation) so high-contrast natural textures do not trigger false positives.

---

## Decision 2 — Hybrid Copy-Move Detection (16×16 Block 2D-DCT Lexicographical Sorting + ORB Keypoints)

**Context:** Internal cloning (copy-move forgery) shares the exact same camera sensor noise, illumination, and JPEG compression history as the background, making it invisible to ELA and noise-variance layers.

**Decision:** Combine dense overlapping $16\times16$ 2D-DCT lexicographical block sorting (`np.lexsort` on quantized low-frequency DCT coefficients) with ORB binary keypoint matching and 2D shift-vector $(\Delta x, \Delta y)$ histogram clustering.

**Reason:** Keypoint detectors (ORB/SIFT) are fast and rotation-invariant on textured objects, but extract zero keypoints on smooth or low-contrast cloned regions (such as sky, foliage, or walls used to cover an object). Conversely, dense block-DCT matching catches smooth translational clones in $O(N \log N)$ time without brute-force $O(N^2)$ block comparisons. Running both in Layer 3 eliminates each method's blind spot.

**Tradeoff:** Lexicographical block-DCT sorting is sensitive to large rotations ($> 15^\circ$), which are instead covered by the ORB keypoint branch and Layer 4's 2D-FFT resampling detector.

---

## Decision 3 — Edge-Suppressed 2D-DWT ($HH_1$) + Adaptive Wiener Residual for Local Noise Estimation

**Context:** Spliced objects from a second camera and regions smoothed with a healing brush or Gaussian blur alter the local sensor noise floor, but naive sliding-window variance estimators mistake sharp scene edges for high noise.

**Decision:** Extract the diagonal high-frequency wavelet sub-band ($HH_1$) via `pywt.dwt2`, combine it with a $5\times5$ spatial Adaptive Wiener filter residual, mask out the top 15% highest Sobel gradient pixels inside each sliding $32\times32$ window, and estimate local noise via Donoho's robust Median Absolute Deviation ($\hat{\sigma}_b = \text{median}(|HH_{1,b}|)/0.6745$).

**Reason:** The median-based MAD estimator on edge-masked $HH_1$ wavelet coefficients is statistically robust against up to 50% outlier edge pixels within a block, isolating true high-frequency sensor and quantization noise from structural edges.

**Tradeoff:** Requires a minimum block size of $16\times16$ to $32\times32$ pixels to gather enough non-edge samples for a stable median estimate.

---

## Decision 4 — Dual-Engine Resilience (FastAPI Scientific Backend + Client-Side Canvas DIP Fallback)

**Context:** Free/low-cost cloud container hosts (such as Render) spin down after inactivity and can take 20–40 seconds to cold-start when a user or reviewer first opens the live demo link.

**Decision:** Pair the primary Python FastAPI backend (NumPy/SciPy/OpenCV/PyWavelets) with a zero-dependency TypeScript HTML5 Canvas DIP fallback engine (`frontend/src/lib/client-dip-fallback.ts`).

**Reason:** If the backend responds within the timeout window, the workbench displays the full Python scientific pipeline output. If the backend is cold-starting or offline, the frontend automatically executes genuine in-browser Canvas JPEG re-compression (ELA), Haar wavelet $HH_1$ decomposition, $16\times16$ block clone matching, and Laplacian/Scharr convolutions so the user never sees a broken page or spinner timeout.

**Tradeoff:** Maintaining a lightweight TypeScript mirror of the core DIP operators adds ~400 lines of frontend code, but guarantees 100% live-demo availability.

---

## What I'd do differently in v2

- **WebAssembly SIMD Worker for 4K/RAW Images** — Currently, images larger than `768 px` are aspect-scaled before running the 7 layers to keep latency under 1.2 seconds. Compiling the sliding-window DCT and wavelet transforms to Rust/WASM with Web Workers would allow full-resolution 12MP inspection without blocking the UI or taxing server RAM.
- **Empirical Weight Calibration on CASIA v2.0 & CoMoFoD** — Layer fusion weights are currently calibrated against our 6-class synthetic benchmark suite. Training a simple logistic calibration layer over the 7 deterministic DIP scores on 5,000+ labeled CASIA v2.0 pairs would provide empirically calibrated probability intervals while keeping the underlying features 100% explainable.

---

## Explicit non-decisions (deferred to v2)

| Feature | Why deferred |
|---|---|
| Deep-learning CNN segmentation (ManTra-Net / TruFor) | Requires GPU hosting and sacrifices deterministic mathematical explainability |
| Video frame-by-frame temporal forgery detection | Increases compute time by 30–100× per upload; v1 focuses on still-image spatial/frequency forensics |
| Database persistence of uploaded images | Stateless in-memory processing is faster, cheaper, and preserves user privacy |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
