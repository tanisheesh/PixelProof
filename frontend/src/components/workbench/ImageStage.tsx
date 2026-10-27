"use client";

import React, { useRef, useState } from "react";
import {
  Columns,
  Eye,
  Grid,
  Layers,
  Maximize2,
  ScanLine,
  Search,
} from "lucide-react";
import { BoundingBox, CloneVector, ForensicReport, LayerResult } from "@/lib/types";

interface ImageStageProps {
  report: ForensicReport;
  activeLayer: LayerResult | "composite" | "mask" | "annotated";
}

export default function ImageStage({ report, activeLayer }: ImageStageProps) {
  const [viewMode, setViewMode] = useState<"split" | "heatmap" | "blend" | "original">("split");
  const [splitPos, setSplitPos] = useState<number>(52);
  const [blendOpacity, setBlendOpacity] = useState<number>(72);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrid8x8, setShowGrid8x8] = useState<boolean>(false);
  const [loupeActive, setLoupeActive] = useState<boolean>(true);
  const [cursorNorm, setCursorNorm] = useState<{ x: number; y: number } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);

  const activeHeatmapSrc =
    activeLayer === "composite"
      ? report.composite_heatmap_base64
      : activeLayer === "mask"
      ? report.localization_mask_base64
      : activeLayer === "annotated"
      ? report.annotated_overlay_base64
      : activeLayer.heatmap_base64;

  const activeTitle =
    activeLayer === "composite"
      ? "Multi-Layer Morphological Composite Fusion"
      : activeLayer === "mask"
      ? "Otsu + Morphological Opening/Closing Binary Mask"
      : activeLayer === "annotated"
      ? "Connected Component Tamper Localization Overlay"
      : activeLayer.name;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCursorNorm({ x: nx, y: ny });
    if (e.buttons === 1 && viewMode === "split") {
      setSplitPos(Math.round(nx * 100));
    }
  };

  const pixelX = cursorNorm ? Math.floor(cursorNorm.x * report.image_width) : 0;
  const pixelY = cursorNorm ? Math.floor(cursorNorm.y * report.image_height) : 0;
  const dctBlockX = Math.floor(pixelX / 8);
  const dctBlockY = Math.floor(pixelY / 8);
  const dctPhaseX = pixelX % 8;
  const dctPhaseY = pixelY % 8;

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#070A10] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {activeTitle}
          </span>
          <span className="hidden sm:inline-block rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
            {report.image_width} &times; {report.image_height} px
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* View mode pills */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "split"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "heatmap"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Heatmap
            </button>
            <button
              type="button"
              onClick={() => setViewMode("blend")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "blend"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Blend
            </button>
            <button
              type="button"
              onClick={() => setViewMode("original")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "original"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Source
            </button>
          </div>

          {/* Toggle overlays */}
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              showBoxes
                ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                : "border-slate-800 bg-slate-900 text-slate-400"
            }`}
            title="Toggle Connected Component Bounding Boxes"
          >
            Boxes ({report.bounding_boxes.length})
          </button>

          {report.clone_vectors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                showVectors
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-slate-800 bg-slate-900 text-slate-400"
              }`}
              title="Toggle Copy-Move Displacement Vectors"
            >
              Clones ({report.clone_vectors.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGrid8x8(!showGrid8x8)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
              showGrid8x8
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                : "border-slate-800 bg-slate-900 text-slate-400"
            }`}
            title="Toggle 8x8 DCT Block Grid Overlay"
          >
            <Grid className="h-3.5 w-3.5" />
            8&times;8 Grid
          </button>

          <button
            type="button"
            onClick={() => setLoupeActive(!loupeActive)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
              loupeActive
                ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                : "border-slate-800 bg-slate-900 text-slate-400"
            }`}
            title="Toggle Synchronized Dual Forensic Loupe"
          >
            <Search className="h-3.5 w-3.5" />
            Loupe
          </button>
        </div>
      </div>

      {/* Interactive Stage Container */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorNorm(null)}
        className="relative select-none bg-[#05070B] flex items-center justify-center overflow-hidden cursor-crosshair"
        style={{ minHeight: "360px", maxHeight: "540px" }}
      >
        <div className="relative w-full max-w-[720px] aspect-[4/3]">
          {/* Base Layer: Source Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.original_preview_base64}
            alt="Original forensic subject"
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          />

          {/* Active DIP Heatmap Layer */}
          {viewMode !== "original" && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                clipPath:
                  viewMode === "split"
                    ? `polygon(${splitPos}% 0%, 100% 0%, 100% 100%, ${splitPos}% 100%)`
                    : undefined,
                opacity: viewMode === "blend" ? blendOpacity / 100 : 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeHeatmapSrc}
                alt="DIP Forensic Heatmap"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* 8x8 DCT Block Grid Overlay */}
          {showGrid8x8 && (
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(6, 182, 212, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.35) 1px, transparent 1px)",
                backgroundSize: `${(8 / report.image_width) * 100}% ${(8 / report.image_height) * 100}%`,
              }}
            />
          )}

          {/* SVG Overlay for Connected Component Bounding Boxes & Copy-Move Vectors */}
          <svg
            viewBox={`0 0 ${report.image_width} ${report.image_height}`}
            className="absolute inset-0 h-full w-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Copy-Move Displacement Vectors */}
            {showVectors &&
              report.clone_vectors.map((vec: CloneVector, idx: number) => (
                <g key={`vec-${idx}`}>
                  <line
                    x1={vec.src_x}
                    y1={vec.src_y}
                    x2={vec.dst_x}
                    y2={vec.dst_y}
                    stroke="#06B6D4"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <circle cx={vec.src_x} cy={vec.src_y} r="4.5" fill="#10B981" stroke="#05070B" strokeWidth="1.5" />
                  <circle cx={vec.dst_x} cy={vec.dst_y} r="4.5" fill="#F43F5E" stroke="#05070B" strokeWidth="1.5" />
                </g>
              ))}

            {/* Tamper Localization Bounding Boxes */}
            {showBoxes &&
              report.bounding_boxes.map((box: BoundingBox) => (
                <g key={`box-${box.id}`}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    fill="rgba(244, 63, 94, 0.12)"
                    stroke="#F43F5E"
                    strokeWidth="2"
                  />
                  <rect
                    x={box.x}
                    y={Math.max(0, box.y - 20)}
                    width={Math.min(report.image_width - box.x, 195)}
                    height="20"
                    fill="#F43F5E"
                    rx="2"
                  />
                  <text
                    x={box.x + 5}
                    y={Math.max(14, box.y - 6)}
                    fill="#FFFFFF"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {`R${box.id}: ${box.confidence.toFixed(0)}% (${box.area_ratio}% area)`}
                  </text>
                </g>
              ))}
          </svg>

          {/* Split-Screen Divider Bar */}
          {viewMode === "split" && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300 bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 shadow-lg">
                &larr; RGB | DIP &rarr;
              </div>
            </div>
          )}

          {/* Synchronized Dual Magnifier Loupe (Source vs Active Heatmap) */}
          {loupeActive && cursorNorm && (
            <div
              className="pointer-events-none absolute z-20 flex gap-1.5 rounded-lg border border-cyan-500/60 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md"
              style={{
                left: cursorNorm.x > 0.55 ? "12px" : undefined,
                right: cursorNorm.x <= 0.55 ? "12px" : undefined,
                top: "12px",
              }}
            >
              <div className="relative h-24 w-24 overflow-hidden rounded border border-slate-700">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `url(${report.original_preview_base64})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "500% 500%",
                    backgroundPosition: `${cursorNorm.x * 100}% ${cursorNorm.y * 100}%`,
                    imageRendering: "pixelated",
                  }}
                />
                <span className="absolute bottom-0.5 left-1 rounded bg-black/75 px-1 font-mono text-[9px] text-slate-200">
                  RGB 5&times;
                </span>
              </div>

              <div className="relative h-24 w-24 overflow-hidden rounded border border-cyan-500/50">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `url(${activeHeatmapSrc})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "500% 500%",
                    backgroundPosition: `${cursorNorm.x * 100}% ${cursorNorm.y * 100}%`,
                    imageRendering: "pixelated",
                  }}
                />
                <span className="absolute bottom-0.5 left-1 rounded bg-black/75 px-1 font-mono text-[9px] text-cyan-300">
                  DIP 5&times;
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-[#070A10] px-4 py-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <span>
            XY:{" "}
            <strong className="text-slate-200">
              ({pixelX}, {pixelY})
            </strong>
          </span>
          <span>
            8&times;8 DCT Block:{" "}
            <strong className="text-cyan-400">
              [{dctBlockX}, {dctBlockY}]
            </strong>
          </span>
          <span>
            Grid Phase (mod 8):{" "}
            <strong className="text-emerald-400">
              ({dctPhaseX}, {dctPhaseY})
            </strong>
          </span>
        </div>

        {viewMode === "split" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Split Position:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="h-1.5 w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-cyan-300">{splitPos}%</span>
          </div>
        )}

        {viewMode === "blend" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Heatmap Opacity:</span>
            <input
              type="range"
              min={10}
              max={100}
              value={blendOpacity}
              onChange={(e) => setBlendOpacity(Number(e.target.value))}
              className="h-1.5 w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-cyan-300">{blendOpacity}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
