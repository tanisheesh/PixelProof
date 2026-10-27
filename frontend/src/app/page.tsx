"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Code2,
  Cpu,
  FlaskConical,
  Scan,
  ShieldCheck,
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

export default function PixelProofWorkbenchPage() {
  const [presets, setPresets] = useState<PresetCase[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("splice_badge");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [params, setParams] = useState<AnalysisParams>(DEFAULT_PARAMS);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>("composite");
  const [engineMode, setEngineMode] = useState<"fastapi" | "browser">("fastapi");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSandbox, setShowSandbox] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInitialData = useCallback(async () => {
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
    loadInitialData();
  }, [loadInitialData]);

  const handleSelectPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    setUploadedFile(null);
    setIsLoading(true);
    const { report: nextReport, engineMode: rMode } = await analyzePreset(presetId, params);
    setReport(nextReport);
    setEngineMode(rMode);
    setIsLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setSelectedPresetId(null);
    setIsLoading(true);
    const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(file, params);
    setReport(nextReport);
    setEngineMode(rMode);
    setShowSandbox(false);
    setIsLoading(false);
  };

  const handleReanalyze = async () => {
    setIsLoading(true);
    if (uploadedFile) {
      const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(
        uploadedFile,
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
    <div className="min-h-screen flex flex-col bg-[#06090F]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#06090F]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Scan className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  PixelProof
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                  7-Layer DIP Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Classical Digital Image Processing Forgery &amp; Tampering Localization Workbench
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Engine Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B0F17] px-3 py-1.5 text-xs text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>Engine:</span>
              <strong className="font-mono text-emerald-400">
                {engineMode === "fastapi" ? "FastAPI + OpenCV/SciPy" : "Client Canvas DIP"}
              </strong>
            </div>

            {/* Live Tamper Sandbox Toggle */}
            <button
              type="button"
              onClick={() => setShowSandbox(!showSandbox)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                showSandbox
                  ? "border-rose-400 bg-rose-500/20 text-rose-200"
                  : "border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700"
              }`}
            >
              <FlaskConical className="h-4 w-4 text-rose-400" />
              <span>{showSandbox ? "Close Tamper Sandbox" : "Live Tamper Sandbox"}</span>
            </button>

            {/* Upload Image Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg hover:bg-cyan-400 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 px-4 py-4">
        {/* Collapsible Live Tamper Sandbox */}
        {showSandbox && (
          <TamperCanvas
            onAnalyzeTamperedFile={handleFileUpload}
            isAnalyzing={isLoading}
          />
        )}

        {/* 6 Built-in Forensic Benchmark Cases */}
        <PresetGallery
          presets={presets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          isLoading={isLoading}
        />

        {/* Primary Workbench Grid */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 Columns: Interactive Image Stage + 7-Layer Switcher + DIP Math Drawer */}
            <div className="lg:col-span-8 space-y-4">
              <ImageStage report={report} activeLayer={activeLayerObj} />

              <LayerSelector
                report={report}
                activeLayerId={activeLayerId}
                onSelectLayer={setActiveLayerId}
              />

              {mathDrawerLayer && <DipMathDrawer layer={mathDrawerLayer} />}
            </div>

            {/* Right 4 Columns: Verdict Dossier + Real-Time DIP Parameter Sliders + EXIF/DQT Table */}
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
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800/80 bg-[#05070B] py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>
              <strong>PixelProof</strong> &middot; Classical Digital Image Processing (DIP) Forensics &middot; Zero Black-Box ML
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://tanisheesh.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition"
            >
              Tanish Poddar (tanisheesh.in)
            </a>
            <a
              href="https://github.com/tanisheesh/PixelProof"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
