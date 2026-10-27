"use client";

import React from "react";
import { ForensicReport, LayerResult } from "@/lib/types";

interface LayerSelectorProps {
  report: ForensicReport;
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
}

export default function LayerSelector({
  report,
  activeLayerId,
  onSelectLayer,
}: LayerSelectorProps) {
  const compositeModes = [
    {
      id: "composite",
      code: "F01",
      label: "COMPOSITE FUSION",
      sub: "Weighted 7-Layer Map",
    },
    {
      id: "annotated",
      code: "F02",
      label: "REGION OVERLAY",
      sub: `${report.bounding_boxes.length} Connected Box(es)`,
    },
    {
      id: "mask",
      code: "F03",
      label: "MORPHOLOGICAL MASK",
      sub: "Otsu + Open/Close",
    },
  ];

  const getScoreBadge = (score: number) => {
    if (score >= 56) return "border-[#ff2a2a] text-[#ff2a2a] bg-[#ff2a2a]/10";
    if (score >= 33) return "border-[#ffb300] text-[#ffb300] bg-[#ffb300]/10";
    return "border-[#00e676] text-[#00e676] bg-[#00e676]/10";
  };

  return (
    <div className="space-y-3">
      {/* 3 Fusion Views */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#222220] bg-[#0e0e0e] divide-y sm:divide-y-0 sm:divide-x divide-[#222220]">
        {compositeModes.map((m) => {
          const isActive = activeLayerId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectLayer(m.id)}
              className={`p-3.5 text-left font-mono transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#151515] border-b-2 border-b-[#00e5ff]"
                  : "hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#88857e] mb-1">
                <span>[{m.code}] FUSION_VIEW</span>
                <span className={isActive ? "text-[#00e5ff] font-bold" : "text-[#4a4843]"}>
                  {isActive ? "● ACTIVE" : "SELECT"}
                </span>
              </div>
              <div className="text-xs font-bold text-[#f2efe9] tracking-wider">{m.label}</div>
              <div className="text-[11px] text-[#88857e] mt-0.5">{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 7 Individual Classical DIP Layers */}
      <div className="panel-frame">
        <div className="panel-header">
          <span>7 CLASSICAL DIP DETECTION LAYERS // CLICK TO INSPECT HEATMAP &amp; MATH</span>
          <span className="text-[#00e5ff]">ORTHOGONAL SIGNAL DOMAINS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y divide-[#222220] bg-[#0e0e0e]">
          {report.layers.map((layer: LayerResult, idx: number) => {
            const isSelected = activeLayerId === layer.id;
            const barColor =
              layer.score >= 56
                ? "bg-[#ff2a2a]"
                : layer.score >= 33
                ? "bg-[#ffb300]"
                : "bg-[#00e676]";

            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className={`p-3 text-left font-mono flex flex-col justify-between transition-colors cursor-pointer min-w-0 ${
                  isSelected
                    ? "bg-[#161616] ring-1 ring-inset ring-[#00e5ff]"
                    : "hover:bg-[#121212]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] text-[#88857e] font-bold">L0{idx + 1}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold border ${getScoreBadge(
                        layer.score
                      )}`}
                    >
                      {layer.score.toFixed(0)}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#f2efe9] truncate">
                    {layer.short_name.toUpperCase()}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full h-1.5 bg-[#1c1c1a]">
                    <div
                      className={`h-full ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(8, layer.score))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[9px] uppercase tracking-wider text-[#88857e] truncate">
                    STATUS: <span className="text-[#f2efe9]">{layer.status}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
