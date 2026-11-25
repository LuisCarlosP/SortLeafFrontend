import { VISION_CACHE_NAME, VISION_MODELS, type VisionModelKey } from "./model-registry";

// These are the files used by both pinned Q4 exports. Check the keys without reading the weights.
const REQUIRED = [
  "config.json", "generation_config.json", "tokenizer.json", "tokenizer_config.json",
  "preprocessor_config.json", "processor_config.json", "onnx/vision_encoder_q4.onnx",
  "onnx/embed_tokens_q4.onnx", "onnx/decoder_model_merged_q4.onnx",
];

export async function cachedVisionModels(): Promise<VisionModelKey[]> {
  if (typeof caches === "undefined" || !await caches.has(VISION_CACHE_NAME)) return [];
  const cache = await caches.open(VISION_CACHE_NAME);
  const urls = new Set((await cache.keys()).map(request => request.url));
  return (Object.keys(VISION_MODELS) as VisionModelKey[]).filter(key => {
    const { id, revision } = VISION_MODELS[key];
    const base = `https://huggingface.co/${id}/resolve/${revision}/`;
    return REQUIRED.every(file => urls.has(base + file));
  });
}
