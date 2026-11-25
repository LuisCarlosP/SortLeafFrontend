import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ClassifierPage from "../src/pages/Classifier/ClassifierPage";
import { detectVisionCapability, type VisionCapability } from "../src/features/vision/capability-profile";
import { cachedVisionModels } from "../src/features/vision/model-cache";
import type { VisionEvent } from "../src/features/vision/protocol";
import type { VisionWorker } from "../src/features/vision/vision-session";
import {
  sendConversationTurn,
  type ConversationTurnResponse,
} from "../src/services/conversation-api";
import {
  deleteConversation,
  getConversationState,
} from "../src/services/conversations";

vi.mock("../src/features/vision/capability-profile", () => ({ detectVisionCapability: vi.fn() }));
vi.mock("../src/features/vision/model-cache", () => ({ cachedVisionModels: vi.fn() }));
vi.mock("../src/services/conversation-api", async (original) => ({
  ...(await original<typeof import("../src/services/conversation-api")>()),
  sendConversationTurn: vi.fn(),
}));
vi.mock("../src/services/history", () => ({
  saveClassification: vi.fn().mockResolvedValue({}),
}));
vi.mock("../src/services/conversations", async (original) => ({
  ...(await original<typeof import("../src/services/conversations")>()),
  createChatThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,AAAA"),
}));
const reply: ConversationTurnResponse = {
  session_id: "session-test",
  response: "Separa el cartón limpio y seco.",
  prediction: null,
};
const api = vi.mocked(sendConversationTurn);
const composer = (): HTMLTextAreaElement =>
  screen.getByRole("textbox", {
    name: "Escribe tu pregunta o añade una imagen…",
  });

