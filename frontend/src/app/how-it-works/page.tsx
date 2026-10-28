"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const UI_GLOSSARY = [
  {
    term: "TAMPER SCORE (0 – 100)",
    meaning: "Final suspicion score combining all 7 DIP layers.",
    howToRead:
      "0–32 = AUTHENTIC (Clean unmodified photo) | 33–51 = SUSPICIOUS (Re-saved or globally filtered) | 52–100 = TAMPERED (Localized forgery detected).",
  },
  {
    term: "CONFIDENCE (%)",
    meaning: "How decisive and consistent the signal is across layers.",
    howToRead:
      "Higher percentage (>85%) means multiple independent layers agree on the exact same tampered region.",
  },
  {
    term: "BBOX [R1, R2...]",
    meaning: "Red Bounding Boxes drawn around detected tampered regions.",
    howToRead:
      "Each box shows [x, y, width, height], how much % of the photo it covers, and WHICH layer caught the edit (e.g., ELA vs Copy-Move vs Wavelet Noise).",
  },
  {
    term: "VECTORS [GREEN → RED]",
    meaning: "Cyan lines connecting two identical regions inside the same photo.",
    howToRead:
      "Appears when someone uses the Clone Stamp / Copy-Move tool to copy one part of an image (Green square) and paste it over another part (Red square).",
  },
  {
    term: "8×8 DCT GRID & PHASE (MOD 8)",
    meaning: "The invisible 8×8 pixel block grid used by JPEG compression.",
    howToRead:
      "Every JPEG compresses 8×8 blocks. If an object is cut and pasted at coordinates not divisible by 8 (e.g., x=253), its 8×8 grid shifts out of sync with the background.",
  },
  {
    term: "5× LOUPE",
    meaning: "Synchronized 5× pixel zoom magnifier that follows your cursor.",
    howToRead:
      "Left box shows raw RGB pixels; Right box shows the active DIP heatmap at the exact same spot so you can inspect edges pixel-by-pixel.",
  },
  {
    term: "32-BIN RESIDUAL HISTOGRAM",
    meaning: "Bar chart showing the distribution of error/anomaly intensities [0..255].",
    howToRead:
      "Clean images have almost all energy concentrated on the left (low error). Tampered images have a long tail or spikes on the right (high anomaly outliers).",
  },
  {
    term: "Z-SCORE (σ — SIGMA)",
    meaning: "How many standard deviations a block deviates from the rest of the image.",
    howToRead:
      "Normal blocks stay under 2.5σ. When a spliced or airbrushed patch hits 3.5σ to 30σ+, it means that area is statistically impossible to belong to the original camera frame.",
  },
  {
    term: "LBP & GLCM TEXTURE DESCRIPTORS",
    meaning: "Local Binary Patterns (LBP) & Grey Level Co-occurrence Matrix (GLCM) Contrast/Homogeneity.",
    howToRead:
      "Measures micro-texture patterns across neighboring pixels. Gaussian blurring, airbrushing, or healing-brush edits destroy local LBP dispersion and spike GLCM Homogeneity.",
  },
  {
    term: "PCA EIGEN-SUBSPACE & BAND-PASS / NOTCH FILTER",
    meaning: "Principal Component Analysis (PCA) feature reduction & 2D-FFT Band-Pass / Notch filtering.",
    howToRead:
      "PCA compresses 16×16 block DCT features onto their top principal components for fast clone matching, while 2D-FFT Band-Pass + Axial Notch filters reject normal 8×8 JPEG grid lines to isolate resampling peaks.",
  },
];

