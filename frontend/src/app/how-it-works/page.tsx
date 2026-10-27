"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sigma, Sparkles, Upload } from "lucide-react";

const PIPELINE_STEPS = [
  {
    num: "01",
    name: "Error Level Analysis (ELA) & Multi-Quality JPEG Ghosts",
    weight: "22%",
    domain: "ITU-R BT.601 YCbCr Color Space & 8×8 DCT Quantization",
    formula: "E_Q(x,y) = || I_YCbCr(x,y) - JPEG_Q(I_YCbCr(x,y)) ||_w",
    description:
      "Every JPEG image divides the frame into non-overlapping 8×8 pixel blocks and quantizes their 2D Discrete Cosine Transform (DCT) coefficients. When an unmodified JPEG is re-compressed at quality Q, the quantization error is uniform across the scene. If a foreign object from a different compression history is spliced in, its 8×8 blocks are no longer at a local quantization minimum and light up brightly in the Sobel-normalized residual map.",
  },
  {
    num: "02",
    name: "2D Discrete Wavelet Transform (DWT) & Wiener Noise Variance",
    weight: "22%",
    domain: "Daubechies db4 / Haar HH1 Sub-Band + 5×5 Adaptive Wiener Filter",
    formula: "σ̂_b = median(|HH_{1,b} - median(HH_{1,b})|) / 0.6745",
    description:
      "Every camera sensor leaves an isotropic high-frequency noise floor. PixelProof decomposes the luminance channel via a 2D Discrete Wavelet Transform to isolate the diagonal detail sub-band (HH1) and combines it with a 5×5 Adaptive Wiener denoising residual. After masking out strong structural scene edges, Donoho's Median Absolute Deviation (MAD) estimator computes local noise variance across sliding windows—catching both noisy spliced patches and smooth airbrushed/inpainted regions.",
  },
  {
    num: "03",
    name: "Hybrid Copy-Move (Clone) Forgery Detection",
    weight: "22%",
    domain: "16×16 Block 2D-DCT Lexicographical Sort + ORB Keypoints",
    formula: "s_{ij} = (x_i - x_j, y_i - y_j),   count(s) >= T_cluster",
    description:
      "When a forger copies a region from within the same image to duplicate or hide an object, ELA and noise analysis see identical compression and sensor noise. Layer 3 slides a 16×16 window across the image, extracts quantized low-frequency 2D-DCT coefficients, and lexicographically sorts the rows so identical patches become adjacent in O(N log N) time. Parallel shift vectors (Δx, Δy) are clustered alongside ORB keypoint matches to link source and cloned regions.",
  },
  {
    num: "04",
    name: "Resampling & 2D-FFT Spectral Periodicity",
    weight: "14%",
    domain: "3×3 Isotropic Laplacian Derivative + Hanning 2D-FFT",
    formula: "M(u,v) = log(1 + | FFT2( ∇²I(x,y) · w(x,y) ) |)",
    description:
      "Spliced objects are almost always resized, rotated, or skewed to fit the target perspective. Bilinear and bicubic interpolation introduce periodic linear correlations between neighboring pixels. Convolving the image with a 2nd-order Laplacian high-pass operator exposes these correlations, which manifest as distinct secondary high-frequency peaks in the 2D Fast Fourier Transform (2D-FFT) magnitude spectrum.",
  },
  {
    num: "05",
    name: "Double JPEG Quantization & 8×8 Blocking Artifact Grid (BAG)",
    weight: "10%",
    domain: "AC(0,1)/AC(1,0) DCT Comb Histograms & Grid Phase (mod 8)",
    formula: "Δ_x(x,y) = | 2I(x,y) - I(x-1,y) - I(x+1,y) |",
    description:
      "Standard JPEG compression introduces subtle discontinuities along 8×8 block boundaries (x ≡ 0 mod 8, y ≡ 0 mod 8). When a region is cropped or pasted at coordinates not divisible by 8, its local 8×8 blocking grid shifts out of phase with the background grid. Simultaneously, double quantization (Q1 → Q2) produces periodic comb-filter zero-bins in the AC DCT coefficient histograms.",
  },
  {
    num: "06",
    name: "Lateral Chromatic Aberration & Scharr Edge Consistency",
    weight: "12%",
    domain: "3×3 Rotational-Symmetric Scharr R/G/B Gradients",
    formula: "D_chroma(x,y) = 0.5(|∇R - ∇G| + |∇B - ∇G|) + (1 - |cos θ_RB|)",
    description:
      "Real camera optics refract Red, Green, and Blue wavelengths with consistent directional collinearity. Composited objects and selection masks create abrupt inter-channel gradient magnitude divergences and angular misalignments along the splice boundary, captured via 3×3 rotational-symmetric Scharr operators.",
  },
  {
    num: "07",
    name: "EXIF Metadata & 8×8 Luminance DQT Fingerprinting",
    weight: "8%",
    domain: "JPEG Annex-K Quantization Matrix & Container Headers",
    formula: "Q_IJG(u,v) = clip( floor((S(Q)·Q_base(u,v) + 50) / 100), 1, 255 )",
    description:
      "Inspects EXIF tags for explicit editing software signatures (Adobe Photoshop, GIMP, Lightroom, Canva) and extracts the 64-element Luminance Quantization Table (DQT) from the JPEG header, comparing the divisors against standard IJG quality curves.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 space-y-16">
      {/* Header */}
      <section className="text-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-mono uppercase tracking-widest text-cyan-300 mb-4">
          <Sigma className="h-3.5 w-3.5" />
          <span>Signal Processing &amp; Mathematical Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How PixelProof Works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
          Every uploaded image passes through 7 orthogonal Digital Image Processing (DIP) stages
          followed by Otsu adaptive thresholding and Morphological Opening/Closing to localize
          tampered regions without a single black-box neural network.
        </p>
      </section>

      {/* 7 Layers Breakdown */}
      <section className="space-y-5">
        {PIPELINE_STEPS.map((step) => (
          <div
            key={step.num}
            className="rounded-2xl border border-slate-800/90 bg-[#0B0F17] p-6 sm:p-7 flex flex-col md:flex-row gap-6 items-start"
          >
            <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-400/30 shrink-0">
              {step.num}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-cyan-400">{step.domain}</div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    {step.name}
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                  Fusion Weight: {step.weight}
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#06090F] px-4 py-2.5 font-mono text-xs text-emerald-300 overflow-x-auto">
                {step.formula}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Morphological Fusion & Scoring */}
      <section className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-7 space-y-5">
        <div className="font-mono text-xs uppercase tracking-widest text-cyan-400">
          Stage 08 &middot; Composite Localization &amp; Verdict Scoring
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          Otsu Thresholding, Morphological Filtering &amp; 8-Connectivity
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Once all spatial anomaly maps are normalized to <code className="text-cyan-300">[0, 255]</code>,
          PixelProof computes a weighted spatial fusion map boosted by the top two highest-scoring
          layers. To convert the continuous heatmap into crisp region bounding boxes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-[#070A10] p-4">
            <div className="font-mono font-bold text-cyan-400 mb-1">
              1. Otsu Adaptive Threshold
            </div>
            <p className="text-slate-400 leading-relaxed">
              Maximizes between-class variance <code className="text-slate-200">σ²_B(t*)</code> bounded
              by an 88th-percentile floor to segment high-anomaly pixels.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070A10] p-4">
            <div className="font-mono font-bold text-cyan-400 mb-1">
              2. Morphological Open &amp; Close
            </div>
            <p className="text-slate-400 leading-relaxed">
              Applies elliptical Opening <code className="text-slate-200">(M ⊖ B₁) ⊕ B₁</code> to
              erase isolated salt noise and Closing <code className="text-slate-200">(M ⊕ B₂) ⊖ B₂</code>{" "}
              to bridge fragmented regions.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070A10] p-4">
            <div className="font-mono font-bold text-cyan-400 mb-1">
              3. Connected Components
            </div>
            <p className="text-slate-400 leading-relaxed">
              Runs 8-connectivity labeling to extract bounding boxes <code className="text-slate-200">[x, y, w, h]</code>{" "}
              and attributes each box to its primary DIP trigger.
            </p>
          </div>
        </div>

        {/* Verdict Threshold Bar */}
        <div className="pt-2">
          <div className="h-10 rounded-xl overflow-hidden flex font-mono text-xs font-bold">
            <div className="flex-1 flex items-center justify-center bg-emerald-500/20 text-emerald-300 border-r border-slate-800">
              0 – 32 &middot; AUTHENTIC
            </div>
            <div className="flex-1 flex items-center justify-center bg-amber-500/20 text-amber-300 border-r border-slate-800">
              33 – 51 &middot; SUSPICIOUS
            </div>
            <div className="flex-1 flex items-center justify-center bg-rose-500/20 text-rose-300">
              52 – 100 &middot; TAMPERED
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="flex flex-wrap items-center justify-center gap-4 pb-6">
        <Link
          href="/analyze"
          className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition"
        >
          <Upload className="h-4 w-4" />
          <span>Analyze Your Own Image</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/demo"
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0B0F17] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-cyan-400 transition"
        >
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Try Interactive Demo &amp; Sandbox</span>
        </Link>
      </section>
    </div>
  );
}