beforeEach(() => {
  getConversationState().conversations.forEach((conversation) =>
    deleteConversation(conversation.id),
  );
  localStorage.clear();
  api.mockReset();
  api.mockResolvedValue(reply);
  Element.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function (): void { this.open = true; };
  HTMLDialogElement.prototype.close = function (): void { this.open = false; };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function openChat(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={["/assistant"]}>
      <ClassifierPage language="es" />
    </MemoryRouter>,
  );
}

describe("A single conversation for text and photos", () => {
  it("prepares only the selected model and reuses cached files when switching", async () => {
    vi.mocked(detectVisionCapability).mockResolvedValue({ supported: true, reason: "ready" });
    vi.mocked(cachedVisionModels).mockResolvedValue(["smol-500m"]);
    const post = vi.fn();
    const terminate = vi.fn();
    const factory = vi.fn(function () { return { postMessage: post, terminate }; });
    vi.stubGlobal("Worker", factory);
    const user = userEvent.setup();
    openChat();
    const selector = screen.getByRole("combobox", { name: "Modo del asistente" });
    expect(factory).not.toHaveBeenCalled();
    await user.selectOptions(selector, "smol-256m");
    await waitFor(() => expect(post).toHaveBeenCalledWith({ type: "load", model: "smol-256m" }));
    expect(screen.queryByRole("button", { name: /Descargar|Activar/ })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Descargando modelo" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Volver al chat" }));
    await user.selectOptions(selector, "smol-500m");
    await waitFor(() => expect(post).toHaveBeenCalledWith({ type: "load", model: "smol-500m", cachedOnly: true }));
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { name: "Activando modelo" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Volver al chat" }));
    await user.selectOptions(selector, "online");
    expect(terminate).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });
  it("ignores an unfinished device check after switching back to SortLeaf", async () => {
    let finish!: (value: VisionCapability) => void;
    vi.mocked(detectVisionCapability).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const factory = vi.fn();
    vi.stubGlobal("Worker", factory);
    const user = userEvent.setup();
    openChat();
    const selector = screen.getByRole("combobox", { name: "Modo del asistente" });
    await user.selectOptions(selector, "smol-500m");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    await user.selectOptions(selector, "online");
    await act(async () => finish({ supported: true, reason: "ready" }));
    expect(factory).not.toHaveBeenCalled();
    expect(screen.queryByText(/Preparando/)).toBeNull();
  });
  it("keeps loading while the dialog is closed, reports measured progress and closes when ready", async () => {
    vi.mocked(detectVisionCapability).mockResolvedValue({ supported: true, reason: "ready" });
    vi.mocked(cachedVisionModels).mockResolvedValue([]);
    const worker: VisionWorker = { onmessage: null, onerror: null, postMessage: vi.fn(), terminate: vi.fn() };
    vi.stubGlobal("Worker", vi.fn(function () { return worker; }));
    const dispatch = (data: VisionEvent): void => { act(() => worker.onmessage?.({ data } as MessageEvent<VisionEvent>)); };
    const user = userEvent.setup();
    openChat();
    const selector = screen.getByRole("combobox", { name: "Modo del asistente" });
    await user.selectOptions(selector, "smol-256m");
    await screen.findByRole("dialog", { name: "Descargando modelo" });
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Volver al chat" }));
    expect(document.activeElement).toBe(selector);
    await user.type(composer(), "Mi pregunta");
    dispatch({ type: "progress", file: "weights", loaded: 6e6, total: 24e6 });
    await user.click(screen.getByRole("button", { name: "Ver progreso del modelo" }));
    expect(screen.getByRole("progressbar", { name: "Archivo en curso" }).getAttribute("aria-valuenow")).toBe("25");
    expect(screen.getByText("6 MB leídos")).toBeTruthy();
    dispatch({ type: "ready", model: "smol-256m", loadMs: 50 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(composer().value).toBe("Mi pregunta");
    expect(worker.terminate).not.toHaveBeenCalled();
  });
  it("can retry a failed download and cancel the new attempt from the dialog", async () => {
    vi.mocked(detectVisionCapability).mockResolvedValue({ supported: true, reason: "ready" });
    vi.mocked(cachedVisionModels).mockResolvedValue([]);
    const worker: VisionWorker = { onmessage: null, onerror: null, postMessage: vi.fn(), terminate: vi.fn() };
    vi.stubGlobal("Worker", vi.fn(function () { return worker; }));
    const user = userEvent.setup();
    openChat();
    await user.selectOptions(screen.getByRole("combobox", { name: "Modo del asistente" }), "smol-256m");
    await screen.findByRole("dialog", { name: "Descargando modelo" });
    act(() => worker.onmessage?.({ data: { type: "error", code: "load", message: "offline" } } as MessageEvent<VisionEvent>));
    expect(screen.getByRole("alert").textContent).toContain("Comprueba la conexión");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("dialog", { name: "Descargando modelo" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(worker.terminate).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ver progreso del modelo" })).toBeNull();
  });
  it("sends a suggestion and reuses the session for a follow-up", async () => {
    const user = userEvent.setup();
    openChat();
    await user.click(
      screen.getByRole("button", { name: /¿Cómo separo mis residuos/ }),
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await screen.findByText(reply.response);
    await user.type(composer(), "¿Y si está mojado?{Enter}");
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(api.mock.calls[1][0]).toMatchObject({
      sessionId: "session-test",
      message: "¿Y si está mojado?",
    });
  });
  it("keeps Shift+Enter as a new line without submitting", async () => {
    const user = userEvent.setup();
    openChat();
    await user.type(
      composer(),
      "Una pregunta{Shift>}{Enter}{/Shift}Otra línea",
    );
    expect(composer().value).toBe("Una pregunta\nOtra línea");
    expect(api).not.toHaveBeenCalled();
  });
  it("uploads the photo when online photo analysis is explicitly selected", async () => {
    const user = userEvent.setup();
    const view = openChat();
    await user.selectOptions(screen.getByRole("combobox", { name: "Modo del asistente" }), "online");
    const file = new File(["image"], "envase.png", { type: "image/png" });
    const input =
      view.container.querySelector<HTMLInputElement>("input[type=file]")!;
    await user.upload(input, file);
    await screen.findByText("envase.png");
    await user.type(composer(), "¿Qué hago con este envase?");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await screen.findByText(reply.response);
    expect(api.mock.calls[0][0]).toMatchObject({
      image: file,
      message: "¿Qué hago con este envase?",
    });
  });
  it("rejects oversized images before contacting the server", async () => {
    const user = userEvent.setup();
    const view = openChat();
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });
    await user.upload(
      view.container.querySelector<HTMLInputElement>("input[type=file]")!,
      file,
    );
    await screen.findByText(
      "La imagen supera los 5 MB. Elige una más pequeña.",
    );
    expect(api).not.toHaveBeenCalled();
  });
  it("lets a failed turn be edited and retried without duplicate bubbles", async () => {
    api.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    openChat();
    await user.type(composer(), "¿Cómo separo vidrio?{Enter}");
    await user.click(
      await screen.findByRole("button", { name: "Editar y volver a intentar" }),
    );
    expect(composer().value).toBe("¿Cómo separo vidrio?");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await screen.findByText(reply.response);
    expect(getConversationState().conversations[0].messages).toHaveLength(2);
  });
  it("continues the request when leaving the page, preserving the reply", async () => {
    let resolve!: (value: ConversationTurnResponse) => void;
    api.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const view = openChat();
    fireEvent.change(composer(), { target: { value: "¿Cómo reciclo papel?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    view.unmount();
    resolve(reply);
    await waitFor(() =>
      expect(
        getConversationState().conversations[0].messages.at(-1)?.text,
      ).toBe(reply.response),
    );
  });
});