const PARAMETER_GUIDE = [
  {
    param: "ELA JPEG QUALITY (Q = 55..98)",
    whatItDoes:
      "Sets the JPEG quality level used when re-compressing the image in Layer 1 (Error Level Analysis).",
    whenToTune:
      "Default Q=90 works best for high-quality photos. Lower it to Q=75 if the suspect image was downloaded from WhatsApp/social media.",
  },
  {
    param: "ELA RESIDUAL GAIN (γ = 5×..40×)",
    whatItDoes:
      "Multiplies the brightness of the ELA difference map so subtle compression differences become visible to the human eye.",
    whenToTune:
      "Increase to 25×–35× if the heatmap looks too dark; decrease to 10× if the image has very noisy textures.",
  },
  {
    param: "2D-DWT WAVELET BASIS (HAAR / DB2 / DB4)",
    whatItDoes:
      "Selects the mathematical wavelet filter used in Layer 2 to separate camera sensor noise from the main scene.",
    whenToTune:
      "`HAAR` is sharpest for hard rectangular edges; `DB4` (Daubechies-4) is smoother and best at catching Gaussian blur, airbrushing, or healing brush edits.",
  },
  {
    param: "MAD SLIDING WINDOW (16×16, 32×32, 48×48)",
    whatItDoes:
      "Controls the size of the square window that scans across the image to measure local sensor noise.",
    whenToTune:
      "Use `16×16` to catch tiny retouched spots; use `32×32` or `48×48` for stable noise estimation on large photos.",
  },
  {
    param: "MORPHOLOGICAL SE KERNEL (B = 3×3..17×17)",
    whatItDoes:
      "Controls the size of the elliptical brush used in Stage 8 (Opening & Closing) to clean up random noise dots and merge the red tamper mask.",
    whenToTune:
      "Increase to 11×11 or 15×15 to merge fragmented boxes into one solid region; decrease to 3×3 or 5×5 for fine detail.",
  },
  {
    param: "FALSE-COLOR LUT (INFERNO / VIRIDIS / JET / HOT)",
    whatItDoes:
      "Changes the color palette used to draw the heatmaps (does not change the mathematical score).",
    whenToTune:
      "`INFERNO` (black → purple → orange → yellow) is best for dark rooms; `JET` (blue → green → red) highlights medium-level gradients.",
  },
];

