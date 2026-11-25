import { env } from "@huggingface/transformers";
import runtimeWasm from "../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url";
import runtimeModule from "../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url";
import { createVisionEngine } from "./vision-engine";
import { VISION_CACHE_NAME, VISION_MODELS } from "./model-registry";
import type { VisionEvent, VisionRequest } from "./protocol";
import { diagnostic } from "./vision-error";

const scope = self as unknown as { postMessage: (event: VisionEvent) => void; onmessage: ((event: MessageEvent<VisionRequest>) => void) | null };
const emit = (event: VisionEvent): void => scope.postMessage(event);
env.allowLocalModels = false;
env.useBrowserCache = false;
env.useCustomCache = true;
// This namespace contains only public model files; photos and results are never cached.
env.customCache = {
  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    try { return await (await caches.open(VISION_CACHE_NAME)).match(request); }
    catch { emit({ type: "cache-unavailable" }); return undefined; }
  },
  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    try { await (await caches.open(VISION_CACHE_NAME)).put(request, response); }
    catch { emit({ type: "cache-unavailable" }); }
  },
};
// WebGPU runs in this worker. The ORT proxy worker is not compatible with WebGPU.
if (env.backends.onnx.wasm) {
  // Vite's optimized worker lives in a different directory from ORT's assets.
  env.backends.onnx.wasm.wasmPaths = {
    wasm: new URL(runtimeWasm, self.location.origin).href,
    mjs: new URL(runtimeModule, self.location.origin).href,
  };
  env.backends.onnx.wasm.proxy = false;
  env.backends.onnx.wasm.numThreads = 1;
}
let engine: Awaited<ReturnType<typeof createVisionEngine>> | undefined;
let busy = false;
scope.onmessage = async ({ data }): Promise<void> => {
  if (busy) return;
  busy = true;
  try {
    if (data.type === "load") {
      if (!(data.model in VISION_MODELS)) throw new Error("Invalid model");
      await engine?.dispose();
      engine = undefined;
      // Cache lookup checks the revision-specific remote key first. With a missing key and
      // local_files_only, an absolute localModelPath prevents any speculative fetch.
      env.allowLocalModels = Boolean(data.cachedOnly);
      env.localModelPath = env.remoteHost;
      env.allowRemoteModels = !data.cachedOnly;
      engine = await createVisionEngine(data.model, "webgpu", emit, undefined, data.cachedOnly);
      emit({ type: "ready", model: data.model, loadMs: engine.loadMs });
    } else if (data.type === "analyze") {
      if (!engine) throw new Error("Model not loaded");
      emit({ type: "result", result: await engine.analyze(data.image) });
    }
  } catch (error) {
    emit({ type: "error", code: data.type === "load" ? "load" : "inference", message: diagnostic(error) });
  } finally { busy = false; }
};
