"use client";

import React from "react";
import { RotateCcw, Sliders, Play } from "lucide-react";
import { AnalysisParams } from "@/lib/types";

interface ParameterPanelProps {
  params: AnalysisParams;
  onChange: (next: AnalysisParams) => void;
  onReanalyze: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function ParameterPanel({
  params,
  onChange,
  onReanalyze,
  onReset,
  isLoading,
}: ParameterPanelProps) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            DIP Lab Parameter Tuning
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition"
          title="Reset parameters to standard defaults"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* ELA JPEG Quality Factor Q */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">ELA Re-Compression Quality (Q)</span>
            <span className="font-mono text-cyan-400 font-bold">{params.ela_quality}</span>
          </div>
          <input
            type="range"
            min={55}
            max={98}
            value={params.ela_quality}
            onChange={(e) => onChange({ ...params, ela_quality: Number(e.target.value) })}
            className="w-full h-1.5 accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
            <span>Q=55 (Heavy DCT)</span>
            <span>Q=90 (Std)</span>
            <span>Q=98 (Fine)</span>
          </div>
        </div>

        {/* ELA Residual Gain */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">ELA Difference Gain (&gamma;)</span>
            <span className="font-mono text-cyan-400 font-bold">{params.ela_scale}&times;</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={params.ela_scale}
            onChange={(e) => onChange({ ...params, ela_scale: Number(e.target.value) })}
            className="w-full h-1.5 accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Discrete Wavelet Transform Basis */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">2D-DWT Wavelet Basis</span>
            <span className="font-mono uppercase text-cyan-400 font-bold">{params.wavelet_family}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["haar", "db2", "db4"] as const).map((wf) => (
              <button
                key={wf}
                type="button"
                onClick={() => onChange({ ...params, wavelet_family: wf })}
                className={`rounded-md border py-1 font-mono text-xs uppercase transition ${
                  params.wavelet_family === wf
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
              >
                {wf}
              </button>
            ))}
          </div>
        </div>

        {/* Sliding Block Size for Noise Estimation */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">Noise MAD Sliding Window</span>
            <span className="font-mono text-cyan-400 font-bold">
              {params.noise_block_size}&times;{params.noise_block_size} px
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[16, 32, 48].map((bs) => (
              <button
                key={bs}
                type="button"
                onClick={() => onChange({ ...params, noise_block_size: bs })}
                className={`rounded-md border py-1 font-mono text-xs transition ${
                  params.noise_block_size === bs
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
              >
                {bs}&times;{bs}
              </button>
            ))}
          </div>
        </div>

        {/* Morphological Structuring Element Kernel */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">Morphological SE Kernel (B)</span>
            <span className="font-mono text-cyan-400 font-bold">
              {params.morph_kernel_size}&times;{params.morph_kernel_size}
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={17}
            step={2}
            value={params.morph_kernel_size}
            onChange={(e) => onChange({ ...params, morph_kernel_size: Number(e.target.value) })}
            className="w-full h-1.5 accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* False-Color LUT Colormap */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300 font-medium">False-Color Heatmap LUT</span>
            <span className="font-mono uppercase text-cyan-400 font-bold">{params.colormap}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(["inferno", "viridis", "jet", "hot"] as const).map((cm) => (
              <button
                key={cm}
                type="button"
                onClick={() => onChange({ ...params, colormap: cm })}
                className={`rounded-md border py-1 font-mono text-[11px] capitalize transition ${
                  params.colormap === cm
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cm}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={onReanalyze}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        <span>{isLoading ? "Recomputing 7 DIP Layers..." : "Re-Run Pipeline with Parameters"}</span>
      </button>
    </div>
  );
}
