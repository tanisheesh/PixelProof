"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Beaker,
  Cpu,
  FlaskConical,
  Upload,
} from "lucide-react";
import PresetGallery from "@/components/PresetGallery";
import TamperCanvas from "@/components/sandbox/TamperCanvas";
import DipMathDrawer from "@/components/workbench/DipMathDrawer";
import ImageStage from "@/components/workbench/ImageStage";
import LayerSelector from "@/components/workbench/LayerSelector";
import MetadataTable from "@/components/workbench/MetadataTable";
import ParameterPanel from "@/components/workbench/ParameterPanel";
import VerdictCard from "@/components/workbench/VerdictCard";
import { analyzePreset, analyzeUploadedFile, fetchPresets } from "@/lib/api";
import { AnalysisParams, ForensicReport, PresetCase } from "@/lib/types";

const DEFAULT_PARAMS: AnalysisParams = {
  ela_quality: 90,
  ela_scale: 18.0,
  wavelet_family: "db4",
  noise_block_size: 32,
  copy_move_threshold: 0.88,
  morph_kernel_size: 7,
  colormap: "inferno",
};

export default function DemoPage() {
  const [demoTab, setDemoTab] = useState<"presets" | "sandbox">("presets");
  const [presets, setPresets] = useState<PresetCase[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("splice_badge");
  const [sandboxFile, setSandboxFile] = useState<File | null>(null);
  const [params, setParams] = useState<AnalysisParams>(DEFAULT_PARAMS);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>("composite");
  const [engineMode, setEngineMode] = useState<"fastapi" | "browser">("fastapi");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadInitialDemo = useCallback(async () => {
    setIsLoading(true);
    const { presets: loadedPresets, engineMode: mode } = await fetchPresets();
    setPresets(loadedPresets);
    setEngineMode(mode);

    const initialId = loadedPresets[1]?.id || loadedPresets[0]?.id || "splice_badge";
    setSelectedPresetId(initialId);
    const { report: initialReport, engineMode: rMode } = await analyzePreset(
      initialId,
      DEFAULT_PARAMS
    );
    setReport(initialReport);
    setEngineMode(rMode);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialDemo();
  }, [loadInitialDemo]);

  const handleSelectPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    setSandboxFile(null);
    setIsLoading(true);
    const { report: nextReport, engineMode: rMode } = await analyzePreset(presetId, params);
    setReport(nextReport);
    setEngineMode(rMode);
    setIsLoading(false);
  };

  const handleSandboxAnalyze = async (file: File) => {
    setSandboxFile(file);
    setSelectedPresetId(null);
    setIsLoading(true);
    const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(file, params);
    setReport(nextReport);
    setEngineMode(rMode);
    setIsLoading(false);
  };

  const handleReanalyze = async () => {
    setIsLoading(true);
    if (sandboxFile) {
      const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(
        sandboxFile,
        params
      );
      setReport(nextReport);
      setEngineMode(rMode);
    } else if (selectedPresetId) {
      const { report: nextReport, engineMode: rMode } = await analyzePreset(
        selectedPresetId,
        params
      );
      setReport(nextReport);
      setEngineMode(rMode);
    }
    setIsLoading(false);
  };

  const activeLayerObj =
    report?.layers.find((l) => l.id === activeLayerId) ||
    (activeLayerId === "mask"
      ? "mask"
      : activeLayerId === "annotated"
      ? "annotated"
      : "composite");

  const mathDrawerLayer =
    report?.layers.find((l) => l.id === activeLayerId) || report?.layers[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 space-y-6">
      {/* Page Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            Interactive Forensic Showcase
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Benchmark Demo &amp; Live Tamper Sandbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect 6 pre-built ground-truth forgery cases or forge an image yourself in the
            browser to watch the 7 DIP layers detect your edit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-mode tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-[#0B0F17] p-1">
            <button
              type="button"
              onClick={() => setDemoTab("presets")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                demoTab === "presets"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Beaker className="h-3.5 w-3.5" />
              <span>1. Pre-Loaded Benchmark Cases</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoTab("sandbox")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                demoTab === "sandbox"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>2. Live Tamper Sandbox</span>
            </button>
          </div>

          <Link
            href="/analyze"
            className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Have your own image? Go to Analyzer &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Active Demo Selector Area */}
      {demoTab === "presets" ? (
        <PresetGallery
          presets={presets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          isLoading={isLoading}
        />
      ) : (
        <TamperCanvas
          onAnalyzeTamperedFile={handleSandboxAnalyze}
          isAnalyzing={isLoading}
        />
      )}

      {/* Engine Status Strip */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-[#0B0F17] px-4 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Active Compute Engine:{" "}
            <strong className="font-mono text-emerald-400">
              {engineMode === "fastapi"
                ? "FastAPI Python (OpenCV + SciPy + PyWavelets)"
                : "Browser Canvas DIP Engine"}
            </strong>
          </span>
        </div>
        {report && (
          <span className="font-mono text-cyan-300">
            Active Subject: <strong>{report.filename}</strong> ({report.processing_time_ms.toFixed(0)} ms)
          </span>
        )}
      </div>

      {/* Full 7-Layer Workbench Results */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-4">
            <ImageStage report={report} activeLayer={activeLayerObj} />

            <LayerSelector
              report={report}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
            />

            {mathDrawerLayer && <DipMathDrawer layer={mathDrawerLayer} />}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <VerdictCard report={report} engineMode={engineMode} />

            <ParameterPanel
              params={params}
              onChange={setParams}
              onReanalyze={handleReanalyze}
              onReset={() => setParams(DEFAULT_PARAMS)}
              isLoading={isLoading}
            />

            <MetadataTable metadata={report.metadata} />
          </div>
        </div>
      )}
    </div>
  );
}
