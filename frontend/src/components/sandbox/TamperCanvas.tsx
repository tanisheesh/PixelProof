"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eraser,
  Flame,
  RotateCcw,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { renderSyntheticPresetDataUrl } from "@/lib/client-dip-fallback";

interface TamperCanvasProps {
  onAnalyzeTamperedFile: (file: File) => void;
  isAnalyzing: boolean;
}

type ForgeryTool = "copy_move" | "splice" | "retouch_blur";

export default function TamperCanvas({
  onAnalyzeTamperedFile,
  isAnalyzing,
}: TamperCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<ForgeryTool>("copy_move");
  const [brushSize, setBrushSize] = useState<number>(64);
  const [editCount, setEditCount] = useState<number>(0);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number }>({
    x: 116,
    y: 292,
  });

  const loadCleanBaseImage = () => {
    const dataUrl = renderSyntheticPresetDataUrl("authentic_camera");
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setEditCount(0);
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    loadCleanBaseImage();
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);

    if (e.shiftKey && activeTool === "copy_move") {
      setCloneSource({ x, y });
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const half = Math.floor(brushSize / 2);

    if (activeTool === "copy_move") {
      // Copy pixels from cloneSource and paste at (x, y)
      const sx = Math.max(0, Math.min(canvas.width - brushSize, cloneSource.x - half));
      const sy = Math.max(0, Math.min(canvas.height - brushSize, cloneSource.y - half));
      const dx = Math.max(0, Math.min(canvas.width - brushSize, x - half));
      const dy = Math.max(0, Math.min(canvas.height - brushSize, y - half));
      const patch = ctx.getImageData(sx, sy, brushSize, brushSize);
      ctx.putImageData(patch, dx, dy);
    } else if (activeTool === "splice") {
      // Splice a high-frequency foreign anomaly patch with strong synthetic noise + chromatic border
      const dx = Math.max(0, Math.min(canvas.width - brushSize, x - half));
      const dy = Math.max(0, Math.min(canvas.height - brushSize, y - half));
      const patch = ctx.createImageData(brushSize, brushSize);
      for (let py = 0; py < brushSize; py++) {
        for (let px = 0; px < brushSize; px++) {
          const i = (py * brushSize + px) * 4;
          const checker = (((px >> 2) ^ (py >> 2)) & 1) * 48;
          const noise = (Math.random() - 0.5) * 55;
          patch.data[i] = Math.min(255, Math.max(0, 220 - checker + noise));
          patch.data[i + 1] = Math.min(255, Math.max(0, 50 + noise));
          patch.data[i + 2] = Math.min(255, Math.max(0, 72 + checker + noise));
          patch.data[i + 3] = 255;
        }
      }
      ctx.putImageData(patch, dx, dy);
    } else if (activeTool === "retouch_blur") {
      // Apply heavy box/Gaussian smoothing inside region (destroys high-frequency DWT HH1 sensor noise)
      const dx = Math.max(0, Math.min(canvas.width - brushSize, x - half));
      const dy = Math.max(0, Math.min(canvas.height - brushSize, y - half));
      const src = ctx.getImageData(dx, dy, brushSize, brushSize);
      const dst = ctx.createImageData(brushSize, brushSize);
      const rad = 4;
      for (let py = 0; py < brushSize; py++) {
        for (let px = 0; px < brushSize; px++) {
          let r = 0,
            g = 0,
            b = 0,
            cnt = 0;
          for (let ky = -rad; ky <= rad; ky++) {
            for (let kx = -rad; kx <= rad; kx++) {
              const ny = Math.min(brushSize - 1, Math.max(0, py + ky));
              const nx = Math.min(brushSize - 1, Math.max(0, px + kx));
              const idx = (ny * brushSize + nx) * 4;
              r += src.data[idx];
              g += src.data[idx + 1];
              b += src.data[idx + 2];
              cnt++;
            }
          }
          const outIdx = (py * brushSize + px) * 4;
          dst.data[outIdx] = Math.round(r / cnt);
          dst.data[outIdx + 1] = Math.round(g / cnt);
          dst.data[outIdx + 2] = Math.round(b / cnt);
          dst.data[outIdx + 3] = 255;
        }
      }
      ctx.putImageData(dst, dx, dy);
    }

    setEditCount((c) => c + 1);
  };

  const handleRunForensics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `sandbox-${activeTool}-tampered.jpg`, {
          type: "image/jpeg",
        });
        onAnalyzeTamperedFile(file);
      },
      "image/jpeg",
      0.93
    );
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-[#0B0F17] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            Interactive Self-Attack &amp; Verification Lab
          </span>
          <h3 className="text-base font-bold text-slate-100">
            Live Tamper Sandbox — Forge an Image &amp; Test the 7 DIP Layers
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCleanBaseImage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Clean Frame
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunForensics}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-110 transition cursor-pointer"
          >
            <ScanSearch className="h-4 w-4" />
            {isAnalyzing ? "Running 7 DIP Layers..." : `Analyze Forgery (${editCount} edits)`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            1. Choose Manipulation Attack Vector
          </div>

          <button
            type="button"
            onClick={() => setActiveTool("copy_move")}
            className={`w-full flex items-start gap-2.5 rounded-lg border p-3 text-left transition cursor-pointer ${
              activeTool === "copy_move"
                ? "border-cyan-400 bg-cyan-950/30"
                : "border-slate-800 bg-[#070A10] hover:border-slate-700"
            }`}
          >
            <Copy className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-100">
                Copy-Move Clone Stamp (Layer 3)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clones the emblem crate at ({cloneSource.x}, {cloneSource.y}) to wherever you click. Hold{" "}
                <kbd className="rounded bg-slate-800 px-1 font-mono text-[10px]">Shift+Click</kbd> to move source.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("splice")}
            className={`w-full flex items-start gap-2.5 rounded-lg border p-3 text-left transition cursor-pointer ${
              activeTool === "splice"
                ? "border-rose-400 bg-rose-950/30"
                : "border-slate-800 bg-[#070A10] hover:border-slate-700"
            }`}
          >
            <Flame className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-100">
                Foreign Object Splice (Layers 1, 2 &amp; 6)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pastes a high-noise foreign patch with mismatched DCT quantization and sharp chromatic edges.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("retouch_blur")}
            className={`w-full flex items-start gap-2.5 rounded-lg border p-3 text-left transition cursor-pointer ${
              activeTool === "retouch_blur"
                ? "border-amber-400 bg-amber-950/30"
                : "border-slate-800 bg-[#070A10] hover:border-slate-700"
            }`}
          >
            <Eraser className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-100">
                Gaussian Healing / Airbrush (Layer 2)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Smooths out local texture and erases the camera&apos;s DWT HH1 high-frequency sensor noise floor.
              </p>
            </div>
          </button>

          <div className="rounded-lg border border-slate-800 bg-[#070A10] p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Patch / Brush Dimension</span>
              <span className="font-mono text-cyan-400 font-bold">
                {brushSize}&times;{brushSize} px
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={120}
              step={8}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Interactive Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="mb-2 flex w-full items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Click anywhere on the image below to apply the selected manipulation, then click{" "}
              <strong className="text-rose-300">Analyze Forgery</strong>.
            </span>
            <span className="font-mono text-[11px] text-cyan-300">512 &times; 384 px</span>
          </div>

          <div className="overflow-hidden rounded-lg border-2 border-dashed border-cyan-500/40 bg-black shadow-xl">
            <canvas
              ref={canvasRef}
              width={512}
              height={384}
              onClick={handleCanvasClick}
              className="w-full max-w-[560px] cursor-crosshair block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
