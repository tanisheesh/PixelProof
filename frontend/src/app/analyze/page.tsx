"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  FileImage,
  FolderOpen,
  RotateCcw,
  Scan,
  Sparkles,
  Upload,
} from "lucide-react";
import DipMathDrawer from "@/components/workbench/DipMathDrawer";
import ImageStage from "@/components/workbench/ImageStage";
import LayerSelector from "@/components/workbench/LayerSelector";
import MetadataTable from "@/components/workbench/MetadataTable";
import ParameterPanel from "@/components/workbench/ParameterPanel";
import VerdictCard from "@/components/workbench/VerdictCard";
import { analyzeUploadedFile } from "@/lib/api";
import { AnalysisParams, ForensicReport } from "@/lib/types";

const DEFAULT_PARAMS: AnalysisParams = {
  ela_quality: 90,
  ela_scale: 18.0,
  wavelet_family: "db4",
  noise_block_size: 32,
  copy_move_threshold: 0.88,
  morph_kernel_size: 7,
  colormap: "inferno",
};

export default function AnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [params, setParams] = useState<AnalysisParams>(DEFAULT_PARAMS);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>("composite");
  const [engineMode, setEngineMode] = useState<"fastapi" | "browser">("fastapi");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPEG, PNG, WebP, or BMP).");
      return;
    }
    setErrorMsg(null);
    setUploadedFile(file);
    setIsLoading(true);
    try {
      const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(
        file,
        params
      );
      setReport(nextReport);
      setEngineMode(rMode);
    } catch {
      setErrorMsg("Failed to analyze image. Please try another file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);
    try {
      const { report: nextReport, engineMode: rMode } = await analyzeUploadedFile(
        uploadedFile,
        params
      );
      setReport(nextReport);
      setEngineMode(rMode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
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
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            Custom Forensic Audit Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Analyze Your Own Image
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload any JPEG, PNG, WebP, or BMP file to run all 7 Digital Image Processing
            forensic layers and localize tampered regions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />

          {report && (
            <button
              type="button"
              onClick={() => {
                setReport(null);
                setUploadedFile(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear &amp; New Upload</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg hover:bg-cyan-300 transition cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>{report ? "Upload Another Image" : "Select Image File"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* STATE 1: NO IMAGE UPLOADED YET -> DEDICATED DROPZONE */}
      {!report && !isLoading && (
        <div className="py-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-auto max-w-3xl cursor-pointer rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center transition ${
              isDragging
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.2)]"
                : "border-slate-700/80 bg-[#0B0F17] hover:border-cyan-400/60 hover:bg-[#0D131F]"
            }`}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <FileImage className="h-8 w-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Drag &amp; Drop an Image Here, or Click to Browse
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-400">
              Supports <strong className="text-slate-200">JPEG, PNG, WebP, and BMP</strong> up to
              15 MB. Processed entirely in memory — zero server storage.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg">
              <FolderOpen className="h-4 w-4" />
              <span>Choose File from Device</span>
            </div>

            <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span>&bull; Layer 1: YCbCr ELA &amp; Ghosts</span>
              <span>&bull; Layer 2: DWT HH1 &amp; Wiener Noise</span>
              <span>&bull; Layer 3: DCT + ORB Copy-Move</span>
              <span>&bull; Layer 4: 2D-FFT Resampling</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Don&apos;t have a tampered image handy? Try our 6 pre-built Demo Cases &amp; Sandbox &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* STATE 2: LOADING PIPELINE */}
      {isLoading && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0B0F17] p-10 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 animate-pulse">
            <Scan className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Executing 7-Layer Digital Image Processing Pipeline...
          </h3>
          <div className="mx-auto max-w-md space-y-1.5 text-left font-mono text-xs text-slate-400">
            <div>[1/7] Computing ITU-R BT.601 YCbCr Error Level Analysis &amp; JPEG Ghosts...</div>
            <div>[2/7] Decomposing 2D-DWT ({params.wavelet_family.toUpperCase()}) HH1 &amp; Adaptive Wiener Residual...</div>
            <div>[3/7] Lexicographically sorting 16&times;16 2D-DCT blocks &amp; ORB keypoints...</div>
            <div>[4/7] Running 2nd-order Laplacian &amp; 2D-FFT spectral periodicity...</div>
            <div>[5/7] Segmenting Otsu threshold &amp; Morphological Opening/Closing mask...</div>
          </div>
        </div>
      )}

      {/* STATE 3: FULL FORENSIC WORKBENCH RESULTS */}
      {report && !isLoading && (
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