const PIPELINE_STEPS = [
  {
    num: "01",
    name: "ERROR LEVEL ANALYSIS (ELA) & MULTI-QUALITY JPEG GHOSTS",
    weight: "22%",
    domain: "ITU-R BT.601 YCbCr Color Space & 8×8 DCT Quantization",
    plainMeaning:
      "WHAT IT MEANS: Checks if one part of the photo was compressed at a different JPEG quality than the rest of the photo. If someone cuts an object from one photo and pastes it into another, that object glows brightly here.",
    formula:
      "E_Q(x,y) = || I_YCbCr(x,y) - D_Q(E_Q(I_YCbCr(x,y))) ||_w,   Z(x,y) = |G_σ * E_Q - μ_med| / (1.4826 · MAD)",
    description:
      "Every JPEG image partitions the frame into non-overlapping 8×8 pixel blocks and quantizes their 2D Discrete Cosine Transform (DCT) coefficients. Re-compressing an unmodified JPEG at quality Q produces a uniform quantization residual across the scene. Foreign spliced regions originating from a different compression quality sit away from the local quantization minimum and exhibit high Z-score residuals after Sobel edge-energy normalization.",
  },
  {
    num: "02",
    name: "2D-DWT WAVELET, WIENER FILTER & LBP / GLCM TEXTURE DESCRIPTORS",
    weight: "22%",
    domain: "Daubechies db4 / Haar HH1 + 5×5 Adaptive Wiener + LBP(8,1) & GLCM",
    plainMeaning:
      "WHAT IT MEANS: Every camera sensor leaves an invisible grain (noise) and micro-texture across the photo. Combining 2D-DWT Wavelets and Adaptive Wiener filtering with Local Binary Patterns (LBP) and Grey Level Co-occurrence Matrix (GLCM) descriptors catches blur, airbrushing, or spliced patches.",
    formula:
      "σ̂_b = median(|HH_{1,b}|) / 0.6745,   LBP_{8,1} = Σ_{p=0}^7 s(g_p - g_c)2^p,   C_GLCM = Σ_{i,j} (i-j)² P(i,j)",
    description:
      "PixelProof decomposes the luminance channel via a 1-level 2D Discrete Wavelet Transform to extract the diagonal detail sub-band (HH1), combines it with a 5×5 spatial Adaptive Wiener denoising residual, and computes 8-neighbor Local Binary Patterns (LBP) alongside 16-level Grey Level Co-occurrence Matrix (GLCM) Contrast and Homogeneity.",
  },
  {
    num: "03",
    name: "HYBRID COPY-MOVE FORGERY DETECTION (2D-DCT + PCA + ORB)",
    weight: "22%",
    domain: "16×16 Block 2D-DCT + Principal Component Analysis (PCA) + ORB Keypoints",
    plainMeaning:
      "WHAT IT MEANS: Catches 'Clone Stamp' edits where someone copies a patch from inside the same photo and pastes it somewhere else. Projects 16×16 block DCT features onto their top Principal Components (PCA) and clusters parallel shift vectors alongside ORB keypoint matches.",
    formula:
      "Z_PCA = (X - μ) V_{:, :k},   C = (1/N) X_c^T X_c = V Λ V^T,   s_ij = p_i - p_j",
    description:
      "Internal copy-move clones share the exact same camera sensor noise and JPEG compression history as the background. Layer 3 slides an overlapping 16×16 window across the image, extracts low-frequency 2D-DCT coefficients, applies Principal Component Analysis (PCA) dimensionality reduction via SVD, and lexicographically sorts the feature rows in O(N log N) time.",
  },
  {
    num: "04",
    name: "RESAMPLING & 2D-FFT BAND-PASS / BAND-REJECT / NOTCH FILTERING",
    weight: "14%",
    domain: "3×3 Isotropic Laplacian + 2D-FFT Annular Band-Pass & Axial Notch Filter",
    plainMeaning:
      "WHAT IT MEANS: When a pasted object is resized or rotated, pixel interpolation creates periodic ripples. An Annular Band-Pass Filter paired with an Axial Notch / Band-Reject Filter removes normal JPEG grid lines in the 2D-FFT spectrum to expose those resampling ripples.",
    formula:
      "G(u,v) = FFT2(∇²f · w) · H_BP(u,v) · H_Notch(u,v),   H_BP(u,v) = I(D_1 ≤ D(u,v) ≤ D_2)",
    description:
      "Bilinear and bicubic interpolation introduce periodic linear correlations between neighboring pixels. Convolving the luminance channel with an isotropic 2nd-order Laplacian high-pass kernel and filtering the 2D-FFT spectrum with an Annular Band-Pass Filter (0.30 ≤ r/r_max ≤ 0.85) and an Axial Notch / Band-Reject Filter (|u - u_0| > 6, |v - v_0| > 6) isolates resampling periodicity.",
  },
  {
    num: "05",
    name: "DOUBLE JPEG QUANTIZATION & 8×8 BLOCKING ARTIFACT GRID (BAG)",
    weight: "10%",
    domain: "AC(0,1)/AC(1,0) DCT Comb Histograms & Grid Phase (mod 8)",
    plainMeaning:
      "WHAT IT MEANS: JPEG saves images in strict 8×8 pixel squares. If a cropped or pasted region does not line up with the 8×8 grid of the background image, this layer detects the broken grid alignment.",
    formula:
      "Q_{12}(c) = round( round(c / q_1) · q_1 / q_2 ),   Δ_x(x,y) = |2I(x,y) - I(x-1,y) - I(x+1,y)|",
    description:
      "Independent 8×8 block DCT quantization creates subtle pixel discontinuities along coordinates x ≡ 0 (mod 8) and y ≡ 0 (mod 8). When a region is cropped or spliced at coordinates not divisible by 8, its internal 8×8 blocking grid shifts out of phase with the background grid.",
  },
  {
    num: "06",
    name: "LATERAL CHROMATIC ABERRATION & SCHARR EDGE CONSISTENCY",
    weight: "12%",
    domain: "3×3 Rotational-Symmetric Scharr R/G/B Gradients",
    plainMeaning:
      "WHAT IT MEANS: Checks the Red, Green, and Blue color edges around objects. Cut-and-paste selections leave unnatural sharp color seams along the border of the pasted object.",
    formula:
      "G_c = [K_x * I_c, K_y * I_c]^T,   D_chroma(x,y) = 0.5(||G_R|| - ||G_G||) + (1 - |G_R · G_B| / (||G_R|| ||G_B||))",
    description:
      "Physical camera lenses refract Red, Green, and Blue wavelengths with consistent directional collinearity. Composited objects and selection masks introduce abrupt inter-channel gradient magnitude divergences and vector misalignments along the splice boundary.",
  },
  {
    num: "07",
    name: "EXIF METADATA & 8×8 LUMINANCE DQT FINGERPRINTING",
    weight: "8%",
    domain: "JPEG Annex-K Quantization Matrix & Container Headers",
    plainMeaning:
      "WHAT IT MEANS: Reads the hidden file header to check if editing software (like Adobe Photoshop, GIMP, Lightroom, or Canva) saved the file, and inspects the 8×8 JPEG compression table.",
    formula:
      "Q_IJG(u,v) = clip( floor((S(Q) · Q_base(u,v) + 50) / 100), 1, 255 )",
    description:
      "Parses EXIF headers for explicit editing software signatures and extracts the 64-element Luminance Quantization Table (DQT) from the JPEG stream, comparing its divisors against standard camera and editing profiles.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10">
          <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-2">
            {"// [04] COMPLETE GUIDE, GLOSSARY & MATHEMATICAL SPECIFICATION"}
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tight text-[#f2efe9]">
            WHAT EVERY METRIC, SLIDER &amp; LAYER MEANS.
          </h1>
          <p className="text-xs sm:text-base text-[#88857e] mt-3 max-w-3xl leading-relaxed">
            A complete plain-English and mathematical reference guide to reading PixelProof&apos;s
            heatmaps, scores, bounding boxes, DIP sliders, and 7 forensic detection layers.
          </p>
        </section>

        {/* SECTION A: PLAIN-ENGLISH GLOSSARY OF EVERY TERM ON SCREEN */}
        <section className="border-x border-b border-[#222220] bg-[#080808]">
          <div className="p-5 sm:p-8 border-b border-[#222220] bg-[#0b0b0b]">
            <div className="font-mono text-[11px] text-[#00e676] uppercase tracking-widest mb-1">
              {"// PART 01 · UI TELEMETRY & GLOSSARY"}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9]">
              HOW TO READ THE WORKBENCH (PLAIN-ENGLISH GUIDE)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222220]">
            {UI_GLOSSARY.map((item, idx) => (
              <div
                key={item.term}
                className={`p-5 sm:p-6 border-b border-[#222220] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#88857e] mb-1.5">
                    <span>TERM_0{idx + 1}</span>
                    <span className="text-[#00e5ff]">WORKBENCH READOUT</span>
                  </div>
                  <h3 className="font-mono font-bold text-sm sm:text-base text-[#f2efe9] mb-2">
                    {item.term}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#f2efe9] font-medium mb-2">
                    {item.meaning}
                  </p>
                </div>
                <div className="border border-[#222220] bg-[#0e0e0e] p-3 font-mono text-[11px] text-[#88857e] leading-relaxed">
                  <strong className="text-[#00e676]">HOW TO READ: </strong>
                  {item.howToRead}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION B: WHAT EVERY PARAMETER SLIDER DOES */}
        <section className="border-x border-b border-[#222220] bg-[#080808]">
          <div className="p-5 sm:p-8 border-b border-[#222220] bg-[#0b0b0b]">
            <div className="font-mono text-[11px] text-[#ffb300] uppercase tracking-widest mb-1">
              {"// PART 02 · DIP PARAMETER TUNING GUIDE"}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9]">
              WHAT EACH FILTER SLIDER CONTROLS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#222220]">
            {PARAMETER_GUIDE.map((p, idx) => (
              <div
                key={p.param}
                className="p-5 sm:p-6 border-b border-[#222220] flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-[10px] text-[#ffb300] font-bold mb-1">
                    [SLIDER_0{idx + 1}]
                  </div>
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-[#f2efe9] mb-2">
                    {p.param}
                  </h3>
                  <p className="text-xs text-[#88857e] leading-relaxed mb-4">{p.whatItDoes}</p>
                </div>
                <div className="border border-[#222220] bg-[#0e0e0e] p-2.5 font-mono text-[10px] text-[#f2efe9]">
                  <span className="text-[#00e5ff] font-bold">WHEN TO TUNE: </span>
                  {p.whenToTune}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION C: THE 7 DIP LAYERS (PLAIN MEANING + MATH) */}
        <section className="border-x border-b border-[#222220]">
          <div className="p-5 sm:p-8 border-b border-[#222220] bg-[#0b0b0b]">
            <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-widest mb-1">
              {"// PART 03 · THE 7 CLASSICAL DIP DETECTION LAYERS"}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9]">
              LAYER-BY-LAYER MEANING &amp; MATHEMATICAL FORMULATION
            </h2>
          </div>

          <div className="divide-y divide-[#222220]">
            {PIPELINE_STEPS.map((step) => (
              <div
                key={step.num}
                className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start bg-[#080808] hover:bg-[#0b0b0b] transition-colors"
              >
                <div className="lg:col-span-2 flex lg:flex-col items-baseline lg:items-start justify-between gap-2">
                  <span className="font-display font-black text-5xl sm:text-6xl text-[#00e5ff] leading-none">
                    L{step.num}
                  </span>
                  <span className="border border-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00e5ff]">
                    WEIGHT: {step.weight}
                  </span>
                </div>

                <div className="lg:col-span-10 space-y-3 min-w-0">
                  <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-wider">
                    {step.domain}
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl uppercase text-[#f2efe9]">
                    {step.name}
                  </h3>

                  {/* Plain-English Box */}
                  <div className="border-l-4 border-l-[#00e5ff] border border-[#222220] bg-[#111111] p-3.5 text-xs sm:text-sm text-[#f2efe9] leading-relaxed">
                    {step.plainMeaning}
                  </div>

                  {/* Governing Formula */}
                  <div className="border border-[#222220] bg-[#0e0e0e] p-3 font-mono text-xs text-[#00e676] overflow-x-auto">
                    {step.formula}
                  </div>

                  <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stage 08: Morphological Fusion */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10 space-y-6">
          <div>
            <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-widest mb-1">
              {"// PART 04 · STAGE 08 COMPOSITE FUSION & MORPHOLOGICAL SEGMENTATION"}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9]">
              OTSU THRESHOLDING + MORPHOLOGICAL OPENING/CLOSING + 8-CONNECTIVITY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-[#222220] divide-y md:divide-y-0 md:divide-x divide-[#222220] bg-[#080808] font-mono text-xs">
            <div className="p-5">
              <div className="text-[#00e5ff] font-bold mb-2">[01] OTSU ADAPTIVE THRESHOLD</div>
              <p className="text-[#88857e] font-sans text-xs leading-relaxed">
                Maximizes between-class variance <code className="text-[#f2efe9]">σ²_B(t*)</code>{" "}
                bounded by an 89th-percentile floor so unmodified images do not false-segment.
              </p>
            </div>
            <div className="p-5">
              <div className="text-[#00e5ff] font-bold mb-2">
                [02] MORPHOLOGICAL OPEN &amp; CLOSE
              </div>
              <p className="text-[#88857e] font-sans text-xs leading-relaxed">
                Applies elliptical Opening <code className="text-[#f2efe9]">(M ⊖ B₁) ⊕ B₁</code> to
                remove isolated salt noise and Closing{" "}
                <code className="text-[#f2efe9]">(M ⊕ B₂) ⊖ B₂</code> to bridge fragmented masks.
              </p>
            </div>
            <div className="p-5">
              <div className="text-[#00e5ff] font-bold mb-2">
                [03] 8-CONNECTED COMPONENT BBOXES
              </div>
              <p className="text-[#88857e] font-sans text-xs leading-relaxed">
                Extracts contiguous bounding boxes <code className="text-[#f2efe9]">[x, y, w, h]</code>{" "}
                and attributes each suspect zone to the DIP layer with peak local activation.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <span className="border border-[#00e676] bg-[#00e676]/10 px-3 py-1.5 text-[#00e676] font-bold">
                0–32 // AUTHENTIC
              </span>
              <span className="border border-[#ffb300] bg-[#ffb300]/10 px-3 py-1.5 text-[#ffb300] font-bold">
                33–51 // SUSPICIOUS
              </span>
              <span className="border border-[#ff2a2a] bg-[#ff2a2a]/10 px-3 py-1.5 text-[#ff2a2a] font-bold">
                52–100 // TAMPERED
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="brutal-btn">
                LAUNCH DEMO SUITE →
              </Link>
              <Link href="/analyze" className="brutal-btn brutal-btn-primary">
                ANALYZE CUSTOM IMAGE →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
