import { afterEach, expect, it, vi } from "vitest";
import { VisionSession, type VisionWorker } from "../src/features/vision/vision-session";
import type { VisionEvent, VisionResult } from "../src/features/vision/protocol";

function fakeWorker(): VisionWorker { return { onmessage: null, onerror: null, postMessage: vi.fn(), terminate: vi.fn() }; }
function send(worker: VisionWorker, data: VisionEvent): void { worker.onmessage?.({ data } as MessageEvent<VisionEvent>); }
afterEach(() => vi.useRealTimers());
it("does not instantiate or download a model before an explicit load action", () => {
  const factory = vi.fn(fakeWorker);
  const session = new VisionSession(factory);
  expect(session.getSnapshot().status).toBe("idle");
  expect(factory).not.toHaveBeenCalled();
});
it("reuses the loaded worker between photos and serializes requests", () => {
  const worker = fakeWorker();
  const factory = vi.fn(() => worker);
  const session = new VisionSession(factory);
  session.load("smol-256m");
  session.load("smol-500m");
  send(worker, { type: "ready", model: "smol-256m", loadMs: 42 });
  session.analyze(new Blob(), 1);
  session.analyze(new Blob(), 2);
  const result = { raw: "test" } as VisionResult;
  send(worker, { type: "result", result });
  session.analyze(new Blob(), 2);
  send(worker, { type: "result", result });
  expect(factory).toHaveBeenCalledTimes(1);
  expect(worker.postMessage).toHaveBeenCalledTimes(3);
  expect(session.getSnapshot().history.map((run) => run.imageId)).toEqual([1, 2]);
  session.dispose();
});
it("cancels loading and ignores late results from the terminated worker", () => {
  const old = fakeWorker(); const current = fakeWorker();
  const session = new VisionSession(vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(current));
  session.load("smol-256m"); session.cancel(); session.load("smol-500m");
  send(old, { type: "ready", model: "smol-256m", loadMs: 10 });
  send(old, { type: "result", result: {} as VisionResult });
  expect(old.terminate).toHaveBeenCalledOnce();
  expect(session.getSnapshot()).toMatchObject({ status: "loading", model: "smol-500m", history: [] });
  session.dispose();
});
it("terminates timed-out inference and reports an actionable state", () => {
  vi.useFakeTimers();
  const worker = fakeWorker(); const session = new VisionSession(() => worker);
  session.load("smol-256m"); send(worker, { type: "ready", model: "smol-256m", loadMs: 0 });
  session.analyze(new Blob(), 1);
  vi.advanceTimersByTime(120_000);
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(session.getSnapshot()).toMatchObject({ status: "error", error: "timeout", model: null });
});
it("recovers from worker creation errors and cleans up on leaving the page", () => {
  const session = new VisionSession(() => { throw new Error("Unavailable"); });
  session.load("smol-256m");
  expect(session.getSnapshot()).toMatchObject({ status: "error", error: "load" });
  const worker = fakeWorker(); const active = new VisionSession(() => worker);
  active.load("smol-256m"); active.dispose();
  expect(worker.terminate).toHaveBeenCalledOnce();
});
it("resolves a private assistant scan without adding its raw output to lab history", async () => {
  const worker = fakeWorker();
  const session = new VisionSession(() => worker);
  session.load("smol-500m");
  send(worker, { type: "ready", model: "smol-500m", loadMs: 0 });
  const pending = session.scan(new Blob(), new AbortController().signal, "smol-500m");
  const result = { raw: "private" } as VisionResult;
  send(worker, { type: "result", result });
  await expect(pending).resolves.toBe(result);
  expect(session.getSnapshot().history).toEqual([]);
  session.dispose();
});
