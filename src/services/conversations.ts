import type {
  Conversation,
  ConversationMessage,
  ConversationState,
  AssistantMode,
} from "../types/conversation";
import type { Language } from "../translations";
import { API_URL, chatHeaders, hasChatSession } from "./chat-access";
import { deleteChatSession, getChatHistory } from "./Classifier";
import { ConversationApiError, sendConversationTurn } from "./conversation-api";
import type { VisualContext } from "../features/vision/analysis-schema";
import type { VisionResult } from "../features/vision/protocol";
import { scanTitle } from "../features/vision/sorting-copy";
import { prepareVisionImage } from "../features/vision/prepare-image";

let owner: string | undefined;
let generation = 0;
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 60;
const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
const scannedFiles = new WeakMap<File, { mode: AssistantMode; context: VisualContext }>();
const retryFiles = new Map<string, File>();

let state: ConversationState = {
  conversations: [],
  pending: {},
  storageUnavailable: false,
};
export const getConversationState = (): ConversationState => state;
export function subscribeConversations(listener: () => void): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}

function publish(
  conversations: Conversation[] = state.conversations,
  pending = state.pending,
): void {
  state = { ...state, conversations, pending };
  listeners.forEach((listener): void => listener());
}

function storageFailure(): void {
  state = { ...state, storageUnavailable: true };
  listeners.forEach(listener => listener());
}

export function resetConversationOwner(nextOwner: string): void {
  if (owner === nextOwner) return;
  owner = nextOwner;
  const current = ++generation;
  controllers.forEach(controller => controller.abort());
  controllers.clear();
  retryFiles.clear();
  state = { conversations: [], pending: {}, storageUnavailable: false };
  publish();
  if (!hasChatSession()) return;
  void (async () => {
    const response = await fetch(API_URL + "/chat/conversations", { headers: await chatHeaders(), cache: "no-store" });
    if (!response.ok) throw new Error("history_unavailable");
    const rows: { id: string; title: string; updated_at: string }[] = await response.json();
    if (current !== generation) return;
    const seen = new Set(state.conversations.map(item => item.id));
    publish([...state.conversations, ...rows.filter(row => !seen.has(row.id)).map(row => ({
      id: row.id, sessionId: row.id, title: row.title, updatedAt: row.updated_at, messages: [],
    }))].slice(0, MAX_CONVERSATIONS));
  })().catch(() => { if (current === generation) storageFailure(); });
}

export async function loadConversationMessages(id: string): Promise<void> {
  const current = generation;
  const existing = state.conversations.find(item => item.id === id);
  if (existing && (existing.messages.length || !existing.sessionId)) return;
  if (!hasChatSession() || !/^[a-f0-9-]{36}$/i.test(id)) return;
  const result = await getChatHistory(id);
  if (current !== generation || state.pending[id] || !result.history.length) return;
  const messages = result.history.map((m, index) => ({ id: id + "-" + index, role: m.role, text: m.content }));
  const item = state.conversations.find(chat => chat.id === id);
  if (item?.messages.length) return;
  if (item) updateConversation(id, chat => ({ ...chat, messages }));
  else publish([{ id, sessionId: id, title: messages[0].text.slice(0, 65), updatedAt: new Date().toISOString(), messages }, ...state.conversations]);
}

export async function removePrivateConversation(id: string): Promise<void> {
  const conversation = state.conversations.find(item => item.id === id);
  if (conversation?.sessionId || state.pending[id] || (conversation?.messages.length && hasChatSession())) {
    controllers.get(id)?.abort();
    await deleteChatSession(conversation?.sessionId ?? id);
  }
  deleteConversation(id);
}

function updateConversation(
  id: string,
  update: (conversation: Conversation) => Conversation,
): void {
  publish(
    state.conversations.map(
      (conversation): Conversation =>
        conversation.id === id ? update(conversation) : conversation,
    ),
  );
}

export function createConversation(title: string): string {
  const id = crypto.randomUUID();
  publish(
    [
      {
        id,
        title: title.slice(0, 65),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
      ...state.conversations,
    ].slice(0, MAX_CONVERSATIONS),
  );
  return id;
}

export function deleteConversation(id: string): void {
  controllers.get(id)?.abort();
  const conversation = state.conversations.find(
    (item): boolean => item.id === id,
  );
  conversation?.messages.forEach((message): void => {
    retryFiles.delete(message.id);
  });
  const pending = { ...state.pending };
  delete pending[id];
  publish(
    state.conversations.filter((item): boolean => item.id !== id),
    pending,
  );
}

export function stopConversation(id: string): void {
  controllers.get(id)?.abort();
}

export function selectConversationMode(id: string, mode: AssistantMode): void {
  updateConversation(id, (conversation) => ({ ...conversation, mode }));
}

export function getRetryFile(messageId: string): File | undefined {
  return retryFiles.get(messageId);
}

export function removeFailedMessage(
  conversationId: string,
  messageId: string,
): void {
  updateConversation(
    conversationId,
    (conversation): Conversation => ({
      ...conversation,
      messages: conversation.messages.filter(
        (message): boolean => message.id !== messageId,
      ),
    }),
  );
  retryFiles.delete(messageId);
}

export async function createChatThumbnail(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Invalid image");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  } finally {
    bitmap.close();
  }
}

