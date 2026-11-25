import { useRef, type ReactElement } from "react";
import { CircleAlert, Cpu, LoaderCircle } from "lucide-react";
import { VISION_MODELS, type VisionModelKey } from "../../features/vision/model-registry";
import type { useVisionSession } from "../../features/vision/use-vision-session";
import { visionErrorText } from "../../features/vision/vision-error";
import type { Language } from "../../translations";
import type { AssistantMode } from "../../types/conversation";
import ModelPreparationDialog from "./ModelPreparationDialog";

interface PickerProps {
  language: Language;
  mode: AssistantMode;
  onChange: (mode: AssistantMode) => void;
  busy: boolean;
  progressOpen: boolean;
  onProgressChange: (open: boolean) => void;
  session: ReturnType<typeof useVisionSession>;
}

export default function AssistantModePicker({ language, mode, onChange, busy, session, progressOpen, onProgressChange }: PickerProps): ReactElement {
  const es = language === "es";
  const selector = useRef<HTMLSelectElement>(null);
  const selected = mode === "online" || session.model === mode ? mode : "";
  const preparation = session.preparation?.model === mode ? session.preparation : null;
  const progressLabel = session.error
    ? (es ? "Ver problema al cargar el modelo" : "View model loading error")
    : (es ? "Ver progreso del modelo" : "View model progress");
  const keys = Object.keys(VISION_MODELS) as VisionModelKey[];

  return (
    <div className="sl-chat-mode">
      <label>
        <Cpu size={16} aria-hidden="true" />
        <select
          ref={selector}
          aria-label={es ? "Modo del asistente" : "Assistant mode"}
          value={selected}
          disabled={busy || session.status === "analyzing"}
          onChange={(event): void => onChange(event.target.value as AssistantMode)}
        >
          <option value="" disabled hidden>{es ? "Elegir modelo" : "Choose model"}</option>
          <option value="online">SortLeaf</option>
          {keys.map(key => <option key={key} value={key}>{VISION_MODELS[key].label}</option>)}
        </select>
      </label>
      {preparation && !progressOpen && (
        <button type="button" className="sl-icon-button sl-model-progress-trigger" aria-haspopup="dialog"
          aria-label={progressLabel} title={progressLabel} onClick={(): void => onProgressChange(true)}>
          {session.error ? <CircleAlert size={16} /> : <LoaderCircle size={16} className="sl-spin" />}
        </button>
      )}
      {preparation && progressOpen && (
        <ModelPreparationDialog language={language} preparation={preparation} session={session}
          selector={selector} onHide={(): void => onProgressChange(false)} />
      )}
      {selected && mode !== "online" && session.cacheUnavailable && (
        <span>{es ? "El navegador no pudo guardar el modelo." : "The browser could not save the model."}</span>
      )}
      {mode !== "online" && session.error && !session.preparation && (
        <span role="alert">{visionErrorText(session.error, session.detail, language)}</span>
      )}
    </div>
  );
}
