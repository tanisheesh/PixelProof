"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TamperCanvas from "@/components/sandbox/TamperCanvas";
import { analyzeUploadedFile } from "@/lib/api";
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

export default function SandboxPage() {
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSandboxAnalyze = async (file: File) => {
    setIsLoading(true);
    try {
      const { report: rep } = await analyzeUploadedFile(file, DEFAULT_PARAMS);
      setReport(rep);
    } catch {
      // Handled internally
    } finally {
      setIsLoading(false);
    }
  };

  const isTampered = report ? report.verdict === "TAMPERED" : false;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#080808] text-[#f2efe9]">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6 py-4">
        {/* Header */}
        <section className="border border-[#222220] bg-[#0e0e0e] p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-1 font-bold">
              {"// [02] INTERACTIVE LIVE TAMPER SANDBOX"}
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-[#f2efe9]">
              CREATE A FORGERY &amp; WATCH IT GET DETECTED LIVE
            </h1>
            <p className="text-xs sm:text-sm text-[#88857e] mt-1 max-w-2xl leading-relaxed">
              Select an attack tool (Clone Tree, Paste Balloon, or Blur/Erase), click anywhere on the
              clean photo to edit it, and watch the detector immediately isolate your exact edit with a Red Box!
            </p>
          </div>

          <Link href="/" className="brutal-btn shrink-0">
            ← BACK TO MAIN DETECTOR
          </Link>
        </section>

        {/* Live Canvas Tool */}
        <TamperCanvas onAnalyzeTamperedFile={handleSandboxAnalyze} isAnalyzing={isLoading} />

        {/* Detection Output below Sandbox */}
        {report && (
          <section className="panel-frame p-5 space-y-5">
            <div className="panel-header">
              <span>STEP 2: INSTANT FORGERY DETECTION RESULT</span>
              <span
                className={`px-2 py-0.5 border font-bold text-xs ${
                  isTampered
                    ? "border-[#ff2a2a] text-[#ff2a2a] bg-[#ff2a2a]/10"
                    : "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                }`}
              >
                ● {report.verdict} [SCORE: {report.overall_score.toFixed(1)} / 100]
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Original Edited Canvas */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>1. YOUR TAMPERED PHOTO</span>
                  <span className="text-[#88857e]">EDITED INPUT</span>
                </div>
                <div className="p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.original_preview_base64}
                    alt="Tampered Canvas"
                    className="max-h-[280px] w-full object-contain"
                  />
                </div>
                <div className="border-t border-[#222220] bg-[#0b0b0b] p-2 text-center font-mono text-[10px] text-[#88857e]">
                  PHOTO AFTER YOUR CANVAS EDIT
                </div>
              </div>

              {/* Anomaly Heatmap */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>2. DIP RESIDUAL HEATMAP</span>
                  <span className="text-[#00e5ff] font-bold">X-RAY FILTER</span>
                </div>
                <div className="p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.composite_heatmap_base64}
                    alt="DIP Heatmap"
                    className="max-h-[280px] w-full object-contain"
                  />
                </div>
                <div className="border-t border-[#222220] bg-[#0b0b0b] p-2 text-center font-mono text-[10px] text-[#00e5ff]">
                  GLOWING REGION HIGHLIGHTS DETECTED TAMPERING
                </div>
              </div>

              {/* Detected Bounding Box */}
              <div className="panel-frame flex flex-col">
                <div className="panel-header">
                  <span>3. DETECTED TAMPER BOUNDING BOX</span>
                  <span className="text-[#ff2a2a] font-bold">LOCALIZED</span>
                </div>
                <div className="relative p-3 bg-[#050505] flex-1 flex items-center justify-center min-h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.original_preview_base64}
                    alt="Detected Overlay"
                    className="max-h-[280px] w-full object-contain"
                  />
                  <svg
                    viewBox={`0 0 ${report.image_width} ${report.image_height}`}
                    className="absolute inset-3 max-h-[280px] w-full h-full pointer-events-none"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {report.clone_vectors.map((vec: CloneVector, idx: number) => (
                      <g key={`vec-${idx}`}>
                        <line
                          x1={vec.src_x}
                          y1={vec.src_y}
                          x2={vec.dst_x}
                          y2={vec.dst_y}
                          stroke="#00E5FF"
                          strokeWidth="3"
                          strokeDasharray="4 2"
                        />
                        <rect x={vec.src_x - 4} y={vec.src_y - 4} width="8" height="8" fill="#00E676" />
                        <rect x={vec.dst_x - 4} y={vec.dst_y - 4} width="8" height="8" fill="#FF2A2A" />
                      </g>
                    ))}
                    {report.bounding_boxes.map((box: BoundingBox) => (
                      <g key={`box-${box.id}`}>
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          fill="rgba(255, 42, 42, 0.22)"
                          stroke="#FF2A2A"
                          strokeWidth="3"
                        />
                        <rect
                          x={box.x}
                          y={Math.max(0, box.y - 18)}
                          width={Math.min(report.image_width - box.x, 160)}
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
                          {`FAKE REGION // ${box.confidence.toFixed(0)}%`}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="border-t border-[#222220] bg-[#0b0b0b] p-2 text-center font-mono text-[10px] text-[#ff2a2a] font-bold">
                  RED BOUNDING BOX MARKS YOUR EXACT EDIT
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="border border-[#222220] bg-[#0b0b0b] p-4 text-xs font-mono text-[#88857e]">
              <strong className="text-[#f2efe9] uppercase block mb-1">
                DETECTION EXPLANATION:
              </strong>
              {report.executive_summary}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
