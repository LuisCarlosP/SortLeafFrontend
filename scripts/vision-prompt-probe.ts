// Bounded experiment: does an assistant JSON prefix improve syntax on two different objects?
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "@huggingface/transformers";
import { createVisionEngine } from "../src/features/vision/vision-engine.ts";
import { VISION_MODELS, type VisionModelKey } from "../src/features/vision/model-registry.ts";
const directory = resolve("../.tmp/sortleaf-vision");
await mkdir(directory, { recursive: true });
env.cacheDir = resolve(directory, "models"); env.allowLocalModels = false;
const results = [];
for (const key of Object.keys(VISION_MODELS) as VisionModelKey[]) {
  const engine = await createVisionEngine(key, "cpu", (): void => {}, { id: "visible-parts-v2-prefill", prompt: 'Identify the main object. Return JSON with product and components.', prefix: '{"product":"' });
  try {
    for (const source of ["bottle", "glass"]) {
      const result = await engine.analyze(resolve(`public/images/sortleaf/${source}-800.webp`));
      results.push({ source, result });
      console.log(JSON.stringify({ source, result }, null, 2));
    }
  } finally { await engine.dispose(); }
}
await writeFile(resolve(directory, "prompt-probe.json"), JSON.stringify({ caveat: "CPU prompt probe on two site photos; not accuracy evaluation", results }, null, 2));
