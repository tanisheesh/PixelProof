"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { analyzePreset, analyzeUploadedFile, fetchPresets } from "@/lib/api";
import { AnalysisParams, BoundingBox, CloneVector, ForensicReport } from "@/lib/types";

const DEFAULT_PARAMS: AnalysisParams = {
  ela_quality: 90,
  ela_scale: 18.0,
  wavelet_family: "db4",
  noise_block_size: 32,
  copy_move_threshold: 0.88,
  morph_kernel_size: 7,
  colormap: "inferno",
};

export default function ForgeryDetectorPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("splice_badge");
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [activeMethod, setActiveMethod] = useState<"composite" | "boundary" | "copymove" | "noise" | "ela">("composite");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInitialCase = useCallback(async () => {
    setIsLoading(true);
    await fetchPresets();
    const initialId = "splice_badge";
    setSelectedPresetId(initialId);
    const { report: rep } = await analyzePreset(initialId, DEFAULT_PARAMS);
    setReport(rep);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialCase();
  }, [loadInitialCase]);

  const handleSelectPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    setErrorMsg(null);
    setIsLoading(true);
    const { report: rep } = await analyzePreset(presetId, DEFAULT_PARAMS);
    setReport(rep);
    setIsLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPEG, PNG, WebP, BMP).");
      return;
    }
    setErrorMsg(null);
    setSelectedPresetId("");
    setIsLoading(true);
    try {
      const { report: rep } = await analyzeUploadedFile(file, DEFAULT_PARAMS);
      setReport(rep);
    } catch {
      setErrorMsg("Failed to analyze image. Please try another file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which heatmap to display based on activeMethod
  const getActiveHeatmapSrc = () => {
    if (!report) return "";
    if (activeMethod === "boundary") {
      const edgeLayer = report.layers.find((l) => l.id === "edge_chromatic");
      return edgeLayer ? edgeLayer.heatmap_base64 : report.composite_heatmap_base64;
    }
    if (activeMethod === "copymove") {
      const cmLayer = report.layers.find((l) => l.id === "copy_move");
      return cmLayer ? cmLayer.heatmap_base64 : report.composite_heatmap_base64;
    }
    if (activeMethod === "noise") {
      const noiseLayer = report.layers.find((l) => l.id === "noise_wavelet");
      return noiseLayer ? noiseLayer.heatmap_base64 : report.composite_heatmap_base64;
    }
    if (activeMethod === "ela") {
      const elaLayer = report.layers.find((l) => l.id === "ela");
      return elaLayer ? elaLayer.heatmap_base64 : report.composite_heatmap_base64;
    }
    return report.composite_heatmap_base64;
  };

  const isTampered = report ? report.verdict === "TAMPERED" : false;
  const isSuspicious = report ? report.verdict === "SUSPICIOUS" : false;

  const corePresets = [
    {
      id: "splice_badge",
      code: "CASE 01",
      title: "SPLICING ATTACK",
      desc: "Pasted foreign object with mismatched edge boundary",
      badge: "TAMPERED",
      color: "border-[#ff2a2a] text-[#ff2a2a]",
    },
    {
      id: "copymove_crate",
      code: "CASE 02",
      title: "COPY-MOVE CLONE",
      desc: "Duplicated emblem within image (links source to target)",
      badge: "TAMPERED",
      color: "border-[#ff2a2a] text-[#ff2a2a]",
    },
    {
      id: "retouch_airbrush",
      code: "CASE 03",
      title: "RETOUCH / BLUR",
      desc: "Erased texture & smoothed sensor noise cavity",
      badge: "TAMPERED",
      color: "border-[#ff2a2a] text-[#ff2a2a]",
    },
    {
      id: "authentic_camera",
      code: "CASE 04",
      title: "AUTHENTIC ORIGINAL",
      desc: "Clean camera capture with uniform sensor grain",
      badge: "AUTHENTIC",
      color: "border-[#00e676] text-[#00e676]",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Banner */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-1">
              {"// CLASSICAL DIGITAL IMAGE PROCESSING FORENSICS"}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#f2efe9]">
              IMAGE FORGERY &amp; TAMPERING DETECTOR
            </h1>
            <p className="text-xs sm:text-sm text-[#88857e] mt-1 max-w-2xl">
              Upload any image or click a test case below to detect Splicing, Copy-Move Cloning, and
              Retouching using classical spatial and frequency filters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="brutal-btn brutal-btn-primary"
            >
              UPLOAD YOUR IMAGE →
            </button>

            <Link href="/sandbox" className="brutal-btn">
              CREATE FORGERY IN SANDBOX
            </Link>
          </div>
        </section>

        {errorMsg && (
          <div className="border border-[#ff2a2a] bg-[#ff2a2a]/10 p-3 font-mono text-xs text-[#ff2a2a]">
            {errorMsg}
          </div>
        )}

        {/* 4 Instant Test Case Selector */}
        <section className="panel-frame">
          <div className="panel-header">
            <span>QUICK DEMO CASES // CLICK TO TEST FORGERY TYPES</span>
            <span className="text-[#00e5ff]">INSTANT DETECTION</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#0e0e0e] divide-y sm:divide-y-0 sm:divide-x divide-[#222220]">
            {corePresets.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-4 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected ? "bg-[#161616] ring-2 ring-inset ring-[#00e5ff]" : "hover:bg-[#121212]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                      <span className={isSelected ? "text-[#00e5ff] font-bold" : "text-[#88857e]"}>
                        {isSelected ? "● " : ""}
                        {p.code}
                      </span>
                      <span className={`px-1.5 py-0.5 font-bold border text-[9px] ${p.color}`}>
                        {p.badge}
                      </span>
                    </div>
                    <div className="font-display font-bold text-lg uppercase text-[#f2efe9]">
                      {p.title}
                    </div>
                    <p className="mt-1 text-[11px] text-[#88857e] leading-snug">{p.desc}</p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-[#00e5ff] font-bold">
                    {isSelected ? "ACTIVE CASE" : "RUN TEST →"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="panel-frame p-8 text-center font-mono text-xs text-[#00e5ff] space-y-2">
            <div className="text-lg font-bold">ANALYZING IMAGE THROUGH DIP OPERATORS...</div>
            <div className="text-[#88857e]">
              Checking Edge Gradients, Copy-Move Keypoints, Noise Variance, and Morphological Mask...
            </div>
          </div>
        )}

        {/* Main 3-Panel Inspection View */}
        {report && !isLoading && (
          <section className="space-y-5">
            {/* 3 Side-by-Side Viewport Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Box 1: Original Image */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>PANEL 01 // ORIGINAL INPUT IMAGE</span>
                  <span className="text-[#f2efe9]">
                    {report.image_width}&times;{report.image_height}PX
                  </span>
                </div>
                <div className="p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[260px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.original_preview_base64}
                    alt="Original input"
                    className="max-h-[340px] w-full object-contain"
                  />
                </div>
                <div className="border-t border-[#222220] bg-[#0b0b0b] p-2 text-center font-mono text-[10px] text-[#88857e]">
                  RAW UNMODIFIED INPUT FRAME
                </div>
              </div>

              {/* Box 2: Detection Method / Heatmap */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>PANEL 02 // DETECTION FILTER</span>
                  <span className="text-[#00e5ff] font-bold">{activeMethod.toUpperCase()}</span>
                </div>
                <div className="p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[260px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getActiveHeatmapSrc()}
                    alt="Detection Heatmap"
                    className="max-h-[340px] w-full object-contain"
                  />
                </div>
                {/* Method Switcher Buttons */}
                <div className="grid grid-cols-3 border-t border-[#222220] bg-[#080808] divide-x divide-[#222220]">
                  <button
                    type="button"
                    onClick={() => setActiveMethod("composite")}
                    className={`p-2 font-mono text-[10px] uppercase cursor-pointer ${
                      activeMethod === "composite"
                        ? "bg-[#00e5ff] text-[#080808] font-bold"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    FUSION
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMethod("boundary")}
                    className={`p-2 font-mono text-[10px] uppercase cursor-pointer ${
                      activeMethod === "boundary"
                        ? "bg-[#00e5ff] text-[#080808] font-bold"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    BOUNDARY
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMethod("copymove")}
                    className={`p-2 font-mono text-[10px] uppercase cursor-pointer ${
                      activeMethod === "copymove"
                        ? "bg-[#00e5ff] text-[#080808] font-bold"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    CLONES
                  </button>
                </div>
                <div className="grid grid-cols-2 border-t border-[#222220] bg-[#080808] divide-x divide-[#222220]">
                  <button
                    type="button"
                    onClick={() => setActiveMethod("noise")}
                    className={`p-2 font-mono text-[10px] uppercase cursor-pointer ${
                      activeMethod === "noise"
                        ? "bg-[#00e5ff] text-[#080808] font-bold"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    NOISE / BLUR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMethod("ela")}
                    className={`p-2 font-mono text-[10px] uppercase cursor-pointer ${
                      activeMethod === "ela"
                        ? "bg-[#00e5ff] text-[#080808] font-bold"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    ELA DIFFERENCE
                  </button>
                </div>
              </div>

              {/* Box 3: Final Output with Bounding Box */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>PANEL 03 // DETECTED FORGERY MASK</span>
                  <span
                    className={`px-1.5 py-0.5 border font-bold text-[9px] ${
                      isTampered
                        ? "border-[#ff2a2a] text-[#ff2a2a] bg-[#ff2a2a]/10"
                        : "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                    }`}
                  >
                    {report.bounding_boxes.length > 0
                      ? `${report.bounding_boxes.length} REGION(S)`
                      : "CLEAN"}
                  </span>
                </div>
                <div className="relative p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[260px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.original_preview_base64}
                    alt="Detected Result Overlay"
                    className="max-h-[340px] w-full object-contain"
                  />
                  {/* Overlay SVG with Bounding Boxes */}
                  <svg
                    viewBox={`0 0 ${report.image_width} ${report.image_height}`}
                    className="absolute inset-3 max-h-[340px] w-full h-full pointer-events-none"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Copy-move vectors */}
                    {report.clone_vectors.map((vec: CloneVector, idx: number) => (
                      <g key={`vec-${idx}`}>
                        <line
                          x1={vec.src_x}
                          y1={vec.src_y}
                          x2={vec.dst_x}
                          y2={vec.dst_y}
                          stroke="#00E5FF"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                        <rect x={vec.src_x - 3} y={vec.src_y - 3} width="6" height="6" fill="#00E676" />
                        <rect x={vec.dst_x - 3} y={vec.dst_y - 3} width="6" height="6" fill="#FF2A2A" />
                      </g>
                    ))}
                    {/* Bounding boxes */}
                    {report.bounding_boxes.map((box: BoundingBox) => (
                      <g key={`box-${box.id}`}>
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          fill="rgba(255, 42, 42, 0.22)"
                          stroke="#FF2A2A"
                          strokeWidth="2.5"
                        />
                        <rect
                          x={box.x}
                          y={Math.max(0, box.y - 18)}
                          width={Math.min(report.image_width - box.x, 140)}
                          height="18"
                          fill="#FF2A2A"
                        />
                        <text
                          x={box.x + 4}
                          y={Math.max(12, box.y - 4)}
                          fill="#080808"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {`R${box.id} // ${box.confidence.toFixed(0)}%`}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="border-t border-[#222220] bg-[#0b0b0b] p-2 text-center font-mono text-[10px]">
                  {report.bounding_boxes.length > 0 ? (
                    <span className="text-[#ff2a2a] font-bold">
                      RED BOUNDING BOX INDICATES DETECTED TAMPERED AREA
                    </span>
                  ) : (
                    <span className="text-[#00e676] font-bold">
                      NO LOCALIZED MANIPULATION DETECTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Verdict and Simple Explanation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Verdict Summary Box */}
              <div className="lg:col-span-4 panel-frame p-5 space-y-4">
                <div className="font-mono text-[10px] text-[#88857e] uppercase">
                  FORENSIC VERDICT RESULT
                </div>
                <div
                  className={`border p-4 text-center ${
                    isTampered
                      ? "border-[#ff2a2a] bg-[#ff2a2a]/10"
                      : isSuspicious
                      ? "border-[#ffb300] bg-[#ffb300]/10"
                      : "border-[#00e676] bg-[#00e676]/10"
                  }`}
                >
                  <div
                    className={`font-display font-black text-4xl uppercase ${
                      isTampered
                        ? "text-[#ff2a2a]"
                        : isSuspicious
                        ? "text-[#ffb300]"
                        : "text-[#00e676]"
                    }`}
                  >
                    ● {report.verdict}
                  </div>
                  <div className="font-mono text-sm font-bold text-[#f2efe9] mt-1">
                    TAMPER SCORE: {report.overall_score.toFixed(1)} / 100
                  </div>
                </div>

                <div className="font-mono text-xs space-y-2 border-t border-[#222220] pt-3 text-[#88857e]">
                  <div className="flex justify-between">
                    <span>CONFIDENCE:</span>
                    <strong className="text-[#f2efe9]">{report.confidence}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SUSPECT BOXES:</span>
                    <strong className="text-[#ff2a2a]">{report.bounding_boxes.length} REGION(S)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>CLONE VECTORS:</span>
                    <strong className="text-[#00e5ff]">{report.clone_vectors.length} MATCHES</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>PROCESSING TIME:</span>
                    <strong className="text-[#00e676]">{report.processing_time_ms} ms</strong>
                  </div>
                </div>
              </div>

              {/* Plain-English Explanation for Teacher */}
              <div className="lg:col-span-8 panel-frame p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#222220] pb-2.5 mb-3 font-mono text-xs">
                    <span className="text-[#00e5ff] font-bold">
                      WHAT THIS MEANS (EXPLANATION FOR TEACHER / EXAMINER)
                    </span>
                    <Link href="/how-it-works" className="text-[#88857e] hover:text-[#00e5ff]">
                      HOW IT WORKS →
                    </Link>
                  </div>

                  <p className="text-sm text-[#f2efe9] leading-relaxed">
                    {report.executive_summary}
                  </p>

                  {/* Isolated Regions Breakdown */}
                  {report.bounding_boxes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="font-mono text-[10px] text-[#ff2a2a] uppercase font-bold">
                        DETECTED FORGERY COORDINATES:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {report.bounding_boxes.map((b) => (
                          <div
                            key={b.id}
                            className="border border-[#ff2a2a]/30 bg-[#ff2a2a]/5 p-2.5 font-mono text-xs"
                          >
                            <div className="text-[#f2efe9] font-bold">
                              [R{b.id}] {b.primary_cause}
                            </div>
                            <div className="text-[#88857e] text-[10px] mt-0.5">
                              Box at X:{b.x}, Y:{b.y} (Width: {b.width}px, Height: {b.height}px) · {b.area_ratio}% of frame
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#222220] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-[#88857e]">
                    Want to see live Copy-Move cloning or Splicing on an interactive canvas?
                  </span>
                  <Link href="/sandbox" className="text-[#00e5ff] font-bold hover:underline">
                    OPEN LIVE TAMPER SANDBOX →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
