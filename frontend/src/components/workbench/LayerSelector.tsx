"use client";

import React from "react";
import { CheckCircle2, Flame, Layers, ShieldAlert, Sparkles } from "lucide-react";
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
  const specialModes = [
    {
      id: "composite",
      label: "Composite Fusion",
      sub: "Weighted 7-Layer Map",
      score: report.overall_score,
    },
    {
      id: "annotated",
      label: "Region Overlay",
      sub: `${report.bounding_boxes.length} Connected Box(es)`,
      score: report.overall_score,
    },
    {
      id: "mask",
      label: "Morphological Mask",
      sub: "Otsu + Opening/Closing",
      score: report.overall_score,
    },
  ];

  const getBadgeColor = (score: number) => {
    if (score >= 56) return "text-rose-400 bg-rose-500/15 border-rose-500/40";
    if (score >= 33) return "text-amber-300 bg-amber-500/15 border-amber-500/40";
    return "text-emerald-400 bg-emerald-500/15 border-emerald-500/40";
  };

  return (
    <div className="space-y-3">
      {/* Composite & Morphological Views */}
      <div className="grid grid-cols-3 gap-2">
        {specialModes.map((m) => {
          const isActive = activeLayerId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectLayer(m.id)}
              className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                isActive
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-slate-800/90 bg-[#0B0F17] hover:border-slate-700"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-slate-100">{m.label}</span>
                <Sparkles className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              </div>
              <span className="mt-1 text-[11px] text-slate-400">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Individual 7 Classical DIP Layers */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>7 Classical DIP Detection Layers</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Click to inspect heatmap &amp; math</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {report.layers.map((layer: LayerResult, idx: number) => {
            const isSelected = activeLayerId === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/50"
                    : "border-slate-800/80 bg-[#070A10] hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] text-slate-400">L{idx + 1}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${getBadgeColor(
                        layer.score
                      )}`}
                    >
                      {layer.score.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-1">
                    {layer.short_name}
                  </div>
                </div>

                {/* Mini thumbnail bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      layer.score >= 56
                        ? "bg-rose-500"
                        : layer.score >= 33
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, layer.score))}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                  {layer.status === "tampered" ? (
                    <Flame className="h-3 w-3 text-rose-400 shrink-0" />
                  ) : layer.status === "suspicious" ? (
                    <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  )}
                  <span className="capitalize truncate">{layer.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
