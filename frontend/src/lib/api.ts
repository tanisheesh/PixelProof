import {
  generateClientSidePresets,
  renderSyntheticPresetDataUrl,
  runClientSideDipPipeline,
} from "./client-dip-fallback";
import { AnalysisParams, ForensicReport, PresetCase } from "./types";

const API_BASE = "http://localhost:8000";

export async function fetchPresets(): Promise<{ presets: PresetCase[]; engineMode: "fastapi" | "browser" }> {
  try {
    const res = await fetch(`${API_BASE}/api/presets`, {
      method: "GET",
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PresetCase[];
    return { presets: data, engineMode: "fastapi" };
  } catch {
    return { presets: generateClientSidePresets(), engineMode: "browser" };
  }
}

export async function analyzePreset(
  presetId: string,
  params: AnalysisParams
): Promise<{ report: ForensicReport; engineMode: "fastapi" | "browser" }> {
  try {
    const res = await fetch(`${API_BASE}/api/analyze/preset/${presetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = (await res.json()) as ForensicReport;
    return { report, engineMode: "fastapi" };
  } catch {
    const dataUrl = renderSyntheticPresetDataUrl(presetId);
    const report = await runClientSideDipPipeline(dataUrl, `${presetId}.jpg`, params);
    return { report, engineMode: "browser" };
  }
}

export async function analyzeUploadedFile(
  file: File,
  params: AnalysisParams
): Promise<{ report: ForensicReport; engineMode: "fastapi" | "browser" }> {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("ela_quality", String(params.ela_quality));
    form.append("ela_scale", String(params.ela_scale));
    form.append("wavelet_family", params.wavelet_family);
    form.append("noise_block_size", String(params.noise_block_size));
    form.append("copy_move_threshold", String(params.copy_move_threshold));
    form.append("morph_kernel_size", String(params.morph_kernel_size));
    form.append("colormap", params.colormap);

    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = (await res.json()) as ForensicReport;
    return { report, engineMode: "fastapi" };
  } catch {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
    const report = await runClientSideDipPipeline(dataUrl, file.name, params);
    return { report, engineMode: "browser" };
  }
}
