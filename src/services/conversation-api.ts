import { chatHeaders } from "./chat-access";
import type { VisualContext } from "../features/vision/analysis-schema";
import type { Language } from "../translations";
import type { PredictionResponse } from "./Classifier";

export interface ConversationTurnResponse {
  session_id: string;
  response: string;
  prediction: PredictionResponse | null;
}

interface ConversationTurnRequest {
  message: string;
  image?: File;
  visualContext?: VisualContext;
  sessionId?: string;
  newChatId?: string;
  requestId?: string;
  observationOnly?: boolean;
  scanFollowUp?: boolean;
  language: Language;
  signal: AbortSignal;
}

export class ConversationApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export async function sendConversationTurn(
  request: ConversationTurnRequest,
): Promise<ConversationTurnResponse> {
  const body = new FormData();
  body.append("message", request.message);
  body.append("language", request.language);
  if (request.requestId) body.append("request_id", request.requestId);
  if (request.observationOnly) body.append("observation_only", "true");
  if (request.scanFollowUp) body.append("scan_follow_up", "true");
  if (request.sessionId) body.append("session_id", request.sessionId);
  if (!request.sessionId && request.newChatId) body.append("new_chat_id", request.newChatId);
  if (request.visualContext) body.append("visual_context", JSON.stringify(request.visualContext));
  if (request.image) body.append("file", request.image);
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/chat/turn`,
    {
      method: "POST",
      headers: await chatHeaders(),
      body,
      signal: request.signal,
    },
  );
  if (!response.ok) {
    const data: { detail?: unknown; message?: string } = await response.json().catch(() => ({}));
    const detail = data.detail ?? data.message;
    if (detail === "session_expired")
      throw new ConversationApiError("expired");
    if (response.status === 409) throw new ConversationApiError("conflict");
    if (response.status === 413) throw new ConversationApiError("size");
    if (response.status === 429) throw new ConversationApiError("rate");
    if (response.status === 401 || response.status === 403)
      throw new ConversationApiError("access");
    if (response.status === 404) throw new ConversationApiError("unavailable");
    if (detail === "image_analysis_unavailable")
      throw new ConversationApiError("image");
    throw new ConversationApiError("unavailable");
  }
  return response.json() as Promise<ConversationTurnResponse>;
}
