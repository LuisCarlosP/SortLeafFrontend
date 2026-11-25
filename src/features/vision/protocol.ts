import type { VisionModelKey } from "./model-registry";
import type { VisionAnalysis } from "./analysis-schema";

export interface VisionMetrics {
  model: VisionModelKey;
  revision: string;
  runtime: "transformers.js@3.8.1";
  device: "webgpu" | "cpu";
  dtype: "q4";
  promptVersion: string;
  loadMs: number;
  inferenceMs: number;
  outputTokens: number;
  run: number;
  imageWidth: number;
  imageHeight: number;
  loadedBytes: number;
  timestamp: string;
}
export interface VisionResult {
  analysis: VisionAnalysis;
  raw: string;
  metrics: VisionMetrics;
}
export type VisionRequest = { type: "load"; model: VisionModelKey; cachedOnly?: boolean } | { type: "analyze"; image: Blob };
export type VisionEvent =
  | { type: "progress"; file: string; loaded: number; total: number }
  | { type: "ready"; model: VisionModelKey; loadMs: number }
  | { type: "cache-unavailable" }
  | { type: "result"; result: VisionResult }
  | { type: "error"; code: "load" | "inference" | "unsupported"; message: string };
