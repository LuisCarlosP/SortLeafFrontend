import { loadConversationMessages } from "../../services/conversations";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  Camera,
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  Paperclip,
  Plus,
  Square,
  X,
} from "lucide-react";
import type { Language } from "../../translations";
import type { AssistantMode, ConversationMessage } from "../../types/conversation";
import { useVisionSession } from "../../features/vision/use-vision-session";
import { VISION_MODELS } from "../../features/vision/model-registry";
import AssistantModePicker from "./AssistantModePicker";
import { WORKSPACE_CONTENT } from "../../content/workspace";
import useConversations from "../../hooks/useConversations";
import {
  createChatThumbnail,
  createConversation,
  getRetryFile,
  removeFailedMessage,
  selectConversationMode,
  stopConversation,
  submitConversationTurn,
} from "../../services/conversations";
import CameraDialog from "../../components/workspace/CameraDialog";
import "./ClassifierPage.css";

interface ClassifierPageProps {
  language: Language;
}
interface Attachment {
  file: File;
  preview: string;
}

export default function ClassifierPage({
  language,
}: ClassifierPageProps): ReactElement {
  const [params] = useSearchParams();
  const location = useLocation();
  const session = useVisionSession();
  const [newMode, setNewMode] = useState<AssistantMode>("smol-256m");
  const [progressOpen, setProgressOpen] = useState(false);
  return (
    <ConversationView
      key={params.get("c") || location.key}
      language={language}
      session={session} newMode={newMode} setNewMode={setNewMode}
      progressOpen={progressOpen} onProgressChange={setProgressOpen}
    />
  );
}

interface ConversationViewProps extends ClassifierPageProps {
  session: ReturnType<typeof useVisionSession>;
  newMode: AssistantMode;
  setNewMode: (mode: AssistantMode) => void;
  progressOpen: boolean;
  onProgressChange: (open: boolean) => void;
}