interface SubmitTurnOptions {
  id: string;
  text: string;
  file?: File;
  preview?: string;
  language: Language;
  mode?: AssistantMode;
  retryId?: string;
  scanPhoto?: (image: Blob, signal: AbortSignal) => Promise<VisionResult>;
}

export async function submitConversationTurn({
  id,
  text,
  file,
  preview,
  language,
  mode = "online",
  scanPhoto, retryId,
}: SubmitTurnOptions): Promise<void> {
  if (state.pending[id]) return;
  const scopeAtStart = generation;
  const conversation = state.conversations.find(
    (item): boolean => item.id === id,
  );
  if (!conversation) return;
  const messageId = retryId || crypto.randomUUID();
  const userMessage: ConversationMessage = {
    id: messageId,
    role: "user",
    text,
    image: preview,
    imageName: file?.name,
    mode,
  };
  if (file) retryFiles.set(messageId, file);
  const controller = new AbortController();
  controllers.set(id, controller);
  let timedOut = false;
  let phase: "scan" | "online" = file && mode !== "online" ? "scan" : "online";
  const expire = (): void => {
    timedOut = true;
    controller.abort();
  };
  let timeout = window.setTimeout(expire, phase === "scan" ? 120000 : 90000);
  publish(
    state.conversations.map(
      (item): Conversation =>
        item.id === id
          ? {
              ...item,
              updatedAt: new Date().toISOString(),
              mode,
              messages: [...item.messages, userMessage].slice(-MAX_MESSAGES),
            }
          : item,
    ),
    { ...state.pending, [id]: true },
  );
  try {
    let answer: string;
    let sessionId = conversation.sessionId;
    let prediction: ConversationMessage["prediction"];
    let context: VisualContext | undefined;
    if (file && mode !== "online") {
      const cached = scannedFiles.get(file);
      if (cached?.mode === mode) context = cached.context;
      else {
        if (!scanPhoto) throw new Error("Local scanner unavailable");
        const image = await prepareVisionImage(file);
        controller.signal.throwIfAborted();
        const { analysis } = await scanPhoto(image, controller.signal);
        controller.signal.throwIfAborted();
        context = { outcome: analysis.outcome, items: analysis.items };
        scannedFiles.set(file, { mode, context });
      }
      const scan = context;
      updateConversation(id, item => ({
        ...item, messages: item.messages.map(m => m.id === messageId ? { ...m, scan } : m),
      }));
    }
    let source: ConversationMessage["source"] = "online";
    if (context && context.outcome !== "identified") {
      answer = scanTitle(context.outcome, language);
      source = "scan";
      try {
        const saved = await sendConversationTurn({ message: text, requestId: messageId, newChatId: id,
          sessionId, language, visualContext: context, observationOnly: true, signal: controller.signal });
        sessionId = saved.session_id;
        answer = saved.response;
      } catch {
        if (!controller.signal.aborted) storageFailure();
      }
    } else {
      // A locally declined photo supersedes any previous photo held by the online session.
      const previousScan = conversation.messages.at(-1)?.source === "scan"
        ? conversation.messages.at(-2)?.scan : undefined;
      phase = "online";
      window.clearTimeout(timeout);
      timeout = window.setTimeout(expire, 90000);
      const request = {
        message: text, requestId: messageId, newChatId: id, scanFollowUp: !file && !!previousScan, image: mode === "online" ? file : undefined,
        visualContext: context ?? (file ? undefined : previousScan), sessionId, language, signal: controller.signal,
      };
      const result = await sendConversationTurn(request);
      answer = result.response;
      sessionId = result.session_id;
      prediction = result.prediction ?? undefined;
    }
    if (controller.signal.aborted)
      throw new DOMException("Request aborted", "AbortError");
    const assistantMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: answer,
      source,
      prediction,
      mode,
    };
    updateConversation(
      id,
      (item): Conversation => ({
        ...item,
        sessionId,
        messages: [...item.messages, assistantMessage].slice(-MAX_MESSAGES),
      }),
    );
    retryFiles.delete(messageId);
    if (file) window.dispatchEvent(new Event("sortleaf-history-updated"));
  } catch (error: unknown) {
    if (scopeAtStart !== generation) return;
    const code = controller.signal.aborted
      ? timedOut
        ? "timeout"
        : "stopped"
      : phase === "scan" ? "local"
      : error instanceof ConversationApiError
        ? error.code
        : "network";
    updateConversation(
      id,
      (item): Conversation => ({
        ...item,
        messages: item.messages.map(
          (message): ConversationMessage =>
            message.id === messageId ? { ...message, error: code } : message,
        ),
      }),
    );
  } finally {
    window.clearTimeout(timeout);
    if (scopeAtStart === generation) {
      controllers.delete(id);
      const pending = { ...state.pending };
      delete pending[id];
      publish(state.conversations, pending);
    }
  }
}
