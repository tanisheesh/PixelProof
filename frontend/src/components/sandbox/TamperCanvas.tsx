"use client";

import React, { useEffect, useRef, useState } from "react";
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
      const sx = Math.max(0, Math.min(canvas.width - brushSize, cloneSource.x - half));
      const sy = Math.max(0, Math.min(canvas.height - brushSize, cloneSource.y - half));
      const dx = Math.max(0, Math.min(canvas.width - brushSize, x - half));
      const dy = Math.max(0, Math.min(canvas.height - brushSize, y - half));
      const patch = ctx.getImageData(sx, sy, brushSize, brushSize);
      ctx.putImageData(patch, dx, dy);
    } else if (activeTool === "splice") {
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

    setEditCount((c) => {
      const nextCount = c + 1;
      // Auto-trigger forensic pipeline immediately after applying the canvas edit
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], `sandbox-${activeTool}-edit-${nextCount}.jpg`, {
            type: "image/jpeg",
          });
          onAnalyzeTamperedFile(file);
        },
        "image/jpeg",
        0.93
      );
      return nextCount;
    });
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
    <div className="panel-frame">
      <div className="panel-header">
        <span>TAMPER_SANDBOX // SELF-ATTACK &amp; VERIFICATION CANVAS</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCleanBaseImage}
            className="px-2.5 py-1 border border-[#3a3834] bg-[#151515] text-[#f2efe9] hover:border-[#00e5ff] cursor-pointer"
          >
            RESET CLEAN FRAME
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunForensics}
            className="brutal-btn brutal-btn-danger !py-1 !px-3 !text-[10px]"
          >
            {isAnalyzing ? "RUNNING 7 DIP LAYERS..." : `ANALYZE FORGERY [${editCount} EDITS] →`}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Attack Controls */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[#00e5ff]">
            SELECT MANIPULATION VECTOR &amp; CLICK CANVAS
          </div>

          {[
            {
              id: "copy_move" as const,
              code: "ATK_01",
              title: "COPY-MOVE CLONE STAMP (LAYER 3)",
              desc: `Clones the emblem at (${cloneSource.x}, ${cloneSource.y}) to clicked position. Shift+Click sets new clone source.`,
            },
            {
              id: "splice" as const,
              code: "ATK_02",
              title: "FOREIGN OBJECT SPLICE (LAYERS 1, 2 & 6)",
              desc: "Pastes a high-noise foreign patch with mismatched DCT quantization and sharp chromatic seams.",
            },
            {
              id: "retouch_blur" as const,
              code: "ATK_03",
              title: "GAUSSIAN HEALING BRUSH (LAYER 2)",
              desc: "Smooths local texture and destroys the camera's Daubechies db4 HH1 sensor noise floor.",
            },
          ].map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className={`w-full p-3.5 text-left border transition-colors cursor-pointer ${
                activeTool === tool.id
                  ? "border-[#00e5ff] bg-[#151515]"
                  : "border-[#222220] bg-[#080808] hover:bg-[#111111]"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#88857e] mb-1">
                <span>[{tool.code}]</span>
                <span className={activeTool === tool.id ? "text-[#00e5ff] font-bold" : ""}>
                  {activeTool === tool.id ? "● ARMED" : "SELECT"}
                </span>
              </div>
              <div className="text-xs font-bold text-[#f2efe9]">{tool.title}</div>
              <p className="text-[11px] text-[#88857e] mt-1 font-sans leading-snug">{tool.desc}</p>
            </button>
          ))}

          <div className="border border-[#222220] bg-[#080808] p-3">
            <div className="flex justify-between mb-1">
              <span className="text-[#88857e]">PATCH DIMENSION</span>
              <span className="text-[#00e5ff] font-bold">
                {brushSize}&times;{brushSize}PX
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={120}
              step={8}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1.5 accent-[#00e5ff] cursor-pointer"
            />
          </div>
        </div>

        {/* Right 7 Cols: Interactive Forgery Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between font-mono text-[10px] text-[#88857e] mb-2">
            <span>CLICK IMAGE BELOW TO APPLY [{activeTool.toUpperCase()}]</span>
            <span className="text-[#00e5ff]">512 &times; 384 PX</span>
          </div>
          <div className="border-2 border-[#00e5ff] bg-[#050505] w-full max-w-[560px]">
            <canvas
              ref={canvasRef}
              width={512}
              height={384}
              onClick={handleCanvasClick}
              className="w-full h-auto cursor-crosshair block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
