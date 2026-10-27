"use client";

import React from "react";
import { Beaker, CheckCircle2, ShieldAlert } from "lucide-react";
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
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Beaker className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Forensic Benchmark Suite (6 Ground-Truth Test Cases)
          </h3>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Select a case to run all 7 DIP algorithms
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {presets.map((p) => {
          const isSelected = selectedPresetId === p.id;
          const isAuth = p.expected_verdict === "AUTHENTIC";
          return (
            <button
              key={p.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectPreset(p.id)}
              className={`group flex flex-col justify-between rounded-lg border p-2.5 text-left transition cursor-pointer ${
                isSelected
                  ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/50"
                  : "border-slate-800/80 bg-[#070A10] hover:border-slate-700"
              }`}
            >
              <div>
                {p.preview_base64 && (
                  <div className="relative mb-2 h-20 w-full overflow-hidden rounded border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.preview_base64}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span
                      className={`absolute top-1 right-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                        isAuth
                          ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-950/90 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {isAuth ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <ShieldAlert className="h-2.5 w-2.5" />
                      )}
                      {p.expected_verdict}
                    </span>
                  </div>
                )}

                <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-1">
                  {p.title}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-snug">
                  {p.description}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
                {p.dip_concepts_highlighted.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300/90 truncate max-w-full"
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
