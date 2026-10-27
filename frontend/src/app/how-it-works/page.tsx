"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const PIPELINE_STEPS = [
  {
    num: "01",
    name: "ERROR LEVEL ANALYSIS (ELA) & MULTI-QUALITY JPEG GHOSTS",
    weight: "22%",
    domain: "ITU-R BT.601 YCbCr Color Space & 8×8 DCT Quantization",
    formula: "E_Q(x,y) = || I_YCbCr(x,y) - D_Q(E_Q(I_YCbCr(x,y))) ||_w,   Z(x,y) = |G_σ * E_Q - μ_med| / (1.4826 · MAD)",
    description:
      "Every JPEG image partitions the frame into non-overlapping 8×8 pixel blocks and quantizes their 2D Discrete Cosine Transform (DCT) coefficients. Re-compressing an unmodified JPEG at quality Q produces a uniform quantization residual across the scene. Foreign spliced regions originating from a different compression quality sit away from the local quantization minimum and exhibit high Z-score residuals after Sobel edge-energy normalization.",
  },
  {
    num: "02",
    name: "2D DISCRETE WAVELET TRANSFORM (DWT) & WIENER NOISE VARIANCE",
    weight: "22%",
    domain: "Daubechies db4 / Haar HH1 Sub-Band + 5×5 Adaptive Wiener Filter",
    formula: "σ̂_b = median(|HH_{1,b} - median(HH_{1,b})|) / 0.6745,   R_W(x,y) = I(x,y) - Wiener_{5×5}(I(x,y))",
    description:
      "Imaging sensors leave an isotropic high-frequency noise signature. PixelProof decomposes the luminance channel via a 1-level 2D Discrete Wavelet Transform to extract the diagonal detail sub-band (HH1) and combines it with a 5×5 spatial Adaptive Wiener denoising residual. After masking out the top 15% highest Sobel gradient edges, Donoho's Median Absolute Deviation (MAD) estimator computes local noise variance across sliding windows—catching both noisy spliced patches and smooth airbrushed/inpainted regions.",
  },
  {
    num: "03",
    name: "HYBRID COPY-MOVE (CLONE) FORGERY DETECTION",
    weight: "22%",
    domain: "16×16 Block 2D-DCT Lexicographical Sort + ORB Keypoints",
    formula: "F(u,v) = α(u)α(v) Σ_x Σ_y f(x,y) cos((2x+1)uπ/2B) cos((2y+1)vπ/2B),   s_ij = p_i - p_j",
    description:
      "Internal copy-move clones share the exact same camera sensor noise, illumination, and JPEG compression history as the background. Layer 3 slides an overlapping 16×16 window across the image, extracts quantized low-frequency 2D-DCT coefficients, and lexicographically sorts the feature rows so identical patches become adjacent in O(N log N) time. Parallel shift vectors (Δx, Δy) are accumulated in a 2D displacement histogram alongside ORB binary keypoint matches.",
  },
  {
    num: "04",
    name: "RESAMPLING & 2D-FFT SPECTRAL PERIODICITY",
    weight: "14%",
    domain: "3×3 Isotropic Laplacian Derivative + Hanning 2D-FFT",
    formula: "∇²f(x,y) = f(x+1,y)+f(x-1,y)+f(x,y+1)+f(x,y-1)-4f(x,y),   M(u,v) = log(1 + |FFT2(∇²f · w)|)",
    description:
      "When a spliced object is scaled or rotated, bilinear and bicubic interpolation introduce periodic linear correlations between neighboring pixels. Convolving the luminance channel with an isotropic 2nd-order Laplacian high-pass kernel suppresses low-frequency scene structure and exposes these periodic correlations as distinct high-frequency peaks in the 2D Fast Fourier Transform (2D-FFT) log-magnitude spectrum.",
  },
  {
    num: "05",
    name: "DOUBLE JPEG QUANTIZATION & 8×8 BLOCKING ARTIFACT GRID (BAG)",
    weight: "10%",
    domain: "AC(0,1)/AC(1,0) DCT Comb Histograms & Grid Phase (mod 8)",
    formula: "Q_{12}(c) = round( round(c / q_1) · q_1 / q_2 ),   Δ_x(x,y) = |2I(x,y) - I(x-1,y) - I(x+1,y)|",
    description:
      "Independent 8×8 block DCT quantization creates subtle pixel discontinuities along coordinates x ≡ 0 (mod 8) and y ≡ 0 (mod 8). When a region is cropped or spliced at coordinates not divisible by 8, its internal 8×8 blocking grid shifts out of phase with the background grid. Simultaneously, double quantization (Q1 → Q2) produces periodic comb-filter zero-bins in the AC DCT coefficient histograms.",
  },
  {
    num: "06",
    name: "LATERAL CHROMATIC ABERRATION & SCHARR EDGE CONSISTENCY",
    weight: "12%",
    domain: "3×3 Rotational-Symmetric Scharr R/G/B Gradients",
    formula: "G_c = [K_x * I_c, K_y * I_c]^T,   D_chroma(x,y) = 0.5(||G_R|| - ||G_G||) + (1 - |G_R · G_B| / (||G_R|| ||G_B||))",
    description:
      "Physical camera lenses refract Red, Green, and Blue wavelengths with consistent directional collinearity. Composited objects and selection masks introduce abrupt inter-channel gradient magnitude divergences and vector misalignments along the splice boundary, measured via 3×3 rotational-symmetric Scharr operators.",
  },
  {
    num: "07",
    name: "EXIF METADATA & 8×8 LUMINANCE DQT FINGERPRINTING",
    weight: "8%",
    domain: "JPEG Annex-K Quantization Matrix & Container Headers",
    formula: "Q_IJG(u,v) = clip( floor((S(Q) · Q_base(u,v) + 50) / 100), 1, 255 )",
    description:
      "Parses EXIF headers for explicit editing software signatures (Adobe Photoshop, GIMP, Lightroom, Canva) and extracts the 64-element Luminance Quantization Table (DQT) from the JPEG stream, comparing its divisors against standard IJG quality curves.",
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
            {"// [04] SIGNAL PROCESSING & MATHEMATICAL SPECIFICATION"}
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tight text-[#f2efe9]">
            SEVEN CLASSICAL DIP PIPELINES. EXPLAINABLE TO THE PIXEL.
          </h1>
          <p className="text-xs sm:text-base text-[#88857e] mt-3 max-w-3xl leading-relaxed">
            Every uploaded image is evaluated across 7 orthogonal spatial and frequency domains,
            followed by Otsu adaptive thresholding, elliptical Morphological Opening/Closing, and
            8-connected component labeling.
          </p>
        </section>

        {/* 7 Layers List */}
        <section className="border-x border-b border-[#222220] divide-y divide-[#222220]">
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
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-[#f2efe9]">
                  {step.name}
                </h2>
                <div className="border border-[#222220] bg-[#0e0e0e] p-3 font-mono text-xs text-[#00e676] overflow-x-auto">
                  {step.formula}
                </div>
                <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Stage 08: Morphological Fusion */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10 space-y-6">
          <div>
            <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-widest mb-1">
              {"// STAGE 08 · COMPOSITE FUSION & MORPHOLOGICAL SEGMENTATION"}
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
                bounded by an 88th-percentile floor so unmodified images do not false-segment.
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
