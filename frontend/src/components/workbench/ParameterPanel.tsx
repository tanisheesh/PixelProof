"use client";

import React from "react";
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
    <div className="panel-frame">
      <div className="panel-header">
        <span>DIP_PARAMETERS // FILTER TUNING</span>
        <button
          type="button"
          onClick={onReset}
          className="text-[#00e5ff] hover:underline cursor-pointer font-mono text-[10px]"
        >
          [RESET DEFAULTS]
        </button>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        {/* ELA JPEG Quality Factor Q */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[#88857e]">ELA JPEG QUALITY (Q)</span>
            <span className="text-[#00e5ff] font-bold">Q = {params.ela_quality}</span>
          </div>
          <input
            type="range"
            min={55}
            max={98}
            value={params.ela_quality}
            onChange={(e) => onChange({ ...params, ela_quality: Number(e.target.value) })}
            className="w-full h-1.5 accent-[#00e5ff] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#4a4843] mt-0.5">
            <span>55 [HEAVY]</span>
            <span>90 [STD]</span>
            <span>98 [FINE]</span>
          </div>
        </div>

        {/* ELA Residual Gain */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[#88857e]">ELA RESIDUAL GAIN (&gamma;)</span>
            <span className="text-[#00e5ff] font-bold">{params.ela_scale}&times;</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={params.ela_scale}
            onChange={(e) => onChange({ ...params, ela_scale: Number(e.target.value) })}
            className="w-full h-1.5 accent-[#00e5ff] cursor-pointer"
          />
        </div>

        {/* Discrete Wavelet Transform Basis */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[#88857e]">2D-DWT WAVELET BASIS</span>
            <span className="text-[#00e5ff] font-bold uppercase">{params.wavelet_family}</span>
          </div>
          <div className="grid grid-cols-3 border border-[#222220]">
            {(["haar", "db2", "db4"] as const).map((wf) => (
              <button
                key={wf}
                type="button"
                onClick={() => onChange({ ...params, wavelet_family: wf })}
                className={`py-1.5 font-mono text-[11px] uppercase border-r border-[#222220] last:border-r-0 cursor-pointer ${
                  params.wavelet_family === wf
                    ? "bg-[#00e5ff] text-[#080808] font-bold"
                    : "bg-[#080808] text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                {wf}
              </button>
            ))}
          </div>
        </div>

        {/* Sliding Block Size */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[#88857e]">MAD SLIDING WINDOW</span>
            <span className="text-[#00e5ff] font-bold">
              {params.noise_block_size}&times;{params.noise_block_size}PX
            </span>
          </div>
          <div className="grid grid-cols-3 border border-[#222220]">
            {[16, 32, 48].map((bs) => (
              <button
                key={bs}
                type="button"
                onClick={() => onChange({ ...params, noise_block_size: bs })}
                className={`py-1.5 font-mono text-[11px] border-r border-[#222220] last:border-r-0 cursor-pointer ${
                  params.noise_block_size === bs
                    ? "bg-[#00e5ff] text-[#080808] font-bold"
                    : "bg-[#080808] text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                {bs}&times;{bs}
              </button>
            ))}
          </div>
        </div>

        {/* Copy-Move Similarity Threshold */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[#88857e]">COPY-MOVE DCT THRESHOLD</span>
            <span className="text-[#00e5ff] font-bold">
              {(params.copy_move_threshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0.65}
            max={0.96}
            step={0.02}
            value={params.copy_move_threshold}
            onChange={(e) =>
              onChange({ ...params, copy_move_threshold: Number(e.target.value) })
            }
            className="w-full h-1.5 accent-[#00e5ff] cursor-pointer"
          />
        </div>

        {/* Morphological Kernel */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[#88857e]">MORPHOLOGICAL SE KERNEL (B)</span>
            <span className="text-[#00e5ff] font-bold">
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
            className="w-full h-1.5 accent-[#00e5ff] cursor-pointer"
          />
        </div>

        {/* False-Color LUT Colormap */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[#88857e]">FALSE-COLOR LUT</span>
            <span className="text-[#00e5ff] font-bold uppercase">{params.colormap}</span>
          </div>
          <div className="grid grid-cols-4 border border-[#222220]">
            {(["inferno", "viridis", "jet", "hot"] as const).map((cm) => (
              <button
                key={cm}
                type="button"
                onClick={() => onChange({ ...params, colormap: cm })}
                className={`py-1.5 font-mono text-[10px] uppercase border-r border-[#222220] last:border-r-0 cursor-pointer ${
                  params.colormap === cm
                    ? "bg-[#00e5ff] text-[#080808] font-bold"
                    : "bg-[#080808] text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                {cm}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={onReanalyze}
          className="brutal-btn brutal-btn-primary w-full"
        >
          {isLoading ? "RECOMPUTING 7 DIP LAYERS..." : "RE-RUN PIPELINE WITH PARAMETERS →"}
        </button>
      </div>
    </div>
  );
}
