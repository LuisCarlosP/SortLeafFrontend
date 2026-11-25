import { useEffect, useId, useRef, type ReactElement, type RefObject } from "react";
import { CircleAlert, Cpu, Download } from "lucide-react";
import { VISION_MODELS } from "../../features/vision/model-registry";
import type { useVisionSession } from "../../features/vision/use-vision-session";
import { visionErrorText } from "../../features/vision/vision-error";
import type { ModelPreparation } from "../../features/vision/vision-session";
import type { Language } from "../../translations";
import "./ModelPreparationDialog.css";

interface ModelPreparationDialogProps {
  language: Language;
  preparation: ModelPreparation;
  session: ReturnType<typeof useVisionSession>;
  selector: RefObject<HTMLSelectElement | null>;
  onHide: () => void;
}

const TITLES = {
  es: { checking: "Preparando modelo", cache: "Activando modelo", download: "Descargando modelo", error: "No se pudo activar el modelo" },
  en: { checking: "Preparing model", cache: "Activating model", download: "Downloading model", error: "Couldn’t activate the model" },
};

export default function ModelPreparationDialog({ language, preparation, session, selector, onHide }: ModelPreparationDialogProps): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const es = language === "es";
  const model = VISION_MODELS[preparation.model];
  const title = TITLES[language][session.error ? "error" : preparation.source];
  const files = Object.values(session.files);
  const bytes = files.reduce((sum, file) => sum + file.loaded, 0);
  // Files are discovered progressively. Only the current file has a known denominator.
  const currentFile = files.filter(file => file.loaded < file.total).sort((a, b) => b.total - a.total)[0];
  const percent = currentFile ? Math.floor(100 * currentFile.loaded / currentFile.total) : undefined;
  const fileLabel = es ? "Archivo en curso" : "Current file";
  const StatusIcon = session.error ? CircleAlert : preparation.source === "download" ? Download : Cpu;

  useEffect(() => {
    const element = dialog.current;
    const returnFocus = selector.current;
    element?.showModal();
    continueButton.current?.focus();
    return (): void => {
      element?.close();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [selector]);

  return (
    <dialog ref={dialog} className="sl-model-dialog" aria-labelledby={id + "-title"} aria-describedby={id + "-model"}
      onCancel={(event): void => { event.preventDefault(); onHide(); }}>
      <div className="sl-model-dialog__header">
        <span className="sl-model-dialog__icon" aria-hidden="true"><StatusIcon size={24} /></span>
        <div>
          <h2 id={id + "-title"}>{title}</h2>
          <p id={id + "-model"}>{model.label}{preparation.source === "download" && ` · ≈ ${model.estimatedMb} MB`}</p>
        </div>
      </div>
      {session.error ? (
        <p className="sl-model-dialog__message" role="alert">{visionErrorText(session.error, session.detail, language)}</p>
      ) : (
        <div className="sl-model-dialog__progress">
          <div className="sl-model-dialog__meter" role="progressbar" aria-label={percent === undefined ? title : fileLabel}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span style={percent === undefined ? undefined : { width: percent + "%" }} />
          </div>
          <div className="sl-model-dialog__detail">
            <span>{percent !== undefined ? fileLabel + " · " + percent + "%" : {
              checking: es ? "Comprobando el dispositivo…" : "Checking your device…",
              cache: es ? "Abriendo la copia guardada…" : "Opening your saved copy…",
              download: es ? "Preparando los archivos…" : "Preparing files…",
            }[preparation.source]}</span>
            {bytes > 0 && <span>{(bytes / 1e6).toLocaleString(language, { maximumFractionDigits: 1 })} {es ? "MB leídos" : "MB read"}</span>}
          </div>
        </div>
      )}
      <div className="sl-model-dialog__actions">
        {session.error ? (
          session.error !== "unsupported" && <button type="button" className="sl-app-button sl-app-button--secondary"
            onClick={(): void => { void session.prepare(preparation.model); }}>{es ? "Reintentar" : "Retry"}</button>
        ) : (
          <button type="button" className="sl-app-button sl-app-button--secondary" onClick={session.cancel}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        )}
        <button ref={continueButton} type="button" className="sl-app-button" onClick={onHide}>
          {es ? "Volver al chat" : "Back to chat"}
        </button>
      </div>
    </dialog>
  );
}
