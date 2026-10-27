"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
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
      setErrorMsg("UNSUPPORTED FORMAT // Please select a valid JPEG, PNG, WebP, or BMP image.");
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
      setErrorMsg("PIPELINE ERROR // Failed to decode image buffer. Please try another file.");
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-1">
              {"// [03] CUSTOM FORENSIC AUDIT WORKSPACE"}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#f2efe9]">
              ANALYZE YOUR OWN IMAGE
            </h1>
            <p className="text-xs sm:text-sm text-[#88857e] mt-1">
              Upload any suspect JPEG, PNG, WebP, or BMP file for a full 7-layer Digital Image
              Processing audit. Stateless in-memory execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/how-it-works" className="brutal-btn">
              GUIDE &amp; GLOSSARY
            </Link>
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
                className="brutal-btn"
              >
                CLEAR WORKSPACE
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="brutal-btn brutal-btn-primary"
            >
              {report ? "UPLOAD ANOTHER IMAGE →" : "SELECT IMAGE FILE →"}
            </button>
          </div>
        </section>

        {errorMsg && (
          <div className="border border-[#ff2a2a] bg-[#ff2a2a]/10 p-4 font-mono text-xs text-[#ff2a2a]">
            {errorMsg}
          </div>
        )}

        {/* STATE 1: NO FILE UPLOADED YET -> INDUSTRIAL DROPZONE */}
        {!report && !isLoading && (
          <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#222220] bg-[#0e0e0e]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-8 p-8 sm:p-14 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging ? "bg-[#151515] border-[#00e5ff]" : "hover:bg-[#111111]"
              }`}
            >
              <div className="w-14 h-14 border-2 border-[#00e5ff] bg-[#080808] flex items-center justify-center font-mono font-bold text-lg text-[#00e5ff] mb-5">
                RAW
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-[#f2efe9]">
                DROP IMAGE FILE HERE OR CLICK TO BROWSE
              </h2>
              <p className="font-mono text-xs text-[#88857e] mt-2 max-w-md">
                ACCEPTED CONTAINERS: JPEG · PNG · WEBP · BMP (MAX 15 MB)
              </p>

              <div className="mt-7">
                <span className="brutal-btn brutal-btn-primary">
                  CHOOSE IMAGE FROM DEVICE →
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#0b0b0b] p-6 sm:p-8 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-4">
                <div className="text-[11px] text-[#00e5ff] font-bold uppercase tracking-wider">
                  {"// PIPELINE EXECUTION MANIFEST"}
                </div>
                <div className="space-y-2 text-[11px] text-[#88857e]">
                  <div className="border border-[#222220] bg-[#111111] p-2.5">
                    <strong className="text-[#f2efe9]">[L1] YCbCr ELA &amp; Ghosts:</strong>{" "}
                    8&times;8 DCT quantization error sweep
                  </div>
                  <div className="border border-[#222220] bg-[#111111] p-2.5">
                    <strong className="text-[#f2efe9]">[L2] Wavelet &amp; Wiener:</strong>{" "}
                    Daubechies db4 HH1 MAD sensor noise
                  </div>
                  <div className="border border-[#222220] bg-[#111111] p-2.5">
                    <strong className="text-[#f2efe9]">[L3] Copy-Move Clones:</strong>{" "}
                    16&times;16 Block-DCT lexsort + ORB vectors
                  </div>
                  <div className="border border-[#222220] bg-[#111111] p-2.5">
                    <strong className="text-[#f2efe9]">[L4..L7] FFT, BAG, Scharr, DQT:</strong>{" "}
                    Resampling spectrum &amp; DQT matrix
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#222220] mt-6">
                <div className="text-[11px] text-[#88857e] mb-2">
                  Want to test pre-built forgeries or create one in the browser first?
                </div>
                <Link href="/demo" className="text-[#00e5ff] font-bold hover:underline">
                  LAUNCH BENCHMARK DEMO &amp; SANDBOX →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* STATE 2: EXECUTING PIPELINE */}
        {isLoading && (
          <div className="panel-frame p-8 sm:p-12 font-mono text-xs space-y-4">
            <div className="text-[#00e5ff] font-bold uppercase tracking-widest">
              ● EXECUTING 7-LAYER DIGITAL IMAGE PROCESSING PIPELINE...
            </div>
            <div className="space-y-2 text-[#88857e]">
              <div>[01/07] Converting RGB → ITU-R BT.601 YCbCr &amp; computing Multi-Quality ELA...</div>
              <div>[02/07] Decomposing 2D-DWT ({params.wavelet_family.toUpperCase()}) HH1 &amp; 5×5 Adaptive Wiener residual...</div>
              <div>[03/07] Lexicographically sorting 16×16 2D-DCT blocks &amp; ORB keypoints...</div>
              <div>[04/07] Computing 3×3 Laplacian &amp; Hanning-windowed 2D-FFT log spectrum...</div>
              <div>[05/07] Segmenting Otsu threshold &amp; Morphological Opening/Closing mask...</div>
            </div>
          </div>
        )}

        {/* STATE 3: FULL FORENSIC WORKBENCH */}
        {report && !isLoading && (
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
