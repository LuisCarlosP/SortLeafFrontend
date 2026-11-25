import { useEffect, useId, useRef, type ReactElement } from "react";
import { Trash2, X } from "lucide-react";
import type { Language } from "../../translations";
import "./DeleteConversationDialog.css";

interface DeleteConversationDialogProps {
  title: string;
  language: Language;
  onCancel: () => void;
  error?: boolean;
  onConfirm: () => void;
}

export default function DeleteConversationDialog({
  title,
  language,
  onCancel,
  onConfirm, error,
}: DeleteConversationDialogProps): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  const es = language === "es";
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    cancel.current?.focus();
    return (): void => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sl-delete-dialog"
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event): void => {
        event.preventDefault();
        onCancel();
      }}
    >
      <button
        className="sl-icon-button sl-delete-dialog__close"
        aria-label={es ? "Cerrar" : "Close"}
        onClick={onCancel}
      >
        <X size={19} />
      </button>
      <span className="sl-delete-dialog__icon">
        <Trash2 size={24} />
      </span>
      <h2 id={`${id}-title`}>
        {es ? "¿Eliminar conversación?" : "Delete conversation?"}
      </h2>
      <p className="sl-delete-dialog__name">{title}</p>
      <p id={`${id}-description`}>
        {es
          ? "Se borrarán sus mensajes e imágenes de tu historial privado. Esta acción no se puede deshacer."
          : "Its messages and images will be removed from your private history. This cannot be undone."}
      </p>
      {error && <p role="alert">{es ? "No se pudo borrar. Vuelve a intentarlo." : "Could not delete. Try again."}</p>}
      <div className="sl-delete-dialog__actions">
        <button
          ref={cancel}
          className="sl-app-button sl-app-button--secondary"
          onClick={onCancel}
        >
          {es ? "Conservar chat" : "Keep chat"}
        </button>
        <button
          className="sl-app-button sl-delete-dialog__confirm"
          onClick={onConfirm}
        >
          <Trash2 size={16} />
          {es ? "Sí, eliminar" : "Delete chat"}
        </button>
      </div>
    </dialog>
  );
}
