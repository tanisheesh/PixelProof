"use client";

import React from "react";
import { ForensicReport } from "@/lib/types";

interface VerdictCardProps {
  report: ForensicReport;
  engineMode: "fastapi" | "browser";
}

export default function VerdictCard({ report, engineMode }: VerdictCardProps) {
  const isTampered = report.verdict === "TAMPERED";
  const isSuspicious = report.verdict === "SUSPICIOUS";

  const statusColor = isTampered
    ? "text-[#ff2a2a] border-[#ff2a2a] bg-[#ff2a2a]/10"
    : isSuspicious
    ? "text-[#ffb300] border-[#ffb300] bg-[#ffb300]/10"
    : "text-[#00e676] border-[#00e676] bg-[#00e676]/10";

  const barFill = isTampered
    ? "bg-[#ff2a2a]"
    : isSuspicious
    ? "bg-[#ffb300]"
    : "bg-[#00e676]";

  const handleExportJson = () => {
    const cleanPayload = {
      report_id: report.report_id,
      filename: report.filename,
      verdict: report.verdict,
      overall_score: report.overall_score,
      confidence: report.confidence,
      processing_time_ms: report.processing_time_ms,
      dimensions: `${report.image_width}x${report.image_height}`,
      executive_summary: report.executive_summary,
      bounding_boxes: report.bounding_boxes,
      clone_vectors_count: report.clone_vectors.length,
      parameters: report.parameters,
      layers: report.layers.map((l) => ({
        id: l.id,
        name: l.name,
        score: l.score,
        status: l.status,
        summary: l.summary,
        metrics: l.metrics,
        dip_math: l.dip_math,
      })),
      metadata: report.metadata,
    };
    const blob = new Blob([JSON.stringify(cleanPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_id}-${report.filename.replace(/\.[^.]+$/, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-frame">
      <div className="panel-header">
        <span>DOSSIER // {report.report_id}</span>
        <span className={`px-2 py-0.5 border font-bold ${statusColor}`}>
          ● {report.verdict}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Big Score & Telemetry Readout */}
        <div className="grid grid-cols-12 border border-[#222220] bg-[#080808]">
          <div className="col-span-5 p-3.5 border-r border-[#222220] flex flex-col justify-center">
            <div className="font-mono text-[10px] text-[#88857e] uppercase">TAMPER SCORE</div>
            <div className="font-display font-black text-5xl text-[#f2efe9] leading-none mt-1">
              {report.overall_score.toFixed(1)}
            </div>
            <div className="w-full h-1.5 bg-[#1c1c1a] mt-2">
              <div className={`h-full ${barFill}`} style={{ width: `${report.overall_score}%` }} />
            </div>
          </div>

          <div className="col-span-7 p-3 font-mono text-[11px] space-y-1.5 flex flex-col justify-center">
            <div className="flex justify-between">
              <span className="text-[#88857e]">CONFIDENCE:</span>
              <span className="text-[#f2efe9] font-bold">{report.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88857e]">REGIONS:</span>
              <span className="text-[#ff2a2a] font-bold">
                {report.bounding_boxes.length} ISOLATED
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88857e]">LATENCY:</span>
              <span className="text-[#00e5ff] font-bold">
                {report.processing_time_ms.toFixed(0)} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88857e]">RUNTIME:</span>
              <span className="text-[#00e676]">
                {engineMode === "fastapi" ? "PYTHON/OPENCV" : "CANVAS_DIP"}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="border border-[#222220] bg-[#0b0b0b] p-3 text-xs text-[#88857e] leading-relaxed">
          <span className="font-mono text-[10px] text-[#f2efe9] font-bold uppercase block mb-1">
            EXECUTIVE FINDING // {report.filename}
          </span>
          {report.executive_summary}
        </div>

        {/* Localized Bounding Boxes */}
        {report.bounding_boxes.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#ff2a2a] font-bold">
              ISOLATED ANOMALY REGIONS (8-CONNECTIVITY)
            </div>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {report.bounding_boxes.map((b) => (
                <div
                  key={b.id}
                  className="border border-[#ff2a2a]/40 bg-[#ff2a2a]/5 p-2.5 font-mono text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[#f2efe9] font-bold truncate">
                      [R{b.id}] {b.primary_cause}
                    </div>
                    <div className="text-[10px] text-[#88857e]">
                      BBOX [x:{b.x}, y:{b.y}, w:{b.width}, h:{b.height}] &middot; {b.area_ratio}%
                    </div>
                  </div>
                  <span className="border border-[#ff2a2a] px-1.5 py-0.5 text-[10px] font-bold text-[#ff2a2a] shrink-0">
                    {b.confidence.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="brutal-btn !py-2 !px-3 !text-[10px] w-full"
          >
            EXPORT JSON DOSSIER
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="brutal-btn !py-2 !px-3 !text-[10px] w-full"
          >
            PRINT / PDF REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
