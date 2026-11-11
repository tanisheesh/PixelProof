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
  const [brushSize, setBrushSize] = useState<number>(72);
  const [editCount, setEditCount] = useState<number>(0);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number }>({
    x: 85,
    y: 220,
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

    let sx = 85;
    let sy = 220;
    const dx = Math.max(0, Math.min(canvas.width - brushSize, x - half));
    const dy = Math.max(0, Math.min(canvas.height - brushSize, y - half));

    if (activeTool === "copy_move") {
      sx = Math.max(0, Math.min(canvas.width - brushSize, cloneSource.x - half));
      sy = Math.max(0, Math.min(canvas.height - brushSize, cloneSource.y - half));
      const patch = ctx.getImageData(sx, sy, brushSize, brushSize);
      ctx.putImageData(patch, dx, dy);
    } else if (activeTool === "splice") {
      // Draw a bright red spliced balloon/badge
      const r = brushSize / 2;
      const cx = dx + r;
      const cy = dy + r;

      ctx.save();
      // Draw red balloon
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.ellipse(cx, cy - 6, r * 0.25, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Basket
      ctx.fillStyle = "#78350F";
      ctx.fillRect(cx - 8, cy + r * 0.5, 16, 12);
      ctx.restore();
    } else if (activeTool === "retouch_blur") {
      const src = ctx.getImageData(dx, dy, brushSize, brushSize);
      const dst = ctx.createImageData(brushSize, brushSize);
      const rad = 6;
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
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const fileName = `sandbox_${activeTool}_tx_${dx}_ty_${dy}_sx_${sx}_sy_${sy}_sz_${brushSize}.jpg`;
          const file = new File([blob], fileName, {
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

  return (
    <div className="panel-frame">
      <div className="panel-header">
        <span>STEP 1: CHOOSE A TOOL &amp; CLICK ON THE PHOTO TO EDIT</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCleanBaseImage}
            className="px-2.5 py-1 border border-[#3a3834] bg-[#151515] text-[#f2efe9] hover:border-[#00e5ff] cursor-pointer text-[10px] font-mono"
          >
            RESET CLEAN PHOTO
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Attack Controls */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[#00e5ff] font-bold">
            PICK YOUR TAMPERING TOOL:
          </div>

          {[
            {
              id: "copy_move" as const,
              code: "TOOL 01",
              title: "COPY-MOVE CLONE STAMP",
              desc: "Duplicates the pine tree from the left and stamps a clone wherever you click on the meadow.",
            },
            {
              id: "splice" as const,
              code: "TOOL 02",
              title: "FOREIGN OBJECT SPLICING",
              desc: "Pastes a foreign red hot-air balloon into the sky with an unnatural cut-and-paste boundary seam.",
            },
            {
              id: "retouch_blur" as const,
              code: "TOOL 03",
              title: "GAUSSIAN BLUR / ERASER BRUSH",
              desc: "Smooths over the barn window or grass, erasing natural camera sensor grain.",
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
                  {activeTool === tool.id ? "● ACTIVE TOOL" : "SELECT"}
                </span>
              </div>
              <div className="text-xs font-bold text-[#f2efe9]">{tool.title}</div>
              <p className="text-[11px] text-[#88857e] mt-1 font-sans leading-snug">{tool.desc}</p>
            </button>
          ))}

          <div className="border border-[#222220] bg-[#080808] p-3">
            <div className="flex justify-between mb-1">
              <span className="text-[#88857e]">TOOL SIZE</span>
              <span className="text-[#00e5ff] font-bold">
                {brushSize}&times;{brushSize}PX
              </span>
            </div>
            <input
              type="range"
              min={48}
              max={110}
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
            <span>👇 CLICK ON THE CANVAS BELOW TO TAMPER WITH THE PHOTO</span>
            <span className="text-[#00e5ff] font-bold">{editCount} EDIT(S) MADE</span>
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
          <div className="mt-2 text-center font-mono text-[11px] text-[#88857e]">
            {isAnalyzing ? (
              <span className="text-[#00e5ff] font-bold animate-pulse">
                ⚡ DETECTING YOUR EDIT LIVE IN REAL TIME...
              </span>
            ) : editCount > 0 ? (
              <span className="text-[#00e676]">
                ✓ Edit applied! Check the instant detection result below 👇
              </span>
            ) : (
              <span>Click anywhere on the photo to make an edit.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
