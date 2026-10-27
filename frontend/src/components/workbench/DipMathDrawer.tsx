"use client";

import React from "react";
import { LayerResult } from "@/lib/types";

interface DipMathDrawerProps {
  layer: LayerResult;
}

export default function DipMathDrawer({ layer }: DipMathDrawerProps) {
  const { dip_math, histogram_data, metrics, finding_details } = layer;
  const maxHist = Math.max(...histogram_data, 0.01);

  return (
    <div className="panel-frame">
      <div className="panel-header">
        <span>
          SIGNAL_INSPECTOR // {dip_math.signal_domain.toUpperCase()}
        </span>
        <span className="text-[#00e5ff]">
          FUSION WEIGHT: {(layer.weight * 100).toFixed(0)}%
        </span>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Formula, Interpretation, Findings */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#00e5ff] mb-1">
              ACTIVE OPERATOR
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl uppercase text-[#f2efe9] tracking-tight">
              {dip_math.algorithm_name}
            </h3>
          </div>

          <div className="border border-[#222220] bg-[#080808] p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#88857e] mb-1.5">
              GOVERNING MATHEMATICAL FORMULATION
            </div>
            <pre className="font-mono text-xs text-[#00e676] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {dip_math.latex_formula}
            </pre>
          </div>

          <div className="border border-[#222220] bg-[#0b0b0b] p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#f2efe9] font-bold mb-1">
              FORENSIC SIGNAL INTERPRETATION
            </div>
            <p className="text-xs text-[#88857e] leading-relaxed">
              {dip_math.interpretation_guide}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#88857e]">
              QUANTITATIVE LAYER TELEMETRY
            </div>
            {finding_details.map((detail, i) => (
              <div
                key={i}
                className="border border-[#222220] bg-[#080808] px-3 py-2 font-mono text-[11px] text-[#f2efe9] flex items-start gap-2"
              >
                <span className="text-[#00e5ff] font-bold shrink-0">[{i + 1}]</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: 32-Bin Residual Histogram, Metrics & Kernel Matrix */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          {/* 32-Bin Histogram */}
          <div className="border border-[#222220] bg-[#080808] p-3.5">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#88857e] mb-2">
              <span>32-BIN RESIDUAL ENERGY HISTOGRAM</span>
              <span className="text-[#00e5ff]">[0..255]</span>
            </div>
            <div className="flex h-24 items-end gap-[2px] pt-2 border-b border-[#222220]">
              {histogram_data.map((val, idx) => {
                const heightPct = Math.max(4, Math.round((val / maxHist) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-[#00e5ff] hover:bg-[#00e676] transition-colors"
                    style={{ height: `${heightPct}%` }}
                    title={`Bin ${idx}: ${(val * 100).toFixed(2)}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="border border-[#222220] bg-[#080808] p-2.5 font-mono">
                <div className="text-[10px] uppercase text-[#88857e] truncate">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="mt-1 text-sm font-bold text-[#f2efe9] truncate">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Convolution Kernel or DQT Matrix */}
          {dip_math.kernel_or_matrix && (
            <div className="border border-[#222220] bg-[#080808] p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#88857e] mb-2">
                ACTIVE OPERATOR KERNEL / DQT SUB-MATRIX
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[10px] text-center text-[#f2efe9]">
                  <tbody>
                    {dip_math.kernel_or_matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-[#222220] bg-[#111111] px-1.5 py-1"
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
