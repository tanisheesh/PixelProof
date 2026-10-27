"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  ShieldAlert,
  Target,
} from "lucide-react";
import { ForensicReport } from "@/lib/types";

interface VerdictCardProps {
  report: ForensicReport;
  engineMode: "fastapi" | "browser";
}

export default function VerdictCard({ report, engineMode }: VerdictCardProps) {
  const isTampered = report.verdict === "TAMPERED";
  const isSuspicious = report.verdict === "SUSPICIOUS";

  const badgeStyles = isTampered
    ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
    : isSuspicious
    ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
    : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300";

  const ringColor = isTampered
    ? "text-rose-500"
    : isSuspicious
    ? "text-amber-400"
    : "text-emerald-400";

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
    <div className="rounded-xl border border-slate-800/90 bg-[#0B0F17] p-4 space-y-4">
      {/* Top Status Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Dossier {report.report_id}
          </span>
          <h2 className="text-sm font-bold text-slate-100 truncate max-w-[190px]">
            {report.filename}
          </h2>
        </div>

        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-wider ${badgeStyles}`}
        >
          {isTampered ? (
            <ShieldAlert className="h-3.5 w-3.5" />
          ) : isSuspicious ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {report.verdict}
        </span>
      </div>

      {/* Score Gauge + Telemetry */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-slate-800 bg-[#070A10]">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={ringColor}
              strokeDasharray={`${report.overall_score}, 100`}
              strokeWidth="3.2"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="text-center">
            <span className="font-mono text-lg font-extrabold text-slate-100">
              {report.overall_score.toFixed(0)}
            </span>
            <span className="block font-mono text-[9px] text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Confidence Interval:</span>
            <span className="font-mono font-semibold text-slate-200">{report.confidence}%</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Suspect Regions:</span>
            <span className="font-mono font-semibold text-rose-400">
              {report.bounding_boxes.length} Isolated
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Execution Latency:</span>
            <span className="flex items-center gap-1 font-mono text-cyan-400">
              <Clock className="h-3 w-3" />
              {report.processing_time_ms.toFixed(0)} ms
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Compute Engine:</span>
            <span className="font-mono text-[11px] text-emerald-400">
              {engineMode === "fastapi" ? "Python SciPy/OpenCV" : "Browser Canvas DIP"}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <p className="rounded-lg border border-slate-800/80 bg-[#070A10] p-3 text-xs leading-relaxed text-slate-300">
        {report.executive_summary}
      </p>

      {/* Isolated Bounding Boxes List */}
      {report.bounding_boxes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Target className="h-3.5 w-3.5 text-rose-400" />
            <span>Localized Anomaly Coordinates (8-Connectivity)</span>
          </div>
          <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
            {report.bounding_boxes.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border border-rose-500/25 bg-rose-950/15 px-2.5 py-1.5 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-rose-300">Region R{b.id}</span>
                  <span className="ml-2 text-slate-300">{b.primary_cause}</span>
                  <div className="font-mono text-[10px] text-slate-400">
                    bbox: [x:{b.x}, y:{b.y}, w:{b.width}, h:{b.height}] &middot; {b.area_ratio}% area
                  </div>
                </div>
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-rose-300">
                  {b.confidence.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Dossier Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleExportJson}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>JSON Dossier</span>
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print / PDF</span>
        </button>
      </div>
    </div>
  );
}
