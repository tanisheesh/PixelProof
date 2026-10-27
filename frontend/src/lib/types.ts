export interface AnalysisParams {
  ela_quality: number;
  ela_scale: number;
  wavelet_family: "haar" | "db2" | "db4";
  noise_block_size: number;
  copy_move_threshold: number;
  morph_kernel_size: number;
  colormap: "inferno" | "viridis" | "jet" | "hot";
}

export interface BoundingBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area_ratio: number;
  confidence: number;
  primary_cause: string;
  label: string;
}

export interface CloneVector {
  src_x: number;
  src_y: number;
  dst_x: number;
  dst_y: number;
  shift_dx: number;
  shift_dy: number;
  score: number;
  method: "keypoint_orb" | "block_dct";
}

export interface DipMathInfo {
  signal_domain: string;
  algorithm_name: string;
  latex_formula: string;
  kernel_or_matrix?: number[][] | null;
  parameters_used: Record<string, string | number | number[]>;
  interpretation_guide: string;
}

export interface LayerResult {
  id: string;
  name: string;
  short_name: string;
  score: number;
  weight: number;
  status: "clean" | "suspicious" | "tampered";
  summary: string;
  finding_details: string[];
  heatmap_base64: string;
  histogram_data: number[];
  metrics: Record<string, number | string>;
  dip_math: DipMathInfo;
}

export interface MetadataForensics {
  format: string;
  dimensions: string;
  file_size_bytes: number;
  color_mode: string;
  exif_present: boolean;
  software_signature?: string | null;
  camera_make_model?: string | null;
  quantization_table_source: string;
  estimated_original_quality: number;
  thumbnail_present: boolean;
  thumbnail_ssim?: number | null;
  anomalies: string[];
  exif_tags: Record<string, string>;
  luminance_dqt?: number[][] | null;
}

export interface ForensicReport {
  report_id: string;
  filename: string;
  processing_time_ms: number;
  image_width: number;
  image_height: number;
  overall_score: number;
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "TAMPERED";
  confidence: number;
  executive_summary: string;
  original_preview_base64: string;
  composite_heatmap_base64: string;
  localization_mask_base64: string;
  annotated_overlay_base64: string;
  bounding_boxes: BoundingBox[];
  clone_vectors: CloneVector[];
  layers: LayerResult[];
  metadata: MetadataForensics;
  parameters: AnalysisParams;
}

export interface PresetCase {
  id: string;
  title: string;
  category: "splicing" | "copy_move" | "retouching" | "resampling" | "double_jpeg" | "authentic";
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  expected_verdict: "AUTHENTIC" | "SUSPICIOUS" | "TAMPERED";
  dip_concepts_highlighted: string[];
  preview_base64: string;
  ground_truth_mask_base64?: string | null;
}
