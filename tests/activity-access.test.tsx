import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../src/App";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
beforeEach(() => { vi.stubGlobal("scrollTo", vi.fn()); });
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

it("takes a guest opening the activity URL to login without requesting private data", async () => {
  window.history.replaceState({}, "", base + "/stats");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<App />);
  await waitFor(() => expect(window.location.pathname).toBe(base + "/auth/login"));
  expect(fetcher).not.toHaveBeenCalled();
});

it("loads account activity from the authenticated API", async () => {
  window.history.replaceState({}, "", base + "/stats");
  const user = { id: "member", email: "a@example.test", email_verified: true, profile: { name: "Ana" } };
  localStorage.setItem("auth_tokens", JSON.stringify({ access_token:"member-token", refresh_token:"r" }));
  localStorage.setItem("auth_user", JSON.stringify(user));
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith("/auth/me")) return Response.json(user);
    if (url.includes("/activity?")) {
      expect(new Headers(init.headers).get("Authorization")).toBe("Bearer member-token");
      return Response.json([{ id:"activity-event-only", materials:["glass","metal"], confidence:null, recyclable:null,
        created_at:"2026-01-01T00:00:00Z" }]);
    }
    return Response.json([]);
  });
  vi.stubGlobal("fetch", fetcher);
  render(<App />);
  expect(await screen.findByText("Vidrio, Metal")).toBeTruthy();
  expect(Object.values(localStorage).join(" ")).not.toContain("activity-event-only");
});
