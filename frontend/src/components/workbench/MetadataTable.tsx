"use client";

import React from "react";
import { MetadataForensics } from "@/lib/types";

interface MetadataTableProps {
  metadata: MetadataForensics;
}

export default function MetadataTable({ metadata }: MetadataTableProps) {
  return (
    <div className="panel-frame">
      <div className="panel-header">
        <span>CONTAINER_FORENSICS // EXIF &amp; DQT</span>
        <span className="text-[#00e5ff]">
          {metadata.format} · {(metadata.file_size_bytes / 1024).toFixed(1)} KB
        </span>
      </div>

      <div className="p-4 space-y-3 font-mono text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-[#222220] bg-[#080808] p-2.5 min-w-0">
            <div className="text-[10px] text-[#88857e]">SOFTWARE TAG</div>
            <div className="text-[#f2efe9] font-bold truncate mt-0.5">
              {metadata.software_signature || "NONE [CLEAN]"}
            </div>
          </div>
          <div className="border border-[#222220] bg-[#080808] p-2.5 min-w-0">
            <div className="text-[10px] text-[#88857e]">CAMERA MAKE/MODEL</div>
            <div className="text-[#f2efe9] font-bold truncate mt-0.5">
              {metadata.camera_make_model || "STRIPPED / ABSENT"}
            </div>
          </div>
        </div>

        <div className="border border-[#222220] bg-[#080808] p-2.5">
          <div className="text-[10px] text-[#88857e]">LUMINANCE DQT PROFILE</div>
          <div className="text-[#00e5ff] text-[11px] mt-0.5">
            {metadata.quantization_table_source}
          </div>
        </div>

        {/* Anomaly Flags */}
        <div className="space-y-1.5">
          {metadata.anomalies.map((anom, idx) => {
            const isClean = anom.startsWith("No editing");
            return (
              <div
                key={idx}
                className={`border px-2.5 py-2 text-[11px] ${
                  isClean
                    ? "border-[#00e676]/40 bg-[#00e676]/5 text-[#00e676]"
                    : "border-[#ffb300]/40 bg-[#ffb300]/5 text-[#ffb300]"
                }`}
              >
                {isClean ? "[OK] " : "[FLAG] "}
                {anom}
              </div>
            );
          })}
        </div>

        {/* 8x8 Luminance DQT Matrix */}
        {metadata.luminance_dqt && (
          <div className="pt-1">
            <div className="text-[10px] text-[#88857e] uppercase tracking-wider mb-1.5">
              8&times;8 LUMINANCE QUANTIZATION MATRIX Q(u,v)
            </div>
            <div className="overflow-x-auto border border-[#222220] bg-[#080808] p-1.5">
              <table className="w-full border-collapse text-[10px] text-center text-[#f2efe9]">
                <tbody>
                  {metadata.luminance_dqt.slice(0, 8).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.slice(0, 8).map((val, cIdx) => (
                        <td key={cIdx} className="border border-[#222220] py-0.5 px-1">
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
    </div>
  );
}
