"use client";

import React from "react";
import { FileCode2, AlertCircle, CheckCircle, Binary } from "lucide-react";
import { MetadataForensics } from "@/lib/types";

interface MetadataTableProps {
  metadata: MetadataForensics;
}

export default function MetadataTable({ metadata }: MetadataTableProps) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Container, EXIF &amp; JPEG DQT Forensics
          </h3>
        </div>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
          {metadata.format} &middot; {(metadata.file_size_bytes / 1024).toFixed(1)} KB
        </span>
      </div>

      {/* Container Summary Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-800/80 bg-[#070A10] p-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Software Signature</div>
          <div className="mt-0.5 font-mono font-semibold text-slate-200 truncate">
            {metadata.software_signature || "None (Clean)"}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#070A10] p-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Camera Make / Model</div>
          <div className="mt-0.5 font-mono font-semibold text-slate-200 truncate">
            {metadata.camera_make_model || "Stripped / Absent"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/80 bg-[#070A10] p-2.5 text-xs">
        <div className="text-[10px] font-mono uppercase text-slate-400">
          Luminance Quantization Table (DQT) Fingerprint
        </div>
        <div className="mt-0.5 font-mono text-cyan-300">{metadata.quantization_table_source}</div>
      </div>

      {/* Anomaly Flags */}
      <div className="space-y-1.5">
        {metadata.anomalies.map((anom, idx) => {
          const isCleanMsg = anom.startsWith("No editing");
          return (
            <div
              key={idx}
              className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                isCleanMsg
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                  : "border-amber-500/30 bg-amber-950/20 text-amber-300"
              }`}
            >
              {isCleanMsg ? (
                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              )}
              <span>{anom}</span>
            </div>
          );
        })}
      </div>

      {/* 8x8 Luminance DQT Matrix Preview */}
      {metadata.luminance_dqt && (
        <div className="pt-1">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <Binary className="h-3 w-3 text-cyan-400" />
            <span>8&times;8 Luminance Quantization Matrix Q(u,v)</span>
          </div>
          <div className="overflow-x-auto rounded border border-slate-800 bg-[#05070B] p-1.5">
            <table className="w-full border-collapse font-mono text-[10px] text-center text-slate-300">
              <tbody>
                {metadata.luminance_dqt.slice(0, 8).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.slice(0, 8).map((val, cIdx) => (
                      <td key={cIdx} className="border border-slate-800/70 py-0.5 px-1">
                        {val}
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
  );
}
