import { AutoProcessor, AutoModelForVision2Seq, RawImage, Tensor } from "@huggingface/transformers";
import { VISION_MODELS, VISION_PROMPT, VISION_PROMPT_VERSION, type VisionModelKey } from "./model-registry.ts";
import { combineRegions, normalizeAnalysis, refineMaterial, type VisionAnalysis } from "./analysis-schema.ts";
import type { VisionEvent, VisionResult } from "./protocol.ts";

function releaseTensors(value: unknown, seen = new Set<unknown>()): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (value instanceof Tensor) { value.dispose(); return; }
  if (ArrayBuffer.isView(value)) return;
  for (const child of Object.values(value)) releaseTensors(child, seen);
}

/** Used by the Web Worker and the reproducible CPU smoke check. Never imported by the UI. */
export async function createVisionEngine(key: VisionModelKey, device: "webgpu" | "cpu", emit: (event: VisionEvent) => void, experiment?: { id: string; prefix: string; prompt?: string }, cachedOnly = false) {
  const definition = VISION_MODELS[key];
  const started = performance.now();
  const bytes = new Map<string, number>();
  const options = {
    local_files_only: cachedOnly,
    revision: definition.revision,
    progress_callback: (event: { status: string; file?: string; loaded?: number; total?: number }): void => {
      if (event.status !== "progress" || !event.file) return;
      bytes.set(event.file, event.loaded ?? 0);
      emit({ type: "progress", file: event.file, loaded: event.loaded ?? 0, total: event.total ?? 0 });
    },
  };
  // Sequential loading avoids a discarded model promise when processor loading fails.
  const processor = await AutoProcessor.from_pretrained(definition.id, options);
  const model = await AutoModelForVision2Seq.from_pretrained(definition.id, {
    ...options, device, dtype: "q4",
    ...(device === "cpu" ? { session_options: { intraOpNumThreads: 4, interOpNumThreads: 1 } } : {}),
  });
  const loadMs = Math.round(performance.now() - started);
  let run = 0;
  async function describe(image: RawImage, question: string, prefix = "", maxTokens = 96): Promise<{ raw: string; tokens: number }> {
    const messages = [{ role: "user", content: [{ type: "image" }, { type: "text", text: question }] }];
    // v3.8.1 types declare text-only messages; the SmolVLM processor supports image content.
    const text = processor.apply_chat_template(messages as unknown as Parameters<typeof processor.apply_chat_template>[0], { add_generation_prompt: true }) + prefix;
    const inputs = await processor(text, [image], { do_image_splitting: false });
    let output: unknown;
    try {
      output = await model.generate({ ...inputs, do_sample: false, max_new_tokens: maxTokens, repetition_penalty: 1.1, return_dict_in_generate: false });
      if (!(output instanceof Tensor)) throw new Error("Unexpected generation output");
      const promptLength = inputs.input_ids.dims.at(-1) ?? 0;
      const generated = Array.from(output.data as BigInt64Array, Number).slice(promptLength);
      const raw = prefix + processor.batch_decode([generated], { skip_special_tokens: true })[0].trim();
      return { raw, tokens: generated.length };
    } finally { releaseTensors({ inputs, output }); }
  }

  return {
    loadMs,
    dispose: (): Promise<unknown[]> => model.dispose(),
    async analyze(source: Blob | string): Promise<VisionResult> {
      const start = performance.now();
      let image = await RawImage.read(source);
      const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
      if (scale < 1) image = await image.resize(Math.round(image.width * scale), Math.round(image.height * scale));
      const first = await describe(image, experiment?.prompt ?? VISION_PROMPT, experiment?.prefix);
      let analysis = normalizeAnalysis(first.raw);
      let raw = first.raw;
      let outputTokens = first.tokens;
      const several = /\b(?:two|three|four|several|multiple|collection of|side by side|on the left|on the right)\b/i.test(first.raw);
      if (!experiment && several && analysis.items.length && Math.min(image.width, image.height) >= 160) {
        const vertical = /\b(?:top and bottom|upper and lower)\b/i.test(first.raw)
          || (image.height > image.width && !/\b(?:left|right|side by side)\b/i.test(first.raw));
        const right = image.width - 1, bottom = image.height - 1;
        const middle = Math.floor((vertical ? bottom : right) / 2);
        const boxes: [number, number, number, number][] = vertical
          ? [[0, 0, right, middle], [0, middle + 1, right, bottom]]
          : [[0, 0, middle, bottom], [middle + 1, 0, right, bottom]];
        const regions: VisionAnalysis[] = [];
        for (const box of boxes) {
          const crop = await image.crop(box);
          const region = await describe(crop, VISION_PROMPT, "", 64);
          let observation = normalizeAnalysis(region.raw);
          raw += "\n\n" + region.raw;
          outputTokens += region.tokens;
          const unclear = observation.items.filter(item => item.route === "unknown" && ["bottle", "jar", "box"].includes(item.object));
          if (unclear.length === 1) {
            const question = "What material is the " + unclear[0].object + " itself made of? Answer with one material or unknown.";
            const detail = await describe(crop, question, "", 12);
            observation = refineMaterial(observation, unclear[0], detail.raw);
            raw += "\n" + detail.raw;
            outputTokens += detail.tokens;
          }
          regions.push(observation);
        }
        analysis = combineRegions(analysis, regions);
      } else if (analysis.outcome === "uncertain" && !experiment) {
        const second = await describe(image, "Identify the main foreground objects and describe the material of each in a short sentence.");
        // Each description is interpreted independently. A second opinion must identify its own objects.
        const next = normalizeAnalysis(second.raw);
        if (next.outcome === "identified" || !analysis.items.length) analysis = next;
        raw += "\n\n" + second.raw;
        outputTokens += second.tokens;
      }
      run += 1;
      return {
        analysis, raw,
        metrics: {
          model: key, revision: definition.revision, runtime: "transformers.js@3.8.1", device, dtype: "q4", promptVersion: experiment?.id ?? VISION_PROMPT_VERSION,
          loadMs, inferenceMs: Math.round(performance.now() - start), outputTokens, run,
          imageWidth: image.width, imageHeight: image.height,
          loadedBytes: Array.from(bytes.values()).reduce((sum, count): number => sum + count, 0), timestamp: new Date().toISOString(),
        },
      };
    },
  };
}
