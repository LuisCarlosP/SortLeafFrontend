import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => { vi.resetModules(); localStorage.clear(); });

it("ignores shared transcripts left by a development build", async () => {
  localStorage.setItem("sortleaf_conversations_v1", JSON.stringify([{ id: "old", title: "Private", messages: [] }]));
  const { getConversationState } = await import("../src/services/conversations");
  expect(getConversationState().conversations).toEqual([]);
});

it("clears the prior owner's drafts and keeps transcripts out of browser storage", async () => {
  const { createConversation, resetConversationOwner, getConversationState } = await import("../src/services/conversations");
  resetConversationOwner("guest");
  createConversation("Privado");
  expect(localStorage.getItem("sortleaf_conversations_v1")).toBeNull();
  resetConversationOwner("member");
  expect(getConversationState().conversations).toHaveLength(0);
});
