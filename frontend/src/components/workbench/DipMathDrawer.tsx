"use client";

import React from "react";
import { BookOpen, Cpu, BarChart3, Sigma } from "lucide-react";
import { LayerResult } from "@/lib/types";

interface DipMathDrawerProps {
  layer: LayerResult;
}

export default function DipMathDrawer({ layer }: DipMathDrawerProps) {
  const { dip_math, histogram_data, metrics, finding_details } = layer;
  const maxHist = Math.max(...histogram_data, 0.01);

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <Sigma className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              {dip_math.syllabus_unit}
            </div>
            <h3 className="text-sm font-bold text-slate-100">{dip_math.algorithm_name}</h3>
          </div>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
          Weight: {(layer.weight * 100).toFixed(0)}% in Fusion
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Mathematical Formulation & Viva Guide */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-lg border border-slate-800 bg-[#06090F] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span>Governing DIP Mathematical Formulation</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-cyan-300 leading-relaxed">
              {dip_math.latex_formula}
            </pre>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <div className="text-xs font-semibold text-slate-200 mb-1">
              Forensic Signal Interpretation
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dip_math.interpretation_guide}
            </p>
          </div>

          {/* Quantitative Findings List */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Layer Execution Telemetry
            </div>
            {finding_details.map((detail, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-slate-800/60 bg-[#070A10] px-3 py-1.5 text-xs text-slate-300"
              >
                <span className="font-mono text-cyan-400 font-bold">&rsaquo;</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Residual Histogram, Active Kernel/Matrix & Metrics */}
        <div className="lg:col-span-5 space-y-3">
          {/* 32-Bin Intensity Histogram */}
          <div className="rounded-lg border border-slate-800 bg-[#06090F] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                32-Bin Residual Energy Histogram
              </span>
              <span className="font-mono text-[10px] text-slate-400">[0 .. 255]</span>
            </div>
            <div className="flex h-20 items-end gap-0.5 pt-2">
              {histogram_data.map((val, idx) => {
                const heightPct = Math.max(4, Math.round((val / maxHist) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t bg-gradient-to-t from-cyan-600/70 to-emerald-400/90 transition-all"
                    style={{ height: `${heightPct}%` }}
                    title={`Bin ${idx}: ${(val * 100).toFixed(2)}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Computed Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-slate-800/80 bg-[#070A10] px-3 py-2"
              >
                <div className="text-[10px] font-mono uppercase text-slate-400 truncate">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold text-slate-100">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Convolution Kernel or Quantization Sub-Matrix if present */}
          {dip_math.kernel_or_matrix && (
            <div className="rounded-lg border border-slate-800 bg-[#06090F] p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <Cpu className="h-3 w-3 text-cyan-400" />
                <span>Operator Kernel / DQT Matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[11px] text-center text-slate-300">
                  <tbody>
                    {dip_math.kernel_or_matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-slate-800 bg-slate-900/60 px-1.5 py-0.5"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