function ConversationView({ language, session, newMode, setNewMode, progressOpen, onProgressChange }: ConversationViewProps): ReactElement {
  const copy = WORKSPACE_CONTENT[language];
  const { conversations, pending, storageUnavailable } = useConversations();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("c");
  const conversation = conversations.find((item): boolean => item.id === id);
  const messages = conversation?.messages ?? [];
  const preferred = conversation?.mode ?? newMode;
  const mode = preferred && Object.hasOwn(VISION_MODELS, preferred) ? preferred : "online";
  const chooseMode = (next: AssistantMode): void => {
    if (conversation) selectConversationMode(conversation.id, next);
    else setNewMode(next);
  };
  const activateMode = (next: AssistantMode): void => {
    onProgressChange(next !== "online");
    if (next === "online") session.cancel();
    else void session.prepare(next);
    chooseMode(next);
  };
  const busy = Boolean(id && pending[id]);
  const retry = useRef<{ id: string; chatId: string; text: string; file?: File; mode?: AssistantMode } | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const canSend = !attachment || mode === "online" || (session.status === "ready" && session.model === mode);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    if (id) void loadConversationMessages(id).catch(() => {
      if (active) setNotice(copy.storage);
    });
    return () => { active = false; };
  }, [id, copy.storage]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const attachmentVersion = useRef(0);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(
    (): (() => void) => (): void => {
      attachmentVersion.current++;
      window.clearTimeout(copyTimer.current);
    },
    [],
  );
  useEffect((): void => {
    const scroll = scrollRef.current;
    if (scroll)
      scroll.scrollTo({ top: scroll.scrollHeight, behavior: "instant" });
  }, [id, messages.length, busy]);
  useEffect(() => {
    const textarea = textRef.current;
    if (!textarea || window.CSS?.supports("field-sizing", "content")) return;
    const fitText = (): void => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    };
    fitText();
    window.addEventListener("resize", fitText);
    return (): void => window.removeEventListener("resize", fitText);
  }, [draft, language]);

  const attachFile = async (file: File): Promise<void> => {
    setNotice("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice(copy.errors.format);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice(copy.errors.size);
      return;
    }
    const version = ++attachmentVersion.current;
    setAttachmentLoading(true);
    try {
      const preview = await createChatThumbnail(file);
      if (version === attachmentVersion.current)
        setAttachment({ file, preview });
    } catch {
      if (version === attachmentVersion.current) setNotice(copy.errors.format);
    } finally {
      if (version === attachmentVersion.current) setAttachmentLoading(false);
    }
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (!canSend || busy || attachmentLoading || (!draft.trim() && !attachment)) return;
    const currentId =
      conversation?.id ??
      createConversation(
        draft.trim() ||
          (language === "es" ? "Un nuevo material" : "A new material"),
      );
    void submitConversationTurn({
      id: currentId,
      retryId: retry.current?.chatId === currentId && retry.current.text === draft.trim() && retry.current.file === attachment?.file && retry.current.mode === mode ? retry.current.id : undefined,
      text: draft.trim(),
      file: attachment?.file,
      preview: attachment?.preview,
      language,
      mode,
      scanPhoto: mode === "online" ? undefined : (image, signal) => session.scan(image, signal, mode),
    });
    retry.current = null;
    if (!conversation) navigate(`/assistant?c=${currentId}`, { replace: true });
    setDraft("");
    setAttachment(null);
    setNotice("");
    textRef.current?.focus();
  };

  const editFailed = (message: ConversationMessage): void => {
    if (!id || busy) return;
    const file = getRetryFile(message.id);
    retry.current = { id: message.id, chatId: id, text: message.text, file, mode: message.mode };
    chooseMode(message.mode ?? "online");
    setDraft(message.text);
    setAttachment(
      file && message.image ? { file, preview: message.image } : null,
    );
    setNotice(message.image && !file ? copy.imageAgain : "");
    removeFailedMessage(id, message.id);
    textRef.current?.focus();
  };

  const copyMessage = async (message: ConversationMessage): Promise<void> => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(
        (): void => setCopiedId(null),
        1800,
      );
    } catch {
      setNotice(copy.errors.copy);
    }
  };

  const pasteImage = (event: ClipboardEvent<HTMLTextAreaElement>): void => {
    const file = [...event.clipboardData.files].find((item): boolean =>
      item.type.startsWith("image/"),
    );
    if (file) {
      event.preventDefault();
      void attachFile(file);
    }
  };
  const dropImage = (event: DragEvent): void => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !busy) void attachFile(file);
  };
  const errorText = (code: string): string =>
    copy.errors[code as keyof typeof copy.errors] ?? copy.errors.network;

  return (
    <section
      className={`sl-chat ${dragging ? "sl-chat--dragging" : ""}`}
      aria-label={copy.assistant}
      onDragOver={(event): void => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDragEnter={(event): void => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }
      }}
      onDragLeave={(): void => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={dropImage}
    >
      {dragging && (
        <div className="sl-chat__drop">
          <ImagePlus size={42} />
          <strong>{copy.drop}</strong>
          <span>{copy.files}</span>
        </div>
      )}
      <div className="sl-chat__scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="sl-chat__welcome">
            <img
              src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-icon.svg`}
              width={54}
              height={54}
              alt=""
            />
            <p className="sl-chat__eyebrow">SORTLEAF AI</p>
            <h1>{copy.greeting}</h1>
            <p>{copy.intro}</p>
            <div className="sl-chat__suggestions" aria-label={copy.sampleTitle}>
              {copy.suggestions.map(
                (suggestion, index: number): ReactElement => (
                  <button
                    key={suggestion}
                    onClick={(): void => {
                      setDraft(suggestion);
                      textRef.current?.focus();
                    }}
                  >
                    <span>
                      0{index + 1}
                      <ArrowUp size={17} />
                    </span>
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="sl-chat__conversation">
            <h1 className="sl-chat__title">{conversation?.title}</h1>
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={copy.recent}
            >
              {messages.map(
                (message): ReactElement => (
                  <article
                    className={`sl-message sl-message--${message.role}`}
                    key={message.id}
                    aria-label={
                      message.role === "user" ? copy.you : copy.assistantName
                    }
                  >
                    {message.role === "assistant" && (
                      <img
                        className="sl-message__avatar"
                        src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-icon.svg`}
                        width={27}
                        height={27}
                        alt=""
                      />
                    )}
                    <div className="sl-message__body">
                      {message.role === "assistant" && message.mode && message.mode !== "online" && VISION_MODELS[message.mode] &&
                        <small className="sl-message__source">{message.source === "online" ? "SortLeaf" : (language === "es" ? "Visión local" : "Local vision")}{message.source !== "online" && " · " + VISION_MODELS[message.mode].label}</small>}
                      {message.image && (
                        <img
                          className="sl-message__image"
                          src={message.image}
                          alt={message.imageName || copy.attach}
                          width={240}
                          height={200}
                        />
                      )}
                      {message.text &&
                        (message.role === "assistant" && (message.source === "online" || !message.mode || message.mode === "online") ? (
                          <div className="sl-message__markdown">
                            <ReactMarkdown
                              skipHtml
                              components={{
                                a: ({ children, href }): ReactElement => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="sl-message__text">{message.text}</p>
                        ))}
                      {message.error && (
                        <div className="sl-message__error" role="alert">
                          <p>{errorText(message.error)}</p>
                          {message.error === "expired" ? (
                            <button
                              onClick={(): void => {
                                void navigate("/assistant");
                              }}
                            >
                              <Plus size={15} />
                              {copy.newChat}
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={(): void => editFailed(message)}
                            >
                              {copy.retry}
                            </button>
                          )}
                        </div>
                      )}
                      {message.role === "assistant" && (
                        <button
                          className="sl-icon-button sl-message__copy"
                          aria-label={
                            copiedId === message.id ? copy.copied : copy.copy
                          }
                          onClick={(): void => {
                            void copyMessage(message);
                          }}
                        >
                          {copiedId === message.id ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
            {busy && (
              <div className="sl-chat__thinking" role="status">
                <LoaderCircle size={19} className="sl-spin" />
                {messages.at(-1)?.image && !messages.at(-1)?.scan ? copy.analyzing : copy.thinking}
              </div>
            )}
          </div>
        )}
        <div className="sl-chat__end-space" aria-hidden="true" />
        <div className="sl-chat__composer-area">
          <form className="sl-composer" onSubmit={submit}>
            {attachment && !canSend && session.model !== mode && !session.error && (
              <p className="sl-chat__notice" role="status">
                {language === "es" ? "Elige un modelo para analizar esta foto." : "Choose a model to analyze this photo."}
              </p>
            )}
            {(notice || storageUnavailable) && (
              <p className="sl-chat__notice" role="status">
                {notice || copy.storage}
              </p>
            )}
            {attachment && (
              <div className="sl-composer__attachment">
                <img src={attachment.preview} alt={attachment.file.name} />
                <span>
                  {attachment.file.name}
                  <small>{(attachment.file.size / 1024).toFixed(0)} KB</small>
                </span>
                <button
                  type="button"
                  className="sl-icon-button"
                  aria-label={copy.remove}
                  onClick={(): void => setAttachment(null)}
                >
                  <X size={17} />
                </button>
              </div>
            )}
            <textarea
              ref={textRef}
              rows={1}
              maxLength={1000}
              aria-label={copy.placeholder}
              placeholder={copy.placeholder}
              value={draft}
              onChange={(event): void => setDraft(event.target.value)}
              onPaste={pasteImage}
              onKeyDown={(event): void => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="sl-composer__toolbar">
              <div className="sl-composer__media">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={inputRef}
                  hidden
                  onChange={(event): void => {
                    const file = event.target.files?.[0];
                    if (file) void attachFile(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="sl-icon-button"
                  disabled={busy || attachmentLoading}
                  aria-label={copy.attach}
                  title={copy.attach + " · " + copy.files}
                  onClick={(): void => inputRef.current?.click()}
                >
                  {attachmentLoading ? (
                    <LoaderCircle className="sl-spin" size={19} />
                  ) : (
                    <Paperclip size={20} />
                  )}
                </button>
                <button
                  type="button"
                  className="sl-icon-button"
                  disabled={busy}
                  aria-label={copy.camera}
                  title={copy.camera}
                  onClick={(): void => setCameraOpen(true)}
                >
                  <Camera size={20} />
                </button>
              </div>
              <AssistantModePicker mode={mode} onChange={activateMode} language={language} busy={busy} session={session}
                progressOpen={progressOpen} onProgressChange={onProgressChange} />
              <div className="sl-composer__spacer" aria-hidden="true" />
              {draft.length > 850 && <small>{draft.length}/1000</small>}
              {busy ? (
                <button
                  type="button"
                  className="sl-composer__send"
                  aria-label={copy.stop}
                  onClick={(): void => {
                    if (id) stopConversation(id);
                  }}
                >
                  <Square size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="sl-composer__send"
                  aria-label={copy.send}
                  disabled={!canSend || attachmentLoading || (!draft.trim() && !attachment)}
                >
                  <ArrowUp size={21} />
                </button>
              )}
            </div>
          </form>
          <p className="sl-chat__disclaimer">{copy.hint}</p>
        </div>
      </div>
      {cameraOpen && (
        <CameraDialog
          language={language}
          onClose={(): void => setCameraOpen(false)}
          onCapture={(file): void => {
            void attachFile(file);
          }}
        />
      )}
    </section>
  );
}
