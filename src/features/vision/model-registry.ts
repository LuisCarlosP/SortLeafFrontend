export type VisionModelKey = "smol-256m" | "smol-500m";
export const VISION_LAB_ENABLED = import.meta.env?.VITE_ENABLE_VISION_LAB !== "false";
export const VISION_CACHE_NAME = "sortleaf-vision-models-v1";

export interface VisionModelDefinition {
  id: string;
  revision: string;
  label: string;
  estimatedMb: number;
}

export const VISION_MODELS: Record<VisionModelKey, VisionModelDefinition> = {
  "smol-256m": { id: "HuggingFaceTB/SmolVLM-256M-Instruct", revision: "d039ab0d4b9311b617e8ffec1d06c8464364aeb3", label: "SmolVLM 256M", estimatedMb: 280 },
  "smol-500m": { id: "HuggingFaceTB/SmolVLM-500M-Instruct", revision: "753c1752602b5e739af7a7fa6947a635051897a3", label: "SmolVLM 500M", estimatedMb: 505 },
};

export const VISION_PROMPT_VERSION = "foreground-materials-v4";
export const VISION_PROMPT = "Describe the objects in this photograph. What are they made of?";
