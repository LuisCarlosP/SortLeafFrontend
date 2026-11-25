// This validates real weights and the same prompt/parser on CPU, NOT browser/Android performance.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "@huggingface/transformers";
import { createVisionEngine } from "../src/features/vision/vision-engine.ts";
import { VISION_MODELS, VISION_PROMPT_VERSION, type VisionModelKey } from "../src/features/vision/model-registry.ts";
const key = (process.argv[2] || "smol-256m") as VisionModelKey;
if (!(key in VISION_MODELS)) throw new Error("Choose smol-256m or smol-500m");
const directory = resolve("../.tmp/sortleaf-vision");
await mkdir(directory, { recursive: true });
env.cacheDir = resolve(directory, "models");
env.allowLocalModels = false;
const reported = new Set<string>();
const engine = await createVisionEngine(key, "cpu", (event): void => {
  if (event.type !== "progress" || reported.has(event.file)) return;
  reported.add(event.file);
  console.log(`Loading ${event.file}`);
});
try {
  const source = process.argv[3] || "public/images/sortleaf/bottle-800.webp";
  const results = [];
  for (let index = 0; index < 2; index += 1) {
    const result = await engine.analyze(resolve(source));
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }
  await writeFile(resolve(directory, `${key}-${VISION_PROMPT_VERSION}-cpu-smoke.json`), JSON.stringify({ caveat: "CPU technical smoke check; no accuracy ground truth or Android/WebGPU benchmark", results }, null, 2));
} finally { await engine.dispose(); }
