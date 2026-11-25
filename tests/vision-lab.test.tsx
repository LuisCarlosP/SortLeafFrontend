import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import VisionLabPage from "../src/features/vision/VisionLabPage";
import { detectVisionCapability } from "../src/features/vision/capability-profile";

vi.mock("../src/features/vision/capability-profile", () => ({ detectVisionCapability: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("requires the user's download click and cancels it from the page", async () => {
  vi.mocked(detectVisionCapability).mockResolvedValue({ supported: true, reason: "ready" });
  const terminate = vi.fn(); const post = vi.fn();
  const factory = vi.fn(function () { return { terminate, postMessage: post, onmessage: null, onerror: null }; });
  vi.stubGlobal("Worker", factory);
  const user = userEvent.setup();
  render(<MemoryRouter><VisionLabPage language="es" /></MemoryRouter>);
  expect(screen.queryByRole("button", { name: "Cargar SmolVLM 256M" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Modelo", exact: true }));
  const load = await screen.findByRole("button", { name: "Cargar SmolVLM 256M" });
  await waitFor(() => expect((load as HTMLButtonElement).disabled).toBe(false));
  expect(factory).not.toHaveBeenCalled();
  await user.click(load);
  expect(post).toHaveBeenCalledWith({ type: "load", model: "smol-256m" });
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(terminate).toHaveBeenCalledOnce();
});
it("offers the existing scanner when WebGPU is unavailable", async () => {
  vi.mocked(detectVisionCapability).mockResolvedValue({ supported: false, reason: "missing" });
  render(<MemoryRouter><VisionLabPage language="es" /></MemoryRouter>);
  expect((await screen.findByRole("link", { name: "Abrir escáner" })).getAttribute("href")).toBe("/scanner");
  await userEvent.setup().click(screen.getByRole("button", { name: "Modelo", exact: true }));
  expect((screen.getByRole("button", { name: "Cargar SmolVLM 256M" }) as HTMLButtonElement).disabled).toBe(true);
});
it("deletes only the lab model cache", async () => {
  vi.mocked(detectVisionCapability).mockResolvedValue({ supported: true, reason: "ready" });
  const remove = vi.fn().mockResolvedValue(true);
  vi.stubGlobal("caches", { delete: remove });
  const user = userEvent.setup();
  render(<MemoryRouter><VisionLabPage language="es" /></MemoryRouter>);
  await user.click(screen.getByRole("button", { name: "Modelo", exact: true }));
  await user.click(screen.getByRole("button", { name: "Eliminar modelos guardados" }));
  expect(remove).toHaveBeenCalledExactlyOnceWith("sortleaf-vision-models-v1");
  expect(await screen.findByText("Caché de modelos eliminada.")).toBeTruthy();
});
