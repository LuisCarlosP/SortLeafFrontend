import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("opens the password form when Supabase returns a recovery session to the home page", async () => {
  window.history.replaceState(null, "", "/#type=recovery&access_token=test-access&refresh_token=test-refresh");
  render(<App />);
  await screen.findByRole("heading", { name: "Nueva Contraseña" });
  expect(window.location.pathname).toBe("/auth/reset-password");
});

it("opens local vision from its public URL with the default configuration", async () => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "/vision-lab");
  render(<App />);
  await screen.findByRole("heading", { name: "Visión local", level: 1 });
  expect(screen.getByRole("link", { name: "Visión local" }).getAttribute("href")).toBe("/vision-lab");
});
