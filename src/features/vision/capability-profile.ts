export interface VisionCapability { supported: boolean; reason: "ready" | "insecure" | "missing" | "adapter"; maxBufferMb?: number }
export async function detectVisionCapability(): Promise<VisionCapability> {
  if (!globalThis.isSecureContext) return { supported: false, reason: "insecure" };
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ limits: { maxBufferSize: number } } | null> } }).gpu;
  if (!gpu || typeof Worker === "undefined") return { supported: false, reason: "missing" };
  try {
    const adapter = await gpu.requestAdapter();
    return adapter ? { supported: true, reason: "ready", maxBufferMb: Math.round(adapter.limits.maxBufferSize / 1024 ** 2) } : { supported: false, reason: "adapter" };
  } catch { return { supported: false, reason: "adapter" }; }
}
