"use client";

import React, { useRef, useState } from "react";
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
      ? "COMPOSITE_FUSION // 7-LAYER WEIGHTED MAP"
      : activeLayer === "mask"
      ? "OTSU_MORPHOLOGY // (M ⊖ B₁) ⊕ B₂ BINARY MASK"
      : activeLayer === "annotated"
      ? "CONNECTED_COMPONENTS // 8-CONNECTIVITY BBOX OVERLAY"
      : `${activeLayer.id.toUpperCase()} // ${activeLayer.name.toUpperCase()}`;

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
    <div className="panel-frame">
      {/* Top Hardware Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 bg-[#00e5ff] shrink-0" />
          <span className="text-[#f2efe9] font-bold truncate">{activeTitle}</span>
          <span className="hidden sm:inline text-[#88857e]">
            [{report.image_width}&times;{report.image_height}PX]
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Mode Selector */}
          <div className="flex border border-[#222220] bg-[#080808]">
            {(["split", "heatmap", "blend", "original"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border-r border-[#222220] last:border-r-0 cursor-pointer transition-colors ${
                  viewMode === m
                    ? "bg-[#00e5ff] text-[#080808] font-bold"
                    : "text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Overlay toggles */}
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2 py-1 font-mono text-[10px] border cursor-pointer ${
              showBoxes
                ? "border-[#ff2a2a] bg-[#ff2a2a]/15 text-[#ff2a2a] font-bold"
                : "border-[#222220] bg-[#080808] text-[#88857e]"
            }`}
          >
            BBOX [{report.bounding_boxes.length}]
          </button>

          {report.clone_vectors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              className={`px-2 py-1 font-mono text-[10px] border cursor-pointer ${
                showVectors
                  ? "border-[#00e676] bg-[#00e676]/15 text-[#00e676] font-bold"
                  : "border-[#222220] bg-[#080808] text-[#88857e]"
              }`}
            >
              VECTORS [{report.clone_vectors.length}]
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGrid8x8(!showGrid8x8)}
            className={`px-2 py-1 font-mono text-[10px] border cursor-pointer ${
              showGrid8x8
                ? "border-[#00e5ff] bg-[#00e5ff]/15 text-[#00e5ff] font-bold"
                : "border-[#222220] bg-[#080808] text-[#88857e]"
            }`}
          >
            8&times;8 DCT
          </button>

          <button
            type="button"
            onClick={() => setLoupeActive(!loupeActive)}
            className={`hidden sm:inline-block px-2 py-1 font-mono text-[10px] border cursor-pointer ${
              loupeActive
                ? "border-[#ffb300] bg-[#ffb300]/15 text-[#ffb300] font-bold"
                : "border-[#222220] bg-[#080808] text-[#88857e]"
            }`}
          >
            5&times; LOUPE
          </button>
        </div>
      </div>

      {/* Main Optical Viewport */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorNorm(null)}
        className="relative select-none bg-[#050505] flex items-center justify-center overflow-hidden cursor-crosshair p-2 sm:p-4"
        style={{ minHeight: "280px" }}
      >
        <div
          className="relative w-full max-w-[740px] max-h-[520px]"
          style={{ aspectRatio: `${report.image_width} / ${report.image_height}` }}
        >
          {/* Source RGB Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.original_preview_base64}
            alt="Original forensic frame"
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          />

          {/* Active DIP Heatmap */}
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
                alt="DIP forensic heatmap"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* 8x8 DCT Block Grid Overlay */}
          {showGrid8x8 && (
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(0, 229, 255, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 229, 255, 0.4) 1px, transparent 1px)",
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
            {showVectors &&
              report.clone_vectors.map((vec: CloneVector, idx: number) => (
                <g key={`vec-${idx}`}>
                  <line
                    x1={vec.src_x}
                    y1={vec.src_y}
                    x2={vec.dst_x}
                    y2={vec.dst_y}
                    stroke="#00E5FF"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <rect
                    x={vec.src_x - 3}
                    y={vec.src_y - 3}
                    width="6"
                    height="6"
                    fill="#00E676"
                    stroke="#080808"
                    strokeWidth="1"
                  />
                  <rect
                    x={vec.dst_x - 3}
                    y={vec.dst_y - 3}
                    width="6"
                    height="6"
                    fill="#FF2A2A"
                    stroke="#080808"
                    strokeWidth="1"
                  />
                </g>
              ))}

            {showBoxes &&
              report.bounding_boxes.map((box: BoundingBox) => (
                <g key={`box-${box.id}`}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    fill="rgba(255, 42, 42, 0.14)"
                    stroke="#FF2A2A"
                    strokeWidth="2"
                  />
                  <rect
                    x={box.x}
                    y={Math.max(0, box.y - 19)}
                    width={Math.min(report.image_width - box.x, 190)}
                    height="19"
                    fill="#FF2A2A"
                  />
                  <text
                    x={box.x + 5}
                    y={Math.max(13, box.y - 5)}
                    fill="#080808"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {`R${box.id} // ${box.confidence.toFixed(0)}% [${box.area_ratio}%]`}
                  </text>
                </g>
              ))}
          </svg>

          {/* Split-Screen Divider Bar */}
          {viewMode === "split" && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#00e5ff] pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#00e5ff] bg-[#080808] px-2 py-0.5 text-[10px] font-mono font-bold text-[#00e5ff] whitespace-nowrap">
                &larr; RGB // DIP &rarr;
              </div>
            </div>
          )}

          {/* Synchronized Dual Magnifier Loupe */}
          {loupeActive && cursorNorm && (
            <div
              className="hidden sm:flex pointer-events-none absolute z-20 gap-1.5 border border-[#00e5ff] bg-[#080808]/95 p-1.5"
              style={{
                left: cursorNorm.x > 0.55 ? "10px" : undefined,
                right: cursorNorm.x <= 0.55 ? "10px" : undefined,
                top: "10px",
              }}
            >
              <div className="relative h-24 w-24 overflow-hidden border border-[#222220]">
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
                <span className="absolute bottom-0 left-0 bg-[#080808] px-1 font-mono text-[9px] text-[#f2efe9]">
                  RGB 5&times;
                </span>
              </div>

              <div className="relative h-24 w-24 overflow-hidden border border-[#00e5ff]">
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
                <span className="absolute bottom-0 left-0 bg-[#080808] px-1 font-mono text-[9px] text-[#00e5ff]">
                  DIP 5&times;
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="border-t border-[#222220] bg-[#0b0b0b] px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] sm:text-[11px] text-[#88857e]">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <span>
            CURSOR:{" "}
            <strong className="text-[#f2efe9]">
              ({pixelX}, {pixelY})
            </strong>
          </span>
          <span>
            DCT_BLOCK:{" "}
            <strong className="text-[#00e5ff]">
              [{dctBlockX}, {dctBlockY}]
            </strong>
          </span>
          <span>
            PHASE_MOD_8:{" "}
            <strong className="text-[#00e676]">
              ({dctPhaseX}, {dctPhaseY})
            </strong>
          </span>
        </div>

        {viewMode === "split" && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span>SPLIT:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="h-1.5 w-28 accent-[#00e5ff] cursor-pointer"
            />
            <span className="text-[#00e5ff] font-bold w-8 text-right">{splitPos}%</span>
          </div>
        )}

        {viewMode === "blend" && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span>ALPHA:</span>
            <input
              type="range"
              min={10}
              max={100}
              value={blendOpacity}
              onChange={(e) => setBlendOpacity(Number(e.target.value))}
              className="h-1.5 w-28 accent-[#00e5ff] cursor-pointer"
            />
            <span className="text-[#00e5ff] font-bold w-8 text-right">{blendOpacity}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
