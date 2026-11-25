import { useEffect, useRef, useState, type ReactElement } from "react";
import { Camera, LoaderCircle, X } from "lucide-react";
import type { Language } from "../../translations";
import { WORKSPACE_CONTENT } from "../../content/workspace";
import "./CameraDialog.css";

interface CameraDialogProps {
  language: Language;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraDialog({
  language,
  onClose,
  onCapture,
}: CameraDialogProps): ReactElement {
  const copy = WORKSPACE_CONTENT[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect((): (() => void) => {
    dialogRef.current?.showModal();
    let active = true;
    let stream: MediaStream | undefined;
    const mediaRequest = navigator.mediaDevices
      ? navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        })
      : Promise.reject(new Error("Camera unavailable"));
    void mediaRequest
      .then((media): void => {
        if (!active) {
          media.getTracks().forEach((track): void => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch((): void => {
        if (active) setError(true);
      });
    return (): void => {
      active = false;
      stream?.getTracks().forEach((track): void => track.stop());
    };
  }, []);

  const capture = (): void => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    const ratio = Math.min(
      1,
      1600 / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = Math.round(video.videoWidth * ratio);
    canvas.height = Math.round(video.videoHeight * ratio);
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob): void => {
        if (blob) {
          onCapture(
            new File([blob], "sortleaf-camera.jpg", { type: "image/jpeg" }),
          );
          onClose();
        } else setError(true);
      },
      "image/jpeg",
      0.88,
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="sl-camera-dialog"
      aria-labelledby="sl-camera-title"
      onCancel={onClose}
    >
      <div className="sl-camera-dialog__heading">
        <h2 id="sl-camera-title">{copy.cameraTitle}</h2>
        <button
          className="sl-icon-button"
          aria-label={copy.close}
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <p>{copy.cameraHint}</p>
      <div className="sl-camera-dialog__view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={(): void => setReady(true)}
        />
        {!ready && !error && <LoaderCircle className="sl-spin" size={28} />}
      </div>
      {error && (
        <p role="alert" className="sl-app-alert">
          {copy.errors.camera}
        </p>
      )}
      <button
        className="sl-app-button"
        disabled={!ready || error}
        onClick={capture}
      >
        <Camera size={19} />
        {copy.capture}
      </button>
    </dialog>
  );
}
