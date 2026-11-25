import type { VisualContext } from "../features/vision/analysis-schema";
import type { PredictionResponse } from "../services/Classifier";
import type { VisionModelKey } from "../features/vision/model-registry";
export type AssistantMode = "online" | VisionModelKey;

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  image?: string;
  imageName?: string;
  scan?: VisualContext;
  source?: "online" | "scan";
  prediction?: PredictionResponse;
  error?: string;
  mode?: AssistantMode;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  sessionId?: string;
  mode?: AssistantMode;
  messages: ConversationMessage[];
}

export interface ConversationState {
  conversations: Conversation[];
  pending: Record<string, boolean>;
  storageUnavailable: boolean;
}
