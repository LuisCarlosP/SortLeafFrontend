import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import BarcodeScanner from "../src/components/scanner/BarcodeScanner/BarcodeScanner";
import type { Html5QrcodeResult } from "html5-qrcode";

const camera = vi.hoisted(() => ({
  callback: undefined as
    | undefined
    | ((text: string, result: Html5QrcodeResult) => void),
  stop: vi.fn(),
  clear: vi.fn(),
  file: vi.fn(),
  start: vi.fn(),
}));
vi.mock("html5-qrcode", async (original) => ({
  ...(await original<typeof import("html5-qrcode")>()),
  Html5Qrcode: class {
    isScanning = false;
    async start(
      _camera: unknown,
      _config: unknown,
      callback: typeof camera.callback,
    ): Promise<void> {
      this.isScanning = true;
      camera.callback = callback;
      camera.start();
    }
    async stop(): Promise<void> {
      this.isScanning = false;
      camera.stop();
    }
    clear(): void {
      camera.clear();
    }
    scanFileV2 = camera.file;
    getRunningTrackCameraCapabilities(): never {
      throw new Error("No torch");
    }
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  camera.callback = undefined;
});
afterEach(cleanup);

it("confirms a stable code only once and releases the camera on unmount under StrictMode", async () => {
  const scanned = vi.fn();
  const view = render(
    <StrictMode>
      <BarcodeScanner isScanning onScan={scanned} onError={vi.fn()} />
    </StrictMode>,
  );
  await waitFor(() => expect(camera.callback).toBeTypeOf("function"));
  act(() => {
    const result = { decodedText: "", result: { text: "" } };
    camera.callback?.("3017620422004", result);
    camera.callback?.("3017620422003", result);
    camera.callback?.("3017620422003", result);
  });
  expect(scanned).not.toHaveBeenCalled();
  act(() => {
    const result = { decodedText: "", result: { text: "" } };
    camera.callback?.("3017620422003", result);
    camera.callback?.("3017620422003", result);
  });
  expect(scanned).toHaveBeenCalledExactlyOnceWith("3017620422003");
  view.unmount();
  await waitFor(() => expect(camera.stop).toHaveBeenCalledTimes(1));
});

it("reads an uploaded barcode without starting a camera", async () => {
  camera.file.mockResolvedValue({
    decodedText: "3017620422003",
    result: { text: "3017620422003" },
  });
  const scanned = vi.fn();
  const file = new File(["test"], "barcode.png", { type: "image/png" });
  render(
    <BarcodeScanner
      isScanning={false}
      imageFile={file}
      onScan={scanned}
      onError={vi.fn()}
    />,
  );
  await waitFor(() =>
    expect(scanned).toHaveBeenCalledExactlyOnceWith("3017620422003"),
  );
  expect(camera.start).not.toHaveBeenCalled();
  expect(camera.file).toHaveBeenCalledWith(file, true);
});
