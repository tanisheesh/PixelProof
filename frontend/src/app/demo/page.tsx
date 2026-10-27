"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header Banner */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-1">
              {"// [02] INTERACTIVE BENCHMARK & SELF-ATTACK SANDBOX"}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#f2efe9]">
              BENCHMARK SUITE &amp; LIVE TAMPER SANDBOX
            </h1>
            <p className="text-xs sm:text-sm text-[#88857e] mt-1 max-w-2xl">
              Select any of the 6 ground-truth forensic cases below or switch to the Live Tamper
              Sandbox to clone, splice, or blur an image yourself and watch the 7 DIP layers
              isolate your edit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="grid grid-cols-2 border border-[#222220] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDemoTab("presets")}
                className={`px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider border-r border-[#222220] cursor-pointer ${
                  demoTab === "presets"
                    ? "bg-[#00e5ff] text-[#080808]"
                    : "bg-[#080808] text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                [01] 6 BENCHMARK CASES
              </button>
              <button
                type="button"
                onClick={() => setDemoTab("sandbox")}
                className={`px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider cursor-pointer ${
                  demoTab === "sandbox"
                    ? "bg-[#ff2a2a] text-[#080808]"
                    : "bg-[#080808] text-[#88857e] hover:text-[#f2efe9]"
                }`}
              >
                [02] LIVE TAMPER SANDBOX
              </button>
            </div>

            <Link href="/analyze" className="brutal-btn w-full sm:w-auto">
              UPLOAD CUSTOM IMAGE →
            </Link>
          </div>
        </section>

        {/* Active Demo Mode Panel */}
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

        {/* Full 7-Layer Forensic Workbench Grid */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5 min-w-0">
              <ImageStage report={report} activeLayer={activeLayerObj} />

              <LayerSelector
                report={report}
                activeLayerId={activeLayerId}
                onSelectLayer={setActiveLayerId}
              />

              {mathDrawerLayer && <DipMathDrawer layer={mathDrawerLayer} />}
            </div>

            <div className="lg:col-span-4 space-y-5 min-w-0">
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

      <Footer />
    </div>
  );
}
