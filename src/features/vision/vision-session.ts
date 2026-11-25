import { detectVisionCapability } from "./capability-profile";
import { cachedVisionModels } from "./model-cache";
import type { VisionModelKey } from "./model-registry";
import type { VisionEvent, VisionRequest, VisionResult } from "./protocol";

export interface VisionWorker {
  onmessage: ((event: MessageEvent<VisionEvent>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (request: VisionRequest) => void;
  terminate: () => void;
}
export interface LabRun { imageId: number; result: VisionResult }
export interface ModelPreparation {
  model: VisionModelKey;
  source: "checking" | "cache" | "download";
}
export interface VisionSessionState {
  status: "idle" | "loading" | "ready" | "analyzing" | "error" | "cancelled";
  model: VisionModelKey | null;
  preparation: ModelPreparation | null;
  files: Record<string, { loaded: number; total: number }>;
  error: "load" | "inference" | "unsupported" | "timeout" | null;
  cacheUnavailable: boolean;
  detail: string;
  history: LabRun[];
}
const initialState = (): VisionSessionState => ({ status: "idle", model: null, preparation: null, files: {}, error: null, detail: "", cacheUnavailable: false, history: [] });

/** Owns one worker. Termination cancels network requests and GPU work, including late messages. */
export class VisionSession {
  private state = initialState();
  private listeners = new Set<() => void>();
  private worker: VisionWorker | null = null;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private imageId = 0;
  private pendingScan: { resolve: (result: VisionResult) => void; reject: (reason: Error) => void } | null = null;
  private makeWorker: () => VisionWorker;
  constructor(makeWorker: () => VisionWorker = (): VisionWorker => new Worker(new URL("./vision.worker.ts", import.meta.url), { type: "module" })) { this.makeWorker = makeWorker; }
  getSnapshot = (): VisionSessionState => this.state;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return (): void => { this.listeners.delete(listener); }; };
  private update(patch: Partial<VisionSessionState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener): void => listener());
  }
  private stop(): void {
    this.generation++;
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = null;
    this.pendingScan?.reject(new Error("Local generation stopped"));
    this.pendingScan = null;
  }
  private fail(code: VisionSessionState["error"], detail = ""): void { this.stop(); this.update({ status: "error", model: null, error: code, detail }); }
  private deadline(ms: number): void { clearTimeout(this.timer); this.timer = setTimeout((): void => this.fail("timeout"), ms); }
  load = (model: VisionModelKey, cachedOnly = false): void => {
    if (this.state.status === "loading" || this.state.status === "analyzing") return;
    this.beginLoad(model);
    this.startWorker(model, cachedOnly);
  };
  prepare = async (model: VisionModelKey): Promise<void> => {
    const { status } = this.state;
    if (status === "analyzing" || (this.state.model === model && (status === "ready" || status === "loading"))) return;
    this.beginLoad(model);
    const generation = this.generation;
    try {
      const capability = await detectVisionCapability();
      if (generation !== this.generation) return;
      if (!capability.supported) {
        this.fail("unsupported");
        return;
      }
      const cached = await cachedVisionModels().catch((): VisionModelKey[] => []);
      if (generation === this.generation) this.startWorker(model, cached.includes(model));
    } catch {
      if (generation === this.generation) this.fail("load");
    }
  };
  private beginLoad(model: VisionModelKey): void {
    this.stop();
    this.update({ status: "loading", model, preparation: { model, source: "checking" }, files: {}, error: null, detail: "", cacheUnavailable: false });
    this.deadline(600_000);
  }
  private startWorker(model: VisionModelKey, cachedOnly: boolean): void {
    try {
      this.update({ preparation: { model, source: cachedOnly ? "cache" : "download" } });
      const worker = this.makeWorker();
      this.worker = worker;
      worker.onmessage = ({ data }): void => {
        if (this.worker !== worker) return;
        switch (data.type) {
          case "progress": this.update({ files: { ...this.state.files, [data.file]: { loaded: data.loaded, total: data.total } } }); break;
          case "cache-unavailable": this.update({ cacheUnavailable: true }); break;
          case "ready": clearTimeout(this.timer); this.update({ status: "ready", model: data.model, preparation: null }); break;
          case "result": {
            clearTimeout(this.timer);
            const pending = this.pendingScan;
            this.pendingScan = null;
            if (pending) {
              this.update({ status: "ready" });
              pending.resolve(data.result);
            } else {
              this.update({ status: "ready", history: [...this.state.history.slice(-19), { imageId: this.imageId, result: data.result }] });
            }
            break;
          }
          case "error": this.fail(data.code, data.message); break;
        }
      };
      worker.onerror = (event): void => { if (this.worker === worker) this.fail(this.state.status === "loading" ? "load" : "inference", event.message || "Worker script unavailable"); };
      worker.postMessage({ type: "load", model, ...(cachedOnly ? { cachedOnly } : {}) });
    } catch { this.fail("load"); }
  }
  scan = async (image: Blob, signal: AbortSignal, expectedModel: VisionModelKey): Promise<VisionResult> => {
    const worker = this.worker;
    if (signal.aborted || !worker || this.state.status !== "ready" || this.state.model !== expectedModel) throw new Error("Local model unavailable");
    signal.addEventListener("abort", this.cancel, { once: true });
    try {
      return await new Promise<VisionResult>((resolve, reject) => {
        this.pendingScan = { resolve, reject };
        this.analyze(image, 0);
      });
    } finally { signal.removeEventListener("abort", this.cancel); }
  };
  analyze = (image: Blob, imageId: number): void => {
    if (!this.worker || this.state.status !== "ready") return;
    this.imageId = imageId;
    this.update({ status: "analyzing", error: null });
    this.deadline(120_000);
    try { this.worker.postMessage({ type: "analyze", image }); } catch { this.fail("inference"); }
  };
  cancel = (): void => { this.stop(); this.update({ status: "cancelled", model: null, preparation: null, error: null }); };
  dispose = (): void => { this.stop(); };
}
