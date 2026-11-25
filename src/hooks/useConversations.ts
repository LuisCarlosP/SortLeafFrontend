import { useSyncExternalStore } from "react";
import {
  getConversationState,
  subscribeConversations,
} from "../services/conversations";
import type { ConversationState } from "../types/conversation";

export default function useConversations(): ConversationState {
  return useSyncExternalStore(subscribeConversations, getConversationState);
}
