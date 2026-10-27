"use client";

import React from "react";
import { PresetCase } from "@/lib/types";

interface PresetGalleryProps {
  presets: PresetCase[];
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  isLoading: boolean;
}

export default function PresetGallery({
  presets,
  selectedPresetId,
  onSelectPreset,
  isLoading,
}: PresetGalleryProps) {
  return (
    <div className="panel-frame">
      <div className="panel-header">
        <span>BENCHMARK_SUITE // 6 GROUND-TRUTH FORENSIC TEST CASES</span>
        <span className="text-[#00e5ff]">CLICK ANY CASE TO EXECUTE 7 DIP LAYERS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 bg-[#0e0e0e] border-l border-t border-[#222220] -ml-[1px] -mt-[1px]">
        {presets.map((p, idx) => {
          const isSelected = selectedPresetId === p.id;
          const isAuth = p.expected_verdict === "AUTHENTIC";
          return (
            <button
              key={p.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectPreset(p.id)}
              className={`h-full p-3.5 text-left flex flex-col justify-between border-r border-b border-[#222220] transition-colors cursor-pointer min-w-0 ${
                isSelected
                  ? "bg-[#151515] ring-2 ring-inset ring-[#00e5ff]"
                  : "hover:bg-[#121212]"
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between font-mono text-[10px] mb-2">
                  <span className={isSelected ? "text-[#00e5ff] font-bold" : "text-[#88857e]"}>
                    {isSelected ? "● " : ""}CASE_0{idx + 1}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 font-bold border text-[9px] ${
                      isAuth
                        ? "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                        : "border-[#ff2a2a] text-[#ff2a2a] bg-[#ff2a2a]/10"
                    }`}
                  >
                    {p.expected_verdict}
                  </span>
                </div>

                <div className="relative mb-2.5 h-24 w-full overflow-hidden border border-[#222220] bg-[#080808]">
                  {p.preview_base64 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.preview_base64}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-mono text-[10px] text-[#4a4843]">
                      RENDERING...
                    </div>
                  )}
                </div>

                <div className="font-display font-bold text-lg uppercase text-[#f2efe9] leading-tight line-clamp-1">
                  {p.title}
                </div>
                <p className="mt-1 text-[11px] text-[#88857e] line-clamp-2 leading-snug min-h-[30px]">
                  {p.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#222220] flex flex-wrap gap-1 w-full">
                {p.dip_concepts_highlighted.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="bg-[#080808] border border-[#222220] px-1.5 py-0.5 font-mono text-[9px] text-[#00e5ff] truncate max-w-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
