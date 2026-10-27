"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Code2,
  Cpu,
  FlaskConical,
  GraduationCap,
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
  const [showSyllabusModal, setShowSyllabusModal] = useState<boolean>(false);

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

            {/* Syllabus Mapping Modal Toggle */}
            <button
              type="button"
              onClick={() => setShowSyllabusModal(!showSyllabusModal)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                showSyllabusModal
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-slate-800 bg-[#0B0F17] text-slate-300 hover:border-slate-700"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-cyan-400" />
              <span>DIP Syllabus Map</span>
            </button>

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
        {/* Collapsible DIP Syllabus Mapping Reference Drawer */}
        {showSyllabusModal && (
          <div className="rounded-xl border border-cyan-500/40 bg-[#0B0F17] p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  4th-Year CSE Digital Image Processing (DIP) Syllabus Mapping
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSyllabusModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close &times;
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
              {[
                {
                  unit: "Unit 1: Color Spaces",
                  topic: "ITU-R BT.601 RGB to YCbCr Conversion & Chroma Subsampling",
                  layer: "Layer 1 (ELA)",
                },
                {
                  unit: "Unit 2: Spatial Filtering",
                  topic: "Adaptive Wiener Filter, 3x3 Scharr Gradient & 2nd-Order Laplacian",
                  layer: "Layers 2, 4, 6",
                },
                {
                  unit: "Unit 3: Frequency Domain",
                  topic: "2D Fast Fourier Transform (2D-FFT) & 2D Discrete Cosine Transform (DCT)",
                  layer: "Layers 3, 4, 5",
                },
                {
                  unit: "Unit 4: Wavelets (DWT)",
                  topic: "Haar / Daubechies db4 2D-DWT HH1 Sub-Band & Donoho MAD Noise Estimator",
                  layer: "Layer 2 (Noise)",
                },
                {
                  unit: "Unit 5: Compression",
                  topic: "JPEG 8x8 DCT Quantization Matrices (DQT), Blocking Grid & JPEG Ghosts",
                  layer: "Layers 1, 5, 7",
                },
                {
                  unit: "Unit 6: Morphology",
                  topic: "Structuring Element Erosion, Dilation, Opening (A\u2218B) & Closing (A\u2022B)",
                  layer: "Mask Fusion",
                },
                {
                  unit: "Unit 7: Segmentation",
                  topic: "Otsu Thresholding, 8-Connected Component Labeling & ORB Keypoints",
                  layer: "Region Localization",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-[#070A10] p-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="font-mono text-[10px] font-bold text-cyan-400">{item.unit}</div>
                    <div className="mt-1 text-[11px] text-slate-200 leading-snug">{item.topic}</div>
                  </div>
                  <div className="mt-2 border-t border-slate-800/80 pt-1 font-mono text-[10px] text-emerald-400">
                    &rarr; {item.layer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
