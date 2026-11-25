import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats as Format,
  type Html5QrcodeResult,
} from "html5-qrcode";
import { Flashlight } from "lucide-react";
import {
  createBarcodeVerifier,
  expandUpce,
  isValidGtin,
} from "../../../services/gtin";
import type { Language } from "../../../translations";
import "./BarcodeScanner.css";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError: (error: string) => void;
  isScanning: boolean;
  imageFile?: File | null;
  language?: Language;
}
export default function BarcodeScanner({
  onScan,
  onError,
  isScanning,
  imageFile,
  language = "es",
}: BarcodeScannerProps): ReactElement {
  const id = `barcode-${useId().replace(/:/g, "")}`;
  const queue = useRef(Promise.resolve());
  const instance = useRef<Html5Qrcode | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);
  const [torchError, setTorchError] = useState(false);
  const es = language === "es";
  useEffect(() => {
    if (!isScanning && !imageFile) return;
    let cancelled = false;
    let decoded = false;
    let scanner: Html5Qrcode | undefined;
    const verify = createBarcodeVerifier();
    const normalize = (value: string, result: Html5QrcodeResult): string =>
      result.result.format?.format === Format.UPC_E
        ? expandUpce(value) || ""
        : value;
    queue.current = queue.current.then(async (): Promise<void> => {
      if (cancelled) return;
      try {
        scanner = new Html5Qrcode(id, {
          formatsToSupport: [
            Format.EAN_13,
            Format.EAN_8,
            Format.UPC_A,
            Format.UPC_E,
            Format.ITF,
            Format.CODE_128,
            Format.RSS_14,
          ],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        instance.current = scanner;
        if (imageFile) {
          const result = await scanner.scanFileV2(imageFile, true);
          const value = normalize(result.decodedText, result);
          if (!isValidGtin(value)) throw new Error("Invalid product code");
          if (!cancelled) onScan(value);
          return;
        }
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            disableFlip: true,
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            qrbox: (width: number, height: number) => ({
              width: Math.floor(width * 0.9),
              height: Math.floor(Math.min(height * 0.65, width * 0.55)),
            }),
          },
          (value: string, result: Html5QrcodeResult): void => {
            if (cancelled || decoded) return;
            const accepted = verify(normalize(value, result));
            if (accepted) {
              decoded = true;
              onScan(accepted);
            }
          },
          (): void => undefined,
        );
        if (cancelled) {
          if (scanner.isScanning) await scanner.stop();
          return;
        }
        try {
          setTorchAvailable(
            scanner
              .getRunningTrackCameraCapabilities()
              .torchFeature()
              .isSupported(),
          );
          const capabilities =
            scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
              focusMode?: string[];
            };
          if (capabilities.focusMode?.includes("continuous")) {
            await scanner.applyVideoConstraints({
              advanced: [
                { focusMode: "continuous" } as MediaTrackConstraintSet,
              ],
            });
          }
        } catch {
          /* Optional hardware controls must not interrupt scanning. */
        }
      } catch {
        if (!cancelled) onError(imageFile ? "image" : "camera");
      }
    });
    return (): void => {
      cancelled = true;
      instance.current = null;
      queue.current = queue.current.then(async (): Promise<void> => {
        try {
          if (scanner?.isScanning) await scanner.stop();
          scanner?.clear();
        } catch {
          /* Already stopped. */
        }
      });
    };
  }, [id, isScanning, imageFile, onScan, onError]);
  const toggleTorch = async (): Promise<void> => {
    setTorchBusy(true);
    setTorchError(false);
    try {
      await instance.current
        ?.getRunningTrackCameraCapabilities()
        .torchFeature()
        .apply(!torchOn);
      setTorchOn(!torchOn);
    } catch {
      setTorchError(true);
    } finally {
      setTorchBusy(false);
    }
  };
  return (
    <div className="scanner-video-container">
      <div id={id} />
      {isScanning && (
        <p className="sl-scanner-guidance">
          {es
            ? "Centra todas las barras y mantén el envase quieto."
            : "Center all the bars and hold the package steady."}
        </p>
      )}
      {torchAvailable && isScanning && (
        <button
          className="sl-scanner-torch"
          disabled={torchBusy}
          aria-pressed={torchOn}
          onClick={(): void => {
            void toggleTorch();
          }}
        >
          <Flashlight size={16} />
          {es ? "Linterna" : "Flashlight"}
        </button>
      )}
      {torchError && (
        <p role="status">
          {es
            ? "La cámara no pudo activar la linterna."
            : "The camera could not turn on the flashlight."}
        </p>
      )}
    </div>
  );
}
