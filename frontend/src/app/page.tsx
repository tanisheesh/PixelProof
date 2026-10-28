"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const QUICKSTART_TABS = {
  backend: {
    label: "PYTHON ENGINE",
    code: `# Start the 7-Layer FastAPI DIP Forensic Engine (zero venv/env required)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Run the 6-case ground-truth forensic benchmark suite
python scripts/evaluate_benchmark.py`,
  },
  curl: {
    label: "REST API",
    code: `# POST any suspect image to the 7-layer DIP pipeline
curl -X POST "http://localhost:8000/api/analyze" \\
  -F "file=@suspect_frame.jpg" \\
  -F "ela_quality=90" \\
  -F "wavelet_family=db4" \\
  -F "morph_kernel_size=7" \\
  -F "colormap=inferno"`,
  },
  frontend: {
    label: "NEXT.JS WORKBENCH",
    code: `# Launch the interactive forensic workbench & live tamper sandbox
cd frontend
npm install
npm run dev

# Open http://localhost:3000 -> /demo or /analyze`,
  },
};

const BENCHMARK_ROWS = [
  {
    caseId: "authentic_camera",
    attack: "SINGLE-COMPRESSED CONTROL (Q=92)",
    topLayer: "L5: 8x8 GRID (39.6)",
    score: "27.0 / 100",
    boxes: "0",
    verdict: "AUTHENTIC",
    tampered: false,
  },
  {
    caseId: "splice_badge",
    attack: "FOREIGN OBJECT SPLICE (Q=74 -> Q=95)",
    topLayer: "L1: YCbCr ELA (98.0)",
    score: "83.0 / 100",
    boxes: "1 [R1]",
    verdict: "TAMPERED",
    tampered: true,
  },
  {
    caseId: "copymove_crate",
    attack: "INTERNAL CLONE STAMP (Δx=+256px)",
    topLayer: "L3: DCT+ORB (82.4)",
    score: "55.9 / 100",
    boxes: "2 [R1, R2]",
    verdict: "TAMPERED",
    tampered: true,
  },
  {
    caseId: "retouch_airbrush",
    attack: "GAUSSIAN HEALING BRUSH (σ=7.0)",
    topLayer: "L2: DWT HH1 (92.7)",
    score: "71.6 / 100",
    boxes: "1 [R1]",
    verdict: "TAMPERED",
    tampered: true,
  },
  {
    caseId: "resampling_rotscale",
    attack: "4x UPSAMPLED INTERPOLATED COMPOSITE",
    topLayer: "L4: 2D-FFT (96.0)",
    score: "73.4 / 100",
    boxes: "1 [R1]",
    verdict: "TAMPERED",
    tampered: true,
  },
  {
    caseId: "double_jpeg_grid",
    attack: "PHASE-SHIFTED 8x8 CROP (5 mod 8)",
    topLayer: "L7: DQT/BAG (72.0)",
    score: "53.8 / 100",
    boxes: "3 [R1..R3]",
    verdict: "TAMPERED",
    tampered: true,
  },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"backend" | "curl" | "frontend">("backend");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(QUICKSTART_TABS[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* HERO GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          {/* Left 7 Cols */}
          <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col justify-between min-w-0">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#00e5ff] mb-4 sm:mb-6">
                <span className="w-2 h-2 shrink-0 bg-[#00e5ff] inline-block" />
                <span>2D-DCT // 2D-DWT WAVELETS // 2D-FFT SPECTRUM // WIENER</span>
              </div>

              <h1 className="font-display font-black uppercase text-[clamp(42px,9.5vw,96px)] leading-[0.9] tracking-tight text-[#f2efe9] mb-5 sm:mb-6 break-words">
                EVERY TAMPERED
                <br />
                PIXEL LEAVES A
                <br />
                <span className="text-[#00e5ff]">SIGNAL TRACE.</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#88857e] max-w-xl leading-relaxed mb-6 sm:mb-8">
                Black-box neural networks hallucinate on re-compressed JPEGs and cannot explain{" "}
                <em className="text-[#f2efe9] not-italic font-semibold">why</em> a region was flagged.{" "}
                <strong className="text-[#f2efe9] font-semibold">PixelProof</strong> runs every image
                through{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  7 deterministic Digital Image Processing (DIP) pipelines
                </strong>{" "}
                — isolating quantization ghosts, Daubechies <code className="text-[#00e5ff]">db4</code>{" "}
                wavelet noise cavities, lexicographically sorted DCT clones, and 2D-FFT resampling
                harmonics in under 1.2 seconds on CPU.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <Link href="/analyze" className="brutal-btn brutal-btn-primary w-full sm:w-auto">
                ANALYZE YOUR IMAGE →
              </Link>
              <Link href="/demo" className="brutal-btn w-full sm:w-auto">
                LAUNCH DEMO &amp; SANDBOX →
              </Link>
              <Link href="/how-it-works" className="brutal-btn w-full sm:w-auto">
                GUIDE &amp; GLOSSARY →
              </Link>
            </div>
          </div>

          {/* Right 5 Cols: Live Signal Telemetry Snapshot */}
          <div className="lg:col-span-5 bg-[#0b0b0b] flex flex-col justify-between min-w-0">
            <div className="panel-header">
              <span>FORENSIC_ENGINE // 7-LAYER TELEMETRY</span>
              <span className="text-[#ff2a2a] font-bold">● VERDICT: TAMPERED [83.0]</span>
            </div>

            <div className="p-4 sm:p-6 space-y-4 font-mono text-xs">
              <div className="space-y-2.5">
                {[
                  {
                    id: "L1 // YCbCr_ELA",
                    spec: "Q=90 · Ghost Δ",
                    score: 98,
                    metric: "Z = 34.4σ",
                    state: "ANOMALY",
                    bar: "bg-[#ff2a2a]",
                  },
                  {
                    id: "L2 // DWT_NOISE",
                    spec: "db4 HH1 · Wiener",
                    score: 94,
                    metric: "Z = 16.8σ",
                    state: "ANOMALY",
                    bar: "bg-[#ff2a2a]",
                  },
                  {
                    id: "L3 // COPY_MOVE",
                    spec: "16x16 DCT · ORB",
                    score: 82,
                    metric: "24 VECTORS",
                    state: "CLONED",
                    bar: "bg-[#ffb300]",
                  },
                  {
                    id: "L4 // FFT_RESAMP",
                    spec: "∇²f + 2D-FFT",
                    score: 76,
                    metric: "PEAK 5.4σ",
                    state: "PERIODIC",
                    bar: "bg-[#00e5ff]",
                  },
                  {
                    id: "L5 // 8x8_GRID",
                    spec: "BAG Phase mod 8",
                    score: 18,
                    metric: "COHERENT",
                    state: "CLEAN",
                    bar: "bg-[#00e676]",
                  },
                ].map((layer) => (
                  <div key={layer.id} className="border border-[#222220] bg-[#111111] p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="truncate">
                        <span className="text-[#f2efe9] font-bold">{layer.id}</span>
                        <span className="text-[#88857e] ml-1.5 text-[10px]">[{layer.spec}]</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 border shrink-0 ${
                          layer.state === "ANOMALY"
                            ? "border-[#ff2a2a] text-[#ff2a2a]"
                            : layer.state === "CLONED"
                            ? "border-[#ffb300] text-[#ffb300]"
                            : layer.state === "PERIODIC"
                            ? "border-[#00e5ff] text-[#00e5ff]"
                            : "border-[#00e676] text-[#00e676]"
                        }`}
                      >
                        {layer.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#88857e] mb-1">
                      <span>TELEMETRY: {layer.metric}</span>
                      <span className="text-[#f2efe9] font-bold">SCORE: {layer.score}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1c1c1a]">
                      <div className={`h-full ${layer.bar}`} style={{ width: `${layer.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-[#222220] bg-[#080808] p-3 space-y-1">
                <div className="text-[10px] text-[#00e5ff] uppercase tracking-wider">
                  MORPHOLOGICAL LOCALIZATION // 8-CONNECTED COMPONENT R1
                </div>
                <div className="text-[#00e676] text-[11px] sm:text-xs overflow-x-auto whitespace-nowrap pb-0.5">
                  BBOX [x:295, y:82, w:148, h:116] · OTSU + (M ⊖ B₁) ⊕ B₂ · CONF 94%
                </div>
              </div>
            </div>

            <div className="border-t border-[#222220] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] text-[#88857e]">
              <span>CPU EXECUTION: 820ms</span>
              <Link href="/demo" className="text-[#00e5ff] hover:underline font-bold">
                OPEN INTERACTIVE SANDBOX →
              </Link>
            </div>
          </div>
        </section>

        {/* METRICS STRIP */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-x border-b border-[#222220] bg-[#0b0b0b]">
          {[
            {
              num: "7 LAYERS",
              label: "CLASSICAL DIP PIPELINE",
              sub: "DCT · DWT · 2D-FFT · Wiener · Scharr",
            },
            {
              num: "100%",
              label: "MATHEMATICAL AUDITABILITY",
              sub: "Zero opaque CNN weights or GPU cost",
            },
            {
              num: "< 1.1s",
              label: "END-TO-END CPU LATENCY",
              sub: "Vectorized NumPy, SciPy & OpenCV",
            },
            {
              num: "6 / 6",
              label: "BENCHMARK SUITE ACCURACY",
              sub: "Verified across 6 forgery classes",
            },
          ].map((m, idx) => (
            <div
              key={m.label}
              className={`p-5 sm:p-7 border-b lg:border-b-0 border-[#222220] ${
                idx % 2 === 0 ? "sm:border-r" : ""
              } ${idx < 3 ? "lg:border-r" : "last:border-b-0"}`}
            >
              <div className="font-display font-black text-4xl sm:text-5xl text-[#00e5ff] tracking-tight">
                {m.num}
              </div>
              <div className="font-mono font-bold text-xs text-[#f2efe9] mt-2 tracking-wider">
                {m.label}
              </div>
              <div className="font-mono text-[11px] text-[#88857e] mt-1">{m.sub}</div>
            </div>
          ))}
        </section>

        {/* TWO DEDICATED WORKFLOWS: DEMO VS ANALYZE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          {/* Left 6 Cols: Interactive Demo & Live Tamper Sandbox */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col justify-between min-w-0 bg-[#0b0b0b]">
            <div>
              <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-widest mb-2">
                {"// WORKFLOW 01 · INTERACTIVE DEMO & SANDBOX"}
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9] mb-3">
                EXPLORE 6 BENCHMARK CASES OR FORGE AN IMAGE LIVE
              </h2>
              <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed mb-6">
                Don&apos;t have a tampered file handy? Switch between{" "}
                <strong className="text-[#f2efe9]">6 ground-truth benchmark cases</strong>{" "}
                (Splicing, Copy-Move Cloning, Gaussian Airbrushing, 4× Resampling, Double JPEG
                Phase Shift, and Authentic Camera Control) or open the{" "}
                <strong className="text-[#f2efe9]">Live Tamper Sandbox</strong> to clone-stamp,
                splice, or blur a clean photo directly on an HTML5 canvas and test detection.
              </p>

              <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px] text-[#f2efe9] mb-6">
                <div className="border border-[#222220] bg-[#111111] p-3">
                  <div className="text-[#00e5ff] font-bold">06 PRESET CASES</div>
                  <div className="text-[#88857e] text-[10px] mt-0.5">
                    Ground-truth masks &amp; telemetry
                  </div>
                </div>
                <div className="border border-[#222220] bg-[#111111] p-3">
                  <div className="text-[#ff2a2a] font-bold">TAMPER SANDBOX</div>
                  <div className="text-[#88857e] text-[10px] mt-0.5">
                    Clone, Splice &amp; Blur canvas
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Link href="/demo" className="brutal-btn w-full sm:w-auto">
                OPEN DEMO &amp; TAMPER SANDBOX →
              </Link>
            </div>
          </div>

          {/* Right 6 Cols: Custom Image Analyzer */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-w-0 bg-[#0e0e0e]">
            <div>
              <div className="font-mono text-[11px] text-[#00e676] uppercase tracking-widest mb-2">
                {"// WORKFLOW 02 · CUSTOM IMAGE AUDITOR"}
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9] mb-3">
                UPLOAD ANY IMAGE FOR FULL 7-LAYER AUDIT
              </h2>
              <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed mb-6">
                Drop any suspect JPEG, PNG, WebP, or BMP file into the dedicated analyzer. Compare
                the original against false-color heatmaps with a{" "}
                <strong className="text-[#f2efe9]">Split-Screen Slider</strong>, inspect 8×8 DCT
                blocks with a <strong className="text-[#f2efe9]">5× Synchronized Pixel Loupe</strong>
                , tune DIP parameters ($Q$-factor, wavelet basis, morphology kernel), and export a
                JSON/PDF forensic dossier.
              </p>

              <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px] text-[#f2efe9] mb-6">
                <div className="border border-[#222220] bg-[#141414] p-3">
                  <div className="text-[#00e676] font-bold">5× PIXEL LOUPE</div>
                  <div className="text-[#88857e] text-[10px] mt-0.5">
                    Synchronized RGB vs DIP zoom
                  </div>
                </div>
                <div className="border border-[#222220] bg-[#141414] p-3">
                  <div className="text-[#00e5ff] font-bold">LIVE DIP SLIDERS</div>
                  <div className="text-[#88857e] text-[10px] mt-0.5">
                    Tune Q, Wavelet &amp; Morphology
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Link href="/analyze" className="brutal-btn brutal-btn-primary w-full sm:w-auto">
                LAUNCH IMAGE ANALYZER →
              </Link>
            </div>
          </div>
        </section>

        {/* 7-PILLAR DIP SPECIFICATION GRID */}
        <section className="border-x border-b border-[#222220]">
          <div className="p-5 sm:p-8 lg:p-10 border-b border-[#222220] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] sm:text-xs text-[#00e5ff] uppercase tracking-widest mb-2">
                {"// SIGNAL PROCESSING PIPELINE SPECIFICATION"}
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f2efe9]">
                SEVEN CLASSICAL DIP DETECTORS. ZERO BLACK BOXES.
              </h2>
            </div>
            <Link
              href="/how-it-works"
              className="font-mono text-xs text-[#00e5ff] hover:underline uppercase tracking-wider shrink-0"
            >
              FULL MATHEMATICAL FORMULATION →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#222220]">
            {[
              {
                idx: "L1",
                tag: "YCbCr + 8x8 DCT",
                title: "ERROR LEVEL & JPEG GHOSTS",
                eq: "E_Q = |I_YCbCr - JPEG_Q(I)|",
                body: "Re-encodes the image across Q ∈ {75, 85, 90, 95} and normalizes residuals against Sobel edge energy to expose foreign spliced quantization floors.",
              },
              {
                idx: "L2",
                tag: "2D-DWT + WIENER + LBP/GLCM",
                title: "WAVELET & TEXTURE DESCRIPTORS",
                eq: "σ̂_b = MAD(HH_1)/0.6745 · LBP · GLCM",
                body: "Extracts Daubechies db4 HH1 wavelet noise, 5×5 Adaptive Wiener residual, Local Binary Patterns (LBP), and GLCM Contrast/Homogeneity.",
              },
              {
                idx: "L3",
                tag: "2D-DCT + PCA + ORB",
                title: "PCA & COPY-MOVE CLONES",
                eq: "Z_PCA = (X - μ)V_k,  s_ij = p_i - p_j",
                body: "Projects 16×16 2D-DCT blocks onto their Principal Components (PCA) and sorts lexicographically alongside ORB keypoints.",
              },
              {
                idx: "L4",
                tag: "LAPLACIAN + BAND-PASS/NOTCH",
                title: "2D-FFT & NOTCH SPECTRUM",
                eq: "G(u,v) = FFT2(∇²f)·H_BP·H_Notch",
                body: "Convolves luminance with a 3×3 Laplacian kernel and applies an Annular Band-Pass + Axial Notch/Band-Reject filter in 2D-FFT space.",
              },
            ].map((card) => (
              <div key={card.idx} className="p-5 sm:p-7 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-4">
                    <span className="text-[#00e5ff] font-bold">
                      [{card.idx}] {card.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-[#f2efe9] tracking-tight mb-3">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed mb-6">
                    {card.body}
                  </p>
                </div>
                <div className="border border-[#222220] bg-[#0b0b0b] p-2.5 font-mono text-[11px] text-[#00e676] overflow-x-auto">
                  {card.eq}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#222220] divide-y md:divide-y-0 md:divide-x divide-[#222220]">
            {[
              {
                idx: "L5",
                tag: "BAG PHASE (MOD 8)",
                title: "DOUBLE JPEG & 8×8 GRID",
                eq: "Δ_x = |2I(x,y) - I(x-1,y) - I(x+1,y)|",
                body: "Measures 8×8 Blocking Artifact Grid phase shifts (x mod 8, y mod 8) and AC(0,1)/AC(1,0) DCT histogram comb periodicity.",
              },
              {
                idx: "L6",
                tag: "3×3 SCHARR OPERATOR",
                title: "CHROMATIC EDGE DIVERGENCE",
                eq: "D_c = 0.5(|∇R-∇G| + |∇B-∇G|)",
                body: "Computes rotational-symmetric Scharr derivatives across R, G, and B channels to detect composite boundary seams and optical aberration shifts.",
              },
              {
                idx: "L7 + FUSION",
                tag: "DQT + OTSU MORPHOLOGY",
                title: "DQT MATRIX & REGION MASK",
                eq: "M_clean = ((M ⊖ B_1) ⊕ B_1) • B_2",
                body: "Fingerprints 64-element JPEG Luminance Quantization Tables (DQT) and fuses all spatial maps via Otsu thresholding and Morphological Opening/Closing.",
              },
            ].map((card) => (
              <div key={card.idx} className="p-5 sm:p-7 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-4">
                    <span className="text-[#00e5ff] font-bold">
                      [{card.idx}] {card.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-[#f2efe9] tracking-tight mb-3">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed mb-6">
                    {card.body}
                  </p>
                </div>
                <div className="border border-[#222220] bg-[#0b0b0b] p-2.5 font-mono text-[11px] text-[#00e676] overflow-x-auto">
                  {card.eq}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* QUICKSTART & VERIFIED BENCHMARK TABLE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          {/* Left 6 Cols: Quickstart Code */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col justify-between min-w-0">
            <div>
              <div className="font-mono text-[11px] sm:text-xs text-[#00e5ff] uppercase tracking-widest mb-2">
                {"// ZERO-CONFIG EXECUTION"}
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9] mb-4">
                RUN LOCALLY OR QUERY VIA REST API
              </h2>

              <div className="grid grid-cols-3 border border-[#222220] mb-4">
                {(Object.keys(QUICKSTART_TABS) as Array<"backend" | "curl" | "frontend">).map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setActiveTab(k)}
                      className={`py-2.5 px-1 font-mono text-[10px] sm:text-xs font-bold tracking-wider border-r border-[#222220] last:border-r-0 cursor-pointer truncate ${
                        activeTab === k
                          ? "bg-[#00e5ff] text-[#080808]"
                          : "bg-[#0e0e0e] text-[#88857e] hover:text-[#f2efe9]"
                      }`}
                    >
                      {QUICKSTART_TABS[k].label}
                    </button>
                  )
                )}
              </div>

              <div className="relative border border-[#222220] bg-[#0b0b0b] p-3.5 sm:p-4 font-mono text-[11px] sm:text-xs text-[#f2efe9] overflow-x-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="float-right ml-2 mb-2 px-2.5 py-1 border border-[#3a3834] bg-[#151515] text-[10px] font-mono uppercase text-[#f2efe9] hover:border-[#00e5ff] cursor-pointer"
                >
                  {copied ? "COPIED" : "COPY"}
                </button>
                <pre className="leading-relaxed overflow-x-auto">
                  {QUICKSTART_TABS[activeTab].code}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#222220] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <span className="text-[#88857e]">Want to inspect your own image right now?</span>
              <Link href="/analyze" className="text-[#00e676] font-bold hover:underline">
                OPEN IMAGE ANALYZER →
              </Link>
            </div>
          </div>

          {/* Right 6 Cols: Verified Benchmark Table */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-w-0">
            <div>
              <div className="font-mono text-[11px] sm:text-xs text-[#00e5ff] uppercase tracking-widest mb-2">
                {"// VERIFIED EVALUATION (`evaluate_benchmark.py`)"}
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9] mb-4">
                6-CLASS FORENSIC BENCHMARK MATRIX
              </h2>

              <div className="border border-[#222220] overflow-x-auto">
                <table className="w-full min-w-[440px] text-left font-mono text-[11px] sm:text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#222220] bg-[#0b0b0b] text-[#88857e] text-[10px] sm:text-[11px]">
                      <th className="py-3 px-2.5">ATTACK VECTOR</th>
                      <th className="py-3 px-2">PRIMARY TRIGGER</th>
                      <th className="py-3 px-2">SCORE</th>
                      <th className="py-3 px-2">VERDICT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222220]">
                    {BENCHMARK_ROWS.map((r) => (
                      <tr
                        key={r.caseId}
                        className="text-[#88857e] hover:bg-[#111111] transition-colors"
                      >
                        <td className="py-2.5 px-2.5 text-[#f2efe9] whitespace-nowrap">
                          {r.attack}
                        </td>
                        <td className="py-2.5 px-2 text-[#00e5ff] whitespace-nowrap">
                          {r.topLayer}
                        </td>
                        <td className="py-2.5 px-2 text-[#f2efe9] font-bold whitespace-nowrap">
                          {r.score}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                              r.tampered
                                ? "border-[#ff2a2a] text-[#ff2a2a] bg-[#ff2a2a]/10"
                                : "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                            }`}
                          >
                            {r.verdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#222220] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <span className="text-[#88857e]">Accuracy: 6 / 6 (100.0%) across all classes</span>
              <Link href="/demo" className="text-[#00e5ff] font-bold hover:underline">
                TEST ALL 6 CASES LIVE →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
