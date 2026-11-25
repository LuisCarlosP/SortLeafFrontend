import { afterEach, expect, it, vi } from "vitest";
import { cachedVisionModels } from "../src/features/vision/model-cache";
import { VISION_MODELS } from "../src/features/vision/model-registry";
import { createConversation, deleteConversation, getConversationState, submitConversationTurn } from "../src/services/conversations";
import { sendConversationTurn } from "../src/services/conversation-api";
import { normalizeAnalysis } from "../src/features/vision/analysis-schema";
import { prepareVisionImage } from "../src/features/vision/prepare-image";
import { ConversationApiError } from "../src/services/conversation-api";
import { visionErrorText } from "../src/features/vision/vision-error";

vi.mock("../src/features/vision/prepare-image", () => ({ prepareVisionImage: vi.fn(async () => new Blob(["pixels"])) }));
vi.mock("../src/services/conversation-api", async original => ({
  ...(await original<typeof import("../src/services/conversation-api")>()),
  sendConversationTurn: vi.fn(),
}));

afterEach(() => {
  getConversationState().conversations.forEach(({ id }) => deleteConversation(id));
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const online = { response: "Respuesta en línea", session_id: "remote", prediction: null };
it("does not recreate a private chat that was deleted on another device", async () => {
  const id = createConversation("Saved scan");
  const scanPhoto = vi.fn().mockResolvedValue({ analysis: normalizeAnalysis("A glass bottle") });
  const options = { id, language: "es", mode: "smol-256m", scanPhoto } as const;
  vi.mocked(sendConversationTurn).mockResolvedValueOnce(online)
    .mockRejectedValueOnce(new ConversationApiError("expired"));
  await submitConversationTurn({ ...options, text: "", file: new File(["pixels"], "bottle.jpg") });
  await submitConversationTurn({ ...options, text: "¿Debo lavarla?" });
  expect(scanPhoto).toHaveBeenCalledOnce();
  expect(sendConversationTurn).toHaveBeenCalledTimes(2);
  expect(getConversationState().conversations[0].messages.at(-1)?.error).toBe("expired");
});
it("uses the online session for greetings and follow-ups, and sends only typed observations for a photo", async () => {
  vi.mocked(sendConversationTurn).mockResolvedValue(online);
  const id = createConversation("Hybrid");
  const scanPhoto = vi.fn().mockResolvedValue({ analysis: normalizeAnalysis("A glass bottle and a metal can"), raw: "private label" });
  const options = { id, language: "es", mode: "smol-500m", scanPhoto } as const;
  await submitConversationTurn({ ...options, text: "Hola" });
  await submitConversationTurn({ ...options, text: "", file: new File(["private image"], "private.jpg") });
  await submitConversationTurn({ ...options, text: "¿Las lavo?" });
  expect(scanPhoto).toHaveBeenCalledOnce();
  const requests = vi.mocked(sendConversationTurn).mock.calls.map(([request]) => request);
  expect(requests[1]).toMatchObject({ image: undefined, sessionId: "remote", visualContext: { outcome: "identified", items: [{ object: "bottle" }, { object: "can" }] } });
  expect(JSON.stringify(requests)).not.toContain("private");
  expect(requests[2]).toMatchObject({ sessionId: "remote", message: "¿Las lavo?", visualContext: undefined });
  expect(getConversationState().conversations[0].messages.at(-1)?.source).toBe("online");
});
it("declines an unrelated photo locally, then supplies that outcome for the next question", async () => {
  vi.mocked(sendConversationTurn).mockResolvedValueOnce({ ...online, response: "Intenta con un objeto reciclable." });
  const id = createConversation("Tree");
  const scanPhoto = vi.fn().mockResolvedValue({ analysis: normalizeAnalysis('{"product":"tree trunk" "components":[]}') });
  const options = { id, language: "es", mode: "smol-500m", scanPhoto } as const;
  await submitConversationTurn({ ...options, text: "", file: new File(["tree"], "tree.jpg") });
  expect(vi.mocked(sendConversationTurn).mock.calls[0][0]).toMatchObject({ observationOnly: true });
  expect(vi.mocked(sendConversationTurn).mock.calls[0][0].image).toBeUndefined();
  expect(getConversationState().conversations[0].messages.at(-1)?.text).toContain("objeto reciclable");
  vi.mocked(sendConversationTurn).mockResolvedValue(online);
  await submitConversationTurn({ ...options, text: "¿Por qué?" });
  expect(vi.mocked(sendConversationTurn).mock.calls[1][0].visualContext?.outcome).toBe("out_of_scope");
});
it("never uploads the photo after local failure; reuses a successful scan when retrying an online error", async () => {
  const id = createConversation("Retry");
  const scanPhoto = vi.fn().mockRejectedValueOnce(new Error("GPU")).mockResolvedValue({ analysis: normalizeAnalysis("A glass jar") });
  const options = { id, text: "", file: new File(["pixels"], "x.jpg"), language: "es", mode: "smol-256m", scanPhoto } as const;
  await submitConversationTurn(options);
  expect(sendConversationTurn).not.toHaveBeenCalled();
  expect(getConversationState().conversations[0].messages.at(-1)?.error).toBe("local");
  vi.mocked(sendConversationTurn).mockRejectedValueOnce(new ConversationApiError("rate")).mockResolvedValue(online);
  await submitConversationTurn(options);
  expect(getConversationState().conversations[0].messages.at(-1)?.error).toBe("rate");
  await submitConversationTurn(options);
  expect(scanPhoto).toHaveBeenCalledTimes(2);
  expect(prepareVisionImage).toHaveBeenCalledTimes(2);
});

it("recognizes only a complete cache for the pinned revision", async () => {
  const model = VISION_MODELS["smol-256m"];
  const files = ["config.json", "generation_config.json", "tokenizer.json", "tokenizer_config.json",
    "preprocessor_config.json", "processor_config.json", "onnx/vision_encoder_q4.onnx", "onnx/embed_tokens_q4.onnx"];
  let revision = model.revision;
  vi.stubGlobal("caches", { has: async () => true, open: async () => ({
    keys: async () => files.map(f => ({ url: `https://huggingface.co/${model.id}/resolve/${revision}/${f}` })),
  }) });
  expect(await cachedVisionModels()).toEqual([]);
  files.push("onnx/decoder_model_merged_q4.onnx");
  expect(await cachedVisionModels()).toEqual(["smol-256m"]);
  revision = "old";
  expect(await cachedVisionModels()).toEqual([]);
});

it("recognizes an HTML response in place of WASM even when the error mentions WebGPU", () => {
  const message = visionErrorText("load", "[webgpu] WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f", "es");
  expect(message).toContain("motor local");
});
