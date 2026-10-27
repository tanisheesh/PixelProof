"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  Grid,
  Layers,
  Scan,
  Sparkles,
  Upload,
} from "lucide-react";

const DIP_LAYERS = [
  {
    code: "L1",
    title: "Error Level Analysis (ELA) & JPEG Ghosts",
    domain: "YCbCr Color Space & 8×8 DCT Quantization",
    description:
      "Re-compresses the image across quality levels Q ∈ {75, 85, 90, 95} in YCbCr space to expose foreign spliced regions that sit at a different quantization error minimum.",
  },
  {
    code: "L2",
    title: "Wavelet (DWT) & Wiener Noise Variance",
    domain: "Daubechies db4 / Haar HH1 Sub-Band + Wiener Filter",
    description:
      "Extracts the diagonal high-frequency wavelet sub-band (HH1) and Adaptive Wiener residual, using Donoho's MAD estimator to catch airbrushing, blur, and ISO noise mismatches.",
  },
  {
    code: "L3",
    title: "Hybrid Copy-Move Clone Detection",
    domain: "16×16 2D-DCT Lexicographical Sort + ORB Keypoints",
    description:
      "Combines lexicographically sorted 16×16 block DCT coefficients with ORB binary descriptors and 2D shift-vector clustering to link duplicated internal patches.",
  },
  {
    code: "L4",
    title: "Resampling & 2D-FFT Spectral Periodicity",
    domain: "2nd-Order Laplacian + 2D Fast Fourier Transform",
    description:
      "Applies an isotropic 3×3 Laplacian high-pass filter followed by a Hanning-windowed 2D-FFT to detect periodic pixel correlations introduced by scaling or rotation.",
  },
  {
    code: "L5",
    title: "Double JPEG & 8×8 Blocking Grid (BAG)",
    domain: "AC DCT Comb Histogram & Grid Phase Alignment",
    description:
      "Detects out-of-phase 8×8 JPEG block boundaries (x mod 8, y mod 8) and periodic comb harmonics in AC(0,1)/AC(1,0) DCT histograms caused by cropping and re-saving.",
  },
  {
    code: "L6",
    title: "Chromatic Aberration & Scharr Edges",
    domain: "Multi-Channel First-Order Spatial Gradients",
    description:
      "Computes rotational-symmetric 3×3 Scharr derivatives across Red, Green, and Blue channels to flag unnatural composite boundary seams and optical vector divergence.",
  },
  {
    code: "L7",
    title: "EXIF & 8×8 Luminance DQT Fingerprinting",
    domain: "JPEG Annex-K Quantization Matrix Inspection",
    description:
      "Inspects container headers for editing software signatures (Photoshop, GIMP, Lightroom) and compares the 64-element Luminance Quantization Table against camera standards.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-28">
      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-6xl px-4 pt-8 md:pt-14 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full bg-cyan-500/10 blur-[130px]" />

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-cyan-300 mb-6">
          <Scan className="h-3.5 w-3.5" />
          <span>Deterministic Digital Image Processing Forensics</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
          EVERY TAMPERED PIXEL{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            LEAVES A TRACE.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          PixelProof exposes splicing, copy-move cloning, retouching, and resampling using{" "}
          <strong className="text-slate-200">7 classical Digital Image Processing pipelines</strong>.
          Zero black-box neural networks — every verdict is backed by explainable spatial and
          frequency-domain mathematics in under 1.5 seconds.
        </p>

        {/* Primary Action Buttons: User Workspace vs Interactive Demo */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/analyze"
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-cyan-300 hover:scale-[1.02] transition"
          >
            <Upload className="h-4 w-4" />
            <span>Analyze Your Image</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/demo"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0B0F17] px-7 py-3.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300 transition"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Explore Interactive Demo &amp; Sandbox</span>
          </Link>
        </div>

        {/* Visual Architecture Preview Card */}
        <div className="mt-14 rounded-2xl border border-slate-800/90 bg-[#0B0F17]/90 p-5 sm:p-7 shadow-2xl text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-xs text-slate-400">
                pixelproof://forensic-pipeline-v1.0
              </span>
            </div>
            <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-[11px] text-cyan-300">
              Otsu + Morphological Opening/Closing Localization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#070A10] p-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>STAGE 01 &middot; INPUT &amp; DECODE</span>
                <Eye className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-slate-100">
                RGB &rarr; ITU-R BT.601 YCbCr
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Separates Luminance (Y) from Chrominance (Cb, Cr) and extracts Sobel gradient masks
                so natural scene edges never false-trigger noise estimators.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-2">
                <span>STAGE 02 &middot; 7 DIP TRANSFORMS</span>
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-white">
                DCT + 2D-DWT + 2D-FFT + Wiener + Scharr
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Executes 7 orthogonal spatial and frequency operators in parallel, generating
                normalized false-color heatmaps and 32-bin energy histograms.
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-rose-300 mb-2">
                <span>STAGE 03 &middot; MORPHOLOGICAL FUSION</span>
                <Grid className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-sm font-bold text-white">
                Otsu Threshold &rarr; Open/Close &rarr; BBoxes
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Applies elliptical erosion/dilation and 8-connected component labeling to isolate
                exact tampered coordinates and a 0–100 verdict score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-slate-800/80 bg-[#080C14] py-10">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-400">7</div>
            <div className="mt-1 text-xs font-mono uppercase tracking-widest text-slate-400">
              Classical DIP Layers
            </div>
          </div>
          <div>
            <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-400">100%</div>
            <div className="mt-1 text-xs font-mono uppercase tracking-widest text-slate-400">
              Explainable Math (Zero ML)
            </div>
          </div>
          <div>
            <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-400">&lt;1.2s</div>
            <div className="mt-1 text-xs font-mono uppercase tracking-widest text-slate-400">
              CPU Execution Latency
            </div>
          </div>
          <div>
            <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-400">6 / 6</div>
            <div className="mt-1 text-xs font-mono uppercase tracking-widest text-slate-400">
              Benchmark Suite Accuracy
            </div>
          </div>
        </div>
      </section>

      {/* THE 7 DIP LAYERS GRID */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-cyan-400 mb-2">
              Forensic Signal Processing Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              What PixelProof Detects
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
          >
            <span>View Full Mathematical Breakdown</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIP_LAYERS.map((layer) => (
            <div
              key={layer.code}
              className="group rounded-xl border border-slate-800/90 bg-[#0B0F17] p-5 hover:border-cyan-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300">
                    {layer.code}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 truncate max-w-[210px]">
                    {layer.domain}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition">
                  {layer.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {layer.description}
                </p>
              </div>
            </div>
          ))}

          {/* 8th Card: Morphological Fusion Summary */}
          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 to-[#0B0F17] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                  FUSION
                </span>
                <span className="font-mono text-[11px] text-emerald-300">
                  Otsu + Morphology + 8-CC
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Morphological Mask &amp; Region Localization
              </h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Combines all spatial anomaly maps, applies Otsu thresholding, removes salt noise via
                Morphological Opening, bridges regions via Closing, and outputs exact bounding boxes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TWO MODES SECTION: DEMO VS ANALYZE */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Interactive Demo & Tamper Sandbox */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono text-cyan-300 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>01 &middot; Interactive Demo &amp; Sandbox</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                Test Pre-Built Forgeries or Create Your Own Attack
              </h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Explore 6 ground-truth forensic cases (Splicing, Copy-Move, Gaussian Retouching,
                Resampling, Double JPEG, and Authentic Control) or open the{" "}
                <strong className="text-slate-200">Live Tamper Sandbox</strong> to clone, splice, or
                blur an image in the browser and watch the 7 DIP layers catch it live.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>6 pre-loaded benchmark cases with ground-truth comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Interactive Copy-Move, Splice &amp; Gaussian Blur attack canvas</span>
                </li>
              </ul>
            </div>

            <div className="mt-7">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-500/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/25 transition"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: User Upload & Forensic Workbench */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono text-emerald-300 mb-4">
                <Upload className="h-3.5 w-3.5" />
                <span>02 &middot; Custom Image Inspector</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                Upload Any Image for Full 7-Layer Forensic Audit
              </h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Drop any suspect JPEG, PNG, WebP, or BMP file into the dedicated workbench. Inspect
                split-screen heatmaps, use the 5× pixel magnifier loupe, tune DIP filter parameters
                in real time, and export a complete JSON/PDF forensic dossier.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Synchronized 5× pixel loupe &amp; 8×8 DCT grid overlay</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Real-time ELA Q-factor, Wavelet basis &amp; Morphology sliders</span>
                </li>
              </ul>
            </div>

            <div className="mt-7">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-300 transition"
              >
                <span>Open Image Analyzer</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-4xl px-4 text-center pb-8">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0B0F17] to-[#070A10] p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Ready to inspect an image at the signal level?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Zero sign-up, zero data retention. Upload your own image or test our interactive
            forensic benchmark suite right in your browser.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/analyze"
              className="rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition"
            >
              Analyze Custom Image &rarr;
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-cyan-400 transition"
            >
              Try Interactive Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
